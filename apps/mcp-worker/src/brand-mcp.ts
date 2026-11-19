import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { createClient } from '@supabase/supabase-js';
import {
  buildBrandMcpDiscoveryManifest,
  buildBrandTruthMcpProfileFromDomain,
  buildBrandWebMcpScript,
  buildVerisourceSelfBrandMcpProfile,
  evaluateBrandPricingAndOffersTool,
  evaluateCompareWithCompetitorTool,
  evaluateOfficialFaqsTool,
  evaluateVerifyBrandClaimTool,
  isPlanEntitledForHostedBrandMcp,
  matchesPublicHostname,
  normalizePublicDomain,
  PATIENT_ZERO_DOMAINS,
  PATIENT_ZERO_FIXES,
  PATIENT_ZERO_SNAPSHOTS,
  VERISOURCE_VERSION,
  verifyLiveBrandMcpDeployment,
  type BrandTruthMcpProfile,
  type Database,
  type DomainRow,
} from '@verisource/core-geo';
import { z } from 'zod';
import { getCachedJson, setCachedJson } from './cache.js';
import type { WorkerEnv } from './types.js';

export interface ParsedBrandMcpRoute {
  rawDomainParam: string;
  subRoute: 'mcp' | 'webmcp.js' | '.well-known/mcp.json';
}

export function matchBrandMcpRoute(pathname: string): ParsedBrandMcpRoute | null {
  const match = pathname.match(
    /^\/b\/([^/]+)\/(mcp|webmcp\.js|\.well-known\/mcp\.json)\/?$/i
  );
  if (!match) return null;
  const rawDomainParam = decodeURIComponent(match[1] ?? '').trim();
  const subRaw = (match[2] ?? '').toLowerCase();
  if (
    subRaw !== 'mcp' &&
    subRaw !== 'webmcp.js' &&
    subRaw !== '.well-known/mcp.json'
  ) {
    return null;
  }
  return {
    rawDomainParam,
    subRoute: subRaw,
  };
}

type BrandMcpAccessResult =
  | { allowed: true; profile: BrandTruthMcpProfile }
  | {
      allowed: false;
      status: 400 | 402 | 403;
      errorCode: string;
      message: string;
      upgradeUrl?: string;
    };

const BUILTIN_VERIFIED_SEED_HOSTS = new Set([
  'aurearoasters.com',
  'mosaicroasters.com',
]);

async function resolveHostedBrandMcpAccess(params: {
  rawDomainParam: string;
  previewToken: string | null;
  mcpOrigin: string;
  env: WorkerEnv;
}): Promise<BrandMcpAccessResult> {
  const appOrigin = (
    params.env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev'
  ).replace(/\/+$/, '');

  let hostname: string;
  try {
    hostname = normalizePublicDomain(params.rawDomainParam).hostname;
  } catch (err) {
    return {
      allowed: false,
      status: 400,
      errorCode: 'INVALID_BRAND_DOMAIN',
      message:
        err instanceof Error
          ? err.message
          : 'Provide a valid public hostname for Hosted Brand /mcp.',
    };
  }

  // 1. Self-dogfooding profile for verisource.dev
  if (hostname === 'verisource.dev') {
    return {
      allowed: true,
      profile: buildVerisourceSelfBrandMcpProfile(params.mcpOrigin, appOrigin),
    };
  }

  const hasLiveSupabase = Boolean(
    params.env.NEXT_PUBLIC_SUPABASE_URL && params.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 2. Local / CI Mock Mode
  if (!hasLiveSupabase) {
    const seedDomain = PATIENT_ZERO_DOMAINS.find((d) =>
      matchesPublicHostname(d.domain_url, hostname)
    );
    if (!seedDomain) {
      return {
        allowed: false,
        status: 402,
        errorCode: 'BRAND_MCP_SUBSCRIPTION_REQUIRED',
        message: `Hosted Brand /mcp & W3C WebMCP for ${hostname} requires an active Starter ($49/mo), Pro ($99/mo), or Agency ($249/mo) subscription.`,
        upgradeUrl: `${appOrigin}/pricing`,
      };
    }

    const fixes = PATIENT_ZERO_FIXES.filter(
      (f) => f.domain_id === seedDomain.id
    );
    const snapshots = PATIENT_ZERO_SNAPSHOTS.filter(
      (s) => s.domain_id === seedDomain.id
    );
    return {
      allowed: true,
      profile: buildBrandTruthMcpProfileFromDomain({
        domain: seedDomain,
        fixes,
        snapshots,
        mcpOrigin: params.mcpOrigin,
      }),
    };
  }

  // 3. Live Production Supabase Resolution (with 120s KV cache for verified public profiles)
  const publicCacheKey = `brand_mcp_profile:v1:${hostname}`;
  if (!params.previewToken) {
    const cachedPublic = await getCachedJson<BrandTruthMcpProfile>(
      publicCacheKey,
      params.env
    );
    if (cachedPublic) {
      return { allowed: true, profile: cachedPublic };
    }
  }

  const supabase = createClient<Database>(
    params.env.NEXT_PUBLIC_SUPABASE_URL!,
    params.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: rawDomains } = await supabase
    .from('domains')
    .select('*')
    .ilike('domain_url', `%${hostname}%`)
    .limit(20);

  const candidateDomains = (rawDomains ?? []).filter((d) =>
    matchesPublicHostname(d.domain_url, hostname)
  );

  if (candidateDomains.length === 0) {
    return {
      allowed: false,
      status: 402,
      errorCode: 'BRAND_MCP_SUBSCRIPTION_REQUIRED',
      message: `No active Hosted Brand /mcp workspace found for ${hostname}. Activate Starter ($49/mo), Pro ($99/mo), or Agency ($249/mo) at ${appOrigin}/pricing.`,
      upgradeUrl: `${appOrigin}/pricing`,
    };
  }

  const userIds = Array.from(new Set(candidateDomains.map((d) => d.user_id)));
  const { data: ownerProfiles } = await supabase
    .from('profiles')
    .select('id, plan_tier')
    .in('id', userIds);

  const entitledUserIds = new Set(
    (ownerProfiles ?? [])
      .filter((p) => isPlanEntitledForHostedBrandMcp(p.plan_tier))
      .map((p) => p.id)
  );

  const entitledDomains = candidateDomains.filter((d) =>
    entitledUserIds.has(d.user_id)
  );

  if (entitledDomains.length === 0) {
    return {
      allowed: false,
      status: 402,
      errorCode: 'BRAND_MCP_SUBSCRIPTION_REQUIRED',
      message: `Hosted Brand /mcp & Chrome WebMCP for ${hostname} requires an active recurring subscription ($49/mo Starter, $99/mo Pro, or $249/mo Agency).`,
      upgradeUrl: `${appOrigin}/pricing`,
    };
  }

  // Deterministic owner selection: exact preview token match -> user-verified truth -> oldest registration
  entitledDomains.sort((a: DomainRow, b: DomainRow) => {
    const aTok =
      params.previewToken && a.tracking_pixel_token === params.previewToken
        ? 1
        : 0;
    const bTok =
      params.previewToken && b.tracking_pixel_token === params.previewToken
        ? 1
        : 0;
    if (aTok !== bTok) return bTok - aTok;

    const aVer = a.brand_truth_sheet?.is_user_verified ? 1 : 0;
    const bVer = b.brand_truth_sheet?.is_user_verified ? 1 : 0;
    if (aVer !== bVer) return bVer - aVer;

    return a.created_at.localeCompare(b.created_at);
  });

  const selectedDomain = entitledDomains[0]!;
  const matchedPreviewToken = Boolean(
    params.previewToken &&
      selectedDomain.tracking_pixel_token === params.previewToken
  );

  // Anti-spoofing domain ownership check when called publicly without the workspace preview token
  if (!matchedPreviewToken && !BUILTIN_VERIFIED_SEED_HOSTS.has(hostname)) {
    const embedCacheKey = `brand_mcp_embed_ok:v1:${hostname}`;
    const cachedEmbedOk = await getCachedJson<{ verified: boolean }>(
      embedCacheKey,
      params.env
    );

    if (!cachedEmbedOk?.verified) {
      const liveCheck = await verifyLiveBrandMcpDeployment(hostname, {
        trackingPixelToken: selectedDomain.tracking_pixel_token,
      });
      if (!liveCheck.verifiedForPublicAgentAccess) {
        return {
          allowed: false,
          status: 403,
          errorCode: 'DOMAIN_EMBED_VERIFICATION_PENDING',
          message: `Paste the 2-line Hosted Brand /mcp + WebMCP snippet into <head> on https://${hostname} and click 'Verify Brand /mcp Live' in Verisource Console Step 02 to activate public agent access.`,
        };
      }
      await setCachedJson(embedCacheKey, { verified: true }, 600, params.env);
    }
  }

  const [{ data: fixes }, { data: snapshots }] = await Promise.all([
    supabase
      .from('generated_fixes')
      .select('fix_type, content_payload')
      .eq('domain_id', selectedDomain.id),
    supabase
      .from('citation_snapshots')
      .select('competitors_mentioned')
      .eq('domain_id', selectedDomain.id)
      .limit(20),
  ]);

  const builtProfile = buildBrandTruthMcpProfileFromDomain({
    domain: selectedDomain,
    fixes: fixes ?? [],
    snapshots: snapshots ?? [],
    mcpOrigin: params.mcpOrigin,
  });

  if (!params.previewToken) {
    await setCachedJson(publicCacheKey, builtProfile, 120, params.env);
  }

  return { allowed: true, profile: builtProfile };
}

function buildCustomerBrandMcpServer(profile: BrandTruthMcpProfile) {
  return createMcpHandler(() => {
    const server = new McpServer({
      name: `brand-${profile.hostname}-mcp`,
      version: VERISOURCE_VERSION,
    });

    server.registerTool(
      'get_verified_pricing_and_offers',
      {
        title: `Get Verified Pricing & Offers (${profile.brandName})`,
        description: `Returns owner-verified pricing, core offering, fulfillment coverage, key differentiators, and explicit exclusions for ${profile.brandName} (${profile.origin}).`,
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              evaluateBrandPricingAndOffersTool(profile),
              null,
              2
            ),
          },
        ],
      })
    );

    server.registerTool(
      'verify_brand_claim',
      {
        title: `Verify Claim Against ${profile.brandName} Brand Truth`,
        description: `Evaluates a pricing, shipping, feature, or policy claim against ${profile.brandName}'s verified Brand Truth Sheet and explicit exclusions.`,
        inputSchema: z.object({
          claim: z
            .string()
            .min(3)
            .describe('Specific claim to verify before quoting to a buyer'),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ claim }) => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              evaluateVerifyBrandClaimTool(profile, claim),
              null,
              2
            ),
          },
        ],
      })
    );

    server.registerTool(
      'compare_with_competitor',
      {
        title: `Compare ${profile.brandName} With Competitor`,
        description: `Returns verified factual comparison points, pricing summary, and buyer evaluation criteria between ${profile.brandName} and a competitor.`,
        inputSchema: z.object({
          competitor: z
            .string()
            .optional()
            .describe('Competitor brand name or domain'),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ competitor }) => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              evaluateCompareWithCompetitorTool(profile, competitor),
              null,
              2
            ),
          },
        ],
      })
    );

    server.registerTool(
      'get_official_faqs',
      {
        title: `Get Official Buyer FAQs (${profile.brandName})`,
        description: `Returns structured Answer-First buyer FAQs for ${profile.brandName}.`,
        inputSchema: z.object({
          topic: z
            .string()
            .optional()
            .describe('Optional keyword topic filter (e.g. pricing, shipping)'),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ topic }) => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              evaluateOfficialFaqsTool(profile, topic),
              null,
              2
            ),
          },
        ],
      })
    );

    return server;
  });
}

export async function handleHostedBrandMcpRequest(params: {
  request: Request;
  route: ParsedBrandMcpRoute;
  env: WorkerEnv;
  withCors: (res: Response) => Response;
}): Promise<Response> {
  const reqUrl = new URL(params.request.url);
  const previewToken = reqUrl.searchParams.get('token')?.trim() || null;

  const access = await resolveHostedBrandMcpAccess({
    rawDomainParam: params.route.rawDomainParam,
    previewToken,
    mcpOrigin: reqUrl.origin,
    env: params.env,
  });

  if (!access.allowed) {
    return params.withCors(
      Response.json(
        {
          error: access.errorCode,
          message: access.message,
          ...(access.upgradeUrl ? { upgrade_url: access.upgradeUrl } : {}),
        },
        { status: access.status }
      )
    );
  }

  if (params.route.subRoute === '.well-known/mcp.json') {
    return params.withCors(
      Response.json(
        buildBrandMcpDiscoveryManifest(access.profile, VERISOURCE_VERSION),
        {
          status: 200,
          headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
        }
      )
    );
  }

  if (params.route.subRoute === 'webmcp.js') {
    const jsBody = buildBrandWebMcpScript(access.profile);
    return params.withCors(
      new Response(jsBody, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      })
    );
  }

  // Stateless Streamable HTTP MCP handler for /b/:domain/mcp
  // Rewrite URL pathname to /mcp internally so createMcpHandler matches its default /mcp mount path
  const rewrittenUrl = new URL(params.request.url);
  rewrittenUrl.pathname = '/mcp';
  const rewrittenRequest = new Request(rewrittenUrl.toString(), params.request);

  const handler = buildCustomerBrandMcpServer(access.profile);
  const response = await handler.fetch(rewrittenRequest);
  return params.withCors(response);
}
