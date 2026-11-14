// Editorial Linear / Stripe / Vercel Design System CSS Tokens & Layout Rules
// Shared identically across apps/web (Next.js 15) and apps/extension (WXT MV3 Side Panel).

export const EDITORIAL_CSS = `
:root {
  --vs-canvas: #F8FAFC;
  --vs-surface: #FFFFFF;
  --vs-surface-subtle: #F1F5F9;
  --vs-terminal: #0B1120;
  --vs-ink: #0F172A;
  --vs-ink-secondary: #334155;
  --vs-ink-muted: #64748B;
  --vs-border: #E2E8F0;
  --vs-border-strong: #CBD5E1;
  --vs-accent: #0F172A;
  --vs-accent-hover: #1E293B;
  --vs-pass-fg: #047857;
  --vs-pass-bg: #ECFDF5;
  --vs-pass-border: #A7F3D0;
  --vs-warn-fg: #B45309;
  --vs-warn-bg: #FFFBEB;
  --vs-warn-border: #FDE68A;
  --vs-crit-fg: #B91C1C;
  --vs-crit-bg: #FEF2F2;
  --vs-crit-border: #FECACA;
  --vs-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --vs-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--vs-canvas);
  color: var(--vs-ink);
  font-family: var(--vs-sans);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

.vs-mono {
  font-family: var(--vs-mono);
  font-variant-numeric: tabular-nums;
}

.vs-tabular {
  font-variant-numeric: tabular-nums;
}

.vs-container {
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 24px;
}

.vs-card {
  background: var(--vs-surface);
  border: 1px solid var(--vs-border);
  border-radius: 6px;
}

.vs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--vs-sans);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1;
  padding: 10px 16px;
  border-radius: 5px;
  border: 1px solid var(--vs-accent);
  background: var(--vs-accent);
  color: #FFFFFF;
  cursor: pointer;
  text-decoration: none;
  transition: background 120ms ease, border-color 120ms ease;
}

.vs-btn:hover:not(:disabled) {
  background: var(--vs-accent-hover);
}

.vs-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.vs-btn-secondary {
  background: var(--vs-surface);
  color: var(--vs-ink);
  border: 1px solid var(--vs-border-strong);
}

.vs-btn-secondary:hover:not(:disabled) {
  background: var(--vs-surface-subtle);
}

.vs-input {
  width: 100%;
  font-family: var(--vs-mono);
  font-size: 13.5px;
  padding: 10px 12px;
  border: 1px solid var(--vs-border-strong);
  border-radius: 5px;
  background: var(--vs-surface);
  color: var(--vs-ink);
  outline: none;
}

.vs-input:focus {
  border-color: var(--vs-ink);
}

.vs-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--vs-mono);
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--vs-border);
  background: var(--vs-surface-subtle);
  color: var(--vs-ink-secondary);
  white-space: nowrap;
}

.vs-badge-pass {
  color: var(--vs-pass-fg);
  background: var(--vs-pass-bg);
  border-color: var(--vs-pass-border);
}

.vs-badge-warn {
  color: var(--vs-warn-fg);
  background: var(--vs-warn-bg);
  border-color: var(--vs-warn-border);
}

.vs-badge-critical {
  color: var(--vs-crit-fg);
  background: var(--vs-crit-bg);
  border-color: var(--vs-crit-border);
}

.vs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.vs-table th {
  text-align: left;
  font-family: var(--vs-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vs-ink-muted);
  padding: 10px 14px;
  border-bottom: 1px solid var(--vs-border);
  background: var(--vs-surface-subtle);
}

.vs-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--vs-border);
  vertical-align: top;
}

.vs-table tr:last-child td {
  border-bottom: none;
}

.vs-tabs-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--vs-border);
  background: var(--vs-surface-subtle);
}

.vs-tab-trigger {
  appearance: none;
  background: transparent;
  border: none;
  border-right: 1px solid var(--vs-border);
  border-bottom: 2px solid transparent;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  color: var(--vs-ink-muted);
  font-family: var(--vs-sans);
  transition: background 120ms ease, color 120ms ease;
}

.vs-tab-trigger:last-child {
  border-right: none;
}

.vs-tab-trigger:hover {
  color: var(--vs-ink);
  background: rgba(255, 255, 255, 0.6);
}

.vs-tab-trigger[data-active="true"] {
  background: var(--vs-surface);
  color: var(--vs-ink);
  border-bottom-color: var(--vs-ink);
}

.vs-code-block {
  background: var(--vs-terminal);
  color: #E2E8F0;
  font-family: var(--vs-mono);
  font-size: 12.5px;
  line-height: 1.55;
  padding: 14px 16px;
  margin: 0;
  overflow-x: auto;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}

.vs-blur-token {
  filter: blur(4px);
  user-select: none;
  pointer-events: none;
  display: inline-block;
}
`;
