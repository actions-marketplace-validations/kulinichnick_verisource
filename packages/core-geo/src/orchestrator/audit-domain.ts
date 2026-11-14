import { resolveCoreGeoEnv, type RawEnvInput } from '../config/env.js';
import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type {
  AgencyPitchReportRow,
  AgentsMdStatus,
  AiEngine,
  BrandTruthSheet,
  CitationSnapshotRow,
  DomainRow,
  FanoutTelemetryType,
  FixType,
  HallucinationDetail,
  LlmsTxtStatus,
  PitchSummaryPayload,
  RobotsAiBotStatus,
  ShopifyMcpStatus,
} from '../db/types.js';
import { PATIENT_ZERO_DOMAINS } from '../fixtures/patient-zero.js';
import {
  classifyIndustryVertical,
  generateGeoFixBundle,
  type GeneratedFixDraft,
  type IndustryVerticalId,
} from '../generator/fix-generator.js';
import {
  normalizePublicDomain,
  probeDomainHttpReadiness,
  type DomainHttpProbeResult,
} from '../scanner/bot-waf-prober.js';
import {
  generateDefaultPromptsForDomain,
  runMultiEnginePromptScan,
  type EngineScanResult,
} from '../scanner/fanout-scanner.js';
import {
  inspectShopifyStorefront,
  type ShopifyInspectionResult,
} from '../shopify/shopify-adapter.js';
import {
  autoDraftBrandTruthSheet,
  computeAccuracyScore,
} from '../watchdog/hallucination-watchdog.js';

export interface ReadinessScanSummary {
  domainUrl: string;
  hostname: string;
  brandName: string;
  industryVertical: IndustryVerticalId;
  visibilityScore: number;
  accuracyScore: number;
  isShopify: boolean;
  shopifyMcpStatus: ShopifyMcpStatus;
  agentsMdStatus: AgentsMdStatus;
  llmsTxtStatus: LlmsTxtStatus;
  robotsAiBotStatus: RobotsAiBotStatus;
  jsonLdCount: number;
  samplePromptResult: {
    promptText: string;
    aiEngine: string;
    brandMentioned: boolean;
    competitorsMentioned: string[];
    citedSourceUrlsBlurred: string[];
    hallucinationDetected: boolean;
    fanoutTelemetryType?: FanoutTelemetryType;
    decompiledFanoutQueries?: string[];
  };
  upgradeUrl: string;
}

export interface FullGeoAuditResult {
  domainUrl: string;
  hostname: string;
  brandName: string;
  industryVertical: IndustryVerticalId;
  visibilityScore: number;
  accuracyScore: number;
  probe: DomainHttpProbeResult;
  shopify: ShopifyInspectionResult;
  brandTruthSheet: BrandTruthSheet;
  trackedPrompts: string[];
  scanResults: EngineScanResult[];
  allHallucinations: HallucinationDetail[];
  fixes: GeneratedFixDraft[];
  pitchSummaryPayload: PitchSummaryPayload;
}

export interface LiveFixCheckItem {
  id: 'json_ld' | 'llms_txt' | 'agents_md' | 'crawler_waf';
  label: string;
  live: boolean;
  detail: string;
}

export interface LiveFixVerificationReport {
  domainUrl: string;
  hostname: string;
  brandName: string;
  checkedAt: string;
  isShopify: boolean;
  shopifyMcpStatus: ShopifyMcpStatus;
  agentsMdStatus: AgentsMdStatus;
  llmsTxtStatus: LlmsTxtStatus;
  robotsAiBotStatus: RobotsAiBotStatus;
  jsonLdCount: number;
  hasFaqSchema: boolean;
  appliedFixTypes: FixType[];
  checks: LiveFixCheckItem[];
}

function hasFaqPageJsonLd(jsonLdBlocks: Record<string, unknown>[]): boolean {
  return jsonLdBlocks.some((block) => {
    const rawType = block['@type'];
    if (typeof rawType === 'string') {
      return rawType.toLowerCase() === 'faqpage';
    }
    if (Array.isArray(rawType)) {
      return rawType.some((t) => String(t).toLowerCase() === 'faqpage');
    }
    return false;
  });
}

export function isFixTypeLiveOnDomain(
  fixType: FixType,
  probe: DomainHttpProbeResult,
  shopify: ShopifyInspectionResult
): boolean {
  switch (fixType) {
    case 'json_ld_schema':
      return probe.jsonLdBlocks.length >= 2;
    case 'llms_txt':
      return probe.llmsTxtStatus === 'present';
    case 'agents_md':
    case 'shopify_agents_liquid':
      return shopify.agentsMdStatus === 'custom_enriched';
    case 'fanout_faq_block':
      return hasFaqPageJsonLd(probe.jsonLdBlocks);
    case 'citation_outreach_brief':
      return false;
  }
}

export function computeVisibilityScore(params: {
  robotsAiBotStatus: RobotsAiBotStatus;
  llmsTxtStatus: LlmsTxtStatus;
  agentsMdStatus: AgentsMdStatus;
  jsonLdCount: number;
  isShopify: boolean;
  shopifyMcpStatus: ShopifyMcpStatus;
  scanResults: EngineScanResult[];
}): number {
  let score = 0;

  // 1. Technical AI Crawler & WAF Access (up to 28 pts)
  const botsAllowedCount = [
    params.robotsAiBotStatus.GPTBot,
    params.robotsAiBotStatus['OAI-SearchBot'],
    params.robotsAiBotStatus.PerplexityBot,
    params.robotsAiBotStatus.ClaudeBot,
  ].filter(Boolean).length;

  score += botsAllowedCount * 5; // max 20
  if (!params.robotsAiBotStatus.waf_blocked) score += 8;

  // 2. On-Site Agent Protocol Readiness (up to 32 pts)
  if (params.llmsTxtStatus === 'present') score += 10;
  if (params.agentsMdStatus === 'custom_enriched') score += 12;
  else if (params.agentsMdStatus === 'default_boilerplate') score += 5;

  if (params.jsonLdCount >= 2) score += 10;
  else if (params.jsonLdCount === 1) score += 6;

  if (params.isShopify && params.shopifyMcpStatus === 'ucp_active') {
    score = Math.min(60, score + 4);
  }

  // 3. Multi-Engine Mention & Citation Rank Share (up to 40 pts)
  if (params.scanResults.length > 0) {
    let mentionPoints = 0;
    const maxPerScan = 40 / params.scanResults.length;
    for (const scan of params.scanResults) {
      if (scan.brandMentioned) {
        if (scan.citationRank === 1) mentionPoints += maxPerScan;
        else if (scan.citationRank === 2) mentionPoints += maxPerScan * 0.8;
        else mentionPoints += maxPerScan * 0.6;
      }
    }
    score += Math.round(mentionPoints);
  }

  return Math.max(5, Math.min(100, Math.round(score)));
}

function maskUrlForTeaser(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    return `https://${host}/••••••-locked-citation`;
  } catch {
    return 'https://••••••.com/locked-citation';
  }
}

const INTERSTITIAL_OR_ERROR_TITLE =
  /^(?:just a moment|attention required|access denied|forbidden|403\b|404\b|500\b|502\b|503\b|page not found|security check|ddos-guard|cloudflare|verify you are|one moment, please|home$)/i;

const BRAND_JSONLD_TYPES = new Set([
  'organization',
  'corporation',
  'localbusiness',
  'store',
  'brand',
  'softwareapplication',
  'website',
]);

function extractJsonLdBrandCandidates(
  jsonLdBlocks: Record<string, unknown>[] | undefined
): string[] {
  if (!jsonLdBlocks || jsonLdBlocks.length === 0) return [];
  const names: string[] = [];
  for (const block of jsonLdBlocks) {
    const rawType = block['@type'];
    const types = Array.isArray(rawType)
      ? rawType.map((t) => String(t).toLowerCase())
      : typeof rawType === 'string'
        ? [rawType.toLowerCase()]
        : [];
    if (!types.some((t) => BRAND_JSONLD_TYPES.has(t))) continue;

    const rawName = typeof block.name === 'string' ? block.name.trim() : '';
    if (
      rawName.length >= 2 &&
      rawName.length <= 38 &&
      !INTERSTITIAL_OR_ERROR_TITLE.test(rawName)
    ) {
      names.push(rawName);
    }
  }
  return names;
}

export function extractBrandNameFromTitle(
  rawTitle: string | null | undefined,
  hostname: string,
  fallbackBrandName: string,
  jsonLdBlocks?: Record<string, unknown>[]
): string {
  const rootSlug = (hostname.toLowerCase().split('.')[0] ?? '').replace(
    /[^a-z0-9]/g,
    ''
  );
  const jsonLdNames = extractJsonLdBrandCandidates(jsonLdBlocks);

  if (rootSlug.length >= 3 && jsonLdNames.length > 0) {
    const exactSchema = jsonLdNames.find(
      (n) => n.toLowerCase().replace(/[^a-z0-9]/g, '') === rootSlug
    );
    if (exactSchema) return exactSchema;

    const closeSchema = jsonLdNames.find((n) => {
      const words = n.split(/\s+/).length;
      if (n.length > 32 || words > 4) return false;
      const slug = n.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        slug.length >= 4 &&
        (slug.startsWith(rootSlug) || rootSlug.startsWith(slug))
      );
    });
    if (closeSchema) return closeSchema;
  }

  const trimmed = rawTitle?.trim() ?? '';
  if (!trimmed || INTERSTITIAL_OR_ERROR_TITLE.test(trimmed)) {
    const schemaFallback = jsonLdNames.find(
      (n) => n.length <= 32 && n.split(/\s+/).length <= 4
    );
    return schemaFallback ?? fallbackBrandName;
  }

  const segments = trimmed
    .split(/\s*[|–—·•:]\s*|\s+-\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !INTERSTITIAL_OR_ERROR_TITLE.test(s));

  if (segments.length === 0) {
    const schemaFallback = jsonLdNames.find(
      (n) => n.length <= 32 && n.split(/\s+/).length <= 4
    );
    return schemaFallback ?? fallbackBrandName;
  }

  if (rootSlug.length >= 3) {
    // 1. Exact alphanumeric match against domain root (e.g. "Siege Media" <-> siegemedia.com)
    const exactMatch = segments.find((seg) => {
      if (seg.length > 38) return false;
      const segSlug = seg.toLowerCase().replace(/[^a-z0-9]/g, '');
      return segSlug === rootSlug;
    });
    if (exactMatch) return exactMatch;

    // 2. Prefix/containment match with concise brand length (<= 32 chars, <= 4 words)
    const closeMatch = segments.find((seg) => {
      const wordCount = seg.split(/\s+/).length;
      if (seg.length > 32 || wordCount > 4) return false;
      const segSlug = seg.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        segSlug.length >= 4 &&
        (segSlug.startsWith(rootSlug) || rootSlug.startsWith(segSlug))
      );
    });
    if (closeMatch) return closeMatch;
  }

  const first = segments[0]!;
  const firstWords = first.split(/\s+/).length;
  if (first.length <= 32 && firstWords <= 4) {
    return first;
  }

  const schemaFallback = jsonLdNames.find(
    (n) => n.length <= 32 && n.split(/\s+/).length <= 4
  );
  return schemaFallback ?? fallbackBrandName;
}

export function buildAgencyPitchPayload(params: {
  brandName: string;
  robotsAiBotStatus: RobotsAiBotStatus;
  llmsTxtStatus: LlmsTxtStatus;
  agentsMdStatus: AgentsMdStatus;
  isShopify: boolean;
  shopifyMcpStatus: ShopifyMcpStatus;
  jsonLdCount: number;
  scanResults: EngineScanResult[];
  allHallucinations: HallucinationDetail[];
}): PitchSummaryPayload {
  const topGaps: string[] = [];

  if (params.robotsAiBotStatus.waf_blocked || !params.robotsAiBotStatus.PerplexityBot) {
    topGaps.push(
      'AI retrieval crawlers (PerplexityBot / GPTBot) encounter edge WAF blocks or robots.txt restrictions.'
    );
  }
  if (params.llmsTxtStatus === 'missing') {
    topGaps.push('Missing /llms.txt machine-readable entity and pricing summary.');
  }
  if (params.agentsMdStatus === 'missing') {
    topGaps.push('Missing /agents.md agent interaction and hallucination guardrail file.');
  } else if (params.agentsMdStatus === 'default_boilerplate') {
    topGaps.push(
      'Storefront serves generic Shopify boilerplate /agents.md without verified brand pricing or shipping exclusions.'
    );
  }
  if (params.jsonLdCount === 0) {
    topGaps.push('Homepage lacks structured JSON-LD Organization and FAQPage entity graphs.');
  }
  if (topGaps.length === 0) {
    topGaps.push(
      'Third-party comparison threads outrank direct domain pages across commercial AI fanout queries.'
    );
  }

  const GENERIC_RIVAL_PLACEHOLDER =
    /^(?:reddit\.com buyer threads|editorial comparison guides|top\s+.+\s+category peer(?:\s*#\d+)?)$/i;

  const normalizeRivalKey = (label: string): string =>
    label
      .toLowerCase()
      .replace(/^www\./, '')
      .replace(/\.[a-z]{2,}(?:\.[a-z]{2})?$/, '')
      .replace(/(?:app|hq|labs|co|inc)$/i, '')
      .replace(/[^a-z0-9]/g, '');

  const liveRaw = params.scanResults
    .filter((s) => s.fanoutTelemetryType !== 'mock_fixture')
    .flatMap((s) => s.competitorsMentioned);
  const specificLive = liveRaw.filter(
    (r) => r.trim().length > 0 && !GENERIC_RIVAL_PLACEHOLDER.test(r.trim())
  );
  const fallbackRaw = params.scanResults
    .filter((s) => s.fanoutTelemetryType === 'mock_fixture')
    .flatMap((s) => s.competitorsMentioned);

  const candidateRivals =
    specificLive.length > 0
      ? specificLive
      : liveRaw.length > 0
        ? liveRaw
        : fallbackRaw;

  const seenRivalKeys = new Set<string>();
  const competitorsWinning: string[] = [];
  // Prefer human-cased brand names ahead of lowercase hostnames when deduplicating
  const orderedCandidates = [
    ...candidateRivals.filter((r) => !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(r.trim())),
    ...candidateRivals.filter((r) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(r.trim())),
  ];
  for (const raw of orderedCandidates) {
    const cleaned = raw.trim();
    const key = normalizeRivalKey(cleaned) || cleaned.toLowerCase();
    if (!key || seenRivalKeys.has(key)) continue;
    seenRivalKeys.add(key);
    competitorsWinning.push(cleaned);
    if (competitorsWinning.length >= 5) break;
  }

  const recommendedFixes: string[] = [
    'Publish 9.5+/10 graded Organization + FAQPage JSON-LD schema.',
    params.isShopify
      ? 'Deploy custom Shopify agents.md.liquid referencing /api/ucp/mcp.'
      : 'Publish canonical /agents.md and /llms.txt truth files at domain root.',
    'Place factual brand specs on top third-party URLs currently citing competitors.',
  ];

  return {
    top_gaps: topGaps.slice(0, 4),
    competitors_winning: competitorsWinning,
    hallucination_examples: params.allHallucinations.slice(0, 3),
    recommended_fixes: recommendedFixes,
  };
}

async function resolveProbeAndShopify(
  domainInput: string,
  rawEnv?: RawEnvInput,
  skipDirectHttpProbe?: boolean
): Promise<{
  env: ReturnType<typeof resolveCoreGeoEnv>;
  probe: DomainHttpProbeResult;
  shopify: ShopifyInspectionResult;
  brandName: string;
}> {
  const env = resolveCoreGeoEnv(rawEnv);
  const normalized = normalizePublicDomain(domainInput);

  // Check if offline/mock Patient Zero store fallback is needed when network is unreachable or skipped (MV3 sandbox)
  const fixture = PATIENT_ZERO_DOMAINS.find((d) =>
    d.domain_url.toLowerCase().includes(normalized.hostname)
  );

  if (skipDirectHttpProbe) {
    const sandboxProbe: DomainHttpProbeResult = {
      domain: normalized,
      reachable: Boolean(fixture),
      httpStatus: fixture ? 200 : null,
      title: fixture?.brand_name ?? normalized.inferredBrandName,
      metaDescription: fixture?.brand_truth_sheet.core_offering ?? null,
      jsonLdBlocks: [],
      robotsAiBotStatus: fixture
        ? structuredClone(fixture.robots_ai_bot_status)
        : {
            GPTBot: true,
            'OAI-SearchBot': true,
            PerplexityBot: true,
            ClaudeBot: true,
            'Google-Extended': true,
            waf_blocked: false,
          },
      llmsTxtStatus: fixture?.llms_txt_status ?? 'missing',
      llmsTxtExcerpt: null,
      agentsMdRaw: null,
      agentsMdInitialStatus: fixture?.agents_md_status ?? 'missing',
      htmlSignalsShopify: fixture?.is_shopify ?? false,
      extractedPriceMentions: [],
      extractedShippingMentions: fixture
        ? [fixture.brand_truth_sheet.shipping_or_service_area]
        : [],
    };

    const sandboxShopify: ShopifyInspectionResult = {
      isShopify: fixture?.is_shopify ?? false,
      shopifyMcpStatus: fixture?.shopify_mcp_status ?? 'unavailable',
      activeMcpEndpoint:
        fixture?.shopify_mcp_status === 'ucp_active'
          ? `${normalized.origin}/api/ucp/mcp`
          : fixture?.shopify_mcp_status === 'legacy_mcp_active'
            ? `${normalized.origin}/api/mcp`
            : null,
      exposedMcpTools: fixture?.is_shopify
        ? ['search_shop_catalog', 'get_shop_policies']
        : [],
      agentsMdStatus: fixture?.agents_md_status ?? 'missing',
      catalogSkus: [],
      priceRangeSummary:
        fixture?.brand_truth_sheet.verified_pricing_summary ?? null,
    };

    return {
      env,
      probe: sandboxProbe,
      shopify: sandboxShopify,
      brandName: fixture?.brand_name ?? normalized.inferredBrandName,
    };
  }

  const liveProbe = await probeDomainHttpReadiness(domainInput, env);

  if (!liveProbe.reachable && fixture) {
    const fallbackProbe: DomainHttpProbeResult = {
      domain: normalized,
      reachable: true,
      httpStatus: 200,
      title: fixture.brand_name,
      metaDescription: fixture.brand_truth_sheet.core_offering,
      jsonLdBlocks: [],
      robotsAiBotStatus: structuredClone(fixture.robots_ai_bot_status),
      llmsTxtStatus: fixture.llms_txt_status,
      llmsTxtExcerpt: null,
      agentsMdRaw: null,
      agentsMdInitialStatus: fixture.agents_md_status,
      htmlSignalsShopify: fixture.is_shopify,
      extractedPriceMentions: [],
      extractedShippingMentions: [
        fixture.brand_truth_sheet.shipping_or_service_area,
      ],
    };

    const fallbackShopify: ShopifyInspectionResult = {
      isShopify: fixture.is_shopify,
      shopifyMcpStatus: fixture.shopify_mcp_status,
      activeMcpEndpoint:
        fixture.shopify_mcp_status === 'ucp_active'
          ? `${normalized.origin}/api/ucp/mcp`
          : fixture.shopify_mcp_status === 'legacy_mcp_active'
            ? `${normalized.origin}/api/mcp`
            : null,
      exposedMcpTools: ['search_shop_catalog', 'get_shop_policies'],
      agentsMdStatus: fixture.agents_md_status,
      catalogSkus: [],
      priceRangeSummary: fixture.brand_truth_sheet.verified_pricing_summary,
    };

    return {
      env,
      probe: fallbackProbe,
      shopify: fallbackShopify,
      brandName: fixture.brand_name,
    };
  }

  const shopify = await inspectShopifyStorefront(liveProbe);

  // If running in mock mode for a Patient Zero store and live site had generic state, preserve deterministic demo richness
  if (env.providerMode === 'mock' && fixture) {
    liveProbe.robotsAiBotStatus = structuredClone(fixture.robots_ai_bot_status);
    shopify.isShopify = fixture.is_shopify;
    if (shopify.shopifyMcpStatus === 'unavailable') {
      shopify.shopifyMcpStatus = fixture.shopify_mcp_status;
      shopify.activeMcpEndpoint =
        fixture.shopify_mcp_status === 'ucp_active'
          ? `${normalized.origin}/api/ucp/mcp`
          : `${normalized.origin}/api/mcp`;
    }
    if (shopify.agentsMdStatus === 'missing') {
      shopify.agentsMdStatus = fixture.agents_md_status;
    }
  }

  const brandName =
    fixture?.brand_name ??
    extractBrandNameFromTitle(
      liveProbe.title,
      normalized.hostname,
      normalized.inferredBrandName,
      liveProbe.jsonLdBlocks
    );

  return { env, probe: liveProbe, shopify, brandName };
}

export async function runDomainReadinessScan(
  domainInput: string,
  rawEnv?: RawEnvInput
): Promise<ReadinessScanSummary> {
  const { env, probe, shopify, brandName } = await resolveProbeAndShopify(
    domainInput,
    rawEnv
  );

  const truthSheet = autoDraftBrandTruthSheet(probe, shopify);
  const prompts = generateDefaultPromptsForDomain(
    probe.domain,
    brandName,
    truthSheet.core_offering,
    shopify.isShopify
  );

  const firstPrompt = prompts[0] ?? `${brandName} reviews and pricing`;
  let teaserEngines: AiEngine[] = ['chatgpt'];
  if (env.providerMode === 'live') {
    const configuredLive: AiEngine[] = [];
    if (env.perplexityApiKey) configuredLive.push('perplexity');
    if (env.openaiApiKey) configuredLive.push('chatgpt');
    if (env.geminiApiKey) configuredLive.push('gemini');
    if (configuredLive.length > 0) {
      teaserEngines = [configuredLive[0]!];
    }
  }

  let teaserScans = await runMultiEnginePromptScan({
    prompts: [firstPrompt],
    engines: teaserEngines,
    domain: probe.domain,
    brandName,
    truthSheet,
    env,
  });

  if (
    env.providerMode === 'live' &&
    teaserScans[0]?.fanoutTelemetryType === 'mock_fixture'
  ) {
    const fallbackOrder: AiEngine[] = ['chatgpt', 'gemini', 'perplexity'];
    for (const candidate of fallbackOrder) {
      if (candidate === teaserEngines[0]) continue;
      const hasKey =
        (candidate === 'chatgpt' && Boolean(env.openaiApiKey)) ||
        (candidate === 'gemini' && Boolean(env.geminiApiKey)) ||
        (candidate === 'perplexity' && Boolean(env.perplexityApiKey));
      if (!hasKey) continue;

      const retry = await runMultiEnginePromptScan({
        prompts: [firstPrompt],
        engines: [candidate],
        domain: probe.domain,
        brandName,
        truthSheet,
        env,
      });
      if (retry[0] && retry[0].fanoutTelemetryType !== 'mock_fixture') {
        teaserScans = retry;
        break;
      }
    }
  }

  const sample = teaserScans[0]!;
  const allHallucinations = teaserScans.flatMap((s) => s.hallucinationDetails);

  const fixture = PATIENT_ZERO_DOMAINS.find((d) =>
    d.domain_url.toLowerCase().includes(probe.domain.hostname)
  );

  const visibilityScore =
    env.providerMode === 'mock' && fixture
      ? fixture.visibility_score
      : computeVisibilityScore({
          robotsAiBotStatus: probe.robotsAiBotStatus,
          llmsTxtStatus: probe.llmsTxtStatus,
          agentsMdStatus: shopify.agentsMdStatus,
          jsonLdCount: probe.jsonLdBlocks.length,
          isShopify: shopify.isShopify,
          shopifyMcpStatus: shopify.shopifyMcpStatus,
          scanResults: teaserScans,
        });

  const accuracyScore =
    env.providerMode === 'mock' && fixture
      ? fixture.accuracy_score
      : computeAccuracyScore(allHallucinations);

  const vertical = classifyIndustryVertical({
    hostname: probe.domain.hostname,
    brandName,
    coreOffering: truthSheet.core_offering,
    serviceArea: truthSheet.shipping_or_service_area,
    isShopify: shopify.isShopify,
  });

  return {
    domainUrl: probe.domain.origin,
    hostname: probe.domain.hostname,
    brandName,
    industryVertical: vertical.industryVertical,
    visibilityScore,
    accuracyScore,
    isShopify: shopify.isShopify,
    shopifyMcpStatus: shopify.shopifyMcpStatus,
    agentsMdStatus: shopify.agentsMdStatus,
    llmsTxtStatus: probe.llmsTxtStatus,
    robotsAiBotStatus: probe.robotsAiBotStatus,
    jsonLdCount: probe.jsonLdBlocks.length,
    samplePromptResult: {
      promptText: sample.promptText,
      aiEngine: sample.aiEngine,
      brandMentioned: sample.brandMentioned,
      competitorsMentioned: sample.competitorsMentioned,
      citedSourceUrlsBlurred: sample.citedSourceUrls.map(maskUrlForTeaser),
      hallucinationDetected: sample.hallucinationDetected,
      fanoutTelemetryType: sample.fanoutTelemetryType,
      decompiledFanoutQueries: sample.decompiledFanoutQueries.slice(0, 3),
    },
    upgradeUrl: `${env.appUrl}/pricing?domain=${encodeURIComponent(
      probe.domain.hostname
    )}`,
  };
}

export async function runFullGeoAudit(options: {
  domainInput: string;
  customBrandName?: string;
  customPrompts?: string[];
  customTruthSheet?: BrandTruthSheet;
  rawEnv?: RawEnvInput;
  skipDirectHttpProbe?: boolean;
}): Promise<FullGeoAuditResult> {
  const { env, probe, shopify, brandName: detectedBrand } =
    await resolveProbeAndShopify(
      options.domainInput,
      options.rawEnv,
      options.skipDirectHttpProbe
    );

  const brandName = options.customBrandName?.trim() || detectedBrand;
  const brandTruthSheet =
    options.customTruthSheet ?? autoDraftBrandTruthSheet(probe, shopify);

  const trackedPrompts =
    options.customPrompts && options.customPrompts.length > 0
      ? options.customPrompts
      : generateDefaultPromptsForDomain(
          probe.domain,
          brandName,
          brandTruthSheet.core_offering,
          shopify.isShopify
        );

  const scanResults = await runMultiEnginePromptScan({
    prompts: trackedPrompts,
    engines: ['chatgpt', 'gemini', 'perplexity'],
    domain: probe.domain,
    brandName,
    truthSheet: brandTruthSheet,
    env,
  });

  const allHallucinations = scanResults.flatMap((s) => s.hallucinationDetails);

  const fixture = PATIENT_ZERO_DOMAINS.find((d) =>
    d.domain_url.toLowerCase().includes(probe.domain.hostname)
  );

  const visibilityScore =
    env.providerMode === 'mock' && fixture && !options.customPrompts
      ? fixture.visibility_score
      : computeVisibilityScore({
          robotsAiBotStatus: probe.robotsAiBotStatus,
          llmsTxtStatus: probe.llmsTxtStatus,
          agentsMdStatus: shopify.agentsMdStatus,
          jsonLdCount: probe.jsonLdBlocks.length,
          isShopify: shopify.isShopify,
          shopifyMcpStatus: shopify.shopifyMcpStatus,
          scanResults,
        });

  const accuracyScore =
    env.providerMode === 'mock' && fixture && !options.customTruthSheet
      ? fixture.accuracy_score
      : computeAccuracyScore(allHallucinations);

  const fixes = generateGeoFixBundle({
    domain: probe.domain,
    brandName,
    truthSheet: brandTruthSheet,
    shopify,
    scanResults,
  });

  const pitchSummaryPayload = buildAgencyPitchPayload({
    brandName,
    robotsAiBotStatus: probe.robotsAiBotStatus,
    llmsTxtStatus: probe.llmsTxtStatus,
    agentsMdStatus: shopify.agentsMdStatus,
    isShopify: shopify.isShopify,
    shopifyMcpStatus: shopify.shopifyMcpStatus,
    jsonLdCount: probe.jsonLdBlocks.length,
    scanResults,
    allHallucinations,
  });

  const vertical = classifyIndustryVertical({
    hostname: probe.domain.hostname,
    brandName,
    coreOffering: brandTruthSheet.core_offering,
    serviceArea: brandTruthSheet.shipping_or_service_area,
    isShopify: shopify.isShopify,
  });

  return {
    domainUrl: probe.domain.origin,
    hostname: probe.domain.hostname,
    brandName,
    industryVertical: vertical.industryVertical,
    visibilityScore,
    accuracyScore,
    probe,
    shopify,
    brandTruthSheet,
    trackedPrompts,
    scanResults,
    allHallucinations,
    fixes,
    pitchSummaryPayload,
  };
}

export async function verifyLiveFixDeployment(
  domainInput: string,
  rawEnv?: RawEnvInput
): Promise<LiveFixVerificationReport> {
  const env = resolveCoreGeoEnv(rawEnv);
  const normalized = normalizePublicDomain(domainInput);
  const liveProbe = await probeDomainHttpReadiness(domainInput, env);
  const fixture = PATIENT_ZERO_DOMAINS.find((d) =>
    d.domain_url.toLowerCase().includes(normalized.hostname)
  );

  let probe = liveProbe;
  let shopify: ShopifyInspectionResult;

  if (!liveProbe.reachable && fixture) {
    probe = {
      domain: normalized,
      reachable: true,
      httpStatus: 200,
      title: fixture.brand_name,
      metaDescription: fixture.brand_truth_sheet.core_offering,
      jsonLdBlocks: [],
      robotsAiBotStatus: structuredClone(fixture.robots_ai_bot_status),
      llmsTxtStatus: fixture.llms_txt_status,
      llmsTxtExcerpt: null,
      agentsMdRaw: null,
      agentsMdInitialStatus: fixture.agents_md_status,
      htmlSignalsShopify: fixture.is_shopify,
      extractedPriceMentions: [],
      extractedShippingMentions: [
        fixture.brand_truth_sheet.shipping_or_service_area,
      ],
    };
    shopify = {
      isShopify: fixture.is_shopify,
      shopifyMcpStatus: fixture.shopify_mcp_status,
      activeMcpEndpoint:
        fixture.shopify_mcp_status === 'ucp_active'
          ? `${normalized.origin}/api/ucp/mcp`
          : fixture.shopify_mcp_status === 'legacy_mcp_active'
            ? `${normalized.origin}/api/mcp`
            : null,
      exposedMcpTools: ['search_shop_catalog', 'get_shop_policies'],
      agentsMdStatus: fixture.agents_md_status,
      catalogSkus: [],
      priceRangeSummary: fixture.brand_truth_sheet.verified_pricing_summary,
    };
  } else {
    shopify = await inspectShopifyStorefront(liveProbe);
  }

  const brandName =
    fixture?.brand_name ??
    extractBrandNameFromTitle(
      probe.title,
      normalized.hostname,
      normalized.inferredBrandName,
      probe.jsonLdBlocks
    );

  const candidateTypes: FixType[] = [
    'json_ld_schema',
    'llms_txt',
    'agents_md',
    'shopify_agents_liquid',
    'fanout_faq_block',
  ];
  const appliedFixTypes = candidateTypes.filter((t) =>
    isFixTypeLiveOnDomain(t, probe, shopify)
  );
  const hasFaqSchema = hasFaqPageJsonLd(probe.jsonLdBlocks);

  const crawlersOpen =
    !probe.robotsAiBotStatus.waf_blocked &&
    probe.robotsAiBotStatus.GPTBot &&
    probe.robotsAiBotStatus['OAI-SearchBot'] &&
    probe.robotsAiBotStatus.PerplexityBot &&
    probe.robotsAiBotStatus.ClaudeBot;

  const checks: LiveFixCheckItem[] = [
    {
      id: 'json_ld',
      label: 'JSON-LD Entity + FAQ Graph',
      live: probe.jsonLdBlocks.length >= 2,
      detail:
        probe.jsonLdBlocks.length >= 2
          ? `${probe.jsonLdBlocks.length} schema.org nodes live${hasFaqSchema ? ' (includes FAQPage)' : ''}`
          : probe.jsonLdBlocks.length === 1
            ? '1 schema.org node found — add FAQPage graph'
            : 'No application/ld+json blocks detected on homepage',
    },
    {
      id: 'llms_txt',
      label: 'Canonical /llms.txt',
      live: probe.llmsTxtStatus === 'present',
      detail:
        probe.llmsTxtStatus === 'present'
          ? 'HTTP 200 Markdown index verified at /llms.txt'
          : 'Missing or soft-404 at /llms.txt',
    },
    {
      id: 'agents_md',
      label: shopify.isShopify
        ? 'Shopify /agents.md & AI Facts'
        : 'Canonical /agents.md',
      live: shopify.agentsMdStatus === 'custom_enriched',
      detail:
        shopify.agentsMdStatus === 'custom_enriched'
          ? 'Custom brand truth & pricing verified'
          : shopify.agentsMdStatus === 'default_boilerplate'
            ? 'Generic platform boilerplate — publish custom truth override'
            : 'No /agents.md or alternate Markdown link detected',
    },
    {
      id: 'crawler_waf',
      label: 'AI Bot & Edge WAF Access',
      live: crawlersOpen,
      detail: crawlersOpen
        ? 'GPTBot, OAI-SearchBot, PerplexityBot & ClaudeBot allowed (HTTP 200)'
        : probe.robotsAiBotStatus.waf_blocked
          ? 'Edge WAF challenge (403/429) blocking simulated AI bots'
          : 'One or more AI crawlers disallowed in robots.txt',
    },
  ];

  return {
    domainUrl: probe.domain.origin,
    hostname: probe.domain.hostname,
    brandName,
    checkedAt: new Date().toISOString(),
    isShopify: shopify.isShopify,
    shopifyMcpStatus: shopify.shopifyMcpStatus,
    agentsMdStatus: shopify.agentsMdStatus,
    llmsTxtStatus: probe.llmsTxtStatus,
    robotsAiBotStatus: probe.robotsAiBotStatus,
    jsonLdCount: probe.jsonLdBlocks.length,
    hasFaqSchema,
    appliedFixTypes,
    checks,
  };
}

export interface EngineCitationShareItem {
  aiEngine: 'chatgpt' | 'gemini' | 'perplexity';
  engineLabel: string;
  shortLabel: string;
  totalSnapshots: number;
  mentionedCount: number;
  mentionRatePct: number;
  bestRank: number | null;
  hallucinationCount: number;
  topRivals: string[];
  hasLiveTelemetry: boolean;
}

const TRACKED_ENGINES: Array<{
  aiEngine: 'chatgpt' | 'gemini' | 'perplexity';
  engineLabel: string;
  shortLabel: string;
}> = [
  {
    aiEngine: 'chatgpt',
    engineLabel: 'ChatGPT Search',
    shortLabel: 'ChatGPT',
  },
  {
    aiEngine: 'gemini',
    engineLabel: 'Google Gemini',
    shortLabel: 'Gemini',
  },
  {
    aiEngine: 'perplexity',
    engineLabel: 'Perplexity Agent',
    shortLabel: 'Perplexity',
  },
];

type SnapshotOrScanItem =
  | CitationSnapshotRow
  | EngineScanResult;

function normalizeSnapshotLike(item: SnapshotOrScanItem): {
  aiEngine: AiEngine;
  brandMentioned: boolean;
  citationRank: number | null;
  competitorsMentioned: string[];
  citedSourceUrls: string[];
  fanoutTelemetryType: FanoutTelemetryType;
  hallucinationDetected: boolean;
  hallucinationDetails: HallucinationDetail[];
} {
  if ('ai_engine' in item) {
    return {
      aiEngine: item.ai_engine,
      brandMentioned: item.brand_mentioned,
      citationRank: item.citation_rank,
      competitorsMentioned: item.competitors_mentioned ?? [],
      citedSourceUrls: item.cited_source_urls ?? [],
      fanoutTelemetryType: item.fanout_telemetry_type,
      hallucinationDetected: item.hallucination_detected,
      hallucinationDetails: item.hallucination_details ?? [],
    };
  }
  return {
    aiEngine: item.aiEngine,
    brandMentioned: item.brandMentioned,
    citationRank: item.citationRank,
    competitorsMentioned: item.competitorsMentioned ?? [],
    citedSourceUrls: item.citedSourceUrls ?? [],
    fanoutTelemetryType: item.fanoutTelemetryType,
    hallucinationDetected: item.hallucinationDetected,
    hallucinationDetails: item.hallucinationDetails ?? [],
  };
}

export function summarizeEngineCitationShare(
  snapshots: SnapshotOrScanItem[]
): EngineCitationShareItem[] {
  const normalized = snapshots.map(normalizeSnapshotLike);
  return TRACKED_ENGINES.map(({ aiEngine, engineLabel, shortLabel }) => {
    const engineSnaps = normalized.filter((s) => s.aiEngine === aiEngine);
    const totalSnapshots = engineSnaps.length;
    const mentionedSnaps = engineSnaps.filter((s) => s.brandMentioned);
    const mentionedCount = mentionedSnaps.length;
    const mentionRatePct =
      totalSnapshots > 0
        ? Math.round((mentionedCount / totalSnapshots) * 100)
        : 0;

    let bestRank: number | null = null;
    for (const snap of mentionedSnaps) {
      if (typeof snap.citationRank === 'number' && snap.citationRank > 0) {
        bestRank =
          bestRank === null
            ? snap.citationRank
            : Math.min(bestRank, snap.citationRank);
      }
    }

    const hallucinationCount = engineSnaps.filter(
      (s) => s.hallucinationDetected && s.hallucinationDetails.length > 0
    ).length;

    const topRivals: string[] = [];
    const seenLower = new Set<string>();
    for (const snap of engineSnaps) {
      for (const rawRival of snap.competitorsMentioned) {
        const clean = rawRival.trim();
        if (
          !clean ||
          /^(?:reddit\.com\s+buyer\s+threads|editorial\s+comparison\s+guides|category\s+directories)/i.test(
            clean
          ) ||
          /^Top\s+.+\s+Category\s+Peer\s+#\d+$/i.test(clean)
        ) {
          continue;
        }
        const key = clean.toLowerCase();
        if (!seenLower.has(key)) {
          seenLower.add(key);
          topRivals.push(clean);
          if (topRivals.length >= 2) break;
        }
      }
      if (topRivals.length >= 2) break;
    }

    const hasLiveTelemetry = engineSnaps.some(
      (s) => s.fanoutTelemetryType !== 'mock_fixture'
    );

    return {
      aiEngine,
      engineLabel,
      shortLabel,
      totalSnapshots,
      mentionedCount,
      mentionRatePct,
      bestRank,
      hallucinationCount,
      topRivals,
      hasLiveTelemetry,
    };
  });
}

export type PitchShowcaseBucket = 'saas_d2c' | 'agencies' | 'local_services';

const AGENCY_SHOWCASE_HOSTS = new Set([
  'siegemedia.com',
  'omniscientdigital.com',
  'animalz.co',
  'barrelny.com',
  'singlegrain.com',
  'velstar.co.uk',
]);

const LOCAL_SERVICE_SHOWCASE_HOSTS = new Set([
  'hellotend.com',
  'ovme.com',
  'everbody.com',
  'lanierlawfirm.com',
  'bakerroofing.com',
  'horizonservices.com',
]);

export function classifyPitchShowcaseBucket(
  report: Pick<
    AgencyPitchReportRow,
    'prospect_domain' | 'prospect_brand_name' | 'summary_payload'
  >
): PitchShowcaseBucket {
  const host = report.prospect_domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0] ?? '';

  if (AGENCY_SHOWCASE_HOSTS.has(host)) {
    return 'agencies';
  }
  if (LOCAL_SERVICE_SHOWCASE_HOSTS.has(host)) {
    return 'local_services';
  }

  const corpus = [
    host,
    report.prospect_brand_name,
    ...(report.summary_payload?.top_gaps ?? []),
    ...(report.summary_payload?.recommended_fixes ?? []),
  ].join(' ');

  if (
    /\b(?:dental|dentist|orthodont|medspa|med\s*spa|botox|injectable|law\s*firm|attorney|lawyer|legal\s+service|roofing|roofer|hvac|plumbing|heating|cooling|Dentist|MedicalBusiness|LegalService|RoofingContractor|HVACBusiness)\b/i.test(
      corpus
    )
  ) {
    return 'local_services';
  }

  if (
    /\b(?:seo\s+agency|content\s+agency|digital\s+pr|marketing\s+agency|growth\s+agency|shopify\s+plus\s+agency|creative\s+agency|ProfessionalService)\b/i.test(
      corpus
    )
  ) {
    return 'agencies';
  }

  return 'saas_d2c';
}

export type CitationSourceOwnership = 'citation_gap' | 'co_cited' | 'owned';

export interface RankedCitationSourceItem {
  sourceHost: string;
  ownership: CitationSourceOwnership;
  enginesCiting: AiEngine[];
  citationCount: number;
  rivalsFed: string[];
  urls: string[];
}

const OWNERSHIP_PRIORITY: Record<CitationSourceOwnership, number> = {
  citation_gap: 0,
  co_cited: 1,
  owned: 2,
};

export function rankCitationGapSources(params: {
  targetHostname: string;
  snapshots: SnapshotOrScanItem[];
}): RankedCitationSourceItem[] {
  const cleanTarget = params.targetHostname
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0] ?? '';

  const byHost = new Map<
    string,
    {
      engines: Set<AiEngine>;
      citationCount: number;
      sawBrandMention: boolean;
      sawBrandOmission: boolean;
      rivals: string[];
      seenRivals: Set<string>;
      urls: string[];
      seenUrls: Set<string>;
    }
  >();

  for (const rawSnap of params.snapshots) {
    const snap = normalizeSnapshotLike(rawSnap);
    const hostsInThisSnap = new Set<string>();

    for (const rawUrl of snap.citedSourceUrls) {
      const trimmed = rawUrl.trim();
      if (!trimmed) continue;
      let parsedHost = '';
      try {
        const u = new URL(trimmed);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;
        parsedHost = u.hostname.replace(/^www\./, '').toLowerCase();
      } catch {
        continue;
      }
      if (!parsedHost) continue;

      let bucket = byHost.get(parsedHost);
      if (!bucket) {
        bucket = {
          engines: new Set<AiEngine>(),
          citationCount: 0,
          sawBrandMention: false,
          sawBrandOmission: false,
          rivals: [],
          seenRivals: new Set<string>(),
          urls: [],
          seenUrls: new Set<string>(),
        };
        byHost.set(parsedHost, bucket);
      }

      bucket.engines.add(snap.aiEngine);
      if (!hostsInThisSnap.has(parsedHost)) {
        hostsInThisSnap.add(parsedHost);
        bucket.citationCount += 1;
      }
      if (snap.brandMentioned) {
        bucket.sawBrandMention = true;
      } else {
        bucket.sawBrandOmission = true;
      }

      if (!bucket.seenUrls.has(trimmed) && bucket.urls.length < 4) {
        bucket.seenUrls.add(trimmed);
        bucket.urls.push(trimmed);
      }

      for (const rawRival of snap.competitorsMentioned) {
        const clean = rawRival.trim();
        if (
          !clean ||
          /^(?:reddit\.com\s+buyer\s+threads|editorial\s+comparison\s+guides|category\s+directories)/i.test(
            clean
          ) ||
          /^Top\s+.+\s+Category\s+Peer\s+#\d+$/i.test(clean)
        ) {
          continue;
        }
        const key = clean.toLowerCase();
        if (!bucket.seenRivals.has(key) && bucket.rivals.length < 3) {
          bucket.seenRivals.add(key);
          bucket.rivals.push(clean);
        }
      }
    }
  }

  const ENGINE_ORDER: AiEngine[] = ['chatgpt', 'gemini', 'perplexity', 'claude'];
  const items: RankedCitationSourceItem[] = [];

  for (const [sourceHost, bucket] of byHost.entries()) {
    const isOwned =
      Boolean(cleanTarget) &&
      (sourceHost === cleanTarget || sourceHost.endsWith(`.${cleanTarget}`));
    const ownership: CitationSourceOwnership = isOwned
      ? 'owned'
      : bucket.sawBrandMention
        ? 'co_cited'
        : 'citation_gap';

    const enginesCiting = ENGINE_ORDER.filter((e) => bucket.engines.has(e));
    items.push({
      sourceHost,
      ownership,
      enginesCiting,
      citationCount: bucket.citationCount,
      rivalsFed: isOwned ? [] : bucket.rivals,
      urls: bucket.urls,
    });
  }

  items.sort((a, b) => {
    const prioDiff =
      OWNERSHIP_PRIORITY[a.ownership] - OWNERSHIP_PRIORITY[b.ownership];
    if (prioDiff !== 0) return prioDiff;
    if (b.enginesCiting.length !== a.enginesCiting.length) {
      return b.enginesCiting.length - a.enginesCiting.length;
    }
    if (b.citationCount !== a.citationCount) {
      return b.citationCount - a.citationCount;
    }
    return a.sourceHost.localeCompare(b.sourceHost);
  });

  return items;
}

function formatEngineDisplayName(engine: AiEngine): string {
  switch (engine) {
    case 'chatgpt':
      return 'ChatGPT';
    case 'gemini':
      return 'Google Gemini';
    case 'perplexity':
      return 'Perplexity';
    case 'claude':
      return 'Claude';
  }
}

export function buildTargetedCitationOutreachDraft(params: {
  brandName: string;
  hostname: string;
  coreOffering: string;
  pricingSummary: string;
  sourceHost: string;
  targetUrl: string;
  enginesCiting: AiEngine[];
  rivalsFed: string[];
}): EnforcedQualityArtifact {
  const cleanHost = params.hostname
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0] ?? params.hostname;

  const engineLabels =
    params.enginesCiting.length > 0
      ? params.enginesCiting.map(formatEngineDisplayName).join(' and ')
      : 'ChatGPT and Perplexity';

  const rivalsClause =
    params.rivalsFed.length > 0
      ? params.rivalsFed.slice(0, 2).join(' and ')
      : 'alternatives in this category';

  const offeringClean = params.coreOffering
    .trim()
    .replace(/\.+$/, '')
    .slice(0, 120);
  const pricingClean = params.pricingSummary
    .trim()
    .replace(/\.+$/, '')
    .slice(0, 110);

  const draft = [
    `Subject: Factual spec update for ${params.sourceHost} (${params.brandName})`,
    '',
    `Read your piece at ${params.targetUrl} — ${engineLabels} currently cite that URL when buyers compare ${rivalsClause}.`,
    `We operate ${params.brandName} (${cleanHost})${
      offeringClean ? ` — ${offeringClean}` : ''
    }${pricingClean ? ` (${pricingClean})` : ''}.`,
    `Our current pricing, policies, and JSON-LD product specs live in plain Markdown at https://${cleanHost}/agents.md so your editorial team can verify facts in 15 seconds.`,
    `Happy to share a test login or sample order if you update the comparison.`,
  ].join('\n');

  return enforceQualityGate95(draft, 'citation_outreach_brief');
}

export interface ScoreDeltaSummary {
  previousVisibilityScore: number;
  currentVisibilityScore: number;
  visibilityDelta: number;
  previousAccuracyScore: number;
  currentAccuracyScore: number;
  accuracyDelta: number;
  baselineLabel: 'initial_audit' | 'previous_scan';
  verifiedLiveChecksCount?: number;
}

export function computeScoreDeltaSummary(params: {
  previousVisibilityScore: number;
  currentVisibilityScore: number;
  previousAccuracyScore: number;
  currentAccuracyScore: number;
  baselineLabel?: 'initial_audit' | 'previous_scan';
  verifiedLiveChecksCount?: number;
}): ScoreDeltaSummary {
  const prevVis = Math.max(
    0,
    Math.min(100, Math.round(params.previousVisibilityScore))
  );
  const currVis = Math.max(
    0,
    Math.min(100, Math.round(params.currentVisibilityScore))
  );
  const prevAcc = Math.max(
    0,
    Math.min(100, Math.round(params.previousAccuracyScore))
  );
  const currAcc = Math.max(
    0,
    Math.min(100, Math.round(params.currentAccuracyScore))
  );

  return {
    previousVisibilityScore: prevVis,
    currentVisibilityScore: currVis,
    visibilityDelta: currVis - prevVis,
    previousAccuracyScore: prevAcc,
    currentAccuracyScore: currAcc,
    accuracyDelta: currAcc - prevAcc,
    baselineLabel: params.baselineLabel ?? 'previous_scan',
    ...(params.verifiedLiveChecksCount !== undefined
      ? { verifiedLiveChecksCount: params.verifiedLiveChecksCount }
      : {}),
  };
}

const PATIENT_ZERO_REMEDIATION_BASELINES: Record<
  string,
  { visibility: number; accuracy: number }
> = {
  'aurearoasters.com': { visibility: 41, accuracy: 68 },
  'mosaicroasters.com': { visibility: 52, accuracy: 54 },
};

export function resolveInitialDomainScoreDeltas(
  domains: Array<
    Pick<
      DomainRow,
      'id' | 'domain_url' | 'visibility_score' | 'accuracy_score'
    >
  >
): Record<string, ScoreDeltaSummary> {
  const map: Record<string, ScoreDeltaSummary> = {};
  for (const domain of domains) {
    let host = '';
    try {
      host = new URL(domain.domain_url).hostname
        .replace(/^www\./, '')
        .toLowerCase();
    } catch {
      host = domain.domain_url
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0] ?? '';
    }

    const baseline = PATIENT_ZERO_REMEDIATION_BASELINES[host];
    if (!baseline) continue;

    if (
      domain.visibility_score > baseline.visibility ||
      domain.accuracy_score > baseline.accuracy
    ) {
      map[domain.id] = computeScoreDeltaSummary({
        previousVisibilityScore: Math.min(
          baseline.visibility,
          domain.visibility_score
        ),
        currentVisibilityScore: domain.visibility_score,
        previousAccuracyScore: Math.min(
          baseline.accuracy,
          domain.accuracy_score
        ),
        currentAccuracyScore: domain.accuracy_score,
        baselineLabel: 'initial_audit',
      });
    }
  }
  return map;
}
