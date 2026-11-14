# Verisource (`verisource.dev` · `mcp.verisource.dev`)

Universal B2B Generative Engine Optimization (GEO), Hallucination Watchdog, and Monetized Streamable HTTP `/mcp` Platform—with a built-in Shopify Deep-Catalog Adapter (`/api/ucp/mcp` + `/api/mcp`) and a Manifest V3 Chrome Side Panel Extension.

---

## Monorepo Architecture (`C:\dev\verisource`)

| Workspace Package | Purpose | Key Tech |
| :--- | :--- | :--- |
| `packages/core-geo` | WinterCG-portable intelligence engine: SSRF-safe HTTP & simulated `GPTBot`/`PerplexityBot` WAF prober, Shopify `/api/ucp/mcp` + `/agents.md` classifier, Hallucination Watchdog, Query Fanout Decompiler, 9.5/10 Adversarial Quality Critic, and SHA-256 `vs_live_` key generator. | TypeScript 5.7, Zod, Web Crypto |
| `packages/ui` | Stateless editorial UI primitives (`VerisourceStyleTag`, `ThreeTabShell`, `CodeArtifactCard`, `MetricLedgerCell`, `StatusBadge`). High-contrast `#0F172A` slate hierarchy, `1px` borders, `tabular-nums` data tables. | React 19 |
| `apps/web` | Public Instant Domain Grader (`/`), Pricing Ladder (`/pricing`), 3-Tab GEO Console (`/dashboard`), White-Label Agency Pitch Views (`/audit/[slug]`), Origin-verified Revenue Pixel (`/api/pixel`), and Stripe Checkout + Webhooks. | Next.js 15 App Router, Stripe, Supabase |
| `apps/mcp-worker` | Stateless Streamable HTTP MCP Server at `/mcp` (`createMcpHandler` from `@modelcontextprotocol/server` v2.4.0), RFC 9728 OAuth Protected Resource metadata, free preview tool + 3 paid metered tools (`1` cached / `10` live credits), and scheduled cron scanner. | Cloudflare Workers (`nodejs_compat`), Zod v4 |
| `apps/extension` | Least-privilege (`['sidePanel', 'activeTab']` only) Chrome Side Panel inspector sharing `packages/ui` and `packages/core-geo`. | WXT 0.19, Manifest V3 |

---

## Local Quickstart (Zero API Keys Required)

Out of the box, `PROVIDER_MODE=mock` runs real HTTP/WAF storefront probes while simulating multi-engine prompts, Supabase state, and Stripe checkout locally—pre-loaded with Patient Zero stores **Aurea Coffee Roasters (`aurearoasters.com`)** and **Mosaic Coffee Roasters (`mosaicroasters.com`)**.

> **Windows PowerShell Note:** If PowerShell blocks `npx.ps1` via `ExecutionPolicy`, wrap commands in `cmd /c "..."` as shown below.

### 1. Run the Web SaaS & 3-Tab Console (`http://localhost:3000`)
```bat
cmd /c "cd /d C:\dev\verisource && npx --yes pnpm@9.15.0 dev:web"
```
* **Landing Page & Live Grader:** `http://localhost:3000`
* **3-Tab GEO Console:** `http://localhost:3000/dashboard`
* **Sample White-Label Agency Pitch URL:** `http://localhost:3000/audit/mosaic-springfield-audit`
* **Pricing Ladder (\$19 Tripwire -> \$49 / \$99 / \$249):** `http://localhost:3000/pricing`

### 2. Run the Streamable HTTP `/mcp` Worker (`http://localhost:8787/mcp`)
```bat
cmd /c "cd /d C:\dev\verisource && npx --yes pnpm@9.15.0 dev:mcp"
```
Connect Claude Desktop, Cursor, Windsurf, or Antigravity using Streamable HTTP (no deprecated `/sse`):
```json
{
  "mcpServers": {
    "verisource": {
      "url": "http://localhost:8787/mcp",
      "headers": {
        "Authorization": "Bearer vs_demo_pro_key"
      }
    }
  }
}
```

### 3. Load the Chrome MV3 Side Panel Extension
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** ON (top right).
3. Click **Load unpacked** and select:
   `C:\dev\verisource\apps\extension\.output\chrome-mv3`
   *(Chrome Web Store release archive is packaged at `C:\dev\verisource\apps\extension\.output\verisourceextension-0.1.0-chrome.zip`.)*
4. Click the **Verisource** extension icon on any tab to open the 3-Tab Side Panel.

---

## Verification & Automated Test Suites

Run every unit, security, `/mcp` protocol, and live HTTP end-to-end test suite from `C:\dev\verisource`:

```bat
:: 1. Core GEO Engine, 9.5/10 Critic, SSRF & RLS Schema Invariants (7 tests)
cmd /c "cd /d C:\dev\verisource && npx --yes pnpm@9.15.0 --filter @verisource/core-geo test"

:: 2. Stateless Streamable HTTP /mcp Tools & Credit Metering (4 tests)
cmd /c "cd /d C:\dev\verisource && npx --yes pnpm@9.15.0 --filter @verisource/mcp-worker test"

:: 3. Production Next.js Live HTTP E2E & Adversarial Route Suite (9 checks)
cmd /c "cd /d C:\dev\verisource && npx --yes pnpm@9.15.0 --filter @verisource/web test:e2e"

:: 4. Full Monorepo Strict Typecheck & Production Build (5 packages)
cmd /c "cd /d C:\dev\verisource && npx --yes pnpm@9.15.0 -r typecheck && npx --yes pnpm@9.15.0 -r build"
```

---

## Production Cutover Checklist (`verisource.dev` & `mcp.verisource.dev`)

1. **Supabase PostgreSQL + RLS Setup:**
   * Create a new Supabase project and run `C:\dev\verisource\schema.sql` in the SQL Editor (creates all 8 tables, RLS policies, `trg_protect_profile_billing`, `consume_mcp_credits`, `consume_mcp_credits_for_user`, and `get_public_pitch_report`).
   * Optionally run `C:\dev\verisource\seed.sql` to preload Patient Zero benchmarks.
2. **Environment Configuration:**
   * Copy `C:\dev\verisource\.env.example` to `C:\dev\verisource\apps\web\.env.local`.
   * Set `PROVIDER_MODE=live` (or leave unset for per-provider auto-upgrade as keys are added) and populate `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `GEMINI_API_KEY` (plus optional `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `FIRECRAWL_API_KEY`).
3. **Deploy Web App & `/mcp` Worker:**
   * Deploy `apps/web` to Vercel or Cloudflare Pages bound to `verisource.dev`, pointing Stripe webhooks (`checkout.session.completed`, `customer.subscription.deleted`, `invoice.paid`) to `https://verisource.dev/api/webhooks/stripe`.
   * Create a Cloudflare KV namespace for `VERISOURCE_CACHE`, add Worker secrets via `wrangler secret put`, and deploy `apps/mcp-worker` to `mcp.verisource.dev`.
