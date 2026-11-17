# Verisource — MCP Registry, Browser Store & B2B Directory Submission Kit (`v1.0.0`)

All public discovery endpoints are deployed and verified (`HTTP 200`, CORS `*`):

- **Streamable HTTP MCP Endpoint:** `https://mcp.verisource.dev/mcp`
- **MCP Discovery Manifest (Web Origin):** `https://verisource.dev/.well-known/mcp.json`
- **MCP Discovery Manifest (Worker Origin):** `https://mcp.verisource.dev/.well-known/mcp.json`
- **OAuth 2.0 Protected Resource Metadata (RFC 9728):** `https://mcp.verisource.dev/.well-known/oauth-protected-resource`
- **Visual Quickstart & Playground:** `https://verisource.dev/mcp-guide`
- **7-CMS Starter Templates (`/agents.md` & `/llms.txt`):** `https://verisource.dev/templates`
- **WordPress & Shopify OS 2.0 Connector Bridges:** `https://verisource.dev/connectors`
- **Free 4-Tool Diagnostic Suite (`JSON-LD`, `/llms.txt`, WAF, Shopify UCP):** `https://verisource.dev/tools`
- **Agent Protocol Documentation:** `https://verisource.dev/agents.md`
- **Root Registry & Smithery Files:** `server.json` · `smithery.yaml`

---

## 1. Copy-Paste Listing Fields

- **Server Name:** `Verisource — B2B GEO & AI Citation Intelligence`
- **Canonical Namespace:** `dev.verisource/mcp`
- **Category:** `Search & SEO` / `Developer Tools` / `E-Commerce`
- **Transport Type:** `Streamable HTTP` (`https://mcp.verisource.dev/mcp`)
- **Authentication:** Optional for free `scan_domain_ai_readiness` tool (`0` credits); `Authorization: Bearer vs_live_<48-hex>` or OAuth 2.0 Bearer JWT for paid tools.
- **Website / Docs URL:** `https://verisource.dev/mcp-guide`
- **Pricing URL:** `https://verisource.dev/pricing`
- **Privacy Policy URL:** `https://verisource.dev/privacy`

### Short Tagline (<= 140 chars)
```text
Audit ChatGPT, Gemini, and Perplexity citations, flag pricing hallucinations, and ship JSON-LD, /llms.txt, and /agents.md across 7 CMS stacks.
```

### Full Registry Description
```markdown
Verisource is a stateless Streamable HTTP MCP server (`https://mcp.verisource.dev/mcp`) built on MCP TypeScript SDK v2 for B2B Generative Engine Optimization (GEO), 7-platform CMS remediation, and Shopify Universal Commerce Protocol (`/api/ucp/mcp`) readiness.

### Exposed Tools
1. `scan_domain_ai_readiness` (Free Preview — 0 credits, no key required): Returns AI Visibility Score (0-100), 7-platform CMS detection (`Shopify`, `WordPress`, `Webflow`, `Wix`, `Squarespace`, `Framer`, `Next.js`), 3-pillar `schema.org` `JSON-LD` readiness (`Entity Identity`, `FAQPage` Q&A count, `Offer` pricing), `GPTBot` / `OAI-SearchBot` / `PerplexityBot` / `ClaudeBot` WAF & `/robots.txt` access, Shopify `/api/ucp/mcp` + `/agents.md` status, and 1 sample buyer prompt citation check.
2. `get_citation_gaps_and_fanouts` (Pro $99/mo or Agency $249/mo — 1 cached or 10 live credits): Returns 3-engine Mention vs. Citation share, Source-Type categorized citation gap domains (`Reddit`, `G2`, `Clutch`, editorial roundups), channel-specific outreach playbooks, and observed AI search sub-queries across ChatGPT, Google Gemini, and Perplexity.
3. `check_brand_hallucinations` (Pro / Agency — 1 cached or 10 live credits): Diffs live AI claims against a verified Brand Truth Sheet to catch false pricing, shipping thresholds, or discontinued SKU claims.
4. `generate_geo_fix_bundle` (Pro / Agency — 1 cached or 10 live credits): Generates syntax-validated `schema.org` `JSON-LD`, `/llms.txt`, `/agents.md`, `/ai-facts`, Shopify `templates/agents.md.liquid` overrides, and 1-Click AI Remediation Prompts.
```

### Client Configuration JSON (Claude Desktop, Cursor, Windsurf, Antigravity)
```json
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
```
*(Omit `headers` to use the unauthenticated `scan_domain_ai_readiness` preview tool immediately.)*

---

## 2. 12-Channel Distribution & Submission Checklist (Sprint GTM-3)

### A. MCP & Coding-Agent Registries (7 Channels)
1. **Official Model Context Protocol Registry (`registry.modelcontextprotocol.io` — LIVE):**
   - Published as `dev.verisource/mcp@1.0.0` via `server.json` and Ed25519 proof at `https://verisource.dev/.well-known/mcp-registry-auth`.
2. **Glama MCP Directory (`glama.ai/mcp/servers` — SUBMITTED):**
   - Remote Streamable HTTP URL `https://mcp.verisource.dev/mcp` paired with `https://verisource.dev`.
3. **Smithery Registry (`https://smithery.ai/new`):**
   - Connect repository containing `smithery.yaml` or submit Remote Streamable HTTP URL `https://mcp.verisource.dev/mcp` (exposes all 4 tools via HTTP `200` `tools/list`).
4. **PulseMCP Directory (`https://www.pulsemcp.com/submit`):**
   - Submit Remote URL `https://mcp.verisource.dev/mcp`, Homepage `https://verisource.dev`, and Docs `https://verisource.dev/mcp-guide`.
5. **MCP.so Community Index (`https://mcp.so/submit`):**
   - Category: `SEO & Search` · Server Endpoint: `https://mcp.verisource.dev/mcp` · Templates: `https://verisource.dev/templates`.
6. **Cursor Directory (`https://cursor.directory/mcp`):**
   - Submit `.cursor/mcp.json` snippet pointing to `https://mcp.verisource.dev/mcp` with `scan_domain_ai_readiness` (`0` credits) and `generate_geo_fix_bundle`.
7. **`punkpeye/awesome-mcp-servers` GitHub PR Entry (Copy-Paste Markdown Bullet):**
   ```markdown
   - [Verisource GEO & Citation MCP](https://verisource.dev/mcp-guide) `☁️` - Stateless Streamable HTTP MCP server (`https://mcp.verisource.dev/mcp`) to audit ChatGPT, Gemini, and Perplexity citations, flag pricing hallucinations, and generate syntax-validated `JSON-LD`, `/llms.txt`, and `/agents.md` across 7 CMS platforms.
   ```

### B. Browser Extension & B2B Software Comparison Directories (5 Channels)
8. **Microsoft Edge Add-ons Partner Center (`https://partner.microsoft.com/dashboard/microsoftedge`):**
   - Upload the exact Manifest V3 archive `apps/extension/.output/verisourceextension-0.1.0-chrome.zip` (`sidePanel` + `activeTab` only; zero code changes required) and reuse the 24-bit RGB screenshots in `apps/extension/store-assets/`.
9. **G2 (`https://sell.g2.com` — Category: `AI Visibility / SEO Tools`):**
   - Product URL: `https://verisource.dev` · Pricing Tiers: `$19` Audit Pass, `$49/mo` Starter, `$99/mo` Pro + MCP, `$249/mo` Agency White-Label (15 client domains).
10. **Capterra / Gartner Digital Markets (`https://vendors.gartnerdigitalmarkets.com`):**
    - Highlight Read-Write 7-CMS remediation (`JSON-LD`, `/llms.txt`, `/agents.md`, `/ai-facts`) + 60-second white-label `/audit/[slug]` agency pitch reports vs. read-only `$245–$579/mo` trackers.
11. **AlternativeTo (`https://alternativeto.net`):**
    - List Verisource as an action-first alternative to `Profound`, `Otterly.ai`, `Peec AI`, `AthenaHQ`, and `Scrunch AI` linking to `https://verisource.dev/compare`.
12. **SaaSHub (`https://www.saashub.com/submit`):**
    - Submit `https://verisource.dev` with free diagnostic tools at `https://verisource.dev/tools` and open starter templates at `https://verisource.dev/templates`.
