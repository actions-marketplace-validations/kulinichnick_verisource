// Strict TypeScript definitions generated from schema.sql

export type PlanTier =
  | 'free'
  | 'tripwire_19'
  | 'starter_49'
  | 'pro_99'
  | 'agency_249';

export type BillingCycle = 'monthly' | 'annual' | 'one_time';

export type ShopifyMcpStatus =
  | 'unchecked'
  | 'ucp_active'
  | 'legacy_mcp_active'
  | 'unavailable';

export type AgentsMdStatus =
  | 'missing'
  | 'default_boilerplate'
  | 'custom_enriched';

export type LlmsTxtStatus = 'missing' | 'present';

export type AiEngine = 'chatgpt' | 'gemini' | 'perplexity' | 'claude';

export type FanoutTelemetryType =
  | 'observed_query'
  | 'cited_source_only'
  | 'mock_fixture';

export type FixType =
  | 'json_ld_schema'
  | 'agents_md'
  | 'shopify_agents_liquid'
  | 'llms_txt'
  | 'fanout_faq_block'
  | 'citation_outreach_brief';

export type AttributionEventType =
  | 'ai_referral_visit'
  | 'ai_referral_conversion'
  | 'ai_bot_crawl';

export type RobotsAiBotStatus = {
  GPTBot: boolean;
  'OAI-SearchBot': boolean;
  PerplexityBot: boolean;
  ClaudeBot: boolean;
  'Google-Extended': boolean;
  waf_blocked: boolean;
};

export type BrandTruthSheet = {
  is_user_verified: boolean;
  core_offering: string;
  verified_pricing_summary: string;
  shipping_or_service_area: string;
  key_differentiators: string[];
  discontinued_or_false_claims_to_flag: string[];
};

export type HallucinationDetail = {
  claim_text: string;
  verified_truth: string;
  severity: 'high' | 'medium' | 'low';
  category: 'pricing' | 'shipping' | 'offering' | 'location' | 'discontinued';
};

export type QualityRubricBreakdown = {
  lexicon_filter: number;
  human_cadence: number;
  specificity_density: number;
  visual_or_structural_craft: number;
  technical_integrity: number;
  total: number;
  revisions_run: number;
};

export type PitchSummaryPayload = {
  top_gaps: string[];
  competitors_winning: string[];
  hallucination_examples: HallucinationDetail[];
  recommended_fixes: string[];
};

export type ProfileRow = {
  id: string;
  email: string;
  plan_tier: PlanTier;
  billing_cycle: BillingCycle | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tripwire_paid_at: string | null;
  mcp_calls_used_this_month: number;
  mcp_calls_limit: number;
  agency_brand_name: string | null;
  agency_logo_url: string | null;
  agency_primary_color: string | null;
  agency_cta_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DomainRow = {
  id: string;
  user_id: string;
  domain_url: string;
  brand_name: string;
  industry_vertical: string;
  is_shopify: boolean;
  shopify_mcp_status: ShopifyMcpStatus;
  agents_md_status: AgentsMdStatus;
  llms_txt_status: LlmsTxtStatus;
  robots_ai_bot_status: RobotsAiBotStatus;
  brand_truth_sheet: BrandTruthSheet;
  visibility_score: number;
  accuracy_score: number;
  tracking_pixel_token: string;
  last_scanned_at: string | null;
  created_at: string;
};

export type TrackedPromptRow = {
  id: string;
  domain_id: string;
  prompt_text: string;
  intent_category: string;
  decompiled_fanout_queries: string[];
  is_active: boolean;
  created_at: string;
};

export type CitationSnapshotRow = {
  id: string;
  domain_id: string;
  prompt_id: string | null;
  ai_engine: AiEngine;
  brand_mentioned: boolean;
  citation_rank: number | null;
  competitors_mentioned: string[];
  cited_source_urls: string[];
  fanout_telemetry_type: FanoutTelemetryType;
  hallucination_detected: boolean;
  hallucination_details: HallucinationDetail[] | null;
  raw_answer_excerpt: string | null;
  scanned_at: string;
};

export type GeneratedFixRow = {
  id: string;
  domain_id: string;
  fix_type: FixType;
  title: string;
  content_payload: string;
  natural_quality_score: number;
  quality_rubric_breakdown: QualityRubricBreakdown;
  is_applied: boolean;
  created_at: string;
};

export type AgencyPitchReportRow = {
  id: string;
  agency_user_id: string;
  share_slug: string;
  prospect_domain: string;
  prospect_brand_name: string;
  visibility_score: number;
  hallucination_count: number;
  agency_brand_name_snapshot: string | null;
  agency_logo_url_snapshot: string | null;
  agency_primary_color_snapshot: string | null;
  agency_cta_url_snapshot: string | null;
  summary_payload: PitchSummaryPayload;
  views_count: number;
  expires_at: string | null;
  created_at: string;
};

export type AiAttributionEventRow = {
  id: string;
  domain_id: string;
  event_type: AttributionEventType;
  source_engine: string;
  landing_path: string | null;
  conversion_value_usd: number | null;
  created_at: string;
};

export type McpApiKeyRow = {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  label: string;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type ConsumeMcpCreditsResult = {
  allowed: boolean;
  user_id: string | null;
  plan_tier: PlanTier | null;
  credits_remaining: number;
  error_code:
    | 'INVALID_CREDIT_COST'
    | 'INVALID_OR_REVOKED_KEY'
    | 'PROFILE_NOT_FOUND'
    | 'PLAN_UPGRADE_REQUIRED'
    | 'MONTHLY_CREDIT_LIMIT_EXCEEDED'
    | null;
};

export type PublicPitchReportResult = {
  share_slug: string;
  prospect_domain: string;
  prospect_brand_name: string;
  visibility_score: number;
  hallucination_count: number;
  agency_brand_name: string | null;
  agency_logo_url: string | null;
  agency_primary_color: string | null;
  agency_cta_url: string | null;
  summary_payload: PitchSummaryPayload;
  views_count: number;
  expires_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; email: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      domains: {
        Row: DomainRow;
        Insert: Partial<DomainRow> & {
          user_id: string;
          domain_url: string;
          brand_name: string;
        };
        Update: Partial<DomainRow>;
        Relationships: [];
      };
      tracked_prompts: {
        Row: TrackedPromptRow;
        Insert: Partial<TrackedPromptRow> & {
          domain_id: string;
          prompt_text: string;
        };
        Update: Partial<TrackedPromptRow>;
        Relationships: [];
      };
      citation_snapshots: {
        Row: CitationSnapshotRow;
        Insert: Partial<CitationSnapshotRow> & {
          domain_id: string;
          ai_engine: AiEngine;
        };
        Update: Partial<CitationSnapshotRow>;
        Relationships: [];
      };
      generated_fixes: {
        Row: GeneratedFixRow;
        Insert: Partial<GeneratedFixRow> & {
          domain_id: string;
          fix_type: FixType;
          title: string;
          content_payload: string;
          natural_quality_score: number;
        };
        Update: Partial<GeneratedFixRow>;
        Relationships: [];
      };
      agency_pitch_reports: {
        Row: AgencyPitchReportRow;
        Insert: Partial<AgencyPitchReportRow> & {
          agency_user_id: string;
          share_slug: string;
          prospect_domain: string;
          prospect_brand_name: string;
          visibility_score: number;
          summary_payload: PitchSummaryPayload;
        };
        Update: Partial<AgencyPitchReportRow>;
        Relationships: [];
      };
      ai_attribution_events: {
        Row: AiAttributionEventRow;
        Insert: Partial<AiAttributionEventRow> & {
          domain_id: string;
          event_type: AttributionEventType;
          source_engine: string;
        };
        Update: Partial<AiAttributionEventRow>;
        Relationships: [];
      };
      mcp_api_keys: {
        Row: McpApiKeyRow;
        Insert: Partial<McpApiKeyRow> & {
          user_id: string;
          key_hash: string;
          key_prefix: string;
        };
        Update: Partial<McpApiKeyRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_mcp_credits: {
        Args: { p_key_hash: string; p_credits?: number };
        Returns: ConsumeMcpCreditsResult[];
      };
      consume_mcp_credits_for_user: {
        Args: { p_user_id: string; p_credits?: number };
        Returns: ConsumeMcpCreditsResult[];
      };
      get_public_pitch_report: {
        Args: { p_share_slug: string };
        Returns: PublicPitchReportResult[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
