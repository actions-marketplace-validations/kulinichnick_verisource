import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const workerDir = path.resolve(rootDir, 'apps', 'mcp-worker');

const apiKey = (process.argv[2] ?? process.env.RESEND_API_KEY ?? '').trim();
const fromEmail = (
  process.argv[3] ??
  process.env.ALERT_FROM_EMAIL ??
  'Verisource Watchdog <alerts@verisource.dev>'
).trim();

if (!apiKey || !apiKey.startsWith('re_')) {
  console.error(
    'Usage: node scripts/configure-resend.mjs <re_YOUR_RESEND_API_KEY> ["Verisource Watchdog <alerts@verisource.dev>"]'
  );
  process.exit(1);
}

function putVercelEnv(name, value) {
  spawnSync(
    process.platform === 'win32' ? 'cmd.exe' : 'npx',
    process.platform === 'win32'
      ? ['/c', `npx --yes vercel env rm ${name} production --yes`]
      : ['--yes', 'vercel', 'env', 'rm', name, 'production', '--yes'],
    { cwd: rootDir, stdio: 'ignore' }
  );

  const res = spawnSync(
    process.platform === 'win32' ? 'cmd.exe' : 'npx',
    process.platform === 'win32'
      ? ['/c', `npx --yes vercel env add ${name} production`]
      : ['--yes', 'vercel', 'env', 'add', name, 'production'],
    {
      cwd: rootDir,
      input: value,
      encoding: 'utf8',
      stdio: ['pipe', 'inherit', 'inherit'],
    }
  );
  if (res.status !== 0) {
    throw new Error(`Failed setting ${name} on Vercel production`);
  }
}

function putWranglerSecret(name, value) {
  const res = spawnSync(
    process.platform === 'win32' ? 'cmd.exe' : 'npx',
    process.platform === 'win32'
      ? ['/c', `npx --yes wrangler secret put ${name}`]
      : ['--yes', 'wrangler', 'secret', 'put', name],
    {
      cwd: workerDir,
      input: value,
      encoding: 'utf8',
      stdio: ['pipe', 'inherit', 'inherit'],
    }
  );
  if (res.status !== 0) {
    throw new Error(`Failed setting ${name} on Cloudflare Worker`);
  }
}

console.log('1/4 Syncing RESEND_API_KEY & ALERT_FROM_EMAIL to Vercel Production...');
putVercelEnv('RESEND_API_KEY', apiKey);
putVercelEnv('ALERT_FROM_EMAIL', fromEmail);

console.log('2/4 Syncing RESEND_API_KEY & ALERT_FROM_EMAIL to Cloudflare Worker...');
putWranglerSecret('RESEND_API_KEY', apiKey);
putWranglerSecret('ALERT_FROM_EMAIL', fromEmail);

console.log('3/4 Redeploying Cloudflare Worker...');
const cfDeploy = spawnSync(
  process.platform === 'win32' ? 'cmd.exe' : 'npx',
  process.platform === 'win32'
    ? ['/c', 'npx --yes wrangler deploy']
    : ['--yes', 'wrangler', 'deploy'],
  { cwd: workerDir, stdio: 'inherit' }
);
if (cfDeploy.status !== 0) process.exit(cfDeploy.status ?? 1);

console.log('4/4 Redeploying Vercel Production...');
const vercelDeploy = spawnSync(
  process.platform === 'win32' ? 'cmd.exe' : 'npx',
  process.platform === 'win32'
    ? ['/c', 'npx --yes vercel --prod --yes']
    : ['--yes', 'vercel', '--prod', '--yes'],
  { cwd: rootDir, stdio: 'inherit' }
);
if (vercelDeploy.status !== 0) process.exit(vercelDeploy.status ?? 1);

console.log('✔ Live Resend delivery active across both verisource.dev and mcp.verisource.dev!');
