import dns from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEMO_USER_ID,
  enforceQualityGate95,
  normalizePublicDomain,
  runDomainReadinessScan,
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

const GENERIC_MAILBOX_HOSTS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'freenet.de',
  'gmx.de',
  'web.de',
]);

const INTERNAL_SKIP_EMAILS = new Set([
  'demo@verisource.dev',
  'aurearoasters@gmail.com',
  'kulinichnick@gmail.com',
]);

function isBotOrInternalEmail(rawEmail) {
  const email = (rawEmail ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) return { skip: true, reason: 'empty' };
  if (INTERNAL_SKIP_EMAILS.has(email)) return { skip: true, reason: 'internal' };

  const [local, host] = email.split('@');
  if (
    host === 'verisource.dev' ||
    host === 'mosaicroasters.com' ||
    host === 'aurearoasters.com' ||
    host.endsWith('.local')
  ) {
    return { skip: true, reason: 'internal_domain' };
  }

  // Filter automated disposable/bot signups (e.g. eng7acc9cd35@niceground.shop or multi-dotted gmail bots)
  if (
    /niceground\.shop|mailinator|guerrillamail|tempmail|10minutemail|yopmail/i.test(
      host
    )
  ) {
    return { skip: true, reason: 'disposable_host' };
  }
  if (/^eng[0-9a-f]{6,}$/i.test(local)) {
    return { skip: true, reason: 'bot_hex_local' };
  }
  const dotCount = (local.match(/\./g) ?? []).length;
  if ((host === 'gmail.com' || host === 'googlemail.com') && dotCount >= 3) {
    return { skip: true, reason: 'dotted_gmail_bot' };
  }

  return { skip: false, local, host };
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
    return { sent: false, id: null, reason: `HTTP_${res.status}:${errText}` };
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
  const nowIso = new Date().toISOString();

  const sbUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const sbKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  if (!sbUrl || !sbKey) {
    throw new Error('Supabase credentials missing.');
  }

  const ledgerRel = 'ledger/free_activation_ledger.json';
  const ledgerPrimary = path.join(ACTIVE_OPS_DIR, ledgerRel);
  const ledger = fs.existsSync(ledgerPrimary)
    ? JSON.parse(fs.readFileSync(ledgerPrimary, 'utf8'))
    : { version: '1.0.0', contacted: {} };

  const headers = {
    apikey: sbKey,
    Authorization: `Bearer ${sbKey}`,
  };

  const [profRes, domRes] = await Promise.all([
    fetch(
      `${sbUrl}/rest/v1/profiles?plan_tier=eq.free&select=id,email,created_at&order=created_at.asc`,
      { headers }
    ),
    fetch(`${sbUrl}/rest/v1/domains?select=user_id`, { headers }),
  ]);
  const freeProfiles = await profRes.json();
  const domainUserIds = new Set((await domRes.json()).map((d) => d.user_id));

  let dispatchedCount = 0;
  let skippedBotsCount = 0;

  for (const prof of freeProfiles) {
    if (prof.id === DEMO_USER_ID || domainUserIds.has(prof.id)) continue;
    if (ledger.contacted[prof.id]) continue;

    const check = isBotOrInternalEmail(prof.email);
    if (check.skip) {
      skippedBotsCount += 1;
      continue;
    }

    // Zero-bounce MX guard on free-account email domain before sending
    let hasValidMx = false;
    try {
      const mxRecords = await dns.resolveMx(check.host);
      hasValidMx =
        Array.isArray(mxRecords) &&
        mxRecords.some(
          (r) => typeof r.exchange === 'string' && r.exchange.trim() && r.exchange.trim() !== '.'
        );
    } catch {
      hasValidMx = false;
    }
    if (!hasValidMx) {
      skippedBotsCount += 1;
      continue;
    }

    let orgDomain = null;
    let scan = null;
    if (!GENERIC_MAILBOX_HOSTS.has(check.host)) {
      try {
        orgDomain = normalizePublicDomain(check.host).hostname;
        scan = await runDomainReadinessScan(orgDomain, {
          PROVIDER_MODE: 'mock',
        });
      } catch {
        orgDomain = null;
        scan = null;
      }
    }

    const subject =
      scan && orgDomain
        ? `Your Verisource account + ${orgDomain} AI Search Readiness (${scan.visibilityScore}/100)`
        : `Your Verisource account — preview your website's AI Search Readiness`;

    const rawBody =
      scan && orgDomain
        ? [
            `Hi there — thanks for creating a Verisource account.`,
            ``,
            `I ran a quick read-only HTTP check on ${orgDomain} (${scan.detectedPlatformLabel ?? 'Web'}) for you: it currently scores ${scan.visibilityScore}/100 on AI search readiness (/llms.txt is ${scan.llmsTxtStatus}, /agents.md is ${scan.agentsMdStatus.replace(/_/g, ' ')}, and ${scan.jsonLdCount} JSON-LD schema block(s) were detected on the homepage).`,
            ``,
            `Your live Step 01 protocol scorecard, buyer-prompt citation check, and tailored Step 02 Fix Prompt preview now load automatically at https://verisource.dev/dashboard?domain=${encodeURIComponent(orgDomain)} — from there you can activate the $19 One-Time Audit Pass (zero recurring billing) or a $0 Today 7-day trial whenever you want the full copy-paste fix bundle.`,
            ``,
            `Best,`,
            `Nick`,
            `Founder, Verisource (https://verisource.dev)`,
          ].join('\n')
        : [
            `Hi there — thanks for creating a Verisource account.`,
            ``,
            `We just added an instant domain preview right inside https://verisource.dev/dashboard so you can check any website's GPTBot/PerplexityBot access, JSON-LD pricing schema, /llms.txt, and /agents.md status before choosing a plan.`,
            ``,
            `Whenever you're ready to generate your 1-Click AI Fix Prompt, you can start with either the $19 One-Time Audit Pass (zero recurring billing, 100% credited if you upgrade within 7 days) or a $0 Today 7-day free trial — just reply here if you want me to review a specific URL.`,
            ``,
            `Best,`,
            `Nick`,
            `Founder, Verisource (https://verisource.dev)`,
          ].join('\n');

    const enforced = enforceQualityGate95(rawBody, 'citation_outreach_brief');

    if (sendEmail) {
      const res = await sendViaRelay({
        toEmail: prof.email,
        subject,
        bodyText: enforced.content,
      });
      if (res.sent) {
        dispatchedCount += 1;
        ledger.contacted[prof.id] = {
          email: prof.email,
          orgDomain,
          score: scan?.visibilityScore ?? null,
          qualityScore: enforced.score,
          sentAt: nowIso,
          resendMessageId: res.id,
        };
        console.log(
          `  ✔ Activated nudge -> ${prof.email}${orgDomain ? ` (${orgDomain} ${scan.visibilityScore}/100)` : ''} | Quality ${enforced.score}/10 | Resend (${res.id})`
        );
      } else {
        console.warn(`  ⚠ Skipped ${prof.email}: ${res.reason}`);
      }
    } else {
      console.log(
        `  [DRY RUN] Would send to ${prof.email}${orgDomain ? ` (${orgDomain} ${scan.visibilityScore}/100)` : ''} | Quality ${enforced.score}/10`
      );
    }
  }

  ledger.updatedAt = nowIso;
  if (!dryRun) {
    mirrorFileIfNeeded(ledgerRel, JSON.stringify(ledger, null, 2) + '\n');
  }
  console.log(
    `\n✔ [ops:activate-free] Complete (${dispatchedCount} activation email(s) sent, ${skippedBotsCount} bot/internal account(s) filtered).`
  );
}

main().catch((err) => {
  console.error('[ops:activate-free] Failed:', err);
  process.exit(1);
});
