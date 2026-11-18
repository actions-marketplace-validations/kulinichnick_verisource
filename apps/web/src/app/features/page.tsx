import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import {
  CopyCommandPill,
  LightBrowserFrame,
  StatusBadge,
} from '@verisource/ui';

export const metadata: Metadata = {
  title: 'Platform Capabilities — AI Search GEO, Browser Verification & /mcp | Verisource',
  description:
    'Explore all 11 Verisource capabilities: ChatGPT, Gemini & Perplexity Share-of-Voice, Brand Truth Hallucination Watchdog, 1-Click 7-CMS Fix Prompt, 20-page broken-link crawler, Playwright flow verification, backend log correlation, and Streamable HTTP /mcp.',
  alternates: {
    canonical: 'https://verisource.dev/features',
  },
};

interface FeatureRowSpec {
  id: string;
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
  terminalTitle: string;
  terminalBadge: string;
  terminalLines: string[];
}

const FEATURE_ROWS: readonly FeatureRowSpec[] = [
  {
    id: 'multi-engine-sov',
    kicker: '01 · Answer Engine Insights',
    title: 'Separate Brand Mention % from Citation Link % across 3 AI engines.',
    body: 'Tracks real buyer discovery, comparison, and pricing questions across ChatGPT Search, Google Gemini, and Perplexity—ranking head-to-head competitor Share-of-Voice and third-party sources AI trusts.',
    bullets: [
      'Decompiles hidden query fanouts and auto-suggests funnel-stage buyer questions.',
      'Classifies cited URLs into Reddit/UGC, Review Directories, Press, Competitor, and Owned.',
      'Includes 1-click outreach drafts and live mention/dofollow verification.',
    ],
    terminalTitle: 'Engine Share-of-Voice & Fanout Telemetry',
    terminalBadge: '3 AI ENGINES',
    terminalLines: [
      '$ verisource mcp call get_citation_gaps_and_fanouts --domain acmecloud.io',
      'chatgpt     mention: 84%   cited_link: 62%   framing: RECOMMENDED #1',
      'perplexity  mention: 91%   cited_link: 86%   framing: FOOTNOTE #1',
      'gemini      mention: 76%   cited_link: 54%   top_gap: g2.com/categories/sync',
    ],
  },
  {
    id: 'hallucination-watchdog',
    kicker: '02 · Brand Truth Watchdog',
    title: 'Catch invented pricing, discontinued tiers, and wrong shipping rules.',
    body: 'Auto-drafts a structured Brand Truth Sheet from your live pages during initial scan, then diffs AI engine answers weekly to trigger instant Resend alerts whenever an LLM fabricates claims.',
    bullets: [
      'Isolates multi-brand comparison bullets and footnotes so rival prices never false-flag.',
      'Dispatches weekly Resend drift digests when AI quotes wrong prices or WAF blocks bots.',
      'Exports machine-readable negative guardrails directly into /agents.md.',
    ],
    terminalTitle: 'Brand Truth Diff · [h1] Conflict',
    terminalBadge: 'TRUTH LOCKED',
    terminalLines: [
      '$ verisource scan acmecloud.io --check-truth',
      'WARN  1 claim conflict detected against verified Brand Truth Sheet:',
      '  [h1] Perplexity stated "$19/mo unlimited seats"',
      '       Verified truth: "Starter $49/mo (up to 5 seats); Pro $99/mo"',
    ],
  },
  {
    id: 'one-click-cms-fix',
    kicker: '03 · 7-Platform Remediation & Rival Studio',
    title: 'One prompt fixes Shopify, WordPress, Webflow, Wix, or Next.js.',
    body: 'Fingerprints your CMS automatically and packages Organization, Product/OfferCatalog, and FAQPage JSON-LD alongside /llms.txt and /agents.md into a single prompt—plus a Rival Comparison Page Studio.',
    bullets: [
      'Native Shopify adapter probes /api/ucp/mcp and generates templates/agents.md.liquid.',
      'Supports no-root-file builders via /ai-facts semantic HTML + <link rel="alternate">.',
      'Closed-loop ✓ Verify Live Fixes confirms all 4 endpoints return HTTP 200.',
    ],
    terminalTitle: 'Closed-Loop Live HTTP Verifier',
    terminalBadge: '4/4 LIVE',
    terminalLines: [
      '$ verisource verify acmecloud.io',
      '  ✓ [json_ld]     Organization + OfferCatalog + FAQPage (4 nodes)',
      '  ✓ [llms_txt]    https://acmecloud.io/llms.txt (HTTP 200)',
      '  ✓ [agents_md]   https://acmecloud.io/agents.md (custom_enriched)',
      '  ✓ [crawler_waf] GPTBot · OAI-SearchBot · PerplexityBot · ClaudeBot',
    ],
  },
  {
    id: 'multi-page-scanner',
    kicker: '04 · verisource scan <url>',
    title: 'Crawl up to 20 pages for broken links, HTTP 4xx/5xx, and dead #anchors.',
    body: 'AI crawlers drop citations the moment a pricing or comparison URL returns a 404 or blank client-rendered shell. VerisourceScan crawls internal links read-only while obeying /robots.txt.',
    bullets: [
      'Checks internal & external links, scripts, stylesheets, and images via HEAD/GET.',
      'Verifies every #fragment link against real DOM id/name attributes on target pages.',
      'Flags commercial routes (/pricing, /compare) exposing < 55 non-JS words.',
    ],
    terminalTitle: 'Multi-Page Site Health Crawler',
    terminalBadge: 'ROBOTS.TXT OBEYED',
    terminalLines: [
      '$ verisource scan https://acmecloud.io --max-pages 20 --depth 2',
      'WARN  18/18 pages crawled · 52 links · 2 findings (610ms):',
      '  [l1] /pricing -> https://acmecloud.io/legacy-enterprise (HTTP 404)',
      '  [a1] / -> https://acmecloud.io/pricing#soc2-faq (missing id="soc2-faq")',
    ],
  },
  {
    id: 'interactive-browse',
    kicker: '05 · verisource browse open <url>',
    title: 'Drive a persistent real browser using short handles instead of DOM dumps.',
    body: 'Keep a local Chromium session alive across commands (`click e4`, `fill e7`, `select`, `press`), returning only compact DOM and network deltas so coding agents keep 95%+ of their context window free.',
    bullets: [
      'Supports --user-data-dir and --cdp to attach to authenticated local sessions.',
      'Assigns stable short handles (e1..eN) to interactive buttons, inputs, and links.',
      'Turn any interactive exploration into a saved workflow via `verisource browse save`.',
    ],
    terminalTitle: 'Persistent Browser Stepping',
    terminalBadge: 'SHORT HANDLES',
    terminalLines: [
      '$ verisource browse open http://localhost:3000/pricing',
      '  [e1] link "Monthly"   [e2] button "Annual (Save 20%)"   [e3] a "Start Trial"',
      '$ verisource browse click e2',
      '  delta: [e4] text "$79/mo billed annually" visible · 0 console errors',
    ],
  },
  {
    id: 'agent-skill-installer',
    kicker: '06 · verisource agent --skill --install all',
    title: 'Install a 40-token verification skill into Claude Code, Cursor & Antigravity.',
    body: 'Wires both the local CLI verifier and your Streamable HTTP /mcp endpoint into your coding agent in one command so the agent verifies UI flows, schema, and bot access before finishing.',
    bullets: [
      'Supports claude, cursor, codex, antigravity, or all in a single command.',
      '`verisource workflow check` validates .verisource/workflows/*.json without opening Chrome.',
      'Zero bloated 5,000-token system prompt injections.',
    ],
    terminalTitle: 'Agent Skill & /mcp Provisioner',
    terminalBadge: '~40 TOKENS',
    terminalLines: [
      '$ npx @verisource/cli agent --skill --install all',
      '  ✓ .claude/skills/verisource-verify/SKILL.md',
      '  ✓ .cursor/rules/verisource-verify.mdc',
      '  ✓ .agents/skills/verisource-verify/SKILL.md + Streamable HTTP /mcp wired',
    ],
  },
  {
    id: 'record-and-replay',
    kicker: '07 · verisource record & verisource run',
    title: 'Record manual browser flows once. Replay deterministically with zero AI.',
    body: 'Launch Chrome, click through signup, checkout, or pricing toggles manually, and save clean JSON selectors to .verisource/workflows/<name>.json. Replay anytime in ~1.4 seconds with zero LLM token cost.',
    bullets: [
      'Diffs each run against the last passing baseline (`NEW` console or network regressions).',
      'Captures automatic failure screenshots into .verisource/artifacts/ on error.',
      'Standard CI exit codes: 0 (pass), 1 (verification fail), 2 (configuration/runtime error).',
    ],
    terminalTitle: 'Deterministic Playwright Replay',
    terminalBadge: '24 TOKENS · 0 LLM',
    terminalLines: [
      '$ verisource run checkout-smoke --json',
      '{"workflow":"checkout-smoke","status":"PASS","steps":"8/8","durationMs":1390}',
      'PASS  checkout-smoke · 8/8 steps · 0 JS exceptions · 1.4s (exit 0)',
    ],
  },
  {
    id: 'handle-drilldown',
    kicker: '08 · verisource show <handle> & query',
    title: 'Drill into any incident, network failure, hallucination, or dead link on demand.',
    body: 'Every scan and workflow run indexes compact handles (`h#` hallucination, `b#` bot block, `n#` HTTP request, `l#` link/log, `e#` element) in .verisource/last-run.json for surgical inspection.',
    bullets: [
      'Inspect exact request/response headers, JSON bodies, and DOM diffs for one handle.',
      'Search across recent runs with `verisource query "422"` or `--json` for scripts.',
      'Eliminates scrolling through thousands of lines of raw terminal output.',
    ],
    terminalTitle: 'Handle Drill-Down Inspector',
    terminalBadge: 'JSON READY',
    terminalLines: [
      '$ verisource show n4',
      'handle: n4 · POST /api/checkout -> HTTP 422 (38ms)',
      'request:  {"plan":"pro_99","domain":"acmecloud.io"}',
      'response: {"error":"INVALID_CYCLE","message":"Expected monthly or annual"}',
    ],
  },
];

const FEATURES_FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do I need coding skills to use Verisource?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Non-technical founders, marketers, and agencies use Guided Mode in the Web Console to copy 1 CMS-tailored prompt into ChatGPT, Claude, or Shopify—while engineers and coding agents can also use @verisource/cli and https://mcp.verisource.dev/mcp.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Verisource reduce token usage compared to browser MCP servers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Instead of streaming multi-thousand-token accessibility snapshots on every step, Verisource returns short handles (e4, n3, h1, l2) and deterministic PASS/FAIL diffs—averaging 290 tokens per scan and 24 tokens on saved workflow replays.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where are my Vercel, Supabase, and Cloudflare log tokens stored?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Log provider tokens configured for @verisource/cli stay strictly on your local machine inside .verisource/config.json (auto-ignored by git) and query provider APIs directly from your workstation.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do the 7-day free trial and $19 One-Time Audit Pass work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Monthly Starter ($49/mo) and Pro + MCP ($99/mo) include a $0.00 due today 7-day free trial with 1-click cancellation in Stripe. If you prefer zero recurring billing, the $19 One-Time Audit Pass activates 1 complete domain audit + fix bundle and credits $19 toward Month 1 within 7 days.',
      },
    },
  ],
};

export default function FeaturesPage(): React.ReactElement {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(FEATURES_FAQ_JSON_LD),
        }}
      />

      {/* Hero Header */}
      <section className="vs-sec vs-arch-backdrop">
        <div className="vs-container" style={{ maxWidth: '920px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <span className="vs-kicker">Architecture &amp; Capabilities</span>
            <StatusBadge tone="pass">WEB CONSOLE · CHROME MV3 · CLI · /MCP</StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 4.3vw, 48px)',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.07,
              margin: '0 0 16px 0',
            }}
          >
            Every layer required to win AI search—and verify your site actually works.
          </h1>

          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.64,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 24px 0',
              maxWidth: '66ch',
            }}
          >
            Verisource combines multi-engine citation intelligence, pricing
            hallucination alerts, and 1-click CMS schema fixes with a local-first
            browser &amp; HTTP verification toolkit built for both business teams
            and coding agents.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Link href="/#scan" className="vs-btn">
              Scan Your Site Free →
            </Link>
            <Link href="/pricing" className="vs-btn vs-btn-secondary">
              View Plans &amp; 7-Day Trial →
            </Link>
            <CopyCommandPill command="npx @verisource/cli scan your-site.com" />
          </div>
        </div>
      </section>

      {/* Rows 01..08 Alternating Split-Screen Capabilities */}
      {FEATURE_ROWS.map((row, idx) => (
        <section
          key={row.id}
          id={row.id}
          className={idx % 2 === 0 ? 'vs-sec-alt' : 'vs-sec'}
        >
          <div className="vs-container">
            <div
              className="vs-grid-split"
              style={{ alignItems: 'center', gap: '32px' }}
            >
              <div>
                <div className="vs-kicker" style={{ marginBottom: '8px' }}>
                  {row.kicker}
                </div>
                <h2
                  style={{
                    fontSize: 'clamp(22px, 2.7vw, 30px)',
                    fontWeight: 700,
                    letterSpacing: '-0.028em',
                    margin: '0 0 12px 0',
                  }}
                >
                  {row.title}
                </h2>
                <p
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '14.5px',
                    lineHeight: 1.62,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {row.body}
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '18px',
                    display: 'grid',
                    gap: '8px',
                    fontSize: '13.5px',
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {row.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="vs-terminal-frame">
                <div className="vs-terminal-chrome">
                  <span>{row.terminalTitle}</span>
                  <StatusBadge tone="pass">{row.terminalBadge}</StatusBadge>
                </div>
                <div className="vs-terminal-body">
                  {row.terminalLines.map((line, lineIdx) => (
                    <div
                      key={lineIdx}
                      style={{
                        marginBottom: '6px',
                        color: line.startsWith('$')
                          ? '#EEF1F6'
                          : line.includes('WARN') || line.includes('[h1]') || line.includes('[l1]')
                            ? 'var(--vs-warn-fg)'
                            : 'var(--vs-pass-fg)',
                        fontWeight: line.startsWith('$') ? 600 : 400,
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Row 09 — Backend Log Correlation (Light Browser Toast vs. Server Error Split) */}
      <section id="log-correlation" className="vs-sec-alt">
        <div className="vs-container">
          <div style={{ maxWidth: '720px', marginBottom: '22px' }}>
            <div className="vs-kicker" style={{ marginBottom: '8px' }}>
              09 · verisource log vercel | supabase | cloudflare
            </div>
            <h2
              style={{
                fontSize: 'clamp(23px, 2.8vw, 31px)',
                fontWeight: 700,
                letterSpacing: '-0.028em',
                margin: '0 0 10px 0',
              }}
            >
              Join misleading green UI toasts directly to failing backend logs.
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '14.5px',
                lineHeight: 1.6,
                color: 'var(--vs-ink-secondary)',
              }}
            >
              Scopes Vercel, Supabase, and Cloudflare error queries to the exact
              millisecond window of each browser or crawler run—catching silent{' '}
              <code className="vs-mono">422</code>/<code className="vs-mono">500</code>{' '}
              failures and database constraint errors immediately.
            </p>
          </div>

          <div className="vs-stage-shell">
            <div className="vs-stage-split">
              <LightBrowserFrame
                url="localhost:3000/billing · What the browser showed"
                statusLabel="LOOKS GREEN"
                statusTone="warn"
              >
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '10px',
                  }}
                >
                  ✓ Subscription updated — Invoice INV-2048 queued.
                </div>
                <div style={{ fontSize: '12.5px', color: '#475569' }}>
                  Frontend caught the error and showed an optimistic toast anyway.
                  A screenshot-only agent marks this task complete.
                </div>
              </LightBrowserFrame>

              <div className="vs-terminal-frame">
                <div className="vs-terminal-chrome">
                  <span>What Verisource Correlated in Run Window</span>
                  <StatusBadge tone="critical">JOINED [n2 + g1]</StatusBadge>
                </div>
                <div className="vs-terminal-body">
                  <div style={{ color: 'var(--vs-crit-fg)', marginBottom: '6px' }}>
                    [n2] POST /api/billing/upgrade -&gt; HTTP 500 (84ms)
                  </div>
                  <div style={{ color: 'var(--vs-warn-fg)', marginBottom: '6px' }}>
                    [g1] vercel/runtime: StripeInvalidRequestError: Missing price_id
                  </div>
                  <div style={{ color: 'var(--vs-crit-fg)' }}>
                    [g2] supabase/db: duplicate key violates &quot;profiles_stripe_idx&quot;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Row 10 — Live & Static Route + Schema Graph SVG (verisource map) */}
      <section id="route-mapper" className="vs-sec">
        <div className="vs-container">
          <div
            className="vs-grid-split"
            style={{ alignItems: 'center', gap: '28px' }}
          >
            <div>
              <div className="vs-kicker" style={{ marginBottom: '8px' }}>
                10 · verisource map [url | ./repo]
              </div>
              <h2
                style={{
                  fontSize: 'clamp(23px, 2.8vw, 31px)',
                  fontWeight: 700,
                  letterSpacing: '-0.028em',
                  margin: '0 0 12px 0',
                }}
              >
                Map live site routes, JSON-LD graphs, and Next.js/React endpoints.
              </h2>
              <p
                style={{
                  margin: '0 0 14px 0',
                  fontSize: '14.5px',
                  lineHeight: 1.62,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Point <code className="vs-mono">verisource map</code> at a live
                URL for read-only route discovery, or run it inside a Next.js App
                Router / React repository to map pages, structured schema blocks,
                client <code className="vs-mono">fetch()</code> triggers, and API
                route handlers.
              </p>
              <CopyCommandPill command="npx @verisource/cli map ./apps/web --json" />
            </div>

            <div className="vs-bezel">
              <div
                className="vs-card"
                style={{ padding: '16px', background: '#FFFFFF' }}
              >
                <svg
                  viewBox="0 0 480 210"
                  width="100%"
                  role="img"
                  aria-label="Route and schema architecture map linking /pricing, /compare, and /agents.md to JSON-LD emitters and backend API routes."
                >
                  <rect width="480" height="210" rx="8" fill="#FAF9F6" />
                  <g transform="translate(16, 18)">
                    <rect width="132" height="44" rx="6" fill="#0E1116" />
                    <text x="12" y="19" fill="#E5A93C" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      ROUTE: /pricing
                    </text>
                    <text x="12" y="34" fill="#EEF1F6" fontSize="8.8" fontFamily="var(--vs-mono)">
                      OfferCatalog + FAQPage
                    </text>
                  </g>
                  <g transform="translate(16, 82)">
                    <rect width="132" height="44" rx="6" fill="#0E1116" />
                    <text x="12" y="19" fill="#E5A93C" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      ROUTE: /compare/*
                    </text>
                    <text x="12" y="34" fill="#EEF1F6" fontSize="8.8" fontFamily="var(--vs-mono)">
                      SSR &lt;table&gt; + JSON-LD
                    </text>
                  </g>
                  <g transform="translate(16, 146)">
                    <rect width="132" height="44" rx="6" fill="#0E1116" />
                    <text x="12" y="19" fill="#6EE7B7" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      SPEC: /agents.md
                    </text>
                    <text x="12" y="34" fill="#EEF1F6" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Brand Truth Guardrails
                    </text>
                  </g>

                  <path d="M 148 40 L 296 62" stroke="#0E1116" strokeWidth="1.8" fill="none" />
                  <path d="M 148 104 L 296 104" stroke="#059669" strokeWidth="1.8" fill="none" />
                  <path d="M 148 168 L 296 146" stroke="#059669" strokeWidth="1.8" fill="none" />

                  <g transform="translate(296, 42)">
                    <rect width="168" height="46" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="12" y="20" fill="#065F46" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      POST /api/checkout
                    </text>
                    <text x="12" y="35" fill="#334155" fontSize="8.5" fontFamily="var(--vs-mono)">
                      Verified 200 · Stripe HMAC
                    </text>
                  </g>
                  <g transform="translate(296, 122)">
                    <rect width="168" height="46" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="12" y="20" fill="#065F46" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      POST /mcp (Streamable)
                    </text>
                    <text x="12" y="35" fill="#334155" fontSize="8.5" fontFamily="var(--vs-mono)">
                      GPTBot &amp; Agent Ready
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Row 11 — Agency White-Label, Paid /mcp & Local-First Privacy Architecture */}
      <section id="privacy-architecture" className="vs-sec-alt">
        <div className="vs-container">
          <div
            className="vs-grid-split"
            style={{ alignItems: 'center', gap: '28px' }}
          >
            <div>
              <div className="vs-kicker" style={{ marginBottom: '8px' }}>
                11 · Agency White-Label, /mcp &amp; Local-First Security
              </div>
              <h2
                style={{
                  fontSize: 'clamp(23px, 2.8vw, 31px)',
                  fontWeight: 700,
                  letterSpacing: '-0.028em',
                  margin: '0 0 12px 0',
                }}
              >
                Branded client pitch scorecards in the cloud. Private tokens on your machine.
              </h2>
              <p
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '14.5px',
                  lineHeight: 1.62,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Agencies mint white-label{' '}
                <code className="vs-mono">verisource.dev/audit/[slug]</code>{' '}
                reports with custom logos, colors, print-ready PDF scorecards,
                and real-time open/CTA alerts—while CLI workflows, browser
                cookies, and <code className="vs-mono">.verisource/config.json</code>{' '}
                log tokens never leave your workstation.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <Link href="/agencies#sandbox" className="vs-btn">
                  Try Agency White-Label Sandbox →
                </Link>
                <Link href="/scanner" className="vs-btn vs-btn-secondary">
                  Read VerisourceScan Spec →
                </Link>
              </div>
            </div>

            <div className="vs-card" style={{ padding: '20px 22px' }}>
              <div className="vs-eyebrow" style={{ marginBottom: '10px' }}>
                LOCAL-FIRST BOUNDARY (.VERISOURCE/)
              </div>
              <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                <div
                  style={{
                    padding: '11px 13px',
                    borderRadius: '8px',
                    background: 'var(--vs-terminal)',
                    border: '1px solid var(--vs-pass-border)',
                  }}
                >
                  <strong style={{ color: 'var(--vs-pass-fg)' }}>
                    Stays on Your Machine:
                  </strong>{' '}
                  <span style={{ color: 'var(--vs-ink-secondary)' }}>
                    <code className="vs-mono">.verisource/workflows/*.json</code>,
                    failure screenshots, browser user-data-dir cookies, and
                    Vercel/Supabase/Cloudflare log API keys.
                  </span>
                </div>
                <div
                  style={{
                    padding: '11px 13px',
                    borderRadius: '8px',
                    background: 'var(--vs-surface-subtle)',
                    border: '1px solid var(--vs-border)',
                  }}
                >
                  <strong style={{ color: 'var(--vs-accent)' }}>
                    Synced Only When Requested:
                  </strong>{' '}
                  <span style={{ color: 'var(--vs-ink-secondary)' }}>
                    Public domain GEO readiness, weekly multi-engine citation
                    snapshots, SHA-256 <code className="vs-mono">vs_live_</code>{' '}
                    <code className="vs-mono">/mcp</code> credit metering, and
                    white-label <code className="vs-mono">/audit/[slug]</code>{' '}
                    client links.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Technical & Commercial FAQ Accordion */}
      <section className="vs-sec" style={{ borderBottom: 'none' }}>
        <div className="vs-container" style={{ maxWidth: '880px' }}>
          <div className="vs-kicker" style={{ marginBottom: '8px' }}>
            Frequently Asked Questions
          </div>
          <h2
            style={{
              fontSize: 'clamp(24px, 2.8vw, 32px)',
              fontWeight: 700,
              letterSpacing: '-0.028em',
              margin: '0 0 20px 0',
            }}
          >
            Technical &amp; billing specifics
          </h2>

          <div className="vs-stack" style={{ gap: '12px' }}>
            {[
              {
                q: 'Do I need coding skills to use Verisource?',
                a: 'No. Non-technical business owners, marketers, and agencies use Console Guided Mode to copy one CMS-tailored prompt into ChatGPT, Claude, or Shopify—or install our drop-in WordPress/Shopify bridges on /connectors. Developers and coding agents get full @verisource/cli and Streamable HTTP /mcp access.',
              },
              {
                q: 'How is @verisource/cli different from generic Playwright MCP servers?',
                a: 'Full-snapshot browser MCP servers inject 25+ tool schemas upfront and return thousands of DOM tokens per click. Verisource returns compact short handles (e4, n3, h1, l2) and replays saved .verisource/workflows/*.json deterministically in ~24 tokens with zero LLM calls.',
              },
              {
                q: 'Does the site health scanner obey /robots.txt?',
                a: 'Yes. VerisourceScan/1.0 fetches /robots.txt first, respects Disallow and Crawl-delay directives, sends only read-only GET and HEAD requests, and blocks private/internal IPs on every redirect hop.',
              },
              {
                q: 'Which CMS platforms are auto-detected for 1-click fixes?',
                a: 'Shopify (including /api/ucp/mcp and agents.md.liquid), WordPress, Webflow, Wix, Squarespace, Framer, and custom Next.js / React codebases.',
              },
              {
                q: 'Where do Vercel, Supabase, and Cloudflare log tokens live?',
                a: 'Strictly inside .verisource/config.json on your own machine (0600 permissions, git-ignored). CLI log correlation queries your provider APIs directly from your computer.',
              },
              {
                q: 'How does the $19 One-Time Audit Pass compare to the 7-day free trial?',
                a: 'Monthly Starter ($49/mo) and Pro + MCP ($99/mo) include a $0.00 due today 7-day trial with 1-click cancellation. Buyers who want zero recurring billing can purchase the $19 One-Time Audit Pass—and if they upgrade within 7 days, the full $19 credits toward Month 1.',
              },
            ].map((item) => (
              <details key={item.q} className="vs-disclosure">
                <summary className="vs-disclosure-summary">
                  <strong style={{ fontSize: '14.5px' }}>{item.q}</strong>
                  <span className="vs-disclosure-pill">Answer</span>
                </summary>
                <div
                  className="vs-disclosure-body"
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.62,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
