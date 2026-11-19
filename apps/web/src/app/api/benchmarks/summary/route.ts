import { NextResponse } from 'next/server';
import { getPublishedMatchups } from '../../../../lib/published-matchups';
import {
  getPublishedDomainScorecards,
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

function isWafOrBotRestricted(s: PublishedDomainScorecard): boolean {
  const b = s.robotsAiBotStatus;
  return (
    Boolean(b.waf_blocked) ||
    !b.GPTBot ||
    !b['OAI-SearchBot'] ||
    !b.PerplexityBot ||
    !b.ClaudeBot
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function meanOf(items: PublishedDomainScorecard[]): number {
  if (items.length === 0) return 0;
  return round1(
    items.reduce((acc, item) => acc + item.readinessScore, 0) / items.length
  );
}

export async function GET(req: Request): Promise<Response> {
  const scorecards = getPublishedDomainScorecards();
  const matchups = getPublishedMatchups();
  const total = scorecards.length;

  const llmsCount = scorecards.filter(
    (s) => s.llmsTxtStatus === 'present'
  ).length;
  const customAgentsCount = scorecards.filter(
    (s) => s.agentsMdStatus === 'custom_enriched'
  ).length;
  const stockAgentsCount = scorecards.filter(
    (s) => s.agentsMdStatus === 'default_boilerplate'
  ).length;
  const threePillarJsonLdCount = scorecards.filter(
    (s) => s.jsonLdPillarsPassed >= 3
  ).length;
  const wafRestrictedCount = scorecards.filter(isWafOrBotRestricted).length;

  const shopifyCohort = scorecards.filter(
    (s) => s.detectedPlatform === 'shopify'
  );
  const headlessDtcCohort = scorecards.filter(
    (s) => s.vertical === 'shopify_dtc' && s.detectedPlatform === 'nextjs_custom'
  );
  const saasCohort = scorecards.filter((s) => s.vertical === 'b2b_saas');

  const overallMean = meanOf(scorecards);
  const shopifyMean = meanOf(shopifyCohort);
  const headlessMean = meanOf(headlessDtcCohort);
  const saasMean = meanOf(saasCohort);
  const headlessVsShopifyDelta = round1(headlessMean - shopifyMean);

  const topLeaders = [...scorecards]
    .sort(
      (a, b) =>
        b.readinessScore - a.readinessScore || a.domain.localeCompare(b.domain)
    )
    .slice(0, 12)
    .map((s) => ({
      domain: s.domain,
      brandName: s.brandName,
      readinessScore: s.readinessScore,
      detectedPlatformLabel: s.detectedPlatformLabel,
      llmsTxtStatus: s.llmsTxtStatus,
      agentsMdStatus: s.agentsMdStatus,
      jsonLdPillarsPassed: s.jsonLdPillarsPassed,
      reportUrl: `https://verisource.dev/report/${s.domain}`,
    }));

  const latestPublishedAt = scorecards.reduce(
    (latest, item) => (item.publishedAt > latest ? item.publishedAt : latest),
    '2026-11-18T00:00:00.000Z'
  );

  const payload = {
    ok: true,
    datasetTitle: 'Verisource 2026 AI Search & Protocol Readiness Index',
    canonicalStudyUrl:
      'https://verisource.dev/benchmarks/ai-search-readiness-2026',
    directoryUrl: 'https://verisource.dev/reports',
    matchupsHubUrl: 'https://verisource.dev/vs#all-published-matchups',
    markdownUrl:
      'https://verisource.dev/api/benchmarks/summary?format=md',
    scannerUserAgent: 'VerisourceScan/1.0',
    updatedAt: latestPublishedAt,
    totalAuditedDomains: total,
    publishedMatchupsCount: matchups.length,
    overallMeanScore: overallMean,
    protocolAdoption: {
      llmsTxtPublished: {
        count: llmsCount,
        pct: total > 0 ? round1((llmsCount / total) * 100) : 0,
      },
      customVerifiedAgentsMd: {
        count: customAgentsCount,
        pct: total > 0 ? round1((customAgentsCount / total) * 100) : 0,
      },
      stockBoilerplateAgentsMd: {
        count: stockAgentsCount,
        pct: total > 0 ? round1((stockAgentsCount / total) * 100) : 0,
      },
      threePillarJsonLd: {
        count: threePillarJsonLdCount,
        pct: total > 0 ? round1((threePillarJsonLdCount / total) * 100) : 0,
      },
      wafOrBotRestricted: {
        count: wafRestrictedCount,
        pct: total > 0 ? round1((wafRestrictedCount / total) * 100) : 0,
      },
    },
    architectureCohorts: {
      shopifyOs2: {
        count: shopifyCohort.length,
        meanScore: shopifyMean,
      },
      b2bSaasAndAiInfra: {
        count: saasCohort.length,
        meanScore: saasMean,
      },
      headlessNextjsDtc: {
        count: headlessDtcCohort.length,
        meanScore: headlessMean,
      },
      headlessVsShopifyDelta,
    },
    topLeaders,
  };

  const url = new URL(req.url);
  const format = (url.searchParams.get('format') ?? '').toLowerCase();
  const accept = (req.headers.get('accept') ?? '').toLowerCase();

  if (
    format === 'md' ||
    format === 'markdown' ||
    accept.includes('text/markdown')
  ) {
    const md = [
      `# Verisource 2026 AI Search & Protocol Readiness Index (N = ${total} Live Domains)`,
      '',
      `- **Canonical Study:** ${payload.canonicalStudyUrl}`,
      `- **Searchable Leaderboard:** ${payload.directoryUrl}`,
      `- **Head-to-Head Matchup Benchmarks (${matchups.length}):** ${payload.matchupsHubUrl}`,
      `- **JSON Dataset Endpoint:** https://verisource.dev/api/benchmarks/summary`,
      `- **Updated:** ${latestPublishedAt.slice(0, 10)} (\`VerisourceScan/1.0\`)`,
      '',
      '## Aggregate Protocol Coverage',
      '| Metric | Verified Count | Share / Mean |',
      '| :--- | :--- | :--- |',
      `| Overall AI Readiness Score Mean | ${total} domains | **${overallMean} / 100** |`,
      `| \`/llms.txt\` Published (HTTP 200) | ${llmsCount} / ${total} | **${payload.protocolAdoption.llmsTxtPublished.pct}%** |`,
      `| Verified Custom \`/agents.md\` | ${customAgentsCount} / ${total} | **${payload.protocolAdoption.customVerifiedAgentsMd.pct}%** |`,
      `| Stock Boilerplate \`/agents.md\` | ${stockAgentsCount} / ${total} | **${payload.protocolAdoption.stockBoilerplateAgentsMd.pct}%** |`,
      `| 3-Pillar \`schema.org\` \`JSON-LD\` (Entity + Offer + FAQPage) | ${threePillarJsonLdCount} / ${total} | **${payload.protocolAdoption.threePillarJsonLd.pct}%** |`,
      `| Edge WAF / \`robots.txt\` Crawler Restrictions | ${wafRestrictedCount} / ${total} | **${payload.protocolAdoption.wafOrBotRestricted.pct}%** |`,
      '',
      '## Architecture Cohort Split',
      '| Architecture Cohort | Sample Size | Mean Readiness Score |',
      '| :--- | :--- | :--- |',
      `| Native Shopify OS 2.0 Storefronts | ${shopifyCohort.length} | **${shopifyMean} / 100** |`,
      `| B2B SaaS & AI Infrastructure | ${saasCohort.length} | **${saasMean} / 100** |`,
      `| Custom Headless Next.js DTC Storefronts | ${headlessDtcCohort.length} | **${headlessMean} / 100** (\`${headlessVsShopifyDelta}\` pts vs. Shopify) |`,
      '',
      '## Top 12 Highest-Scoring Domains',
      '| Domain | Stack | Score | `/llms.txt` | `/agents.md` | `JSON-LD` Pillars |',
      '| :--- | :--- | :--- | :--- | :--- | :--- |',
      ...topLeaders.map(
        (item) =>
          `| [${item.domain}](${item.reportUrl}) | ${item.detectedPlatformLabel} | **${item.readinessScore} / 100** | ${item.llmsTxtStatus} | ${item.agentsMdStatus} | ${item.jsonLdPillarsPassed} / 3 |`
      ),
      '',
      '---',
      'Measured over live HTTPS by Verisource (`VerisourceScan/1.0`) — https://verisource.dev',
      '',
    ].join('\n');

    return new Response(md, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition':
          'inline; filename="verisource-2026-ai-readiness-benchmark.md"',
        'Cache-Control':
          'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Cache-Control':
        'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
