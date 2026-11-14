import type { AgentsMdStatus, ShopifyMcpStatus } from '../db/types.js';
import {
  classifyAgentsMdContent,
  type DomainHttpProbeResult,
} from '../scanner/bot-waf-prober.js';

export interface ShopifySkuSummary {
  title: string;
  handle: string;
  productType: string | null;
  minPriceUsd: string | null;
  maxPriceUsd: string | null;
  tags: string[];
}

export interface ShopifyInspectionResult {
  isShopify: boolean;
  shopifyMcpStatus: ShopifyMcpStatus;
  activeMcpEndpoint: string | null;
  exposedMcpTools: string[];
  agentsMdStatus: AgentsMdStatus;
  catalogSkus: ShopifySkuSummary[];
  priceRangeSummary: string | null;
}

async function probeMcpJsonRpcEndpoint(endpointUrl: string): Promise<{
  active: boolean;
  tools: string[];
}> {
  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { active: false, tools: [] };
    }

    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw) as {
        jsonrpc?: string;
        result?: { tools?: Array<{ name?: string }> };
      };
      if (parsed.jsonrpc === '2.0' && parsed.result) {
        const tools = (parsed.result.tools ?? [])
          .map((t) => t.name)
          .filter((n): n is string => Boolean(n));
        return { active: true, tools };
      }
    } catch {
      // Handle SSE-framed JSON-RPC responses (`data: {...}`)
      const dataLine = raw
        .split(/\r?\n/)
        .find((line) => line.startsWith('data:'));
      if (dataLine) {
        const jsonPart = dataLine.slice(5).trim();
        const parsed = JSON.parse(jsonPart) as {
          result?: { tools?: Array<{ name?: string }> };
        };
        const tools = (parsed.result?.tools ?? [])
          .map((t) => t.name)
          .filter((n): n is string => Boolean(n));
        return { active: true, tools };
      }
    }

    return { active: false, tools: [] };
  } catch {
    return { active: false, tools: [] };
  }
}

interface RawShopifyProductsResponse {
  products?: Array<{
    title?: string;
    handle?: string;
    product_type?: string;
    tags?: string[] | string;
    variants?: Array<{ price?: string }>;
  }>;
}

async function fetchPublicShopifySkus(origin: string): Promise<{
  foundProductsEndpoint: boolean;
  skus: ShopifySkuSummary[];
  priceRangeSummary: string | null;
}> {
  try {
    const response = await fetch(`${origin}/products.json?limit=8`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return { foundProductsEndpoint: false, skus: [], priceRangeSummary: null };
    }

    const data = (await response.json()) as RawShopifyProductsResponse;
    if (!Array.isArray(data.products)) {
      return { foundProductsEndpoint: false, skus: [], priceRangeSummary: null };
    }

    let globalMin = Number.POSITIVE_INFINITY;
    let globalMax = 0;

    const skus: ShopifySkuSummary[] = data.products.slice(0, 8).map((product) => {
      const prices = (product.variants ?? [])
        .map((v) => Number.parseFloat(v.price ?? ''))
        .filter((n) => Number.isFinite(n) && n > 0);

      const min = prices.length > 0 ? Math.min(...prices) : null;
      const max = prices.length > 0 ? Math.max(...prices) : null;

      if (min !== null && min < globalMin) globalMin = min;
      if (max !== null && max > globalMax) globalMax = max;

      const rawTags = product.tags;
      const tags = Array.isArray(rawTags)
        ? rawTags.slice(0, 5)
        : typeof rawTags === 'string'
          ? rawTags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .slice(0, 5)
          : [];

      return {
        title: product.title ?? 'Untitled SKU',
        handle: product.handle ?? '',
        productType: product.product_type || null,
        minPriceUsd: min !== null ? `$${min.toFixed(2)}` : null,
        maxPriceUsd: max !== null ? `$${max.toFixed(2)}` : null,
        tags,
      };
    });

    const priceRangeSummary =
      Number.isFinite(globalMin) && globalMax > 0
        ? globalMin === globalMax
          ? `$${globalMin.toFixed(2)} USD`
          : `$${globalMin.toFixed(2)} – $${globalMax.toFixed(2)} USD`
        : null;

    return { foundProductsEndpoint: true, skus, priceRangeSummary };
  } catch {
    return { foundProductsEndpoint: false, skus: [], priceRangeSummary: null };
  }
}

export async function inspectShopifyStorefront(
  probe: DomainHttpProbeResult
): Promise<ShopifyInspectionResult> {
  const ucpUrl = `${probe.domain.origin}/api/ucp/mcp`;
  const legacyMcpUrl = `${probe.domain.origin}/api/mcp`;

  const [ucpProbe, legacyProbe, productsProbe] = await Promise.all([
    probeMcpJsonRpcEndpoint(ucpUrl),
    probeMcpJsonRpcEndpoint(legacyMcpUrl),
    fetchPublicShopifySkus(probe.domain.origin),
  ]);

  const isShopify =
    probe.htmlSignalsShopify ||
    ucpProbe.active ||
    legacyProbe.active ||
    productsProbe.foundProductsEndpoint;

  if (!isShopify) {
    return {
      isShopify: false,
      shopifyMcpStatus: 'unavailable',
      activeMcpEndpoint: null,
      exposedMcpTools: [],
      agentsMdStatus: probe.agentsMdInitialStatus,
      catalogSkus: [],
      priceRangeSummary: null,
    };
  }

  let shopifyMcpStatus: ShopifyMcpStatus = 'unavailable';
  let activeMcpEndpoint: string | null = null;
  let exposedMcpTools: string[] = [];

  if (ucpProbe.active) {
    shopifyMcpStatus = 'ucp_active';
    activeMcpEndpoint = ucpUrl;
    exposedMcpTools = ucpProbe.tools;
  } else if (legacyProbe.active) {
    shopifyMcpStatus = 'legacy_mcp_active';
    activeMcpEndpoint = legacyMcpUrl;
    exposedMcpTools = legacyProbe.tools;
  }

  const agentsMdStatus = classifyAgentsMdContent(probe.agentsMdRaw);

  return {
    isShopify: true,
    shopifyMcpStatus,
    activeMcpEndpoint,
    exposedMcpTools,
    agentsMdStatus,
    catalogSkus: productsProbe.skus,
    priceRangeSummary: productsProbe.priceRangeSummary,
  };
}
