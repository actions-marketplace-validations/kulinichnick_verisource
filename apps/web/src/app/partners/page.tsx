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
        <div className="vs-container">
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
              fontSize: 'clamp(30px, 3.8vw, 43px)',
              lineHeight: 1.09,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: '0 0 14px 0',
              maxWidth: '860px',
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
              margin: 0,
              maxWidth: '760px',
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
        </div>
      </section>

      <div className="vs-container">
        <PartnerHubClient />

        {/* Server-Rendered Tier Payout Matrix */}
        <div className="vs-card vs-table-wrap" style={{ marginBottom: '36px' }}>
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

        <GtmDomainScanHandoff />
      </div>
    </div>
  );
}
