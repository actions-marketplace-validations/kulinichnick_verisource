import type { CoreGeoEnv } from '../config/env.js';
import type {
  AgentsMdStatus,
  LlmsTxtStatus,
  RobotsAiBotStatus,
} from '../db/types.js';

export interface NormalizedDomain {
  origin: string;
  hostname: string;
  inferredBrandName: string;
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
  extractedPriceMentions: string[];
  extractedShippingMentions: string[];
}

const PRIVATE_OR_BLOCKED_HOST_REGEX =
  /^(?:localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0|\[::1\]|\[fc[0-9a-f]{2}:.*\]|\[fe80:.*\])$/i;

export function normalizePublicDomain(input: string): NormalizedDomain {
  const raw = input.trim();
  if (!raw) {
    throw new Error('Domain input cannot be empty.');
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

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (
    !hostname.includes('.') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost') ||
    PRIVATE_OR_BLOCKED_HOST_REGEX.test(hostname) ||
    PRIVATE_OR_BLOCKED_HOST_REGEX.test(parsed.hostname)
  ) {
    throw new Error(
      `Refusing to scan non-public or internal host: "${parsed.hostname}"`
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

  const hasCustomTruthSignals =
    lower.includes('verified') ||
    lower.includes('pricing') ||
    lower.includes('shipping') ||
    lower.includes('exclusions') ||
    lower.includes('free delivery') ||
    lower.includes('faq') ||
    raw.split(/\r?\n/).length > 28;

  const looksLikeAutoBoilerplate =
    (lower.includes('/api/ucp/mcp') || lower.includes('/api/mcp')) &&
    !hasCustomTruthSignals;

  return looksLikeAutoBoilerplate ? 'default_boilerplate' : 'custom_enriched';
}

function extractHtmlMetadata(html: string): {
  title: string | null;
  metaDescription: string | null;
  jsonLdBlocks: Record<string, unknown>[];
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
          if (item && typeof item === 'object') {
            jsonLdBlocks.push(item as Record<string, unknown>);
          }
        }
      } else if (parsed && typeof parsed === 'object') {
        jsonLdBlocks.push(parsed as Record<string, unknown>);
      }
    } catch {
      // Ignore malformed third-party theme JSON-LD blocks
    }
  }

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
    htmlSignalsShopify,
    extractedPriceMentions: priceMatches,
    extractedShippingMentions: shippingSentences,
  };
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
    const response = await fetch(url, {
      ...init,
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
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

  return {
    domain,
    reachable: homeRes.ok || htmlBody.length > 0,
    httpStatus: homeRes.status,
    title: htmlMeta.title,
    metaDescription: htmlMeta.metaDescription,
    jsonLdBlocks: htmlMeta.jsonLdBlocks,
    robotsAiBotStatus,
    llmsTxtStatus: validLlmsTxt ? 'present' : 'missing',
    llmsTxtExcerpt: validLlmsTxt ? llmsRes.body.slice(0, 500) : null,
    agentsMdRaw: validAgentsMd ? agentsRes.body : null,
    agentsMdInitialStatus: classifyAgentsMdContent(
      validAgentsMd ? agentsRes.body : null
    ),
    htmlSignalsShopify: htmlMeta.htmlSignalsShopify || shopifyHeaderDetected,
    extractedPriceMentions: htmlMeta.extractedPriceMentions,
    extractedShippingMentions: htmlMeta.extractedShippingMentions,
  };
}
