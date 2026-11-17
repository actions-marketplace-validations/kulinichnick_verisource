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
  max-width: 100%;
  overflow-x: clip;
  overscroll-behavior-x: none;
  background: var(--vs-canvas);
  color: var(--vs-ink);
  font-family: var(--vs-sans);
  font-size: 15px;
  line-height: 1.58;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

main {
  max-width: 100%;
  overflow-x: clip;
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
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}

.vs-stack {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  min-width: 0;
  max-width: 100%;
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
  border: 1px solid #DFDCD3;
  border-radius: 10px;
  box-shadow:
    0 1px 2px rgba(10, 14, 23, 0.038),
    0 6px 18px -6px rgba(10, 14, 23, 0.048),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  min-width: 0;
  max-width: 100%;
}

.vs-card-interactive {
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.vs-card-interactive:hover {
  transform: translateY(-2px);
  border-color: var(--vs-border-strong);
  box-shadow:
    0 4px 10px rgba(10, 14, 23, 0.05),
    0 16px 32px -10px rgba(10, 14, 23, 0.085),
    inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

/* Tactile Machined Instrument Bezels & Tonal Section Bands */
.vs-bezel {
  padding: 7px;
  border-radius: 15px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(235, 231, 221, 0.86) 100%);
  border: 1px solid #D5D0C3;
  box-shadow:
    0 2px 4px rgba(10, 14, 23, 0.04),
    0 18px 38px -12px rgba(10, 14, 23, 0.09),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  min-width: 0;
  max-width: 100%;
}

.vs-bezel > .vs-card {
  border-radius: 9px;
}

.vs-bezel-obsidian {
  padding: 8px;
  border-radius: 16px;
  background: linear-gradient(180deg, #161D2B 0%, #0A0E17 100%);
  border: 1px solid #232C3F;
  box-shadow:
    0 4px 12px rgba(10, 14, 23, 0.14),
    0 24px 48px -14px rgba(10, 14, 23, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  min-width: 0;
  max-width: 100%;
}

.vs-bezel-obsidian > .vs-card {
  border-radius: 10px;
}

.vs-band-warm {
  background: linear-gradient(180deg, #F5F2EA 0%, #FAF9F6 100%);
  border-top: 1px solid var(--vs-border);
  border-bottom: 1px solid var(--vs-border);
}

.vs-band-obsidian {
  background: linear-gradient(180deg, #0E1420 0%, #090D15 100%);
  color: #FAF9F6;
  border: 1px solid #1E293B;
  border-radius: 14px;
  box-shadow:
    0 18px 40px -12px rgba(10, 14, 23, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.vs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--vs-sans);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  max-width: 100%;
  padding: 10.5px 16px;
  border-radius: 7px;
  border: 1px solid #0A0E17;
  background: linear-gradient(180deg, #1C2333 0%, #0A0E17 100%);
  color: #FFFFFF;
  box-shadow:
    0 1px 2px rgba(10, 14, 23, 0.18),
    0 4px 10px -2px rgba(10, 14, 23, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  cursor: pointer;
  text-decoration: none;
  transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 100ms ease;
}

.vs-btn:hover:not(:disabled) {
  background: linear-gradient(180deg, #252E42 0%, #131A29 100%);
  border-color: #131A29;
  transform: translateY(-0.5px);
  box-shadow:
    0 2px 4px rgba(10, 14, 23, 0.2),
    0 8px 16px -4px rgba(10, 14, 23, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.vs-btn:active:not(:disabled) {
  transform: translateY(0.5px);
}

.vs-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.vs-btn-secondary {
  background: linear-gradient(180deg, #FFFFFF 0%, #F7F5F0 100%);
  color: var(--vs-ink);
  border: 1px solid var(--vs-border-strong);
  box-shadow:
    0 1px 2px rgba(10, 14, 23, 0.05),
    inset 0 1px 0 #FFFFFF;
}

.vs-btn-secondary:hover:not(:disabled) {
  background: linear-gradient(180deg, #FFFFFF 0%, #EFECE4 100%);
  border-color: var(--vs-ink-muted);
  box-shadow:
    0 2px 6px rgba(10, 14, 23, 0.08),
    inset 0 1px 0 #FFFFFF;
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
  max-width: 100%;
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

/* Tactile Pill Buttons & Mode Switches (Consistent Site-Wide Selection Pills) */
.vs-mode-switch,
.vs-pill-group {
  display: inline-flex;
  flex-wrap: wrap;
  max-width: 100%;
  align-items: center;
  gap: 6px;
}

.vs-mode-btn,
.vs-pill-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid var(--vs-border-strong);
  background: var(--vs-surface);
  color: var(--vs-ink-secondary);
  font-family: var(--vs-sans);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  padding: 6px 13px;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 1px 1px rgba(10, 14, 23, 0.03);
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
  white-space: nowrap;
}

.vs-mode-btn:hover:not(:disabled),
.vs-pill-btn:hover:not(:disabled) {
  color: var(--vs-ink);
  border-color: var(--vs-ink);
  background: var(--vs-surface-warm);
}

.vs-mode-btn[data-active="true"],
.vs-pill-btn[data-active="true"],
.vs-pill-btn[aria-selected="true"] {
  background: var(--vs-ink);
  border-color: var(--vs-ink);
  color: #FFFFFF;
  box-shadow: 0 1px 3px rgba(10, 14, 23, 0.16);
}

.vs-pill-btn-sm {
  padding: 4.5px 11px;
  font-size: 11.5px;
}

/* Easy-to-Use Guided Explainer Card */
.vs-guided-banner {
  background: linear-gradient(180deg, #FAF8F2 0%, #F4F1E8 100%);
  border: 1px solid #DFDCD3;
  border-left: 3.5px solid var(--vs-ink);
  border-radius: 9px;
  padding: 15px 18px;
  box-shadow: 0 1px 3px rgba(10, 14, 23, 0.035), inset 0 1px 0 rgba(255, 255, 255, 0.85);
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
  padding: 4.5px 10px;
  border-radius: 6px;
  background: var(--vs-surface);
  border: 1px solid var(--vs-border);
  font-size: 12px;
  color: var(--vs-ink-secondary);
  box-shadow: 0 1px 1px rgba(10, 14, 23, 0.025);
}

/* Console Section Separation & Quick-Jump Navigation */
.vs-quick-jump-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  padding: 9px 14px;
  margin-bottom: 22px;
  border-radius: 9px;
  background: var(--vs-surface-subtle);
  border: 1px solid var(--vs-border);
}

.vs-quick-jump-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.vs-quick-jump-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4.5px 10px;
  border-radius: 999px;
  background: var(--vs-surface);
  border: 1px solid #DCD8CE;
  color: var(--vs-ink-secondary);
  font-size: 11.5px;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 1px 1px rgba(10, 14, 23, 0.03);
  transition: border-color 120ms ease, color 120ms ease, background 120ms ease, transform 100ms ease;
}

.vs-quick-jump-pill:hover {
  color: var(--vs-ink);
  border-color: var(--vs-ink);
  background: #FFFFFF;
  transform: translateY(-0.5px);
}

.vs-console-zone {
  margin-top: 32px;
  padding-top: 26px;
  border-top: 1px solid var(--vs-border);
  scroll-margin-top: 84px;
}

.vs-console-zone-first {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
  scroll-margin-top: 84px;
}

.vs-zone-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px 14px;
  margin-bottom: 14px;
}

.vs-zone-step-pill {
  display: inline-flex;
  align-items: center;
  font-family: var(--vs-mono);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2.5px 8px;
  border-radius: 999px;
  background: #0A0E17;
  color: #FFFFFF;
}

/* Progressive Disclosure Accordions (Clean <details> + <summary>) */
.vs-disclosure {
  border: 1px solid #DFDCD3;
  border-radius: 10px;
  background: var(--vs-surface);
  box-shadow:
    0 1px 2px rgba(10, 14, 23, 0.035),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.vs-disclosure > summary,
.vs-disclosure > summary.vs-disclosure-summary {
  list-style: none;
  cursor: pointer;
  padding: 14px 18px;
  background: linear-gradient(180deg, #FBF9F5 0%, #F3F0E7 100%);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  user-select: none;
  transition: background 120ms ease;
}

.vs-disclosure > summary::-webkit-details-marker,
.vs-disclosure > summary.vs-disclosure-summary::-webkit-details-marker {
  display: none;
}

.vs-disclosure > summary:hover,
.vs-disclosure > summary.vs-disclosure-summary:hover {
  background: linear-gradient(180deg, #FFFFFF 0%, #EFECE2 100%);
}

.vs-disclosure[open] > summary,
.vs-disclosure[open] > summary.vs-disclosure-summary {
  border-bottom: 1px solid var(--vs-border);
}

.vs-disclosure-pill,
.vs-disclosure-meta {
  font-family: var(--vs-mono);
  font-size: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--vs-border-strong);
  background: var(--vs-surface);
  color: var(--vs-ink);
  box-shadow: 0 1px 2px rgba(10, 14, 23, 0.04);
  white-space: nowrap;
}

.vs-disclosure-pill::before {
  content: '+ Show ';
}

.vs-disclosure[open] > summary .vs-disclosure-pill::before {
  content: '− Hide ';
}

.vs-disclosure-body {
  padding: 18px;
  background: var(--vs-surface);
}

/* Data Tables */
.vs-table-wrap {
  display: block;
  width: 100%;
  max-width: 100%;
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

/* Strict 3-Tab Shell (Segmented Tactile Workspace Switcher) */
.vs-tabs-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  padding: 6px;
  border-bottom: 1px solid var(--vs-border);
  background: #EFECE3;
}

.vs-tab-trigger {
  appearance: none;
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 12px 15px;
  text-align: left;
  cursor: pointer;
  color: var(--vs-ink-muted);
  font-family: var(--vs-sans);
  transition: background 140ms ease, color 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}

.vs-tab-trigger:hover {
  color: var(--vs-ink);
  background: rgba(255, 255, 255, 0.78);
  border-color: #DFDCD3;
}

.vs-tab-trigger[data-active="true"] {
  background: var(--vs-surface);
  color: var(--vs-ink);
  border-color: #D5D0C3;
  box-shadow:
    0 1px 3px rgba(10, 14, 23, 0.07),
    0 4px 12px -2px rgba(10, 14, 23, 0.06),
    inset 0 1px 0 #FFFFFF;
}

.vs-code-block {
  background: var(--vs-terminal);
  color: #EAE8E1;
  font-family: var(--vs-mono);
  font-size: 12.5px;
  line-height: 1.58;
  padding: 14px 16px;
  margin: 0;
  width: 100%;
  max-width: 100%;
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

/* Desktop Resources Popover & Mobile Navigation Drawer */
.vs-nav-dropdown {
  position: relative;
}

.vs-nav-dropdown > summary {
  list-style: none;
  cursor: pointer;
  user-select: none;
}

.vs-nav-dropdown > summary::-webkit-details-marker {
  display: none;
}

.vs-nav-dropdown-panel {
  position: absolute;
  top: calc(100% + 10px);
  left: -12px;
  width: 288px;
  background: var(--vs-surface);
  border: 1px solid var(--vs-border-strong);
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(10, 14, 23, 0.12);
  padding: 8px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  z-index: 60;
}

.vs-nav-dropdown-item {
  display: block;
  padding: 8px 10px;
  border-radius: 6px;
  text-decoration: none;
  color: var(--vs-ink);
  transition: background 120ms ease;
}

.vs-nav-dropdown-item:hover {
  background: var(--vs-surface-warm);
}

.vs-mobile-header-actions {
  display: none;
  align-items: center;
  gap: 8px;
}

.vs-mobile-nav-drawer {
  display: none;
}

@media (max-width: 920px) {
  .vs-desktop-nav {
    display: none !important;
  }
  .vs-header-mcp-pill {
    display: none !important;
  }
  .vs-mobile-header-actions {
    display: inline-flex;
  }
  .vs-mobile-nav-drawer[data-open="true"] {
    display: block;
    border-top: 1px solid var(--vs-border);
    background: var(--vs-surface);
    padding: 14px 0 18px 0;
  }
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

.vs-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
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

.vs-showcase-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  overflow: hidden;
}

.vs-showcase-rail {
  border-right: 1px solid var(--vs-border);
  background: var(--vs-surface-subtle);
}

.vs-hero-grid > *,
.vs-grid-4 > *,
.vs-grid-3 > *,
.vs-grid-2 > *,
.vs-grid-split > *,
.vs-showcase-grid > *,
.vs-ledger-strip-4 > *,
.vs-ledger-strip-3 > * {
  min-width: 0;
}

.vs-schematic-header {
  padding: 10px 14px;
  border-bottom: 1px solid var(--vs-border);
  background: var(--vs-surface-subtle);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 10px;
}

.vs-schematic-desktop {
  display: block;
  width: 100%;
  height: auto;
}

.vs-schematic-mobile {
  display: none;
  width: 100%;
  height: auto;
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

/* Zero-Lag GPU-Composited SVG Signal & Motion Keyframes */
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
    opacity: 0.72;
  }
}

@keyframes vsLiveDot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.42;
    transform: scale(0.84);
  }
}

@keyframes vsScanSweep {
  0% {
    transform: translateX(-12px);
    opacity: 0;
  }
  20% {
    opacity: 0.85;
  }
  80% {
    opacity: 0.85;
  }
  100% {
    transform: translateX(220px);
    opacity: 0;
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

.vs-live-dot {
  transform-box: fill-box;
  transform-origin: center;
  animation: vsLiveDot 2.2s ease-in-out infinite;
}

.vs-scan-sweep {
  animation: vsScanSweep 3.8s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  .vs-signal-path,
  .vs-signal-path-out,
  .vs-pulse-ring,
  .vs-live-dot,
  .vs-scan-sweep {
    animation: none !important;
  }
}

/* Tablet Breakpoint */
@media (max-width: 960px) {
  .vs-hero-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
  .vs-grid-4,
  .vs-grid-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .vs-grid-split {
    grid-template-columns: minmax(0, 1fr);
  }
  .vs-showcase-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .vs-showcase-rail {
    border-right: none;
    border-bottom: 1px solid var(--vs-border);
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
  .vs-header-inner {
    gap: 8px 12px;
  }
  .vs-nav-links {
    flex: 1 1 100%;
    width: 100%;
    min-width: 0;
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
  .vs-badge {
    white-space: normal;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .vs-mode-btn,
  .vs-pill-btn {
    white-space: normal;
    text-align: center;
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
  .vs-grader-form .vs-btn {
    width: 100%;
    white-space: normal !important;
  }
  .vs-grid-2,
  .vs-grid-3,
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
  .vs-bezel,
  .vs-bezel-obsidian {
    padding: 5px;
    border-radius: 12px;
  }
}

@media (max-width: 640px) {
  .vs-schematic-desktop {
    display: none;
  }
  .vs-schematic-mobile {
    display: block;
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

.vs-print-only {
  display: none;
}

/* Executive PDF / Print Stylesheet */
@media print {
  @page {
    margin: 12mm;
  }
  body {
    background: #FFFFFF !important;
    color: #0A0E17 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .vs-site-chrome,
  .vs-no-print {
    display: none !important;
  }
  .vs-print-only {
    display: block !important;
  }
  .vs-container {
    max-width: 100% !important;
    padding: 0 !important;
  }
  .vs-ledger-strip-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }
  .vs-ledger-strip-3 > div {
    border-right: 1px solid var(--vs-border) !important;
    border-bottom: none !important;
  }
  .vs-ledger-strip-3 > div:last-child {
    border-right: none !important;
  }
  .vs-card {
    box-shadow: none !important;
    break-inside: avoid;
  }
}
`;
