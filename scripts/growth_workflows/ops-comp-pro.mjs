/**
 * ops-comp-pro.mjs — Founder-granted complimentary Pro workspaces (no card, auto-expiring)
 *
 * Grant (dry run by default; add --live to write):
 *   node scripts/growth_workflows/ops-comp-pro.mjs --email mike.roberts@thedeliverygroup.co.uk --days 14 --live
 *
 * List active comps:
 *   node scripts/growth_workflows/ops-comp-pro.mjs --list
 *
 * Revoke expired comps (safe to run daily in CI; dry run unless --live):
 *   node scripts/growth_workflows/ops-comp-pro.mjs --revoke-expired --live
 *
 * Expiry lives in Supabase Auth `app_metadata.comp_pro_expires_at` (server-only, not user-editable),
 * so no schema migration is required. Revocation only downgrades accounts that are still on the comp
 * (plan_tier = pro_99 AND no stripe_subscription_id) — anyone who converted to a paid plan is untouched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = path.resolve(__dirname, '../..');

const envLocalPath = path.join(MONOREPO_ROOT, 'apps/web/.env.local');
if (fs.existsSync(envLocalPath)) {
  for (const rawLine of fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

const COMP_PLAN = 'pro_99';
const COMP_MCP_LIMIT = 150; // matches 7-day trial pacing; prevents credit drain on unpaid seats
const FREE_MCP_LIMIT = 5;
const MAX_COMP_DAYS = 30;

function getArgValue(args, flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : fallback;
}

function sbConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing.');
  return {
    url,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  };
}

async function sbJson(res, label) {
  const text = await res.text();
  if (!res.ok) throw new Error(`${label} failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function fetchProfileByEmail(sb, email) {
  const res = await fetch(
    `${sb.url}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,email,plan_tier,stripe_subscription_id,mcp_calls_limit`,
    { headers: sb.headers }
  );
  const rows = await sbJson(res, 'Profile lookup');
  return rows?.[0] ?? null;
}

async function fetchAuthUser(sb, id) {
  const res = await fetch(`${sb.url}/auth/v1/admin/users/${id}`, { headers: sb.headers });
  return sbJson(res, 'Auth user lookup');
}

async function patchAuthAppMetadata(sb, id, existing, patch) {
  const res = await fetch(`${sb.url}/auth/v1/admin/users/${id}`, {
    method: 'PUT',
    headers: sb.headers,
    body: JSON.stringify({ app_metadata: { ...(existing ?? {}), ...patch } }),
  });
  return sbJson(res, 'Auth app_metadata update');
}

async function patchProfile(sb, id, patch) {
  const res = await fetch(`${sb.url}/rest/v1/profiles?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...sb.headers, Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });
  await sbJson(res, 'Profile update');
}

async function listAllAuthUsers(sb) {
  const users = [];
  for (let page = 1; page <= 20; page += 1) {
    const res = await fetch(`${sb.url}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: sb.headers,
    });
    const json = await sbJson(res, 'Auth user list');
    const batch = json?.users ?? [];
    users.push(...batch);
    if (batch.length < 200) break;
  }
  return users;
}

async function grantComp({ sb, email, days, live }) {
  const profile = await fetchProfileByEmail(sb, email);
  if (!profile) {
    console.log(`✖ No profile found for ${email}. They must create an account at https://verisource.dev/login first.`);
    process.exitCode = 1;
    return;
  }
  if (profile.stripe_subscription_id || ['agency_249'].includes(profile.plan_tier)) {
    console.log(`✖ ${email} already has a paid plan (${profile.plan_tier}). No comp applied.`);
    return;
  }

  const expiresAt = new Date(Date.now() + days * 86400 * 1000).toISOString();
  console.log(
    `${live ? '✔ GRANTING' : '[DRY RUN] Would grant'} ${COMP_PLAN} to ${email} (${profile.plan_tier} -> ${COMP_PLAN}, ${COMP_MCP_LIMIT} /mcp credits) until ${expiresAt.slice(0, 10)}`
  );
  if (!live) return;

  const authUser = await fetchAuthUser(sb, profile.id);
  await patchProfile(sb, profile.id, { plan_tier: COMP_PLAN, mcp_calls_limit: COMP_MCP_LIMIT });
  await patchAuthAppMetadata(sb, profile.id, authUser?.app_metadata, {
    comp_pro_status: 'active',
    comp_pro_granted_at: new Date().toISOString(),
    comp_pro_expires_at: expiresAt,
    comp_pro_prior_plan: profile.plan_tier,
  });
  console.log(`  Console link to send: https://verisource.dev/dashboard?tab=tab2_fixes`);
}

async function listComps({ sb }) {
  const users = await listAllAuthUsers(sb);
  const comps = users.filter((u) => u.app_metadata?.comp_pro_expires_at);
  if (comps.length === 0) {
    console.log('No complimentary Pro workspaces on record.');
    return;
  }
  for (const u of comps) {
    const m = u.app_metadata;
    const daysLeft = Math.ceil((Date.parse(m.comp_pro_expires_at) - Date.now()) / 86400000);
    console.log(
      `  ${u.email} | status=${m.comp_pro_status} | expires=${m.comp_pro_expires_at.slice(0, 10)} (${daysLeft}d) | last_sign_in=${u.last_sign_in_at ?? 'never'}`
    );
  }
}

async function revokeExpired({ sb, live }) {
  const users = await listAllAuthUsers(sb);
  const now = Date.now();
  let revoked = 0;
  for (const u of users) {
    const m = u.app_metadata ?? {};
    if (m.comp_pro_status !== 'active' || !m.comp_pro_expires_at) continue;
    if (Date.parse(m.comp_pro_expires_at) > now) continue;

    const profile = await fetchProfileByEmail(sb, u.email);
    const stillOnComp = profile && profile.plan_tier === COMP_PLAN && !profile.stripe_subscription_id;
    if (!stillOnComp) {
      console.log(`  ↷ ${u.email} converted or changed plan (${profile?.plan_tier ?? 'n/a'}) — marking comp closed, plan untouched.`);
      if (live) await patchAuthAppMetadata(sb, u.id, m, { comp_pro_status: 'converted' });
      continue;
    }

    console.log(`  ${live ? '✔ Revoking' : '[DRY RUN] Would revoke'} expired comp for ${u.email} -> free`);
    if (live) {
      await patchProfile(sb, profile.id, { plan_tier: 'free', mcp_calls_limit: FREE_MCP_LIMIT });
      await patchAuthAppMetadata(sb, u.id, m, { comp_pro_status: 'expired' });
    }
    revoked += 1;
  }
  console.log(`✔ [ops:comp] ${revoked} expired comp workspace(s) ${live ? 'revoked' : 'eligible for revocation'}.`);
}

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes('--live');
  const sb = sbConfig();

  if (args.includes('--list')) return listComps({ sb });
  if (args.includes('--revoke-expired')) return revokeExpired({ sb, live });

  const email = String(getArgValue(args, '--email', '')).trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error('Pass --email <address>, --list, or --revoke-expired.');
  }
  const rawDays = Number(getArgValue(args, '--days', '14'));
  const days = Math.max(1, Math.min(MAX_COMP_DAYS, Number.isFinite(rawDays) ? rawDays : 14));
  return grantComp({ sb, email, days, live });
}

main().catch((err) => {
  console.error('[ops:comp] Failed:', err.message);
  process.exit(1);
});
