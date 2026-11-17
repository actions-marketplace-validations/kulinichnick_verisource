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

          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div className="vs-schematic-header">
                <span className="vs-eyebrow" style={{ fontSize: '10.5px' }}>
                  FIG 12 · TECHNICAL AI SEARCH IMPLEMENTATION PLAYBOOKS
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
                  3-LAYER PROTOCOL STACK
                </span>
              </div>

              <div style={{ padding: '14px 12px', background: '#FFFFFF' }}>
                <svg
                  className="vs-schematic-desktop"
                  viewBox="0 0 500 206"
                  width="100%"
                  role="img"
                  aria-label="Protocol stack diagram showing Layer 1 AI Crawler Access, Layer 2 /llms.txt and /agents.md Truth Specs, and Layer 3 3-Pillar JSON-LD and Shopify UCP."
                >
                  <g transform="translate(14, 14)">
                    <rect width="472" height="46" rx="7" fill="#FAF9F6" stroke="#CFCBC0" />
                    <circle className="vs-live-dot" cx="18" cy="23" r="3.2" fill="#0A0E17" />
                    <text x="30" y="21" fill="#0A0E17" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="700">
                      LAYER 01 · CRAWLER &amp; EDGE WAF ACCESS
                    </text>
                    <text x="30" y="36" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Allow GPTBot, OAI-SearchBot, PerplexityBot &amp; ClaudeBot (HTTP 200)
                    </text>
                  </g>

                  <path d="M 250 60 L 250 80" fill="none" stroke="#DDD9CE" strokeWidth="2" />
                  <path className="vs-signal-path" d="M 250 60 L 250 80" fill="none" stroke="#0A0E17" strokeWidth="2.4" />

                  <g transform="translate(14, 80)">
                    <rect width="472" height="46" rx="7" fill="#0A0E17" />
                    <circle className="vs-live-dot" cx="18" cy="23" r="3.2" fill="#34D399" />
                    <text x="30" y="21" fill="#FFFFFF" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="700">
                      LAYER 02 · /LLMS.TXT, /AGENTS.MD &amp; /AI-FACTS
                    </text>
                    <text x="30" y="36" fill="#34D399" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Machine-readable pricing, fulfillment &amp; claim guardrails across 7 CMSs
                    </text>
                  </g>

                  <path d="M 250 126 L 250 146" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                  <path className="vs-signal-path-out" d="M 250 126 L 250 146" fill="none" stroke="#059669" strokeWidth="2.4" />

                  <g transform="translate(14, 146)">
                    <rect width="472" height="46" rx="7" fill="#ECFDF5" stroke="#A7F3D0" />
                    <circle className="vs-live-dot" cx="18" cy="23" r="3.2" fill="#059669" />
                    <text x="30" y="21" fill="#065F46" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ LAYER 03 · 3-PILLAR JSON-LD @GRAPH &amp; SHOPIFY UCP
                    </text>
                    <text x="30" y="36" fill="#0A0E17" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Entity Identity + FAQPage Q&amp;A + Offer Pricing + /api/ucp/mcp
                    </text>
                  </g>
                </svg>

                <svg
                  className="vs-schematic-mobile"
                  viewBox="0 0 320 144"
                  width="100%"
                  role="img"
                  aria-label="Mobile diagram showing the 3-layer GEO protocol stack."
                >
                  <g transform="translate(6, 8)">
                    <rect width="308" height="44" rx="6" fill="#0A0E17" />
                    <text x="154" y="20" textAnchor="middle" fill="#FFFFFF" fontSize="9.8" fontFamily="var(--vs-mono)" fontWeight="700">
                      1. CRAWLER WAF + /LLMS.TXT + /AGENTS.MD
                    </text>
                    <text x="154" y="35" textAnchor="middle" fill="#34D399" fontSize="8.6" fontFamily="var(--vs-mono)">
                      Root static files or hosted /ai-facts 301 routing
                    </text>
                  </g>
                  <path d="M 160 52 L 160 72" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                  <path className="vs-signal-path-out" d="M 160 52 L 160 72" fill="none" stroke="#059669" strokeWidth="2.4" />
                  <g transform="translate(6, 72)">
                    <rect width="308" height="64" rx="7" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="14" y="23" fill="#065F46" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ 3-PILLAR JSON-LD @GRAPH + SHOPIFY UCP
                    </text>
                    <text x="14" y="43" fill="#0A0E17" fontSize="8.6" fontFamily="var(--vs-mono)">
                      Step-by-step specs + live 1-click validators
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="vs-container">
        <div className="vs-grid-2">
          {PROTOCOL_GUIDES.map((guide) => (
            <div key={guide.slug} className="vs-bezel">
              <div
                className="vs-card vs-card-interactive"
                style={{
                  padding: '24px',
                  height: '100%',
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
            </div>
          ))}
        </div>

        <GtmDomainScanHandoff />
      </div>
    </div>
  );
}
