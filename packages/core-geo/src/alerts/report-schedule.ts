import type {
  CitationSnapshotRow,
  DigestFrequency,
  DomainReportSchedule,
  HallucinationDetail,
  RobotsAiBotStatus,
  ShopifyMcpStatus,
  AgentsMdStatus,
  LlmsTxtStatus,
} from '../db/types.js';
import type { EngineScanResult } from '../scanner/fanout-scanner.js';

export const WEEKDAY_NAMES: ReadonlyArray<string> = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export interface NormalizedDomainReportSchedule {
  frequency: DigestFrequency;
  day_of_week: number;
  day_of_month: number;
  recipient_email: string | null;
  watchdog_alerts_enabled: boolean;
  last_digest_sent_at: string | null;
  last_alert_sent_at: string | null;
  last_alert_fingerprint: string | null;
}

export function normalizeDomainReportSchedule(
  raw?: Partial<DomainReportSchedule> | null
): NormalizedDomainReportSchedule {
  const validFreqs: DigestFrequency[] = ['daily', 'weekly', 'monthly', 'off'];
  const frequency: DigestFrequency =
    raw?.frequency && validFreqs.includes(raw.frequency)
      ? raw.frequency
      : 'weekly';

  const rawDow =
    typeof raw?.day_of_week === 'number' && Number.isFinite(raw.day_of_week)
      ? Math.round(raw.day_of_week)
      : 1; // Default: Monday
  const day_of_week = Math.max(0, Math.min(6, rawDow));

  const rawDom =
    typeof raw?.day_of_month === 'number' && Number.isFinite(raw.day_of_month)
      ? Math.round(raw.day_of_month)
      : 1; // Default: 1st of month
  const day_of_month = Math.max(1, Math.min(28, rawDom));

  const recipient_email =
    typeof raw?.recipient_email === 'string' && raw.recipient_email.trim()
      ? raw.recipient_email.trim()
      : null;

  const watchdog_alerts_enabled =
    typeof raw?.watchdog_alerts_enabled === 'boolean'
      ? raw.watchdog_alerts_enabled
      : true;

  return {
    frequency,
    day_of_week,
    day_of_month,
    recipient_email,
    watchdog_alerts_enabled,
    last_digest_sent_at:
      typeof raw?.last_digest_sent_at === 'string' && raw.last_digest_sent_at
        ? raw.last_digest_sent_at
        : null,
    last_alert_sent_at:
      typeof raw?.last_alert_sent_at === 'string' && raw.last_alert_sent_at
        ? raw.last_alert_sent_at
        : null,
    last_alert_fingerprint:
      typeof raw?.last_alert_fingerprint === 'string' &&
      raw.last_alert_fingerprint
        ? raw.last_alert_fingerprint
        : null,
  };
}

export function formatDomainReportScheduleLabel(
  raw?: Partial<DomainReportSchedule> | null
): string {
  const s = normalizeDomainReportSchedule(raw);
  if (s.frequency === 'off') return 'Paused';
  if (s.frequency === 'daily') return 'Daily (07:00 CST)';
  if (s.frequency === 'monthly') return `Monthly on Day ${s.day_of_month}`;
  return `Weekly on ${WEEKDAY_NAMES[s.day_of_week] ?? 'Monday'}s`;
}

export function cadenceWordForFrequency(
  freq: DigestFrequency
): 'Daily' | 'Weekly' | 'Monthly' {
  if (freq === 'daily') return 'Daily';
  if (freq === 'monthly') return 'Monthly';
  return 'Weekly';
}

export function shouldSendScheduledDigest(
  rawSchedule?: Partial<DomainReportSchedule> | null,
  now: Date = new Date()
): boolean {
  const s = normalizeDomainReportSchedule(rawSchedule);
  if (s.frequency === 'off') return false;

  const nowMs = now.getTime();
  const todayUtcKey = now.toISOString().slice(0, 10);
  const lastMs = s.last_digest_sent_at
    ? new Date(s.last_digest_sent_at).getTime()
    : Number.NaN;
  const lastUtcKey =
    s.last_digest_sent_at && !Number.isNaN(lastMs)
      ? new Date(lastMs).toISOString().slice(0, 10)
      : null;

  if (lastUtcKey === todayUtcKey) {
    return false;
  }

  if (s.frequency === 'daily') {
    if (!Number.isNaN(lastMs) && nowMs - lastMs < 20 * 3600 * 1000) {
      return false;
    }
    return true;
  }

  if (s.frequency === 'weekly') {
    if (now.getUTCDay() !== s.day_of_week) {
      return false;
    }
    if (!Number.isNaN(lastMs) && nowMs - lastMs < 6 * 24 * 3600 * 1000) {
      return false;
    }
    return true;
  }

  if (s.frequency === 'monthly') {
    if (now.getUTCDate() !== s.day_of_month) {
      return false;
    }
    if (!Number.isNaN(lastMs) && nowMs - lastMs < 25 * 24 * 3600 * 1000) {
      return false;
    }
    return true;
  }

  return false;
}

export function computeWatchdogRegressionFingerprint(params: {
  blockedBots: string[];
  hallucinations: HallucinationDetail[];
}): string | null {
  const cleanBots = Array.from(
    new Set(params.blockedBots.map((b) => b.trim().toLowerCase()).filter(Boolean))
  ).sort();

  const cleanHallucinations = Array.from(
    new Set(
      params.hallucinations.map(
        (h) =>
          `${h.category}:${h.verified_truth
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .slice(0, 64)}`
      )
    )
  ).sort();

  if (cleanBots.length === 0 && cleanHallucinations.length === 0) {
    return null;
  }

  return `bots=${cleanBots.join(',')}|claims=${cleanHallucinations.join(';')}`;
}

export function shouldSendRegressionWatchdogAlert(params: {
  schedule?: Partial<DomainReportSchedule> | null;
  currentFingerprint: string | null;
  now?: Date;
}): boolean {
  const s = normalizeDomainReportSchedule(params.schedule);
  if (!s.watchdog_alerts_enabled) return false;
  if (!params.currentFingerprint) return false;

  // Never re-send an alert for the exact same active issue state
  if (s.last_alert_fingerprint === params.currentFingerprint) {
    return false;
  }

  const nowMs = (params.now ?? new Date()).getTime();
  const lastAlertMs = s.last_alert_sent_at
    ? new Date(s.last_alert_sent_at).getTime()
    : Number.NaN;

  // Enforce a minimum 24-hour cooldown between regression alerts
  if (!Number.isNaN(lastAlertMs) && nowMs - lastAlertMs < 24 * 3600 * 1000) {
    return false;
  }

  return true;
}

export function selectLatestLiveSnapshotsPerPromptEngine(
  snapshots: CitationSnapshotRow[]
): EngineScanResult[] {
  if (snapshots.length === 0) return [];

  const hasRealLive = snapshots.some(
    (s) => s.fanout_telemetry_type !== 'mock_fixture'
  );
  const pool = hasRealLive
    ? snapshots.filter((s) => s.fanout_telemetry_type !== 'mock_fixture')
    : snapshots;

  const sorted = [...pool].sort(
    (a, b) =>
      new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
  );

  const seenKeys = new Set<string>();
  const selected: EngineScanResult[] = [];

  for (const s of sorted) {
    const key = `${s.prompt_id ?? 'default'}::${s.ai_engine}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    selected.push({
      promptText: s.prompt_id ?? '',
      aiEngine: s.ai_engine,
      brandMentioned: s.brand_mentioned,
      citationRank: s.citation_rank,
      competitorsMentioned: s.competitors_mentioned ?? [],
      citedSourceUrls: s.cited_source_urls ?? [],
      decompiledFanoutQueries: [],
      fanoutTelemetryType: s.fanout_telemetry_type,
      hallucinationDetected: s.hallucination_detected,
      hallucinationDetails: s.hallucination_details ?? [],
      rawAnswerExcerpt: s.raw_answer_excerpt ?? '',
    });
  }

  return selected;
}

export function computeDeterministicProtocolPoints(params: {
  robotsAiBotStatus: RobotsAiBotStatus;
  llmsTxtStatus: LlmsTxtStatus;
  agentsMdStatus: AgentsMdStatus;
  jsonLdCount?: number;
  isShopify: boolean;
  shopifyMcpStatus: ShopifyMcpStatus;
}): number {
  let pts = 0;
  const botsAllowed = [
    params.robotsAiBotStatus.GPTBot,
    params.robotsAiBotStatus['OAI-SearchBot'],
    params.robotsAiBotStatus.PerplexityBot,
    params.robotsAiBotStatus.ClaudeBot,
  ].filter(Boolean).length;
  pts += botsAllowed * 5;
  if (!params.robotsAiBotStatus.waf_blocked) pts += 8;
  if (params.llmsTxtStatus === 'present') pts += 10;
  if (params.agentsMdStatus === 'custom_enriched') pts += 12;
  else if (params.agentsMdStatus === 'default_boilerplate') pts += 5;
  if (typeof params.jsonLdCount === 'number') {
    if (params.jsonLdCount >= 2) pts += 10;
    else if (params.jsonLdCount === 1) pts += 6;
  }
  if (params.isShopify && params.shopifyMcpStatus === 'ucp_active') {
    pts = Math.min(60, pts + 4);
  }
  return pts;
}

export function stabilizeScheduledVisibilityScore(params: {
  previousScore: number | null | undefined;
  rawNewScore: number;
  previousProtocolPoints?: number | null;
  newProtocolPoints?: number | null;
}): number {
  const clampedNew = Math.max(5, Math.min(100, Math.round(params.rawNewScore)));
  if (
    typeof params.previousScore !== 'number' ||
    params.previousScore <= 0 ||
    !Number.isFinite(params.previousScore)
  ) {
    return clampedNew;
  }

  // If on-site HTTP protocol state genuinely changed (e.g. customer published /llms.txt, /agents.md, or JSON-LD), reflect 100% immediately
  if (
    typeof params.previousProtocolPoints === 'number' &&
    typeof params.newProtocolPoints === 'number' &&
    params.previousProtocolPoints !== params.newProtocolPoints
  ) {
    return clampedNew;
  }

  // Otherwise smooth single-run LLM sampling jitter (60% new, 40% prior baseline)
  return Math.max(
    5,
    Math.min(100, Math.round(params.previousScore * 0.4 + clampedNew * 0.6))
  );
}
