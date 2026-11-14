# Patient Zero Shopify Deployment Packs (`aurearoasters.com` & `mosaicroasters.com`)

Live HTTP & Shopify Admin API status across both storefronts (`wuwvdd-0t.myshopify.com` / `23.227.38.32` & `premer-roastery.myshopify.com` / `23.227.38.65`):

1. **Shopify Native UCP Endpoint (`/api/ucp/mcp`):** Active (`200 OK`) on both stores.
2. **Step 1 — Theme Entity `JSON-LD` + Alternate Truth Link + Storefront Visit Pixel (`LIVE`):** Deployed directly via Shopify Admin API (`snippets/verisource-geo.liquid` + `{% render 'verisource-geo' %}` in `layout/theme.liquid`) on Aurea Main Theme `169180102891` (`8` offers + `FAQPage`) and Mosaic Main Theme `160270385374` (`6` offers + `40233.6`m Springfield `GeoCircle` + `FAQPage`).
3. **Step 2 — Canonical First-Party Brand Truth Sheet (`LIVE`):**
   - **Aurea:** `https://aurearoasters.com/cdn/shop/files/aurea-verified-ai-facts.md` (`200 OK`, uploaded via Shopify Admin GraphQL `fileCreate`).
   - **Mosaic:** `https://mosaicroasters.com/pages/ai-facts` (`200 OK`, page ID `133596709086`, created via Shopify Admin Pages API).
4. **Step 3 — Sandboxed Checkout Revenue Pixel (`Settings -> Customer events`):** Ready for 30-second paste in Shopify Admin (Shopify's PCI DSS v4.0 Checkout Extensibility sandbox blocks all Admin API tokens from creating raw-JS merchant Custom Pixels programmatically).

---

## 3-Step Installation Per Store (~3 Minutes Each in Shopify Admin)

Repeat these 3 steps for **Aurea (`deploy-packs/aurearoasters.com/`)** and **Mosaic (`deploy-packs/mosaicroasters.com/`)**:

### Step 1 — Inject Entity `JSON-LD`, Alternate Truth Link & Visit Pixel (`layout/theme.liquid`)
1. In **Shopify Admin → Online Store → Themes → `...` → Edit code**.
2. Under **Snippets**, click **Add a new snippet**, name it `verisource-geo`, paste the store's `snippets-verisource-geo.liquid`, and click **Save**.
3. Open **`layout/theme.liquid`**, add this single line right above `</head>`, and click **Save**:
   ```liquid
   {% render 'verisource-geo' %}
   ```

### Step 2 — Publish Canonical Brand Truth Page (`/pages/ai-facts`)
*(Because native Shopify intercepts `/agents.md` and `/llms.txt` at the platform edge, Step 1 advertises `<link rel="alternate" type="text/markdown" href="{{ shop.url }}/pages/ai-facts">` in `<head>` so `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, and `ClaudeBot` ingest your verified SKU and policy truth sheet directly.)*
1. In **Shopify Admin → Online Store → Pages → Add page**.
2. Set **Title** to `Verified Brand & Catalog Facts` and **URL handle** (under Search engine listing → Edit) to `ai-facts` (`/pages/ai-facts`).
3. Paste the contents of `page-ai-facts.md` and click **Save**.

### Step 3 — Activate Checkout Revenue Attribution (`Settings → Customer events`)
*(Tracks `checkout_completed` revenue inside Shopify's sandboxed Checkout Extensibility iframe using your store's SHA-256 `VS_CHECKOUT_KEY`.)*
1. In **Shopify Admin → Settings → Customer events → Add custom pixel**.
2. Name it `Verisource AI Attribution` → set **Permission** to `Not required` (first-party analytics attribution only) → paste `shopify-custom-web-pixel.js`.
3. Click **Save** → click **Connect**.

---

## Live Smoke Test After Connecting
Visit `https://aurearoasters.com/?utm_source=chatgpt.com` (or `https://mosaicroasters.com/?utm_source=perplexity.ai`) in a browser tab:
- `snippets-verisource-geo.liquid` immediately fires an Origin-verified `POST https://verisource.dev/api/pixel` (`201 Created`) and increments **AI Referral Visits** in Tab 1 of `https://verisource.dev/dashboard`.
- Completing any test order increments **Verified AI Checkout Revenue** (`ai_referral_conversion`) automatically via the Customer Events pixel.
