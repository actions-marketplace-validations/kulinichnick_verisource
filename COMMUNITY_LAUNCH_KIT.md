# Verisource — Community Launch, Walkthrough Video & Benchmark Distribution Kit (`v1.0.0`)

All empirical URLs, free zero-signup protocol validators, and Streamable HTTP endpoints referenced below are live in production (`HTTP 200`):

- **2026 AI Search & Agent Readiness Study (`N = 40`):** `https://verisource.dev/benchmarks/ai-search-readiness-2026`
- **Free 60-Second Domain Grader:** `https://verisource.dev/#grader`
- **Interactive 90-Second Product Tour:** `https://verisource.dev/tutorial`
- **7-CMS Starter Templates (`/agents.md` & `/llms.txt`):** `https://verisource.dev/templates`
- **Free Zero-Signup Protocol Validators:** `https://verisource.dev/tools`
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
- **Stateless Streamable HTTP MCP v2 (`dev.verisource/mcp@1.0.0`):** Built on `@modelcontextprotocol/server` v2 on Cloudflare Workers (zero deprecated `/sse` endpoints). Unauthenticated callers can invoke `scan_domain_ai_readiness` for 0 credits right inside Claude Desktop, Cursor, Windsurf, or Antigravity.

You can test any domain without creating an account via the homepage grader (https://verisource.dev/#grader) or our zero-token protocol validators (https://verisource.dev/tools). Happy to answer questions on the HTTP study, Cloudflare Worker MCP metering, or Shopify `/api/ucp/mcp` behavior.
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
- **Scene 05 (`3:20–4:05`) — 60-Second Agency White-Label `/audit/[slug]` & `CTA CLICKED` Deal Alerts (`/dashboard` Step 03):**
  - Mint a branded `/audit/[slug]` link with custom agency hex color and booking calendar URL. Open `/audit/[slug]` in an incognito tab—showing zero Verisource branding—click the booking CTA, and show the **`CTA CLICKED · 1x`** filter pill in Step 03.
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
  2. Homepage 60-second **Site Diagnosis & Action Plan** + auto-detected CMS badge.
  3. Step 02 **1-Click AI Fix Prompt** + `4/4 VERIFIED LIVE` HTTP verification banner.
  4. White-label `/audit/[slug]` agency client brief + **`CTA CLICKED`** deal alert badge.
  5. 2026 40-Domain AI Search Readiness Matrix (`50.0%` custom `/llms.txt`, `5.0%` custom `/agents.md`, `5.0%` silent `GPTBot` `HTTP 403`).

### Maker First Comment (Copy-Paste)
```text
Hey everyone — I built Verisource (https://verisource.dev) after watching B2B companies, Shopify brands, and agencies pay $250–$579/mo for passive AI visibility charts that never actually fix a single schema tag, WAF rule, or hallucinated price.

Verisource is a read-write GEO & Paid MCP action engine:
1. Scans ChatGPT, Google Gemini, and Perplexity to separate Mention Rate % vs. Citation Rate % and catch wrong pricing or shipping claims against your Brand Truth Sheet.
2. Auto-detects 7 CMS platforms (Shopify, WordPress, Webflow, Wix, Squarespace, Framer, Next.js) and generates syntax-validated JSON-LD, /llms.txt, /agents.md, /ai-facts, and Rival Comparison Pages with closed-loop HTTP verification.
3. Ships a 60-second white-label /audit/[slug] agency pitch generator ($249/mo for 15 client sites) with instant prospect open and booking CTA click alerts, plus a stateless Streamable HTTP MCP server at https://mcp.verisource.dev/mcp.

Try the free domain grader at https://verisource.dev/#grader, explore the 90-second interactive tour at https://verisource.dev/tutorial, or read our 40-domain 2026 HTTP Readiness Study at https://verisource.dev/benchmarks/ai-search-readiness-2026. The first 30 Pro and Agency workspaces lock our Founding Partner Rate for life.
```
