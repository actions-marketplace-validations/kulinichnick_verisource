# GROWTH_OPS_PLAN.md — Autonomous 5-Subagent Growth, Retention & M&A Execution Blueprint

**Workspace Roots:**
- **Operations & Growth Hub:** `g:\My Drive\GEO MCP Engine`
- **Production Monorepo (`origin/main`):** `C:\dev\verisource` (`https://verisource.dev` · `https://mcp.verisource.dev/mcp`)
- **UI Freeze Policy:** Strictly enforced. Zero cosmetic redesigns, zero layout churn, zero new visual themes. Product engineering is capped at <= 25% of total effort and restricted to conversion paywalls, retention drift telemetry, programmatic `/report/[domain]` scorecards, and MV3 active-tab sync.

---

## 1. Financial & Valuation Milestone Targets (North-Star Ledger)

| Milestone | Active Recurring Mix | One-Time Audits (`$19`) | Monthly Gross | Monthly Net (SDE) | Target Multiple | Base Valuation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Month 3** | `13` (`8` Starter · `4` Pro · `1` Agency) | `15` / mo (`$285`) | `$1,322` / mo | `$911` / mo | Pre-multiple | Baseline Run-Rate |
| **Month 6** | `31` (`18` Starter · `10` Pro · `3` Agency) | `30` / mo (`$570`) | `$3,189` / mo | `$2,465` / mo | `2.5x` Annual SDE | **`$73,950`** |
| **Month 9** | `56` (`32` Starter · `18` Pro · `6` Agency) | `45` / mo (`$855`) | `$5,699` / mo | `$4,530` / mo | `3.4x` Annual SDE | **`$184,824`** |
| **Month 12** | `88` (`50` Starter · `28` Pro · `10` Agency) | `60` / mo (`$1,140`) | `$8,852` / mo | `$7,186` / mo | `3.9x` Annual SDE | **`$336,305`** |
| **Year 2 (24m)** | `200` (`110` Starter · `65` Pro · `25` Agency) | `110` / mo (`$2,090`) | `$20,140` / mo | `$16,669` / mo | `4.2x` Annual SDE | **`$840,118`** |
| **Year 3 (36m)** | `358` (`190` Starter · `120` Pro · `48` Agency) | `160` / mo (`$3,040`) | `$36,182` / mo | `$29,955` / mo | `4.5x` Annual SDE | **`$1,617,570`** |

**Institutional Guardrails:** Gross margin >= `75.0%` (operating target `80.0%+`), monthly logo churn `< 4.0%`, zero co-mingled personal expenses, and `enforceQualityGate95()` (`>= 9.5/10.0`) enforced on every outbound touch, public scorecard, and retention alert.

---

## 2. Phase 1 Checklist: Core Retention & Conversion Lock-In (25% Cap)

### [x] Step 1.1 — Chrome Side Panel Step 02/03 Paywall & `$19` -> Subscription Upgrade Credit
* **Current State Verified:**
  - Web Grader (`PublicGraderClient.tsx` + `POST /api/grader`) already keeps Step 01 free and gates the full fix prompt (`buildPublicAiPromptTeaser`) and competitor URLs behind zero-hop `/api/checkout`.
  - Stripe Checkout (`GET /api/checkout`) and `/pricing` (`PricingLadderSection.tsx`) already mint a `$19.00` Stripe coupon (`amount_off: 1900`, `duration: 'once'`) when `tripwire_paid_at` is active.
  - **Leak Identified:** `apps/extension/entrypoints/sidepanel/App.tsx` previously exposed Step 02 (`Copy AI Fix Prompt`, `Copy vs. Rival Prompt`, `.md` bundle, raw code files) and Step 03 (`Citation Gap URLs`) unredacted to unauthenticated `$0` users, and `DashboardConsoleClient.tsx` lacked an inline 1-click `$19` credit upgrade bar for `tripwire_19` buyers inside `/dashboard`.
* **Surgical Implementation:**
  - [x] Add CORS headers + optional Bearer/`vs_live_` entitlement resolution so `apps/extension/entrypoints/sidepanel/App.tsx` checks active subscriber status (`tripwire_19`, `starter_49`, `pro_99`, `agency_249`) without altering `permissions: ['sidePanel', 'activeTab']`.
  - [x] Keep **Step 01 (`Brand Health & AI Mistakes` + `✓ Verify Live Fixes`)** 100% free in the Side Panel.
  - [x] Gate **Step 02** (`1-Click AI Fix Prompt` + `vs.-Rival Comparison Page Studio` + raw code files) for unauthenticated/free Side Panel users using `buildPublicAiPromptTeaser` + direct checkout buttons (`Activate $19 Audit Pass (Full Fix + vs.-Rival Studio) →` and `Or Start 7-Day Trial ($49 Starter · $99 Pro) →`).
  - [x] Gate **Step 03** (`Citation Gap URLs`) for unauthenticated/free Side Panel users by blurring exact competitor URLs while keeping source categories visible and keeping the Agency White-Label Sandbox link (`/agencies?domain=...#sandbox`) open.
  - [x] Add a compact 1-line upgrade credit bar inside `DashboardConsoleClient.tsx` exclusively for `plan_tier === 'tripwire_19'` accounts (`Starter ($30 Month 1) →` | `Pro + MCP ($80 Month 1) →`), and extend `isEligibleFor19Credit` in `apps/web/src/app/api/checkout/route.ts` from `7` days to `14` days so Day-5 retention nudges never bounce on weekend opens.

### [x] Step 1.2 — Weekly Drift-Watchdog Cron Endpoint (`/api/cron/drift-watchdog`)
* **Current State Verified:**
  - `apps/mcp-worker/src/cron.ts` runs 6-hour chunks and dispatches `dispatchHallucinationDriftEmail`, `dispatchTrialActivationNudgeEmail`, and `dispatchWeeklyExecutiveDigestEmail`, and we now wired `/api/cron/drift-watchdog` + `vercel.json` + `computeDomainDriftDiff()`.
* **Surgical Implementation:**
  - [x] Build `computeDomainDriftDiff()` in `packages/core-geo/src/alerts/drift-alert.ts` comparing current scan output against the prior `domains` row and previous `citation_snapshots` batch across:
    1. `visibility_score` delta (`<= -5` pts triggers drift)
    2. `accuracy_score` delta (`< prior` or new hallucinated claim)
    3. `headToHeadSov` rival overtake or newly detected competitor citation host/URL
    4. `4/4` live HTTP readiness checks (`JSON-LD` 3-pillar schema, `/llms.txt`, `/agents.md`, `WAF` / `robots.txt` AI bot access)
  - [x] Create `apps/web/src/app/api/cron/drift-watchdog/route.ts` protected by `Authorization: Bearer ${CRON_SECRET}` (supporting both Vercel Cron `GET` and manual/workflow `POST` dry-run or live runs).
  - [x] Register `"crons": [{ "path": "/api/cron/drift-watchdog", "schedule": "0 13 * * 1" }]` in `C:\dev\verisource\vercel.json`.
  - [x] Emit structured JSON drift records (including `tripwire_19` domains with `< 4/4` live checks after 5+ days and active subscribers with lost citations) so `retention-drift-watchdog` can action them deterministically.

### [x] Step 1.3 — Chrome MV3 Automatic Active-Tab Domain Sync
* **Current State Verified:**
  - `apps/extension/entrypoints/sidepanel/App.tsx` previously queried `browser.tabs.query({ active: true, currentWindow: true })` once on initial mount and ignored subsequent tab switches.
* **Surgical Implementation:**
  - [x] Maintain strict `permissions: ['sidePanel', 'activeTab']` in `apps/extension/wxt.config.ts` (compliant with `GEMINI.md` Section 4 and Chrome Web Store `Yellow Argon` least-privilege rules).
  - [x] Subscribe to `browser.tabs.onActivated`, `browser.tabs.onUpdated` (`changeInfo.status === 'complete'` or `changeInfo.url`), and `browser.windows.onFocusChanged` inside `App.tsx` + `VS_ACTIVE_TAB_SYNC` messaging in `background.ts`.
  - [x] Whenever the active tab switches to a readable public `http(s)` hostname that differs from the current `activeTabUrl`, automatically update `activeTabUrl` and `domainInput` (and auto-refresh the Step 01 scan with 220ms debounce, while clearing stale host labels if the user switches to an internal `chrome://` or ungranted tab).
  - [x] Keep `v1.0.1` manifest assertions green while Chrome Web Store review is pending.

### [x] Step 1.4 — Indexable Public Scorecard Route (`/report/[domain]`) for Programmatic SEO
* **Current State Verified:**
  - `/audit/[slug]` serves expiring 30-day white-label agency pitch links excluded from `sitemap.xml`; `/report/[domain]` now serves indexable public scorecards.
* **Surgical Implementation:**
  - [x] Create `apps/web/src/app/report/[domain]/page.tsx` rendering verified public AI Readiness Scorecards from `apps/web/src/data/published-reports.json` (synced from `growth_ops/published/reports_manifest.json`) with `TechArticle` + `FAQPage` `JSON-LD`, live 4-protocol status badges, HTML signal density, and zero-hop `$19` Audit Pass / `$49` Starter / `$99` Pro CTAs using existing `.vs-bezel` and `.vs-card` primitives.
  - [x] Wire `apps/web/src/app/sitemap.ts` and `apps/web/src/lib/indexnow.ts` to include all approved `/report/[domain]` entries automatically.

---

## 3. Phase 2 Checklist: Autonomous 5-Subagent System & `growth_ops/` Workspace

* **Dual-Discovery Registration:** Author all 5 agent definitions in `.gemini/agents/*.md` (both in `g:\My Drive\GEO MCP Engine\.gemini\agents\` and `C:\dev\verisource\.gemini\agents\`) AND mirror them into `.agents/agents/*.md` with valid Antigravity subagent frontmatter (`name`, `description`, `subagent: true`, `mainAgent: false`, explicit `tools: [...]`) so `invoke_subagent` and `run_workflow` resolve them natively.
* **Git Hygiene:** Add `growth_ops/queue/` and `growth_ops/ledger/` to `C:\dev\verisource\.gitignore` so private prospect contacts and M&A P&L ledgers never leak to GitHub, while tracking `growth_ops/target_domains.json` and `growth_ops/published/` for programmatic `/report/[domain]` builds.

| # | Subagent File | Assigned Model Routing | Core Engine Bindings | Output Queue / Ledger |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `.gemini/agents/agency-trojan-outbound.md` | **Gemini 4 Hydrogen (Medium)** for scraping/drafting · **Carbon (High)** for live `enforceQualityGate95()` verification | `runDomainReadinessScan()`, `mint-prospect-batch.mjs`, `/agencies?domain=[client]#sandbox`, `/audit/[slug]`, `enforceQualityGate95()` | `growth_ops/queue/daily_agency_outreach.md` |
| **2** | `.gemini/agents/programmatic-seo-publisher.md` | **Gemini 4 Hydrogen (Low/Medium)** for batch HTTP probing · **Carbon (High)** for `/report/[domain]` & `sitemap.ts` | `probeDomainBotAndWafStatus()`, `inspectJsonLdAiReadiness()`, `enforceQualityGate95()`, `sitemap.ts`, `/api/indexnow` | `growth_ops/target_domains.json` -> `growth_ops/published/reports_manifest.json` |
| **3** | `.gemini/agents/hallucination-teardown-creator.md` | **Gemini 4 Carbon (High)** for truth-diffing, SVG comparison cards & zero-slop social copy | `runFullGeoAudit()`, `HallucinationWatchdog`, `enforceQualityGate95()` | `growth_ops/queue/weekly_social_teardowns.md` + `growth_ops/queue/assets/*.svg` |
| **4** | `.gemini/agents/retention-drift-watchdog.md` | **Gemini 4 Carbon (High)** for drift analysis, `$19` Day-5 credit nudges & `vs.-Rival` prompt generation | `GET/POST /api/cron/drift-watchdog`, `buildCitationAnswerPageBundle()`, `enforceQualityGate95()` | `growth_ops/queue/weekly_retention_actions.md` |
| **5** | `.gemini/agents/ma-diligence-ledger.md` | **Gemini 4 Argon (High)** for Stripe MRR, API COGS, gross margin (`>= 75%`), NRR & SDE multiple reconciliation | Stripe API (`subscriptions`, `charges`, `balance_transactions`), Supabase `profiles`/`domains`, provider usage logs | `growth_ops/ledger/MONTHLY_PNL_AND_VALUATION.md` |

### Detailed Subagent Deliverables:
- [x] **2.1 Workspace Folders:** Initialize `growth_ops/queue/`, `growth_ops/published/`, `growth_ops/ledger/`, and seed `growth_ops/target_domains.json` with `40` high-intent Shopify Plus DTC and B2B SaaS domains (excluding existing Wave 1–3 domains to prevent duplicate touches).
- [x] **2.2 `agency-trojan-outbound.md`:** Ingests boutique Shopify Plus, Webflow, and B2B SEO agencies, extracts 1 live case-study client domain, runs `runDomainReadinessScan()` / `POST /api/grader`, mints or links `/agencies?domain=[client_domain]#sandbox` + `/audit/[slug]`, enforces `>= 9.5/10.0` via `enforceQualityGate95()` on a 3-sentence founder note (Email + `<= 195`-char LinkedIn DM), and appends the `[Agency Name | Contact | Client Audited | Top Gap Found | Live White-Label URL | Copy-Paste 3-Sentence Note]` row to `growth_ops/queue/daily_agency_outreach.md`.
- [x] **2.3 `programmatic-seo-publisher.md`:** Pulls the next `10` queued domains from `growth_ops/target_domains.json`, executes zero/low-LLM-cost HTTP protocol & 3-pillar `JSON-LD` probes, writes Critic-verified scorecard payloads into `growth_ops/published/reports_manifest.json` + `apps/web/src/data/published-reports.json`, updates `sitemap.xml` coverage, and outputs a 1-click publish verification table.
- [x] **2.4 `hallucination-teardown-creator.md`:** Audits recognizable consumer/SaaS brands until it isolates a concrete pricing/policy claim conflict or rival citation displacement, exports a high-contrast editorial before/after Markdown + `.svg` card, writes the 3-bullet 30-second Chrome Side Panel recording script, and drafts platform-native X, LinkedIn, and Reddit (`r/shopify`, `r/bigseo`, `r/SaaS`) posts verified by `enforceQualityGate95()` in `growth_ops/queue/weekly_social_teardowns.md`.
- [x] **2.5 `retention-drift-watchdog.md`:** Reads `/api/cron/drift-watchdog` output; queues personalized Day-5+ follow-up emails with 1-click `$19` Stripe credit links for `tripwire_19` buyers still under `4/4` live checks; auto-builds `vs.-Rival Comparison Page` prompts via `buildCitationAnswerPageBundle()` for active subscribers who lost citation share.
- [x] **2.6 `ma-diligence-ledger.md`:** Reconciles monthly Stripe MRR (`starter_49`, `pro_99`, `agency_249`), `$19` Audit Pass volume, gross logo/MRR churn, NRR, and infrastructure COGS (`OpenAI`, `Perplexity`, `Gemini`, `Supabase`, `Cloudflare`, `Resend`), verifies gross margin `>= 75%` (target `80%+`), and updates the Acquire.com / Micro-PE SDE valuation table in `growth_ops/ledger/MONTHLY_PNL_AND_VALUATION.md`.

---

## 4. Phase 3 Checklist: Single-Command Daily & Weekly Workflow Runners

We will ship **both** native Antigravity `run_workflow` Python orchestrators (for parallel multi-agent execution inside Antigravity) AND deterministic Node/TypeScript CLI runners wired to `package.json` so `npm run ops:daily` / `pnpm ops:daily` and `npm run ops:weekly` / `pnpm ops:weekly` work from any terminal:

- [x] **3.1 Antigravity Multi-Agent Workflows (`scripts/growth_workflows/`):**
  - `scripts/growth_workflows/daily_growth_workflow.py` (invocable via `/run-workflow` / `run_workflow` tool):
    - Runs `agency-trojan-outbound` (`2` new agency client audits) and `programmatic-seo-publisher` (`10` new `/report/[domain]` scorecards) in `parallel()`, aggregates both outputs, passes `enforceQualityGate95()`, and writes `growth_ops/queue/TODAY_ACTION_DASHBOARD.md` formatted for a 15-minute founder review.
  - `scripts/growth_workflows/weekly_growth_workflow.py` (invocable via `/run-workflow` / `run_workflow` tool):
    - Runs `hallucination-teardown-creator` (`3` tear-downs), `retention-drift-watchdog`, and `ma-diligence-ledger` in staged `phase()` blocks, then updates the Month 3 (`$911` net) -> Month 6 (`$2,465` net / `$73,950` val) -> Month 12 (`$7,186` net / `$336,305` val) milestone progress bar at the top of `growth_ops/ledger/MONTHLY_PNL_AND_VALUATION.md` and `growth_ops/queue/TODAY_ACTION_DASHBOARD.md`.
- [x] **3.2 Deterministic CLI Task Runners & `package.json` Scripts:**
  - `scripts/growth_workflows/ops-daily.mjs` & `scripts/growth_workflows/ops-weekly.mjs` executing the real `@verisource/core-geo` audit, HTTP probe, drift-watchdog, and Stripe/Supabase ledger pipelines directly via Node 24, syncing outputs to `g:\My Drive\GEO MCP Engine\growth_ops\`.
  - Wire `"ops:daily"` and `"ops:weekly"` into `C:\dev\verisource\package.json` (plus a lightweight bridge `package.json` in `g:\My Drive\GEO MCP Engine\package.json` so `npm run ops:daily` and `npm run ops:weekly` work directly from `g:\My Drive\GEO MCP Engine` as well).
- [x] **3.3 Automated Verification Gate:**
  - Run `pnpm typecheck`, `@verisource/core-geo` unit tests (including `enforceQualityGate95` + `computeDomainDriftDiff` assertions), `@verisource/mcp-worker` tests, `pnpm build`, and a dry-run of `ops:daily` + `ops:weekly` verifying `>= 9.5/10.0` scores across all generated queues.

---

## 5. Execution Order Upon Approval

1. **Batch A (Phase 2 & Phase 3 Scaffolding — Immediate):** Generate `.gemini/agents/*.md` (+ `.agents/agents/*.md`), `growth_ops/` queues/ledger/seed domains, and `scripts/growth_workflows/` (`daily_growth_workflow.py`, `weekly_growth_workflow.py`, `ops-daily.mjs`, `ops-weekly.mjs`, `package.json` scripts).
2. **Batch B (Phase 1 Surgical Product Locks — 25% Cap):** Ship Chrome Side Panel Step 02/03 paywall + `/dashboard` `$19` upgrade credit bar, `/api/cron/drift-watchdog` + `computeDomainDriftDiff()`, MV3 active-tab switch listener, and `/report/[domain]` + `sitemap.ts` integration, followed by full CI test verification.
