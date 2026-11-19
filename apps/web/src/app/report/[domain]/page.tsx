import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import {
  buildPublicAiPromptTeaser,
  buildReadinessBadgeEmbedSnippets,
  getWebsitePlatformMeta,
  renderReadinessBadgeSvg,
} from '@verisource/core-geo';
import { CodeArtifactCard, MetricLedgerCell, StatusBadge } from '@verisource/ui';
import {
  findPublishedScorecardByDomain,
  getPublishedDomainScorecards,
} from '../../../lib/published-reports';

export function generateStaticParams(): Array<{ domain: string }> {
  return getPublishedDomainScorecards().map((item) => ({
    domain: item.domain,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const scorecard = findPublishedScorecardByDomain(domain);
  if (!scorecard) {
    return {
      title: 'Domain Scorecard Not Found | Verisource',
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `https://verisource.dev/report/${scorecard.domain}`;
  const title = `${scorecard.brandName} (${scorecard.domain}) AI Search & Protocol Readiness Scorecard | Verisource`;
  const description = `${scorecard.brandName} scores ${scorecard.readinessScore}/100 on live AI search readiness (${scorecard.jsonLdPillarsPassed}/3 JSON-LD pillars, /llms.txt ${scorecard.llmsTxtStatus}, /agents.md ${scorecard.agentsMdStatus}). Inspect crawl access and generate a 1-click fix prompt.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      types: {
        'text/markdown': `https://verisource.dev/api/report/${scorecard.domain}?format=md`,
        'application/json': `https://verisource.dev/api/report/${scorecard.domain}`,
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Verisource',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PublicDomainReportPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<React.ReactElement> {
  const { domain } = await params;
  const scorecard = findPublishedScorecardByDomain(domain);
  if (!scorecard) {
    notFound();
  }

  const platformMeta = getWebsitePlatformMeta(scorecard.detectedPlatform);
  const recommendedEnv = platformMeta.recommendedAiEnv;
  const botsAllowed =
    scorecard.robotsAiBotStatus.GPTBot &&
    scorecard.robotsAiBotStatus['OAI-SearchBot'] &&
    scorecard.robotsAiBotStatus.PerplexityBot &&
    scorecard.robotsAiBotStatus.ClaudeBot &&
    !scorecard.robotsAiBotStatus.waf_blocked;

  const checksPassedCount =
    (botsAllowed ? 1 : 0) +
    (scorecard.llmsTxtStatus === 'present' ? 1 : 0) +
    (scorecard.agentsMdStatus === 'custom_enriched' ? 1 : 0) +
    (scorecard.jsonLdPillarsPassed >= 3 ? 1 : 0);

  const canonicalUrl = `https://verisource.dev/report/${scorecard.domain}`;
  const badgeSvg = renderReadinessBadgeSvg({
    hostname: scorecard.domain,
    score: scorecard.readinessScore,
  });
  const badgeEmbeds = buildReadinessBadgeEmbedSnippets({
    hostname: scorecard.domain,
    brandName: scorecard.brandName,
  });
  const promptTeaser = buildPublicAiPromptTeaser({
    brandName: scorecard.brandName,
    hostname: scorecard.domain,
    targetEnv: recommendedEnv,
    robotsAiBotStatus: scorecard.robotsAiBotStatus,
    llmsTxtStatus: scorecard.llmsTxtStatus,
    agentsMdStatus: scorecard.agentsMdStatus,
    jsonLdCount: scorecard.jsonLdCount,
    isShopify: scorecard.isShopify,
  });
  const peerComparisons = getPublishedDomainScorecards()
    .filter(
      (item) =>
        item.domain !== scorecard.domain && item.vertical === scorecard.vertical
    )
    .sort(
      (a, b) =>
        Math.abs(b.readinessScore - scorecard.readinessScore) -
        Math.abs(a.readinessScore - scorecard.readinessScore)
    )
    .slice(0, 3);
  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: `${scorecard.brandName} (${scorecard.domain}) AI Search & Protocol Readiness Audit`,
        description: scorecard.headlineSummary,
        datePublished: scorecard.publishedAt,
        dateModified: scorecard.publishedAt,
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
            name: `Does ${scorecard.domain} allow GPTBot, OAI-SearchBot, and PerplexityBot?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: botsAllowed
                ? `Yes. Live HTTP inspection confirms ${scorecard.domain} allows GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot with zero HTTP 403 WAF blocks.`
                : `No. Live HTTP inspection detected an AI bot disallow rule or HTTP 403 edge firewall block on ${scorecard.domain}, restricting direct answer-engine citation.`,
            },
          },
          {
            '@type': 'Question',
            name: `Does ${scorecard.domain} publish /llms.txt, /agents.md, and 3-pillar JSON-LD?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${scorecard.domain} currently passes ${checksPassedCount} of 4 live protocol checks: /llms.txt is ${scorecard.llmsTxtStatus}, /agents.md is ${scorecard.agentsMdStatus.replace(/_/g, ' ')}, and ${scorecard.jsonLdPillarsPassed} of 3 JSON-LD pillars (Entity Identity, FAQPage, Offer Pricing) were verified on the homepage.`,
            },
          },
        ],
      },
    ],
  };

  const protocolRows = [
    {
      label: 'AI Search Bot & WAF Access',
      artifact: 'GPTBot · OAI-SearchBot · PerplexityBot · ClaudeBot',
      live: botsAllowed,
      statusLabel: botsAllowed ? 'HTTP 200 ALLOWED' : 'RESTRICTED / 403',
    },
    {
      label: 'Machine-Readable Site Directory',
      artifact: `https://${scorecard.domain}/llms.txt`,
      live: scorecard.llmsTxtStatus === 'present',
      statusLabel:
        scorecard.llmsTxtStatus === 'present' ? 'PUBLISHED' : 'MISSING',
    },
    {
      label: 'Agent Verification Rulebook',
      artifact: `https://${scorecard.domain}/agents.md`,
      live: scorecard.agentsMdStatus === 'custom_enriched',
      statusLabel:
        scorecard.agentsMdStatus === 'custom_enriched'
          ? 'VERIFIED'
          : scorecard.agentsMdStatus === 'default_boilerplate'
            ? 'GENERIC BOILERPLATE'
            : 'MISSING',
    },
    {
      label: '3-Pillar JSON-LD Schema Graph',
      artifact: 'Organization/Brand · FAQPage · Offer Pricing',
      live: scorecard.jsonLdPillarsPassed >= 3,
      statusLabel: `${scorecard.jsonLdPillarsPassed} / 3 PILLARS`,
    },
  ];

  return (
    <div
      className="vs-container"
      style={{ paddingTop: '40px', paddingBottom: '64px', maxWidth: '960px' }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      <div style={{ marginBottom: '22px' }}>
        <div style={{ marginBottom: '12px' }}>
          <Link
            href="/reports"
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--vs-ink-secondary)',
              textDecoration: 'none',
            }}
          >
            ← All Audited Domain Scorecards
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
          <StatusBadge tone="pass">LIVE PROTOCOL SCORECARD</StatusBadge>
          <StatusBadge>
            {`PLATFORM: ${scorecard.detectedPlatformLabel.toUpperCase()}`}
          </StatusBadge>
          <span
            className="vs-mono"
            style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
          >
            Verified {scorecard.publishedAt.slice(0, 10)}
          </span>
          <a
            href={`/api/report/${encodeURIComponent(scorecard.domain)}?format=md`}
            className="vs-pill-btn vs-pill-btn-sm vs-mono"
            style={{ padding: '3px 9px', fontSize: '11px', textDecoration: 'none' }}
          >
            ↓ Markdown (.md)
          </a>
          <a
            href={`/api/report/${encodeURIComponent(scorecard.domain)}`}
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
          {scorecard.brandName} (<span className="vs-mono">{scorecard.domain}</span>)
          AI Search Readiness Report
        </h1>

        <p
          style={{
            fontSize: '15.5px',
            color: 'var(--vs-ink-secondary)',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: '800px',
          }}
        >
          {scorecard.headlineSummary}
        </p>
      </div>

      <div className="vs-bezel" style={{ marginBottom: '24px' }}>
        <div className="vs-card" style={{ overflow: 'hidden' }}>
          <div className="vs-ledger-strip-4">
            <div>
              <MetricLedgerCell
                label="AI Readiness Score"
                value={scorecard.readinessScore}
                suffix="/ 100"
                tone={scorecard.readinessScore >= 65 ? 'pass' : 'warn'}
                sublabel={`Observed HTTP & schema signal on ${scorecard.domain}`}
              />
            </div>
            <div>
              <MetricLedgerCell
                label="Live Protocol Checks"
                value={`${checksPassedCount} / 4`}
                tone={checksPassedCount === 4 ? 'pass' : 'warn'}
                sublabel="WAF · /llms.txt · /agents.md · JSON-LD"
              />
            </div>
            <div>
              <MetricLedgerCell
                label="JSON-LD Schema"
                value={`${scorecard.jsonLdPillarsPassed} / 3`}
                tone={scorecard.jsonLdPillarsPassed === 3 ? 'pass' : 'warn'}
                sublabel={`${scorecard.jsonLdCount} JSON-LD block(s) parsed`}
              />
            </div>
            <div>
              <MetricLedgerCell
                label="SSR Visible Copy"
                value={scorecard.visibleWordCount.toLocaleString('en-US')}
                suffix=" words"
                tone={
                  scorecard.readabilityStatus === 'csr_js_trap'
                    ? 'critical'
                    : 'pass'
                }
                sublabel="Non-JS HTML text readable by crawlers"
              />
            </div>
          </div>
        </div>
      </div>

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
              4-Pillar Machine-Readability &amp; Bot Access Verification
            </strong>
            <span
              className="vs-mono"
              style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
            >
              {scorecard.domain}
            </span>
          </div>
          <div className="vs-table-wrap">
            <table className="vs-table">
              <thead>
                <tr>
                  <th>Protocol Check</th>
                  <th>Inspected Endpoint / Schema</th>
                  <th>Live Status</th>
                </tr>
              </thead>
              <tbody>
                {protocolRows.map((row) => (
                  <tr key={row.label}>
                    <td style={{ fontWeight: 600 }}>{row.label}</td>
                    <td className="vs-mono" style={{ fontSize: '12.5px' }}>
                      {row.artifact}
                    </td>
                    <td>
                      <StatusBadge tone={row.live ? 'pass' : 'warn'}>
                        {row.statusLabel}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stack-Tailored 1-Click AI Fix Prompt Preview */}
      <div className="vs-bezel" style={{ marginBottom: '24px' }}>
        <div className="vs-card" style={{ padding: '20px 22px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <span className="vs-eyebrow">
              WORK AT {scorecard.brandName.toUpperCase()}? · CLAIM &amp; SHIP FIXES
            </span>
            <StatusBadge>{promptTeaser.envBadgeLabel}</StatusBadge>
          </div>
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 14px 0',
              lineHeight: 1.55,
            }}
          >
            {promptTeaser.whereToPasteLine}
          </p>
          <CodeArtifactCard
            title={`1-Click Remediation Prompt Preview (${scorecard.domain})`}
            fileHint="ACTIVATE FULL PAYLOAD · $19 PASS OR $0 TRIAL"
            code={[
              promptTeaser.visibleHeaderText,
              '',
              ...promptTeaser.redactedPayloadLines,
            ].join('\n')}
          />
        </div>
      </div>

      {/* Primary Conversion CTA Band */}
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
              FIX {scorecard.domain.toUpperCase()} IN 1 PROMPT · NO CODING NEEDED
            </div>
            <strong
              style={{
                display: 'block',
                fontSize: '17px',
                marginBottom: '6px',
              }}
            >
              Generate the {scorecard.detectedPlatformLabel}-tailored 1-Click AI
              Fix Prompt for {scorecard.domain}
            </strong>
            <p
              style={{
                fontSize: '13.5px',
                color: 'var(--vs-ink-secondary)',
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              Top gap detected: {scorecard.topGapSummary} Activate a $19
              One-Time Audit Pass (credited 100% toward $49 Starter or $99 Pro
              within 14 days) or start a $0 7-day free trial.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <a
              href={`/api/checkout?plan=tripwire_19&cycle=one_time&domain=${encodeURIComponent(
                scorecard.domain
              )}&env=${encodeURIComponent(recommendedEnv)}`}
              className="vs-btn"
            >
              Activate $19 Audit Pass &amp; Fix Prompt →
            </a>
            <a
              href={`/api/checkout?plan=pro_99&cycle=monthly&domain=${encodeURIComponent(
                scorecard.domain
              )}&env=${encodeURIComponent(recommendedEnv)}`}
              className="vs-btn vs-btn-secondary"
            >
              Start 7-Day Trial ($0 Today) →
            </a>
            <Link
              href={`/?domain=${encodeURIComponent(scorecard.domain)}#grader`}
              className="vs-btn vs-btn-secondary"
            >
              Re-Scan Live on Grader
            </Link>
            <Link
              href={`/vs?a=${encodeURIComponent(scorecard.domain)}`}
              className="vs-btn vs-btn-secondary"
            >
              Compare vs. Competitor →
            </Link>
          </div>
        </div>
      </div>

      {/* Live Embeddable Readiness Shield Badge */}
      <div className="vs-bezel">
        <div className="vs-card" style={{ padding: '20px 22px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '16px',
            }}
          >
            <div>
              <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                LIVE SVG SHIELD · README.MD &amp; DOCS EMBED
              </div>
              <strong style={{ fontSize: '15.5px' }}>
                Embed the live AI Search Readiness badge for {scorecard.domain}
              </strong>
            </div>
            <div
              dangerouslySetInnerHTML={{ __html: badgeSvg }}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            />
          </div>

          <div className="vs-grid-2">
            <CodeArtifactCard
              title="Markdown Shield"
              fileHint="README.md"
              code={badgeEmbeds.markdownEmbed}
            />
            <CodeArtifactCard
              title="HTML Anchor Shield"
              fileHint="Footer / Docs"
              code={badgeEmbeds.htmlEmbed}
            />
          </div>
        </div>
      </div>

      {/* Category Peer Head-to-Head Comparisons */}
      {peerComparisons.length > 0 ? (
        <div className="vs-bezel" style={{ marginTop: '24px' }}>
          <div className="vs-card" style={{ padding: '20px 22px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
              HEAD-TO-HEAD CATEGORY BENCHMARKS
            </div>
            <strong
              style={{
                display: 'block',
                fontSize: '15.5px',
                marginBottom: '14px',
              }}
            >
              Compare {scorecard.brandName} ({scorecard.readinessScore}/100) against
              peer domains
            </strong>
            <div className="vs-grid-3">
              {peerComparisons.map((peer) => {
                const delta = scorecard.readinessScore - peer.readinessScore;
                return (
                  <div
                    key={peer.domain}
                    className="vs-card vs-card-interactive"
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '4px',
                        }}
                      >
                        <strong style={{ fontSize: '14px' }}>
                          {peer.brandName}
                        </strong>
                        <StatusBadge
                          tone={delta >= 0 ? 'pass' : 'warn'}
                        >{`${peer.readinessScore}/100`}</StatusBadge>
                      </div>
                      <div
                        className="vs-mono"
                        style={{
                          fontSize: '12px',
                          color: 'var(--vs-ink-muted)',
                        }}
                      >
                        {peer.domain} · {peer.detectedPlatformLabel}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Link
                        href={`/vs?a=${encodeURIComponent(
                          scorecard.domain
                        )}&b=${encodeURIComponent(peer.domain)}`}
                        className="vs-btn vs-btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '12px', flex: 1, justifyContent: 'center' }}
                      >
                        vs. {peer.brandName} →
                      </Link>
                      <Link
                        href={`/report/${encodeURIComponent(peer.domain)}`}
                        className="vs-pill-btn vs-pill-btn-sm vs-mono"
                        style={{ padding: '5px 9px', fontSize: '11px', textDecoration: 'none' }}
                      >
                        Report
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
