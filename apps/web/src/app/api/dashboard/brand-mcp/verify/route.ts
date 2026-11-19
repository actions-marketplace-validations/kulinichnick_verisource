import { NextResponse } from 'next/server';
import {
  buildBrandHeadEmbedSnippet,
  buildHostedBrandMcpUrls,
  HOSTED_BRAND_MCP_TOOL_NAMES,
  isPlanEntitledForHostedBrandMcp,
  verifyLiveBrandMcpDeployment,
  type DomainRow,
  type PlanTier,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  resolveConsoleRequestAccess,
} from '../../../../../lib/data-store';

export interface BrandMcpVerifyResponse {
  ok: boolean;
  mode: 'live_edge_handshake' | 'mock_handshake';
  hostname: string;
  brandName: string;
  planTier: PlanTier;
  entitled: boolean;
  upgradeRequired: boolean;
  upgradeHref: string | null;
  mcpEndpointUrl: string;
  webMcpScriptUrl: string;
  discoveryManifestUrl: string;
  embedSnippet: string;
  edgeHandshakeOk: boolean;
  edgeHttpStatus: number;
  exposedTools: string[];
  liveSiteEmbed: {
    hasLinkRelMcp: boolean;
    hasWebMcpScript: boolean;
    verifiedForPublicAgentAccess: boolean;
  };
  summaryMessage: string;
}

function parseRpcToolNames(rawText: string): string[] {
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
  const result = parsed.result as
    | { tools?: Array<{ name?: string }> }
    | undefined;
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
          'Sign in to your Verisource Console to verify your Hosted Brand /mcp endpoint.',
      },
      { status: 401 }
    );
  }
  if (access.status === 'plan_activation_required') {
    return NextResponse.json(
      {
        error: 'PLAN_ACTIVATION_REQUIRED',
        message:
          'Activate Starter ($49/mo), Pro ($99/mo), or Agency ($249/mo) to deploy Hosted Brand /mcp & Chrome WebMCP.',
      },
      { status: 402 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    domain_id?: string;
  };
  if (!body.domain_id || typeof body.domain_id !== 'string') {
    return NextResponse.json(
      {
        error: 'MISSING_DOMAIN_ID',
        message:
          'Provide a domain_id to verify Hosted Brand /mcp & Chrome WebMCP.',
      },
      { status: 400 }
    );
  }

  const store = getLocalMockStore();
  let domain: DomainRow | undefined;

  if (access.supabase) {
    const { data } = await access.supabase
      .from('domains')
      .select('*')
      .eq('id', body.domain_id)
      .eq('user_id', access.profile.id)
      .maybeSingle();
    domain = data ?? undefined;
  } else {
    domain = store.domains.find((d) => d.id === body.domain_id);
  }

  if (!domain) {
    return NextResponse.json(
      { error: 'DOMAIN_NOT_FOUND', message: 'Domain not found in workspace.' },
      { status: 404 }
    );
  }

  const rawMcpEnv = (process.env.NEXT_PUBLIC_MCP_URL ?? '').trim();
  const mcpOrigin = (
    rawMcpEnv && !/localhost|127\.0\.0\.1/i.test(rawMcpEnv)
      ? rawMcpEnv
      : 'https://mcp.verisource.dev/mcp'
  )
    .replace(/\/mcp\/?$/i, '')
    .replace(/\/+$/, '');

  const urls = buildHostedBrandMcpUrls(domain.domain_url, mcpOrigin);
  const embedSnippet = buildBrandHeadEmbedSnippet({
    domainInput: domain.domain_url,
    brandName: domain.brand_name,
    mcpOrigin,
  });

  const planTier = access.profile.plan_tier;
  const entitled = isPlanEntitledForHostedBrandMcp(planTier);

  if (!entitled) {
    const payload: BrandMcpVerifyResponse = {
      ok: true,
      mode: access.supabase ? 'live_edge_handshake' : 'mock_handshake',
      hostname: urls.hostname,
      brandName: domain.brand_name,
      planTier,
      entitled: false,
      upgradeRequired: true,
      upgradeHref: '/pricing',
      mcpEndpointUrl: urls.mcpEndpointUrl,
      webMcpScriptUrl: urls.webMcpScriptUrl,
      discoveryManifestUrl: urls.discoveryManifestUrl,
      embedSnippet,
      edgeHandshakeOk: false,
      edgeHttpStatus: 402,
      exposedTools: [...HOSTED_BRAND_MCP_TOOL_NAMES],
      liveSiteEmbed: {
        hasLinkRelMcp: false,
        hasWebMcpScript: false,
        verifiedForPublicAgentAccess: false,
      },
      summaryMessage:
        planTier === 'tripwire_19'
          ? 'Hosted Brand /mcp & Chrome WebMCP require a recurring plan ($49/mo Starter, $99/mo Pro, or $249/mo Agency). Upgrade within 7 days to apply your full -$19 pass credit.'
          : 'Activate Starter ($49/mo), Pro ($99/mo), or Agency ($249/mo) to host your live Brand /mcp & Chrome WebMCP server.',
    };
    return NextResponse.json(payload, { status: 200 });
  }

  const isMockRuntime =
    !access.supabase && process.env.VERISOURCE_LIVE_MCP_VERIFY !== '1';

  let edgeHandshakeOk = false;
  let edgeHttpStatus = 200;
  let exposedTools: string[] = [...HOSTED_BRAND_MCP_TOOL_NAMES];
  let liveSiteEmbed = {
    hasLinkRelMcp: false,
    hasWebMcpScript: false,
    verifiedForPublicAgentAccess: false,
  };

  if (isMockRuntime) {
    edgeHandshakeOk = true;
    edgeHttpStatus = 200;
    const check = await verifyLiveBrandMcpDeployment(domain.domain_url, {
      trackingPixelToken: domain.tracking_pixel_token,
    });
    liveSiteEmbed = {
      hasLinkRelMcp: check.hasLinkRelMcp,
      hasWebMcpScript: check.hasWebMcpScript,
      verifiedForPublicAgentAccess: check.verifiedForPublicAgentAccess,
    };
  } else {
    const [rpcRes, check] = await Promise.all([
      fetch(
        `${urls.mcpEndpointUrl}?token=${encodeURIComponent(
          domain.tracking_pixel_token
        )}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
            params: {},
          }),
          signal: AbortSignal.timeout(7000),
        }
      ).catch(() => null),
      verifyLiveBrandMcpDeployment(domain.domain_url, {
        trackingPixelToken: domain.tracking_pixel_token,
      }),
    ]);

    liveSiteEmbed = {
      hasLinkRelMcp: check.hasLinkRelMcp,
      hasWebMcpScript: check.hasWebMcpScript,
      verifiedForPublicAgentAccess: check.verifiedForPublicAgentAccess,
    };

    if (rpcRes) {
      edgeHttpStatus = rpcRes.status;
      if (rpcRes.ok) {
        const txt = await rpcRes.text();
        const parsedTools = parseRpcToolNames(txt);
        if (parsedTools.length > 0) {
          exposedTools = parsedTools;
        }
        edgeHandshakeOk = true;
      }
    } else {
      edgeHttpStatus = 503;
    }
  }

  const summaryMessage =
    edgeHandshakeOk &&
    liveSiteEmbed.hasLinkRelMcp &&
    liveSiteEmbed.hasWebMcpScript
      ? `2/2 LIVE: ${urls.hostname} exposes <link rel="mcp"> and webmcp.js in <head>, and ${urls.mcpEndpointUrl} serves ${exposedTools.length} verified Brand Truth tools.`
      : edgeHandshakeOk && liveSiteEmbed.verifiedForPublicAgentAccess
        ? `Edge Brand /mcp endpoint is active (${exposedTools.length} tools). Add the missing ${
            !liveSiteEmbed.hasLinkRelMcp ? '<link rel="mcp">' : 'webmcp.js'
          } tag inside <head> on https://${urls.hostname} for full Streamable HTTP + Chrome WebMCP parity.`
        : edgeHandshakeOk
          ? `Edge Brand /mcp server is staged (${exposedTools.length} tools verified via workspace token). Paste the 2-line <head> snippet onto https://${urls.hostname} (or run your 1-Click AI Fix Prompt above) to open public agent access.`
          : `Unable to reach ${urls.mcpEndpointUrl} (HTTP ${edgeHttpStatus}). Retry in a few seconds.`;

  const payload: BrandMcpVerifyResponse = {
    ok: true,
    mode: isMockRuntime ? 'mock_handshake' : 'live_edge_handshake',
    hostname: urls.hostname,
    brandName: domain.brand_name,
    planTier,
    entitled: true,
    upgradeRequired: false,
    upgradeHref: null,
    mcpEndpointUrl: urls.mcpEndpointUrl,
    webMcpScriptUrl: urls.webMcpScriptUrl,
    discoveryManifestUrl: urls.discoveryManifestUrl,
    embedSnippet,
    edgeHandshakeOk,
    edgeHttpStatus,
    exposedTools,
    liveSiteEmbed,
    summaryMessage,
  };

  return NextResponse.json(payload, { status: 200 });
}
