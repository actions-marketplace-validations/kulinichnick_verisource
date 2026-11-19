import dns from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildLinkedinConnectionNote195,
  buildWarmEngagementFollowUp,
  enforceQualityGate95,
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

  const agencyPath = path.join(ACTIVE_OPS_DIR, 'agency_targets.json');
  const manifest = JSON.parse(fs.readFileSync(agencyPath, 'utf8'));

  const candidateAgencies = (manifest.agencies ?? []).filter(
    (a) => a.auditSlug && !a.warmFollowUpSentAt && a.publicContactChannel
  );

  const allOpenedRes = await fetch(
    `${sbUrl.replace(/\/+$/, '')}/rest/v1/agency_pitch_reports?views_count=gte.1&order=views_count.desc,created_at.desc&select=*`,
    {
      headers: {
        apikey: sbKey,
        Authorization: `Bearer ${sbKey}`,
      },
      signal: AbortSignal.timeout(10000),
    }
  );
  const allOpenedRows = allOpenedRes.ok ? await allOpenedRes.json() : [];
  const rowBySlug = new Map(allOpenedRows.map((r) => [r.share_slug, r]));
  const rowByHost = new Map();
  for (const r of allOpenedRows) {
    const h = String(r.prospect_domain ?? '')
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '')
      .toLowerCase();
    if (h && !rowByHost.has(h)) rowByHost.set(h, r);
  }

  let dispatchedCount = 0;
  for (const agency of candidateAgencies) {
    const clientHost = agency.caseStudyClientDomain
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '');
    const report =
      rowBySlug.get(agency.auditSlug) ??
      rowByHost.get(clientHost.toLowerCase());
    if (!report || (report.views_count ?? 0) < 1) continue;

    // Require at least 12 hours since initial Touch 1 send when emailSentAt is recorded
    if (agency.emailSentAt) {
      const elapsedHrs =
        (Date.now() - Date.parse(agency.emailSentAt)) / (1000 * 3600);
      if (elapsedHrs < 12) continue;
    }

    const firstName = agency.contactName.split(/\s+/)[0] || 'there';
    const platformLabel =
      report.summary_payload?.detected_platform_label ?? 'website';
    const briefUrl = `https://verisource.dev/audit/${report.share_slug}`;
    const sandboxUrl = `https://verisource.dev/agencies?domain=${encodeURIComponent(
      clientHost
    )}#sandbox`;

    const subject = `Re: ${clientHost} — AI search & /agents.md check for ${agency.agencyName}`;
    const coreParagraph = enforceQualityGate95(
      [
        `Quick follow-up on the ${clientHost} AI search brief (${briefUrl}).`,
        `If ${agency.agencyName} wants the raw ${platformLabel} schema.org JSON-LD, /llms.txt, and /agents.md files for ${clientHost} to drop into a client review, reply here and I will send the bundle straight over.`,
        `You can also swap in ${agency.agencyName}'s own logo, brand hex, and booking calendar across up to 15 client domains anytime at ${sandboxUrl}.`,
      ].join(' ')
    );

    const fullText = [
      `Hi ${firstName},`,
      ``,
      coreParagraph.content,
      ``,
      `Best,`,
      `Nick Kulinich`,
      `Founder, Verisource`,
      `https://verisource.dev`,
    ].join('\n');

    if (sendEmail) {
      const targetEmail = agency.publicContactChannel.trim().toLowerCase();
      const targetHost = targetEmail.split('@')[1] ?? '';
      let mxOk = false;
      try {
        const mxRecords = await dns.resolveMx(targetHost);
        mxOk =
          Array.isArray(mxRecords) &&
          mxRecords.some(
            (r) =>
              typeof r.exchange === 'string' &&
              r.exchange.trim() &&
              r.exchange.trim() !== '.'
          );
      } catch {
        mxOk = false;
      }
      if (!mxOk) {
        console.warn(
          `  ⚠ Skipped ${agency.agencyName}: NO_VALID_MX_RECORD on ${targetHost}`
        );
        continue;
      }

      const res = await sendViaRelay({
        toEmail: targetEmail,
        subject,
        bodyText: fullText,
      });
      if (res.sent) {
        agency.warmFollowUpSentAt = nowIso;
        agency.warmResendMessageId = res.id;
        dispatchedCount += 1;
        console.log(
          `  ✔ Warm follow-up sent to ${agency.agencyName} (${agency.publicContactChannel}) | client ${clientHost} (${report.views_count}x views) | Quality ${coreParagraph.score}/10 | Resend ${res.id}`
        );
      } else {
        console.warn(
          `  ⚠ Skipped ${agency.agencyName}: ${res.reason ?? 'not delivered'}`
        );
      }
    } else {
      console.log(
        `  [DRY RUN] Would send warm follow-up to ${agency.agencyName} (${agency.publicContactChannel}) | client ${clientHost} (${report.views_count}x views) | Quality ${coreParagraph.score}/10`
      );
    }
  }

  if (!dryRun && dispatchedCount > 0) {
    manifest.updatedAt = nowIso;
    mirrorFileIfNeeded(
      'agency_targets.json',
      JSON.stringify(manifest, null, 2) + '\n'
    );
  }

  const agencyBySlug = new Map(
    (manifest.agencies ?? [])
      .filter((a) => a.auditSlug)
      .map((a) => [a.auditSlug, a])
  );
  const hotCount = allOpenedRows.filter((r) => (r.views_count ?? 0) >= 3).length;
  const mdLines = [
    '# WARM_OPENED_FOLLOWUPS.md — Opened & Hot `/audit/[slug]` Follow-Up Queue',
    '',
    `**Generated:** \`${nowIso}\` · **Opened Briefs:** \`${allOpenedRows.length}\` (\`${hotCount}\` Hot with \`3+\` views)`,
    '',
    '| Rank | Prospect & Domain | Views | Readiness | Status | Live Brief | LinkedIn <=195c Note |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
  ];

  const detailBlocks = [];
  allOpenedRows.forEach((r, idx) => {
    const views = r.views_count ?? 0;
    const badge = views >= 3 ? `HOT (${views}x)` : `OPENED (${views}x)`;
    const agencyMatch = agencyBySlug.get(r.share_slug);
    const statusLabel = agencyMatch?.warmFollowUpSentAt
      ? `SENT (${agencyMatch.warmFollowUpSentAt.slice(0, 10)})`
      : agencyMatch?.emailSentAt
        ? 'HOLD (<12h)'
        : 'LINKEDIN / MANUAL';
    const li = buildLinkedinConnectionNote195(r, 'https://verisource.dev');
    const warm = buildWarmEngagementFollowUp(r, 'https://verisource.dev');
    const briefUrl = `https://verisource.dev/audit/${r.share_slug}`;
    mdLines.push(
      `| ${idx + 1} | **${r.prospect_brand_name}** (\`${r.prospect_domain}\`) | \`${badge}\` | \`${r.visibility_score}/100\` | \`${statusLabel}\` | ${briefUrl} | \`${li.content}\` |`
    );
    detailBlocks.push(
      [
        `## ${idx + 1}. ${r.prospect_brand_name} (\`${r.prospect_domain}\` · \`${badge}\` · \`${statusLabel}\`)`,
        `- **Brief URL:** ${briefUrl}`,
        `- **LinkedIn (${li.charCount}/195 chars):** \`${li.content}\``,
        '',
        '```text',
        warm.content,
        '```',
        '',
      ].join('\n')
    );
  });

  mdLines.push('', '---', '', ...detailBlocks);
  mirrorFileIfNeeded('queue/WARM_OPENED_FOLLOWUPS.md', mdLines.join('\n'));

  console.log(
    `\n✔ [ops:followup] Complete (${dispatchedCount} warm follow-up(s) dispatched, ${allOpenedRows.length} opened briefs synced to queue/WARM_OPENED_FOLLOWUPS.md).`
  );
}

main().catch((err) => {
  console.error('[ops:followup] Failed:', err);
  process.exit(1);
});
