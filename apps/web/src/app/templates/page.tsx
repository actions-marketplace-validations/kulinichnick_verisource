import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { getAllCmsStarterTemplates } from '@verisource/core-geo';
import { StatusBadge } from '@verisource/ui';
import { CmsTemplatesExplorerClient } from '../../components/CmsTemplatesExplorerClient';
import { GtmDomainScanHandoff } from '../../components/GtmDomainScanHandoff';

export const metadata: Metadata = {
  title:
    'Free /agents.md, /llms.txt & JSON-LD Starter Templates for All 7 CMS Platforms | Verisource',
  description:
    'Copy-paste /agents.md, /llms.txt, /ai-facts, Shopify templates/agents.md.liquid, and schema.org JSON-LD starter templates for Shopify, Next.js, WordPress, Webflow, Wix, Squarespace, and Framer.',
  alternates: {
    canonical: 'https://verisource.dev/templates',
  },
};

const COLLECTION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: '7-Platform /agents.md, /llms.txt & JSON-LD Starter Templates',
  url: 'https://verisource.dev/templates',
  description:
    'Open-source starter specifications for deploying /agents.md, /llms.txt, /ai-facts, Shopify UCP overrides, and schema.org JSON-LD across 7 website platforms.',
};

const TEMPLATES_FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do hosted website builders like Webflow, Wix, Squarespace, and Framer serve /agents.md and /llms.txt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Because hosted builders do not allow arbitrary root Markdown uploads, publish a public HTML page at /ai-facts wrapped in <article class="verisource-ai-facts">, add <link rel="alternate" type="text/markdown" href="/ai-facts"> inside <head>, and configure 301 redirects from /agents.md and /llms.txt to /ai-facts.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should Shopify stores override the stock /agents.md file?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Stock Shopify /agents.md files ship generic Shop skill boilerplate without your free-shipping threshold, return window, or SKU exclusions. Adding templates/agents.md.liquid or /pages/ai-facts exposes verified store rules alongside /api/ucp/mcp.',
      },
    },
  ],
};

export default function CmsTemplatesPage(): React.ReactElement {
  const allTemplates = getAllCmsStarterTemplates();

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTION_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(TEMPLATES_FAQ_JSON_LD),
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
              <StatusBadge tone="pass">OPEN STARTER TEMPLATES · 7 PLATFORMS</StatusBadge>
              <StatusBadge>/AGENTS.MD · /LLMS.TXT · /AI-FACTS · JSON-LD</StatusBadge>
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
              Copy-paste <code className="vs-mono">/agents.md</code> &amp;{' '}
              <code className="vs-mono">/llms.txt</code> starter templates for
              every CMS.
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
              AI search crawlers (<code className="vs-mono">GPTBot</code>,{' '}
              <code className="vs-mono">OAI-SearchBot</code>,{' '}
              <code className="vs-mono">PerplexityBot</code>, and{' '}
              <code className="vs-mono">ClaudeBot</code>) rely on machine-readable
              pricing, fulfillment, and entity files to shortlist businesses
              accurately. Grab a syntax-validated starter template below—or scan
              your domain to generate one pre-filled with your real prices and
              policies in 60 seconds.
            </p>
          </div>

          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div className="vs-schematic-header">
                <span className="vs-eyebrow" style={{ fontSize: '10.5px' }}>
                  FIG 09 · 7-CMS MACHINE-READABLE STARTER TEMPLATES
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
                  SYNTAX LOCKED
                </span>
              </div>

              <div style={{ padding: '14px 12px', background: '#FFFFFF' }}>
                <svg
                  className="vs-schematic-desktop"
                  viewBox="0 0 500 210"
                  width="100%"
                  role="img"
                  aria-label="Motion diagram showing all 7 website platforms routing through either native root static files or /ai-facts 301 redirects to serve HTTP 200 /agents.md, /llms.txt, and JSON-LD."
                >
                  <path d="M 164 64 C 190 64, 190 105, 214 105" fill="none" stroke="#DDD9CE" strokeWidth="1.6" />
                  <path d="M 164 146 C 190 146, 190 105, 214 105" fill="none" stroke="#DDD9CE" strokeWidth="1.6" />
                  <path className="vs-signal-path" d="M 164 64 C 190 64, 190 105, 214 105" fill="none" stroke="#0A0E17" strokeWidth="2" />
                  <path className="vs-signal-path vs-signal-path-delay-1" d="M 164 146 C 190 146, 190 105, 214 105" fill="none" stroke="#0A0E17" strokeWidth="2" />

                  <path d="M 332 105 L 358 105" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                  <path className="vs-signal-path-out" d="M 332 105 L 358 105" fill="none" stroke="#059669" strokeWidth="2.6" />

                  <g transform="translate(10, 38)">
                    <rect width="154" height="52" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <circle className="vs-live-dot" cx="14" cy="20" r="3" fill="#0A0E17" />
                    <text x="24" y="23" fill="#0A0E17" fontSize="10" fontFamily="var(--vs-sans)" fontWeight="700">
                      Root File Stacks
                    </text>
                    <text x="14" y="40" fill="#686D78" fontSize="8.6" fontFamily="var(--vs-mono)">
                      Next.js · WP · Shopify
                    </text>
                  </g>

                  <g transform="translate(10, 120)">
                    <rect width="154" height="52" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <circle className="vs-live-dot" cx="14" cy="20" r="3" fill="#0A0E17" />
                    <text x="24" y="23" fill="#0A0E17" fontSize="10" fontFamily="var(--vs-sans)" fontWeight="700">
                      Hosted Builders
                    </text>
                    <text x="14" y="40" fill="#686D78" fontSize="8.5" fontFamily="var(--vs-mono)">
                      Webflow · Wix · Framer
                    </text>
                  </g>

                  <g transform="translate(214, 62)">
                    <rect className="vs-pulse-ring" x="-5" y="-5" width="128" height="96" rx="11" fill="none" stroke="#059669" />
                    <rect width="118" height="86" rx="8" fill="#0A0E17" />
                    <circle className="vs-live-dot" cx="59" cy="21" r="3.4" fill="#34D399" />
                    <text x="59" y="44" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      STARTER PACK
                    </text>
                    <text x="59" y="61" textAnchor="middle" fill="#34D399" fontSize="8.6" fontFamily="var(--vs-mono)">
                      Native or /ai-facts
                    </text>
                    <text x="59" y="75" textAnchor="middle" fill="#A3A8B4" fontSize="8.4" fontFamily="var(--vs-mono)">
                      + 301 Redirects
                    </text>
                  </g>

                  <g transform="translate(358, 56)">
                    <rect width="132" height="98" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="11" y="22" fill="#065F46" fontSize="9" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ 3 READY FILES
                    </text>
                    <text x="11" y="42" fill="#0A0E17" fontSize="9" fontFamily="var(--vs-mono)">
                      • /agents.md
                    </text>
                    <text x="11" y="59" fill="#0A0E17" fontSize="9" fontFamily="var(--vs-mono)">
                      • /llms.txt
                    </text>
                    <text x="11" y="77" fill="#065F46" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="600">
                      • JSON-LD @graph
                    </text>
                  </g>
                </svg>

                <svg
                  className="vs-schematic-mobile"
                  viewBox="0 0 320 144"
                  width="100%"
                  role="img"
                  aria-label="Mobile diagram showing 7-CMS starter templates for /agents.md, /llms.txt, and JSON-LD."
                >
                  <g transform="translate(6, 8)">
                    <rect width="308" height="44" rx="6" fill="#0A0E17" />
                    <text x="154" y="20" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="700">
                      1. PICK YOUR CMS (ALL 7 PLATFORMS)
                    </text>
                    <text x="154" y="35" textAnchor="middle" fill="#34D399" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Root files + hosted /ai-facts 301 routing
                    </text>
                  </g>
                  <path d="M 160 52 L 160 72" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                  <path className="vs-signal-path-out" d="M 160 52 L 160 72" fill="none" stroke="#059669" strokeWidth="2.4" />
                  <g transform="translate(6, 72)">
                    <rect width="308" height="64" rx="7" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="14" y="23" fill="#065F46" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ COPY /AGENTS.MD + /LLMS.TXT + JSON-LD
                    </text>
                    <text x="14" y="43" fill="#0A0E17" fontSize="8.6" fontFamily="var(--vs-mono)">
                      Syntax-validated schema.org @graph included
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="vs-container">
        <CmsTemplatesExplorerClient />

        {/* Server-Rendered 7-CMS Placement Reference Table for Non-JS AI Crawlers */}
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
              7-Platform Deployment Matrix (Root Static Files vs. Hosted{' '}
              <code className="vs-mono">/ai-facts</code> Routing)
            </strong>
            <Link
              href="/guides/llms-txt-and-agents-md-setup"
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--vs-ink)',
                textDecoration: 'none',
              }}
            >
              Read Full Setup Specification →
            </Link>
          </div>

          <div className="vs-table-wrap">
            <table className="vs-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Root Static Files</th>
                <th>Recommended Architecture</th>
                <th>Exact Placement Path</th>
              </tr>
            </thead>
            <tbody>
              {allTemplates.map((tpl) => (
                <tr key={tpl.platformId}>
                  <td>
                    <strong>{tpl.platformLabel}</strong>
                  </td>
                  <td>
                    <StatusBadge
                      tone={tpl.supportsRootStaticFiles ? 'pass' : 'neutral'}
                    >
                      {tpl.supportsRootStaticFiles
                        ? 'NATIVE ROOT'
                        : '/AI-FACTS + 301'}
                    </StatusBadge>
                  </td>
                  <td className="vs-mono" style={{ fontSize: '11.5px' }}>
                    {tpl.deploymentBadge}
                  </td>
                  <td
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--vs-ink-secondary)',
                    }}
                  >
                    {tpl.whereToPublish}
                  </td>
                </tr>
              ))}
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
