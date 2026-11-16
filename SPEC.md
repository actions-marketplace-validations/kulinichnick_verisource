# SPEC.md — Master Product & System Architecture Blueprint

## 1. Executive Summary & Value Proposition
We are building a **Universal B2B Generative Engine Optimization (GEO) & Paid MCP Intelligence Platform** with a built-in **Shopify Deep-Catalog Adapter**.

* **The Problem:** Over 40%–58% of buyer discovery now happens inside AI engines (ChatGPT Search, Google AI Mode/Gemini, Perplexity, Claude), and AI-referred visitors convert at **14.2%–15.9% vs. Google organic's 1.76%–2.8%**. Yet 90%+ of existing GEO tools only show passive visibility charts ($245–$579+/mo) without fixing the underlying site structure, hallucinated facts, or agent endpoints.
* **Our Solution (Read-Write Action Engine + Paid MCP):**
  1. Tracks a brand's real buyer prompts across ChatGPT, Gemini, and Perplexity — separating **Mention Rate %** vs. **Citation Rate %**, **Brand Sentiment Framing**, and **Head-to-Head Rival Share-of-Voice %**.
  2. Flags AI hallucinations against the brand's verified truth data and audits **JS-Rendering / Crawler Readability** (`GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`).
  3. Decompiles hidden AI "Query Fanouts", auto-suggests funnel-stage buyer prompts (`Discovery`, `Comparison`, `Pricing/Purchase`, `Branded`), and classifies cited third-party URLs by **Source Type** (`UGC / Reddit`, `Review Directory`, `Editorial / Press`, `Competitor Site`, `Owned`).
  4. Audits **AI Shopping & Pricing Attribute Completeness** and auto-generates 9.5+/10 natural, ready-to-publish fixes: `JSON-LD` entity/product schemas, `/llms.txt`, custom `/agents.md` overrides, and Answer-First FAQ blocks.
  5. Exposes the entire intelligence & fix engine via a **Subscriber Web Console**, a **Manifest V3 Chrome Extension**, and a **Monetized Streamable HTTP `/mcp` Server** so customers' own AI agents (Claude, Cursor, Antigravity, ChatGPT) can query citation gaps and pull fixes directly.

## 2. Target Buyers & Funnel Isolation Rules
1. **SEO, Web Design & Digital PR Agencies ($249/mo White-Label Tier):** Lowest churn (1.5%–2.5%/mo). They use our 60-Second White-Label Pitch Mode to close local and B2B clients at $1,500–$3,000/mo.
2. **B2B SaaS & Tech Companies ($99/mo Pro + MCP Tier):** High LTV; 89% of B2B software buyers use AI search to shortlist vendors.
3. **High-Ticket Local Service Groups ($99/mo Pro Tier):** Legal, Dental, MedSpas, Roofing, HVAC—where 1 AI-referred lead is worth $5,000–$25,000+.
4. **Mid-Market D2C & Specialty Shopify Brands ($49–$99/mo Tiers):** Native `/api/ucp/mcp` + `agents.md.liquid` commerce readiness. *(Internal test fixtures for `aurearoasters.com` and `mosaicroasters.com` remain backend-only regression fixtures and are never displayed as customer-facing homepage presets, tables, or unauthenticated demo workspaces.)*

### Public Marketing vs. Subscriber Console Boundary
* **Route-Aware Navigation:** Public routes (`/`, `/pricing`, `/agencies`, `/mcp-guide`, `/sample-audit`) display product navigation plus `Sign In` and `Audit Your Site →`. Inside `/dashboard` (and `/login`), marketing CTAs like `Open Console →` are suppressed in favor of a dedicated Console header.
* **Front-Page Free Website Audit (`/`):** Zero preset pills and zero intimidating raw tracking `<script>` dumps on `/`. Prospective customers enter **their own website URL** to receive an easy-to-follow **Site Diagnosis & Action Plan** (`What's Wrong`, `Why It Costs You Customers`, `How You Fix It Without Coding`), AI Visibility Score, 1-Click AI Fix Prompt callout, and 1 live buyer prompt preview with blurred competitor citation URLs—paired with a 3-Step "How Verisource Works (No Coding Required)" workflow and interactive 5-pillar showcase.
* **Subscriber-Locked Admin Console (`/dashboard`):** Strictly gated behind authentication + active plan (`tripwire_19`, `starter_49`, `pro_99`, `agency_249`, or verified Founder/Owner account). Defaults to **Guided Mode** with a top **Site Diagnosis & Action Plan**, a 1-2-3 **1-Click AI Fix Prompt** hero flow (`Claude · ChatGPT · Antigravity · Cursor · Shopify`), and `<details>` progressive disclosure collapsing optional visitor-tracking codes and manual raw code files until needed.

## 3. Pricing Ladder & Conversion Psychology
* **Free Instant Grader (Lead Magnet on Web & Free MCP Tool):** 1 domain scan of the visitor's own site, Overall AI Visibility Score (0–100), JS-Rendering & AI Bot (`GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`) access check, and 1 sample prompt result (competitor citation URLs blurred).
* **Foot-in-the-Door Tripwire ($19 One-Time Audit Pass):** Captures subscription-averse buyers with zero recurring billing: activates 1 complete domain audit + all 1-click code fixes inside the Console once. If the buyer upgrades to any monthly subscription within 7 days, the $19 is credited toward Month 1 (in lieu of a trial).
* **Tier 1: Starter Brand — $49/mo ($39/mo billed annually) [7-DAY FREE TRIAL ON MONTHLY]:** First-time monthly subscribers get a 7-day card-upfront free trial (`$0.00 due today`, 1-click cancel in Stripe Billing Portal, plus automated Day-0 / Day-3 / Day-5 step-by-step onboarding & live-fix nudges via Resend + Cloudflare Cron). Includes 1 Domain, 35 weekly tracked prompts across Gemini/ChatGPT/Perplexity, Hallucination Watchdog, Sentiment & Rival SoV, and 1-click `JSON-LD` + `/llms.txt` + `/agents.md` fixes.
* **Tier 2: Pro + MCP Engine — $99/mo ($79/mo billed annually) [MOST POPULAR · 7-DAY FREE TRIAL ON MONTHLY]:** First-time monthly subscribers get a 7-day card-upfront free trial (`$0.00 due today`, `150` starter `/mcp` credits during the 7-day trial to prevent automated credit drain, automatically stepping up to `1,000` `/mcp` credits/mo upon first paid `invoice.paid`). Includes up to 3 Domains, 100 weekly tracked prompts, Query Fanout Decompiler, Suggested Funnel Prompts, AI Referral & Edge Bot Crawler Attribution Snippets, and Shopify `/api/ucp/mcp` + `/api/mcp` Deep-Catalog Enhancer.
* **Tier 3: Agency White-Label — $249/mo ($199/mo billed annually):** Direct paid activation (protecting 15-site batch CSV pitching from `$0` hit-and-run scraping). Includes up to 15 Client Domains, 400 weekly tracked prompts, **60-Second White-Label Prospect Pitch Link Generator** (custom agency logo, brand name & booking CTA URL), and **5,000 Paid MCP credits/mo**.

## 4. The "3-Tab Rule" UI & Enterprise Modules
To prevent UI bloat, both the Subscriber Web Console and Chrome Extension Side Panel strictly use a shared 3-Tab Layout (`packages/ui`):

### Tab 1: Visibility, Hallucinations & Agent Analytics ("What's Wrong & What's Working")
* **Answer Engine Insights:** AI Share-of-Voice Score (0–100), **Mention Rate % vs. Citation Rate %** across ChatGPT, Gemini, and Perplexity, **Brand Sentiment Framing** (`Recommended`, `Neutral`, `Cautionary`), Average Rank, and **Head-to-Head Rival Share-of-Voice %**.
* **Module 1 — AI Hallucination & Brand Truth Watchdog:** Auto-drafts a Brand Truth Sheet during initial scrape (true pricing, services, shipping/delivery rules, locations) for 1-click user verification, then diffs LLM claims to flag red alerts when AI invents wrong prices or missing features.
* **Module 2 — Agent Analytics, JS Readability, Sub-Page Bot Inspector & Attribution:** Verifies `robots.txt`, simulated bot `User-Agent` HTTP responses (`GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`), **SSR vs. Client-Side JS Readability / Signal Density**, and **Live Sub-Page AI Bot Extraction Inspection** (`/api/dashboard/inspect-url` — showing exact non-JS DOM text, `<table>` matrices, and `JSON-LD` on any tracked sub-page like `/pricing` or `/compare/...`), plus provides both the 10-line browser AI Referral Revenue Pixel and an Edge/Middleware **AI Bot Crawl Logger** (`ai_bot_crawl`).

### Tab 2: AI Shopping Readiness & One-Click On-Site Fixes ("Fix My Site — Syntax & Truth Verified")
* **AI Shopping & Offer Attribute Completeness:** 5-point readiness checklist (`Offer & Plan Pricing`, `Fulfillment / Service Area`, `Availability & Exclusions`, `Entity Identity`, `Agent Protocol Feed`) for ChatGPT Shopping and Perplexity Buy-with-Pro.
* **1-Click AI Remediation Master Prompt & Auto-CMS Detector:** Fingerprints `Shopify`, `WordPress`, `Webflow`, `Wix`, `Squarespace`, `Framer`, and `Custom Code / Next.js` during HTTP scanning and bundles Brand Truth guardrails, `robots.txt` crawler rules, CSR readability guidance, and all pending artifacts into a platform-tailored single prompt (including `/ai-facts` `<article class="verisource-ai-facts">` + `<link rel="alternate" type="text/markdown">` + 301 redirect support for no-root-file builders).
* **AI Citation & Rival Comparison Page Studio:** Turns top detected rivals (`[Brand] vs. [Rival]`), uncited commercial buyer prompts, or pricing truth policies into publish-ready semantic Markdown/HTML comparison tables + page-specific `FAQPage` `JSON-LD` + a 1-click AI Page-Builder Prompt (with 1-click jump triggers from Step 01 Rival SoV and Step 03 Tracked Prompts).
* Auto-generates copy-pasteable `JSON-LD` schemas (Organization, Product, FAQPage, LocalBusiness), `/llms.txt`, and `/agents.md`, plus live HTTP verification (`✓ Verify Live Fixes`).
* **Shopify Native Adapter:** Automatically detects Shopify storefronts, probes both `https://{shop}/api/ucp/mcp` (2026 Universal Commerce Protocol) and legacy `https://{shop}/api/mcp`, classifies `/agents.md` (`missing`, `default_boilerplate`, or `custom_enriched`), and generates a rich `agents.md.liquid` override and SKU-level Product Truth schema.
* **Silent >= 9.5/10 Quality Critic + Concrete Engineering Badges:** Every generated FAQ, outreach draft, and schema block runs through `enforceQualityGate95` (`CHECK (natural_quality_score >= 9.5)`) in the backend while surfacing concrete `SCHEMA & FACT VERIFIED` / `SYNTAX & TRUTH VERIFIED` badges to customers.

### Tab 3: Prompt Explorer, Citation Sources, Competitor X-Ray, Agency Pitch Mode & MCP Keys ("Off-Site & Agent Automation")
* **Live Competitor Domain Technical X-Ray:** Side-by-side HTTP readiness diff (`/api/dashboard/competitor-xray`) comparing your domain against any rival across `GPTBot`/`PerplexityBot` access, non-JS token density, `JSON-LD` `@type` coverage, `/llms.txt`, and `/agents.md`, paired with a 1-Click AI Overtake Prompt.
* **Auto-Suggested Funnel Prompts:** 1-click suggested buyer prompts grouped by funnel stage (`Unbranded Discovery`, `Commercial Comparison`, `Pricing & Purchase`, `Branded Trust`).
* **Module 3 — Query Fanout Decompiler & Categorized Citation Gap Map:** Displays observed engine sub-queries alongside cited third-party domains classified by **Source Type** (`UGC / Reddit`, `Review Directory`, `Editorial / Press`, `Competitor Site`, `Owned`) with channel-specific acquisition playbooks (disclosed founder thread replies on Reddit/HN, 2-part profile sync + non-incentivized customer review kits on G2/Clutch/Trustpilot, competitor displacement plans, and editorial fact-sheet notes) plus a 1-click `.md` Playbook Exporter.
* **Module 4 — Agency 60-Second White-Label Pitch Mode:** Generates shareable agency-branded audit URLs (`verisource.dev/audit/[slug]`) with agency logo, colors, calendar CTA link, auto-detected Website Platform badge, and a white-label-pure **Site Diagnosis & Business Impact** action plan.
* **Paid MCP Server Connection Hub:** Displays native SHA-256 Bearer API keys and OAuth 2.0 configuration to connect Claude Desktop, Cursor, Windsurf, or Antigravity to `https://mcp.verisource.dev/mcp`.

## 5. Monetized MCP Server Tool Definitions (`/mcp` via Streamable HTTP)
1. `scan_domain_ai_readiness` *(Free Preview Tool — 24h cached, IP rate-limited)*: Returns overall score, bot/WAF access status, JS crawler readability, `/agents.md` classification, and Console activation link.
2. `get_citation_gaps_and_fanouts` *(Paid Tool — 1 credit cached / 10 credits live)*: Returns engine Mention vs. Citation share, Source-Type categorized competitor citation URLs, suggested funnel prompts, and Critic-verified outreach drafts.
3. `check_brand_hallucinations` *(Paid Tool — 1 credit cached / 10 credits live)*: Audits LLM claims and sentiment framing against the Brand Truth Sheet.
4. `generate_geo_fix_bundle` *(Paid Tool — 1 credit cached / 10 credits live regenerate)*: Returns 9.5+/10 graded `JSON-LD`, `/llms.txt`, `/agents.md`, and Answer-First FAQ blocks ready to write into a repo or CMS.

## 6. Monorepo Folder Structure
```text
/
├── GEMINI.md                     # Always-on workspace rules, 9.5/10 rubric & model router
├── SPEC.md                       # Master product & architecture specification
├── STATUS.md                     # Compaction-proof progress tracker updated after each step
├── schema.sql                    # Supabase PostgreSQL schema, RLS policies, triggers & RPCs
├── .agents/
│   ├── mcp_config.json           # Lazy-loaded build-time MCPs (Supabase, Cloudflare, Shopify Dev, Firecrawl)
│   └── skills/
│       ├── quality-gate-95/
│       │   └── SKILL.md          # Adversarial 9.5/10 copy & UI grader skill
│       └── geo-audit-runner/
│           └── SKILL.md          # Skill to test scanner on regression fixtures
├── apps/
│   ├── web/                      # Next.js / React Subscriber Console + Free Public Grader + Agency Pitch View
│   ├── mcp-worker/               # Cloudflare Worker (`createMcpHandler` + MCP SDK v2 at `/mcp` + Cron Scanner)
│   └── extension/                # WXT Manifest V3 Chrome Extension (Side Panel UI)
└── packages/
    ├── ui/                       # Shared editorial 3-Tab React components across Web & Extension
    └── core-geo/                 # Shared TypeScript logic: LLM fanout scanner, Hallucination diff, Shopify UCP/MCP reader, 9.5/10 Critic
```
