'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  normalizePublicDomain,
  type BillingCycle,
  type PlanTier,
  type ProfileRow,
  type RecommendedRemediationEnv,
} from '@verisource/core-geo';
import { StatusBadge } from '@verisource/ui';
import { PricingRoiCalculatorClient } from './PricingRoiCalculatorClient';

const VALID_PROMPT_ENV_LABELS: Record<RecommendedRemediationEnv, string> = {
  coding_agent: 'CODING AGENT',
  wordpress_cms: 'WORDPRESS',
  webflow_cms: 'WEBFLOW',
  wix_squarespace_framer: 'WIX · SQUARESPACE · FRAMER',
  shopify_liquid: 'SHOPIFY',
  chat_assistant: 'CHATGPT / CLAUDE WEB',
};

const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  tripwire_19: 0,
  starter_49: 1,
  pro_99: 2,
  agency_249: 3,
};

const PLAN_DISPLAY_NAME: Record<PlanTier, string> = {
  free: 'Free Plan',
  tripwire_19: '$19 One-Time Audit Pass',
  starter_49: 'Starter Brand ($49/mo)',
  pro_99: 'Pro + MCP Engine ($99/mo)',
  agency_249: 'Agency White-Label ($249/mo)',
};

export interface PricingSubscriberContext {
  email: string;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  hasStripeCustomer: boolean;
}

export function PricingLadderSection(props: {
  preselectedDomain?: string;
  preselectedPlan?: string;
  preselectedEnv?: string;
  initialSubscriber?: PricingSubscriberContext | null;
}): React.ReactElement {
  const [subscriber, setSubscriber] = useState<PricingSubscriberContext | null>(
    props.initialSubscriber ?? null
  );
  const [annual, setAnnual] = useState<boolean>(
    props.initialSubscriber?.billingCycle === 'annual'
  );
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    let cancelled = false;

    void supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token || cancelled) return;
      setAccessToken(token);
      try {
        document.cookie = `vs_access_token=${encodeURIComponent(
          token
        )}; Path=/; Max-Age=604800; SameSite=Lax`;
      } catch {
        // Ignore cookie write restrictions
      }
      try {
        const res = await fetch('/api/dashboard/state', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { profile?: ProfileRow };
        if (!cancelled && json.profile && json.profile.plan_tier !== 'free') {
          const nextSub: PricingSubscriberContext = {
            email: json.profile.email,
            planTier: json.profile.plan_tier,
            billingCycle: json.profile.billing_cycle ?? 'monthly',
            hasStripeCustomer: Boolean(
              json.profile.stripe_customer_id &&
                !json.profile.stripe_customer_id.startsWith('cus_demo_')
            ),
          };
          setSubscriber(nextSub);
          if (json.profile.billing_cycle === 'annual') {
            setAnnual(true);
          }
        }
      } catch {
        // Keep initial SSR subscriber state on transient network failure
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  let safeHostname: string | null = null;
  if (props.preselectedDomain) {
    try {
      safeHostname = normalizePublicDomain(props.preselectedDomain).hostname;
    } catch {
      safeHostname = null;
    }
  }

  const activePlan: PlanTier = subscriber?.planTier ?? 'free';
  const activeBillingCycle: BillingCycle =
    subscriber?.billingCycle ?? 'monthly';
  const isPaidAccount = activePlan !== 'free';
  const isRecurringSubscriber =
    activePlan === 'starter_49' ||
    activePlan === 'pro_99' ||
    activePlan === 'agency_249';
  const selectedCycle: BillingCycle = annual ? 'annual' : 'monthly';

  const activeHighlightPlan: PlanTier = isRecurringSubscriber
    ? activePlan
    : props.preselectedPlan === 'tripwire_19' ||
        props.preselectedPlan === 'starter_49' ||
        props.preselectedPlan === 'pro_99' ||
        props.preselectedPlan === 'agency_249'
      ? props.preselectedPlan
      : 'pro_99';

  const safeEnv: RecommendedRemediationEnv | null =
    props.preselectedEnv &&
    Object.prototype.hasOwnProperty.call(
      VALID_PROMPT_ENV_LABELS,
      props.preselectedEnv
    )
      ? (props.preselectedEnv as RecommendedRemediationEnv)
      : null;

  const domainParam = safeHostname
    ? `&domain=${encodeURIComponent(safeHostname)}`
    : '';
  const envParam = safeEnv ? `&env=${encodeURIComponent(safeEnv)}` : '';
  const tokenParam = accessToken
    ? `&access_token=${encodeURIComponent(accessToken)}`
    : '';
  const noTrialParam = isPaidAccount ? '&trial=0' : '';

  interface TierCardModel {
    id: PlanTier;
    name: string;
    price: string;
    cadence: string;
    badge: string;
    badgeTone: 'pass' | 'neutral' | 'warn';
    billingNote: string;
    highlight: boolean;
    isCurrentExactPlan: boolean;
    summary: string;
    specs: string[];
    cta: string;
    href: string;
  }

  function resolveSubscriberCardMeta(
    tierId: 'starter_49' | 'pro_99' | 'agency_249'
  ): {
    cadence: string;
    badge: string;
    badgeTone: 'pass' | 'neutral' | 'warn';
    billingNote: string;
    cta: string;
    href: string;
    isCurrentExactPlan: boolean;
  } {
    const checkoutHref = `/api/checkout?plan=${tierId}&cycle=${selectedCycle}${noTrialParam}${domainParam}${envParam}${tokenParam}`;

    if (activePlan === 'tripwire_19') {
      return {
        cadence: annual ? '/mo billed annually' : '/mo billed monthly',
        badge: annual ? 'UPGRADE · SAVE 20%' : 'UPGRADE · -$19 CREDIT',
        badgeTone: tierId === 'pro_99' ? 'pass' : 'neutral',
        billingNote: annual
          ? 'Annual subscription · Instant workspace step-up'
          : 'Your $19 Audit Pass credits toward Month 1 within 7 days',
        cta:
          tierId === 'starter_49'
            ? 'Upgrade to Starter →'
            : tierId === 'pro_99'
              ? 'Upgrade to Pro + MCP →'
              : 'Upgrade to Agency Plan →',
        href: checkoutHref,
        isCurrentExactPlan: false,
      };
    }

    const currentRank = PLAN_RANK[activePlan];
    const targetRank = PLAN_RANK[tierId];

    if (tierId === activePlan && selectedCycle === activeBillingCycle) {
      return {
        cadence:
          activeBillingCycle === 'annual'
            ? '/mo billed annually · active'
            : '/mo active plan',
        badge: 'CURRENT PLAN',
        badgeTone: 'pass',
        billingNote:
          tierId === 'starter_49'
            ? 'Active on your workspace · 1 website & 35 weekly questions'
            : tierId === 'pro_99'
              ? 'Active on your workspace · 3 websites & 1,000 /mcp credits/mo'
              : 'Active on your workspace · 15 client sites & 5,000 /mcp credits/mo',
        cta: 'Current Plan — Back to Console →',
        href: '/dashboard',
        isCurrentExactPlan: true,
      };
    }

    if (tierId === activePlan && selectedCycle !== activeBillingCycle) {
      return {
        cadence: annual ? '/mo billed annually' : '/mo billed monthly',
        badge: annual ? 'SWITCH & SAVE 20%' : 'SWITCH TO MONTHLY',
        badgeTone: 'pass',
        billingNote: annual
          ? 'Save 20% annually on your current plan tier'
          : 'Switch your current plan tier to monthly billing',
        cta: annual
          ? 'Switch to Annual (Save 20%) →'
          : 'Switch to Monthly Billing',
        href: checkoutHref,
        isCurrentExactPlan: false,
      };
    }

    if (targetRank > currentRank) {
      return {
        cadence: annual ? '/mo billed annually' : '/mo billed monthly',
        badge:
          tierId === 'agency_249'
            ? 'UPGRADE · 15 CLIENT SITES'
            : 'UPGRADE · +MCP ENGINE',
        badgeTone: 'pass',
        billingNote:
          tierId === 'agency_249'
            ? annual
              ? '$2,388 billed annually · 5,000 /mcp credits/mo'
              : 'Up to 15 client sites, branded /audit/[slug] links & 5,000 /mcp credits/mo'
            : annual
              ? '$948 billed annually · 1,000 /mcp credits/mo'
              : 'Up to 3 websites, 100 weekly questions & 1,000 /mcp credits/mo',
        cta:
          tierId === 'agency_249'
            ? 'Upgrade to Agency Plan →'
            : 'Upgrade to Pro + MCP →',
        href: checkoutHref,
        isCurrentExactPlan: false,
      };
    }

    // Downgrade path (targetRank < currentRank)
    return {
      cadence: annual ? '/mo billed annually' : '/mo billed monthly',
      badge: 'DOWNGRADE',
      badgeTone: 'neutral',
      billingNote:
        tierId === 'starter_49'
          ? '1 website & 35 weekly questions · Paid /mcp credits removed'
          : 'Up to 3 websites & 1,000 /mcp credits · White-label pitch links removed',
      cta:
        tierId === 'starter_49'
          ? 'Downgrade to Starter'
          : 'Downgrade to Pro + MCP',
      href: checkoutHref,
      isCurrentExactPlan: false,
    };
  }

  const starterSubMeta = isPaidAccount
    ? resolveSubscriberCardMeta('starter_49')
    : null;
  const proSubMeta = isPaidAccount ? resolveSubscriberCardMeta('pro_99') : null;
  const agencySubMeta = isPaidAccount
    ? resolveSubscriberCardMeta('agency_249')
    : null;

  const allTiers: TierCardModel[] = [
    ...(!isPaidAccount
      ? [
          {
            id: 'tripwire_19' as const,
            name: 'Audit Pass',
            price: '$19',
            cadence: 'one-time pass',
            badge: 'NO SUBSCRIPTION',
            badgeTone: (activeHighlightPlan === 'tripwire_19'
              ? 'pass'
              : 'neutral') as 'pass' | 'neutral',
            billingNote:
              'Single payment · $19 credits toward Month 1 within 7 days',
            highlight: activeHighlightPlan === 'tripwire_19',
            isCurrentExactPlan: false,
            summary:
              'Test Verisource on 1 website with zero recurring billing. Credited 100% toward Month 1 if you subscribe within 7 days.',
            specs: [
              '1 Complete Website Audit (ChatGPT, Gemini, Perplexity)',
              'Unblurred Competitor Source Links',
              'Copy-Paste JSON-LD, /llms.txt & /agents.md Fixes',
              '$19 credited toward any monthly plan within 7 days',
            ],
            cta: 'Buy $19 Audit Pass',
            href: `/api/checkout?plan=tripwire_19&cycle=one_time${domainParam}${envParam}${tokenParam}`,
          },
        ]
      : []),
    {
      id: 'starter_49',
      name: 'Starter Brand',
      price: annual ? '$39' : '$49',
      cadence: starterSubMeta
        ? starterSubMeta.cadence
        : annual
          ? '/mo billed annually'
          : '/mo after 7-day trial',
      badge: starterSubMeta
        ? starterSubMeta.badge
        : annual
          ? 'SAVE 20%'
          : '7-DAY FREE TRIAL',
      badgeTone: starterSubMeta
        ? starterSubMeta.badgeTone
        : activeHighlightPlan === 'starter_49'
          ? 'pass'
          : 'neutral',
      billingNote: starterSubMeta
        ? starterSubMeta.billingNote
        : annual
          ? '$468 billed annually · Cancel renewal anytime'
          : '$0.00 due today · 1-click cancel before Day 7',
      highlight: activeHighlightPlan === 'starter_49',
      isCurrentExactPlan: starterSubMeta?.isCurrentExactPlan ?? false,
      summary:
        'Automated weekly AI checks and wrong-price alerts for a single local business, SaaS company, or Shopify store.',
      specs: [
        '1 Website + Weekly Automated Scans',
        '35 Weekly Buyer Questions (3 AI Engines)',
        'Wrong-Price & Policy Alert Watchdog',
        'Validated JSON-LD, /llms.txt & /agents.md Fixes',
      ],
      cta: starterSubMeta
        ? starterSubMeta.cta
        : annual
          ? 'Start Annual Starter'
          : 'Start 7-Day Free Trial →',
      href: starterSubMeta
        ? starterSubMeta.href
        : `/api/checkout?plan=starter_49&cycle=${
            annual ? 'annual' : 'monthly'
          }${domainParam}${envParam}${tokenParam}`,
    },
    {
      id: 'pro_99',
      name: 'Pro + MCP Engine',
      price: annual ? '$79' : '$99',
      cadence: proSubMeta
        ? proSubMeta.cadence
        : annual
          ? '/mo billed annually'
          : '/mo after 7-day trial',
      badge: proSubMeta
        ? proSubMeta.badge
        : annual
          ? 'MOST POPULAR'
          : 'MOST POPULAR · 7D TRIAL',
      badgeTone: proSubMeta
        ? proSubMeta.badgeTone
        : activeHighlightPlan === 'pro_99'
          ? 'pass'
          : 'neutral',
      billingNote: proSubMeta
        ? proSubMeta.billingNote
        : annual
          ? '$948 billed annually · 1,000 /mcp credits/mo'
          : '$0.00 due today · 1-click cancel before Day 7',
      highlight: activeHighlightPlan === 'pro_99',
      isCurrentExactPlan: proSubMeta?.isCurrentExactPlan ?? false,
      summary:
        'Competitor source map, Shopify catalog adapter, 10-line AI revenue tracker, and direct MCP sync for AI tools.',
      specs: [
        'Up to 3 Websites & 100 Weekly Questions',
        'Competitor Source Map + Outreach Drafts',
        '10-Line AI Visit & Checkout Revenue Pixel',
        'Shopify /api/ucp/mcp + agents.md.liquid Adapter',
        isPaidAccount || annual
          ? 'Paid /mcp Server (1,000 credits/mo: 1 cached / 10 live)'
          : 'Paid /mcp Server (150 trial credits → 1,000/mo)',
      ],
      cta: proSubMeta
        ? proSubMeta.cta
        : annual
          ? 'Start Annual Pro + MCP'
          : 'Start 7-Day Free Trial →',
      href: proSubMeta
        ? proSubMeta.href
        : `/api/checkout?plan=pro_99&cycle=${
            annual ? 'annual' : 'monthly'
          }${domainParam}${envParam}${tokenParam}`,
    },
    {
      id: 'agency_249',
      name: 'Agency White-Label',
      price: annual ? '$199' : '$249',
      cadence: agencySubMeta
        ? agencySubMeta.cadence
        : annual
          ? '/mo billed annually'
          : '/mo billed monthly',
      badge: agencySubMeta ? agencySubMeta.badge : '15 CLIENT SITES',
      badgeTone: agencySubMeta
        ? agencySubMeta.badgeTone
        : activeHighlightPlan === 'agency_249'
          ? 'pass'
          : 'neutral',
      billingNote: agencySubMeta
        ? agencySubMeta.billingNote
        : annual
          ? '$2,388 billed annually · 5,000 /mcp credits/mo'
          : 'Instant 15-site batch pipeline & 5,000 /mcp credits',
      highlight: activeHighlightPlan === 'agency_249',
      isCurrentExactPlan: agencySubMeta?.isCurrentExactPlan ?? false,
      summary:
        'Close $1,500–$3,000/mo client retainers using 60-second branded audit links with your agency logo and booking button.',
      specs: [
        'Up to 15 Client Websites & 400 Weekly Questions',
        '60-Second Branded Client Link (/audit/[slug])',
        'Custom Agency Logo, Brand Color & Calendar CTA',
        '5,000 Paid /mcp Server Credits / Month',
      ],
      cta: agencySubMeta
        ? agencySubMeta.cta
        : annual
          ? 'Start Annual Agency'
          : 'Start Agency Plan',
      href: agencySubMeta
        ? agencySubMeta.href
        : `/api/checkout?plan=agency_249&cycle=${
            annual ? 'annual' : 'monthly'
          }${domainParam}${envParam}${tokenParam}`,
    },
  ];

  return (
    <section id="pricing" style={{ marginTop: isPaidAccount ? '32px' : '68px' }}>
      {subscriber && isPaidAccount ? (
        <div
          className="vs-guided-banner"
          style={{
            marginBottom: '22px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div className="vs-eyebrow" style={{ marginBottom: '3px' }}>
              ACTIVE WORKSPACE SUBSCRIPTION · {subscriber.email.toUpperCase()}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--vs-ink)' }}>
              Current plan:{' '}
              <strong>
                {PLAN_DISPLAY_NAME[activePlan]}
                {isRecurringSubscriber
                  ? ` (${activeBillingCycle === 'annual' ? 'Annual' : 'Monthly'})`
                  : ''}
              </strong>{' '}
              — upgrade, downgrade, or switch between monthly and annual billing
              below.
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {subscriber.hasStripeCustomer ? (
              <form action="/api/billing/portal" method="POST">
                {accessToken ? (
                  <input
                    type="hidden"
                    name="access_token"
                    value={accessToken}
                  />
                ) : null}
                <button
                  type="submit"
                  className="vs-btn vs-btn-secondary"
                  style={{ padding: '7px 12px', fontSize: '12px' }}
                >
                  Invoices &amp; Payment Method →
                </button>
              </form>
            ) : null}
            <Link
              href="/dashboard"
              className="vs-btn"
              style={{ padding: '7px 13px', fontSize: '12px' }}
            >
              ← Back to Console
            </Link>
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            {isPaidAccount
              ? 'SUBSCRIPTION & PLAN MANAGEMENT'
              : 'STRAIGHTFORWARD PRICING'}
          </div>
          <h2
            style={{
              fontSize: '27px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: 0,
            }}
          >
            {isPaidAccount
              ? 'Upgrade, downgrade, or switch your billing cycle.'
              : 'Skip $245–$579/mo passive charts. Pay only for verified fixes.'}
          </h2>
        </div>

        <div className="vs-mode-switch" role="group" aria-label="Billing cycle">
          <button
            type="button"
            className="vs-mode-btn"
            data-active={!annual ? 'true' : 'false'}
            onClick={() => setAnnual(false)}
          >
            Monthly
          </button>
          <button
            type="button"
            className="vs-mode-btn"
            data-active={annual ? 'true' : 'false'}
            onClick={() => setAnnual(true)}
          >
            Annual (Save 20%)
          </button>
        </div>
      </div>

      {!isPaidAccount ? (
        <div
          className="vs-guided-banner"
          style={{
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ maxWidth: '820px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '3px' }}>
              PRODUCTION V1.0 · FOUNDING PARTNER RATE LOCK (FIRST 30 WORKSPACES)
            </div>
            <div
              style={{
                fontSize: '13.5px',
                lineHeight: 1.55,
                color: 'var(--vs-ink-secondary)',
              }}
            >
              Lock permanent Founding Partner pricing on{' '}
              <strong style={{ color: 'var(--vs-ink)' }}>
                Starter ($49/mo)
              </strong>
              ,{' '}
              <strong style={{ color: 'var(--vs-ink)' }}>
                Pro + MCP ($99/mo, standard $149/mo)
              </strong>
              , or{' '}
              <strong style={{ color: 'var(--vs-ink)' }}>
                Agency White-Label ($249/mo, standard $349/mo)
              </strong>{' '}
              for as long as your workspace stays active—including a{' '}
              <strong style={{ color: 'var(--vs-ink)' }}>
                $0.00 due today 7-day trial
              </strong>{' '}
              on monthly Starter &amp; Pro and founder-reviewed onboarding on
              your first 3 Agency client sites.
            </div>
          </div>
          <Link
            href="/tutorial"
            className="vs-btn vs-btn-secondary"
            style={{ padding: '7px 12px', fontSize: '12px' }}
          >
            Test 90s Interactive Tour →
          </Link>
        </div>
      ) : null}

      {safeHostname ? (
        <div
          className="vs-guided-banner"
          style={{
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div>
            <div className="vs-eyebrow" style={{ marginBottom: '2px' }}>
              TARGET WEBSITE LOCKED FOR CHECKOUT
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--vs-ink)' }}>
              Selected domain:{' '}
              <strong className="vs-mono">{safeHostname}</strong> — checkout
              automatically audits this site and pre-loads its{' '}
              <strong>1-Click AI Fix Prompt</strong> plus{' '}
              <code className="vs-mono">JSON-LD</code>,{' '}
              <code className="vs-mono">/llms.txt</code>, and{' '}
              <code className="vs-mono">/agents.md</code> Fix Bundle inside
              Console Step 02.
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {safeEnv ? (
              <StatusBadge>
                {`PROMPT MODE: ${VALID_PROMPT_ENV_LABELS[safeEnv]}`}
              </StatusBadge>
            ) : null}
            <StatusBadge tone="pass">AUTO-PROVISIONED</StatusBadge>
          </div>
        </div>
      ) : null}

      <div className={isPaidAccount ? 'vs-grid-3' : 'vs-grid-4'}>
        {allTiers.map((tier) => {
          const cardInner = (
            <div
              className={`vs-card${tier.highlight ? '' : ' vs-card-interactive'}`}
              style={{
                padding: '22px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: tier.highlight
                  ? 'var(--vs-ink)'
                  : undefined,
                borderWidth: tier.highlight ? '1.5px' : '1px',
                background: tier.isCurrentExactPlan
                  ? 'var(--vs-surface-warm)'
                  : '#FFFFFF',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '15.5px' }}>
                    {tier.name}
                  </span>
                  <StatusBadge tone={tier.badgeTone}>{tier.badge}</StatusBadge>
                </div>

                <div style={{ marginBottom: '6px' }}>
                  <span
                    className="vs-mono"
                    style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {tier.price}
                  </span>
                  <span
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--vs-ink-muted)',
                      marginLeft: '6px',
                    }}
                  >
                    {tier.cadence}
                  </span>
                </div>

                <div
                  className="vs-mono"
                  style={{
                    fontSize: '11.5px',
                    color:
                      tier.isCurrentExactPlan ||
                      (!isPaidAccount &&
                        !annual &&
                        (tier.id === 'starter_49' || tier.id === 'pro_99'))
                        ? 'var(--vs-pass-fg)'
                        : 'var(--vs-ink-muted)',
                    fontWeight:
                      tier.isCurrentExactPlan ||
                      (!isPaidAccount &&
                        !annual &&
                        (tier.id === 'starter_49' || tier.id === 'pro_99'))
                        ? 600
                        : 400,
                    marginBottom: '12px',
                  }}
                >
                  {tier.billingNote}
                </div>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--vs-ink-secondary)',
                    marginTop: 0,
                    marginBottom: '16px',
                  }}
                >
                  {tier.summary}
                </p>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: '14px 0 0 0',
                    margin: '0 0 22px 0',
                    borderTop: '1px solid var(--vs-border)',
                    fontSize: '12.5px',
                  }}
                >
                  {tier.specs.map((spec) => (
                    <li
                      key={spec}
                      style={{
                        marginBottom: '8px',
                        color: 'var(--vs-ink-secondary)',
                        display: 'flex',
                        gap: '8px',
                      }}
                    >
                      <span
                        className="vs-mono"
                        style={{ color: 'var(--vs-pass-fg)', fontWeight: 700 }}
                      >
                        ✓
                      </span>
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={tier.href}
                className={tier.highlight ? 'vs-btn' : 'vs-btn vs-btn-secondary'}
                style={{ width: '100%' }}
              >
                {tier.cta}
              </a>
            </div>
          );

          return tier.highlight ? (
            <div
              key={tier.id}
              className="vs-bezel-obsidian"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {cardInner}
            </div>
          ) : (
            <div
              key={tier.id}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {cardInner}
            </div>
          );
        })}
      </div>

      {isPaidAccount ? (
        <div
          className="vs-card"
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            background: 'var(--vs-surface-warm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
              HOW PLAN UPGRADES, DOWNGRADES &amp; BILLING CYCLES WORK
            </span>
            <StatusBadge tone="pass">
              INSTANT QUOTA SYNC · CANCEL ANYTIME
            </StatusBadge>
          </div>
          <div className="vs-grid-2" style={{ gap: '14px', fontSize: '12.5px' }}>
            <div style={{ color: 'var(--vs-ink-secondary)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--vs-ink)' }}>
                Upgrades &amp; Annual Switches:
              </strong>{' '}
              Upgrading to <strong>Pro + MCP Engine</strong> or{' '}
              <strong>Agency White-Label</strong> immediately increases your
              tracked website cap, weekly buyer question quota, and monthly{' '}
              <code className="vs-mono">/mcp</code> server credit limit without
              disturbing existing tracked domains or snapshots.
            </div>
            <div style={{ color: 'var(--vs-ink-secondary)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--vs-ink)' }}>
                Downgrades &amp; Cancellations:
              </strong>{' '}
              All generated <code className="vs-mono">JSON-LD</code>,{' '}
              <code className="vs-mono">/llms.txt</code>, and{' '}
              <code className="vs-mono">/agents.md</code> fixes already published
              on your website stay yours permanently even if you downgrade or
              cancel recurring monitoring.
            </div>
          </div>
        </div>
      ) : (
        <div className="vs-bezel" style={{ marginTop: '22px' }}>
          <div
            className="vs-card"
            style={{
              padding: '18px 22px',
              background: 'var(--vs-surface-warm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                HOW THE 7-DAY FREE TRIAL WORKS (STARTER &amp; PRO MONTHLY)
              </span>
              <StatusBadge tone="pass">$0.00 DUE TODAY · 1-CLICK CANCEL</StatusBadge>
            </div>

            {/* Zero-Lag Motion SVG 7-Day Trial Timeline (Desktop > 640px + Mobile <= 640px) */}
            <div
              style={{
                marginBottom: '14px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid var(--vs-border)',
              }}
            >
              <svg
                className="vs-schematic-desktop"
                viewBox="0 0 880 78"
                width="100%"
                role="img"
                aria-label="Animated 7-day free trial timeline: Day 0 $0.00 charged today and 1-Click AI Fix Prompt, Day 2 4/4 live verification, Days 3 to 7 live AI bot crawls, Day 7 stay active or 1-click cancel."
              >
                <path d="M 206 39 L 236 39" fill="none" stroke="#DDD9CE" strokeWidth="2" />
                <path className="vs-signal-path" d="M 206 39 L 236 39" fill="none" stroke="#0A0E17" strokeWidth="2.4" />
                <path d="M 432 39 L 462 39" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                <path className="vs-signal-path-out" d="M 432 39 L 462 39" fill="none" stroke="#059669" strokeWidth="2.4" />
                <path d="M 658 39 L 688 39" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                <path className="vs-signal-path-out" d="M 658 39 L 688 39" fill="none" stroke="#059669" strokeWidth="2.4" />

                <g transform="translate(8, 10)">
                  <rect width="198" height="58" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                  <circle className="vs-live-dot" cx="15" cy="19" r="3.5" fill="#059669" />
                  <text x="25" y="22" fill="#0A0E17" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                    DAY 0 · $0.00 TODAY
                  </text>
                  <text x="15" y="42" fill="#686D78" fontSize="9" fontFamily="var(--vs-mono)">
                    Copy 1-Click AI Fix Prompt
                  </text>
                </g>

                <g transform="translate(236, 10)">
                  <rect width="196" height="58" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
                  <text x="14" y="22" fill="#065F46" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                    ✓ DAY 1–2 · 4/4 LIVE
                  </text>
                  <text x="14" y="42" fill="#0A0E17" fontSize="9" fontFamily="var(--vs-mono)">
                    JSON-LD + /agents.md live
                  </text>
                </g>

                <g transform="translate(462, 10)">
                  <rect width="196" height="58" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                  <text x="14" y="22" fill="#0A0E17" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                    DAYS 3–6 · BOT PROOF
                  </text>
                  <text x="14" y="42" fill="#686D78" fontSize="9" fontFamily="var(--vs-mono)">
                    GPTBot &amp; Perplexity crawls
                  </text>
                </g>

                <g transform="translate(688, 10)">
                  <rect width="184" height="58" rx="6" fill="#0A0E17" />
                  <text x="14" y="22" fill="#34D399" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                    DAY 7 · YOU DECIDE
                  </text>
                  <text x="14" y="42" fill="#EAE8E1" fontSize="9" fontFamily="var(--vs-mono)">
                    Keep fixes · 1-click cancel
                  </text>
                </g>
              </svg>

              <svg
                className="vs-schematic-mobile"
                viewBox="0 0 320 124"
                width="100%"
                role="img"
                aria-label="Mobile 7-day trial timeline from Day 0 $0.00 charged today to Day 7 1-click cancel."
              >
                <g transform="translate(4, 6)">
                  <rect width="150" height="50" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                  <text x="10" y="20" fill="#0A0E17" fontSize="9" fontFamily="var(--vs-mono)" fontWeight="700">
                    1. DAY 0 ($0 TODAY)
                  </text>
                  <text x="10" y="37" fill="#686D78" fontSize="8.5" fontFamily="var(--vs-mono)">
                    Copy 1-Click AI Prompt
                  </text>
                </g>
                <g transform="translate(166, 6)">
                  <rect width="150" height="50" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
                  <text x="10" y="20" fill="#065F46" fontSize="9" fontFamily="var(--vs-mono)" fontWeight="700">
                    2. DAY 2 (4/4 LIVE)
                  </text>
                  <text x="10" y="37" fill="#0A0E17" fontSize="8.5" fontFamily="var(--vs-mono)">
                    Verify site uplift
                  </text>
                </g>
                <g transform="translate(4, 68)">
                  <rect width="150" height="50" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                  <text x="10" y="20" fill="#0A0E17" fontSize="9" fontFamily="var(--vs-mono)" fontWeight="700">
                    3. DAYS 3–6 (CRAWLS)
                  </text>
                  <text x="10" y="37" fill="#686D78" fontSize="8.5" fontFamily="var(--vs-mono)">
                    Watch live AI bot hits
                  </text>
                </g>
                <g transform="translate(166, 68)">
                  <rect width="150" height="50" rx="6" fill="#0A0E17" />
                  <text x="10" y="20" fill="#34D399" fontSize="9" fontFamily="var(--vs-mono)" fontWeight="700">
                    4. DAY 7 (CHOICE)
                  </text>
                  <text x="10" y="37" fill="#EAE8E1" fontSize="8.5" fontFamily="var(--vs-mono)">
                    Stay on or 1-click cancel
                  </text>
                </g>
              </svg>
            </div>

            <div className="vs-grid-2" style={{ gap: '14px', fontSize: '12.5px' }}>
              <div style={{ color: 'var(--vs-ink-secondary)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--vs-ink)' }}>
                  Days 1–2 (Deploy Fixes in &lt; 10 Min):
                </strong>{' '}
                Scan your site across ChatGPT, Gemini, and Perplexity, verify your
                Brand Truth Sheet, and paste the 1-Click AI Fix Prompt (
                <code className="vs-mono">JSON-LD</code>,{' '}
                <code className="vs-mono">/llms.txt</code>,{' '}
                <code className="vs-mono">/agents.md</code>) into Claude, Cursor,
                Antigravity, or Shopify.
              </div>
              <div style={{ color: 'var(--vs-ink-secondary)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--vs-ink)' }}>
                  Days 3–7 (Verify Bot Crawls &amp; Decide):
                </strong>{' '}
                Watch live <code className="vs-mono">GPTBot</code> and{' '}
                <code className="vs-mono">PerplexityBot</code> crawls hit your Step
                01 Ledger before your first invoice runs on Day 7. Cancel in 1 click
                inside Stripe Billing Portal, or pick the{' '}
                <strong style={{ color: 'var(--vs-ink)' }}>$19 Audit Pass</strong>{' '}
                if you prefer zero recurring billing.
              </div>
            </div>
          </div>
        </div>
      )}

      {!isPaidAccount ? (
        <PricingRoiCalculatorClient
          annual={annual}
          domainParam={domainParam}
          envParam={envParam}
        />
      ) : null}
    </section>
  );
}
