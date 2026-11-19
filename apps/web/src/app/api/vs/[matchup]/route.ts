import { NextResponse } from 'next/server';
import {
  findPublishedMatchupBySlug,
  type ResolvedPublishedMatchup,
} from '../../../../lib/published-matchups';
import type { PublishedDomainScorecard } from '../../../../lib/published-reports';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
};

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
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

interface MatchupDimensionRow {
  dimension: string;
  domainAValue: string;
  domainBValue: string;
  winner: 'A' | 'B' | 'TIE';
}

function buildMatchupDimensions(
  cardA: PublishedDomainScorecard,
  cardB: PublishedDomainScorecard
): MatchupDimensionRow[] {
  const botsA = botsAllowedOnCard(cardA);
  const botsB = botsAllowedOnCard(cardB);

  return [
    {
      dimension: 'AI Readiness Score',
      domainAValue: `${cardA.readinessScore} / 100`,
      domainBValue: `${cardB.readinessScore} / 100`,
      winner:
        cardA.readinessScore > cardB.readinessScore
          ? 'A'
          : cardB.readinessScore > cardA.readinessScore
            ? 'B'
            : 'TIE',
    },
    {
      dimension: 'AI Crawler & WAF Access',
      domainAValue: botsA ? 'HTTP 200 ALLOWED' : 'RESTRICTED / WAF 403',
      domainBValue: botsB ? 'HTTP 200 ALLOWED' : 'RESTRICTED / WAF 403',
      winner: botsA === botsB ? 'TIE' : botsA ? 'A' : 'B',
    },
    {
      dimension: 'SSR Non-JS Visible Copy',
      domainAValue: `${cardA.visibleWordCount.toLocaleString('en-US')} words`,
      domainBValue: `${cardB.visibleWordCount.toLocaleString('en-US')} words`,
      winner:
        Math.abs(cardA.visibleWordCount - cardB.visibleWordCount) < 40
          ? 'TIE'
          : cardA.visibleWordCount > cardB.visibleWordCount
            ? 'A'
            : 'B',
    },
    {
      dimension: '3-Pillar Schema.org JSON-LD',
      domainAValue: `${cardA.jsonLdPillarsPassed} / 3 pillars (${cardA.jsonLdCount} blocks)`,
      domainBValue: `${cardB.jsonLdPillarsPassed} / 3 pillars (${cardB.jsonLdCount} blocks)`,
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
      dimension: 'Retrieval Directory (/llms.txt)',
      domainAValue: cardA.llmsTxtStatus === 'present' ? 'PUBLISHED' : 'MISSING',
      domainBValue: cardB.llmsTxtStatus === 'present' ? 'PUBLISHED' : 'MISSING',
      winner:
        cardA.llmsTxtStatus === cardB.llmsTxtStatus
          ? 'TIE'
          : cardA.llmsTxtStatus === 'present'
            ? 'A'
            : 'B',
    },
    {
      dimension: 'Agent Rulebook (/agents.md)',
      domainAValue:
        cardA.agentsMdStatus === 'custom_enriched'
          ? 'CUSTOM VERIFIED'
          : cardA.agentsMdStatus === 'default_boilerplate'
            ? 'STOCK BOILERPLATE'
            : 'MISSING',
      domainBValue:
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
}

function renderMatchupMarkdown(m: ResolvedPublishedMatchup): string {
  const { cardA, cardB, slug, cohort, angle } = m;
  const dims = buildMatchupDimensions(cardA, cardB);
  const delta = cardA.readinessScore - cardB.readinessScore;
  const leader = delta >= 0 ? cardA : cardB;
  const trailer = delta >= 0 ? cardB : cardA;

  const tableRows = dims.map((d) => {
    const winLabel =
      d.winner === 'TIE'
        ? 'TIE'
        : d.winner === 'A'
          ? cardA.domain
          : cardB.domain;
    return `| ${d.dimension} | ${d.domainAValue} | ${d.domainBValue} | ${winLabel} |`;
  });

  return [
    `# ${cardA.brandName} (${cardA.domain}) vs. ${cardB.brandName} (${cardB.domain}) — AI Search Readiness X-Ray`,
    '',
    `- **Canonical Matchup:** https://verisource.dev/vs/${slug}`,
    `- **Interactive Re-Scan:** https://verisource.dev/vs?a=${cardA.domain}&b=${cardB.domain}`,
    `- **Cohort:** ${cohort}`,
    `- **Protocol Verdict:** ${
      delta === 0
        ? `Tied at ${cardA.readinessScore} / 100`
        : `${leader.brandName} (${leader.domain}) leads by +${Math.abs(delta)} points (${leader.readinessScore} / 100 vs. ${trailer.readinessScore} / 100)`
    }`,
    `- **Detected Stacks:** ${cardA.domain} (\`${cardA.detectedPlatformLabel}\`) vs. ${cardB.domain} (\`${cardB.detectedPlatformLabel}\`)`,
    '',
    '## Architectural Comparison Angle',
    angle,
    '',
    '## 6-Dimension Protocol Telemetry Diff',
    `| Dimension | ${cardA.domain} | ${cardB.domain} | Lead |`,
    '| :--- | :--- | :--- | :--- |',
    ...tableRows,
    '',
    '## Primary Protocol Gaps',
    `- **${cardA.brandName} (${cardA.domain}):** ${cardA.topGapSummary} ([Full Scorecard](https://verisource.dev/report/${cardA.domain}))`,
    `- **${cardB.brandName} (${cardB.domain}):** ${cardB.topGapSummary} ([Full Scorecard](https://verisource.dev/report/${cardB.domain}))`,
    '',
    '---',
    'Measured over live HTTPS by Verisource (`VerisourceScan/1.0`) — https://verisource.dev',
    '',
  ].join('\n');
}

export async function GET(
  req: Request,
  context: { params: Promise<{ matchup: string }> }
): Promise<Response> {
  const { matchup: rawSlug } = await context.params;
  const resolved = findPublishedMatchupBySlug(rawSlug);

  if (!resolved) {
    return NextResponse.json(
      {
        error: 'MATCHUP_NOT_FOUND',
        slug: rawSlug,
        message:
          'No pre-published head-to-head matchup found for that slug. Compare any two public websites live at https://verisource.dev/vs',
        liveXrayUrl: 'https://verisource.dev/vs',
      },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const url = new URL(req.url);
  const format = (url.searchParams.get('format') ?? '').toLowerCase();
  const accept = (req.headers.get('accept') ?? '').toLowerCase();

  if (
    format === 'md' ||
    format === 'markdown' ||
    accept.includes('text/markdown')
  ) {
    const md = renderMatchupMarkdown(resolved);
    return new Response(md, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `inline; filename="${resolved.slug}-ai-xray.md"`,
        'Cache-Control':
          'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  const { cardA, cardB, slug, cohort, angle } = resolved;
  const dimensions = buildMatchupDimensions(cardA, cardB);
  const scoreDelta = cardA.readinessScore - cardB.readinessScore;
  const leaderDomain =
    scoreDelta === 0
      ? null
      : scoreDelta > 0
        ? cardA.domain
        : cardB.domain;

  return NextResponse.json(
    {
      ok: true,
      slug,
      cohort,
      angle,
      canonicalUrl: `https://verisource.dev/vs/${slug}`,
      markdownUrl: `https://verisource.dev/api/vs/${slug}?format=md`,
      ogImageUrl: `https://verisource.dev/api/og/vs?a=${encodeURIComponent(
        cardA.domain
      )}&b=${encodeURIComponent(cardB.domain)}`,
      interactiveXrayUrl: `https://verisource.dev/vs?a=${encodeURIComponent(
        cardA.domain
      )}&b=${encodeURIComponent(cardB.domain)}`,
      leaderDomain,
      scoreDelta,
      dimensions,
      cardA,
      cardB,
    },
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Cache-Control':
          'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
