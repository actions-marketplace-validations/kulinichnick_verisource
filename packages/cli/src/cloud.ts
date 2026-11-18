import {
  loadLocalProviderConfig,
  saveLocalProviderConfig,
  type StoredHandleItem,
} from './store.js';

export interface CliCloudStatusResponse {
  ok: boolean;
  authenticated: boolean;
  email: string;
  planTier: string;
  keyPrefix: string;
  keyLabel: string;
  trackedDomainCount: number;
  domainCap: number;
  dashboardUrl: string;
}

export interface CliCloudSyncPayload {
  domain: string;
  mode: 'scan' | 'verify';
  status: 'PASS' | 'WARN' | 'FAIL';
  visibilityScore: number;
  llmsTxtStatus: 'present' | 'missing';
  agentsMdStatus: 'missing' | 'default_boilerplate' | 'custom_enriched';
  robotsAiBotStatus: {
    GPTBot: boolean;
    'OAI-SearchBot': boolean;
    PerplexityBot: boolean;
    ClaudeBot: boolean;
    'Google-Extended'?: boolean;
    waf_blocked?: boolean;
  };
  siteHealth?: {
    healthScore: number;
    pagesScanned: number;
    linksChecked: number;
    brokenLinksCount?: number;
    deadAnchorsCount?: number;
  };
  handles: StoredHandleItem[];
  gitMeta?: {
    sha?: string;
    branch?: string;
    repo?: string;
    workflowRunUrl?: string;
  };
}

export interface CliCloudSyncResult {
  ok: boolean;
  synced: boolean;
  autoRegistered: boolean;
  domainId?: string | null;
  hostname: string;
  planTier: string;
  brandTruthVerified?: boolean;
  brandTruthSummary?: string | null;
  dashboardUrl: string;
  reason?: string;
  message?: string;
}

export function resolveVerisourceCloudCredentials(params: {
  explicitApiKey?: string;
  explicitApiOrigin?: string;
  cwd?: string;
}): { apiKey: string | null; apiOrigin: string } {
  const cwd = params.cwd ?? process.cwd();
  const cfg = loadLocalProviderConfig(cwd);
  const rawKey = (
    params.explicitApiKey ??
    process.env.VERISOURCE_API_KEY ??
    cfg.verisourceCloud?.apiKey ??
    ''
  )
    .trim()
    .replace(/^Bearer\s+/i, '')
    .trim();

  const rawOrigin = (
    params.explicitApiOrigin ??
    process.env.VERISOURCE_API_ORIGIN ??
    cfg.verisourceCloud?.apiOrigin ??
    'https://verisource.dev'
  )
    .trim()
    .replace(/\/+$/, '');

  return {
    apiKey: rawKey || null,
    apiOrigin: rawOrigin || 'https://verisource.dev',
  };
}

export function saveVerisourceCloudCredentials(params: {
  apiKey: string;
  apiOrigin?: string;
  cwd?: string;
}): string {
  const cwd = params.cwd ?? process.cwd();
  const existing = loadLocalProviderConfig(cwd);
  return saveLocalProviderConfig(
    {
      ...existing,
      verisourceCloud: {
        apiKey: params.apiKey.trim(),
        ...(params.apiOrigin
          ? { apiOrigin: params.apiOrigin.trim().replace(/\/+$/, '') }
          : {}),
      },
    },
    cwd
  );
}

export function clearVerisourceCloudCredentials(
  cwd: string = process.cwd()
): string {
  const existing = loadLocalProviderConfig(cwd);
  delete existing.verisourceCloud;
  return saveLocalProviderConfig(existing, cwd);
}

export function collectGitEnvironmentMeta(): CliCloudSyncPayload['gitMeta'] {
  const sha = process.env.GITHUB_SHA?.trim() || process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  const branch =
    process.env.GITHUB_REF_NAME?.trim() ||
    process.env.VERCEL_GIT_COMMIT_REF?.trim();
  const repo = process.env.GITHUB_REPOSITORY?.trim();
  const serverUrl = process.env.GITHUB_SERVER_URL?.trim() || 'https://github.com';
  const runId = process.env.GITHUB_RUN_ID?.trim();
  const workflowRunUrl =
    repo && runId ? `${serverUrl}/${repo}/actions/runs/${runId}` : undefined;

  if (!sha && !branch && !repo) return undefined;
  return {
    ...(sha ? { sha } : {}),
    ...(branch ? { branch } : {}),
    ...(repo ? { repo } : {}),
    ...(workflowRunUrl ? { workflowRunUrl } : {}),
  };
}

export async function verifyCliCloudAuth(params: {
  apiKey: string;
  apiOrigin?: string;
}): Promise<CliCloudStatusResponse> {
  const origin = (params.apiOrigin ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const res = await fetch(`${origin}/api/cli/sync`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.apiKey.trim()}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  const body = (await res.json().catch(() => ({}))) as Partial<
    CliCloudStatusResponse & { message?: string; error?: string }
  >;
  if (!res.ok || !body.authenticated) {
    throw new Error(
      body.message ??
        `Cloud authentication failed (HTTP ${res.status} ${body.error ?? ''}).`.trim()
    );
  }
  return body as CliCloudStatusResponse;
}

export async function pushCliRunToCloud(params: {
  apiKey: string;
  apiOrigin?: string;
  payload: CliCloudSyncPayload;
}): Promise<CliCloudSyncResult> {
  const origin = (params.apiOrigin ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const res = await fetch(`${origin}/api/cli/sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey.trim()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(params.payload),
    signal: AbortSignal.timeout(15000),
  });

  const body = (await res.json().catch(() => ({}))) as Partial<
    CliCloudSyncResult & { message?: string; error?: string }
  >;
  if (!res.ok || !body.ok) {
    throw new Error(
      body.message ??
        `Cloud sync failed (HTTP ${res.status} ${body.error ?? ''}).`.trim()
    );
  }
  return body as CliCloudSyncResult;
}
