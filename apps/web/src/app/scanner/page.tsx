import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { VERISOURCE_SCANNER_USER_AGENT } from '@verisource/core-geo';
import { CopyCommandPill, StatusBadge } from '@verisource/ui';

export const metadata: Metadata = {
  title: 'VerisourceScan/1.0 — Read-Only Crawler & Bot Transparency | Verisource',
  description:
    'Technical specification for VerisourceScan/1.0: read-only GET/HEAD site health and AI readiness crawler, robots.txt and Crawl-delay compliance, SSRF blocks, and opt-out rules.',
  alternates: {
    canonical: 'https://verisource.dev/scanner',
  },
};

const SCANNER_FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why did VerisourceScan/1.0 appear in my server logs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A site owner, developer, or agency ran an on-demand AI readiness and broken-link check on your domain using the Verisource web grader (https://verisource.dev/#scan) or the @verisource/cli command-line tool.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I block VerisourceScan/1.0 in robots.txt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Add User-agent: VerisourceScan followed by Disallow: / in your root /robots.txt file. VerisourceScan fetches and obeys /robots.txt and Crawl-delay before inspecting any page.',
      },
    },
  ],
};

export default function ScannerTransparencyPage(): React.ReactElement {
  return (
    <div className="vs-sec" style={{ borderBottom: 'none' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(SCANNER_FAQ_JSON_LD),
        }}
      />
      <div className="vs-container" style={{ maxWidth: '860px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          <span className="vs-kicker">Crawler Specification</span>
          <StatusBadge tone="pass">READ-ONLY · ROBOTS.TXT OBEYED</StatusBadge>
          <StatusBadge>GET &amp; HEAD ONLY</StatusBadge>
        </div>

        <h1
          style={{
            fontSize: 'clamp(30px, 4vw, 42px)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.08,
            margin: '0 0 14px 0',
          }}
        >
          VerisourceScan
        </h1>

        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.65,
            color: 'var(--vs-ink-secondary)',
            margin: '0 0 28px 0',
            maxWidth: '66ch',
          }}
        >
          If this crawler name showed up in your Cloudflare, Vercel, or Nginx
          logs, someone ran an on-demand site health and AI readiness check on
          your domain—either from our{' '}
          <Link
            href="/#scan"
            style={{ color: 'var(--vs-accent)', textDecoration: 'underline' }}
          >
            home-page scanner
          </Link>{' '}
          or via <code className="vs-mono">npx @verisource/cli scan</code> on
          their own machine. This page documents every request the scanner sends
          and how to block it in 2 lines.
        </p>

        <div className="vs-stack" style={{ gap: '22px' }}>
          <section className="vs-card" style={{ padding: '22px 24px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '8px' }}>
              01 · User-Agent Identification
            </div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                margin: '0 0 10px 0',
                letterSpacing: '-0.02em',
              }}
            >
              How it identifies itself
            </h2>
            <pre
              className="vs-code-block"
              style={{
                borderRadius: '8px',
                border: '1px solid var(--vs-border)',
                marginBottom: '12px',
              }}
            >
              <code>{VERISOURCE_SCANNER_USER_AGENT}</code>
            </pre>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--vs-ink-secondary)',
              }}
            >
              Every automated HTTP request carries this exact{' '}
              <code className="vs-mono">User-Agent</code> header. It never
              spoofs consumer browsers or third-party search crawlers.
            </p>
          </section>

          <section className="vs-card" style={{ padding: '22px 24px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '8px' }}>
              02 · Scope &amp; Crawl Limits
            </div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                margin: '0 0 12px 0',
                letterSpacing: '-0.02em',
              }}
            >
              What VerisourceScan checks
            </h2>
            <ul
              style={{
                margin: 0,
                paddingLeft: '18px',
                display: 'grid',
                gap: '10px',
                fontSize: '14px',
                color: 'var(--vs-ink-secondary)',
              }}
            >
              <li>
                Fetches <code className="vs-mono">/robots.txt</code> first and
                respects both <code className="vs-mono">Disallow</code> paths
                and <code className="vs-mono">Crawl-delay</code> directives.
              </li>
              <li>
                Inspects structured AI retrieval endpoints (
                <code className="vs-mono">/llms.txt</code>,{' '}
                <code className="vs-mono">/agents.md</code>,{' '}
                <code className="vs-mono">JSON-LD</code> entity/FAQ schemas, and
                Shopify <code className="vs-mono">/api/ucp/mcp</code>).
              </li>
              <li>
                Follows same-origin HTML links up to{' '}
                <strong style={{ color: 'var(--vs-ink)' }}>
                  5 pages (1 link deep)
                </strong>{' '}
                from the unauthenticated home-page box, or up to{' '}
                <strong style={{ color: 'var(--vs-ink)' }}>
                  20 pages (2 links deep)
                </strong>{' '}
                inside verified workspaces and CLI runs.
              </li>
              <li>
                Verifies linked pages, scripts, stylesheets, images, and{' '}
                <code className="vs-mono">#anchor</code> targets using{' '}
                <code className="vs-mono">HEAD</code> requests where supported,
                flagging HTTP <code className="vs-mono">4xx</code>/
                <code className="vs-mono">5xx</code> responses and dead links.
              </li>
            </ul>
          </section>

          <section className="vs-card" style={{ padding: '22px 24px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '8px' }}>
              03 · Hard Safety Boundaries
            </div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                margin: '0 0 12px 0',
                letterSpacing: '-0.02em',
              }}
            >
              What it never does
            </h2>
            <ul
              style={{
                margin: 0,
                paddingLeft: '18px',
                display: 'grid',
                gap: '10px',
                fontSize: '14px',
                color: 'var(--vs-ink-secondary)',
              }}
            >
              <li>
                Never sends <code className="vs-mono">POST</code>,{' '}
                <code className="vs-mono">PUT</code>,{' '}
                <code className="vs-mono">PATCH</code>, or{' '}
                <code className="vs-mono">DELETE</code> mutations during site
                health crawls (<code className="vs-mono">GET</code> and{' '}
                <code className="vs-mono">HEAD</code> only).
              </li>
              <li>
                Never submits forms, clicks destructive buttons, or transmits
                session cookies or credentials.
              </li>
              <li>
                Never follows paths matching state-changing actions:{' '}
                <code className="vs-mono">logout</code>,{' '}
                <code className="vs-mono">signout</code>,{' '}
                <code className="vs-mono">delete</code>,{' '}
                <code className="vs-mono">remove</code>,{' '}
                <code className="vs-mono">unsubscribe</code>, or{' '}
                <code className="vs-mono">cancel</code>.
              </li>
              <li>
                Refuses all loopback, RFC 1918 private networks, cloud metadata
                IPs (<code className="vs-mono">169.254.169.254</code>), and
                non-standard ports on every redirect hop.
              </li>
            </ul>
          </section>

          <section className="vs-card" style={{ padding: '22px 24px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '8px' }}>
              04 · Opt-Out Instructions
            </div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                margin: '0 0 10px 0',
                letterSpacing: '-0.02em',
              }}
            >
              How to keep VerisourceScan out
            </h2>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                color: 'var(--vs-ink-secondary)',
              }}
            >
              Add these two lines to your domain&rsquo;s root{' '}
              <code className="vs-mono">/robots.txt</code> file to block all
              automated VerisourceScan checks immediately:
            </p>
            <pre
              className="vs-code-block"
              style={{
                borderRadius: '8px',
                border: '1px solid var(--vs-border)',
              }}
            >
              <code>{`User-agent: VerisourceScan\nDisallow: /`}</code>
            </pre>
          </section>
        </div>

        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <CopyCommandPill command="npx @verisource/cli scan your-site.com" />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/features" className="vs-btn vs-btn-secondary">
              Explore All Features →
            </Link>
            <Link href="/#scan" className="vs-btn">
              Scan Your Own Site →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
