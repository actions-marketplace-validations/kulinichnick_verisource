import { createClient } from '@supabase/supabase-js';
import {
  cadenceWordForFrequency,
  computeDeterministicProtocolPoints,
  computeWatchdogRegressionFingerprint,
  DEMO_USER_ID,
  dispatchHallucinationDriftEmail,
  dispatchTrialActivationNudgeEmail,
  dispatchWeeklyExecutiveDigestEmail,
  evaluateTrialLifecycleStage,
  normalizeDomainReportSchedule,
  runFullGeoAudit,
  selectLatestLiveSnapshotsPerPromptEngine,
  shouldSendRegressionWatchdogAlert,
  shouldSendScheduledDigest,
  stabilizeScheduledVisibilityScore,
  type AiAttributionEventRow,
  type BrandTruthSheet,
  type CitationSnapshotRow,
  type Database,
  type DomainRow,
  type GeneratedFixRow,
  type ProfileRow,
  type TrackedPromptRow,
} from '@verisource/core-geo';
import {
  resolveWorkerKv,
  workerEnvToRawInput,
  type WorkerEnv,
} from './types.js';

export interface CronScanBatchSummary {
  mode: 'live_supabase' | 'mock_noop';
  domainsScanned: number;
  snapshotsInserted: number;
  alertsDispatched: number;
  digestsDispatched: number;
  trialNudgesDispatched: number;
}

const MAX_DOMAINS_PER_CRON_CHUNK = 12;
const TWENTY_HOURS_SECONDS = 72000;
const SIX_DAYS_SECONDS = 518400;
const TWENTY_FIVE_DAYS_SECONDS = 2160000;
const NINETY_DAYS_SECONDS = 7776000;

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
      trialNudgesDispatched: 0,
    };
  }

  const kv = resolveWorkerKv(env);
  const now = new Date();
  const nowIso = now.toISOString();

  const supabase = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: domainRows } = await supabase
    .from('domains')
    .select('*')
    .neq('user_id', DEMO_USER_ID)
    .order('last_scanned_at', { ascending: true, nullsFirst: true })
    .limit(MAX_DOMAINS_PER_CRON_CHUNK);

  const domains = (domainRows ?? []) as DomainRow[];
  let snapshotsInserted = 0;
  let alertsDispatched = 0;
  let digestsDispatched = 0;
  let trialNudgesDispatched = 0;
  const processedTrialUserIds = new Set<string>();

  for (const domain of domains) {
    if (domain.user_id === DEMO_USER_ID) continue;

    const previousVisibilityScore = domain.visibility_score;
    const previousProtocolPoints = computeDeterministicProtocolPoints({
      robotsAiBotStatus: domain.robots_ai_bot_status,
      llmsTxtStatus: domain.llms_txt_status,
      agentsMdStatus: domain.agents_md_status,
      isShopify: domain.is_shopify,
      shopifyMcpStatus: domain.shopify_mcp_status,
    });

    const [{ data: promptRows }, { data: recentSnapRows }] = await Promise.all([
      supabase
        .from('tracked_prompts')
        .select('*')
        .eq('domain_id', domain.id)
        .eq('is_active', true)
        .limit(10),
      supabase
        .from('citation_snapshots')
        .select('*')
        .eq('domain_id', domain.id)
        .neq('fanout_telemetry_type', 'mock_fixture')
        .order('scanned_at', { ascending: false })
        .limit(24),
    ]);

    const prompts = (promptRows ?? []) as TrackedPromptRow[];
    const promptStrings = prompts.map((p) => p.prompt_text);
    const priorLiveSnapshots = selectLatestLiveSnapshotsPerPromptEngine(
      (recentSnapRows ?? []) as CitationSnapshotRow[]
    );

    const audit = await runFullGeoAudit({
      domainInput: domain.domain_url,
      customBrandName: domain.brand_name,
      customPrompts: promptStrings.length > 0 ? promptStrings : undefined,
      customTruthSheet: domain.brand_truth_sheet,
      rawEnv: workerEnvToRawInput(env),
      priorLiveSnapshots,
    });

    const newProtocolPoints = computeDeterministicProtocolPoints({
      robotsAiBotStatus: audit.probe.robotsAiBotStatus,
      llmsTxtStatus: audit.probe.llmsTxtStatus,
      agentsMdStatus: audit.shopify.agentsMdStatus,
      isShopify: audit.shopify.isShopify,
      shopifyMcpStatus: audit.shopify.shopifyMcpStatus,
    });

    const stabilizedVisibilityScore = stabilizeScheduledVisibilityScore({
      previousScore: previousVisibilityScore,
      rawNewScore: audit.visibilityScore,
      previousProtocolPoints,
      newProtocolPoints,
    });

    const liveSnapshotsToInsert = audit.scanResults
      .filter((scan) => scan.fanoutTelemetryType !== 'mock_fixture')
      .map((scan) => {
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

    if (liveSnapshotsToInsert.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('citation_snapshots') as any).insert(
        liveSnapshotsToInsert
      );
      snapshotsInserted += liveSnapshotsToInsert.length;
    }

    const blockedBots = extractBlockedBots(audit.probe.robotsAiBotStatus);
    const currentAlertFingerprint = computeWatchdogRegressionFingerprint({
      blockedBots,
      hallucinations: audit.allHallucinations,
    });

    const schedule = normalizeDomainReportSchedule(
      domain.brand_truth_sheet?.report_schedule
    );
    let nextLastDigestSentAt = schedule.last_digest_sent_at;
    let nextLastAlertSentAt = schedule.last_alert_sent_at;
    let nextLastAlertFingerprint = currentAlertFingerprint;

    try {
      const { data: ownerRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', domain.user_id)
        .maybeSingle();

      const owner = (ownerRow ?? null) as ProfileRow | null;
      const appBaseUrl = env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev';

      if (owner?.email && owner.plan_tier !== 'free') {
        const targetRecipient = schedule.recipient_email ?? owner.email;

        // 1. State-Transition Regression Watchdog Alert (Only fires on a NEW bot block or NEW claim regression)
        if (
          shouldSendRegressionWatchdogAlert({
            schedule,
            currentFingerprint: currentAlertFingerprint,
            now,
          })
        ) {
          const dedupKey = `alert_dedup:${domain.id}:${currentAlertFingerprint}`;
          const alreadySentKv = kv ? await kv.get(dedupKey) : null;

          if (!alreadySentKv) {
            const dispatchResult = await dispatchHallucinationDriftEmail({
              recipientEmail: targetRecipient,
              brandName: domain.brand_name,
              domainUrl: domain.domain_url,
              visibilityScore: stabilizedVisibilityScore,
              previousVisibilityScore,
              accuracyScore: audit.accuracyScore,
              hallucinations: audit.allHallucinations,
              blockedBots,
              consoleBaseUrl: appBaseUrl,
              resendApiKey: env.RESEND_API_KEY,
              fromEmail: env.ALERT_FROM_EMAIL,
            });

            if (dispatchResult.delivered) {
              alertsDispatched += 1;
              nextLastAlertSentAt = nowIso;
              nextLastAlertFingerprint = currentAlertFingerprint;
              if (kv) {
                await kv.put(dedupKey, nowIso, {
                  expirationTtl: SIX_DAYS_SECONDS,
                });
              }
            }
          }
        }

        const sevenDaysAgoIso = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
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
        const botCrawlCount = events.filter(
          (ev) => ev.event_type === 'ai_bot_crawl'
        ).length;

        const onSiteFixes = fixes.filter(
          (f) => f.fix_type !== 'citation_outreach_brief'
        );
        const appliedFixesCount = fixes.filter((f) => f.is_applied).length;
        const appliedOnSiteCount = onSiteFixes.filter((f) => f.is_applied).length;
        const rivalSet = new Set<string>();
        for (const snap of audit.scanResults) {
          for (const comp of snap.competitorsMentioned) {
            if (comp) rivalSet.add(comp);
          }
        }
        const topRivals = Array.from(rivalSet).slice(0, 3);

        // 2. Automated 7-Day Free Trial Onboarding & Activation Nudge (Day 3 & Day 5)
        const trialStage = evaluateTrialLifecycleStage({
          planTier: owner.plan_tier,
          billingCycle: owner.billing_cycle,
          mcpCallsLimit: owner.mcp_calls_limit,
          stripeSubscriptionId: owner.stripe_subscription_id,
          tripwirePaidAt: owner.tripwire_paid_at,
          profileCreatedAtIso: owner.created_at,
        });

        if (trialStage && !processedTrialUserIds.has(owner.id)) {
          processedTrialUserIds.add(owner.id);
          const shouldSendForStage =
            trialStage === 'day5_value_proof' || appliedOnSiteCount === 0;

          if (shouldSendForStage) {
            const trialDedupKey = `trial_nudge:${trialStage}:${owner.id}`;
            const alreadySentTrialNudge = kv
              ? await kv.get(trialDedupKey)
              : null;

            if (!alreadySentTrialNudge) {
              const nudgeResult = await dispatchTrialActivationNudgeEmail({
                recipientEmail: owner.email,
                stage: trialStage,
                planTier: owner.plan_tier,
                brandName: domain.brand_name,
                domainUrl: domain.domain_url,
                visibilityScore: stabilizedVisibilityScore,
                accuracyScore: audit.accuracyScore,
                appliedFixesCount: appliedOnSiteCount,
                totalFixesCount: onSiteFixes.length || 4,
                botCrawlCount,
                aiReferralVisits7d,
                hallucinationCount: audit.allHallucinations.length,
                robotsAiBotStatus: audit.probe.robotsAiBotStatus,
                llmsTxtStatus: audit.probe.llmsTxtStatus,
                agentsMdStatus: audit.shopify.agentsMdStatus,
                jsonLdCount: audit.probe.jsonLdBlocks.length,
                topRivals,
                consoleBaseUrl: appBaseUrl,
                resendApiKey: env.RESEND_API_KEY,
                fromEmail: env.ALERT_FROM_EMAIL,
              });

              if (nudgeResult.delivered) {
                trialNudgesDispatched += 1;
                if (kv) {
                  await kv.put(trialDedupKey, nowIso, {
                    expirationTtl: NINETY_DAYS_SECONDS,
                  });
                }
              }
            }
          }
        }

        // 3. Customer-Scheduled Executive Digest (Default: Weekly on Mondays; supports Daily, Weekly, Monthly, or Paused)
        const eligibleForScheduledDigest =
          owner.plan_tier === 'starter_49' ||
          owner.plan_tier === 'pro_99' ||
          owner.plan_tier === 'agency_249';

        if (
          eligibleForScheduledDigest &&
          shouldSendScheduledDigest(schedule, now)
        ) {
          const digestDedupKey = `digest_dedup:${domain.id}:${nowIso.slice(0, 10)}`;
          const alreadySentDigestKv = kv
            ? await kv.get(digestDedupKey)
            : null;

          if (!alreadySentDigestKv) {
            const enginesCitingCount = audit.scanResults.filter(
              (s) => s.brandMentioned
            ).length;

            const digestResult = await dispatchWeeklyExecutiveDigestEmail({
              recipientEmail: targetRecipient,
              brandName: domain.brand_name,
              domainUrl: domain.domain_url,
              visibilityScore: stabilizedVisibilityScore,
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
              topRivalDomains: topRivals,
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
              cadenceLabel: cadenceWordForFrequency(schedule.frequency),
              resendApiKey: env.RESEND_API_KEY,
              fromEmail: env.ALERT_FROM_EMAIL,
            });

            if (digestResult.delivered) {
              digestsDispatched += 1;
              nextLastDigestSentAt = nowIso;
              if (kv) {
                const ttl =
                  schedule.frequency === 'daily'
                    ? TWENTY_HOURS_SECONDS
                    : schedule.frequency === 'monthly'
                      ? TWENTY_FIVE_DAYS_SECONDS
                      : SIX_DAYS_SECONDS;
                await kv.put(digestDedupKey, nowIso, {
                  expirationTtl: ttl,
                });
              }
            }
          }
        }
      }
    } catch {
      // Never block scheduled DB telemetry writes if outbound email fails
    }

    const updatedTruthSheet: BrandTruthSheet = {
      ...domain.brand_truth_sheet,
      report_schedule: {
        frequency: schedule.frequency,
        day_of_week: schedule.day_of_week,
        day_of_month: schedule.day_of_month,
        recipient_email: schedule.recipient_email,
        watchdog_alerts_enabled: schedule.watchdog_alerts_enabled,
        last_digest_sent_at: nextLastDigestSentAt,
        last_alert_sent_at: nextLastAlertSentAt,
        last_alert_fingerprint: nextLastAlertFingerprint,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('domains') as any)
      .update({
        is_shopify: audit.shopify.isShopify,
        shopify_mcp_status: audit.shopify.shopifyMcpStatus,
        agents_md_status: audit.shopify.agentsMdStatus,
        llms_txt_status: audit.probe.llmsTxtStatus,
        robots_ai_bot_status: audit.probe.robotsAiBotStatus,
        brand_truth_sheet: updatedTruthSheet,
        visibility_score: stabilizedVisibilityScore,
        accuracy_score: audit.accuracyScore,
        last_scanned_at: nowIso,
      })
      .eq('id', domain.id);
  }

  // 4. Catch-Up Sweep for 0-Domain 7-Day Trial Signups (Rescue Unactivated Trial Users)
  try {
    const sevenDaysAgoIso = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: recentTrialProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('plan_tier', ['starter_49', 'pro_99'])
      .eq('billing_cycle', 'monthly')
      .gte('created_at', sevenDaysAgoIso)
      .limit(10);

    const appBaseUrl = env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev';

    for (const rawProfile of (recentTrialProfiles ?? []) as ProfileRow[]) {
      if (
        !rawProfile.email ||
        rawProfile.id === DEMO_USER_ID ||
        processedTrialUserIds.has(rawProfile.id)
      ) {
        continue;
      }
      const stage = evaluateTrialLifecycleStage({
        planTier: rawProfile.plan_tier,
        billingCycle: rawProfile.billing_cycle,
        mcpCallsLimit: rawProfile.mcp_calls_limit,
        stripeSubscriptionId: rawProfile.stripe_subscription_id,
        tripwirePaidAt: rawProfile.tripwire_paid_at,
        profileCreatedAtIso: rawProfile.created_at,
      });
      if (!stage) continue;

      const { data: existingUserDomains } = await supabase
        .from('domains')
        .select('id')
        .eq('user_id', rawProfile.id)
        .limit(1);

      if (existingUserDomains && existingUserDomains.length > 0) {
        continue;
      }

      const trialDedupKey = `trial_nudge:${stage}:${rawProfile.id}`;
      const alreadySent = kv ? await kv.get(trialDedupKey) : null;
      if (alreadySent) continue;

      const rescueResult = await dispatchTrialActivationNudgeEmail({
        recipientEmail: rawProfile.email,
        stage,
        planTier: rawProfile.plan_tier,
        domainUrl: null,
        consoleBaseUrl: appBaseUrl,
        resendApiKey: env.RESEND_API_KEY,
        fromEmail: env.ALERT_FROM_EMAIL,
      });

      if (rescueResult.delivered) {
        trialNudgesDispatched += 1;
        if (kv) {
          await kv.put(trialDedupKey, nowIso, {
            expirationTtl: NINETY_DAYS_SECONDS,
          });
        }
      }
    }
  } catch {
    // Non-blocking catch-up sweep
  }

  return {
    mode: 'live_supabase',
    domainsScanned: domains.length,
    snapshotsInserted,
    alertsDispatched,
    digestsDispatched,
    trialNudgesDispatched,
  };
}
