import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  buildCitationAnswerPageBundle,
  computeDeterministicProtocolPoints,
  computeDomainDriftDiff,
  computeWatchdogRegressionFingerprint,
  DEMO_USER_ID,
  dispatchHallucinationDriftEmail,
  inspectJsonLdAiReadiness,
  normalizeDomainReportSchedule,
  normalizePublicDomain,
  runFullGeoAudit,
  selectLatestLiveSnapshotsPerPromptEngine,
  shouldSendRegressionWatchdogAlert,
  stabilizeScheduledVisibilityScore,
  summarizeBrandSentimentAndSov,
  type BrandTruthSheet,
  type CitationSnapshotRow,
  type DomainDriftDiffSummary,
  type DomainRow,
  type GeneratedFixRow,
  type PlanTier,
  type ProfileRow,
  type TrackedPromptRow,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  getServiceSupabaseClient,
} from '../../../../lib/data-store';

export const maxDuration = 60;

function constantTimeBearerMatch(
  header: string | null,
  secret: string
): boolean {
  if (!header || !secret) return false;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  const provided = Buffer.from(match[1].trim(), 'utf8');
  const expected = Buffer.from(secret.trim(), 'utf8');
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

function isAuthorizedCronRequest(request: Request): {
  authorized: boolean;
  isMockMode: boolean;
} {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET ?? '';
  const adminToken = process.env.ADMIN_MAINTENANCE_TOKEN ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const isMockMode =
    !serviceRoleKey &&
    (process.env.PROVIDER_MODE ?? '').toLowerCase() === 'mock';

  const authorized = Boolean(
    (cronSecret && constantTimeBearerMatch(authHeader, cronSecret)) ||
      (adminToken && constantTimeBearerMatch(authHeader, adminToken)) ||
      (serviceRoleKey && constantTimeBearerMatch(authHeader, serviceRoleKey)) ||
      (isMockMode &&
        constantTimeBearerMatch(authHeader, 'vs_mock_owner_session'))
  );

  return { authorized, isMockMode };
}

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

export interface DriftWatchdogDomainReport {
  domainId: string;
  hostname: string;
  brandName: string;
  ownerEmail: string;
  planTier: PlanTier;
  daysSincePurchase: number;
  previousVisibilityScore: number;
  currentVisibilityScore: number;
  previousAccuracyScore: number;
  currentAccuracyScore: number;
  drift: DomainDriftDiffSummary;
  alertDelivered: boolean;
  alertSubject: string | null;
}

export interface TripwireUpgradeCandidate {
  ownerEmail: string;
  hostname: string;
  brandName: string;
  daysSincePurchase: number;
  liveChecksPassed: number;
  pendingChecks: string[];
  starterUpgradeCreditUrl: string;
  proUpgradeCreditUrl: string;
}

export interface SubscriberRetentionAlertItem {
  ownerEmail: string;
  planTier: PlanTier;
  hostname: string;
  brandName: string;
  driftReasons: string[];
  topRivalName: string | null;
  vsRivalComparisonPromptTitle: string | null;
  vsRivalComparisonPromptPreview: string | null;
  consoleRemediationUrl: string;
}

async function executeDriftWatchdogRun(options: {
  dryRun: boolean;
  limit: number;
  isMockMode: boolean;
}): Promise<NextResponse> {
  const appBaseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev'
  ).replace(/\/+$/, '');
  const supabase = getServiceSupabaseClient();

  let targetDomains: DomainRow[] = [];
  const profileByUserId = new Map<string, ProfileRow>();
  const priorSnapshotsByDomain = new Map<string, CitationSnapshotRow[]>();
  const priorFixesByDomain = new Map<string, GeneratedFixRow[]>();
  const promptsByDomain = new Map<string, TrackedPromptRow[]>();

  if (supabase && !options.isMockMode) {
    const { data: paidProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('plan_tier', ['tripwire_19', 'starter_49', 'pro_99', 'agency_249']);

    for (const p of (paidProfiles ?? []) as ProfileRow[]) {
      if (p.id === DEMO_USER_ID) continue;
      profileByUserId.set(p.id, p);
    }

    const paidUserIds = Array.from(profileByUserId.keys());
    if (paidUserIds.length > 0) {
      const { data: domRows } = await supabase
        .from('domains')
        .select('*')
        .in('user_id', paidUserIds)
        .order('last_scanned_at', { ascending: true, nullsFirst: true })
        .limit(options.limit);
      targetDomains = (domRows ?? []) as DomainRow[];
    }

    const domainIds = targetDomains.map((d) => d.id);
    if (domainIds.length > 0) {
      const [snapsRes, fixesRes, promptsRes] = await Promise.all([
        supabase
          .from('citation_snapshots')
          .select('*')
          .in('domain_id', domainIds)
          .order('scanned_at', { ascending: false })
          .limit(domainIds.length * 12),
        supabase
          .from('generated_fixes')
          .select('*')
          .in('domain_id', domainIds),
        supabase
          .from('tracked_prompts')
          .select('*')
          .in('domain_id', domainIds)
          .eq('is_active', true),
      ]);

      for (const s of (snapsRes.data ?? []) as CitationSnapshotRow[]) {
        const arr = priorSnapshotsByDomain.get(s.domain_id) ?? [];
        arr.push(s);
        priorSnapshotsByDomain.set(s.domain_id, arr);
      }
      for (const f of (fixesRes.data ?? []) as GeneratedFixRow[]) {
        const arr = priorFixesByDomain.get(f.domain_id) ?? [];
        arr.push(f);
        priorFixesByDomain.set(f.domain_id, arr);
      }
      for (const pr of (promptsRes.data ?? []) as TrackedPromptRow[]) {
        const arr = promptsByDomain.get(pr.domain_id) ?? [];
        arr.push(pr);
        promptsByDomain.set(pr.domain_id, arr);
      }
    }
  } else {
    const store = getLocalMockStore();
    profileByUserId.set(store.profile.id, store.profile);
    targetDomains = store.domains.slice(0, options.limit);
    for (const s of store.snapshots) {
      const arr = priorSnapshotsByDomain.get(s.domain_id) ?? [];
      arr.push(s);
      priorSnapshotsByDomain.set(s.domain_id, arr);
    }
    for (const f of store.fixes) {
      const arr = priorFixesByDomain.get(f.domain_id) ?? [];
      arr.push(f);
      priorFixesByDomain.set(f.domain_id, arr);
    }
    for (const pr of store.prompts) {
      const arr = promptsByDomain.get(pr.domain_id) ?? [];
      arr.push(pr);
      promptsByDomain.set(pr.domain_id, arr);
    }
  }

  const domainReports: DriftWatchdogDomainReport[] = [];
  const tripwireUpgradeCandidates: TripwireUpgradeCandidate[] = [];
  const subscriberRetentionAlerts: SubscriberRetentionAlertItem[] = [];
  let driftDetectedCount = 0;
  let emailsTriggeredCount = 0;

  for (const domain of targetDomains) {
    const owner = profileByUserId.get(domain.user_id);
    if (!owner || owner.plan_tier === 'free') continue;

    let hostname = domain.domain_url;
    try {
      hostname = normalizePublicDomain(domain.domain_url).hostname;
    } catch {
      // Retain bare string
    }

    const priorSnaps = priorSnapshotsByDomain.get(domain.id) ?? [];
    const priorFixes = priorFixesByDomain.get(domain.id) ?? [];
    const activePrompts = (promptsByDomain.get(domain.id) ?? [])
      .slice(0, 8)
      .map((p) => p.prompt_text);

    const priorCompetitors = Array.from(
      new Set(priorSnaps.flatMap((s) => s.competitors_mentioned ?? []))
    );
    const priorJsonLdApplied = priorFixes.some(
      (f) => f.fix_type === 'json_ld_schema' && f.is_applied
    );

    const priorLiveSnapshots = options.isMockMode
      ? undefined
      : selectLatestLiveSnapshotsPerPromptEngine(priorSnaps);

    const audit = await runFullGeoAudit({
      domainInput: domain.domain_url,
      customBrandName: domain.brand_name,
      customPrompts: activePrompts.length > 0 ? activePrompts : undefined,
      customTruthSheet: domain.brand_truth_sheet,
      rawEnv: {
        PROVIDER_MODE: options.isMockMode
          ? 'mock'
          : (process.env.PROVIDER_MODE ?? 'mock'),
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
        FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
      },
      skipDirectHttpProbe: options.isMockMode,
      priorLiveSnapshots,
    });

    const effectiveVisibilityScore = options.isMockMode
      ? audit.visibilityScore
      : stabilizeScheduledVisibilityScore({
          previousScore: domain.visibility_score,
          rawNewScore: audit.visibilityScore,
          previousProtocolPoints: computeDeterministicProtocolPoints({
            robotsAiBotStatus: domain.robots_ai_bot_status,
            llmsTxtStatus: domain.llms_txt_status,
            agentsMdStatus: domain.agents_md_status,
            isShopify: domain.is_shopify,
            shopifyMcpStatus: domain.shopify_mcp_status,
          }),
          newProtocolPoints: computeDeterministicProtocolPoints({
            robotsAiBotStatus: audit.probe.robotsAiBotStatus,
            llmsTxtStatus: audit.probe.llmsTxtStatus,
            agentsMdStatus: audit.shopify.agentsMdStatus,
            isShopify: audit.shopify.isShopify,
            shopifyMcpStatus: audit.shopify.shopifyMcpStatus,
          }),
        });

    const sovSummary = summarizeBrandSentimentAndSov({
      brandName: domain.brand_name,
      snapshots: audit.scanResults,
    });
    const brandSovEntry = sovSummary.headToHeadSov.find(
      (e) => e.isTargetBrand
    );
    const topRivalEntry =
      sovSummary.headToHeadSov.find((e) => !e.isTargetBrand) ?? null;

    const currentCompetitors = Array.from(
      new Set(audit.scanResults.flatMap((s) => s.competitorsMentioned))
    );

    const currentJsonLdSummary = inspectJsonLdAiReadiness(
      audit.probe.jsonLdBlocks
    );
    const currentJsonLdReady =
      currentJsonLdSummary.missingAiGraphPillars.length === 0;

    const drift = computeDomainDriftDiff({
      brandName: domain.brand_name,
      previousVisibilityScore: domain.visibility_score,
      currentVisibilityScore: effectiveVisibilityScore,
      previousAccuracyScore: domain.accuracy_score,
      currentAccuracyScore: audit.accuracyScore,
      previousCompetitors: priorCompetitors,
      currentCompetitors,
      brandSharePct: brandSovEntry?.shareOfVoicePct ?? 0,
      topRival: topRivalEntry
        ? {
            name: topRivalEntry.entityName,
            sharePct: topRivalEntry.shareOfVoicePct,
          }
        : null,
      previousChecks: {
        robotsAiBotStatus: domain.robots_ai_bot_status,
        llmsTxtStatus: domain.llms_txt_status,
        agentsMdStatus: domain.agents_md_status,
        jsonLdReady: priorJsonLdApplied,
      },
      currentChecks: {
        robotsAiBotStatus: audit.probe.robotsAiBotStatus,
        llmsTxtStatus: audit.probe.llmsTxtStatus,
        agentsMdStatus: audit.shopify.agentsMdStatus,
        jsonLdReady: currentJsonLdReady,
      },
      hallucinationsCount: audit.allHallucinations.length,
    });

    if (drift.driftDetected) {
      driftDetectedCount += 1;
    }

    const anchorIso = owner.tripwire_paid_at ?? owner.created_at;
    const daysSincePurchase = Math.max(
      0,
      Math.floor((Date.now() - Date.parse(anchorIso)) / 86400000)
    );

    let alertDelivered = false;
    let alertSubject: string | null = null;
    const isRecurringSubscriber =
      owner.plan_tier === 'starter_49' ||
      owner.plan_tier === 'pro_99' ||
      owner.plan_tier === 'agency_249';

    const schedule = normalizeDomainReportSchedule(
      domain.brand_truth_sheet?.report_schedule
    );
    const blockedBots = extractBlockedBots(audit.probe.robotsAiBotStatus);
    const currentAlertFingerprint = computeWatchdogRegressionFingerprint({
      blockedBots,
      hallucinations: audit.allHallucinations,
    });
    const allowLiveSend =
      !options.dryRun &&
      !options.isMockMode &&
      shouldSendRegressionWatchdogAlert({
        schedule,
        currentFingerprint: currentAlertFingerprint,
      });

    if (drift.driftDetected && isRecurringSubscriber && owner.email) {
      try {
        const dispatchRes = await dispatchHallucinationDriftEmail({
          recipientEmail: schedule.recipient_email ?? owner.email,
          brandName: domain.brand_name,
          domainUrl: domain.domain_url,
          visibilityScore: effectiveVisibilityScore,
          accuracyScore: audit.accuracyScore,
          previousVisibilityScore: domain.visibility_score,
          previousAccuracyScore: domain.accuracy_score,
          hallucinations: audit.allHallucinations,
          blockedBots,
          newCompetitorsCited: drift.newCompetitorsCited,
          regressedChecks: drift.regressedChecks,
          liveChecksPassed: drift.liveChecksPassed,
          consoleBaseUrl: appBaseUrl,
          resendApiKey: allowLiveSend ? process.env.RESEND_API_KEY : undefined,
          fromEmail: process.env.ALERT_FROM_EMAIL,
        });
        alertSubject = dispatchRes.subject;
        if (dispatchRes.delivered) {
          alertDelivered = true;
          emailsTriggeredCount += 1;
        }
      } catch {
        // Non-blocking alert dispatch
      }

      const targetRival =
        drift.newCompetitorsCited[0] ?? drift.topRival?.name ?? null;
      const vsBundle = targetRival
        ? buildCitationAnswerPageBundle({
            domain: {
              brand_name: domain.brand_name,
              domain_url: domain.domain_url,
              industry_vertical: domain.industry_vertical,
              is_shopify: audit.shopify.isShopify,
              shopify_mcp_status: audit.shopify.shopifyMcpStatus,
              agents_md_status: audit.shopify.agentsMdStatus,
              llms_txt_status: audit.probe.llmsTxtStatus,
              brand_truth_sheet: domain.brand_truth_sheet,
            },
            blueprintType: 'vs_competitor',
            rivalName: targetRival,
            targetPrompt: activePrompts[0] ?? null,
          })
        : null;

      subscriberRetentionAlerts.push({
        ownerEmail: owner.email,
        planTier: owner.plan_tier,
        hostname,
        brandName: domain.brand_name,
        driftReasons: drift.driftReasons,
        topRivalName: targetRival,
        vsRivalComparisonPromptTitle: vsBundle?.pageTitle ?? null,
        vsRivalComparisonPromptPreview: vsBundle
          ? vsBundle.aiBuildPrompt.content.slice(0, 280)
          : null,
        consoleRemediationUrl: `${appBaseUrl}/dashboard?tab=tab2_fixes&domain=${encodeURIComponent(
          hostname
        )}`,
      });
    }

    if (supabase && !options.isMockMode && !options.dryRun) {
      const promptList = promptsByDomain.get(domain.id) ?? [];
      const snapshotsPayload = audit.scanResults
        .filter((scan) => scan.fanoutTelemetryType !== 'mock_fixture')
        .map((scan) => {
          const matched = promptList.find(
            (p) => p.prompt_text === scan.promptText
          );
          return {
            domain_id: domain.id,
            prompt_id: matched?.id ?? null,
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
        await (supabase.from('citation_snapshots') as any).insert(
          snapshotsPayload
        );
      }

      const nowIso = new Date().toISOString();
      const updatedTruth: BrandTruthSheet = {
        ...domain.brand_truth_sheet,
        report_schedule: {
          frequency: schedule.frequency,
          day_of_week: schedule.day_of_week,
          day_of_month: schedule.day_of_month,
          recipient_email: schedule.recipient_email,
          watchdog_alerts_enabled: schedule.watchdog_alerts_enabled,
          last_digest_sent_at: schedule.last_digest_sent_at,
          last_alert_sent_at: alertDelivered ? nowIso : schedule.last_alert_sent_at,
          last_alert_fingerprint: currentAlertFingerprint,
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
          brand_truth_sheet: updatedTruth,
          visibility_score: effectiveVisibilityScore,
          accuracy_score: audit.accuracyScore,
          last_scanned_at: nowIso,
        })
        .eq('id', domain.id);
    }

    if (
      owner.plan_tier === 'tripwire_19' &&
      daysSincePurchase >= 5 &&
      drift.liveChecksPassed < 4
    ) {
      tripwireUpgradeCandidates.push({
        ownerEmail: owner.email,
        hostname,
        brandName: domain.brand_name,
        daysSincePurchase,
        liveChecksPassed: drift.liveChecksPassed,
        pendingChecks: drift.pendingChecks,
        starterUpgradeCreditUrl: `${appBaseUrl}/api/checkout?plan=starter_49&cycle=monthly&trial=0&domain=${encodeURIComponent(
          hostname
        )}`,
        proUpgradeCreditUrl: `${appBaseUrl}/api/checkout?plan=pro_99&cycle=monthly&trial=0&domain=${encodeURIComponent(
          hostname
        )}`,
      });
    }

    domainReports.push({
      domainId: domain.id,
      hostname,
      brandName: domain.brand_name,
      ownerEmail: owner.email,
      planTier: owner.plan_tier,
      daysSincePurchase,
      previousVisibilityScore: domain.visibility_score,
      currentVisibilityScore: audit.visibilityScore,
      previousAccuracyScore: domain.accuracy_score,
      currentAccuracyScore: audit.accuracyScore,
      drift,
      alertDelivered,
      alertSubject,
    });
  }

  return NextResponse.json({
    ok: true,
    mode:
      supabase && !options.isMockMode ? 'live_supabase' : 'mock_workspace',
    dryRun: options.dryRun,
    scannedAt: new Date().toISOString(),
    scannedCount: domainReports.length,
    driftDetectedCount,
    emailsTriggeredCount,
    tripwireUpgradeCandidates,
    subscriberRetentionAlerts,
    domainReports,
  });
}

export async function GET(request: Request): Promise<NextResponse> {
  const { authorized, isMockMode } = isAuthorizedCronRequest(request);
  if (!authorized) {
    return NextResponse.json(
      {
        error: 'UNAUTHORIZED',
        message: 'Valid CRON_SECRET Bearer token required.',
      },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const dryRun = isMockMode || url.searchParams.get('dryRun') === '1';
  const rawLimit = Number(url.searchParams.get('limit') ?? '15');
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(25, Math.floor(rawLimit)))
    : 15;

  return executeDriftWatchdogRun({ dryRun, limit, isMockMode });
}

export async function POST(request: Request): Promise<NextResponse> {
  const { authorized, isMockMode } = isAuthorizedCronRequest(request);
  if (!authorized) {
    return NextResponse.json(
      {
        error: 'UNAUTHORIZED',
        message: 'Valid CRON_SECRET Bearer token required.',
      },
      { status: 401 }
    );
  }

  let body: { dryRun?: boolean; limit?: number } = {};
  try {
    body = (await request.json()) as { dryRun?: boolean; limit?: number };
  } catch {
    body = {};
  }

  const dryRun = isMockMode || Boolean(body.dryRun);
  const rawLimit = Number(body.limit ?? 15);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(25, Math.floor(rawLimit)))
    : 15;

  return executeDriftWatchdogRun({ dryRun, limit, isMockMode });
}
