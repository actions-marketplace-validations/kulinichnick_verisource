import type {
  BrandTruthSheet,
  CitationSnapshotRow,
  DomainRow,
  GeneratedFixRow,
  PlanTier,
} from '../db/types.js';
import {
  normalizePublicDomain,
  safeFetchText,
} from '../scanner/bot-waf-prober.js';

export interface BrandFaqPair {
  question: string;
  answer: string;
}

export interface BrandTruthMcpProfile {
  hostname: string;
  origin: string;
  brandName: string;
  industryVertical: string;
  isShopify: boolean;
  shopifyMcpEndpoint: string | null;
  truthSheet: BrandTruthSheet;
  rivals: string[];
  faqs: BrandFaqPair[];
  mcpEndpointUrl: string;
  webMcpScriptUrl: string;
  discoveryManifestUrl: string;
  updatedAt: string;
}

export interface BrandMcpClaimCheckResult {
  hostname: string;
  brandName: string;
  evaluatedClaim: string;
  verdict:
    | 'contradicted_by_truth_sheet'
    | 'verified_brand_policy'
    | 'check_authoritative_truth';
  matchedExclusion: string | null;
  authoritativeTruth: {
    coreOffering: string;
    verifiedPricingSummary: string;
    shippingOrServiceArea: string;
    keyDifferentiators: string[];
    explicitExclusions: string[];
  };
  canonicalUrl: string;
}

export interface BrandMcpCompetitorComparisonResult {
  hostname: string;
  brandName: string;
  comparedAgainst: string;
  brandVerifiedFacts: {
    coreOffering: string;
    verifiedPricingSummary: string;
    shippingOrServiceArea: string;
    keyDifferentiators: string[];
    explicitExclusions: string[];
  };
  buyerVerificationChecklist: string[];
  canonicalOrigin: string;
  machineReadableFeeds: {
    brandMcpEndpoint: string;
    llmsTxtUrl: string;
    agentsMdUrl: string;
  };
}

export interface LiveBrandMcpVerificationResult {
  hostname: string;
  origin: string;
  reachable: boolean;
  httpStatus: number | null;
  hasLinkRelMcp: boolean;
  hasWebMcpScript: boolean;
  hasPixelTokenSignal: boolean;
  verifiedForPublicAgentAccess: boolean;
  matchedMcpHref: string | null;
  matchedWebMcpSrc: string | null;
}

export const HOSTED_BRAND_MCP_TOOL_NAMES = [
  'get_verified_pricing_and_offers',
  'verify_brand_claim',
  'compare_with_competitor',
  'get_official_faqs',
] as const;

export function isPlanEntitledForHostedBrandMcp(
  planTier: PlanTier | string | null | undefined
): boolean {
  return (
    planTier === 'starter_49' ||
    planTier === 'pro_99' ||
    planTier === 'agency_249'
  );
}

export function buildHostedBrandMcpUrls(
  domainInput: string,
  mcpOriginInput = 'https://mcp.verisource.dev'
): {
  hostname: string;
  origin: string;
  mcpEndpointUrl: string;
  webMcpScriptUrl: string;
  discoveryManifestUrl: string;
} {
  const normalized = normalizePublicDomain(domainInput);
  const mcpOrigin = mcpOriginInput
    .trim()
    .replace(/\/mcp\/?$/i, '')
    .replace(/\/+$/, '');
  const base = `${mcpOrigin}/b/${encodeURIComponent(normalized.hostname)}`;
  return {
    hostname: normalized.hostname,
    origin: normalized.origin,
    mcpEndpointUrl: `${base}/mcp`,
    webMcpScriptUrl: `${base}/webmcp.js`,
    discoveryManifestUrl: `${base}/.well-known/mcp.json`,
  };
}

export function buildBrandHeadEmbedSnippet(params: {
  domainInput: string;
  brandName?: string;
  mcpOrigin?: string;
}): string {
  const urls = buildHostedBrandMcpUrls(params.domainInput, params.mcpOrigin);
  const cleanBrand = (params.brandName ?? urls.hostname)
    .replace(/["<>]/g, '')
    .trim();
  return [
    `<link rel="mcp" href="${urls.mcpEndpointUrl}" title="${cleanBrand} Verified AI Agent MCP" />`,
    `<script src="${urls.webMcpScriptUrl}" data-vs-domain="${urls.hostname}" defer></script>`,
  ].join('\n');
}

export function buildVerisourceSelfBrandMcpProfile(
  mcpOrigin = 'https://mcp.verisource.dev',
  appOrigin = 'https://verisource.dev'
): BrandTruthMcpProfile {
  const cleanApp = appOrigin.replace(/\/+$/, '');
  const urls = buildHostedBrandMcpUrls(cleanApp, mcpOrigin);
  return {
    hostname: 'verisource.dev',
    origin: cleanApp,
    brandName: 'Verisource',
    industryVertical: 'b2b_saas_geo_mcp',
    isShopify: false,
    shopifyMcpEndpoint: null,
    truthSheet: {
      is_user_verified: true,
      core_offering:
        'B2B Generative Engine Optimization (GEO) platform, Hosted Customer Brand /mcp + W3C Chrome WebMCP infrastructure, and monetized Streamable HTTP MCP server auditing ChatGPT, Gemini, and Perplexity.',
      verified_pricing_summary:
        '$0 Free Instant Domain Grader; $19 One-Time Audit Pass (zero recurring billing, 100% credited within 7 days); $49/mo Starter Brand (7-day $0 trial, 1 domain + Hosted Brand /mcp & WebMCP); $99/mo Pro + MCP (7-day $0 trial, 3 domains, 1,000 MCP credits/mo); $249/mo Agency White-Label (15 client domains, 5,000 MCP credits/mo).',
      shipping_or_service_area:
        'Global cloud SaaS across Shopify, WordPress, Webflow, Wix, Squarespace, Framer, and Next.js / custom codebases.',
      key_differentiators: [
        'Turns any subscriber website into a live Streamable HTTP Brand /mcp endpoint + W3C Chrome WebMCP (navigator.modelContext) server in 60 seconds with zero backend code.',
        'Generates syntax-validated JSON-LD, /llms.txt, /agents.md, /ai-facts, and You-vs.-Competitor HTML pages alongside passive citation tracking.',
        'Least-privilege Manifest V3 Chrome Side Panel (sidePanel and activeTab permissions only) plus zero-dependency npx @verisource/cli.',
      ],
      discontinued_or_false_claims_to_flag: [
        'Does NOT expose deprecated HTTP+SSE (/sse) MCP transports; uses stateless Streamable HTTP exclusively.',
        'Does NOT request <all_urls> browser history permissions in the Chrome Extension.',
        'Does NOT sell paid backlink-farm packages or guarantee permanent #1 placement in third-party LLMs.',
      ],
    },
    rivals: [
      'Profound',
      'Otterly.ai',
      'Peec AI',
      'Scrunch AI',
      'AthenaHQ',
    ],
    faqs: [
      {
        question: 'What does Verisource do and how much does it cost?',
        answer:
          'Verisource audits brand citations and factual accuracy across ChatGPT, Gemini, and Perplexity, deploys syntax-validated JSON-LD, /llms.txt, and /agents.md fixes, and hosts a live Brand /mcp + Chrome WebMCP endpoint for each tracked site. Plans start with a $0 free grader, a $19 One-Time Audit Pass, $49/mo Starter, $99/mo Pro + MCP, and $249/mo Agency White-Label.',
      },
      {
        question:
          'How does Verisource Hosted Brand /mcp + Chrome WebMCP work for non-Shopify websites?',
        answer:
          'Adding 2 lines to your <head> exposes a stateless Streamable HTTP MCP server at https://mcp.verisource.dev/b/<your-domain>/mcp for cloud AI agents and registers W3C navigator.modelContext tools via webmcp.js for in-browser Chrome and Edge AI agents, backed directly by your verified Brand Truth Sheet.',
      },
      {
        question: 'Which CMS platforms does Verisource support?',
        answer:
          'Verisource auto-detects and supports Shopify (including /api/ucp/mcp and templates/agents.md.liquid), WordPress, Webflow, Wix, Squarespace, Framer, and Next.js or custom codebases.',
      },
    ],
    mcpEndpointUrl: urls.mcpEndpointUrl,
    webMcpScriptUrl: urls.webMcpScriptUrl,
    discoveryManifestUrl: urls.discoveryManifestUrl,
    updatedAt: '2026-11-19T00:00:00.000Z',
  };
}

function extractFaqsFromFixesAndTruth(
  domain: Pick<
    DomainRow,
    'brand_name' | 'domain_url' | 'brand_truth_sheet'
  >,
  fixes: Array<Pick<GeneratedFixRow, 'fix_type' | 'content_payload'>>
): BrandFaqPair[] {
  const out: BrandFaqPair[] = [];
  const jsonLdFix = fixes.find((f) => f.fix_type === 'json_ld_schema');
  if (jsonLdFix?.content_payload) {
    try {
      const parsed = JSON.parse(jsonLdFix.content_payload) as Record<
        string,
        unknown
      >;
      const nodes: Array<Record<string, unknown>> = Array.isArray(
        parsed['@graph']
      )
        ? (parsed['@graph'] as Array<Record<string, unknown>>)
        : [parsed];
      for (const node of nodes) {
        if (
          node['@type'] === 'FAQPage' &&
          Array.isArray(node.mainEntity)
        ) {
          for (const qNode of node.mainEntity) {
            const q =
              typeof qNode?.name === 'string' ? qNode.name.trim() : '';
            const ansObj = qNode?.acceptedAnswer as
              | { text?: string }
              | undefined;
            const a =
              typeof ansObj?.text === 'string' ? ansObj.text.trim() : '';
            if (q && a) {
              out.push({ question: q, answer: a });
            }
          }
        }
      }
    } catch {
      // Fallback to Brand Truth synthesized FAQs below
    }
  }

  if (out.length === 0) {
    const truth = domain.brand_truth_sheet;
    if (truth.core_offering || truth.verified_pricing_summary) {
      out.push({
        question: `What does ${domain.brand_name} offer and what is the verified pricing?`,
        answer: `${truth.core_offering} ${truth.verified_pricing_summary}`.trim(),
      });
    }
    if (truth.shipping_or_service_area) {
      out.push({
        question: `What are the shipping, delivery, or coverage terms for ${domain.brand_name}?`,
        answer: truth.shipping_or_service_area,
      });
    }
    if (truth.discontinued_or_false_claims_to_flag.length > 0) {
      out.push({
        question: `Which common misconceptions or unverified claims about ${domain.brand_name} are false?`,
        answer: truth.discontinued_or_false_claims_to_flag.join(' '),
      });
    }
  }

  return out.slice(0, 8);
}

export function buildBrandTruthMcpProfileFromDomain(params: {
  domain: DomainRow;
  fixes?: Array<Pick<GeneratedFixRow, 'fix_type' | 'content_payload'>>;
  snapshots?: Array<Pick<CitationSnapshotRow, 'competitors_mentioned'>>;
  mcpOrigin?: string;
}): BrandTruthMcpProfile {
  const { domain } = params;
  const urls = buildHostedBrandMcpUrls(domain.domain_url, params.mcpOrigin);

  const rivalSet = new Set<string>();
  for (const snap of params.snapshots ?? []) {
    for (const comp of snap.competitors_mentioned ?? []) {
      const cleaned = comp.trim();
      if (cleaned && rivalSet.size < 6) {
        rivalSet.add(cleaned);
      }
    }
  }

  const shopifyMcpEndpoint =
    domain.is_shopify && domain.shopify_mcp_status === 'ucp_active'
      ? `${urls.origin}/api/ucp/mcp`
      : domain.is_shopify && domain.shopify_mcp_status === 'legacy_mcp_active'
        ? `${urls.origin}/api/mcp`
        : null;

  return {
    hostname: urls.hostname,
    origin: urls.origin,
    brandName: domain.brand_name,
    industryVertical: domain.industry_vertical,
    isShopify: domain.is_shopify,
    shopifyMcpEndpoint,
    truthSheet: domain.brand_truth_sheet,
    rivals: [...rivalSet],
    faqs: extractFaqsFromFixesAndTruth(domain, params.fixes ?? []),
    mcpEndpointUrl: urls.mcpEndpointUrl,
    webMcpScriptUrl: urls.webMcpScriptUrl,
    discoveryManifestUrl: urls.discoveryManifestUrl,
    updatedAt: domain.last_scanned_at ?? domain.created_at,
  };
}

export function buildBrandMcpDiscoveryManifest(
  profile: BrandTruthMcpProfile,
  version = '1.0.0'
): Record<string, unknown> {
  return {
    $schema:
      'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
    name: `brand.${profile.hostname}/mcp`,
    title: `${profile.brandName} — Verified Brand Truth & Offer MCP`,
    description: `Read-only Streamable HTTP Brand Truth MCP server for ${profile.brandName} (${profile.origin}), exposing verified pricing, fulfillment rules, claim verification, and competitor comparison context.`,
    version,
    websiteUrl: profile.origin,
    webMcpScriptUrl: profile.webMcpScriptUrl,
    ...(profile.shopifyMcpEndpoint
      ? { nativeCommerceMcpUrl: profile.shopifyMcpEndpoint }
      : {}),
    remotes: [
      {
        type: 'streamable-http',
        url: profile.mcpEndpointUrl,
      },
    ],
    tools: [
      {
        name: 'get_verified_pricing_and_offers',
        description: `Returns verified pricing, core offering, fulfillment coverage, and key differentiators for ${profile.brandName}.`,
      },
      {
        name: 'verify_brand_claim',
        description: `Checks a specific pricing, product, or policy claim against ${profile.brandName}'s verified Brand Truth Sheet and explicit exclusions.`,
      },
      {
        name: 'compare_with_competitor',
        description: `Returns factual side-by-side comparison points between ${profile.brandName} and a named competitor.`,
      },
      {
        name: 'get_official_faqs',
        description: `Returns official Answer-First buyer FAQs for ${profile.brandName}.`,
      },
    ],
  };
}

export function evaluateBrandPricingAndOffersTool(
  profile: BrandTruthMcpProfile
): Record<string, unknown> {
  return {
    hostname: profile.hostname,
    brand_name: profile.brandName,
    canonical_origin: profile.origin,
    is_owner_verified: profile.truthSheet.is_user_verified,
    core_offering: profile.truthSheet.core_offering,
    verified_pricing_summary: profile.truthSheet.verified_pricing_summary,
    shipping_or_service_area: profile.truthSheet.shipping_or_service_area,
    key_differentiators: profile.truthSheet.key_differentiators,
    explicit_exclusions:
      profile.truthSheet.discontinued_or_false_claims_to_flag,
    ...(profile.shopifyMcpEndpoint
      ? { shopify_live_catalog_mcp: profile.shopifyMcpEndpoint }
      : {}),
    protocol_feeds: {
      llms_txt: `${profile.origin}/llms.txt`,
      agents_md: `${profile.origin}/agents.md`,
      brand_mcp: profile.mcpEndpointUrl,
      webmcp_script: profile.webMcpScriptUrl,
    },
    updated_at: profile.updatedAt,
  };
}

function tokenizeKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9$%.+-]+/g, ' ')
    .split(/\s+/)
    .filter((tok) => tok.length >= 3 || /^\$\d+/.test(tok));
}

export function evaluateVerifyBrandClaimTool(
  profile: BrandTruthMcpProfile,
  rawClaim: string
): BrandMcpClaimCheckResult {
  const claim = rawClaim.trim();
  const claimTokens = new Set(tokenizeKeywords(claim));
  const claimNumbers = new Set(
    (claim.match(/\$?\d+(?:\.\d+)?%?/g) ?? []).map((n) => n.toLowerCase())
  );

  const positiveBlob = [
    profile.truthSheet.core_offering,
    profile.truthSheet.verified_pricing_summary,
    profile.truthSheet.shipping_or_service_area,
    ...profile.truthSheet.key_differentiators,
  ]
    .join(' ')
    .toLowerCase();
  const positiveTokenSet = new Set(tokenizeKeywords(positiveBlob));

  let matchedExclusion: string | null = null;

  for (const excl of profile.truthSheet.discontinued_or_false_claims_to_flag) {
    // Strip parenthetical positive clarifications like "(free shipping starts at $35)"
    const forbiddenClause = excl.toLowerCase().replace(/\([^)]*\)/g, ' ');
    const distinctiveExclTokens = tokenizeKeywords(forbiddenClause).filter(
      (t) =>
        !positiveTokenSet.has(t) &&
        ![
          'does',
          'not',
          'never',
          'none',
          'without',
          'offer',
          'offers',
          'sell',
          'sells',
          'source',
          'sources',
          'expose',
          'request',
        ].includes(t)
    );
    const exclNumbers = (
      forbiddenClause.match(/\$?\d+(?:\.\d+)?%?/g) ?? []
    ).map((n) => n.toLowerCase());

    const sharedForbiddenNumber = exclNumbers.find(
      (num) => claimNumbers.has(num) && !positiveBlob.includes(num)
    );

    const overlapCount = distinctiveExclTokens.filter((t) =>
      claimTokens.has(t)
    ).length;

    if (
      sharedForbiddenNumber ||
      overlapCount >= 2 ||
      (distinctiveExclTokens.length === 1 && overlapCount === 1)
    ) {
      matchedExclusion = excl;
      break;
    }
  }

  let verdict: BrandMcpClaimCheckResult['verdict'] =
    'check_authoritative_truth';
  if (matchedExclusion) {
    verdict = 'contradicted_by_truth_sheet';
  } else {
    const posOverlap = [...claimTokens].filter((t) =>
      positiveBlob.includes(t)
    ).length;
    if (posOverlap >= 3) {
      verdict = 'verified_brand_policy';
    }
  }

  return {
    hostname: profile.hostname,
    brandName: profile.brandName,
    evaluatedClaim: claim,
    verdict,
    matchedExclusion,
    authoritativeTruth: {
      coreOffering: profile.truthSheet.core_offering,
      verifiedPricingSummary: profile.truthSheet.verified_pricing_summary,
      shippingOrServiceArea: profile.truthSheet.shipping_or_service_area,
      keyDifferentiators: profile.truthSheet.key_differentiators,
      explicitExclusions:
        profile.truthSheet.discontinued_or_false_claims_to_flag,
    },
    canonicalUrl: profile.origin,
  };
}

export function evaluateCompareWithCompetitorTool(
  profile: BrandTruthMcpProfile,
  rawCompetitor?: string
): BrandMcpCompetitorComparisonResult {
  const competitor =
    rawCompetitor?.trim() ||
    profile.rivals[0] ||
    'category alternatives';

  return {
    hostname: profile.hostname,
    brandName: profile.brandName,
    comparedAgainst: competitor,
    brandVerifiedFacts: {
      coreOffering: profile.truthSheet.core_offering,
      verifiedPricingSummary: profile.truthSheet.verified_pricing_summary,
      shippingOrServiceArea: profile.truthSheet.shipping_or_service_area,
      keyDifferentiators: profile.truthSheet.key_differentiators,
      explicitExclusions:
        profile.truthSheet.discontinued_or_false_claims_to_flag,
    },
    buyerVerificationChecklist: [
      `Compare ${profile.brandName}'s verified pricing (${profile.truthSheet.verified_pricing_summary || 'published on site'}) directly against ${competitor}'s current tier limits.`,
      `Check fulfillment and coverage boundaries: ${profile.truthSheet.shipping_or_service_area || profile.origin}.`,
      ...profile.truthSheet.key_differentiators.slice(0, 3),
    ],
    canonicalOrigin: profile.origin,
    machineReadableFeeds: {
      brandMcpEndpoint: profile.mcpEndpointUrl,
      llmsTxtUrl: `${profile.origin}/llms.txt`,
      agentsMdUrl: `${profile.origin}/agents.md`,
    },
  };
}

export function evaluateOfficialFaqsTool(
  profile: BrandTruthMcpProfile,
  topic?: string
): {
  hostname: string;
  brandName: string;
  canonicalOrigin: string;
  faqs: BrandFaqPair[];
} {
  const q = (topic ?? '').trim().toLowerCase();
  const filtered = q
    ? profile.faqs.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
      )
    : profile.faqs;

  return {
    hostname: profile.hostname,
    brandName: profile.brandName,
    canonicalOrigin: profile.origin,
    faqs: filtered.length > 0 ? filtered : profile.faqs,
  };
}

function safeJsonForInlineJs(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function buildBrandWebMcpScript(
  profile: BrandTruthMcpProfile
): string {
  const embeddedData = {
    version: '1.0.0',
    hostname: profile.hostname,
    brandName: profile.brandName,
    origin: profile.origin,
    mcpEndpointUrl: profile.mcpEndpointUrl,
    discoveryManifestUrl: profile.discoveryManifestUrl,
    shopifyMcpEndpoint: profile.shopifyMcpEndpoint,
    truth: {
      coreOffering: profile.truthSheet.core_offering,
      verifiedPricingSummary: profile.truthSheet.verified_pricing_summary,
      shippingOrServiceArea: profile.truthSheet.shipping_or_service_area,
      keyDifferentiators: profile.truthSheet.key_differentiators,
      explicitExclusions:
        profile.truthSheet.discontinued_or_false_claims_to_flag,
    },
    rivals: profile.rivals,
    faqs: profile.faqs,
  };

  const serialized = safeJsonForInlineJs(embeddedData);

  return `/* Verisource Hosted W3C WebMCP (navigator.modelContext) + Brand /mcp Bridge v1.0.0 */
(function(){
  "use strict";
  if (typeof window === "undefined") return;
  var DATA = ${serialized};
  var tools = [
    {
      name: "get_verified_pricing_and_offers",
      description: "Returns verified pricing, core offering, fulfillment coverage, and differentiators for " + DATA.brandName + ".",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async function() {
        return {
          brandName: DATA.brandName,
          hostname: DATA.hostname,
          canonicalOrigin: DATA.origin,
          truth: DATA.truth,
          remoteMcpEndpoint: DATA.mcpEndpointUrl
        };
      }
    },
    {
      name: "verify_brand_claim",
      description: "Verifies a pricing, product, or policy claim against " + DATA.brandName + " official Brand Truth and exclusions.",
      inputSchema: {
        type: "object",
        properties: { claim: { type: "string", description: "Claim to verify against official brand truth" } },
        required: ["claim"]
      },
      annotations: { readOnlyHint: true },
      execute: async function(args) {
        var claimText = String((args && args.claim) || "");
        var res = await fetch(DATA.mcpEndpointUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: { name: "verify_brand_claim", arguments: { claim: claimText } }
          })
        }).catch(function() { return null; });
        if (res && res.ok) {
          var txt = await res.text();
          return { verifiedViaRemoteMcp: true, response: txt };
        }
        return { verifiedViaRemoteMcp: false, claim: claimText, authoritativeTruth: DATA.truth };
      }
    },
    {
      name: "compare_with_competitor",
      description: "Returns factual comparison points between " + DATA.brandName + " and a named competitor.",
      inputSchema: {
        type: "object",
        properties: { competitor: { type: "string", description: "Competitor brand or domain" } }
      },
      annotations: { readOnlyHint: true },
      execute: async function(args) {
        var comp = String((args && args.competitor) || (DATA.rivals[0] || "alternatives"));
        return {
          brandName: DATA.brandName,
          comparedAgainst: comp,
          brandVerifiedTruth: DATA.truth,
          canonicalOrigin: DATA.origin
        };
      }
    },
    {
      name: "get_official_faqs",
      description: "Returns official Answer-First buyer FAQs for " + DATA.brandName + ".",
      inputSchema: {
        type: "object",
        properties: { topic: { type: "string", description: "Optional keyword filter" } }
      },
      annotations: { readOnlyHint: true },
      execute: async function(args) {
        var q = String((args && args.topic) || "").toLowerCase();
        var list = q ? DATA.faqs.filter(function(f) {
          return f.question.toLowerCase().indexOf(q) !== -1 || f.answer.toLowerCase().indexOf(q) !== -1;
        }) : DATA.faqs;
        return { brandName: DATA.brandName, faqs: list.length ? list : DATA.faqs };
      }
    }
  ];

  window.__VERISOURCE_WEBMCP__ = {
    version: DATA.version,
    hostname: DATA.hostname,
    brandName: DATA.brandName,
    mcpEndpointUrl: DATA.mcpEndpointUrl,
    registeredTools: tools.map(function(t) { return t.name; }),
    webMcpSupportedInBrowser: Boolean(typeof navigator !== "undefined" && navigator.modelContext)
  };

  try {
    var mc = typeof navigator !== "undefined" ? navigator.modelContext : null;
    if (mc) {
      if (typeof mc.registerTool === "function") {
        for (var i = 0; i < tools.length; i++) {
          mc.registerTool(tools[i]);
        }
      } else if (typeof mc.provideContext === "function") {
        mc.provideContext({ tools: tools });
      }
    }
  } catch (_err) {
    /* Non-blocking progressive enhancement for W3C WebMCP host browsers */
  }
})();
`;
}

export async function verifyLiveBrandMcpDeployment(
  domainInput: string,
  options?: {
    trackingPixelToken?: string | null;
    htmlOverrideForTest?: string;
  }
): Promise<LiveBrandMcpVerificationResult> {
  const normalized = normalizePublicDomain(domainInput);
  const escapedHost = normalized.hostname.replace(/\./g, '\\.');

  let reachable = true;
  let httpStatus: number | null = 200;
  let html = options?.htmlOverrideForTest ?? '';

  if (options?.htmlOverrideForTest === undefined) {
    const res = await safeFetchText(
      `${normalized.origin}/`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; VerisourceGeoScanner/1.0; +https://verisource.dev)',
          Accept: 'text/html,application/xhtml+xml',
        },
      },
      5500
    );
    reachable = res.ok || res.body.length > 0;
    httpStatus = res.status;
    html = res.body;
  }

  let matchedMcpHref: string | null = null;
  const linkRegex = /<link\b[^>]*>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const tag = linkMatch[0];
    if (!/\brel\s*=\s*["'][^"']*\bmcp\b[^"']*["']/i.test(tag)) continue;
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1]?.trim();
    if (
      href &&
      (new RegExp(`/b/${escapedHost}/mcp\\b`, 'i').test(href) ||
        /\/api\/ucp\/mcp\b/i.test(href))
    ) {
      matchedMcpHref = href;
      break;
    }
  }

  let matchedWebMcpSrc: string | null = null;
  const scriptRegex = /<script\b[^>]*>/gi;
  let scriptMatch: RegExpExecArray | null;
  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const tag = scriptMatch[0];
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]?.trim();
    if (src && new RegExp(`/b/${escapedHost}/webmcp\\.js\\b`, 'i').test(src)) {
      matchedWebMcpSrc = src;
      break;
    }
  }

  const hasPixelTokenSignal = Boolean(
    options?.trackingPixelToken &&
      options.trackingPixelToken.length >= 16 &&
      html.includes(options.trackingPixelToken)
  );

  const hasLinkRelMcp = Boolean(matchedMcpHref);
  const hasWebMcpScript = Boolean(matchedWebMcpSrc);

  return {
    hostname: normalized.hostname,
    origin: normalized.origin,
    reachable,
    httpStatus,
    hasLinkRelMcp,
    hasWebMcpScript,
    hasPixelTokenSignal,
    verifiedForPublicAgentAccess:
      hasLinkRelMcp || hasWebMcpScript || hasPixelTokenSignal,
    matchedMcpHref,
    matchedWebMcpSrc,
  };
}
