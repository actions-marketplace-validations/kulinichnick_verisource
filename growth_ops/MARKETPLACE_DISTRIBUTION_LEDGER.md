# MARKETPLACE_DISTRIBUTION_LEDGER.md — Zero-CAC High-DR Shelf & Directory Tracker

**Updated:** `2026-11-19` · **Domain:** `https://verisource.dev` · **MCP:** `https://mcp.verisource.dev/mcp` · **OAuth 2.1:** `https://mcp.verisource.dev/oauth/mcp`

> **Why this file matters:** Your `510` `/report/[domain]` pages and `154` `/vs/[matchup]` pages need high-authority (`DR 70–95`) external citations and native buyer shelves to rank on Google and get recommended by ChatGPT, Perplexity, and Gemini. Complete each `READY` shelf once; it compounds organically 24/7.

---

## 1. Developer, CI/CD & MCP Registries (Highest Conversion Intent)

| # | Platform / Shelf | Current Status | Asset Already Built | 1-Click Publish Action |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **GitHub Actions Marketplace** | `READY TO PUBLISH` | Root `action.yml` (`shield` / `yellow`) + sticky PR badge (`verisource.dev/api/badge/{host}`) | On GitHub (`kulinichnick/verisource` -> **Releases** -> **Draft a new release** -> tag `v1.0.0`), check **"Publish this Action to the GitHub Marketplace"** (Category: *Code quality* + *Deployment*). |
| **2** | **Official MCP Registry** | `LIVE` | `dev.verisource/mcp@1.0.0` + Ed25519 proof | Verified live on `registry.modelcontextprotocol.io`. |
| **3** | **Glama MCP Directory** | `SUBMITTED` | Hosted Streamable HTTP `/mcp` | Verify badge & description stay synced with `OAuth 2.1` (`/oauth/mcp`). |
| **4** | **Cursor Directory** | `LIVE` | `verisource-geo-ai-citation-mcp` | Live plugin entry pointing to `https://mcp.verisource.dev/mcp`. |
| **5** | **Smithery Registry** | `READY` | Root `smithery.yaml` + `/mcp` | Submit at https://smithery.ai/new (`https://mcp.verisource.dev/mcp`). |
| **6** | **PulseMCP Directory** | `READY` | `MCP_DIRECTORY_LAUNCH.md` | Submit at https://www.pulsemcp.com/submit. |
| **7** | **MCP.so Index** | `READY` | `MCP_DIRECTORY_LAUNCH.md` | Submit at https://mcp.so/submit (`SEO & Search`). |
| **8** | **`punkpeye/awesome-mcp-servers`** | `READY` | Copy-paste PR line in `MCP_DIRECTORY_LAUNCH.md` | Open 1-line PR adding Verisource under Search / SEO. |

---

## 2. Browser Extensions & CMS App Stores (Wallet-Out Buyer Shelves)

| # | Store / Shelf | Current Status | Asset Already Built | Next Action |
| :--- | :--- | :--- | :--- | :--- |
| **9** | **Chrome Web Store** | `IN REVIEW / LIVE` | `verisource-chrome-mv3-v1.0.1.zip` + 24-bit RGB screenshots | Monitor approval; add Chrome Store link to footer & `/features`. |
| **10** | **Microsoft Edge Add-ons** | `READY (0 CODE)` | Exact same `verisource-chrome-mv3-v1.0.1.zip` | Upload at https://partner.microsoft.com/dashboard/microsoftedge. |
| **11** | **WordPress.org Plugin Directory** | `READY TO SUBMIT` | `/api/connectors/wordpress` PHP generator (`verisource-geo-connector.php`) | Zip plugin + `readme.txt` and submit to https://wordpress.org/plugins/developers/add/. |
| **12** | **Shopify App Store** | `PHASE 2 (BRIDGE READY)` | `/connectors` Shopify OS 2.0 theme snippet + `/api/ucp/mcp` probe | Package lightweight free AI Readiness + `/agents.md` helper app. |

---

## 3. B2B Software Directories & High-DR Launch Feeds

| # | Hub | Current Status | Positioning Hook (`MCP_DIRECTORY_LAUNCH.md` / `COMMUNITY_LAUNCH_KIT.md`) | Action URL |
| :--- | :--- | :--- | :--- | :--- |
| **13** | **G2** | `READY` | Read-write GEO + Hosted Brand `/mcp` (`$49/$99/$249`) vs. `$245–$579/mo` chart-only trackers | https://sell.g2.com |
| **14** | **Capterra / Gartner** | `READY` | 7-CMS `JSON-LD` + `/llms.txt` + `/agents.md` + 60s Agency White-Label `/audit/[slug]` | https://vendors.gartnerdigitalmarkets.com |
| **15** | **AlternativeTo** | `READY` | Action-first alternative to `Profound`, `Otterly.ai`, `Peec AI`, `AthenaHQ`, `Scrunch AI` | https://alternativeto.net |
| **16** | **SaaSHub** | `READY` | Free diagnostic suite (`/tools`) + `510+` public domain scorecards (`/reports`) | https://www.saashub.com/submit |
| **17** | **Show HN** | `READY (N=500 COPY)` | `COMMUNITY_LAUNCH_KIT.md` Section 12 — lead with `N = 500` empirical HTTP failures | https://news.ycombinator.com/submit |
| **18** | **Product Hunt / DevHunt / Peerlist** | `READY` | Pair with `verisource-n500-ai-readiness-infographic.png` + `VIDEO_FACTORY_QUEUE.md` MP4 | https://www.producthunt.com/posts/new |

---

## 4. Required GitHub Repository Secrets for 100% Unattended Cloud Crons

Add these in GitHub (`Settings -> Secrets and variables -> Actions`) so `.github/workflows/autonomous-growth-ops.yml` runs 24/7 with zero manual intervention:

1. `NEXT_PUBLIC_SUPABASE_URL` — Live Supabase URL
2. `SUPABASE_SERVICE_ROLE_KEY` — Authorizes `/api/dashboard/outbound-send`, `/api/indexnow`, and organic signup queries
3. `OUTBOUND_REPLY_TO_EMAIL` — Founder email receiving the 6-hour Community Citation Digest (`kulinichnick@gmail.com`)
4. `GEMINI_API_KEY` — Live multi-engine audit support for daily activation
5. `STRIPE_SECRET_KEY` — Automated Monday M&A P&L & SDE ledger reconciliation
6. `GSC_SERVICE_ACCOUNT_JSON` *(Optional, enables live Search Console striking-distance queries)* — Read-only Google Cloud Service Account JSON granted access on `sc-domain:verisource.dev`
