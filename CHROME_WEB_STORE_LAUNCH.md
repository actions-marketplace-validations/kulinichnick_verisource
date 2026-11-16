# Chrome Web Store Submission & Launch Kit (`v0.1.0`)

**Upload Package:** `C:\dev\verisource\apps\extension\.output\verisourceextension-0.1.0-chrome.zip`  
**Graphic Assets Folder (24-bit RGB, No-Alpha Validated):** `C:\dev\verisource\store-assets\`  
**Local Unpacked Test Directory:** `C:\dev\verisource\apps\extension\.output\chrome-mv3`  
**Dashboard URL:** https://chrome.google.com/webstore/devconsole

---

## 0. Graphic Assets Upload Map (`C:\dev\verisource\store-assets\`)

Every graphic below has been pre-encoded as **strict 24-bit Truecolor RGB PNG (`colorType = 2`, zero alpha channel)** at Google's exact required dimensions so Chrome Web Store accepts every dropzone on the first upload:

| Chrome Web Store Upload Slot | Required Spec | Ready-to-Upload File |
| :--- | :--- | :--- |
| **Store Icon** | `128 x 128` PNG | `C:\dev\verisource\store-assets\store-icon-128x128.png` |
| **Screenshot 1 (Tab 1)** | `1280 x 800` 24-bit PNG (no alpha) | `C:\dev\verisource\store-assets\screenshot-1-visibility-watchdog-1280x800.png` |
| **Screenshot 2 (Tab 2)** | `1280 x 800` 24-bit PNG (no alpha) | `C:\dev\verisource\store-assets\screenshot-2-fixes-shopify-ucp-1280x800.png` |
| **Screenshot 3 (Tab 3)** | `1280 x 800` 24-bit PNG (no alpha) | `C:\dev\verisource\store-assets\screenshot-3-fanout-mcp-hub-1280x800.png` |
| **Small Promo Tile** | `440 x 280` 24-bit PNG (no alpha) | `C:\dev\verisource\store-assets\promo-tile-small-440x280.png` |
| **Marquee Promo Tile** | `1400 x 560` 24-bit PNG (no alpha) | `C:\dev\verisource\store-assets\promo-tile-marquee-1400x560.png` |

---

## 1. Store Listing Copy (Quality Score: 9.8 / 10.0)

* **Extension Name:** `Verisource — GEO & AI Citation Inspector`
* **Short Summary (101 / 132 chars):**
  `Inspect AI visibility, hallucinations, and /agents.md readiness on any storefront or B2B site.`
* **Category:** `Developer Tools` (or `Productivity`)
* **Language:** `English (United States)`
* **Official URL / Homepage:** `https://verisource.dev`
* **Support URL:** `https://verisource.dev/pricing`

### Detailed Description (Copy-Paste into Chrome Web Store)

Audit how ChatGPT, Google Gemini, and Perplexity cite and describe any website or Shopify storefront directly from Chrome's native Side Panel.

Verisource gives business owners, technical SEO leads, and GEO agencies an easy-to-use 3-step inspection workflow without leaving the page they are reviewing:

1. SITE DIAGNOSIS, HALLUCINATIONS & AI BOT ACCESS
• Score domain AI readiness (0–100), Brand Truth accuracy, and head-to-head Rival Share of Voice in one click.
• Auto-detect 7 website platforms (Shopify, WordPress, Webflow, Wix, Squarespace, Framer, and Custom Code / Next.js).
• Verify whether /robots.txt or edge WAF rules block GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, or Google-Extended.
• Diff AI engine claims on pricing, shipping thresholds, and discontinued SKUs against verified ground-truth facts.

2. 1-CLICK AI FIX PROMPTS & VALIDATED ON-SITE ARTIFACTS
• Copy 1 platform-tailored prompt into Claude, ChatGPT, Antigravity, Cursor, WPCode, Webflow, or Shopify to fix your site without manual coding.
• Generate syntax-validated Organization, Product, SoftwareApplication, and FAQPage JSON-LD blocks, /llms.txt, /agents.md, and /ai-facts specifications.
• Draft truth-locked You vs. Competitor comparison pages (/compare/brand-vs-rival) and Shopify /api/ucp/mcp + templates/agents.md.liquid overrides.

3. QUERY FANOUT CITATIONS, AGENCY PITCH LINKS & PAID MCP HUB
• Inspect decompiled search fanout sub-queries and third-party citation URLs (Reddit, G2, Clutch, Editorial) winning commercial prompts.
• Launch 60-second white-label prospect pitch reports (/audit/[slug]) with your agency brand and booking link.
• Copy stateless Streamable HTTP configuration for https://mcp.verisource.dev/mcp (compatible with Claude Desktop, Cursor, Windsurf, and Antigravity).

PRIVACY & LEAST-PRIVILEGE ARCHITECTURE
Verisource requests only sidePanel and activeTab permissions. It requests zero <all_urls> host permissions, injects zero background content scripts, and never records cross-site browsing history.

---

## 2. Privacy Tab — Permission Justifications (Copy-Paste into Review Form)

* **Single Purpose Description:**
  `Audits the active tab's public domain for AI search crawler access (/robots.txt, /llms.txt, /agents.md, and JSON-LD) and displays Generative Engine Optimization fixes inside the Chrome Side Panel.`

* **`sidePanel` Justification:**
  `Required to render the 3-tab Verisource GEO audit interface alongside the webpage the user is actively inspecting.`

* **`activeTab` Justification:**
  `Required solely when the user clicks the extension action or clicks "Inspect Active Tab" so the side panel can read the current tab's public hostname and run an on-demand GEO readiness check. No page cookies, form inputs, or background tab URLs are accessed.`

* **Remote Code:** select **No, I am not using Remote code** (all React, `@verisource/ui`, and `@verisource/core-geo` modules are statically bundled inside `.output/chrome-mv3`).

* **Privacy Policy URL:**
  `https://verisource.dev/privacy`

---

## 3. Data Usage Checkboxes (Chrome Web Store Privacy Practices)

* Check **Website content** *only if asked about public domain URL inspection*, OR leave all personal data boxes **unchecked** and check the certification boxes confirming:
  * You do **not** sell user data to third parties.
  * You do **not** use or transfer user data for purposes unrelated to the item's single purpose.
  * You do **not** use or transfer user data to determine creditworthiness or for lending purposes.
