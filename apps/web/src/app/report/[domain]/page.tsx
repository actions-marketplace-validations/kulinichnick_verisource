import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import { getWebsitePlatformMeta } from '@verisource/core-geo';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';
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
    alternates: { canonical: canonicalUrl },
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
          </div>
        </div>
      </div>
    </div>
  );
}
