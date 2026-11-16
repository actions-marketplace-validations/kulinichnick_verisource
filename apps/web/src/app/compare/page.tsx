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
        <div className="vs-container">
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
      </section>

      <div className="vs-container">
        <div className="vs-card vs-table-wrap" style={{ marginBottom: '36px' }}>
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

        <div className="vs-grid-2">
          {COMPETITOR_ALTERNATIVES.map((item) => (
            <div
              key={item.slug}
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
          ))}
        </div>

        <GtmDomainScanHandoff />
      </div>
    </div>
  );
}
