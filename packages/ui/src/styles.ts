// Warm Architectural Paper & Obsidian Ink Design System (Anthropic / Stripe Press Standard)
// Shared identically across apps/web (Next.js 15) and apps/extension (WXT MV3 Side Panel).

export const EDITORIAL_CSS = `
:root {
  --vs-canvas: #FAF9F6;
  --vs-surface: #FFFFFF;
  --vs-surface-subtle: #F3F1EC;
  --vs-surface-warm: #F7F5EF;
  --vs-terminal: #0A0E17;
  --vs-ink: #0A0E17;
  --vs-ink-secondary: #3A3F4B;
  --vs-ink-muted: #686D78;
  --vs-border: #E5E2DA;
  --vs-border-strong: #CFCBC0;
  --vs-accent: #0A0E17;
  --vs-accent-hover: #1E2433;
  --vs-pass-fg: #065F46;
  --vs-pass-bg: #ECFDF5;
  --vs-pass-border: #A7F3D0;
  --vs-warn-fg: #92400E;
  --vs-warn-bg: #FFFBEB;
  --vs-warn-border: #FDE68A;
  --vs-crit-fg: #991B1B;
  --vs-crit-bg: #FEF2F2;
  --vs-crit-border: #FECACA;
  --vs-sans: var(--font-vs-sans, 'Plus Jakarta Sans'), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --vs-serif: var(--font-vs-serif, 'Instrument Serif'), Georgia, 'Times New Roman', serif;
  --vs-mono: var(--font-vs-mono, 'JetBrains Mono'), 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--vs-canvas);
  color: var(--vs-ink);
  font-family: var(--vs-sans);
  font-size: 15px;
  line-height: 1.58;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.vs-mono {
  font-family: var(--vs-mono);
  font-variant-numeric: tabular-nums;
}

.vs-display-serif {
  font-family: var(--vs-serif);
  font-weight: 400;
  font-style: italic;
  letter-spacing: -0.01em;
}

.vs-tabular {
  font-variant-numeric: tabular-nums;
}

.vs-eyebrow {
  font-family: var(--vs-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--vs-ink-muted);
}

.vs-container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}

.vs-arch-backdrop {
  background-color: var(--vs-canvas);
  background-image:
    linear-gradient(to right, rgba(10, 14, 23, 0.038) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(10, 14, 23, 0.038) 1px, transparent 1px);
  background-size: 36px 36px;
}

.vs-card {
  background: var(--vs-surface);
  border: 1px solid var(--vs-border);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(10, 14, 23, 0.03);
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
  padding: 10.5px 16px;
  border-radius: 6px;
  border: 1px solid var(--vs-accent);
  background: var(--vs-accent);
  color: #FFFFFF;
  cursor: pointer;
  text-decoration: none;
  transition: background 140ms ease, border-color 140ms ease, transform 100ms ease;
}

.vs-btn:hover:not(:disabled) {
  background: var(--vs-accent-hover);
  border-color: var(--vs-accent-hover);
}

.vs-btn:active:not(:disabled) {
  transform: translateY(0.5px);
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
  border-color: var(--vs-ink-muted);
}

.vs-input {
  width: 100%;
  font-family: var(--vs-mono);
  font-size: 13.5px;
  padding: 10px 12px;
  border: 1px solid var(--vs-border-strong);
  border-radius: 6px;
  background: var(--vs-surface);
  color: var(--vs-ink);
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.vs-input:focus {
  border-color: var(--vs-ink);
  box-shadow: 0 0 0 3px rgba(10, 14, 23, 0.07);
}

.vs-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--vs-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 3.5px 8.5px;
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

/* Segmented Guided / Pro UX Mode Switch */
.vs-mode-switch {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border-radius: 6px;
  border: 1px solid var(--vs-border-strong);
  background: var(--vs-surface-subtle);
  gap: 2px;
}

.vs-mode-btn {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--vs-ink-muted);
  font-family: var(--vs-sans);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
  white-space: nowrap;
}

.vs-mode-btn:hover {
  color: var(--vs-ink);
}

.vs-mode-btn[data-active="true"] {
  background: var(--vs-surface);
  color: var(--vs-ink);
  box-shadow: 0 1px 2px rgba(10, 14, 23, 0.08);
}

/* Plain-English Guided Explainer Card */
.vs-guided-banner {
  background: var(--vs-surface-warm);
  border: 1px solid var(--vs-border);
  border-left: 3px solid var(--vs-ink);
  border-radius: 6px;
  padding: 13px 16px;
}

.vs-glossary-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.vs-glossary-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 9px;
  border-radius: 4px;
  background: var(--vs-surface);
  border: 1px solid var(--vs-border);
  font-size: 12px;
  color: var(--vs-ink-secondary);
}

/* Progressive Disclosure Accordions (Clean <details> + <summary>) */
.vs-disclosure {
  border: 1px solid var(--vs-border);
  border-radius: 8px;
  background: var(--vs-surface);
  overflow: hidden;
}

.vs-disclosure > summary.vs-disclosure-summary {
  list-style: none;
  cursor: pointer;
  padding: 13px 16px;
  background: var(--vs-surface-subtle);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  user-select: none;
  transition: background 120ms ease;
}

.vs-disclosure > summary.vs-disclosure-summary::-webkit-details-marker {
  display: none;
}

.vs-disclosure > summary.vs-disclosure-summary:hover {
  background: var(--vs-surface-warm);
}

.vs-disclosure[open] > summary.vs-disclosure-summary {
  border-bottom: 1px solid var(--vs-border);
}

.vs-disclosure-pill {
  font-family: var(--vs-mono);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 4px;
  border: 1px solid var(--vs-border-strong);
  background: var(--vs-surface);
  color: var(--vs-ink);
  white-space: nowrap;
}

.vs-disclosure-pill::before {
  content: '+ Show ';
}

.vs-disclosure[open] > summary.vs-disclosure-summary .vs-disclosure-pill::before {
  content: '− Hide ';
}

.vs-disclosure-body {
  padding: 16px;
  background: var(--vs-surface);
}

/* Data Tables */
.vs-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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
  letter-spacing: 0.05em;
  color: var(--vs-ink-muted);
  padding: 11px 15px;
  border-bottom: 1px solid var(--vs-border);
  background: var(--vs-surface-subtle);
}

.vs-table td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--vs-border);
  vertical-align: top;
}

.vs-table tr:last-child td {
  border-bottom: none;
}

/* Strict 3-Tab Shell */
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
  padding: 13px 15px;
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
  background: rgba(255, 255, 255, 0.65);
}

.vs-tab-trigger[data-active="true"] {
  background: var(--vs-surface);
  color: var(--vs-ink);
  border-bottom-color: var(--vs-ink);
}

.vs-code-block {
  background: var(--vs-terminal);
  color: #EAE8E1;
  font-family: var(--vs-mono);
  font-size: 12.5px;
  line-height: 1.58;
  padding: 14px 16px;
  margin: 0;
  overflow-x: auto;
  border-bottom-left-radius: 7px;
  border-bottom-right-radius: 7px;
}

.vs-blur-token {
  filter: blur(4px);
  user-select: none;
  pointer-events: none;
  display: inline-block;
}

/* Responsive Architectural Grids & Ledgers */
.vs-header-inner {
  min-height: 64px;
  padding-top: 10px;
  padding-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}

.vs-nav-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 13.5px;
}

.vs-nav-link {
  color: var(--vs-ink-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 120ms ease;
}

.vs-nav-link:hover {
  color: var(--vs-ink);
}

.vs-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 32px;
  align-items: center;
}

.vs-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.vs-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.vs-grid-split {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 18px;
}

.vs-grader-form {
  padding: 16px 20px;
  border-bottom: 1px solid var(--vs-border);
  display: flex;
  gap: 10px;
}

.vs-arch-matrix {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.vs-arch-cell {
  padding: 24px;
  border-right: 1px solid var(--vs-border);
  border-bottom: 1px solid var(--vs-border);
}

.vs-arch-cell:nth-child(2n) {
  border-right: none;
}

.vs-arch-cell:nth-last-child(-n + 2) {
  border-bottom: none;
}

.vs-ledger-strip-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.vs-ledger-strip-4 > div {
  border-right: 1px solid var(--vs-border);
}

.vs-ledger-strip-4 > div:last-child {
  border-right: none;
}

.vs-ledger-strip-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.vs-ledger-strip-3 > div {
  border-right: 1px solid var(--vs-border);
}

.vs-ledger-strip-3 > div:last-child {
  border-right: none;
}

/* Zero-Lag GPU-Composited SVG Signal Keyframes */
@keyframes vsSignalFlow {
  from {
    stroke-dashoffset: 180;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes vsPulseRing {
  0%, 100% {
    opacity: 0.22;
  }
  50% {
    opacity: 0.68;
  }
}

.vs-signal-path {
  stroke-dasharray: 10 170;
  animation: vsSignalFlow 3.4s linear infinite;
  will-change: stroke-dashoffset;
}

.vs-signal-path-delay-1 {
  animation-delay: -1.1s;
}

.vs-signal-path-delay-2 {
  animation-delay: -2.2s;
}

.vs-signal-path-out {
  stroke-dasharray: 14 166;
  animation: vsSignalFlow 2.8s linear infinite;
  will-change: stroke-dashoffset;
}

.vs-pulse-ring {
  animation: vsPulseRing 3.2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  .vs-signal-path,
  .vs-signal-path-out,
  .vs-pulse-ring {
    animation: none !important;
  }
}

/* Tablet Breakpoint */
@media (max-width: 960px) {
  .vs-hero-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
  .vs-grid-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .vs-grid-split {
    grid-template-columns: minmax(0, 1fr);
  }
  .vs-ledger-strip-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .vs-ledger-strip-4 > div:nth-child(2) {
    border-right: none;
  }
  .vs-ledger-strip-4 > div:nth-child(1),
  .vs-ledger-strip-4 > div:nth-child(2) {
    border-bottom: 1px solid var(--vs-border);
  }
}

/* Mobile Breakpoint */
@media (max-width: 720px) {
  .vs-container {
    padding: 0 16px;
  }
  .vs-nav-links {
    gap: 12px;
    font-size: 12.5px;
    flex-wrap: nowrap;
    overflow-x: auto;
    max-width: 100%;
    white-space: nowrap;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .vs-nav-links::-webkit-scrollbar {
    display: none;
  }
  .vs-card {
    max-width: 100%;
    box-sizing: border-box;
  }
  .vs-table th,
  .vs-table td {
    padding: 9px 10px;
  }
  .vs-grader-form {
    flex-direction: column;
  }
  .vs-grid-2,
  .vs-grid-4 {
    grid-template-columns: minmax(0, 1fr);
  }
  .vs-arch-matrix {
    grid-template-columns: minmax(0, 1fr);
  }
  .vs-arch-cell {
    border-right: none !important;
    border-bottom: 1px solid var(--vs-border) !important;
  }
  .vs-arch-cell:last-child {
    border-bottom: none !important;
  }
  .vs-ledger-strip-3 {
    grid-template-columns: minmax(0, 1fr);
  }
  .vs-ledger-strip-3 > div {
    border-right: none;
    border-bottom: 1px solid var(--vs-border);
  }
  .vs-ledger-strip-3 > div:last-child {
    border-bottom: none;
  }
  .vs-tab-trigger {
    padding: 10px 9px;
  }
}

@media (max-width: 520px) {
  .vs-ledger-strip-4 {
    grid-template-columns: minmax(0, 1fr);
  }
  .vs-ledger-strip-4 > div {
    border-right: none !important;
    border-bottom: 1px solid var(--vs-border) !important;
  }
  .vs-ledger-strip-4 > div:last-child {
    border-bottom: none !important;
  }
}

/* Pure White-Label Chrome Isolation for Third-Party Agency /audit/[slug] Pages */
body:has(.vs-whitelabel-audit-root) .vs-site-chrome {
  display: none !important;
}

/* Executive PDF / Print Stylesheet */
@media print {
  body {
    background: #FFFFFF !important;
    color: #0A0E17 !important;
  }
  .vs-site-chrome,
  .vs-no-print {
    display: none !important;
  }
  .vs-container {
    max-width: 100% !important;
    padding: 0 !important;
  }
  .vs-card {
    box-shadow: none !important;
    break-inside: avoid;
  }
}
`;
