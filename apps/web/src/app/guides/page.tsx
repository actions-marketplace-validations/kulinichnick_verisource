import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { GtmDomainScanHandoff } from '../../components/GtmDomainScanHandoff';
import { PROTOCOL_GUIDES } from '../../lib/gtm-content';

export const metadata: Metadata = {
  title:
    'GEO & Agentic Commerce Protocol Guides (2026): /llms.txt, /agents.md & Shopify UCP | Verisource',
  description:
    'Step-by-step engineering guides for deploying /llms.txt, /agents.md, /ai-facts, schema.org JSON-LD, and Shopify /api/ucp/mcp across all 7 website platforms.',
  alternates: {
    canonical: 'https://verisource.dev/guides',
  },
};

export default function GuidesIndexPage(): React.ReactElement {
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
            <StatusBadge tone="pass">2026 GEO &amp; MCP PROTOCOL GUIDES</StatusBadge>
            <StatusBadge>SHOPIFY UCP · /AGENTS.MD · /LLMS.TXT</StatusBadge>
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
            Implementation guides for AI search &amp; agentic commerce.
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
            Practical specifications for deploying{' '}
            <code className="vs-mono">JSON-LD</code>,{' '}
            <code className="vs-mono">/llms.txt</code>,{' '}
            <code className="vs-mono">/agents.md</code>,{' '}
            <code className="vs-mono">/ai-facts</code>, and Shopify{' '}
            <code className="vs-mono">/api/ucp/mcp</code> across modern web
            stacks.
          </p>
        </div>
      </section>

      <div className="vs-container">
        <div className="vs-grid-2">
          {PROTOCOL_GUIDES.map((guide) => (
            <div
              key={guide.slug}
              className="vs-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <span className="vs-eyebrow">{guide.eyebrow}</span>
                  <StatusBadge>{guide.readingTime.toUpperCase()}</StatusBadge>
                </div>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 10px 0',
                  }}
                >
                  {guide.title}
                </h2>
                <p
                  style={{
                    margin: '0 0 18px 0',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {guide.answerFirstSummary}
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <Link href={`/guides/${guide.slug}`} className="vs-btn">
                  Read Implementation Guide →
                </Link>
                <Link
                  href={`/tools/${guide.relatedToolSlug}`}
                  className="vs-btn vs-btn-secondary"
                >
                  Open Live Validator
                </Link>
              </div>
            </div>
          ))}
        </div>

        <GtmDomainScanHandoff />
      </div>
    </div>
  );
}
