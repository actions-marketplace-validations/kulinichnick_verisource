import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  AUREA_DOMAIN_ID,
  DEMO_PROFILE,
  MOSAIC_DOMAIN_ID,
  PATIENT_ZERO_ATTRIBUTION,
  PATIENT_ZERO_DOMAINS,
  PATIENT_ZERO_FIXES,
  PATIENT_ZERO_PITCH_REPORT,
  PATIENT_ZERO_PROMPTS,
  PATIENT_ZERO_SNAPSHOTS,
  classifyPromptIntent,
  isFixTypeLiveOnDomain,
  normalizePublicDomain,
  resolveCoreGeoEnv,
  runFullGeoAudit,
  type AgencyPitchReportRow,
  type AiAttributionEventRow,
  type BillingCycle,
  type CitationSnapshotRow,
  type CrawlerReadabilityReport,
  type Database,
  type DomainRow,
  type GeneratedFixRow,
  type McpApiKeyRow,
  type PlanTier,
  type ProfileRow,
  type PublicPitchReportResult,
  type TrackedPromptRow,
} from '@verisource/core-geo';

interface LocalWorkspaceState {
  profile: ProfileRow;
  domains: DomainRow[];
  prompts: TrackedPromptRow[];
  snapshots: CitationSnapshotRow[];
  fixes: GeneratedFixRow[];
  attributionEvents: AiAttributionEventRow[];
  pitchReports: AgencyPitchReportRow[];
  mcpApiKeys: McpApiKeyRow[];
}

const globalForVerisource = globalThis as unknown as {
  __verisourceMockStore?: LocalWorkspaceState;
  __verisourceGraderCache?: Map<string, { expiresAt: number; data: unknown }>;
  __verisourceGraderIpMap?: Map<string, { day: string; count: number }>;
  __verisourcePitchIpMap?: Map<string, { hourBucket: string; count: number }>;
  __verisourceAlertIpMap?: Map<string, { hourBucket: string; count: number }>;
  __verisourceVerifyFixesIpMap?: Map<
    string,
    { hourBucket: string; count: number }
  >;
  __verisourceDemoScanIpMap?: Map<
    string,
    { hourBucket: string; count: number }
  >;
  __verisourceAuditViewDedupMap?: Map<string, number>;
  __verisourceProcessedStripeEvents?: Set<string>;
};

export const PROTECTED_PATIENT_ZERO_IDS = new Set<string>([
  AUREA_DOMAIN_ID,
  MOSAIC_DOMAIN_ID,
]);

export function getAuditViewDedupMap(): Map<string, number> {
  if (!globalForVerisource.__verisourceAuditViewDedupMap) {
    globalForVerisource.__verisourceAuditViewDedupMap = new Map();
  }
  const map = globalForVerisource.__verisourceAuditViewDedupMap;
  if (map.size > 2000) {
    const now = Date.now();
    for (const [k, exp] of map.entries()) {
      if (exp <= now) map.delete(k);
    }
    if (map.size > 2000) map.clear();
  }
  return map;
}

export function getProcessedStripeEventsSet(): Set<string> {
  if (!globalForVerisource.__verisourceProcessedStripeEvents) {
    globalForVerisource.__verisourceProcessedStripeEvents = new Set();
  }
  return globalForVerisource.__verisourceProcessedStripeEvents;
}

export function mcpLimitForPlan(plan: ProfileRow['plan_tier']): number {
  switch (plan) {
    case 'agency_249':
      return 5000;
    case 'pro_99':
      return 1000;
    case 'starter_49':
    case 'tripwire_19':
      return 25;
    default:
      return 5;
  }
}

export function trialMcpLimitForPlan(plan: ProfileRow['plan_tier']): number {
  switch (plan) {
    case 'pro_99':
      return 150;
    case 'starter_49':
      return 25;
    default:
      return mcpLimitForPlan(plan);
  }
}

export function isPlanEligibleFor7DayTrial(
  plan: PlanTier,
  cycle: BillingCycle
): boolean {
  return (plan === 'starter_49' || plan === 'pro_99') && cycle === 'monthly';
}

export function domainCapForPlan(plan: ProfileRow['plan_tier']): number {
  switch (plan) {
    case 'agency_249':
      return 15;
    case 'pro_99':
      return 3;
    default:
      return 1;
  }
}

export function promptCapForPlan(plan: ProfileRow['plan_tier']): number {
  switch (plan) {
    case 'agency_249':
      return 400;
    case 'pro_99':
      return 100;
    case 'starter_49':
    case 'tripwire_19':
      return 35;
    default:
      return 5;
  }
}

export function getLocalMockStore(): LocalWorkspaceState {
  if (!globalForVerisource.__verisourceMockStore) {
    globalForVerisource.__verisourceMockStore = {
      profile: structuredClone(DEMO_PROFILE),
      domains: structuredClone(PATIENT_ZERO_DOMAINS),
      prompts: structuredClone(PATIENT_ZERO_PROMPTS),
      snapshots: structuredClone(PATIENT_ZERO_SNAPSHOTS),
      fixes: structuredClone(PATIENT_ZERO_FIXES),
      attributionEvents: structuredClone(PATIENT_ZERO_ATTRIBUTION),
      pitchReports: [structuredClone(PATIENT_ZERO_PITCH_REPORT)],
      mcpApiKeys: [
        {
          id: '77777777-1111-4000-8000-000000000001',
          user_id: DEMO_PROFILE.id,
          key_hash: 'demo_pro_sha256_placeholder',
          key_prefix: 'vs_demo_pro_ke',
          label: 'Claude Desktop & Cursor Agent Key',
          last_used_at: '2026-11-13T10:12:00.000Z',
          is_active: true,
          created_at: '2026-10-20T12:00:00.000Z',
        },
      ],
    };
  }
  return globalForVerisource.__verisourceMockStore;
}

export function getGraderCacheMap(): Map<
  string,
  { expiresAt: number; data: unknown }
> {
  if (!globalForVerisource.__verisourceGraderCache) {
    globalForVerisource.__verisourceGraderCache = new Map();
  }
  return globalForVerisource.__verisourceGraderCache;
}

export function getGraderIpMap(): Map<string, { day: string; count: number }> {
  if (!globalForVerisource.__verisourceGraderIpMap) {
    globalForVerisource.__verisourceGraderIpMap = new Map();
  }
  return globalForVerisource.__verisourceGraderIpMap;
}

export function getPitchIpMap(): Map<
  string,
  { hourBucket: string; count: number }
> {
  if (!globalForVerisource.__verisourcePitchIpMap) {
    globalForVerisource.__verisourcePitchIpMap = new Map();
  }
  return globalForVerisource.__verisourcePitchIpMap;
}

export function getAlertIpMap(): Map<
  string,
  { hourBucket: string; count: number }
> {
  if (!globalForVerisource.__verisourceAlertIpMap) {
    globalForVerisource.__verisourceAlertIpMap = new Map();
  }
  return globalForVerisource.__verisourceAlertIpMap;
}

export function getVerifyFixesIpMap(): Map<
  string,
  { hourBucket: string; count: number }
> {
  if (!globalForVerisource.__verisourceVerifyFixesIpMap) {
    globalForVerisource.__verisourceVerifyFixesIpMap = new Map();
  }
  return globalForVerisource.__verisourceVerifyFixesIpMap;
}

export function getDemoScanIpMap(): Map<
  string,
  { hourBucket: string; count: number }
> {
  if (!globalForVerisource.__verisourceDemoScanIpMap) {
    globalForVerisource.__verisourceDemoScanIpMap = new Map();
  }
  const map = globalForVerisource.__verisourceDemoScanIpMap;
  if (map.size > 2000) {
    map.clear();
  }
  return map;
}

export function checkAndConsumeDemoScanQuota(
  request: Request,
  limitPerHour = 6
): { allowed: boolean; used: number; limit: number } {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1';
  const hourBucket = new Date().toISOString().slice(0, 13);
  const ipMap = getDemoScanIpMap();
  const entry = ipMap.get(ip);
  const used = entry && entry.hourBucket === hourBucket ? entry.count : 0;
  if (used >= limitPerHour) {
    return { allowed: false, used, limit: limitPerHour };
  }
  ipMap.set(ip, { hourBucket, count: used + 1 });
  return { allowed: true, used: used + 1, limit: limitPerHour };
}

export const MOCK_OWNER_SESSION_TOKEN = 'vs_mock_owner_session';

export function extractCookieValue(
  cookieHeader: string | null,
  cookieName: string
): string {
  if (!cookieHeader) return '';
  const pairs = cookieHeader.split(';');
  for (const rawPair of pairs) {
    const eqIdx = rawPair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = rawPair.slice(0, eqIdx).trim();
    if (key === cookieName) {
      try {
        return decodeURIComponent(rawPair.slice(eqIdx + 1).trim());
      } catch {
        return rawPair.slice(eqIdx + 1).trim();
      }
    }
  }
  return '';
}

const DEFAULT_FOUNDER_OWNER_EMAILS = [
  'nick@mosaicroasters.com',
  'info@aurearoasters.com',
];

export function isFounderOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const configuredList = [
    ...(process.env.CONSOLE_OWNER_EMAIL ?? '').split(','),
    process.env.ALERT_FALLBACK_EMAIL ?? '',
    ...DEFAULT_FOUNDER_OWNER_EMAILS,
  ]
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return configuredList.includes(normalized);
}

export function hasActiveConsolePlan(
  planTier: ProfileRow['plan_tier']
): boolean {
  return planTier !== 'free';
}

export function createLockedPlaceholderProfile(): ProfileRow {
  const nowIso = '2026-01-01T00:00:00.000Z';
  return {
    id: '00000000-0000-4000-8000-000000000000',
    email: '',
    plan_tier: 'free',
    billing_cycle: 'monthly',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    tripwire_paid_at: null,
    mcp_calls_used_this_month: 0,
    mcp_calls_limit: 5,
    agency_brand_name: null,
    agency_logo_url: null,
    agency_primary_color: '#0A0E17',
    agency_cta_url: null,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

export function isMockOwnerRequest(
  request: Request,
  explicitToken?: string | null
): boolean {
  // Strictly disabled whenever live Supabase service role credentials are present
  if (getServiceSupabaseClient()) return false;

  const candidate = explicitToken?.trim() ?? '';
  if (candidate === MOCK_OWNER_SESSION_TOKEN) return true;

  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer === MOCK_OWNER_SESSION_TOKEN) return true;
  }

  const mockCookie = extractCookieValue(
    request.headers.get('cookie'),
    'vs_mock_session'
  );
  return mockCookie === 'owner';
}

export function getServiceSupabaseClient(): SupabaseClient<Database> | null {
  const env = resolveCoreGeoEnv();
  if (env.providerMode === 'mock') {
    return null;
  }
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }
  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function resolveAuthenticatedProfile(
  request: Request,
  explicitToken?: string | null
): Promise<{
  supabase: SupabaseClient<Database>;
  profile: ProfileRow;
} | null> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return null;

  let token = explicitToken?.trim() ?? '';
  if (!token) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }
  if (!token) {
    token = extractCookieValue(request.headers.get('cookie'), 'vs_access_token');
  }
  if (!token || token === MOCK_OWNER_SESSION_TOKEN) return null;

  const { data: userRes, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !userRes?.user) {
    return null;
  }

  const user = userRes.user;
  const isOwner = isFounderOwnerEmail(user.email);

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) {
    if (isOwner && existingProfile.plan_tier !== 'agency_249') {
      const upgradedLimit = Math.max(existingProfile.mcp_calls_limit, 5000);
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .update({
          plan_tier: 'agency_249',
          mcp_calls_limit: upgradedLimit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('*')
        .maybeSingle();
      if (ownerProfile) {
        return { supabase, profile: ownerProfile };
      }
      return {
        supabase,
        profile: {
          ...existingProfile,
          plan_tier: 'agency_249',
          mcp_calls_limit: upgradedLimit,
        },
      };
    }
    return { supabase, profile: existingProfile };
  }

  // Auto-provision profile row if missing
  const nowIso = new Date().toISOString();
  const fallbackEmail = user.email ?? `${user.id}@verisource.dev`;
  const initialPlan: ProfileRow['plan_tier'] = isOwner ? 'agency_249' : 'free';
  const initialMcpLimit = isOwner ? 5000 : 5;

  const { data: createdProfile } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: fallbackEmail,
        plan_tier: initialPlan,
        billing_cycle: 'monthly',
        mcp_calls_used_this_month: 0,
        mcp_calls_limit: initialMcpLimit,
        agency_primary_color: '#0A0E17',
        created_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .maybeSingle();

  if (!createdProfile) return null;
  return { supabase, profile: createdProfile };
}

export type ConsoleRequestAccess =
  | {
      status: 'authenticated';
      supabase: SupabaseClient<Database>;
      profile: ProfileRow;
    }
  | {
      status: 'plan_activation_required';
      supabase: SupabaseClient<Database> | null;
      profile: ProfileRow;
    }
  | {
      status: 'mock_owner';
      supabase: null;
      profile: ProfileRow;
    }
  | {
      status: 'unauthenticated';
      supabase: null;
      profile: null;
    };

export async function resolveConsoleRequestAccess(
  request: Request,
  explicitToken?: string | null
): Promise<ConsoleRequestAccess> {
  const auth = await resolveAuthenticatedProfile(request, explicitToken);
  if (auth) {
    if (
      hasActiveConsolePlan(auth.profile.plan_tier) ||
      isFounderOwnerEmail(auth.profile.email)
    ) {
      return {
        status: 'authenticated',
        supabase: auth.supabase,
        profile: auth.profile,
      };
    }
    return {
      status: 'plan_activation_required',
      supabase: auth.supabase,
      profile: auth.profile,
    };
  }

  if (isMockOwnerRequest(request, explicitToken)) {
    const store = getLocalMockStore();
    if (!hasActiveConsolePlan(store.profile.plan_tier)) {
      return {
        status: 'plan_activation_required',
        supabase: null,
        profile: store.profile,
      };
    }
    return {
      status: 'mock_owner',
      supabase: null,
      profile: store.profile,
    };
  }

  return {
    status: 'unauthenticated',
    supabase: null,
    profile: null,
  };
}

export async function lookupDomainByPixelToken(
  token: string
): Promise<DomainRow | null> {
  const supabase = getServiceSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from('domains')
      .select('*')
      .eq('tracking_pixel_token', token)
      .maybeSingle();
    if (data) return data;
  }

  const store = getLocalMockStore();
  return store.domains.find((d) => d.tracking_pixel_token === token) ?? null;
}

export async function recordAttributionEvent(event: {
  domain_id: string;
  event_type: 'ai_referral_visit' | 'ai_referral_conversion' | 'ai_bot_crawl';
  source_engine: string;
  landing_path: string | null;
  conversion_value_usd: number | null;
}): Promise<AiAttributionEventRow> {
  const supabase = getServiceSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('ai_attribution_events')
      .insert(event)
      .select('*')
      .single();
    if (!error && data) return data;
  }

  const store = getLocalMockStore();
  const created: AiAttributionEventRow = {
    id: crypto.randomUUID(),
    domain_id: event.domain_id,
    event_type: event.event_type,
    source_engine: event.source_engine,
    landing_path: event.landing_path,
    conversion_value_usd: event.conversion_value_usd,
    created_at: new Date().toISOString(),
  };
  store.attributionEvents.unshift(created);
  return created;
}

export async function fetchPublicPitchBySlug(
  slug: string
): Promise<PublicPitchReportResult | null> {
  const supabase = getServiceSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('agency_pitch_reports')
      .select('*')
      .eq('share_slug', slug)
      .maybeSingle();
    if (!error && data) {
      if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
        return null;
      }
      return {
        share_slug: data.share_slug,
        prospect_domain: data.prospect_domain,
        prospect_brand_name: data.prospect_brand_name,
        visibility_score: data.visibility_score,
        hallucination_count: data.hallucination_count,
        agency_brand_name: data.agency_brand_name_snapshot,
        agency_logo_url: data.agency_logo_url_snapshot,
        agency_primary_color: data.agency_primary_color_snapshot,
        agency_cta_url: data.agency_cta_url_snapshot,
        summary_payload: data.summary_payload,
        views_count: data.views_count,
        expires_at: data.expires_at,
        created_at: data.created_at,
      };
    }
  }

  const store = getLocalMockStore();
  const report = store.pitchReports.find((r) => r.share_slug === slug);
  if (!report) return null;
  if (
    report.expires_at &&
    new Date(report.expires_at).getTime() <= Date.now()
  ) {
    return null;
  }

  return {
    share_slug: report.share_slug,
    prospect_domain: report.prospect_domain,
    prospect_brand_name: report.prospect_brand_name,
    visibility_score: report.visibility_score,
    hallucination_count: report.hallucination_count,
    agency_brand_name: report.agency_brand_name_snapshot,
    agency_logo_url: report.agency_logo_url_snapshot,
    agency_primary_color: report.agency_primary_color_snapshot,
    agency_cta_url: report.agency_cta_url_snapshot,
    summary_payload: report.summary_payload,
    views_count: report.views_count,
    expires_at: report.expires_at,
    created_at: report.created_at,
  };
}

export async function recordVerifiedPitchOpen(slug: string): Promise<{
  report: PublicPitchReportResult;
  ownerEmail: string | null;
} | null> {
  const supabase = getServiceSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.rpc('get_public_pitch_report', {
      p_share_slug: slug,
    });
    if (!error && Array.isArray(data) && data[0]) {
      const updated = data[0];
      let ownerEmail: string | null = null;
      const { data: rowMeta } = await supabase
        .from('agency_pitch_reports')
        .select('agency_user_id')
        .eq('share_slug', slug)
        .maybeSingle();
      if (rowMeta?.agency_user_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', rowMeta.agency_user_id)
          .maybeSingle();
        if (prof?.email) ownerEmail = prof.email;
      }
      return { report: updated, ownerEmail };
    }
  }

  const store = getLocalMockStore();
  const report = store.pitchReports.find((r) => r.share_slug === slug);
  if (!report) return null;
  if (
    report.expires_at &&
    new Date(report.expires_at).getTime() <= Date.now()
  ) {
    return null;
  }

  report.views_count += 1;
  return {
    report: {
      share_slug: report.share_slug,
      prospect_domain: report.prospect_domain,
      prospect_brand_name: report.prospect_brand_name,
      visibility_score: report.visibility_score,
      hallucination_count: report.hallucination_count,
      agency_brand_name: report.agency_brand_name_snapshot,
      agency_logo_url: report.agency_logo_url_snapshot,
      agency_primary_color: report.agency_primary_color_snapshot,
      agency_cta_url: report.agency_cta_url_snapshot,
      summary_payload: report.summary_payload,
      views_count: report.views_count,
      expires_at: report.expires_at,
      created_at: report.created_at,
    },
    ownerEmail: store.profile.email,
  };
}

export async function provisionDomainAuditForWorkspace(input: {
  domainInput: string;
  customBrandName?: string;
  userId: string;
  planTier: ProfileRow['plan_tier'];
  supabase?: SupabaseClient<Database> | null;
  bypassPlanCapForPaidPass?: boolean;
}): Promise<{
  domain: DomainRow | null;
  prompts: TrackedPromptRow[];
  snapshots: CitationSnapshotRow[];
  fixes: GeneratedFixRow[];
  crawlerReadability?: CrawlerReadabilityReport;
  alreadyExists: boolean;
  capReached: boolean;
}> {
  const normalized = normalizePublicDomain(input.domainInput);
  const store = getLocalMockStore();
  const maxDomains = domainCapForPlan(input.planTier);

  let existingDomains: DomainRow[] = store.domains;
  if (input.supabase) {
    const { data } = await input.supabase
      .from('domains')
      .select('*')
      .eq('user_id', input.userId);
    existingDomains = data ?? [];
  }

  const existing = existingDomains.find(
    (d) => d.domain_url.toLowerCase() === normalized.origin.toLowerCase()
  );
  if (existing) {
    let existingFixes: GeneratedFixRow[] = [];
    if (input.supabase) {
      const { data } = await input.supabase
        .from('generated_fixes')
        .select('*')
        .eq('domain_id', existing.id);
      existingFixes = data ?? [];
    } else {
      existingFixes = store.fixes.filter((f) => f.domain_id === existing.id);
    }
    return {
      domain: existing,
      prompts: [],
      snapshots: [],
      fixes: existingFixes,
      alreadyExists: true,
      capReached: false,
    };
  }

  const effectiveCap = input.bypassPlanCapForPaidPass
    ? Math.max(maxDomains, 25)
    : maxDomains;

  // In unauthenticated in-memory demo mode, rotate out the oldest visitor-added domain before hitting the cap
  if (!input.supabase && existingDomains.length >= effectiveCap) {
    const removable = store.domains.find(
      (d) => !PROTECTED_PATIENT_ZERO_IDS.has(d.id)
    );
    if (removable) {
      store.domains = store.domains.filter((d) => d.id !== removable.id);
      store.prompts = store.prompts.filter((p) => p.domain_id !== removable.id);
      store.snapshots = store.snapshots.filter(
        (s) => s.domain_id !== removable.id
      );
      store.fixes = store.fixes.filter((f) => f.domain_id !== removable.id);
      existingDomains = store.domains;
    }
  }

  if (existingDomains.length >= effectiveCap) {
    return {
      domain: null,
      prompts: [],
      snapshots: [],
      fixes: [],
      alreadyExists: false,
      capReached: true,
    };
  }

  const audit = await runFullGeoAudit({
    domainInput: normalized.hostname,
    customBrandName: input.customBrandName,
  });

  const domainId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const newDomain: DomainRow = {
    id: domainId,
    user_id: input.userId,
    domain_url: audit.domainUrl,
    brand_name: audit.brandName,
    industry_vertical: audit.industryVertical,
    is_shopify: audit.shopify.isShopify,
    shopify_mcp_status: audit.shopify.shopifyMcpStatus,
    agents_md_status: audit.shopify.agentsMdStatus,
    llms_txt_status: audit.probe.llmsTxtStatus,
    robots_ai_bot_status: audit.probe.robotsAiBotStatus,
    brand_truth_sheet: audit.brandTruthSheet,
    visibility_score: audit.visibilityScore,
    accuracy_score: audit.accuracyScore,
    tracking_pixel_token: crypto.randomUUID(),
    last_scanned_at: nowIso,
    created_at: nowIso,
  };

  const newPrompts: TrackedPromptRow[] = audit.trackedPrompts.map((pText) => ({
    id: crypto.randomUUID(),
    domain_id: domainId,
    prompt_text: pText,
    intent_category: classifyPromptIntent(pText, audit.brandName).intentCategory,
    decompiled_fanout_queries: Array.from(
      new Set(
        audit.scanResults
          .filter((s) => s.promptText === pText)
          .flatMap((s) => s.decompiledFanoutQueries)
      )
    ),
    is_active: true,
    created_at: nowIso,
  }));

  const newSnapshots: CitationSnapshotRow[] = audit.scanResults.map((s) => ({
    id: crypto.randomUUID(),
    domain_id: domainId,
    prompt_id:
      newPrompts.find((p) => p.prompt_text === s.promptText)?.id ?? null,
    ai_engine: s.aiEngine,
    brand_mentioned: s.brandMentioned,
    citation_rank: s.citationRank,
    competitors_mentioned: s.competitorsMentioned,
    cited_source_urls: s.citedSourceUrls,
    fanout_telemetry_type: s.fanoutTelemetryType,
    hallucination_detected: s.hallucinationDetected,
    hallucination_details:
      s.hallucinationDetails.length > 0 ? s.hallucinationDetails : null,
    raw_answer_excerpt: s.rawAnswerExcerpt,
    scanned_at: nowIso,
  }));

  const newFixes: GeneratedFixRow[] = audit.fixes.map((f) => ({
    id: crypto.randomUUID(),
    domain_id: domainId,
    fix_type: f.fixType,
    title: f.title,
    content_payload: f.contentPayload,
    natural_quality_score: f.naturalQualityScore,
    quality_rubric_breakdown: f.qualityRubricBreakdown,
    is_applied: isFixTypeLiveOnDomain(f.fixType, audit.probe, audit.shopify),
    created_at: nowIso,
  }));

  if (input.supabase) {
    const { error: domErr } = await input.supabase
      .from('domains')
      .insert(newDomain);
    if (!domErr) {
      if (newPrompts.length > 0) {
        await input.supabase.from('tracked_prompts').insert(newPrompts);
      }
      if (newSnapshots.length > 0) {
        await input.supabase.from('citation_snapshots').insert(newSnapshots);
      }
      if (newFixes.length > 0) {
        await input.supabase.from('generated_fixes').insert(newFixes);
      }
    }
  } else {
    store.domains.push(newDomain);
    store.prompts.push(...newPrompts);
    store.snapshots.unshift(...newSnapshots);
    store.fixes.unshift(...newFixes);
  }

  return {
    domain: newDomain,
    prompts: newPrompts,
    snapshots: newSnapshots,
    fixes: newFixes,
    crawlerReadability: audit.probe.crawlerReadability,
    alreadyExists: false,
    capReached: false,
  };
}
