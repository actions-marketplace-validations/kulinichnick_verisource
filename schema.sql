-- schema.sql — Hardened Supabase PostgreSQL Schema, RLS Policies, Triggers & Atomic RPCs
-- Universal B2B GEO + Paid MCP Platform

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. Profiles & Subscription Entitlements (Includes Agency White-Label Settings)
-- ============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'tripwire_19', 'starter_49', 'pro_99', 'agency_249')),
  billing_cycle text default 'monthly' check (billing_cycle in ('monthly', 'annual', 'one_time')),
  stripe_customer_id text,
  stripe_subscription_id text,
  tripwire_paid_at timestamptz,
  mcp_calls_used_this_month integer not null default 0 check (mcp_calls_used_this_month >= 0),
  mcp_calls_limit integer not null default 5 check (mcp_calls_limit >= 0),
  agency_brand_name text,
  agency_logo_url text,
  agency_primary_color text default '#0F172A' check (agency_primary_color is null or agency_primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  agency_cta_url text check (agency_cta_url is null or agency_cta_url ~ '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. Tracked Domains / Storefronts (Supports Any Website + Native Shopify Adapter)
-- ============================================================================
create table if not exists public.domains (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  domain_url text not null,
  brand_name text not null,
  industry_vertical text not null default 'general_b2b',
  is_shopify boolean not null default false,
  shopify_mcp_status text not null default 'unchecked' check (shopify_mcp_status in ('unchecked', 'ucp_active', 'legacy_mcp_active', 'unavailable')),
  agents_md_status text not null default 'missing' check (agents_md_status in ('missing', 'default_boilerplate', 'custom_enriched')),
  llms_txt_status text not null default 'missing' check (llms_txt_status in ('missing', 'present')),
  robots_ai_bot_status jsonb not null default '{"GPTBot": true, "OAI-SearchBot": true, "PerplexityBot": true, "ClaudeBot": true, "Google-Extended": true, "waf_blocked": false}'::jsonb,
  brand_truth_sheet jsonb not null default '{
    "is_user_verified": false,
    "core_offering": "",
    "verified_pricing_summary": "",
    "shipping_or_service_area": "",
    "key_differentiators": [],
    "discontinued_or_false_claims_to_flag": []
  }'::jsonb,
  visibility_score integer not null default 0 check (visibility_score >= 0 and visibility_score <= 100),
  accuracy_score integer not null default 100 check (accuracy_score >= 0 and accuracy_score <= 100),
  tracking_pixel_token uuid default gen_random_uuid() unique not null,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 3. Buyer Prompts & Decompiled Query Fanouts
-- ============================================================================
create table if not exists public.tracked_prompts (
  id uuid default gen_random_uuid() primary key,
  domain_id uuid references public.domains(id) on delete cascade not null,
  prompt_text text not null,
  intent_category text not null default 'commercial_comparison',
  decompiled_fanout_queries jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 4. Multi-Engine Citation Snapshots & Hallucination Watchdog Logs
-- ============================================================================
create table if not exists public.citation_snapshots (
  id uuid default gen_random_uuid() primary key,
  domain_id uuid references public.domains(id) on delete cascade not null,
  prompt_id uuid references public.tracked_prompts(id) on delete cascade,
  ai_engine text not null check (ai_engine in ('chatgpt', 'gemini', 'perplexity', 'claude')),
  brand_mentioned boolean not null default false,
  citation_rank integer,
  competitors_mentioned jsonb not null default '[]'::jsonb,
  cited_source_urls jsonb not null default '[]'::jsonb,
  fanout_telemetry_type text not null default 'observed_query' check (fanout_telemetry_type in ('observed_query', 'cited_source_only', 'mock_fixture')),
  hallucination_detected boolean not null default false,
  hallucination_details jsonb default 'null'::jsonb,
  raw_answer_excerpt text,
  scanned_at timestamptz not null default now()
);

-- ============================================================================
-- 5. Generated Fixes (Enforced >= 9.5/10 Natural Quality Score)
-- ============================================================================
create table if not exists public.generated_fixes (
  id uuid default gen_random_uuid() primary key,
  domain_id uuid references public.domains(id) on delete cascade not null,
  fix_type text not null check (fix_type in ('json_ld_schema', 'agents_md', 'shopify_agents_liquid', 'llms_txt', 'fanout_faq_block', 'citation_outreach_brief')),
  title text not null,
  content_payload text not null,
  natural_quality_score numeric(3,1) not null check (natural_quality_score >= 9.5 and natural_quality_score <= 10.0),
  quality_rubric_breakdown jsonb not null default '{}'::jsonb,
  is_applied boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 6. Agency White-Label Prospect Pitch Reports (60-Second Teaser Links)
-- ============================================================================
create table if not exists public.agency_pitch_reports (
  id uuid default gen_random_uuid() primary key,
  agency_user_id uuid references public.profiles(id) on delete cascade not null,
  share_slug text unique not null,
  prospect_domain text not null,
  prospect_brand_name text not null,
  visibility_score integer not null check (visibility_score >= 0 and visibility_score <= 100),
  hallucination_count integer not null default 0 check (hallucination_count >= 0),
  agency_brand_name_snapshot text,
  agency_logo_url_snapshot text,
  agency_primary_color_snapshot text default '#0F172A' check (agency_primary_color_snapshot is null or agency_primary_color_snapshot ~ '^#[0-9A-Fa-f]{6}$'),
  agency_cta_url_snapshot text check (agency_cta_url_snapshot is null or agency_cta_url_snapshot ~ '^https?://'),
  summary_payload jsonb not null,
  views_count integer not null default 0 check (views_count >= 0),
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 7. AI Referral Traffic & Crawler Attribution Events
-- ============================================================================
create table if not exists public.ai_attribution_events (
  id uuid default gen_random_uuid() primary key,
  domain_id uuid references public.domains(id) on delete cascade not null,
  event_type text not null check (event_type in ('ai_referral_visit', 'ai_referral_conversion', 'ai_bot_crawl')),
  source_engine text not null,
  landing_path text,
  conversion_value_usd numeric(10,2),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 8. Monetized MCP Server API Keys
-- ============================================================================
create table if not exists public.mcp_api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  key_hash text unique not null,
  key_prefix text not null,
  label text not null default 'Default Agent Key',
  last_used_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 9. Performance & Foreign-Key Indexes
-- ============================================================================
create index if not exists idx_domains_user_id on public.domains(user_id);
create index if not exists idx_domains_domain_url on public.domains(domain_url);
create index if not exists idx_tracked_prompts_domain_id on public.tracked_prompts(domain_id);
create index if not exists idx_citation_snapshots_domain_scanned on public.citation_snapshots(domain_id, scanned_at desc);
create index if not exists idx_citation_snapshots_prompt_id on public.citation_snapshots(prompt_id);
create index if not exists idx_generated_fixes_domain_id on public.generated_fixes(domain_id);
create index if not exists idx_agency_pitch_reports_user_id on public.agency_pitch_reports(agency_user_id);
create index if not exists idx_ai_attribution_domain_created on public.ai_attribution_events(domain_id, created_at desc);
create index if not exists idx_mcp_api_keys_user_id on public.mcp_api_keys(user_id);

-- ============================================================================
-- 10. Auth Signup Trigger & Profile Privilege-Escalation Guard
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, new.id::text || '@placeholder.local'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if current_user in ('authenticated', 'anon')
    or coalesce(current_setting('request.jwt.claim.role', true), '') in ('authenticated', 'anon')
  then
    if new.plan_tier is distinct from old.plan_tier
      or new.billing_cycle is distinct from old.billing_cycle
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
      or new.tripwire_paid_at is distinct from old.tripwire_paid_at
      or new.mcp_calls_used_this_month is distinct from old.mcp_calls_used_this_month
      or new.mcp_calls_limit is distinct from old.mcp_calls_limit
    then
      raise exception 'Unauthorized attempt to modify protected billing or quota columns';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_billing on public.profiles;
create trigger trg_protect_profile_billing
  before update on public.profiles
  for each row execute function public.protect_profile_billing_columns();

-- ============================================================================
-- 11. Row Level Security (RLS) Policies
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.domains enable row level security;
alter table public.tracked_prompts enable row level security;
alter table public.citation_snapshots enable row level security;
alter table public.generated_fixes enable row level security;
alter table public.agency_pitch_reports enable row level security;
alter table public.ai_attribution_events enable row level security;
alter table public.mcp_api_keys enable row level security;

-- Profiles: users read and update only their own row (billing columns locked by trigger above)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Domains: strict tenant isolation by user_id
drop policy if exists "domains_select_own" on public.domains;
create policy "domains_select_own" on public.domains
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "domains_insert_own" on public.domains;
create policy "domains_insert_own" on public.domains
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "domains_update_own" on public.domains;
create policy "domains_update_own" on public.domains
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "domains_delete_own" on public.domains;
create policy "domains_delete_own" on public.domains
  for delete to authenticated using (auth.uid() = user_id);

-- Tracked Prompts: owned via parent domain
drop policy if exists "tracked_prompts_all_own" on public.tracked_prompts;
create policy "tracked_prompts_all_own" on public.tracked_prompts
  for all to authenticated
  using (exists (select 1 from public.domains d where d.id = domain_id and d.user_id = auth.uid()))
  with check (exists (select 1 from public.domains d where d.id = domain_id and d.user_id = auth.uid()));

-- Citation Snapshots: owned via parent domain
drop policy if exists "citation_snapshots_select_own" on public.citation_snapshots;
create policy "citation_snapshots_select_own" on public.citation_snapshots
  for select to authenticated
  using (exists (select 1 from public.domains d where d.id = domain_id and d.user_id = auth.uid()));

-- Generated Fixes: owned via parent domain
drop policy if exists "generated_fixes_all_own" on public.generated_fixes;
create policy "generated_fixes_all_own" on public.generated_fixes
  for all to authenticated
  using (exists (select 1 from public.domains d where d.id = domain_id and d.user_id = auth.uid()))
  with check (exists (select 1 from public.domains d where d.id = domain_id and d.user_id = auth.uid()));

-- Agency Pitch Reports: owner CRUD; public prospect reads go exclusively through get_public_pitch_report RPC
drop policy if exists "agency_pitch_reports_all_own" on public.agency_pitch_reports;
create policy "agency_pitch_reports_all_own" on public.agency_pitch_reports
  for all to authenticated
  using (auth.uid() = agency_user_id)
  with check (auth.uid() = agency_user_id);

-- AI Attribution Events: owner read; ingestion handled via Origin-verified server endpoint
drop policy if exists "ai_attribution_events_select_own" on public.ai_attribution_events;
create policy "ai_attribution_events_select_own" on public.ai_attribution_events
  for select to authenticated
  using (exists (select 1 from public.domains d where d.id = domain_id and d.user_id = auth.uid()));

-- MCP API Keys: owner CRUD
drop policy if exists "mcp_api_keys_all_own" on public.mcp_api_keys;
create policy "mcp_api_keys_all_own" on public.mcp_api_keys
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- 12. Atomic Security-Definer RPCs (MCP Quota Metering & Public Pitch View)
-- ============================================================================
create or replace function public.consume_mcp_credits(
  p_key_hash text,
  p_credits integer default 1
)
returns table (
  allowed boolean,
  user_id uuid,
  plan_tier text,
  credits_remaining integer,
  error_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_plan_tier text;
  v_used integer;
  v_limit integer;
begin
  if p_credits <= 0 then
    return query select false, null::uuid, null::text, 0, 'INVALID_CREDIT_COST'::text;
    return;
  end if;

  select k.user_id, p.plan_tier, p.mcp_calls_used_this_month, p.mcp_calls_limit
    into v_user_id, v_plan_tier, v_used, v_limit
  from public.mcp_api_keys k
  join public.profiles p on p.id = k.user_id
  where k.key_hash = p_key_hash and k.is_active = true
  for update of p;

  if v_user_id is null then
    return query select false, null::uuid, null::text, 0, 'INVALID_OR_REVOKED_KEY'::text;
    return;
  end if;

  if v_plan_tier not in ('pro_99', 'agency_249') then
    return query select false, v_user_id, v_plan_tier, greatest(v_limit - v_used, 0), 'PLAN_UPGRADE_REQUIRED'::text;
    return;
  end if;

  if v_used + p_credits > v_limit then
    return query select false, v_user_id, v_plan_tier, greatest(v_limit - v_used, 0), 'MONTHLY_CREDIT_LIMIT_EXCEEDED'::text;
    return;
  end if;

  update public.profiles
    set mcp_calls_used_this_month = mcp_calls_used_this_month + p_credits
  where id = v_user_id;

  update public.mcp_api_keys
    set last_used_at = now()
  where key_hash = p_key_hash;

  return query select true, v_user_id, v_plan_tier, (v_limit - (v_used + p_credits)), null::text;
end;
$$;

revoke execute on function public.consume_mcp_credits(text, integer) from public, anon, authenticated;
grant execute on function public.consume_mcp_credits(text, integer) to service_role;

create or replace function public.consume_mcp_credits_for_user(
  p_user_id uuid,
  p_credits integer default 1
)
returns table (
  allowed boolean,
  user_id uuid,
  plan_tier text,
  credits_remaining integer,
  error_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_tier text;
  v_used integer;
  v_limit integer;
begin
  if p_credits <= 0 then
    return query select false, null::uuid, null::text, 0, 'INVALID_CREDIT_COST'::text;
    return;
  end if;

  select p.plan_tier, p.mcp_calls_used_this_month, p.mcp_calls_limit
    into v_plan_tier, v_used, v_limit
  from public.profiles p
  where p.id = p_user_id
  for update of p;

  if v_plan_tier is null then
    return query select false, null::uuid, null::text, 0, 'PROFILE_NOT_FOUND'::text;
    return;
  end if;

  if v_plan_tier not in ('pro_99', 'agency_249') then
    return query select false, p_user_id, v_plan_tier, greatest(v_limit - v_used, 0), 'PLAN_UPGRADE_REQUIRED'::text;
    return;
  end if;

  if v_used + p_credits > v_limit then
    return query select false, p_user_id, v_plan_tier, greatest(v_limit - v_used, 0), 'MONTHLY_CREDIT_LIMIT_EXCEEDED'::text;
    return;
  end if;

  update public.profiles
    set mcp_calls_used_this_month = mcp_calls_used_this_month + p_credits
  where id = p_user_id;

  return query select true, p_user_id, v_plan_tier, (v_limit - (v_used + p_credits)), null::text;
end;
$$;

revoke execute on function public.consume_mcp_credits_for_user(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_mcp_credits_for_user(uuid, integer) to service_role;

create or replace function public.get_public_pitch_report(p_share_slug text)
returns table (
  share_slug text,
  prospect_domain text,
  prospect_brand_name text,
  visibility_score integer,
  hallucination_count integer,
  agency_brand_name text,
  agency_logo_url text,
  agency_primary_color text,
  agency_cta_url text,
  summary_payload jsonb,
  views_count integer,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.agency_pitch_reports r
    set views_count = r.views_count + 1
  where r.share_slug = p_share_slug
    and (r.expires_at is null or r.expires_at > now())
  returning
    r.share_slug,
    r.prospect_domain,
    r.prospect_brand_name,
    r.visibility_score,
    r.hallucination_count,
    r.agency_brand_name_snapshot,
    r.agency_logo_url_snapshot,
    r.agency_primary_color_snapshot,
    r.agency_cta_url_snapshot,
    r.summary_payload,
    r.views_count,
    r.expires_at,
    r.created_at;
end;
$$;

revoke execute on function public.get_public_pitch_report(text) from public;
grant execute on function public.get_public_pitch_report(text) to anon, authenticated, service_role;

-- Reload PostgREST schema cache immediately
notify pgrst, 'reload schema';
