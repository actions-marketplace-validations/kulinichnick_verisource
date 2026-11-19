import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import React from 'react';
import { VerisourceStyleTag } from '@verisource/ui';
import { AffiliateRefTrackerClient } from '../components/AffiliateRefTrackerClient';
import { SiteHeaderClient } from '../components/SiteHeaderClient';

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
    'Audit AI citations across ChatGPT, Gemini, and Perplexity. Flag brand hallucinations and ship syntax-validated JSON-LD, /llms.txt, and Shopify /api/ucp/mcp fixes.',
  openGraph: {
    title: 'Verisource — B2B GEO & Streamable HTTP MCP Platform',
    description:
      'Audit AI Share-of-Voice, catch pricing hallucinations, and deploy syntax-validated JSON-LD, /llms.txt, and Shopify /api/ucp/mcp fixes.',
    url: 'https://verisource.dev',
    siteName: 'Verisource',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verisource — B2B GEO & Streamable HTTP MCP Platform',
    description:
      'Audit AI citations across ChatGPT, Gemini, and Perplexity and deploy syntax-validated JSON-LD, /llms.txt, and /agents.md fixes.',
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
    'B2B Generative Engine Optimization (GEO) platform and Streamable HTTP MCP server (https://mcp.verisource.dev/mcp) for AI search citation auditing, brand claim verification, and syntax-validated JSON-LD, /llms.txt, and /agents.md remediation.',
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
      name: 'How do the 7-day free trial and $19 One-Time Audit Pass work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'First-time monthly subscribers on Starter ($49/mo) and Pro + MCP ($99/mo) start with a 7-day free trial ($0.00 due today; cancel in 1 click anytime inside Stripe Billing Portal before Day 7). Buyers who prefer zero recurring subscription can buy the $19 One-Time Audit Pass, which also credits $19.00 off Month 1 if upgraded within 7 days.',
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
        <link
          rel="mcp"
          href="https://mcp.verisource.dev/b/verisource.dev/mcp"
          title="Verisource Verified Brand Truth MCP"
        />
        <script
          src="https://mcp.verisource.dev/b/verisource.dev/webmcp.js"
          data-vs-domain="verisource.dev"
          defer
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
        <AffiliateRefTrackerClient />
        <SiteHeaderClient />

        <main>{children}</main>

        <footer
          className="vs-site-chrome"
          style={{
            borderTop: '1px solid var(--vs-border)',
            background: 'var(--vs-band-alt)',
            marginTop: '80px',
            padding: '48px 0 32px 0',
            fontSize: '13px',
            color: 'var(--vs-ink-muted)',
          }}
        >
          <div className="vs-container">
            <div
              className="vs-footer-grid"
              style={{
                paddingBottom: '32px',
                borderBottom: '1px solid var(--vs-border)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '9px',
                    color: 'var(--vs-ink)',
                    fontWeight: 700,
                    fontSize: '15.5px',
                    letterSpacing: '-0.025em',
                    marginBottom: '10px',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '19px',
                      height: '19px',
                      background: 'var(--vs-accent)',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        transform: 'rotate(45deg)',
                        border: '1.6px solid #161004',
                      }}
                    />
                  </span>
                  verisource
                </div>
                <p
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '13px',
                    lineHeight: 1.58,
                    color: 'var(--vs-ink-secondary)',
                    maxWidth: '340px',
                  }}
                >
                  AI search visibility, brand-truth verification, multi-page site
                  health scanning, and Streamable HTTP{' '}
                  <code className="vs-mono">/mcp</code> remediation.
                </p>
                <div className="vs-mono" style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}>
                  Endpoint: https://mcp.verisource.dev/mcp
                </div>
              </div>

              <div>
                <div className="vs-eyebrow" style={{ color: 'var(--vs-ink)', marginBottom: '10px' }}>
                  Platform
                </div>
                <div style={{ display: 'grid', gap: '7px' }}>
                  <Link href="/features" className="vs-nav-link">
                    Features &amp; CLI
                  </Link>
                  <Link href="/#scan" className="vs-nav-link">
                    Scan Your Site
                  </Link>
                  <Link href="/tutorial" className="vs-nav-link">
                    Interactive Tour
                  </Link>
                  <Link href="/pricing" className="vs-nav-link">
                    Pricing &amp; Plans
                  </Link>
                  <Link href="/agencies" className="vs-nav-link">
                    Agency White-Label
                  </Link>
                  <Link href="/mcp-guide" className="vs-nav-link">
                    MCP &amp; Agent Setup
                  </Link>
                  <Link href="/scanner" className="vs-nav-link">
                    The Scanner
                  </Link>
                </div>
              </div>

              <div>
                <div className="vs-eyebrow" style={{ color: 'var(--vs-ink)', marginBottom: '10px' }}>
                  Validators &amp; Research
                </div>
                <div style={{ display: 'grid', gap: '7px' }}>
                  <Link href="/tools" className="vs-nav-link">
                    Free Protocol Validators
                  </Link>
                  <Link href="/templates" className="vs-nav-link">
                    7-CMS Starter Templates
                  </Link>
                  <Link href="/connectors" className="vs-nav-link">
                    WordPress &amp; Shopify Bridges
                  </Link>
                  <Link href="/benchmarks" className="vs-nav-link">
                    2026 Readiness Study
                  </Link>
                  <Link href="/compare" className="vs-nav-link">
                    Platform Comparisons
                  </Link>
                  <Link href="/guides" className="vs-nav-link">
                    Engineering Guides
                  </Link>
                </div>
              </div>

              <div>
                <div className="vs-eyebrow" style={{ color: 'var(--vs-ink)', marginBottom: '10px' }}>
                  Account &amp; Specs
                </div>
                <div style={{ display: 'grid', gap: '7px' }}>
                  <Link href="/dashboard" className="vs-nav-link">
                    Subscriber Console
                  </Link>
                  <Link href="/partners" className="vs-nav-link">
                    25% Partner Program
                  </Link>
                  <a href="/llms.txt" className="vs-nav-link vs-mono" style={{ fontSize: '12px' }}>
                    /llms.txt
                  </a>
                  <a href="/agents.md" className="vs-nav-link vs-mono" style={{ fontSize: '12px' }}>
                    /agents.md
                  </a>
                  <Link href="/privacy" className="vs-nav-link">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="vs-nav-link">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>

            <div
              style={{
                paddingTop: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '12px',
              }}
            >
              <div>
                <strong style={{ color: 'var(--vs-ink-secondary)' }}>Verisource</strong> (
                <code className="vs-mono">verisource.dev</code>) — Syntax &amp;
                Brand-Truth Verified GEO Platform.
              </div>
              <div className="vs-mono" style={{ color: 'var(--vs-ink-muted)' }}>
                MCP SDK v2 · Streamable HTTP · Chrome MV3
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
