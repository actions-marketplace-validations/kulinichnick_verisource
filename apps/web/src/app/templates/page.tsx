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
        <div className="vs-container">
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
      </section>

      <div className="vs-container">
        <CmsTemplatesExplorerClient />

        {/* Server-Rendered 7-CMS Placement Reference Table for Non-JS AI Crawlers */}
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

        <GtmDomainScanHandoff />
      </div>
    </div>
  );
}
