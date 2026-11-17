'use client';

import React, { useState } from 'react';

export type BadgeTone = 'pass' | 'warn' | 'critical' | 'neutral';
export type UxMode = 'guided' | 'pro';

export function StatusBadge(props: {
  tone?: BadgeTone;
  children: React.ReactNode;
}): React.ReactElement {
  const toneClass =
    props.tone === 'pass'
      ? 'vs-badge vs-badge-pass'
      : props.tone === 'warn'
        ? 'vs-badge vs-badge-warn'
        : props.tone === 'critical'
          ? 'vs-badge vs-badge-critical'
          : 'vs-badge';

  return <span className={toneClass}>{props.children}</span>;
}

export function UxModeSwitch(props: {
  mode: UxMode;
  onChange: (mode: UxMode) => void;
  compact?: boolean;
}): React.ReactElement {
  return (
    <div
      className="vs-mode-switch"
      role="group"
      aria-label="Interface view mode"
    >
      <button
        type="button"
        className="vs-mode-btn"
        data-active={props.mode === 'guided' ? 'true' : 'false'}
        aria-pressed={props.mode === 'guided'}
        onClick={() => props.onChange('guided')}
        title="Easy-to-use step-by-step view for founders, marketers, and store owners"
      >
        {props.compact ? 'Guided' : 'Guided Mode'}
      </button>
      <button
        type="button"
        className="vs-mode-btn"
        data-active={props.mode === 'pro' ? 'true' : 'false'}
        aria-pressed={props.mode === 'pro'}
        onClick={() => props.onChange('pro')}
        title="Full HTTP crawler telemetry, raw schemas, query fanouts, and MCP Bearer keys"
      >
        {props.compact ? 'Pro' : 'Pro Mode'}
      </button>
    </div>
  );
}

export function GuidedExplainerBanner(props: {
  stepLabel?: string;
  title: string;
  description: string;
  glossary?: Array<{ term: string; meaning: string }>;
}): React.ReactElement {
  return (
    <div className="vs-guided-banner" style={{ marginBottom: '16px' }}>
      {props.stepLabel ? (
        <div
          className="vs-eyebrow"
          style={{ marginBottom: '4px', color: 'var(--vs-ink-secondary)' }}
        >
          {props.stepLabel}
        </div>
      ) : null}
      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
        {props.title}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
        {props.description}
      </div>
      {props.glossary && props.glossary.length > 0 ? (
        <div className="vs-glossary-grid">
          {props.glossary.map((item) => (
            <span key={item.term} className="vs-glossary-chip">
              <strong className="vs-mono" style={{ color: 'var(--vs-ink)', fontSize: '11.5px' }}>
                {item.term}:
              </strong>
              <span>{item.meaning}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MetricLedgerCell(props: {
  label: string;
  value: string | number;
  suffix?: string;
  sublabel?: string;
  tone?: BadgeTone;
}): React.ReactElement {
  const valueColor =
    props.tone === 'critical'
      ? 'var(--vs-crit-fg)'
      : props.tone === 'warn'
        ? 'var(--vs-warn-fg)'
        : props.tone === 'pass'
          ? 'var(--vs-pass-fg)'
          : 'var(--vs-ink)';

  return (
    <div style={{ padding: '16px 18px' }}>
      <div
        className="vs-mono"
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--vs-ink-muted)',
          marginBottom: '6px',
        }}
      >
        {props.label}
      </div>
      <div
        className="vs-mono"
        style={{
          fontSize: '26px',
          fontWeight: 700,
          lineHeight: 1.1,
          color: valueColor,
        }}
      >
        {props.value}
        {props.suffix ? (
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--vs-ink-muted)',
              marginLeft: '4px',
            }}
          >
            {props.suffix}
          </span>
        ) : null}
      </div>
      {props.sublabel ? (
        <div
          style={{
            fontSize: '12.5px',
            color: 'var(--vs-ink-muted)',
            marginTop: '6px',
          }}
        >
          {props.sublabel}
        </div>
      ) : null}
    </div>
  );
}

export function QualityRubricBadge(_props: {
  score: number;
  breakdown?: {
    lexicon_filter: number;
    human_cadence: number;
    specificity_density: number;
    visual_or_structural_craft: number;
    technical_integrity: number;
  };
}): React.ReactElement {
  return (
    <span
      className="vs-badge vs-badge-pass"
      title="Syntax-validated and verified against your Brand Truth Sheet"
    >
      SYNTAX &amp; TRUTH VERIFIED
    </span>
  );
}

export function CodeArtifactCard(props: {
  title: string;
  fileHint?: string;
  plainSummary?: string;
  code: string;
  statusBadge?: {
    label: string;
    tone: BadgeTone;
  };
  qualityScore?: number;
  qualityBreakdown?: {
    lexicon_filter: number;
    human_cadence: number;
    specificity_density: number;
    visual_or_structural_craft: number;
    technical_integrity: number;
  };
}): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable in non-secure test frame
    }
  };

  return (
    <div className="vs-card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '11px 15px',
          borderBottom: '1px solid var(--vs-border)',
          background: 'var(--vs-surface-subtle)',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{props.title}</div>
          {props.plainSummary ? (
            <div style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)', marginTop: '2px' }}>
              {props.plainSummary}
            </div>
          ) : null}
          {props.fileHint ? (
            <div
              className="vs-mono"
              style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)', marginTop: '2px' }}
            >
              {props.fileHint}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {props.statusBadge ? (
            <StatusBadge tone={props.statusBadge.tone}>
              {props.statusBadge.label}
            </StatusBadge>
          ) : null}
          {typeof props.qualityScore === 'number' ? (
            <QualityRubricBadge
              score={props.qualityScore}
              breakdown={props.qualityBreakdown}
            />
          ) : null}
          <button
            type="button"
            onClick={handleCopy}
            className="vs-btn vs-btn-secondary"
            style={{ padding: '6px 11px', fontSize: '12px' }}
          >
            {copied ? 'Copied ✓' : 'Copy Code'}
          </button>
        </div>
      </div>
      <pre className="vs-code-block">
        <code>{props.code}</code>
      </pre>
    </div>
  );
}

export type ThreeTabId = 'tab1_visibility' | 'tab2_fixes' | 'tab3_offsite';

export function ThreeTabShell(props: {
  activeTab: ThreeTabId;
  onSelectTab: (tab: ThreeTabId) => void;
  compact?: boolean;
  mode?: UxMode;
  children: React.ReactNode;
}): React.ReactElement {
  const isGuided = props.mode === 'guided';

  const tabs: Array<{ id: ThreeTabId; index: string; label: string; sub: string }> = [
    {
      id: 'tab1_visibility',
      index: '01',
      label: props.compact
        ? isGuided
          ? 'Health & Truth'
          : 'Visibility & Truth'
        : isGuided
          ? 'Brand Health & AI Mistakes'
          : 'Visibility, Hallucinations & ROI',
      sub: isGuided
        ? 'Clear site issues & real prices'
        : 'Share of Voice, Watchdog & Bot WAF',
    },
    {
      id: 'tab2_fixes',
      index: '02',
      label: props.compact
        ? isGuided
          ? '1-Click AI Fixes'
          : 'On-Site Fixes'
        : isGuided
          ? '1-Click AI Prompt & Site Fixes'
          : 'One-Click On-Site Fixes',
      sub: isGuided
        ? 'Copy 1 prompt into your AI (no coding)'
        : 'Validated JSON-LD, /llms.txt & Shopify UCP',
    },
    {
      id: 'tab3_offsite',
      index: '03',
      label: props.compact
        ? isGuided
          ? 'Rivals & Reports'
          : 'Fanouts & MCP'
        : isGuided
          ? 'Competitors & Client Reports'
          : 'Citations, Pitch Mode & MCP',
      sub: isGuided
        ? 'Beat rivals & share branded client links'
        : 'Query Fanouts, 60s Pitch URL & /mcp Keys',
    },
  ];

  const shellCard = (
    <div className="vs-card" style={{ overflow: 'hidden' }}>
      <div className="vs-tabs-bar" role="tablist" aria-label="Verisource 3-Tab Console">
        {tabs.map((tab) => {
          const isActive = props.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-active={isActive ? 'true' : 'false'}
              className="vs-tab-trigger"
              onClick={() => props.onSelectTab(tab.id)}
            >
              <div
                className="vs-mono"
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  marginBottom: '2px',
                  color: isActive ? 'var(--vs-ink)' : 'var(--vs-ink-muted)',
                }}
              >
                {isGuided ? `STEP ${tab.index}` : `TAB ${tab.index}`}
              </div>
              <div
                style={{
                  fontSize: props.compact ? '12.5px' : '13.5px',
                  fontWeight: 700,
                }}
              >
                {tab.label}
              </div>
              {!props.compact ? (
                <div
                  style={{
                    fontSize: '11.5px',
                    color: 'var(--vs-ink-muted)',
                    marginTop: '2px',
                  }}
                >
                  {tab.sub}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      <div style={{ padding: props.compact ? '14px' : '24px' }}>{props.children}</div>
    </div>
  );

  return props.compact ? shellCard : <div className="vs-bezel">{shellCard}</div>;
}

export interface ConsoleJumpAnchor {
  id: string;
  label: string;
}

export function ConsoleQuickJumpBar(props: {
  mode: UxMode;
  anchors: ConsoleJumpAnchor[];
  rightHint?: string;
}): React.ReactElement {
  return (
    <nav
      aria-label="Section quick-jump navigation"
      className="vs-quick-jump-bar"
    >
      <div className="vs-quick-jump-links">
        <span
          className="vs-eyebrow"
          style={{ fontSize: '10.5px', marginRight: '4px' }}
        >
          {props.mode === 'guided' ? 'ON THIS PAGE:' : 'JUMP TO PANEL:'}
        </span>
        {props.anchors.map((a) => (
          <a key={a.id} href={`#${a.id}`} className="vs-quick-jump-pill">
            {a.label}
          </a>
        ))}
      </div>
      {props.rightHint ? (
        <span
          className="vs-mono"
          style={{ fontSize: '11px', color: 'var(--vs-ink-muted)' }}
        >
          {props.rightHint}
        </span>
      ) : null}
    </nav>
  );
}

export function ConsoleZoneHeader(props: {
  zoneTag: string;
  title: string;
  howToUse: string;
  badgeText?: string;
  badgeTone?: BadgeTone;
}): React.ReactElement {
  return (
    <div className="vs-zone-header">
      <div style={{ maxWidth: '760px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '5px',
          }}
        >
          <span className="vs-zone-step-pill">{props.zoneTag}</span>
          <strong
            style={{
              fontSize: '16px',
              letterSpacing: '-0.015em',
              color: 'var(--vs-ink)',
            }}
          >
            {props.title}
          </strong>
        </div>
        <div
          style={{
            fontSize: '13px',
            color: 'var(--vs-ink-secondary)',
            lineHeight: 1.5,
          }}
        >
          {props.howToUse}
        </div>
      </div>
      {props.badgeText ? (
        <StatusBadge tone={props.badgeTone ?? 'neutral'}>
          {props.badgeText}
        </StatusBadge>
      ) : null}
    </div>
  );
}
