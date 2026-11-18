import {
  COMPETITOR_ALTERNATIVES,
  FREE_SEO_TOOLS,
  PROTOCOL_GUIDES,
} from './gtm-content';
import { getPublishedDomainScorecards } from './published-reports';

export const VERISOURCE_ORIGIN = 'https://verisource.dev';

// Deterministic 32-hex RFC IndexNow verification key served at /{key}.txt
export const VERISOURCE_INDEXNOW_KEY =
  process.env.INDEXNOW_API_KEY?.trim() || 'a94f2d8c6e1b47039c5d8a2e7b1f04c6';

export function getAllIndexableVerisourceUrls(): string[] {
  const coreUrls = [
    `${VERISOURCE_ORIGIN}`,
    `${VERISOURCE_ORIGIN}/features`,
    `${VERISOURCE_ORIGIN}/scanner`,
    `${VERISOURCE_ORIGIN}/reports`,
    `${VERISOURCE_ORIGIN}/vs`,
    `${VERISOURCE_ORIGIN}/tutorial`,
    `${VERISOURCE_ORIGIN}/pricing`,
    `${VERISOURCE_ORIGIN}/agencies`,
    `${VERISOURCE_ORIGIN}/mcp-guide`,
    `${VERISOURCE_ORIGIN}/sample-audit`,
    `${VERISOURCE_ORIGIN}/compare`,
    ...COMPETITOR_ALTERNATIVES.map(
      (item) => `${VERISOURCE_ORIGIN}/compare/${item.slug}`
    ),
    `${VERISOURCE_ORIGIN}/guides`,
    ...PROTOCOL_GUIDES.map(
      (item) => `${VERISOURCE_ORIGIN}/guides/${item.slug}`
    ),
    `${VERISOURCE_ORIGIN}/templates`,
    `${VERISOURCE_ORIGIN}/benchmarks`,
    `${VERISOURCE_ORIGIN}/benchmarks/ai-search-readiness-2026`,
    `${VERISOURCE_ORIGIN}/connectors`,
    `${VERISOURCE_ORIGIN}/partners`,
    `${VERISOURCE_ORIGIN}/tools`,
    ...FREE_SEO_TOOLS.map((item) => `${VERISOURCE_ORIGIN}/tools/${item.slug}`),
    ...getPublishedDomainScorecards().map(
      (item) => `${VERISOURCE_ORIGIN}/report/${item.domain}`
    ),
    `${VERISOURCE_ORIGIN}/llms.txt`,
    `${VERISOURCE_ORIGIN}/agents.md`,
  ];
  return Array.from(new Set(coreUrls));
}

export async function submitUrlsToIndexNow(options?: {
  urls?: string[];
  dryRun?: boolean;
}): Promise<{
  ok: boolean;
  dryRun: boolean;
  statusCode: number;
  submittedCount: number;
  keyLocation: string;
  urls: string[];
}> {
  const urls = options?.urls?.length
    ? options.urls
    : getAllIndexableVerisourceUrls();
  const keyLocation = `${VERISOURCE_ORIGIN}/${VERISOURCE_INDEXNOW_KEY}.txt`;

  if (options?.dryRun) {
    return {
      ok: true,
      dryRun: true,
      statusCode: 200,
      submittedCount: urls.length,
      keyLocation,
      urls,
    };
  }

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      host: 'verisource.dev',
      key: VERISOURCE_INDEXNOW_KEY,
      keyLocation,
      urlList: urls,
    }),
    signal: AbortSignal.timeout(8000),
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    dryRun: false,
    statusCode: response.status,
    submittedCount: urls.length,
    keyLocation,
    urls,
  };
}
