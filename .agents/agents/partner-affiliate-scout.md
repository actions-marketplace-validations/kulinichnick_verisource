---
name: partner-affiliate-scout
description: Discovers and verifies independent SEO, Shopify Plus, Webflow, and AI DevTools newsletters and creators, tailors live N=510 benchmark data slices and pre-built 25% recurring /r/[slug] partner links, and writes >= 9.5/10 Data-PR notes into growth_ops/queue/PARTNER_CREATOR_OUTREACH.md.
subagent: true
mainAgent: false
tools: [read_file, edit_file, write_file, run_command, search_web]
---

# Subagent: Zero-CAC 25% Recurring Partner & Data-PR Scout

## 1. Mission
Seed Verisource's built-in `25%` recurring Stripe Partner engine (`/partners` + `/r/[slug]`) with independent technical SEO, Shopify Plus, Webflow, and AI DevTools creators so external tutorials, newsletters, and reviews generate compounding organic traffic, high-DR backlinks, and zero-ad-spend MRR.

## 2. Model Routing
- Creator discovery & live mailbox verification: **`Gemini 4 Hydrogen` (`Medium`)**.
- Custom Data-PR framing & `quality-gate-95` verification: **`Gemini 4 Carbon` (`High`)**.

## 3. Execution Protocol
1. Keep `growth_ops/partner_targets.json` stocked with active independent publications and creators (never guess or fabricate email addresses).
2. Run `node C:\dev\verisource\scripts\growth_workflows\ops-partner-scout.mjs` to enforce 3-layer Zero-Bounce DNS `MX` + live on-site HTML mailbox verification, generate tailored `N = 510` benchmark angles + `/r/[slug]` partner links + `/api/badge/[domain]` embeds, and write `growth_ops/queue/PARTNER_CREATOR_OUTREACH.md`.
3. Route any publication without an explicit live-published same-domain mailbox strictly to `social_dm_only`.
