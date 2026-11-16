import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { GtmDomainScanHandoff } from '../../components/GtmDomainScanHandoff';
import { FREE_SEO_TOOLS } from '../../lib/gtm-content';

export const metadata: Metadata = {
  title:
    'Free GEO & AI Search Tools (2026): JSON-LD Validator, /llms.txt, GPTBot WAF & Shopify UCP | Verisource',
  description:
    'Free unauthenticated Generative Engine Optimization (GEO) tools: validate JSON-LD & FAQPage schema, /llms.txt & /agents.md, GPTBot/PerplexityBot WAF blocks, and Shopify /api/ucp/mcp.',
  alternates: {
    canonical: 'https://verisource.dev/tools',
  },
};

export default function FreeToolsHubPage(): React.ReactElement {
  return (
    <div>
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
            <StatusBadge tone="pass">FREE ZERO-SIGNUP GEO UTILITIES</StatusBadge>
            <StatusBadge>LIVE HTTP &amp; WAF INSPECTION</StatusBadge>
            <StatusBadge>7-PLATFORM AUTO-CMS DETECTION</StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 3.8vw, 43px)',
              lineHeight: 1.09,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: '0 0 14px 0',
              maxWidth: '840px',
            }}
          >
            Free AI search &amp; agent protocol diagnostic tools.
          </h1>

          <p
            style={{
              fontSize: '15.5px',
              lineHeight: 1.6,
              color: 'var(--vs-ink-secondary)',
              margin: 0,
              maxWidth: '720px',
            }}
          >
            Run instant HTTP checks on{' '}
            <code className="vs-mono">/llms.txt</code>,{' '}
            <code className="vs-mono">/agents.md</code>,{' '}
            <code className="vs-mono">GPTBot</code> and{' '}
            <code className="vs-mono">PerplexityBot</code> WAF challenges, and
            Shopify <code className="vs-mono">/api/ucp/mcp</code> endpoints.
          </p>
        </div>
      </section>

      <div className="vs-container">
        <div className="vs-grid-2">
          {FREE_SEO_TOOLS.map((tool) => (
            <div
              key={tool.slug}
              className="vs-card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
                  {tool.eyebrow}
                </div>
                <h2
                  style={{
                    fontSize: '18.5px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 10px 0',
                  }}
                >
                  {tool.title}
                </h2>
                <p
                  style={{
                    margin: '0 0 16px 0',
                    fontSize: '13.5px',
                    lineHeight: 1.58,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {tool.answerFirstSummary}
                </p>
              </div>
              <Link href={`/tools/${tool.slug}`} className="vs-btn">
                {`Open ${tool.shortName} →`}
              </Link>
            </div>
          ))}
        </div>

        <GtmDomainScanHandoff />
      </div>
    </div>
  );
}
