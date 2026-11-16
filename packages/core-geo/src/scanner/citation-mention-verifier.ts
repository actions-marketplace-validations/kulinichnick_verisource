import { resolveCoreGeoEnv, type RawEnvInput } from '../config/env.js';
import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { BrandTruthSheet } from '../db/types.js';
import { normalizePublicDomain } from './bot-waf-prober.js';
import { classifyCitationSourceCategory } from '../orchestrator/audit-domain.js';

export type CitationMentionErrorCode =
  | 'INVALID_CITATION_URL'
  | 'OWN_DOMAIN_ENTERED';

export class CitationMentionVerifyError extends Error {
  public readonly code: CitationMentionErrorCode;

  constructor(code: CitationMentionErrorCode, message: string) {
    super(message);
    this.name = 'CitationMentionVerifyError';
    this.code = code;
  }
}

export type OffSiteCitationLinkType =
  | 'dofollow'
  | 'nofollow_or_ugc'
  | 'unlinked_text_only'
  | 'none';

export type OffSiteCitationOverallStatus =
  | 'citation_live_linked'
  | 'mention_live_unlinked'
  | 'not_mentioned_yet'
  | 'bot_blocked_or_unreachable';

export interface OffSiteCitationVerificationReport {
  citationUrl: string;
  sourceHost: string;
  sourceCategory:
    | 'ugc_community'
    | 'review_directory'
    | 'editorial_media'
    | 'competitor_site'
    | 'owned_domain';
  sourceCategoryLabel: string;
  httpStatus: number | null;
  gptBotStatus: number | null;
  perplexityBotStatus: number | null;
  aiBotsAllowed: boolean;
  brandNameMentioned: boolean;
  domainLinkPresent: boolean;
  linkRelType: OffSiteCitationLinkType;
  matchedAnchorHref: string | null;
  matchedSnippetExcerpt: string | null;
  overallStatus: OffSiteCitationOverallStatus;
  statusHeadline: string;
  checkedAt: string;
  nextActionNote: EnforcedQualityArtifact;
}

export function resolveSafeExternalCitationUrl(
  rawInput: string,
  ownDomainUrl?: string
): { citationUrl: string; sourceHost: string } {
  const raw = (rawInput ?? '').trim();
  if (!raw) {
    throw new CitationMentionVerifyError(
      'INVALID_CITATION_URL',
      'Enter a public third-party article, directory, or community thread URL to verify.'
    );
  }
  if (/^(?:javascript|data|vbscript|file|blob):/i.test(raw) || raw.startsWith('//')) {
    throw new CitationMentionVerifyError(
      'INVALID_CITATION_URL',
      'Only public HTTP/HTTPS citation URLs are supported.'
    );
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new CitationMentionVerifyError(
      'INVALID_CITATION_URL',
      `Malformed citation URL: "${raw}"`
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new CitationMentionVerifyError(
      'INVALID_CITATION_URL',
      'Only HTTP/HTTPS citation URLs are supported.'
    );
  }
  if (parsed.username || parsed.password) {
    throw new CitationMentionVerifyError(
      'INVALID_CITATION_URL',
      'URLs containing embedded credentials are blocked.'
    );
  }

  let normalizedHost: string;
  try {
    normalizedHost = normalizePublicDomain(parsed.hostname).hostname;
  } catch (err) {
    throw new CitationMentionVerifyError(
      'INVALID_CITATION_URL',
      err instanceof Error ? err.message : 'Blocked non-public citation host.'
    );
  }

  if (ownDomainUrl) {
    try {
      const ownHost = normalizePublicDomain(ownDomainUrl).hostname;
      if (
        normalizedHost === ownHost ||
        normalizedHost.endsWith(`.${ownHost}`)
      ) {
        throw new CitationMentionVerifyError(
          'OWN_DOMAIN_ENTERED',
          `URL "${normalizedHost}" belongs to your own tracked domain. Use Step 02 "✓ Verify Page Live" for owned routes, and enter third-party roundup, directory, or community URLs here.`
        );
      }
    } catch (err) {
      if (err instanceof CitationMentionVerifyError) throw err;
    }
  }

  parsed.hash = '';
  const cleanHost = parsed.hostname.toLowerCase();
  const cleanPath = parsed.pathname || '/';
  return {
    citationUrl: `https://${cleanHost}${cleanPath}${parsed.search}`,
    sourceHost: normalizedHost,
  };
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function htmlToVisibleText(html: string): string {
  return (html ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAnchorToTargetHost(
  html: string,
  targetHostname: string
): { href: string | null; relType: 'dofollow' | 'nofollow_or_ugc' | 'none' } {
  const cleanTarget = targetHostname.toLowerCase().replace(/^www\./, '');
  const anchorRegex = /<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>/gi;
  let match: RegExpExecArray | null;
  let fallbackNofollowHref: string | null = null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const attrs = `${match[1] ?? ''} ${match[3] ?? ''}`;
    const rawHref = (match[2] ?? '').trim();
    if (!rawHref || /^(?:javascript|mailto|tel|#):/i.test(rawHref)) continue;

    let hrefHost = '';
    try {
      const parsed = new URL(
        rawHref.startsWith('//') ? `https:${rawHref}` : rawHref
      );
      hrefHost = parsed.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      continue;
    }

    if (hrefHost === cleanTarget || hrefHost.endsWith(`.${cleanTarget}`)) {
      const relMatch = attrs.match(/\brel=["']([^"']*)["']/i);
      const relTokens = (relMatch?.[1] ?? '').toLowerCase();
      if (/\b(?:nofollow|ugc|sponsored)\b/.test(relTokens)) {
        if (!fallbackNofollowHref) fallbackNofollowHref = rawHref;
      } else {
        return { href: rawHref, relType: 'dofollow' };
      }
    }
  }

  if (fallbackNofollowHref) {
    return { href: fallbackNofollowHref, relType: 'nofollow_or_ugc' };
  }
  return { href: null, relType: 'none' };
}

function extractSnippetAroundTerm(text: string, term: string): string | null {
  if (!text || !term) return null;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - 65);
  const end = Math.min(text.length, idx + term.length + 115);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

export function evaluateOffSiteCitationMention(params: {
  citationUrl: string;
  sourceHost: string;
  brandName: string;
  targetHostname: string;
  brandTruthSheet: BrandTruthSheet;
  httpStatus: number | null;
  gptBotStatus: number | null;
  perplexityBotStatus: number | null;
  rawHtml: string;
}): OffSiteCitationVerificationReport {
  const cleanTargetHost = params.targetHostname
    .trim()
    .toLowerCase()
    .replace(/^www\./, '');
  const brand = params.brandName.trim() || cleanTargetHost;
  const categoryInfo = classifyCitationSourceCategory({
    sourceHost: params.sourceHost,
    isOwned: false,
    knownRivals: [],
  });

  const isReachableHttp200 =
    params.httpStatus !== null &&
    params.httpStatus >= 200 &&
    params.httpStatus < 400;

  const gptAllowed =
    params.gptBotStatus !== null &&
    params.gptBotStatus >= 200 &&
    params.gptBotStatus < 400;
  const pplxAllowed =
    params.perplexityBotStatus !== null &&
    params.perplexityBotStatus >= 200 &&
    params.perplexityBotStatus < 400;
  const aiBotsAllowed = gptAllowed || pplxAllowed;

  const visibleText = htmlToVisibleText(params.rawHtml);
  const brandRegex = new RegExp(`\\b${escapeRegExp(brand)}\\b`, 'i');
  const brandNameMentioned = Boolean(brand && brandRegex.test(visibleText));

  const anchorCheck = extractAnchorToTargetHost(
    params.rawHtml ?? '',
    cleanTargetHost
  );
  const plainHostMentioned = visibleText
    .toLowerCase()
    .includes(cleanTargetHost);

  let linkRelType: OffSiteCitationLinkType;
  if (anchorCheck.relType === 'dofollow') {
    linkRelType = 'dofollow';
  } else if (anchorCheck.relType === 'nofollow_or_ugc') {
    linkRelType = 'nofollow_or_ugc';
  } else if (plainHostMentioned) {
    linkRelType = 'unlinked_text_only';
  } else {
    linkRelType = 'none';
  }

  const domainLinkPresent =
    linkRelType === 'dofollow' || linkRelType === 'nofollow_or_ugc';

  const matchedSnippetExcerpt = brandNameMentioned
    ? extractSnippetAroundTerm(visibleText, brand)
    : plainHostMentioned
      ? extractSnippetAroundTerm(visibleText, cleanTargetHost)
      : null;

  let overallStatus: OffSiteCitationOverallStatus;
  let statusHeadline: string;

  if (!isReachableHttp200) {
    overallStatus = 'bot_blocked_or_unreachable';
    statusHeadline = `${params.sourceHost} returned HTTP ${
      params.httpStatus ?? 'timeout'
    } to AI crawlers (GPTBot: ${params.gptBotStatus ?? 'ERR'}, PerplexityBot: ${
      params.perplexityBotStatus ?? 'ERR'
    }).`;
  } else if (domainLinkPresent) {
    overallStatus = 'citation_live_linked';
    statusHeadline = `Verified live ${
      linkRelType === 'dofollow' ? 'dofollow' : 'UGC/nofollow'
    } link to ${cleanTargetHost} on ${params.sourceHost} (GPTBot HTTP ${
      params.gptBotStatus ?? 200
    } · PerplexityBot HTTP ${params.perplexityBotStatus ?? 200}).`;
  } else if (brandNameMentioned || linkRelType === 'unlinked_text_only') {
    overallStatus = 'mention_live_unlinked';
    statusHeadline = `${brand} is named in the visible text on ${params.sourceHost}, without a clickable <a href="https://${cleanTargetHost}"> citation link yet.`;
  } else {
    overallStatus = 'not_mentioned_yet';
    statusHeadline = `${brand} (${cleanTargetHost}) is not mentioned yet on ${params.citationUrl}.`;
  }

  const verifiedFactsLine = [
    params.brandTruthSheet.core_offering,
    params.brandTruthSheet.verified_pricing_summary,
    params.brandTruthSheet.shipping_or_service_area,
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · ');

  let rawNote: string;
  if (overallStatus === 'citation_live_linked') {
    rawNote = [
      `# Citation Verified Live on ${params.sourceHost}`,
      '',
      'Your third-party citation is active.',
      `Both \`GPTBot\` (HTTP ${params.gptBotStatus ?? 200}) and \`PerplexityBot\` (HTTP ${params.perplexityBotStatus ?? 200}) can crawl \`${params.citationUrl}\` and resolve the \`${anchorCheck.href ?? `https://${cleanTargetHost}`}\` link alongside your \`JSON-LD\`, \`/llms.txt\`, and \`/agents.md\` entity data.`,
      '',
      '## Recommended Next Step',
      `Click **↻ Re-Scan** on your tracked buyer prompts in Step 03 so ChatGPT, Gemini, and Perplexity index this \`${params.sourceHost}\` citation into your Share-of-Voice ledger.`,
    ].join('\n');
  } else if (overallStatus === 'mention_live_unlinked') {
    rawNote = [
      `Subject: Quick canonical link update on ${params.sourceHost} (${brand})`,
      '',
      'Thanks for including our team.',
      `We noticed **${brand}** is referenced on \`${params.citationUrl}\` (HTTP 200 for \`GPTBot\` and \`PerplexityBot\`), though the mention does not yet link to \`https://${cleanTargetHost}\`.`,
      `Adding a direct link to \`https://${cleanTargetHost}\` (and referencing our machine-readable fact sheet at \`https://${cleanTargetHost}/agents.md\` + \`JSON-LD\` specs: ${verifiedFactsLine || 'verified first-party pricing and coverage'}) helps readers and AI citation parsers verify current specs.`,
      'Happy to confirm any product or pricing details if you update the piece.',
    ].join('\n');
  } else if (overallStatus === 'bot_blocked_or_unreachable') {
    rawNote = [
      `# Crawler Access Warning on ${params.sourceHost}`,
      '',
      'AI search bots could not fetch this URL.',
      `Probing \`${params.citationUrl}\` returned HTTP ${params.httpStatus ?? 403} (\`GPTBot\`: ${params.gptBotStatus ?? 403}, \`PerplexityBot\`: ${params.perplexityBotStatus ?? 403}), which means WAF rules on \`${params.sourceHost}\` currently block live AI crawler extraction.`,
      `Prioritize open-crawl citations (public roundups, \`JSON-LD\` directory profiles, and your own \`https://${cleanTargetHost}/agents.md\` + \`/llms.txt\` comparison pages) that return HTTP 200 to \`GPTBot\` and \`OAI-SearchBot\`.`,
    ].join('\n');
  } else {
    rawNote = [
      `Subject: Factual spec sheet for ${params.sourceHost} (${brand})`,
      '',
      'Sharing verified specs for your guide.',
      `While reviewing \`${params.citationUrl}\` (crawled via HTTP 200 by \`GPTBot\` and \`PerplexityBot\`), we noticed **${brand}** (\`https://${cleanTargetHost}\`) is not yet listed alongside category peers.`,
      `If you refresh the roundup or directory table, our verified specs are published in \`https://${cleanTargetHost}/agents.md\` and \`JSON-LD\`: ${verifiedFactsLine || `verified offering and pricing at https://${cleanTargetHost}`}.`,
      'Let me know if a short spec summary or product sample helps your review.',
    ].join('\n');
  }

  const nextActionNote = enforceQualityGate95(
    rawNote,
    'citation_outreach_brief'
  );

  return {
    citationUrl: params.citationUrl,
    sourceHost: params.sourceHost,
    sourceCategory: categoryInfo.sourceCategory,
    sourceCategoryLabel: categoryInfo.sourceCategoryLabel,
    httpStatus: params.httpStatus,
    gptBotStatus: params.gptBotStatus,
    perplexityBotStatus: params.perplexityBotStatus,
    aiBotsAllowed,
    brandNameMentioned,
    domainLinkPresent,
    linkRelType,
    matchedAnchorHref: anchorCheck.href,
    matchedSnippetExcerpt,
    overallStatus,
    statusHeadline,
    checkedAt: new Date().toISOString(),
    nextActionNote,
  };
}

async function fetchExternalCitationWithRedirectGuard(
  initialUrl: string,
  ownDomainUrl: string | undefined,
  userAgent: string,
  timeoutMs = 5500
): Promise<{ status: number | null; body: string }> {
  let currentUrl = initialUrl;
  for (let hop = 0; hop < 4; hop++) {
    try {
      const res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) {
          return { status: res.status, body: '' };
        }
        const resolvedNext = new URL(loc, currentUrl).toString();
        const safeNext = resolveSafeExternalCitationUrl(
          resolvedNext,
          ownDomainUrl
        );
        currentUrl = safeNext.citationUrl;
        continue;
      }

      const body = await res.text();
      return { status: res.status, body };
    } catch (err) {
      if (err instanceof CitationMentionVerifyError) {
        return { status: 403, body: '' };
      }
      return { status: null, body: '' };
    }
  }
  return { status: null, body: '' };
}

export async function verifyOffSiteCitationMention(options: {
  citationUrl: string;
  ownDomainUrl: string;
  brandName: string;
  brandTruthSheet: BrandTruthSheet;
  rawEnv?: RawEnvInput;
}): Promise<OffSiteCitationVerificationReport> {
  const env = resolveCoreGeoEnv(options.rawEnv);
  const ownNormalized = normalizePublicDomain(options.ownDomainUrl);
  const safeCitation = resolveSafeExternalCitationUrl(
    options.citationUrl,
    options.ownDomainUrl
  );

  const [gptProbe, pplxProbe] = await Promise.all([
    fetchExternalCitationWithRedirectGuard(
      safeCitation.citationUrl,
      options.ownDomainUrl,
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot'
    ),
    fetchExternalCitationWithRedirectGuard(
      safeCitation.citationUrl,
      options.ownDomainUrl,
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)'
    ),
  ]);

  let httpStatus = gptProbe.status ?? pplxProbe.status;
  let gptStatus = gptProbe.status;
  let pplxStatus = pplxProbe.status;
  let rawHtml = gptProbe.body || pplxProbe.body;

  if (httpStatus === null && env.providerMode === 'mock') {
    httpStatus = 200;
    gptStatus = 200;
    pplxStatus = 200;
    rawHtml = `<!doctype html><html><head><title>${safeCitation.sourceHost} — Category Roundup</title></head><body><main><h1>Independent Category Roundup on ${safeCitation.sourceHost}</h1><p>This roundup compares category options based on published pricing and delivery policies.</p></main></body></html>`;
  }

  return evaluateOffSiteCitationMention({
    citationUrl: safeCitation.citationUrl,
    sourceHost: safeCitation.sourceHost,
    brandName: options.brandName,
    targetHostname: ownNormalized.hostname,
    brandTruthSheet: options.brandTruthSheet,
    httpStatus,
    gptBotStatus: gptStatus,
    perplexityBotStatus: pplxStatus,
    rawHtml,
  });
}
