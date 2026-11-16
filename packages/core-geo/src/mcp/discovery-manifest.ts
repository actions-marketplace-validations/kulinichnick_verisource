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
  icons: Array<{
    src: string;
    mimeType: 'image/png';
    sizes: string[];
  }>;
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
  const version = options?.version ?? '1.0.0';

  return {
    $schema:
      'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
    name: 'dev.verisource/mcp',
    slug: 'verisource',
    title: 'Verisource — B2B GEO & AI Citation Intelligence',
    description:
      'B2B GEO MCP: audit AI citations, flag SKU hallucinations, and ship JSON-LD & /agents.md fixes.',
    version,
    websiteUrl: appOrigin,
    documentationUrl: `${appOrigin}/mcp-guide`,
    pricingUrl: `${appOrigin}/pricing`,
    privacyPolicyUrl: `${appOrigin}/privacy`,
    termsOfServiceUrl: `${appOrigin}/terms`,
    icons: [
      {
        src: `${appOrigin}/icon.png`,
        mimeType: 'image/png',
        sizes: ['128x128'],
      },
    ],
    remotes: [
      {
        type: 'streamable-http',
        url: `${mcpOrigin}/mcp`,
        headers: [
          {
            name: 'Authorization',
            description:
              'Optional for free scan_domain_ai_readiness preview; Bearer vs_live_<48-hex> for Pro/Agency tools.',
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
          'Returns AI Visibility Score (0-100), 7-platform CMS detection (Shopify, WordPress, Webflow, Wix, Squarespace, Framer, Custom), GPTBot/OAI-SearchBot/PerplexityBot/ClaudeBot WAF and robots.txt access, SSR vs JS crawler readability, Shopify /api/ucp/mcp + /agents.md status, and 1 sample prompt citation check.',
      },
      {
        name: 'get_citation_gaps_and_fanouts',
        title: 'Get Citation Gaps & Decompiled Query Fanouts',
        tier: 'paid_pro_agency',
        creditsCost: '1_cached_or_10_live',
        description:
          'Returns 3-engine Mention vs Citation share, Source-Type categorized citation gap domains (UGC/Reddit, Review Directory, Editorial, Competitor), channel-specific citation action playbooks, suggested funnel prompts, and observed search sub-queries.',
      },
      {
        name: 'check_brand_hallucinations',
        title: 'Audit AI Hallucinations Against Brand Truth Sheet',
        tier: 'paid_pro_agency',
        creditsCost: '1_cached_or_10_live',
        description:
          'Compares ChatGPT, Gemini, and Perplexity claims and brand sentiment framing against verified pricing, shipping or delivery radii, and SKU exclusions.',
      },
      {
        name: 'generate_geo_fix_bundle',
        title: 'Generate Syntax-Validated GEO Fix Bundle',
        tier: 'paid_pro_agency',
        creditsCost: '1_cached_or_10_live',
        description:
          'Generates syntax-validated schema.org JSON-LD, /llms.txt, /agents.md, Shopify templates/agents.md.liquid overrides, platform-tailored 1-click AI remediation prompts, and head-to-head rival comparison pages.',
      },
    ],
  };
}

export type McpClientAppId =
  | 'claude'
  | 'cursor'
  | 'antigravity'
  | 'windsurf'
  | 'curl_rpc';

export interface McpClientSetupBundle {
  clientId: McpClientAppId;
  label: string;
  configFilePath: string;
  setupStepsText: string;
  configSnippet: string;
  starterAgentPrompt: string;
  keyState:
    | 'live_raw_key'
    | 'active_prefix_placeholder'
    | 'unminted_placeholder';
}

export const MCP_CLIENT_APP_OPTIONS: ReadonlyArray<{
  id: McpClientAppId;
  label: string;
}> = [
  { id: 'claude', label: 'Claude Desktop' },
  { id: 'cursor', label: 'Cursor IDE' },
  { id: 'antigravity', label: 'Antigravity' },
  { id: 'windsurf', label: 'Windsurf' },
  { id: 'curl_rpc', label: 'cURL / HTTP' },
];

function sanitizeSetupDomain(raw?: string | null): string {
  const trimmed = (raw ?? '').trim().toLowerCase();
  if (!trimmed) return 'yourcompany.com';
  const withoutProtocol = trimmed
    .replace(/^https?:\/\//i, '')
    .split(/[/?#]/)[0]
    ?.replace(/^www\./i, '')
    .replace(/[^a-z0-9.-]/g, '');
  return withoutProtocol && withoutProtocol.includes('.')
    ? withoutProtocol
    : 'yourcompany.com';
}

export function buildMcpClientSetupBundle(options: {
  clientId: McpClientAppId;
  rawBearerKey?: string | null;
  activeKeyPrefix?: string | null;
  targetDomain?: string | null;
  mcpEndpointUrl?: string;
}): McpClientSetupBundle {
  const endpointUrl = (
    options.mcpEndpointUrl ?? 'https://mcp.verisource.dev/mcp'
  ).trim();
  const domain = sanitizeSetupDomain(options.targetDomain);

  const rawKey = (options.rawBearerKey ?? '').trim();
  const activePrefix = (options.activeKeyPrefix ?? '').trim();

  let bearerValue: string;
  let keyState: McpClientSetupBundle['keyState'];
  if (rawKey) {
    bearerValue = rawKey;
    keyState = 'live_raw_key';
  } else if (activePrefix) {
    bearerValue = `${activePrefix}...PASTE_YOUR_SECRET_KEY`;
    keyState = 'active_prefix_placeholder';
  } else {
    bearerValue = 'vs_live_MINT_KEY_ABOVE';
    keyState = 'unminted_placeholder';
  }

  const jsonServerBlock = JSON.stringify(
    {
      mcpServers: {
        verisource: {
          url: endpointUrl,
          headers: {
            Authorization: `Bearer ${bearerValue}`,
          },
        },
      },
    },
    null,
    2
  );

  switch (options.clientId) {
    case 'claude':
      return {
        clientId: 'claude',
        label: 'Claude Desktop',
        configFilePath: 'claude_desktop_config.json',
        setupStepsText:
          'Open Claude Desktop → Settings → Developer → Edit Config, paste the JSON block below, save, and restart Claude once.',
        configSnippet: jsonServerBlock,
        starterAgentPrompt: `Use the Verisource MCP tools on ${domain} to run check_brand_hallucinations and get_citation_gaps_and_fanouts, then list any wrong pricing or policy claims alongside our top 3 missing third-party citation sources.`,
        keyState,
      };

    case 'cursor':
      return {
        clientId: 'cursor',
        label: 'Cursor IDE',
        configFilePath: '.cursor/mcp.json',
        setupStepsText:
          'Create or open .cursor/mcp.json in your project root (or Cursor Settings → MCP → Add new global MCP server) and paste the JSON block below.',
        configSnippet: jsonServerBlock,
        starterAgentPrompt: `Call Verisource generate_geo_fix_bundle for ${domain}, inspect our project routing, and write the syntax-validated JSON-LD schema, /llms.txt, and /agents.md files without altering visual layout or styles.`,
        keyState,
      };

    case 'antigravity':
      return {
        clientId: 'antigravity',
        label: 'Antigravity',
        configFilePath: 'mcp_config.json',
        setupStepsText:
          'Add the verisource server entry to your Antigravity mcp_config.json file so workspace agents can query live citations and apply verified fixes.',
        configSnippet: jsonServerBlock,
        starterAgentPrompt: `Run Verisource check_brand_hallucinations and generate_geo_fix_bundle for ${domain}, verify GPTBot and PerplexityBot access in robots.txt, and stage the validated JSON-LD, /llms.txt, and /agents.md updates.`,
        keyState,
      };

    case 'windsurf':
      return {
        clientId: 'windsurf',
        label: 'Windsurf',
        configFilePath: '~/.codeium/windsurf/mcp_config.json',
        setupStepsText:
          'Open Windsurf → Cascade → Configure MCP (mcp_config.json), paste the server block below, and click Refresh.',
        configSnippet: jsonServerBlock,
        starterAgentPrompt: `Use Verisource get_citation_gaps_and_fanouts and generate_geo_fix_bundle on ${domain} to list which rival URLs ChatGPT and Perplexity cite ahead of us and write our /llms.txt and JSON-LD fixes.`,
        keyState,
      };

    case 'curl_rpc':
      return {
        clientId: 'curl_rpc',
        label: 'cURL / HTTP',
        configFilePath: `POST ${endpointUrl} (JSON-RPC 2.0)`,
        setupStepsText:
          'Run this stateless HTTP POST from any terminal, CI workflow, or backend job—no persistent WebSocket or deprecated /sse transport required.',
        configSnippet: `curl -X POST ${endpointUrl} \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "Authorization: Bearer ${bearerValue}" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "generate_geo_fix_bundle",
      "arguments": { "domain": "${domain}" }
    }
  }'`,
        starterAgentPrompt: `curl -sS -X POST ${endpointUrl} -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`,
        keyState,
      };
  }
}
