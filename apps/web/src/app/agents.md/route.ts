import { NextResponse } from 'next/server';

const AGENTS_MD_BODY = `# Verisource — Autonomous Agent & MCP Integration Specification

Canonical Origin: https://verisource.dev
Streamable HTTP MCP Endpoint: https://mcp.verisource.dev/mcp
Transport: Stateless Streamable HTTP (POST / GET / DELETE JSON-RPC 2.0)
OAuth Discovery (RFC 9728): https://mcp.verisource.dev/.well-known/oauth-protected-resource
Machine Summary: https://verisource.dev/llms.txt

## 1. Connecting Your AI Agent (Claude Desktop, Cursor, Windsurf, Antigravity)

Add the Verisource Streamable HTTP server to your MCP client configuration:

\`\`\`json
{
  "mcpServers": {
    "verisource": {
      "url": "https://mcp.verisource.dev/mcp",
      "headers": {
        "Authorization": "Bearer vs_live_YOUR_API_KEY"
      }
    }
  }
}
\`\`\`

Unauthenticated callers may omit the \`Authorization\` header to invoke the free \`scan_domain_ai_readiness\` preview tool (rate-limited to 3 custom scans per IP per UTC day; 24-hour KV cache).

## 2. Exposed MCP Tools & Credit Metering

Paid tools accept either a SHA-256 \`vs_live_\` Bearer API key minted at https://verisource.dev/dashboard (Pro \`$99/mo\` or Agency \`$249/mo\`) or a valid Supabase OAuth 2.0 Bearer JWT.

| Tool Name | Tier | Credit Cost | Purpose |
| :--- | :--- | :--- | :--- |
| \`scan_domain_ai_readiness\` | Free Preview | 0 credits | Returns AI Visibility Score (0-100), GPTBot/OAI-SearchBot/PerplexityBot/ClaudeBot WAF & robots.txt access, Shopify \`/api/ucp/mcp\` + \`/agents.md\` status, and 1 sample citation check. |
| \`get_citation_gaps_and_fanouts\` | Paid (Pro / Agency) | 1 cached / 10 live | Returns decompiled search fanout sub-queries, competitor share-of-voice, and unblurred third-party citation URLs winning the prompt. |
| \`check_brand_hallucinations\` | Paid (Pro / Agency) | 1 cached / 10 live | Diffs live ChatGPT, Gemini, and Perplexity claims against a domain's verified Brand Truth Sheet and flags pricing, shipping, or SKU hallucinations. |
| \`generate_geo_fix_bundle\` | Paid (Pro / Agency) | 1 cached / 10 live | Generates Critic-verified (>= 9.5/10 Natural Quality Score) \`JSON-LD\`, \`/llms.txt\`, \`/agents.md\`, Shopify \`templates/agents.md.liquid\`, and citation outreach briefs. |

## 3. Public HTTP Endpoints for Web & Extension Clients

- \`POST https://verisource.dev/api/grader\` — JSON body \`{ "domain": "aurearoasters.com" }\`. CORS-enabled (\`Access-Control-Allow-Origin: *\`) for browser extensions and agent pre-checks.
- \`GET https://mcp.verisource.dev/health\` — Health & transport status check.
- \`GET https://verisource.dev/audit/{share_slug}\` — Scoped read-only white-label agency pitch brief (e.g. https://verisource.dev/audit/mosaic-springfield-audit).

## 4. Verified Commercial Terms & Exclusions

- Plans: \`$19\` One-Time Audit Pass (100% credited toward any monthly subscription within 7 days), \`$49/mo\` Starter Brand, \`$99/mo\` Pro + MCP (\`1,000\` credits/mo), \`$249/mo\` Agency White-Label (\`5,000\` credits/mo).
- Exclusions: Verisource does NOT sell legacy backlink-farm packages, does NOT expose deprecated \`/sse\` MCP transports, and does NOT collect cross-site browsing history in its Manifest V3 Chrome Extension.
`;

export async function GET(): Promise<NextResponse> {
  return new NextResponse(AGENTS_MD_BODY, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
