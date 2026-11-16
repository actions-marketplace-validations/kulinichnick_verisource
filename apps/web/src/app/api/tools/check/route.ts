import { NextResponse } from 'next/server';
import {
  getWebsitePlatformMeta,
  inspectJsonLdAiReadiness,
  inspectShopifyStorefront,
  matchesPublicHostname,
  normalizePublicDomain,
  PATIENT_ZERO_DOMAINS,
  probeDomainHttpReadiness,
  resolveCoreGeoEnv,
  type AgentsMdStatus,
  type CrawlerReadabilityReport,
  type JsonLdAiReadinessSummary,
  type LlmsTxtStatus,
  type RecommendedRemediationEnv,
  type RobotsAiBotStatus,
  type ShopifyMcpStatus,
  type WebsitePlatformId,
} from '@verisource/core-geo';

export const maxDuration = 30;

export interface FreeToolCheckPayload {
  ok: true;
  hostname: string;
  origin: string;
  reachable: boolean;
  httpStatus: number | null;
  detectedPlatform: WebsitePlatformId;
  detectedPlatformLabel: string;
  recommendedEnv: RecommendedRemediationEnv;
  llmsTxtStatus: LlmsTxtStatus;
  agentsMdStatus: AgentsMdStatus;
  jsonLdCount: number;
  jsonLdTypes: string[];
  jsonLdReadiness: JsonLdAiReadinessSummary;
  robotsAiBotStatus: RobotsAiBotStatus;
  crawlerReadability: CrawlerReadabilityReport | null;
  isShopify: boolean;
  shopifyMcpStatus: ShopifyMcpStatus;
  activeMcpEndpoint: string | null;
  exposedMcpTools: string[];
  cached1h: boolean;
}

const toolResultCache = new Map<
  string,
  { expiresAt: number; payload: FreeToolCheckPayload }
>();
const toolIpDailyMap = new Map<string, { day: string; count: number }>();

function extractSchemaTypes(blocks: Record<string, unknown>[]): string[] {
  const types = new Set<string>();
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const rec = node as Record<string, unknown>;
    const rawType = rec['@type'];
    if (typeof rawType === 'string' && rawType.trim()) {
      types.add(rawType.trim());
    } else if (Array.isArray(rawType)) {
      for (const item of rawType) {
        if (typeof item === 'string' && item.trim()) {
          types.add(item.trim());
        }
      }
    }
    if (Array.isArray(rec['@graph'])) {
      rec['@graph'].forEach(visit);
    }
  };
  visit(blocks);
  return Array.from(types);
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { domain?: string };
    if (!body.domain || typeof body.domain !== 'string') {
      return NextResponse.json(
        {
          error: 'INVALID_DOMAIN',
          message: 'Enter a valid public website domain (e.g. linear.app).',
        },
        { status: 400 }
      );
    }

    const normalized = normalizePublicDomain(body.domain);
    const cached = toolResultCache.get(normalized.hostname);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        ...cached.payload,
        cached1h: true,
      });
    }

    const fixtureMatch = PATIENT_ZERO_DOMAINS.find((d) =>
      matchesPublicHostname(d.domain_url, normalized.hostname)
    );

    if (!fixtureMatch) {
      const ip =
        request.headers.get('cf-connecting-ip') ??
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        '127.0.0.1';
      const today = new Date().toISOString().slice(0, 10);
      if (toolIpDailyMap.size > 1000) {
        for (const [k, v] of toolIpDailyMap.entries()) {
          if (v.day !== today) toolIpDailyMap.delete(k);
        }
        if (toolIpDailyMap.size > 1000) toolIpDailyMap.clear();
      }
      const existing = toolIpDailyMap.get(ip);
      const used = existing && existing.day === today ? existing.count : 0;
      if (used >= 15) {
        return NextResponse.json(
          {
            error: 'TOOL_SCAN_LIMIT_REACHED',
            message:
              'Daily free utility check limit reached (15 domains/day). Start a $0 7-day free trial for unlimited workspace verification.',
          },
          { status: 429 }
        );
      }
      toolIpDailyMap.set(ip, { day: today, count: used + 1 });
    }

    if (toolResultCache.size > 500) {
      const now = Date.now();
      for (const [k, v] of toolResultCache.entries()) {
        if (v.expiresAt <= now) toolResultCache.delete(k);
      }
      if (toolResultCache.size > 500) toolResultCache.clear();
    }

    const env = resolveCoreGeoEnv(
      process.env as Record<string, string | undefined>
    );

    if (env.providerMode === 'mock' && fixtureMatch) {
      const platformMeta = getWebsitePlatformMeta('shopify');
      const mockPayload: FreeToolCheckPayload = {
        ok: true,
        hostname: normalized.hostname,
        origin: normalized.origin,
        reachable: true,
        httpStatus: 200,
        detectedPlatform: 'shopify',
        detectedPlatformLabel: platformMeta.displayName,
        recommendedEnv: platformMeta.recommendedAiEnv,
        llmsTxtStatus: fixtureMatch.llms_txt_status,
        agentsMdStatus: fixtureMatch.agents_md_status,
        jsonLdCount: fixtureMatch.agents_md_status === 'custom_enriched' ? 4 : 1,
        jsonLdTypes:
          fixtureMatch.agents_md_status === 'custom_enriched'
            ? ['Organization', 'Product', 'FAQPage']
            : ['Organization'],
        jsonLdReadiness:
          fixtureMatch.agents_md_status === 'custom_enriched'
            ? {
                blockCount: 4,
                detectedTypes: ['Organization', 'Product', 'FAQPage'],
                hasEntityIdentity: true,
                hasFaqPage: true,
                faqQuestionCount: 4,
                hasOfferOrPricing: true,
                missingAiGraphPillars: [],
              }
            : {
                blockCount: 1,
                detectedTypes: ['Organization'],
                hasEntityIdentity: true,
                hasFaqPage: false,
                faqQuestionCount: 0,
                hasOfferOrPricing: false,
                missingAiGraphPillars: ['faq_page', 'offer_pricing'],
              },
        robotsAiBotStatus: fixtureMatch.robots_ai_bot_status,
        crawlerReadability: {
          status: 'ssr_clean',
          rawHtmlBytes: 48200,
          visibleTextChars: 6420,
          visibleWordCount: 980,
          signalToHtmlPct: 13.3,
          estimatedTokens: 1605,
          hasSemanticLandmarks: true,
          detectedCsrShell: false,
          summary:
            'Server-rendered HTML exposes clean text density for non-JS AI crawlers.',
        },
        isShopify: fixtureMatch.is_shopify,
        shopifyMcpStatus: fixtureMatch.shopify_mcp_status,
        activeMcpEndpoint: `${normalized.origin}/api/ucp/mcp`,
        exposedMcpTools: ['search_shop_catalog', 'get_cart', 'update_cart'],
        cached1h: false,
      };
      toolResultCache.set(normalized.hostname, {
        expiresAt: Date.now() + 60 * 60 * 1000,
        payload: mockPayload,
      });
      return NextResponse.json(mockPayload);
    }

    const probe = await probeDomainHttpReadiness(normalized.origin, env);
    const shopify = await inspectShopifyStorefront(probe);
    const resolvedPlatform: WebsitePlatformId = shopify.isShopify
      ? 'shopify'
      : (probe.detectedPlatform ?? 'nextjs_custom');
    const platformMeta = getWebsitePlatformMeta(resolvedPlatform);
    const jsonLdTypes = extractSchemaTypes(probe.jsonLdBlocks);
    const jsonLdReadiness = inspectJsonLdAiReadiness(probe.jsonLdBlocks);

    const payload: FreeToolCheckPayload = {
      ok: true,
      hostname: normalized.hostname,
      origin: normalized.origin,
      reachable: probe.reachable,
      httpStatus: probe.httpStatus,
      detectedPlatform: resolvedPlatform,
      detectedPlatformLabel: platformMeta.displayName,
      recommendedEnv: platformMeta.recommendedAiEnv,
      llmsTxtStatus: probe.llmsTxtStatus,
      agentsMdStatus: shopify.isShopify
        ? shopify.agentsMdStatus
        : probe.agentsMdInitialStatus,
      jsonLdCount: probe.jsonLdBlocks.length,
      jsonLdTypes,
      jsonLdReadiness,
      robotsAiBotStatus: probe.robotsAiBotStatus,
      crawlerReadability: probe.crawlerReadability ?? null,
      isShopify: shopify.isShopify,
      shopifyMcpStatus: shopify.shopifyMcpStatus,
      activeMcpEndpoint: shopify.activeMcpEndpoint,
      exposedMcpTools: shopify.exposedMcpTools,
      cached1h: false,
    };

    toolResultCache.set(normalized.hostname, {
      expiresAt: Date.now() + 60 * 60 * 1000,
      payload,
    });

    return NextResponse.json(payload);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unable to inspect public domain.';
    return NextResponse.json(
      { error: 'INVALID_DOMAIN', message },
      { status: 400 }
    );
  }
}
