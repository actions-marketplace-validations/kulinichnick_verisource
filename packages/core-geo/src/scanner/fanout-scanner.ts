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
import { detectHallucinations } from '../watchdog/hallucination-watchdog.js';
import type { NormalizedDomain } from './bot-waf-prober.js';

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

async function scanWithGeminiLive(
  promptText: string,
  domain: NormalizedDomain,
  brandName: string,
  truthSheet: BrandTruthSheet,
  apiKey: string
): Promise<EngineScanResult | null> {
  try {
    const response = await fetch(
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
        signal: AbortSignal.timeout(12000),
      }
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
    const citedUrls = Array.from(
      new Set(
        (candidate?.groundingMetadata?.groundingChunks ?? [])
          .map((c) => c.web?.uri)
          .filter((u): u is string => Boolean(u))
      )
    ).slice(0, 8);

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
      competitorsMentioned: [],
      citedSourceUrls: citedUrls,
      decompiledFanoutQueries: fanoutQueries,
      fanoutTelemetryType: 'observed_query',
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
    const response = await fetch('https://api.openai.com/v1/responses', {
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
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      output?: Array<{
        type?: string;
        action?: { query?: string };
        content?: Array<{
          text?: string;
          annotations?: Array<{ url?: string }>;
        }>;
      }>;
    };

    const fanoutQueries: string[] = [];
    const citedUrls: string[] = [];
    let answerText = '';

    for (const item of data.output ?? []) {
      if (item.type === 'web_search_call' && item.action?.query) {
        fanoutQueries.push(item.action.query);
      }
      for (const part of item.content ?? []) {
        if (part.text) answerText += `${part.text} `;
        for (const ann of part.annotations ?? []) {
          if (ann.url) citedUrls.push(ann.url);
        }
      }
    }

    const dedupedUrls = Array.from(new Set(citedUrls)).slice(0, 8);
    const { mentioned, rank } = extractMentionAndRank(
      answerText,
      brandName,
      domain.hostname,
      dedupedUrls
    );
    const hallucinations = detectHallucinations(
      answerText,
      brandName,
      truthSheet
    );

    return {
      promptText,
      aiEngine: 'chatgpt',
      brandMentioned: mentioned,
      citationRank: rank,
      competitorsMentioned: [],
      citedSourceUrls: dedupedUrls,
      decompiledFanoutQueries: fanoutQueries,
      fanoutTelemetryType: 'observed_query',
      hallucinationDetected: hallucinations.length > 0,
      hallucinationDetails: hallucinations,
      rawAnswerExcerpt: answerText.trim().slice(0, 420),
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
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: promptText }],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      citations?: string[];
      choices?: Array<{ message?: { content?: string } }>;
    };

    const answerText = data.choices?.[0]?.message?.content ?? '';
    const citedUrls = (data.citations ?? []).slice(0, 8);
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
      aiEngine: 'perplexity',
      brandMentioned: mentioned,
      citationRank: rank,
      competitorsMentioned: [],
      citedSourceUrls: citedUrls,
      decompiledFanoutQueries: [],
      fanoutTelemetryType: 'cited_source_only',
      hallucinationDetected: hallucinations.length > 0,
      hallucinationDetails: hallucinations,
      rawAnswerExcerpt: answerText.trim().slice(0, 420),
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
      `Top ${brandName} Category Peer #1`,
      `Top ${brandName} Category Peer #2`,
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
