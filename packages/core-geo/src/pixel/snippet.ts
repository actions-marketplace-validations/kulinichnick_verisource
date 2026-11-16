// Zero-Code AI Referral & Shopify Customer Events Attribution Generators + Live Tracker Verifier
import { sha256Hex } from '../auth/api-key.js';
import { resolveCoreGeoEnv, type RawEnvInput } from '../config/env.js';
import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { AiAttributionEventRow, DomainRow } from '../db/types.js';
import { normalizePublicDomain } from '../scanner/bot-waf-prober.js';
import {
  detectWebsitePlatform,
  getWebsitePlatformMeta,
  type WebsitePlatformId,
} from '../scanner/cms-detector.js';

export const SUPPORTED_AI_REFERRAL_ENGINES = [
  'chatgpt.com',
  'perplexity.ai',
  'gemini.google.com',
  'claude.ai',
] as const;

export const SUPPORTED_AI_CRAWLER_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'PerplexityBot',
  'ClaudeBot',
  'Google-Extended',
] as const;

export function normalizeAiBotCrawlerSource(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (lower.includes('oai-searchbot')) return 'OAI-SearchBot';
  if (lower.includes('gptbot')) return 'GPTBot';
  if (lower.includes('perplexitybot') || lower.includes('perplexity-user'))
    return 'PerplexityBot';
  if (lower.includes('claudebot') || lower.includes('claude-web') || lower.includes('anthropic-ai'))
    return 'ClaudeBot';
  if (lower.includes('google-extended')) return 'Google-Extended';
  return null;
}

export function normalizeAiReferralSource(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (lower.includes('chatgpt') || lower.includes('openai'))
    return 'chatgpt.com';
  if (lower.includes('perplexity')) return 'perplexity.ai';
  if (lower.includes('gemini.google') || lower === 'gemini')
    return 'gemini.google.com';
  if (lower.includes('claude.ai') || lower === 'claude') return 'claude.ai';
  return null;
}

export async function computeShopifyCheckoutKey(params: {
  domainId: string;
  trackingPixelToken: string;
}): Promise<string> {
  const digest = await sha256Hex(
    `vs_shopify_px_v1:${params.domainId}:${params.trackingPixelToken}`
  );
  return digest.slice(0, 24);
}

export function buildAiAttributionSnippet(params: {
  trackingPixelToken: string;
  ingestionUrl: string;
}): string {
  return `<script>
(function(t,u){
  var q=new URLSearchParams(location.search).get('utm_source')||'',r=document.referrer||'';
  var m=(q+' '+r).match(/chatgpt\\.com|perplexity\\.ai|gemini\\.google\\.com|claude\\.ai|chatgpt|perplexity|gemini|claude/i);
  if(m)sessionStorage.setItem('vs_ai_src',m[0].toLowerCase());
  var s=sessionStorage.getItem('vs_ai_src');if(!s)return;
  var post=function(e,v){fetch(u,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t,event_type:e,source_engine:s,landing_path:location.pathname,conversion_value_usd:v||null})}).catch(function(){});};
  if(!sessionStorage.getItem('vs_ai_vis')){sessionStorage.setItem('vs_ai_vis','1');post('ai_referral_visit',null);}
  window.verisourceConversion=function(usd){post('ai_referral_conversion',Number(usd)||0);};
})('${params.trackingPixelToken}','${params.ingestionUrl}');
</script>`;
}

export function buildShopifyCustomerEventsPixel(params: {
  trackingPixelToken: string;
  checkoutKey: string;
  ingestionUrl: string;
}): string {
  return `// Shopify Admin -> Settings -> Customer events -> Add custom pixel ("Verisource AI Attribution")
const VS_TOKEN = '${params.trackingPixelToken}';
const VS_CHECKOUT_KEY = '${params.checkoutKey}';
const VS_ENDPOINT = '${params.ingestionUrl}';
const AI_PATTERN = /chatgpt\\.com|perplexity\\.ai|gemini\\.google\\.com|claude\\.ai|chatgpt|perplexity|gemini|claude/i;

analytics.subscribe('page_viewed', async (event) => {
  const loc = event.context?.document?.location;
  const ref = event.context?.document?.referrer || '';
  const utm = loc?.search ? (new URLSearchParams(loc.search).get('utm_source') || '') : '';
  const match = (utm + ' ' + ref).match(AI_PATTERN);
  if (match) {
    await browser.localStorage.setItem('vs_ai_src', match[0].toLowerCase());
  }
});

analytics.subscribe('checkout_completed', async (event) => {
  const src = await browser.localStorage.getItem('vs_ai_src');
  if (!src) return;
  const amount = Number(event.data?.checkout?.totalPrice?.amount || 0);
  const path = event.context?.document?.location?.pathname || '/checkouts/thank-you';
  fetch(VS_ENDPOINT, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: VS_TOKEN,
      checkout_key: VS_CHECKOUT_KEY,
      event_type: 'ai_referral_conversion',
      source_engine: src,
      landing_path: path,
      conversion_value_usd: amount > 0 ? amount : null,
    }),
  }).catch(() => {});
});`;
}

export function buildEdgeBotCrawlerSnippet(params: {
  trackingPixelToken: string;
  checkoutKey: string;
  ingestionUrl: string;
}): string {
  return `// Next.js middleware.ts or Cloudflare Worker — Logs real incoming AI bot crawls (invisible to GA4)
const VS_BOT_REGEX = /(OAI-SearchBot|GPTBot|PerplexityBot|ClaudeBot|Google-Extended)/i;

export function logVerisourceAiCrawler(request: Request, waitUntil?: (p: Promise<unknown>) => void): void {
  const ua = request.headers.get('user-agent') || '';
  const match = ua.match(VS_BOT_REGEX);
  if (!match) return;
  const url = new URL(request.url);
  const ping = fetch('${params.ingestionUrl}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: '${params.trackingPixelToken}',
      checkout_key: '${params.checkoutKey}',
      event_type: 'ai_bot_crawl',
      source_engine: match[1],
      landing_path: url.pathname || '/',
    }),
  }).catch(() => {});
  if (waitUntil) waitUntil(ping);
}`;
}

export type TrackerOverallVerificationStatus =
  | 'verified_live'
  | 'telemetry_active_sandbox'
  | 'token_mismatch'
  | 'not_installed_yet'
  | 'unreachable';

export interface LiveTrackerVerificationReport {
  hostname: string;
  httpStatus: number | null;
  detectedPlatform: WebsitePlatformId;
  detectedPlatformLabel: string;
  checkedAt: string;
  browserPixelLive: boolean;
  foreignTokenMismatch: boolean;
  referralEventsCount: number;
  conversionEventsCount: number;
  botCrawlEventsCount: number;
  overallStatus: TrackerOverallVerificationStatus;
  statusHeadline: string;
  cmsTroubleshootingHint: string;
  followUpInstallPrompt: EnforcedQualityArtifact;
}

function buildPlatformTrackerHint(
  platform: WebsitePlatformId,
  overallStatus: TrackerOverallVerificationStatus
): string {
  if (overallStatus === 'verified_live') {
    if (platform === 'shopify') {
      return 'Browser referral tag is live in layout/theme.liquid. To also log sandboxed checkout revenue, ensure your Custom Pixel is connected in Shopify Admin → Settings → Customer events.';
    }
    return 'Browser AI referral tag is active in your live HTML <head>. Visits from ChatGPT, Perplexity, Gemini, and Claude now report automatically.';
  }

  switch (platform) {
    case 'shopify':
      return 'Paste the 10-line <script> tag right before </head> in Online Store → Themes → Edit code → layout/theme.liquid on your Live Theme, and add the Custom Pixel under Shopify Admin → Settings → Customer events → Connect.';
    case 'wordpress':
      return 'Open WPCode (Code Snippets → Header & Footer), paste the 10-line <script> tag into the Site-Wide Header box, save, and purge WP Rocket / Cloudflare / LiteSpeed cache.';
    case 'webflow':
      return 'Open Webflow Site Settings → Custom Code → Head Code, paste the 10-line <script> tag, save, and click Publish to Selected Domains.';
    case 'wix':
    case 'squarespace':
    case 'framer':
      return 'Open Custom Code / Code Injection → Header (Load once on All Pages), paste the 10-line <script> tag, and publish your live site.';
    case 'nextjs_custom':
      return 'Render the 10-line <script> tag inside your root app/layout.tsx or _document.tsx <head> (and optionally wire logVerisourceAiCrawler into middleware.ts), then deploy to production.';
  }
}

export function evaluateTrackerInstallation(params: {
  hostname: string;
  brandName: string;
  trackingPixelToken: string;
  isShopify: boolean;
  detectedPlatform?: WebsitePlatformId;
  httpStatus: number | null;
  rawHtml: string;
  attributionEvents: AiAttributionEventRow[];
  browserPixelSnippet: string;
  shopifyCheckoutPixel?: string;
  edgeCrawlerSnippet?: string;
}): LiveTrackerVerificationReport {
  const host = params.hostname.trim().toLowerCase().replace(/^www\./, '');
  const brand = params.brandName.trim() || host;
  const token = params.trackingPixelToken.trim();
  const html = params.rawHtml ?? '';

  const resolvedPlatform: WebsitePlatformId =
    params.detectedPlatform ?? (params.isShopify ? 'shopify' : 'nextjs_custom');
  const platformMeta = getWebsitePlatformMeta(resolvedPlatform);

  const referralEventsCount = params.attributionEvents.filter(
    (e) => e.event_type === 'ai_referral_visit'
  ).length;
  const conversionEventsCount = params.attributionEvents.filter(
    (e) => e.event_type === 'ai_referral_conversion'
  ).length;
  const botCrawlEventsCount = params.attributionEvents.filter(
    (e) => e.event_type === 'ai_bot_crawl'
  ).length;

  const hasExactTokenInHtml = Boolean(
    token && html.toLowerCase().includes(token.toLowerCase())
  );
  const hasVerisourcePixelSignature =
    /\/api\/pixel|vs_ai_src|verisourceConversion/i.test(html);

  const browserPixelLive = hasExactTokenInHtml && hasVerisourcePixelSignature;
  const foreignTokenMismatch =
    !hasExactTokenInHtml && hasVerisourcePixelSignature;

  const isReachable =
    params.httpStatus !== null &&
    params.httpStatus >= 200 &&
    params.httpStatus < 400;

  let overallStatus: TrackerOverallVerificationStatus;
  let statusHeadline: string;

  if (!isReachable) {
    overallStatus = 'unreachable';
    statusHeadline = `Could not inspect https://${host}/ right now (HTTP ${
      params.httpStatus ?? 'timeout'
    }).`;
  } else if (browserPixelLive) {
    overallStatus = 'verified_live';
    statusHeadline = `Browser AI Referral Pixel is live on https://${host}/ (${
      referralEventsCount + conversionEventsCount
    } human referral event(s) · ${botCrawlEventsCount} bot crawl(s) logged).`;
  } else if (foreignTokenMismatch) {
    overallStatus = 'token_mismatch';
    statusHeadline = `Token mismatch on https://${host}/ — found a Verisource <script> tag with a different workspace token instead of ${token.slice(
      0,
      8
    )}….`;
  } else if (referralEventsCount + conversionEventsCount > 0) {
    overallStatus = 'telemetry_active_sandbox';
    statusHeadline =
      resolvedPlatform === 'shopify'
        ? `Live AI checkout/referral events (${
            referralEventsCount + conversionEventsCount
          }) are flowing from ${host} (Shopify Customer Events sandbox active; optional theme.liquid <head> tag not yet detected).`
        : `Recorded ${
            referralEventsCount + conversionEventsCount
          } AI referral event(s) from ${host}, though the browser <script> tag was not found in the raw homepage HTML.`;
  } else {
    overallStatus = 'not_installed_yet';
    statusHeadline = `Optional AI Visitor Pixel is not yet published in the live HTML on https://${host}/ (${platformMeta.displayName}).`;
  }

  const cmsTroubleshootingHint = buildPlatformTrackerHint(
    resolvedPlatform,
    overallStatus
  );

  const promptSections: string[] = [];
  if (overallStatus === 'token_mismatch') {
    promptSections.push(
      `# Task: Fix Verisource AI Attribution Token Mismatch on ${host}`,
      '',
      'Replace the mismatched pixel token immediately.',
      `A Verisource \`/api/pixel\` tag is active on **${brand}** (\`https://${host}\`, HTTP 200), yet it carries another workspace's token so Origin verification returns HTTP 403 and drops \`chatgpt.com\` and \`perplexity.ai\` visits (alongside \`GPTBot\` and \`PerplexityBot\` attribution). Swap that script in your shared \`<head>\` layout for this verified token (\`${token}\`) without duplicating tags:`,
      '',
      '```html',
      params.browserPixelSnippet.trim(),
      '```'
    );
  } else if (overallStatus === 'verified_live' && resolvedPlatform === 'shopify' && params.shopifyCheckoutPixel) {
    promptSections.push(
      `# Task: Confirm Shopify Checkout Revenue Pixel on ${host}`,
      '',
      'Keep your live theme tag untouched.',
      `The \`layout/theme.liquid\` browser referral tag is already returning HTTP 200 on \`https://${host}\` (**KEEP INTACT**), alongside your \`JSON-LD\` and \`/agents.md\` commerce signals for \`GPTBot\` and \`PerplexityBot\`. To ensure sandboxed Shopify checkout order values ($ USD) also post \`ai_referral_conversion\` with HMAC verification, confirm this Custom Pixel is connected in **Shopify Admin -> Settings -> Customer events -> Add custom pixel**:`,
      '',
      '```javascript',
      params.shopifyCheckoutPixel.trim(),
      '```'
    );
  } else {
    promptSections.push(
      `# Task: Publish Verisource AI Referral & Conversion Tracker on ${host} (${platformMeta.displayName})`,
      '',
      'Install the 10-line attribution tag once.',
      `Add the lightweight Verisource snippet to **${brand}** (\`https://${host}\`, HTTP 200) so human visits and revenue from \`chatgpt.com\`, \`perplexity.ai\`, \`gemini.google.com\`, and \`claude.ai\` report alongside \`GPTBot\` and \`PerplexityBot\` crawl telemetry (HTTP 403 blocks cross-origin spoofs automatically).`,
      '',
      '## Placement Checklist',
      `1. ${cmsTroubleshootingHint}`,
      `2. Keep token \`${token}\` unchanged and load the tag once before \`</head>\`.`,
      '3. Confirm once published so we can click "✓ Verify Tracker Live" in Verisource Step 01.',
      '',
      '## 1. Browser AI Referral & Conversion Tag (Before `</head>`)',
      '```html',
      params.browserPixelSnippet.trim(),
      '```'
    );

    if (resolvedPlatform === 'shopify' && params.shopifyCheckoutPixel) {
      promptSections.push(
        '',
        '## 2. Shopify Checkout Custom Pixel (Shopify Admin -> Settings -> Customer events)',
        '```javascript',
        params.shopifyCheckoutPixel.trim(),
        '```'
      );
    } else if (
      resolvedPlatform === 'nextjs_custom' &&
      params.edgeCrawlerSnippet
    ) {
      promptSections.push(
        '',
        '## 2. Optional Server / Edge AI Bot Crawl Logger (`GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`)',
        '```typescript',
        params.edgeCrawlerSnippet.trim(),
        '```'
      );
    }
  }

  const followUpInstallPrompt = enforceQualityGate95(
    promptSections.join('\n'),
    'agents_md'
  );

  return {
    hostname: host,
    httpStatus: params.httpStatus,
    detectedPlatform: resolvedPlatform,
    detectedPlatformLabel: platformMeta.displayName,
    checkedAt: new Date().toISOString(),
    browserPixelLive,
    foreignTokenMismatch,
    referralEventsCount,
    conversionEventsCount,
    botCrawlEventsCount,
    overallStatus,
    statusHeadline,
    cmsTroubleshootingHint,
    followUpInstallPrompt,
  };
}

export async function verifyLiveTrackerInstallation(options: {
  domain: DomainRow;
  attributionEvents: AiAttributionEventRow[];
  ingestionUrl?: string;
  rawEnv?: RawEnvInput;
}): Promise<LiveTrackerVerificationReport> {
  const env = resolveCoreGeoEnv(options.rawEnv);
  const normalized = normalizePublicDomain(options.domain.domain_url);
  const ingestionUrl = (
    options.ingestionUrl ?? 'https://verisource.dev/api/pixel'
  ).trim();

  const checkoutKey = await computeShopifyCheckoutKey({
    domainId: options.domain.id,
    trackingPixelToken: options.domain.tracking_pixel_token,
  });

  const browserPixelSnippet = buildAiAttributionSnippet({
    trackingPixelToken: options.domain.tracking_pixel_token,
    ingestionUrl,
  });
  const shopifyCheckoutPixel = options.domain.is_shopify
    ? buildShopifyCustomerEventsPixel({
        trackingPixelToken: options.domain.tracking_pixel_token,
        checkoutKey,
        ingestionUrl,
      })
    : undefined;
  const edgeCrawlerSnippet = !options.domain.is_shopify
    ? buildEdgeBotCrawlerSnippet({
        trackingPixelToken: options.domain.tracking_pixel_token,
        checkoutKey,
        ingestionUrl,
      })
    : undefined;

  let httpStatus: number | null = null;
  let rawHtml = '';
  let detectedHeaders: Headers | null = null;

  let currentUrl = `${normalized.origin}/`;
  for (let hop = 0; hop < 4; hop++) {
    try {
      const res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; VerisourceTrackerVerifier/1.0; +https://verisource.dev)',
          Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(5500),
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) {
          httpStatus = res.status;
          break;
        }
        const nextUrl = new URL(loc, currentUrl);
        const safeNext = normalizePublicDomain(nextUrl.hostname);
        const nextHost = nextUrl.hostname.toLowerCase().replace(/^www\./, '');
        if (
          nextHost !== normalized.hostname &&
          !nextHost.endsWith(`.${normalized.hostname}`)
        ) {
          httpStatus = 403;
          break;
        }
        currentUrl = `https://${safeNext.hostname}${nextUrl.pathname || '/'}${nextUrl.search}`;
        continue;
      }

      httpStatus = res.status;
      detectedHeaders = res.headers;
      rawHtml = await res.text();
      break;
    } catch {
      httpStatus = null;
      break;
    }
  }

  if (httpStatus === null && env.providerMode === 'mock') {
    httpStatus = 200;
    rawHtml = `<!doctype html><html><head><title>${options.domain.brand_name}</title></head><body><main><h1>${options.domain.brand_name}</h1></main></body></html>`;
  }

  const platformInfo = detectWebsitePlatform({
    html: rawHtml,
    headers: detectedHeaders,
    isShopifyOverride: options.domain.is_shopify,
  });

  return evaluateTrackerInstallation({
    hostname: normalized.hostname,
    brandName: options.domain.brand_name,
    trackingPixelToken: options.domain.tracking_pixel_token,
    isShopify: platformInfo.platformId === 'shopify' || options.domain.is_shopify,
    detectedPlatform: platformInfo.platformId,
    httpStatus,
    rawHtml,
    attributionEvents: options.attributionEvents,
    browserPixelSnippet,
    shopifyCheckoutPixel,
    edgeCrawlerSnippet,
  });
}
