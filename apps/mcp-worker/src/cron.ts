import { createClient } from '@supabase/supabase-js';
import {
  dispatchHallucinationDriftEmail,
  dispatchWeeklyExecutiveDigestEmail,
  runFullGeoAudit,
  type AiAttributionEventRow,
  type Database,
  type DomainRow,
  type GeneratedFixRow,
  type ProfileRow,
  type TrackedPromptRow,
} from '@verisource/core-geo';
import { workerEnvToRawInput, type WorkerEnv } from './types.js';

export interface CronScanBatchSummary {
  mode: 'live_supabase' | 'mock_noop';
  domainsScanned: number;
  snapshotsInserted: number;
  alertsDispatched: number;
  digestsDispatched: number;
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
      digestsDispatched: 0,
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
  let digestsDispatched = 0;

  for (const domain of domains) {
    const previousVisibilityScore = domain.visibility_score;

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

    try {
      const { data: ownerRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', domain.user_id)
        .maybeSingle();

      const owner = (ownerRow ?? null) as ProfileRow | null;
      if (!owner?.email || owner.plan_tier === 'free') {
        continue;
      }

      const appBaseUrl = env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev';

      // 1. Urgent Hallucination / WAF Block Alert (All Paid Tiers)
      if (audit.allHallucinations.length > 0 || blockedBots.length > 0) {
        const dedupKey = `alert_dedup:${domain.id}`;
        const alreadySent = env.MCP_CACHE_KV
          ? await env.MCP_CACHE_KV.get(dedupKey)
          : null;

        if (!alreadySent) {
          const dispatchResult = await dispatchHallucinationDriftEmail({
            recipientEmail: owner.email,
            brandName: domain.brand_name,
            domainUrl: domain.domain_url,
            visibilityScore: audit.visibilityScore,
            accuracyScore: audit.accuracyScore,
            hallucinations: audit.allHallucinations,
            blockedBots,
            consoleBaseUrl: appBaseUrl,
            resendApiKey: env.RESEND_API_KEY,
            fromEmail: env.ALERT_FROM_EMAIL,
          });

          if (dispatchResult.delivered) {
            alertsDispatched += 1;
            if (env.MCP_CACHE_KV) {
              await env.MCP_CACHE_KV.put(dedupKey, new Date().toISOString(), {
                expirationTtl: SIX_DAYS_SECONDS,
              });
            }
          }
        }
      }

      // 2. Weekly Executive Client Digest (Pro $99/mo & Agency $249/mo Tiers)
      if (owner.plan_tier === 'pro_99' || owner.plan_tier === 'agency_249') {
        const digestDedupKey = `digest_dedup:${domain.id}`;
        const alreadySentDigest = env.MCP_CACHE_KV
          ? await env.MCP_CACHE_KV.get(digestDedupKey)
          : null;

        if (!alreadySentDigest) {
          const sevenDaysAgoIso = new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString();

          const [{ data: attrRows }, { data: fixRows }] = await Promise.all([
            supabase
              .from('ai_attribution_events')
              .select('*')
              .eq('domain_id', domain.id)
              .gte('created_at', sevenDaysAgoIso),
            supabase
              .from('generated_fixes')
              .select('*')
              .eq('domain_id', domain.id),
          ]);

          const events = (attrRows ?? []) as AiAttributionEventRow[];
          const fixes = (fixRows ?? []) as GeneratedFixRow[];
          const aiReferralVisits7d = events.filter(
            (ev) => ev.event_type === 'ai_referral_visit'
          ).length;
          const aiReferralRevenueUsd7d = events
            .filter((ev) => ev.event_type === 'ai_referral_conversion')
            .reduce((sum, ev) => sum + Number(ev.conversion_value_usd ?? 0), 0);

          const appliedFixesCount = fixes.filter((f) => f.is_applied).length;
          const enginesCitingCount = audit.scanResults.filter(
            (s) => s.brandMentioned
          ).length;
          const rivalSet = new Set<string>();
          for (const snap of audit.scanResults) {
            for (const comp of snap.competitorsMentioned) {
              if (comp) rivalSet.add(comp);
            }
          }

          const digestResult = await dispatchWeeklyExecutiveDigestEmail({
            recipientEmail: owner.email,
            brandName: domain.brand_name,
            domainUrl: domain.domain_url,
            visibilityScore: audit.visibilityScore,
            previousVisibilityScore,
            accuracyScore: audit.accuracyScore,
            enginesCitingCount,
            totalSnapshotsScanned: audit.scanResults.length,
            aiReferralVisits7d,
            aiReferralRevenueUsd7d,
            appliedFixesCount,
            totalFixesCount: fixes.length || audit.fixes.length,
            activeHallucinationCount: audit.allHallucinations.length,
            blockedBots,
            topRivalDomains: Array.from(rivalSet).slice(0, 3),
            agencyBrandName:
              owner.plan_tier === 'agency_249'
                ? owner.agency_brand_name
                : null,
            agencyPrimaryColor:
              owner.plan_tier === 'agency_249'
                ? owner.agency_primary_color
                : null,
            agencyCtaUrl:
              owner.plan_tier === 'agency_249' ? owner.agency_cta_url : null,
            consoleBaseUrl: appBaseUrl,
            resendApiKey: env.RESEND_API_KEY,
            fromEmail: env.ALERT_FROM_EMAIL,
          });

          if (digestResult.delivered) {
            digestsDispatched += 1;
            if (env.MCP_CACHE_KV) {
              await env.MCP_CACHE_KV.put(
                digestDedupKey,
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

  return {
    mode: 'live_supabase',
    domainsScanned: domains.length,
    snapshotsInserted,
    alertsDispatched,
    digestsDispatched,
  };
}
