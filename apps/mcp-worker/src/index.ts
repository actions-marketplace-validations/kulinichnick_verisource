import {
  buildOAuthProtectedResourceMetadata,
  createMcpHandler,
  McpServer,
  type McpRequestContext,
} from '@modelcontextprotocol/server';
import {
  buildAiRemediationMasterPrompt,
  buildCitationAnswerPageBundle,
  buildCitationGapActionPlaybookMarkdown,
  buildExecutiveAuditReportMarkdown,
  buildMcpDiscoveryManifest,
  buildTargetedCitationOutreachDraft,
  generateSuggestedBuyerPrompts,
  getWebsitePlatformMeta,
  normalizePublicDomain,
  rankCitationGapSources,
  runDomainReadinessScan,
  runFullGeoAudit,
  summarizeBrandSentimentAndSov,
  summarizeEngineCitationShare,
  VERISOURCE_VERSION,
  type AiRemediationTargetEnv,
  type FullGeoAuditResult,
  type ReadinessScanSummary,
} from '@verisource/core-geo';
import { z } from 'zod';
import {
  authorizeAndMeterPaidTool,
  buildPassThroughAuthInfo,
  extractBearerToken,
  verifyZeroCreditBearerEntitlement,
} from './auth.js';
import {
  checkFreeGraderIpRateLimit,
  getCachedJson,
  setCachedJson,
} from './cache.js';
import { runScheduledDomainScans } from './cron.js';
import { workerEnvToRawInput, type WorkerEnv } from './types.js';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Accept, Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id',
  'Access-Control-Expose-Headers': 'MCP-Protocol-Version, Mcp-Session-Id',
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function getCallerFromContext(ctx: McpRequestContext): {
  rawBearerToken: string | null;
  clientIp: string;
} {
  const extra = (ctx.authInfo?.extra ?? {}) as {
    rawBearerToken?: string | null;
    clientIp?: string;
  };
  return {
    rawBearerToken: extra.rawBearerToken ?? null,
    clientIp: extra.clientIp ?? '127.0.0.1',
  };
}

async function getOrComputeAudit(params: {
  domain: string;
  liveRefresh: boolean;
  customBrandName?: string;
  customPrompts?: string[];
  env: WorkerEnv;
}): Promise<{ audit: FullGeoAuditResult; servedFromCache: boolean }> {
  const normalized = normalizePublicDomain(params.domain);
  const cacheKey = `audit:v1:${normalized.hostname}`;

  if (!params.liveRefresh && !params.customPrompts?.length) {
    const cached = await getCachedJson<FullGeoAuditResult>(cacheKey, params.env);
    if (cached) {
      return { audit: cached, servedFromCache: true };
    }
  }

  const fresh = await runFullGeoAudit({
    domainInput: normalized.origin,
    customBrandName: params.customBrandName,
    customPrompts: params.customPrompts,
    rawEnv: workerEnvToRawInput(params.env),
  });

  await setCachedJson(cacheKey, fresh, 3600 * 12, params.env);
  return { audit: fresh, servedFromCache: false };
}

export function buildMcpHandlerForEnv(env: WorkerEnv) {
  return createMcpHandler((ctx) => {
    const caller = getCallerFromContext(ctx);
    const server = new McpServer({
      name: 'verisource-geo-mcp',
      version: VERISOURCE_VERSION,
    });

    // 1. FREE PREVIEW TOOL: scan_domain_ai_readiness (0 credits, 24h cached, IP rate-limited)
    server.registerTool(
      'scan_domain_ai_readiness',
      {
        title: 'Scan Domain AI & MCP Readiness (Free Preview)',
        description:
          'Returns AI Visibility Score (0-100), 7-platform CMS detection, 3-pillar JSON-LD readiness (Entity, FAQPage Q&A count, Offer pricing), GPTBot/PerplexityBot/ClaudeBot WAF & robots.txt access, Shopify /api/ucp/mcp + /agents.md status, and 1 sample prompt citation preview.',
        inputSchema: z.object({
          domain: z
            .string()
            .min(3)
            .describe('Public domain or URL to scan, e.g. yourcompany.com'),
        }),
      },
      async ({ domain }) => {
        const normalized = normalizePublicDomain(domain);
        const cacheKey = `readiness:v1:${normalized.hostname}`;

        let summary = await getCachedJson<ReadinessScanSummary>(cacheKey, env);
        let fromCache = true;

        if (!summary) {
          fromCache = false;
          const isEntitledSubscriber = caller.rawBearerToken
            ? await verifyZeroCreditBearerEntitlement({
                rawBearerToken: caller.rawBearerToken,
                env,
              })
            : false;

          if (!isEntitledSubscriber) {
            const rateCheck = await checkFreeGraderIpRateLimit(
              caller.clientIp,
              env,
              3
            );
            if (!rateCheck.allowed) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        error: 'FREE_DAILY_RATE_LIMIT_REACHED',
                        message:
                          'Unauthenticated preview limit (3 domains/day) reached. Authenticate with a Verisource MCP API key to scan unlimited cached domains.',
                        upgrade_url: `${
                          env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev'
                        }/pricing`,
                      },
                      null,
                      2
                    ),
                  },
                ],
              };
            }
          }

          summary = await runDomainReadinessScan(
            normalized.origin,
            workerEnvToRawInput(env)
          );
          await setCachedJson(cacheKey, summary, 86400, env);
        }

        const payload = {
          ...summary,
          cached_24h: fromCache,
          credits_charged: 0,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
        };
      }
    );

    // 2. PAID TOOL: get_citation_gaps_and_fanouts (1 credit cached / 10 credits live_refresh)
    server.registerTool(
      'get_citation_gaps_and_fanouts',
      {
        title: 'Get Citation Gaps & Decompiled Query Fanouts',
        description:
          'Paid Tool (Pro/Agency): Returns 3-engine citation share, ranked citation gap domains, verified editorial outreach drafts, unblurred competitor citation URLs, and observed AI engine sub-queries (Gemini webSearchQueries, ChatGPT web_search_call, Perplexity Agent citations). Costs 1 credit cached or 10 credits with live_refresh=true.',
        inputSchema: z.object({
          domain: z.string().min(3).describe('Target domain or URL'),
          custom_prompts: z
            .array(z.string().min(4))
            .max(10)
            .optional()
            .describe('Optional buyer prompts to scan'),
          live_refresh: z
            .boolean()
            .optional()
            .describe('Set true to run a fresh multi-engine scan (10 credits)'),
        }),
      },
      async ({ domain, custom_prompts, live_refresh }) => {
        const isLive = Boolean(live_refresh || custom_prompts?.length);
        const creditsCost = isLive ? 10 : 1;

        const gate = await authorizeAndMeterPaidTool({
          rawBearerToken: caller.rawBearerToken,
          creditsCost,
          env,
        });

        if (!gate.allowed) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: gate.errorCode,
                    message: gate.upgradeMessage,
                    credits_remaining: gate.creditsRemaining,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const { audit, servedFromCache } = await getOrComputeAudit({
          domain,
          liveRefresh: isLive,
          customPrompts: custom_prompts,
          env,
        });

        const engineCitationShare = summarizeEngineCitationShare(
          audit.scanResults,
          audit.hostname
        );
        const rankedCitationSources = rankCitationGapSources({
          targetHostname: audit.hostname,
          snapshots: audit.scanResults,
        });
        const suggestedFunnelPrompts = generateSuggestedBuyerPrompts({
          hostname: audit.hostname,
          brandName: audit.brandName,
          coreOffering: audit.brandTruthSheet.core_offering,
          pricingSummary: audit.brandTruthSheet.verified_pricing_summary,
          shippingOrServiceArea: audit.brandTruthSheet.shipping_or_service_area,
          isShopify: audit.shopify.isShopify,
          topRivals: audit.pitchSummaryPayload.competitors_winning,
          existingPrompts: audit.trackedPrompts,
        });
        const targetedOutreachDrafts = rankedCitationSources
          .filter((s) => s.ownership !== 'owned' && Boolean(s.urls[0]))
          .slice(0, 3)
          .map((source) => {
            const artifact = buildTargetedCitationOutreachDraft({
              brandName: audit.brandName,
              hostname: audit.hostname,
              coreOffering: audit.brandTruthSheet.core_offering,
              pricingSummary: audit.brandTruthSheet.verified_pricing_summary,
              shippingOrServiceArea:
                audit.brandTruthSheet.shipping_or_service_area,
              sourceHost: source.sourceHost,
              sourceCategory: source.sourceCategory,
              targetUrl: source.urls[0]!,
              enginesCiting: source.enginesCiting,
              rivalsFed: source.rivalsFed,
            });
            return {
              source_host: source.sourceHost,
              ownership: source.ownership,
              source_category: source.sourceCategory,
              recommended_action: source.recommendedAction,
              target_url: source.urls[0]!,
              engines_citing: source.enginesCiting,
              rivals_fed: source.rivalsFed,
              quality_score: artifact.score,
              draft_markdown: artifact.content,
            };
          });

        const citationActionPlaybook = buildCitationGapActionPlaybookMarkdown({
          brandName: audit.brandName,
          hostname: audit.hostname,
          coreOffering: audit.brandTruthSheet.core_offering,
          pricingSummary: audit.brandTruthSheet.verified_pricing_summary,
          shippingOrServiceArea: audit.brandTruthSheet.shipping_or_service_area,
          rankedSources: rankedCitationSources,
        });

        const payload = {
          domain: audit.domainUrl,
          brand_name: audit.brandName,
          visibility_score: audit.visibilityScore,
          served_from_cache: servedFromCache,
          credits_charged: gate.creditsCharged,
          credits_remaining: gate.creditsRemaining,
          engine_citation_share: engineCitationShare,
          ranked_citation_sources: rankedCitationSources,
          suggested_funnel_prompts: suggestedFunnelPrompts,
          targeted_outreach_drafts: targetedOutreachDrafts,
          citation_action_playbook_markdown: citationActionPlaybook.content,
          engine_snapshots: audit.scanResults.map((s) => ({
            prompt: s.promptText,
            engine: s.aiEngine,
            telemetry_type: s.fanoutTelemetryType,
            brand_mentioned: s.brandMentioned,
            citation_rank: s.citationRank,
            decompiled_fanout_queries: s.decompiledFanoutQueries,
            cited_source_urls: s.citedSourceUrls,
            competitors_mentioned: s.competitorsMentioned,
          })),
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
        };
      }
    );

    // 3. PAID TOOL: check_brand_hallucinations (1 credit cached / 10 credits live_refresh)
    server.registerTool(
      'check_brand_hallucinations',
      {
        title: 'Audit AI Hallucinations Against Brand Truth Sheet',
        description:
          'Paid Tool (Pro/Agency): Compares ChatGPT, Gemini, and Perplexity claims against verified pricing, shipping/delivery thresholds, and SKU exclusions. Costs 1 credit cached or 10 credits with live_refresh=true.',
        inputSchema: z.object({
          domain: z.string().min(3).describe('Target domain or URL'),
          verified_pricing_summary: z.string().optional(),
          shipping_or_service_area: z.string().optional(),
          false_claims_to_flag: z.array(z.string()).optional(),
          live_refresh: z.boolean().optional(),
        }),
      },
      async ({
        domain,
        verified_pricing_summary,
        shipping_or_service_area,
        false_claims_to_flag,
        live_refresh,
      }) => {
        const hasCustomTruth = Boolean(
          verified_pricing_summary ||
            shipping_or_service_area ||
            false_claims_to_flag?.length
        );
        const isLive = Boolean(live_refresh || hasCustomTruth);
        const creditsCost = isLive ? 10 : 1;

        const gate = await authorizeAndMeterPaidTool({
          rawBearerToken: caller.rawBearerToken,
          creditsCost,
          env,
        });

        if (!gate.allowed) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: gate.errorCode,
                    message: gate.upgradeMessage,
                    credits_remaining: gate.creditsRemaining,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const base = await getOrComputeAudit({
          domain,
          liveRefresh: Boolean(live_refresh),
          env,
        });

        const audit = hasCustomTruth
          ? await runFullGeoAudit({
              domainInput: domain,
              customTruthSheet: {
                ...base.audit.brandTruthSheet,
                is_user_verified: true,
                verified_pricing_summary:
                  verified_pricing_summary ??
                  base.audit.brandTruthSheet.verified_pricing_summary,
                shipping_or_service_area:
                  shipping_or_service_area ??
                  base.audit.brandTruthSheet.shipping_or_service_area,
                discontinued_or_false_claims_to_flag:
                  false_claims_to_flag ??
                  base.audit.brandTruthSheet.discontinued_or_false_claims_to_flag,
              },
              rawEnv: workerEnvToRawInput(env),
            })
          : base.audit;

        const brandSentiment = summarizeBrandSentimentAndSov({
          brandName: audit.brandName,
          snapshots: audit.scanResults,
        });

        const payload = {
          domain: audit.domainUrl,
          brand_name: audit.brandName,
          accuracy_score: audit.accuracyScore,
          brand_sentiment_summary: brandSentiment,
          brand_truth_sheet: audit.brandTruthSheet,
          hallucinations_count: audit.allHallucinations.length,
          hallucinations: audit.allHallucinations,
          credits_charged: gate.creditsCharged,
          credits_remaining: gate.creditsRemaining,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
        };
      }
    );

    // 4. PAID TOOL: generate_geo_fix_bundle (1 credit cached / 10 credits live_refresh)
    server.registerTool(
      'generate_geo_fix_bundle',
      {
        title: 'Generate Syntax-Validated GEO Fix Bundle',
        description:
          'Paid Tool (Pro/Agency): Generates ready-to-publish JSON-LD entity/FAQ schemas, /llms.txt, custom /agents.md or Shopify agents.md.liquid override, Answer-First FAQs, platform-tailored 1-click AI remediation prompt, and rival comparison pages—all syntax-validated against your Brand Truth Sheet.',
        inputSchema: z.object({
          domain: z.string().min(3).describe('Target domain or URL'),
          brand_name: z.string().optional(),
          target_env: z
            .enum([
              'coding_agent',
              'chat_assistant',
              'shopify_liquid',
              'wordpress_cms',
              'webflow_cms',
              'wix_squarespace_framer',
            ])
            .optional()
            .describe(
              'Optional target AI/CMS environment override; auto-detected from site HTML/headers when omitted'
            ),
          live_refresh: z.boolean().optional(),
        }),
      },
      async ({ domain, brand_name, target_env, live_refresh }) => {
        const isLive = Boolean(live_refresh || brand_name);
        const creditsCost = isLive ? 10 : 1;

        const gate = await authorizeAndMeterPaidTool({
          rawBearerToken: caller.rawBearerToken,
          creditsCost,
          env,
        });

        if (!gate.allowed) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: gate.errorCode,
                    message: gate.upgradeMessage,
                    credits_remaining: gate.creditsRemaining,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const { audit, servedFromCache } = await getOrComputeAudit({
          domain,
          liveRefresh: isLive,
          customBrandName: brand_name,
          env,
        });

        const executiveReport = buildExecutiveAuditReportMarkdown({
          domain: {
            brand_name: audit.brandName,
            domain_url: audit.domainUrl,
            is_shopify: audit.shopify.isShopify,
            shopify_mcp_status: audit.shopify.shopifyMcpStatus,
            agents_md_status: audit.shopify.agentsMdStatus,
            llms_txt_status: audit.probe.llmsTxtStatus,
            robots_ai_bot_status: audit.probe.robotsAiBotStatus,
            brand_truth_sheet: audit.brandTruthSheet,
            visibility_score: audit.visibilityScore,
            accuracy_score: audit.accuracyScore,
          },
          snapshots: audit.scanResults,
          fixes: audit.fixes.map((f) => ({
            fix_type: f.fixType,
            title: f.title,
            content_payload: f.contentPayload,
            is_applied: false,
            natural_quality_score: f.naturalQualityScore,
          })),
          trackedPrompts: audit.trackedPrompts,
          crawlerReadability: audit.probe.crawlerReadability ?? null,
        });

        const detectedPlatformId =
          audit.probe.detectedPlatform ??
          (audit.shopify.isShopify ? 'shopify' : 'nextjs_custom');
        const platformMeta = getWebsitePlatformMeta(detectedPlatformId);
        const resolvedTargetEnv: AiRemediationTargetEnv =
          target_env ?? platformMeta.recommendedAiEnv;

        const remediationPrompt = buildAiRemediationMasterPrompt({
          domain: {
            brand_name: audit.brandName,
            domain_url: audit.domainUrl,
            is_shopify: audit.shopify.isShopify,
            shopify_mcp_status: audit.shopify.shopifyMcpStatus,
            agents_md_status: audit.shopify.agentsMdStatus,
            llms_txt_status: audit.probe.llmsTxtStatus,
            robots_ai_bot_status: audit.probe.robotsAiBotStatus,
            brand_truth_sheet: audit.brandTruthSheet,
            visibility_score: audit.visibilityScore,
            accuracy_score: audit.accuracyScore,
          },
          fixes: audit.fixes.map((f) => ({
            fix_type: f.fixType,
            title: f.title,
            content_payload: f.contentPayload,
            is_applied: false,
            natural_quality_score: f.naturalQualityScore,
          })),
          snapshots: audit.scanResults,
          crawlerReadability: audit.probe.crawlerReadability ?? null,
          targetEnv: resolvedTargetEnv,
        });

        const topRival =
          summarizeBrandSentimentAndSov({
            brandName: audit.brandName,
            snapshots: audit.scanResults,
          }).headToHeadSov.find((r) => !r.isTargetBrand)?.entityName ?? null;

        const citationComparisonPage = buildCitationAnswerPageBundle({
          domain: {
            brand_name: audit.brandName,
            domain_url: audit.domainUrl,
            industry_vertical: audit.industryVertical,
            is_shopify: audit.shopify.isShopify,
            shopify_mcp_status: audit.shopify.shopifyMcpStatus,
            agents_md_status: audit.shopify.agentsMdStatus,
            llms_txt_status: audit.probe.llmsTxtStatus,
            brand_truth_sheet: audit.brandTruthSheet,
          },
          blueprintType: 'vs_competitor',
          rivalName: topRival,
          targetPrompt: audit.trackedPrompts[0] ?? null,
          targetEnv: resolvedTargetEnv,
        });

        const payload = {
          domain: audit.domainUrl,
          brand_name: audit.brandName,
          detected_platform: platformMeta.platformId,
          detected_platform_label: platformMeta.displayName,
          target_env: resolvedTargetEnv,
          is_shopify: audit.shopify.isShopify,
          shopify_mcp_status: audit.shopify.shopifyMcpStatus,
          served_from_cache: servedFromCache,
          credits_charged: gate.creditsCharged,
          credits_remaining: gate.creditsRemaining,
          ai_remediation_prompt: remediationPrompt.content,
          ai_remediation_prompt_score: remediationPrompt.score,
          citation_comparison_page: {
            suggested_path: citationComparisonPage.suggestedPath,
            canonical_url: citationComparisonPage.canonicalUrl,
            rival_compared: citationComparisonPage.rivalLabel,
            markdown_page: citationComparisonPage.markdownPage.content,
            faq_json_ld: citationComparisonPage.faqJsonLd,
            ai_build_prompt: citationComparisonPage.aiBuildPrompt.content,
          },
          executive_audit_report_markdown: executiveReport.content,
          executive_audit_quality_score: executiveReport.score,
          fixes: audit.fixes,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
        };
      }
    );

    return server;
  });
}

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    _ctx?: ExecutionContext
  ): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health' || url.pathname === '/') {
      return withCors(
        Response.json({
          service: 'verisource-mcp-worker',
          version: VERISOURCE_VERSION,
          mcp_endpoint: `${url.origin}/mcp`,
          discovery_manifest: `${url.origin}/.well-known/mcp.json`,
          transport: 'streamable_http_stateless',
          status: 'ok',
        })
      );
    }

    if (
      url.pathname === '/.well-known/mcp.json' ||
      url.pathname === '/server.json'
    ) {
      const manifest = buildMcpDiscoveryManifest({
        version: VERISOURCE_VERSION,
        appOrigin: env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev',
        mcpOrigin: url.origin,
      });
      return withCors(
        Response.json(manifest, {
          headers: { 'Cache-Control': 'public, max-age=3600' },
        })
      );
    }

    // RFC 9728 OAuth 2.0 Protected Resource Metadata for browser/desktop MCP clients
    if (
      url.pathname === '/.well-known/oauth-protected-resource' ||
      url.pathname === '/.well-known/oauth-protected-resource/mcp'
    ) {
      const authBase = env.NEXT_PUBLIC_SUPABASE_URL
        ? `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`
        : `${env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev'}/api/oauth`;

      const metadata = buildOAuthProtectedResourceMetadata({
        oauthMetadata: {
          issuer: authBase,
          authorization_endpoint: `${authBase}/authorize`,
          token_endpoint: `${authBase}/token`,
          response_types_supported: ['code'],
        },
        resourceServerUrl: new URL(`${url.origin}/mcp`),
        scopesSupported: ['mcp:preview', 'mcp:paid'],
        resourceName: 'Verisource GEO & Citation Intelligence MCP',
      });
      return withCors(Response.json(metadata));
    }

    if (url.pathname === '/mcp') {
      const bearerToken = extractBearerToken(request);
      const clientIp =
        request.headers.get('CF-Connecting-IP') ??
        request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
        '127.0.0.1';

      const authInfo = buildPassThroughAuthInfo(bearerToken, clientIp);
      const handler = buildMcpHandlerForEnv(env);
      const response = await handler.fetch(request, { authInfo });
      return withCors(response);
    }

    return withCors(
      Response.json(
        {
          error: 'NOT_FOUND',
          message: 'Connect your MCP client to POST /mcp via Streamable HTTP.',
        },
        { status: 404 }
      )
    );
  },

  async scheduled(
    _controller: ScheduledController,
    env: WorkerEnv,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(runScheduledDomainScans(env));
  },
} satisfies ExportedHandler<WorkerEnv>;
