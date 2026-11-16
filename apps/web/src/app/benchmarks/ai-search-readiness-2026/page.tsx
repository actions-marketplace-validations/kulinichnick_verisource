import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';
import { BenchmarkCohortExplorerClient } from '../../../components/BenchmarkCohortExplorerClient';
import { GtmDomainScanHandoff } from '../../../components/GtmDomainScanHandoff';
import {
  BENCHMARK_AGGREGATE_METRICS,
  BENCHMARK_FAQS,
  BENCHMARK_KEY_FINDINGS,
  BENCHMARK_STUDY_META,
  BENCHMARK_VERTICAL_SUMMARIES,
} from '../../../lib/benchmark-study-2026';

export const metadata: Metadata = {
  title: BENCHMARK_STUDY_META.metaTitle,
  description: BENCHMARK_STUDY_META.metaDescription,
  alternates: {
    canonical: BENCHMARK_STUDY_META.canonicalUrl,
  },
  openGraph: {
    title: BENCHMARK_STUDY_META.title,
    description: BENCHMARK_STUDY_META.metaDescription,
    url: BENCHMARK_STUDY_META.canonicalUrl,
    siteName: 'Verisource',
    type: 'article',
  },
};

const DATASET_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: BENCHMARK_STUDY_META.title,
  description: BENCHMARK_STUDY_META.metaDescription,
  url: BENCHMARK_STUDY_META.canonicalUrl,
  datePublished: BENCHMARK_STUDY_META.probedDateIso,
  dateModified: BENCHMARK_STUDY_META.probedDateIso,
  isAccessibleForFree: true,
  creator: {
    '@type': 'Organization',
    name: 'Verisource',
    url: 'https://verisource.dev',
  },
  variableMeasured: [
    'Custom /llms.txt HTTP 200 Adoption Rate',
    'Custom /agents.md vs. Stock Shopify Boilerplate Rate',
    'Homepage application/ld+json and FAQPage Schema Adoption',
    'GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot robots.txt vs. Edge WAF HTTP 403 Rate',
    'Shopify /api/ucp/mcp Universal Commerce Protocol Readiness',
  ],
};

const ARTICLE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: BENCHMARK_STUDY_META.title,
  description: BENCHMARK_STUDY_META.metaDescription,
  datePublished: BENCHMARK_STUDY_META.probedDateIso,
  dateModified: BENCHMARK_STUDY_META.probedDateIso,
  author: {
    '@type': 'Organization',
    name: 'Verisource',
    url: 'https://verisource.dev',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Verisource',
    url: 'https://verisource.dev',
  },
  mainEntityOfPage: BENCHMARK_STUDY_META.canonicalUrl,
};

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: BENCHMARK_FAQS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export default function AiSearchReadinessBenchmark2026Page(): React.ReactElement {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(DATASET_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
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
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <Link
              href="/benchmarks"
              className="vs-mono"
              style={{
                fontSize: '12px',
                color: 'var(--vs-ink-secondary)',
                textDecoration: 'none',
              }}
            >
              ← /benchmarks
            </Link>
            <StatusBadge tone="pass">
              EMPIRICAL HTTP RESEARCH · {BENCHMARK_STUDY_META.probedDateDisplay.toUpperCase()}
            </StatusBadge>
            <StatusBadge>
              N = {BENCHMARK_STUDY_META.totalDomains} PUBLIC DOMAINS ·{' '}
              {BENCHMARK_STUDY_META.verticalCount} VERTICALS
            </StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 3.8vw, 44px)',
              lineHeight: 1.09,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: '0 0 18px 0',
              maxWidth: '900px',
            }}
          >
            2026 AI Search &amp; Agent Readiness Benchmark:{' '}
            <code className="vs-mono">/llms.txt</code>,{' '}
            <code className="vs-mono">/agents.md</code> &amp; Silent{' '}
            <code className="vs-mono">GPTBot</code> WAF Blocks.
          </h1>

          {/* Answer-First 50-Word Empirical Abstract */}
          <div
            className="vs-card"
            style={{
              padding: '16px 20px',
              background: 'var(--vs-surface)',
              maxWidth: '880px',
            }}
          >
            <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
              EXECUTIVE EMPIRICAL SUMMARY · VERIFIED HTTP TELEMETRY (
              {BENCHMARK_STUDY_META.probedDateIso})
            </div>
            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.62,
                color: 'var(--vs-ink)',
                margin: 0,
              }}
            >
              {BENCHMARK_STUDY_META.answerFirstSummary}
            </p>
          </div>
        </div>
      </section>

      <div className="vs-container">
        {/* Top 4-Metric Ledger Strip */}
        <div className="vs-grid-4" style={{ marginBottom: '34px' }}>
          <div className="vs-card">
            <MetricLedgerCell
              label="Custom /llms.txt"
              value={`${BENCHMARK_AGGREGATE_METRICS.llmsCustomPct.toFixed(1)}%`}
              sublabel={`${BENCHMARK_AGGREGATE_METRICS.llmsCustomCount}/40 curated · ${BENCHMARK_AGGREGATE_METRICS.llmsBoilerplateCount}/40 boilerplate · ${BENCHMARK_AGGREGATE_METRICS.llmsSoft404Count}/40 soft-404`}
            />
          </div>
          <div className="vs-card">
            <MetricLedgerCell
              label="Custom /agents.md"
              value={`${BENCHMARK_AGGREGATE_METRICS.agentsCustomPct.toFixed(1)}%`}
              sublabel={`${BENCHMARK_AGGREGATE_METRICS.agentsCustomCount}/40 custom (vercel.com, linear.app) · ${BENCHMARK_AGGREGATE_METRICS.agentsBoilerplateCount}/40 stock Shopify`}
            />
          </div>
          <div className="vs-card">
            <MetricLedgerCell
              label="Homepage FAQPage Schema"
              value={`${BENCHMARK_AGGREGATE_METRICS.faqSchemaPct.toFixed(1)}%`}
              sublabel={`${BENCHMARK_AGGREGATE_METRICS.faqSchemaCount}/40 include FAQPage vs. ${BENCHMARK_AGGREGATE_METRICS.jsonLdAnyCount}/40 (${BENCHMARK_AGGREGATE_METRICS.jsonLdAnyPct}%) with base JSON-LD`}
            />
          </div>
          <div className="vs-card">
            <MetricLedgerCell
              label="Silent Edge WAF 403 Blocks"
              value={`${BENCHMARK_AGGREGATE_METRICS.botWafRestrictedPct.toFixed(1)}%`}
              sublabel={`${BENCHMARK_AGGREGATE_METRICS.botWafRestrictedCount}/40 return HTTP 403 to GPTBot despite 0/40 blocking in /robots.txt`}
            />
          </div>
        </div>

        {/* Server-Rendered Cross-Vertical Matrix Table */}
        <div className="vs-card" style={{ marginBottom: '36px', overflow: 'hidden' }}>
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
              Cross-Vertical Readiness Matrix (N = 40 Live-Probed Public Domains)
            </strong>
            <span
              className="vs-mono"
              style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
            >
              Probed {BENCHMARK_STUDY_META.probedDateIso} · {BENCHMARK_STUDY_META.requestsPerDomain}
            </span>
          </div>

          <div className="vs-table-wrap">
            <table className="vs-table">
            <thead>
              <tr>
                <th>Industry Cohort</th>
                <th>Sample</th>
                <th>Custom /llms.txt</th>
                <th>Auto Boilerplate</th>
                <th>Custom /agents.md</th>
                <th>Base JSON-LD</th>
                <th>FAQPage Schema</th>
                <th>WAF HTTP 403</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK_VERTICAL_SUMMARIES.map((v) => (
                <tr key={v.verticalId}>
                  <td>
                    <strong>{v.verticalLabel}</strong>
                  </td>
                  <td className="vs-mono">{v.sampleSize}</td>
                  <td className="vs-mono">
                    {v.llmsCustomCount}/{v.sampleSize} (
                    {Math.round((v.llmsCustomCount / v.sampleSize) * 100)}%)
                  </td>
                  <td className="vs-mono">
                    {v.llmsBoilerplateCount}/{v.sampleSize} (
                    {Math.round((v.llmsBoilerplateCount / v.sampleSize) * 100)}%)
                  </td>
                  <td className="vs-mono">
                    {v.agentsCustomCount}/{v.sampleSize} (
                    {Math.round((v.agentsCustomCount / v.sampleSize) * 100)}%)
                  </td>
                  <td className="vs-mono">
                    {v.jsonLdAnyCount}/{v.sampleSize} (
                    {Math.round((v.jsonLdAnyCount / v.sampleSize) * 100)}%)
                  </td>
                  <td className="vs-mono">
                    {v.faqSchemaCount}/{v.sampleSize} (
                    {Math.round((v.faqSchemaCount / v.sampleSize) * 100)}%)
                  </td>
                  <td className="vs-mono">
                    {v.botWafRestrictedCount}/{v.sampleSize} (
                    {Math.round((v.botWafRestrictedCount / v.sampleSize) * 100)}%)
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--vs-surface-subtle)', fontWeight: 700 }}>
                <td>All Cohorts Combined</td>
                <td className="vs-mono">40</td>
                <td className="vs-mono">20/40 (50.0%)</td>
                <td className="vs-mono">7/40 (17.5%)</td>
                <td className="vs-mono">2/40 (5.0%)</td>
                <td className="vs-mono">33/40 (82.5%)</td>
                <td className="vs-mono">3/40 (7.5%)</td>
                <td className="vs-mono">2/40 (5.0%)</td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>

        {/* 4 Key Architectural Findings (2-Column Editorial Grid) */}
        <section style={{ marginBottom: '38px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            KEY ARCHITECTURAL TAKEAWAYS
          </div>
          <h2
            style={{
              fontSize: '24px',
              letterSpacing: '-0.025em',
              fontWeight: 700,
              margin: '0 0 16px 0',
            }}
          >
            Four protocol gaps separating cited brands from invisible domains
          </h2>

          <div className="vs-grid-2">
            {BENCHMARK_KEY_FINDINGS.map((finding) => (
              <div
                key={finding.id}
                className="vs-card"
                style={{ padding: '20px' }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <StatusBadge tone="warn">{finding.badge}</StatusBadge>
                </div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    letterSpacing: '-0.015em',
                    margin: '0 0 8px 0',
                  }}
                >
                  {finding.headline}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: 'var(--vs-ink-secondary)',
                    margin: 0,
                  }}
                >
                  {finding.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive 40-Domain Cohort Explorer */}
        <BenchmarkCohortExplorerClient />

        {/* Reproducible Methodology & Open Validators */}
        <section
          className="vs-card"
          style={{ padding: '22px 24px', marginBottom: '36px' }}
        >
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            METHODOLOGY &amp; REPRODUCIBILITY SPECIFICATION
          </div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 10px 0',
            }}
          >
            How every domain was probed and classified
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.62,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 14px 0',
            }}
          >
            Each of the 40 public domains was probed directly over HTTPS using
            the same deterministic parser powering Verisource&apos;s production
            scanner: (1) <code className="vs-mono">GET /robots.txt</code> parsed
            for <code className="vs-mono">GPTBot</code>,{' '}
            <code className="vs-mono">OAI-SearchBot</code>,{' '}
            <code className="vs-mono">PerplexityBot</code>,{' '}
            <code className="vs-mono">ClaudeBot</code>, and{' '}
            <code className="vs-mono">Google-Extended</code> directives; (2)
            homepage requests sent with explicit{' '}
            <code className="vs-mono">GPTBot/1.2</code> and{' '}
            <code className="vs-mono">PerplexityBot/1.0</code>{' '}
            <code className="vs-mono">User-Agent</code> headers to catch silent
            CDN <code className="vs-mono">HTTP 403</code> /{' '}
            <code className="vs-mono">429</code> blocks; (3){' '}
            <code className="vs-mono">GET /llms.txt</code> and{' '}
            <code className="vs-mono">GET /agents.md</code> inspected for{' '}
            <code className="vs-mono">text/html</code> SPA soft-404s and stock
            Shopify (<code className="vs-mono">shop.app/SKILL.md</code>) or SEO
            plugin boilerplate; (4) homepage{' '}
            <code className="vs-mono">application/ld+json</code> script nodes
            parsed for <code className="vs-mono">FAQPage</code> entities; and
            (5) JSON-RPC <code className="vs-mono">tools/list</code> handshakes
            tested against <code className="vs-mono">/api/ucp/mcp</code> and{' '}
            <code className="vs-mono">/api/mcp</code> on D2C commerce stores.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link
              href="/tools/llms-txt-validator"
              className="vs-btn vs-btn-secondary"
            >
              Free /llms.txt &amp; /agents.md Validator →
            </Link>
            <Link
              href="/tools/ai-crawler-waf-checker"
              className="vs-btn vs-btn-secondary"
            >
              Free GPTBot &amp; PerplexityBot WAF Checker →
            </Link>
            <Link
              href="/tools/shopify-ai-readiness-checker"
              className="vs-btn vs-btn-secondary"
            >
              Free Shopify /api/ucp/mcp Checker →
            </Link>
            <Link href="/templates" className="vs-btn vs-btn-secondary">
              Copy 7-CMS Starter Templates
            </Link>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section style={{ marginBottom: '20px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            BENCHMARK FAQ
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 14px 0',
            }}
          >
            Common questions about the 2026 AI Search Readiness dataset
          </h2>

          <div className="vs-stack" style={{ gap: '12px' }}>
            {BENCHMARK_FAQS.map((faq) => (
              <div
                key={faq.question}
                className="vs-card"
                style={{ padding: '16px 20px' }}
              >
                <strong
                  style={{
                    display: 'block',
                    fontSize: '15px',
                    marginBottom: '6px',
                  }}
                >
                  {faq.question}
                </strong>
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: 'var(--vs-ink-secondary)',
                    margin: 0,
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <GtmDomainScanHandoff
          eyebrow="BENCHMARK YOUR OWN DOMAIN IN 60 SECONDS"
          headline="See how your website stacks up against the 40-domain 2026 readiness cohort."
        />
      </div>
    </div>
  );
}
