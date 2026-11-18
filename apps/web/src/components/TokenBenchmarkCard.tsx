import React from 'react';
import { StatusBadge } from '@verisource/ui';

interface BenchmarkRow {
  label: string;
  sublabel: string;
  tokens: string;
  calls: string;
  duration: string;
  barPct: number;
  barColor: string;
  highlight?: boolean;
}

const ROWS: readonly BenchmarkRow[] = [
  {
    label: 'Full-DOM Browser Snapshot MCP',
    sublabel: '25+ upfront tool schemas + full accessibility tree dumps',
    tokens: '4,680 tokens',
    calls: '16 calls',
    duration: '5.4 s',
    barPct: 100,
    barColor: '#475569',
  },
  {
    label: 'verisource scan / mcp',
    sublabel: 'Short handles ([h1], [b1], [l2]) + Brand Truth & 3-pillar schema diff',
    tokens: '290 tokens',
    calls: '2 calls',
    duration: '1.8 s',
    barPct: 14,
    barColor: 'var(--vs-accent)',
    highlight: true,
  },
  {
    label: 'verisource run (saved workflow)',
    sublabel: 'Deterministic zero-AI replay of .verisource/workflows/*.json',
    tokens: '24 tokens',
    calls: '1 call',
    duration: '1.4 s',
    barPct: 4,
    barColor: 'var(--vs-pass-fg)',
    highlight: true,
  },
];

export function TokenBenchmarkCard(): React.ReactElement {
  return (
    <div className="vs-bezel">
      <div className="vs-card" style={{ padding: '22px 24px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            marginBottom: '18px',
          }}
        >
          <div>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              CONTEXT OVERHEAD BENCHMARK · 10-STEP PRICING &amp; CHECKOUT CHECK
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Return PASS, FAIL, and the exact handle—not 4,600 tokens of DOM noise.
            </h3>
          </div>
          <StatusBadge tone="pass">94%–99% LOWER CONTEXT COST</StatusBadge>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          {ROWS.map((row) => (
            <div
              key={row.label}
              style={{
                padding: '13px 15px',
                borderRadius: '9px',
                background: row.highlight
                  ? 'var(--vs-surface-subtle)'
                  : 'var(--vs-terminal)',
                border: row.highlight
                  ? '1px solid var(--vs-border-strong)'
                  : '1px solid var(--vs-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '8px 16px',
                  marginBottom: '8px',
                }}
              >
                <div>
                  <strong
                    className="vs-mono"
                    style={{
                      fontSize: '13px',
                      color: row.highlight
                        ? 'var(--vs-ink)'
                        : 'var(--vs-ink-secondary)',
                    }}
                  >
                    {row.label}
                  </strong>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--vs-ink-muted)',
                      marginLeft: '10px',
                    }}
                  >
                    {row.sublabel}
                  </span>
                </div>

                <div
                  className="vs-mono"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '14px',
                    fontSize: '12.5px',
                  }}
                >
                  <strong
                    style={{
                      color: row.highlight
                        ? 'var(--vs-accent)'
                        : 'var(--vs-ink-secondary)',
                    }}
                  >
                    {row.tokens}
                  </strong>
                  <span style={{ color: 'var(--vs-ink-secondary)' }}>
                    {row.calls}
                  </span>
                  <span style={{ color: 'var(--vs-ink-muted)' }}>
                    {row.duration}
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '999px',
                  background: '#0B0E14',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${row.barPct}%`,
                    height: '100%',
                    borderRadius: '999px',
                    background: row.barColor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="vs-mono"
          style={{
            marginTop: '14px',
            fontSize: '11.5px',
            color: 'var(--vs-ink-muted)',
          }}
        >
          Methodology: UTF-8 payload bytes ÷ 4 across a 10-step SaaS pricing,
          schema, and checkout verification flow. Saved workflows replay locally
          via Playwright with zero LLM calls.
        </div>
      </div>
    </div>
  );
}
