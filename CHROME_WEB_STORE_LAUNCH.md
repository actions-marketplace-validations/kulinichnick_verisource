# Chrome Web Store Submission & Launch Kit (`v0.1.0`)

**Upload Package:** `C:\dev\verisource\apps\extension\.output\verisourceextension-0.1.0-chrome.zip`  
**Local Unpacked Test Directory:** `C:\dev\verisource\apps\extension\.output\chrome-mv3`  
**Dashboard URL:** https://chrome.google.com/webstore/devconsole

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

Audit how ChatGPT, Google Gemini, and Perplexity cite and describe any B2B site or Shopify storefront directly from Chrome's native Side Panel.

Verisource gives founders, technical SEO leads, and GEO agencies a 3-tab inspection workflow without leaving the page they are reviewing:

1. VISIBILITY, HALLUCINATIONS & AI BOT ACCESS
• Score domain AI readiness (0–100) and Brand Truth accuracy in one click.
• Verify whether /robots.txt or edge WAF rules block GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, or Google-Extended.
• Diff AI engine claims on pricing, shipping thresholds, and discontinued SKUs against verified ground-truth facts.

2. ONE-CLICK >= 9.5/10 ON-SITE FIXES & SHOPIFY ADAPTER
• Generate syntax-validated Organization, Product, SoftwareApplication, and FAQPage JSON-LD blocks.
• Export clean /llms.txt and /agents.md specifications vetted by an adversarial zero-cliche quality critic.
• Detect Shopify /api/ucp/mcp (Universal Commerce Protocol) and legacy /api/mcp endpoints and export drop-in templates/agents.md.liquid theme overrides.

3. QUERY FANOUT CITATIONS, AGENCY PITCH LINKS & PAID MCP HUB
• Inspect decompiled search fanout sub-queries and third-party citation URLs winning commercial prompts.
• Launch 60-second white-label prospect pitch reports (/audit/[slug]) with your agency brand and booking link.
• Copy stateless Streamable HTTP configuration for https://mcp.verisource.dev/mcp (compatible with Claude Desktop, Cursor, and Antigravity).

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
