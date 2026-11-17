import publishedManifest from '../data/published-reports.json';
import type {
  AgentsMdStatus,
  LlmsTxtStatus,
  RobotsAiBotStatus,
  ShopifyMcpStatus,
  WebsitePlatformId,
} from '@verisource/core-geo';

export interface PublishedDomainScorecard {
  domain: string;
  brandName: string;
  vertical: string;
  detectedPlatform: WebsitePlatformId;
  detectedPlatformLabel: string;
  readinessScore: number;
  accuracyScore: number;
  visibleWordCount: number;
  readabilityStatus: 'ssr_clean' | 'low_signal_bloat' | 'csr_js_trap';
  robotsAiBotStatus: RobotsAiBotStatus;
  llmsTxtStatus: LlmsTxtStatus;
  agentsMdStatus: AgentsMdStatus;
  isShopify: boolean;
  shopifyMcpStatus: ShopifyMcpStatus;
  jsonLdCount: number;
  jsonLdPillarsPassed: number;
  hasEntitySchema: boolean;
  hasFaqSchema: boolean;
  hasOfferSchema: boolean;
  headlineSummary: string;
  topGapSummary: string;
  qualityScore: number;
  publishedAt: string;
}

const BLOCKED_FIXTURE_HOSTS = new Set([
  'aurearoasters.com',
  'mosaicroasters.com',
]);

export function getPublishedDomainScorecards(): PublishedDomainScorecard[] {
  const rawList = (publishedManifest.reports ??
    []) as PublishedDomainScorecard[];
  return rawList.filter(
    (item) =>
      Boolean(item?.domain) &&
      !BLOCKED_FIXTURE_HOSTS.has(item.domain.trim().toLowerCase()) &&
      Number(item.qualityScore ?? 0) >= 9.5
  );
}

export function findPublishedScorecardByDomain(
  rawDomainParam: string
): PublishedDomainScorecard | null {
  let normalized = rawDomainParam.trim().toLowerCase();
  try {
    normalized = decodeURIComponent(normalized)
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split(/[/?#]/)[0]
      ?.trim() ?? '';
  } catch {
    return null;
  }
  if (!normalized || BLOCKED_FIXTURE_HOSTS.has(normalized)) {
    return null;
  }
  return (
    getPublishedDomainScorecards().find(
      (r) => r.domain.toLowerCase() === normalized
    ) ?? null
  );
}
