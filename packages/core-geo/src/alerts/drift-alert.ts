import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type {
  AgentsMdStatus,
  HallucinationDetail,
  LlmsTxtStatus,
  QualityRubricBreakdown,
  RobotsAiBotStatus,
} from '../db/types.js';

export interface FourCheckReadinessSnapshot {
  robotsAiBotStatus: RobotsAiBotStatus;
  llmsTxtStatus: LlmsTxtStatus;
  agentsMdStatus: AgentsMdStatus;
  jsonLdReady: boolean;
}

export interface ComputeDomainDriftDiffInput {
  brandName: string;
  previousVisibilityScore: number;
  currentVisibilityScore: number;
  previousAccuracyScore: number;
  currentAccuracyScore: number;
  previousCompetitors?: string[];
  currentCompetitors?: string[];
  brandSharePct?: number;
  topRival?: { name: string; sharePct: number } | null;
  previousChecks?: FourCheckReadinessSnapshot | null;
  currentChecks: FourCheckReadinessSnapshot;
  hallucinationsCount?: number;
}

export interface DomainDriftDiffSummary {
  driftDetected: boolean;
  driftReasons: string[];
  visibilityDelta: number;
  accuracyDelta: number;
  brandSharePct: number;
  topRival: { name: string; sharePct: number } | null;
  newCompetitorsCited: string[];
  liveChecksPassed: number;
  regressedChecks: string[];
  pendingChecks: string[];
}

function evaluateFourChecks(
  snap: FourCheckReadinessSnapshot
): Record<'waf_bots' | 'llms_txt' | 'agents_md' | 'json_ld', boolean> {
  const botsAllowed =
    Boolean(snap.robotsAiBotStatus.GPTBot) &&
    Boolean(snap.robotsAiBotStatus['OAI-SearchBot']) &&
    Boolean(snap.robotsAiBotStatus.PerplexityBot) &&
    Boolean(snap.robotsAiBotStatus.ClaudeBot) &&
    !snap.robotsAiBotStatus.waf_blocked;
  return {
    waf_bots: botsAllowed,
    llms_txt: snap.llmsTxtStatus === 'present',
    agents_md: snap.agentsMdStatus === 'custom_enriched',
    json_ld: Boolean(snap.jsonLdReady),
  };
}

const FOUR_CHECK_LABELS: Record<
  'waf_bots' | 'llms_txt' | 'agents_md' | 'json_ld',
  string
> = {
  waf_bots: 'AI Crawler WAF & robots.txt Access',
  llms_txt: '/llms.txt Directory',
  agents_md: 'Custom /agents.md Rulebook',
  json_ld: '3-Pillar JSON-LD Schema',
};

export function computeDomainDriftDiff(
  input: ComputeDomainDriftDiffInput
): DomainDriftDiffSummary {
  const visibilityDelta =
    input.currentVisibilityScore - input.previousVisibilityScore;
  const accuracyDelta =
    input.currentAccuracyScore - input.previousAccuracyScore;

  const prevCompNorm = new Set(
    (input.previousCompetitors ?? [])
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean)
  );
  const brandNorm = input.brandName.trim().toLowerCase();
  const newCompetitorsCited: string[] = [];
  const seenCurrent = new Set<string>();
  for (const rawComp of input.currentCompetitors ?? []) {
    const clean = rawComp.trim();
    const key = clean.toLowerCase();
    if (!clean || key === brandNorm || seenCurrent.has(key)) continue;
    seenCurrent.add(key);
    if (!prevCompNorm.has(key)) {
      newCompetitorsCited.push(clean);
    }
  }

  const currMap = evaluateFourChecks(input.currentChecks);
  const prevMap = input.previousChecks
    ? evaluateFourChecks(input.previousChecks)
    : null;

  const checkKeys = ['waf_bots', 'llms_txt', 'agents_md', 'json_ld'] as const;
  let liveChecksPassed = 0;
  const regressedChecks: string[] = [];
  const pendingChecks: string[] = [];

  for (const k of checkKeys) {
    if (currMap[k]) {
      liveChecksPassed += 1;
    } else {
      pendingChecks.push(FOUR_CHECK_LABELS[k]);
      if (prevMap && prevMap[k]) {
        regressedChecks.push(FOUR_CHECK_LABELS[k]);
      }
    }
  }

  const driftReasons: string[] = [];
  if (visibilityDelta <= -5) {
    driftReasons.push(
      `AI Visibility Score dropped ${Math.abs(visibilityDelta)} pts (${input.previousVisibilityScore} -> ${input.currentVisibilityScore}/100)`
    );
  }
  if (accuracyDelta < 0) {
    driftReasons.push(
      `Brand Truth Accuracy dropped ${Math.abs(accuracyDelta)} pts (${input.previousAccuracyScore}% -> ${input.currentAccuracyScore}%)`
    );
  }
  if ((input.hallucinationsCount ?? 0) > 0) {
    driftReasons.push(
      `${input.hallucinationsCount} active pricing or policy claim conflict(s) detected`
    );
  }
  if (regressedChecks.length > 0) {
    driftReasons.push(
      `${regressedChecks.length}/4 live protocol check(s) regressed (${regressedChecks.join(', ')})`
    );
  }
  if (newCompetitorsCited.length > 0) {
    driftReasons.push(
      `New rival citation(s) detected: ${newCompetitorsCited.slice(0, 3).join(', ')}`
    );
  }

  const brandSharePct = Math.max(0, Math.round(input.brandSharePct ?? 0));
  const topRival = input.topRival ?? null;
  if (
    topRival &&
    topRival.sharePct > brandSharePct &&
    newCompetitorsCited.length === 0 &&
    visibilityDelta < 0
  ) {
    driftReasons.push(
      `${topRival.name} leads Head-to-Head Share-of-Voice (${topRival.sharePct}% vs. ${brandSharePct}%)`
    );
  }

  return {
    driftDetected: driftReasons.length > 0,
    driftReasons,
    visibilityDelta,
    accuracyDelta,
    brandSharePct,
    topRival,
    newCompetitorsCited,
    liveChecksPassed,
    regressedChecks,
    pendingChecks,
  };
}

export interface BuildDriftAlertInput {
  brandName: string;
  domainUrl: string;
  visibilityScore: number;
  accuracyScore: number;
  hallucinations: HallucinationDetail[];
  blockedBots: string[];
  previousVisibilityScore?: number;
  previousAccuracyScore?: number;
  newCompetitorsCited?: string[];
  regressedChecks?: string[];
  liveChecksPassed?: number;
  consoleBaseUrl?: string;
}

export interface BuiltDriftAlert {
  subject: string;
  text: string;
  html: string;
  quality: EnforcedQualityArtifact;
}

export interface DispatchDriftEmailInput extends BuildDriftAlertInput {
  recipientEmail: string;
  resendApiKey?: string;
  fromEmail?: string;
}

export interface DispatchDriftEmailResult {
  delivered: boolean;
  mode: 'live_resend' | 'preview_dry_run';
  providerMessageId: string | null;
  recipientEmail: string;
  subject: string;
  text: string;
  qualityScore: number;
  qualityBreakdown: QualityRubricBreakdown;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildHallucinationDriftAlert(
  input: BuildDriftAlertInput
): BuiltDriftAlert {
  let hostname = input.domainUrl;
  try {
    hostname = new URL(input.domainUrl).hostname;
  } catch {
    // Keep raw input if already bare hostname
  }

  const baseUrl = (input.consoleBaseUrl ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const consoleLink = `${baseUrl}/dashboard?domain=${encodeURIComponent(hostname)}`;

  const conflictCount = input.hallucinations.length;
  const newComps = (input.newCompetitorsCited ?? []).filter(Boolean);
  const regressed = (input.regressedChecks ?? []).filter(Boolean);
  const visDrop =
    typeof input.previousVisibilityScore === 'number'
      ? input.visibilityScore - input.previousVisibilityScore
      : 0;

  const subject =
    conflictCount > 0
      ? `[Verisource Watchdog] ${conflictCount} AI claim conflict(s) flagged on ${hostname}`
      : regressed.length > 0 || newComps.length > 0 || visDrop <= -5
        ? `[Verisource Watchdog] AI citation drift detected on ${hostname} (${input.visibilityScore}/100)`
        : `[Verisource Watchdog] Weekly AI retrieval digest for ${hostname} (${input.visibilityScore}/100)`;

  const claimLines =
    conflictCount > 0
      ? input.hallucinations.slice(0, 4).map(
          (h, idx) =>
            `${idx + 1}. [${h.category.toUpperCase()} · ${h.severity.toUpperCase()}] Observed AI Claim: "${h.claim_text}" | Verified Truth: ${h.verified_truth}`
        )
      : [
          'Zero active pricing, shipping, or SKU hallucinations detected across ChatGPT, Google Gemini, and Perplexity.',
        ];

  const driftExtraLines: string[] = [];
  if (typeof input.previousVisibilityScore === 'number' && visDrop < 0) {
    driftExtraLines.push(
      `Visibility Score Delta: ${input.previousVisibilityScore}/100 -> ${input.visibilityScore}/100 (${visDrop} pts).`
    );
  }
  if (regressed.length > 0) {
    driftExtraLines.push(
      `Protocol Regression (${input.liveChecksPassed ?? 0}/4 Live): ${regressed.join(', ')}.`
    );
  }
  if (newComps.length > 0) {
    driftExtraLines.push(
      `Newly Cited Competitor(s): ${newComps.slice(0, 3).join(', ')}. Open Step 02 Comparison Page Studio to publish a factual vs.-Rival matrix.`
    );
  }

  const botLine =
    input.blockedBots.length > 0
      ? `WAF Crawler Block Warning: ${input.blockedBots.join(', ')} returned HTTP 403 on ${input.domainUrl}/robots.txt or root.`
      : `AI Crawler Access: GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot are allowed (HTTP 200).`;

  const rawTextDraft = [
    `Watchdog scan finished for ${hostname}.`,
    `${input.brandName} currently holds ${input.visibilityScore}/100 AI Share-of-Voice and ${input.accuracyScore}% Brand Truth accuracy across ChatGPT, Google Gemini, and Perplexity commercial buyer prompts.`,
    '',
    ...claimLines,
    ...(driftExtraLines.length > 0 ? ['', ...driftExtraLines] : []),
    '',
    botLine,
    `Publish updated schema.org JSON-LD, /llms.txt, and /agents.md fixes in your 3-Tab Console: ${consoleLink}`,
  ].join('\n');

  const quality = enforceQualityGate95(rawTextDraft);

  const htmlRows =
    conflictCount > 0
      ? input.hallucinations
          .slice(0, 4)
          .map(
            (h) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;font-family:monospace;font-size:12px;color:#991B1B;font-weight:700;">
            ${escapeHtml(h.category.toUpperCase())}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#0F172A;">
            &ldquo;${escapeHtml(h.claim_text)}&rdquo;
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;font-size:13px;color:#334155;">
            ${escapeHtml(h.verified_truth)}
          </td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="3" style="padding:12px;font-size:13px;color:#065F46;">All monitored pricing, shipping, and SKU claims match your Brand Truth Sheet.</td></tr>`;

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#0E1116;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;">
  <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #262E3D;border-radius:10px;overflow:hidden;">
    <div style="padding:15px 20px;background:#131720;border-bottom:1px solid #262E3D;color:#EEF1F6;font-size:12.5px;font-weight:700;letter-spacing:0.04em;">
      <span style="display:inline-block;width:14px;height:14px;background:#E5A93C;border-radius:3px;vertical-align:middle;margin-right:8px;text-align:center;line-height:14px;color:#161004;font-size:9px;font-weight:900;">&#9671;</span>VERISOURCE · HALLUCINATION DRIFT WATCHDOG
    </div>
    <div style="padding:22px 20px;">
      <h2 style="margin:0 0 8px 0;font-size:20px;color:#0F172A;">${escapeHtml(input.brandName)} (${escapeHtml(hostname)})</h2>
      <p style="margin:0 0 16px 0;font-size:14px;color:#475569;">
        AI Share-of-Voice: <strong>${input.visibilityScore}/100</strong> &middot; Brand Truth Accuracy: <strong>${input.accuracyScore}%</strong>
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;margin-bottom:16px;">
        <thead>
          <tr style="background:#F8FAFC;text-align:left;font-size:11px;color:#64748B;text-transform:uppercase;">
            <th style="padding:8px 12px;border-bottom:1px solid #E2E8F0;">Category</th>
            <th style="padding:8px 12px;border-bottom:1px solid #E2E8F0;">Observed AI Claim</th>
            <th style="padding:8px 12px;border-bottom:1px solid #E2E8F0;">Verified Truth</th>
          </tr>
        </thead>
        <tbody>${htmlRows}</tbody>
      </table>
      <p style="margin:0 0 18px 0;font-size:12.5px;color:#475569;font-family:monospace;">
        ${escapeHtml(botLine)}
      </p>
      <a href="${escapeHtml(consoleLink)}" style="display:inline-block;padding:11px 18px;background:#E5A93C;color:#161004;text-decoration:none;border-radius:6px;font-size:13.5px;font-weight:700;">
        Open 3-Tab Remediation Console &rarr;
      </a>
    </div>
  </div>
</body>
</html>`;

  return {
    subject,
    text: quality.content,
    html,
    quality,
  };
}

export async function dispatchHallucinationDriftEmail(
  input: DispatchDriftEmailInput
): Promise<DispatchDriftEmailResult> {
  const alert = buildHallucinationDriftAlert(input);
  const apiKey = input.resendApiKey?.trim() ?? '';

  if (!apiKey) {
    return {
      delivered: false,
      mode: 'preview_dry_run',
      providerMessageId: null,
      recipientEmail: input.recipientEmail,
      subject: alert.subject,
      text: alert.text,
      qualityScore: alert.quality.score,
      qualityBreakdown: alert.quality.breakdown,
    };
  }

  const fromAddress =
    input.fromEmail?.trim() || 'Verisource Watchdog <alerts@verisource.dev>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [input.recipientEmail],
      subject: alert.subject,
      text: alert.text,
      html: alert.html,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(
      `Resend API returned HTTP ${response.status}: ${errBody.slice(0, 180)}`
    );
  }

  const json = (await response.json()) as { id?: string };
  return {
    delivered: true,
    mode: 'live_resend',
    providerMessageId: json.id ?? null,
    recipientEmail: input.recipientEmail,
    subject: alert.subject,
    text: alert.text,
    qualityScore: alert.quality.score,
    qualityBreakdown: alert.quality.breakdown,
  };
}
