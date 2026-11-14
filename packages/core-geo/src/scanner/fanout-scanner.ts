import Perplexity, { type Responses } from '@perplexity-ai/perplexity_ai';
import type { CoreGeoEnv } from '../config/env.js';
import type {
  AiEngine,
  BrandTruthSheet,
  FanoutTelemetryType,
  HallucinationDetail,
} from '../db/types.js';
import {
  PATIENT_ZERO_DOMAINS,
  PATIENT_ZERO_PROMPTS,
  PATIENT_ZERO_SNAPSHOTS,
} from '../fixtures/patient-zero.js';
import { classifyIndustryVertical } from '../generator/fix-generator.js';
import { detectHallucinations } from '../watchdog/hallucination-watchdog.js';
import type { NormalizedDomain } from './bot-waf-prober.js';

export interface PerplexityAgentQueryOptions {
  input: string;
  apiKey?: string;
  effort?: 'fast' | 'low' | 'medium' | 'high' | 'xhigh' | 'ultra';
  model?: string;
  instructions?: string;
  previousResponseId?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
}

export interface PerplexityAgentGroundedAnswer {
  id: string;
  model: string;
  effort?: string;
  outputText: string;
  decompiledFanoutQueries: string[];
  citedUrls: string[];
  sourceTitles: string[];
  fanoutTelemetryType: FanoutTelemetryType;
}

export interface EngineScanResult {
  promptText: string;
  aiEngine: AiEngine;
  brandMentioned: boolean;
  citationRank: number | null;
  competitorsMentioned: string[];
  citedSourceUrls: string[];
  decompiledFanoutQueries: string[];
  fanoutTelemetryType: FanoutTelemetryType;
  hallucinationDetected: boolean;
  hallucinationDetails: HallucinationDetail[];
  rawAnswerExcerpt: string;
}

const LEADING_SLOGAN_PREFIX =
  /^(?:welcome\s+to\s+|discover\s+|meet\s+|introducing\s+|experience\s+|explore\s+|a\s+collection\s+of\s+(?:powerful\s+)?|the\s+all-in-one\s+|your\s+all-in-one\s+|all-in-one\s+|purpose-built\s+for\s+|built\s+for\s+|designed\s+for\s+|the\s+leading\s+|leading\s+|the\s+modern\s+|the\s+|a\s+|an\s+)+/i;

const TRAILING_DANGLING_WORDS =
  /\s+(?:with|for|and|or|in|on|at|to|of|from|by|within|into|across|through|a|an|the|your|our|their)$/i;

const PRESERVED_ACRONYMS = new Set([
  'AI',
  'API',
  'AWS',
  'B2B',
  'B2C',
  'CMS',
  'CPA',
  'CRM',
  'CSS',
  'D2C',
  'DNS',
  'ERP',
  'GEO',
  'GPU',
  'HR',
  'HTML',
  'HTTP',
  'HVAC',
  'IDE',
  'IT',
  'JSON',
  'LLM',
  'MCP',
  'MD',
  'MO',
  'PR',
  'QA',
  'ROI',
  'RPA',
  'SDK',
  'SEO',
  'SKU',
  'SMB',
  'SQL',
  'SSO',
  'UCP',
  'UI',
  'UK',
  'URL',
  'US',
  'USA',
  'UX',
  'VPN',
  'WAF',
]);

export function extractCleanCategoryTopic(
  coreOffering: string,
  brandName: string,
  maxChars = 54
): string {
  let cleaned = coreOffering
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  // Strip "<BrandName> is a/an/the ..." or "<BrandName> offers/provides/helps ..."
  const escapedBrand = brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (escapedBrand.length >= 2) {
    cleaned = cleaned.replace(
      new RegExp(
        `^${escapedBrand}\\s+(?:is\\s+(?:a|an|the)\\s+|offers\\s+|provides\\s+|delivers\\s+|builds\\s+)?`,
        'i'
      ),
      ''
    );
  }

  // Take first clause before sentence-ending punctuation or em-dash/pipe
  cleaned = cleaned.split(/[.;!?|—–]/)[0]?.trim() ?? '';
  cleaned = cleaned.replace(LEADING_SLOGAN_PREFIX, '').trim();

  // Truncate strictly at whole-word boundaries (never mid-word)
  if (cleaned.length > maxChars) {
    const words = cleaned.split(/\s+/);
    let acc = '';
    for (const word of words) {
      const next = acc ? `${acc} ${word}` : word;
      if (next.length > maxChars) break;
      acc = next;
    }
    cleaned = acc || words[0]?.slice(0, maxChars) || '';
  }

  // Strip trailing dangling prepositions/articles/conjunctions repeatedly
  let prev = '';
  while (cleaned && cleaned !== prev) {
    prev = cleaned;
    cleaned = cleaned.replace(/[,:;/-]+$/, '').replace(TRAILING_DANGLING_WORDS, '').trim();
  }

  // Lowercase leading common English capitalized word unless it is an acronym or matches brandName
  const tokens = cleaned.split(/\s+/);
  const firstToken = tokens[0] ?? '';
  const bareFirst = firstToken.replace(/[^A-Za-z0-9]/g, '');
  const brandFirst = (brandName.split(/\s+/)[0] ?? '').replace(/[^A-Za-z0-9]/g, '');
  if (
    bareFirst.length >= 2 &&
    /^[A-Z][a-z]+$/.test(bareFirst) &&
    !PRESERVED_ACRONYMS.has(bareFirst.toUpperCase()) &&
    bareFirst.toLowerCase() !== brandFirst.toLowerCase()
  ) {
    tokens[0] = firstToken[0]!.toLowerCase() + firstToken.slice(1);
    cleaned = tokens.join(' ');
  }

  return cleaned.length >= 6 ? cleaned : '';
}

export function generateDefaultPromptsForDomain(
  domain: NormalizedDomain,
  brandName: string,
  coreOffering: string,
  isShopify?: boolean
): string[] {
  const fixtureDomain = PATIENT_ZERO_DOMAINS.find((d) =>
    d.domain_url.toLowerCase().includes(domain.hostname)
  );
  if (fixtureDomain) {
    const seeded = PATIENT_ZERO_PROMPTS.filter(
      (p) => p.domain_id === fixtureDomain.id
    ).map((p) => p.prompt_text);
    if (seeded.length > 0) return seeded;
  }

  const vertical = classifyIndustryVertical({
    hostname: domain.hostname,
    brandName,
    coreOffering,
    isShopify,
  });

  if (vertical.industryVertical === 'legal_service') {
    return [
      `Top trial and injury law firms — how does ${brandName} compare to top alternatives?`,
      `${brandName} attorney reviews, fee structure, and practice areas`,
      `Which law firms do clients recommend for complex injury or commercial litigation?`,
    ];
  }
  if (vertical.industryVertical === 'dental_group') {
    return [
      `Best modern dental studios for implants, Invisalign, and cleanings — how does ${brandName} compare to alternatives?`,
      `${brandName} dental reviews, insurance coverage, and transparent pricing`,
      `Which multi-location dental studio brands compete directly with ${brandName}?`,
    ];
  }
  if (vertical.industryVertical === 'medspa_clinic') {
    return [
      `Most trusted medical aesthetic clinics and MedSpas — how does ${brandName} compare to top alternatives?`,
      `${brandName} reviews, clinician credentials, and membership pricing`,
      `Which medical aesthetics and MedSpa clinic brands compete directly with ${brandName}?`,
    ];
  }
  if (vertical.industryVertical === 'hvac_home_service') {
    return [
      `Most reliable AC repair, heating, and plumbing companies — how does ${brandName} compare to alternatives?`,
      `${brandName} HVAC service area, emergency dispatch, and upfront pricing`,
      `Top residential HVAC and plumbing companies competing with ${brandName}`,
    ];
  }
  if (vertical.industryVertical === 'roofing_contractor') {
    return [
      `Best commercial and residential roofing contractors — how does ${brandName} compare to top alternatives?`,
      `${brandName} roof replacement inspections, materials, and service regions`,
      `Top roofing contractors compared directly against ${brandName}`,
    ];
  }

  const cleanTopic = extractCleanCategoryTopic(coreOffering, brandName);

  if (vertical.industryVertical === 'shopify_commerce') {
    return [
      cleanTopic
        ? `Best ${cleanTopic} brands online — how does ${brandName} compare on pricing and quality?`
        : `${brandName} vs top online alternatives — reviews, pricing, and shipping`,
      `${brandName} product quality, shipping rules, and top alternatives`,
      `Which competing brands do shoppers compare directly against ${brandName}?`,
    ];
  }

  if (vertical.industryVertical === 'b2b_agency') {
    return [
      cleanTopic
        ? `Top agencies for ${cleanTopic} — how does ${brandName} compare to alternatives?`
        : `${brandName} agency reviews, retainers, and top alternatives`,
      `${brandName} client reviews, retainer structure, and top agency alternatives`,
      cleanTopic
        ? `Which B2B agencies do growth teams recommend for ${cleanTopic}?`
        : `Top B2B agencies compared alongside ${brandName}`,
    ];
  }

  const topicHasCategoryNoun =
    /\b(?:tools?|software|platforms?|apps?|launchers?|analytics|crm|ide|services?|systems?|providers?|solutions?)\b/i.test(
      cleanTopic
    );

  return [
    cleanTopic
      ? topicHasCategoryNoun
        ? `Best ${cleanTopic} — how does ${brandName} compare to top alternatives?`
        : `Best software for ${cleanTopic} — how does ${brandName} compare to top alternatives?`
      : `${brandName} vs top alternatives — pricing, features, and buyer reviews`,
    `${brandName} reviews, pricing, and top alternatives`,
    cleanTopic
      ? `What do teams recommend for ${cleanTopic} alongside ${brandName}?`
      : `Top alternatives and competitors to ${brandName}`,
  ];
}

const IGNORED_CITATION_HOSTS = new Set([
  'vertexaisearch.cloud.google.com',
  'google.com',
  'bing.com',
  'youtube.com',
  'youtu.be',
  'wikipedia.org',
  'en.wikipedia.org',
  'amazon.com',
  'walmart.com',
  'target.com',
  'ebay.com',
  'etsy.com',
  'faire.com',
  'apps.apple.com',
  'apple.com',
  'play.google.com',
  'chromewebstore.google.com',
]);

const EDITORIAL_AND_DIRECTORY_HOSTS = new Set([
  'g2.com',
  'capterra.com',
  'getapp.com',
  'softwareadvice.com',
  'trustradius.com',
  'trustpilot.com',
  'gartner.com',
  'peerspot.com',
  'sourceforge.net',
  'slashdot.org',
  'producthunt.com',
  'alternativeto.net',
  'slant.co',
  'stackshare.io',
  'clutch.co',
  'upcity.com',
  'designrush.com',
  'goodfirms.co',
  'yelp.com',
  'bbb.org',
  'angi.com',
  'homeadvisor.com',
  'thumbtack.com',
  'houzz.com',
  'porch.com',
  'bark.com',
  'expertise.com',
  'threebestrated.com',
  'martindale.com',
  'avvo.com',
  'justia.com',
  'findlaw.com',
  'superlawyers.com',
  'bestlawfirms.com',
  'lawyers.com',
  'zocdoc.com',
  'healthgrades.com',
  'vitals.com',
  'webmd.com',
  'realself.com',
  'reddit.com',
  'old.reddit.com',
  'quora.com',
  'medium.com',
  'substack.com',
  'dev.to',
  'news.ycombinator.com',
  'forbes.com',
  'techcrunch.com',
  'wired.com',
  'theverge.com',
  'pcmag.com',
  'techradar.com',
  'cnet.com',
  'zdnet.com',
  'tomsguide.com',
  'nytimes.com',
  'wsj.com',
  'bloomberg.com',
  'businessinsider.com',
  'fastcompany.com',
  'inc.com',
  'entrepreneur.com',
  'thedigitalprojectmanager.com',
  'directree.io',
  'softwarecompare.net',
  'buildstacktools.com',
  'toolradar.dev',
  'aiintelreport.com',
  'saasworthy.com',
  'crozdesk.com',
  'softwareworld.co',
  'financesonline.com',
  'selecthub.com',
  'citehawk.com',
  'brandtested.com',
  'deal.ai',
  'medspastandard.com',
  'cceonlinenews.com',
  'thedesigntourist.com',
  'baristapath.com',
  'dtcetc.com',
  'linkedin.com',
  'facebook.com',
  'instagram.com',
  'x.com',
  'twitter.com',
  'tiktok.com',
  'github.com',
  'npmjs.com',
  'pypi.org',
]);

const DIRECTORY_HOST_PATTERN =
  /(?:toolify|toolglance|toolpilot|toolfinder|devstools|saaspic|saashub|saasgenius|saasworthy|aitools?|topai|futurepedia|futuretools|theresanaiforthat|happyvalley|compare|comparison|directory|directree|review|reviews|report|reports|radar|guide|guides|top10|bestof|softwareworld|crozdesk|listicle|rankings?|citehawk|brandtested)/i;

const EDITORIAL_PATH_PATTERN =
  /\/(?:blog|blogs|articles?|news|guides?|comparisons?|best-[a-z0-9-]+|top-\d+-[a-z0-9-]+)(?:\/|$)/i;

const GENERIC_BOLD_HEADINGS = new Set([
  'pros',
  'cons',
  'pricing',
  'price',
  'cost',
  'free',
  'free plan',
  'free tier',
  'pro',
  'pro plan',
  'team',
  'team plan',
  'starter',
  'enterprise',
  'overview',
  'summary',
  'verdict',
  'conclusion',
  'bottom line',
  'key features',
  'features',
  'best for',
  'ideal for',
  'who it is for',
  'why choose',
  'alternatives',
  'top alternatives',
  'top picks',
  'comparison',
  'how it compares',
  'rating',
  'reviews',
  'shipping',
  'shipping and returns',
  'returns',
  'delivery',
  'support',
  'integrations',
  'security',
  'tool',
  'tools',
  'product',
  'products',
  'platform',
  'platforms',
  'service',
  'services',
  'agency',
  'agencies',
  'clinic',
  'clinics',
  'medspa',
  'medspas',
  'studio',
  'studios',
  'contractor',
  'contractors',
  'company',
  'companies',
  'firm',
  'firms',
  'law firm',
  'practice',
  'need',
  'needs',
  'treatment',
  'treatments',
  'procedure',
  'procedures',
  'feature',
  'category',
  'plan',
  'tier',
  'vendor',
  'vendors',
  'brand',
  'brands',
  'provider',
  'providers',
  'metric',
  'criteria',
  'option',
  'options',
  'competitor',
  'competitors',
  'alternative',
  'alternatives to consider',
  'who should use',
  'when to choose',
  'aspect',
  'factor',
  'dimension',
  'coverage',
  'specialty',
  'focus',
  'locations',
  'reputation',
  'credentials',
  'transparency',
  'os',
  'strengths',
  'limitations',
  'weaknesses',
  'use case',
  'target user',
  'note',
  'important',
]);

const ENTITY_TABLE_HEADER_PATTERN =
  /^(?:brands?|compan(?:y|ies)|vendors?|providers?|tools?|platforms?|products?|apps?|software|services?|agenc(?:y|ies)|firms?|law firms?|clinics?|medspas?|studios?|dental(?: groups?| studios?)?|contractors?|roasters?|competitors?|alternatives?|options?|peers?|players?|names?)$/i;

const NON_BRAND_TREATMENT_OR_GENERIC_TERM =
  /\b(?:photofacial|fillers?|botox|dysport|invisalign|implants?|cleanings?|whitening|veneers?|extractions?|crowns?|root canal|shingles?|gutters?|siding|tune-ups?|repairs?|installations?|inspections?|warrant(?:y|ies)|insurance|consultations?|memberships?|packages?|retainers?|litigation|emergency dispatch|upfront pricing)\b/i;

function isDirectoryOrEditorialHost(host: string, rawUrl?: string): boolean {
  const hostStem = host.split('.')[0] ?? host;
  if (
    IGNORED_CITATION_HOSTS.has(host) ||
    EDITORIAL_AND_DIRECTORY_HOSTS.has(host) ||
    DIRECTORY_HOST_PATTERN.test(hostStem)
  ) {
    return true;
  }
  for (const dir of EDITORIAL_AND_DIRECTORY_HOSTS) {
    if (host.endsWith(`.${dir}`)) return true;
  }
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (EDITORIAL_PATH_PATTERN.test(parsed.pathname)) return true;
    } catch {
      // Ignore malformed URL
    }
  }
  return false;
}

export function extractNamedRivalsFromAnswerText(
  answerText: string,
  brandName: string,
  targetHostname: string
): string[] {
  if (!answerText) return [];
  const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hostRoot = (targetHostname.toLowerCase().split('.')[0] ?? '').replace(
    /[^a-z0-9]/g,
    ''
  );
  const rivals: string[] = [];
  const seenLower = new Set<string>();

  const maybeAddCandidate = (rawCandidate: string) => {
    const parts = /\s+or\s+/i.test(rawCandidate)
      ? rawCandidate.split(/\s+or\s+/i)
      : [rawCandidate];

    for (const part of parts) {
      const candidate = part
        .replace(/^\*+|\*+$/g, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/\s*\([^)]*\)\s*$/, '')
        .replace(/\[\d+\]/g, '')
        .replace(/[:—–\\-]+$/, '')
        .trim();
      if (candidate.length < 2 || candidate.length > 26) continue;
      if (!/^[A-Z0-9]/.test(candidate)) continue;
      if (
        /^(?:how|what|why|when|where|which|who|key|top|best|final|overall|quick|direct|main|core|pricing|summary)\b/i.test(
          candidate
        )
      ) {
        continue;
      }
      if (NON_BRAND_TREATMENT_OR_GENERIC_TERM.test(candidate)) {
        continue;
      }

      const lower = candidate.toLowerCase();
      const slug = lower.replace(/[^a-z0-9]/g, '');
      if (!slug || GENERIC_BOLD_HEADINGS.has(lower)) continue;
      if (
        (brandSlug.length >= 3 &&
          (slug === brandSlug ||
            slug.includes(brandSlug) ||
            brandSlug.includes(slug))) ||
        (hostRoot.length >= 3 && slug === hostRoot)
      ) {
        continue;
      }
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        rivals.push(candidate);
      }
    }
  };

  // 1. Markdown list-item leads: "- **Alfred**: ...", "1. **GrowthBook** — ...", "**1. Alfred**"
  const listLeadRegex =
    /(?:^|\n)\s*(?:(?:#{2,4}\s*)?(?:\d+[.)]\s*|[-*•]\s+))?\*\*((?:\d+[.)]\s*)?[A-Z0-9][A-Za-z0-9.+&/-]*(?:\s+[A-Za-z0-9.+&/-]+){0,2})\*\*(?=\s*(?:[:—–(-]|\n|$))/g;
  let match: RegExpExecArray | null;
  while ((match = listLeadRegex.exec(answerText)) !== null) {
    maybeAddCandidate(match[1] ?? '');
  }

  // 2. Numbered Markdown subheadings: "### 1. Alfred", "## 2. LaunchBar"
  const numberedHeadingRegex =
    /(?:^|\n)\s*#{2,4}\s+\d+[.)]\s*\*?\*?([A-Z0-9][A-Za-z0-9.+&/-]*(?:\s+[A-Za-z0-9.+&/-]+){0,2})\*?\*?/g;
  while ((match = numberedHeadingRegex.exec(answerText)) !== null) {
    maybeAddCandidate(match[1] ?? '');
  }

  const extractFirstTableCell = (tableLine: string): string => {
    const unescaped = tableLine.replace(/\\\|/g, '\u0000');
    const first = unescaped.split('|')[1] ?? '';
    return first.replace(/\u0000/g, '|').replace(/\*+/g, '').trim();
  };

  // 3. Markdown comparison tables: skip header rows above `| --- |` and skip non-entity treatment/attribute tables
  const lines = answerText.split('\n');
  for (let i = 0; i < lines.length - 1; i += 1) {
    const headerLine = lines[i]?.trim() ?? '';
    const sepLine = lines[i + 1]?.trim() ?? '';
    if (
      !headerLine.startsWith('|') ||
      !/^\|[\s:|=-]*-+[\s:|=-]*\|/.test(sepLine)
    ) {
      continue;
    }

    const headerFirstCell = extractFirstTableCell(headerLine);

    const dataFirstCells: string[] = [];
    let j = i + 2;
    while (j < lines.length) {
      const rowLine = lines[j]?.trim() ?? '';
      if (!rowLine.startsWith('|')) break;
      const cell = extractFirstTableCell(rowLine);
      if (cell && !/^[-:=]+$/.test(cell)) {
        dataFirstCells.push(cell);
      }
      j += 1;
    }
    i = j - 1;

    const tableIncludesTargetBrand = dataFirstCells.some((c) => {
      const cellSlug = c.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        (brandSlug.length >= 3 &&
          (cellSlug === brandSlug || cellSlug.includes(brandSlug))) ||
        (hostRoot.length >= 3 && cellSlug === hostRoot)
      );
    });

    if (
      ENTITY_TABLE_HEADER_PATTERN.test(headerFirstCell) ||
      tableIncludesTargetBrand
    ) {
      for (const cell of dataFirstCells) {
        const wordTokens = cell
          .split(/\s+/)
          .filter((t) => /[A-Za-z0-9]/.test(t));
        if (wordTokens.length <= 4) {
          maybeAddCandidate(cell);
        }
      }
    }
  }

  return rivals.slice(0, 5);
}

export function extractCompetitorsFromAnswerAndCitations(params: {
  targetHostname: string;
  brandName: string;
  answerText: string;
  urls: string[];
  titles?: string[];
}): string[] {
  const cleanTarget = params.targetHostname
    .toLowerCase()
    .replace(/^www\./, '');
  const results: string[] = [];
  const seenKeys = new Set<string>();

  const pushUnique = (label: string) => {
    const key = label
      .toLowerCase()
      .replace(/^www\./, '')
      .replace(/\.[a-z]{2,}$/, '')
      .replace(/[^a-z0-9]/g, '');
    if (!key || seenKeys.has(key)) return;
    seenKeys.add(key);
    results.push(label);
  };

  // 1. Named rival brands explicitly structured as alternatives in LLM answer text
  for (const named of extractNamedRivalsFromAnswerText(
    params.answerText,
    params.brandName,
    cleanTarget
  )) {
    pushUnique(named);
  }

  // 2. Direct peer product/company domains (excluding review directories, social sites, and editorial blogs)
  for (const rawUrl of params.urls) {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      if (
        !host ||
        host === cleanTarget ||
        host.endsWith(`.${cleanTarget}`) ||
        isDirectoryOrEditorialHost(host, rawUrl)
      ) {
        continue;
      }
      pushUnique(host);
    } catch {
      // Ignore malformed URLs
    }
  }

  // 3. Fallback: if fewer than 2 direct rivals were identified, include top non-target cited hosts so context is never empty
  if (results.length < 2) {
    for (const fallbackHost of extractCompetingHostsFromCitations(
      cleanTarget,
      params.urls,
      params.titles ?? []
    )) {
      pushUnique(fallbackHost);
    }
  }

  return results.slice(0, 5);
}

export function extractCompetingHostsFromCitations(
  targetHostname: string,
  urls: string[],
  titles: string[] = []
): string[] {
  const cleanTarget = targetHostname.toLowerCase().replace(/^www\./, '');
  const seen = new Set<string>();
  const rivals: string[] = [];

  const maybePushHost = (candidateRaw: string) => {
    const host = candidateRaw.trim().toLowerCase().replace(/^www\./, '');
    if (!host || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return;
    if (
      host === cleanTarget ||
      host.endsWith(`.${cleanTarget}`) ||
      IGNORED_CITATION_HOSTS.has(host)
    ) {
      return;
    }
    if (!seen.has(host)) {
      seen.add(host);
      rivals.push(host);
    }
  };

  for (const title of titles) {
    maybePushHost(title);
  }

  for (const rawUrl of urls) {
    try {
      const parsed = new URL(rawUrl);
      maybePushHost(parsed.hostname);
    } catch {
      // Ignore malformed URLs
    }
  }

  return rivals.slice(0, 5);
}

function extractMentionAndRank(
  answerText: string,
  brandName: string,
  hostname: string,
  citedUrls: string[]
): { mentioned: boolean; rank: number | null } {
  const lower = answerText.toLowerCase();
  const brandLower = brandName.toLowerCase();
  const mentionedInText =
    lower.includes(brandLower) || lower.includes(hostname.toLowerCase());

  const urlRankIdx = citedUrls.findIndex((u) =>
    u.toLowerCase().includes(hostname.toLowerCase())
  );
  if (urlRankIdx !== -1) {
    return { mentioned: true, rank: urlRankIdx + 1 };
  }
  if (mentionedInText) {
    return { mentioned: true, rank: 2 };
  }
  return { mentioned: false, rank: null };
}

async function fetchJsonWith429Retry(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const attempt = async () =>
    fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });

  const first = await attempt();
  if (first.status !== 429) return first;

  const retryAfterRaw = first.headers.get('retry-after');
  const retryAfterSec = retryAfterRaw ? Number.parseFloat(retryAfterRaw) : 1;
  const delayMs = Number.isFinite(retryAfterSec)
    ? Math.min(3000, Math.max(250, Math.round(retryAfterSec * 1000)))
    : 1000;

  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return attempt();
}

export function parsePerplexityAgentResponse(
  response: Responses.ResponseCreateResponse
): PerplexityAgentGroundedAnswer {
  const fanoutQueries: string[] = [];
  const inlineCitedUrls: string[] = [];
  const searchResultUrls: string[] = [];
  const sourceTitles: string[] = [];
  let fallbackMessageText = '';

  for (const item of response.output ?? []) {
    if (item.type === 'search_results') {
      for (const q of item.queries ?? []) {
        const trimmed = q.trim();
        if (trimmed && !fanoutQueries.includes(trimmed)) {
          fanoutQueries.push(trimmed);
        }
      }
      for (const res of item.results ?? []) {
        if (res.url) searchResultUrls.push(res.url);
        if (res.title) sourceTitles.push(res.title);
      }
    } else if (item.type === 'message') {
      for (const part of item.content ?? []) {
        if (part.type === 'output_text' && part.text) {
          fallbackMessageText += `${part.text} `;
        }
        for (const ann of part.annotations ?? []) {
          if (ann.url) inlineCitedUrls.push(ann.url);
          if (ann.title) sourceTitles.push(ann.title);
        }
      }
    }
  }

  const outputText = (response.output_text || fallbackMessageText).trim();
  const citedUrls = Array.from(
    new Set([...inlineCitedUrls, ...searchResultUrls])
  ).slice(0, 8);

  return {
    id: response.id,
    model: response.model,
    effort: response.effort,
    outputText,
    decompiledFanoutQueries: fanoutQueries,
    citedUrls,
    sourceTitles: Array.from(new Set(sourceTitles)),
    fanoutTelemetryType:
      fanoutQueries.length > 0 ? 'observed_query' : 'cited_source_only',
  };
}

export async function runPerplexityAgentQuery(
  options: PerplexityAgentQueryOptions
): Promise<PerplexityAgentGroundedAnswer> {
  const envKey =
    typeof process !== 'undefined' && process.env
      ? process.env.PERPLEXITY_API_KEY
      : undefined;
  const resolvedKey = (options.apiKey ?? envKey ?? '').trim();

  if (!resolvedKey) {
    throw new Error(
      'Missing PERPLEXITY_API_KEY. Create an API key in https://console.perplexity.ai and export PERPLEXITY_API_KEY in your terminal.'
    );
  }

  const client = new Perplexity({
    apiKey: resolvedKey,
    timeout: options.timeoutMs ?? 15000,
    maxRetries: options.maxRetries ?? 2,
    ...(options.fetchImpl ? { fetch: options.fetchImpl } : {}),
  });

  const requestBody: Responses.ResponseCreateParamsNonStreaming = {
    input: options.input,
    tools: [{ type: 'web_search' }],
  };

  if (options.model) {
    requestBody.model = options.model;
    if (options.effort) {
      requestBody.effort = options.effort;
    }
  } else {
    requestBody.effort = options.effort ?? 'fast';
  }

  if (options.instructions) {
    requestBody.instructions = options.instructions;
  }
  if (options.previousResponseId) {
    requestBody.previous_response_id = options.previousResponseId;
  }

  const response = await client.responses.create(requestBody);
  return parsePerplexityAgentResponse(response);
}

async function scanWithGeminiLive(
  promptText: string,
  domain: NormalizedDomain,
  brandName: string,
  truthSheet: BrandTruthSheet,
  apiKey: string
): Promise<EngineScanResult | null> {
  try {
    const response = await fetchJsonWith429Retry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          tools: [{ google_search: {} }],
        }),
      },
      16000
    );
    if (!response.ok) return null;

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        groundingMetadata?: {
          webSearchQueries?: string[];
          groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
        };
      }>;
    };

    const candidate = data.candidates?.[0];
    const answerText =
      candidate?.content?.parts?.map((p) => p.text ?? '').join(' ').trim() ?? '';
    const fanoutQueries =
      candidate?.groundingMetadata?.webSearchQueries ?? [];
    const chunkTitles = (candidate?.groundingMetadata?.groundingChunks ?? [])
      .map((c) => c.web?.title)
      .filter((t): t is string => Boolean(t));
    const citedUrls = Array.from(
      new Set(
        (candidate?.groundingMetadata?.groundingChunks ?? [])
          .map((c) => c.web?.uri)
          .filter((u): u is string => Boolean(u))
      )
    ).slice(0, 8);
    const competitors = extractCompetitorsFromAnswerAndCitations({
      targetHostname: domain.hostname,
      brandName,
      answerText,
      urls: citedUrls,
      titles: chunkTitles,
    });

    const { mentioned, rank } = extractMentionAndRank(
      answerText,
      brandName,
      domain.hostname,
      citedUrls
    );
    const hallucinations = detectHallucinations(
      answerText,
      brandName,
      truthSheet
    );

    return {
      promptText,
      aiEngine: 'gemini',
      brandMentioned: mentioned,
      citationRank: rank,
      competitorsMentioned: competitors,
      citedSourceUrls: citedUrls,
      decompiledFanoutQueries: fanoutQueries,
      fanoutTelemetryType:
        fanoutQueries.length > 0 ? 'observed_query' : 'cited_source_only',
      hallucinationDetected: hallucinations.length > 0,
      hallucinationDetails: hallucinations,
      rawAnswerExcerpt: answerText.slice(0, 420),
    };
  } catch {
    return null;
  }
}

async function scanWithOpenAiLive(
  promptText: string,
  domain: NormalizedDomain,
  brandName: string,
  truthSheet: BrandTruthSheet,
  apiKey: string
): Promise<EngineScanResult | null> {
  try {
    const response = await fetchJsonWith429Retry(
      'https://api.openai.com/v1/responses',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          tools: [{ type: 'web_search_preview' }],
          input: promptText,
        }),
      },
      18000
    );
    if (!response.ok) return null;

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{
        type?: string;
        action?: { query?: string; queries?: string[] };
        content?: Array<{
          text?: string;
          annotations?: Array<{ url?: string; title?: string }>;
        }>;
      }>;
    };

    const fanoutQueries: string[] = [];
    const citedUrls: string[] = [];
    const citationTitles: string[] = [];
    let answerText = '';

    for (const item of data.output ?? []) {
      if (item.type === 'web_search_call') {
        if (item.action?.query) {
          fanoutQueries.push(item.action.query);
        }
        for (const q of item.action?.queries ?? []) {
          if (q && !fanoutQueries.includes(q)) fanoutQueries.push(q);
        }
      }
      for (const part of item.content ?? []) {
        if (part.text) answerText += `${part.text} `;
        for (const ann of part.annotations ?? []) {
          if (ann.url) citedUrls.push(ann.url);
          if (ann.title) citationTitles.push(ann.title);
        }
      }
    }

    const finalAnswer = (answerText.trim() || data.output_text || '').trim();
    const dedupedUrls = Array.from(new Set(citedUrls)).slice(0, 8);
    const { mentioned, rank } = extractMentionAndRank(
      finalAnswer,
      brandName,
      domain.hostname,
      dedupedUrls
    );
    const hallucinations = detectHallucinations(
      finalAnswer,
      brandName,
      truthSheet
    );

    return {
      promptText,
      aiEngine: 'chatgpt',
      brandMentioned: mentioned,
      citationRank: rank,
      competitorsMentioned: extractCompetitorsFromAnswerAndCitations({
        targetHostname: domain.hostname,
        brandName,
        answerText: finalAnswer,
        urls: dedupedUrls,
        titles: citationTitles,
      }),
      citedSourceUrls: dedupedUrls,
      decompiledFanoutQueries: fanoutQueries,
      fanoutTelemetryType:
        fanoutQueries.length > 0 ? 'observed_query' : 'cited_source_only',
      hallucinationDetected: hallucinations.length > 0,
      hallucinationDetails: hallucinations,
      rawAnswerExcerpt: finalAnswer.slice(0, 420),
    };
  } catch {
    return null;
  }
}

async function scanWithPerplexityLive(
  promptText: string,
  domain: NormalizedDomain,
  brandName: string,
  truthSheet: BrandTruthSheet,
  apiKey: string
): Promise<EngineScanResult | null> {
  try {
    const agentResult = await runPerplexityAgentQuery({
      input: promptText,
      apiKey,
      effort: 'fast',
      timeoutMs: 15000,
      maxRetries: 2,
    });

    const answerText = agentResult.outputText;
    if (!answerText && agentResult.citedUrls.length === 0) {
      return null;
    }

    const { mentioned, rank } = extractMentionAndRank(
      answerText,
      brandName,
      domain.hostname,
      agentResult.citedUrls
    );
    const hallucinations = detectHallucinations(
      answerText,
      brandName,
      truthSheet
    );

    return {
      promptText,
      aiEngine: 'perplexity',
      brandMentioned: mentioned,
      citationRank: rank,
      competitorsMentioned: extractCompetitorsFromAnswerAndCitations({
        targetHostname: domain.hostname,
        brandName,
        answerText,
        urls: agentResult.citedUrls,
        titles: agentResult.sourceTitles,
      }),
      citedSourceUrls: agentResult.citedUrls,
      decompiledFanoutQueries: agentResult.decompiledFanoutQueries,
      fanoutTelemetryType: agentResult.fanoutTelemetryType,
      hallucinationDetected: hallucinations.length > 0,
      hallucinationDetails: hallucinations,
      rawAnswerExcerpt: answerText.slice(0, 420),
    };
  } catch {
    return null;
  }
}

function buildMockEngineScan(
  promptText: string,
  engine: AiEngine,
  domain: NormalizedDomain,
  brandName: string,
  truthSheet: BrandTruthSheet
): EngineScanResult {
  const fixtureDomain = PATIENT_ZERO_DOMAINS.find((d) =>
    d.domain_url.toLowerCase().includes(domain.hostname)
  );

  if (fixtureDomain) {
    const matchingSnap = PATIENT_ZERO_SNAPSHOTS.find(
      (s) => s.domain_id === fixtureDomain.id && s.ai_engine === engine
    );
    const matchingPrompt = PATIENT_ZERO_PROMPTS.find(
      (p) => p.domain_id === fixtureDomain.id
    );

    if (matchingSnap) {
      const freshHallucinations = detectHallucinations(
        matchingSnap.raw_answer_excerpt,
        brandName,
        truthSheet
      );
      const mergedHallucinations =
        freshHallucinations.length > 0
          ? freshHallucinations
          : (matchingSnap.hallucination_details ?? []);

      return {
        promptText,
        aiEngine: engine,
        brandMentioned: matchingSnap.brand_mentioned,
        citationRank: matchingSnap.citation_rank,
        competitorsMentioned: matchingSnap.competitors_mentioned,
        citedSourceUrls: matchingSnap.cited_source_urls,
        decompiledFanoutQueries:
          engine === 'perplexity'
            ? []
            : (matchingPrompt?.decompiled_fanout_queries ?? []),
        fanoutTelemetryType: matchingSnap.fanout_telemetry_type,
        hallucinationDetected: mergedHallucinations.length > 0,
        hallucinationDetails: mergedHallucinations,
        rawAnswerExcerpt: matchingSnap.raw_answer_excerpt ?? '',
      };
    }
  }

  // Deterministic domain-tailored mock snapshot for any public URL
  const slug = domain.hostname.replace(/\.[a-z.]+$/i, '');
  const mentioned = engine === 'chatgpt';
  const excerpt = mentioned
    ? `Buyers evaluating options in this category frequently compare established category leaders alongside ${brandName} (${domain.origin}), though third-party review directories currently carry deeper structured pricing tables.`
    : `Top cited providers for this query rely on structured comparison guides and verified schema markup; ${brandName} was omitted from top retrieved sources due to missing /llms.txt and Answer-First FAQ entities.`;

  return {
    promptText,
    aiEngine: engine,
    brandMentioned: mentioned,
    citationRank: mentioned ? 3 : null,
    competitorsMentioned: [
      'reddit.com buyer threads',
      'editorial comparison guides',
    ],
    citedSourceUrls: [
      `https://reddit.com/r/Comparisons/comments/best_${slug}_alternatives`,
      `https://g2.com/categories/${slug}-comparison`,
    ],
    decompiledFanoutQueries:
      engine === 'perplexity'
        ? []
        : [
            `${brandName} pricing and verified specs`,
            `best ${slug} alternatives comparison reddit`,
          ],
    fanoutTelemetryType: 'mock_fixture',
    hallucinationDetected: false,
    hallucinationDetails: [],
    rawAnswerExcerpt: excerpt,
  };
}

export async function runMultiEnginePromptScan(options: {
  prompts: string[];
  engines?: AiEngine[];
  domain: NormalizedDomain;
  brandName: string;
  truthSheet: BrandTruthSheet;
  env: CoreGeoEnv;
}): Promise<EngineScanResult[]> {
  const engines: AiEngine[] = options.engines ?? [
    'chatgpt',
    'gemini',
    'perplexity',
  ];
  const results: EngineScanResult[] = [];

  for (const promptText of options.prompts) {
    const enginePromises = engines.map(async (engine) => {
      if (options.env.providerMode === 'live') {
        if (engine === 'gemini' && options.env.geminiApiKey) {
          const live = await scanWithGeminiLive(
            promptText,
            options.domain,
            options.brandName,
            options.truthSheet,
            options.env.geminiApiKey
          );
          if (live) return live;
        }
        if (engine === 'chatgpt' && options.env.openaiApiKey) {
          const live = await scanWithOpenAiLive(
            promptText,
            options.domain,
            options.brandName,
            options.truthSheet,
            options.env.openaiApiKey
          );
          if (live) return live;
        }
        if (engine === 'perplexity' && options.env.perplexityApiKey) {
          const live = await scanWithPerplexityLive(
            promptText,
            options.domain,
            options.brandName,
            options.truthSheet,
            options.env.perplexityApiKey
          );
          if (live) return live;
        }
      }

      return buildMockEngineScan(
        promptText,
        engine,
        options.domain,
        options.brandName,
        options.truthSheet
      );
    });

    const batch = await Promise.all(enginePromises);
    results.push(...batch);
  }

  return results;
}
