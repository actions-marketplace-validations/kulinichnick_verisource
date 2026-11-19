import { NextResponse } from 'next/server';

const AGENTS_MD_BODY = `# Verisource — Autonomous Agent & MCP Integration Specification

Canonical Origin: https://verisource.dev
11-Capability Platform & Agent CLI Architecture: https://verisource.dev/features
Read-Only Crawler Transparency Specification (VerisourceScan/1.0): https://verisource.dev/scanner
Live Domain Scorecards Directory (340+ Audited Sites): https://verisource.dev/reports
Head-to-Head Domain AI Search X-Ray: https://verisource.dev/vs
Standalone npm CLI Binary: npx @verisource/cli
Interactive Product Tour & 7-CMS Tutorials: https://verisource.dev/tutorial
GEO Platform Comparisons: https://verisource.dev/compare (https://verisource.dev/compare/profound-alternative, https://verisource.dev/compare/otterly-ai-alternative, https://verisource.dev/compare/peec-ai-alternative, https://verisource.dev/compare/athenahq-alternative, https://verisource.dev/compare/scrunch-ai-alternative)
Engineering & CMS Protocol Guides: https://verisource.dev/guides/shopify-agents-md-ucp-mcp, https://verisource.dev/guides/llms-txt-and-agents-md-setup, https://verisource.dev/guides/json-ld-faqpage-schema-for-ai-search, https://verisource.dev/guides/headless-nextjs-shopify-ai-search-fix
7-Platform Starter Templates (/agents.md, /llms.txt, /ai-facts, JSON-LD): https://verisource.dev/templates
Empirical HTTP Benchmarks: https://verisource.dev/benchmarks, https://verisource.dev/benchmarks/ai-search-readiness-2026
WordPress & Shopify OS 2.0 Connector Bridges: https://verisource.dev/connectors
25% Recurring Partner Program: https://verisource.dev/partners
Free Diagnostic Utilities: https://verisource.dev/tools/json-ld-ai-schema-checker, https://verisource.dev/tools/llms-txt-validator, https://verisource.dev/tools/ai-crawler-waf-checker, https://verisource.dev/tools/shopify-ai-readiness-checker
Sample Client Audits: https://verisource.dev/sample-audit
Agency Partner Architecture: https://verisource.dev/agencies
Visual Quickstart & Playground: https://verisource.dev/mcp-guide
Streamable HTTP MCP Endpoint: https://mcp.verisource.dev/mcp
Hosted Brand Truth MCP Endpoint: https://mcp.verisource.dev/b/verisource.dev/mcp
W3C Chrome WebMCP Script (navigator.modelContext): https://mcp.verisource.dev/b/verisource.dev/webmcp.js
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
| \`compare_competitor_protocol_xray\` | Paid (Pro / Agency) | 1 cached / 10 live | Benchmarks \`own_domain\` against \`rival_domain\` across 6 HTTP & schema dimensions and outputs an unredacted \`ai_overtake_prompt\`, \`vs_rival_comparison_page\` (\`[Brand] vs. [Rival]\` + \`FAQPage\` \`JSON-LD\`), and Headless Next.js \`/api/ucp/mcp\` rescue config. |

## 3. 7-Platform CMS Support & No-Root-File \`/ai-facts\` Verification

Verisource fingerprints \`shopify\`, \`wordpress\`, \`webflow\`, \`wix\`, \`squarespace\`, \`framer\`, and \`nextjs_custom\` during HTTP scanning:
- **Code Repositories & WordPress:** Deploy \`/llms.txt\` and \`/agents.md\` at domain root plus \`application/ld+json\` in \`<head>\`.
- **Hosted Website Builders Without Root Static File Uploads (Webflow, Wix, Squarespace, Framer, Shopify):** Publish a structured HTML page at \`/ai-facts\` (or \`/pages/ai-facts\` on Shopify) containing \`<article class="verisource-ai-facts">\` and link it in \`<head>\` via \`<link rel="alternate" type="text/markdown" href="/ai-facts">\`. Verisource's live verifier recognizes both root files and \`/ai-facts\` alternate feeds.

## 4. Public HTTP Endpoints for Web & Extension Clients

- \`POST https://verisource.dev/api/grader\` — JSON body \`{ "domain": "yourcompany.com" }\`. CORS-enabled (\`Access-Control-Allow-Origin: *\`) for browser extensions and agent pre-checks.
- \`GET https://verisource.dev/api/report/{domain}[?format=md]\` — CORS-enabled JSON and Markdown (\`text/markdown\`) scorecard feed across 340+ pre-indexed SaaS and commerce domains.
- \`GET https://verisource.dev/api/vs/{matchup}[?format=md]\` — CORS-enabled JSON and Markdown (\`text/markdown\`) 6-dimension head-to-head comparison feed across published \`/vs/[matchup]\` benchmarks.
- \`GET https://verisource.dev/api/benchmarks/summary[?format=md]\` — CORS-enabled JSON and Markdown (\`text/markdown\`) empirical dataset feed summarizing protocol adoption and architecture cohort means across 340+ audited domains.
- \`GET https://mcp.verisource.dev/health\` — Health & transport status check.
- \`GET https://verisource.dev/audit/{share_slug}\` — Scoped read-only white-label agency pitch brief with Business Impact diagnosis and detected CMS badge.

## 5. Verified Commercial Terms & Exclusions

- Plans: \`$19\` One-Time Audit Pass (zero recurring billing; 100% credited toward any monthly subscription within 7 days), \`$49/mo\` Starter Brand (includes 7-day free trial on first monthly signup), \`$99/mo\` Pro + MCP (includes 7-day free trial with \`150\` starter \`/mcp\` credits, stepping up to \`1,000\` credits/mo upon first paid invoice), \`$249/mo\` Agency White-Label (\`5,000\` credits/mo).
- Exclusions: Verisource does NOT sell legacy backlink-farm packages, does NOT expose deprecated \`/sse\` MCP transports, and does NOT collect cross-site browsing history in its Manifest V3 Chrome Extension.

## 6. Local-First CLI, Browser Flow Verifier & Agent Skill Installer (\`@verisource/cli\`)

Coding agents and CI pipelines can invoke \`npx @verisource/cli\` directly on Node.js 20+ with zero runtime sub-dependencies:
- \`npx @verisource/cli auth --key vs_live_YOUR_API_KEY\` — Authenticates local or CI environments against \`https://verisource.dev/api/cli/sync\` so \`--push\` syncs readiness scores and link health directly to \`/dashboard\`.
- \`npx @verisource/cli scan <url> [--push] [--json]\` — Audits AI crawler WAF access, \`JSON-LD\`, \`/llms.txt\`, \`/agents.md\`, \`/ai-facts\`, and 20-page link health (\`VerisourceScan/1.0\`), storing compact handles (\`[h1]\`, \`[b1]\`, \`[l1]\`, \`[a1]\`, \`[n1]\`, \`[g1]\`) in \`.verisource/last-run.json\`.
- \`npx @verisource/cli verify <url> [--init] [--push] [--github-summary] [--json]\` — Evaluates live thresholds in \`.verisource/checks.json\` with deterministic exit codes (\`0\` pass, \`1\` policy failure, \`2\` invalid input or network failure).
- \`npx @verisource/cli vs <domainA> <domainB> [--json] [--github-summary] [--pr-comment]\` — Benchmarks two public domains across 6 AI search & crawler dimensions and stores \`[x1..xN]\` overtake action handles.
- \`npx @verisource/cli report <domain> [--md] [--json]\` — Fetches a pre-indexed domain scorecard or raw Markdown (\`?format=md\`) from \`verisource.dev/api/report/<domain>\` and stores \`[r1]\`.
- \`npx @verisource/cli matchup <slug | domainA domainB> [--md] [--json]\` — Fetches a pre-published 6-dimension Head-to-Head Matchup JSON or raw Markdown (\`?format=md\`) from \`verisource.dev/api/vs/<slug>\` and stores \`[m1]\`.
- \`npx @verisource/cli show <handle>\` & \`npx @verisource/cli query "<text>"\` — Drills into a single stored finding handle without flooding agent context windows.
- \`npx @verisource/cli map [url | ./dir] [--diff]\` — Maps live domain routes or static Next.js / React routes, API endpoints, and \`application/ld+json\` emitters.
- \`npx @verisource/cli browse <open|click|save>\`, \`record <name> <url>\`, \`run [name] [--headed]\` & \`workflow check\` — Captures and replays deterministic \`.verisource/workflows/*.json\` suites with zero LLM calls.
- \`npx @verisource/cli log <vercel|supabase|cloudflare>\` — Correlates recent 5-minute backend error logs with browser and HTTP failures.
- \`npx @verisource/cli agent --skill --install <claude|cursor|codex|antigravity|all>\` — Writes compact workspace agent instructions.
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
