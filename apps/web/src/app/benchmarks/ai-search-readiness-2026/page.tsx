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

        {/* DevTools /llms.txt vs. /agents.md Empirical Addendum */}
        <section style={{ marginBottom: '36px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            NOVEMBER 2026 ADDENDUM · DEVELOPER INFRASTRUCTURE COHORT (N = 10)
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 10px 0',
            }}
          >
            90% of DevTools ship <code className="vs-mono">/llms.txt</code>. Only
            20% ship <code className="vs-mono">/agents.md</code>.
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.62,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 16px 0',
              maxWidth: '840px',
            }}
          >
            In a follow-up live HTTP probe across 10 developer infrastructure
            and B2B SaaS domains (<code className="vs-mono">trigger.dev</code>,{' '}
            <code className="vs-mono">inngest.com</code>,{' '}
            <code className="vs-mono">turso.tech</code>,{' '}
            <code className="vs-mono">tinybird.co</code>,{' '}
            <code className="vs-mono">knock.app</code>,{' '}
            <code className="vs-mono">workos.com</code>,{' '}
            <code className="vs-mono">stytch.com</code>,{' '}
            <code className="vs-mono">upstash.com</code>,{' '}
            <code className="vs-mono">highlight.io</code>, and{' '}
            <code className="vs-mono">infisical.com</code>), 9 of 10 (90.0%)
            served a valid <code className="vs-mono">/llms.txt</code>{' '}
            directory, yet only 2 of 10 (20.0% —{' '}
            <code className="vs-mono">tinybird.co</code> and{' '}
            <code className="vs-mono">infisical.com</code>) published a custom{' '}
            <code className="vs-mono">/agents.md</code> pricing and limits
            guardrail file, and only 1 of 10 (10.0% —{' '}
            <code className="vs-mono">upstash.com</code>) shipped all 3{' '}
            <code className="vs-mono">JSON-LD</code> pillars.
          </p>

          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div className="vs-table-wrap">
                <table className="vs-table">
                  <thead>
                    <tr>
                      <th>Protocol / Schema Signal</th>
                      <th>DevTools Cohort (N = 10)</th>
                      <th>Commercial Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="vs-mono">/llms.txt (HTTP 200)</td>
                      <td>
                        <StatusBadge tone="pass">90.0% (9 / 10)</StatusBadge>
                      </td>
                      <td style={{ color: 'var(--vs-ink-secondary)' }}>
                        High documentation-link adoption across modern DevTools
                      </td>
                    </tr>
                    <tr>
                      <td className="vs-mono">Custom /agents.md</td>
                      <td>
                        <StatusBadge tone="warn">20.0% (2 / 10)</StatusBadge>
                      </td>
                      <td style={{ color: 'var(--vs-ink-secondary)' }}>
                        80% leave pricing tiers &amp; rate limits unguarded
                        against AI hallucination
                      </td>
                    </tr>
                    <tr>
                      <td className="vs-mono">Full 3-Pillar JSON-LD</td>
                      <td>
                        <StatusBadge tone="critical">10.0% (1 / 10)</StatusBadge>
                      </td>
                      <td style={{ color: 'var(--vs-ink-secondary)' }}>
                        90% omit FAQPage or Offer pricing nodes on root pages
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Expanded 90-Domain Cohort: The Headless Commerce AI Readiness Gap */}
        <section id="headless-commerce-gap" style={{ marginBottom: '38px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            EXPANDED HTTP INDEX (N = 90 LIVE SCORECARDS) · HEADLESS VS. NATIVE SHOPIFY
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 10px 0',
            }}
          >
            The 35.3-point Headless Commerce AI penalty:{' '}
            <span className="vs-mono" style={{ color: '#FCA5A5' }}>
              41.9
            </span>{' '}
            vs.{' '}
            <span className="vs-mono" style={{ color: '#6EE7B7' }}>
              77.2
            </span>{' '}
            on native Shopify OS 2.0.
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.62,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 18px 0',
              maxWidth: '850px',
            }}
          >
            Expanding the live HTTP index to 90 public domains (45 consumer
            commerce storefronts and 45 B2B SaaS / AI infrastructure platforms,
            all individually inspectable at{' '}
            <Link href="/reports" className="vs-mono" style={{ color: 'var(--vs-accent)' }}>
              /reports
            </Link>
            ) exposed a sharp architectural divide. Consumer brands running
            custom headless Next.js storefronts (<code className="vs-mono">whoop.com</code>{' '}
            34, <code className="vs-mono">drinkag1.com</code> 34,{' '}
            <code className="vs-mono">huckberry.com</code> 34,{' '}
            <code className="vs-mono">seed.com</code> 34,{' '}
            <code className="vs-mono">solostove.com</code> 34,{' '}
            <code className="vs-mono">bombas.com</code> 39) average{' '}
            <strong>41.9 out of 100</strong>—trailing native Shopify OS 2.0
            peers (<strong>77.2 out of 100</strong> across 34 stores) by{' '}
            <strong>35.3 points</strong> because custom headless builds drop{' '}
            <code className="vs-mono">/api/ucp/mcp</code>, strip server-rendered{' '}
            <code className="vs-mono">Product</code> /{' '}
            <code className="vs-mono">Offer</code>{' '}
            <code className="vs-mono">JSON-LD</code>, or trigger CDN WAF 403
            blocks on <code className="vs-mono">GPTBot</code> and{' '}
            <code className="vs-mono">PerplexityBot</code>.
          </p>

          {/* High-Contrast Dark-Studio SVG Bar Chart */}
          <div className="vs-bezel" style={{ marginBottom: '18px' }}>
            <div
              className="vs-card"
              style={{
                padding: '20px 22px',
                background: 'var(--vs-terminal)',
              }}
            >
              <div
                className="vs-eyebrow"
                style={{ marginBottom: '12px', color: '#E5A93C' }}
              >
                FIG 13 · MEAN AI SEARCH READINESS BY ARCHITECTURE (N = 90 PUBLIC DOMAINS)
              </div>
              <svg
                viewBox="0 0 760 176"
                width="100%"
                role="img"
                aria-label="Mean AI search readiness score by web architecture across 90 audited domains"
                style={{ display: 'block', height: 'auto' }}
              >
                {/* Row 1: Native Shopify OS 2.0 */}
                <text
                  x="0"
                  y="32"
                  fill="#EEF1F6"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  Native Shopify OS 2.0 (N=34)
                </text>
                <rect x="256" y="16" width="410" height="22" rx="5" fill="#171C26" />
                <rect x="256" y="16" width="316.5" height="22" rx="5" fill="#10B981" />
                <text
                  x="678"
                  y="32"
                  fill="#6EE7B7"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  77.2 / 100
                </text>

                {/* Row 2: B2B SaaS & AI Infra */}
                <text
                  x="0"
                  y="88"
                  fill="#EEF1F6"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  B2B SaaS &amp; AI Infra (N=45)
                </text>
                <rect x="256" y="72" width="410" height="22" rx="5" fill="#171C26" />
                <rect x="256" y="72" width="299.3" height="22" rx="5" fill="#E5A93C" />
                <text
                  x="678"
                  y="88"
                  fill="#E5A93C"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  73.0 / 100
                </text>

                {/* Row 3: Custom Headless Commerce */}
                <text
                  x="0"
                  y="144"
                  fill="#EEF1F6"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  Headless Next.js DTC (N=10)
                </text>
                <rect x="256" y="128" width="410" height="22" rx="5" fill="#171C26" />
                <rect x="256" y="128" width="171.8" height="22" rx="5" fill="#EF4444" />
                <text
                  x="678"
                  y="144"
                  fill="#FCA5A5"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  41.9 / 100
                </text>
              </svg>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link
              href="/vs?a=huckberry.com&b=rothys.com"
              className="vs-btn"
            >
              Inspect Huckberry (34) vs. Rothy&apos;s (81) Live →
            </Link>
            <Link
              href="/vs?a=seed.com&b=ritual.com"
              className="vs-btn vs-btn-secondary"
            >
              Inspect Seed (34) vs. Ritual (81) Live →
            </Link>
            <Link href="/reports" className="vs-btn vs-btn-secondary">
              Browse All 90 Domain Scorecards →
            </Link>
            <Link
              href="/guides/headless-nextjs-shopify-ai-search-fix"
              className="vs-btn vs-btn-secondary"
            >
              Read Headless Next.js Rescue Guide →
            </Link>
          </div>
        </section>

        {/* Expanded 160-Domain Cohort: The AI Agent & Enterprise SaaS Protocol Paradox */}
        <section id="ai-infra-paradox-160" style={{ marginBottom: '38px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            Q4 2026 FULL INDEX (N = 160 LIVE SCORECARDS) · AI INFRASTRUCTURE &amp; SAAS PARADOX
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 10px 0',
            }}
          >
            Across 160 audited domains, 74.4% publish{' '}
            <code className="vs-mono">/llms.txt</code>—yet 83.8% lack{' '}
            <code className="vs-mono">/agents.md</code> and 97.5% fail 3-pillar{' '}
            <code className="vs-mono">JSON-LD</code>.
          </h2>
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.62,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 18px 0',
              maxWidth: '850px',
            }}
          >
            Scaling our live HTTPS audit index to 160 recognizable commerce, B2B
            SaaS, and AI infrastructure domains (mean score{' '}
            <strong>68.4 out of 100</strong>) revealed an ironic blind spot
            inside the AI ecosystem itself. Across 18 foundational AI search,
            agent framework, and inference platforms (<code className="vs-mono">perplexity.ai</code>{' '}
            39, <code className="vs-mono">langchain.com</code> 52,{' '}
            <code className="vs-mono">groq.com</code> 52,{' '}
            <code className="vs-mono">langsmith.com</code> 52,{' '}
            <code className="vs-mono">daytona.io</code> 62,{' '}
            <code className="vs-mono">zed.dev</code> 62 vs.{' '}
            <code className="vs-mono">e2b.dev</code> 84 and{' '}
            <code className="vs-mono">warp.dev</code> 84),{' '}
            <strong>77.8% (14 of 18)</strong> publish a valid{' '}
            <code className="vs-mono">/llms.txt</code> directory—yet only{' '}
            <strong>11.1% (2 of 18)</strong> publish a verified{' '}
            <code className="vs-mono">/agents.md</code> pricing and rate-limit
            rulebook, and enterprise design leader{' '}
            <code className="vs-mono">figma.com</code> scores{' '}
            <strong>38 out of 100</strong> under edge crawler restrictions.
          </p>

          {/* FIG 14 Dark-Studio SVG Protocol Adoption Gap Chart */}
          <div className="vs-bezel" style={{ marginBottom: '18px' }}>
            <div
              className="vs-card"
              style={{
                padding: '20px 22px',
                background: 'var(--vs-terminal)',
              }}
            >
              <div
                className="vs-eyebrow"
                style={{ marginBottom: '12px', color: '#E5A93C' }}
              >
                FIG 14 · PROTOCOL COVERAGE ACROSS N = 160 LIVE AUDITED DOMAINS
              </div>
              <svg
                viewBox="0 0 760 182"
                width="100%"
                role="img"
                aria-label="Bar chart comparing /llms.txt adoption at 74.4%, verified /agents.md adoption at 16.2%, and 3-pillar JSON-LD completion at 2.5% across 160 public domains."
                style={{ display: 'block', height: 'auto' }}
              >
                {/* Row 1: /llms.txt Published */}
                <text
                  x="0"
                  y="32"
                  fill="#EEF1F6"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  /llms.txt Live (119 / 160)
                </text>
                <rect x="268" y="16" width="390" height="22" rx="5" fill="#171C26" />
                <rect x="268" y="16" width="290.2" height="22" rx="5" fill="#10B981" />
                <text
                  x="670"
                  y="32"
                  fill="#6EE7B7"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  74.4%
                </text>

                {/* Row 2: Custom Verified /agents.md */}
                <text
                  x="0"
                  y="88"
                  fill="#EEF1F6"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  Verified /agents.md (26 / 160)
                </text>
                <rect x="268" y="72" width="390" height="22" rx="5" fill="#171C26" />
                <rect x="268" y="72" width="63.2" height="22" rx="5" fill="#E5A93C" />
                <text
                  x="670"
                  y="88"
                  fill="#E5A93C"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  16.2%
                </text>

                {/* Row 3: Full 3-Pillar JSON-LD */}
                <text
                  x="0"
                  y="144"
                  fill="#EEF1F6"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  3-Pillar JSON-LD (4 / 160)
                </text>
                <rect x="268" y="128" width="390" height="22" rx="5" fill="#171C26" />
                <rect x="268" y="128" width="12" height="22" rx="5" fill="#EF4444" />
                <text
                  x="670"
                  y="144"
                  fill="#FCA5A5"
                  fontSize="13"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="700"
                >
                  2.5%
                </text>
              </svg>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link
              href="/vs/mistral-ai-vs-perplexity-ai"
              className="vs-btn"
            >
              Inspect Mistral (72) vs. Perplexity (39) →
            </Link>
            <Link
              href="/vs/webflow-com-vs-figma-com"
              className="vs-btn vs-btn-secondary"
            >
              Inspect Webflow (72) vs. Figma (38) →
            </Link>
            <Link href="/reports" className="vs-btn vs-btn-secondary">
              Browse All 200+ Domain Scorecards →
            </Link>
          </div>
        </section>

        {/* Empirical Addendum IV: Enterprise Fintech & HRIS WAF Penalty */}
        <section
          id="fintech-hris-waf-penalty"
          style={{ marginBottom: '44px' }}
        >
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            EMPIRICAL ADDENDUM IV · ENTERPRISE FINTECH &amp; HRIS WAF PENALTY
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px, 2.8vw, 28px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 12px 0',
            }}
          >
            Why enterprise fintech &amp; payroll platforms average 51.7 out of 100 (-16.7 pts)
          </h2>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.65,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 18px 0',
              maxWidth: '820px',
            }}
          >
            Security-conscious financial and HRIS teams routinely tighten Cloudflare
            and CDN bot rules without allowlisting commercial answer-engine crawlers.
            Across 7 audited enterprise spend, banking, equity, and payroll domains (
            <code className="vs-mono">mercury.com</code>,{' '}
            <code className="vs-mono">deel.com</code>,{' '}
            <code className="vs-mono">brex.com</code>,{' '}
            <code className="vs-mono">ramp.com</code>,{' '}
            <code className="vs-mono">rippling.com</code>,{' '}
            <code className="vs-mono">gusto.com</code>, and{' '}
            <code className="vs-mono">carta.com</code>), mean readiness drops to{' '}
            <strong>51.7 / 100</strong>—<strong>16.7 points</strong> below the
            broader SaaS and commerce index:
          </p>

          <div className="vs-grid-3" style={{ marginBottom: '20px', gap: '14px' }}>
            <div className="vs-card" style={{ padding: '16px 18px' }}>
              <div
                className="vs-mono"
                style={{ fontSize: '11px', color: 'var(--vs-ink-muted)', marginBottom: '4px' }}
              >
                EDGE WAF CRAWLER BLOCKS
              </div>
              <div
                className="vs-mono"
                style={{ fontSize: '24px', fontWeight: 700, color: '#FCA5A5', marginBottom: '6px' }}
              >
                42.9% (3 / 7)
              </div>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55, color: 'var(--vs-ink-secondary)' }}>
                <code className="vs-mono">rippling.com</code>,{' '}
                <code className="vs-mono">gusto.com</code>, and{' '}
                <code className="vs-mono">carta.com</code> restrict{' '}
                <code className="vs-mono">GPTBot</code> and{' '}
                <code className="vs-mono">PerplexityBot</code>; non-JS visible HTML
                on Gusto and Carta collapses to 3 words.
              </p>
            </div>

            <div className="vs-card" style={{ padding: '16px 18px' }}>
              <div
                className="vs-mono"
                style={{ fontSize: '11px', color: 'var(--vs-ink-muted)', marginBottom: '4px' }}
              >
                DEEL VS. RIPPLING PROTOCOL SPLIT
              </div>
              <div
                className="vs-mono"
                style={{ fontSize: '24px', fontWeight: 700, color: '#6EE7B7', marginBottom: '6px' }}
              >
                62 vs. 54
              </div>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55, color: 'var(--vs-ink-secondary)' }}>
                Even though <code className="vs-mono">rippling.com</code> ships{' '}
                <code className="vs-mono">/llms.txt</code> and 2 of 3{' '}
                <code className="vs-mono">JSON-LD</code> pillars, edge crawler
                blocks hand an +8-point lead to{' '}
                <code className="vs-mono">deel.com</code> (HTTP 200).
              </p>
            </div>

            <div className="vs-card" style={{ padding: '16px 18px' }}>
              <div
                className="vs-mono"
                style={{ fontSize: '11px', color: 'var(--vs-ink-muted)', marginBottom: '4px' }}
              >
                VERIFIED /AGENTS.MD FEE SPECS
              </div>
              <div
                className="vs-mono"
                style={{ fontSize: '24px', fontWeight: 700, color: '#E5A93C', marginBottom: '6px' }}
              >
                0.0% (0 / 7)
              </div>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55, color: 'var(--vs-ink-secondary)' }}>
                Zero audited fintech or payroll brands publish a verified{' '}
                <code className="vs-mono">/agents.md</code> fee guardrail (
                <code className="vs-mono">brex.com</code> 58 vs.{' '}
                <code className="vs-mono">ramp.com</code> 58), leaving fee comparisons
                to Reddit and affiliate blogs.
              </p>
            </div>
          </div>

          <div className="vs-bezel-obsidian" style={{ marginBottom: '18px' }}>
            <div
              style={{
                background: '#0E1116',
                borderRadius: '10px',
                padding: '20px 22px',
                border: '1px solid #262E3D',
              }}
            >
              <div
                className="vs-mono"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#E5A93C',
                  marginBottom: '14px',
                }}
              >
                FIG 15 · FINTECH &amp; HRIS AI READINESS LEADERBOARD (N = 7 ENTERPRISE PLATFORMS)
              </div>

              <svg
                viewBox="0 0 760 226"
                role="img"
                aria-label="Horizontal bar chart comparing AI readiness scores across 7 enterprise fintech and HRIS domains"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              >
                {/* Row 1: Mercury & Deel */}
                <text x="0" y="28" fill="#EEF1F6" fontSize="12.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="700">
                  mercury.com &amp; deel.com (HTTP 200)
                </text>
                <rect x="280" y="13" width="380" height="20" rx="4" fill="#171C26" />
                <rect x="280" y="13" width="235.6" height="20" rx="4" fill="#10B981" />
                <text x="672" y="28" fill="#6EE7B7" fontSize="12.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="700">
                  62 / 100
                </text>

                {/* Row 2: Brex & Ramp */}
                <text x="0" y="78" fill="#EEF1F6" fontSize="12.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="700">
                  brex.com &amp; ramp.com (Tied · 1/3 JSON-LD)
                </text>
                <rect x="280" y="63" width="380" height="20" rx="4" fill="#171C26" />
                <rect x="280" y="63" width="220.4" height="20" rx="4" fill="#E5A93C" />
                <text x="672" y="78" fill="#E5A93C" fontSize="12.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="700">
                  58 / 100
                </text>

                {/* Row 3: Rippling */}
                <text x="0" y="128" fill="#EEF1F6" fontSize="12.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="700">
                  rippling.com (/llms.txt + WAF Block)
                </text>
                <rect x="280" y="113" width="380" height="20" rx="4" fill="#171C26" />
                <rect x="280" y="113" width="205.2" height="20" rx="4" fill="#F59E0B" />
                <text x="672" y="128" fill="#FCD34D" fontSize="12.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="700">
                  54 / 100
                </text>

                {/* Row 4: Gusto & Carta */}
                <text x="0" y="178" fill="#EEF1F6" fontSize="12.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="700">
                  gusto.com &amp; carta.com (WAF · 3 SSR Words)
                </text>
                <rect x="280" y="163" width="380" height="20" rx="4" fill="#171C26" />
                <rect x="280" y="163" width="129.2" height="20" rx="4" fill="#EF4444" />
                <text x="672" y="178" fill="#FCA5A5" fontSize="12.5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontWeight="700">
                  34 / 100
                </text>

                {/* Baseline Reference Line */}
                <text x="280" y="214" fill="#94A3B8" fontSize="11" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                  Cohort Mean: 51.7 / 100 vs. 68.4 / 100 Overall Index Mean (-16.7 pts)
                </text>
              </svg>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link href="/vs/deel-com-vs-rippling-com" className="vs-btn">
              Inspect Deel (62) vs. Rippling (54) →
            </Link>
            <Link
              href="/vs/brex-com-vs-ramp-com"
              className="vs-btn vs-btn-secondary"
            >
              Inspect Brex (58) vs. Ramp (58) →
            </Link>
          </div>
        </section>

        {/* Empirical Addendum V: 200-Domain Q4 2026 Landmark Snapshot */}
        <section
          id="q4-200-domain-landmark"
          style={{ marginBottom: '44px' }}
        >
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            EMPIRICAL ADDENDUM V · N = 200 LIVE AUDITED DOMAINS LANDMARK
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px, 2.8vw, 28px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 12px 0',
            }}
          >
            200-Domain Q4 2026 Protocol Ledger: 72.0% ship /llms.txt, 97.5% fail 3-pillar JSON-LD
          </h2>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.65,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 18px 0',
              maxWidth: '820px',
            }}
          >
            Crossing <strong>200 live HTTPS domain scorecards</strong> across
            B2B SaaS &amp; AI infrastructure (113 sites · 67.3 mean), Native
            Shopify OS 2.0 commerce (65 stores · 76.5 mean), and Custom Headless
            Next.js storefronts (23 stores · 42.8 mean) confirms a durable{' '}
            <strong>-33.7-point headless architecture penalty</strong> alongside
            four structural protocol baselines:
          </p>

          <div className="vs-grid-4" style={{ marginBottom: '18px', gap: '12px' }}>
            <div className="vs-card" style={{ padding: '16px' }}>
              <div className="vs-mono" style={{ fontSize: '11px', color: 'var(--vs-ink-muted)', marginBottom: '4px' }}>
                INDEX MEAN (N = 200)
              </div>
              <div className="vs-mono" style={{ fontSize: '23px', fontWeight: 700 }}>
                67.4 / 100
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)', marginTop: '4px' }}>
                Shopify 76.5 · SaaS 67.3 · Headless 42.8
              </div>
            </div>

            <div className="vs-card" style={{ padding: '16px' }}>
              <div className="vs-mono" style={{ fontSize: '11px', color: 'var(--vs-ink-muted)', marginBottom: '4px' }}>
                /LLMS.TXT PUBLISHED
              </div>
              <div className="vs-mono" style={{ fontSize: '23px', fontWeight: 700, color: '#6EE7B7' }}>
                72.0% (144)
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)', marginTop: '4px' }}>
                Standard across modern docs &amp; Shopify
              </div>
            </div>

            <div className="vs-card" style={{ padding: '16px' }}>
              <div className="vs-mono" style={{ fontSize: '11px', color: 'var(--vs-ink-muted)', marginBottom: '4px' }}>
                VERIFIED /AGENTS.MD
              </div>
              <div className="vs-mono" style={{ fontSize: '23px', fontWeight: 700, color: '#E5A93C' }}>
                15.0% (30)
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)', marginTop: '4px' }}>
                85.0% lack verified pricing guardrails
              </div>
            </div>

            <div className="vs-card" style={{ padding: '16px' }}>
              <div className="vs-mono" style={{ fontSize: '11px', color: 'var(--vs-ink-muted)', marginBottom: '4px' }}>
                3-PILLAR JSON-LD
              </div>
              <div className="vs-mono" style={{ fontSize: '23px', fontWeight: 700, color: '#FCA5A5' }}>
                2.5% (5)
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)', marginTop: '4px' }}>
                Entity + Offer + FAQPage together
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link href="/vs/rootly-com-vs-incident-io" className="vs-btn">
              Inspect Rootly (84) vs. incident.io (72) →
            </Link>
            <Link
              href="/vs/amplitude-com-vs-mixpanel-com"
              className="vs-btn vs-btn-secondary"
            >
              Inspect Amplitude (72) vs. Mixpanel (72) →
            </Link>
            <Link href="/reports" className="vs-btn vs-btn-secondary">
              Explore All 200 Scorecards →
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
