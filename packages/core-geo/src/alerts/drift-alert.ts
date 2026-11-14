import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type {
  HallucinationDetail,
  QualityRubricBreakdown,
} from '../db/types.js';

export interface BuildDriftAlertInput {
  brandName: string;
  domainUrl: string;
  visibilityScore: number;
  accuracyScore: number;
  hallucinations: HallucinationDetail[];
  blockedBots: string[];
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
  const subject =
    conflictCount > 0
      ? `[Verisource Watchdog] ${conflictCount} AI claim conflict(s) flagged on ${hostname}`
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

  const botLine =
    input.blockedBots.length > 0
      ? `WAF Crawler Block Warning: ${input.blockedBots.join(', ')} returned HTTP 403 on ${input.domainUrl}/robots.txt or root.`
      : `AI Crawler Access: GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot are allowed (HTTP 200).`;

  const rawTextDraft = [
    `Watchdog scan finished for ${hostname}.`,
    `${input.brandName} currently holds ${input.visibilityScore}/100 AI Share-of-Voice and ${input.accuracyScore}% Brand Truth accuracy across ChatGPT, Google Gemini, and Perplexity commercial buyer prompts.`,
    '',
    ...claimLines,
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
<body style="margin:0;padding:24px;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;">
  <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:6px;overflow:hidden;">
    <div style="padding:16px 20px;background:#0F172A;color:#FFFFFF;font-size:13px;font-weight:700;letter-spacing:0.03em;">
      VERISOURCE · HALLUCINATION DRIFT WATCHDOG
    </div>
    <div style="padding:22px 20px;">
      <h2 style="margin:0 0 8px 0;font-size:20px;">${escapeHtml(input.brandName)} (${escapeHtml(hostname)})</h2>
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
      <a href="${escapeHtml(consoleLink)}" style="display:inline-block;padding:10px 16px;background:#0F172A;color:#FFFFFF;text-decoration:none;border-radius:5px;font-size:13px;font-weight:600;">
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
