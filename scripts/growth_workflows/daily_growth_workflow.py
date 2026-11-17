# Antigravity Dynamic Multi-Agent Workflow: Daily Growth Engine
# Invoke via Antigravity `run_workflow` tool:
#   run_workflow(ScriptPath="C:/dev/verisource/scripts/growth_workflows/daily_growth_workflow.py", Description="Run daily agency outbound + programmatic SEO batch")

phase("1. Parallel Daily Growth Execution (Agency Outbound + Programmatic SEO)")

agency_prompt = """Execute the daily `agency-trojan-outbound` batch (2 boutique Shopify Plus / Webflow / B2B SEO agencies):
1. Read `g:\\My Drive\\GEO MCP Engine\\growth_ops\\agency_targets.json` and `C:\\dev\\verisource\\.gemini\\agents\\agency-trojan-outbound.md`.
2. Run `node C:\\dev\\verisource\\scripts\\growth_workflows\\ops-daily.mjs --agencies 2 --domains 10` (or verify its output if just executed) so 2 live agency case-study client domains are audited and 10 `/report/[domain]` scorecards are generated.
3. Verify every 3-sentence founder outreach note in `growth_ops/queue/daily_agency_outreach.md` passes the 9.5/10 Quality Gate (zero banned AI lexicon words).
Return a concise JSON summary of the 2 audited agencies and client domains."""

seo_prompt = """Verify the daily `programmatic-seo-publisher` batch (10 `/report/[domain]` scorecards):
1. Read `C:\\dev\\verisource\\apps\\web\\src\\data\\published-reports.json` and `g:\\My Drive\\GEO MCP Engine\\growth_ops\\queue\\TODAY_ACTION_DASHBOARD.md`.
2. Confirm all newly published scorecards have `qualityScore >= 9.5`, zero internal fixture domains (`aurearoasters.com`, `mosaicroasters.com`), and valid 3-pillar JSON-LD readiness fields.
Return the count of published `/report/[domain]` pages and top 3 domains added."""

agency_res, seo_res = await parallel(
    [
        ("Agency Trojan-Horse Outbound", "agency-trojan-outbound", "flash", agency_prompt),
        ("Programmatic SEO Publisher", "programmatic-seo-publisher", "flash", seo_prompt),
    ],
    lambda item: agent(
        item[3],
        schema={"type": "string"},
        role=item[0],
        type_name=item[1],
        model=item[2],
    ),
)

phase("2. Handover Dashboard Verification")
log("Agency Outbound Summary:", agency_res)
log("Programmatic SEO Summary:", seo_res)
print("Daily Growth Workflow complete. Open growth_ops/queue/TODAY_ACTION_DASHBOARD.md for your 15-minute review.")
