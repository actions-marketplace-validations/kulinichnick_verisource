import type { Metadata } from 'next';
import React from 'react';
import { StatusBadge } from '@verisource/ui';

export const metadata: Metadata = {
  title: 'Privacy Policy & MV3 Extension Disclosure — Verisource',
  description:
    'Data handling, Manifest V3 Chrome Extension least-privilege permissions (sidePanel + activeTab), and Origin-verified attribution telemetry policy.',
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <div
      className="vs-container"
      style={{ paddingTop: '48px', maxWidth: '820px' }}
    >
      <div className="vs-card" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '14px', display: 'flex', gap: '8px' }}>
          <StatusBadge tone="pass">LEAST-PRIVILEGE MV3</StatusBadge>
          <StatusBadge>UPDATED NOVEMBER 2026</StatusBadge>
        </div>

        <h1 style={{ margin: '0 0 12px 0', fontSize: '26px' }}>
          Privacy Policy &amp; Browser Extension Data Disclosure
        </h1>
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: 'var(--vs-ink-secondary)',
          }}
        >
          Verisource (<code className="vs-mono">https://verisource.dev</code>)
          collects only the account, billing, and domain-level telemetry
          required to run B2B Generative Engine Optimization audits and meter
          Paid <code className="vs-mono">/mcp</code> requests. We do not sell
          customer data or cross-site browsing logs.
        </p>

        <section
          style={{
            borderTop: '1px solid var(--vs-border)',
            paddingTop: '20px',
            marginBottom: '22px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '17px' }}>
            1. Chrome Extension Permissions (Manifest V3)
          </h2>
          <p
            style={{
              margin: '0 0 10px 0',
              fontSize: '13.5px',
              color: 'var(--vs-ink-secondary)',
            }}
          >
            The Verisource Chrome Extension requests two permissions only:{' '}
            <code className="vs-mono">sidePanel</code> and{' '}
            <code className="vs-mono">activeTab</code>.
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: '18px',
              fontSize: '13.5px',
              color: 'var(--vs-ink-secondary)',
              lineHeight: 1.65,
            }}
          >
            <li>
              <strong>Zero background browsing collection:</strong> The
              extension never reads tabs in the background and requests zero{' '}
              <code className="vs-mono">&lt;all_urls&gt;</code> host
              permissions.
            </li>
            <li>
              <strong>Explicit user trigger:</strong> The current tab hostname
              is inspected only when you click the Verisource toolbar action or
              press <strong>Inspect Active Tab</strong> inside the side panel.
            </li>
            <li>
              <strong>Readiness probe payload:</strong> Only the public domain
              hostname (for example,{' '}
              <code className="vs-mono">aurearoasters.com</code>) is sent to{' '}
              <code className="vs-mono">https://verisource.dev/api/grader</code>{' '}
              to inspect <code className="vs-mono">/robots.txt</code>,{' '}
              <code className="vs-mono">/llms.txt</code>, and{' '}
              <code className="vs-mono">/agents.md</code>. Cookies, passwords,
              and form inputs on visited pages are never read or transmitted.
            </li>
          </ul>
        </section>

        <section
          style={{
            borderTop: '1px solid var(--vs-border)',
            paddingTop: '20px',
            marginBottom: '22px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '17px' }}>
            2. Account, Billing &amp; MCP API Key Storage
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              color: 'var(--vs-ink-secondary)',
              lineHeight: 1.65,
            }}
          >
            Work email authentication and workspace data are stored in Supabase
            PostgreSQL with Row-Level Security (RLS) enforced per tenant.
            Payment card details are processed directly by Stripe Checkout;
            Verisource stores only Stripe customer and subscription identifiers.
            Minted <code className="vs-mono">vs_live_</code> MCP keys are hashed
            with SHA-256 prior to database storage—raw secret values are shown
            once at creation and never logged in plaintext.
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
            3. First-Party AI Attribution Pixel (`/api/pixel`)
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              color: 'var(--vs-ink-secondary)',
              lineHeight: 1.65,
            }}
          >
            Merchants who install the optional 10-line attribution snippet send
            only the referring AI engine name (such as{' '}
            <code className="vs-mono">chatgpt</code> or{' '}
            <code className="vs-mono">perplexity</code>), landing path, and
            order total USD to{' '}
            <code className="vs-mono">https://verisource.dev/api/pixel</code>.
            The pixel sets zero third-party cookies and stores zero shopper
            names, email addresses, or IP addresses in{' '}
            <code className="vs-mono">ai_attribution_events</code>.
          </p>
        </section>

        <section
          style={{
            borderTop: '1px solid var(--vs-border)',
            paddingTop: '20px',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '17px' }}>
            4. Data Deletion &amp; Contact
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              color: 'var(--vs-ink-secondary)',
              lineHeight: 1.65,
            }}
          >
            Account owners may revoke MCP API keys or delete tracked domains at
            any time from <code className="vs-mono">/dashboard</code>. For full
            account deletion or privacy inquiries, email{' '}
            <a
              href="mailto:support@verisource.dev"
              style={{ color: 'var(--vs-ink)', fontWeight: 600 }}
            >
              support@verisource.dev
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
