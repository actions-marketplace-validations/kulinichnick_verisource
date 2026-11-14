import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  DEMO_PROFILE,
  PATIENT_ZERO_ATTRIBUTION,
  PATIENT_ZERO_DOMAINS,
  PATIENT_ZERO_FIXES,
  PATIENT_ZERO_PITCH_REPORT,
  PATIENT_ZERO_PROMPTS,
  PATIENT_ZERO_SNAPSHOTS,
  resolveCoreGeoEnv,
  type AgencyPitchReportRow,
  type AiAttributionEventRow,
  type CitationSnapshotRow,
  type Database,
  type DomainRow,
  type GeneratedFixRow,
  type McpApiKeyRow,
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
  __verisourceProcessedStripeEvents?: Set<string>;
};

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

export function getServiceSupabaseClient(): SupabaseClient<Database> | null {
  const env = resolveCoreGeoEnv();
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
  if (!token) return null;

  const { data: userRes, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !userRes?.user) {
    return null;
  }

  const user = userRes.user;
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) {
    return { supabase, profile: existingProfile };
  }

  // Auto-provision profile row if missing
  const nowIso = new Date().toISOString();
  const fallbackEmail = user.email ?? `${user.id}@verisource.dev`;
  const { data: createdProfile } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: fallbackEmail,
        plan_tier: 'free',
        billing_cycle: 'monthly',
        mcp_calls_used_this_month: 0,
        mcp_calls_limit: 5,
        agency_primary_color: '#0F172A',
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
    const { data, error } = await supabase.rpc('get_public_pitch_report', {
      p_share_slug: slug,
    });
    if (!error && Array.isArray(data) && data[0]) {
      return data[0];
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
