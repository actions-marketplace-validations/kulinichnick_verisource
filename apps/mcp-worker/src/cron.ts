import { createClient } from '@supabase/supabase-js';
import {
  runFullGeoAudit,
  type Database,
  type DomainRow,
  type TrackedPromptRow,
} from '@verisource/core-geo';
import { workerEnvToRawInput, type WorkerEnv } from './types.js';

export interface CronScanBatchSummary {
  mode: 'live_supabase' | 'mock_noop';
  domainsScanned: number;
  snapshotsInserted: number;
}

const MAX_DOMAINS_PER_CRON_CHUNK = 5;

export async function runScheduledDomainScans(
  env: WorkerEnv
): Promise<CronScanBatchSummary> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { mode: 'mock_noop', domainsScanned: 0, snapshotsInserted: 0 };
  }

  const supabase = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: domainRows } = await supabase
    .from('domains')
    .select('*')
    .order('last_scanned_at', { ascending: true, nullsFirst: true })
    .limit(MAX_DOMAINS_PER_CRON_CHUNK);

  const domains = (domainRows ?? []) as DomainRow[];
  let snapshotsInserted = 0;

  for (const domain of domains) {
    const { data: promptRows } = await supabase
      .from('tracked_prompts')
      .select('*')
      .eq('domain_id', domain.id)
      .eq('is_active', true)
      .limit(10);

    const prompts = (promptRows ?? []) as TrackedPromptRow[];
    const promptStrings = prompts.map((p) => p.prompt_text);

    const audit = await runFullGeoAudit({
      domainInput: domain.domain_url,
      customBrandName: domain.brand_name,
      customPrompts: promptStrings.length > 0 ? promptStrings : undefined,
      customTruthSheet: domain.brand_truth_sheet,
      rawEnv: workerEnvToRawInput(env),
    });

    const snapshotsPayload = audit.scanResults.map((scan) => {
      const matchedPrompt = prompts.find(
        (p) => p.prompt_text === scan.promptText
      );
      return {
        domain_id: domain.id,
        prompt_id: matchedPrompt?.id ?? null,
        ai_engine: scan.aiEngine,
        brand_mentioned: scan.brandMentioned,
        citation_rank: scan.citationRank,
        competitors_mentioned: scan.competitorsMentioned,
        cited_source_urls: scan.citedSourceUrls,
        fanout_telemetry_type: scan.fanoutTelemetryType,
        hallucination_detected: scan.hallucinationDetected,
        hallucination_details:
          scan.hallucinationDetails.length > 0
            ? scan.hallucinationDetails
            : null,
        raw_answer_excerpt: scan.rawAnswerExcerpt,
      };
    });

    if (snapshotsPayload.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('citation_snapshots') as any).insert(snapshotsPayload);
      snapshotsInserted += snapshotsPayload.length;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('domains') as any)
      .update({
        is_shopify: audit.shopify.isShopify,
        shopify_mcp_status: audit.shopify.shopifyMcpStatus,
        agents_md_status: audit.shopify.agentsMdStatus,
        llms_txt_status: audit.probe.llmsTxtStatus,
        robots_ai_bot_status: audit.probe.robotsAiBotStatus,
        visibility_score: audit.visibilityScore,
        accuracy_score: audit.accuracyScore,
        last_scanned_at: new Date().toISOString(),
      })
      .eq('id', domain.id);
  }

  return {
    mode: 'live_supabase',
    domainsScanned: domains.length,
    snapshotsInserted,
  };
}
