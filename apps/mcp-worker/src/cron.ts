import { createClient } from '@supabase/supabase-js';
import {
  dispatchHallucinationDriftEmail,
  runFullGeoAudit,
  type Database,
  type DomainRow,
  type ProfileRow,
  type TrackedPromptRow,
} from '@verisource/core-geo';
import { workerEnvToRawInput, type WorkerEnv } from './types.js';

export interface CronScanBatchSummary {
  mode: 'live_supabase' | 'mock_noop';
  domainsScanned: number;
  snapshotsInserted: number;
  alertsDispatched: number;
}

const MAX_DOMAINS_PER_CRON_CHUNK = 5;
const SIX_DAYS_SECONDS = 518400;

function extractBlockedBots(
  botStatus: DomainRow['robots_ai_bot_status']
): string[] {
  const blocked: string[] = [];
  if (!botStatus.GPTBot) blocked.push('GPTBot');
  if (!botStatus['OAI-SearchBot']) blocked.push('OAI-SearchBot');
  if (!botStatus.PerplexityBot) blocked.push('PerplexityBot');
  if (!botStatus.ClaudeBot) blocked.push('ClaudeBot');
  if (!botStatus['Google-Extended']) blocked.push('Google-Extended');
  if (botStatus.waf_blocked && blocked.length === 0) {
    blocked.push('Edge WAF HTTP 403');
  }
  return blocked;
}

export async function runScheduledDomainScans(
  env: WorkerEnv
): Promise<CronScanBatchSummary> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      mode: 'mock_noop',
      domainsScanned: 0,
      snapshotsInserted: 0,
      alertsDispatched: 0,
    };
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
  let alertsDispatched = 0;

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

    const blockedBots = extractBlockedBots(audit.probe.robotsAiBotStatus);
    if (audit.allHallucinations.length > 0 || blockedBots.length > 0) {
      try {
        const dedupKey = `alert_dedup:${domain.id}`;
        const alreadySent = env.MCP_CACHE_KV
          ? await env.MCP_CACHE_KV.get(dedupKey)
          : null;

        if (!alreadySent) {
          const { data: ownerRow } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', domain.user_id)
            .maybeSingle();

          const owner = (ownerRow ?? null) as ProfileRow | null;
          if (owner?.email && owner.plan_tier !== 'free') {
            const dispatchResult = await dispatchHallucinationDriftEmail({
              recipientEmail: owner.email,
              brandName: domain.brand_name,
              domainUrl: domain.domain_url,
              visibilityScore: audit.visibilityScore,
              accuracyScore: audit.accuracyScore,
              hallucinations: audit.allHallucinations,
              blockedBots,
              consoleBaseUrl: env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev',
              resendApiKey: env.RESEND_API_KEY,
              fromEmail: env.ALERT_FROM_EMAIL,
            });

            if (dispatchResult.delivered) {
              alertsDispatched += 1;
              if (env.MCP_CACHE_KV) {
                await env.MCP_CACHE_KV.put(
                  dedupKey,
                  new Date().toISOString(),
                  { expirationTtl: SIX_DAYS_SECONDS }
                );
              }
            }
          }
        }
      } catch {
        // Never block scheduled DB telemetry writes if outbound email fails
      }
    }
  }

  return {
    mode: 'live_supabase',
    domainsScanned: domains.length,
    snapshotsInserted,
    alertsDispatched,
  };
}
