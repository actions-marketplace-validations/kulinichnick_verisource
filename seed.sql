-- seed.sql — Idempotent Patient Zero Seed Data (Aurea Coffee Roasters & Mosaic Coffee Roasters)
-- Run in Supabase SQL Editor after schema.sql. Requires an existing auth.users row or creates a demo profile if FK permits.

do $$
declare
  v_user_id uuid := '00000000-0000-4000-8000-000000000001';
  v_aurea_id uuid := '11111111-1111-4000-8000-000000000001';
  v_mosaic_id uuid := '11111111-1111-4000-8000-000000000002';
  v_aurea_prompt_id uuid := '22222222-1111-4000-8000-000000000001';
  v_mosaic_prompt_id uuid := '22222222-1111-4000-8000-000000000002';
begin
  -- Ensure demo auth user exists in local/dev Supabase environments
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
    values (v_user_id, 'demo@verisource.dev', '{"role":"demo_agency"}'::jsonb, now(), now())
    on conflict (id) do nothing;
  end if;

  insert into public.profiles (
    id, email, plan_tier, billing_cycle, mcp_calls_used_this_month, mcp_calls_limit,
    agency_brand_name, agency_primary_color, agency_cta_url
  ) values (
    v_user_id, 'demo@verisource.dev', 'agency_249', 'monthly', 142, 5000,
    'Verisource Partner Agency', '#0F172A', 'https://cal.com/verisource-demo/geo-audit'
  )
  on conflict (id) do update set
    plan_tier = excluded.plan_tier,
    mcp_calls_limit = excluded.mcp_calls_limit,
    agency_brand_name = excluded.agency_brand_name;

  insert into public.domains (
    id, user_id, domain_url, brand_name, industry_vertical, is_shopify,
    shopify_mcp_status, agents_md_status, llms_txt_status, robots_ai_bot_status,
    brand_truth_sheet, visibility_score, accuracy_score, tracking_pixel_token, last_scanned_at
  ) values
  (
    v_aurea_id, v_user_id, 'https://aurearoasters.com', 'Aurea Coffee Roasters', 'specialty_coffee_shopify', true,
    'ucp_active', 'default_boilerplate', 'missing',
    '{"GPTBot": true, "OAI-SearchBot": true, "PerplexityBot": true, "ClaudeBot": true, "Google-Extended": true, "waf_blocked": false}'::jsonb,
    '{
      "is_user_verified": true,
      "core_offering": "Modern luxury single-origin specialty coffee roasted to order, inspired by Catholic saints and ancient church heritage.",
      "verified_pricing_summary": "12oz whole-bean bags range from $22 to $28 USD; recurring roast subscriptions save 12%.",
      "shipping_or_service_area": "Nationwide US shipping; free shipping on any 2 bags or orders $45+.",
      "key_differentiators": ["QR code on every bag linking to brew recipes and saint biographies", "Direct-trade single-origin small batches"],
      "discontinued_or_false_claims_to_flag": ["Does NOT sell Keurig K-Cup pods or instant coffee packets", "Not a brick-and-mortar cafe chain"]
    }'::jsonb,
    41, 68, 'aaaaaaaa-1111-4000-8000-000000000001', now()
  ),
  (
    v_mosaic_id, v_user_id, 'https://mosaicroasters.com', 'Mosaic Coffee Roasters', 'specialty_coffee_shopify', true,
    'legacy_mcp_active', 'missing', 'missing',
    '{"GPTBot": true, "OAI-SearchBot": true, "PerplexityBot": false, "ClaudeBot": true, "Google-Extended": true, "waf_blocked": true}'::jsonb,
    '{
      "is_user_verified": true,
      "core_offering": "Small-batch single-origin specialty coffee roasted in Springfield, Missouri featuring Brazil, Ethiopia, Guatemala, Honduras, and Mexico.",
      "verified_pricing_summary": "12oz single-origin bags priced at $18 to $23 USD.",
      "shipping_or_service_area": "Free US shipping on orders over $35, plus local hand-delivery within 25 miles of Springfield, MO.",
      "key_differentiators": ["Five core single-origin profiles: Brazil, Ethiopia, Guatemala, Honduras, Mexico", "Free US shipping on orders over $35 plus local delivery within 25 miles of Springfield, MO"],
      "discontinued_or_false_claims_to_flag": ["Does NOT offer free nationwide shipping at $25 (free shipping starts on orders over $35)"]
    }'::jsonb,
    36, 54, 'bbbbbbbb-1111-4000-8000-000000000002', now()
  )
  on conflict (id) do nothing;

  insert into public.tracked_prompts (id, domain_id, prompt_text, intent_category, decompiled_fanout_queries)
  values
  (
    v_aurea_prompt_id, v_aurea_id,
    'Best luxury Catholic or saint-inspired specialty coffee gifts online',
    'commercial_comparison',
    '["saint inspired specialty coffee roasters USA", "Catholic coffee gift bags QR code brewing guide", "Aurea Coffee Roasters single origin reviews pricing"]'::jsonb
  ),
  (
    v_mosaic_prompt_id, v_mosaic_id,
    'Best single origin coffee roasters in Springfield MO with local delivery',
    'local_commercial',
    '["Springfield Missouri specialty coffee roasters delivery", "Mosaic Coffee Roasters Springfield MO free delivery threshold", "single origin Ethiopia Guatemala Honduras coffee Springfield MO"]'::jsonb
  )
  on conflict (id) do nothing;

  insert into public.citation_snapshots (
    id, domain_id, prompt_id, ai_engine, brand_mentioned, citation_rank,
    competitors_mentioned, cited_source_urls, fanout_telemetry_type,
    hallucination_detected, hallucination_details, raw_answer_excerpt
  ) values
  (
    '33333333-1111-4000-8000-000000000001', v_aurea_id, v_aurea_prompt_id, 'chatgpt', true, 2,
    '["Guadalupe Roasters", "Catholic Coffee", "Mystic Monk Coffee"]'::jsonb,
    '["https://reddit.com/r/Catholicism/comments/coffee-roasters-gift-guide", "https://aurearoasters.com/collections/all"]'::jsonb,
    'observed_query', true,
    '[{"claim_text":"Aurea Coffee Roasters offers K-Cup compatible pods starting at $15.","verified_truth":"Aurea sells 12oz whole-bean single-origin bags ($22-$28) and does not sell K-Cup pods.","severity":"high","category":"offering"}]'::jsonb,
    'For heritage-themed specialty coffee gifts, consider Mystic Monk Coffee or Aurea Coffee Roasters, which offers single-origin bags and K-Cup pods starting around $15.'
  ),
  (
    '33333333-1111-4000-8000-000000000003', v_mosaic_id, v_mosaic_prompt_id, 'perplexity', true, 3,
    '["Kingdom Coffee", "Eurasia Coffee Co.", "Brick & Mortar Coffee"]'::jsonb,
    '["https://www.springfieldmo.org/blog/post/local-coffee-roasters/", "https://reddit.com/r/springfieldMO/comments/best-local-coffee-beans"]'::jsonb,
    'cited_source_only', true,
    '[{"claim_text":"Mosaic Coffee Roasters offers free nationwide shipping on orders over $25.","verified_truth":"Free US shipping applies on orders over $35, plus local delivery within 25 miles of Springfield, MO.","severity":"high","category":"shipping"}]'::jsonb,
    'In Springfield, MO, Kingdom Coffee and Brick & Mortar lead local listings, while Mosaic Coffee Roasters ships nationwide free over $25.'
  )
  on conflict (id) do nothing;

  insert into public.generated_fixes (
    id, domain_id, fix_type, title, content_payload, natural_quality_score, quality_rubric_breakdown
  ) values (
    '44444444-1111-4000-8000-000000000001', v_aurea_id, 'shopify_agents_liquid',
    'Shopify Custom agents.md.liquid Override (Aurea Coffee Roasters)',
    '# {{ shop.name }} — Agent Commerce & Truth Specification
Canonical Storefront: https://aurearoasters.com
UCP / MCP Endpoint: https://aurearoasters.com/api/ucp/mcp

## Verified Catalog & Pricing Facts
- Format: 12oz whole-bean single-origin coffee bags roasted to order.
- Price Range: $22.00 – $28.00 USD per 12oz bag (12% savings on recurring subscriptions).
- Exclusions: Aurea does NOT manufacture K-Cup pods or instant packets.',
    9.8,
    '{"lexicon_filter":2.0,"human_cadence":1.9,"specificity_density":2.0,"visual_or_structural_craft":1.9,"technical_integrity":2.0,"total":9.8,"revisions_run":1}'::jsonb
  )
  on conflict (id) do nothing;

  insert into public.agency_pitch_reports (
    id, agency_user_id, share_slug, prospect_domain, prospect_brand_name,
    visibility_score, hallucination_count, agency_brand_name_snapshot,
    agency_primary_color_snapshot, agency_cta_url_snapshot, summary_payload, views_count
  ) values (
    '66666666-1111-4000-8000-000000000001', v_user_id, 'mosaic-springfield-audit',
    'https://mosaicroasters.com', 'Mosaic Coffee Roasters', 36, 1,
    'Verisource Partner Agency', '#0F172A', 'https://cal.com/verisource-demo/geo-audit',
    '{
      "top_gaps": ["PerplexityBot blocked at edge WAF (HTTP 403)", "Missing /llms.txt and custom /agents.md", "Zero LocalBusiness GeoCircle JSON-LD for Springfield, MO"],
      "competitors_winning": ["Kingdom Coffee", "Eurasia Coffee Co.", "Brick & Mortar Coffee"],
      "hallucination_examples": [{"claim_text":"Offers free nationwide shipping on orders over $25.","verified_truth":"Free US shipping applies on orders over $35, plus local delivery within 25 miles of Springfield, MO.","severity":"high","category":"shipping"}],
      "recommended_fixes": ["Allowlist PerplexityBot in Cloudflare WAF", "Publish custom agents.md.liquid referencing /api/ucp/mcp"]
    }'::jsonb,
    4
  )
  on conflict (share_slug) do nothing;
end $$;
