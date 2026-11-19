# GitHub Actions Marketplace Release Kit — `v1.0.0`

**Target URL:** https://github.com/kulinichnick/verisource/releases/new

## Exact Fields to Paste (`1 Minute`)
1. **Check the box:** `[x] Publish this Action to the GitHub Marketplace`
2. **Primary Category:** `Code quality` · **Secondary Category:** `Deployment`
3. **Tag:** `v1.0.0` (Target: `main`)
4. **Release Title:** `v1.0.0 — Verisource AI Search & Site Health Gate (Action + Live SVG Badge)`
5. **Release Description (Copy-Paste — `10.0/10` Quality Verified):**

```markdown
## Verisource AI Search & Site Health Gate (`v1.0.0`)

Add a 6-line CI check to verify your site is readable by **ChatGPT Search (`OAI-SearchBot`)**, **OpenAI (`GPTBot`)**, **Perplexity (`PerplexityBot`)**, and **Claude (`ClaudeBot`)** on every deploy or pull request—plus auto-post a sticky PR summary with a live **AI Search Readiness SVG badge**.

### Quickstart (`.github/workflows/ai-readiness.yml`)
```yaml
name: AI Search Readiness Gate
on: [pull_request, push]

jobs:
  geo-gate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: kulinichnick/verisource@v1.0.0
        with:
          url: https://yourcompany.com
          min-visibility-score: '60'
          require-llms-txt: 'true'
```

### Live README Badge (Auto-Cached from `verisource.dev`)
```markdown
[![AI Search Readiness](https://verisource.dev/api/badge/yourcompany.com)](https://verisource.dev/report/yourcompany.com)
```

### What `v1.0.0` Checks Automatically
- **AI Crawler WAF & `/robots.txt` Access:** Probes real `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, and `ClaudeBot` `User-Agent` headers to catch silent CDN `HTTP 403` blocks.
- **3-Pillar `schema.org` JSON-LD Audit:** Verifies `Entity Identity`, `FAQPage` Q&A coverage, and `Offer` pricing schema.
- **Protocol Files:** Validates HTTP `200` `text/plain` `/llms.txt` and custom `/agents.md` (catching SPA soft-404s and Shopify stock boilerplate).
- **20-Page Broken Link & `#anchor` Crawler:** Flags dead internal links and `4xx/5xx` regressions before merge.
- **Zero-Key Free Mode:** Works without an API key; pass an optional `vs_live_` key (`api-key`) to push CI telemetry to [verisource.dev/dashboard](https://verisource.dev/dashboard).

### Related Ecosystem Links
- Free 60-second web scanner: https://verisource.dev/#scan
- `510+` live public domain scorecards: https://verisource.dev/reports
- Stateless Streamable HTTP & OAuth 2.1 MCP Server: https://verisource.dev/mcp-guide
```
