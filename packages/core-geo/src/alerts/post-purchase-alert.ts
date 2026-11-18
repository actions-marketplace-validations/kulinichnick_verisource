import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { PlanTier, QualityRubricBreakdown } from '../db/types.js';

export interface BuildPostPurchaseWelcomeInput {
  planTier: PlanTier;
  targetDomain?: string | null;
  visibilityScore?: number | null;
  fixCount?: number | null;
  magicLinkUrl?: string | null;
  consoleBaseUrl?: string;
  trialDays?: number;
}

export interface BuiltPostPurchaseWelcomeAlert {
  subject: string;
  text: string;
  html: string;
  actionUrl: string;
  quality: EnforcedQualityArtifact;
}

export interface DispatchPostPurchaseWelcomeInput
  extends BuildPostPurchaseWelcomeInput {
  recipientEmail: string;
  bccEmail?: string | null;
  resendApiKey?: string;
  fromEmail?: string;
}

export interface DispatchPostPurchaseWelcomeResult {
  delivered: boolean;
  mode: 'live_resend' | 'preview_dry_run';
  providerMessageId: string | null;
  recipientEmail: string;
  subject: string;
  text: string;
  actionUrl: string;
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

function formatPlanLabel(plan: PlanTier): {
  label: string;
  mcpCredits: number;
} {
  switch (plan) {
    case 'tripwire_19':
      return { label: '$19 One-Time Audit Pass', mcpCredits: 25 };
    case 'starter_49':
      return { label: 'Starter Brand ($49/mo)', mcpCredits: 25 };
    case 'pro_99':
      return { label: 'Pro + MCP Engine ($99/mo)', mcpCredits: 1000 };
    case 'agency_249':
      return { label: 'Agency White-Label ($249/mo)', mcpCredits: 5000 };
    default:
      return { label: 'Verisource Workspace', mcpCredits: 5 };
  }
}

export function buildPostPurchaseWelcomeAlert(
  input: BuildPostPurchaseWelcomeInput
): BuiltPostPurchaseWelcomeAlert {
  const baseUrl = (input.consoleBaseUrl ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const cleanDomain = input.targetDomain?.trim() || null;
  const fallbackDashboardUrl = cleanDomain
    ? `${baseUrl}/dashboard?tab=tab2_fixes&domain=${encodeURIComponent(cleanDomain)}`
    : `${baseUrl}/dashboard?tab=tab2_fixes`;
  const actionUrl = input.magicLinkUrl?.trim() || fallbackDashboardUrl;
  const { label: planLabel, mcpCredits } = formatPlanLabel(input.planTier);
  const isTrial = typeof input.trialDays === 'number' && input.trialDays > 0;

  const subject = isTrial
    ? cleanDomain
      ? `[${input.trialDays}-Day Trial Active] ${cleanDomain} JSON-LD & /agents.md bundle (${planLabel})`
      : `[${input.trialDays}-Day Trial Active] Your Verisource ${planLabel} is live`
    : cleanDomain
      ? `[Fix Pack Ready] ${cleanDomain} JSON-LD & /agents.md bundle (${planLabel})`
      : `[Workspace Ready] Your Verisource ${planLabel} is active`;

  const scoreClause =
    typeof input.visibilityScore === 'number'
      ? ` (${input.visibilityScore}/100 AI Visibility)`
      : '';
  const artifactCount =
    typeof input.fixCount === 'number' && input.fixCount > 0
      ? input.fixCount
      : 4;

  const secondParagraph = cleanDomain
    ? `We audited ${cleanDomain} across ChatGPT, Google Gemini, and Perplexity${scoreClause} and bundled ${artifactCount} verified schema.org JSON-LD, /llms.txt, and /agents.md fixes into one ready-to-copy AI Prompt in Step 02 (no manual coding needed—paste straight into ChatGPT, Claude, Antigravity, Cursor, or Shopify).`
    : `Your ${planLabel} workspace is provisioned with step-by-step site diagnosis, 3-engine citation checks, and a 1-Click AI Fix Prompt for ChatGPT, Claude, Antigravity, Cursor, or Shopify.`;

  const thirdParagraph =
    input.planTier === 'tripwire_19'
      ? 'Your $19 Audit Pass automatically credits $19 off Month 1 if you upgrade to any monthly or annual plan within 7 days.'
      : isTrial
        ? input.planTier === 'pro_99'
          ? `$0.00 was charged today. Your ${input.trialDays}-day free trial includes 150 starter /mcp credits (stepping up to 1,000 credits/month upon paid renewal), and you can cancel in 1 click anytime from the Billing Portal.`
          : `$0.00 was charged today. Your ${input.trialDays}-day free trial includes automated weekly Hallucination Watchdog scans and 25 /mcp credits/month, and you can cancel in 1 click anytime from the Billing Portal.`
        : `Automated weekly Hallucination Watchdog scans and SHA-256 Bearer /mcp credentials (${mcpCredits} credits/month) are active in your workspace.`;

  const headerBadgeLabel = isTrial
    ? `${planLabel.toUpperCase()} · ${input.trialDays}-DAY FREE TRIAL`
    : planLabel.toUpperCase();

  const rawTextDraft = [
    'Your Verisource workspace is live.',
    secondParagraph,
    thirdParagraph,
    `Open Tab 2 directly to copy or download your implementation bundle: ${actionUrl}`,
  ].join('\n\n');

  const quality = enforceQualityGate95(rawTextDraft, 'citation_outreach_brief');

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#0E1116;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1px solid #262E3D;border-radius:10px;overflow:hidden;">
    <div style="padding:14px 20px;background:#131720;border-bottom:1px solid #262E3D;color:#EEF1F6;font-size:12px;font-weight:700;letter-spacing:0.05em;">
      <span style="display:inline-block;width:14px;height:14px;background:#E5A93C;border-radius:3px;vertical-align:middle;margin-right:8px;text-align:center;line-height:14px;color:#161004;font-size:9px;font-weight:900;">&#9671;</span>VERISOURCE &middot; ${escapeHtml(headerBadgeLabel)}
    </div>
    <div style="padding:22px 20px;">
      <h2 style="margin:0 0 8px 0;font-size:20px;color:#0F172A;">${
        cleanDomain
          ? `Your ${escapeHtml(cleanDomain)} Fix Bundle is ready`
          : 'Your Verisource workspace is live'
      }</h2>
      <p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;color:#334155;">
        ${escapeHtml(secondParagraph)}
      </p>
      <div style="padding:12px 14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;margin-bottom:18px;font-size:13px;color:#0F172A;">
        ${escapeHtml(thirdParagraph)}
      </div>
      <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:11px 18px;background:#E5A93C;color:#161004;text-decoration:none;border-radius:6px;font-size:13.5px;font-weight:700;">
        ${input.magicLinkUrl ? 'One-Click Sign In & Open Tab 2 Fixes' : 'Open Tab 2 Fix Bundle'} &rarr;
      </a>
    </div>
  </div>
</body>
</html>`;

  return {
    subject,
    text: quality.content,
    html,
    actionUrl,
    quality,
  };
}

export async function dispatchPostPurchaseWelcomeEmail(
  input: DispatchPostPurchaseWelcomeInput
): Promise<DispatchPostPurchaseWelcomeResult> {
  const alert = buildPostPurchaseWelcomeAlert(input);
  const apiKey = input.resendApiKey?.trim() ?? '';

  if (!apiKey) {
    return {
      delivered: false,
      mode: 'preview_dry_run',
      providerMessageId: null,
      recipientEmail: input.recipientEmail,
      subject: alert.subject,
      text: alert.text,
      actionUrl: alert.actionUrl,
      qualityScore: alert.quality.score,
      qualityBreakdown: alert.quality.breakdown,
    };
  }

  const fromAddress =
    input.fromEmail?.trim() || 'Verisource Watchdog <alerts@verisource.dev>';
  const cleanBcc = input.bccEmail?.trim();
  const bccList =
    cleanBcc && cleanBcc.toLowerCase() !== input.recipientEmail.toLowerCase()
      ? [cleanBcc]
      : undefined;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [input.recipientEmail],
      ...(bccList ? { bcc: bccList } : {}),
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
    actionUrl: alert.actionUrl,
    qualityScore: alert.quality.score,
    qualityBreakdown: alert.quality.breakdown,
  };
}
