'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { StatusBadge } from '@verisource/ui';

export function PricingLadderSection(props: {
  preselectedDomain?: string;
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

  const domainParam = props.preselectedDomain
    ? `&domain=${encodeURIComponent(props.preselectedDomain)}`
    : '';
  const tokenParam = accessToken
    ? `&access_token=${encodeURIComponent(accessToken)}`
    : '';

  const tiers = [
    {
      id: 'tripwire_19',
      name: 'Audit Pass (Tripwire)',
      price: '$19',
      cadence: 'one-time pass',
      badge: '7-DAY UPGRADE CREDIT',
      highlight: false,
      summary:
        'Complete 1-domain deep scan + full 9.5+/10 fix bundle once. Credited 100% toward Month 1 if you subscribe within 7 days.',
      specs: [
        '1 Complete Domain Audit (ChatGPT, Gemini, Perplexity)',
        'Unblurred Competitor Citation URLs',
        '1-Click JSON-LD, /llms.txt & /agents.md Bundle',
        '$19 credited toward any plan within 7 days',
      ],
      cta: 'Buy $19 Audit Pass',
      href: `/api/checkout?plan=tripwire_19&cycle=one_time${domainParam}${tokenParam}`,
    },
    {
      id: 'starter_49',
      name: 'Starter Brand',
      price: annual ? '$39' : '$49',
      cadence: annual ? '/mo billed annually' : '/mo billed monthly',
      badge: '1 DOMAIN',
      highlight: false,
      summary:
        'Automated weekly prompt tracking and Hallucination Watchdog for a single B2B or Shopify brand.',
      specs: [
        '1 Tracked Domain + Weekly Cron Scans',
        '35 Weekly Buyer Prompts (3 AI Engines)',
        'Hallucination & Brand Truth Watchdog',
        '9.5+/10 JSON-LD, /llms.txt & /agents.md Fixes',
      ],
      cta: 'Start Starter Plan',
      href: `/api/checkout?plan=starter_49&cycle=${
        annual ? 'annual' : 'monthly'
      }${domainParam}${tokenParam}`,
    },
    {
      id: 'pro_99',
      name: 'Pro + MCP Engine',
      price: annual ? '$79' : '$99',
      cadence: annual ? '/mo billed annually' : '/mo billed monthly',
      badge: 'MOST POPULAR',
      highlight: true,
      summary:
        'Full Query Fanout Decompiler, Shopify /api/ucp/mcp catalog enhancer, AI revenue pixel, and Paid MCP server access.',
      specs: [
        'Up to 3 Domains & 100 Weekly Prompts',
        'Query Fanout Decompiler + Outreach Briefs',
        '10-Line AI Referral & Checkout Revenue Pixel',
        'Shopify /api/ucp/mcp + agents.md.liquid Adapter',
        'Paid /mcp Server (1,000 credits/mo: 1 cached / 10 live)',
      ],
      cta: 'Start Pro + MCP',
      href: `/api/checkout?plan=pro_99&cycle=${
        annual ? 'annual' : 'monthly'
      }${domainParam}${tokenParam}`,
    },
    {
      id: 'agency_249',
      name: 'Agency White-Label',
      price: annual ? '$199' : '$249',
      cadence: annual ? '/mo billed annually' : '/mo billed monthly',
      badge: '15 CLIENT DOMAINS',
      highlight: false,
      summary:
        'Close $1,500–$3,000/mo GEO retainers using 60-second white-label prospect audit URLs with your agency logo and booking link.',
      specs: [
        'Up to 15 Client Domains & 400 Weekly Prompts',
        '60-Second White-Label Pitch Link (/audit/[slug])',
        'Custom Agency Logo, Brand Colors & Calendar CTA',
        '5,000 Paid /mcp Server Credits / Month',
      ],
      cta: 'Start Agency Plan',
      href: `/api/checkout?plan=agency_249&cycle=${
        annual ? 'annual' : 'monthly'
      }${domainParam}${tokenParam}`,
    },
  ];

  return (
    <section id="pricing" style={{ marginTop: '64px' }}>
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
          <div
            className="vs-mono"
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--vs-ink-muted)',
              marginBottom: '6px',
            }}
          >
            TRANSPARENT PRICING LADDER
          </div>
          <h2
            style={{
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Replace passive $245–$579/mo visibility charts with a read-write fix engine.
          </h2>
        </div>

        <div
          style={{
            display: 'inline-flex',
            border: '1px solid var(--vs-border-strong)',
            borderRadius: '5px',
            overflow: 'hidden',
            background: 'var(--vs-surface)',
          }}
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            style={{
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: !annual ? 'var(--vs-ink)' : 'transparent',
              color: !annual ? '#FFFFFF' : 'var(--vs-ink-secondary)',
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            style={{
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: annual ? 'var(--vs-ink)' : 'transparent',
              color: annual ? '#FFFFFF' : 'var(--vs-ink-secondary)',
            }}
          >
            Annual (Save 20%)
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '14px',
        }}
      >
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="vs-card"
            style={{
              padding: '20px',
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
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '15px' }}>
                  {tier.name}
                </span>
                <StatusBadge tone={tier.highlight ? 'pass' : 'neutral'}>
                  {tier.badge}
                </StatusBadge>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span
                  className="vs-mono"
                  style={{ fontSize: '30px', fontWeight: 700 }}
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
                  padding: 0,
                  margin: '0 0 20px 0',
                  borderTop: '1px solid var(--vs-border)',
                  paddingTop: '14px',
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
                    <span className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
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
    </section>
  );
}
