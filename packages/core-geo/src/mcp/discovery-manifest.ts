export interface McpToolSummary {
  name: string;
  title: string;
  tier: 'free_preview' | 'paid_pro_agency';
  creditsCost: number | string;
  description: string;
}

export interface McpDiscoveryManifest {
  $schema: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  version: string;
  websiteUrl: string;
  documentationUrl: string;
  pricingUrl: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  repository: {
    url: string;
    source: 'github';
  };
  remotes: Array<{
    type: 'streamable-http';
    url: string;
    headers: Array<{
      name: string;
      description: string;
      isRequired: boolean;
      isSecret: boolean;
    }>;
  }>;
  oauthProtectedResourceUrl: string;
  tools: McpToolSummary[];
}

export function buildMcpDiscoveryManifest(options?: {
  version?: string;
  appOrigin?: string;
  mcpOrigin?: string;
}): McpDiscoveryManifest {
  const appOrigin = (options?.appOrigin ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const mcpOrigin = (
    options?.mcpOrigin ?? 'https://mcp.verisource.dev'
  ).replace(/\/+$/, '');
  const version = options?.version ?? '0.2.2';

  return {
    $schema:
      'https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json',
    name: 'io.github.kulinichnick/verisource',
    slug: 'verisource',
    title: 'Verisource — B2B GEO & AI Citation Intelligence MCP',
    description:
      'Stateless Streamable HTTP MCP server for auditing ChatGPT, Gemini, and Perplexity brand citations, catching pricing and SKU hallucinations, probing GPTBot/PerplexityBot WAF blocks and Shopify /api/ucp/mcp readiness, and generating >= 9.5/10 JSON-LD, /llms.txt, and /agents.md fixes.',
    version,
    websiteUrl: appOrigin,
    documentationUrl: `${appOrigin}/agents.md`,
    pricingUrl: `${appOrigin}/pricing`,
    privacyPolicyUrl: `${appOrigin}/privacy`,
    termsOfServiceUrl: `${appOrigin}/terms`,
    repository: {
      url: 'https://github.com/kulinichnick/verisource',
      source: 'github',
    },
    remotes: [
      {
        type: 'streamable-http',
        url: `${mcpOrigin}/mcp`,
        headers: [
          {
            name: 'Authorization',
            description:
              'Optional for free scan_domain_ai_readiness preview (0 credits); pass Bearer vs_live_<48-hex> or Supabase OAuth 2.0 JWT for Pro and Agency tools.',
            isRequired: false,
            isSecret: true,
          },
        ],
      },
    ],
    oauthProtectedResourceUrl: `${mcpOrigin}/.well-known/oauth-protected-resource`,
    tools: [
      {
        name: 'scan_domain_ai_readiness',
        title: 'Scan Domain AI & MCP Readiness (Free Preview)',
        tier: 'free_preview',
        creditsCost: 0,
        description:
          'Returns AI Visibility Score (0-100), GPTBot/OAI-SearchBot/PerplexityBot/ClaudeBot WAF and robots.txt access, Shopify /api/ucp/mcp + /agents.md status, and 1 sample prompt citation check.',
      },
      {
        name: 'get_citation_gaps_and_fanouts',
        title: 'Get Citation Gaps & Decompiled Query Fanouts',
        tier: 'paid_pro_agency',
        creditsCost: '1_cached_or_10_live',
        description:
          'Returns unblurred third-party competitor citation URLs and observed AI search sub-queries across ChatGPT, Google Gemini, and Perplexity.',
      },
      {
        name: 'check_brand_hallucinations',
        title: 'Audit AI Hallucinations Against Brand Truth Sheet',
        tier: 'paid_pro_agency',
        creditsCost: '1_cached_or_10_live',
        description:
          'Compares ChatGPT, Gemini, and Perplexity claims against verified pricing, shipping or delivery radii, and SKU exclusions.',
      },
      {
        name: 'generate_geo_fix_bundle',
        title: 'Generate 9.5+/10 Graded GEO Fix Bundle',
        tier: 'paid_pro_agency',
        creditsCost: '1_cached_or_10_live',
        description:
          'Generates Critic-verified (>= 9.5/10) schema.org JSON-LD, /llms.txt, /agents.md, Shopify templates/agents.md.liquid overrides, and citation outreach briefs.',
      },
    ],
  };
}
