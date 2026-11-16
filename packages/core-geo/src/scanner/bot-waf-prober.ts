import type { CoreGeoEnv } from '../config/env.js';
import type {
  AgentsMdStatus,
  LlmsTxtStatus,
  RobotsAiBotStatus,
} from '../db/types.js';
import {
  detectWebsitePlatform,
  type WebsitePlatformId,
} from './cms-detector.js';

export interface NormalizedDomain {
  origin: string;
  hostname: string;
  inferredBrandName: string;
}

export type CrawlerReadabilityStatus =
  | 'ssr_clean'
  | 'low_signal_bloat'
  | 'csr_js_trap';

export interface CrawlerReadabilityReport {
  status: CrawlerReadabilityStatus;
  rawHtmlBytes: number;
  visibleTextChars: number;
  visibleWordCount: number;
  signalToHtmlPct: number;
  estimatedTokens: number;
  hasSemanticLandmarks: boolean;
  detectedCsrShell: boolean;
  summary: string;
}

export interface DomainHttpProbeResult {
  domain: NormalizedDomain;
  reachable: boolean;
  httpStatus: number | null;
  title: string | null;
  metaDescription: string | null;
  jsonLdBlocks: Record<string, unknown>[];
  robotsAiBotStatus: RobotsAiBotStatus;
  llmsTxtStatus: LlmsTxtStatus;
  llmsTxtExcerpt: string | null;
  agentsMdRaw: string | null;
  agentsMdInitialStatus: AgentsMdStatus;
  htmlSignalsShopify: boolean;
  detectedPlatform?: WebsitePlatformId;
  extractedPriceMentions: string[];
  extractedShippingMentions: string[];
  crawlerReadability?: CrawlerReadabilityReport;
}

const PRIVATE_OR_BLOCKED_HOST_REGEX =
  /^(?:localhost|0\.\d+\.\d+\.\d+|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d+\.\d+|\[.*\])$/i;

const RAW_IPV4_LITERAL_REGEX = /^\d{1,3}(?:\.\d{1,3}){3}$/;

const DNS_REBINDING_SUFFIX_REGEX =
  /(?:^|\.)(?:nip\.io|sslip\.io|xip\.io|localtest\.me|lvh\.me|metadata\.google\.internal)$/i;

export function normalizePublicDomain(input: string): NormalizedDomain {
  const raw = input.trim();
  if (!raw) {
    throw new Error('Domain input cannot be empty.');
  }
  if (raw.startsWith('//')) {
    throw new Error(`Protocol-relative URLs are not permitted: "${input}"`);
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error(`Invalid domain URL: "${input}"`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP/HTTPS public domains are supported.');
  }

  if (parsed.username || parsed.password) {
    throw new Error('Invalid domain URL: embedded credentials are not permitted.');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (
    !hostname.includes('.') ||
    hostname.startsWith('[') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost') ||
    RAW_IPV4_LITERAL_REGEX.test(hostname) ||
    RAW_IPV4_LITERAL_REGEX.test(parsed.hostname) ||
    DNS_REBINDING_SUFFIX_REGEX.test(hostname) ||
    PRIVATE_OR_BLOCKED_HOST_REGEX.test(hostname) ||
    PRIVATE_OR_BLOCKED_HOST_REGEX.test(parsed.hostname)
  ) {
    throw new Error(
      `Refusing to scan non-public or internal host: "${parsed.hostname}"`
    );
  }

  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    throw new Error(
      `Refusing to scan non-public port ":${parsed.port}" on "${parsed.hostname}"`
    );
  }

  const origin = `https://${hostname}`;
  const rootLabel = hostname.split('.')[0] ?? hostname;
  const inferredBrandName = rootLabel
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return { origin, hostname, inferredBrandName };
}

export function matchesPublicHostname(
  domainUrl: string,
  candidateHostname: string
): boolean {
  try {
    const left = normalizePublicDomain(domainUrl).hostname;
    const right = candidateHostname.trim().toLowerCase().replace(/^www\./, '');
    return Boolean(left && right && left === right);
  } catch {
    return false;
  }
}

const TRACKED_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'PerplexityBot',
  'ClaudeBot',
  'Google-Extended',
] as const;

export function parseRobotsAiBotRules(robotsText: string): Omit<
  RobotsAiBotStatus,
  'waf_blocked'
> {
  const status: Omit<RobotsAiBotStatus, 'waf_blocked'> = {
    GPTBot: true,
    'OAI-SearchBot': true,
    PerplexityBot: true,
    ClaudeBot: true,
    'Google-Extended': true,
  };

  const lines = robotsText
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter(Boolean);

  let currentAgents: string[] = [];
  let sawRuleInGroup = false;

  const rulesByAgent = new Map<string, { allowRoot: boolean; disallowRoot: boolean }>();

  for (const line of lines) {
    const sepIndex = line.indexOf(':');
    if (sepIndex === -1) continue;
    const directive = line.slice(0, sepIndex).trim().toLowerCase();
    const value = line.slice(sepIndex + 1).trim();

    if (directive === 'user-agent') {
      if (sawRuleInGroup) {
        currentAgents = [];
        sawRuleInGroup = false;
      }
      currentAgents.push(value.toLowerCase());
      continue;
    }

    if (directive === 'disallow' || directive === 'allow') {
      sawRuleInGroup = true;
      for (const agent of currentAgents) {
        const entry = rulesByAgent.get(agent) ?? {
          allowRoot: false,
          disallowRoot: false,
        };
        if (directive === 'disallow' && value === '/') {
          entry.disallowRoot = true;
        }
        if (directive === 'allow' && value === '/') {
          entry.allowRoot = true;
        }
        rulesByAgent.set(agent, entry);
      }
    }
  }

  const wildcard = rulesByAgent.get('*');

  for (const bot of TRACKED_BOTS) {
    const specific = rulesByAgent.get(bot.toLowerCase());
    if (specific) {
      status[bot] = !(specific.disallowRoot && !specific.allowRoot);
    } else if (wildcard) {
      status[bot] = !(wildcard.disallowRoot && !wildcard.allowRoot);
    }
  }

  return status;
}

function isLikelyHtmlSoft404(body: string, contentType: string | null): boolean {
  const ct = (contentType ?? '').toLowerCase();
  const trimmed = body.trimStart().slice(0, 300).toLowerCase();
  if (ct.includes('text/html')) return true;
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
    return true;
  }
  return false;
}

export function classifyAgentsMdContent(raw: string | null): AgentsMdStatus {
  if (!raw || raw.trim().length < 24) return 'missing';
  const lower = raw.toLowerCase();

  // Real-world 2026 Shopify stock /agents.md & /llms.txt boilerplate markers
  const hasStockShopifyPlatformFooter =
    lower.includes('start your own store: https://www.shopify.com/start') ||
    lower.includes('https://mock.shop') ||
    lower.includes('https://shop.app/skill.md') ||
    lower.includes('https://shop.com/skill.md') ||
    lower.includes('this guide covers the shop skill and ucp integration');

  const hasExplicitMerchantTruth =
    lower.includes('verified') ||
    lower.includes('exclusions') ||
    lower.includes('does not sell') ||
    lower.includes('free local delivery') ||
    /\$\d{1,4}(?:\.\d{2})?/.test(raw);

  if (hasStockShopifyPlatformFooter && !hasExplicitMerchantTruth) {
    return 'default_boilerplate';
  }

  const hasCustomTruthSignals =
    hasExplicitMerchantTruth ||
    lower.includes('pricing') ||
    lower.includes('faq') ||
    raw.split(/\r?\n/).length > 28;

  const looksLikeAutoBoilerplate =
    (lower.includes('/api/ucp/mcp') || lower.includes('/api/mcp')) &&
    !hasCustomTruthSignals;

  return looksLikeAutoBoilerplate ? 'default_boilerplate' : 'custom_enriched';
}

export function extractAlternateMarkdownHref(html: string): string | null {
  const linkRegex = /<link\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    const tag = match[0];
    if (!/\brel\s*=\s*["'][^"']*\balternate\b[^"']*["']/i.test(tag)) continue;
    if (!/\btype\s*=\s*["']text\/markdown["']/i.test(tag)) continue;
    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    const href = hrefMatch?.[1]?.trim();
    if (href) return href;
  }
  return null;
}

export function extractVerifiableTruthFromAlternateBody(
  body: string,
  contentType: string | null
): string | null {
  const raw = body.trim();
  if (raw.length < 40) return null;

  const isHtml = isLikelyHtmlSoft404(raw, contentType);
  if (!isHtml) {
    return raw;
  }

  // Extract primary semantic container on Shopify /pages/ai-facts so nav/footer chrome does not pollute classification
  const articleMatch =
    raw.match(
      /<article[^>]*class=["'][^"']*verisource-ai-facts[^"']*["'][^>]*>([\s\S]*?)<\/article>/i
    ) ?? raw.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);

  const scopedHtml = articleMatch?.[1] ?? raw;
  const cleaned = scopedHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(?:h1|h2|h3|p|li|ul|article|section|div)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();

  return cleaned.length >= 40 ? cleaned : null;
}

export function analyzeCrawlerHtmlReadability(
  rawHtml: string
): CrawlerReadabilityReport {
  const html = rawHtml ?? '';
  const rawHtmlBytes = new TextEncoder().encode(html).length;

  const hasSemanticLandmarks =
    /<(?:main|article|h1)\b/i.test(html) ||
    /<script[^>]+type=["']application\/ld\+json["']/i.test(html);

  const detectedCsrShell =
    /<div[^>]+id=["'](?:root|app|__next)["'][^>]*>\s*<\/div>/i.test(html) ||
    /enable javascript to run this app|you need to enable javascript/i.test(
      html
    );

  const visibleText = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const visibleTextChars = visibleText.length;
  const visibleWordCount = visibleText
    ? visibleText.split(/\s+/).filter(Boolean).length
    : 0;
  const estimatedTokens = Math.max(0, Math.round(visibleTextChars / 4));
  const signalToHtmlPct =
    rawHtmlBytes > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((visibleTextChars / rawHtmlBytes) * 100))
        )
      : 0;

  if (
    rawHtmlBytes === 0 ||
    visibleWordCount < 35 ||
    (detectedCsrShell && visibleWordCount < 75)
  ) {
    return {
      status: 'csr_js_trap',
      rawHtmlBytes,
      visibleTextChars,
      visibleWordCount,
      signalToHtmlPct,
      estimatedTokens,
      hasSemanticLandmarks,
      detectedCsrShell,
      summary:
        detectedCsrShell || rawHtmlBytes > 0
          ? `Client-side JS trap: initial HTML exposes only ${visibleWordCount} words (~${estimatedTokens} tokens) to non-JS AI crawlers.`
          : 'Unreachable or empty initial HTML response returned to AI crawlers.',
    };
  }

  if (signalToHtmlPct < 3 && rawHtmlBytes > 55_000 && visibleWordCount < 220) {
    return {
      status: 'low_signal_bloat',
      rawHtmlBytes,
      visibleTextChars,
      visibleWordCount,
      signalToHtmlPct,
      estimatedTokens,
      hasSemanticLandmarks,
      detectedCsrShell,
      summary: `Heavy HTML bloat (${signalToHtmlPct}% text-to-markup signal across ${Math.round(rawHtmlBytes / 1024)} KB) — publish /llms.txt and /agents.md for clean retrieval.`,
    };
  }

  return {
    status: 'ssr_clean',
    rawHtmlBytes,
    visibleTextChars,
    visibleWordCount,
    signalToHtmlPct,
    estimatedTokens,
    hasSemanticLandmarks,
    detectedCsrShell,
    summary: `Server-rendered HTML exposes ${visibleWordCount.toLocaleString('en-US')} words (~${estimatedTokens.toLocaleString('en-US')} tokens, ${signalToHtmlPct}% signal density) without JavaScript.`,
  };
}

function extractHtmlMetadata(html: string): {
  title: string | null;
  metaDescription: string | null;
  jsonLdBlocks: Record<string, unknown>[];
  alternateMarkdownHref: string | null;
  htmlSignalsShopify: boolean;
  extractedPriceMentions: string[];
  extractedShippingMentions: string[];
} {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.replace(/\s+/g, ' ').trim() ?? null;

  const descMatch =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
    ) ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
    );
  const metaDescription = descMatch?.[1]?.replace(/\s+/g, ' ').trim() ?? null;

  const jsonLdBlocks: Record<string, unknown>[] = [];
  const pushJsonLdNode = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj['@graph']) && obj['@graph'].length > 0) {
      for (const graphItem of obj['@graph']) {
        if (graphItem && typeof graphItem === 'object') {
          jsonLdBlocks.push(graphItem as Record<string, unknown>);
        }
      }
    } else {
      jsonLdBlocks.push(obj);
    }
  };

  const scriptRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    const rawJson = match[1]?.trim();
    if (!rawJson) continue;
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          pushJsonLdNode(item);
        }
      } else {
        pushJsonLdNode(parsed);
      }
    } catch {
      // Ignore malformed third-party theme JSON-LD blocks
    }
  }

  const alternateMarkdownHref = extractAlternateMarkdownHref(html);

  const htmlSignalsShopify =
    /Shopify\.shop|cdn\.shopify\.com|shopify-digital-wallet|myshopify\.com/i.test(
      html
    );

  const visibleText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

  const priceMatches = Array.from(
    new Set(visibleText.match(/\$\d{1,4}(?:\.\d{2})?/g) ?? [])
  ).slice(0, 6);

  const shippingSentences: string[] = [];
  const shippingRegex =
    /([^.!?\n]{0,60}\b(?:free shipping|free local delivery|ships nationwide|orders over \$\d+)[^.!?\n]{0,60})/gi;
  let shipMatch: RegExpExecArray | null;
  while (
    (shipMatch = shippingRegex.exec(visibleText)) !== null &&
    shippingSentences.length < 3
  ) {
    const cleaned = shipMatch[1]?.trim();
    if (cleaned) shippingSentences.push(cleaned);
  }

  return {
    title,
    metaDescription,
    jsonLdBlocks,
    alternateMarkdownHref,
    htmlSignalsShopify,
    extractedPriceMentions: priceMatches,
    extractedShippingMentions: shippingSentences,
  };
}

export async function fetchWithSafePublicRedirects(
  initialUrl: string,
  init?: RequestInit,
  timeoutMs = 6000,
  maxRedirects = 4
): Promise<Response> {
  let currentUrl = initialUrl;
  let currentInit: RequestInit = { ...init };

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const parsedTarget = new URL(currentUrl);
    // Validate every hop's host, scheme, port, and DNS-rebinding suffix against SSRF rules
    normalizePublicDomain(parsedTarget.origin);

    const response = await fetch(currentUrl, {
      ...currentInit,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (
      response.status === 301 ||
      response.status === 302 ||
      response.status === 303 ||
      response.status === 307 ||
      response.status === 308
    ) {
      const location = response.headers.get('location')?.trim();
      if (!location || hop === maxRedirects) {
        return response;
      }
      const nextUrl = new URL(location, currentUrl);
      normalizePublicDomain(nextUrl.origin);
      currentUrl = nextUrl.toString();

      if (
        response.status === 301 ||
        response.status === 302 ||
        response.status === 303
      ) {
        const currentMethod = (currentInit.method ?? 'GET').toUpperCase();
        if (currentMethod !== 'GET' && currentMethod !== 'HEAD') {
          currentInit = {
            ...currentInit,
            method: 'GET',
            body: undefined,
          };
        }
      }
      continue;
    }

    return response;
  }

  throw new Error('Maximum safe HTTP redirect hops exceeded.');
}

async function safeFetchText(
  url: string,
  init?: RequestInit,
  timeoutMs = 6000
): Promise<{
  ok: boolean;
  status: number | null;
  headers: Headers | null;
  body: string;
}> {
  try {
    const response = await fetchWithSafePublicRedirects(url, init, timeoutMs, 4);
    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      body,
    };
  } catch {
    return { ok: false, status: null, headers: null, body: '' };
  }
}

async function probeSimulatedBotWaf(origin: string): Promise<{
  wafBlocked: boolean;
  perplexityHttpBlocked: boolean;
  gptBotHttpBlocked: boolean;
}> {
  const [gptRes, pplxRes] = await Promise.all([
    safeFetchText(
      origin,
      {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
          Accept: 'text/html,*/*',
        },
      },
      4500
    ),
    safeFetchText(
      origin,
      {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot',
          Accept: 'text/html,*/*',
        },
      },
      4500
    ),
  ]);

  const isWafChallenge = (res: {
    status: number | null;
    headers: Headers | null;
    body: string;
  }): boolean => {
    if (res.status === 403 || res.status === 429) return true;
    if (res.headers?.get('cf-mitigated') === 'challenge') return true;
    if (/Just a moment\.\.\.|cf-browser-verification|Attention Required!/i.test(res.body.slice(0, 1200))) {
      return true;
    }
    return false;
  };

  const gptBotHttpBlocked = isWafChallenge(gptRes);
  const perplexityHttpBlocked = isWafChallenge(pplxRes);

  return {
    wafBlocked: gptBotHttpBlocked || perplexityHttpBlocked,
    perplexityHttpBlocked,
    gptBotHttpBlocked,
  };
}

export async function probeDomainHttpReadiness(
  domainInput: string,
  env: CoreGeoEnv
): Promise<DomainHttpProbeResult> {
  const domain = normalizePublicDomain(domainInput);

  const [homeRes, robotsRes, llmsRes, agentsRes, wafProbe] = await Promise.all([
    safeFetchText(`${domain.origin}/`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; VerisourceGeoScanner/1.0; +https://verisource.dev)',
        Accept: 'text/html,application/xhtml+xml',
      },
    }),
    safeFetchText(`${domain.origin}/robots.txt`),
    safeFetchText(`${domain.origin}/llms.txt`),
    safeFetchText(`${domain.origin}/agents.md`),
    probeSimulatedBotWaf(domain.origin),
  ]);

  const robotsRules =
    robotsRes.ok && !isLikelyHtmlSoft404(robotsRes.body, robotsRes.headers?.get('content-type') ?? null)
      ? parseRobotsAiBotRules(robotsRes.body)
      : {
          GPTBot: true,
          'OAI-SearchBot': true,
          PerplexityBot: true,
          ClaudeBot: true,
          'Google-Extended': true,
        };

  if (wafProbe.gptBotHttpBlocked) robotsRules.GPTBot = false;
  if (wafProbe.perplexityHttpBlocked) robotsRules.PerplexityBot = false;

  const robotsAiBotStatus: RobotsAiBotStatus = {
    ...robotsRules,
    waf_blocked: wafProbe.wafBlocked,
  };

  const validLlmsTxt =
    llmsRes.ok &&
    llmsRes.body.trim().length > 20 &&
    !isLikelyHtmlSoft404(llmsRes.body, llmsRes.headers?.get('content-type') ?? null);

  const validAgentsMd =
    agentsRes.ok &&
    agentsRes.body.trim().length > 20 &&
    !isLikelyHtmlSoft404(agentsRes.body, agentsRes.headers?.get('content-type') ?? null);

  let htmlBody = homeRes.body;

  // Optional Firecrawl fallback if homepage blocked standard fetch or returned empty SPA shell
  if (
    (!homeRes.ok || htmlBody.length < 300) &&
    env.hasFirecrawl &&
    env.firecrawlApiKey
  ) {
    const fcRes = await safeFetchText(
      'https://api.firecrawl.dev/v1/scrape',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: domain.origin,
          formats: ['rawHtml'],
        }),
      },
      9000
    );
    if (fcRes.ok) {
      try {
        const fcJson = JSON.parse(fcRes.body) as {
          data?: { rawHtml?: string };
        };
        if (fcJson.data?.rawHtml) {
          htmlBody = fcJson.data.rawHtml;
        }
      } catch {
        // Keep original htmlBody
      }
    }
  }

  const htmlMeta = extractHtmlMetadata(htmlBody);
  const shopifyHeaderDetected = Boolean(
    homeRes.headers?.get('x-shopid') || homeRes.headers?.get('x-shopify-stage')
  );
  const detectedPlatformInfo = detectWebsitePlatform({
    html: htmlBody,
    headers: homeRes.headers,
    isShopifyOverride: htmlMeta.htmlSignalsShopify || shopifyHeaderDetected,
  });

  let effectiveAgentsMdRaw = validAgentsMd ? agentsRes.body : null;
  let effectiveAgentsMdStatus = classifyAgentsMdContent(effectiveAgentsMdRaw);
  let verifiedAlternateAiFactsContainer = false;

  if (
    llmsRes.ok &&
    !validLlmsTxt &&
    /<article[^>]*class=["'][^"']*verisource-ai-facts[^"']*["']/i.test(
      llmsRes.body
    ) &&
    llmsRes.body.toLowerCase().includes(domain.hostname)
  ) {
    verifiedAlternateAiFactsContainer = true;
  }

  // Follow same-origin <link rel="alternate" type="text/markdown" href="..."> overrides (e.g., Shopify, Webflow, Wix, Squarespace, Framer /ai-facts pages)
  if (
    effectiveAgentsMdStatus !== 'custom_enriched' &&
    htmlMeta.alternateMarkdownHref
  ) {
    try {
      const candidateUrl = new URL(htmlMeta.alternateMarkdownHref, domain.origin);
      const candidateHost = candidateUrl.hostname
        .toLowerCase()
        .replace(/^www\./, '');
      if (
        candidateUrl.protocol === 'https:' &&
        candidateHost === domain.hostname &&
        !PRIVATE_OR_BLOCKED_HOST_REGEX.test(candidateHost)
      ) {
        const altRes = await safeFetchText(
          candidateUrl.toString(),
          undefined,
          4500
        );
        if (altRes.ok && altRes.body.trim().length >= 80) {
          if (
            /<article[^>]*class=["'][^"']*verisource-ai-facts[^"']*["']/i.test(
              altRes.body
            ) &&
            altRes.body.toLowerCase().includes(domain.hostname)
          ) {
            verifiedAlternateAiFactsContainer = true;
          }
          const extractedTruth = extractVerifiableTruthFromAlternateBody(
            altRes.body,
            altRes.headers?.get('content-type') ?? null
          );
          if (
            extractedTruth &&
            classifyAgentsMdContent(extractedTruth) === 'custom_enriched'
          ) {
            effectiveAgentsMdRaw = extractedTruth;
            effectiveAgentsMdStatus = 'custom_enriched';
          }
        }
      }
    } catch {
      // Ignore malformed alternate hrefs
    }
  }

  const effectiveValidLlms = validLlmsTxt || verifiedAlternateAiFactsContainer;

  const initialCrawlerHtml =
    homeRes.body.length > 0 ? homeRes.body : htmlBody;
  const crawlerReadability = analyzeCrawlerHtmlReadability(initialCrawlerHtml);

  return {
    domain,
    reachable: homeRes.ok || htmlBody.length > 0,
    httpStatus: homeRes.status,
    title: htmlMeta.title,
    metaDescription: htmlMeta.metaDescription,
    jsonLdBlocks: htmlMeta.jsonLdBlocks,
    robotsAiBotStatus,
    llmsTxtStatus: effectiveValidLlms ? 'present' : 'missing',
    llmsTxtExcerpt: validLlmsTxt
      ? llmsRes.body.slice(0, 500)
      : verifiedAlternateAiFactsContainer && effectiveAgentsMdRaw
        ? effectiveAgentsMdRaw.slice(0, 500)
        : null,
    agentsMdRaw: effectiveAgentsMdRaw,
    agentsMdInitialStatus: effectiveAgentsMdStatus,
    htmlSignalsShopify: htmlMeta.htmlSignalsShopify || shopifyHeaderDetected,
    detectedPlatform: detectedPlatformInfo.platformId,
    extractedPriceMentions: htmlMeta.extractedPriceMentions,
    extractedShippingMentions: htmlMeta.extractedShippingMentions,
    crawlerReadability,
  };
}
