import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type {
  AgentsMdStatus,
  LlmsTxtStatus,
  PlanTier,
  QualityRubricBreakdown,
  RobotsAiBotStatus,
} from '../db/types.js';
import { buildPlainEnglishSiteDiagnosis } from '../orchestrator/plain-diagnosis.js';

export type TrialLifecycleStage = 'day3_copy_ai_prompt' | 'day5_value_proof';

export interface EvaluateTrialLifecycleParams {
  planTier: PlanTier;
  billingCycle?: string | null;
  mcpCallsLimit?: number;
  stripeSubscriptionId?: string | null;
  tripwirePaidAt?: string | null;
  profileCreatedAtIso?: string | null;
  nowMs?: number;
}

/**
 * Deterministically identifies whether a monthly Starter ($49/mo) or Pro ($99/mo)
 * subscriber is currently inside their 7-day free trial window:
 * - Day-3 window: 48h to < 108h since account creation
 * - Day-5 window: 108h to <= 164h since account creation
 * Excludes non-trial plans, annual plans, $19 Tripwire upgraders, and Pro accounts
 * that have already cleared their Day-7 paid renewal (1,000 /mcp credits).
 */
export function evaluateTrialLifecycleStage(
  params: EvaluateTrialLifecycleParams
): TrialLifecycleStage | null {
  if (params.planTier !== 'starter_49' && params.planTier !== 'pro_99') {
    return null;
  }
  if (params.billingCycle && params.billingCycle !== 'monthly') {
    return null;
  }
  if (!params.stripeSubscriptionId) {
    return null;
  }
  if (params.tripwirePaidAt) {
    return null;
  }
  if (
    params.planTier === 'pro_99' &&
    typeof params.mcpCallsLimit === 'number' &&
    params.mcpCallsLimit > 150
  ) {
    return null;
  }
  if (!params.profileCreatedAtIso) {
    return null;
  }

  const createdMs = Date.parse(params.profileCreatedAtIso);
  if (Number.isNaN(createdMs)) {
    return null;
  }

  const now = params.nowMs ?? Date.now();
  const elapsedHours = (now - createdMs) / (1000 * 60 * 60);

  if (elapsedHours >= 48 && elapsedHours < 108) {
    return 'day3_copy_ai_prompt';
  }
  if (elapsedHours >= 108 && elapsedHours <= 164) {
    return 'day5_value_proof';
  }
  return null;
}

export interface BuildTrialActivationNudgeInput {
  stage: TrialLifecycleStage;
  planTier: PlanTier;
  brandName?: string | null;
  domainUrl?: string | null;
  visibilityScore?: number | null;
  accuracyScore?: number | null;
  appliedFixesCount?: number;
  totalFixesCount?: number;
  botCrawlCount?: number;
  aiReferralVisits7d?: number;
  hallucinationCount?: number;
  robotsAiBotStatus?: RobotsAiBotStatus | null;
  llmsTxtStatus?: LlmsTxtStatus | null;
  agentsMdStatus?: AgentsMdStatus | null;
  jsonLdCount?: number;
  topRivals?: string[];
  consoleBaseUrl?: string;
}

export interface BuiltTrialActivationNudgeAlert {
  stage: TrialLifecycleStage;
  subject: string;
  text: string;
  html: string;
  actionUrl: string;
  billingPortalUrl: string;
  quality: EnforcedQualityArtifact;
}

export interface DispatchTrialActivationNudgeInput
  extends BuildTrialActivationNudgeInput {
  recipientEmail: string;
  resendApiKey?: string;
  fromEmail?: string;
}

export interface DispatchTrialActivationNudgeResult {
  delivered: boolean;
  mode: 'live_resend' | 'preview_dry_run';
  providerMessageId: string | null;
  recipientEmail: string;
  stage: TrialLifecycleStage;
  subject: string;
  text: string;
  html: string;
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

function extractCleanHostname(domainUrl?: string | null): string | null {
  if (!domainUrl) return null;
  const trimmed = domainUrl.trim();
  if (!trimmed) return null;
  try {
    return new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    ).hostname
      .replace(/^www\./, '')
      .toLowerCase();
  } catch {
    return null;
  }
}

export function buildTrialActivationNudgeAlert(
  input: BuildTrialActivationNudgeInput
): BuiltTrialActivationNudgeAlert {
  const baseUrl = (input.consoleBaseUrl ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const hostname = extractCleanHostname(input.domainUrl);
  const brand = input.brandName?.trim() || hostname || 'your website';
  const appliedCount = input.appliedFixesCount ?? 0;
  const totalFixes = Math.max(input.totalFixesCount ?? 4, appliedCount, 1);
  const botCrawls = input.botCrawlCount ?? 0;
  const aiVisits = input.aiReferralVisits7d ?? 0;
  const visScore = input.visibilityScore ?? 0;
  const accScore = input.accuracyScore ?? 100;

  const actionUrl = hostname
    ? `${baseUrl}/dashboard?tab=tab2_fixes&domain=${encodeURIComponent(hostname)}&trial=7d`
    : `${baseUrl}/dashboard?trial=7d`;
  const billingPortalUrl = `${baseUrl}/dashboard`;

  const defaultBots: RobotsAiBotStatus = {
    GPTBot: true,
    'OAI-SearchBot': true,
    PerplexityBot: true,
    ClaudeBot: true,
    'Google-Extended': true,
    waf_blocked: false,
  };

  const plainDiagnosis = hostname
    ? buildPlainEnglishSiteDiagnosis({
        brandName: brand,
        hostname,
        visibilityScore: visScore,
        accuracyScore: accScore,
        robotsAiBotStatus: input.robotsAiBotStatus ?? defaultBots,
        llmsTxtStatus: input.llmsTxtStatus ?? 'missing',
        agentsMdStatus: input.agentsMdStatus ?? 'missing',
        jsonLdCount: input.jsonLdCount ?? 0,
        hallucinationCount: input.hallucinationCount ?? 0,
        topRivals: input.topRivals ?? [],
      })
    : null;

  const topIssuePlain =
    plainDiagnosis && plainDiagnosis.issueCount > 0
      ? plainDiagnosis.issues[0]?.whatIsWrong ?? null
      : null;

  if (input.stage === 'day3_copy_ai_prompt') {
    const subject = hostname
      ? `[5-Min AI Fix] Copy 1 prompt to fix ${hostname} in ChatGPT & Perplexity`
      : '[7-Day Trial Quickstart] Scan your website & copy your 1-Click AI Fix Prompt';

    const leadLine = hostname
      ? topIssuePlain
        ? `Quick Day-3 check-in on ${hostname} (${visScore}/100 AI Visibility): ${topIssuePlain}`
        : `Quick Day-3 check-in on ${hostname}: your verified JSON-LD, /llms.txt, and /agents.md website files are ready in Step 02 (${appliedCount}/${totalFixes} live so far).`
      : 'Quick Day-3 check-in on your 7-day Verisource trial: add your website URL in the Console so we can prepare your plain-English diagnosis and 1-Click AI Fix Prompt.';

    const howToSteps = [
      'You do not need to write code or edit raw files manually. Fix your website in 3 quick clicks:',
      '1. Open Step 02 in your Console and select the AI tool you use (Claude, ChatGPT, Antigravity, Cursor, or Shopify).',
      '2. Click "Copy Prompt for My AI" and paste that single prompt into your AI assistant—it bundles your verified JSON-LD schema, /llms.txt, /agents.md, and real pricing rules.',
      '3. Once published, click "Verify Live Fixes" in Step 02 so Verisource confirms HTTP 200 readiness for GPTBot and PerplexityBot.',
    ].join('\n');

    const trialFooter =
      input.planTier === 'pro_99'
        ? 'Your 7-day free trial ($0.00 charged at signup) includes 150 starter /mcp credits and steps up to 1,000 /mcp credits/month on Day 7 unless canceled in 1 click inside Manage Billing.'
        : 'Your 7-day free trial ($0.00 charged at signup) includes weekly Hallucination Watchdog checks and can be managed or canceled in 1 click anytime inside Manage Billing.';

    const rawText = [
      leadLine,
      howToSteps,
      trialFooter,
      `Open Step 02 & Copy Your AI Fix Prompt: ${actionUrl}`,
    ].join('\n\n');

    const quality = enforceQualityGate95(rawText, 'citation_outreach_brief');

    const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0A0E17;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E2DA;border-radius:8px;overflow:hidden;">
    <div style="padding:14px 20px;background:#0A0E17;color:#FAF9F6;font-size:12px;font-weight:700;letter-spacing:0.05em;">
      VERISOURCE &middot; 7-DAY FREE TRIAL QUICKSTART (NO CODING NEEDED)
    </div>
    <div style="padding:22px 20px;">
      <h2 style="margin:0 0 10px 0;font-size:20px;color:#0A0E17;">${
        hostname
          ? `Let your AI fix ${escapeHtml(hostname)} in 5 minutes`
          : 'Scan your site & copy your 1-Click AI Fix Prompt'
      }</h2>
      <p style="margin:0 0 14px 0;font-size:14px;line-height:1.58;color:#2E3440;">
        ${escapeHtml(leadLine)}
      </p>
      <div style="padding:14px 16px;background:#F7F5EF;border:1px solid #E5E2DA;border-radius:6px;margin-bottom:16px;font-size:13.5px;line-height:1.58;color:#0A0E17;">
        <strong>3-Step Shortcut (Zero Manual Coding):</strong><br/>
        1. Open <strong>Step 02</strong> and choose your AI tool (ChatGPT, Claude, Antigravity, Cursor, or Shopify).<br/>
        2. Click <strong>Copy Prompt for My AI</strong> and paste that single prompt into your AI.<br/>
        3. Click <strong>Verify Live Fixes</strong> to confirm your higher AI Visibility Score.
      </div>
      <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:11px 18px;background:#0A0E17;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13.5px;font-weight:600;margin-bottom:14px;">
        Open Step 02 &amp; Copy My AI Fix Prompt &rarr;
      </a>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#686D78;">
        ${escapeHtml(trialFooter)}
      </p>
    </div>
  </div>
</body>
</html>`;

    return {
      stage: input.stage,
      subject,
      text: quality.content,
      html,
      actionUrl,
      billingPortalUrl,
      quality,
    };
  }

  // Stage 2: Day-5 Progress, Crawl Proof & Pre-Renewal Check-In
  const firstRival = (input.topRivals ?? []).filter(Boolean)[0] ?? 'Competitors';
  const hasProgress = appliedCount > 0 || botCrawls > 0;

  const subject = hostname
    ? hasProgress
      ? `[Day-5 Trial Report] ${hostname}: ${appliedCount}/${totalFixes} AI files live (${visScore}/100 Visibility)`
      : `[2 Days Left on Free Trial] Publish your ${hostname} AI Fix Prompt before Day 7`
    : '[Day-5 Trial Check-In] Two days left on your Verisource 7-day free trial';

  const statusParagraph = hostname
    ? hasProgress
      ? `${brand} (${hostname}) now has ${appliedCount} of ${totalFixes} verified JSON-LD, /llms.txt, and /agents.md fixes live (${visScore}/100 AI Visibility, ${accScore}% fact accuracy, ${botCrawls} verified bot crawl event${botCrawls === 1 ? '' : 's'}, and ${aiVisits} AI-referred visit${aiVisits === 1 ? '' : 's'}).`
      : `${brand} (${hostname}) still has ${totalFixes} ready-to-publish JSON-LD, /llms.txt, and /agents.md fixes waiting in Step 02 (${visScore}/100 baseline AI Visibility).`
    : 'You have 2 days remaining in your 7-day free trial—add your website in the Console to generate your 1-Click AI Fix Prompt.';

  const nextWinParagraph = hasProgress
    ? `Next 2-minute win: open Step 02's Comparison Page Studio to generate a truth-locked "${brand} vs. ${firstRival}" page so ChatGPT Search and Perplexity cite your side-by-side comparison table on buyer shortlists.`
    : 'Fastest way to see live uplift before Day 7: open Step 02, click "Copy Prompt for My AI", paste that single prompt into ChatGPT, Claude, Antigravity, Cursor, or Shopify, and run "Verify Live Fixes".';

  const renewalClarity =
    input.planTier === 'pro_99'
      ? 'Transparent trial reminder: on Day 7 your Pro + MCP plan renews at $99/mo and automatically steps up from 150 starter credits to your full 1,000 monthly /mcp credits (or manage/cancel in 1 click anytime via Manage Billing in your Console).'
      : 'Transparent trial reminder: on Day 7 your Starter Brand plan renews at $49/mo with weekly automated Hallucination Watchdog monitoring (or manage/cancel in 1 click anytime via Manage Billing in your Console).';

  const rawDay5Text = [
    statusParagraph,
    nextWinParagraph,
    renewalClarity,
    `Open Your Verisource Console: ${actionUrl}`,
  ].join('\n\n');

  const quality = enforceQualityGate95(rawDay5Text, 'citation_outreach_brief');

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0A0E17;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E2DA;border-radius:8px;overflow:hidden;">
    <div style="padding:14px 20px;background:#0A0E17;color:#FAF9F6;font-size:12px;font-weight:700;letter-spacing:0.05em;">
      VERISOURCE &middot; DAY-5 TRIAL PROGRESS &amp; PRE-RENEWAL SUMMARY
    </div>
    <div style="padding:22px 20px;">
      <h2 style="margin:0 0 10px 0;font-size:20px;color:#0A0E17;">${
        hostname
          ? hasProgress
            ? `Your ${escapeHtml(hostname)} AI readiness progress`
            : `2 days left: publish your ${escapeHtml(hostname)} AI Fix Prompt`
          : 'Day-5 check-in on your 7-day free trial'
      }</h2>
      <p style="margin:0 0 12px 0;font-size:14px;line-height:1.58;color:#2E3440;">
        ${escapeHtml(statusParagraph)}
      </p>
      <div style="padding:14px 16px;background:#F7F5EF;border:1px solid #E5E2DA;border-radius:6px;margin-bottom:16px;font-size:13.5px;line-height:1.58;color:#0A0E17;">
        ${escapeHtml(nextWinParagraph)}
      </div>
      <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:11px 18px;background:#0A0E17;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13.5px;font-weight:600;margin-bottom:14px;">
        ${hasProgress ? 'Open Step 02 & Build vs. Competitor Page' : 'Open Step 02 & Copy My AI Fix Prompt'} &rarr;
      </a>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#686D78;">
        ${escapeHtml(renewalClarity)}
      </p>
    </div>
  </div>
</body>
</html>`;

  return {
    stage: input.stage,
    subject,
    text: quality.content,
    html,
    actionUrl,
    billingPortalUrl,
    quality,
  };
}

export async function dispatchTrialActivationNudgeEmail(
  input: DispatchTrialActivationNudgeInput
): Promise<DispatchTrialActivationNudgeResult> {
  const alert = buildTrialActivationNudgeAlert(input);
  const apiKey = input.resendApiKey?.trim() ?? '';

  if (!apiKey) {
    return {
      delivered: false,
      mode: 'preview_dry_run',
      providerMessageId: null,
      recipientEmail: input.recipientEmail,
      stage: input.stage,
      subject: alert.subject,
      text: alert.text,
      html: alert.html,
      actionUrl: alert.actionUrl,
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
    stage: input.stage,
    subject: alert.subject,
    text: alert.text,
    html: alert.html,
    actionUrl: alert.actionUrl,
    qualityScore: alert.quality.score,
    qualityBreakdown: alert.quality.breakdown,
  };
}
