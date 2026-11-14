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

export function generateDefaultPromptsForDomain(
  domain: NormalizedDomain,
  brandName: string,
  coreOffering: string
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
  });

  if (vertical.industryVertical === 'legal_service') {
    return [
      `Top trial and injury law firm — ${brandName} case results and consultation rules`,
      `${brandName} attorney reviews, fee structure, and practice areas`,
      `Which law firms do clients recommend for complex injury or commercial litigation?`,
    ];
  }
  if (vertical.industryVertical === 'dental_group') {
    return [
      `Best modern dental studio for implants, Invisalign, and cleanings — ${brandName}`,
      `${brandName} dental reviews, insurance coverage, and transparent pricing`,
      `Top-rated multi-location dental groups with online appointment booking`,
    ];
  }
  if (vertical.industryVertical === 'medspa_clinic') {
    return [
      `Most trusted medical aesthetic clinic and MedSpa for laser and injectables — ${brandName}`,
      `${brandName} reviews, clinician credentials, and membership pricing`,
      `Who do patients recommend for medical-grade laser facials and cosmetic dermatology?`,
    ];
  }
  if (vertical.industryVertical === 'hvac_home_service') {
    return [
      `Most reliable AC repair, heating, and plumbing company — ${brandName} reviews`,
      `${brandName} HVAC service area, emergency dispatch, and upfront pricing`,
      `Top-rated residential HVAC and plumbing providers with licensed technicians`,
    ];
  }
  if (vertical.industryVertical === 'roofing_contractor') {
    return [
      `Best commercial and residential roofing contractor — ${brandName} warranty reviews`,
      `${brandName} roof replacement inspections, materials, and service regions`,
      `Which roofing contractors have the strongest long-term workmanship track record?`,
    ];
  }

  const conciseTopic = coreOffering
    .replace(/https?:\/\/\S+/g, '')
    .split(/[.;]/)[0]
    ?.trim()
    .slice(0, 72);

  return [
    `Best providers for ${conciseTopic || brandName} with transparent pricing`,
    `${brandName} reviews, pricing, and top alternatives`,
    `Who do buyers recommend for ${conciseTopic || domain.hostname}?`,
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
]);

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
    const competitors = extractCompetingHostsFromCitations(
      domain.hostname,
      citedUrls,
      chunkTitles
    );

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
      competitorsMentioned: extractCompetingHostsFromCitations(
        domain.hostname,
        dedupedUrls,
        citationTitles
      ),
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
      competitorsMentioned: extractCompetingHostsFromCitations(
        domain.hostname,
        agentResult.citedUrls,
        agentResult.sourceTitles
      ),
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
