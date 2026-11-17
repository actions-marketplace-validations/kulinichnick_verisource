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
              <code className="vs-mono">PerplexityBot</code> WAF challenges,{' '}
              3-pillar <code className="vs-mono">JSON-LD</code> graphs, and
              Shopify <code className="vs-mono">/api/ucp/mcp</code> endpoints.
            </p>
          </div>

          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div className="vs-schematic-header">
                <span className="vs-eyebrow" style={{ fontSize: '10.5px' }}>
                  FIG 08 · ZERO-SIGNUP LIVE HTTP PROTOCOL VALIDATORS
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
                  $0 · NO LOGIN
                </span>
              </div>

              <div style={{ padding: '14px 12px', background: '#FFFFFF' }}>
                <svg
                  className="vs-schematic-desktop"
                  viewBox="0 0 500 210"
                  width="100%"
                  role="img"
                  aria-label="Motion diagram showing public domain entering the live edge HTTP prober and returning 4 instant protocol checks: GPTBot WAF, /llms.txt, /agents.md, and 3-pillar JSON-LD."
                >
                  <path d="M 146 105 L 194 105" fill="none" stroke="#DDD9CE" strokeWidth="1.8" />
                  <path className="vs-signal-path" d="M 146 105 L 194 105" fill="none" stroke="#0A0E17" strokeWidth="2.2" />

                  <path d="M 314 105 C 336 105, 336 46, 356 46" fill="none" stroke="#A7F3D0" strokeWidth="1.6" />
                  <path d="M 314 105 C 336 105, 336 98, 356 98" fill="none" stroke="#A7F3D0" strokeWidth="1.6" />
                  <path d="M 314 105 C 336 105, 336 156, 356 156" fill="none" stroke="#A7F3D0" strokeWidth="1.6" />
                  <path className="vs-signal-path-out" d="M 314 105 C 336 105, 336 46, 356 46" fill="none" stroke="#059669" strokeWidth="2.2" />
                  <path className="vs-signal-path-out vs-signal-path-delay-1" d="M 314 105 C 336 105, 336 98, 356 98" fill="none" stroke="#059669" strokeWidth="2.2" />
                  <path className="vs-signal-path-out vs-signal-path-delay-2" d="M 314 105 C 336 105, 336 156, 356 156" fill="none" stroke="#059669" strokeWidth="2.2" />

                  <g transform="translate(12, 74)">
                    <rect width="134" height="62" rx="7" fill="#FAF9F6" stroke="#CFCBC0" />
                    <circle className="vs-live-dot" cx="14" cy="22" r="3.2" fill="#0A0E17" />
                    <text x="24" y="25" fill="#0A0E17" fontSize="10" fontFamily="var(--vs-sans)" fontWeight="700">
                      Any Public URL
                    </text>
                    <text x="14" y="44" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      SSRF-guarded probe
                    </text>
                  </g>

                  <g transform="translate(194, 62)">
                    <rect className="vs-pulse-ring" x="-5" y="-5" width="130" height="96" rx="11" fill="none" stroke="#059669" />
                    <rect width="120" height="86" rx="8" fill="#0A0E17" />
                    <circle className="vs-live-dot" cx="60" cy="21" r="3.5" fill="#34D399" />
                    <text x="60" y="44" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      HTTP EDGE PROBE
                    </text>
                    <text x="60" y="61" textAnchor="middle" fill="#34D399" fontSize="8.5" fontFamily="var(--vs-mono)">
                      7-CMS fingerprint
                    </text>
                    <text x="60" y="75" textAnchor="middle" fill="#A3A8B4" fontSize="8.3" fontFamily="var(--vs-mono)">
                      + Bot User-Agents
                    </text>
                  </g>

                  <g transform="translate(356, 26)">
                    <rect width="134" height="40" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="10" y="18" fill="#065F46" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ WAF &amp; CRAWLERS
                    </text>
                    <text x="10" y="31" fill="#0A0E17" fontSize="8.3" fontFamily="var(--vs-mono)">
                      GPTBot · PerplexityBot
                    </text>
                  </g>
                  <g transform="translate(356, 78)">
                    <rect width="134" height="40" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="10" y="18" fill="#065F46" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ /LLMS &amp; /AGENTS
                    </text>
                    <text x="10" y="31" fill="#0A0E17" fontSize="8.3" fontFamily="var(--vs-mono)">
                      HTTP 200 vs Soft-404
                    </text>
                  </g>
                  <g transform="translate(356, 134)">
                    <rect width="134" height="44" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="10" y="18" fill="#065F46" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ JSON-LD + UCP
                    </text>
                    <text x="10" y="33" fill="#0A0E17" fontSize="8.3" fontFamily="var(--vs-mono)">
                      3-Pillar @graph · /mcp
                    </text>
                  </g>
                </svg>

                <svg
                  className="vs-schematic-mobile"
                  viewBox="0 0 320 144"
                  width="100%"
                  role="img"
                  aria-label="Mobile diagram showing live zero-signup HTTP protocol checks."
                >
                  <g transform="translate(6, 8)">
                    <rect width="308" height="44" rx="6" fill="#0A0E17" />
                    <text x="154" y="20" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="700">
                      1. LIVE HTTP + BOT USER-AGENT PROBE
                    </text>
                    <text x="154" y="35" textAnchor="middle" fill="#34D399" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Auto-detects all 7 CMS platforms in 2 seconds
                    </text>
                  </g>
                  <path d="M 160 52 L 160 72" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                  <path className="vs-signal-path-out" d="M 160 52 L 160 72" fill="none" stroke="#059669" strokeWidth="2.4" />
                  <g transform="translate(6, 72)">
                    <rect width="308" height="64" rx="7" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="14" y="23" fill="#065F46" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ 4 PROTOCOL DIAGNOSTICS ($0 · NO LOGIN)
                    </text>
                    <text x="14" y="43" fill="#0A0E17" fontSize="8.6" fontFamily="var(--vs-mono)">
                      WAF 403 · /llms.txt · /agents.md · JSON-LD · UCP
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
          {FREE_SEO_TOOLS.map((tool) => (
            <div key={tool.slug} className="vs-bezel">
              <div
                className="vs-card vs-card-interactive"
                style={{
                  padding: '22px',
                  height: '100%',
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
            </div>
          ))}
        </div>

        <GtmDomainScanHandoff />
      </div>
    </div>
  );
}
