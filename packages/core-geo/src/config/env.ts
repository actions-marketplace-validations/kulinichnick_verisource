import { z } from 'zod';

export const RawEnvSchema = z.object({
  PROVIDER_MODE: z.enum(['mock', 'live']).optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_MCP_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
  FIRECRAWL_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export type RawEnvInput = Record<string, string | undefined>;

export interface CoreGeoEnv {
  providerMode: 'mock' | 'live';
  appUrl: string;
  mcpUrl: string;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  supabaseServiceRoleKey: string | null;
  geminiApiKey: string | null;
  openaiApiKey: string | null;
  perplexityApiKey: string | null;
  firecrawlApiKey: string | null;
  stripeSecretKey: string | null;
  stripeWebhookSecret: string | null;
  hasSupabase: boolean;
  hasAnyLiveSearchLlm: boolean;
  hasFirecrawl: boolean;
  hasStripe: boolean;
}

function nonEmpty(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveCoreGeoEnv(raw?: RawEnvInput): CoreGeoEnv {
  const source: RawEnvInput =
    raw ??
    (typeof process !== 'undefined' && process.env
      ? (process.env as RawEnvInput)
      : {});

  const parsed = RawEnvSchema.safeParse(source);
  const data = parsed.success ? parsed.data : {};

  const supabaseUrl = nonEmpty(data.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = nonEmpty(data.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const supabaseServiceRoleKey = nonEmpty(data.SUPABASE_SERVICE_ROLE_KEY);
  const geminiApiKey = nonEmpty(data.GEMINI_API_KEY);
  const openaiApiKey = nonEmpty(data.OPENAI_API_KEY);
  const perplexityApiKey = nonEmpty(data.PERPLEXITY_API_KEY);
  const firecrawlApiKey = nonEmpty(data.FIRECRAWL_API_KEY);
  const stripeSecretKey = nonEmpty(data.STRIPE_SECRET_KEY);
  const stripeWebhookSecret = nonEmpty(data.STRIPE_WEBHOOK_SECRET);

  const hasAnyLiveSearchLlm = Boolean(
    geminiApiKey || openaiApiKey || perplexityApiKey
  );

  const explicitMode = data.PROVIDER_MODE;
  const providerMode: 'mock' | 'live' =
    explicitMode === 'live' || (!explicitMode && hasAnyLiveSearchLlm)
      ? 'live'
      : 'mock';

  return {
    providerMode,
    appUrl: nonEmpty(data.NEXT_PUBLIC_APP_URL) ?? 'https://verisource.dev',
    mcpUrl: nonEmpty(data.NEXT_PUBLIC_MCP_URL) ?? 'https://mcp.verisource.dev/mcp',
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    geminiApiKey,
    openaiApiKey,
    perplexityApiKey,
    firecrawlApiKey,
    stripeSecretKey,
    stripeWebhookSecret,
    hasSupabase: Boolean(supabaseUrl && supabaseAnonKey),
    hasAnyLiveSearchLlm,
    hasFirecrawl: Boolean(firecrawlApiKey),
    hasStripe: Boolean(stripeSecretKey),
  };
}
