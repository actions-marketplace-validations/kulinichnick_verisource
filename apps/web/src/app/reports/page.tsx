import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { CopyCommandPill, MetricLedgerCell, StatusBadge } from '@verisource/ui';
import { ReportsDirectoryClient } from '../../components/ReportsDirectoryClient';
import { getPublishedDomainScorecards } from '../../lib/published-reports';

export const metadata: Metadata = {
  title:
    'Live AI Search & Protocol Readiness Scorecards (50+ Audited Domains) | Verisource',
  description:
    'Inspect live HTTP AI search readiness scorecards across 50+ B2B SaaS, DevTools, and Shopify D2C domains: GPTBot WAF status, /llms.txt, /agents.md, and 3-pillar JSON-LD.',
  alternates: {
    canonical: 'https://verisource.dev/reports',
  },
  robots: { index: true, follow: true },
};

const GITHUB_ACTION_YAML = `- name: Verisource AI Search & Site Health Gate
  uses: kulinichnick/verisource@main
  with:
    url: \${{ env.PREVIEW_URL }}
    min-visibility-score: '65'`;

export default function PublicReportsDirectoryPage(): React.ReactElement {
  const reports = [...getPublishedDomainScorecards()].sort(
    (a, b) =>
      b.readinessScore - a.readinessScore || a.domain.localeCompare(b.domain)
  );

  const totalCount = reports.length;
  const avgScore =
    totalCount > 0
      ? Math.round(
          reports.reduce((acc, r) => acc + r.readinessScore, 0) / totalCount
        )
      : 0;
  const llmsLivePct =
    totalCount > 0
      ? Math.round(
          (reports.filter((r) => r.llmsTxtStatus === 'present').length /
            totalCount) *
            100
        )
      : 0;
  const customAgentsPct =
    totalCount > 0
      ? Math.round(
          (reports.filter((r) => r.agentsMdStatus === 'custom_enriched')
            .length /
            totalCount) *
            100
        )
      : 0;
  const fullJsonLdPct =
    totalCount > 0
      ? Math.round(
          (reports.filter((r) => r.jsonLdPillarsPassed >= 3).length /
            totalCount) *
            100
        )
      : 0;

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Verisource Live AI Search & Protocol Readiness Directory',
        url: 'https://verisource.dev/reports',
        description: `Empirical HTTP readiness scorecards across ${totalCount} B2B SaaS, DevTools, and Shopify D2C domains.`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: totalCount,
          itemListElement: reports.slice(0, 50).map((r, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: `${r.brandName} (${r.domain}) AI Search Readiness Report`,
            url: `https://verisource.dev/report/${r.domain}`,
          })),
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How are Verisource public domain scorecards measured?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Every scorecard runs real outbound HTTPS requests testing GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot robots.txt and edge WAF responses, /llms.txt, /agents.md, Shopify /api/ucp/mcp, and 3-pillar schema.org JSON-LD.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do engineering teams gate pull requests against AI search regressions?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Add uses: kulinichnick/verisource@main (or run npx @verisource/cli verify <url> --github-summary) in GitHub Actions to block broken internal links, missing JSON-LD schemas, or accidental AI bot WAF blocks before merge.',
            },
          },
        ],
      },
    ],
  };

  return (
    <div
      className="vs-container"
      style={{ paddingTop: '44px', paddingBottom: '72px' }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      <div style={{ marginBottom: '26px', maxWidth: '860px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <StatusBadge tone="pass">{`${totalCount} LIVE HTTPS SCORECARDS`}</StatusBadge>
          <StatusBadge>ZERO SURVEY ESTIMATES</StatusBadge>
        </div>

        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            margin: '0 0 12px 0',
          }}
        >
          Every domain probed over HTTPS.
        </h1>

        <p
          style={{
            fontSize: '16px',
            color: 'var(--vs-ink-secondary)',
            lineHeight: 1.6,
            margin: '0 0 18px 0',
          }}
        >
          Inspect measured protocol readiness across {totalCount} B2B SaaS,
          DevTools, and Shopify D2C brands—covering{' '}
          <code className="vs-mono">GPTBot</code> and{' '}
          <code className="vs-mono">PerplexityBot</code> WAF status,{' '}
          <code className="vs-mono">/llms.txt</code>,{' '}
          <code className="vs-mono">/agents.md</code>, and 3-pillar{' '}
          <code className="vs-mono">JSON-LD</code>.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <Link href="/#scan" className="vs-btn vs-btn-primary">
            Scan Your Own Domain Free →
          </Link>
          <Link
            href="/api/checkout?plan=tripwire_19&cycle=one_time"
            className="vs-btn vs-btn-secondary"
          >
            Activate $19 One-Time Audit Pass →
          </Link>
          <Link
            href="/benchmarks/ai-search-readiness-2026"
            className="vs-btn vs-btn-secondary"
          >
            Read 40-Domain Research Paper →
          </Link>
        </div>
      </div>

      <div
        className="vs-grid-4"
        style={{ gap: '12px', marginBottom: '24px' }}
      >
        <MetricLedgerCell
          label="Audited Domains"
          value={`${totalCount}`}
          sublabel="Indexed /report/[domain] pages"
        />
        <MetricLedgerCell
          label="Mean Readiness"
          value={`${avgScore}/100`}
          sublabel={`Live /llms.txt on ${llmsLivePct}%`}
        />
        <MetricLedgerCell
          label="Custom /agents.md"
          value={`${customAgentsPct}%`}
          sublabel="Verified pricing & policy rules"
          tone={customAgentsPct >= 25 ? 'pass' : 'warn'}
        />
        <MetricLedgerCell
          label="3/3 JSON-LD Pillars"
          value={`${fullJsonLdPct}%`}
          sublabel="Entity + FAQPage + Offer"
          tone={fullJsonLdPct >= 25 ? 'pass' : 'warn'}
        />
      </div>

      <ReportsDirectoryClient reports={reports} />

      <section
        className="vs-card"
        style={{
          marginTop: '28px',
          padding: '22px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          alignItems: 'center',
        }}
      >
        <div>
          <span className="vs-eyebrow">TURNKEY GITHUB ACTION PR GATE</span>
          <h2
            style={{
              fontSize: '20px',
              margin: '6px 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Block AI visibility &amp; broken-link regressions in CI.
          </h2>
          <p
            style={{
              margin: '0 0 12px 0',
              fontSize: '13.5px',
              color: 'var(--vs-ink-secondary)',
              lineHeight: 1.55,
            }}
          >
            Drop 4 lines of YAML into <code className="vs-mono">.github/workflows</code>{' '}
            to enforce <code className="vs-mono">JSON-LD</code>,{' '}
            <code className="vs-mono">/llms.txt</code>,{' '}
            <code className="vs-mono">/agents.md</code>, and broken-link checks on
            every Vercel or Netlify preview URL—complete with native{' '}
            <code className="vs-mono">$GITHUB_STEP_SUMMARY</code> PR tables.
          </p>
          <CopyCommandPill command="npx @verisource/cli verify https://verisource.dev --github-summary" />
        </div>

        <div className="vs-terminal-frame">
          <div className="vs-terminal-chrome">
            <span>.github/workflows/verisource.yml</span>
            <StatusBadge tone="pass">COMPOSITE ACTION</StatusBadge>
          </div>
          <pre
            className="vs-terminal-body vs-mono"
            style={{
              margin: 0,
              fontSize: '12px',
              lineHeight: 1.55,
              overflowX: 'auto',
            }}
          >
            {GITHUB_ACTION_YAML}
          </pre>
        </div>
      </section>
    </div>
  );
}
