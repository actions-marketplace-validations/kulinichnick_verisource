'use client';

import React, { useState } from 'react';

export type BadgeTone = 'pass' | 'warn' | 'critical' | 'neutral';

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

export function QualityRubricBadge(props: {
  score: number;
  breakdown?: {
    lexicon_filter: number;
    human_cadence: number;
    specificity_density: number;
    visual_or_structural_craft: number;
    technical_integrity: number;
  };
}): React.ReactElement {
  const titleText = props.breakdown
    ? `Lexicon ${props.breakdown.lexicon_filter.toFixed(1)} | Cadence ${props.breakdown.human_cadence.toFixed(1)} | Specificity ${props.breakdown.specificity_density.toFixed(1)} | Craft ${props.breakdown.visual_or_structural_craft.toFixed(1)} | Integrity ${props.breakdown.technical_integrity.toFixed(1)}`
    : 'Verified >= 9.5/10 Natural Quality Rubric';

  return (
    <span className="vs-badge vs-badge-pass" title={titleText}>
      QUALITY GATE {props.score.toFixed(1)} / 10.0
    </span>
  );
}

export function CodeArtifactCard(props: {
  title: string;
  fileHint?: string;
  code: string;
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
          padding: '10px 14px',
          borderBottom: '1px solid var(--vs-border)',
          background: 'var(--vs-surface-subtle)',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{props.title}</div>
          {props.fileHint ? (
            <div
              className="vs-mono"
              style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}
            >
              {props.fileHint}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            style={{ padding: '6px 10px', fontSize: '12px' }}
          >
            {copied ? 'Copied' : 'Copy Code'}
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
  children: React.ReactNode;
}): React.ReactElement {
  const tabs: Array<{ id: ThreeTabId; index: string; label: string; sub: string }> = [
    {
      id: 'tab1_visibility',
      index: '01',
      label: props.compact ? 'Visibility & Truth' : 'Visibility, Hallucinations & ROI',
      sub: 'Share of Voice, Watchdog & Bot WAF',
    },
    {
      id: 'tab2_fixes',
      index: '02',
      label: props.compact ? 'On-Site Fixes' : 'One-Click On-Site Fixes',
      sub: '9.5+/10 JSON-LD, /llms.txt & Shopify UCP',
    },
    {
      id: 'tab3_offsite',
      index: '03',
      label: props.compact ? 'Fanouts & MCP' : 'Citations, Pitch Mode & MCP',
      sub: 'Query Fanouts, 60s Pitch URL & /mcp Keys',
    },
  ];

  return (
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
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  marginBottom: '2px',
                }}
              >
                TAB {tab.index}
              </div>
              <div
                style={{
                  fontSize: props.compact ? '12.5px' : '13.5px',
                  fontWeight: 600,
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
      <div style={{ padding: props.compact ? '14px' : '22px' }}>{props.children}</div>
    </div>
  );
}
