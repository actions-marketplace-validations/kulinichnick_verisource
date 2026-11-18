import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { QualityRubricBreakdown } from '../db/types.js';

export interface BuildWeeklyDigestInput {
  brandName: string;
  domainUrl: string;
  visibilityScore: number;
  previousVisibilityScore?: number | null;
  accuracyScore: number;
  enginesCitingCount: number;
  totalSnapshotsScanned: number;
  aiReferralVisits7d: number;
  aiReferralRevenueUsd7d: number;
  appliedFixesCount: number;
  totalFixesCount: number;
  activeHallucinationCount: number;
  blockedBots: string[];
  topRivalDomains?: string[];
  agencyBrandName?: string | null;
  agencyPrimaryColor?: string | null;
  agencyCtaUrl?: string | null;
  consoleBaseUrl?: string;
}

export interface BuiltWeeklyDigest {
  subject: string;
  text: string;
  html: string;
  scoreDelta: number | null;
  isWhiteLabel: boolean;
  quality: EnforcedQualityArtifact;
}

export interface DispatchWeeklyDigestEmailInput extends BuildWeeklyDigestInput {
  recipientEmail: string;
  resendApiKey?: string;
  fromEmail?: string;
}

export interface DispatchWeeklyDigestEmailResult {
  delivered: boolean;
  mode: 'live_resend' | 'preview_dry_run';
  providerMessageId: string | null;
  recipientEmail: string;
  subject: string;
  text: string;
  html: string;
  scoreDelta: number | null;
  isWhiteLabel: boolean;
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

function sanitizeHexColor(color?: string | null): string {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color.trim())) {
    return color.trim();
  }
  return '#0A0E17';
}

function sanitizeHttpUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https?:\/\/[^\s<>"]+$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function buildWeeklyExecutiveDigest(
  input: BuildWeeklyDigestInput
): BuiltWeeklyDigest {
  let hostname = input.domainUrl;
  try {
    hostname = new URL(input.domainUrl).hostname;
  } catch {
    // Keep bare hostname if already stripped
  }

  const baseUrl = (input.consoleBaseUrl ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const consoleLink = `${baseUrl}/dashboard?domain=${encodeURIComponent(hostname)}`;

  const cleanAgencyName = input.agencyBrandName?.trim() || null;
  const isWhiteLabel = Boolean(cleanAgencyName);
  const headerAccent = sanitizeHexColor(input.agencyPrimaryColor);
  const safeAgencyCta = sanitizeHttpUrl(input.agencyCtaUrl);
  const primaryActionUrl =
    isWhiteLabel && safeAgencyCta ? safeAgencyCta : consoleLink;
  const primaryActionLabel =
    isWhiteLabel && safeAgencyCta
      ? `Review Next Sprint with ${cleanAgencyName} →`
      : 'Open 3-Tab GEO Console →';

  const scoreDelta =
    typeof input.previousVisibilityScore === 'number'
      ? input.visibilityScore - input.previousVisibilityScore
      : null;

  const deltaBadge =
    scoreDelta === null
      ? 'Baseline recorded'
      : scoreDelta > 0
        ? `+${scoreDelta} pts vs. prior scan`
        : scoreDelta < 0
          ? `${scoreDelta} pts vs. prior scan`
          : '0 pts steady vs. prior scan';

  const senderTag = cleanAgencyName ?? 'Verisource';
  const subject = `[${senderTag} · Weekly AI Brief] ${input.brandName} (${input.visibilityScore}/100${
    scoreDelta !== null && scoreDelta !== 0
      ? `, ${scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts`
      : ''
  })`;

  const citationLine =
    input.totalSnapshotsScanned > 0
      ? `Citation Share: ${input.brandName} appeared in ${input.enginesCitingCount} of ${input.totalSnapshotsScanned} tracked commercial prompts across ChatGPT, Google Gemini, and Perplexity.`
      : `Citation Share: Baseline commercial prompt tracking is active across ChatGPT, Google Gemini, and Perplexity.`;

  const revenueFormatted = `$${input.aiReferralRevenueUsd7d.toFixed(2)}`;
  const attributionLine =
    input.aiReferralVisits7d > 0 || input.aiReferralRevenueUsd7d > 0
      ? `Attributed AI Traffic (7d): ${input.aiReferralVisits7d} referred visit(s) and ${revenueFormatted} USD in Origin-verified checkout conversions from chatgpt.com, perplexity.ai, gemini.google.com, and claude.ai.`
      : `Attributed AI Traffic (7d): ${input.aiReferralVisits7d} referred visits recorded (${revenueFormatted} USD); verify your 10-line attribution snippet is live on checkout templates.`;

  const crawlerAndSchemaLine =
    input.blockedBots.length > 0
      ? `Crawler & Artifact Health: ${input.blockedBots.join(', ')} returned HTTP 403 at the edge; ${input.appliedFixesCount}/${input.totalFixesCount} schema.org JSON-LD, /llms.txt, and /agents.md fixes are marked applied.`
      : `Crawler & Artifact Health: GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot return HTTP 200; ${input.appliedFixesCount}/${input.totalFixesCount} schema.org JSON-LD, /llms.txt, and /agents.md fixes are deployed.`;

  const truthLine =
    input.activeHallucinationCount > 0
      ? `Fact Accuracy (${input.accuracyScore}%): ${input.activeHallucinationCount} pricing, shipping, or SKU claim conflict(s) still require /agents.md and JSON-LD overrides.`
      : `Fact Accuracy (${input.accuracyScore}%): Zero active pricing or SKU hallucinations detected against your verified Brand Truth Sheet.`;

  const rivalList = (input.topRivalDomains ?? []).filter(Boolean).slice(0, 3);
  const rivalLine =
    rivalList.length > 0
      ? `Competing Domains Cited: ${rivalList.join(', ')}.`
      : null;

  const rawTextLines = [
    `Weekly executive AI visibility summary for ${hostname}.`,
    `${input.brandName} stands at ${input.visibilityScore}/100 AI Visibility (${deltaBadge}) with ${input.accuracyScore}% fact accuracy.`,
    '',
    `1. ${citationLine}`,
    `2. ${truthLine}`,
    `3. ${crawlerAndSchemaLine}`,
    `4. ${attributionLine}`,
    ...(rivalLine ? [`5. ${rivalLine}`] : []),
    '',
    `Next Step: ${primaryActionUrl}`,
  ];

  const quality = enforceQualityGate95(rawTextLines.join('\n'));

  const headerTitle = isWhiteLabel
    ? `${escapeHtml(cleanAgencyName!.toUpperCase())} · WEEKLY AI SEARCH CLIENT DIGEST`
    : 'VERISOURCE · WEEKLY EXECUTIVE GEO DIGEST';

  const outerBg = isWhiteLabel ? '#FAF9F6' : '#0E1116';
  const cardBorder = isWhiteLabel ? '#E5E2DA' : '#262E3D';
  const mastheadBg = isWhiteLabel ? escapeHtml(headerAccent) : '#131720';
  const mastheadBadge = isWhiteLabel
    ? ''
    : '<span style="display:inline-block;width:14px;height:14px;background:#E5A93C;border-radius:3px;vertical-align:middle;margin-right:8px;text-align:center;line-height:14px;color:#161004;font-size:9px;font-weight:900;">&#9671;</span>';
  const buttonStyle = isWhiteLabel
    ? `background:${escapeHtml(headerAccent)};color:#FAF9F6;font-weight:600;`
    : 'background:#E5A93C;color:#161004;font-weight:700;';

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:${outerBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0A0E17;">
  <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid ${cardBorder};border-radius:8px;overflow:hidden;">
    <div style="padding:15px 20px;background:${mastheadBg};color:#FAF9F6;font-size:12px;font-weight:700;letter-spacing:0.05em;">
      ${mastheadBadge}${headerTitle}
    </div>
    <div style="padding:22px 20px;">
      <div style="font-family:monospace;font-size:11px;color:#686D78;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">
        7-DAY CLIENT PERFORMANCE LEDGER &middot; ${escapeHtml(hostname)}
      </div>
      <h2 style="margin:0 0 16px 0;font-size:21px;color:#0A0E17;">
        ${escapeHtml(input.brandName)}
      </h2>

      <table style="width:100%;border-collapse:collapse;border:1px solid #E5E2DA;margin-bottom:18px;">
        <tr>
          <td style="width:33.3%;padding:12px 14px;border-right:1px solid #E5E2DA;background:#FAF9F6;">
            <div style="font-family:monospace;font-size:10.5px;color:#686D78;text-transform:uppercase;">AI Visibility</div>
            <div style="font-family:monospace;font-size:22px;font-weight:700;color:#0A0E17;margin-top:4px;">${input.visibilityScore}<span style="font-size:12px;color:#686D78;">/100</span></div>
            <div style="font-size:11.5px;color:#166534;margin-top:3px;">${escapeHtml(deltaBadge)}</div>
          </td>
          <td style="width:33.3%;padding:12px 14px;border-right:1px solid #E5E2DA;background:#FAF9F6;">
            <div style="font-family:monospace;font-size:10.5px;color:#686D78;text-transform:uppercase;">Fact Accuracy</div>
            <div style="font-family:monospace;font-size:22px;font-weight:700;color:#0A0E17;margin-top:4px;">${input.accuracyScore}%</div>
            <div style="font-size:11.5px;color:#3F4654;margin-top:3px;">${input.activeHallucinationCount} active conflict(s)</div>
          </td>
          <td style="width:33.3%;padding:12px 14px;background:#FAF9F6;">
            <div style="font-family:monospace;font-size:10.5px;color:#686D78;text-transform:uppercase;">AI Sales (7d)</div>
            <div style="font-family:monospace;font-size:22px;font-weight:700;color:#166534;margin-top:4px;">${escapeHtml(revenueFormatted)}</div>
            <div style="font-size:11.5px;color:#3F4654;margin-top:3px;">${input.aiReferralVisits7d} AI visit(s)</div>
          </td>
        </tr>
      </table>

      <div style="font-size:13.5px;line-height:1.6;color:#272C36;margin-bottom:18px;">
        <p style="margin:0 0 8px 0;"><strong>Citations:</strong> ${escapeHtml(citationLine)}</p>
        <p style="margin:0 0 8px 0;"><strong>Brand Truth:</strong> ${escapeHtml(truthLine)}</p>
        <p style="margin:0 0 8px 0;"><strong>Crawlers &amp; Fixes:</strong> ${escapeHtml(crawlerAndSchemaLine)}</p>
        ${rivalLine ? `<p style="margin:0;"><strong>Rivals Observed:</strong> ${escapeHtml(rivalList.join(', '))}</p>` : ''}
      </div>

      <a href="${escapeHtml(primaryActionUrl)}" style="display:inline-block;padding:10px 16px;${buttonStyle}text-decoration:none;border-radius:5px;font-size:13px;">
        ${escapeHtml(primaryActionLabel)}
      </a>
    </div>
  </div>
</body>
</html>`;

  return {
    subject,
    text: quality.content,
    html,
    scoreDelta,
    isWhiteLabel,
    quality,
  };
}

export async function dispatchWeeklyExecutiveDigestEmail(
  input: DispatchWeeklyDigestEmailInput
): Promise<DispatchWeeklyDigestEmailResult> {
  const digest = buildWeeklyExecutiveDigest(input);
  const apiKey = input.resendApiKey?.trim() ?? '';

  if (!apiKey) {
    return {
      delivered: false,
      mode: 'preview_dry_run',
      providerMessageId: null,
      recipientEmail: input.recipientEmail,
      subject: digest.subject,
      text: digest.text,
      html: digest.html,
      scoreDelta: digest.scoreDelta,
      isWhiteLabel: digest.isWhiteLabel,
      qualityScore: digest.quality.score,
      qualityBreakdown: digest.quality.breakdown,
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
      subject: digest.subject,
      text: digest.text,
      html: digest.html,
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
    subject: digest.subject,
    text: digest.text,
    html: digest.html,
    scoreDelta: digest.scoreDelta,
    isWhiteLabel: digest.isWhiteLabel,
    qualityScore: digest.quality.score,
    qualityBreakdown: digest.quality.breakdown,
  };
}
