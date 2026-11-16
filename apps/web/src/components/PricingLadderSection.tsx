'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  normalizePublicDomain,
  type RecommendedRemediationEnv,
} from '@verisource/core-geo';
import { StatusBadge } from '@verisource/ui';

const VALID_PROMPT_ENV_LABELS: Record<RecommendedRemediationEnv, string> = {
  coding_agent: 'CODING AGENT',
  wordpress_cms: 'WORDPRESS',
  webflow_cms: 'WEBFLOW',
  wix_squarespace_framer: 'WIX · SQUARESPACE · FRAMER',
  shopify_liquid: 'SHOPIFY',
  chat_assistant: 'CHATGPT / CLAUDE WEB',
};

export function PricingLadderSection(props: {
  preselectedDomain?: string;
  preselectedPlan?: string;
  preselectedEnv?: string;
}): React.ReactElement {
  const [annual, setAnnual] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) {
        setAccessToken(data.session.access_token);
      }
    });
  }, []);

  let safeHostname: string | null = null;
  if (props.preselectedDomain) {
    try {
      safeHostname = normalizePublicDomain(props.preselectedDomain).hostname;
    } catch {
      safeHostname = null;
    }
  }

  const activeHighlightPlan =
    props.preselectedPlan === 'tripwire_19' ||
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

  const tiers = [
    {
      id: 'tripwire_19',
      name: 'Audit Pass',
      price: '$19',
      cadence: 'one-time pass',
      badge: 'NO SUBSCRIPTION',
      billingNote: 'Single payment · $19 credits toward Month 1 within 7 days',
      highlight: activeHighlightPlan === 'tripwire_19',
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
    {
      id: 'starter_49',
      name: 'Starter Brand',
      price: annual ? '$39' : '$49',
      cadence: annual ? '/mo billed annually' : '/mo after 7-day trial',
      badge: annual ? 'SAVE 20%' : '7-DAY FREE TRIAL',
      billingNote: annual
        ? '$468 billed annually · Cancel renewal anytime'
        : '$0.00 due today · 1-click cancel before Day 7',
      highlight: activeHighlightPlan === 'starter_49',
      summary:
        'Automated weekly AI checks and wrong-price alerts for a single local business, SaaS company, or Shopify store.',
      specs: [
        '1 Website + Weekly Automated Scans',
        '35 Weekly Buyer Questions (3 AI Engines)',
        'Wrong-Price & Policy Alert Watchdog',
        'Validated JSON-LD, /llms.txt & /agents.md Fixes',
      ],
      cta: annual ? 'Start Annual Starter' : 'Start 7-Day Free Trial →',
      href: `/api/checkout?plan=starter_49&cycle=${
        annual ? 'annual' : 'monthly'
      }${domainParam}${envParam}${tokenParam}`,
    },
    {
      id: 'pro_99',
      name: 'Pro + MCP Engine',
      price: annual ? '$79' : '$99',
      cadence: annual ? '/mo billed annually' : '/mo after 7-day trial',
      badge: annual ? 'MOST POPULAR' : 'MOST POPULAR · 7D TRIAL',
      billingNote: annual
        ? '$948 billed annually · 1,000 /mcp credits/mo'
        : '$0.00 due today · 1-click cancel before Day 7',
      highlight: activeHighlightPlan === 'pro_99',
      summary:
        'Competitor source map, Shopify catalog adapter, 10-line AI revenue tracker, and direct MCP sync for AI tools.',
      specs: [
        'Up to 3 Websites & 100 Weekly Questions',
        'Competitor Source Map + Outreach Drafts',
        '10-Line AI Visit & Checkout Revenue Pixel',
        'Shopify /api/ucp/mcp + agents.md.liquid Adapter',
        annual
          ? 'Paid /mcp Server (1,000 credits/mo: 1 cached / 10 live)'
          : 'Paid /mcp Server (150 trial credits → 1,000/mo)',
      ],
      cta: annual ? 'Start Annual Pro + MCP' : 'Start 7-Day Free Trial →',
      href: `/api/checkout?plan=pro_99&cycle=${
        annual ? 'annual' : 'monthly'
      }${domainParam}${envParam}${tokenParam}`,
    },
    {
      id: 'agency_249',
      name: 'Agency White-Label',
      price: annual ? '$199' : '$249',
      cadence: annual ? '/mo billed annually' : '/mo billed monthly',
      badge: '15 CLIENT SITES',
      billingNote: annual
        ? '$2,388 billed annually · 5,000 /mcp credits/mo'
        : 'Instant 15-site batch pipeline & 5,000 /mcp credits',
      highlight: activeHighlightPlan === 'agency_249',
      summary:
        'Close $1,500–$3,000/mo client retainers using 60-second branded audit links with your agency logo and booking button.',
      specs: [
        'Up to 15 Client Websites & 400 Weekly Questions',
        '60-Second Branded Client Link (/audit/[slug])',
        'Custom Agency Logo, Brand Color & Calendar CTA',
        '5,000 Paid /mcp Server Credits / Month',
      ],
      cta: annual ? 'Start Annual Agency' : 'Start Agency Plan',
      href: `/api/checkout?plan=agency_249&cycle=${
        annual ? 'annual' : 'monthly'
      }${domainParam}${envParam}${tokenParam}`,
    },
  ];

  return (
    <section id="pricing" style={{ marginTop: '68px' }}>
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
            STRAIGHTFORWARD PRICING
          </div>
          <h2
            style={{
              fontSize: '27px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: 0,
            }}
          >
            Skip $245–$579/mo passive charts. Pay only for verified fixes.
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

      <div className="vs-grid-4">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="vs-card"
            style={{
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderColor: tier.highlight
                ? 'var(--vs-ink)'
                : 'var(--vs-border)',
              borderWidth: tier.highlight ? '2px' : '1px',
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
                <StatusBadge tone={tier.highlight ? 'pass' : 'neutral'}>
                  {tier.badge}
                </StatusBadge>
              </div>

              <div style={{ marginBottom: '6px' }}>
                <span
                  className="vs-mono"
                  style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}
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
                    !annual && (tier.id === 'starter_49' || tier.id === 'pro_99')
                      ? 'var(--vs-pass-fg)'
                      : 'var(--vs-ink-muted)',
                  fontWeight:
                    !annual && (tier.id === 'starter_49' || tier.id === 'pro_99')
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
                    <span className="vs-mono" style={{ color: 'var(--vs-ink)', fontWeight: 700 }}>
                      +
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
        ))}
      </div>

      {/* 7-Day Trial Timeline & Billing Transparency Bar */}
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
            HOW THE 7-DAY FREE TRIAL WORKS (STARTER &amp; PRO MONTHLY)
          </span>
          <StatusBadge tone="pass">$0.00 DUE TODAY · 1-CLICK CANCEL</StatusBadge>
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
    </section>
  );
}
