---
name: quality-gate-95
description: Enforces the mandatory 5-pillar 9.5/10 Natural Quality Rubric across all UI components, landing page copy, error states, agency pitch reports, and generated customer GEO fixes (JSON-LD, /agents.md, /llms.txt, Answer-First FAQs, and outreach briefs). Run before presenting any UI or copy as complete.
---

# 9.5/10 Natural Quality Gate (Zero AI-Slop Critic)

Nothing scoring below **9.5 / 10.0** may be shipped, rendered in the UI, or inserted into `public.generated_fixes` (`check (natural_quality_score >= 9.5)`).

## 1. The 5-Pillar Grading Rubric (10.0 Points Max)

Evaluate every piece of copy, generated customer artifact, or UI screen across five 2.0-point pillars:

### Pillar 1: Zero AI-Lexicon Filter (2.0 pts)
Scan case-insensitively for all banned words and constructions:
* **Banned Words:** `delve`, `testament`, `tapestry`, `elevate`, `game-changer`, `unleash`, `unlock`, `seamless`, `comprehensive`, `moreover`, `furthermore`, `beacon`, `symphony`, `turbocharge` (including morphological variants such as `unlocking`, `unlocks`, `seamlessly`, `elevating`, `game-changing`, `turbocharged`).
* **Banned Constructions:** `in today's fast-paced digital landscape`, `it's not just X—it's Y` (and `not just X, it's Y`), hollow throat-clearing openers (`In an era where...`, `When it comes to...`).
* **Deduction Rule:** Deduct **1.0 full point per match** (minimum 0.0). Even a single match drops the maximum possible total to 9.0/10, triggering an automatic rewrite.

### Pillar 2: Human Cadence & Burstiness (2.0 pts)
* Alternate crisp 4–7 word declarative sentences with concrete 18–25 word technical explanations.
* Write like a sharp, direct B2B founder speaking to an agency principal or staff engineer—never like a SaaS press release.
* **Deductions:** `-0.5 pt` for three consecutive sentences of nearly identical length (14–18 words); `-0.5 pt` for stacked empty intensifiers (`truly`, `incredibly`, `effortlessly`, `revolutionary`).

### Pillar 3: Specificity & Evidence Density (2.0 pts)
* Anchor claims in verifiable protocol, crawl, or commercial artifacts: `JSON-LD`, `/agents.md`, `/llms.txt`, `/api/ucp/mcp`, `/api/mcp`, `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, exact HTTP status codes (`200`, `403`), exact cited URLs, real SKU prices, delivery radii, and conversion benchmarks (`14.2%–15.9%` vs. `1.76%–2.8%`).
* **Deductions:** `-0.5 pt` per vague marketing phrase (`powerful insights`, `actionable intelligence`, `next-generation visibility`, `optimize your presence`) left unbacked by a named artifact or metric.

### Pillar 4: UI & Visual Craftsmanship (2.0 pts — UI Tasks; Structural Craft for Copy/Code Tasks)
* **Required Editorial Aesthetic (Linear / Stripe / Vercel standard):** High-contrast monochrome/slate hierarchy (`#0F172A` primary ink, crisp `1px` `#E2E8F0` / `#1E293B` hairline borders, purposeful whitespace, `tabular-nums` monospace tables for scores, ranks, and URLs).
* **Strictly Banned UI Patterns:** Neon purple/cyan/pink glow gradients, generic 3-column Lucide marketing feature grids, floating glassmorphic blobs, fake avatars/testimonials, or decorative gauges without underlying row data.
* **Deductions:** `-1.0 pt` for any banned visual cliché; `-0.5 pt` for misaligned data hierarchy or missing empty/loading/error states.

### Pillar 5: Technical & Functional Integrity (2.0 pts)
* Zero `TODO`, `FIXME`, `Lorem ipsum`, `example.com` (unless explicitly documenting RFC syntax), or `[Insert X]` placeholders.
* Generated `JSON-LD` must parse via `JSON.parse()` with valid `@context: "https://schema.org"` and `@type`.
* Generated `agents.md.liquid` must use valid Shopify Liquid objects (`{{ shop.name }}`, `{{ shop.url }}`, `{{ product.title }}`), and `/llms.txt` / `/agents.md` must use clean Markdown headings and canonical URLs.
* **Deductions:** `-2.0 pts` for syntax errors or placeholders.

---

## 2. Mandatory Enforcement Loop

1. **Draft** the UI component, page copy, or GEO fix artifact.
2. **Audit** against Pillars 1–5 before finishing the turn.
3. **Rewrite Inline if `< 9.5 / 10.0`:** List the exact offending phrase or UI defect, strip it, and re-grade inside the same turn until the verified score is **`>= 9.5 / 10.0`**.
4. **Database Schema Payload Compatibility:** Whenever persisting rows into `public.generated_fixes`, populate `natural_quality_score` (`>= 9.5`) and `quality_rubric_breakdown` with this exact JSON shape:
   ```json
   {
     "lexicon_filter": 2.0,
     "human_cadence": 1.9,
     "specificity_density": 2.0,
     "visual_or_structural_craft": 1.9,
     "technical_integrity": 2.0,
     "total": 9.8,
     "revisions_run": 1
   }
   ```
5. **Turn Output Badge:** When delivering finished UI or customer-facing copy, print:
   `Quality Score: X.X / 10.0 (Lexicon: X.X | Cadence: X.X | Specificity: X.X | Craft: X.X | Integrity: X.X)`
