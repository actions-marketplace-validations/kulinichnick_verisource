import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { QualityRubricBreakdown } from '../db/types.js';

const AUTOMATED_PREVIEW_OR_CRAWLER_UA =
  /\b(Slackbot|LinkedInBot|Twitterbot|Discordbot|WhatsApp|facebookexternalhit|Facebot|TelegramBot|Pinterestbot|Googlebot|bingbot|YandexBot|DuckDuckBot|Baiduspider|Applebot|GPTBot|OAI-SearchBot|PerplexityBot|ClaudeBot|Google-Extended|HeadlessChrome|PhantomJS|curl|wget|python-requests|Go-http-client|PostmanRuntime|undici)\b/i;

export function isAutomatedPreviewBot(userAgent?: string | null): boolean {
  const ua = userAgent?.trim() ?? '';
  if (!ua || ua.length < 12) return true;
  return AUTOMATED_PREVIEW_OR_CRAWLER_UA.test(ua);
}

export interface BuildProspectOpenAlertInput {
  prospectBrandName: string;
  prospectDomain: string;
  shareSlug: string;
  visibilityScore: number;
  hallucinationCount: number;
  viewsCount: number;
  topGap?: string;
  agencyBrandName?: string | null;
  consoleBaseUrl?: string;
}

export interface BuiltProspectOpenAlert {
  subject: string;
  text: string;
  html: string;
  quality: EnforcedQualityArtifact;
}

export interface DispatchProspectOpenEmailInput
  extends BuildProspectOpenAlertInput {
  recipientEmail: string;
  resendApiKey?: string;
  fromEmail?: string;
}

export interface DispatchProspectOpenEmailResult {
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

export function buildProspectOpenAlert(
  input: BuildProspectOpenAlertInput
): BuiltProspectOpenAlert {
  const baseUrl = (input.consoleBaseUrl ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const auditUrl = `${baseUrl}/audit/${input.shareSlug}`;
  const consoleUrl = `${baseUrl}/dashboard?tab=tab3_offsite`;
  const primaryGap =
    input.topGap?.trim() ||
    'Missing /agents.md and structured schema.org JSON-LD entity guardrails.';

  const isRepeat = input.viewsCount >= 2;
  const subject = isRepeat
    ? `[Repeat Visit · ${input.viewsCount}x] ${input.prospectBrandName} reopened their AI audit brief`
    : `[Hot Lead] ${input.prospectBrandName} opened their AI audit brief (${input.visibilityScore}/100)`;

  const rawTextDraft = [
    `Verified human prospect view (#${input.viewsCount}) recorded on ${auditUrl}.`,
    `${input.prospectBrandName} (${input.prospectDomain}) holds ${input.visibilityScore}/100 AI Share-of-Voice with ${input.hallucinationCount} flagged claim conflict(s) across ChatGPT, Google Gemini, and Perplexity.`,
    `Primary protocol gap shown on their scorecard: ${primaryGap}`,
    `Follow up while the brief is top of mind or export their schema.org JSON-LD, /llms.txt, and /agents.md package from Tab 3: ${consoleUrl}`,
  ].join('\n\n');

  const quality = enforceQualityGate95(rawTextDraft, 'citation_outreach_brief');

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0A0E17;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E2DA;border-radius:8px;overflow:hidden;">
    <div style="padding:14px 20px;background:#0A0E17;color:#FAF9F6;font-size:12px;font-weight:700;letter-spacing:0.05em;">
      VERISOURCE · PROSPECT ENGAGEMENT SIGNAL
    </div>
    <div style="padding:22px 20px;">
      <h2 style="margin:0 0 6px 0;font-size:20px;">${escapeHtml(input.prospectBrandName)} opened their audit brief</h2>
      <p style="margin:0 0 16px 0;font-size:13.5px;color:#3F4654;font-family:monospace;">
        ${escapeHtml(input.prospectDomain)} &middot; Human Views: <strong>${input.viewsCount}</strong> &middot; Score: <strong>${input.visibilityScore}/100</strong>
      </p>
      <div style="padding:12px 14px;background:#F4F2EC;border:1px solid #E5E2DA;border-radius:6px;margin-bottom:18px;font-size:13px;color:#0A0E17;">
        <strong>Primary Gap Displayed:</strong> ${escapeHtml(primaryGap)}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${escapeHtml(consoleUrl)}" style="display:inline-block;padding:10px 16px;background:#0A0E17;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
          Open Tab 3 Pitch Console &rarr;
        </a>
        <a href="${escapeHtml(auditUrl)}" style="display:inline-block;padding:10px 16px;background:#FFFFFF;color:#0A0E17;border:1px solid #D5D0C5;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
          View Live Brief
        </a>
      </div>
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

export async function dispatchProspectOpenEmail(
  input: DispatchProspectOpenEmailInput
): Promise<DispatchProspectOpenEmailResult> {
  const alert = buildProspectOpenAlert(input);
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

export interface BuildProspectCtaClickAlertInput {
  prospectBrandName: string;
  prospectDomain: string;
  shareSlug: string;
  visibilityScore: number;
  hallucinationCount: number;
  viewsCount: number;
  ctaClicksCount: number;
  agencyCtaUrl?: string | null;
  topGap?: string;
  agencyBrandName?: string | null;
  consoleBaseUrl?: string;
}

export interface DispatchProspectCtaClickEmailInput
  extends BuildProspectCtaClickAlertInput {
  recipientEmail: string;
  resendApiKey?: string;
  fromEmail?: string;
}

export function buildProspectCtaClickAlert(
  input: BuildProspectCtaClickAlertInput
): BuiltProspectOpenAlert {
  const baseUrl = (input.consoleBaseUrl ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const auditUrl = `${baseUrl}/audit/${input.shareSlug}`;
  const consoleUrl = `${baseUrl}/dashboard?tab=tab3_offsite`;
  const destinationCta = input.agencyCtaUrl?.trim() || `${baseUrl}/pricing`;
  const primaryGap =
    input.topGap?.trim() ||
    'Missing /agents.md and structured schema.org JSON-LD entity guardrails.';

  const subject = `[Booking CTA Clicked] ${input.prospectBrandName} clicked your call link (${input.visibilityScore}/100)`;

  const rawTextDraft = [
    `High-intent booking CTA click (#${input.ctaClicksCount}) recorded on ${auditUrl}.`,
    `${input.prospectBrandName} (${input.prospectDomain}, ${Math.max(1, input.viewsCount)} brief view(s)) clicked through to ${destinationCta} after reviewing their ${input.visibilityScore}/100 AI Visibility Score and ${input.hallucinationCount} flagged claim conflict(s) across ChatGPT, Google Gemini, and Perplexity.`,
    `Primary technical gap highlighted on their brief: ${primaryGap}`,
    `Open Step 03 in your Console to pull their syntax-validated JSON-LD, /llms.txt, and /agents.md remediation bundle before your call: ${consoleUrl}`,
  ].join('\n\n');

  const quality = enforceQualityGate95(rawTextDraft, 'citation_outreach_brief');

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0A0E17;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E2DA;border-radius:8px;overflow:hidden;">
    <div style="padding:14px 20px;background:#0A0E17;color:#FAF9F6;font-size:12px;font-weight:700;letter-spacing:0.05em;">
      VERISOURCE &middot; HIGH-INTENT BOOKING CTA CLICK
    </div>
    <div style="padding:22px 20px;">
      <h2 style="margin:0 0 6px 0;font-size:20px;">${escapeHtml(input.prospectBrandName)} clicked your booking CTA</h2>
      <p style="margin:0 0 16px 0;font-size:13.5px;color:#3F4654;font-family:monospace;">
        ${escapeHtml(input.prospectDomain)} &middot; CTA Clicks: <strong>${input.ctaClicksCount}</strong> &middot; Score: <strong>${input.visibilityScore}/100</strong>
      </p>
      <div style="padding:12px 14px;background:#F4F2EC;border:1px solid #E5E2DA;border-radius:6px;margin-bottom:18px;font-size:13px;color:#0A0E17;">
        <strong>Primary Gap Displayed:</strong> ${escapeHtml(primaryGap)}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${escapeHtml(consoleUrl)}" style="display:inline-block;padding:10px 16px;background:#0A0E17;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
          Open Step 03 Pitch Console &rarr;
        </a>
        <a href="${escapeHtml(auditUrl)}" style="display:inline-block;padding:10px 16px;background:#FFFFFF;color:#0A0E17;border:1px solid #D5D0C5;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
          View Live Brief
        </a>
      </div>
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

export async function dispatchProspectCtaClickEmail(
  input: DispatchProspectCtaClickEmailInput
): Promise<DispatchProspectOpenEmailResult> {
  const alert = buildProspectCtaClickAlert(input);
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

export interface BuildProspectPdfExportAlertInput {
  prospectBrandName: string;
  prospectDomain: string;
  shareSlug: string;
  visibilityScore: number;
  hallucinationCount: number;
  viewsCount: number;
  pdfExportsCount: number;
  agencyCtaUrl?: string | null;
  topGap?: string;
  agencyBrandName?: string | null;
  consoleBaseUrl?: string;
}

export interface DispatchProspectPdfExportEmailInput
  extends BuildProspectPdfExportAlertInput {
  recipientEmail: string;
  resendApiKey?: string;
  fromEmail?: string;
}

export function buildProspectPdfExportAlert(
  input: BuildProspectPdfExportAlertInput
): BuiltProspectOpenAlert {
  const baseUrl = (input.consoleBaseUrl ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const auditUrl = `${baseUrl}/audit/${input.shareSlug}`;
  const consoleUrl = `${baseUrl}/dashboard?tab=tab3_offsite`;
  const primaryGap =
    input.topGap?.trim() ||
    'Missing /agents.md and structured schema.org JSON-LD entity guardrails.';

  const subject = `[Executive PDF Saved] ${input.prospectBrandName} exported their AI audit brief (${input.visibilityScore}/100)`;

  const rawTextDraft = [
    `Stakeholder handoff signal (#${input.pdfExportsCount}) recorded on ${auditUrl}.`,
    `${input.prospectBrandName} (${input.prospectDomain}, ${Math.max(1, input.viewsCount)} brief view(s)) saved the executive scorecard after reviewing their ${input.visibilityScore}/100 AI Visibility Score and ${input.hallucinationCount} flagged claim conflict(s) across ChatGPT, Google Gemini, and Perplexity.`,
    `Primary technical gap highlighted on their exported brief: ${primaryGap}`,
    `Buyers typically save PDF or Markdown briefs to forward internally—open Step 03 in your Console to follow up with their validated schema.org JSON-LD, /llms.txt, and /agents.md package: ${consoleUrl}`,
  ].join('\n\n');

  const quality = enforceQualityGate95(rawTextDraft, 'citation_outreach_brief');

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0A0E17;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E2DA;border-radius:8px;overflow:hidden;">
    <div style="padding:14px 20px;background:#0A0E17;color:#FAF9F6;font-size:12px;font-weight:700;letter-spacing:0.05em;">
      VERISOURCE &middot; STAKEHOLDER BRIEF EXPORTED
    </div>
    <div style="padding:22px 20px;">
      <h2 style="margin:0 0 6px 0;font-size:20px;">${escapeHtml(input.prospectBrandName)} saved their executive brief</h2>
      <p style="margin:0 0 16px 0;font-size:13.5px;color:#3F4654;font-family:monospace;">
        ${escapeHtml(input.prospectDomain)} &middot; Exports: <strong>${input.pdfExportsCount}</strong> &middot; Score: <strong>${input.visibilityScore}/100</strong>
      </p>
      <div style="padding:12px 14px;background:#F4F2EC;border:1px solid #E5E2DA;border-radius:6px;margin-bottom:18px;font-size:13px;color:#0A0E17;">
        <strong>Primary Gap Displayed:</strong> ${escapeHtml(primaryGap)}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${escapeHtml(consoleUrl)}" style="display:inline-block;padding:10px 16px;background:#0A0E17;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
          Open Step 03 Pitch Console &rarr;
        </a>
        <a href="${escapeHtml(auditUrl)}" style="display:inline-block;padding:10px 16px;background:#FFFFFF;color:#0A0E17;border:1px solid #D5D0C5;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
          View Live Brief
        </a>
      </div>
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

export async function dispatchProspectPdfExportEmail(
  input: DispatchProspectPdfExportEmailInput
): Promise<DispatchProspectOpenEmailResult> {
  const alert = buildProspectPdfExportAlert(input);
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
