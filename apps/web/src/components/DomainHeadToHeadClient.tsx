'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicHeadToHeadXrayReport } from '@verisource/core-geo';
import { CodeArtifactCard, MetricLedgerCell, StatusBadge } from '@verisource/ui';

const BENCHMARK_MATCHUPS: ReadonlyArray<{
  label: string;
  domainA: string;
  domainB: string;
}> = [
  {
    label: 'whoop.com vs ouraring.com',
    domainA: 'whoop.com',
    domainB: 'ouraring.com',
  },
  {
    label: 'gymshark.com vs allbirds.com',
    domainA: 'gymshark.com',
    domainB: 'allbirds.com',
  },
  {
    label: 'planetscale.com vs supabase.com',
    domainA: 'planetscale.com',
    domainB: 'supabase.com',
  },
  {
    label: 'glossier.com vs rhodeskin.com',
    domainA: 'glossier.com',
    domainB: 'rhodeskin.com',
  },
  {
    label: 'cal.com vs linear.app',
    domainA: 'cal.com',
    domainB: 'linear.app',
  },
  {
    label: 'browserbase.com vs firecrawl.dev',
    domainA: 'browserbase.com',
    domainB: 'firecrawl.dev',
  },
];

export function DomainHeadToHeadClient({
  initialDomainA = '',
  initialDomainB = '',
}: {
  initialDomainA?: string;
  initialDomainB?: string;
}): React.ReactElement {
  const [domainA, setDomainA] = useState(initialDomainA);
  const [domainB, setDomainB] = useState(initialDomainB);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<PublicHeadToHeadXrayReport | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const autoRanRef = useRef(false);

  const runComparison = useCallback(async (rawA: string, rawB: string) => {
    const cleanA = rawA.trim();
    const cleanB = rawB.trim();
    if (!cleanA || !cleanB) {
      setErrorMsg('Enter both your domain and a competitor domain to compare.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setCopiedLink(false);

    try {
      const res = await fetch('/api/tools/xray', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainA: cleanA, domainB: cleanB }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        report?: PublicHeadToHeadXrayReport;
        shareUrl?: string;
        message?: string;
      };

      if (!res.ok || !json.report) {
        setErrorMsg(
          json.message ?? 'Unable to compare these two domains right now.'
        );
        return;
      }

      setReport(json.report);
      const resolvedShare =
        json.shareUrl ??
        `https://verisource.dev/vs?a=${encodeURIComponent(
          json.report.ownHostname
        )}&b=${encodeURIComponent(json.report.rivalHostname)}`;
      setShareUrl(resolvedShare);

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('a', json.report.ownHostname);
        url.searchParams.set('b', json.report.rivalHostname);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      setErrorMsg('Network error while probing domain protocol endpoints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoRanRef.current) return;
    if (initialDomainA.trim() && initialDomainB.trim()) {
      autoRanRef.current = true;
      void runComparison(initialDomainA, initialDomainB);
    }
  }, [initialDomainA, initialDomainB, runComparison]);

  const handleSwap = () => {
    const nextA = domainB;
    const nextB = domainA;
    setDomainA(nextA);
    setDomainB(nextB);
    if (nextA.trim() && nextB.trim()) {
      void runComparison(nextA, nextB);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div>
      {/* Interactive Head-to-Head Input Studio */}
      <div className="vs-bezel-obsidian" style={{ marginBottom: '26px' }}>
        <div
          className="vs-card"
          style={{
            padding: '24px 26px',
            background: 'var(--vs-surface)',
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runComparison(domainA, domainB);
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                alignItems: 'end',
              }}
            >
              <div>
                <label
                  htmlFor="vs-domain-a"
                  className="vs-eyebrow"
                  style={{ display: 'block', marginBottom: '6px' }}
                >
                  DOMAIN A (YOUR SITE OR PROSPECT)
                </label>
                <input
                  id="vs-domain-a"
                  type="text"
                  className="vs-input vs-mono"
                  placeholder="whoop.com"
                  value={domainA}
                  onChange={(e) => setDomainA(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label
                  htmlFor="vs-domain-b"
                  className="vs-eyebrow"
                  style={{ display: 'block', marginBottom: '6px' }}
                >
                  DOMAIN B (COMPETITOR BENCHMARK)
                </label>
                <input
                  id="vs-domain-b"
                  type="text"
                  className="vs-input vs-mono"
                  placeholder="ouraring.com"
                  value={domainB}
                  onChange={(e) => setDomainB(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSwap}
                  className="vs-btn vs-btn-secondary"
                  title="Swap Domain A and Domain B"
                >
                  ⇄ Swap
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="vs-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {loading ? 'Probing Both Domains...' : 'Compare Head-to-Head →'}
                </button>
              </div>
            </div>
          </form>

          {/* 1-Click Benchmark Matchup Pills */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid var(--vs-border)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              className="vs-mono"
              style={{
                fontSize: '11px',
                color: 'var(--vs-ink-muted)',
                fontWeight: 700,
              }}
            >
              OR TEST A LIVE RIVALRY:
            </span>
            {BENCHMARK_MATCHUPS.map((pair) => (
              <button
                key={pair.label}
                type="button"
                className="vs-pill-btn vs-mono"
                disabled={loading}
                onClick={() => {
                  setDomainA(pair.domainA);
                  setDomainB(pair.domainB);
                  void runComparison(pair.domainA, pair.domainB);
                }}
                style={{ fontSize: '11.5px', padding: '5px 10px' }}
              >
                {pair.label}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div
              role="alert"
              style={{
                marginTop: '14px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--vs-critical-border)',
                background: 'var(--vs-critical-bg)',
                color: 'var(--vs-critical-fg)',
                fontSize: '13px',
              }}
            >
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* Live Comparison Report */}
      {report && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Side-by-Side Score & Shield Strip */}
          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--vs-border)',
                  background: 'var(--vs-surface-subtle)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <StatusBadge
                    tone={
                      report.scoreDelta > 0
                        ? 'pass'
                        : report.scoreDelta < 0
                          ? 'warn'
                          : 'neutral'
                    }
                  >
                    {report.scoreDelta > 0
                      ? `${report.ownHostname.toUpperCase()} LEADS BY +${report.scoreDelta} PTS`
                      : report.scoreDelta < 0
                        ? `${report.rivalHostname.toUpperCase()} LEADS BY +${Math.abs(report.scoreDelta)} PTS`
                        : 'TIED TECHNICAL PROTOCOL SCORE'}
                  </StatusBadge>
                  <span
                    className="vs-mono"
                    style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
                  >
                    {report.ownPlatformLabel} vs. {report.rivalPlatformLabel}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="vs-btn vs-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  {copiedLink ? '✓ Copied Matchup Link' : 'Copy Shareable Matchup URL'}
                </button>
              </div>

              <div className="vs-ledger-strip-4">
                <MetricLedgerCell
                  label={`${report.ownBrandName} (${report.ownHostname})`}
                  value={report.ownTechnicalScore}
                  suffix="/ 100"
                  tone={
                    report.ownTechnicalScore >= report.rivalTechnicalScore
                      ? 'pass'
                      : 'warn'
                  }
                  sublabel={`Stack: ${report.ownPlatformLabel}`}
                />
                <MetricLedgerCell
                  label={`${report.rivalBrandName} (${report.rivalHostname})`}
                  value={report.rivalTechnicalScore}
                  suffix="/ 100"
                  tone={
                    report.rivalTechnicalScore >= report.ownTechnicalScore
                      ? 'pass'
                      : 'warn'
                  }
                  sublabel={`Stack: ${report.rivalPlatformLabel}`}
                />
                <MetricLedgerCell
                  label="Score Delta"
                  value={
                    report.scoreDelta > 0
                      ? `+${report.scoreDelta}`
                      : `${report.scoreDelta}`
                  }
                  suffix=" pts"
                  tone={report.scoreDelta >= 0 ? 'pass' : 'warn'}
                  sublabel={`${report.ownHostname} vs. ${report.rivalHostname}`}
                />
                <MetricLedgerCell
                  label="Rival-Only Schema"
                  value={report.rivalExclusiveSchemaTypes.length}
                  suffix=" type(s)"
                  tone={
                    report.rivalExclusiveSchemaTypes.length === 0
                      ? 'pass'
                      : 'warn'
                  }
                  sublabel={
                    report.rivalExclusiveSchemaTypes.slice(0, 2).join(', ') ||
                    'No missing rival @type nodes'
                  }
                />
              </div>
            </div>
          </div>

          {/* 6-Dimension Protocol Comparison Table */}
          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--vs-border)',
                  background: 'var(--vs-surface-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <strong style={{ fontSize: '14px' }}>
                  6-Dimension AI Search &amp; Crawler Protocol Diff
                </strong>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link
                    href={`/report/${encodeURIComponent(report.ownHostname)}`}
                    className="vs-mono"
                    style={{ fontSize: '12px', color: 'var(--vs-accent)' }}
                  >
                    {report.ownHostname} scorecard →
                  </Link>
                  <Link
                    href={`/report/${encodeURIComponent(report.rivalHostname)}`}
                    className="vs-mono"
                    style={{ fontSize: '12px', color: 'var(--vs-accent)' }}
                  >
                    {report.rivalHostname} scorecard →
                  </Link>
                </div>
              </div>

              <div className="vs-table-wrap">
                <table className="vs-table">
                  <thead>
                    <tr>
                      <th>Protocol Dimension</th>
                      <th>{report.ownHostname}</th>
                      <th>{report.rivalHostname}</th>
                      <th>Edge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.dimensions.map((dim) => (
                      <tr key={dim.id}>
                        <td style={{ fontWeight: 600 }}>{dim.label}</td>
                        <td className="vs-mono" style={{ fontSize: '12.5px' }}>
                          {dim.ownValue}
                        </td>
                        <td className="vs-mono" style={{ fontSize: '12.5px' }}>
                          {dim.rivalValue}
                        </td>
                        <td>
                          {dim.winner === 'own' ? (
                            <StatusBadge tone="pass">
                              {report.ownHostname.toUpperCase()}
                            </StatusBadge>
                          ) : dim.winner === 'rival' ? (
                            <StatusBadge tone="warn">
                              {report.rivalHostname.toUpperCase()}
                            </StatusBadge>
                          ) : (
                            <StatusBadge>TIE</StatusBadge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Priority Overtake Action Plan + Redacted Prompt Preview */}
          <div className="vs-bezel">
            <div className="vs-card" style={{ padding: '20px 22px' }}>
              <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
                PRIORITY ENGINEERING &amp; CONTENT GAPS TO CLOSE
              </div>
              <h3 style={{ fontSize: '17px', margin: '0 0 12px 0' }}>
                How {report.trailingBrandName} ({report.trailingHostname}) overtakes{' '}
                {report.leadingBrandName} ({report.leadingHostname})
              </h3>
              <ul
                style={{
                  margin: '0 0 18px 0',
                  paddingLeft: '20px',
                  display: 'grid',
                  gap: '8px',
                  fontSize: '13.5px',
                  color: 'var(--vs-ink-secondary)',
                  lineHeight: 1.55,
                }}
              >
                {report.overtakeActionPlan.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <CodeArtifactCard
                title={`1-Click Competitor Overtake Prompt Preview (${report.trailingHostname})`}
                fileHint="UNLOCK FULL PAYLOAD IN STEP 01 / 02"
                code={report.publicPromptTeaser}
              />
            </div>
          </div>

          {/* Conversion Handoff Band */}
          <div className="vs-bezel-obsidian">
            <div
              className="vs-card"
              style={{
                padding: '22px 24px',
                background: 'var(--vs-surface-warm)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '18px',
              }}
            >
              <div style={{ maxWidth: '560px' }}>
                <div className="vs-eyebrow" style={{ marginBottom: '5px' }}>
                  SHIP THE OVERTAKE BUNDLE FOR {report.trailingHostname.toUpperCase()}
                </div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '17px',
                    marginBottom: '6px',
                  }}
                >
                  Generate the full stack-tailored JSON-LD, /agents.md &amp; vs.-{report.leadingBrandName} comparison page
                </strong>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13.5px',
                    color: 'var(--vs-ink-secondary)',
                    lineHeight: 1.55,
                  }}
                >
                  Activate a $19 One-Time Audit Pass (100% credited toward $49
                  Starter or $99 Pro within 14 days), start a $0 7-day free
                  trial, or mint white-label client comparison briefs on Agency
                  ($249/mo).
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <a
                  href={`/api/checkout?plan=tripwire_19&cycle=one_time&domain=${encodeURIComponent(
                    report.trailingHostname
                  )}&env=${encodeURIComponent(report.trailingRecommendedEnv)}`}
                  className="vs-btn"
                >
                  Activate $19 Overtake Pass →
                </a>
                <a
                  href={`/api/checkout?plan=pro_99&cycle=monthly&domain=${encodeURIComponent(
                    report.trailingHostname
                  )}&env=${encodeURIComponent(report.trailingRecommendedEnv)}`}
                  className="vs-btn vs-btn-secondary"
                >
                  Start 7-Day Trial ($0 Today) →
                </a>
                <Link
                  href={`/agencies?domain=${encodeURIComponent(
                    report.trailingHostname
                  )}#sandbox`}
                  className="vs-btn vs-btn-secondary"
                >
                  White-Label Client Sandbox →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
