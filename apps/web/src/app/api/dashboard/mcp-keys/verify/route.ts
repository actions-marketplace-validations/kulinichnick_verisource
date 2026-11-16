import { NextResponse } from 'next/server';
import {
  buildMcpDiscoveryManifest,
  sha256Hex,
  type McpApiKeyRow,
  type PlanTier,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  resolveConsoleRequestAccess,
} from '../../../../../lib/data-store';

export type McpKeyVerificationStatus =
  | 'verified_raw_key'
  | 'verified_workspace_ledger'
  | 'no_active_key'
  | 'invalid_or_revoked_key';

export interface McpConnectionVerifyResponse {
  ok: boolean;
  mode: 'live_edge_handshake' | 'mock_handshake';
  endpoint: string;
  transport: 'streamable-http';
  endpointReachable: boolean;
  httpStatus: number;
  latencyMs: number;
  creditsChargedForCheck: 0;
  planTier: PlanTier;
  paidToolsEligible: boolean;
  upgradeRequired: boolean;
  upgradeHref: string | null;
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  activeKeyCount: number;
  keyStatus: McpKeyVerificationStatus;
  matchedKeyPrefix: string | null;
  matchedKeyLabel: string | null;
  exposedTools: string[];
  readyForPaidTools: boolean;
  summaryMessage: string;
}

function parseStreamableHttpRpcTools(rawText: string): string[] {
  const trimmed = rawText.trimStart();
  let parsed: Record<string, unknown> | null = null;
  if (trimmed.startsWith('{')) {
    parsed = JSON.parse(trimmed) as Record<string, unknown>;
  } else {
    const dataLine = rawText
      .split(/\r?\n/)
      .find((line) => line.startsWith('data:'));
    if (dataLine) {
      parsed = JSON.parse(dataLine.slice(5).trim()) as Record<string, unknown>;
    }
  }
  if (!parsed || typeof parsed !== 'object') return [];
  const result = parsed.result as { tools?: Array<{ name?: string }> } | undefined;
  if (!result || !Array.isArray(result.tools)) return [];
  return result.tools
    .map((t) => (typeof t?.name === 'string' ? t.name : ''))
    .filter(Boolean);
}

export async function POST(request: Request): Promise<NextResponse> {
  const access = await resolveConsoleRequestAccess(request);
  if (access.status === 'unauthenticated') {
    return NextResponse.json(
      {
        error: 'AUTHENTICATION_REQUIRED',
        message:
          'Sign in to your Verisource Console to verify your /mcp connection.',
      },
      { status: 401 }
    );
  }
  if (access.status === 'plan_activation_required') {
    return NextResponse.json(
      {
        error: 'PLAN_ACTIVATION_REQUIRED',
        message:
          'Activate a Console plan to verify workspace /mcp keys and credit quotas.',
      },
      { status: 402 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    raw_key?: string;
  };
  const cleanedRawKey = (body.raw_key ?? '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .trim();

  const isMockRuntime =
    !access.supabase && process.env.VERISOURCE_LIVE_MCP_VERIFY !== '1';

  if (cleanedRawKey) {
    const isValidLiveKey = /^vs_live_[0-9a-f]{48}$/.test(cleanedRawKey);
    const isAllowedMockDemoKey =
      isMockRuntime &&
      (cleanedRawKey === 'vs_demo_pro_key' ||
        cleanedRawKey === 'vs_demo_agency_key');

    if (!isValidLiveKey && !isAllowedMockDemoKey) {
      return NextResponse.json(
        {
          error: 'INVALID_MCP_KEY_FORMAT',
          message:
            'MCP Bearer keys must match vs_live_<48 lowercase hex characters>. Mint a fresh key above or clear the test key input.',
        },
        { status: 400 }
      );
    }
  }

  const profile = access.profile;
  const planTier = profile.plan_tier;
  const paidToolsEligible =
    planTier === 'pro_99' || planTier === 'agency_249';
  const creditsUsed = Math.max(0, profile.mcp_calls_used_this_month ?? 0);
  const creditsLimit = Math.max(0, profile.mcp_calls_limit ?? 0);
  const creditsRemaining = Math.max(0, creditsLimit - creditsUsed);

  let activeKeys: McpApiKeyRow[] = [];
  if (access.supabase) {
    const { data } = await access.supabase
      .from('mcp_api_keys')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    activeKeys = (data ?? []) as McpApiKeyRow[];
  } else {
    activeKeys = getLocalMockStore().mcpApiKeys.filter(
      (k) => k.user_id === profile.id && k.is_active
    );
  }

  let keyStatus: McpKeyVerificationStatus;
  let matchedKeyPrefix: string | null = null;
  let matchedKeyLabel: string | null = null;

  if (cleanedRawKey) {
    if (
      isMockRuntime &&
      (cleanedRawKey === 'vs_demo_pro_key' ||
        cleanedRawKey === 'vs_demo_agency_key')
    ) {
      keyStatus = 'verified_raw_key';
      matchedKeyPrefix = cleanedRawKey.slice(0, 14);
      matchedKeyLabel = 'Local Sandbox Key';
    } else {
      const candidateHash = await sha256Hex(cleanedRawKey);
      const matched = activeKeys.find((k) => k.key_hash === candidateHash);
      if (matched) {
        keyStatus = 'verified_raw_key';
        matchedKeyPrefix = matched.key_prefix;
        matchedKeyLabel = matched.label;
      } else {
        keyStatus = 'invalid_or_revoked_key';
      }
    }
  } else if (activeKeys.length > 0) {
    keyStatus = 'verified_workspace_ledger';
    matchedKeyPrefix = activeKeys[0]!.key_prefix;
    matchedKeyLabel = activeKeys[0]!.label;
  } else {
    keyStatus = 'no_active_key';
  }

  const endpoint = (
    process.env.NEXT_PUBLIC_MCP_URL ?? 'https://mcp.verisource.dev/mcp'
  ).trim();
  const canonicalTools = buildMcpDiscoveryManifest().tools.map((t) => t.name);

  let endpointReachable = true;
  let httpStatus = 200;
  let latencyMs = 12;
  let exposedTools = canonicalTools;
  const mode: 'live_edge_handshake' | 'mock_handshake' = isMockRuntime
    ? 'mock_handshake'
    : 'live_edge_handshake';

  if (!isMockRuntime) {
    const startedAt = Date.now();
    try {
      const rpcHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      };
      if (cleanedRawKey && keyStatus === 'verified_raw_key') {
        rpcHeaders.Authorization = `Bearer ${cleanedRawKey}`;
      }
      const rpcRes = await fetch(endpoint, {
        method: 'POST',
        headers: rpcHeaders,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        }),
        signal: AbortSignal.timeout(5500),
      });
      latencyMs = Math.max(1, Date.now() - startedAt);
      httpStatus = rpcRes.status;
      const rawBody = await rpcRes.text();
      const parsedTools = parseStreamableHttpRpcTools(rawBody);
      if (rpcRes.ok && parsedTools.length > 0) {
        endpointReachable = true;
        exposedTools = parsedTools;
      } else {
        endpointReachable = false;
        exposedTools = [];
      }
    } catch {
      latencyMs = Math.max(1, Date.now() - startedAt);
      httpStatus = 503;
      endpointReachable = false;
      exposedTools = [];
    }
  }

  const readyForPaidTools =
    endpointReachable &&
    paidToolsEligible &&
    creditsRemaining > 0 &&
    (keyStatus === 'verified_raw_key' ||
      keyStatus === 'verified_workspace_ledger');

  let summaryMessage: string;
  if (!endpointReachable) {
    summaryMessage = `Could not reach ${endpoint} (HTTP ${httpStatus}). Check network egress and retry in a few seconds.`;
  } else if (!paidToolsEligible) {
    summaryMessage = `Endpoint ${endpoint} is online (${exposedTools.length} tools advertised), and free scan_domain_ai_readiness works immediately. Upgrade to Pro + MCP Engine ($99/mo · 1,000 credits) to run the 3 paid citation, hallucination, and fix-bundle tools.`;
  } else if (keyStatus === 'invalid_or_revoked_key') {
    summaryMessage =
      'That vs_live_ token is revoked or does not belong to this workspace. Mint a new key above and update your client config.';
  } else if (keyStatus === 'no_active_key') {
    summaryMessage = `Endpoint ${endpoint} is online (${latencyMs}ms) and your plan includes ${creditsRemaining.toLocaleString()} remaining /mcp credits. Click "+ Mint vs_live_ Key" above to generate your first secret token.`;
  } else if (creditsRemaining <= 0) {
    summaryMessage =
      'Your workspace key is active, but 0 monthly /mcp credits remain. Upgrade or wait for your billing cycle reset to run paid tools.';
  } else if (keyStatus === 'verified_raw_key') {
    summaryMessage = `Verified live SHA-256 Bearer key (${matchedKeyPrefix}••••••••) against ${endpoint} (${latencyMs}ms · 0 credits charged). All ${exposedTools.length} tools and ${creditsRemaining.toLocaleString()} / ${creditsLimit.toLocaleString()} monthly credits are ready.`;
  } else {
    summaryMessage = `Streamable HTTP endpoint ${endpoint} is online (${latencyMs}ms · ${exposedTools.length} tools · 0 credits charged). ${activeKeys.length} active key(s) (${matchedKeyPrefix}••••••••) verified with ${creditsRemaining.toLocaleString()} / ${creditsLimit.toLocaleString()} monthly credits remaining.`;
  }

  const payload: McpConnectionVerifyResponse = {
    ok: endpointReachable && keyStatus !== 'invalid_or_revoked_key',
    mode,
    endpoint,
    transport: 'streamable-http',
    endpointReachable,
    httpStatus,
    latencyMs,
    creditsChargedForCheck: 0,
    planTier,
    paidToolsEligible,
    upgradeRequired: !paidToolsEligible,
    upgradeHref: paidToolsEligible ? null : '/pricing?plan=pro_99',
    creditsUsed,
    creditsLimit,
    creditsRemaining,
    activeKeyCount: activeKeys.length,
    keyStatus,
    matchedKeyPrefix,
    matchedKeyLabel,
    exposedTools,
    readyForPaidTools,
    summaryMessage,
  };

  return NextResponse.json(payload);
}
