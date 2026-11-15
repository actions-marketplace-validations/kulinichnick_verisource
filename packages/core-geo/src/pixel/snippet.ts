// Zero-Code AI Referral & Shopify Customer Events Attribution Generators
import { sha256Hex } from '../auth/api-key.js';

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
