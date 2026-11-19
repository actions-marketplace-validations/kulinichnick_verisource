# `@verisource/cli`

Local-first AI Search GEO readiness scanner, 20-page site health crawler, codebase route mapper, and deterministic browser flow verifier for B2B engineering teams and coding agents.

Zero required runtime sub-dependencies. Run directly via `npx @verisource/cli` on Node.js 20+.

## Quickstart

```bash
# Audit AI bot WAF access, JSON-LD, /llms.txt, /agents.md, and 20-page link health
npx @verisource/cli scan https://verisource.dev

# Enforce deterministic CI thresholds (.verisource/checks.json -> exit 0, 1, or 2)
npx @verisource/cli verify https://verisource.dev --init

# Drill into a single compact finding handle instead of dumping raw HTML into context
npx @verisource/cli show h1

# Map static Next.js / React routes + JSON-LD emitters or crawl a live domain
npx @verisource/cli map . --diff

# Install compact agent instructions for Claude Code, Cursor, Codex, and Antigravity
npx @verisource/cli agent --skill --install all
```

## Command Reference

| Command | Purpose |
| :--- | :--- |
| `verisource auth [--key vs_live_...] [--status\|--logout]` | Authenticates your local or CI workspace against `/api/cli/sync` and stores `vs_live_` credentials in `.verisource/config.json` (`0o600`). |
| `verisource scan <url> [--push] [--json]` | Probes `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, and `ClaudeBot` `robots.txt`/WAF rules, `JSON-LD` entities, `/llms.txt`, `/agents.md`, `/ai-facts`, and crawls up to 20 internal pages (`VerisourceScan/1.0`). |
| `verisource verify <url> [--init] [--push] [--json]` | Evaluates live readiness and link health against `.verisource/checks.json`. Returns exit `0` on pass, `1` on policy failure, and `2` on invalid input or network failure. |
| `verisource vs <domainA> <domainB> [--json] [--github-summary]` | Runs a 6-dimension Head-to-Head AI Search & Crawler Protocol X-Ray between two public domains and stores `[x1..xN]` overtake action handles. |
| `verisource show <handle> [--json]` | Prints full metadata and remediation hints for a single stored handle (`h1` hallucination, `b1` bot/WAF block, `l1` broken link, `a1` dead `#anchor`, `n1` HTTP error, `g1` backend log, `e1` DOM element). |
| `verisource query "<text>" [--json]` | Searches `.verisource/last-run.json` handles by status code, route, or keyword. |
| `verisource map [url \| ./dir] [--find <q>] [--diff]` | Maps live domain links or static Next.js App Router / Pages Router routes, API handlers, and `application/ld+json` emitters. |
| `verisource browse <open\|click\|save> <arg>` | Opens a page into compact `[e1..eN]` element handles, follows links, and exports deterministic JSON specs to `.verisource/workflows/`. |
| `verisource record <name> <url>` | Captures a baseline HTTP + `JSON-LD` verification workflow into `.verisource/workflows/<name>.json`. |
| `verisource run [name] [--headed] [--json]` | Replays saved `.verisource/workflows/*.json` suites with zero LLM calls (uses local Playwright Chromium automatically when installed for interactive steps). |
| `verisource workflow check` | Validates every `.verisource/workflows/*.json` file before CI commit. |
| `verisource log <vercel\|supabase\|cloudflare>` | Queries local NDJSON or token-authenticated provider error logs within the last 5-minute window. |
| `verisource agent --skill --install <target>` | Writes Verisource CLI & MCP workflow rules for `claude`, `cursor`, `codex`, `antigravity`, or `all`. |

## GitHub Actions CI Gate

```yaml
- name: Verisource AI Search & Site Health Gate
  uses: kulinichnick/verisource@main
  with:
    url: ${{ env.PREVIEW_URL }}
    min-visibility-score: '65'
```

Or run the CLI directly with native `$GITHUB_STEP_SUMMARY` Markdown tables:

```yaml
- name: Verify AI Search Readiness & Site Health
  run: npx @verisource/cli verify ${{ env.PREVIEW_URL }} --github-summary
```

## Documentation & MCP Server

- Platform Capabilities: https://verisource.dev/features
- Crawler Transparency (`VerisourceScan/1.0`): https://verisource.dev/scanner
- Streamable HTTP MCP Endpoint: https://mcp.verisource.dev/mcp
- Agent Specification: https://verisource.dev/agents.md
