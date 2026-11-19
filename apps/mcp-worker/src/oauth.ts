import { verifyZeroCreditBearerEntitlement } from './auth.js';
import { deleteCachedKey, getCachedJson, setCachedJson } from './cache.js';
import type { WorkerEnv } from './types.js';

export interface RegisteredOAuthClient {
  client_id: string;
  client_name: string;
  redirect_uris: string[];
  created_at: number;
}

interface StoredAuthorizationCode {
  credential: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  resource: string | null;
  createdAt: number;
}

interface StoredRefreshToken {
  credential: string;
  clientId: string;
  createdAt: number;
}

export interface SignedSessionHandoffClaims {
  token: string;
  email: string;
  planTier: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  exp: number;
}

const EXACT_ALLOWED_REDIRECT_URIS = new Set([
  'https://claude.ai/api/mcp/auth_callback',
  'https://claude.com/api/mcp/auth_callback',
  'https://chatgpt.com/connector_platform_oauth_redirect',
  'https://platform.openai.com/apps-manage/oauth',
  'https://vscode.dev/redirect',
  'https://insiders.vscode.dev/redirect',
]);

export function isAllowedMcpOAuthRedirectUri(rawUri: string): boolean {
  const uri = (rawUri ?? '').trim();
  if (!uri || uri.length > 512 || uri.includes('#')) return false;

  if (EXACT_ALLOWED_REDIRECT_URIS.has(uri)) return true;

  // Dynamic per-session ChatGPT Connector callback URLs
  if (/^https:\/\/chatgpt\.com\/connector\/oauth\/[A-Za-z0-9._-]+$/.test(uri)) {
    return true;
  }

  // Approved desktop IDE deep-link schemes
  if (
    /^(?:cursor|vscode|vscode-insiders|claude|windsurf):\/\/[A-Za-z0-9._~:/?[\]@!$&'()*+,;=%-]+$/.test(
      uri
    )
  ) {
    return true;
  }

  // RFC 8252 loopback HTTP callbacks for local PKCE MCP clients (Claude Code, Cursor, VS Code)
  try {
    const parsed = new URL(uri);
    if (parsed.username || parsed.password) return false;
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost')
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

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

function fromBase64UrlToString(b64url: string): string {
  const padded = b64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function computePkceS256Challenge(
  codeVerifier: string
): Promise<string> {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(new Uint8Array(digest));
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function resolveHandoffSecret(env: WorkerEnv): string {
  const liveKey = (env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  if (liveKey) return liveKey;
  return 'vs-local-mock-oauth-handoff-secret-v1';
}

export async function signOAuthSessionHandoff(
  claims: SignedSessionHandoffClaims,
  secret: string
): Promise<string> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(claims));
  const payloadB64 = toBase64Url(payloadBytes);
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

export async function verifyOAuthSessionHandoff(
  token: string,
  secret: string
): Promise<SignedSessionHandoffClaims | null> {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expectedSigBuf = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadB64)
  );
  const expectedSigB64 = toBase64Url(new Uint8Array(expectedSigBuf));
  if (!constantTimeEquals(sigB64, expectedSigB64)) return null;

  try {
    const parsed = JSON.parse(
      fromBase64UrlToString(payloadB64)
    ) as SignedSessionHandoffClaims;
    if (
      !parsed ||
      typeof parsed.token !== 'string' ||
      typeof parsed.exp !== 'number' ||
      Date.now() > parsed.exp
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildOAuthAuthorizationServerMetadata(origin: string): Record<
  string,
  unknown
> {
  const clean = origin.replace(/\/+$/, '');
  return {
    issuer: clean,
    authorization_endpoint: `${clean}/oauth/authorize`,
    token_endpoint: `${clean}/oauth/token`,
    registration_endpoint: `${clean}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: [
      'none',
      'client_secret_post',
      'client_secret_basic',
    ],
    code_challenge_methods_supported: ['S256'],
    authorization_response_iss_parameter_supported: true,
    scopes_supported: ['mcp:preview', 'mcp:paid'],
    service_documentation: 'https://verisource.dev/mcp-guide',
  };
}

export function buildWwwAuthenticateChallengeResponse(
  origin: string,
  resourcePath: '/mcp' | '/oauth/mcp',
  withCors: (res: Response) => Response
): Response {
  const clean = origin.replace(/\/+$/, '');
  const metaSuffix = resourcePath === '/oauth/mcp' ? '/oauth/mcp' : '';
  const resourceMetadataUrl = `${clean}/.well-known/oauth-protected-resource${metaSuffix}`;
  const res = Response.json(
    {
      error: 'unauthorized',
      error_description:
        'OAuth 2.1 Bearer authorization required. Discover metadata via WWW-Authenticate.',
      resource_metadata: resourceMetadataUrl,
    },
    {
      status: 401,
      headers: {
        'WWW-Authenticate': `Bearer resource_metadata="${resourceMetadataUrl}", scope="mcp:preview mcp:paid"`,
      },
    }
  );
  return withCors(res);
}

export function shouldTriggerOAuthChallengeOnRootMcp(request: Request): boolean {
  const url = new URL(request.url);
  if (url.searchParams.get('oauth') === '1') return true;
  const origin = (request.headers.get('Origin') ?? '').toLowerCase();
  if (
    origin === 'https://claude.ai' ||
    origin === 'https://claude.com' ||
    origin === 'https://chatgpt.com'
  ) {
    return true;
  }
  return false;
}

export async function handleDynamicClientRegistration(
  request: Request,
  env: WorkerEnv,
  withCors: (res: Response) => Response
): Promise<Response> {
  if (request.method !== 'POST') {
    return withCors(
      Response.json({ error: 'method_not_allowed' }, { status: 405 })
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return withCors(
      Response.json(
        {
          error: 'invalid_client_metadata',
          error_description: 'Expected JSON client registration body.',
        },
        { status: 400 }
      )
    );
  }

  const rawUris = body.redirect_uris;
  if (
    !Array.isArray(rawUris) ||
    rawUris.length === 0 ||
    rawUris.length > 10 ||
    !rawUris.every(
      (u) => typeof u === 'string' && isAllowedMcpOAuthRedirectUri(u)
    )
  ) {
    return withCors(
      Response.json(
        {
          error: 'invalid_redirect_uri',
          error_description:
            'Provide 1 to 10 approved MCP client redirect_uris (Claude, ChatGPT, VS Code, Cursor, or localhost loopback).',
        },
        { status: 400 }
      )
    );
  }

  const redirectUris = (rawUris as string[]).map((u) => u.trim());
  const clientName =
    typeof body.client_name === 'string' && body.client_name.trim()
      ? body.client_name.trim().slice(0, 80)
      : 'MCP Connector Client';
  const clientId = `vs_mcp_client_${randomHex(16)}`;
  const issuedAt = Math.floor(Date.now() / 1000);

  const record: RegisteredOAuthClient = {
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
    created_at: issuedAt,
  };

  await setCachedJson(`oauth_client:v1:${clientId}`, record, 86400 * 30, env);

  return withCors(
    Response.json(
      {
        client_id: clientId,
        client_name: clientName,
        client_id_issued_at: issuedAt,
        redirect_uris: redirectUris,
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
      },
      { status: 201 }
    )
  );
}

function renderAuthorizeConsentHtml(params: {
  clientName: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  resource: string;
  handoffToken: string | null;
  verifiedHandoff: SignedSessionHandoffClaims | null;
  oneClickHandoffHref: string;
  appOrigin: string;
  errorBanner?: string | null;
}): string {
  const hostLabel = (() => {
    try {
      return new URL(params.redirectUri).hostname || params.redirectUri.split(':')[0];
    } catch {
      return 'MCP Client';
    }
  })();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Authorize MCP Connector — Verisource</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: #0E1116;
      color: #F3F4F6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .card {
      width: 100%;
      max-width: 460px;
      background: #151A22;
      border: 1px solid #262E3B;
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.45);
    }
    .eyebrow {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #E5A93C;
      margin-bottom: 8px;
    }
    h1 {
      margin: 0 0 8px 0;
      font-size: 21px;
      line-height: 1.25;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0 0 18px 0;
      font-size: 13.5px;
      line-height: 1.55;
      color: #9CA3AF;
    }
    .btn-primary {
      display: block;
      width: 100%;
      padding: 11px 16px;
      border-radius: 8px;
      border: 1px solid #E5A93C;
      background: #E5A93C;
      color: #0E1116;
      font-weight: 700;
      font-size: 13.5px;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
    }
    .btn-secondary {
      display: block;
      width: 100%;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #333D4E;
      background: #1B222D;
      color: #F3F4F6;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .input {
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #2E3746;
      background: #0E1116;
      color: #F3F4F6;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12.5px;
      margin-bottom: 10px;
    }
    .divider {
      margin: 18px 0;
      border-top: 1px solid #262E3B;
      position: relative;
      text-align: center;
    }
    .divider span {
      position: relative;
      top: -9px;
      background: #151A22;
      padding: 0 10px;
      font-size: 11px;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .err {
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #7F1D1D;
      background: rgba(127, 29, 29, 0.25);
      color: #FCA5A5;
      font-size: 12.5px;
      margin-bottom: 14px;
    }
    .scope-box {
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #262E3B;
      background: #0E1116;
      font-size: 12px;
      color: #D1D5DB;
      margin-bottom: 18px;
    }
    .meta {
      margin-top: 16px;
      font-size: 11.5px;
      color: #6B7280;
      text-align: center;
    }
    .meta a { color: #E5A93C; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="eyebrow">Verisource · Streamable HTTP OAuth 2.1</div>
    <h1>Connect ${escapeHtml(params.clientName)}</h1>
    <p>Authorize <strong>${escapeHtml(hostLabel ?? 'MCP Client')}</strong> to invoke Verisource GEO &amp; Citation Intelligence MCP tools using PKCE S256.</p>
    ${
      params.errorBanner
        ? `<div class="err">${escapeHtml(params.errorBanner)}</div>`
        : ''
    }
    <div class="scope-box">
      <strong>Requested Permissions:</strong> Scan AI readiness, inspect citation gaps &amp; query fanouts, verify Brand Truth claims, and generate syntax-validated GEO fixes. Revocable anytime in Console Step 03.
    </div>
    ${
      params.verifiedHandoff && params.handoffToken
        ? `<form method="POST" action="/oauth/authorize">
            <input type="hidden" name="client_id" value="${escapeHtml(params.clientId)}" />
            <input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirectUri)}" />
            <input type="hidden" name="state" value="${escapeHtml(params.state)}" />
            <input type="hidden" name="code_challenge" value="${escapeHtml(params.codeChallenge)}" />
            <input type="hidden" name="code_challenge_method" value="S256" />
            <input type="hidden" name="resource" value="${escapeHtml(params.resource)}" />
            <input type="hidden" name="handoff" value="${escapeHtml(params.handoffToken)}" />
            <button type="submit" class="btn-primary">Approve as ${escapeHtml(params.verifiedHandoff.email)} (${escapeHtml(params.verifiedHandoff.planTier.toUpperCase())}) →</button>
          </form>`
        : `<a class="btn-primary" href="${escapeHtml(params.oneClickHandoffHref)}">1-Click Sign In with Verisource Account →</a>`
    }
    <div class="divider"><span>Or Authorize With Workspace Key</span></div>
    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${escapeHtml(params.clientId)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirectUri)}" />
      <input type="hidden" name="state" value="${escapeHtml(params.state)}" />
      <input type="hidden" name="code_challenge" value="${escapeHtml(params.codeChallenge)}" />
      <input type="hidden" name="code_challenge_method" value="S256" />
      <input type="hidden" name="resource" value="${escapeHtml(params.resource)}" />
      <input type="password" name="api_key" class="input" placeholder="vs_live_... (or leave blank for Free Preview)" autocomplete="off" />
      <button type="submit" class="btn-secondary">Authorize Connector</button>
    </form>
    <div class="meta">Need a Pro or Agency workspace? <a href="${escapeHtml(params.appOrigin)}/pricing" target="_blank" rel="noopener">Start $0 7-day trial</a></div>
  </div>
</body>
</html>`;
}

export async function handleOAuthAuthorize(
  request: Request,
  env: WorkerEnv
): Promise<Response> {
  const url = new URL(request.url);
  const appOrigin = (env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const handoffSecret = resolveHandoffSecret(env);

  if (request.method === 'GET') {
    const responseType = (url.searchParams.get('response_type') ?? 'code').trim();
    const clientId = (url.searchParams.get('client_id') ?? 'mcp_client').trim();
    const redirectUri = (url.searchParams.get('redirect_uri') ?? '').trim();
    const state = url.searchParams.get('state') ?? '';
    const codeChallenge = (url.searchParams.get('code_challenge') ?? '').trim();
    const codeChallengeMethod = (
      url.searchParams.get('code_challenge_method') ?? 'S256'
    ).trim();
    const resource = url.searchParams.get('resource') ?? '';
    const handoffParam = url.searchParams.get('handoff');

    if (responseType !== 'code') {
      return Response.json(
        { error: 'unsupported_response_type', error_description: 'Use response_type=code.' },
        { status: 400 }
      );
    }

    if (!isAllowedMcpOAuthRedirectUri(redirectUri)) {
      return Response.json(
        {
          error: 'invalid_redirect_uri',
          error_description: 'Unapproved redirect_uri for MCP OAuth 2.1.',
        },
        { status: 400 }
      );
    }

    const registered = await getCachedJson<RegisteredOAuthClient>(
      `oauth_client:v1:${clientId}`,
      env
    );
    if (registered && !registered.redirect_uris.includes(redirectUri)) {
      return Response.json(
        {
          error: 'invalid_redirect_uri',
          error_description: 'redirect_uri does not match registered DCR client.',
        },
        { status: 400 }
      );
    }

    if (
      codeChallengeMethod !== 'S256' ||
      !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)
    ) {
      return Response.json(
        {
          error: 'invalid_request',
          error_description: 'PKCE code_challenge with code_challenge_method=S256 is required.',
        },
        { status: 400 }
      );
    }

    let verifiedHandoff: SignedSessionHandoffClaims | null = null;
    if (handoffParam) {
      const claims = await verifyOAuthSessionHandoff(handoffParam, handoffSecret);
      if (
        claims &&
        claims.clientId === clientId &&
        claims.redirectUri === redirectUri &&
        claims.codeChallenge === codeChallenge
      ) {
        verifiedHandoff = claims;
      }
    }

    const returnUrl = new URL(request.url);
    returnUrl.searchParams.delete('handoff');
    const oneClickHandoffHref = `${appOrigin}/api/oauth/session-handoff?return_to=${encodeURIComponent(
      returnUrl.toString()
    )}`;

    const html = renderAuthorizeConsentHtml({
      clientName: registered?.client_name ?? 'AI Assistant Connector',
      clientId,
      redirectUri,
      state,
      codeChallenge,
      resource,
      handoffToken: verifiedHandoff ? handoffParam : null,
      verifiedHandoff,
      oneClickHandoffHref,
      appOrigin,
    });

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Frame-Options': 'DENY',
      },
    });
  }

  if (request.method === 'POST') {
    const form = await request.formData();
    const clientId = String(form.get('client_id') ?? 'mcp_client').trim();
    const redirectUri = String(form.get('redirect_uri') ?? '').trim();
    const state = String(form.get('state') ?? '');
    const codeChallenge = String(form.get('code_challenge') ?? '').trim();
    const codeChallengeMethod = String(
      form.get('code_challenge_method') ?? 'S256'
    ).trim();
    const resource = String(form.get('resource') ?? '').trim();
    const handoffToken = String(form.get('handoff') ?? '').trim();
    const rawApiKey = String(form.get('api_key') ?? '')
      .trim()
      .replace(/^Bearer\s+/i, '')
      .trim();

    if (
      !isAllowedMcpOAuthRedirectUri(redirectUri) ||
      codeChallengeMethod !== 'S256' ||
      !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)
    ) {
      return Response.json({ error: 'invalid_request' }, { status: 400 });
    }

    const registered = await getCachedJson<RegisteredOAuthClient>(
      `oauth_client:v1:${clientId}`,
      env
    );
    if (registered && !registered.redirect_uris.includes(redirectUri)) {
      return Response.json({ error: 'invalid_redirect_uri' }, { status: 400 });
    }

    let credential = 'vs_oauth_preview_free';

    if (handoffToken) {
      const claims = await verifyOAuthSessionHandoff(
        handoffToken,
        handoffSecret
      );
      if (
        !claims ||
        claims.clientId !== clientId ||
        claims.redirectUri !== redirectUri ||
        claims.codeChallenge !== codeChallenge
      ) {
        return Response.json(
          { error: 'access_denied', error_description: 'Expired or invalid session handoff.' },
          { status: 400 }
        );
      }
      credential = claims.token;
    } else if (rawApiKey) {
      const okKey = await verifyZeroCreditBearerEntitlement({
        rawBearerToken: rawApiKey,
        env,
      });
      if (!okKey) {
        const returnUrl = new URL(`${url.origin}/oauth/authorize`);
        returnUrl.searchParams.set('response_type', 'code');
        returnUrl.searchParams.set('client_id', clientId);
        returnUrl.searchParams.set('redirect_uri', redirectUri);
        if (state) returnUrl.searchParams.set('state', state);
        returnUrl.searchParams.set('code_challenge', codeChallenge);
        returnUrl.searchParams.set('code_challenge_method', 'S256');

        const html = renderAuthorizeConsentHtml({
          clientName: registered?.client_name ?? 'AI Assistant Connector',
          clientId,
          redirectUri,
          state,
          codeChallenge,
          resource,
          handoffToken: null,
          verifiedHandoff: null,
          oneClickHandoffHref: `${appOrigin}/api/oauth/session-handoff?return_to=${encodeURIComponent(
            returnUrl.toString()
          )}`,
          appOrigin,
          errorBanner:
            'Unrecognized or inactive vs_live_ key. Sign in with your Verisource account above or leave blank for Free Preview mode.',
        });
        return new Response(html, {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
        });
      }
      credential = rawApiKey;
    }

    const code = `vs_code_${randomHex(24)}`;
    const storedCode: StoredAuthorizationCode = {
      credential,
      clientId,
      redirectUri,
      codeChallenge,
      resource: resource || null,
      createdAt: Date.now(),
    };
    await setCachedJson(`oauth_code:v1:${code}`, storedCode, 300, env);

    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set('code', code);
    if (state) callbackUrl.searchParams.set('state', state);
    // RFC 9207 issuer identification required by ChatGPT Connectors
    callbackUrl.searchParams.set('iss', url.origin);

    return new Response(null, {
      status: 302,
      headers: {
        Location: callbackUrl.toString(),
        'Cache-Control': 'no-store',
      },
    });
  }

  return Response.json({ error: 'method_not_allowed' }, { status: 405 });
}

async function parseTokenRequestParams(
  request: Request
): Promise<Record<string, string>> {
  const ct = (request.headers.get('content-type') ?? '').toLowerCase();
  if (ct.includes('application/json')) {
    const json = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(json)) {
      if (typeof v === 'string') out[k] = v;
    }
    return out;
  }

  const text = await request.text();
  const sp = new URLSearchParams(text);
  const out: Record<string, string> = {};
  for (const [k, v] of sp.entries()) {
    out[k] = v;
  }
  return out;
}

export async function handleOAuthToken(
  request: Request,
  env: WorkerEnv,
  withCors: (res: Response) => Response
): Promise<Response> {
  if (request.method !== 'POST') {
    return withCors(
      Response.json({ error: 'method_not_allowed' }, { status: 405 })
    );
  }

  const params = await parseTokenRequestParams(request);
  const grantType = (params.grant_type ?? '').trim();

  if (grantType === 'authorization_code') {
    const code = (params.code ?? '').trim();
    const codeVerifier = (params.code_verifier ?? '').trim();
    const redirectUri = (params.redirect_uri ?? '').trim();

    if (!code || !codeVerifier) {
      return withCors(
        Response.json(
          {
            error: 'invalid_request',
            error_description: 'code and PKCE code_verifier are required.',
          },
          { status: 400 }
        )
      );
    }

    const codeKey = `oauth_code:v1:${code}`;
    const stored = await getCachedJson<StoredAuthorizationCode>(codeKey, env);
    // Single-use enforcement: delete immediately before checking
    await deleteCachedKey(codeKey, env);

    if (!stored || Date.now() - stored.createdAt > 300_000) {
      return withCors(
        Response.json(
          { error: 'invalid_grant', error_description: 'Expired or already-used authorization code.' },
          { status: 400 }
        )
      );
    }

    if (redirectUri && redirectUri !== stored.redirectUri) {
      return withCors(
        Response.json(
          { error: 'invalid_grant', error_description: 'redirect_uri mismatch.' },
          { status: 400 }
        )
      );
    }

    const computedChallenge = await computePkceS256Challenge(codeVerifier);
    if (!constantTimeEquals(computedChallenge, stored.codeChallenge)) {
      return withCors(
        Response.json(
          { error: 'invalid_grant', error_description: 'PKCE S256 verification failed.' },
          { status: 400 }
        )
      );
    }

    const refreshToken = `vs_rt_${randomHex(24)}`;
    const rtRecord: StoredRefreshToken = {
      credential: stored.credential,
      clientId: stored.clientId,
      createdAt: Date.now(),
    };
    await setCachedJson(`oauth_rt:v1:${refreshToken}`, rtRecord, 86400 * 30, env);

    return withCors(
      Response.json(
        {
          access_token: stored.credential,
          token_type: 'Bearer',
          expires_in: 86400,
          refresh_token: refreshToken,
          scope:
            stored.credential === 'vs_oauth_preview_free'
              ? 'mcp:preview'
              : 'mcp:preview mcp:paid',
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
            Pragma: 'no-cache',
          },
        }
      )
    );
  }

  if (grantType === 'refresh_token') {
    const incomingRt = (params.refresh_token ?? '').trim();
    if (!incomingRt) {
      return withCors(
        Response.json({ error: 'invalid_request' }, { status: 400 })
      );
    }

    const rtKey = `oauth_rt:v1:${incomingRt}`;
    const storedRt = await getCachedJson<StoredRefreshToken>(rtKey, env);
    await deleteCachedKey(rtKey, env);

    if (!storedRt) {
      return withCors(
        Response.json({ error: 'invalid_grant' }, { status: 400 })
      );
    }

    const nextRt = `vs_rt_${randomHex(24)}`;
    await setCachedJson(
      `oauth_rt:v1:${nextRt}`,
      { ...storedRt, createdAt: Date.now() },
      86400 * 30,
      env
    );

    return withCors(
      Response.json(
        {
          access_token: storedRt.credential,
          token_type: 'Bearer',
          expires_in: 86400,
          refresh_token: nextRt,
          scope:
            storedRt.credential === 'vs_oauth_preview_free'
              ? 'mcp:preview'
              : 'mcp:preview mcp:paid',
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
            Pragma: 'no-cache',
          },
        }
      )
    );
  }

  return withCors(
    Response.json({ error: 'unsupported_grant_type' }, { status: 400 })
  );
}
