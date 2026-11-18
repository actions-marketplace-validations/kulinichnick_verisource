import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  classifyIndustryVertical,
  matchesPublicHostname,
  normalizePublicDomain,
  sha256Hex,
  type DomainRow,
  type McpApiKeyRow,
  type ProfileRow,
} from '@verisource/core-geo';
import {
  checkHourlyOutboundVerifyLimit,
  domainCapForPlan,
  getLocalMockStore,
  getServiceSupabaseClient,
} from '../../../../lib/data-store';

export const maxDuration = 25;

const CliSyncPayloadSchema = z.object({
  domain: z.string().min(3).max(260),
  mode: z.enum(['scan', 'verify']),
  status: z.enum(['PASS', 'WARN', 'FAIL']),
  visibilityScore: z.number().min(0).max(100),
  llmsTxtStatus: z.enum(['present', 'missing']),
  agentsMdStatus: z.enum(['missing', 'default_boilerplate', 'custom_enriched']),
  robotsAiBotStatus: z.object({
    GPTBot: z.boolean(),
    'OAI-SearchBot': z.boolean(),
    PerplexityBot: z.boolean(),
    ClaudeBot: z.boolean(),
    'Google-Extended': z.boolean().optional(),
    waf_blocked: z.boolean().optional(),
  }),
  siteHealth: z
    .object({
      healthScore: z.number().min(0).max(100),
      pagesScanned: z.number().int().min(0).max(100),
      linksChecked: z.number().int().min(0).max(2000),
      brokenLinksCount: z.number().int().min(0).optional(),
      deadAnchorsCount: z.number().int().min(0).optional(),
    })
    .optional(),
  handles: z
    .array(
      z.object({
        handle: z.string().max(16),
        kind: z.string().max(40),
        severity: z.enum(['critical', 'warn', 'info']),
        summary: z.string().max(500),
        url: z.string().max(500).optional(),
        httpStatus: z.number().nullable().optional(),
        fixHint: z.string().max(500).optional(),
      })
    )
    .max(50)
    .default([]),
  gitMeta: z
    .object({
      sha: z.string().max(80).optional(),
      branch: z.string().max(120).optional(),
      repo: z.string().max(200).optional(),
      workflowRunUrl: z.string().max(400).optional(),
    })
    .optional(),
});

function maskEmail(email: string): string {
  const [local, host] = email.split('@');
  if (!local || !host) return email;
  if (local.length <= 2) return `${local[0] ?? '*'}*@${host}`;
  return `${local.slice(0, 2)}***@${host}`;
}

async function resolveCliBearerAuth(request: Request): Promise<
  | {
      ok: true;
      keyRow: McpApiKeyRow;
      profile: ProfileRow;
      trackedDomains: DomainRow[];
      isLiveDb: boolean;
    }
  | { ok: false; response: NextResponse }
> {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1';

  if (!checkHourlyOutboundVerifyLimit(`cli-sync:${ip}`, 120)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'Hourly CLI sync rate limit reached (120/hr).',
        },
        { status: 429 }
      ),
    };
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const rawKey = match?.[1]?.trim() ?? '';

  if (!rawKey) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'MISSING_API_KEY',
          message:
            'Provide Authorization: Bearer vs_live_<48hex>. Mint a key at https://verisource.dev/dashboard?tab=tab3_offsite.',
        },
        { status: 401 }
      ),
    };
  }

  if (!/^vs_live_[0-9a-f]{48}$/.test(rawKey)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'INVALID_API_KEY_FORMAT',
          message:
            'Verisource API keys must match vs_live_<48 lowercase hex characters>.',
        },
        { status: 401 }
      ),
    };
  }

  const keyHash = await sha256Hex(rawKey);
  const serviceSupabase = getServiceSupabaseClient();
  const nowIso = new Date().toISOString();

  if (serviceSupabase) {
    const { data: keyData } = await serviceSupabase
      .from('mcp_api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .maybeSingle();

    if (!keyData) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'INVALID_OR_REVOKED_KEY',
            message: 'API key is invalid or revoked.',
          },
          { status: 401 }
        ),
      };
    }

    const keyRow = keyData as McpApiKeyRow;
    const { data: profData } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', keyRow.user_id)
      .maybeSingle();

    if (!profData) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'WORKSPACE_NOT_FOUND',
            message: 'Workspace profile for this API key was not found.',
          },
          { status: 401 }
        ),
      };
    }

    const profile = profData as ProfileRow;
    if (profile.plan_tier === 'free') {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'PLAN_UPGRADE_REQUIRED',
            message:
              'Activate a 7-day free trial, $19 Audit Pass, or Pro/Agency plan to push CLI telemetry to your Console.',
            upgradeUrl: 'https://verisource.dev/pricing',
          },
          { status: 402 }
        ),
      };
    }

    await serviceSupabase
      .from('mcp_api_keys')
      .update({ last_used_at: nowIso })
      .eq('id', keyRow.id);

    const { data: domRows } = await serviceSupabase
      .from('domains')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true });

    return {
      ok: true,
      keyRow,
      profile,
      trackedDomains: (domRows ?? []) as DomainRow[],
      isLiveDb: true,
    };
  }

  const store = getLocalMockStore();
  const matchedKey = store.mcpApiKeys.find(
    (k) => k.key_hash === keyHash && k.is_active
  );
  if (!matchedKey) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'INVALID_OR_REVOKED_KEY',
          message: 'API key is invalid or revoked.',
        },
        { status: 401 }
      ),
    };
  }

  matchedKey.last_used_at = nowIso;
  const profile = store.profile;
  if (profile.plan_tier === 'free') {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'PLAN_UPGRADE_REQUIRED',
          message:
            'Activate a Console plan to push CLI telemetry to your workspace.',
          upgradeUrl: 'https://verisource.dev/pricing',
        },
        { status: 402 }
      ),
    };
  }

  return {
    ok: true,
    keyRow: matchedKey,
    profile,
    trackedDomains: store.domains.filter((d) => d.user_id === profile.id),
    isLiveDb: false,
  };
}

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await resolveCliBearerAuth(request);
  if (!auth.ok) return auth.response;

  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
    'https://verisource.dev';

  return NextResponse.json({
    ok: true,
    authenticated: true,
    email: maskEmail(auth.profile.email),
    planTier: auth.profile.plan_tier,
    keyPrefix: auth.keyRow.key_prefix,
    keyLabel: auth.keyRow.label,
    trackedDomainCount: auth.trackedDomains.length,
    domainCap: domainCapForPlan(auth.profile.plan_tier),
    dashboardUrl: `${appOrigin}/dashboard`,
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await resolveCliBearerAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const rawBody = await request.json().catch(() => null);
    const parsed = CliSyncPayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'INVALID_SYNC_PAYLOAD',
          message: 'Invalid CLI sync payload schema.',
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const normalized = normalizePublicDomain(data.domain);
    const nowIso = new Date().toISOString();
    const appOrigin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
      'https://verisource.dev';

    const robotsStatus = {
      GPTBot: data.robotsAiBotStatus.GPTBot,
      'OAI-SearchBot': data.robotsAiBotStatus['OAI-SearchBot'],
      PerplexityBot: data.robotsAiBotStatus.PerplexityBot,
      ClaudeBot: data.robotsAiBotStatus.ClaudeBot,
      'Google-Extended': data.robotsAiBotStatus['Google-Extended'] ?? true,
      waf_blocked: data.robotsAiBotStatus.waf_blocked ?? false,
    };

    const healthSummaryPayload: Record<string, unknown> = {
      source: 'verisource_cli',
      mode: data.mode,
      status: data.status,
      syncedAt: nowIso,
      siteHealth: data.siteHealth ?? null,
      handles: data.handles,
      gitMeta: data.gitMeta ?? null,
    };

    let matchedDomain = auth.trackedDomains.find((d) =>
      matchesPublicHostname(d.domain_url, normalized.hostname)
    );
    let autoRegistered = false;

    const serviceSupabase = getServiceSupabaseClient();
    const cap = domainCapForPlan(auth.profile.plan_tier);

    if (!matchedDomain) {
      if (auth.trackedDomains.length >= cap) {
        return NextResponse.json({
          ok: true,
          synced: false,
          autoRegistered: false,
          reason: 'DOMAIN_CAP_REACHED',
          hostname: normalized.hostname,
          planTier: auth.profile.plan_tier,
          domainCap: cap,
          dashboardUrl: `${appOrigin}/dashboard`,
          message: `Workspace is at ${auth.trackedDomains.length}/${cap} tracked domain(s). Remove an existing domain or upgrade on /pricing to auto-track ${normalized.hostname}.`,
        });
      }

      const brandLabel = normalized.hostname
        .split('.')[0]!
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const newDomain: DomainRow = {
        id: crypto.randomUUID(),
        user_id: auth.profile.id,
        domain_url: normalized.origin,
        brand_name: brandLabel,
        industry_vertical: classifyIndustryVertical({
          hostname: normalized.hostname,
          brandName: brandLabel,
          coreOffering: '',
        }).industryVertical,
        is_shopify: false,
        shopify_mcp_status: 'unavailable',
        agents_md_status: data.agentsMdStatus,
        llms_txt_status: data.llmsTxtStatus,
        robots_ai_bot_status: robotsStatus,
        brand_truth_sheet: {
          is_user_verified: false,
          core_offering: `${brandLabel} products and services at ${normalized.hostname}.`,
          verified_pricing_summary: 'Verify exact pricing in Console Step 01.',
          shipping_or_service_area: 'Global / online availability.',
          key_differentiators: [],
          discontinued_or_false_claims_to_flag: [],
        },
        visibility_score: Math.round(data.visibilityScore),
        accuracy_score: data.handles.some((h) => h.kind === 'hallucination')
          ? 70
          : 100,
        tracking_pixel_token: crypto.randomUUID(),
        last_scanned_at: nowIso,
        created_at: nowIso,
      };

      if (auth.isLiveDb && serviceSupabase) {
        const { data: inserted, error: insertErr } = await serviceSupabase
          .from('domains')
          .insert(newDomain)
          .select('*')
          .maybeSingle();
        if (!insertErr && inserted) {
          matchedDomain = inserted as DomainRow;
          autoRegistered = true;
        }
      } else {
        const store = getLocalMockStore();
        newDomain.crawl_health_summary = healthSummaryPayload;
        store.domains.push(newDomain);
        matchedDomain = newDomain;
        autoRegistered = true;
      }
    } else {
      const corePatch = {
        visibility_score: Math.round(data.visibilityScore),
        llms_txt_status: data.llmsTxtStatus,
        agents_md_status: data.agentsMdStatus,
        robots_ai_bot_status: robotsStatus,
        last_scanned_at: nowIso,
      };

      if (auth.isLiveDb && serviceSupabase) {
        await serviceSupabase
          .from('domains')
          .update(corePatch)
          .eq('id', matchedDomain.id)
          .eq('user_id', auth.profile.id);

        // Best-effort optional crawl_health_summary column update
        await serviceSupabase
          .from('domains')
          .update({ crawl_health_summary: healthSummaryPayload })
          .eq('id', matchedDomain.id)
          .eq('user_id', auth.profile.id)
          .then(() => undefined, () => undefined);
      } else {
        Object.assign(matchedDomain, corePatch, {
          crawl_health_summary: healthSummaryPayload,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      synced: Boolean(matchedDomain),
      autoRegistered,
      domainId: matchedDomain?.id ?? null,
      hostname: normalized.hostname,
      planTier: auth.profile.plan_tier,
      brandTruthVerified: Boolean(
        matchedDomain?.brand_truth_sheet?.is_user_verified
      ),
      brandTruthSummary:
        matchedDomain?.brand_truth_sheet?.verified_pricing_summary ?? null,
      dashboardUrl: `${appOrigin}/dashboard`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'CLI_SYNC_FAILED',
        message:
          err instanceof Error ? err.message : 'Unable to sync CLI telemetry.',
      },
      { status: 400 }
    );
  }
}
