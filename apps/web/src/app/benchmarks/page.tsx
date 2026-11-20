import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { GtmDomainScanHandoff } from '../../components/GtmDomainScanHandoff';
import {
  BENCHMARK_STUDY_META,
  BENCHMARK_VERTICAL_SUMMARIES,
} from '../../lib/benchmark-study-2026';

export const metadata: Metadata = {
  title:
    'AI Search & Agent Readiness Benchmarks — Empirical HTTP Research | Verisource',
  description:
    'Reproducible empirical HTTP studies measuring /llms.txt, /agents.md, Shopify /api/ucp/mcp, FAQPage JSON-LD, and AI crawler WAF access across B2B SaaS, D2C commerce, agencies, and local service brands.',
  alternates: {
    canonical: 'https://verisource.dev/benchmarks',
  },
};

const BENCHMARKS_HUB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Verisource AI Search & Agent Readiness Research Hub',
  url: 'https://verisource.dev/benchmarks',
  description:
    'Empirical HTTP benchmarks measuring /llms.txt, /agents.md, JSON-LD, Shopify UCP, and AI crawler WAF rules across commercial websites.',
  hasPart: [
    {
      '@type': 'Dataset',
      name: BENCHMARK_STUDY_META.title,
      description: BENCHMARK_STUDY_META.metaDescription,
      url: BENCHMARK_STUDY_META.canonicalUrl,
      license: 'https://creativecommons.org/licenses/by/4.0/',
      isAccessibleForFree: true,
      creator: {
        '@type': 'Organization',
        name: 'Verisource',
        url: 'https://verisource.dev',
      },
    },
  ],
};

export default function BenchmarksIndexPage(): React.ReactElement {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(BENCHMARKS_HUB_JSON_LD),
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
              <StatusBadge tone="pass">EMPIRICAL HTTP TELEMETRY</StatusBadge>
              <StatusBadge>ZERO FABRICATED SURVEY ESTIMATES</StatusBadge>
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
              AI Search &amp; Agent Readiness Benchmarks.
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
              Every Verisource benchmark study is backed by direct, timestamped
              HTTPS requests checking <code className="vs-mono">/robots.txt</code>
              , simulated <code className="vs-mono">GPTBot</code> and{' '}
              <code className="vs-mono">PerplexityBot</code> edge WAF responses,{' '}
              <code className="vs-mono">/llms.txt</code> and{' '}
              <code className="vs-mono">/agents.md</code> payloads, Shopify{' '}
              <code className="vs-mono">/api/ucp/mcp</code> handshakes, and
              server-rendered <code className="vs-mono">JSON-LD</code> graphs.
            </p>
          </div>

          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div className="vs-schematic-header">
                <span className="vs-eyebrow" style={{ fontSize: '10.5px' }}>
                  FIG 10 · 2026 40-DOMAIN EMPIRICAL READINESS GAPS
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
                  N = 40 LIVE PROBES
                </span>
              </div>

              <div style={{ padding: '14px 12px', background: '#FFFFFF' }}>
                <svg
                  className="vs-schematic-desktop"
                  viewBox="0 0 500 206"
                  width="100%"
                  role="img"
                  aria-label="Empirical bar chart of 40 public domains showing 95 percent missing custom /agents.md, 92.5 percent missing FAQPage JSON-LD, 82.5 percent missing curated /llms.txt, and 17.5 percent blocking GPTBot at the edge WAF."
                >
                  <g transform="translate(14, 14)">
                    <text x="0" y="12" fill="#0A0E17" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      MISSING CUSTOM /AGENTS.MD
                    </text>
                    <text x="472" y="12" textAnchor="end" fill="#991B1B" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      95.0% (38/40)
                    </text>
                    <rect x="0" y="18" width="472" height="14" rx="4" fill="#F3F1EB" />
                    <rect x="0" y="18" width="448" height="14" rx="4" fill="#0A0E17" />
                    <circle className="vs-live-dot" cx="440" cy="25" r="2.8" fill="#34D399" />
                  </g>

                  <g transform="translate(14, 60)">
                    <text x="0" y="12" fill="#0A0E17" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      MISSING FAQPAGE JSON-LD
                    </text>
                    <text x="472" y="12" textAnchor="end" fill="#991B1B" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      92.5% (37/40)
                    </text>
                    <rect x="0" y="18" width="472" height="14" rx="4" fill="#F3F1EB" />
                    <rect x="0" y="18" width="436" height="14" rx="4" fill="#0A0E17" />
                  </g>

                  <g transform="translate(14, 106)">
                    <text x="0" y="12" fill="#0A0E17" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      NO CURATED /LLMS.TXT
                    </text>
                    <text x="472" y="12" textAnchor="end" fill="#92400E" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      82.5% (33/40)
                    </text>
                    <rect x="0" y="18" width="472" height="14" rx="4" fill="#F3F1EB" />
                    <rect x="0" y="18" width="389" height="14" rx="4" fill="#D97706" />
                  </g>

                  <g transform="translate(14, 152)">
                    <text x="0" y="12" fill="#0A0E17" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      SILENT GPTBOT WAF 403 BLOCK
                    </text>
                    <text x="472" y="12" textAnchor="end" fill="#991B1B" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      17.5% (7/40)
                    </text>
                    <rect x="0" y="18" width="472" height="14" rx="4" fill="#F3F1EB" />
                    <rect x="0" y="18" width="83" height="14" rx="4" fill="#DC2626" />
                  </g>
                </svg>

                <svg
                  className="vs-schematic-mobile"
                  viewBox="0 0 320 148"
                  width="100%"
                  role="img"
                  aria-label="Mobile chart showing 2026 40-domain empirical AI readiness gaps."
                >
                  <g transform="translate(8, 10)">
                    <text x="0" y="11" fill="#0A0E17" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="700">
                      MISSING /AGENTS.MD: 95.0%
                    </text>
                    <rect x="0" y="16" width="304" height="10" rx="3" fill="#F3F1EB" />
                    <rect x="0" y="16" width="288" height="10" rx="3" fill="#0A0E17" />
                  </g>
                  <g transform="translate(8, 44)">
                    <text x="0" y="11" fill="#0A0E17" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="700">
                      MISSING FAQPAGE JSON-LD: 92.5%
                    </text>
                    <rect x="0" y="16" width="304" height="10" rx="3" fill="#F3F1EB" />
                    <rect x="0" y="16" width="281" height="10" rx="3" fill="#0A0E17" />
                  </g>
                  <g transform="translate(8, 78)">
                    <text x="0" y="11" fill="#0A0E17" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="700">
                      NO CURATED /LLMS.TXT: 82.5%
                    </text>
                    <rect x="0" y="16" width="304" height="10" rx="3" fill="#F3F1EB" />
                    <rect x="0" y="16" width="250" height="10" rx="3" fill="#D97706" />
                  </g>
                  <g transform="translate(8, 112)">
                    <text x="0" y="11" fill="#991B1B" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="700">
                      SILENT EDGE WAF 403: 17.5%
                    </text>
                    <rect x="0" y="16" width="304" height="10" rx="3" fill="#F3F1EB" />
                    <rect x="0" y="16" width="54" height="10" rx="3" fill="#DC2626" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="vs-container">
        <div className="vs-bezel" style={{ marginBottom: '32px' }}>
          <div
            className="vs-card"
            style={{
              padding: '24px',
              background: 'var(--vs-surface)',
            }}
          >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <StatusBadge tone="pass">FLAGSHIP DATASET · LIVE</StatusBadge>
              <StatusBadge>
                {BENCHMARK_STUDY_META.probedDateDisplay.toUpperCase()} · N ={' '}
                {BENCHMARK_STUDY_META.totalDomains}
              </StatusBadge>
            </div>
            <span
              className="vs-mono"
              style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
            >
              Published {BENCHMARK_STUDY_META.probedDateIso}
            </span>
          </div>

          <h2
            style={{
              fontSize: '23px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 10px 0',
            }}
          >
            <Link
              href="/benchmarks/ai-search-readiness-2026"
              style={{ color: 'var(--vs-ink)', textDecoration: 'none' }}
            >
              {BENCHMARK_STUDY_META.title} →
            </Link>
          </h2>

          <p
            style={{
              fontSize: '14.5px',
              lineHeight: 1.62,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 18px 0',
              maxWidth: '860px',
            }}
          >
            {BENCHMARK_STUDY_META.answerFirstSummary}
          </p>

          <div
            className="vs-table-wrap"
            style={{
              border: '1px solid var(--vs-border)',
              borderRadius: '8px',
              marginBottom: '18px',
            }}
          >
            <table className="vs-table">
              <thead>
                <tr>
                  <th>Cohort (10 Domains Each)</th>
                  <th>Custom /llms.txt</th>
                  <th>Custom /agents.md</th>
                  <th>FAQPage JSON-LD</th>
                  <th>Key Vertical Takeaway</th>
                </tr>
              </thead>
              <tbody>
                {BENCHMARK_VERTICAL_SUMMARIES.map((v) => (
                  <tr key={v.verticalId}>
                    <td>
                      <strong>{v.verticalLabel}</strong>
                    </td>
                    <td className="vs-mono">
                      {Math.round((v.llmsCustomCount / v.sampleSize) * 100)}%
                    </td>
                    <td className="vs-mono">
                      {Math.round((v.agentsCustomCount / v.sampleSize) * 100)}%
                    </td>
                    <td className="vs-mono">
                      {Math.round((v.faqSchemaCount / v.sampleSize) * 100)}%
                    </td>
                    <td
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--vs-ink-secondary)',
                      }}
                    >
                      {v.keyObservation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link href="/benchmarks/ai-search-readiness-2026" className="vs-btn">
              Read Full 40-Domain Benchmark &amp; Dataset →
            </Link>
            <Link href="/tools" className="vs-btn vs-btn-secondary">
              Run Free Zero-Signup Protocol Validators
            </Link>
            <Link href="/templates" className="vs-btn vs-btn-secondary">
              Copy 7-CMS Starter Templates
            </Link>
          </div>
          </div>
        </div>

        <GtmDomainScanHandoff />
      </div>
    </div>
  );
}
