import { NextResponse } from 'next/server';
import { normalizePublicDomain } from '@verisource/core-geo';
import {
  findPublishedScorecardByDomain,
  type PublishedDomainScorecard,
} from '../../../../lib/published-reports';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
};

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function renderScorecardMarkdown(s: PublishedDomainScorecard): string {
  const botsOk =
    s.robotsAiBotStatus.GPTBot &&
    s.robotsAiBotStatus['OAI-SearchBot'] &&
    s.robotsAiBotStatus.PerplexityBot &&
    s.robotsAiBotStatus.ClaudeBot &&
    !s.robotsAiBotStatus.waf_blocked;

  return [
    `# ${s.brandName} (${s.domain}) — AI Search & Protocol Readiness Scorecard`,
    '',
    `- **Canonical Report:** https://verisource.dev/report/${s.domain}`,
    `- **Live SVG Badge:** https://verisource.dev/api/badge/${s.domain}`,
    `- **Head-to-Head X-Ray:** https://verisource.dev/vs?a=${s.domain}`,
    `- **Detected Stack:** ${s.detectedPlatformLabel} (\`${s.detectedPlatform}\`)`,
    `- **Verified Date:** ${s.publishedAt.slice(0, 10)}`,
    `- **AI Readiness Score:** **${s.readinessScore} / 100**`,
    '',
    '## Executive Summary',
    s.headlineSummary,
    '',
    '## 4-Pillar Protocol Telemetry',
    '| Check | Endpoint / Artifact | Live Status |',
    '| :--- | :--- | :--- |',
    `| AI Search Crawlers | \`/robots.txt\` + Edge WAF (\`GPTBot\`, \`OAI-SearchBot\`, \`PerplexityBot\`, \`ClaudeBot\`) | ${botsOk ? 'ALLOWED (HTTP 200)' : 'RESTRICTED / WAF 403'} |`,
    `| Retrieval Directory | \`https://${s.domain}/llms.txt\` | ${s.llmsTxtStatus === 'present' ? 'LIVE (HTTP 200)' : 'MISSING'} |`,
    `| Agent Truth Spec | \`https://${s.domain}/agents.md\`${s.isShopify ? ' + `/api/ucp/mcp`' : ''} | ${s.agentsMdStatus === 'custom_enriched' ? 'CUSTOM VERIFIED' : s.agentsMdStatus === 'default_boilerplate' ? 'STOCK BOILERPLATE' : 'MISSING'} |`,
    `| Schema.org JSON-LD | \`${s.jsonLdCount}\` block(s) parsed (Entity · FAQPage · Offer) | ${s.jsonLdPillarsPassed} / 3 PILLARS |`,
    '',
    '## Top Technical Gap',
    `- ${s.topGapSummary}`,
    '',
    '---',
    `Measured over live HTTPS by Verisource (\`VerisourceScan/1.0\`) — https://verisource.dev`,
    '',
  ].join('\n');
}

export async function GET(
  req: Request,
  context: { params: Promise<{ domain: string }> }
): Promise<Response> {
  const { domain: rawDomain } = await context.params;

  let cleanHost = '';
  try {
    cleanHost = normalizePublicDomain(decodeURIComponent(rawDomain ?? '')).hostname;
  } catch (err) {
    return NextResponse.json(
      {
        error: 'INVALID_OR_BLOCKED_DOMAIN',
        message:
          err instanceof Error
            ? err.message
            : 'Provide a valid public website domain.',
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const scorecard = findPublishedScorecardByDomain(cleanHost);
  if (!scorecard) {
    return NextResponse.json(
      {
        error: 'SCORECARD_NOT_FOUND',
        domain: cleanHost,
        message: `No pre-published scorecard found for ${cleanHost}. Run a live 60-second scan at https://verisource.dev/?domain=${encodeURIComponent(cleanHost)}#scan`,
        liveScanUrl: `https://verisource.dev/?domain=${encodeURIComponent(cleanHost)}#scan`,
      },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const url = new URL(req.url);
  const format = (url.searchParams.get('format') ?? '').toLowerCase();
  const accept = (req.headers.get('accept') ?? '').toLowerCase();

  if (format === 'md' || format === 'markdown' || accept.includes('text/markdown')) {
    const md = renderScorecardMarkdown(scorecard);
    return new Response(md, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `inline; filename="${cleanHost}-ai-readiness.md"`,
        'Cache-Control':
          'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      canonicalUrl: `https://verisource.dev/report/${scorecard.domain}`,
      markdownUrl: `https://verisource.dev/api/report/${scorecard.domain}?format=md`,
      badgeSvgUrl: `https://verisource.dev/api/badge/${scorecard.domain}`,
      headToHeadUrl: `https://verisource.dev/vs?a=${scorecard.domain}`,
      scorecard,
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
