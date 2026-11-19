import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = path.resolve(__dirname, '../..');
const DRIVE_OPS_ROOT = 'g:\\My Drive\\GEO MCP Engine';
const ACTIVE_OPS_DIR = fs.existsSync(path.join(DRIVE_OPS_ROOT, 'growth_ops'))
  ? path.join(DRIVE_OPS_ROOT, 'growth_ops')
  : path.join(MONOREPO_ROOT, 'growth_ops');
const MIRROR_OPS_DIR = path.join(MONOREPO_ROOT, 'growth_ops');

const envLocalPath = path.join(MONOREPO_ROOT, 'apps/web/.env.local');
if (fs.existsSync(envLocalPath)) {
  for (const rawLine of fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

function mirrorFileIfNeeded(relPath, content) {
  const primaryPath = path.join(ACTIVE_OPS_DIR, relPath);
  fs.mkdirSync(path.dirname(primaryPath), { recursive: true });
  fs.writeFileSync(primaryPath, content, 'utf8');
  if (path.resolve(ACTIVE_OPS_DIR) !== path.resolve(MIRROR_OPS_DIR)) {
    const mirrorPath = path.join(MIRROR_OPS_DIR, relPath);
    fs.mkdirSync(path.dirname(mirrorPath), { recursive: true });
    fs.writeFileSync(mirrorPath, content, 'utf8');
  }
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function loadGscServiceAccount() {
  const rawJson = (process.env.GSC_SERVICE_ACCOUNT_JSON ?? '').trim();
  if (rawJson) {
    try {
      return JSON.parse(rawJson);
    } catch {
      return null;
    }
  }
  const keyPath = (process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '').trim();
  if (keyPath && fs.existsSync(keyPath)) {
    try {
      return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    } catch {
      return null;
    }
  }
  return null;
}

async function getGoogleAccessToken(serviceAccount) {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: nowSec + 3600,
      iat: nowSec,
    })
  );
  const unsigned = `${header}.${claimSet}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer
    .sign(serviceAccount.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google OAuth failed (${res.status}): ${errText.slice(0, 180)}`);
  }
  const json = await res.json();
  return json.access_token;
}

async function queryGscPerformance(accessToken, siteUrl) {
  const endDate = new Date(Date.now() - 2 * 86400 * 1000).toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10);

  const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl
  )}/searchAnalytics/query`;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['page', 'query'],
      rowLimit: 250,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`GSC query failed (${res.status}): ${errText.slice(0, 180)}`);
  }
  const json = await res.json();
  return {
    startDate,
    endDate,
    rows: Array.isArray(json.rows) ? json.rows : [],
  };
}

function loadPublishedReportsAndMatchups() {
  const reportsPath = path.join(
    MONOREPO_ROOT,
    'apps/web/src/data/published-reports.json'
  );
  const matchupsPath = path.join(
    MONOREPO_ROOT,
    'apps/web/src/lib/published-matchups.ts'
  );

  const reports = fs.existsSync(reportsPath)
    ? JSON.parse(fs.readFileSync(reportsPath, 'utf8')).reports ?? []
    : [];

  const matchupDomains = new Set();
  const matchupSlugs = [];
  if (fs.existsSync(matchupsPath)) {
    const src = fs.readFileSync(matchupsPath, 'utf8');
    const regex = /domainA:\s*'([^']+)'[\s\S]*?domainB:\s*'([^']+)'/g;
    let m;
    while ((m = regex.exec(src)) !== null) {
      matchupDomains.add(m[1].toLowerCase());
      matchupDomains.add(m[2].toLowerCase());
      const slug = `${m[1].replace(/[^a-z0-9]+/gi, '-')}-vs-${m[2].replace(
        /[^a-z0-9]+/gi,
        '-'
      )}`.toLowerCase();
      matchupSlugs.push(slug);
    }
  }

  return { reports, matchupDomains, matchupSlugs };
}

async function pingIndexNow(urls) {
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  const appOrigin = (
    process.env.NEXT_PUBLIC_APP_URL &&
    !/localhost|127\.0\.0\.1/i.test(process.env.NEXT_PUBLIC_APP_URL)
      ? process.env.NEXT_PUBLIC_APP_URL
      : 'https://verisource.dev'
  ).replace(/\/+$/, '');

  if (!serviceKey) {
    return { submitted: false, reason: 'MISSING_SUPABASE_SERVICE_ROLE_KEY' };
  }

  const batch = urls.slice(0, 80);
  const res = await fetch(`${appOrigin}/api/indexnow`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ urls: batch }),
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text().catch(() => '');
  return {
    submitted: res.ok,
    status: res.status,
    count: batch.length,
    detail: text.slice(0, 220),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const shouldPingIndexNow = args.includes('--ping-indexnow');
  const nowIso = new Date().toISOString();
  const gscSiteUrl = (process.env.GSC_SITE_URL ?? 'sc-domain:verisource.dev').trim();

  const { reports, matchupDomains, matchupSlugs } = loadPublishedReportsAndMatchups();

  // Compute vertical & protocol breakdowns
  const totalReports = reports.length;
  const meanScore =
    totalReports > 0
      ? Number(
          (
            reports.reduce((acc, r) => acc + Number(r.readinessScore ?? 0), 0) /
            totalReports
          ).toFixed(1)
        )
      : 0;
  const wafBlockedCount = reports.filter(
    (r) =>
      r.robotsAiBotStatus?.waf_blocked ||
      !r.robotsAiBotStatus?.GPTBot ||
      !r.robotsAiBotStatus?.PerplexityBot
  ).length;
  const customAgentsCount = reports.filter(
    (r) => r.agentsMdStatus === 'custom_enriched'
  ).length;

  // High-contrast viral teardown candidates (low score, recognizable brands)
  const teardownCandidates = [...reports]
    .filter((r) => Number(r.readinessScore ?? 100) <= 44)
    .sort((a, b) => Number(a.readinessScore) - Number(b.readinessScore))
    .slice(0, 15);

  // Reports not yet paired into a /vs/[matchup] page
  const unpairedReports = reports
    .filter((r) => !matchupDomains.has(String(r.domain).toLowerCase()))
    .slice(0, 20);

  // Attempt Live Google Search Console query if service account configured
  let gscMode = 'INDEX_AUDIT_FALLBACK (add GSC_SERVICE_ACCOUNT_JSON secret to enable live striking-distance queries)';
  let strikingDistance = [];
  let topQueries = [];

  const serviceAccount = loadGscServiceAccount();
  if (serviceAccount?.client_email && serviceAccount?.private_key) {
    try {
      const token = await getGoogleAccessToken(serviceAccount);
      const data = await queryGscPerformance(token, gscSiteUrl);
      gscMode = `LIVE_GSC (${data.startDate} -> ${data.endDate} · ${data.rows.length} rows)`;

      strikingDistance = data.rows
        .filter((r) => r.position >= 5 && r.position <= 25 && r.impressions >= 5)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 20)
        .map((r) => ({
          page: r.keys?.[0] ?? '',
          query: r.keys?.[1] ?? '',
          impressions: r.impressions ?? 0,
          clicks: r.clicks ?? 0,
          ctr: Number(((r.ctr ?? 0) * 100).toFixed(2)),
          position: Number((r.position ?? 0).toFixed(1)),
        }));

      topQueries = [...data.rows]
        .sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0) || (b.impressions ?? 0) - (a.impressions ?? 0))
        .slice(0, 15)
        .map((r) => ({
          page: r.keys?.[0] ?? '',
          query: r.keys?.[1] ?? '',
          impressions: r.impressions ?? 0,
          clicks: r.clicks ?? 0,
          position: Number((r.position ?? 0).toFixed(1)),
        }));
    } catch (err) {
      gscMode = `GSC_AUTH_ERROR (${err instanceof Error ? err.message : String(err)})`;
    }
  }

  // Priority URLs to refresh via Bing IndexNow (ChatGPT Search instant crawl)
  const priorityUrls = Array.from(
    new Set([
      'https://verisource.dev/',
      'https://verisource.dev/benchmarks/ai-search-readiness-2026',
      'https://verisource.dev/reports',
      'https://verisource.dev/vs',
      'https://verisource.dev/tools',
      'https://verisource.dev/tools/json-ld-ai-schema-checker',
      'https://verisource.dev/mcp-guide',
      'https://verisource.dev/partners',
      'https://verisource.dev/connectors',
      'https://verisource.dev/compare/profound-alternative',
      'https://verisource.dev/compare/otterly-ai-alternative',
      'https://verisource.dev/compare/peec-ai-alternative',
      ...strikingDistance.map((s) => s.page).filter((u) => u.startsWith('https://verisource.dev')),
      ...reports.slice(-15).map((r) => `https://verisource.dev/report/${r.domain}`),
      ...matchupSlugs.slice(-10).map((s) => `https://verisource.dev/vs/${s}`),
    ])
  ).slice(0, 60);

  let indexNowResult = { submitted: false, reason: 'SKIPPED (--ping-indexnow not set)' };
  if (shouldPingIndexNow) {
    indexNowResult = await pingIndexNow(priorityUrls);
  }

  const lines = [
    '# GSC_SEO_HEALING_PLAN.md — Weekly Self-Healing SEO & Bing IndexNow Ledger',
    '',
    `**Generated:** \`${nowIso}\` · **GSC Status:** \`${gscMode}\``,
    `**Live pSEO Footprint:** \`${totalReports}\` \`/report/[domain]\` pages · \`${matchupSlugs.length}\` \`/vs/[matchup]\` pages · **Index Mean:** \`${meanScore}/100\` · **Bot-Blocked:** \`${wafBlockedCount}\` · **Custom \`/agents.md\`:** \`${customAgentsCount}\``,
    `**Bing IndexNow Sync:** \`${indexNowResult.submitted ? `SUBMITTED (${indexNowResult.count} URLs)` : indexNowResult.reason}\``,
    '',
    '---',
    '',
    '## 1. Striking-Distance Pages (Positions 5–25 — Highest ROI Quick Wins)',
  ];

  if (strikingDistance.length === 0) {
    lines.push(
      '',
      '> To pull live Google Search Console clicks, impressions, and striking-distance queries automatically every Monday, add a read-only Google Cloud Service Account JSON to GitHub Secret `GSC_SERVICE_ACCOUNT_JSON` and grant that service account email **Restricted/Full** access on `sc-domain:verisource.dev` in Search Console.',
      ''
    );
  } else {
    lines.push(
      '',
      '| Position | Impressions | Clicks | CTR | Query | Target Page | Recommended Heal |',
      '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |'
    );
    for (const row of strikingDistance) {
      const action =
        row.ctr < 2.5
          ? 'Tighten H1/meta title with exact metric & add 2 Reddit-sourced FAQs'
          : 'Add 2 internal links from /benchmarks & /tools + ping IndexNow';
      lines.push(
        `| \`${row.position}\` | \`${row.impressions}\` | \`${row.clicks}\` | \`${row.ctr}%\` | ${row.query.replace(/\|/g, '-')} | ${row.page} | ${action} |`
      );
    }
    lines.push('');
  }

  if (topQueries.length > 0) {
    lines.push('## 2. Top-Performing Live GSC Queries (Double Down Here)', '');
    lines.push('| Clicks | Impressions | Pos | Query | Page |');
    lines.push('| :--- | :--- | :--- | :--- | :--- |');
    for (const q of topQueries) {
      lines.push(
        `| \`${q.clicks}\` | \`${q.impressions}\` | \`${q.position}\` | ${q.query.replace(/\|/g, '-')} | ${q.page} |`
      );
    }
    lines.push('');
  }

  lines.push(
    '## 3. High-Contrast Teardown & Backlink-Bait Targets (`<= 44/100`)',
    '',
    '| Domain | Brand | Readiness | Platform | Top Gap | Scorecard URL |',
    '| :--- | :--- | :--- | :--- | :--- | :--- |'
  );
  for (const r of teardownCandidates) {
    lines.push(
      `| \`${r.domain}\` | **${r.brandName}** | \`${r.readinessScore}/100\` | ${r.detectedPlatformLabel} | ${String(r.topGapSummary).replace(/\|/g, '-')} | https://verisource.dev/report/${r.domain} |`
    );
  }

  lines.push(
    '',
    '## 4. Published Scorecards Missing a `/vs/[matchup]` Companion Page',
    '',
    `Detected **${unpairedReports.length}+** live scorecards without a head-to-head matchup page (zero extra crawl cost to pair):`,
    ''
  );
  for (const r of unpairedReports.slice(0, 12)) {
    lines.push(
      `- \`${r.domain}\` (**${r.brandName}**, \`${r.readinessScore}/100\`, \`${r.vertical}\`, \`${r.detectedPlatformLabel}\`)`
    );
  }

  mirrorFileIfNeeded('queue/GSC_SEO_HEALING_PLAN.md', `${lines.join('\n')}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        gscMode,
        totalReports,
        totalMatchups: matchupSlugs.length,
        strikingDistanceCount: strikingDistance.length,
        teardownCandidates: teardownCandidates.length,
        indexNowResult,
        planPath: path.join(ACTIVE_OPS_DIR, 'queue/GSC_SEO_HEALING_PLAN.md'),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('[ops:gsc] Failed:', err);
  process.exit(1);
});
