'use client';

import React, { useEffect, useState } from 'react';
import {
  CopyCommandPill,
  LightBrowserFrame,
  StatusBadge,
} from '@verisource/ui';

type ScenarioId = 'geo_truth' | 'flow_logs';

interface StageStep {
  narration: string;
  browserUrl: string;
  browserStatus: string;
  browserTone: 'pass' | 'warn' | 'critical' | 'neutral';
  browserHeadline: string;
  browserDetail: string;
  browserMetaRows: Array<{
    label: string;
    value: string;
    tone: 'pass' | 'warn' | 'crit';
  }>;
  terminalLines: Array<{
    prefix?: string;
    text: string;
    tone?: 'cmd' | 'pass' | 'crit' | 'warn' | 'dim';
  }>;
}

const SCENARIOS: Record<
  ScenarioId,
  {
    tabLabel: string;
    installCmd: string;
    steps: StageStep[];
  }
> = {
  geo_truth: {
    tabLabel: '1 · Fix AI Search & Wrong Prices',
    installCmd: 'npx @verisource/cli scan your-site.com',
    steps: [
      {
        narration:
          'Step 1/4 — Verisource scans how ChatGPT & Perplexity answer buyer questions and crawls your public pages.',
        browserUrl: 'chatgpt.com · "Best B2B data sync tool under $50/mo"',
        browserStatus: 'HALLUCINATION [h1]',
        browserTone: 'critical',
        browserHeadline:
          'AI quotes a discontinued $19/mo plan and cites two competitors instead.',
        browserDetail:
          'Root cause on northstarcloud.io: /agents.md is missing, FAQPage JSON-LD is absent, and /pricing#annual has no matching id target.',
        browserMetaRows: [
          {
            label: '[h1] Claimed Price vs. Truth',
            value: '$19/mo stated (True starter: $39/mo)',
            tone: 'crit',
          },
          {
            label: '[b1] /agents.md & /llms.txt',
            value: '404 Not Found on origin',
            tone: 'warn',
          },
          {
            label: '[a1] Broken Anchor on /pricing',
            value: '#annual -> missing target id',
            tone: 'warn',
          },
        ],
        terminalLines: [
          {
            prefix: '$',
            text: 'verisource scan northstarcloud.io',
            tone: 'cmd',
          },
          {
            text: 'WARN  54/100 visibility · 3 findings (290 tokens):',
            tone: 'warn',
          },
          {
            text: '  [h1] ChatGPT states "$19/mo" vs verified "$39/mo Starter"',
            tone: 'crit',
          },
          {
            text: '  [b1] /agents.md (404) & FAQPage JSON-LD (0 nodes)',
            tone: 'warn',
          },
          {
            text: '  [a1] /pricing -> #annual dead fragment target',
            tone: 'warn',
          },
        ],
      },
      {
        narration:
          'Step 2/4 — Your coding agent (or 1-Click CMS Prompt) pulls only the compact handle details it needs.',
        browserUrl: 'northstarcloud.io/pricing',
        browserStatus: 'INSPECTING [h1, b1]',
        browserTone: 'warn',
        browserHeadline:
          'Agent inspects [h1] & [b1] without dumping 4,500 tokens of raw HTML.',
        browserDetail:
          'Verisource returns syntax-validated Organization + OfferCatalog + FAQPage JSON-LD and a truth-locked /agents.md file.',
        browserMetaRows: [
          {
            label: 'Detected Stack',
            value: 'Next.js App Router (SSR)',
            tone: 'pass',
          },
          {
            label: 'GPTBot & PerplexityBot WAF',
            value: 'HTTP 200 Allowed',
            tone: 'pass',
          },
          {
            label: 'Generated Fix Payload',
            value: 'JSON-LD + /agents.md + /llms.txt ready',
            tone: 'pass',
          },
        ],
        terminalLines: [
          {
            prefix: '$',
            text: 'verisource show h1 --fix',
            tone: 'cmd',
          },
          {
            text: 'handle: h1 (pricing_conflict · high)',
            tone: 'dim',
          },
          {
            text: 'truth:  Starter $39/mo · Pro $99/mo · Free 14-day trial',
            tone: 'pass',
          },
          {
            text: 'write:  public/agents.md, public/llms.txt, app/layout.tsx',
            tone: 'dim',
          },
          {
            text: 'patch:  app/pricing/page.tsx (added id="annual")',
            tone: 'pass',
          },
        ],
      },
      {
        narration:
          'Step 3/4 — Agent applies the schema, /agents.md rulebook, and anchor fix, then triggers live verification.',
        browserUrl: 'northstarcloud.io/agents.md',
        browserStatus: 'DEPLOYED · HTTP 200',
        browserTone: 'pass',
        browserHeadline:
          'Machine-readable pricing guardrails & 3-pillar JSON-LD are live.',
        browserDetail:
          'Verisource re-probes /robots.txt, GPTBot/PerplexityBot HTTP responses, JSON-LD @graph nodes, and all internal links.',
        browserMetaRows: [
          {
            label: '3-Pillar JSON-LD Graph',
            value: 'Organization · OfferCatalog · FAQPage',
            tone: 'pass',
          },
          {
            label: '/agents.md & /llms.txt',
            value: '200 OK (custom_enriched)',
            tone: 'pass',
          },
          {
            label: 'Multi-Page Link & Anchor Crawl',
            value: '12/12 pages · 0 dead anchors',
            tone: 'pass',
          },
        ],
        terminalLines: [
          {
            prefix: '$',
            text: 'verisource verify northstarcloud.io',
            tone: 'cmd',
          },
          {
            text: '  ✓ GPTBot / PerplexityBot / ClaudeBot   HTTP 200',
            tone: 'pass',
          },
          {
            text: '  ✓ /agents.md & /llms.txt               custom_enriched',
            tone: 'pass',
          },
          {
            text: '  ✓ JSON-LD (Entity + Offer + FAQPage)   4 valid nodes',
            tone: 'pass',
          },
          {
            text: '  ✓ Multi-page links & #annual anchor    0 errors',
            tone: 'pass',
          },
        ],
      },
      {
        narration:
          'Step 4/4 — Deterministic PASS: AI engines read verified $39/mo pricing and cite your domain directly.',
        browserUrl: 'perplexity.ai · "Best B2B data sync tool under $50/mo"',
        browserStatus: 'PASS · CITED #1',
        browserTone: 'pass',
        browserHeadline:
          'Northstar Cloud recommended #1 with verified $39/mo pricing.',
        browserDetail:
          'Saved to .verisource/checks.json so CI/CD blocks any future PR that breaks schema, bot access, or pricing facts.',
        browserMetaRows: [
          {
            label: 'AI Visibility Score',
            value: '54 -> 93 / 100 (+39 pts)',
            tone: 'pass',
          },
          {
            label: 'Pricing Hallucinations',
            value: '0 conflicts detected',
            tone: 'pass',
          },
          {
            label: 'CI Regression Check',
            value: 'exit 0 · 1.2s deterministic',
            tone: 'pass',
          },
        ],
        terminalLines: [
          {
            prefix: '$',
            text: 'verisource verify northstarcloud.io --json',
            tone: 'cmd',
          },
          {
            text: '{"status":"PASS","checks":"6/6","visibility":93,"durationMs":1180}',
            tone: 'pass',
          },
          {
            text: 'PASS  northstarcloud.io · 6/6 checks passed in 1.2s (exit 0)',
            tone: 'pass',
          },
        ],
      },
    ],
  },
  flow_logs: {
    tabLabel: '2 · Verify Browser Flow & Backend Logs',
    installCmd: 'npx @verisource/cli agent --skill --install all',
    steps: [
      {
        narration:
          'Step 1/4 — Your coding agent finishes a checkout feature. The UI toast looks green, so a naive agent stops.',
        browserUrl: 'localhost:3000/checkout?plan=pro',
        browserStatus: 'FALSE GREEN UI',
        browserTone: 'warn',
        browserHeadline:
          'UI banner says "Workspace trial started!"—but the database write failed.',
        browserDetail:
          'Without real-browser network + backend log correlation, silent 422/500 API rejections slip straight into production.',
        browserMetaRows: [
          {
            label: 'Visible Browser Toast',
            value: '"Workspace trial started!" ( misleading )',
            tone: 'warn',
          },
          {
            label: '[n3] Background Fetch',
            value: 'POST /api/checkout/trial -> HTTP 422',
            tone: 'crit',
          },
          {
            label: '[g1] Vercel / Supabase Log',
            value: 'null value in column "billing_cycle"',
            tone: 'crit',
          },
        ],
        terminalLines: [
          {
            prefix: '$',
            text: 'verisource run trial-checkout',
            tone: 'cmd',
          },
          {
            text: 'FAIL  trial-checkout · step 5/6 failed (1.6s)',
            tone: 'crit',
          },
          {
            text: '  [n3] POST /api/checkout/trial -> 422 Unprocessable Entity',
            tone: 'crit',
          },
          {
            text: '  [g1] supabase/postgres: null value in column "billing_cycle"',
            tone: 'crit',
          },
          {
            text: '  hint: run `verisource show n3` for payload & stacktrace',
            tone: 'dim',
          },
        ],
      },
      {
        narration:
          'Step 2/4 — Agent drills into handle [n3] & [g1] in 1 call instead of guessing from screenshots.',
        browserUrl: 'localhost:3000/checkout?plan=pro',
        browserStatus: 'HANDLE DIFF [n3, g1]',
        browserTone: 'critical',
        browserHeadline:
          'Exact failing request body joined to the matching server timestamp.',
        browserDetail:
          'Log tokens stay local in .verisource/config.json and query Vercel, Supabase, or Cloudflare directly from your machine.',
        browserMetaRows: [
          {
            label: 'Request Payload [n3]',
            value: '{"plan":"pro_99"} (missing cycle)',
            tone: 'crit',
          },
          {
            label: 'Correlated Window',
            value: '14:08:11.200Z -> 14:08:12.840Z',
            tone: 'warn',
          },
          {
            label: 'Tokens Sent to Agent',
            value: '82 tokens (exact diff only)',
            tone: 'pass',
          },
        ],
        terminalLines: [
          {
            prefix: '$',
            text: 'verisource show n3',
            tone: 'cmd',
          },
          {
            text: 'POST http://localhost:3000/api/checkout/trial -> 422 (41ms)',
            tone: 'crit',
          },
          {
            text: 'req:  {"plan":"pro_99"}',
            tone: 'dim',
          },
          {
            text: 'res:  {"error":"MISSING_BILLING_CYCLE"}',
            tone: 'warn',
          },
          {
            text: 'log [g1]: app/api/checkout/trial/route.ts:48 constraint fail',
            tone: 'crit',
          },
        ],
      },
      {
        narration:
          'Step 3/4 — Agent patches the route handler and replays the saved deterministic browser workflow.',
        browserUrl: 'localhost:3000/dashboard?trial=active',
        browserStatus: 'REPLAYING 6/6',
        browserTone: 'pass',
        browserHeadline:
          'Zero-AI Playwright replay clicks through all 6 steps using saved selectors.',
        browserDetail:
          'Once a flow is saved in .verisource/workflows/trial-checkout.json, replaying it uses zero LLM calls and 24 output tokens.',
        browserMetaRows: [
          {
            label: 'POST /api/checkout/trial',
            value: 'HTTP 200 OK (row committed)',
            tone: 'pass',
          },
          {
            label: 'Console / Uncaught JS Errors',
            value: '0 exceptions',
            tone: 'pass',
          },
          {
            label: 'Vercel + Supabase Error Logs',
            value: '0 errors in run window',
            tone: 'pass',
          },
        ],
        terminalLines: [
          {
            prefix: '$',
            text: 'verisource run trial-checkout',
            tone: 'cmd',
          },
          {
            text: '  step 1..4  open /pricing -> click [e4] Start Trial   OK',
            tone: 'dim',
          },
          {
            text: '  step 5     POST /api/checkout/trial -> 200 OK        OK',
            tone: 'pass',
          },
          {
            text: '  step 6     redirect /dashboard?trial=active          OK',
            tone: 'pass',
          },
          {
            text: 'PASS  trial-checkout · 6/6 steps · 0 log errors · 1.4s',
            tone: 'pass',
          },
        ],
      },
      {
        narration:
          'Step 4/4 — Both user flow and public AI readiness pass in one unified pre-deploy gate.',
        browserUrl: 'localhost:3000/dashboard?trial=active',
        browserStatus: 'PASS · 24 TOKENS',
        browserTone: 'pass',
        browserHeadline:
          'Verified in a real browser with backend log proof before your agent says "done."',
        browserDetail:
          'Works locally in Claude Code, Cursor, Codex, and Antigravity—and runs headlessly in GitHub Actions CI.',
        browserMetaRows: [
          {
            label: 'Workflow Status',
            value: 'PASS (6/6 steps · 1.4s)',
            tone: 'pass',
          },
          {
            label: 'Agent Context Overhead',
            value: '24 tokens returned',
            tone: 'pass',
          },
          {
            label: 'Local-First Privacy',
            value: 'Flows & log keys stay on disk',
            tone: 'pass',
          },
        ],
        terminalLines: [
          {
            prefix: '$',
            text: 'verisource run --all',
            tone: 'cmd',
          },
          {
            text: 'PASS  trial-checkout     6/6 steps   1.4s',
            tone: 'pass',
          },
          {
            text: 'PASS  pricing-ai-schema  4/4 checks  0.5s',
            tone: 'pass',
          },
          {
            text: 'Done: 2/2 workflows passed · 0 backend log errors (exit 0)',
            tone: 'pass',
          },
        ],
      },
    ],
  },
};

export function AgentSplitPlayground(): React.ReactElement {
  const [scenario, setScenario] = useState<ScenarioId>('geo_truth');
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  const activeScenario = SCENARIOS[scenario];
  const currentStep =
    activeScenario.steps[stepIdx] ?? activeScenario.steps[0]!;

  useEffect(() => {
    if (!autoPlay) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const timer = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % activeScenario.steps.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [autoPlay, activeScenario.steps.length]);

  const selectScenario = (next: ScenarioId) => {
    setScenario(next);
    setStepIdx(0);
  };

  return (
    <div className="vs-stage-shell">
      <div className="vs-stage-toolbar">
        <div className="vs-pill-group" role="tablist" aria-label="Verification scenario">
          {(Object.keys(SCENARIOS) as ScenarioId[]).map((key) => {
            const active = scenario === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                data-active={active ? 'true' : 'false'}
                className="vs-pill-btn"
                onClick={() => selectScenario(key)}
              >
                {SCENARIOS[key].tabLabel}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {activeScenario.steps.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setStepIdx(idx);
                setAutoPlay(false);
              }}
              className="vs-pill-btn vs-pill-btn-sm vs-mono"
              data-active={stepIdx === idx ? 'true' : 'false'}
              aria-label={`Jump to step ${idx + 1}`}
            >
              {`0${idx + 1}`}
            </button>
          ))}
          <button
            type="button"
            className="vs-pill-btn vs-pill-btn-sm"
            onClick={() => setStepIdx(0)}
          >
            ↻ Restart
          </button>
          <button
            type="button"
            className="vs-pill-btn vs-pill-btn-sm"
            onClick={() => setAutoPlay((prev) => !prev)}
          >
            {autoPlay ? '❚❚ Pause' : '▶ Auto-play'}
          </button>
        </div>
      </div>

      <div className="vs-stage-narration">
        <div>
          <strong
            className="vs-mono"
            style={{
              color: 'var(--vs-accent)',
              fontSize: '11.5px',
              marginRight: '8px',
            }}
          >
            WHAT VERISOURCE IS DOING:
          </strong>
          <span>{currentStep.narration}</span>
        </div>
        <CopyCommandPill command={activeScenario.installCmd} />
      </div>

      <div className="vs-stage-split">
        <LightBrowserFrame
          url={currentStep.browserUrl}
          statusLabel={currentStep.browserStatus}
          statusTone={currentStep.browserTone}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#0F172A',
                  lineHeight: 1.35,
                  marginBottom: '5px',
                }}
              >
                {currentStep.browserHeadline}
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  color: '#475569',
                  lineHeight: 1.5,
                }}
              >
                {currentStep.browserDetail}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gap: '7px',
                paddingTop: '10px',
                borderTop: '1px solid #E2E8F0',
              }}
            >
              {currentStep.browserMetaRows.map((row) => {
                const badgePalette =
                  row.tone === 'pass'
                    ? { bg: '#ECFDF5', fg: '#065F46', border: '#A7F3D0' }
                    : row.tone === 'crit'
                      ? { bg: '#FEF2F2', fg: '#991B1B', border: '#FECACA' }
                      : { bg: '#FFFBEB', fg: '#92400E', border: '#FDE68A' };
                return (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px 10px',
                      padding: '7px 10px',
                      borderRadius: '7px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  >
                    <span
                      className="vs-mono"
                      style={{ color: '#334155', fontWeight: 600 }}
                    >
                      {row.label}
                    </span>
                    <span
                      className="vs-mono"
                      style={{
                        padding: '2px 7px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: badgePalette.bg,
                        color: badgePalette.fg,
                        border: `1px solid ${badgePalette.border}`,
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </LightBrowserFrame>

        <div className="vs-terminal-frame">
          <div className="vs-terminal-chrome">
            <span>Coding Agent · Claude Code / Cursor / Antigravity</span>
            <StatusBadge tone="pass">COMPACT HANDLES</StatusBadge>
          </div>
          <div className="vs-terminal-body">
            {currentStep.terminalLines.map((line, i) => {
              const color =
                line.tone === 'cmd'
                  ? '#EEF1F6'
                  : line.tone === 'pass'
                    ? 'var(--vs-pass-fg)'
                    : line.tone === 'crit'
                      ? 'var(--vs-crit-fg)'
                      : line.tone === 'warn'
                        ? 'var(--vs-warn-fg)'
                        : 'var(--vs-ink-muted)';
              return (
                <div
                  key={i}
                  style={{
                    color,
                    marginBottom: '6px',
                    fontWeight: line.tone === 'cmd' ? 600 : 400,
                  }}
                >
                  {line.prefix ? (
                    <span
                      style={{
                        color: 'var(--vs-accent)',
                        marginRight: '8px',
                        userSelect: 'none',
                      }}
                    >
                      {line.prefix}
                    </span>
                  ) : null}
                  {line.text}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
