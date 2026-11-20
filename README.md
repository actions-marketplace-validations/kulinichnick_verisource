# Verisource — B2B Generative Engine Optimization (GEO) & Streamable HTTP `/mcp` Platform

[![AI Search Readiness — Verisource](https://verisource.dev/api/badge/verisource.dev)](https://verisource.dev/reports)

**Live Platform:** [https://verisource.dev](https://verisource.dev) · **Streamable HTTP MCP:** `https://mcp.verisource.dev/mcp` · **1-Click OAuth 2.1 Connector:** `https://mcp.verisource.dev/oauth/mcp` · **Hosted Brand `/mcp` Demo:** `https://mcp.verisource.dev/b/verisource.dev/mcp` · **Official MCP Registry:** `dev.verisource/mcp@1.0.0` · **Cursor Directory:** [verisource-geo-ai-citation-mcp](https://cursor.directory/plugins/verisource-geo-ai-citation-mcp) · **Chrome Web Store:** [Install Side Panel](https://chromewebstore.google.com/detail/hkkihmaeffcpapckhiciaaadbanbjddb)

Verisource audits how **ChatGPT Search**, **Google Gemini**, and **Perplexity** cite your brand, catches hallucinated pricing and policy claims against a verified **Brand Truth Sheet**, and generates syntax-validated `schema.org` `JSON-LD`, `/llms.txt`, `/agents.md`, `/ai-facts`, and **You vs. Competitor** HTML comparison pages across **7 CMS platforms** (`Shopify`, `WordPress`, `Webflow`, `Wix`, `Squarespace`, `Framer`, and `Next.js`).

---

## Live Free Tools, Benchmarks & Sandboxes (Zero Account Required)

| Resource | URL | What It Does |
| :--- | :--- | :--- |
| **Free 60-Second Domain Audit** | [verisource.dev/#scan](https://verisource.dev/#scan) | Probes 5 AI crawlers, 3 answer engines, 5-page link health (`VerisourceScan/1.0`), CMS stack, and 3-pillar `JSON-LD` readiness. |
| **Public Audited Brand Directory** | [verisource.dev/reports](https://verisource.dev/reports) | Searchable protocol leaderboard and live SVG readiness badges across 520+ audited SaaS and commerce domains. |
| **Head-to-Head Domain X-Ray** | [verisource.dev/vs](https://verisource.dev/vs) | Side-by-side 6-dimension HTTP protocol, WAF, and `JSON-LD` benchmark for any two public domains. |
| **11-Capability Platform & CLI Tour** | [verisource.dev/features](https://verisource.dev/features) | Interactive split-screen walkthroughs for AI search verification, browser flow replay, route mapping, and log correlation. |
| **Crawler Transparency Spec** | [verisource.dev/scanner](https://verisource.dev/scanner) | Public `VerisourceScan/1.0` User-Agent specification, rate limits, and `/robots.txt` opt-out controls. |
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

> **1-Click Claude Web (`claude.ai`) & ChatGPT Connectors (Zero API Keys):** In Claude (`Settings → Connectors → Add Custom Connector`) or ChatGPT Connectors, paste `https://mcp.verisource.dev/oauth/mcp` and approve in 1 click via OAuth 2.1 + PKCE `S256`.
> **Zero-Key Preview:** Omit `headers` on `https://mcp.verisource.dev/mcp` to invoke `scan_domain_ai_readiness` immediately for `0` credits (3 custom domains/IP/day, 24-hour edge KV cache). Mint a `vs_live_` SHA-256 Bearer key on Pro (`$99/mo` · `1,000` credits/mo, `$0.00` 7-day trial) or Agency (`$249/mo` · `5,000` credits/mo) at [verisource.dev/pricing](https://verisource.dev/pricing).

### Exposed MCP Tools
1. `scan_domain_ai_readiness` (**Free · 0 credits**): Returns AI Visibility Score (`0–100`), 7-platform CMS fingerprint, 3-pillar `JSON-LD` inspection (`Entity Identity`, `FAQPage` Q&A count, `Offer` pricing), 5-bot WAF & `/robots.txt` status, Shopify `/api/ucp/mcp` + `/agents.md` classification, and sample buyer prompt citation check.
2. `get_citation_gaps_and_fanouts` (**Pro / Agency · 1 cached / 10 live credits**): Returns Mention vs. Citation rates across ChatGPT, Gemini, and Perplexity, Source-Type categorized citation gaps (`Reddit`, `G2`, `Clutch`, editorial media), and observed search fanout sub-queries.
3. `check_brand_hallucinations` (**Pro / Agency · 1 cached / 10 live credits**): Diffs multi-engine claims per bullet against your verified Brand Truth Sheet so rival prices never trigger false alerts.
4. `generate_geo_fix_bundle` (**Pro / Agency · 1 cached / 10 live credits**): Outputs syntax-validated `JSON-LD`, `/llms.txt`, `/agents.md`, `/ai-facts`, Shopify `templates/agents.md.liquid`, and 1-Click AI Remediation Prompts.
5. `compare_competitor_protocol_xray` (**Pro / Agency · 1 cached / 10 live credits**): Benchmarks `own_domain` vs. `rival_domain` across 6 HTTP & schema dimensions and generates an overtake prompt + `[Brand] vs. [Rival]` HTML page.

### Hosted Customer Brand `/mcp` + W3C Chrome `WebMCP` (`navigator.modelContext`) Infrastructure
Every Starter (`$49/mo`), Pro (`$99/mo`), and Agency (`$249/mo`) domain automatically receives a **hosted, read-only Brand Truth MCP Server** (`https://mcp.verisource.dev/b/{domain}/mcp`) plus an edge-cached **W3C Chrome `WebMCP` script** (`https://mcp.verisource.dev/b/{domain}/webmcp.js`) exposing `get_verified_pricing_and_offers`, `verify_brand_claim`, `compare_with_competitor`, and `get_official_faqs` from a 2-line `<head>` embed—zero backend code required.

---

## Local-First CLI & Deterministic Browser Flow Verifier (`@verisource/cli`)

Run AI readiness checks, 20-page link health crawls, static Next.js/React route mapping, and deterministic `.verisource/workflows/*.json` replays from any terminal or CI runner on Node.js 20+ (zero runtime sub-dependencies):

```bash
# Audit AI crawler WAF rules, JSON-LD, /llms.txt, /agents.md & 20-page site health
npx @verisource/cli scan https://verisource.dev

# Enforce CI policy checks (.verisource/checks.json -> exit 0 pass, 1 fail, 2 error)
npx @verisource/cli verify https://verisource.dev --init

# Map static Next.js / React routes + JSON-LD emitters or install coding agent skills
npx @verisource/cli map . --diff
npx @verisource/cli agent --skill --install all

# Direct zero-auth HTTPS tarball execution (works anywhere before npm login)
npx https://verisource.dev/downloads/verisource-cli.tgz --help
```

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
| `packages/core-geo` | WinterCG-portable intelligence engine: hop-validated SSRF guard, 5-bot WAF prober, `VerisourceScan/1.0` site health crawler, 7-CMS detector, 3-pillar `JSON-LD` inspector, Shopify `/api/ucp/mcp` adapter, Hallucination Watchdog, and `vs_live_` SHA-256 key utilities. | TypeScript 5.7, Zod, Web Crypto |
| `packages/cli` | Standalone `esbuild`-bundled `@verisource/cli` binary: `scan`, `verify`, `show`, `query`, `map`, `browse`, `record`, `run`, `workflow check`, `log`, and `agent --skill --install`. | Node.js 20+ ESM |
| `packages/ui` | Shared Obsidian Slate & Warm Brass design system (`.vs-audit-paper-surface` light-paper report isolation): `ThreeTabShell`, `CopyCommandPill`, `LightBrowserFrame`, `ConsoleQuickJumpBar`, `CodeArtifactCard`, `MetricLedgerCell`, `StatusBadge`. | React 19 |
| `apps/web` | 8-Band Dark Studio Homepage (`/`), 11-Capability `/features` & `/scanner`, 3-Step Subscriber Console (`/dashboard`), White-Label Agency Scorecards (`/audit/[slug]`), Free Validators (`/tools/*`), Origin/HMAC Pixel (`/api/pixel`), and Stripe Billing. | Next.js 15 App Router, Supabase, Stripe |
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
