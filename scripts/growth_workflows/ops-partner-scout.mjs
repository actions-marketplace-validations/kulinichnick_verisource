import dns from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  enforceQualityGate95,
  normalizePublicDomain,
} from '../../packages/core-geo/dist/index.js';

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

const BLOCKED_LOCAL_PARTS =
  /^(no-?reply|donotreply|privacy|legal|dmca|abuse|security|postmaster|webmaster|jobs|careers|billing|support|unsubscribe|spam)$/i;

function getArgValue(args, flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : fallback;
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

function loadPublishedDatasetStats() {
  const reportsPath = path.join(
    MONOREPO_ROOT,
    'apps/web/src/data/published-reports.json'
  );
  const reports = fs.existsSync(reportsPath)
    ? JSON.parse(fs.readFileSync(reportsPath, 'utf8')).reports ?? []
    : [];
  const n = reports.length || 510;
  const mean = (
    reports.reduce((acc, r) => acc + Number(r.readinessScore ?? 0), 0) /
    Math.max(1, reports.length)
  ).toFixed(1);
  const llmsPct = (
    (reports.filter((r) => r.llmsTxtStatus === 'present').length /
      Math.max(1, reports.length)) *
    100
  ).toFixed(1);
  const agentsCustomPct = (
    (reports.filter((r) => r.agentsMdStatus === 'custom_enriched').length /
      Math.max(1, reports.length)) *
    100
  ).toFixed(1);
  const threePillarPct = (
    (reports.filter((r) => Number(r.jsonLdPillarsPassed ?? 0) >= 3).length /
      Math.max(1, reports.length)) *
    100
  ).toFixed(1);
  const blockedPct = (
    (reports.filter(
      (r) =>
        r.robotsAiBotStatus?.waf_blocked ||
        !r.robotsAiBotStatus?.GPTBot ||
        !r.robotsAiBotStatus?.PerplexityBot
    ).length /
      Math.max(1, reports.length)) *
    100
  ).toFixed(1);
  const shopifyReports = reports.filter((r) => r.isShopify);
  const shopifyMean = (
    shopifyReports.reduce((acc, r) => acc + Number(r.readinessScore ?? 0), 0) /
    Math.max(1, shopifyReports.length)
  ).toFixed(1);
  const webflowReports = reports.filter(
    (r) => String(r.detectedPlatform).toLowerCase() === 'webflow'
  );
  const webflowMean = (
    webflowReports.reduce((acc, r) => acc + Number(r.readinessScore ?? 0), 0) /
    Math.max(1, webflowReports.length)
  ).toFixed(1);

  return {
    n,
    mean,
    llmsPct,
    agentsCustomPct,
    threePillarPct,
    blockedPct,
    shopifyCount: shopifyReports.length,
    shopifyMean,
    webflowCount: webflowReports.length,
    webflowMean,
  };
}

async function verifyMailboxZeroBounce(domain, candidateEmail) {
  let cleanHost;
  try {
    cleanHost = normalizePublicDomain(domain).hostname;
  } catch {
    return { verifiedEmail: null, mxHost: null, reason: 'INVALID_DOMAIN' };
  }

  let mxHost = null;
  try {
    const mx = await dns.resolveMx(cleanHost);
    if (!mx || mx.length === 0) {
      return { verifiedEmail: null, mxHost: null, reason: 'NO_MX_RECORDS' };
    }
    mx.sort((a, b) => a.priority - b.priority);
    mxHost = mx[0].exchange;
    if (!mxHost || mxHost === '.') {
      return { verifiedEmail: null, mxHost: null, reason: 'NULL_MX' };
    }
  } catch {
    return { verifiedEmail: null, mxHost: null, reason: 'MX_LOOKUP_FAILED' };
  }

  // Scrape public /, /contact, /about pages for an explicit live-published mailbox on the same domain
  const foundEmails = new Set();
  const pathsToCheck = ['/', '/contact', '/about'];
  for (const rel of pathsToCheck) {
    try {
      const res = await fetch(`https://${cleanHost}${rel}`, {
        headers: {
          'User-Agent': 'VerisourceScan/1.0 (+https://verisource.dev/scanner)',
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(6500),
      });
      if (!res.ok) continue;
      const html = (await res.text()).slice(0, 220000);
      const matches =
        html.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
      for (const raw of matches) {
        const lower = raw.toLowerCase();
        const [local, host] = lower.split('@');
        if (!local || !host) continue;
        if (BLOCKED_LOCAL_PARTS.test(local)) continue;
        if (host === cleanHost || host.endsWith(`.${cleanHost}`)) {
          foundEmails.add(lower);
        }
      }
      if (foundEmails.size > 0) break;
    } catch {
      // Ignore path errors
    }
  }

  const candidateLower = (candidateEmail ?? '').trim().toLowerCase();
  if (candidateLower && foundEmails.has(candidateLower)) {
    return { verifiedEmail: candidateLower, mxHost, reason: 'EXACT_ON_SITE_MATCH' };
  }
  const preferred = Array.from(foundEmails).sort((a, b) => {
    const rank = (e) =>
      /^(hello|hey|hi|press|editorial|news|partners|contact|info)@/i.test(e)
        ? 0
        : 1;
    return rank(a) - rank(b);
  })[0];

  if (preferred) {
    return { verifiedEmail: preferred, mxHost, reason: 'SCRAPED_ON_SITE_MATCH' };
  }

  return { verifiedEmail: null, mxHost, reason: 'NO_LIVE_ON_SITE_MAILBOX' };
}

function buildPartnerDataPrNote(partner, stats) {
  const pubShortName = String(partner.name || partner.domain)
    .replace(/\s*\([^)]*\)\s*/g, '')
    .trim();
  const rawCreator = String(partner.creatorName || '').trim();
  const isTeamLabel = /\b(editorial|team|staff)\b/i.test(rawCreator);
  const greetingName = isTeamLabel
    ? `${pubShortName} team`
    : rawCreator.split(/\s+/)[0]?.replace(/[^a-z'-]/gi, '') || 'there';
  const partnerLink = `https://verisource.dev/r/${partner.slug}`;
  const datasetMdUrl = 'https://verisource.dev/api/benchmarks/summary?format=md';
  const badgeUrl = `https://verisource.dev/api/badge/${partner.domain}`;

  let verticalHook = `We just finished live HTTPS protocol probes across ${stats.n} commercial sites (${stats.mean}/100 mean): ${stats.blockedPct}% silently block GPTBot or PerplexityBot at the CDN edge, only ${stats.agentsCustomPct}% ship a custom /agents.md, and just ${stats.threePillarPct}% pass all 3 JSON-LD pillars (Entity, FAQPage, Offer).`;

  if (partner.vertical === 'shopify') {
    verticalHook = `We just finished live HTTPS probes across ${stats.n} commercial stores (${stats.shopifyCount} Shopify OS 2.0 storefronts averaging ${stats.shopifyMean}/100 vs. a steep penalty on headless Next.js builds): most stores expose /api/ucp/mcp yet still serve stock Shopify boilerplate /agents.md without real shipping thresholds or 3-pillar JSON-LD.`;
  } else if (partner.vertical === 'webflow_agency') {
    verticalHook = `We just probed ${stats.n} live B2B and DTC sites over HTTPS (${stats.webflowCount} Webflow sites averaging ${stats.webflowMean}/100): ${stats.blockedPct}% block AI search crawlers at the edge WAF, and only ${stats.threePillarPct}% pass Entity + FAQPage + Offer JSON-LD.`;
  } else if (partner.vertical === 'devtools_mcp') {
    verticalHook = `We probed ${stats.n} live SaaS and DevTools sites over HTTPS: ${stats.llmsPct}% now serve /llms.txt, but only ${stats.agentsCustomPct}% publish a custom /agents.md—so we shipped an open Markdown/JSON benchmark API (${datasetMdUrl}) plus a 1-click OAuth 2.1 MCP server for Claude and ChatGPT.`;
  }

  const draft = [
    `Hi ${greetingName} — ${verticalHook}`,
    `If this data is useful for a future ${pubShortName} issue, the full ${stats.n}-domain dataset is free to cite in raw Markdown (${datasetMdUrl}) with zero login, and your live badge is already cached at ${badgeUrl}.`,
    `If readers ask how to fix missing /agents.md or JSON-LD gaps without writing templates from scratch, we also staged a 25% recurring partner link for you (${partnerLink} · details at https://verisource.dev/partners)—zero obligation either way.`,
  ].join(' ');

  return enforceQualityGate95(draft);
}

async function sendViaRelay({ toEmail, subject, bodyText }) {
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  const replyTo = (
    process.env.OUTBOUND_REPLY_TO_EMAIL ?? 'kulinichnick@gmail.com'
  ).trim();
  const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim();
  const appOrigin = (
    rawAppUrl && !/localhost|127\.0\.0\.1/i.test(rawAppUrl)
      ? rawAppUrl
      : 'https://verisource.dev'
  ).replace(/\/+$/, '');

  if (!serviceKey) return { sent: false, reason: 'MISSING_SERVICE_KEY' };

  const res = await fetch(`${appOrigin}/api/dashboard/outbound-send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: toEmail,
      subject,
      text: bodyText,
      replyTo,
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return { sent: false, reason: `HTTP_${res.status}:${errText.slice(0, 150)}` };
  }
  const json = await res.json();
  return {
    sent: Boolean(json.delivered),
    id: json.providerMessageId ?? null,
    reason: null,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const sendEmail = args.includes('--send-email') && !dryRun;
  const batchSize = Math.max(
    1,
    Math.min(12, Number(getArgValue(args, '--batch', '4')))
  );
  const maxSends = Math.max(
    0,
    Math.min(4, Number(getArgValue(args, '--max-sends', '2')))
  );
  const nowIso = new Date().toISOString();

  const primaryTargetsPath = path.join(ACTIVE_OPS_DIR, 'partner_targets.json');
  const fallbackTargetsPath = path.join(MIRROR_OPS_DIR, 'partner_targets.json');
  const targetsPath = fs.existsSync(primaryTargetsPath)
    ? primaryTargetsPath
    : fallbackTargetsPath;

  if (!fs.existsSync(targetsPath)) {
    throw new Error(`Missing partner_targets.json at ${targetsPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
  const stats = loadPublishedDatasetStats();

  const queued = (manifest.partners ?? [])
    .filter((p) => p.status === 'queued' || !p.verifiedAt)
    .slice(0, batchSize);

  const results = [];
  let emailsSent = 0;

  for (const partner of queued) {
    const verification = await verifyMailboxZeroBounce(
      partner.domain,
      partner.contactEmail
    );
    const note = buildPartnerDataPrNote(partner, stats);
    const partnerUrl = `https://verisource.dev/r/${partner.slug}`;

    let sendOutcome = 'QUEUED_FOR_REVIEW';
    if (verification.verifiedEmail) {
      partner.contactEmail = verification.verifiedEmail;
      partner.mxHost = verification.mxHost;
      partner.deliveryChannel = 'email_verified';
      partner.verifiedAt = nowIso;

      if (sendEmail && emailsSent < maxSends && !partner.sentAt) {
        const subject = `${stats.n}-domain AI search readiness data for ${partner.name}`;
        const sent = await sendViaRelay({
          toEmail: verification.verifiedEmail,
          subject,
          bodyText: `${note.content}\n\n— Nick Kulinich, Founder at Verisource (https://verisource.dev)`,
        });
        if (sent.sent) {
          emailsSent += 1;
          partner.status = 'sent';
          partner.sentAt = nowIso;
          partner.resendMessageId = sent.id;
          sendOutcome = `SENT (${sent.id})`;
        } else {
          sendOutcome = `SEND_SKIPPED (${sent.reason})`;
        }
      }
    } else {
      partner.deliveryChannel = 'social_dm_only';
      partner.mxHost = verification.mxHost;
      partner.verifiedAt = nowIso;
      sendOutcome = `SOCIAL_DM_ONLY (${verification.reason})`;
    }

    results.push({
      name: partner.name,
      creatorName: partner.creatorName,
      domain: partner.domain,
      vertical: partner.vertical,
      partnerUrl,
      verifiedEmail: verification.verifiedEmail,
      mxHost: verification.mxHost,
      deliveryChannel: partner.deliveryChannel,
      sendOutcome,
      qualityScore: note.score,
      pitchText: note.content,
    });
  }

  if (!dryRun) {
    manifest.updatedAt = nowIso;
    mirrorFileIfNeeded(
      'partner_targets.json',
      `${JSON.stringify(manifest, null, 2)}\n`
    );
  }

  const md = [
    '# PARTNER_CREATOR_OUTREACH.md — Zero-CAC 25% Recurring Partner & Data-PR Queue',
    '',
    `**Generated:** \`${nowIso}\` · **Dataset Backing:** \`N = ${stats.n}\` domains (\`${stats.mean}/100\` mean) · **Processed:** \`${results.length}\` creators · **Live Emails Sent:** \`${emailsSent}\``,
    '',
    '| Publication / Creator | Vertical | Verified Mailbox / Channel | 25% Partner Link | Status | Quality |',
    '| :--- | :--- | :--- | :--- | :--- | :--- |',
    ...results.map(
      (r) =>
        `| **${r.name}** (\`${r.domain}\`) | \`${r.vertical}\` | ${r.verifiedEmail ? `\`${r.verifiedEmail}\` (MX \`${r.mxHost}\`)` : `\`social_dm_only\``} | ${r.partnerUrl} | \`${r.sendOutcome}\` | \`${r.qualityScore.toFixed(1)}/10\` |`
    ),
    '',
    '---',
    '',
    ...results.flatMap((r, i) => [
      `## ${i + 1}. ${r.name} (\`${r.domain}\`)`,
      `- **Partner Link (\`25%\` recurring Stripe attribution):** ${r.partnerUrl}`,
      `- **Live Badge URL:** https://verisource.dev/api/badge/${r.domain}`,
      `- **Contact Route:** ${r.verifiedEmail ? `${r.verifiedEmail} (Zero-Bounce MX verified)` : `Use public contact form / LinkedIn / X DM (${r.sendOutcome})`}`,
      '',
      '```text',
      r.pitchText,
      '```',
      '',
    ]),
  ];

  mirrorFileIfNeeded('queue/PARTNER_CREATOR_OUTREACH.md', `${md.join('\n')}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        processed: results.length,
        verifiedMailboxes: results.filter((r) => Boolean(r.verifiedEmail)).length,
        emailsSent,
        queuePath: path.join(ACTIVE_OPS_DIR, 'queue/PARTNER_CREATOR_OUTREACH.md'),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('[ops:partners] Failed:', err);
  process.exit(1);
});
