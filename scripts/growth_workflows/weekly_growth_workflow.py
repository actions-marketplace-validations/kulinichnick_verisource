# Antigravity Dynamic Multi-Agent Workflow: Weekly Retention, Social Proof & M&A Ledger
# Invoke via Antigravity `run_workflow` tool:
#   run_workflow(ScriptPath="C:/dev/verisource/scripts/growth_workflows/weekly_growth_workflow.py", Description="Run weekly social teardowns, retention drift watchdog, and M&A P&L ledger")

phase("1. Execute Weekly CLI Telemetry & SVG Pipeline")

teardown_and_retention = await parallel(
    [
        (
            "Hallucination Teardown Creator",
            "hallucination-teardown-creator",
            "inherit",
            """Execute the weekly `hallucination-teardown-creator` cycle:
1. Run `node C:\\dev\\verisource\\scripts\\growth_workflows\\ops-weekly.mjs` to scan 3 recognizable brands, export 1200x628 SVG comparison cards into `growth_ops/queue/assets/`, and write 30-second Chrome Side Panel scripts + X/LinkedIn/Reddit drafts into `growth_ops/queue/weekly_social_teardowns.md`.
2. Audit `growth_ops/queue/weekly_social_teardowns.md` to confirm zero banned AI lexicon words (`delve`, `unlock`, `seamless`, `comprehensive`, `elevate`, `game-changer`, etc.).
Return the 3 Chrome URLs and SVG paths ready for recording.""",
        ),
        (
            "Retention Drift Watchdog",
            "retention-drift-watchdog",
            "inherit",
            """Audit `growth_ops/queue/weekly_retention_actions.md` and `/api/cron/drift-watchdog` logic:
1. Review any Day-5+ `$19` Audit Pass (`tripwire_19`) buyers with `< 4/4` live checks and confirm their 1-click `$19` Stripe credit links (`plan=starter_49` / `plan=pro_99`) are ready.
2. Review any active subscriber drift alerts and verify their `vs.-Rival Comparison Page` prompt status.
Return a 3-line retention status summary.""",
        ),
    ],
    lambda item: agent(
        item[3],
        schema={"type": "string"},
        role=item[0],
        type_name=item[1],
        model=item[2],
    ),
)

phase("2. M&A Financial & Valuation Reconciliation")

ledger_summary = await agent(
    """Inspect `g:\\My Drive\\GEO MCP Engine\\growth_ops\\ledger\\MONTHLY_PNL_AND_VALUATION.md`:
1. Verify gross margin stays `>= 75.0%` (targeting `80.0%+`) and check live progress toward Month 3 (`$911/mo` net), Month 6 (`$2,465/mo` net / `$73,950` valuation), and Month 12 (`$7,186/mo` net / `$336,305` valuation).
2. Return the reconciled MRR, Net SDE, Gross Margin %, and exact subscriber gap to Month 3.""",
    schema={"type": "string"},
    role="M&A Diligence Ledger",
    type_name="ma-diligence-ledger",
    model="pro",
)

log("Teardown & Retention Summary:", teardown_and_retention)
log("M&A Diligence Ledger Summary:", ledger_summary)
print("Weekly Growth & M&A Workflow complete. Review MONTHLY_PNL_AND_VALUATION.md and weekly_social_teardowns.md.")
