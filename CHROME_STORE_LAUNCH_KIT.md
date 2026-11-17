# Chrome Web Store Listing & Promotional Asset Kit (`v1.0.0`)

Ready-to-submit Chrome Web Store listing copy, least-privilege permission justifications, and `1280x800` promotional marquee assets for **`verisource-chrome-mv3-v1.0.0.zip`**.

---

## 1. Store Listing Metadata

* **Package Archive:** `verisource-chrome-mv3-v1.0.0.zip` (`162.7 KB`, `manifest_version: 3`)
* **Extension Name (`<= 45 chars`):** `Verisource — GEO & AI Citation Inspector`
* **Short Summary (`<= 132 chars`):** `Inspect AI visibility, claim accuracy, 3-pillar JSON-LD, and /agents.md readiness on any storefront or B2B website.`
* **Category:** `Developer Tools` (Secondary: `Productivity`)
* **Official Homepage:** `https://verisource.dev`
* **Support URL:** `https://verisource.dev/tutorial`
* **Privacy Policy URL:** `https://verisource.dev/privacy`

---

## 2. Detailed Store Description (Copy-Paste)

```text
Verisource inspects how ChatGPT Search, Google Gemini, and Perplexity read, cite, and describe any public website—right inside your Chrome Side Panel.

Instead of switching tabs to check robots.txt, JSON-LD, /llms.txt, or /agents.md by hand, open the Verisource Side Panel on any site to run a live 3-engine & HTTP protocol check in seconds.

WHAT IT INSPECTS ON ANY TAB
1. AI Visibility & Fact Accuracy: Measures Mention Rate % vs. Citation Rate % across ChatGPT, Gemini, and Perplexity, and flags pricing or policy discrepancies against verified site truth.
2. Crawler & Edge WAF Access: Verifies whether GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, and Google-Extended receive HTTP 200 or silent edge WAF 403 blocks.
3. 3-Pillar JSON-LD & Protocol Files: Checks Entity Identity, FAQPage Q&A, Offer pricing, /llms.txt, /agents.md, and Shopify /api/ucp/mcp readiness.
4. 7-CMS Auto-Detection & 1-Click AI Fix Prompts: Fingerprints Shopify, WordPress, Webflow, Wix, Squarespace, Framer, and Next.js, then copies a tailored fix prompt for Cursor, Claude Code, or Antigravity—and verifies 4/4 fixes live over HTTP.

BUILT FOR NON-PROS & AGENCIES
• Guided Mode keeps steps clean and readable without jargon.
• Pro Mode expands full Mention vs. Citation Share, Rival Share of Voice, and Streamable HTTP /mcp configs (https://mcp.verisource.dev/mcp).
• Export board-ready Markdown audits or jump straight into your white-label /audit/[slug] sandbox.

STRICT LEAST-PRIVILEGE PERMISSIONS
Verisource requests only `sidePanel` and `activeTab`. It never injects background content scripts, never reads browsing history, and only inspects the active domain when you click Scan Active Tab.
```

---

## 3. Chrome Web Store Permission Justifications

* **`sidePanel`:** Required to render the 3-tab Verisource GEO & AI Citation Inspector inside Chrome's native Side Panel alongside the active webpage.
* **`activeTab`:** Required solely to read the hostname of the currently active public `http(s)` tab when the user explicitly clicks **Scan Active Browser Tab**. No `<all_urls>` host permissions or background scraping are requested.

---

## 4. Chrome Web Store Ready-to-Upload `.png` Assets (24-Bit RGB, No Alpha)

Chrome Web Store requires `24-bit PNG (no alpha channel)` graphics rather than `.svg` files. All 4 upload-ready `.png` files (alongside editable `.svg` vector sources) are saved in `g:\My Drive\GEO MCP Engine\chrome-store-assets\`:

1. `verisource-cws-screenshot-1-hero-1280x800.png` (`1280x800`, 24-bit RGB) — **Screenshot 1: Active Tab AI Visibility, WAF & 3-Pillar JSON-LD Inspector**
2. `verisource-cws-screenshot-2-fixes-1280x800.png` (`1280x800`, 24-bit RGB) — **Screenshot 2: 7-CMS 1-Click AI Fix Prompt & 4/4 Live HTTP Verification**
3. `verisource-cws-small-promo-440x280.png` (`440x280`, 24-bit RGB) — **Small Promo Tile**
4. `verisource-cws-store-icon-128x128.png` (`128x128`) — **Store Listing Icon**

---

## 5. 5-Minute Developer Console Upload Checklist

1. Open `https://chrome.google.com/webstore/devconsole` in your personal Google account (requires Google's one-time `$5.00` developer registration if not yet activated).
2. Click **New Item** and drag in `g:\My Drive\GEO MCP Engine\verisource-chrome-mv3-v1.0.0.zip`.
3. Under **Store Listing**, paste the **Extension Name**, **Short Summary**, **Detailed Store Description**, and **Category** (`Developer Tools`) from Sections 1–2 above, then drag in the 4 `.png` images from `g:\My Drive\GEO MCP Engine\chrome-store-assets\`.
4. Under **Privacy Practices**, select **Single Purpose** (`Inspect AI search visibility, crawler access, and structured protocol files for the active browser tab on user click`), paste the `sidePanel` and `activeTab` justifications from Section 3, check **No** for remote code execution, and paste `https://verisource.dev/privacy` as your Privacy Policy URL.
5. Click **Submit for Review** (pure `sidePanel` + `activeTab` extensions with zero `<all_urls>` host permissions typically clear review in 24–48 hours).
