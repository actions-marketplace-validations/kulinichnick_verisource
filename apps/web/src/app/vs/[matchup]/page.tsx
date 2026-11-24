import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import {
  getWebsitePlatformMeta,
  renderReadinessBadgeSvg,
} from '@verisource/core-geo';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';
import {
  findPublishedMatchupBySlug,
  getPublishedMatchups,
} from '../../../lib/published-matchups';
import type { PublishedDomainScorecard } from '../../../lib/published-reports';

const BUILD_PRERENDER_MATCHUP_LIMIT = 50;

export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ matchup: string }> {
  return getPublishedMatchups()
    .slice(0, BUILD_PRERENDER_MATCHUP_LIMIT)
    .map((item) => ({
      matchup: item.slug,
    }));
}

function botsAllowedOnCard(c: PublishedDomainScorecard): boolean {
  return (
    c.robotsAiBotStatus.GPTBot &&
    c.robotsAiBotStatus['OAI-SearchBot'] &&
    c.robotsAiBotStatus.PerplexityBot &&
    c.robotsAiBotStatus.ClaudeBot &&
    !c.robotsAiBotStatus.waf_blocked
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ matchup: string }>;
}): Promise<Metadata> {
  const { matchup } = await params;
  const resolved = findPublishedMatchupBySlug(matchup);
  if (!resolved) {
    return {
      title: 'Domain Matchup Not Found | Verisource',
      robots: { index: false, follow: false },
    };
  }

  const { cardA, cardB, slug } = resolved;
  const canonicalUrl = `https://verisource.dev/vs/${slug}`;
  const ogImageUrl = `https://verisource.dev/api/og/vs?a=${encodeURIComponent(
    cardA.domain
  )}&b=${encodeURIComponent(cardB.domain)}`;
  const title = `${cardA.brandName} (${cardA.readinessScore}/100) vs. ${cardB.brandName} (${cardB.readinessScore}/100) — AI Search Readiness X-Ray | Verisource`;
  const description = `Side-by-side 6-dimension AI search benchmark comparing ${cardA.domain} (${cardA.detectedPlatformLabel}) against ${cardB.domain} (${cardB.detectedPlatformLabel}) across GPTBot WAF access, SSR copy, JSON-LD, /llms.txt, and /agents.md.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      types: {
        'text/markdown': `https://verisource.dev/api/vs/${slug}?format=md`,
        'application/json': `https://verisource.dev/api/vs/${slug}`,
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Verisource',
      type: 'article',
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

export default async function PublishedMatchupPage({
  params,
}: {
  params: Promise<{ matchup: string }>;
}): Promise<React.ReactElement> {
  const { matchup } = await params;
  const resolved = findPublishedMatchupBySlug(matchup);
  if (!resolved) {
    notFound();
  }

  const { cardA, cardB, cohort, angle, slug } = resolved;
  const botsA = botsAllowedOnCard(cardA);
  const botsB = botsAllowedOnCard(cardB);
  const scoreDelta = cardA.readinessScore - cardB.readinessScore;
  const leader = scoreDelta >= 0 ? cardA : cardB;
  const trailer = scoreDelta >= 0 ? cardB : cardA;
  const trailerPlatformMeta = getWebsitePlatformMeta(trailer.detectedPlatform);

  const badgeSvgA = renderReadinessBadgeSvg({
    hostname: cardA.domain,
    score: cardA.readinessScore,
  });
  const badgeSvgB = renderReadinessBadgeSvg({
    hostname: cardB.domain,
    score: cardB.readinessScore,
  });

  const dimensions: Array<{
    label: string;
    valA: string;
    valB: string;
    winner: 'A' | 'B' | 'TIE';
  }> = [
    {
      label: 'AI Readiness Score',
      valA: `${cardA.readinessScore} / 100`,
      valB: `${cardB.readinessScore} / 100`,
      winner:
        cardA.readinessScore > cardB.readinessScore
          ? 'A'
          : cardB.readinessScore > cardA.readinessScore
            ? 'B'
            : 'TIE',
    },
    {
      label: 'AI Crawler & WAF Access',
      valA: botsA ? 'HTTP 200 ALLOWED' : 'RESTRICTED / WAF 403',
      valB: botsB ? 'HTTP 200 ALLOWED' : 'RESTRICTED / WAF 403',
      winner: botsA === botsB ? 'TIE' : botsA ? 'A' : 'B',
    },
    {
      label: 'SSR Non-JS Visible Copy',
      valA: `${cardA.visibleWordCount.toLocaleString('en-US')} words`,
      valB: `${cardB.visibleWordCount.toLocaleString('en-US')} words`,
      winner:
        Math.abs(cardA.visibleWordCount - cardB.visibleWordCount) < 40
          ? 'TIE'
          : cardA.visibleWordCount > cardB.visibleWordCount
            ? 'A'
            : 'B',
    },
    {
      label: '3-Pillar Schema.org JSON-LD',
      valA: `${cardA.jsonLdPillarsPassed} / 3 pillars (${cardA.jsonLdCount} blocks)`,
      valB: `${cardB.jsonLdPillarsPassed} / 3 pillars (${cardB.jsonLdCount} blocks)`,
      winner:
        cardA.jsonLdPillarsPassed > cardB.jsonLdPillarsPassed
          ? 'A'
          : cardB.jsonLdPillarsPassed > cardA.jsonLdPillarsPassed
            ? 'B'
            : cardA.jsonLdCount > cardB.jsonLdCount
              ? 'A'
              : cardB.jsonLdCount > cardA.jsonLdCount
                ? 'B'
                : 'TIE',
    },
    {
      label: 'Retrieval Directory (/llms.txt)',
      valA: cardA.llmsTxtStatus === 'present' ? 'PUBLISHED' : 'MISSING',
      valB: cardB.llmsTxtStatus === 'present' ? 'PUBLISHED' : 'MISSING',
      winner:
        cardA.llmsTxtStatus === cardB.llmsTxtStatus
          ? 'TIE'
          : cardA.llmsTxtStatus === 'present'
            ? 'A'
            : 'B',
    },
    {
      label: 'Agent Rulebook (/agents.md)',
      valA:
        cardA.agentsMdStatus === 'custom_enriched'
          ? 'CUSTOM VERIFIED'
          : cardA.agentsMdStatus === 'default_boilerplate'
            ? 'STOCK BOILERPLATE'
            : 'MISSING',
      valB:
        cardB.agentsMdStatus === 'custom_enriched'
          ? 'CUSTOM VERIFIED'
          : cardB.agentsMdStatus === 'default_boilerplate'
            ? 'STOCK BOILERPLATE'
            : 'MISSING',
      winner:
        cardA.agentsMdStatus === cardB.agentsMdStatus
          ? 'TIE'
          : cardA.agentsMdStatus === 'custom_enriched'
            ? 'A'
            : cardB.agentsMdStatus === 'custom_enriched'
              ? 'B'
              : cardA.agentsMdStatus === 'default_boilerplate'
                ? 'A'
                : 'B',
    },
  ];

  const canonicalUrl = `https://verisource.dev/vs/${slug}`;
  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: `${cardA.brandName} (${cardA.domain}) vs. ${cardB.brandName} (${cardB.domain}) AI Search Readiness Benchmark`,
        description: angle,
        datePublished: cardA.publishedAt,
        dateModified:
          cardA.publishedAt > cardB.publishedAt
            ? cardA.publishedAt
            : cardB.publishedAt,
        mainEntityOfPage: canonicalUrl,
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
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How does ${cardA.brandName} compare to ${cardB.brandName} on AI search readiness?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${cardA.brandName} (${cardA.domain}, ${cardA.detectedPlatformLabel}) scores ${cardA.readinessScore}/100 while ${cardB.brandName} (${cardB.domain}, ${cardB.detectedPlatformLabel}) scores ${cardB.readinessScore}/100 across GPTBot/PerplexityBot WAF access, SSR visible word density, 3-pillar JSON-LD, /llms.txt, and /agents.md.`,
            },
          },
          {
            '@type': 'Question',
            name: `What is the top technical AI citation gap on ${trailer.domain}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${trailer.brandName} (${trailer.domain}) trails by ${Math.abs(scoreDelta)} points. Primary remediation priority: ${trailer.topGapSummary}`,
            },
          },
        ],
      },
    ],
  };

  const relatedMatchups = getPublishedMatchups()
    .filter((m) => m.slug !== slug)
    .slice(0, 3);

  return (
    <div
      className="vs-container"
      style={{ paddingTop: '40px', paddingBottom: '64px', maxWidth: '980px' }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      <div style={{ marginBottom: '22px' }}>
        <div style={{ marginBottom: '12px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <Link
            href="/vs#matchups"
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--vs-ink-secondary)',
              textDecoration: 'none',
            }}
          >
            ← Head-to-Head Domain X-Ray Hub
          </Link>
          <Link
            href="/reports"
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--vs-ink-secondary)',
              textDecoration: 'none',
            }}
          >
            All Audited Scorecards →
          </Link>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
          }}
        >
          <StatusBadge tone="pass">{cohort}</StatusBadge>
          <StatusBadge tone={scoreDelta === 0 ? 'neutral' : 'pass'}>
            {scoreDelta === 0
              ? 'TIED PROTOCOL SCORE'
              : `${leader.domain.toUpperCase()} LEADS BY +${Math.abs(scoreDelta)} PTS`}
          </StatusBadge>
          <span
            className="vs-mono"
            style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
          >
            6-Dimension HTTP &amp; Schema Benchmark
          </span>
          <a
            href={`/api/vs/${encodeURIComponent(slug)}?format=md`}
            className="vs-pill-btn vs-pill-btn-sm vs-mono"
            style={{ padding: '3px 9px', fontSize: '11px', textDecoration: 'none' }}
          >
            ↓ Markdown (.md)
          </a>
          <a
            href={`/api/vs/${encodeURIComponent(slug)}`}
            className="vs-pill-btn vs-pill-btn-sm vs-mono"
            style={{ padding: '3px 9px', fontSize: '11px', textDecoration: 'none' }}
          >
            JSON API
          </a>
        </div>

        <h1
          style={{
            fontSize: 'clamp(26px, 3.6vw, 38px)',
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            margin: '0 0 10px 0',
          }}
        >
          {cardA.brandName} (<span className="vs-mono">{cardA.domain}</span>) vs.{' '}
          {cardB.brandName} (<span className="vs-mono">{cardB.domain}</span>)
        </h1>

        <p
          style={{
            fontSize: '15.5px',
            color: 'var(--vs-ink-secondary)',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: '820px',
          }}
        >
          {angle} Measured live over HTTPS by{' '}
          <code className="vs-mono">VerisourceScan/1.0</code>.
        </p>
      </div>

      {/* Side-by-Side Score Ledger & SVG Shields */}
      <div className="vs-bezel" style={{ marginBottom: '24px' }}>
        <div className="vs-card" style={{ overflow: 'hidden' }}>
          <div className="vs-grid-2" style={{ gap: 0 }}>
            <div
              style={{
                padding: '18px 20px',
                borderRight: '1px solid var(--vs-border)',
                borderBottom: '1px solid var(--vs-border)',
              }}
            >
              <MetricLedgerCell
                label={`${cardA.brandName} · ${cardA.detectedPlatformLabel}`}
                value={cardA.readinessScore}
                suffix="/ 100"
                tone={cardA.readinessScore >= cardB.readinessScore ? 'pass' : 'warn'}
                sublabel={cardA.topGapSummary}
              />
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span dangerouslySetInnerHTML={{ __html: badgeSvgA }} style={{ display: 'inline-flex' }} />
                <Link
                  href={`/report/${encodeURIComponent(cardA.domain)}`}
                  className="vs-pill-btn vs-pill-btn-sm vs-mono"
                  style={{ padding: '4px 9px', fontSize: '11px', textDecoration: 'none' }}
                >
                  Full {cardA.domain} Report →
                </Link>
              </div>
            </div>

            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid var(--vs-border)',
              }}
            >
              <MetricLedgerCell
                label={`${cardB.brandName} · ${cardB.detectedPlatformLabel}`}
                value={cardB.readinessScore}
                suffix="/ 100"
                tone={cardB.readinessScore >= cardA.readinessScore ? 'pass' : 'warn'}
                sublabel={cardB.topGapSummary}
              />
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span dangerouslySetInnerHTML={{ __html: badgeSvgB }} style={{ display: 'inline-flex' }} />
                <Link
                  href={`/report/${encodeURIComponent(cardB.domain)}`}
                  className="vs-pill-btn vs-pill-btn-sm vs-mono"
                  style={{ padding: '4px 9px', fontSize: '11px', textDecoration: 'none' }}
                >
                  Full {cardB.domain} Report →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Dimension SSR Protocol Table */}
      <div className="vs-bezel" style={{ marginBottom: '24px' }}>
        <div className="vs-card" style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--vs-border)',
              background: 'var(--vs-surface-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <strong style={{ fontSize: '14px' }}>
              6-Dimension AI Search &amp; Crawler Protocol Diff
            </strong>
            <Link
              href={`/vs?a=${encodeURIComponent(cardA.domain)}&b=${encodeURIComponent(
                cardB.domain
              )}`}
              className="vs-pill-btn vs-pill-btn-sm vs-mono"
              style={{ padding: '4px 10px', fontSize: '11px', textDecoration: 'none' }}
            >
              ↻ Re-Probe Live Over HTTP
            </Link>
          </div>

          <div className="vs-table-wrap">
            <table className="vs-table">
              <thead>
                <tr>
                  <th>Protocol Dimension</th>
                  <th className="vs-mono">{cardA.domain}</th>
                  <th className="vs-mono">{cardB.domain}</th>
                  <th>Protocol Edge</th>
                </tr>
              </thead>
              <tbody>
                {dimensions.map((d) => (
                  <tr key={d.label}>
                    <td style={{ fontWeight: 600 }}>{d.label}</td>
                    <td className="vs-mono" style={{ fontSize: '12.5px' }}>
                      {d.valA}
                    </td>
                    <td className="vs-mono" style={{ fontSize: '12.5px' }}>
                      {d.valB}
                    </td>
                    <td>
                      <StatusBadge
                        tone={d.winner === 'TIE' ? 'neutral' : 'pass'}
                      >
                        {d.winner === 'A'
                          ? cardA.domain
                          : d.winner === 'B'
                            ? cardB.domain
                            : 'TIE'}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Overtake CTA Band */}
      <div className="vs-bezel-obsidian" style={{ marginBottom: '24px' }}>
        <div
          className="vs-card"
          style={{
            padding: '22px 24px',
            background: 'var(--vs-surface-warm)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '18px',
          }}
        >
          <div style={{ maxWidth: '560px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '5px' }}>
              CLOSE THE PROTOCOL GAP ON {trailer.domain.toUpperCase()}
            </div>
            <strong
              style={{
                display: 'block',
                fontSize: '17px',
                marginBottom: '6px',
              }}
            >
              Generate the {trailer.detectedPlatformLabel}-tailored Overtake
              Prompt &amp; {trailer.brandName} vs. {leader.brandName} Page
            </strong>
            <p
              style={{
                fontSize: '13.5px',
                color: 'var(--vs-ink-secondary)',
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {trailer.topGapSummary} Activate a $19 One-Time Audit Pass or $0
              7-day trial to export validated JSON-LD, /llms.txt, /agents.md,
              and a ready-to-publish comparison table.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <a
              href={`/api/checkout?plan=tripwire_19&cycle=one_time&domain=${encodeURIComponent(
                trailer.domain
              )}&env=${encodeURIComponent(trailerPlatformMeta.recommendedAiEnv)}`}
              className="vs-btn"
            >
              Activate $19 Overtake Pass →
            </a>
            <Link
              href="/vs"
              className="vs-btn vs-btn-secondary"
            >
              Compare Your Own Domain →
            </Link>
          </div>
        </div>
      </div>

      {/* Related Matchups */}
      {relatedMatchups.length > 0 ? (
        <div className="vs-bezel">
          <div className="vs-card" style={{ padding: '18px 20px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '10px' }}>
              MORE PUBLISHED ARCHITECTURE MATCHUPS
            </div>
            <div className="vs-grid-3">
              {relatedMatchups.map((item) => (
                <Link
                  key={item.slug}
                  href={`/vs/${item.slug}`}
                  className="vs-card vs-card-interactive"
                  style={{
                    padding: '12px 14px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div
                    className="vs-mono"
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--vs-accent)',
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}
                  >
                    {item.cohort}
                  </div>
                  <div className="vs-mono" style={{ fontSize: '12.5px', fontWeight: 700 }}>
                    {item.domainA} ({item.cardA.readinessScore}) vs.{' '}
                    {item.domainB} ({item.cardB.readinessScore})
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
