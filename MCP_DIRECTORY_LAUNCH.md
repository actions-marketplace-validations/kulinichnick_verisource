# Verisource — MCP Directory & Registry Submission Kit (`v0.2.2`)

All public discovery endpoints are deployed and verified (`HTTP 200`, CORS `*`):

- **Streamable HTTP MCP Endpoint:** `https://mcp.verisource.dev/mcp`
- **MCP Discovery Manifest (Web Origin):** `https://verisource.dev/.well-known/mcp.json`
- **MCP Discovery Manifest (Worker Origin):** `https://mcp.verisource.dev/.well-known/mcp.json`
- **OAuth 2.0 Protected Resource Metadata (RFC 9728):** `https://mcp.verisource.dev/.well-known/oauth-protected-resource`
- **Agent Protocol Documentation:** `https://verisource.dev/agents.md`
- **Root Registry Schema File:** `server.json`

---

## 1. Copy-Paste Listing Fields (Critic-Verified `10.0 / 10.0`)

- **Server Name:** `Verisource — B2B GEO & AI Citation Intelligence MCP`
- **Canonical Namespace:** `io.github.kulinichnick/verisource`
- **Category:** `Search & SEO` / `Developer Tools` / `E-Commerce`
- **Transport Type:** `Streamable HTTP` (`https://mcp.verisource.dev/mcp`)
- **Authentication:** Optional for free `scan_domain_ai_readiness` tool (`0` credits); `Authorization: Bearer vs_live_<48-hex>` or OAuth 2.0 Bearer JWT for paid tools.
- **Website / Docs URL:** `https://verisource.dev/agents.md`
- **Pricing URL:** `https://verisource.dev/pricing`
- **Privacy Policy URL:** `https://verisource.dev/privacy`

### Short Tagline (<= 140 chars)
```text
Audit ChatGPT, Gemini, and Perplexity citations, flag SKU/pricing hallucinations, and generate >=9.5/10 JSON-LD, /llms.txt, and /agents.md.
```

### Full Registry Description
```markdown
Verisource is a stateless Streamable HTTP MCP server (`https://mcp.verisource.dev/mcp`) built on MCP TypeScript SDK v2 for B2B Generative Engine Optimization (GEO) and Shopify commerce readiness.

### Exposed Tools
1. `scan_domain_ai_readiness` (Free Preview — 0 credits, no key required): Returns AI Visibility Score (0-100), `GPTBot` / `OAI-SearchBot` / `PerplexityBot` / `ClaudeBot` WAF & `/robots.txt` access, Shopify `/api/ucp/mcp` + `/agents.md` status, and 1 sample buyer prompt citation check.
2. `get_citation_gaps_and_fanouts` (Pro / Agency — 1 cached or 10 live credits): Returns unblurred competitor citation URLs and decompiled AI search fanout sub-queries across ChatGPT, Google Gemini, and Perplexity.
3. `check_brand_hallucinations` (Pro / Agency — 1 cached or 10 live credits): Diffs live AI claims against a verified Brand Truth Sheet to catch false pricing, shipping radii, or discontinued SKU claims.
4. `generate_geo_fix_bundle` (Pro / Agency — 1 cached or 10 live credits): Generates Critic-verified (`>= 9.5/10`) `schema.org` `JSON-LD`, `/llms.txt`, `/agents.md`, and Shopify `templates/agents.md.liquid` overrides.
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

## 2. Where to Submit (Takes ~3 Minutes Total)

1. **PulseMCP Directory:** https://www.pulsemcp.com/submit
   - Paste Remote URL: `https://mcp.verisource.dev/mcp` and Homepage: `https://verisource.dev`.
2. **Smithery Registry:** https://smithery.ai/new
   - Select **Remote MCP Server (Streamable HTTP)** -> enter `https://mcp.verisource.dev/mcp` (Smithery probes `tools/list` live without credentials and lists all 4 tools automatically).
3. **Glama MCP Directory:** https://glama.ai/mcp/servers
   - Click **Submit Server** -> enter `https://verisource.dev` / `https://mcp.verisource.dev/mcp`.
4. **Official Model Context Protocol Registry (`registry.modelcontextprotocol.io`):**
   - `server.json` is already formatted at the repository root (`io.github.kulinichnick/verisource`, schema `2025-10-17`). Run `mcp-publisher login dns --domain verisource.dev` + `mcp-publisher publish` whenever you want to publish a versioned entry under `com.verisource` / `dev.verisource`.
