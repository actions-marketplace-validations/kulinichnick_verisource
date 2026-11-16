import type {
  AgencyPitchReportRow,
  AiAttributionEventRow,
  CitationSnapshotRow,
  DomainRow,
  GeneratedFixRow,
  ProfileRow,
  TrackedPromptRow,
} from '../db/types.js';

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

export const AUREA_DOMAIN_ID = '11111111-1111-4000-8000-000000000001';
export const MOSAIC_DOMAIN_ID = '11111111-1111-4000-8000-000000000002';

export const DEMO_PROFILE: ProfileRow = {
  id: DEMO_USER_ID,
  email: 'demo@verisource.dev',
  plan_tier: 'agency_249',
  billing_cycle: 'monthly',
  stripe_customer_id: 'cus_demo_verisource',
  stripe_subscription_id: 'sub_demo_verisource',
  tripwire_paid_at: null,
  mcp_calls_used_this_month: 142,
  mcp_calls_limit: 5000,
  agency_brand_name: 'Verisource Partner Agency',
  agency_logo_url: null,
  agency_primary_color: '#0F172A',
  agency_cta_url: 'https://cal.com/verisource-demo/geo-audit',
  created_at: '2026-10-01T12:00:00.000Z',
  updated_at: '2026-11-13T10:00:00.000Z',
};

export const PATIENT_ZERO_DOMAINS: DomainRow[] = [
  {
    id: AUREA_DOMAIN_ID,
    user_id: DEMO_USER_ID,
    domain_url: 'https://aurearoasters.com',
    brand_name: 'Aurea Coffee Roasters',
    industry_vertical: 'specialty_coffee_shopify',
    is_shopify: true,
    shopify_mcp_status: 'ucp_active',
    agents_md_status: 'default_boilerplate',
    llms_txt_status: 'missing',
    robots_ai_bot_status: {
      GPTBot: true,
      'OAI-SearchBot': true,
      PerplexityBot: true,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: false,
    },
    brand_truth_sheet: {
      is_user_verified: true,
      core_offering:
        'Modern luxury single-origin specialty coffee roasted to order, inspired by Catholic saints and ancient church heritage.',
      verified_pricing_summary:
        '12oz whole-bean bags range from $22 to $28 USD; recurring roast subscriptions save 12%.',
      shipping_or_service_area:
        'Nationwide US shipping; free shipping on any 2 bags or orders $45+.',
      key_differentiators: [
        'Each bag includes a scannable QR code linking directly to brew recipes and historical saint biographies.',
        'Direct-trade single-origin lots roasted in small batches.',
        'Designed for both specialty coffee drinkers and heritage gift buyers.',
      ],
      discontinued_or_false_claims_to_flag: [
        'Does NOT sell Keurig K-Cup pods or instant coffee packets.',
        'Not a brick-and-mortar cafe chain; operates direct-to-consumer online.',
      ],
    },
    visibility_score: 41,
    accuracy_score: 68,
    tracking_pixel_token: 'aaaaaaaa-1111-4000-8000-000000000001',
    last_scanned_at: '2026-11-13T09:30:00.000Z',
    created_at: '2026-10-15T12:00:00.000Z',
  },
  {
    id: MOSAIC_DOMAIN_ID,
    user_id: DEMO_USER_ID,
    domain_url: 'https://mosaicroasters.com',
    brand_name: 'Mosaic Coffee Roasters',
    industry_vertical: 'specialty_coffee_shopify',
    is_shopify: true,
    shopify_mcp_status: 'legacy_mcp_active',
    agents_md_status: 'missing',
    llms_txt_status: 'missing',
    robots_ai_bot_status: {
      GPTBot: true,
      'OAI-SearchBot': true,
      PerplexityBot: false,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: true,
    },
    brand_truth_sheet: {
      is_user_verified: true,
      core_offering:
        'Small-batch single-origin specialty coffee roasted in Springfield, Missouri featuring origins from Brazil, Ethiopia, Guatemala, Honduras, and Mexico.',
      verified_pricing_summary:
        '12oz single-origin bags priced at $18 to $23 USD; 5lb wholesale/home-barista bags available.',
      shipping_or_service_area:
        'Free US shipping on orders over $35, plus local hand-delivery within 25 miles of Springfield, MO.',
      key_differentiators: [
        'Five core single-origin profiles: Brazil, Ethiopia, Guatemala, Honduras, and Mexico.',
        'Free US shipping on orders over $35 plus local delivery within 25 miles of Springfield, MO.',
        'Roasted fresh weekly for pour-over, drip, and espresso.',
      ],
      discontinued_or_false_claims_to_flag: [
        'Does NOT offer free nationwide shipping at $25 (free shipping starts on orders over $35).',
        'Does NOT source Sumatran or Vietnamese Robusta blends.',
      ],
    },
    visibility_score: 36,
    accuracy_score: 54,
    tracking_pixel_token: 'bbbbbbbb-1111-4000-8000-000000000002',
    last_scanned_at: '2026-11-13T09:45:00.000Z',
    created_at: '2026-10-15T12:00:00.000Z',
  },
];

export const PATIENT_ZERO_PROMPTS: TrackedPromptRow[] = [
  {
    id: '22222222-1111-4000-8000-000000000001',
    domain_id: AUREA_DOMAIN_ID,
    prompt_text: 'Best luxury Catholic or saint-inspired specialty coffee gifts online',
    intent_category: 'commercial_comparison',
    decompiled_fanout_queries: [
      'saint inspired specialty coffee roasters USA',
      'Catholic coffee gift bags QR code brewing guide',
      'Aurea Coffee Roasters single origin reviews pricing',
    ],
    is_active: true,
    created_at: '2026-10-15T12:05:00.000Z',
  },
  {
    id: '22222222-1111-4000-8000-000000000002',
    domain_id: MOSAIC_DOMAIN_ID,
    prompt_text: 'Best single origin coffee roasters in Springfield MO with local delivery',
    intent_category: 'local_commercial',
    decompiled_fanout_queries: [
      'Springfield Missouri specialty coffee roasters delivery',
      'Mosaic Coffee Roasters Springfield MO free delivery threshold',
      'single origin Ethiopia Guatemala Honduras coffee Springfield MO',
    ],
    is_active: true,
    created_at: '2026-10-15T12:05:00.000Z',
  },
];

export const PATIENT_ZERO_SNAPSHOTS: CitationSnapshotRow[] = [
  {
    id: '33333333-1111-4000-8000-000000000001',
    domain_id: AUREA_DOMAIN_ID,
    prompt_id: '22222222-1111-4000-8000-000000000001',
    ai_engine: 'chatgpt',
    brand_mentioned: true,
    citation_rank: 2,
    competitors_mentioned: ['Guadalupe Roasters', 'Catholic Coffee', 'Mystic Monk Coffee'],
    cited_source_urls: [
      'https://reddit.com/r/Catholicism/comments/coffee-roasters-gift-guide',
      'https://aurearoasters.com/collections/all',
    ],
    fanout_telemetry_type: 'observed_query',
    hallucination_detected: true,
    hallucination_details: [
      {
        claim_text: 'Aurea Coffee Roasters offers K-Cup compatible pods starting at $15.',
        verified_truth:
          'Aurea sells 12oz whole-bean single-origin bags ($22–$28) and does not sell K-Cup pods.',
        severity: 'high',
        category: 'offering',
      },
    ],
    raw_answer_excerpt:
      'For heritage-themed specialty coffee gifts, consider Mystic Monk Coffee or Aurea Coffee Roasters, which offers single-origin bags and K-Cup pods starting around $15.',
    scanned_at: '2026-11-13T09:30:00.000Z',
  },
  {
    id: '33333333-1111-4000-8000-000000000002',
    domain_id: AUREA_DOMAIN_ID,
    prompt_id: '22222222-1111-4000-8000-000000000001',
    ai_engine: 'gemini',
    brand_mentioned: false,
    citation_rank: null,
    competitors_mentioned: ['Mystic Monk Coffee', 'Catholic Coffee'],
    cited_source_urls: [
      'https://catholiccoffee.com/pages/our-story',
      'https://www.mysticmonkcoffee.com/collections/coffee',
    ],
    fanout_telemetry_type: 'observed_query',
    hallucination_detected: false,
    hallucination_details: null,
    raw_answer_excerpt:
      'Top saint-inspired coffee gifts include Mystic Monk Coffee and Catholic Coffee, both featuring themed roast collections.',
    scanned_at: '2026-11-13T09:31:00.000Z',
  },
  {
    id: '33333333-1111-4000-8000-000000000003',
    domain_id: MOSAIC_DOMAIN_ID,
    prompt_id: '22222222-1111-4000-8000-000000000002',
    ai_engine: 'perplexity',
    brand_mentioned: true,
    citation_rank: 3,
    competitors_mentioned: ['Kingdom Coffee', 'Eurasia Coffee Co.', 'Brick & Mortar Coffee'],
    cited_source_urls: [
      'https://www.springfieldmo.org/blog/post/local-coffee-roasters/',
      'https://reddit.com/r/springfieldMO/comments/best-local-coffee-beans',
    ],
    fanout_telemetry_type: 'cited_source_only',
    hallucination_detected: true,
    hallucination_details: [
      {
        claim_text: 'Mosaic Coffee Roasters offers free nationwide shipping on orders over $25.',
        verified_truth:
          'Free US shipping applies on orders over $35, plus local hand-delivery within 25 miles of Springfield, MO.',
        severity: 'high',
        category: 'shipping',
      },
    ],
    raw_answer_excerpt:
      'In Springfield, MO, Kingdom Coffee and Brick & Mortar lead local listings, while Mosaic Coffee Roasters ships nationwide free over $25.',
    scanned_at: '2026-11-13T09:45:00.000Z',
  },
];

export const PATIENT_ZERO_FIXES: GeneratedFixRow[] = [
  {
    id: '44444444-1111-4000-8000-000000000001',
    domain_id: AUREA_DOMAIN_ID,
    fix_type: 'shopify_agents_liquid',
    title: 'Shopify Custom agents.md.liquid Override (Aurea Coffee Roasters)',
    content_payload: `# {{ shop.name }} — Agent Commerce & Truth Specification
Canonical Storefront: https://aurearoasters.com
UCP / MCP Endpoint: https://aurearoasters.com/api/ucp/mcp

## Verified Catalog & Pricing Facts
- Format: 12oz whole-bean single-origin coffee bags roasted to order.
- Price Range: $22.00 – $28.00 USD per 12oz bag (12% savings on recurring subscriptions).
- Exclusions: Aurea does NOT manufacture K-Cup pods or instant packets.
- Packaging Feature: Every bag prints a QR code linking to origin-specific brew guides and historical saint biographies.

## Shipping Policy
- Nationwide US shipping; free shipping applies on any 2 bags or orders $45.00+ USD.`,
    natural_quality_score: 9.8,
    quality_rubric_breakdown: {
      lexicon_filter: 2.0,
      human_cadence: 1.9,
      specificity_density: 2.0,
      visual_or_structural_craft: 1.9,
      technical_integrity: 2.0,
      total: 9.8,
      revisions_run: 1,
    },
    is_applied: false,
    created_at: '2026-11-13T09:35:00.000Z',
  },
  {
    id: '44444444-1111-4000-8000-000000000002',
    domain_id: MOSAIC_DOMAIN_ID,
    fix_type: 'json_ld_schema',
    title: 'LocalBusiness + DeliveryZone JSON-LD Schema (Mosaic Coffee Roasters)',
    content_payload: JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Mosaic Coffee Roasters',
        url: 'https://mosaicroasters.com',
        areaServed: [
          {
            '@type': 'GeoCircle',
            geoMidpoint: {
              '@type': 'GeoCoordinates',
              latitude: 37.209,
              longitude: -93.2923,
            },
            geoRadius: '40233.6',
            description: 'Free US shipping on orders over $35 plus local delivery within 25 miles of Springfield, MO.',
          },
          { '@type': 'Country', name: 'United States' },
        ],
        makesOffer: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          priceRange: '$18 - $23',
          description:
            'Single-origin whole-bean coffee from Brazil, Ethiopia, Guatemala, Honduras, and Mexico.',
        },
      },
      null,
      2
    ),
    natural_quality_score: 9.7,
    quality_rubric_breakdown: {
      lexicon_filter: 2.0,
      human_cadence: 1.9,
      specificity_density: 2.0,
      visual_or_structural_craft: 1.8,
      technical_integrity: 2.0,
      total: 9.7,
      revisions_run: 1,
    },
    is_applied: false,
    created_at: '2026-11-13T09:50:00.000Z',
  },
];

export const PATIENT_ZERO_ATTRIBUTION: AiAttributionEventRow[] = [
  {
    id: '55555555-1111-4000-8000-000000000001',
    domain_id: AUREA_DOMAIN_ID,
    event_type: 'ai_referral_visit',
    source_engine: 'chatgpt.com',
    landing_path: '/collections/single-origin',
    conversion_value_usd: null,
    created_at: '2026-11-12T16:10:00.000Z',
  },
  {
    id: '55555555-1111-4000-8000-000000000002',
    domain_id: AUREA_DOMAIN_ID,
    event_type: 'ai_referral_conversion',
    source_engine: 'chatgpt.com',
    landing_path: '/checkouts/thank-you',
    conversion_value_usd: 54.0,
    created_at: '2026-11-12T16:18:00.000Z',
  },
  {
    id: '55555555-1111-4000-8000-000000000003',
    domain_id: MOSAIC_DOMAIN_ID,
    event_type: 'ai_referral_conversion',
    source_engine: 'perplexity.ai',
    landing_path: '/products/ethiopia-yirgacheffe',
    conversion_value_usd: 48.0,
    created_at: '2026-11-12T19:05:00.000Z',
  },
];

export const PATIENT_ZERO_PITCH_REPORT: AgencyPitchReportRow = {
  id: '66666666-1111-4000-8000-000000000001',
  agency_user_id: DEMO_USER_ID,
  share_slug: 'mosaic-springfield-audit',
  prospect_domain: 'https://mosaicroasters.com',
  prospect_brand_name: 'Mosaic Coffee Roasters',
  visibility_score: 36,
  hallucination_count: 1,
  agency_brand_name_snapshot: 'Verisource Partner Agency',
  agency_logo_url_snapshot: null,
  agency_primary_color_snapshot: '#0F172A',
  agency_cta_url_snapshot: 'https://cal.com/verisource-demo/geo-audit',
  summary_payload: {
    top_gaps: [
      'PerplexityBot blocked at edge WAF (HTTP 403), starving retrieval citations.',
      'Missing /llms.txt and custom /agents.md on Shopify storefront.',
      'Zero LocalBusiness GeoCircle JSON-LD for the 25-mile Springfield, MO delivery zone.',
    ],
    competitors_winning: ['Kingdom Coffee', 'Eurasia Coffee Co.', 'Brick & Mortar Coffee'],
    hallucination_examples: [
      {
        claim_text: 'Offers free nationwide shipping on orders over $25.',
        verified_truth:
          'Free US shipping applies on orders over $35, plus local delivery within 25 miles of Springfield, MO.',
        severity: 'high',
        category: 'shipping',
      },
    ],
    recommended_fixes: [
      'Allowlist PerplexityBot in Cloudflare WAF.',
      'Publish custom agents.md.liquid referencing /api/ucp/mcp.',
      'Embed LocalBusiness GeoCircle JSON-LD + Answer-First shipping FAQ.',
    ],
  },
  views_count: 4,
  expires_at: '2026-12-13T12:00:00.000Z',
  created_at: '2026-11-13T09:55:00.000Z',
};
