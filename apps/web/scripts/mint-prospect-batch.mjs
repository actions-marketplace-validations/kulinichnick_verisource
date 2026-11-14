import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  DEMO_PROFILE,
  buildBatchOutreachCsv,
  buildBatchOutreachMarkdown,
  parseBatchProspectDomains,
  runFullGeoAudit,
} from '@verisource/core-geo';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

function getFlagValue(args, flagName, fallback = undefined) {
  const idx = args.indexOf(flagName);
  if (idx === -1 || idx + 1 >= args.length) return fallback;
  return args[idx + 1];
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const lanes = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(
    Array.from({ length: lanes }, async () => {
      while (cursor < items.length) {
        const idx = cursor;
        cursor += 1;
        results[idx] = await worker(items[idx], idx);
      }
    })
  );
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const domainsFile = getFlagValue(args, '--file');
  const rawDomainsArg =
    domainsFile && fs.existsSync(domainsFile)
      ? fs.readFileSync(domainsFile, 'utf8')
      : getFlagValue(args, '--domains', 'aurearoasters.com,mosaicroasters.com');

  const agencyName = getFlagValue(args, '--agency', 'Verisource GEO Advisory');
  const primaryColor = getFlagValue(args, '--color', '#0A0E17');
  const ctaUrl = getFlagValue(args, '--cta', 'https://verisource.dev/pricing');
  const logoUrl = getFlagValue(args, '--logo', null);
  const baseUrl = getFlagValue(args, '--base-url', 'https://verisource.dev');
  const outDir = getFlagValue(args, '--out-dir');
  const useLiveProviders = args.includes('--live');
  const persistToSupabase = args.includes('--persist');

  const domains = parseBatchProspectDomains(rawDomainsArg, 25);
  const rawEnv = {
    PROVIDER_MODE: useLiveProviders ? 'live' : 'mock',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
  };

  console.log(
    `[Verisource Batch Prospecting] Auditing ${domains.length} domain(s) (mode=${rawEnv.PROVIDER_MODE}, persist=${persistToSupabase})...`
  );

  const createdIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + 30 * 86400 * 1000).toISOString();

  const reports = await mapWithConcurrency(domains, 3, async (hostname) => {
    const audit = await runFullGeoAudit({
      domainInput: hostname,
      rawEnv,
    });
    const slugBase = audit.hostname
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    const shareSlug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

    console.log(
      `  ✔ ${audit.brandName} (${audit.hostname}) -> ${audit.visibilityScore}/100 visibility | ${audit.allHallucinations.length} hallucination(s) | /audit/${shareSlug}`
    );

    return {
      id: crypto.randomUUID(),
      agency_user_id: DEMO_PROFILE.id,
      share_slug: shareSlug,
      prospect_domain: audit.domainUrl,
      prospect_brand_name: audit.brandName,
      visibility_score: audit.visibilityScore,
      hallucination_count: audit.allHallucinations.length,
      agency_brand_name_snapshot: agencyName,
      agency_logo_url_snapshot: logoUrl,
      agency_primary_color_snapshot: primaryColor,
      agency_cta_url_snapshot: ctaUrl,
      summary_payload: audit.pitchSummaryPayload,
      views_count: 0,
      expires_at: expiresIso,
      created_at: createdIso,
    };
  });

  if (persistToSupabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      throw new Error(
        'Cannot --persist without NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      );
    }
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase
      .from('agency_pitch_reports')
      .insert(reports);
    if (error) throw error;
    console.log(
      `  ✔ Persisted ${reports.length} live white-label /audit/[slug] report(s) to Supabase.`
    );
  }

  const csv = buildBatchOutreachCsv(reports, baseUrl);
  const playbook = buildBatchOutreachMarkdown(reports, baseUrl);

  console.log(
    `  ✔ Outreach Playbook Critic Score: ${playbook.score.toFixed(1)} / 10.0`
  );

  if (outDir) {
    const resolvedDir = path.resolve(process.cwd(), outDir);
    fs.mkdirSync(resolvedDir, { recursive: true });
    const csvPath = path.join(resolvedDir, 'verisource-outreach-batch.csv');
    const mdPath = path.join(resolvedDir, 'verisource-outreach-playbook.md');
    fs.writeFileSync(csvPath, csv, 'utf8');
    fs.writeFileSync(mdPath, playbook.content, 'utf8');
    console.log(`  ✔ Wrote CSV:      ${csvPath}`);
    console.log(`  ✔ Wrote Playbook: ${mdPath}`);
  }
}

main().catch((err) => {
  console.error('Batch Prospecting Failed:', err);
  process.exit(1);
});
