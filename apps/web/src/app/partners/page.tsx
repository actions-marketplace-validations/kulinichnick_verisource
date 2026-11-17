import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { GtmDomainScanHandoff } from '../../components/GtmDomainScanHandoff';
import { PartnerHubClient } from '../../components/PartnerHubClient';

export const metadata: Metadata = {
  title:
    '25% Recurring Affiliate & Agency Partner Program — AI Search & GEO | Verisource',
  description:
    'Earn 25% recurring Stripe commissions across Starter ($49/mo), Pro + MCP ($99/mo), and Agency White-Label ($249/mo) plans with a 90-day attribution window and instant /r/[slug] partner links.',
  alternates: {
    canonical: 'https://verisource.dev/partners',
  },
};

const PARTNERS_PAGE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Verisource 25% Recurring Partner & Creator Program',
  url: 'https://verisource.dev/partners',
  description:
    '25% lifetime recurring affiliate partner program for SEO educators, newsletter writers, and Shopify/Webflow consultants.',
};

const PARTNERS_FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the Verisource 25% recurring partner attribution work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sharing https://verisource.dev/r/[slug] or any Verisource URL with ?ref=[slug] sets a 90-day vs_ref cookie and stamps affiliate_ref directly onto the Stripe Checkout Session and Stripe Subscription metadata. Partners earn 25% of every settled recurring invoice for the active life of the subscription.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which Verisource plans qualify for 25% recurring partner payouts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'All recurring plans qualify: Starter Brand ($49/mo pays $12.25/mo; $39/mo annual pays $117.00/yr upfront), Pro + MCP Engine ($99/mo pays $24.75/mo; $79/mo annual pays $237.00/yr upfront), and Agency White-Label ($249/mo pays $62.25/mo; $199/mo annual pays $597.00/yr upfront).',
      },
    },
  ],
};

export default function PartnersPage(): React.ReactElement {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(PARTNERS_PAGE_JSON_LD),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(PARTNERS_FAQ_JSON_LD),
        }}
      />

      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '44px 0 46px 0',
          marginBottom: '36px',
        }}
      >
        <div className="vs-container vs-hero-grid">
          <div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              <StatusBadge tone="pass">
                25% LIFETIME RECURRING COMMISSION
              </StatusBadge>
              <StatusBadge>90-DAY COOKIE · STRIPE SUBSCRIPTION SYNC</StatusBadge>
            </div>

            <h1
              style={{
                fontSize: 'clamp(30px, 3.8vw, 42px)',
                lineHeight: 1.09,
                letterSpacing: '-0.03em',
                fontWeight: 700,
                margin: '0 0 14px 0',
              }}
            >
              Earn 25% recurring revenue sharing empirical GEO tools &amp;
              benchmarks.
            </h1>

            <p
              style={{
                fontSize: '15.5px',
                lineHeight: 1.6,
                color: 'var(--vs-ink-secondary)',
                margin: '0 0 20px 0',
                maxWidth: '580px',
              }}
            >
              Built for technical SEO educators, newsletter authors, YouTube
              creators, and Shopify, Webflow, or WordPress consultants. Share our
              free <code className="vs-mono">/tools/*</code> validators or the
              40-domain 2026 HTTP Readiness Study with your{' '}
              <code className="vs-mono">?ref=</code> tag—four referred Agency
              White-Label workspaces pay{' '}
              <strong style={{ color: 'var(--vs-ink)' }}>$249.00/mo</strong>{' '}
              (<strong style={{ color: 'var(--vs-ink)' }}>$2,988/yr</strong>) in
              recurring partner payouts.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a href="#mint-partner-link" className="vs-btn">
                Mint My /r/[slug] Link ↓
              </a>
              <Link
                href="/benchmarks/ai-search-readiness-2026"
                className="vs-btn vs-btn-secondary"
              >
                View 2026 Study to Share →
              </Link>
            </div>
          </div>

          {/* Dual-Orientation Motion SVG Partner Attribution Flow */}
          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div className="vs-schematic-header">
                <span className="vs-eyebrow" style={{ fontSize: '10.5px' }}>
                  FIG 06 · 90-DAY STRIPE PARTNER ATTRIBUTION
                </span>
                <span
                  className="vs-mono"
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--vs-pass-fg)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '999px',
                      background: '#059669',
                      display: 'inline-block',
                    }}
                  />
                  25% RECURRING SHARE
                </span>
              </div>

              <div style={{ padding: '14px 12px', background: '#FFFFFF' }}>
                <svg
                  className="vs-schematic-desktop"
                  viewBox="0 0 500 220"
                  width="100%"
                  role="img"
                  aria-label="Motion diagram showing /r/slug partner links setting a 90-day vs_ref cookie, stamping Stripe subscription metadata, and paying 25 percent recurring revenue."
                >
                  <path d="M 164 68 C 190 68, 190 110, 214 110" fill="none" stroke="#DDD9CE" strokeWidth="1.5" />
                  <path d="M 164 152 C 190 152, 190 110, 214 110" fill="none" stroke="#DDD9CE" strokeWidth="1.5" />
                  <path className="vs-signal-path" d="M 164 68 C 190 68, 190 110, 214 110" fill="none" stroke="#0A0E17" strokeWidth="2" />
                  <path className="vs-signal-path vs-signal-path-delay-1" d="M 164 152 C 190 152, 190 110, 214 110" fill="none" stroke="#0A0E17" strokeWidth="2" />

                  <path d="M 330 110 L 358 110" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                  <path className="vs-signal-path-out" d="M 330 110 L 358 110" fill="none" stroke="#059669" strokeWidth="2.6" />

                  <g transform="translate(10, 42)">
                    <rect width="154" height="52" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <circle className="vs-live-dot" cx="14" cy="20" r="3.2" fill="#0A0E17" />
                    <text x="24" y="23" fill="#0A0E17" fontSize="10.2" fontFamily="var(--vs-sans)" fontWeight="700">
                      Share /r/your-code
                    </text>
                    <text x="14" y="40" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      2026 Study or /tools
                    </text>
                  </g>

                  <g transform="translate(10, 126)">
                    <rect width="154" height="52" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <circle className="vs-live-dot" cx="14" cy="20" r="3.2" fill="#0A0E17" />
                    <text x="24" y="23" fill="#0A0E17" fontSize="10.2" fontFamily="var(--vs-sans)" fontWeight="700">
                      90-Day vs_ref Cookie
                    </text>
                    <text x="14" y="40" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Survives multi-visit
                    </text>
                  </g>

                  <g transform="translate(214, 66)">
                    <rect className="vs-pulse-ring" x="-5" y="-5" width="126" height="98" rx="11" fill="none" stroke="#059669" />
                    <rect width="116" height="88" rx="8" fill="#0A0E17" />
                    <circle className="vs-live-dot" cx="58" cy="22" r="3.5" fill="#34D399" />
                    <text x="58" y="46" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      STRIPE SYNC
                    </text>
                    <text x="58" y="64" textAnchor="middle" fill="#34D399" fontSize="8.8" fontFamily="var(--vs-mono)">
                      affiliate_ref
                    </text>
                    <text x="58" y="77" textAnchor="middle" fill="#A3A8B4" fontSize="8.5" fontFamily="var(--vs-mono)">
                      metadata locked
                    </text>
                  </g>

                  <g transform="translate(358, 62)">
                    <rect width="132" height="96" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="11" y="22" fill="#065F46" fontSize="9" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ 25% PAYOUTS
                    </text>
                    <text x="11" y="42" fill="#0A0E17" fontSize="9.2" fontFamily="var(--vs-mono)">
                      • Pro: $24.75/mo
                    </text>
                    <text x="11" y="59" fill="#0A0E17" fontSize="9.2" fontFamily="var(--vs-mono)">
                      • Agency: $62.25/mo
                    </text>
                    <text x="11" y="76" fill="#065F46" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="600">
                      • Up to $597/yr ea
                    </text>
                  </g>
                </svg>

                <svg
                  className="vs-schematic-mobile"
                  viewBox="0 0 320 148"
                  width="100%"
                  role="img"
                  aria-label="Mobile diagram showing /r/slug partner links syncing 25 percent recurring Stripe payouts."
                >
                  <g transform="translate(6, 8)">
                    <rect width="308" height="44" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <text x="154" y="20" textAnchor="middle" fill="#0A0E17" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="700">
                      1. /R/[SLUG] SETS 90-DAY VS_REF COOKIE
                    </text>
                    <text x="154" y="35" textAnchor="middle" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Stamped directly onto Stripe Subscriptions
                    </text>
                  </g>
                  <path d="M 160 52 L 160 72" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                  <path className="vs-signal-path-out" d="M 160 52 L 160 72" fill="none" stroke="#059669" strokeWidth="2.4" />
                  <g transform="translate(6, 72)">
                    <rect width="308" height="68" rx="7" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="16" y="24" fill="#065F46" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ 25% LIFETIME RECURRING COMMISSION
                    </text>
                    <text x="16" y="45" fill="#0A0E17" fontSize="9" fontFamily="var(--vs-mono)">
                      $12.25–$62.25/mo or up to $597/yr upfront
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="vs-container">
        <PartnerHubClient />

        {/* Server-Rendered Tier Payout Matrix */}
        <div className="vs-bezel" style={{ marginBottom: '36px' }}>
          <div className="vs-card" style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--vs-border)',
              background: 'var(--vs-surface-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <strong style={{ fontSize: '14px' }}>
              Partner Recurring Commission Schedule (25% Across All Subscription
              Tiers)
            </strong>
            <Link
              href="/agencies"
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--vs-ink)',
                textDecoration: 'none',
              }}
            >
              Need White-Label Client Delivery Instead? View $249/mo Agency Plan →
            </Link>
          </div>

          <div className="vs-table-wrap">
            <table className="vs-table">
            <thead>
              <tr>
                <th>Plan Tier</th>
                <th>Monthly Billing Price</th>
                <th>Monthly Partner Payout (25%)</th>
                <th>Annual Billing Price</th>
                <th>Upfront Annual Payout (25%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Starter Brand</strong>
                </td>
                <td className="vs-mono">$49.00/mo</td>
                <td className="vs-mono">
                  <strong>$12.25/mo</strong>
                </td>
                <td className="vs-mono">$468.00/yr ($39/mo)</td>
                <td className="vs-mono">
                  <strong>$117.00/yr</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Pro + MCP Engine</strong>
                </td>
                <td className="vs-mono">$99.00/mo</td>
                <td className="vs-mono">
                  <strong>$24.75/mo</strong>
                </td>
                <td className="vs-mono">$948.00/yr ($79/mo)</td>
                <td className="vs-mono">
                  <strong>$237.00/yr</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Agency White-Label (15 Sites)</strong>
                </td>
                <td className="vs-mono">$249.00/mo</td>
                <td className="vs-mono">
                  <strong>$62.25/mo</strong>
                </td>
                <td className="vs-mono">$2,388.00/yr ($199/mo)</td>
                <td className="vs-mono">
                  <strong>$597.00/yr</strong>
                </td>
              </tr>
            </tbody>
            </table>
          </div>
          </div>
        </div>

        <GtmDomainScanHandoff />
      </div>
    </div>
  );
}
