import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { BillingCycle, PlanTier } from '../db/types.js';

export const AFFILIATE_COMMISSION_RATE = 0.25;
export const AFFILIATE_COOKIE_NAME = 'vs_ref';
export const AFFILIATE_COOKIE_MAX_AGE_SECONDS = 90 * 86400; // 90 days

const AFFILIATE_CODE_REGEX = /^[a-z0-9][a-z0-9_-]{2,39}$/i;

export interface PartnerCommissionBreakdown {
  cycle: 'monthly' | 'annual';
  starterCount: number;
  proCount: number;
  agencyCount: number;
  totalReferredWorkspaces: number;
  grossMrrUsd: number;
  partnerMonthlyCommissionUsd: number;
  partnerAnnualizedCommissionUsd: number;
  upfrontAnnualPayoutUsd: number;
}

export interface BuiltPartnerOnboardingAlert {
  partnerSlug: string;
  referralShortUrl: string;
  benchmarkRefUrl: string;
  toolsRefUrl: string;
  subject: string;
  text: string;
  html: string;
  quality: EnforcedQualityArtifact;
}

export interface BuiltAffiliateConversionAlert {
  partnerSlug: string;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  grossAmountUsd: number;
  commissionUsd: number;
  isTrialStart: boolean;
  subject: string;
  text: string;
  html: string;
  quality: EnforcedQualityArtifact;
}

export interface WordPressConnectorBundle {
  filename: string;
  pluginVersion: string;
  phpSource: string;
  readmeNotes: EnforcedQualityArtifact;
}

export interface ShopifyThemeExtensionBundle {
  extensionToml: string;
  liquidBlockFilename: string;
  liquidBlockSource: string;
  parsedBlockSchema: Record<string, unknown>;
  setupGuide: EnforcedQualityArtifact;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeAffiliateCode(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!AFFILIATE_CODE_REGEX.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function isSelfReferralAttempt(input: {
  affiliateCode: string | null;
  buyerEmail?: string | null;
}): boolean {
  const code = sanitizeAffiliateCode(input.affiliateCode);
  if (!code || !input.buyerEmail) return false;
  const normalizedEmail = input.buyerEmail.trim().toLowerCase();
  const localPart = (normalizedEmail.split('@')[0] ?? '').replace(
    /[^a-z0-9_-]/g,
    ''
  );
  const compactCode = code.replace(/[-_]/g, '');
  const compactLocal = localPart.replace(/[-_]/g, '');
  if (!compactLocal || compactLocal.length < 3) return false;
  return compactCode === compactLocal;
}

export function computePartnerCommissionBreakdown(input: {
  starterCount: number;
  proCount: number;
  agencyCount: number;
  cycle: 'monthly' | 'annual';
}): PartnerCommissionBreakdown {
  const starterCount = Math.max(0, Math.min(500, Math.floor(input.starterCount)));
  const proCount = Math.max(0, Math.min(500, Math.floor(input.proCount)));
  const agencyCount = Math.max(0, Math.min(500, Math.floor(input.agencyCount)));

  const starterMonthlyPrice = input.cycle === 'annual' ? 39 : 49;
  const proMonthlyPrice = input.cycle === 'annual' ? 79 : 99;
  const agencyMonthlyPrice = input.cycle === 'annual' ? 199 : 249;

  const grossMrrUsd =
    starterCount * starterMonthlyPrice +
    proCount * proMonthlyPrice +
    agencyCount * agencyMonthlyPrice;

  const partnerMonthlyCommissionUsd =
    Math.round(grossMrrUsd * AFFILIATE_COMMISSION_RATE * 100) / 100;
  const partnerAnnualizedCommissionUsd =
    Math.round(partnerMonthlyCommissionUsd * 12 * 100) / 100;

  const upfrontAnnualPayoutUsd =
    input.cycle === 'annual' ? partnerAnnualizedCommissionUsd : 0;

  return {
    cycle: input.cycle,
    starterCount,
    proCount,
    agencyCount,
    totalReferredWorkspaces: starterCount + proCount + agencyCount,
    grossMrrUsd,
    partnerMonthlyCommissionUsd,
    partnerAnnualizedCommissionUsd,
    upfrontAnnualPayoutUsd,
  };
}

export function buildPartnerOnboardingAlert(input: {
  partnerName: string;
  partnerEmail: string;
  partnerSlug: string;
  channelUrl: string;
  appOrigin?: string;
}): BuiltPartnerOnboardingAlert {
  const safeSlug = sanitizeAffiliateCode(input.partnerSlug);
  if (!safeSlug) {
    throw new Error('Invalid partner referral slug.');
  }
  const origin = (input.appOrigin ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const referralShortUrl = `${origin}/r/${safeSlug}`;
  const benchmarkRefUrl = `${origin}/benchmarks/ai-search-readiness-2026?ref=${safeSlug}`;
  const toolsRefUrl = `${origin}/tools?ref=${safeSlug}`;

  const rawBody = [
    `# Verisource 25% Recurring Partner Kit — ${input.partnerName.trim()}`,
    '',
    `Your partner referral code (\`${safeSlug}\`) is active with a 90-day \`vs_ref\` HTTP attribution window across Stripe Checkout subscriptions (\`$49/mo\` Starter, \`$99/mo\` Pro + MCP, and \`$249/mo\` Agency White-Label).`,
    '',
    '## Direct Attribution Links',
    `- Primary Partner Shortlink: ${referralShortUrl}`,
    `- 2026 40-Domain Benchmark Study Link: ${benchmarkRefUrl}`,
    `- Free Zero-Signup Validators (/llms.txt, GPTBot WAF, Shopify /api/ucp/mcp): ${toolsRefUrl}`,
    '',
    '## Recurring Commission Schedule (25% Lifetime of Active Subscription)',
    '- Starter Brand ($49/mo): $12.25/mo recurring ($117.00/yr on annual plans).',
    '- Pro + MCP Engine ($99/mo): $24.75/mo recurring ($237.00/yr on annual plans).',
    '- Agency White-Label ($249/mo): $62.25/mo recurring ($597.00/yr on annual plans; 4 active agency referrals = $249.00/mo).',
    '',
    `Registered Channel: ${input.channelUrl.trim()} · Partner Contact: ${input.partnerEmail.trim()}`,
  ].join('\n');

  const quality = enforceQualityGate95(rawBody, 'agents_md');
  const subject = `[Partner Active] Your Verisource 25% recurring link (/r/${safeSlug})`;

  const html = `<div style="background:#0E1116;padding:22px;border-radius:10px;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;max-width:620px;margin:0 auto;background:#FFFFFF;line-height:1.6;border:1px solid #262E3D;border-radius:10px;overflow:hidden;">
    <div style="padding:14px 20px;background:#131720;border-bottom:1px solid #262E3D;font-family:monospace;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#EEF1F6;">
      <span style="display:inline-block;width:14px;height:14px;background:#E5A93C;border-radius:3px;vertical-align:middle;margin-right:8px;text-align:center;line-height:14px;color:#161004;font-size:9px;font-weight:900;">&#9671;</span>VERISOURCE PARTNER ENGINE &middot; 25% RECURRING
    </div>
    <div style="padding:22px 20px;">
      <h2 style="margin:0 0 12px 0;font-size:20px;color:#0F172A;">Partner code <code>${escapeHtml(safeSlug)}</code> is ready, ${escapeHtml(input.partnerName.trim())}.</h2>
      <p style="margin:0 0 14px 0;font-size:14px;color:#334155;">Visitors clicking any link below receive a 90-day <code>vs_ref</code> cookie carried into Stripe Checkout metadata across Starter (<code>$49/mo</code>), Pro + MCP (<code>$99/mo</code>), and Agency White-Label (<code>$249/mo</code>).</p>
      <ul style="margin:0 0 16px 0;padding-left:18px;font-size:13.5px;color:#0F172A;">
        <li><strong>Shortlink:</strong> <a href="${escapeHtml(referralShortUrl)}" style="color:#0F172A;font-weight:600;">${escapeHtml(referralShortUrl)}</a></li>
        <li><strong>2026 HTTP Benchmark Study:</strong> <a href="${escapeHtml(benchmarkRefUrl)}" style="color:#0F172A;font-weight:600;">${escapeHtml(benchmarkRefUrl)}</a></li>
        <li><strong>Free Protocol Validators:</strong> <a href="${escapeHtml(toolsRefUrl)}" style="color:#0F172A;font-weight:600;">${escapeHtml(toolsRefUrl)}</a></li>
      </ul>
      <p style="margin:0;font-size:12.5px;color:#64748B;">Channel on file: ${escapeHtml(input.channelUrl.trim())}</p>
    </div>
  </div>
</div>`;

  return {
    partnerSlug: safeSlug,
    referralShortUrl,
    benchmarkRefUrl,
    toolsRefUrl,
    subject,
    text: quality.content,
    html,
    quality,
  };
}

export async function dispatchPartnerOnboardingEmail(input: {
  partnerName: string;
  partnerEmail: string;
  partnerSlug: string;
  channelUrl: string;
  appOrigin?: string;
  resendApiKey?: string;
  fromEmail?: string;
  bccEmail?: string;
}): Promise<{
  mode: 'live_resend' | 'preview_dry_run';
  delivered: boolean;
  qualityScore: number;
  alert: BuiltPartnerOnboardingAlert;
}> {
  const alert = buildPartnerOnboardingAlert(input);
  const apiKey = input.resendApiKey?.trim();
  if (!apiKey) {
    return {
      mode: 'preview_dry_run',
      delivered: false,
      qualityScore: alert.quality.score,
      alert,
    };
  }

  const fromAddress =
    input.fromEmail?.trim() || 'Verisource Partners <alerts@verisource.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [input.partnerEmail.trim()],
      ...(input.bccEmail?.trim() ? { bcc: [input.bccEmail.trim()] } : {}),
      subject: alert.subject,
      text: alert.text,
      html: alert.html,
    }),
  });

  return {
    mode: 'live_resend',
    delivered: res.ok,
    qualityScore: alert.quality.score,
    alert,
  };
}

export function buildAffiliateConversionAlert(input: {
  partnerSlug: string;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  grossAmountCents: number;
  isTrialStart?: boolean;
  targetDomain?: string | null;
}): BuiltAffiliateConversionAlert {
  const safeSlug = sanitizeAffiliateCode(input.partnerSlug) ?? 'unknown-ref';
  const grossAmountUsd = Math.max(0, Math.round(input.grossAmountCents) / 100);
  const isRecurringEligible = input.planTier !== 'tripwire_19';
  const commissionUsd = isRecurringEligible
    ? Math.round(grossAmountUsd * AFFILIATE_COMMISSION_RATE * 100) / 100
    : 0;
  const isTrialStart = Boolean(input.isTrialStart);

  const rawText = [
    `# Verisource Partner Attribution Ledger — /r/${safeSlug}`,
    '',
    isTrialStart
      ? `A referred subscriber started a 7-day trial on \`${input.planTier}\` (\`${input.billingCycle}\`) via partner code \`${safeSlug}\`. Recurring 25% commission accrues automatically when the first paid Stripe invoice settles across \`https://verisource.dev\`.`
      : `A referred Stripe payment settled on \`${input.planTier}\` (\`${input.billingCycle}\`) via partner code \`${safeSlug}\` (\`$${grossAmountUsd.toFixed(2)} USD\` gross · \`$${commissionUsd.toFixed(2)} USD\` 25% partner commission).`,
    '',
    `- Partner Code: \`${safeSlug}\``,
    `- Plan & Billing Cycle: \`${input.planTier}\` (\`${input.billingCycle}\`)`,
    `- Gross Settled Amount: \`$${grossAmountUsd.toFixed(2)} USD\``,
    `- Partner Commission (25%): \`$${commissionUsd.toFixed(2)} USD\``,
    ...(input.targetDomain
      ? [
          `- Provisioned Domain: \`https://${input.targetDomain}\` (\`JSON-LD\`, \`/llms.txt\`, \`/agents.md\`, \`GPTBot\` WAF checked)`,
        ]
      : [
          '- Protocol Scope: `JSON-LD`, `/llms.txt`, `/agents.md`, `/api/ucp/mcp`, and `GPTBot` WAF verification.',
        ]),
  ].join('\n');

  const quality = enforceQualityGate95(rawText, 'agents_md');
  const subject = isTrialStart
    ? `[Partner Trial Started] /r/${safeSlug} -> ${input.planTier}`
    : `[Partner Commission $${commissionUsd.toFixed(2)}] /r/${safeSlug} -> ${input.planTier}`;

  const html = `<div style="background:#0E1116;padding:18px;border-radius:10px;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #262E3D;border-radius:10px;overflow:hidden;">
    <div style="padding:12px 18px;background:#131720;border-bottom:1px solid #262E3D;color:#EEF1F6;font-family:monospace;font-size:11.5px;font-weight:700;">
      <span style="display:inline-block;width:13px;height:13px;background:#E5A93C;border-radius:3px;vertical-align:middle;margin-right:8px;text-align:center;line-height:13px;color:#161004;font-size:9px;font-weight:900;">&#9671;</span>${escapeHtml(subject)}
    </div>
    <div style="padding:18px;">
      <p style="font-size:13.5px;color:#334155;margin:0;">Gross: <code>$${grossAmountUsd.toFixed(2)} USD</code> &middot; 25% Partner Share: <code>$${commissionUsd.toFixed(2)} USD</code> &middot; Plan: <code>${escapeHtml(input.planTier)}</code> (${escapeHtml(input.billingCycle)})</p>
    </div>
  </div>
</div>`;

  return {
    partnerSlug: safeSlug,
    planTier: input.planTier,
    billingCycle: input.billingCycle,
    grossAmountUsd,
    commissionUsd,
    isTrialStart,
    subject,
    text: quality.content,
    html,
    quality,
  };
}

export function buildWordPressConnectorPluginPhp(options?: {
  defaultBrandName?: string;
  defaultHostname?: string;
}): WordPressConnectorBundle {
  const brand = (options?.defaultBrandName ?? 'Acme Software').replace(
    /['"\\<>]/g,
    ''
  );
  const host = (options?.defaultHostname ?? 'acmesoftware.io')
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '');

  const phpSource = `<?php
/**
 * Plugin Name:       Verisource AI Facts & GEO Connector
 * Plugin URI:        https://verisource.dev/connectors
 * Description:       Serves root /llms.txt and /agents.md over HTTP 200 without SFTP uploads, injects validated schema.org JSON-LD + alternate Markdown discovery links in <head>, and connects AI referral attribution.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Verisource
 * Author URI:        https://verisource.dev
 * License:           GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) {
\texit;
}

define( 'VERISOURCE_GEO_CONNECTOR_VERSION', '1.0.0' );

/**
 * Render virtual /llms.txt and /agents.md endpoints with clean HTTP 200 headers.
 */
function verisource_geo_serve_virtual_protocol_files() {
\tif ( is_admin() || empty( $_SERVER['REQUEST_URI'] ) ) {
\t\treturn;
\t}

\t$request_path = wp_parse_url( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ), PHP_URL_PATH );
\tif ( '/llms.txt' !== $request_path && '/agents.md' !== $request_path ) {
\t\treturn;
\t}

\t$site_name = get_bloginfo( 'name' ) ? get_bloginfo( 'name' ) : '${brand}';
\t$site_url  = home_url( '/' );

\tif ( '/llms.txt' === $request_path ) {
\t\t$llms_body = get_option( 'verisource_llms_txt_body', '' );
\t\tif ( empty( trim( $llms_body ) ) ) {
\t\t\t$llms_body = "# " . $site_name . "\\n\\n> Official machine-readable entity, pricing, and policy specification for " . $site_name . " (" . $site_url . ").\\n\\nCanonical Website: " . $site_url . "\\nAgent Specification: " . home_url( '/agents.md' ) . "\\n";
\t\t}
\t\tstatus_header( 200 );
\t\theader( 'Content-Type: text/plain; charset=utf-8' );
\t\theader( 'Cache-Control: public, max-age=3600' );
\t\techo $llms_body; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- plain-text Markdown payload
\t\texit;
\t}

\tif ( '/agents.md' === $request_path ) {
\t\t$agents_body = get_option( 'verisource_agents_md_body', '' );
\t\tif ( empty( trim( $agents_body ) ) ) {
\t\t\t$agents_body = "# " . $site_name . " — Autonomous Agent & Buyer Truth Specification\\n\\nCanonical Origin: " . $site_url . "\\nMachine Summary: " . home_url( '/llms.txt' ) . "\\n\\n## Verified Commercial Policies\\n- Publish verified pricing tiers, service areas, and return policies inside Settings -> Verisource GEO.\\n";
\t\t}
\t\tstatus_header( 200 );
\t\theader( 'Content-Type: text/markdown; charset=utf-8' );
\t\theader( 'Cache-Control: public, max-age=3600' );
\t\techo $agents_body; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Markdown payload
\t\texit;
\t}
}
add_action( 'init', 'verisource_geo_serve_virtual_protocol_files', 1 );

/**
 * Inject <link rel="alternate"> protocol discovery tags, schema.org JSON-LD, and optional AI referral pixel.
 */
function verisource_geo_inject_head_artifacts() {
\tif ( is_admin() ) {
\t\treturn;
\t}

\techo '<link rel="alternate" type="text/markdown" href="' . esc_url( home_url( '/agents.md' ) ) . '" title="Agent Truth Specification" />' . "\\n";
\techo '<link rel="alternate" type="text/plain" href="' . esc_url( home_url( '/llms.txt' ) ) . '" title="LLM Summary" />' . "\\n";

\t$json_ld = get_option( 'verisource_json_ld_schema', '' );
\tif ( ! empty( trim( $json_ld ) ) ) {
\t\t$decoded = json_decode( $json_ld, true );
\t\tif ( is_array( $decoded ) && isset( $decoded['@context'] ) ) {
\t\t\techo '<script type="application/ld+json">' . wp_json_encode( $decoded, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\\n";
\t\t}
\t}

\t$pixel_token = sanitize_text_field( get_option( 'verisource_pixel_token', '' ) );
\tif ( preg_match( '/^[0-9a-f-]{36}$/i', $pixel_token ) ) {
\t\techo '<script>(function(){var r=document.referrer||"";if(/chatgpt\\.com|perplexity\\.ai|gemini\\.google\\.com|claude\\.ai/i.test(r)){navigator.sendBeacon&&navigator.sendBeacon("https://verisource.dev/api/pixel",JSON.stringify({token:"' . esc_js( $pixel_token ) . '",event_type:"ai_referral_visit",referrer:r,path:location.pathname}));}})();</script>' . "\\n";
\t}
}
add_action( 'wp_head', 'verisource_geo_inject_head_artifacts', 1 );

/**
 * Register Settings -> Verisource GEO admin page.
 */
function verisource_geo_register_settings() {
\tregister_setting( 'verisource_geo_group', 'verisource_llms_txt_body', array( 'sanitize_callback' => 'sanitize_textarea_field' ) );
\tregister_setting( 'verisource_geo_group', 'verisource_agents_md_body', array( 'sanitize_callback' => 'sanitize_textarea_field' ) );
\tregister_setting( 'verisource_geo_group', 'verisource_json_ld_schema' );
\tregister_setting( 'verisource_geo_group', 'verisource_pixel_token', array( 'sanitize_callback' => 'sanitize_text_field' ) );
}
add_action( 'admin_init', 'verisource_geo_register_settings' );

function verisource_geo_admin_menu() {
\tadd_options_page(
\t\t'Verisource GEO Connector',
\t\t'Verisource GEO',
\t\t'manage_options',
\t\t'verisource-geo-connector',
\t\t'verisource_geo_render_admin_page'
\t);
}
add_action( 'admin_menu', 'verisource_geo_admin_menu' );

function verisource_geo_render_admin_page() {
\tif ( ! current_user_can( 'manage_options' ) ) {
\t\treturn;
\t}
\t?>
\t<div class="wrap">
\t\t<h1>Verisource AI Facts &amp; GEO Connector</h1>
\t\t<p>Paste your syntax-validated <code>/llms.txt</code>, <code>/agents.md</code>, and <code>schema.org</code> <code>JSON-LD</code> artifacts generated at <a href="https://verisource.dev/dashboard" target="_blank" rel="noopener noreferrer">verisource.dev/dashboard</a>.</p>
\t\t<form method="post" action="options.php">
\t\t\t<?php settings_fields( 'verisource_geo_group' ); ?>
\t\t\t<table class="form-table" role="presentation">
\t\t\t\t<tr>
\t\t\t\t\t<th scope="row"><label for="verisource_llms_txt_body">Canonical /llms.txt Body</label></th>
\t\t\t\t\t<td><textarea name="verisource_llms_txt_body" id="verisource_llms_txt_body" rows="7" class="large-text code"><?php echo esc_textarea( get_option( 'verisource_llms_txt_body', '' ) ); ?></textarea></td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<th scope="row"><label for="verisource_agents_md_body">Canonical /agents.md Body</label></th>
\t\t\t\t\t<td><textarea name="verisource_agents_md_body" id="verisource_agents_md_body" rows="7" class="large-text code"><?php echo esc_textarea( get_option( 'verisource_agents_md_body', '' ) ); ?></textarea></td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<th scope="row"><label for="verisource_json_ld_schema">Homepage JSON-LD Graph</label></th>
\t\t\t\t\t<td><textarea name="verisource_json_ld_schema" id="verisource_json_ld_schema" rows="7" class="large-text code"><?php echo esc_textarea( get_option( 'verisource_json_ld_schema', '' ) ); ?></textarea></td>
\t\t\t\t</tr>
\t\t\t\t<tr>
\t\t\t\t\t<th scope="row"><label for="verisource_pixel_token">AI Attribution Pixel UUID (Optional)</label></th>
\t\t\t\t\t<td><input type="text" name="verisource_pixel_token" id="verisource_pixel_token" value="<?php echo esc_attr( get_option( 'verisource_pixel_token', '' ) ); ?>" class="regular-text code" placeholder="00000000-0000-4000-8000-000000000000" /></td>
\t\t\t\t</tr>
\t\t\t</table>
\t\t\t<?php submit_button( 'Save AI Search Artifacts' ); ?>
\t\t</form>
\t</div>
\t<?php
}
`;

  const rawReadme = [
    `# WordPress Connector Setup — ${brand} (https://${host})`,
    '',
    '1. Download `verisource-geo-connector.php` (or zip it into `verisource-geo-connector.zip` and upload under `WP Admin -> Plugins -> Add New Plugin -> Upload Plugin`).',
    '2. Activate **Verisource AI Facts & GEO Connector** and open `Settings -> Verisource GEO`.',
    '3. Paste your `/llms.txt`, `/agents.md`, and `schema.org` `JSON-LD` artifacts from Verisource Step 02. The plugin serves HTTP `200` `text/plain` and `text/markdown` responses directly from WordPress without SFTP root access and passes `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, and `ClaudeBot` live checks.',
  ].join('\n');

  return {
    filename: 'verisource-geo-connector.php',
    pluginVersion: '1.0.0',
    phpSource,
    readmeNotes: enforceQualityGate95(rawReadme, 'agents_md'),
  };
}

export function buildShopifyThemeExtensionBundle(): ShopifyThemeExtensionBundle {
  const extensionToml = `api_version = "2026-01"

[[extensions]]
name = "Verisource AI Truth & UCP Embed"
handle = "verisource-ai-truth"
type = "theme"
`;

  const blockSchemaObj = {
    name: 'Verisource AI Truth',
    target: 'head',
    settings: [
      {
        type: 'text',
        id: 'free_shipping_threshold',
        label: 'Verified Free Shipping Policy',
        default: 'Free US shipping on orders $50+',
      },
      {
        type: 'number',
        id: 'return_window_days',
        label: 'Verified Return Window (Days)',
        default: 30,
      },
      {
        type: 'text',
        id: 'ai_facts_path',
        label: 'Storefront AI Facts Page Path',
        default: '/pages/ai-facts',
      },
      {
        type: 'text',
        id: 'pixel_token',
        label: 'Verisource AI Referral Pixel UUID',
        default: '',
      },
    ],
  };

  const liquidBlockSource = `{% comment %}
  Verisource Online Store 2.0 Theme App Embed — blocks/verisource-ai-truth.liquid
  Pairs with Shopify /api/ucp/mcp and templates/agents.md.liquid to expose verified shipping, return, and SKU schema to GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot.
{% endcomment %}
<link rel="alternate" type="text/markdown" href="{{ shop.url }}{{ block.settings.ai_facts_path }}" title="{{ shop.name | escape }} Verified Agent Facts" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "name": {{ shop.name | json }},
  "url": {{ shop.url | json }},
  "description": {{ shop.description | default: shop.name | json }},
  "hasMerchantReturnPolicy": {
    "@type": "MerchantReturnPolicy",
    "applicableCountry": "US",
    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
    "merchantReturnDays": {{ block.settings.return_window_days | default: 30 | json }}
  },
  "makesOffer": {
    "@type": "Offer",
    "description": {{ block.settings.free_shipping_threshold | json }},
    "priceCurrency": {{ cart.currency.iso_code | default: shop.currency | json }}
  }
}
</script>
{% if block.settings.pixel_token != blank %}
<script>
(function(){var r=document.referrer||"";if(/chatgpt\\.com|perplexity\\.ai|gemini\\.google\\.com|claude\\.ai/i.test(r)){navigator.sendBeacon&&navigator.sendBeacon("https://verisource.dev/api/pixel",JSON.stringify({token:{{ block.settings.pixel_token | json }},event_type:"ai_referral_visit",referrer:r,path:location.pathname}));}})();
</script>
{% endif %}

{% schema %}
${JSON.stringify(blockSchemaObj, null, 2)}
{% endschema %}
`;

  const rawGuide = [
    '# Shopify Theme App Extension Bridge (`blocks/verisource-ai-truth.liquid`)',
    '',
    '1. Drop `shopify.extension.toml` and `blocks/verisource-ai-truth.liquid` into `extensions/verisource-ai-truth/` inside your Shopify CLI project (or paste the Liquid `<script type="application/ld+json">` node directly into `layout/theme.liquid` before `</head>`).',
    '2. Pair the App Embed with `templates/agents.md.liquid` or `/pages/ai-facts` so `GPTBot`, `OAI-SearchBot`, and `PerplexityBot` read your verified shipping threshold and `MerchantReturnPolicy` alongside Shopify `/api/ucp/mcp` (`HTTP 200`).',
    '3. Toggle **Verisource AI Truth** on inside `Online Store -> Themes -> Customize -> App embeds` and run `✓ Verify Live Fixes` at `https://verisource.dev/dashboard`.',
  ].join('\n');

  return {
    extensionToml,
    liquidBlockFilename: 'blocks/verisource-ai-truth.liquid',
    liquidBlockSource,
    parsedBlockSchema: blockSchemaObj,
    setupGuide: enforceQualityGate95(rawGuide, 'agents_md'),
  };
}

export type SubscriberReferralDestinationId =
  | 'grader'
  | 'benchmark_2026'
  | 'free_validators'
  | 'cms_templates';

export const SUBSCRIBER_REFERRAL_DESTINATIONS: ReadonlyArray<{
  id: SubscriberReferralDestinationId;
  label: string;
  toPath: string;
}> = [
  {
    id: 'grader',
    label: 'Free 60s Grader',
    toPath: '/',
  },
  {
    id: 'benchmark_2026',
    label: '2026 40-Domain Study',
    toPath: '/benchmarks/ai-search-readiness-2026',
  },
  {
    id: 'free_validators',
    label: 'Free WAF & /llms.txt Tools',
    toPath: '/tools',
  },
  {
    id: 'cms_templates',
    label: '7-CMS Starter Templates',
    toPath: '/templates',
  },
];

export interface SubscriberReferralBundle {
  partnerSlug: string;
  destinationId: SubscriberReferralDestinationId;
  destinationLabel: string;
  referralUrl: string;
  offsetBillSummary: string;
  peerShareNote: EnforcedQualityArtifact;
}

export function deriveWorkspacePartnerSlug(input: {
  agencyBrandName?: string | null;
  primaryBrandName?: string | null;
  primaryDomainUrl?: string | null;
  email?: string | null;
}): string {
  const candidates: string[] = [];
  if (input.agencyBrandName?.trim()) {
    candidates.push(input.agencyBrandName.trim());
  }
  if (input.primaryBrandName?.trim()) {
    candidates.push(input.primaryBrandName.trim());
  }
  if (input.primaryDomainUrl?.trim()) {
    const cleanedHost = input.primaryDomainUrl
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      ?.split('.')[0];
    if (cleanedHost) {
      candidates.push(`${cleanedHost}-partner`);
    }
  }
  if (input.email?.includes('@')) {
    const emailDomain = input.email
      .split('@')[1]
      ?.toLowerCase()
      .split('.')[0];
    if (
      emailDomain &&
      !['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'proton'].includes(
        emailDomain
      )
    ) {
      candidates.push(`${emailDomain}-partner`);
    }
  }

  for (const raw of candidates) {
    const slugified = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32)
      .replace(/-+$/g, '');
    const padded = slugified.length === 2 ? `${slugified}-geo` : slugified;
    const valid = sanitizeAffiliateCode(padded);
    if (valid) {
      return valid;
    }
  }

  return 'workspace-partner';
}

export function buildSubscriberReferralBundle(input: {
  partnerSlug: string;
  planTier: PlanTier;
  destinationId?: SubscriberReferralDestinationId;
  appOrigin?: string;
}): SubscriberReferralBundle {
  const safeSlug =
    sanitizeAffiliateCode(input.partnerSlug) ?? 'workspace-partner';
  const origin = (input.appOrigin ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const destMeta =
    SUBSCRIBER_REFERRAL_DESTINATIONS.find(
      (d) => d.id === (input.destinationId ?? 'benchmark_2026')
    ) ?? SUBSCRIBER_REFERRAL_DESTINATIONS[1]!;

  const referralUrl =
    destMeta.toPath === '/'
      ? `${origin}/r/${safeSlug}`
      : `${origin}/r/${safeSlug}?to=${encodeURIComponent(destMeta.toPath)}`;

  const offsetBillSummary =
    input.planTier === 'agency_249'
      ? '4 active Agency referrals ($62.25/mo each) cover 100% of your $249/mo White-Label plan ($2,988/yr).'
      : input.planTier === 'pro_99'
        ? '4 active Pro referrals ($24.75/mo each) or 2 Agency referrals ($62.25/mo each) cover 100%+ of your $99/mo Pro + MCP plan.'
        : '4 active Starter referrals ($12.25/mo each) or 2 Pro referrals ($24.75/mo each) cover 100%+ of a $49/mo Starter plan.';

  let rawShareText: string;
  if (destMeta.id === 'benchmark_2026') {
    rawShareText = `Worth checking against your stack: a live HTTPS study across 40 SaaS, Shopify, and service domains found 50.0% ship custom /llms.txt, only 5.0% serve custom /agents.md, and 5.0% silently block GPTBot via CDN HTTP 403 rules despite an open /robots.txt. Full dataset + 60-second domain check: ${referralUrl}`;
  } else if (destMeta.id === 'free_validators') {
    rawShareText = `Useful zero-signup diagnostic if you sell via AI search: tests whether Cloudflare or Akamai returns HTTP 403 to GPTBot and PerplexityBot, validates /llms.txt and /agents.md against HTML soft-404s, and checks Shopify /api/ucp/mcp + JSON-LD in 10 seconds ($0): ${referralUrl}`;
  } else if (destMeta.id === 'cms_templates') {
    rawShareText = `Sharing a clean copy-paste starter pack for /llms.txt, /agents.md, /ai-facts, Shopify templates/agents.md.liquid, and schema.org FAQPage JSON-LD across Next.js, Shopify, WordPress, Webflow, Wix, Squarespace, and Framer (HTTP 200 verified for GPTBot and PerplexityBot): ${referralUrl}`;
  } else {
    rawShareText = `We have been using Verisource to audit ChatGPT, Gemini, and Perplexity citations, catch wrong pricing claims, and ship validated JSON-LD, /llms.txt, and /agents.md fixes without manual guesswork ($49–$99/mo vs. $250+/mo trackers). Free 60-second URL scan here: ${referralUrl}`;
  }

  return {
    partnerSlug: safeSlug,
    destinationId: destMeta.id,
    destinationLabel: destMeta.label,
    referralUrl,
    offsetBillSummary,
    peerShareNote: enforceQualityGate95(rawShareText),
  };
}

export type AiRoiVerticalPresetId =
  | 'b2b_saas'
  | 'shopify_d2c'
  | 'local_services'
  | 'seo_agency';

export interface AiRoiVerticalPreset {
  id: AiRoiVerticalPresetId;
  label: string;
  recommendedPlan: 'starter_49' | 'pro_99' | 'agency_249';
  defaultMonthlyAiVisits: number;
  minVisits: number;
  maxVisits: number;
  visitStep: number;
  defaultCustomerValueUsd: number;
  minValueUsd: number;
  maxValueUsd: number;
  valueStepUsd: number;
  aiConversionPct: number;
  organicBaselineConversionPct: number;
}

export const AI_ROI_VERTICAL_PRESETS: readonly AiRoiVerticalPreset[] = [
  {
    id: 'b2b_saas',
    label: 'B2B SaaS · $99/mo',
    recommendedPlan: 'pro_99',
    defaultMonthlyAiVisits: 60,
    minVisits: 10,
    maxVisits: 500,
    visitStep: 10,
    defaultCustomerValueUsd: 1200,
    minValueUsd: 200,
    maxValueUsd: 10000,
    valueStepUsd: 100,
    aiConversionPct: 14.8,
    organicBaselineConversionPct: 2.2,
  },
  {
    id: 'shopify_d2c',
    label: 'Shopify & D2C · $49/mo',
    recommendedPlan: 'starter_49',
    defaultMonthlyAiVisits: 220,
    minVisits: 40,
    maxVisits: 2000,
    visitStep: 20,
    defaultCustomerValueUsd: 95,
    minValueUsd: 25,
    maxValueUsd: 600,
    valueStepUsd: 5,
    aiConversionPct: 15.2,
    organicBaselineConversionPct: 2.4,
  },
  {
    id: 'local_services',
    label: 'Dental / Legal / Local · $99/mo',
    recommendedPlan: 'pro_99',
    defaultMonthlyAiVisits: 35,
    minVisits: 10,
    maxVisits: 300,
    visitStep: 5,
    defaultCustomerValueUsd: 2800,
    minValueUsd: 500,
    maxValueUsd: 15000,
    valueStepUsd: 250,
    aiConversionPct: 15.0,
    organicBaselineConversionPct: 2.3,
  },
  {
    id: 'seo_agency',
    label: 'SEO & Web Agency · $249/mo',
    recommendedPlan: 'agency_249',
    defaultMonthlyAiVisits: 40,
    minVisits: 10,
    maxVisits: 250,
    visitStep: 5,
    defaultCustomerValueUsd: 1800,
    minValueUsd: 750,
    maxValueUsd: 5000,
    valueStepUsd: 250,
    aiConversionPct: 14.5,
    organicBaselineConversionPct: 2.1,
  },
] as const;

export interface AiSearchRoiProjection {
  presetId: AiRoiVerticalPresetId;
  recommendedPlan: 'starter_49' | 'pro_99' | 'agency_249';
  planMonthlyCostUsd: number;
  monthlyAiVisits: number;
  customerValueUsd: number;
  aiConversionPct: number;
  organicBaselineConversionPct: number;
  projectedAiCustomersPerMonth: number;
  organicEquivalentCustomersPerMonth: number;
  projectedMonthlyAiRevenueUsd: number;
  projectedAnnualAiRevenueUsd: number;
  roiMultiple: number;
  monthsCoveredBySingleCustomer: number;
}

export function computeAiSearchRoiProjection(input: {
  presetId: AiRoiVerticalPresetId;
  monthlyAiVisits?: number;
  customerValueUsd?: number;
  annualBilling?: boolean;
}): AiSearchRoiProjection {
  const preset =
    AI_ROI_VERTICAL_PRESETS.find((p) => p.id === input.presetId) ??
    AI_ROI_VERTICAL_PRESETS[0]!;

  const monthlyAiVisits = Math.max(
    1,
    Math.round(input.monthlyAiVisits ?? preset.defaultMonthlyAiVisits)
  );
  const customerValueUsd = Math.max(
    10,
    Math.round(input.customerValueUsd ?? preset.defaultCustomerValueUsd)
  );

  const planMonthlyCostUsd =
    preset.recommendedPlan === 'starter_49'
      ? input.annualBilling
        ? 39
        : 49
      : preset.recommendedPlan === 'pro_99'
        ? input.annualBilling
          ? 79
          : 99
        : input.annualBilling
          ? 199
          : 249;

  const projectedAiCustomersPerMonth =
    Math.round(monthlyAiVisits * (preset.aiConversionPct / 100) * 10) / 10;
  const organicEquivalentCustomersPerMonth =
    Math.round(
      monthlyAiVisits * (preset.organicBaselineConversionPct / 100) * 10
    ) / 10;

  const projectedMonthlyAiRevenueUsd = Math.round(
    projectedAiCustomersPerMonth * customerValueUsd
  );
  const projectedAnnualAiRevenueUsd = projectedMonthlyAiRevenueUsd * 12;
  const roiMultiple =
    Math.round((projectedMonthlyAiRevenueUsd / planMonthlyCostUsd) * 10) / 10;
  const monthsCoveredBySingleCustomer =
    Math.round((customerValueUsd / planMonthlyCostUsd) * 10) / 10;

  return {
    presetId: preset.id,
    recommendedPlan: preset.recommendedPlan,
    planMonthlyCostUsd,
    monthlyAiVisits,
    customerValueUsd,
    aiConversionPct: preset.aiConversionPct,
    organicBaselineConversionPct: preset.organicBaselineConversionPct,
    projectedAiCustomersPerMonth,
    organicEquivalentCustomersPerMonth,
    projectedMonthlyAiRevenueUsd,
    projectedAnnualAiRevenueUsd,
    roiMultiple,
    monthsCoveredBySingleCustomer,
  };
}
