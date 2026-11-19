# Verisource — Community Launch, Walkthrough Video & Benchmark Distribution Kit (`v1.0.0`)

All empirical URLs, free zero-signup protocol validators, and Streamable HTTP endpoints referenced below are live in production (`HTTP 200`):

- **2026 AI Search & Agent Readiness Study (`N = 40`):** `https://verisource.dev/benchmarks/ai-search-readiness-2026`
- **Free 60-Second Domain & 5-Page Link Scanner:** `https://verisource.dev/#scan`
- **11-Capability Platform & Agent CLI Walkthrough:** `https://verisource.dev/features`
- **Read-Only Crawler Transparency Spec (`VerisourceScan/1.0`):** `https://verisource.dev/scanner`
- **Zero-Dependency Local CLI (`@verisource/cli`):** `npx https://verisource.dev/downloads/verisource-cli.tgz --help`
- **Interactive 90-Second Product Tour:** `https://verisource.dev/tutorial`
- **Interactive White-Label Agency Sandbox:** `https://verisource.dev/agencies#sandbox`
- **7-CMS Starter Templates (`/agents.md` & `/llms.txt`):** `https://verisource.dev/templates`
- **WordPress Plugin & Shopify OS 2.0 Bridges:** `https://verisource.dev/connectors`
- **Free Zero-Signup Protocol Validators (`JSON-LD`, `/llms.txt`, `GPTBot` WAF, Shopify UCP):** `https://verisource.dev/tools`
- **25% Recurring Affiliate Partner Hub:** `https://verisource.dev/partners`
- **Streamable HTTP MCP Server (`dev.verisource/mcp@1.0.0`):** `https://mcp.verisource.dev/mcp`

---

## 1. Hacker News (`Show HN`) Technical Launch Post

### Title (<= 80 characters)
```text
Show HN: Verisource – Audit AI search citations, WAF blocks, and ship 7-CMS fixes
```

### Post Body (Copy-Paste)
```markdown
Hi HN — I built Verisource (https://verisource.dev), a read-write Generative Engine Optimization (GEO) scanner and stateless Streamable HTTP MCP server (`https://mcp.verisource.dev/mcp`).

Before launching, I ran a live HTTPS probe across 40 public domains spanning B2B SaaS, Shopify D2C, SEO agencies, and multi-location healthcare/home-service brands to measure real machine-readability rather than survey guesses (full domain-level dataset at https://verisource.dev/benchmarks/ai-search-readiness-2026):

1. **Open `/robots.txt` files mask silent CDN `HTTP 403` blocks:** 0 of 40 domains disallowed `GPTBot` or `PerplexityBot` at root in `/robots.txt`, yet 5.0% (`ridge.com` and `westerndental.com`) returned `HTTP 403 Forbidden` at the edge WAF when probed with real `GPTBot/1.2` or `PerplexityBot/1.0` `User-Agent` headers.
2. **One-third of `HTTP 200` `/llms.txt` responses are boilerplate or SPA soft-404s:** 30 of 40 domains returned status `200` on `GET /llms.txt`, but inspecting `Content-Type` and payloads exposed 3 Next.js/SPA `text/html` soft-404 shells (7.5%) and 7 auto-generated Shopify or Rank Math dumps (17.5%). Only 50.0% (20/40) serve curated brand specifications.
3. **The 80-point Shopify agent truth gap:** 8 of 10 D2C stores (80.0%) already respond on Shopify's `/api/ucp/mcp` Universal Commerce Protocol endpoint, yet 0 of 10 (0.0%) have customized `/agents.md`. Across all 40 domains, only `vercel.com` and `linear.app` (5.0%) serve a custom `/agents.md`.
4. **Base `JSON-LD` is common; `FAQPage` is scarce:** 82.5% (33/40) render homepage `application/ld+json`, while only 7.5% (3/40) include `FAQPage` Q&A nodes.

### Why I built a read-write engine instead of another passive chart tracker
Existing visibility trackers charge $245–$579/mo to plot mention percentages without fixing the underlying HTML, edge WAF rules, or hallucinated pricing claims. Verisource closes the loop:

- **Brand Truth & Hallucination Watchdog:** Extracts live storefront pricing and shipping banners into an editable Brand Truth Sheet, then diffs ChatGPT, Google Gemini, and Perplexity answers per bullet so competitor prices never cross-contaminate your alerts.
- **7-CMS Auto-Detection & `/ai-facts` Routing:** Fingerprints `Shopify`, `WordPress`, `Webflow`, `Wix`, `Squarespace`, `Framer`, and `Next.js`, generating syntax-validated `schema.org` `JSON-LD`, `/llms.txt`, `/agents.md`, Shopify `templates/agents.md.liquid`, and `<article class="verisource-ai-facts">` feeds for hosted site builders that forbid root static file uploads.
- **Stateless Streamable HTTP MCP v2 (`dev.verisource/mcp@1.0.0`) & Local `@verisource/cli`:** Built on `@modelcontextprotocol/server` v2 on Cloudflare Workers (zero deprecated `/sse` endpoints) plus a standalone Node 20+ CLI (`scan`, `verify`, `map`, `browse`, `record`, `run`, `log`, `agent --skill --install`) that emits compact `[h1]`/`[l1]`/`[n1]` handles instead of raw DOM dumps.

You can test any domain without creating an account via the homepage scanner (https://verisource.dev/#scan), explore the interactive split-screen playgrounds (https://verisource.dev/features), or run our free protocol validators (https://verisource.dev/tools). Happy to answer questions on the HTTP study, `VerisourceScan/1.0` crawler rules, Cloudflare Worker MCP metering, or Shopify `/api/ucp/mcp` behavior.
```

---

## 2. 1080p Walkthrough Video Script (4 Minutes 45 Seconds · 6 Scenes)

Record at `1920x1080` (`60fps`, clean browser chrome, zoom `110%` on desktop). Upload natively to LinkedIn, X, YouTube, and Product Hunt gallery slot #1.

- **Scene 01 (`0:00–0:40`) — Live 60-Second Grader & Silent WAF / Pricing Diff (`https://verisource.dev`):**
  - Paste a live domain into `#grader`. Highlight the auto-detected CMS badge (`AUTO-DETECTED: SHOPIFY` or `WEBFLOW`), `GPTBot` / `PerplexityBot` `HTTP 200` vs. `HTTP 403` WAF status, and the **Site Diagnosis & Action Plan** (`What's Wrong`, `Why It Costs You Customers`, `How You Fix It Without Coding`).
- **Scene 02 (`0:40–1:35`) — Step 01 Brand Truth Watchdog & Rival Share-of-Voice (`/dashboard` Step 01):**
  - Open Step 01 in **Guided Mode**. Show Mention Rate % vs. Citation Rate % across ChatGPT, Google Gemini, and Perplexity, a flagged shipping or pricing claim diffed against the verified **Brand Truth Sheet**, and 1-click **`✓ Verify Tracker Live`** confirming attribution telemetry.
- **Scene 03 (`1:35–2:30`) — Step 02 Tailored 1-Click AI Fix Prompt & Closed-Loop Verification (`/dashboard` Step 02):**
  - Click tactile `.vs-pill-btn` platform pills (`Shopify Theme (Liquid)`, `Webflow`, `WordPress`, `Coding Agent`). Click **`Copy Prompt for My AI`**, then click **`✓ Verify Live Fixes`** to show the `4/4 VERIFIED LIVE` (`JSON-LD`, `/llms.txt`, `/agents.md`, `AI Bot WAF`) scorecard.
- **Scene 04 (`2:30–3:20`) — Rival Comparison Page Studio & Live Page Verifier (`/dashboard` Step 02):**
  - Scroll to `#vs-citation-page-studio`, select a rival pill, generate a truth-locked `[Brand] vs. [Rival]` HTML/Markdown table + `FAQPage` `JSON-LD`, and click **`✓ Verify Page Live`** (`GPTBot` `HTTP 200` + SSR `<table>` check).
- **Scene 05 (`3:20–4:05`) — 60-Second Agency White-Label `/audit/[slug]` & `CTA CLICKED` / `PDF SAVED` Deal Alerts (`/dashboard` Step 03):**
  - Mint a branded `/audit/[slug]` link with custom agency hex color and booking calendar URL. Open `/audit/[slug]` in an incognito tab—showing zero Verisource branding, `↓ Brief (.md)`, and `Print / Save PDF`—click the booking CTA, and show the **`CTA CLICKED · 1x`** and **`PDF SAVED · 1x`** badges in Step 03.
- **Scene 06 (`4:05–4:45`) — Stateless Streamable HTTP `/mcp` in Cursor & Claude Desktop (`/dashboard` Step 03):**
  - Open the Step 03 `/mcp` Connection Hub, click **`⚡ Test Live /mcp Connection`** (`HTTP 200` handshake at `0` credit cost), and copy the `https://mcp.verisource.dev/mcp` JSON config into Cursor or Antigravity.

---

## 3. Founder Personal LinkedIn & X Launch Posts

### A. LinkedIn Benchmark + "Drop Your Domain" Live Audit Post
```text
We ran direct HTTPS readiness probes across 40 B2B SaaS, Shopify D2C, SEO agency, and multi-location service websites this week.

Four numbers stood out:

1. 0 of 40 blocked GPTBot in /robots.txt — yet 5.0% silently blocked GPTBot with HTTP 403 WAF rules at the CDN edge. Marketing teams think AI search crawlers can read their site while Cloudflare or Akamai drops the request.
2. 30 domains returned HTTP 200 on /llms.txt, but 10 of those 30 were either Next.js HTML soft-404 pages or unedited Shopify/plugin boilerplate. Only 50.0% ship a curated /llms.txt.
3. 80.0% of probed Shopify D2C brands already expose /api/ucp/mcp, yet 0.0% customized /agents.md with their real free-shipping threshold or return window. Across all 40 companies, only vercel.com and linear.app serve a custom /agents.md.
4. 82.5% have base homepage JSON-LD, but only 7.5% include Answer-First FAQPage schema.

That gap is why we launched Verisource v1.0 (https://verisource.dev) — an action engine that audits ChatGPT, Gemini, and Perplexity citations, catches hallucinated pricing claims, and generates ready-to-publish JSON-LD, /llms.txt, /agents.md, and /ai-facts fixes across all 7 CMS stacks ($49 / $99 / $249/mo vs. $245–$579/mo read-only trackers).

Full 40-domain dataset: https://verisource.dev/benchmarks/ai-search-readiness-2026

Drop your domain in the comments (or DM if client-confidential) and I will reply with your live GPTBot/PerplexityBot WAF status, CMS readiness check, and top citation gap.
```

### B. X (Twitter) Launch Thread (4 Posts)
```text
1/ We probed 40 live B2B SaaS, Shopify D2C, agency & multi-location domains over HTTPS to see how ready commercial sites actually are for ChatGPT Search, Perplexity & AI shopping agents:

- 50.0% custom /llms.txt (17.5% auto-boilerplate, 7.5% HTML soft-404s)
- 5.0% custom /agents.md (only vercel.com & linear.app)
- 7.5% homepage FAQPage JSON-LD
- 5.0% silent CDN HTTP 403 blocks on GPTBot despite open /robots.txt

Dataset: https://verisource.dev/benchmarks/ai-search-readiness-2026

2/ Wildest finding: 8 of 10 Shopify D2C stores (80%) already respond on /api/ucp/mcp, yet 0 of 10 customized /agents.md.

Stock Shopify /agents.md files point to generic Shop-skill boilerplate without your free-shipping threshold, return window, or SKU exclusions—so AI engines guess from old coupon blogs.

3/ Today we're shipping Verisource v1.0 (https://verisource.dev) + our Streamable HTTP MCP server (`https://mcp.verisource.dev/mcp`).

Scan any site -> catch pricing/shipping hallucinations -> copy 1 platform-tailored AI Fix Prompt (Shopify, WordPress, Webflow, Wix, Squarespace, Framer, Next.js) -> verify 4/4 live over HTTP.

4/ Reply with your domain below and I'll run a live GPTBot/PerplexityBot WAF + /agents.md + citation check on it right now.

Or test unauthenticated for $0 at https://verisource.dev/tools
```

---

## 4. Disclosed Practitioner Reddit Replies (`r/TechSEO`, `r/shopify`, `r/Cursor`)

### A. `r/TechSEO` — Diagnosing Silent `GPTBot` / `PerplexityBot` Drops & Soft-404 `/llms.txt`
```markdown
Check two failure modes we just measured across a 40-domain HTTP benchmark:

1. **Edge WAF `HTTP 403` vs. `/robots.txt`:** Checking `/robots.txt` alone misses CDN bot rules. Test your origin directly with `curl -I -A "Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.2; +https://openai.com/gptbot)" https://yourdomain.com` and verify it returns `HTTP 200` rather than `403` or a managed challenge.
2. **SPA `text/html` soft-404s on `/llms.txt`:** Several Next.js and React sites return `HTTP 200` with `Content-Type: text/html` on `/llms.txt`, serving an empty client bundle instead of `text/plain` or `text/markdown`.

Disclosure: I built Verisource — we published the full 40-domain HTTP table at https://verisource.dev/benchmarks/ai-search-readiness-2026 and put up a free zero-signup WAF + `/llms.txt` validator at https://verisource.dev/tools/ai-crawler-waf-checker if you want to test client domains quickly.
```

### B. `r/shopify` — Overriding Stock `/agents.md` Boilerplate Alongside `/api/ucp/mcp`
```markdown
Modern Shopify storefronts already expose `/api/ucp/mcp` and a default `/agents.md`, which is great for catalog discovery—but in our 10-store D2C HTTP check, 0 of 10 merchants had customized `/agents.md` beyond Shopify's generic `shop.app/SKILL.md` boilerplate.

Because that stock file omits your exact free-shipping minimum, local delivery radius, return window, and bundle exclusions, ChatGPT and Perplexity often pull outdated thresholds from third-party coupon sites. You can fix this in Online Store 2.0 by adding a `templates/agents.md.liquid` override (or publishing `/pages/ai-facts` with `FAQPage` + `Product` `schema.org` `JSON-LD`).

Disclosure: I built Verisource — you can grab the free copy-paste Shopify Liquid starter template at https://verisource.dev/templates or check your store's `/api/ucp/mcp` and `/agents.md` status free at https://verisource.dev/tools/shopify-ai-readiness-checker.
```

### C. `r/Cursor` & `r/ClaudeAI` — Auditing `JSON-LD` & `/agents.md` via Streamable HTTP MCP
````markdown
If you want Cursor or Claude Desktop to inspect live `GPTBot` WAF status, `JSON-LD` entity schemas, and `/llms.txt` / `/agents.md` coverage directly inside your repo workflow, add a stateless Streamable HTTP MCP entry to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "verisource": {
      "url": "https://mcp.verisource.dev/mcp"
    }
  }
}
```

Disclosure: I'm the engineer behind Verisource (`dev.verisource/mcp@1.0.0` in the Official MCP Registry). The `scan_domain_ai_readiness` tool runs with zero API key and `0` credits (3 custom domains/IP/day, 24h KV cache), and open starter templates for Next.js, Shopify, and Webflow are at https://verisource.dev/templates.
````

---

## 5. Product Hunt, DevHunt & Indie Hackers Launch Pack

- **Product Name:** `Verisource`
- **Tagline (<= 60 chars):** `Audit AI search citations & ship 1-click fixes across 7 CMSs`
- **Launch Status Framing:** `v1.0 Production Live` — **Founding Partner Rate Lock** (first 30 Pro `$99/mo` and Agency White-Label `$249/mo` workspaces lock current pricing for life; Starter `$49/mo` and Pro `$99/mo` include a 7-day `$0.00` card-upfront trial, plus a `$19` One-Time Audit Pass with zero recurring billing).
- **5-Slide Gallery Sequence:**
  1. `1080p` 4m45s end-to-end remediation & `/mcp` walkthrough video.
  2. Homepage 4-vertical **Before -> After Motion SVG Storyboard** (`/#sample-workflow`) + auto-detected CMS badge.
  3. Step 02 **1-Click AI Fix Prompt** + `4/4 VERIFIED LIVE` HTTP verification banner.
  4. White-label `/audit/[slug]` agency client brief + **`OPENED` / `PDF SAVED` / `CTA CLICKED`** deal alert badges (`/agencies#sandbox`).
  5. 2026 40-Domain AI Search Readiness Matrix (`50.0%` custom `/llms.txt`, `5.0%` custom `/agents.md`, `5.0%` silent `GPTBot` `HTTP 403`) + `/pricing#vs-pricing-roi-calculator`.

### Maker First Comment (Copy-Paste)
```text
Hey everyone — I built Verisource (https://verisource.dev) after watching B2B companies, Shopify brands, and agencies pay $250–$579/mo for passive AI visibility charts that never actually fix a single schema tag, WAF rule, or hallucinated price.

Verisource is a read-write GEO & Paid MCP action engine:
1. Scans ChatGPT, Google Gemini, and Perplexity to separate Mention Rate % vs. Citation Rate % and catch wrong pricing or shipping claims against your Brand Truth Sheet.
2. Auto-detects 7 CMS platforms (Shopify, WordPress, Webflow, Wix, Squarespace, Framer, Next.js) and generates syntax-validated JSON-LD, /llms.txt, /agents.md, /ai-facts, and Rival Comparison Pages with closed-loop HTTP verification.
3. Ships a 60-second white-label /audit/[slug] agency pitch generator ($249/mo for 15 client sites) with instant prospect open and booking CTA click alerts, plus a stateless Streamable HTTP MCP server at https://mcp.verisource.dev/mcp.

Try the free domain scanner at https://verisource.dev/#scan, explore the interactive split-screen playgrounds at https://verisource.dev/features, or read our 40-domain 2026 HTTP Readiness Study at https://verisource.dev/benchmarks/ai-search-readiness-2026. The first 30 Pro and Agency workspaces lock our Founding Partner Rate for life.
```

---

## 6. DevTools `/llms.txt` vs. `/agents.md` Adoption Gap — Hacker News & X Research Post

### A. X / LinkedIn Empirical Addendum Post
```text
We just audited 10 fast-growing DevTools & B2B SaaS sites (trigger.dev, inngest.com, turso.tech, tinybird.co, knock.app, workos.com, stytch.com, upstash.com, highlight.io, infisical.com) over live HTTP:

- 90% (9 of 10) ship a valid /llms.txt docs index.
- Only 20% (2 of 10 — tinybird.co & infisical.com) ship a custom /agents.md pricing & limits guardrail file.
- Only 10% (1 of 10 — upstash.com) ship all 3 JSON-LD pillars (Entity + Offer + FAQPage).

Developers are indexing their docs for LLMs, yet leaving pricing tiers, rate limits, and FAQ answers unguarded when Claude, Cursor, and Perplexity compare vendors.

Full addendum & 40-domain benchmark: https://verisource.dev/benchmarks/ai-search-readiness-2026
Or test your own repo/domain via our free MCP tool: https://mcp.verisource.dev/mcp
```

---

## 7. Expanded 90-Domain HTTP Study — The 35.3-Point Headless Commerce AI Penalty

### A. Hacker News / LinkedIn Data Post
```text
We expanded our live HTTP AI-readiness crawl to 90 commercial domains (45 consumer commerce storefronts and 45 B2B SaaS / AI infrastructure platforms — full searchable index at https://verisource.dev/reports).

The sharpest architectural split in the dataset was Headless Next.js Commerce vs. Native Shopify OS 2.0:

- 34 native Shopify OS 2.0 brands (Brooklinen, Away, Cuyana, Rothy's, Ritual, Monos) averaged 77.2 out of 100 on technical AI search readiness because Shopify exposes /api/ucp/mcp and server-rendered Product schema out of the box (though 31 of 34 still serve unedited stock /agents.md boilerplate).
- 10 custom headless Next.js consumer storefronts (WHOOP 34, AG1 34, Huckberry 34, Seed 34, Solo Stove 34, Bombas 39, Eight Sleep 52) averaged 41.9 out of 100 — a 35.3-point drop caused by stripped /api/ucp/mcp feeds, missing Offer/FAQPage JSON-LD, and edge WAF 403 blocks on GPTBot and PerplexityBot.
- Across all 45 B2B SaaS & AI infrastructure sites, 97.8% (44 of 45) now serve /llms.txt, while only 31.1% (14 of 45) publish a custom /agents.md pricing and rate-limit specification.

Live side-by-side protocol diff (Huckberry 34 vs. Rothy's 81): https://verisource.dev/vs?a=huckberry.com&b=rothys.com
Full 2026 methodology & cohort breakdown: https://verisource.dev/benchmarks/ai-search-readiness-2026
```

### B. X (Twitter) Rivalry Card Post
```text
Brands spend $200k+ going headless on Next.js, then lose half their AI search readiness overnight.

Across 90 live HTTP audits:
• Native Shopify OS 2.0 (34 stores): 77.2 out of 100 avg
• Custom Headless Next.js DTC (10 stores): 41.9 out of 100 avg (-35.3 pts)

Compare any 2 domains live: https://verisource.dev/vs?a=huckberry.com&b=rothys.com
```

---

## 8. 160-Domain AI Infrastructure & SaaS Protocol Paradox (Show HN & LinkedIn Update)

### A. Show HN / Reddit (`r/LocalLLaMA` & `r/SaaS`) Empirical Thread
```text
Title: We audited 160 SaaS, commerce, and AI agent domains over HTTPS — 74.4% ship /llms.txt, yet 97.5% fail 3-pillar JSON-LD (and Perplexity scores 39/100)

Over the past week we expanded our open HTTP protocol index (VerisourceScan/1.0) to 160 recognizable domains across B2B SaaS (83), Native Shopify OS 2.0 (56), and Custom Headless Next.js storefronts (21).

Every domain was tested live for GPTBot/OAI-SearchBot/PerplexityBot/ClaudeBot WAF access, non-JS HTML word count, /llms.txt, /agents.md, and 3-pillar schema.org JSON-LD (Organization + Offer pricing + FAQPage).

Four findings stood out across the 160-domain dataset (mean score: 68.4 out of 100):
1. /llms.txt went mainstream, /agents.md did not: 74.4% (119 of 160) now return HTTP 200 on /llms.txt, yet 83.8% (134 of 160) still lack a verified /agents.md pricing and exclusion spec.
2. 97.5% fail 3-pillar JSON-LD: Only 4 of 160 domains (2.5%) expose Organization identity, Offer pricing, and FAQPage schema together on the root page.
3. Even AI companies block or starve AI crawlers: Across 18 AI search, agent, and inference domains, mean readiness is 65.5 out of 100 — e2b.dev and warp.dev hit 84 out of 100, while perplexity.ai scores 39 out of 100 under edge WAF restrictions and langchain.com / groq.com sit at 52 out of 100.
4. The Headless Commerce gap held at -33.4 points: 56 native Shopify OS 2.0 stores average 76.9 out of 100, while 21 custom headless Next.js consumer stores average 43.5 out of 100.

Full searchable 160-domain leaderboard: https://verisource.dev/reports
Methodology & charts (FIG 13 & FIG 14): https://verisource.dev/benchmarks/ai-search-readiness-2026
```

### B. LinkedIn Founder Data Post (AI Company Paradox)
```text
We just crossed 160 live HTTPS domain audits in our 2026 AI Search Readiness Index — including 18 leading AI search, agent, and inference companies.

The biggest surprise in the data:

77.8% of AI infrastructure companies now publish /llms.txt.
Yet 88.9% still omit /agents.md pricing guardrails, and 97.5% of all 160 audited sites fail 3-pillar JSON-LD (Entity + Offer + FAQPage).

Even wilder:
• e2b.dev & warp.dev: 84 out of 100
• cursor.com & llamaindex.ai: 72 out of 100
• langchain.com & groq.com: 52 out of 100
• perplexity.ai: 39 out of 100 (strict edge WAF restrictions on external crawlers)
• figma.com: 38 out of 100 vs. webflow.com: 72 out of 100

Inspect all 160 scorecards or benchmark any 2 domains head-to-head for free:
https://verisource.dev/benchmarks/ai-search-readiness-2026
```
