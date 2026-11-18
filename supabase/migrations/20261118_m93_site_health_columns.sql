-- M93/M94 Idempotent Site Health Crawler Columns on public.domains
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/acqgteqjwchchbmwziyj/sql/new
-- Or via Supabase CLI: npx supabase db push

alter table public.domains
  add column if not exists crawl_health_summary jsonb default null;

alter table public.domains
  add column if not exists last_health_crawl_at timestamptz default null;
