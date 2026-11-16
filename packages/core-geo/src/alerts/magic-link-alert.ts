import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { QualityRubricBreakdown } from '../db/types.js';

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface BuildMagicLinkSignInAlertInput {
  recipientEmail: string;
  actionLink: string;
  appOrigin?: string;
}

export interface BuiltMagicLinkSignInAlert {
  subject: string;
  text: string;
  html: string;
  quality: EnforcedQualityArtifact;
}

export interface DispatchMagicLinkSignInInput
  extends BuildMagicLinkSignInAlertInput {
  resendApiKey?: string;
  fromEmail?: string;
}

export interface DispatchMagicLinkSignInResult {
  delivered: boolean;
  mode: 'live_resend' | 'preview_dry_run';
  providerMessageId: string | null;
  recipientEmail: string;
  subject: string;
  qualityScore: number;
  qualityBreakdown: QualityRubricBreakdown;
}

export function buildMagicLinkSignInAlert(
  input: BuildMagicLinkSignInAlertInput
): BuiltMagicLinkSignInAlert {
  const origin = (input.appOrigin ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const subject = 'Your 1-Click Verisource Console Sign-In Link';

  const rawTextLines = [
    `# Sign In to Your Verisource Console`,
    '',
    `Click once below to open your workspace. This single-use sign-in link was requested for ${input.recipientEmail} on ${origin}.`,
    '',
    `Sign In Now: ${input.actionLink}`,
    '',
    `Inside your Console workspace:`,
    `- Step 01: Multi-engine citation tracking across ChatGPT, Gemini, and Perplexity plus Brand Truth Watchdog.`,
    `- Step 02: 1-Click AI Fix Prompt (JSON-LD, /llms.txt, /agents.md) and Comparison Page Studio.`,
    `- Step 03: Categorized competitor source gaps, white-label client briefs, and Streamable HTTP /mcp keys.`,
    '',
    `If you did not request this sign-in link, ignore this message and your account remains untouched.`,
  ];

  const quality = enforceQualityGate95(rawTextLines.join('\n'), 'agents_md');
  const safeEmail = escapeHtml(input.recipientEmail);
  const safeLink = escapeHtml(input.actionLink);
  const safeOrigin = escapeHtml(origin);

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:28px 16px;background:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0A0E17;">
    <div style="max-width:540px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E2DA;border-radius:8px;overflow:hidden;">
      <div style="padding:18px 24px;border-bottom:1px solid #E5E2DA;background:#F4F2EC;">
        <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:0.06em;color:#525866;">
          VERISOURCE · 1-CLICK CONSOLE SIGN-IN
        </div>
      </div>
      <div style="padding:24px;">
        <h1 style="margin:0 0 10px 0;font-size:20px;line-height:1.25;color:#0A0E17;">
          Open your Verisource Console workspace
        </h1>
        <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#383E4C;">
          Click the button below to sign in as <strong>${safeEmail}</strong> on ${safeOrigin}. This single-use link expires automatically after use.
        </p>
        <div style="margin:0 0 22px 0;">
          <a href="${safeLink}" style="display:inline-block;padding:12px 20px;background:#0A0E17;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px;">
            Sign In to Console →
          </a>
        </div>
        <p style="margin:0 0 8px 0;font-size:12px;line-height:1.5;color:#666D7C;">
          Or paste this direct URL into your browser:
        </p>
        <div style="padding:10px 12px;background:#FAF9F6;border:1px solid #E5E2DA;border-radius:5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;word-break:break-all;color:#383E4C;">
          ${safeLink}
        </div>
        <p style="margin:18px 0 0 0;font-size:12px;line-height:1.5;color:#666D7C;">
          If you did not request this email, you can safely ignore it.
        </p>
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

export async function dispatchMagicLinkSignInEmail(
  input: DispatchMagicLinkSignInInput
): Promise<DispatchMagicLinkSignInResult> {
  const alert = buildMagicLinkSignInAlert(input);
  const apiKey = input.resendApiKey?.trim() ?? '';

  if (!apiKey) {
    return {
      delivered: false,
      mode: 'preview_dry_run',
      providerMessageId: null,
      recipientEmail: input.recipientEmail,
      subject: alert.subject,
      qualityScore: alert.quality.score,
      qualityBreakdown: alert.quality.breakdown,
    };
  }

  const fromAddress =
    input.fromEmail?.trim() || 'Verisource <alerts@verisource.dev>';

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
    qualityScore: alert.quality.score,
    qualityBreakdown: alert.quality.breakdown,
  };
}
