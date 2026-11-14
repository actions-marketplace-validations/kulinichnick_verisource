import type { AuthInfo } from '@modelcontextprotocol/server';
import { createClient } from '@supabase/supabase-js';
import {
  DEMO_USER_ID,
  sha256Hex,
  type ConsumeMcpCreditsResult,
  type Database,
  type PlanTier,
} from '@verisource/core-geo';
import type { WorkerEnv } from './types.js';

export interface McpCallerPrincipal {
  rawBearerToken: string | null;
  clientIp: string;
}

export interface CreditGateDecision {
  allowed: boolean;
  userId: string | null;
  planTier: PlanTier | null;
  creditsCharged: number;
  creditsRemaining: number;
  errorCode: string | null;
  upgradeMessage: string | null;
}

// Deterministic in-memory mock ledger for zero-key local development and tests
const mockCreditBalances = new Map<
  string,
  { userId: string; planTier: PlanTier; used: number; limit: number }
>([
  [
    'vs_demo_pro_key',
    { userId: DEMO_USER_ID, planTier: 'pro_99', used: 0, limit: 1000 },
  ],
  [
    'vs_demo_agency_key',
    { userId: DEMO_USER_ID, planTier: 'agency_249', used: 0, limit: 5000 },
  ],
  [
    'vs_free_key',
    { userId: '00000000-0000-4000-8000-000000000099', planTier: 'free', used: 0, limit: 5 },
  ],
]);

export function resetMockCreditBalancesForTests(): void {
  mockCreditBalances.set('vs_demo_pro_key', {
    userId: DEMO_USER_ID,
    planTier: 'pro_99',
    used: 0,
    limit: 1000,
  });
  mockCreditBalances.set('vs_demo_agency_key', {
    userId: DEMO_USER_ID,
    planTier: 'agency_249',
    used: 0,
    limit: 5000,
  });
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function buildPassThroughAuthInfo(
  bearerToken: string | null,
  clientIp: string
): AuthInfo | undefined {
  if (!bearerToken) {
    return {
      token: 'anonymous',
      clientId: `ip:${clientIp}`,
      scopes: ['mcp:preview'],
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      extra: { rawBearerToken: null, clientIp },
    };
  }

  return {
    token: bearerToken,
    clientId: bearerToken.startsWith('vs_') ? 'api_key_client' : 'oauth_jwt_client',
    scopes: ['mcp:preview', 'mcp:paid'],
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    extra: { rawBearerToken: bearerToken, clientIp },
  };
}

export async function authorizeAndMeterPaidTool(params: {
  rawBearerToken: string | null;
  creditsCost: number;
  env: WorkerEnv;
}): Promise<CreditGateDecision> {
  const appUrl = params.env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev';

  if (!params.rawBearerToken) {
    return {
      allowed: false,
      userId: null,
      planTier: null,
      creditsCharged: 0,
      creditsRemaining: 0,
      errorCode: 'MISSING_BEARER_TOKEN',
      upgradeMessage: `Paid MCP tool requires Authorization: Bearer <vs_live_key> on the Pro ($99/mo) or Agency ($249/mo) plan. Get a key at ${appUrl}/pricing`,
    };
  }

  const hasLiveSupabaseService = Boolean(
    params.env.NEXT_PUBLIC_SUPABASE_URL && params.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Live Supabase Mode: either SHA-256 API key RPC or OAuth Supabase Access JWT
  if (hasLiveSupabaseService) {
    const supabase = createClient<Database>(
      params.env.NEXT_PUBLIC_SUPABASE_URL!,
      params.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Path A: Verisource API key (`vs_live_...`) -> atomic `consume_mcp_credits` RPC
    if (params.rawBearerToken.startsWith('vs_')) {
      const keyHash = await sha256Hex(params.rawBearerToken);
      const { data, error } = await supabase.rpc('consume_mcp_credits', {
        p_key_hash: keyHash,
        p_credits: params.creditsCost,
      });

      const row: ConsumeMcpCreditsResult | undefined = Array.isArray(data)
        ? data[0]
        : undefined;

      if (error || !row) {
        return {
          allowed: false,
          userId: null,
          planTier: null,
          creditsCharged: 0,
          creditsRemaining: 0,
          errorCode: 'AUTH_BACKEND_ERROR',
          upgradeMessage: 'Unable to validate MCP API key at this moment.',
        };
      }

      if (!row.allowed) {
        return {
          allowed: false,
          userId: row.user_id,
          planTier: row.plan_tier,
          creditsCharged: 0,
          creditsRemaining: row.credits_remaining,
          errorCode: row.error_code ?? 'UNAUTHORIZED',
          upgradeMessage:
            row.error_code === 'MONTHLY_CREDIT_LIMIT_EXCEEDED'
              ? `Monthly MCP credit quota reached (${row.credits_remaining} remaining). Upgrade to Agency (5,000 credits/mo) at ${appUrl}/pricing`
              : `Active Pro ($99/mo) or Agency ($249/mo) subscription required. Upgrade at ${appUrl}/pricing`,
        };
      }

      return {
        allowed: true,
        userId: row.user_id,
        planTier: row.plan_tier,
        creditsCharged: params.creditsCost,
        creditsRemaining: row.credits_remaining,
        errorCode: null,
        upgradeMessage: null,
      };
    }

    // Path B: OAuth 2.0 / Supabase Access Token (`eyJ...`) -> atomic `consume_mcp_credits_for_user` RPC
    const { data: userData, error: userError } = await supabase.auth.getUser(
      params.rawBearerToken
    );
    if (userError || !userData.user) {
      return {
        allowed: false,
        userId: null,
        planTier: null,
        creditsCharged: 0,
        creditsRemaining: 0,
        errorCode: 'INVALID_OAUTH_TOKEN',
        upgradeMessage: `Invalid or expired OAuth access token. Re-authenticate at ${appUrl}/dashboard`,
      };
    }

    const { data: oauthData, error: oauthRpcError } = await supabase.rpc(
      'consume_mcp_credits_for_user',
      {
        p_user_id: userData.user.id,
        p_credits: params.creditsCost,
      }
    );

    const oauthRow: ConsumeMcpCreditsResult | undefined = Array.isArray(oauthData)
      ? oauthData[0]
      : undefined;

    if (oauthRpcError || !oauthRow) {
      return {
        allowed: false,
        userId: userData.user.id,
        planTier: null,
        creditsCharged: 0,
        creditsRemaining: 0,
        errorCode: 'AUTH_BACKEND_ERROR',
        upgradeMessage: 'Unable to meter OAuth MCP credits at this moment.',
      };
    }

    if (!oauthRow.allowed) {
      return {
        allowed: false,
        userId: oauthRow.user_id,
        planTier: oauthRow.plan_tier,
        creditsCharged: 0,
        creditsRemaining: oauthRow.credits_remaining,
        errorCode: oauthRow.error_code ?? 'UNAUTHORIZED',
        upgradeMessage:
          oauthRow.error_code === 'MONTHLY_CREDIT_LIMIT_EXCEEDED'
            ? `Monthly MCP credit quota exceeded (${oauthRow.credits_remaining} remaining). Upgrade at ${appUrl}/pricing`
            : `Pro ($99/mo) or Agency ($249/mo) subscription required for paid MCP tools. Upgrade at ${appUrl}/pricing`,
      };
    }

    return {
      allowed: true,
      userId: oauthRow.user_id,
      planTier: oauthRow.plan_tier,
      creditsCharged: params.creditsCost,
      creditsRemaining: oauthRow.credits_remaining,
      errorCode: null,
      upgradeMessage: null,
    };
  }

  // Deterministic Local Mock Mode (when Supabase service keys are not yet configured)
  let mockEntry = mockCreditBalances.get(params.rawBearerToken);
  if (
    !mockEntry &&
    /^vs_live_[0-9a-f]{48}$/.test(params.rawBearerToken) &&
    mockCreditBalances.size < 500
  ) {
    mockEntry = {
      userId: DEMO_USER_ID,
      planTier: 'pro_99',
      used: 0,
      limit: 1000,
    };
    mockCreditBalances.set(params.rawBearerToken, mockEntry);
  }

  if (!mockEntry) {
    return {
      allowed: false,
      userId: null,
      planTier: null,
      creditsCharged: 0,
      creditsRemaining: 0,
      errorCode: 'INVALID_OR_REVOKED_KEY',
      upgradeMessage: `Unrecognized MCP key. In local mock mode use Bearer vs_demo_pro_key or generate a vs_live_ key in Tab 3.`,
    };
  }

  if (!['pro_99', 'agency_249'].includes(mockEntry.planTier)) {
    return {
      allowed: false,
      userId: mockEntry.userId,
      planTier: mockEntry.planTier,
      creditsCharged: 0,
      creditsRemaining: Math.max(0, mockEntry.limit - mockEntry.used),
      errorCode: 'PLAN_UPGRADE_REQUIRED',
      upgradeMessage: `Plan "${mockEntry.planTier}" does not include paid MCP tools. Upgrade to Pro ($99/mo) at ${appUrl}/pricing`,
    };
  }

  if (mockEntry.used + params.creditsCost > mockEntry.limit) {
    return {
      allowed: false,
      userId: mockEntry.userId,
      planTier: mockEntry.planTier,
      creditsCharged: 0,
      creditsRemaining: Math.max(0, mockEntry.limit - mockEntry.used),
      errorCode: 'MONTHLY_CREDIT_LIMIT_EXCEEDED',
      upgradeMessage: `Monthly MCP credit limit reached (${mockEntry.limit} credits).`,
    };
  }

  mockEntry.used += params.creditsCost;

  return {
    allowed: true,
    userId: mockEntry.userId,
    planTier: mockEntry.planTier,
    creditsCharged: params.creditsCost,
    creditsRemaining: mockEntry.limit - mockEntry.used,
    errorCode: null,
    upgradeMessage: null,
  };
}
