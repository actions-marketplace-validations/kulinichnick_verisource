import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  AUREA_DOMAIN_ID,
  MOSAIC_DOMAIN_ID,
  PATIENT_ZERO_DOMAINS,
  runDomainReadinessScan,
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const liveEnv = {
  PROVIDER_MODE: 'live',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
};

async function syncStore(domainId, domainUrl, verifiedTruthOverride) {
  console.log(`\nScanning live storefront: ${domainUrl} ...`);
  const readiness = await runDomainReadinessScan(domainUrl, liveEnv);
  const fullAudit = await runFullGeoAudit({
    domainInput: domainUrl,
    existingTruthSheet: verifiedTruthOverride,
    rawEnv: liveEnv,
  });

  console.log('  Readiness Summary:', {
    visibilityScore: readiness.visibilityScore,
    agentsMdStatus: readiness.agentsMdStatus,
    llmsTxtStatus: readiness.llmsTxtStatus,
    shopifyMcpStatus: readiness.shopifyMcpStatus,
    jsonLdCount: readiness.jsonLdCount,
    wafBlocked: readiness.robotsAiBotStatus.waf_blocked,
  });
  console.log('  Full Audit Summary:', {
    visibilityScore: fullAudit.visibilityScore,
    accuracyScore: fullAudit.accuracyScore,
    scans: fullAudit.scanResults.length,
    hallucinations: fullAudit.allHallucinations.length,
  });

  const effectiveScore = Math.max(readiness.visibilityScore, fullAudit.visibilityScore);

  const { error: domErr } = await supabase
    .from('domains')
    .update({
      is_shopify: true,
      shopify_mcp_status: fullAudit.shopify.shopifyMcpStatus,
      agents_md_status: fullAudit.shopify.agentsMdStatus,
      llms_txt_status: fullAudit.probe.llmsTxtStatus,
      robots_ai_bot_status: fullAudit.probe.robotsAiBotStatus,
      brand_truth_sheet: verifiedTruthOverride,
      visibility_score: effectiveScore,
      accuracy_score: fullAudit.accuracyScore,
      last_scanned_at: new Date().toISOString(),
    })
    .eq('id', domainId);

  if (domErr) throw domErr;

  const { error: fixErr } = await supabase
    .from('generated_fixes')
    .update({ is_applied: true })
    .eq('domain_id', domainId)
    .in('fix_type', ['json_ld_schema', 'shopify_agents_liquid', 'agents_md']);

  if (fixErr) throw fixErr;

  console.log(`  ✓ Synced ${domainUrl} to Supabase (visibility_score=${effectiveScore}, agents_md=${fullAudit.shopify.agentsMdStatus})`);
  return { readiness, fullAudit, effectiveScore };
}

const aureaBase = PATIENT_ZERO_DOMAINS.find((d) => d.id === AUREA_DOMAIN_ID).brand_truth_sheet;
const mosaicBase = PATIENT_ZERO_DOMAINS.find((d) => d.id === MOSAIC_DOMAIN_ID).brand_truth_sheet;

await syncStore(AUREA_DOMAIN_ID, 'https://aurearoasters.com', {
  ...aureaBase,
  is_user_verified: true,
  verified_pricing_summary:
    '12oz single-origin & signature bags $21.95–$24.95 USD; 3-bag Origin Trinity $59.95; 6-bag Cloud of Witnesses $109.95.',
});

await syncStore(MOSAIC_DOMAIN_ID, 'https://mosaicroasters.com', {
  ...mosaicBase,
  is_user_verified: true,
  verified_pricing_summary:
    '12oz single-origin bags $21.95 USD; 3-bag Origin Trifecta $54.95; 6-bag sampler $99.95; 5lb wholesale $105–$119; commercial espresso tuning $194.95–$324.95.',
});

console.log('\nSUCCESS: Both Patient Zero storefronts synced with live post-remediation telemetry in Supabase.');
