import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import React from 'react';
import { VerisourceStyleTag } from '@verisource/ui';

const fontSans = localFont({
  src: './fonts/PlusJakartaSans-Latin.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-vs-sans',
  display: 'swap',
});

const fontSerif = localFont({
  src: [
    {
      path: './fonts/InstrumentSerif-Regular-Latin.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/InstrumentSerif-Italic-Latin.woff2',
      weight: '400',
      style: 'italic',
    },
  ],
  variable: '--font-vs-serif',
  display: 'swap',
});

const fontMono = localFont({
  src: './fonts/JetBrainsMono-Latin.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-vs-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://verisource.dev'),
  title: 'Verisource — B2B Generative Engine Optimization & Paid MCP Engine',
  description:
    'Audit AI citations across ChatGPT, Gemini, and Perplexity. Flag brand hallucinations and ship >=9.5/10 JSON-LD, /llms.txt, and Shopify /api/ucp/mcp fixes.',
  alternates: {
    canonical: 'https://verisource.dev',
  },
  openGraph: {
    title: 'Verisource — B2B GEO & Streamable HTTP MCP Platform',
    description:
      'Audit AI Share-of-Voice, catch pricing hallucinations, and deploy >=9.5/10 JSON-LD, /llms.txt, and Shopify /api/ucp/mcp fixes.',
    url: 'https://verisource.dev',
    siteName: 'Verisource',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verisource — B2B GEO & Streamable HTTP MCP Platform',
    description:
      'Audit AI citations across ChatGPT, Gemini, and Perplexity and deploy >=9.5/10 JSON-LD, /llms.txt, and /agents.md fixes.',
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Verisource',
  url: 'https://verisource.dev',
  logo: 'https://verisource.dev/icon.png',
  description:
    'B2B Generative Engine Optimization (GEO) platform and Streamable HTTP MCP server (https://mcp.verisource.dev/mcp) for AI search citation auditing, brand claim verification, and >=9.5/10 JSON-LD, /llms.txt, and /agents.md remediation.',
  sameAs: [
    'https://github.com/kulinichnick/verisource',
    'https://registry.modelcontextprotocol.io/?q=verisource',
  ],
  knowsAbout: [
    'Generative Engine Optimization',
    'Model Context Protocol',
    'Shopify Universal Commerce Protocol',
    'JSON-LD Entity Graphs',
  ],
};

const SOFTWARE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Verisource',
  url: 'https://verisource.dev',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, Chrome Manifest V3, MCP Streamable HTTP',
  description:
    'B2B Generative Engine Optimization (GEO) platform and monetized Streamable HTTP MCP server (https://mcp.verisource.dev/mcp) for ChatGPT, Gemini, and Perplexity citation auditing, hallucination detection, and Shopify /api/ucp/mcp catalog readiness.',
  publisher: {
    '@type': 'Organization',
    name: 'Verisource',
    url: 'https://verisource.dev',
  },
  offers: [
    {
      '@type': 'Offer',
      name: 'One-Time Domain Audit Pass',
      price: '19.00',
      priceCurrency: 'USD',
    },
    {
      '@type': 'Offer',
      name: 'Starter Brand Monthly',
      price: '49.00',
      priceCurrency: 'USD',
    },
    {
      '@type': 'Offer',
      name: 'Pro + MCP Engine Monthly',
      price: '99.00',
      priceCurrency: 'USD',
    },
    {
      '@type': 'Offer',
      name: 'Agency White-Label Monthly',
      price: '249.00',
      priceCurrency: 'USD',
    },
  ],
};

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does Verisource audit AI visibility and brand hallucinations?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Verisource probes /robots.txt, edge WAF rules for GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot, /llms.txt, /agents.md, and Shopify /api/ucp/mcp endpoints, then compares ChatGPT, Gemini, and Perplexity responses against your verified Brand Truth Sheet.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do AI coding and research agents connect to the Verisource MCP server?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Point any MCP TypeScript SDK v2 compatible client (Claude Desktop, Cursor, or Antigravity) to https://mcp.verisource.dev/mcp over stateless Streamable HTTP. Free readiness scans require no key; paid tools accept a SHA-256 vs_live_ Bearer token or OAuth 2.0 JWT.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the $19 One-Time Audit Pass 7-day credit work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Purchasing the $19 Audit Pass unlocks a complete 3-engine audit and >=9.5/10 fix bundle for one domain. Upgrading to Starter ($49/mo), Pro + MCP ($99/mo), or Agency ($249/mo) within 7 days automatically deducts $19.00 from your first recurring invoice.',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
    >
      <head>
        <VerisourceStyleTag />
        <link
          rel="alternate"
          type="text/markdown"
          href="/agents.md"
          title="Verisource Agent & MCP Truth Specification"
        />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="Verisource LLM Summary"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSON_LD),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
        />
      </head>
      <body>
        <header
          className="vs-site-chrome"
          style={{
            background: 'rgba(250, 249, 246, 0.94)',
            borderBottom: '1px solid var(--vs-border)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div className="vs-container vs-header-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                href="/"
                style={{
                  textDecoration: 'none',
                  color: 'var(--vs-ink)',
                  fontWeight: 700,
                  fontSize: '15.5px',
                  letterSpacing: '-0.025em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    background: 'var(--vs-ink)',
                    borderRadius: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      transform: 'rotate(45deg)',
                      border: '1.5px solid #FAF9F6',
                    }}
                  />
                </span>
                VERISOURCE
              </Link>
              <Link
                href="/mcp-guide"
                className="vs-badge"
                style={{ textDecoration: 'none' }}
                title="View 30-second Claude, Cursor, Windsurf & Antigravity setup guide"
              >
                mcp.verisource.dev/mcp
              </Link>
            </div>

            <nav className="vs-nav-links" aria-label="Primary navigation">
              <Link href="/#grader" className="vs-nav-link">
                Free Grader
              </Link>
              <Link href="/#case-ledger" className="vs-nav-link">
                Case Studies
              </Link>
              <Link href="/pricing" className="vs-nav-link">
                Pricing
              </Link>
              <Link href="/agencies" className="vs-nav-link">
                Agencies
              </Link>
              <Link href="/mcp-guide" className="vs-nav-link">
                MCP Guide
              </Link>
              <Link href="/sample-audit" className="vs-nav-link">
                Sample Audits
              </Link>
              <Link href="/dashboard" className="vs-btn">
                Open Console →
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer
          className="vs-site-chrome"
          style={{
            borderTop: '1px solid var(--vs-border)',
            background: 'var(--vs-surface)',
            marginTop: '80px',
            padding: '36px 0',
            fontSize: '13px',
            color: 'var(--vs-ink-muted)',
          }}
        >
          <div
            className="vs-container"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <strong style={{ color: 'var(--vs-ink)' }}>Verisource</strong> (
              <code className="vs-mono">verisource.dev</code>) — AI Brand Truth
              &amp; Streamable HTTP MCP Engine.
            </div>
            <div
              className="vs-mono"
              style={{
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/mcp-guide"
                style={{ color: 'var(--vs-ink-secondary)', textDecoration: 'none' }}
              >
                /mcp-guide
              </Link>
              <a
                href="/llms.txt"
                style={{ color: 'var(--vs-ink-secondary)', textDecoration: 'none' }}
              >
                /llms.txt
              </a>
              <a
                href="/agents.md"
                style={{ color: 'var(--vs-ink-secondary)', textDecoration: 'none' }}
              >
                /agents.md
              </a>
              <Link
                href="/privacy"
                style={{ color: 'var(--vs-ink-secondary)', textDecoration: 'none' }}
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                style={{ color: 'var(--vs-ink-secondary)', textDecoration: 'none' }}
              >
                Terms
              </Link>
              <span>Endpoint: https://mcp.verisource.dev/mcp</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
