import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { GtmDomainScanHandoff } from '../../components/GtmDomainScanHandoff';
import { COMPETITOR_ALTERNATIVES } from '../../lib/gtm-content';

export const metadata: Metadata = {
  title:
    'GEO Tool Comparisons (2026): Verisource vs. Profound, Otterly, Peec, AthenaHQ & Scrunch',
  description:
    'Objective 2026 buyer comparisons of Generative Engine Optimization (GEO) platforms across pricing, 1-Click CMS fixes, /agents.md verification, agency white-labeling, and /mcp.',
  alternates: {
    canonical: 'https://verisource.dev/compare',
  },
};

export default function CompareIndexPage(): React.ReactElement {
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
              <StatusBadge tone="pass">2026 GEO PLATFORM COMPARISONS</StatusBadge>
              <StatusBadge>READ-WRITE EXECUTION VS. PASSIVE CHARTS</StatusBadge>
              <StatusBadge>SCHEMA &amp; FACT VERIFIED</StatusBadge>
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
              Compare Verisource against read-only GEO trackers.{' '}
              <span
                className="vs-display-serif"
                style={{ fontSize: '1.08em', fontWeight: 400 }}
              >
                Side-by-side protocol &amp; pricing facts.
              </span>
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
              Over 90% of Generative Engine Optimization platforms charge
              $95–$579+/month strictly to chart where ChatGPT or Perplexity skips
              your brand. Inspect how Verisource pairs 3-engine monitoring with
              1-Click AI Fix Prompts across 7 CMS stacks, live HTTP verification,
              15-client white-label pitch links, and Streamable HTTP{' '}
              <code className="vs-mono">/mcp</code>.
            </p>
          </div>

          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div className="vs-schematic-header">
                <span className="vs-eyebrow" style={{ fontSize: '10.5px' }}>
                  FIG 11 · PASSIVE DASHBOARDS VS. READ-WRITE ENGINE
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
                  READ + WRITE + /MCP
                </span>
              </div>

              <div style={{ padding: '14px 12px', background: '#FFFFFF' }}>
                <svg
                  className="vs-schematic-desktop"
                  viewBox="0 0 500 206"
                  width="100%"
                  role="img"
                  aria-label="Comparison diagram showing passive visibility trackers charging 95 to 579 dollars per month with zero fixes versus Verisource Read-Write Action Engine."
                >
                  <g transform="translate(12, 16)">
                    <rect width="222" height="174" rx="8" fill="#FEF2F2" stroke="#FECACA" />
                    <text x="16" y="26" fill="#991B1B" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✕ LEGACY READ-ONLY TRACKERS
                    </text>
                    <text x="16" y="48" fill="#0A0E17" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="600">
                      $95–$579+/mo · Passive Charts
                    </text>
                    <line x1="16" y1="60" x2="206" y2="60" stroke="#FECACA" />
                    <text x="16" y="82" fill="#7F1D1D" fontSize="9" fontFamily="var(--vs-mono)">
                      • 0 on-site JSON-LD fixes
                    </text>
                    <text x="16" y="103" fill="#7F1D1D" fontSize="9" fontFamily="var(--vs-mono)">
                      • 0 /llms.txt or /agents.md
                    </text>
                    <text x="16" y="124" fill="#7F1D1D" fontSize="9" fontFamily="var(--vs-mono)">
                      • 0 live HTTP verification
                    </text>
                    <text x="16" y="145" fill="#7F1D1D" fontSize="9" fontFamily="var(--vs-mono)">
                      • No Streamable HTTP /mcp
                    </text>
                  </g>

                  <path d="M 234 103 L 266 103" fill="none" stroke="#A7F3D0" strokeWidth="2.2" />
                  <path className="vs-signal-path-out" d="M 234 103 L 266 103" fill="none" stroke="#059669" strokeWidth="2.8" />

                  <g transform="translate(266, 16)">
                    <rect className="vs-pulse-ring" x="-4" y="-4" width="230" height="182" rx="11" fill="none" stroke="#059669" />
                    <rect width="222" height="174" rx="8" fill="#0A0E17" />
                    <circle className="vs-live-dot" cx="20" cy="22" r="3.2" fill="#34D399" />
                    <text x="30" y="26" fill="#34D399" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      VERISOURCE ENGINE
                    </text>
                    <text x="16" y="48" fill="#FFFFFF" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="600">
                      $49 / $99 / $249 ($0 Trial)
                    </text>
                    <line x1="16" y1="60" x2="206" y2="60" stroke="#1E293B" />
                    <text x="16" y="82" fill="#ECFDF5" fontSize="9" fontFamily="var(--vs-mono)">
                      ✓ 7-CMS 1-Click AI Prompts
                    </text>
                    <text x="16" y="103" fill="#ECFDF5" fontSize="9" fontFamily="var(--vs-mono)">
                      ✓ /llms.txt + /agents.md + UCP
                    </text>
                    <text x="16" y="124" fill="#ECFDF5" fontSize="9" fontFamily="var(--vs-mono)">
                      ✓ 4/4 Live HTTP Verify Loop
                    </text>
                    <text x="16" y="145" fill="#34D399" fontSize="9" fontFamily="var(--vs-mono)" fontWeight="600">
                      ✓ 15-Site Agency + /mcp API
                    </text>
                  </g>
                </svg>

                <svg
                  className="vs-schematic-mobile"
                  viewBox="0 0 320 144"
                  width="100%"
                  role="img"
                  aria-label="Mobile comparison showing passive trackers versus Verisource Read-Write Action Engine."
                >
                  <g transform="translate(6, 8)">
                    <rect width="308" height="44" rx="6" fill="#FEF2F2" stroke="#FECACA" />
                    <text x="154" y="20" textAnchor="middle" fill="#991B1B" fontSize="9.8" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✕ PASSIVE TRACKERS ($95–$579/MO)
                    </text>
                    <text x="154" y="35" textAnchor="middle" fill="#7F1D1D" fontSize="8.6" fontFamily="var(--vs-mono)">
                      Visibility charts only · Zero site fixes
                    </text>
                  </g>
                  <path d="M 160 52 L 160 72" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                  <path className="vs-signal-path-out" d="M 160 52 L 160 72" fill="none" stroke="#059669" strokeWidth="2.4" />
                  <g transform="translate(6, 72)">
                    <rect width="308" height="64" rx="7" fill="#0A0E17" />
                    <text x="14" y="23" fill="#34D399" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ VERISOURCE ($49 / $99 / $249 · $0 TRIAL)
                    </text>
                    <text x="14" y="43" fill="#FFFFFF" fontSize="8.6" fontFamily="var(--vs-mono)">
                      7-CMS Fixes · Live Verify · 15-Site WL · /mcp
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="vs-container">
        <div className="vs-bezel" style={{ marginBottom: '36px' }}>
          <div className="vs-card" style={{ overflow: 'hidden' }}>
            <div className="vs-table-wrap">
              <table className="vs-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Typical Pricing</th>
                <th>On-Site Fix Generation</th>
                <th>Agency White-Label</th>
                <th>Full Breakdown</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: 'var(--vs-surface-warm)' }}>
                <td>
                  <strong>Verisource (v1.0)</strong>
                </td>
                <td className="vs-mono">
                  $49 / $99 / $249 ($0 7-day trial)
                </td>
                <td>
                  <StatusBadge tone="pass">
                    7-CMS AI PROMPT + LIVE VERIFY
                  </StatusBadge>
                </td>
                <td>
                  <StatusBadge tone="pass">
                    15 SITES INCLUDED ($249/MO)
                  </StatusBadge>
                </td>
                <td>
                  <Link
                    href="/tutorial"
                    className="vs-mono"
                    style={{ fontSize: '12px', color: 'var(--vs-ink)' }}
                  >
                    Interactive Tour →
                  </Link>
                </td>
              </tr>
              {COMPETITOR_ALTERNATIVES.map((item) => (
                <tr key={item.slug}>
                  <td>
                    <strong>{item.competitorName}</strong>
                  </td>
                  <td style={{ color: 'var(--vs-ink-secondary)' }}>
                    {item.competitorPriceAnchor}
                  </td>
                  <td style={{ color: 'var(--vs-ink-secondary)' }}>
                    See detailed protocol matrix
                  </td>
                  <td style={{ color: 'var(--vs-ink-secondary)' }}>
                    Custom / higher-tier add-on
                  </td>
                  <td>
                    <Link
                      href={`/compare/${item.slug}`}
                      className="vs-btn vs-btn-secondary"
                      style={{ padding: '6px 11px', fontSize: '12px' }}
                    >
                      {`vs. ${item.competitorName} →`}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="vs-grid-2">
          {COMPETITOR_ALTERNATIVES.map((item) => (
            <div key={item.slug} className="vs-bezel">
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
                    {item.eyebrow}
                  </div>
                  <h2
                    style={{
                      fontSize: '19px',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {`Verisource vs. ${item.competitorName}`}
                  </h2>
                  <p
                    style={{
                      margin: '0 0 16px 0',
                      fontSize: '13.5px',
                      lineHeight: 1.58,
                      color: 'var(--vs-ink-secondary)',
                    }}
                  >
                    {item.answerFirstSummary}
                  </p>
                </div>
                <div>
                  <Link
                    href={`/compare/${item.slug}`}
                    className="vs-btn vs-btn-secondary"
                  >
                    {`Read Full ${item.competitorName} Comparison →`}
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
