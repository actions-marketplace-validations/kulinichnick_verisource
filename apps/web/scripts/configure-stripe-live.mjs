import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Stripe from 'stripe';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(webDir, '..', '..');
const envLocalPath = path.resolve(webDir, '.env.local');

const REQUIRED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.deleted',
  'invoice.paid',
];
const TARGET_WEBHOOK_URL = 'https://verisource.dev/api/webhooks/stripe';

function loadDotEnvIfPresent() {
  if (!fs.existsSync(envLocalPath)) return;
  const lines = fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function putVercelProductionSecret(name, value) {
  const res = spawnSync(
    process.platform === 'win32' ? 'cmd.exe' : 'npx',
    process.platform === 'win32'
      ? ['/c', `npx --yes vercel env add ${name} production --force`]
      : ['--yes', 'vercel', 'env', 'add', name, 'production', '--force'],
    {
      cwd: rootDir,
      input: value.trim(),
      encoding: 'utf8',
      stdio: ['pipe', 'inherit', 'inherit'],
    }
  );
  if (res.status !== 0) {
    throw new Error(`Failed setting ${name} in Vercel Production.`);
  }
}

function upsertEnvLocalKey(filePath, key, value) {
  const existing = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
    : [];
  let updated = false;
  const nextLines = existing.map((line) => {
    if (line.startsWith(`${key}=`)) {
      updated = true;
      return `${key}=${value.trim()}`;
    }
    return line;
  });
  if (!updated) {
    nextLines.push(`${key}=${value.trim()}`);
  }
  fs.writeFileSync(filePath, nextLines.join('\n'), 'utf8');
}

async function runStatusAudit(apiKey) {
  if (!apiKey) {
    console.log('[Stripe Status] No STRIPE_SECRET_KEY found in environment or .env.local.');
    return;
  }
  const mode = apiKey.startsWith('sk_live_') || apiKey.startsWith('rk_live_')
    ? 'LIVE'
    : 'TEST_SANDBOX';
  const stripe = new Stripe(apiKey);
  const account = await stripe.accounts.retrieve();
  const webhooks = await stripe.webhookEndpoints.list({ limit: 50 });
  const matchingHooks = webhooks.data.filter((w) => w.url === TARGET_WEBHOOK_URL);
  const portals = await stripe.billingPortal.configurations.list({
    is_default: true,
    limit: 1,
  });

  console.log(`[Stripe Status Audit]`);
  console.log(`  • Key Mode:              ${mode} (${apiKey.slice(0, 8)}••••••••)`);
  console.log(`  • Account ID:            ${account.id}`);
  console.log(
    `  • Business Name:         ${
      account.settings?.dashboard?.display_name ||
      account.business_profile?.name ||
      '(unset)'
    }`
  );
  console.log(`  • Charges Enabled:       ${account.charges_enabled}`);
  console.log(`  • Payouts Enabled:       ${account.payouts_enabled}`);
  console.log(
    `  • Webhook Endpoint(s):   ${matchingHooks.length} matching ${TARGET_WEBHOOK_URL}`
  );
  for (const h of matchingHooks) {
    console.log(
      `      - ${h.id} | status=${h.status} | events=${h.enabled_events.join(', ')}`
    );
  }
  console.log(
    `  • Default Billing Portal: ${
      portals.data.length > 0 ? `Configured (${portals.data[0].id})` : 'Not yet created'
    }`
  );
}

async function main() {
  loadDotEnvIfPresent();
  const args = process.argv.slice(2);

  if (args.includes('--status') || args.includes('--check')) {
    await runStatusAudit(process.env.STRIPE_SECRET_KEY);
    return;
  }

  const positionalArgs = args.filter((a) => !a.startsWith('--'));
  const liveKey = (
    positionalArgs[0] ??
    process.env.STRIPE_LIVE_SECRET_KEY ??
    ''
  ).trim();
  const explicitWhsec = (
    positionalArgs[1] ??
    process.env.STRIPE_LIVE_WEBHOOK_SECRET ??
    ''
  ).trim();
  const syncLocal = args.includes('--sync-local');

  if (!liveKey || !liveKey.startsWith('sk_live_')) {
    console.error(
      [
        'Usage:',
        '   Audit current key:  pnpm stripe:live --status',
        '  Cutover to Live:    pnpm stripe:live <sk_live_YOUR_SECRET_KEY> [whsec_OPTIONAL] [--sync-local]',
        '',
        'What Live Cutover automates:',
        '  1. Verifies Stripe account charges_enabled === true.',
        '  2. Ensures a default Live Billing Portal configuration exists (/privacy & /terms).',
        '  3. Registers https://verisource.dev/api/webhooks/stripe for checkout.session.completed, customer.subscription.deleted, and invoice.paid, capturing whsec_ automatically.',
        '  4. Writes STRIPE_SECRET_KEY & STRIPE_WEBHOOK_SECRET to Vercel Production and redeploys https://verisource.dev.',
      ].join('\n')
    );
    process.exit(1);
  }

  const stripe = new Stripe(liveKey);
  console.log('1/5 Verifying live Stripe account readiness...');
  const account = await stripe.accounts.retrieve();
  if (!account.charges_enabled) {
    throw new Error(
      `Stripe account ${account.id} has charges_enabled=false. Complete Stripe onboarding in your dashboard before switching production traffic.`
    );
  }
  console.log(
    `  ✔ Verified live Stripe account ${account.id} (charges_enabled=true)`
  );

  console.log('2/5 Ensuring Live Customer Billing Portal configuration exists...');
  const portals = await stripe.billingPortal.configurations.list({
    is_default: true,
    limit: 1,
  });
  if (portals.data.length === 0) {
    const createdPortal = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Verisource — Manage your GEO & MCP subscription',
        privacy_policy_url: 'https://verisource.dev/privacy',
        terms_of_service_url: 'https://verisource.dev/terms',
      },
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
        },
      },
    });
    console.log(`  ✔ Created default Live Billing Portal (${createdPortal.id})`);
  } else {
    console.log(
      `  ✔ Existing Live Billing Portal active (${portals.data[0].id})`
    );
  }

  let webhookSecret = explicitWhsec;
  if (!webhookSecret) {
    console.log(
      `3/5 Registering live webhook endpoint (${TARGET_WEBHOOK_URL})...`
    );
    const existingHooks = await stripe.webhookEndpoints.list({ limit: 50 });
    for (const oldHook of existingHooks.data) {
      if (oldHook.url === TARGET_WEBHOOK_URL) {
        await stripe.webhookEndpoints.del(oldHook.id);
        console.log(`  • Replaced prior endpoint ${oldHook.id} to mint fresh signing secret`);
      }
    }
    const createdHook = await stripe.webhookEndpoints.create({
      url: TARGET_WEBHOOK_URL,
      enabled_events: REQUIRED_EVENTS,
      description: 'Verisource Production Entitlement & Domain Auto-Provisioner',
    });
    if (!createdHook.secret) {
      throw new Error('Stripe did not return a signing secret for new webhook endpoint.');
    }
    webhookSecret = createdHook.secret;
    console.log(`  ✔ Registered live webhook ${createdHook.id} (whsec_ captured)`);
  } else {
    console.log('3/5 Using caller-supplied whsec_ signing secret...');
  }

  console.log('4/5 Syncing STRIPE_SECRET_KEY & STRIPE_WEBHOOK_SECRET to Vercel Production...');
  putVercelProductionSecret('STRIPE_SECRET_KEY', liveKey);
  putVercelProductionSecret('STRIPE_WEBHOOK_SECRET', webhookSecret);

  if (syncLocal) {
    upsertEnvLocalKey(envLocalPath, 'STRIPE_SECRET_KEY', liveKey);
    upsertEnvLocalKey(envLocalPath, 'STRIPE_WEBHOOK_SECRET', webhookSecret);
    console.log('  ✔ Updated apps/web/.env.local');
  }

  console.log('5/5 Redeploying Vercel Production and verifying live cs_live_ session...');
  const deployRes = spawnSync(
    process.platform === 'win32' ? 'cmd.exe' : 'npx',
    process.platform === 'win32'
      ? ['/c', 'npx --yes vercel deploy --prod --yes']
      : ['--yes', 'vercel', 'deploy', '--prod', '--yes'],
    { cwd: rootDir, stdio: 'inherit' }
  );
  if (deployRes.status !== 0) {
    throw new Error('Vercel production deploy exited with non-zero status.');
  }

  const probe = await fetch(
    'https://verisource.dev/api/checkout?plan=tripwire_19&cycle=one_time&domain=onyxcoffeelab.com',
    { redirect: 'manual' }
  );
  const loc = probe.headers.get('location') ?? '';
  if (!loc.includes('cs_live_')) {
    throw new Error(
      `Expected cs_live_ Stripe Checkout redirect, received HTTP ${probe.status} Location: ${loc.slice(0, 90)}`
    );
  }
  console.log('✔ Live Stripe Checkout verified (cs_live_ session active on https://verisource.dev)!');
}

main().catch((err) => {
  console.error('Stripe Live Cutover Failed:', err.message ?? err);
  process.exit(1);
});
