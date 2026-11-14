# STATUS.md — Compaction-Proof Build Ledger & Milestone Tracker

> **COMPACTION RECOVERY PROTOCOL (READ FIRST ON NEW OR COMPACTED SESSIONS):**
> 1. Read `GEMINI.md`, `SPEC.md`, `schema.sql`, and `.agents/skills/quality-gate-95/SKILL.md` before writing code.
> 2. Check the **Current Build State** and **Locked Architectural Invariants** below.
> 3. Every customer-facing string, UI view, and generated GEO artifact (`JSON-LD`, `/llms.txt`, `/agents.md`, FAQs, outreach briefs) MUST score **>= 9.5 / 10.0** on `quality-gate-95`.
> 4. End EVERY turn with the exact `NEXT STEP & MODEL DIRECTIVE` callout required by `GEMINI.md`.

## Current Build State
* **Active Phase:** PRODUCTION LIVE, FULL SELF-SERVE LIFECYCLE COMPLETE & CHROME WEB STORE READY (`M0.1` through `M12` — `https://verisource.dev` + `https://mcp.verisource.dev/mcp` live, Supabase schema + Patient Zero seeded, live Paid `/mcp` credit metering verified, `23/23` automated unit/MCP/E2E assertions passed (`7/7` core-geo + `4/4` mcp-worker + `12/12` Next.js E2E), Chrome MV3 `.zip` + Store Launch Kit ready).
* **Brand / Domain:** **Verisource** (`verisource.dev` | MCP: `mcp.verisource.dev`)
* **Workspace Path:** `C:\dev\verisource` (local SSD; `STATUS.md` mirrored to `g:\My Drive\GEO MCP Engine\STATUS.md`)
* **Patient Zero Seed Stores (Confirmed):** `aurearoasters.com` (Aurea Coffee Roasters) & `mosaicroasters.com` (Mosaic Coffee Roasters)
* **Provider Mode Matrix:** `PROVIDER_MODE=mock` default out-of-the-box (zero external API keys required for local dev; live HTTP `fetch` checks work immediately without keys; auto-upgrades per provider as `GEMINI_API_KEY`, `SUPABASE_*`, `STRIPE_*`, `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, or `FIRECRAWL_API_KEY` are added).
* **Shell Note (Windows):** Run `pnpm` via `cmd /c "cd /d C:\dev\verisource && npx --yes pnpm@9.15.0 <args>"` to bypass PowerShell `npx.ps1` `ExecutionPolicy` blocks.

## Locked Architectural Invariants
1. **3-Tab UI Cap:** Both `apps/web` and `apps/extension` share stateless primitives from `packages/ui` (`VerisourceStyleTag`, `ThreeTabShell`, `CodeArtifactCard`, `MetricLedgerCell`, `StatusBadge`) and strictly enforce the 3-Tab layout (Tab 1: Visibility, Hallucinations & ROI; Tab 2: One-Click 9.5+/10 On-Site Fixes + Shopify Adapter; Tab 3: Fanout Citations, 60s Agency Pitch Links & MCP Hub).
2. **2026 Stateless MCP Server:** `apps/mcp-worker` uses `createMcpHandler` (`@modelcontextprotocol/server` v2.4.0) at `/mcp` (`nodejs_compat` enabled). Never use deprecated `/sse`.
3. **MCP Metering & Auth (Confirmed):** Native Cloudflare Worker dual auth (SHA-256 `mcp_api_keys` Bearer tokens cached 60s in KV + OAuth 2.0 Supabase JWTs + RFC 9728 `/.well-known/oauth-protected-resource`). Cached read tools cost **1 credit**; live scan/generation tools cost **10 credits** via atomic `consume_mcp_credits` RPC.
4. **Shopify 2026 Protocol Support (Confirmed):** Probe both `/api/ucp/mcp` (Universal Commerce Protocol) and legacy `/api/mcp`, classifying `/agents.md` into `missing`, `default_boilerplate`, or `custom_enriched`.
5. **Database Security (Committed in `schema.sql`):** Supabase RLS enforced across all 8 tables; `profiles` billing columns (`plan_tier`, `stripe_*`, `mcp_calls_*`) protected by `trg_protect_profile_billing` against client-side privilege escalation; public `/audit/[slug]` served exclusively via scoped `get_public_pitch_report` RPC.
6. **MV3 Extension Least-Privilege:** `apps/extension/wxt.config.ts` strictly limits permissions to `['sidePanel', 'activeTab']` only—no `<all_urls>` host permissions or background content-script scraping without user action.

---

## Sequential Build Milestones & Model Routing Plan

### [x] M0.1 — File Hygiene, Locked Docs & Security-Hardened `schema.sql` *(DONE)*
* **Completed:** Root files renamed (`GEMINI.md`, `SPEC.md`, `schema.sql`); `.agents/skills/quality-gate-95/SKILL.md` written; `SPEC.md` updated; `schema.sql` hardened with RLS policies, `trg_protect_profile_billing`, `on_auth_user_created`, FK indexes, `agency_cta_url`, `get_public_pitch_report`, and `consume_mcp_credits`.

### [x] M0.2 — Monorepo Directory Scaffold & Package Installation *(DONE)*
* **Completed:** Cloned docs to `C:\dev\verisource`; locked `Verisource` (`verisource.dev` / `mcp.verisource.dev`); initialized `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.env.example`, and all 5 workspace packages (`packages/core-geo`, `packages/ui`, `apps/web`, `apps/mcp-worker`, `apps/extension`); ran `pnpm install`.

### [x] M1 — Database Types & Patient Zero Seed Suite (`aurearoasters.com` & `mosaicroasters.com`) *(DONE)*
* **Completed:** Generated strict TypeScript schema types in `packages/core-geo/src/db/types.ts`, idempotent `seed.sql`, and deterministic Patient Zero fixtures in `packages/core-geo/src/fixtures/patient-zero.ts`; verified `tsc --noEmit` passes.

### [x] M2 — `packages/core-geo` Intelligence Engine & 9.5/10 Adversarial Critic *(DONE)*
* **Completed:** Built `env.ts`, `quality-gate.ts` (5-pillar >=9.5/10 Critic + auto-sanitizer), `bot-waf-prober.ts` (SSRF-safe HTTP + simulated bot WAF prober + soft-404 guard), `shopify-adapter.ts` (`/api/ucp/mcp` + `/api/mcp` + boilerplate classifier), `hallucination-watchdog.ts`, `fanout-scanner.ts` (Gemini/OpenAI/Perplexity live + deterministic mock), `fix-generator.ts`, `audit-domain.ts`, `api-key.ts`, `pixel/snippet.ts`, and `.agents/skills/geo-audit-runner/SKILL.md`. All 6 Patient Zero & security tests pass (`6/6`), zero `node:*` imports (100% browser/Worker portable).

### [x] M3 — `apps/mcp-worker` Monetized Streamable HTTP `/mcp` Server & Cron Scanner *(DONE)*
* **Completed:** Built stateless Streamable HTTP `/mcp` Cloudflare Worker using `createMcpHandler` (`@modelcontextprotocol/server` v2.4.0, `nodejs_compat`), RFC 9728 `/.well-known/oauth-protected-resource`, free `scan_domain_ai_readiness` (24h cached + 3/IP/day rate limit), 3 paid tools (`get_citation_gaps_and_fanouts`, `check_brand_hallucinations`, `generate_geo_fix_bundle`), SHA-256 Bearer + OAuth JWT metering (`1` cached / `10` live credits), and chunked cron scanner. Passed `4/4` `/mcp` integration tests and `wrangler deploy --dry-run` (`406.8 KiB` gzip).

### [x] M4 — Editorial Design System, Public Grader & AI Attribution Pixel (`packages/ui` + `apps/web` Part 1) *(DONE)*
* **Completed:** Built `@verisource/ui` (`styles.ts`, `style-tag.tsx`, `primitives.tsx`) in high-contrast Linear/Stripe/Vercel aesthetic (`1px` slate borders, `tabular-nums`, zero purple/neon gradients); built `apps/web` Landing Page (`src/app/page.tsx`), `PublicGraderClient.tsx`, `/api/grader` (SSRF-safe + IP rate-limited), and `/api/pixel` (Origin-verified attribution telemetry).

### [x] M5 — 3-Tab Web Dashboard & 60-Second Agency White-Label Pitch Mode (`apps/web` Part 2) *(DONE)*
* **Completed:** Built `/login` (Supabase Magic Link + 1-click Patient Zero demo workspace), `/dashboard` (`DashboardConsoleClient.tsx` enforcing strict 3-Tab cap: Tab 1 Hallucination Watchdog + editable Brand Truth Sheet + AI Revenue Pixel; Tab 2 Critic-verified >=9.5/10 fixes + Shopify `agents.md.liquid` deployment guide; Tab 3 Query Fanout Decompiler, 60s White-Label Pitch generator, and `/mcp` key minting hub), plus `/audit/[slug]` white-label prospect pitch view and `/api/dashboard/*` routes.

### [x] M6 — Stripe Billing Ladder & Entitlement Webhooks *(DONE)*
* **Completed:** Built `PricingLadderSection.tsx`, `/pricing`, `/api/checkout` (\$19 Tripwire pass with automatic 7-day -\$19 upgrade discount + \$49 Starter / \$99 Pro+MCP / \$249 Agency monthly & annual + local zero-key mock simulation), `/api/billing/portal`, and `/api/webhooks/stripe` (HMAC-SHA256 `Stripe-Signature` verification + replay idempotency + entitlement sync). Verified `tsc --noEmit` and `next build` (16/16 routes, `0` errors, `0` banned lexicon hits).

### [x] M7 — `apps/extension` WXT Manifest V3 Chrome Extension (Side Panel) *(DONE)*
* **Completed:** Configured `apps/extension/wxt.config.ts` with Vite JSX transform and strict least-privilege `permissions: ['sidePanel', 'activeTab']`; built `entrypoints/background.ts` (`setPanelBehavior({ openPanelOnActionClick: true })`), `entrypoints/sidepanel/index.html`, `main.tsx`, and `App.tsx` reusing `@verisource/ui` (`ThreeTabShell` compact mode, `VerisourceStyleTag`, `CodeArtifactCard`, `MetricLedgerCell`, `StatusBadge`) and `@verisource/core-geo` (`runFullGeoAudit`, Patient Zero presets, and `/api/grader` live sync). Verified `wxt prepare`, `tsc --noEmit`, `wxt build` (`368.1 kB`, `manifest_version: 3`), and zero banned Quality Gate phrases.

### [x] M8 — Adversarial Security, RLS, Webhook & Type Audit *(DONE)*
* **Completed:** Conducted full adversarial security audit and patched 5 attack vectors:
  1. `schema.sql`: Hardened `protect_profile_billing_columns()` trigger (`current_user` + `request.jwt.claim.role`), added `^#[0-9A-Fa-f]{6}$` and `^https?://` check constraints on `agency_primary_color` and `agency_cta_url`, and added atomic `consume_mcp_credits_for_user` RPC (`FOR UPDATE` row lock) for OAuth 2.0 JWT callers.
  2. `/api/pixel`: Closed headerless `curl` Origin-bypass vulnerability by requiring `Origin` or `Referer` to match the registered domain and forcing `conversion_value_usd = null` on non-conversion events.
  3. `/api/webhooks/stripe`: Added strict `ALLOWED_PLANS`/`ALLOWED_CYCLES` validation, cleared `tripwire_paid_at = null` on recurring subscription upgrade to block 7-day coupon replay, and deferred `processed.add(event.id)` until after DB write success.
  4. `/api/dashboard/pitch` & `/audit/[slug]`: Added strict hex color and `http(s)://` URL sanitization to block `javascript:`/`data:` XSS and CSS injection.
  5. `apps/mcp-worker/src/auth.ts`: Enforced strict `/^vs_live_[0-9a-f]{48}$/` format and bounded map size (`<= 500`) in local mock mode, plus atomic `consume_mcp_credits_for_user` RPC in live OAuth mode.
  6. Verified `pnpm -r typecheck` (`5/5` packages), `pnpm -r build` (`5/5` packages), `@verisource/core-geo test` (`7/7` pass), and `@verisource/mcp-worker test` (`4/4` pass).

### [x] M9 — Patient Zero End-to-End Verification & Release Packaging *(DONE)*
* **Completed:**
  1. Packaged Chrome Web Store Manifest V3 archive via `wxt zip` at `C:\dev\verisource\apps\extension\.output\verisourceextension-0.1.0-chrome.zip` (`110.26 kB`) alongside unpacked directory `.output\chrome-mv3`.
  2. Built and ran live production Next.js HTTP E2E test suite (`apps/web/scripts/verify-e2e.mjs` via `pnpm --filter @verisource/web test:e2e`): **`9/9` checks passed** (Landing Page zero-slop verification, `aurearoasters.com` & `mosaicroasters.com` `/api/grader`, SSRF `169.254.169.254` rejection, `/api/pixel` headerless & spoofed Origin `403` blocks + valid `201` conversion ingestion, `/dashboard` + `/audit/mosaic-springfield-audit` rendering, `javascript:` CTA `400` block + minted `/audit/[slug]` `200`, `vs_live_` SHA-256 key minting, Brand Truth Sheet `>= 9.5/10` regeneration, and \$19 Tripwire -> automatic 7-day `-\$19` single-use upgrade credit).
  3. Wrote developer & production cutover guide in `README.md` and ran full-monorepo `quality-gate-95` audit across all `52` deliverable `.ts`, `.tsx`, `.sql`, and `.md` files (`0` banned lexicon or cliché matches).

### [x] M10 — Production Cutover Hardening, Authenticated Supabase Persistence & Live MCP Verification *(DONE)*
* **Completed:**
  1. Deployed Cloudflare Worker `verisource-mcp-worker` (`https://mcp.verisource.dev/mcp`) with KV `VERISOURCE_CACHE` (`50e2a82027584c8e97ac8281522f27cf`) and verified live Streamable HTTP `tools/list`, `scan_domain_ai_readiness`, RFC 9728 `/.well-known/oauth-protected-resource` (`200 OK`), and live paid Bearer key (`vs_live_`) calling `check_brand_hallucinations` with atomic credit deduction (`142 -> 143` via `consume_mcp_credits`).
  2. Deployed Vercel Production `verisource` (`https://verisource.dev`) with live Supabase, Gemini, and Stripe keys + DNS cutover (`76.76.21.21`, `200 OK`) + Supabase Auth URL Configuration (`https://verisource.dev/**`).
  3. Hardened `schema.sql` to be 100% idempotent, executed across `verisource-prod`, and seeded full Patient Zero dataset via `apps/web/scripts/seed-supabase.mjs`.
  4. Wired verified Supabase JWT authentication (`resolveAuthenticatedProfile`) across `/api/dashboard/state`, `/api/dashboard/domains`, `/api/dashboard/truth-sheet`, `/api/dashboard/pitch`, `/api/dashboard/mcp-keys`, `/api/checkout`, and `/api/billing/portal`, plus frictionless Guest-to-Account Stripe webhook provisioning in `/api/webhooks/stripe`.
  5. Updated Chrome MV3 Extension (`apps/extension`) default origin to `https://verisource.dev` and added `OPTIONS` + CORS headers on `/api/grader` for `chrome-extension://` sidepanels.

### [x] M11 — Self-GEO Dogfooding (`verisource.dev`) & Chrome Web Store Submission Readiness *(DONE)*
* **Completed:**
  1. Added Critic-verified (`>= 9.5/10`) `/llms.txt`, `/agents.md` (`custom_enriched`), `/robots.txt` (explicit `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended` allowlist), `/sitemap.xml`, and dual `application/ld+json` blocks (`SoftwareApplication` + `FAQPage`) on `https://verisource.dev` so `verisource.dev` eats its own dogfood when prospects test it in the live grader.
  2. Published Chrome Web Store & Stripe mandatory `/privacy` (documenting `sidePanel` + `activeTab` least-privilege architecture) and `/terms` pages on `https://verisource.dev`.
  3. Generated crisp monochrome `#0F172A` + `#FFFFFF` `V` monogram PNG icons (`16x16`, `32x32`, `48x48`, `128x128`), wired them into `apps/extension/wxt.config.ts`, eliminated cross-origin `fetch` noise inside `sidepanel.html` via `skipDirectHttpProbe: true` + CORS `/api/grader` sync (`0` errors in `chrome://extensions`), rebuilt `verisourceextension-0.1.0-chrome.zip` (`115 kB`), wrote ready-to-paste Chrome Web Store review copy in `CHROME_WEB_STORE_LAUNCH.md`, and verified `10/10` E2E assertions.

### [x] M12 — Full Self-Serve Customer Lifecycle, Agency Logo White-Labeling & `12/12` E2E Release Verification *(DONE)*
* **Completed:**
  1. **Self-Serve Domain Lifecycle (`/api/dashboard/domains` + Top Control Bar):** Added live domain `PUT` re-scan (`↻ Re-Scan`) refreshing crawler WAF probes, multi-engine snapshots, and `>= 9.5/10` fixes, plus self-serve `DELETE` (`Remove`) purging tracked domains and crawl snapshots per `/privacy` Section 4.
  2. **Custom Buyer Prompt Fanout Tracking (`/api/dashboard/prompts` + Tab 3 Module 3):** Added plan-capped (`promptCapForPlan`: `400` agency / `100` pro / `35` starter & tripwire / `5` free) custom buyer prompt onboarding (`+ Track Prompt`), scanning ChatGPT, Gemini, and Perplexity in parallel and recording decompiled fanout sub-queries + competitor citation URLs.
  3. **Agency Logo URL White-Labeling (`/api/dashboard/pitch` + `/audit/[slug]`):** Added sanitized `http(s)://` `agency_logo_url` (`400 INVALID_LOGO_URL` on `javascript:`/`data:` payloads), persisting to `profiles.agency_logo_url` + `agency_pitch_reports.agency_logo_url_snapshot` and rendering above the prospect audit masthead on `/audit/[slug]`.
  4. **1-Click MCP Bearer Key Revocation (`/api/dashboard/mcp-keys` + Tab 3 MCP Hub):** Added tenant-isolated `DELETE` revocation (`is_active = false`) and active/revoked SHA-256 key ledger inside Tab 3 while strictly preserving the 3-Tab shell.
  5. **Full Verification (`23/23` Automated Checks):** Passed `pnpm -r typecheck` (`5/5`), `@verisource/core-geo` unit tests (`7/7`), `@verisource/mcp-worker` `/mcp` integration tests (`4/4`), `pnpm -r build` (`5/5`), and `@verisource/web` `verify-e2e.mjs` (`12/12`, `0` banned lexicon matches).
