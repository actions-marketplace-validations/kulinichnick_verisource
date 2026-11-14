import { resolveCoreGeoEnv, type RawEnvInput } from '../config/env.js';
import type {
  AgentsMdStatus,
  BrandTruthSheet,
  HallucinationDetail,
  LlmsTxtStatus,
  PitchSummaryPayload,
  RobotsAiBotStatus,
  ShopifyMcpStatus,
} from '../db/types.js';
import { PATIENT_ZERO_DOMAINS } from '../fixtures/patient-zero.js';
import {
  generateGeoFixBundle,
  type GeneratedFixDraft,
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
  };
  upgradeUrl: string;
}

export interface FullGeoAuditResult {
  domainUrl: string;
  hostname: string;
  brandName: string;
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

  const liveRivals = params.scanResults
    .filter((s) => s.fanoutTelemetryType !== 'mock_fixture')
    .flatMap((s) => s.competitorsMentioned);
  const fallbackRivals = params.scanResults
    .filter((s) => s.fanoutTelemetryType === 'mock_fixture')
    .flatMap((s) => s.competitorsMentioned);
  const competitorsWinning = Array.from(
    new Set([...liveRivals, ...fallbackRivals])
  ).slice(0, 5);

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

  const cleanedTitleBrand = liveProbe.title
    ?.split(/\s*[|–—·•:]\s*|\s+-\s+/)[0]
    ?.trim();
  const brandName =
    fixture?.brand_name ??
    (cleanedTitleBrand && cleanedTitleBrand.length <= 42
      ? cleanedTitleBrand
      : normalized.inferredBrandName);

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
    truthSheet.core_offering
  );

  const firstPrompt = prompts[0] ?? `${brandName} reviews and pricing`;
  const teaserScans = await runMultiEnginePromptScan({
    prompts: [firstPrompt],
    engines: ['chatgpt'],
    domain: probe.domain,
    brandName,
    truthSheet,
    env,
  });

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

  return {
    domainUrl: probe.domain.origin,
    hostname: probe.domain.hostname,
    brandName,
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
          brandTruthSheet.core_offering
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

  return {
    domainUrl: probe.domain.origin,
    hostname: probe.domain.hostname,
    brandName,
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
