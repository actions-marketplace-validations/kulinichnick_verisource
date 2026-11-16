'use client';

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import {
  buildPlainEnglishSiteDiagnosis,
  type ReadinessScanSummary,
} from '@verisource/core-geo';
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
      ? 'BLANK TO AI'
      : readabilityStatus === 'low_signal_bloat'
        ? 'NEEDS CLEANUP'
        : 'READABLE';
  const readabilityTone =
    readabilityStatus === 'csr_js_trap'
      ? 'critical'
      : readabilityStatus === 'low_signal_bloat'
        ? 'warn'
        : 'pass';

  const plainDiagnosis = result
    ? buildPlainEnglishSiteDiagnosis({
        brandName: result.brandName,
        hostname: result.hostname,
        visibilityScore: result.visibilityScore,
        accuracyScore: result.accuracyScore,
        robotsAiBotStatus: result.robotsAiBotStatus,
        llmsTxtStatus: result.llmsTxtStatus,
        agentsMdStatus: result.agentsMdStatus,
        jsonLdCount: result.jsonLdCount,
        isShopify: result.isShopify,
        shopifyMcpStatus: result.shopifyMcpStatus,
        crawlerReadability: result.crawlerReadability,
        hallucinationCount: result.samplePromptResult.hallucinationDetected
          ? 1
          : 0,
        brandMentionedInSample: result.samplePromptResult.brandMentioned,
        topRivals: result.samplePromptResult.competitorsMentioned,
      })
    : null;

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
            FREE AI SEARCH &amp; AGENT READINESS AUDIT (EASY-TO-USE ACTION PLAN)
          </div>
          <div
            style={{
              fontSize: '12.5px',
              color: 'var(--vs-ink-muted)',
              marginTop: '2px',
            }}
          >
            Enter your website to see why AI skips your business—and get a
            1-click prompt for your AI tool to fix it.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge tone="pass">NO ACCOUNT REQUIRED</StatusBadge>
          <StatusBadge>60-SECOND LIVE SCAN</StatusBadge>
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
          style={{ padding: '10px 24px', flexShrink: 0 }}
        >
          {loading ? 'Scanning Your Website...' : 'Run Free AI Audit →'}
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
              01 · DOES AI RECOMMEND YOU?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
              Checks whether ChatGPT, Perplexity, and Gemini name your business
              or send buyers to competitors instead.
            </div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              02 · ARE YOUR PRICES RIGHT?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
              Spots where AI invents outdated prices, wrong policies, or
              missing services that cost you leads.
            </div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              03 · CAN AI READ YOUR SITE?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
              Tests whether AI search bots are blocked by your firewall or
              stuck on blank JavaScript pages.
            </div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              04 · 1-CLICK PROMPT FOR YOUR AI
            </div>
            <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
              Prepares one ready-made prompt you paste into Claude, ChatGPT,
              Antigravity, or Cursor to fix your site.
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
                sublabel={`How often AI recommends ${result.brandName}`}
              />
            </div>
            <div>
              <MetricLedgerCell
                label="Price & Fact Accuracy"
                value={`${result.accuracyScore}%`}
                tone={result.accuracyScore < 80 ? 'critical' : 'pass'}
                sublabel={
                  result.samplePromptResult.hallucinationDetected
                    ? 'Wrong AI claim spotted in buyer check'
                    : 'No wrong pricing in sample check'
                }
              />
            </div>
            <div>
              <MetricLedgerCell
                label="Can AI Bots Read It?"
                value={readabilityBadge}
                tone={readabilityTone}
                sublabel={
                  result.crawlerReadability
                    ? `AI bots read ${result.crawlerReadability.visibleWordCount.toLocaleString('en-US')} words on homepage`
                    : 'Homepage text readability checked'
                }
              />
            </div>
            <div>
              <MetricLedgerCell
                label="AI Fact-Sheet Files"
                value={
                  result.agentsMdStatus === 'custom_enriched' &&
                  result.llmsTxtStatus === 'present' &&
                  result.jsonLdCount >= 2
                    ? 'COMPLETE'
                    : result.agentsMdStatus === 'default_boilerplate' ||
                        result.llmsTxtStatus === 'present' ||
                        result.jsonLdCount >= 1
                      ? 'PARTIAL'
                      : 'MISSING'
                }
                tone={
                  result.agentsMdStatus === 'custom_enriched' &&
                  result.llmsTxtStatus === 'present' &&
                  result.jsonLdCount >= 2
                    ? 'pass'
                    : result.agentsMdStatus === 'default_boilerplate' ||
                        result.llmsTxtStatus === 'present' ||
                        result.jsonLdCount >= 1
                      ? 'warn'
                      : 'critical'
                }
                sublabel={`Schema (${result.jsonLdCount}) · /llms.txt ${
                  result.llmsTxtStatus === 'present' ? 'live' : 'missing'
                } · /agents.md ${
                  result.agentsMdStatus === 'custom_enriched'
                    ? 'live'
                    : 'missing'
                }`}
              />
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            {/* 1. Plain-English Site Diagnosis: What Needs to Be Fixed & Why */}
            {plainDiagnosis ? (
              <div
                style={{
                  marginBottom: '18px',
                  border: '1px solid var(--vs-border)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                }}
              >
                <div
                  style={{
                    padding: '13px 16px',
                    background: 'var(--vs-surface-warm)',
                    borderBottom: '1px solid var(--vs-border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div
                      className="vs-eyebrow"
                      style={{ color: 'var(--vs-ink)', marginBottom: '2px' }}
                    >
                      SITE DIAGNOSIS &amp; ACTION PLAN · WHAT NEEDS TO BE FIXED ON{' '}
                      {result.hostname.toUpperCase()}
                    </div>
                    <strong style={{ fontSize: '14.5px' }}>
                      {plainDiagnosis.headline}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {result.detectedPlatformLabel ? (
                      <StatusBadge>
                        {`PLATFORM: ${result.detectedPlatformLabel.toUpperCase()}`}
                      </StatusBadge>
                    ) : null}
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
                      style={{ padding: '4px 10px', fontSize: '11.5px' }}
                    >
                      {loading ? 'Scanning...' : '↻ Re-Scan Live'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCopyScanLink()}
                      className="vs-btn vs-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11.5px' }}
                    >
                      {copiedScanLink ? '✓ Link Copied' : 'Share Audit Link'}
                    </button>
                  </div>
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {plainDiagnosis.issues.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '6px',
                          border: '1px solid var(--vs-border)',
                          background:
                            item.severity === 'fix_first'
                              ? 'var(--vs-crit-bg)'
                              : item.severity === 'healthy'
                                ? 'var(--vs-pass-bg)'
                                : 'var(--vs-surface-subtle)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '5px',
                          }}
                        >
                          <StatusBadge
                            tone={
                              item.severity === 'fix_first'
                                ? 'critical'
                                : item.severity === 'healthy'
                                  ? 'pass'
                                  : 'warn'
                            }
                          >
                            {item.badgeLabel}
                          </StatusBadge>
                          <strong style={{ fontSize: '13.5px' }}>
                            {idx + 1}. {item.whatIsWrong}
                          </strong>
                        </div>
                        <div
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--vs-ink-secondary)',
                            lineHeight: 1.5,
                            marginBottom: '4px',
                          }}
                        >
                          <strong style={{ color: 'var(--vs-ink)' }}>
                            Why this costs you customers:
                          </strong>{' '}
                          {item.whyItMatters}
                        </div>
                        <div
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--vs-ink-secondary)',
                            lineHeight: 1.5,
                          }}
                        >
                          <strong style={{ color: 'var(--vs-ink)' }}>
                            How you fix it (no coding):
                          </strong>{' '}
                          {item.howToFixPlain}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* 2. Prominent 1-Click AI Fix Prompt Push (Primary CTA) */}
            <div
              style={{
                marginBottom: '18px',
                border: '1px solid var(--vs-ink)',
                borderRadius: '8px',
                background: 'var(--vs-surface-warm)',
                padding: '16px 18px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div style={{ maxWidth: '670px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '5px',
                  }}
                >
                  <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                    RECOMMENDED FIX · COPY 1 PROMPT INTO YOUR OWN AI TOOL
                  </span>
                  <StatusBadge tone="pass">NO CODING NEEDED</StatusBadge>
                </div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '15.5px',
                    marginBottom: '5px',
                  }}
                >
                  {plainDiagnosis && plainDiagnosis.issueCount > 0
                    ? `Let your AI fix all ${plainDiagnosis.issueCount} issue${
                        plainDiagnosis.issueCount === 1 ? '' : 's'
                      } on ${result.hostname} automatically`
                    : `Generate vs.-Competitor pages & track 35+ buyer prompts for ${result.hostname}`}
                </strong>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--vs-ink-secondary)',
                    lineHeight: 1.55,
                  }}
                >
                  Inside your private Console, Verisource bundles every fix for{' '}
                  <strong style={{ color: 'var(--vs-ink)' }}>
                    {result.hostname}
                  </strong>{' '}
                  (<code className="vs-mono">JSON-LD</code> business &amp; FAQ
                  schema, <code className="vs-mono">/llms.txt</code>,{' '}
                  <code className="vs-mono">/agents.md</code>, and real pricing
                  rules) into <strong>one ready-made prompt</strong>. Copy it,
                  paste it into{' '}
                  <strong>
                    ChatGPT, Claude, Antigravity, Cursor, Lovable, or Shopify
                  </strong>
                  , and your AI updates your site for you.
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <Link
                  href={`/pricing?plan=pro_99&domain=${encodeURIComponent(
                    result.hostname
                  )}`}
                  className="vs-btn"
                >
                  Start 7-Day Free Trial &amp; Get My AI Prompt ($0 Today) →
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

            {/* 3. Sample Buyer Question Preview */}
            <div
              style={{
                marginBottom: '14px',
                padding: '14px 16px',
                border: '1px solid var(--vs-border)',
                borderRadius: '8px',
                background: '#FFFFFF',
              }}
            >
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
                  SAMPLE BUYER QUESTION CHECKED ON{' '}
                  {result.samplePromptResult.aiEngine.toUpperCase()} (1 OF 35+
                  IN CONSOLE)
                </div>
                <StatusBadge
                  tone={
                    result.samplePromptResult.brandMentioned ? 'pass' : 'warn'
                  }
                >
                  {result.samplePromptResult.brandMentioned
                    ? `${result.brandName.toUpperCase()} MENTIONED`
                    : `${result.brandName.toUpperCase()} LEFT OUT`}
                </StatusBadge>
              </div>

              <div
                style={{
                  fontWeight: 600,
                  fontSize: '14.5px',
                  marginBottom: '10px',
                }}
              >
                &ldquo;{result.samplePromptResult.promptText}&rdquo;
              </div>

              <div
                className="vs-grid-2"
                style={{
                  padding: '12px 14px',
                  border: '1px solid var(--vs-border)',
                  borderRadius: '6px',
                  background: 'var(--vs-surface-subtle)',
                  fontSize: '13px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    Competitors AI Recommends Instead / Alongside You:
                  </div>
                  <div style={{ color: 'var(--vs-ink-secondary)' }}>
                    {result.samplePromptResult.competitorsMentioned.join(
                      ' · '
                    ) || 'Category peers & review directories'}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    Articles &amp; Threads AI Trusted (Full URLs in Console):
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
            </div>

            {/* 4. Optional Progressive Disclosure for Raw Bot & Developer Telemetry */}
            <details className="vs-disclosure">
              <summary className="vs-disclosure-summary">
                <div>
                  <strong style={{ fontSize: '13px', display: 'block' }}>
                    Technical Developer Details (AI Bot HTTP Status &amp; HTML
                    Readability)
                  </strong>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--vs-ink-secondary)',
                    }}
                  >
                    Optional — raw crawler checks for engineers (already
                    summarized in your action plan above).
                  </span>
                </div>
                <span className="vs-disclosure-pill">Details</span>
              </summary>

              <div className="vs-disclosure-body">
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: result.crawlerReadability ? '12px' : 0,
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
                      [
                        'OAI-SearchBot',
                        result.robotsAiBotStatus['OAI-SearchBot'],
                      ],
                      ['PerplexityBot', result.robotsAiBotStatus.PerplexityBot],
                      ['ClaudeBot', result.robotsAiBotStatus.ClaudeBot],
                    ] as const
                  ).map(([bot, allowed]) => (
                    <StatusBadge key={bot} tone={allowed ? 'pass' : 'critical'}>
                      {bot}: {allowed ? '200 ALLOWED' : '403 BLOCKED'}
                    </StatusBadge>
                  ))}
                  {result.robotsAiBotStatus.waf_blocked ? (
                    <StatusBadge tone="critical">
                      WAF CHALLENGE DETECTED
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="pass">NO WAF BLOCKS</StatusBadge>
                  )}
                  {result.isShopify ? (
                    <StatusBadge
                      tone={
                        result.shopifyMcpStatus === 'ucp_active'
                          ? 'pass'
                          : 'warn'
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

                {result.crawlerReadability ? (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid var(--vs-border)',
                      background: 'var(--vs-surface-subtle)',
                      fontSize: '12.5px',
                      color: 'var(--vs-ink-secondary)',
                    }}
                  >
                    <strong style={{ color: 'var(--vs-ink)' }}>
                      Server HTML Readability:
                    </strong>{' '}
                    {result.crawlerReadability.summary}
                  </div>
                ) : null}
              </div>
            </details>
          </div>
        </>
      )}
    </div>
  );
}
