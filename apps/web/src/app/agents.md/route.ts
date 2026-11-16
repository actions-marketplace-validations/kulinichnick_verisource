import { NextResponse } from 'next/server';

const AGENTS_MD_BODY = `# Verisource — Autonomous Agent & MCP Integration Specification

Canonical Origin: https://verisource.dev
Interactive Product Tour & 7-CMS Tutorials: https://verisource.dev/tutorial
GEO Platform Comparisons: https://verisource.dev/compare (https://verisource.dev/compare/profound-alternative, https://verisource.dev/compare/otterly-ai-alternative, https://verisource.dev/compare/peec-ai-alternative, https://verisource.dev/compare/athenahq-alternative, https://verisource.dev/compare/scrunch-ai-alternative)
Engineering & CMS Protocol Guides: https://verisource.dev/guides/shopify-agents-md-ucp-mcp, https://verisource.dev/guides/llms-txt-and-agents-md-setup
7-Platform Starter Templates (/agents.md, /llms.txt, /ai-facts, JSON-LD): https://verisource.dev/templates
Free Diagnostic Utilities: https://verisource.dev/tools/llms-txt-validator, https://verisource.dev/tools/ai-crawler-waf-checker, https://verisource.dev/tools/shopify-ai-readiness-checker
Sample Client Audits: https://verisource.dev/sample-audit
Agency Partner Architecture: https://verisource.dev/agencies
Visual Quickstart & Playground: https://verisource.dev/mcp-guide
Streamable HTTP MCP Endpoint: https://mcp.verisource.dev/mcp
Transport: Stateless Streamable HTTP (POST / GET / DELETE JSON-RPC 2.0)
MCP Discovery Manifest: https://verisource.dev/.well-known/mcp.json
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
| \`scan_domain_ai_readiness\` | Free Preview | 0 credits | Returns AI Visibility Score (0-100), 7-platform CMS detection (\`detectedPlatform\`), GPTBot/OAI-SearchBot/PerplexityBot/ClaudeBot WAF & robots.txt access, SSR vs. JS readability, Shopify \`/api/ucp/mcp\` + \`/agents.md\` status, and 1 sample citation check. |
| \`get_citation_gaps_and_fanouts\` | Paid (Pro / Agency) | 1 cached / 10 live | Returns 3-engine Mention vs. Citation share, Source-Type categorized citation gap domains (UGC/Reddit, Review Directory, Competitor, Editorial), channel-specific \`citation_action_playbook_markdown\`, observed search fanout sub-queries, and third-party citation URLs. |
| \`check_brand_hallucinations\` | Paid (Pro / Agency) | 1 cached / 10 live | Diffs live ChatGPT, Gemini, and Perplexity claims and sentiment framing against a domain's verified Brand Truth Sheet and flags pricing, shipping, or SKU hallucinations. |
| \`generate_geo_fix_bundle\` | Paid (Pro / Agency) | 1 cached / 10 live | Generates syntax-validated \`JSON-LD\`, \`/llms.txt\`, \`/agents.md\`, Shopify \`templates/agents.md.liquid\`, platform-tailored \`ai_remediation_prompt\` (Coding Agent, WordPress, Webflow, Wix/Squarespace/Framer, Shopify, or Chat), and \`citation_comparison_page\` bundles. |

## 3. 7-Platform CMS Support & No-Root-File \`/ai-facts\` Verification

Verisource fingerprints \`shopify\`, \`wordpress\`, \`webflow\`, \`wix\`, \`squarespace\`, \`framer\`, and \`nextjs_custom\` during HTTP scanning:
- **Code Repositories & WordPress:** Deploy \`/llms.txt\` and \`/agents.md\` at domain root plus \`application/ld+json\` in \`<head>\`.
- **Hosted Website Builders Without Root Static File Uploads (Webflow, Wix, Squarespace, Framer, Shopify):** Publish a structured HTML page at \`/ai-facts\` (or \`/pages/ai-facts\` on Shopify) containing \`<article class="verisource-ai-facts">\` and link it in \`<head>\` via \`<link rel="alternate" type="text/markdown" href="/ai-facts">\`. Verisource's live verifier recognizes both root files and \`/ai-facts\` alternate feeds.

## 4. Public HTTP Endpoints for Web & Extension Clients

- \`POST https://verisource.dev/api/grader\` — JSON body \`{ "domain": "yourcompany.com" }\`. CORS-enabled (\`Access-Control-Allow-Origin: *\`) for browser extensions and agent pre-checks.
- \`GET https://mcp.verisource.dev/health\` — Health & transport status check.
- \`GET https://verisource.dev/audit/{share_slug}\` — Scoped read-only white-label agency pitch brief with Business Impact diagnosis and detected CMS badge.

## 5. Verified Commercial Terms & Exclusions

- Plans: \`$19\` One-Time Audit Pass (zero recurring billing; 100% credited toward any monthly subscription within 7 days), \`$49/mo\` Starter Brand (includes 7-day free trial on first monthly signup), \`$99/mo\` Pro + MCP (includes 7-day free trial with \`150\` starter \`/mcp\` credits, stepping up to \`1,000\` credits/mo upon first paid invoice), \`$249/mo\` Agency White-Label (\`5,000\` credits/mo).
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
