'use client';

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import type { ReadinessScanSummary } from '@verisource/core-geo';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';

function extractSafeGraderHostname(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0]
    ?.trim();
  if (!cleaned || cleaned.length < 4 || cleaned.length > 120) return null;
  if (
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
      cleaned
    )
  ) {
    return null;
  }
  return cleaned;
}

export function PublicGraderClient(): React.ReactElement {
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReadinessScanSummary | null>(null);
  const [cached24h, setCached24h] = useState<boolean | null>(null);
  const [copiedScanLink, setCopiedScanLink] = useState(false);
  const autoScannedRef = useRef(false);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function runScan(targetDomain: string, forceRefresh = false) {
    const trimmed = targetDomain.trim();
    if (!trimmed) {
      setError('Enter your website domain (for example, yourcompany.com).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/grader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: trimmed, forceRefresh }),
      });
      const data = (await res.json()) as ReadinessScanSummary & {
        cached24h?: boolean;
        error?: string;
        message?: string;
      };
      if (!res.ok || data.error) {
        setError(data.message ?? 'Unable to scan that domain.');
      } else {
        setResult(data);
        setCached24h(Boolean(data.cached24h));
      }
    } catch {
      setError('Network error while probing domain.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoScannedRef.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const candidate = extractSafeGraderHostname(params.get('domain'));
    if (!candidate) return;
    autoScannedRef.current = true;
    setDomainInput(candidate);
    const el = document.getElementById('grader');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    void runScan(candidate);
  }, []);

  async function handleCopyScanLink() {
    if (!result) return;
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://verisource.dev';
    const shareUrl = `${origin}/?domain=${encodeURIComponent(
      result.hostname
    )}#grader`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopiedScanLink(true);
      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current);
      }
      copyResetTimerRef.current = setTimeout(() => {
        setCopiedScanLink(false);
      }, 2200);
    } catch {
      // Ignore clipboard permission denial
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runScan(domainInput);
  };

  const readabilityStatus = result?.crawlerReadability?.status ?? 'ssr_clean';
  const readabilityBadge =
    readabilityStatus === 'csr_js_trap'
      ? 'JS SHELL TRAP'
      : readabilityStatus === 'low_signal_bloat'
        ? 'HTML BLOAT'
        : 'SSR CLEAN';
  const readabilityTone =
    readabilityStatus === 'csr_js_trap'
      ? 'critical'
      : readabilityStatus === 'low_signal_bloat'
        ? 'warn'
        : 'pass';

  return (
    <div id="grader" className="vs-card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--vs-border)',
          background: 'var(--vs-surface-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <div className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
            FREE AI SEARCH &amp; AGENT READINESS AUDIT (LIMITED PREVIEW)
          </div>
          <div
            style={{
              fontSize: '12.5px',
              color: 'var(--vs-ink-muted)',
              marginTop: '2px',
            }}
          >
            Enter your company domain to test live AI bot access, JS crawler
            readability, and a sample buyer shortlist prompt.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge tone="pass">NO ACCOUNT REQUIRED</StatusBadge>
          <StatusBadge>LIVE HTTP + AI PROBE</StatusBadge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="vs-grader-form">
        <input
          type="text"
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          placeholder="Enter your website domain (e.g. yourcompany.com)"
          className="vs-input"
          aria-label="Your website domain to audit"
        />
        <button
          type="submit"
          disabled={loading}
          className="vs-btn"
          style={{ whiteSpace: 'nowrap', padding: '10px 24px' }}
        >
          {loading ? 'Running Live Audit...' : 'Run Free AI Audit →'}
        </button>
      </form>

      {error ? (
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--vs-crit-bg)',
            color: 'var(--vs-crit-fg)',
            borderBottom: '1px solid var(--vs-crit-border)',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      ) : null}

      {!result ? (
        <div
          className="vs-ledger-strip-4"
          style={{ background: 'var(--vs-surface-warm)' }}
        >
          <div style={{ padding: '16px 18px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              01 · AI VISIBILITY SCORE
            </div>
            <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
              Measures how ChatGPT, Perplexity, and Gemini shortlist your brand
              against category competitors.
            </div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              02 · BOT &amp; WAF ACCESS
            </div>
            <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
              Tests live HTTP responses for{' '}
              <code className="vs-mono">GPTBot</code>,{' '}
              <code className="vs-mono">OAI-SearchBot</code>,{' '}
              <code className="vs-mono">PerplexityBot</code>, and{' '}
              <code className="vs-mono">ClaudeBot</code>.
            </div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              03 · JS CRAWLER READABILITY
            </div>
            <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
              Detects empty client-side React/SPA shells that non-JS AI crawlers
              skip during retrieval.
            </div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              04 · AGENT PROTOCOL FEEDS
            </div>
            <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
              Inspects <code className="vs-mono">JSON-LD</code>,{' '}
              <code className="vs-mono">/llms.txt</code>,{' '}
              <code className="vs-mono">/agents.md</code>, and Shopify{' '}
              <code className="vs-mono">/api/ucp/mcp</code>.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className="vs-ledger-strip-4"
            style={{ borderBottom: '1px solid var(--vs-border)' }}
          >
            <div>
              <MetricLedgerCell
                label="AI Visibility Score"
                value={result.visibilityScore}
                suffix="/ 100"
                tone={result.visibilityScore < 50 ? 'warn' : 'pass'}
                sublabel={`Readiness baseline for ${result.hostname}`}
              />
            </div>
            <div>
              <MetricLedgerCell
                label="Fact Accuracy"
                value={`${result.accuracyScore}%`}
                tone={result.accuracyScore < 80 ? 'critical' : 'pass'}
                sublabel={
                  result.samplePromptResult.hallucinationDetected
                    ? 'Claim mismatch detected in sample prompt'
                    : 'No pricing mismatch in sample prompt'
                }
              />
            </div>
            <div>
              <MetricLedgerCell
                label="Crawler Readability"
                value={readabilityBadge}
                tone={readabilityTone}
                sublabel={
                  result.crawlerReadability
                    ? `${result.crawlerReadability.visibleWordCount.toLocaleString('en-US')} words · ~${result.crawlerReadability.estimatedTokens.toLocaleString('en-US')} tokens`
                    : 'Server-rendered HTML inspected'
                }
              />
            </div>
            <div>
              <MetricLedgerCell
                label="AI Protocol Feeds"
                value={
                  result.agentsMdStatus === 'custom_enriched'
                    ? 'VERIFIED'
                    : result.agentsMdStatus === 'default_boilerplate'
                      ? 'BOILERPLATE'
                      : 'MISSING'
                }
                tone={
                  result.agentsMdStatus === 'custom_enriched'
                    ? 'pass'
                    : result.agentsMdStatus === 'default_boilerplate'
                      ? 'warn'
                      : 'critical'
                }
                sublabel={`${result.jsonLdCount} JSON-LD · /llms.txt ${
                  result.llmsTxtStatus === 'present' ? 'present' : 'missing'
                }`}
              />
            </div>
          </div>

          <div
            style={{
              padding: '13px 20px',
              borderBottom: '1px solid var(--vs-border)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              className="vs-mono"
              style={{
                fontSize: '11.5px',
                color: 'var(--vs-ink-muted)',
                marginRight: '4px',
              }}
            >
              LIVE AI BOT ACCESS:
            </span>
            {(
              [
                ['GPTBot', result.robotsAiBotStatus.GPTBot],
                ['OAI-SearchBot', result.robotsAiBotStatus['OAI-SearchBot']],
                ['PerplexityBot', result.robotsAiBotStatus.PerplexityBot],
                ['ClaudeBot', result.robotsAiBotStatus.ClaudeBot],
              ] as const
            ).map(([bot, allowed]) => (
              <StatusBadge key={bot} tone={allowed ? 'pass' : 'critical'}>
                {bot}: {allowed ? '200 ALLOWED' : '403 BLOCKED'}
              </StatusBadge>
            ))}
            {result.robotsAiBotStatus.waf_blocked ? (
              <StatusBadge tone="critical">WAF CHALLENGE DETECTED</StatusBadge>
            ) : (
              <StatusBadge tone="pass">NO WAF BLOCKS</StatusBadge>
            )}
            {result.isShopify ? (
              <StatusBadge
                tone={
                  result.shopifyMcpStatus === 'ucp_active' ? 'pass' : 'warn'
                }
              >
                SHOPIFY:{' '}
                {result.shopifyMcpStatus === 'ucp_active'
                  ? 'UCP /API/UCP/MCP'
                  : result.shopifyMcpStatus === 'legacy_mcp_active'
                    ? 'LEGACY /API/MCP'
                    : 'CATALOG FEED OFF'}
              </StatusBadge>
            ) : null}
          </div>

          <div style={{ padding: '18px 20px' }}>
            {result.crawlerReadability ? (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--vs-border)',
                  background: 'var(--vs-surface-subtle)',
                  fontSize: '12.5px',
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                <strong style={{ color: 'var(--vs-ink)' }}>
                  Agent Readability Check:
                </strong>{' '}
                {result.crawlerReadability.summary}
              </div>
            ) : null}

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px',
              }}
            >
              <div className="vs-eyebrow">
                FREE PREVIEW · 1 OF 35+ BUYER PROMPTS (
                {result.samplePromptResult.aiEngine.toUpperCase()})
              </div>
              <StatusBadge
                tone={
                  result.samplePromptResult.fanoutTelemetryType &&
                  result.samplePromptResult.fanoutTelemetryType !==
                    'mock_fixture'
                    ? 'pass'
                    : 'neutral'
                }
              >
                {result.samplePromptResult.fanoutTelemetryType ===
                'observed_query'
                  ? 'LIVE WEB SEARCH · FANOUT OBSERVED'
                  : result.samplePromptResult.fanoutTelemetryType ===
                      'cited_source_only'
                    ? 'LIVE WEB SEARCH · CITED'
                    : 'SAMPLE SNAPSHOT'}
              </StatusBadge>
              {cached24h !== null ? (
                <StatusBadge tone={cached24h ? 'neutral' : 'pass'}>
                  {cached24h ? '24H CACHE' : 'FRESH LIVE SCAN'}
                </StatusBadge>
              ) : null}
              <button
                type="button"
                disabled={loading}
                onClick={() => void runScan(result.hostname, true)}
                className="vs-btn vs-btn-secondary"
                style={{ padding: '3px 9px', fontSize: '11.5px' }}
              >
                {loading ? 'Probing...' : '↻ Re-Scan Live'}
              </button>
              <button
                type="button"
                onClick={() => void handleCopyScanLink()}
                className="vs-btn vs-btn-secondary"
                style={{ padding: '3px 9px', fontSize: '11.5px' }}
              >
                {copiedScanLink ? '✓ Link Copied' : 'Copy Audit Link'}
              </button>
            </div>

            <div
              style={{
                fontWeight: 600,
                fontSize: '15px',
                marginBottom: '12px',
              }}
            >
              &ldquo;{result.samplePromptResult.promptText}&rdquo;
            </div>

            <div
              className="vs-grid-2"
              style={{
                padding: '14px 16px',
                border: '1px solid var(--vs-border)',
                borderRadius: '6px',
                background: 'var(--vs-surface-warm)',
                fontSize: '13px',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                  Competitors AI Shortlists Alongside {result.brandName}:
                </div>
                <div style={{ color: 'var(--vs-ink-secondary)' }}>
                  {result.samplePromptResult.competitorsMentioned.join(' · ') ||
                    'Category peers & directories'}
                </div>
                {result.samplePromptResult.decompiledFanoutQueries &&
                result.samplePromptResult.decompiledFanoutQueries.length > 0 ? (
                  <div style={{ marginTop: '10px' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: '3px',
                        fontSize: '12px',
                      }}
                    >
                      Observed Engine Sub-Queries:
                    </div>
                    {result.samplePromptResult.decompiledFanoutQueries
                      .slice(0, 2)
                      .map((q) => (
                        <div
                          key={q}
                          className="vs-mono"
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--vs-ink-secondary)',
                            marginBottom: '2px',
                          }}
                        >
                          → {q}
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                  Cited Source URLs (Console Required):
                </div>
                <div className="vs-mono" style={{ fontSize: '12px' }}>
                  {result.samplePromptResult.citedSourceUrlsBlurred.map(
                    (u, idx) => (
                      <div key={idx} style={{ marginBottom: '2px' }}>
                        {u.split('/••••••')[0]}/
                        <span className="vs-blur-token">
                          exact-source-path-redacted
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Locked Subscriber Console Modules Preview */}
            <div
              style={{
                marginTop: '16px',
                border: '1px solid var(--vs-border)',
                borderRadius: '6px',
                background: '#FFFFFF',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--vs-border)',
                  background: 'var(--vs-surface-subtle)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                  GATED IN SUBSCRIBER ADMIN CONSOLE FOR{' '}
                  {result.hostname.toUpperCase()}
                </span>
                <StatusBadge tone="warn">SUBSCRIBER ACCESS REQUIRED</StatusBadge>
              </div>

              <div className="vs-grid-2" style={{ padding: '14px 16px', gap: '12px' }}>
                <div style={{ fontSize: '12.5px' }}>
                  <strong>1. 3-Engine Sentiment &amp; Rival Share-of-Voice</strong>
                  <div style={{ color: 'var(--vs-ink-secondary)', marginTop: '2px' }}>
                    Full ChatGPT, Gemini &amp; Perplexity Mention vs. Citation Rate
                    + Brand Truth Watchdog for {result.brandName}.
                  </div>
                </div>
                <div style={{ fontSize: '12.5px' }}>
                  <strong>2. 8+ Auto-Suggested Buyer Funnel Prompts</strong>
                  <div style={{ color: 'var(--vs-ink-secondary)', marginTop: '2px' }}>
                    1-click Unbranded Discovery, Comparison, Pricing &amp; Branded
                    prompts tailored to {result.hostname}.
                  </div>
                </div>
                <div style={{ fontSize: '12.5px' }}>
                  <strong>3. Unredacted Reddit, G2 &amp; Editorial URLs</strong>
                  <div style={{ color: 'var(--vs-ink-secondary)', marginTop: '2px' }}>
                    Every exact competitor-feeding article + fact-verified
                    editorial outreach notes.
                  </div>
                </div>
                <div style={{ fontSize: '12.5px' }}>
                  <strong>4. 1-Click AI Fix Prompt + Verified Code</strong>
                  <div style={{ color: 'var(--vs-ink-secondary)', marginTop: '2px' }}>
                    Copy one tailored prompt into Claude, ChatGPT, Antigravity,
                    or Cursor to fix every issue on {result.hostname}{' '}
                    automatically.
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderTop: '1px solid var(--vs-border)',
                  background: 'var(--vs-surface-warm)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
                  Try the private Admin Console on{' '}
                  <strong style={{ color: 'var(--vs-ink)' }}>
                    {result.hostname}
                  </strong>{' '}
                  free for 7 days ($0.00 due today · cancel in 1 click), or grab
                  a $19 one-time pass with zero recurring billing.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <Link
                    href={`/pricing?plan=pro_99&domain=${encodeURIComponent(
                      result.hostname
                    )}`}
                    className="vs-btn"
                  >
                    Start 7-Day Free Trial ($0 Today) →
                  </Link>
                  <Link
                    href={`/pricing?plan=tripwire_19&domain=${encodeURIComponent(
                      result.hostname
                    )}`}
                    className="vs-btn vs-btn-secondary"
                  >
                    Or $19 One-Time Audit Pass
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
