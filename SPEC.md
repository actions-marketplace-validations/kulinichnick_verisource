# SPEC.md — Master Product & System Architecture Blueprint

## 1. Executive Summary & Value Proposition
We are building a **Universal B2B Generative Engine Optimization (GEO) & Paid MCP Intelligence Platform** with a built-in **Shopify Deep-Catalog Adapter**.

* **The Problem:** Over 40%–58% of buyer discovery now happens inside AI engines (ChatGPT Search, Google AI Mode/Gemini, Perplexity, Claude), and AI-referred visitors convert at **14.2%–15.9% vs. Google organic's 1.76%–2.8%**. Yet 90%+ of existing GEO tools only show passive visibility charts ($245–$579/mo) without fixing the underlying site structure, hallucinated facts, or agent endpoints.
* **Our Solution (Read-Write Action Engine + Paid MCP):**
  1. Tracks a brand's real buyer prompts across ChatGPT, Gemini, and Perplexity.
  2. Flags AI hallucinations against the brand's verified truth data.
  3. Decompiles hidden AI "Query Fanouts" and pinpoints the exact third-party URLs (Reddit threads, blogs, directories, review sites) feeding competitor recommendations.
  4. Auto-generates 9.5+/10 natural, ready-to-publish fixes: `JSON-LD` entity/product schemas, `/llms.txt`, custom `/agents.md` overrides, and Answer-First FAQ blocks.
  5. Exposes the entire intelligence & fix engine via a **Web Dashboard**, a **Manifest V3 Chrome Extension**, and a **Monetized Streamable HTTP `/mcp` Server** so customers' own AI agents (Claude, Cursor, Antigravity, ChatGPT) can query citation gaps and pull fixes directly.

## 2. Target Buyers (Ranked by Willingness to Pay & Low Churn)
1. **SEO, Web Design & Digital PR Agencies ($249/mo White-Label Tier):** Lowest churn (1.5%–2.5%/mo). They use our 60-Second White-Label Pitch Mode to close local and B2B clients at $1,500–$3,000/mo.
2. **B2B SaaS & Tech Companies ($99/mo Pro + MCP Tier):** High LTV; 89% of B2B software buyers use AI search to shortlist vendors.
3. **High-Ticket Local Service Groups ($99/mo Pro Tier):** Legal, Dental, MedSpas, Roofing, HVAC—where 1 AI-referred lead is worth $5,000–$25,000+.
4. **Mid-Market D2C & Specialty Shopify Brands ($49–$99/mo Tiers):** Includes our internal "Patient Zero" flagship case-study stores:
   * **Aurea Coffee Roasters (`aurearoasters.com`):** Modern luxury single-origin specialty coffee inspired by saints and ancient church heritage (bags feature QR codes linking to brewing guides & saint histories).
   * **Mosaic Coffee Roasters (`mosaicroasters.com`):** Single-origin specialty coffee roaster (Brazil, Ethiopia, Guatemala, Honduras, Mexico) with nationwide shipping and local Springfield, MO delivery perks ($45+ free local delivery within 25 miles).

## 3. Pricing Ladder & Conversion Psychology
* **Free Instant Grader (Lead Magnet on Web & Free MCP Tool):** 1 domain scan, Overall AI Visibility Score (0–100), `/agents.md` & AI Bot (`GPTBot`, `PerplexityBot`, `ClaudeBot`) access check, and 1 sample prompt result (competitor citation URLs blurred).
* **Foot-in-the-Door Tripwire ($19 One-Time Audit Pass):** Unlocks 1 complete domain audit + all 1-click code fixes once. If the buyer upgrades to any monthly subscription within 7 days, the $19 is credited toward Month 1.
* **Tier 1: Starter Brand — $49/mo ($39/mo billed annually):** 1 Domain, 35 weekly tracked prompts across Gemini/ChatGPT/Perplexity, Hallucination Watchdog, and 1-click `JSON-LD` + `/llms.txt` + `/agents.md` fixes.
* **Tier 2: Pro + MCP Engine — $99/mo ($79/mo billed annually) [MOST POPULAR]:** Up to 3 Domains, 100 weekly tracked prompts, Query Fanout Decompiler, AI Referral & Crawler Attribution Snippet, Shopify `/api/ucp/mcp` + `/api/mcp` Deep-Catalog Enhancer, and **Full Paid MCP Server Access (1,000 credits/mo: 1 credit per cached read, 10 credits per live scan/generation)**.
* **Tier 3: Agency White-Label — $249/mo ($199/mo billed annually):** Up to 15 Client Domains, 400 weekly tracked prompts, **60-Second White-Label Prospect Pitch Link Generator** (custom agency logo, brand name & booking CTA URL), and **5,000 Paid MCP credits/mo**.

## 4. The "3-Tab Rule" UI & 4 High-Impact Enterprise Modules
To prevent UI bloat, both the Web Dashboard and Chrome Extension Side Panel strictly use a shared 3-Tab Layout (`packages/ui`) housing 4 high-converting modules:

### Tab 1: Visibility, Hallucinations & ROI ("What's Wrong & What's Working")
* **AI Share of Voice Score (0–100)** across ChatGPT, Gemini, and Perplexity.
* **Module 1 — AI Hallucination & Brand Truth Watchdog:** Auto-drafts a Brand Truth Sheet during initial scrape (true pricing, services, shipping/delivery rules, locations) for 1-click user verification, then diffs LLM claims to flag red alerts when AI invents wrong prices or missing features.
* **Module 2 — Zero-Code AI Bot Check & Referral Revenue Snippet:** Verifies both `robots.txt` and live simulated bot `User-Agent` HTTP responses (`GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`) to catch silent Cloudflare WAF `403` blocks, plus provides an Origin-verified 10-line JS pixel tracking visitors and checkout conversions via `document.referrer` + `utm_source` (`chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `claude.ai`).

### Tab 2: One-Click On-Site Fixes ("Fix My Site — 9.5+/10 Graded")
* Auto-generates copy-pasteable `JSON-LD` schemas (Organization, Product, FAQPage, LocalBusiness), `/llms.txt`, and `/agents.md`.
* **Shopify Native Adapter:** Automatically detects Shopify storefronts, probes both `https://{shop}/api/ucp/mcp` (2026 Universal Commerce Protocol) and legacy `https://{shop}/api/mcp`, classifies `/agents.md` (`missing`, `default_boilerplate`, or `custom_enriched`), and generates a rich `agents.md.liquid` override and SKU-level Product Truth schema.
* **Live 9.5/10 Quality Badge:** Every generated FAQ and schema block runs through the Critic loop and displays its verified Natural Quality Score (`9.5+ / 10.0`).

### Tab 3: Citation Targets, Agency Pitch Mode & MCP Keys ("Off-Site & Agent Automation")
* **Module 3 — Query Fanout Decompiler & Citation Gap Map:** Displays observed engine sub-queries (Gemini `webSearchQueries`, OpenAI `web_search_call`) alongside cited retrieval sources (Perplexity `citations[]`) and lists top third-party URLs citing competitors, with natural outreach drafts.
* **Module 4 — Agency 60-Second White-Label Pitch Mode:** Generates a shareable agency-branded audit URL (`yourapp.com/audit/[slug]`) via a scoped Postgres RPC with agency logo, colors, and calendar CTA link so agencies close retainers rapidly.
* **Paid MCP Server Connection Hub:** Displays native SHA-256 Bearer API keys and `workers-oauth-provider` configuration to connect Claude Desktop, Cursor, Windsurf, or Antigravity to `https://mcp.yourdomain.com/mcp` (no external Zuplo proxy required).

## 5. Monetized MCP Server Tool Definitions (`/mcp` via Streamable HTTP)
1. `scan_domain_ai_readiness` *(Free Preview Tool — 24h cached, IP rate-limited)*: Returns overall score, bot/WAF access status, `/agents.md` classification, and upgrade link.
2. `get_citation_gaps_and_fanouts` *(Paid Tool — 1 credit cached / 10 credits live)*: Returns competitor citation URLs and decompiled sub-queries for a domain.
3. `check_brand_hallucinations` *(Paid Tool — 1 credit cached / 10 credits live)*: Audits LLM claims against the Brand Truth Sheet.
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
│           └── SKILL.md          # Skill to test scanner on Mosaic & Aurea
├── apps/
│   ├── web/                      # Next.js / React Web Dashboard + Free Public Grader + Agency Pitch View
│   ├── mcp-worker/               # Cloudflare Worker (`createMcpHandler` + MCP SDK v2 at `/mcp` + Cron Scanner)
│   └── extension/                # WXT Manifest V3 Chrome Extension (Side Panel UI)
└── packages/
    ├── ui/                       # Shared editorial 3-Tab React components across Web & Extension
    └── core-geo/                 # Shared TypeScript logic: LLM fanout scanner, Hallucination diff, Shopify UCP/MCP reader, 9.5/10 Critic
```