import { NextResponse } from 'next/server';
import { generateMcpApiKey, type McpApiKeyRow } from '@verisource/core-geo';
import {
  getLocalMockStore,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function signHandoffPayload(
  claims: Record<string, unknown>,
  secret: string
): Promise<string> {
  const payloadB64 = toBase64Url(
    new TextEncoder().encode(JSON.stringify(claims))
  );
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadB64)
  );
  return `${payloadB64}.${toBase64Url(new Uint8Array(sig))}`;
}

function isAllowedMcpReturnTo(rawReturnTo: string): URL | null {
  try {
    const parsed = new URL(rawReturnTo);
    if (parsed.pathname !== '/oauth/authorize') return null;
    if (parsed.origin === 'https://mcp.verisource.dev') return parsed;
    if (
      parsed.origin === 'http://localhost:8787' ||
      parsed.origin === 'http://127.0.0.1:8787'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const reqUrl = new URL(request.url);
  const rawReturnTo = (reqUrl.searchParams.get('return_to') ?? '').trim();
  const returnToUrl = isAllowedMcpReturnTo(rawReturnTo);

  if (!returnToUrl) {
    return NextResponse.json(
      {
        error: 'INVALID_OAUTH_RETURN_TO',
        message:
          'return_to must point to https://mcp.verisource.dev/oauth/authorize.',
      },
      { status: 400 }
    );
  }

  const clientId = (returnToUrl.searchParams.get('client_id') ?? 'mcp_client').trim();
  const redirectUri = (returnToUrl.searchParams.get('redirect_uri') ?? '').trim();
  const codeChallenge = (returnToUrl.searchParams.get('code_challenge') ?? '').trim();

  if (!redirectUri || !codeChallenge) {
    return NextResponse.json(
      {
        error: 'MISSING_PKCE_PARAMS',
        message: 'redirect_uri and code_challenge are required on return_to.',
      },
      { status: 400 }
    );
  }

  const access = await resolveConsoleRequestAccess(request);
  if (access.status === 'unauthenticated') {
    const loginUrl = new URL('/login', reqUrl.origin);
    loginUrl.searchParams.set('next', `${reqUrl.pathname}${reqUrl.search}`);
    return NextResponse.redirect(loginUrl, 302);
  }

  const planTier = access.profile.plan_tier;
  const isPaidMcpTier = planTier === 'pro_99' || planTier === 'agency_249';

  let tokenForConnector = 'vs_oauth_preview_free';

  if (isPaidMcpTier) {
    if (access.supabase) {
      const minted = await generateMcpApiKey();
      const row: McpApiKeyRow = {
        id: crypto.randomUUID(),
        user_id: access.profile.id,
        key_hash: minted.keyHash,
        key_prefix: minted.keyPrefix,
        label: 'OAuth Connector (Claude / ChatGPT)',
        last_used_at: null,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      const { error } = await access.supabase.from('mcp_api_keys').insert(row);
      if (!error) {
        tokenForConnector = minted.rawKey;
      }
    } else {
      const store = getLocalMockStore();
      const minted = await generateMcpApiKey();
      store.mcpApiKeys.unshift({
        id: crypto.randomUUID(),
        user_id: access.profile.id,
        key_hash: minted.keyHash,
        key_prefix: minted.keyPrefix,
        label: 'OAuth Connector (Claude / ChatGPT)',
        last_used_at: null,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      tokenForConnector = 'vs_demo_pro_key';
    }
  }

  const secret =
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim() ||
    'vs-local-mock-oauth-handoff-secret-v1';

  const handoff = await signHandoffPayload(
    {
      token: tokenForConnector,
      email: access.profile.email,
      planTier,
      clientId,
      redirectUri,
      codeChallenge,
      exp: Date.now() + 90_000,
    },
    secret
  );

  returnToUrl.searchParams.set('handoff', handoff);
  return NextResponse.redirect(returnToUrl, 302);
}
