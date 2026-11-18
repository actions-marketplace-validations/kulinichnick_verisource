import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { QualityRubricBreakdown } from '../db/types.js';
import type { ReadinessScanSummary } from '../orchestrator/audit-domain.js';
import { buildPlainEnglishSiteDiagnosis } from '../orchestrator/plain-diagnosis.js';
import {
  getWebsitePlatformMeta,
  type RecommendedRemediationEnv,
} from '../scanner/cms-detector.js';

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface BuildFreeAuditSummaryAlertInput {
  summary: ReadinessScanSummary;
  targetEnv?: RecommendedRemediationEnv;
  appOrigin?: string;
}

export interface BuiltFreeAuditSummaryAlert {
  subject: string;
  text: string;
  html: string;
  trialUrl: string;
  passUrl: string;
  auditReplayUrl: string;
  quality: EnforcedQualityArtifact;
}

export interface DispatchFreeAuditSummaryInput
  extends BuildFreeAuditSummaryAlertInput {
  recipientEmail: string;
  resendApiKey?: string;
  fromEmail?: string;
}

export interface DispatchFreeAuditSummaryResult {
  delivered: boolean;
  mode: 'live_resend' | 'preview_dry_run';
  providerMessageId: string | null;
  recipientEmail: string;
  subject: string;
  text: string;
  html: string;
  trialUrl: string;
  passUrl: string;
  auditReplayUrl: string;
  qualityScore: number;
  qualityBreakdown: QualityRubricBreakdown;
}

export function buildFreeAuditSummaryAlert(
  input: BuildFreeAuditSummaryAlertInput
): BuiltFreeAuditSummaryAlert {
  const { summary } = input;
  const origin = (input.appOrigin ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const platformMeta = getWebsitePlatformMeta(
    summary.detectedPlatform ??
      (summary.isShopify ? 'shopify' : 'nextjs_custom')
  );
  const resolvedEnv: RecommendedRemediationEnv =
    input.targetEnv ?? platformMeta.recommendedAiEnv;

  const diagnosis = buildPlainEnglishSiteDiagnosis({
    brandName: summary.brandName,
    hostname: summary.hostname,
    visibilityScore: summary.visibilityScore,
    accuracyScore: summary.accuracyScore,
    robotsAiBotStatus: summary.robotsAiBotStatus,
    llmsTxtStatus: summary.llmsTxtStatus,
    agentsMdStatus: summary.agentsMdStatus,
    jsonLdCount: summary.jsonLdCount,
    isShopify: summary.isShopify,
    shopifyMcpStatus: summary.shopifyMcpStatus,
    crawlerReadability: summary.crawlerReadability,
    hallucinationCount: summary.samplePromptResult.hallucinationDetected
      ? 1
      : 0,
    brandMentionedInSample: summary.samplePromptResult.brandMentioned,
    topRivals: summary.samplePromptResult.competitorsMentioned,
  });

  const trialUrl = `${origin}/pricing?plan=pro_99&domain=${encodeURIComponent(
    summary.hostname
  )}&env=${encodeURIComponent(resolvedEnv)}`;
  const passUrl = `${origin}/pricing?plan=tripwire_19&domain=${encodeURIComponent(
    summary.hostname
  )}&env=${encodeURIComponent(resolvedEnv)}`;
  const auditReplayUrl = `${origin}/?domain=${encodeURIComponent(
    summary.hostname
  )}#scan`;

  const subject = `AI Search Audit & Action Plan: ${summary.hostname} (${summary.visibilityScore}/100 Visibility)`;

  const topIssues = diagnosis.issues.slice(0, 3);
  const issueLines = topIssues
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.whatIsWrong} — ${item.whyItMatters} Fix: ${item.howToFixPlain}`
    )
    .join('\n');

  const leadParagraph = `${summary.brandName} (${summary.hostname}) scored ${summary.visibilityScore}/100 on AI Visibility and ${summary.accuracyScore}% on fact accuracy across our live HTTP crawler, JSON-LD, /llms.txt, and /agents.md readiness check (Detected Platform: ${platformMeta.displayName}).`;

  const desktopNextStep = `Open the link below on your laptop to copy your single ready-made AI Fix Prompt for ${platformMeta.displayName} (${platformMeta.quickWhereToPasteSummary})—start with a 7-day free trial ($0.00 due today, 1-click cancel before Day 7) or grab the $19 One-Time Audit Pass with zero recurring billing.`;

  const footerNote = `Requested via the free AI Search Audit for ${summary.hostname} on ${origin}. No account or subscription was created by this email.`;

  const rawText = [
    leadParagraph,
    `What to Fix First on ${summary.hostname}:\n${issueLines}`,
    desktopNextStep,
    `Start 7-Day Free Trial & Copy AI Prompt ($0 Today): ${trialUrl}`,
    `Or $19 One-Time Audit Pass: ${passUrl}`,
    `Re-open Free Scan Summary: ${auditReplayUrl}`,
    footerNote,
  ].join('\n\n');

  const quality = enforceQualityGate95(rawText, 'citation_outreach_brief');

  const htmlIssues = topIssues
    .map(
      (item, idx) => `
      <div style="padding:11px 13px;background:${
        item.severity === 'fix_first' ? '#FEF2F2' : '#F7F5EF'
      };border:1px solid #E5E2DA;border-radius:6px;margin-bottom:9px;font-size:13px;line-height:1.52;color:#0A0E17;">
        <strong>${idx + 1}. ${escapeHtml(item.whatIsWrong)}</strong><br/>
        <span style="color:#3A3F4B;">${escapeHtml(item.whyItMatters)}</span><br/>
        <span style="color:#065F46;font-weight:600;">Fix:</span> <span style="color:#3A3F4B;">${escapeHtml(item.howToFixPlain)}</span>
      </div>`
    )
    .join('');

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#0E1116;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1px solid #262E3D;border-radius:10px;overflow:hidden;">
    <div style="padding:14px 20px;background:#131720;border-bottom:1px solid #262E3D;color:#EEF1F6;font-size:12px;font-weight:700;letter-spacing:0.05em;">
      <span style="display:inline-block;width:14px;height:14px;background:#E5A93C;border-radius:3px;vertical-align:middle;margin-right:8px;text-align:center;line-height:14px;color:#161004;font-size:9px;font-weight:900;">&#9671;</span>VERISOURCE &middot; FREE AI SEARCH AUDIT &amp; ACTION PLAN
    </div>
    <div style="padding:22px 20px;">
      <h2 style="margin:0 0 8px 0;font-size:20px;color:#0F172A;">
        ${escapeHtml(summary.brandName)} (${escapeHtml(summary.hostname)}) &mdash; ${summary.visibilityScore}/100 AI Visibility
      </h2>
      <p style="margin:0 0 14px 0;font-size:13.5px;line-height:1.58;color:#334155;">
        ${escapeHtml(leadParagraph)}
      </p>
      <div style="margin-bottom:16px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748B;margin-bottom:8px;">
          WHAT TO FIX FIRST ON ${escapeHtml(summary.hostname.toUpperCase())}
        </div>
        ${htmlIssues}
      </div>
      <p style="margin:0 0 14px 0;font-size:13.5px;line-height:1.58;color:#0F172A;">
        ${escapeHtml(desktopNextStep)}
      </p>
      <div style="margin-bottom:16px;">
        <a href="${escapeHtml(trialUrl)}" style="display:inline-block;padding:11px 18px;background:#E5A93C;color:#161004;text-decoration:none;border-radius:6px;font-size:13.5px;font-weight:700;margin-right:8px;margin-bottom:8px;">
          Start 7-Day Free Trial &amp; Copy AI Prompt ($0 Today) &rarr;
        </a>
        <a href="${escapeHtml(passUrl)}" style="display:inline-block;padding:10px 15px;background:#FFFFFF;color:#0F172A;border:1px solid #CBD5E1;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;margin-bottom:8px;">
          Or $19 One-Time Audit Pass
        </a>
      </div>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#64748B;">
        <a href="${escapeHtml(auditReplayUrl)}" style="color:#0F172A;font-weight:600;">Re-open live scan summary</a> &middot; ${escapeHtml(footerNote)}
      </p>
    </div>
  </div>
</body>
</html>`;

  return {
    subject,
    text: quality.content,
    html,
    trialUrl,
    passUrl,
    auditReplayUrl,
    quality,
  };
}

export async function dispatchFreeAuditSummaryEmail(
  input: DispatchFreeAuditSummaryInput
): Promise<DispatchFreeAuditSummaryResult> {
  const alert = buildFreeAuditSummaryAlert(input);
  const apiKey = input.resendApiKey?.trim() ?? '';

  if (!apiKey) {
    return {
      delivered: false,
      mode: 'preview_dry_run',
      providerMessageId: null,
      recipientEmail: input.recipientEmail,
      subject: alert.subject,
      text: alert.text,
      html: alert.html,
      trialUrl: alert.trialUrl,
      passUrl: alert.passUrl,
      auditReplayUrl: alert.auditReplayUrl,
      qualityScore: alert.quality.score,
      qualityBreakdown: alert.quality.breakdown,
    };
  }

  const fromAddress =
    input.fromEmail?.trim() || 'Verisource Audit <alerts@verisource.dev>';

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
    html: alert.html,
    trialUrl: alert.trialUrl,
    passUrl: alert.passUrl,
    auditReplayUrl: alert.auditReplayUrl,
    qualityScore: alert.quality.score,
    qualityBreakdown: alert.quality.breakdown,
  };
}
