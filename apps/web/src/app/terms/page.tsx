import type { Metadata } from 'next';
import React from 'react';
import { StatusBadge } from '@verisource/ui';

export const metadata: Metadata = {
  title: 'Terms of Service & MCP Metering Terms — Verisource',
  description:
    'Subscription billing terms, 7-day $19 Tripwire upgrade credit rules, and Streamable HTTP /mcp acceptable use.',
};

export default function TermsPage(): React.ReactElement {
  return (
    <div
      className="vs-container"
      style={{ paddingTop: '48px', maxWidth: '820px' }}
    >
      <div className="vs-card" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '14px', display: 'flex', gap: '8px' }}>
          <StatusBadge>COMMERCIAL TERMS</StatusBadge>
          <StatusBadge>UPDATED NOVEMBER 2026</StatusBadge>
        </div>

        <h1 style={{ margin: '0 0 12px 0', fontSize: '26px' }}>
          Terms of Service
        </h1>
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: 'var(--vs-ink-secondary)',
          }}
        >
          These terms govern access to the Verisource web platform (
          <code className="vs-mono">https://verisource.dev</code>), the
          Streamable HTTP MCP server (
          <code className="vs-mono">https://mcp.verisource.dev/mcp</code>), and
          the Verisource Chrome Extension.
        </p>

        <section
          style={{
            borderTop: '1px solid var(--vs-border)',
            paddingTop: '20px',
            marginBottom: '22px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '17px' }}>
            1. Subscriptions &amp; 7-Day $19 Audit Pass Credit
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              color: 'var(--vs-ink-secondary)',
              lineHeight: 1.65,
            }}
          >
            Paid plans are billed in USD via Stripe ($19 one-time Audit Pass,
            $49/mo Starter Brand, $99/mo Pro + MCP Engine, and $249/mo Agency
            White-Label, with 20% discounts on annual commitments). Buyers who
            purchase the $19 One-Time Audit Pass and upgrade to any recurring
            subscription under the same account within 7 calendar days receive
            an automatic single-use $19.00 credit on their first subscription
            invoice. Subscriptions renew automatically unless canceled prior to
            renewal via the Stripe Billing Portal.
          </p>
        </section>

        <section
          style={{
            borderTop: '1px solid var(--vs-border)',
            paddingTop: '20px',
            marginBottom: '22px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '17px' }}>
            2. Streamable HTTP MCP Credit Metering
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              color: 'var(--vs-ink-secondary)',
              lineHeight: 1.65,
            }}
          >
            Unauthenticated calls to{' '}
            <code className="vs-mono">scan_domain_ai_readiness</code> are
            capped at 3 custom domain scans per IP address per UTC day. Paid MCP
            tools deduct 1 credit for 24-hour KV-cached lookups and 10 credits
            for forced live multi-engine scans or fix-bundle generations.
            Monthly credit allowances reset upon each paid recurring invoice.
          </p>
        </section>

        <section
          style={{
            borderTop: '1px solid var(--vs-border)',
            paddingTop: '20px',
            marginBottom: '22px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '17px' }}>
            3. Acceptable Use &amp; SSRF Protections
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              color: 'var(--vs-ink-secondary)',
              lineHeight: 1.65,
            }}
          >
            You may only scan public HTTP/HTTPS domains. Probing private RFC
            1918 networks, cloud metadata addresses, or bypassing edge WAF
            controls is prohibited and automatically blocked by Verisource
            request validators.
          </p>
        </section>

        <section
          style={{
            borderTop: '1px solid var(--vs-border)',
            paddingTop: '20px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '17px' }}>
            4. Empirical AI Citation Disclaimer
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              color: 'var(--vs-ink-secondary)',
              lineHeight: 1.65,
            }}
          >
            Third-party generative engines (ChatGPT, Google Gemini, Perplexity,
            and Claude) update retrieval weights independently. Verisource
            audits observable citation snapshots and generates schema-valid{' '}
            <code className="vs-mono">JSON-LD</code>,{' '}
            <code className="vs-mono">/llms.txt</code>, and{' '}
            <code className="vs-mono">/agents.md</code> files, and makes no
            warranty of permanent ranking positions in third-party models.
          </p>
        </section>
      </div>
    </div>
  );
}
