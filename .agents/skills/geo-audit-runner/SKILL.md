---
name: geo-audit-runner
description: Runs and validates the Verisource GEO scanner, Shopify UCP/MCP adapter, Hallucination Watchdog, and 9.5/10 Quality Critic against Patient Zero stores (aurearoasters.com and mosaicroasters.com) or any target domain.
---

# Verisource GEO Audit Runner Skill

Use this skill whenever modifying `packages/core-geo`, scanner adapters, Shopify `/api/ucp/mcp` detection, Hallucination Watchdog rules, or generated customer fix templates.

## 1. Verification Checklist

Run the Patient Zero audit suite from `C:\dev\verisource`:

```powershell
cmd /c "cd /d C:\dev\verisource && npx --yes pnpm@9.15.0 --filter @verisource/core-geo test"
```

## 2. Invariants Enforced by the Audit Runner

1. **SSRF & Internal Host Rejection:** `normalizePublicDomain` must reject `localhost`, `127.0.0.1`, `169.254.169.254`, and `.local`/`.internal` hosts before any outbound `fetch` executes.
2. **Adversarial Critic Rejection & Auto-Sanitization:** Drafts containing banned AI-slop lexicon (`delve`, `seamless`, `unlock`, `comprehensive`, `it's not just X—it's Y`) must fail initial grading and rewrite cleanly to `>= 9.5 / 10.0`.
3. **Patient Zero Store Coverage (`aurearoasters.com` & `mosaicroasters.com`):**
   * **Aurea Coffee Roasters:** Detects Shopify `ucp_active` (`/api/ucp/mcp`) and `default_boilerplate` `/agents.md`, flags the `$15 K-Cup pod` hallucination against verified `$22–$28` whole-bean truth, and outputs a valid `shopify_agents_liquid` override scoring `>= 9.5/10`.
   * **Mosaic Coffee Roasters:** Detects `PerplexityBot` WAF block, flags the `$25 free nationwide shipping` hallucination against verified `$35+` free US shipping + local Springfield, MO (25-mile radius) delivery truth, and outputs valid `LocalBusiness` + `GeoCircle` `JSON-LD` scoring `>= 9.5/10`.
4. **Syntax Integrity:** Every `json_ld_schema` payload must pass `JSON.parse()` with `@context: "https://schema.org"`, and every `shopify_agents_liquid` payload must contain balanced `{{ ... }}` Liquid objects.
