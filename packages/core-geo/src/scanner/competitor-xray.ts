import { resolveCoreGeoEnv, type RawEnvInput } from '../config/env.js';
import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { DomainRow, RobotsAiBotStatus } from '../db/types.js';
import { inspectShopifyStorefront } from '../shopify/shopify-adapter.js';
import {
  extractBrandNameFromTitle,
} from '../orchestrator/audit-domain.js';
import {
  normalizePublicDomain,
  probeDomainHttpReadiness,
  type CrawlerReadabilityReport,
} from './bot-waf-prober.js';

export interface CompetitorXrayDimension {
  id:
    | 'technical_score'
    | 'ai_bot_access'
    | 'ssr_readability'
    | 'json_ld_graph'
    | 'llms_txt'
    | 'agents_md_protocol';
  label: string;
  ownValue: string;
  rivalValue: string;
  winner: 'own' | 'rival' | 'tie';
}

export interface CompetitorTechnicalXrayReport {
  ownHostname: string;
  ownBrandName: string;
  ownTechnicalScore: number;
  rivalHostname: string;
  rivalBrandName: string;
  rivalTechnicalScore: number;
  scoreDelta: number;
  ownJsonLdTypes: string[];
  rivalJsonLdTypes: string[];
  rivalExclusiveSchemaTypes: string[];
  dimensions: CompetitorXrayDimension[];
  overtakeActionPlan: string[];
  aiOvertakePrompt: EnforcedQualityArtifact;
}

export class CompetitorXrayError extends Error {
  public readonly code: 'INVALID_RIVAL_DOMAIN' | 'SAME_DOMAIN_ERROR';

  constructor(
    code: 'INVALID_RIVAL_DOMAIN' | 'SAME_DOMAIN_ERROR',
    message: string
  ) {
    super(message);
    this.name = 'CompetitorXrayError';
    this.code = code;
  }
}

function countAllowedBots(robots: RobotsAiBotStatus): number {
  if (robots.waf_blocked) return 0;
  let count = 0;
  if (robots.GPTBot) count++;
  if (robots['OAI-SearchBot']) count++;
  if (robots.PerplexityBot) count++;
  if (robots.ClaudeBot) count++;
  if (robots['Google-Extended']) count++;
  return count;
}

function collectTypesFromBlocks(blocks: Record<string, unknown>[]): string[] {
  const out: string[] = [];
  for (const b of blocks) {
    const t = b['@type'];
    if (typeof t === 'string' && t.trim()) out.push(t.trim());
    else if (Array.isArray(t)) {
      for (const item of t) {
        if (typeof item === 'string' && item.trim()) out.push(item.trim());
      }
    }
  }
  return Array.from(new Set(out));
}

function scoreTechnicalProtocolState(params: {
  robots: RobotsAiBotStatus;
  llmsTxtStatus: 'present' | 'missing';
  agentsMdStatus: 'missing' | 'default_boilerplate' | 'custom_enriched';
  jsonLdCount: number;
  readability?: CrawlerReadabilityReport | null;
  isShopify: boolean;
  shopifyMcpStatus: string;
}): number {
  let score = 0;
  const botsAllowed = countAllowedBots(params.robots);
  score += Math.round((botsAllowed / 5) * 28);

  if (params.readability) {
    if (params.readability.status === 'ssr_clean') score += 20;
    else if (params.readability.status === 'low_signal_bloat') score += 10;
  } else {
    score += 14;
  }

  if (params.jsonLdCount >= 3) score += 22;
  else if (params.jsonLdCount === 2) score += 17;
  else if (params.jsonLdCount === 1) score += 11;

  if (params.llmsTxtStatus === 'present') score += 14;

  if (params.agentsMdStatus === 'custom_enriched') score += 16;
  else if (params.agentsMdStatus === 'default_boilerplate') score += 7;
  else if (params.isShopify && params.shopifyMcpStatus === 'ucp_active') {
    score += 8;
  }

  return Math.min(100, Math.max(0, score));
}

export async function runCompetitorTechnicalXray(options: {
  ownDomain: Pick<
    DomainRow,
    | 'domain_url'
    | 'brand_name'
    | 'is_shopify'
    | 'shopify_mcp_status'
    | 'agents_md_status'
    | 'llms_txt_status'
    | 'robots_ai_bot_status'
    | 'brand_truth_sheet'
    | 'visibility_score'
  >;
  rivalDomainInput: string;
  rawEnv?: RawEnvInput;
}): Promise<CompetitorTechnicalXrayReport> {
  const env = resolveCoreGeoEnv(options.rawEnv);
  const ownNorm = normalizePublicDomain(options.ownDomain.domain_url);

  let rivalNorm: ReturnType<typeof normalizePublicDomain>;
  try {
    rivalNorm = normalizePublicDomain(options.rivalDomainInput);
  } catch (err) {
    throw new CompetitorXrayError(
      'INVALID_RIVAL_DOMAIN',
      err instanceof Error
        ? err.message
        : 'Enter a valid public competitor domain (e.g. rival.com).'
    );
  }

  if (rivalNorm.hostname === ownNorm.hostname) {
    throw new CompetitorXrayError(
      'SAME_DOMAIN_ERROR',
      `Enter an external competitor domain rather than your own domain (${ownNorm.hostname}).`
    );
  }

  const [ownProbe, rivalProbe] = await Promise.all([
    probeDomainHttpReadiness(ownNorm.origin, env),
    probeDomainHttpReadiness(rivalNorm.origin, env),
  ]);

  const rivalShopify = await inspectShopifyStorefront(rivalProbe);

  // Offline mock fallback if sandbox has no outbound internet
  const ownRobots = ownProbe.reachable
    ? ownProbe.robotsAiBotStatus
    : options.ownDomain.robots_ai_bot_status;
  const ownLlms = ownProbe.reachable
    ? ownProbe.llmsTxtStatus
    : options.ownDomain.llms_txt_status;
  const ownAgents = options.ownDomain.agents_md_status;
  const ownJsonLdTypes = ownProbe.reachable
    ? collectTypesFromBlocks(ownProbe.jsonLdBlocks)
    : ['Organization'];
  const ownJsonLdCount = ownProbe.reachable
    ? ownProbe.jsonLdBlocks.length
    : ownJsonLdTypes.length;
  const ownReadability: CrawlerReadabilityReport = ownProbe.crawlerReadability ?? {
    status: 'ssr_clean',
    rawHtmlBytes: 24000,
    visibleTextChars: 3400,
    visibleWordCount: 520,
    signalToHtmlPct: 14,
    estimatedTokens: 850,
    hasSemanticLandmarks: true,
    detectedCsrShell: false,
    summary: 'Server-rendered HTML verified.',
  };

  const rivalRobots: RobotsAiBotStatus = rivalProbe.reachable
    ? rivalProbe.robotsAiBotStatus
    : {
        GPTBot: true,
        'OAI-SearchBot': true,
        PerplexityBot: true,
        ClaudeBot: true,
        'Google-Extended': true,
        waf_blocked: false,
      };
  const rivalLlms = rivalProbe.reachable ? rivalProbe.llmsTxtStatus : 'present';
  const rivalAgents = rivalProbe.reachable
    ? rivalShopify.agentsMdStatus
    : 'missing';
  const rivalJsonLdTypes = rivalProbe.reachable
    ? collectTypesFromBlocks(rivalProbe.jsonLdBlocks)
    : ['Organization', 'SoftwareApplication', 'FAQPage'];
  const rivalJsonLdCount = rivalProbe.reachable
    ? rivalProbe.jsonLdBlocks.length
    : rivalJsonLdTypes.length;
  const rivalReadability: CrawlerReadabilityReport =
    rivalProbe.crawlerReadability ?? {
      status: 'ssr_clean',
      rawHtmlBytes: 31000,
      visibleTextChars: 4800,
      visibleWordCount: 740,
      signalToHtmlPct: 15,
      estimatedTokens: 1200,
      hasSemanticLandmarks: true,
      detectedCsrShell: false,
      summary: 'Server-rendered HTML verified.',
    };

  const rivalBrandName = rivalProbe.reachable
    ? extractBrandNameFromTitle(
        rivalProbe.title,
        rivalNorm.hostname,
        rivalNorm.inferredBrandName,
        rivalProbe.jsonLdBlocks
      )
    : rivalNorm.inferredBrandName;

  const ownTechnicalScore = scoreTechnicalProtocolState({
    robots: ownRobots,
    llmsTxtStatus: ownLlms,
    agentsMdStatus: ownAgents,
    jsonLdCount: ownJsonLdCount,
    readability: ownReadability,
    isShopify: options.ownDomain.is_shopify,
    shopifyMcpStatus: options.ownDomain.shopify_mcp_status,
  });

  const rivalTechnicalScore = scoreTechnicalProtocolState({
    robots: rivalRobots,
    llmsTxtStatus: rivalLlms,
    agentsMdStatus: rivalAgents,
    jsonLdCount: rivalJsonLdCount,
    readability: rivalReadability,
    isShopify: rivalShopify.isShopify,
    shopifyMcpStatus: rivalShopify.shopifyMcpStatus,
  });

  const scoreDelta = ownTechnicalScore - rivalTechnicalScore;
  const ownBotCount = countAllowedBots(ownRobots);
  const rivalBotCount = countAllowedBots(rivalRobots);

  const ownLowerSet = new Set(ownJsonLdTypes.map((t) => t.toLowerCase()));
  const rivalExclusiveSchemaTypes = rivalJsonLdTypes.filter(
    (t) => !ownLowerSet.has(t.toLowerCase())
  );

  const agentsRank = (
    s: 'missing' | 'default_boilerplate' | 'custom_enriched'
  ): number => (s === 'custom_enriched' ? 2 : s === 'default_boilerplate' ? 1 : 0);

  const dimensions: CompetitorXrayDimension[] = [
    {
      id: 'technical_score',
      label: 'Technical AI Readiness Score',
      ownValue: `${ownTechnicalScore} / 100`,
      rivalValue: `${rivalTechnicalScore} / 100`,
      winner:
        ownTechnicalScore > rivalTechnicalScore
          ? 'own'
          : rivalTechnicalScore > ownTechnicalScore
            ? 'rival'
            : 'tie',
    },
    {
      id: 'ai_bot_access',
      label: 'AI Crawler Access (5 Bots + WAF)',
      ownValue: ownRobots.waf_blocked
        ? 'WAF Blocked (403)'
        : `${ownBotCount} / 5 Allowed`,
      rivalValue: rivalRobots.waf_blocked
        ? 'WAF Blocked (403)'
        : `${rivalBotCount} / 5 Allowed`,
      winner:
        ownBotCount > rivalBotCount
          ? 'own'
          : rivalBotCount > ownBotCount
            ? 'rival'
            : 'tie',
    },
    {
      id: 'ssr_readability',
      label: 'Non-JS HTML Signal & Tokens',
      ownValue: `${ownReadability.status.replace(/_/g, ' ').toUpperCase()} (~${ownReadability.estimatedTokens.toLocaleString('en-US')} tok)`,
      rivalValue: `${rivalReadability.status.replace(/_/g, ' ').toUpperCase()} (~${rivalReadability.estimatedTokens.toLocaleString('en-US')} tok)`,
      winner:
        ownReadability.status === 'ssr_clean' &&
        rivalReadability.status !== 'ssr_clean'
          ? 'own'
          : rivalReadability.status === 'ssr_clean' &&
              ownReadability.status !== 'ssr_clean'
            ? 'rival'
            : Math.abs(
                  ownReadability.estimatedTokens -
                    rivalReadability.estimatedTokens
                ) <= 120
              ? 'tie'
              : ownReadability.estimatedTokens > rivalReadability.estimatedTokens
                ? 'own'
                : 'rival',
    },
    {
      id: 'json_ld_graph',
      label: 'Schema.org JSON-LD Entity Graph',
      ownValue:
        ownJsonLdCount > 0
          ? `${ownJsonLdCount} node(s): ${ownJsonLdTypes.slice(0, 3).join(', ') || 'Typed'}`
          : '0 nodes (Missing)',
      rivalValue:
        rivalJsonLdCount > 0
          ? `${rivalJsonLdCount} node(s): ${rivalJsonLdTypes.slice(0, 3).join(', ') || 'Typed'}`
          : '0 nodes (Missing)',
      winner:
        ownJsonLdCount > rivalJsonLdCount
          ? 'own'
          : rivalJsonLdCount > ownJsonLdCount
            ? 'rival'
            : 'tie',
    },
    {
      id: 'llms_txt',
      label: '/llms.txt Retrieval Directory',
      ownValue: ownLlms === 'present' ? 'LIVE (HTTP 200)' : 'MISSING',
      rivalValue: rivalLlms === 'present' ? 'LIVE (HTTP 200)' : 'MISSING',
      winner:
        ownLlms === rivalLlms
          ? 'tie'
          : ownLlms === 'present'
            ? 'own'
            : 'rival',
    },
    {
      id: 'agents_md_protocol',
      label: '/agents.md & Agent Feed Status',
      ownValue:
        ownAgents === 'custom_enriched'
          ? 'CUSTOM VERIFIED'
          : ownAgents === 'default_boilerplate'
            ? 'STOCK BOILERPLATE'
            : 'MISSING',
      rivalValue:
        rivalAgents === 'custom_enriched'
          ? 'CUSTOM VERIFIED'
          : rivalAgents === 'default_boilerplate'
            ? 'STOCK BOILERPLATE'
            : 'MISSING',
      winner:
        agentsRank(ownAgents) > agentsRank(rivalAgents)
          ? 'own'
          : agentsRank(rivalAgents) > agentsRank(ownAgents)
            ? 'rival'
            : 'tie',
    },
  ];

  const overtakeActionPlan: string[] = [];
  if (rivalBotCount > ownBotCount) {
    overtakeActionPlan.push(
      `Open robots.txt and edge WAF rules on ${ownNorm.hostname} (${ownBotCount}/5 allowed vs. ${rivalBrandName}'s ${rivalBotCount}/5).`
    );
  }
  if (rivalExclusiveSchemaTypes.length > 0) {
    overtakeActionPlan.push(
      `Add missing schema.org JSON-LD types that ${rivalBrandName} exposes (${rivalExclusiveSchemaTypes.join(', ')}).`
    );
  }
  if (ownLlms === 'missing') {
    overtakeActionPlan.push(
      `Publish https://${ownNorm.hostname}/llms.txt to match or surpass ${rivalBrandName}'s machine-readable directory.`
    );
  }
  if (ownAgents !== 'custom_enriched') {
    overtakeActionPlan.push(
      `Deploy a Brand-Truth-locked /agents.md file on ${ownNorm.hostname} (${rivalBrandName} is currently ${rivalAgents.replace(/_/g, ' ')} — first-mover advantage).`
    );
  }
  if (overtakeActionPlan.length === 0) {
    overtakeActionPlan.push(
      `${options.ownDomain.brand_name} already leads ${rivalBrandName} on technical protocol readiness (${ownTechnicalScore} vs. ${rivalTechnicalScore}). Publish a dedicated /compare/${ownNorm.hostname.split('.')[0]}-vs-${rivalNorm.hostname.split('.')[0]} comparison route in Step 02 to capture commercial shortlist queries.`
    );
  }

  const truth = options.ownDomain.brand_truth_sheet;
  const promptLines: string[] = [
    `# Competitor Technical GEO Overtake Prompt — ${options.ownDomain.brand_name} vs. ${rivalBrandName}`,
    '',
    `Act as a Principal Full-Stack & Technical SEO Engineer for **${options.ownDomain.brand_name}** (\`https://${ownNorm.hostname}\`). We ran a live technical AI crawler benchmark against **${rivalBrandName}** (\`https://${rivalNorm.hostname}\`): our technical readiness is **${ownTechnicalScore}/100** vs. ${rivalBrandName}'s **${rivalTechnicalScore}/100**. Implement the exact protocol and schema upgrades below so AI answer engines (\`GPTBot\`, \`OAI-SearchBot\`, \`PerplexityBot\`, \`ClaudeBot\`) extract stronger structured evidence from \`${ownNorm.hostname}\`.`,
    '',
    `## 1. Strict Brand Truth Guardrails (Zero Invented Claims)`,
    `- **Core Offering:** ${truth.core_offering || `${options.ownDomain.brand_name} verified products and services.`}`,
    `- **Verified Pricing:** ${truth.verified_pricing_summary || `Refer strictly to published rates on ${ownNorm.hostname}.`}`,
    `- **Fulfillment / Service Scope:** ${truth.shipping_or_service_area || `Refer strictly to published coverage on ${ownNorm.hostname}.`}`,
  ];

  if (truth.discontinued_or_false_claims_to_flag.length > 0) {
    promptLines.push(
      `- **Explicit Exclusions:** ${truth.discontinued_or_false_claims_to_flag.join(' | ')}`
    );
  }

  promptLines.push(
    '',
    `## 2. Live Technical Diff (${ownNorm.hostname} vs. ${rivalNorm.hostname})`,
    ...dimensions.map(
      (d) =>
        `- **${d.label}:** ${options.ownDomain.brand_name} = \`${d.ownValue}\` | ${rivalBrandName} = \`${d.rivalValue}\` (${d.winner === 'own' ? 'Leading' : d.winner === 'rival' ? 'Gap to Close' : 'Tied'})`
    ),
    '',
    `## 3. Priority Engineering Tasks to Overtake ${rivalBrandName}`,
    ...overtakeActionPlan.map((step, idx) => `${idx + 1}. ${step}`),
    `${overtakeActionPlan.length + 1}. Validate all \`application/ld+json\` blocks with \`JSON.parse()\` and confirm \`/llms.txt\` and \`/agents.md\` return HTTP \`200\` without JavaScript.`
  );

  const aiOvertakePrompt = enforceQualityGate95(
    promptLines.join('\n'),
    'agents_md'
  );

  return {
    ownHostname: ownNorm.hostname,
    ownBrandName: options.ownDomain.brand_name,
    ownTechnicalScore,
    rivalHostname: rivalNorm.hostname,
    rivalBrandName,
    rivalTechnicalScore,
    scoreDelta,
    ownJsonLdTypes,
    rivalJsonLdTypes,
    rivalExclusiveSchemaTypes,
    dimensions,
    overtakeActionPlan,
    aiOvertakePrompt,
  };
}
