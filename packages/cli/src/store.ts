import fs from 'node:fs';
import path from 'node:path';

export interface StoredHandleItem {
  handle: string;
  kind:
    | 'hallucination'
    | 'bot_waf'
    | 'page_error'
    | 'broken_link'
    | 'dead_anchor'
    | 'broken_asset'
    | 'ai_readability'
    | 'network'
    | 'backend_log'
    | 'element'
    | 'xray_gap'
    | 'scorecard_gap'
    | 'matchup_gap';
  severity: 'critical' | 'warn' | 'info';
  summary: string;
  url?: string;
  httpStatus?: number | null;
  detail?: Record<string, unknown>;
  fixHint?: string;
}

export interface LastRunLedger {
  runId: string;
  command: string;
  target: string;
  startedAt: string;
  finishedAt: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  handles: StoredHandleItem[];
}

export interface LocalProviderConfig {
  verisourceCloud?: {
    apiKey: string;
    apiOrigin?: string;
  };
  vercel?: {
    token: string;
    projectId?: string;
    teamId?: string;
  };
  supabase?: {
    accessToken: string;
    projectRef: string;
  };
  cloudflare?: {
    apiToken: string;
    accountId: string;
    scriptName?: string;
  };
}

export interface ChecksPolicyFile {
  domain: string;
  minVisibilityScore: number;
  requireLlmsTxt: boolean;
  requireAgentsMd: boolean;
  minJsonLdNodes: number;
  allowDeadAnchors: boolean;
  allowBrokenLinks: boolean;
}

export function ensureVerisourceWorkspaceDir(cwd: string = process.cwd()): string {
  const dir = path.resolve(cwd, '.verisource');
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, 'workflows'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'artifacts'), { recursive: true });

  // Protect local secrets & ephemeral run logs from accidental git commits
  const localGitignore = path.join(dir, '.gitignore');
  if (!fs.existsSync(localGitignore)) {
    fs.writeFileSync(
      localGitignore,
      [
        '# Local-only Verisource secrets, cookies, and ephemeral run ledgers',
        'config.json',
        'last-run.json',
        'last-map.json',
        'browser-session.json',
        'artifacts/',
        '',
      ].join('\n'),
      'utf8'
    );
  }
  return dir;
}

export function saveLastRunLedger(
  ledger: LastRunLedger,
  cwd: string = process.cwd()
): void {
  const dir = ensureVerisourceWorkspaceDir(cwd);
  fs.writeFileSync(
    path.join(dir, 'last-run.json'),
    JSON.stringify(ledger, null, 2),
    'utf8'
  );
}

export function loadLastRunLedger(
  cwd: string = process.cwd()
): LastRunLedger | null {
  const filePath = path.resolve(cwd, '.verisource', 'last-run.json');
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as LastRunLedger;
  } catch {
    return null;
  }
}

export function findStoredHandle(
  handleId: string,
  cwd: string = process.cwd()
): StoredHandleItem | null {
  const ledger = loadLastRunLedger(cwd);
  if (!ledger) return null;
  const clean = handleId.replace(/^\[|\]$/g, '').trim().toLowerCase();
  return (
    ledger.handles.find((h) => h.handle.toLowerCase() === clean) ?? null
  );
}

export function queryStoredHandles(
  queryText: string,
  cwd: string = process.cwd()
): StoredHandleItem[] {
  const ledger = loadLastRunLedger(cwd);
  if (!ledger) return [];
  const needle = queryText.trim().toLowerCase();
  if (!needle) return ledger.handles;

  return ledger.handles.filter((item) => {
    const haystack = JSON.stringify(item).toLowerCase();
    return haystack.includes(needle);
  });
}

export function loadLocalProviderConfig(
  cwd: string = process.cwd()
): LocalProviderConfig {
  const filePath = path.resolve(cwd, '.verisource', 'config.json');
  let diskConfig: LocalProviderConfig = {};
  if (fs.existsSync(filePath)) {
    try {
      diskConfig = JSON.parse(
        fs.readFileSync(filePath, 'utf8')
      ) as LocalProviderConfig;
    } catch {
      diskConfig = {};
    }
  }

  return {
    verisourceCloud:
      diskConfig.verisourceCloud ??
      (process.env.VERISOURCE_API_KEY
        ? {
            apiKey: process.env.VERISOURCE_API_KEY,
            apiOrigin: process.env.VERISOURCE_API_ORIGIN,
          }
        : undefined),
    vercel: diskConfig.vercel ?? (process.env.VERCEL_TOKEN
      ? {
          token: process.env.VERCEL_TOKEN,
          projectId: process.env.VERCEL_PROJECT_ID,
          teamId: process.env.VERCEL_TEAM_ID,
        }
      : undefined),
    supabase: diskConfig.supabase ?? (process.env.SUPABASE_ACCESS_TOKEN &&
    process.env.SUPABASE_PROJECT_REF
      ? {
          accessToken: process.env.SUPABASE_ACCESS_TOKEN,
          projectRef: process.env.SUPABASE_PROJECT_REF,
        }
      : undefined),
    cloudflare: diskConfig.cloudflare ?? (process.env.CLOUDFLARE_API_TOKEN &&
    process.env.CLOUDFLARE_ACCOUNT_ID
      ? {
          apiToken: process.env.CLOUDFLARE_API_TOKEN,
          accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
          scriptName: process.env.CLOUDFLARE_SCRIPT_NAME,
        }
      : undefined),
  };
}

export function saveLocalProviderConfig(
  config: LocalProviderConfig,
  cwd: string = process.cwd()
): string {
  const dir = ensureVerisourceWorkspaceDir(cwd);
  const filePath = path.join(dir, 'config.json');
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
  return filePath;
}

export function loadOrInitChecksPolicy(
  domain: string,
  initIfMissing: boolean,
  cwd: string = process.cwd()
): ChecksPolicyFile {
  const dir = ensureVerisourceWorkspaceDir(cwd);
  const filePath = path.join(dir, 'checks.json');
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ChecksPolicyFile;
    } catch {
      // Fall through to default
    }
  }

  const defaults: ChecksPolicyFile = {
    domain,
    minVisibilityScore: 55,
    requireLlmsTxt: true,
    requireAgentsMd: true,
    minJsonLdNodes: 2,
    allowDeadAnchors: false,
    allowBrokenLinks: false,
  };

  if (initIfMissing) {
    fs.writeFileSync(filePath, JSON.stringify(defaults, null, 2), 'utf8');
  }
  return defaults;
}
