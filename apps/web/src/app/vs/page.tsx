import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { normalizePublicDomain } from '@verisource/core-geo';
import { StatusBadge } from '@verisource/ui';
import { DomainHeadToHeadClient } from '../../components/DomainHeadToHeadClient';
import { buildMatchupSlug } from '../../lib/published-matchups';
import { findPublishedScorecardByDomain } from '../../lib/published-reports';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}): Promise<Metadata> {
  const resolved = await searchParams;
  const rawA = typeof resolved?.a === 'string' ? resolved.a.trim() : '';
  const rawB = typeof resolved?.b === 'string' ? resolved.b.trim() : '';

  let cleanA = '';
  let cleanB = '';
  if (rawA && rawB) {
    try {
      cleanA = normalizePublicDomain(rawA).hostname;
      cleanB = normalizePublicDomain(rawB).hostname;
    } catch {
      cleanA = '';
      cleanB = '';
    }
  }

  const title =
    cleanA && cleanB
      ? `${cleanA} vs. ${cleanB} — AI Search Readiness X-Ray | Verisource`
      : 'Head-to-Head Domain AI Search X-Ray: Compare Any Two Websites | Verisource';
  const description =
    cleanA && cleanB
      ? `Live 6-dimension HTTP AI search benchmark comparing ${cleanA} against ${cleanB} across GPTBot WAF access, SSR token density, schema.org JSON-LD, /llms.txt, and /agents.md.`
      : 'Compare any two public domains across 6 AI search & crawler dimensions: GPTBot/PerplexityBot WAF access, non-JS HTML signal, schema.org JSON-LD @graph, /llms.txt, and /agents.md.';
  const ogImageUrl =
    cleanA && cleanB
      ? `https://verisource.dev/api/og/vs?a=${encodeURIComponent(
          cleanA
        )}&b=${encodeURIComponent(cleanB)}`
      : 'https://verisource.dev/api/og/vs';

  return {
    title,
    description,
    alternates: {
      canonical: 'https://verisource.dev/vs',
    },
    openGraph: {
      title,
      description,
      url:
        cleanA && cleanB
          ? `https://verisource.dev/vs?a=${encodeURIComponent(
              cleanA
            )}&b=${encodeURIComponent(cleanB)}`
          : 'https://verisource.dev/vs',
      siteName: 'Verisource',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

const VS_FAQS = [
  {
    question:
      'What does the Head-to-Head Domain AI Search X-Ray inspect over HTTP?',
    answer:
      'Verisource probes both domains live across six dimensions: overall technical AI readiness (0–100), five AI search crawler rules (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended) plus edge WAF HTTP 403 drops, non-JavaScript SSR word/token density, schema.org JSON-LD entity types, /llms.txt availability, and /agents.md or Shopify /api/ucp/mcp coverage.',
  },
  {
    question:
      'Why can a competitor with weaker domain authority still win AI search citations?',
    answer:
      'Answer engines extract structured facts under tight retrieval budgets. If your site blocks PerplexityBot at Cloudflare WAF, renders pricing inside client-only JavaScript bundles, or omits FAQPage and Offer JSON-LD while a smaller rival serves clean SSR HTML and /agents.md, retrieval models cite the rival instead.',
  },
  {
    question: 'Can agencies share Head-to-Head X-Ray links in prospect outreach?',
    answer:
      'Yes. Every comparison updates the browser URL (?a=client.com&b=rival.com) for instant sharing, and $249/mo Agency workspaces can mint white-label /audit/[slug] executive scorecards with custom logos, brand hex accents, and booking links.',
  },
] as const;

const FEATURED_RIVALRY_PAIRS: ReadonlyArray<{
  cohort: string;
  domainA: string;
  domainB: string;
  angle: string;
}> = [
  {
    cohort: 'AI & CODE EDITORS',
    domainA: 'cursor.com',
    domainB: 'zed.dev',
    angle:
      'Published /llms.txt + clean SSR copy vs. missing retrieval directory and thin schema.',
  },
  {
    cohort: 'AI SEARCH & FOUNDATION',
    domainA: 'mistral.ai',
    domainB: 'perplexity.ai',
    angle:
      'Open crawler rules + structured entity metadata vs. strict edge WAF restrictions.',
  },
  {
    cohort: 'TERMINAL & RUNTIME',
    domainA: 'warp.dev',
    domainB: 'deno.com',
    angle:
      'Multi-block JSON-LD + /llms.txt coverage vs. partial schema.org entity declarations.',
  },
  {
    cohort: 'SHOPIFY VS. HEADLESS DTC',
    domainA: 'floydhome.com',
    domainB: 'article.com',
    angle:
      'Native Shopify Product/Offer JSON-LD vs. custom headless Next.js hydration gap.',
  },
  {
    cohort: 'WEARABLES ARCHITECTURE',
    domainA: 'ouraring.com',
    domainB: 'whoop.com',
    angle:
      'Server-rendered commerce schema vs. client-heavy React storefront blocking extraction.',
  },
  {
    cohort: 'APPAREL COMMERCE STACK',
    domainA: 'goodamerican.com',
    domainB: 'fabletics.com',
    angle:
      'Shopify OS 2.0 bot readability + Offer graph vs. custom JS membership gate.',
  },
  {
    cohort: 'CLOUD DATABASES',
    domainA: 'supabase.com',
    domainB: 'planetscale.com',
    angle:
      'Developer docs /llms.txt + entity graph vs. lean marketing landing schema.',
  },
  {
    cohort: 'COOKWARE & HOME DTC',
    domainA: 'madeincookware.com',
    domainB: 'materialkitchen.com',
    angle:
      '3-pillar Organization/Product/FAQ JSON-LD vs. single-pillar storefront baseline.',
  },
  {
    cohort: 'B2B WORKFLOW SAAS',
    domainA: 'linear.app',
    domainB: 'cal.com',
    angle:
      'High-density SSR product copy vs. open-source scheduling schema & crawler rules.',
  },
] as const;

export default async function HeadToHeadVsPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}): Promise<React.ReactElement> {
  const resolved = await searchParams;
  const initialA = typeof resolved?.a === 'string' ? resolved.a : '';
  const initialB = typeof resolved?.b === 'string' ? resolved.b : '';

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Verisource Head-to-Head Domain AI Search X-Ray',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        url: 'https://verisource.dev/vs',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description:
          'Side-by-side HTTP protocol and schema.org JSON-LD benchmark comparing any two websites for ChatGPT Search, Google Gemini, and Perplexity readiness.',
      },
      {
        '@type': 'FAQPage',
        mainEntity: VS_FAQS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '44px 0 46px 0',
          marginBottom: '34px',
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
            <StatusBadge tone="pass">
              ZERO-SIGNUP 6-DIMENSION PROTOCOL DIFF
            </StatusBadge>
            <StatusBadge>GPTBOT · JSON-LD · /LLMS.TXT · /AGENTS.MD</StatusBadge>
            <StatusBadge>SHAREABLE MATCHUP URLS</StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 3.8vw, 44px)',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: '0 0 14px 0',
              maxWidth: '820px',
            }}
          >
            Compare any two domains head-to-head for AI search citations.
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
            Inspect why answer engines cite a competitor ahead of your site.
            Benchmark live <code className="vs-mono">GPTBot</code> and{' '}
            <code className="vs-mono">PerplexityBot</code> WAF responses, SSR
            token density, <code className="vs-mono">schema.org</code>{' '}
            <code className="vs-mono">JSON-LD</code> nodes,{' '}
            <code className="vs-mono">/llms.txt</code>, and{' '}
            <code className="vs-mono">/agents.md</code> side by side.
          </p>
        </div>
      </section>

      <div className="vs-container" style={{ paddingBottom: '64px' }}>
        <DomainHeadToHeadClient
          initialDomainA={initialA}
          initialDomainB={initialB}
        />

        {/* Live-Measured Industry & Architecture Rivalry Matrix */}
        <section id="matchups" style={{ marginTop: '48px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            CURATED INDUSTRY &amp; ARCHITECTURE BENCHMARKS
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            <h2
              style={{
                fontSize: '23px',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Inspect live protocol gaps across 9 flagship rivalries.
            </h2>
            <span
              className="vs-mono"
              style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
            >
              npx @verisource/cli vs &lt;domainA&gt; &lt;domainB&gt;
            </span>
          </div>

          <div className="vs-grid-3">
            {FEATURED_RIVALRY_PAIRS.map((pair) => {
              const cardA = findPublishedScorecardByDomain(pair.domainA);
              const cardB = findPublishedScorecardByDomain(pair.domainB);
              const scoreA = cardA?.readinessScore ?? null;
              const scoreB = cardB?.readinessScore ?? null;
              const delta =
                scoreA !== null && scoreB !== null ? scoreA - scoreB : null;

              return (
                <div
                  key={`${pair.domainA}-${pair.domainB}`}
                  className="vs-card vs-card-interactive"
                  style={{
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        className="vs-mono"
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          color: 'var(--vs-accent)',
                        }}
                      >
                        {pair.cohort}
                      </span>
                      {delta !== null ? (
                        <StatusBadge tone={delta >= 0 ? 'pass' : 'warn'}>
                          {`${delta >= 0 ? '+' : ''}${delta} PTS GAP`}
                        </StatusBadge>
                      ) : null}
                    </div>

                    <div
                      className="vs-mono"
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        marginBottom: '6px',
                        lineHeight: 1.4,
                      }}
                    >
                      {pair.domainA}
                      {scoreA !== null ? ` (${scoreA})` : ''} vs. {pair.domainB}
                      {scoreB !== null ? ` (${scoreB})` : ''}
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '12.5px',
                        lineHeight: 1.55,
                        color: 'var(--vs-ink-secondary)',
                      }}
                    >
                      {pair.angle}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--vs-border)',
                    }}
                  >
                    <Link
                      href={`/vs?a=${encodeURIComponent(
                        pair.domainA
                      )}&b=${encodeURIComponent(pair.domainB)}`}
                      className="vs-btn vs-btn-secondary"
                      style={{
                        padding: '5px 10px',
                        fontSize: '12px',
                        flex: 1,
                        justifyContent: 'center',
                      }}
                    >
                      Compare Live →
                    </Link>
                    <Link
                      href={`/vs/${buildMatchupSlug(pair.domainA, pair.domainB)}`}
                      className="vs-pill-btn vs-pill-btn-sm vs-mono"
                      style={{
                        padding: '5px 8px',
                        fontSize: '11px',
                        textDecoration: 'none',
                      }}
                    >
                      Brief
                    </Link>
                    <Link
                      href={`/report/${encodeURIComponent(pair.domainA)}`}
                      className="vs-pill-btn vs-pill-btn-sm vs-mono"
                      style={{
                        padding: '5px 8px',
                        fontSize: '11px',
                        textDecoration: 'none',
                      }}
                    >
                      A
                    </Link>
                    <Link
                      href={`/report/${encodeURIComponent(pair.domainB)}`}
                      className="vs-pill-btn vs-pill-btn-sm vs-mono"
                      style={{
                        padding: '5px 8px',
                        fontSize: '11px',
                        textDecoration: 'none',
                      }}
                    >
                      B
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ & Internal Directory Links */}
        <section style={{ marginTop: '52px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            COMPETITOR X-RAY METHODOLOGY
          </div>
          <h2
            style={{
              fontSize: '23px',
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
            }}
          >
            How answer engines weigh competing domains.
          </h2>

          <div className="vs-grid-3" style={{ marginBottom: '26px' }}>
            {VS_FAQS.map((faq) => (
              <div
                key={faq.question}
                className="vs-card"
                style={{ padding: '18px 20px' }}
              >
                <h3
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                    lineHeight: 1.4,
                  }}
                >
                  {faq.question}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <Link href="/reports" className="vs-btn vs-btn-secondary">
              Browse All Audited Domain Scorecards →
            </Link>
            <Link href="/tools" className="vs-btn vs-btn-secondary">
              Explore 4 Single-Protocol Validators →
            </Link>
            <Link href="/mcp-guide" className="vs-btn vs-btn-secondary">
              Automate via Streamable HTTP /mcp →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
