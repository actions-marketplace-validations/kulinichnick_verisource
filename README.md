# Verisource — B2B Generative Engine Optimization (GEO) & Streamable HTTP `/mcp` Platform

**Live Platform:** [https://verisource.dev](https://verisource.dev) · **Streamable HTTP MCP:** `https://mcp.verisource.dev/mcp` · **Official MCP Registry:** `dev.verisource/mcp@1.0.0`

Verisource audits how **ChatGPT Search**, **Google Gemini**, and **Perplexity** cite your brand, catches hallucinated pricing and policy claims against a verified **Brand Truth Sheet**, and generates syntax-validated `schema.org` `JSON-LD`, `/llms.txt`, `/agents.md`, `/ai-facts`, and **You vs. Competitor** HTML comparison pages across **7 CMS platforms** (`Shopify`, `WordPress`, `Webflow`, `Wix`, `Squarespace`, `Framer`, and `Next.js`).

---

## Live Free Tools, Benchmarks & Sandboxes (Zero Account Required)

| Resource | URL | What It Does |
| :--- | :--- | :--- |
| **Free 60-Second Domain Audit** | [verisource.dev/#grader](https://verisource.dev/#grader) | Probes 5 AI crawlers, 3 answer engines, CMS stack, and 3-pillar `JSON-LD` readiness. |
| **2026 40-Domain AI Readiness Study** | [verisource.dev/benchmarks/ai-search-readiness-2026](https://verisource.dev/benchmarks/ai-search-readiness-2026) | Empirical HTTPS crawl dataset across B2B SaaS, Shopify D2C, agencies, and local brands. |
| **4 Free Protocol Validators** | [verisource.dev/tools](https://verisource.dev/tools) | Zero-signup checkers for 3-pillar `JSON-LD` & `FAQPage`, `/llms.txt`, 5-Bot WAF, and Shopify AI. |
| **Interactive 90-Second Console Tour** | [verisource.dev/tutorial](https://verisource.dev/tutorial) | Click-through sandbox for Business Owners, White-Label Agencies, and `/mcp` Developers. |
| **Live Agency White-Label Sandbox** | [verisource.dev/agencies#sandbox](https://verisource.dev/agencies#sandbox) | Preview your agency brand, hex accent bar, and booking URL on any client domain in 15 seconds. |
| **7-CMS Templates & Connectors** | [verisource.dev/connectors](https://verisource.dev/connectors) · [/templates](https://verisource.dev/templates) | Drop-in `verisource-geo-connector.php` WordPress plugin, Shopify OS 2.0 Liquid bridge, and templates. |
| **AI Conversion Payback Calculator** | [verisource.dev/pricing#vs-pricing-roi-calculator](https://verisource.dev/pricing#vs-pricing-roi-calculator) | Models 14.2%–15.9% AI referral buyer conversion vs. 1.76%–2.8% organic baseline across 4 verticals. |
| **25% Recurring Partner Program** | [verisource.dev/partners](https://verisource.dev/partners) | 90-day attribution cookie synced directly to Stripe subscription metadata. |

---

## Connect Claude Desktop, Cursor, Windsurf, or Antigravity in 30 Seconds (`/mcp`)

Verisource runs a stateless **Streamable HTTP** MCP server built on `@modelcontextprotocol/server` v2 at `https://mcp.verisource.dev/mcp` (published on `registry.modelcontextprotocol.io` as `dev.verisource/mcp@1.0.0`, zero deprecated `/sse` routes).

Add this entry to `claude_desktop_config.json`, `.cursor/mcp.json`, or your MCP client settings:

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

> **Zero-Key Preview:** Omit `headers` to invoke `scan_domain_ai_readiness` immediately for `0` credits (3 custom domains/IP/day, 24-hour edge KV cache). Mint a `vs_live_` SHA-256 Bearer key on Pro (`$99/mo` · `1,000` credits/mo, `$0.00` 7-day trial) or Agency (`$249/mo` · `5,000` credits/mo) at [verisource.dev/pricing](https://verisource.dev/pricing).

### Exposed MCP Tools
1. `scan_domain_ai_readiness` (**Free · 0 credits**): Returns AI Visibility Score (`0–100`), 7-platform CMS fingerprint, 3-pillar `JSON-LD` inspection (`Entity Identity`, `FAQPage` Q&A count, `Offer` pricing), 5-bot WAF & `/robots.txt` status, Shopify `/api/ucp/mcp` + `/agents.md` classification, and sample buyer prompt citation check.
2. `get_citation_gaps_and_fanouts` (**Pro / Agency · 1 cached / 10 live credits**): Returns Mention vs. Citation rates across ChatGPT, Gemini, and Perplexity, Source-Type categorized citation gaps (`Reddit`, `G2`, `Clutch`, editorial media), and observed search fanout sub-queries.
3. `check_brand_hallucinations` (**Pro / Agency · 1 cached / 10 live credits**): Diffs multi-engine claims per bullet against your verified Brand Truth Sheet so rival prices never trigger false alerts.
4. `generate_geo_fix_bundle` (**Pro / Agency · 1 cached / 10 live credits**): Outputs syntax-validated `JSON-LD`, `/llms.txt`, `/agents.md`, `/ai-facts`, Shopify `templates/agents.md.liquid`, and 1-Click AI Remediation Prompts.

---

## Key Empirical Findings (2026 40-Domain HTTPS Benchmark)

Direct HTTP probes across 40 commercial domains ([full dataset](https://verisource.dev/benchmarks/ai-search-readiness-2026)):
* **Silent Edge WAF `HTTP 403` Blocks:** `0/40` disallowed `GPTBot` in `/robots.txt`, yet **5.0%** returned `HTTP 403 Forbidden` at the CDN edge when probed with real `GPTBot/1.2` or `PerplexityBot/1.0` headers.
* **SPA Soft-404s & Unedited `/llms.txt` Boilerplate:** `30/40` returned status `200` on `GET /llms.txt`, but **25.0%** were either client-side `text/html` soft-404 shells (`7.5%`) or unedited plugin dumps (`17.5%`). Only **50.0%** serve curated Markdown specifications.
* **80-Point Shopify Agent Truth Gap:** **80.0%** of audited Shopify D2C stores respond on `/api/ucp/mcp`, yet **0.0%** customized `/agents.md` with real shipping thresholds or return windows (`5.0%` across all 40 brands).
* **Missing Answer-First `FAQPage` Schema:** **82.5%** ship base `JSON-LD`, while only **7.5%** include `FAQPage` Q&A nodes.

---

## Monorepo Architecture

| Workspace Package | Purpose | Stack |
| :--- | :--- | :--- |
| `packages/core-geo` | WinterCG-portable intelligence engine: hop-validated SSRF guard, 5-bot WAF prober, 7-CMS detector, 3-pillar `JSON-LD` inspector, Shopify `/api/ucp/mcp` adapter, Hallucination Watchdog, and `vs_live_` SHA-256 key utilities. | TypeScript 5.7, Zod, Web Crypto |
| `packages/ui` | Shared Warm Architectural Paper & Obsidian design system: tactile instrument bezels (`.vs-bezel`), `ThreeTabShell`, `ConsoleQuickJumpBar`, `ConsoleZoneHeader`, `CodeArtifactCard`, `MetricLedgerCell`, `StatusBadge`. | React 19 |
| `apps/web` | Public Instant Grader (`/`), 4-Vertical Motion Storyboard, 3-Step Subscriber Console (`/dashboard`), White-Label Agency Scorecards (`/audit/[slug]`), Free Validators (`/tools/*`), Origin/HMAC Pixel (`/api/pixel`), and Stripe Billing. | Next.js 15 App Router, Supabase, Stripe |
| `apps/mcp-worker` | Stateless Streamable HTTP `/mcp` server (`createMcpHandler`), RFC 9728 Protected Resource metadata, KV-cached SHA-256 Bearer + OAuth 2.0 auth, atomic credit metering, and scheduled cron scanner. | Cloudflare Workers (`nodejs_compat`) |
| `apps/extension` | Least-privilege (`['sidePanel', 'activeTab']` only) Chrome Side Panel sharing `packages/ui` and `packages/core-geo`. | WXT 0.19, Manifest V3 |

---

## Local Development & Verification Suite

Out of the box, `PROVIDER_MODE=mock` runs real outbound HTTPS/WAF probes while simulating LLM answer snapshots, Supabase state, and Stripe checkout locally with zero external API keys required.

```bash
# Install workspace dependencies
pnpm install

# Start the Next.js Web Platform & 3-Step Console (http://localhost:3000)
pnpm dev:web

# Start the Cloudflare Streamable HTTP /mcp Worker (http://localhost:8787/mcp)
pnpm dev:mcp

# Run all unit, /mcp Worker, production build, and live HTTP E2E suites
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @verisource/web test:e2e
```

---

## Discovery & Protocol Endpoints

* **Web Origin MCP Manifest:** [https://verisource.dev/.well-known/mcp.json](https://verisource.dev/.well-known/mcp.json)
* **Worker Origin MCP Manifest:** [https://mcp.verisource.dev/.well-known/mcp.json](https://mcp.verisource.dev/.well-known/mcp.json)
* **RFC 9728 OAuth Protected Resource:** [https://mcp.verisource.dev/.well-known/oauth-protected-resource](https://mcp.verisource.dev/.well-known/oauth-protected-resource)
* **Self-GEO `/llms.txt` & `/agents.md`:** [https://verisource.dev/llms.txt](https://verisource.dev/llms.txt) · [https://verisource.dev/agents.md](https://verisource.dev/agents.md)
* **Privacy & Terms:** [https://verisource.dev/privacy](https://verisource.dev/privacy) · [https://verisource.dev/terms](https://verisource.dev/terms)
