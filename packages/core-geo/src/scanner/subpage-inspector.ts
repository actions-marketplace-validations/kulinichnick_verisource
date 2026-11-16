import { resolveCoreGeoEnv, type RawEnvInput } from '../config/env.js';
import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { BrandTruthSheet } from '../db/types.js';
import {
  analyzeCrawlerHtmlReadability,
  normalizePublicDomain,
  type CrawlerReadabilityReport,
} from './bot-waf-prober.js';

export interface SubPageCheckItem {
  id:
    | 'bot_http_access'
    | 'ssr_text_density'
    | 'heading_hierarchy'
    | 'structured_table_or_pricing'
    | 'route_json_ld';
  label: string;
  passed: boolean;
  detail: string;
}

export interface SubPageBotInspectionReport {
  targetUrl: string;
  pathname: string;
  hostname: string;
  httpStatus: number | null;
  gptBotStatus: number | null;
  perplexityBotStatus: number | null;
  gptBotAllowed: boolean;
  perplexityBotAllowed: boolean;
  pageReadinessScore: number;
  title: string | null;
  metaDescription: string | null;
  canonicalHref: string | null;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  tableCount: number;
  jsonLdTypes: string[];
  extractedPriceMentions: string[];
  readability: CrawlerReadabilityReport;
  checks: SubPageCheckItem[];
  botExtractedPreview: string;
  aiPageOptimizationPrompt: EnforcedQualityArtifact;
}

export class SubPageInspectionError extends Error {
  public readonly code: 'INVALID_TARGET_URL' | 'CROSS_DOMAIN_BLOCKED';

  constructor(
    code: 'INVALID_TARGET_URL' | 'CROSS_DOMAIN_BLOCKED',
    message: string
  ) {
    super(message);
    this.name = 'SubPageInspectionError';
    this.code = code;
  }
}

export function resolveSafeSameDomainTargetUrl(
  trackedDomainUrl: string,
  targetPathOrUrl: string
): {
  targetUrl: string;
  pathname: string;
  hostname: string;
  baseHostname: string;
} {
  const base = normalizePublicDomain(trackedDomainUrl);
  const raw = targetPathOrUrl.trim();
  if (!raw) {
    throw new SubPageInspectionError(
      'INVALID_TARGET_URL',
      'Enter a path (e.g. /pricing) or a URL on your tracked domain.'
    );
  }

  if (/^(?:javascript|data|file|ftp|mailto):/i.test(raw)) {
    throw new SubPageInspectionError(
      'INVALID_TARGET_URL',
      'Only public HTTP/HTTPS paths on your tracked domain are supported.'
    );
  }

  let parsed: URL;
  try {
    if (raw.startsWith('/')) {
      if (raw.startsWith('//')) {
        throw new SubPageInspectionError(
          'INVALID_TARGET_URL',
          'Protocol-relative URLs are not permitted.'
        );
      }
      parsed = new URL(raw, base.origin);
    } else if (/^https?:\/\//i.test(raw)) {
      parsed = new URL(raw);
    } else if (raw.includes('.') && !raw.includes(' ')) {
      parsed = new URL(`https://${raw}`);
    } else {
      parsed = new URL(`/${raw.replace(/^\/+/, '')}`, base.origin);
    }
  } catch (err) {
    if (err instanceof SubPageInspectionError) throw err;
    throw new SubPageInspectionError(
      'INVALID_TARGET_URL',
      `Malformed URL or path: "${raw}"`
    );
  }

  if (parsed.username || parsed.password) {
    throw new SubPageInspectionError(
      'INVALID_TARGET_URL',
      'URLs containing embedded credentials are blocked.'
    );
  }

  let validatedHost: string;
  try {
    validatedHost = normalizePublicDomain(parsed.hostname).hostname;
  } catch (err) {
    throw new SubPageInspectionError(
      'INVALID_TARGET_URL',
      err instanceof Error ? err.message : 'Blocked non-public target host.'
    );
  }

  const rawParsedHost = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const isSameOrSubdomain =
    rawParsedHost === base.hostname ||
    rawParsedHost.endsWith(`.${base.hostname}`);

  if (!isSameOrSubdomain) {
    throw new SubPageInspectionError(
      'CROSS_DOMAIN_BLOCKED',
      `Target host "${validatedHost}" must match your tracked domain "${base.hostname}".`
    );
  }

  parsed.hash = '';
  const cleanOrigin = `https://${rawParsedHost}`;
  const cleanPath = parsed.pathname || '/';
  const finalUrl = `${cleanOrigin}${cleanPath}${parsed.search}`;

  return {
    targetUrl: finalUrl,
    pathname: `${cleanPath}${parsed.search}`,
    hostname: rawParsedHost,
    baseHostname: base.hostname,
  };
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');
}

function extractTagTexts(html: string, tag: 'h1' | 'h2' | 'h3', max = 8): string[] {
  const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null && results.length < max) {
    const cleaned = decodeHtmlEntities(
      (m[1] ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    );
    if (cleaned) results.push(cleaned);
  }
  return results;
}

function extractJsonLdTypesFromHtml(html: string): string[] {
  const foundTypes: string[] = [];
  const collectType = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    const rawType = obj['@type'];
    if (typeof rawType === 'string' && rawType.trim()) {
      foundTypes.push(rawType.trim());
    } else if (Array.isArray(rawType)) {
      for (const t of rawType) {
        if (typeof t === 'string' && t.trim()) foundTypes.push(t.trim());
      }
    }
    if (Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph']) collectType(item);
    }
  };

  const scriptRegex =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRegex.exec(html)) !== null) {
    const raw = m[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) collectType(item);
      } else {
        collectType(parsed);
      }
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  }

  return Array.from(new Set(foundTypes));
}

function buildBotExtractedStreamPreview(html: string): string {
  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  const structured = decodeHtmlEntities(
    withoutNoise
      .replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
      .replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
      .replace(/<table\b[^>]*>/gi, '\n[HTML TABLE START]\n')
      .replace(/<\/table>/gi, '\n[HTML TABLE END]\n')
      .replace(/<li\b[^>]*>/gi, '\n- ')
      .replace(/<\/(?:p|div|section|article|tr|li)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim()
  );

  if (!structured) {
    return '(Zero server-rendered body text extracted — non-JS AI crawlers see an empty shell on this URL.)';
  }

  return structured.length > 1500
    ? `${structured.slice(0, 1500).trim()}...`
    : structured;
}

export function analyzeHtmlForBotExtraction(params: {
  targetUrl: string;
  pathname: string;
  hostname: string;
  httpStatus: number | null;
  gptBotStatus: number | null;
  perplexityBotStatus: number | null;
  rawHtml: string;
  brandName: string;
  brandTruthSheet: BrandTruthSheet;
  isShopify?: boolean;
}): SubPageBotInspectionReport {
  const { rawHtml, brandName, brandTruthSheet } = params;
  const readability = analyzeCrawlerHtmlReadability(rawHtml);

  const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]
    ? decodeHtmlEntities(titleMatch[1].replace(/\s+/g, ' ').trim())
    : null;

  const descMatch =
    rawHtml.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
    ) ??
    rawHtml.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
    );
  const metaDescription = descMatch?.[1]
    ? decodeHtmlEntities(descMatch[1].replace(/\s+/g, ' ').trim())
    : null;

  const canonicalMatch =
    rawHtml.match(
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i
    ) ??
    rawHtml.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i
    );
  const canonicalHref = canonicalMatch?.[1]?.trim() ?? null;

  const headings = {
    h1: extractTagTexts(rawHtml, 'h1', 4),
    h2: extractTagTexts(rawHtml, 'h2', 8),
    h3: extractTagTexts(rawHtml, 'h3', 8),
  };

  const tableMatches = rawHtml.match(/<table\b/gi);
  const tableCount = tableMatches ? tableMatches.length : 0;
  const jsonLdTypes = extractJsonLdTypesFromHtml(rawHtml);

  const plainForPrices = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const extractedPriceMentions = Array.from(
    new Set(plainForPrices.match(/\$\d{1,5}(?:,\d{3})*(?:\.\d{2})?/g) ?? [])
  ).slice(0, 6);

  const gptBotAllowed =
    params.gptBotStatus !== null &&
    params.gptBotStatus >= 200 &&
    params.gptBotStatus < 400;
  const perplexityBotAllowed =
    params.perplexityBotStatus !== null &&
    params.perplexityBotStatus >= 200 &&
    params.perplexityBotStatus < 400;

  const checks: SubPageCheckItem[] = [
    {
      id: 'bot_http_access',
      label: 'GPTBot & PerplexityBot HTTP 200',
      passed: gptBotAllowed && perplexityBotAllowed,
      detail:
        gptBotAllowed && perplexityBotAllowed
          ? `GPTBot (${params.gptBotStatus}) & PerplexityBot (${params.perplexityBotStatus}) both received clean HTTP responses.`
          : `Crawler block or HTTP error detected (GPTBot: ${params.gptBotStatus ?? 'ERR'}, PerplexityBot: ${params.perplexityBotStatus ?? 'ERR'}).`,
    },
    {
      id: 'ssr_text_density',
      label: 'Server-Rendered Non-JS Copy',
      passed:
        readability.status === 'ssr_clean' && readability.visibleWordCount >= 80,
      detail:
        readability.status === 'ssr_clean' && readability.visibleWordCount >= 80
          ? `${readability.visibleWordCount.toLocaleString('en-US')} visible words (~${readability.estimatedTokens.toLocaleString('en-US')} tokens, ${readability.signalToHtmlPct}% signal) without JS.`
          : `${readability.visibleWordCount} visible words (${readability.status.replace(/_/g, ' ')}) — add server-rendered body copy so non-JS bots index this route.`,
    },
    {
      id: 'heading_hierarchy',
      label: 'H1 + Answer-First H2 Structure',
      passed: headings.h1.length >= 1 && headings.h2.length >= 2,
      detail:
        headings.h1.length >= 1 && headings.h2.length >= 2
          ? `${headings.h1.length} H1 and ${headings.h2.length} H2 section anchors extracted cleanly.`
          : `Found ${headings.h1.length} H1 and ${headings.h2.length} H2 tag(s) — add 1 clear H1 and 2+ buyer-question H2 headings.`,
    },
    {
      id: 'structured_table_or_pricing',
      label: 'Comparison <table> or Pricing Facts',
      passed: tableCount >= 1 || extractedPriceMentions.length >= 1,
      detail:
        tableCount >= 1 || extractedPriceMentions.length >= 1
          ? `${tableCount} HTML <table> element(s) · ${extractedPriceMentions.length} explicit price token(s) (${extractedPriceMentions.slice(0, 3).join(', ') || 'table rows'}).`
          : 'Zero HTML <table> matrices or explicit $ price tokens detected on this URL.',
    },
    {
      id: 'route_json_ld',
      label: 'Route-Level JSON-LD Schema',
      passed: jsonLdTypes.length >= 1,
      detail:
        jsonLdTypes.length >= 1
          ? `Detected schema.org node(s): ${jsonLdTypes.join(', ')}.`
          : 'Zero application/ld+json blocks detected on this URL — inject FAQPage, Product, or Service JSON-LD.',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const pageReadinessScore = Math.round((passedCount / checks.length) * 100);
  const botExtractedPreview = buildBotExtractedStreamPreview(rawHtml);

  const failingChecks = checks.filter((c) => !c.passed);
  const promptLines: string[] = [
    `# Sub-Page AI Search Optimization Prompt — ${brandName} (${params.pathname})`,
    '',
    params.isShopify
      ? `Act as a Senior Shopify Liquid & Technical SEO Engineer optimizing \`${params.targetUrl}\` for **${brandName}**. Upgrade this specific route so \`GPTBot\`, \`OAI-SearchBot\`, and \`PerplexityBot\` extract verified commercial facts without altering cart or checkout behavior.`
      : `Act as a Principal Full-Stack & Technical SEO Engineer optimizing \`${params.targetUrl}\` (\`${params.pathname}\`) for **${brandName}**. Upgrade this route in server-rendered HTML (\`SSR\`/\`SSG\`) so \`GPTBot\`, \`OAI-SearchBot\`, and \`PerplexityBot\` extract clean answers and schema.`,
    '',
    `## 1. Verified Brand Truth Guardrails (Never Invent Unlisted Claims)`,
    `- **Core Offering:** ${brandTruthSheet.core_offering || `${brandName} products and services.`}`,
    `- **Verified Pricing:** ${brandTruthSheet.verified_pricing_summary || `Refer strictly to published rates on ${params.hostname}.`}`,
    `- **Fulfillment / Coverage:** ${brandTruthSheet.shipping_or_service_area || `Refer strictly to published coverage on ${params.hostname}.`}`,
  ];

  if (brandTruthSheet.discontinued_or_false_claims_to_flag.length > 0) {
    promptLines.push(
      `- **Explicit Exclusions (Do Not Claim):** ${brandTruthSheet.discontinued_or_false_claims_to_flag.join(' | ')}`
    );
  }

  promptLines.push(
    '',
    `## 2. Live Bot Extraction Findings on \`${params.pathname}\` (${pageReadinessScore}/100 Readiness)`
  );

  if (failingChecks.length === 0) {
    promptLines.push(
      `- All 5 technical extraction checks passed (${readability.visibleWordCount} words, ${tableCount} HTML table(s), JSON-LD: ${jsonLdTypes.join(', ')}). Review visible copy to keep pricing and FAQ answers synchronized with \`/agents.md\`.`
    );
  } else {
    for (const fc of failingChecks) {
      promptLines.push(`- **[FIX REQUIRED · ${fc.label}]** ${fc.detail}`);
    }
  }

  promptLines.push(
    '',
    `## 3. Concrete Upgrades to Apply on \`${params.pathname}\``,
    `1. **Answer-First Lead Block:** Place a concise 40–55 word summary directly below the \`<h1>\` stating what ${brandName} provides on this page, exact pricing terms, and coverage scope.`,
    `2. **Semantic HTML \`<table>\`:** Add or preserve a server-rendered \`<table>\` summarizing plan tiers, SKU specs, or buyer evaluation criteria so Perplexity and ChatGPT Search can cite structured cells.`,
    `3. **Route-Specific \`FAQPage\` JSON-LD:** Inject a valid \`<script type="application/ld+json">\` \`FAQPage\` block matching 3 visible buyer Q&As on \`${params.pathname}\`, and verify with \`JSON.parse()\`.`
  );

  const aiPageOptimizationPrompt = enforceQualityGate95(
    promptLines.join('\n'),
    'agents_md'
  );

  return {
    targetUrl: params.targetUrl,
    pathname: params.pathname,
    hostname: params.hostname,
    httpStatus: params.httpStatus,
    gptBotStatus: params.gptBotStatus,
    perplexityBotStatus: params.perplexityBotStatus,
    gptBotAllowed,
    perplexityBotAllowed,
    pageReadinessScore,
    title,
    metaDescription,
    canonicalHref,
    headings,
    tableCount,
    jsonLdTypes,
    extractedPriceMentions,
    readability,
    checks,
    botExtractedPreview,
    aiPageOptimizationPrompt,
  };
}

async function fetchSameDomainWithRedirectGuard(
  trackedDomainUrl: string,
  initialUrl: string,
  userAgent: string,
  timeoutMs = 4500
): Promise<{ status: number | null; body: string }> {
  let currentUrl = initialUrl;
  for (let hop = 0; hop < 4; hop++) {
    try {
      const res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,text/markdown,text/plain,*/*',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) {
          return { status: res.status, body: '' };
        }
        const resolvedNext = new URL(loc, currentUrl).toString();
        // Re-validate redirect target against SSRF & same-domain boundary
        const validated = resolveSafeSameDomainTargetUrl(
          trackedDomainUrl,
          resolvedNext
        );
        currentUrl = validated.targetUrl;
        continue;
      }

      const body = await res.text();
      return { status: res.status, body };
    } catch (err) {
      if (err instanceof SubPageInspectionError) {
        return { status: 403, body: '' };
      }
      return { status: null, body: '' };
    }
  }
  return { status: null, body: '' };
}

export async function inspectSubPageForAiCrawlers(options: {
  trackedDomainUrl: string;
  targetPathOrUrl: string;
  brandName: string;
  brandTruthSheet: BrandTruthSheet;
  isShopify?: boolean;
  rawEnv?: RawEnvInput;
}): Promise<SubPageBotInspectionReport> {
  const env = resolveCoreGeoEnv(options.rawEnv);
  const resolved = resolveSafeSameDomainTargetUrl(
    options.trackedDomainUrl,
    options.targetPathOrUrl
  );

  const [gptProbe, pplxProbe] = await Promise.all([
    fetchSameDomainWithRedirectGuard(
      options.trackedDomainUrl,
      resolved.targetUrl,
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot'
    ),
    fetchSameDomainWithRedirectGuard(
      options.trackedDomainUrl,
      resolved.targetUrl,
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)'
    ),
  ]);

  let httpStatus = gptProbe.status ?? pplxProbe.status;
  let gptStatus = gptProbe.status;
  let pplxStatus = pplxProbe.status;
  let rawHtml = gptProbe.body || pplxProbe.body;

  // Deterministic offline fallback in mock mode when sandbox has no external internet
  if (httpStatus === null && env.providerMode === 'mock') {
    httpStatus = 200;
    gptStatus = 200;
    pplxStatus = 200;
    const sampleScriptLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': options.isShopify ? 'Product' : 'WebPage',
      name: `${options.brandName} — ${resolved.pathname}`,
    });
    rawHtml = `<!doctype html><html><head><title>${options.brandName} — ${resolved.pathname}</title><meta name="description" content="${options.brandTruthSheet.core_offering}" /><link rel="canonical" href="${resolved.targetUrl}" /><script type="application/ld+json">${sampleScriptLd}</script></head><body><main><h1>${options.brandName} (${resolved.pathname})</h1><p>${options.brandTruthSheet.core_offering} Published commercial terms: ${options.brandTruthSheet.verified_pricing_summary} Coverage and fulfillment: ${options.brandTruthSheet.shipping_or_service_area}</p><h2>Pricing &amp; Fulfillment Specifications</h2><table><tr><th>Specification</th><th>Verified Term</th></tr><tr><td>Pricing</td><td>${options.brandTruthSheet.verified_pricing_summary}</td></tr><tr><td>Coverage</td><td>${options.brandTruthSheet.shipping_or_service_area}</td></tr></table><h2>Buyer Frequently Asked Questions</h2><p>All commercial facts on ${resolved.pathname} are synchronized with our verified Brand Truth Sheet so AI search crawlers read accurate pricing and service rules without JavaScript execution.</p></main></body></html>`;
  }

  return analyzeHtmlForBotExtraction({
    targetUrl: resolved.targetUrl,
    pathname: resolved.pathname,
    hostname: resolved.hostname,
    httpStatus,
    gptBotStatus: gptStatus,
    perplexityBotStatus: pplxStatus,
    rawHtml,
    brandName: options.brandName,
    brandTruthSheet: options.brandTruthSheet,
    isShopify: options.isShopify,
  });
}
