'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import type { ReadinessScanSummary } from '@verisource/core-geo';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';

const INITIAL_AUREA_PREVIEW: ReadinessScanSummary = {
  domainUrl: 'https://aurearoasters.com',
  hostname: 'aurearoasters.com',
  brandName: 'Aurea Coffee Roasters',
  industryVertical: 'shopify_commerce',
  visibilityScore: 92,
  accuracyScore: 96,
  isShopify: true,
  shopifyMcpStatus: 'ucp_active',
  agentsMdStatus: 'custom_enriched',
  llmsTxtStatus: 'present',
  robotsAiBotStatus: {
    GPTBot: true,
    'OAI-SearchBot': true,
    PerplexityBot: true,
    ClaudeBot: true,
    'Google-Extended': true,
    waf_blocked: false,
  },
  jsonLdCount: 7,
  samplePromptResult: {
    promptText:
      'Best luxury Catholic or saint-inspired specialty coffee gifts online',
    aiEngine: 'chatgpt',
    brandMentioned: true,
    competitorsMentioned: [
      'Guadalupe Roasters',
      'Catholic Coffee',
      'Mystic Monk Coffee',
    ],
    citedSourceUrlsBlurred: [
      'https://reddit.com/••••••-locked-citation',
      'https://aurearoasters.com/••••••-locked-citation',
    ],
    hallucinationDetected: false,
    fanoutTelemetryType: 'observed_query',
    decompiledFanoutQueries: [
      'luxury Catholic specialty coffee gifts single origin',
      'saint inspired coffee roasters whole bean gift box',
    ],
  },
  upgradeUrl: '/pricing?domain=aurearoasters.com',
};

export function PublicGraderClient(): React.ReactElement {
  const [domainInput, setDomainInput] = useState('aurearoasters.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReadinessScanSummary>(
    INITIAL_AUREA_PREVIEW
  );

  async function runScan(targetDomain: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/grader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: targetDomain }),
      });
      const data = (await res.json()) as ReadinessScanSummary & {
        error?: string;
        message?: string;
      };
      if (!res.ok || data.error) {
        setError(data.message ?? 'Unable to scan that domain.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error while probing domain.');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runScan(domainInput);
  };

  return (
    <div id="grader" className="vs-card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          padding: '15px 20px',
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
            FREE INSTANT WEBSITE &amp; AI READINESS CHECK
          </div>
          <div
            style={{
              fontSize: '12.5px',
              color: 'var(--vs-ink-muted)',
              marginTop: '2px',
            }}
          >
            Checks whether ChatGPT, Gemini, and Perplexity bots can read your
            site and verify your real prices.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
            Try a live store:
          </span>
          <button
            type="button"
            className="vs-btn vs-btn-secondary"
            style={{ padding: '5px 10px', fontSize: '12px' }}
            onClick={() => {
              setDomainInput('aurearoasters.com');
              void runScan('aurearoasters.com');
            }}
          >
            aurearoasters.com
          </button>
          <button
            type="button"
            className="vs-btn vs-btn-secondary"
            style={{ padding: '5px 10px', fontSize: '12px' }}
            onClick={() => {
              setDomainInput('mosaicroasters.com');
              void runScan('mosaicroasters.com');
            }}
          >
            mosaicroasters.com
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="vs-grader-form">
        <input
          type="text"
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          placeholder="Type your website (e.g. yourcompany.com or mosaicroasters.com)"
          className="vs-input"
          aria-label="Target domain to audit"
        />
        <button
          type="submit"
          disabled={loading}
          className="vs-btn"
          style={{ whiteSpace: 'nowrap', padding: '10px 22px' }}
        >
          {loading ? 'Scanning Live...' : 'Run Free Audit'}
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
            sublabel={`Overall AI readiness for ${result.hostname}`}
          />
        </div>
        <div>
          <MetricLedgerCell
            label="Fact Accuracy"
            value={`${result.accuracyScore}%`}
            tone={result.accuracyScore < 80 ? 'critical' : 'pass'}
            sublabel={
              result.samplePromptResult.hallucinationDetected
                ? 'Wrong price or policy flagged in sample'
                : 'Prices & policies match your site'
            }
          />
        </div>
        <div>
          <MetricLedgerCell
            label="AI Rulebook (/agents.md)"
            value={
              result.agentsMdStatus === 'custom_enriched'
                ? 'VERIFIED'
                : result.agentsMdStatus === 'default_boilerplate'
                  ? 'GENERIC'
                  : 'MISSING'
            }
            tone={
              result.agentsMdStatus === 'custom_enriched'
                ? 'pass'
                : result.agentsMdStatus === 'default_boilerplate'
                  ? 'warn'
                  : 'critical'
            }
            sublabel={
              result.llmsTxtStatus === 'present'
                ? 'AI summary file (/llms.txt) found'
                : 'No /llms.txt summary file yet'
            }
          />
        </div>
        <div>
          <MetricLedgerCell
            label={result.isShopify ? 'Shopify AI Catalog' : 'Structured Fact Code'}
            value={
              result.isShopify
                ? result.shopifyMcpStatus === 'ucp_active'
                  ? 'UCP READY'
                  : result.shopifyMcpStatus === 'legacy_mcp_active'
                    ? 'LEGACY MCP'
                    : 'OFF'
                : `${result.jsonLdCount} BLOCKS`
            }
            tone={
              result.isShopify
                ? result.shopifyMcpStatus === 'ucp_active'
                  ? 'pass'
                  : 'warn'
                : result.jsonLdCount > 0
                  ? 'pass'
                  : 'critical'
            }
            sublabel={
              result.isShopify
                ? `${result.jsonLdCount} JSON-LD fact node(s) on page`
                : 'Machine-readable JSON-LD facts'
            }
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
          CAN AI BOTS READ YOUR SITE?
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
          <StatusBadge tone="critical">FIREWALL BLOCKING AI</StatusBadge>
        ) : (
          <StatusBadge tone="pass">NO FIREWALL BLOCKS</StatusBadge>
        )}
      </div>

      <div style={{ padding: '18px 20px' }}>
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
            SAMPLE BUYER QUESTION ({result.samplePromptResult.aiEngine.toUpperCase()})
          </div>
          <StatusBadge
            tone={
              result.samplePromptResult.fanoutTelemetryType &&
              result.samplePromptResult.fanoutTelemetryType !== 'mock_fixture'
                ? 'pass'
                : 'neutral'
            }
          >
            {result.samplePromptResult.fanoutTelemetryType === 'observed_query'
              ? 'LIVE WEB SEARCH · FANOUT OBSERVED'
              : result.samplePromptResult.fanoutTelemetryType ===
                  'cited_source_only'
                ? 'LIVE WEB SEARCH · CITED'
                : 'SAMPLE SNAPSHOT'}
          </StatusBadge>
        </div>
        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '12px' }}>
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
              Competitors AI Recommends Alongside {result.brandName}:
            </div>
            <div style={{ color: 'var(--vs-ink-secondary)' }}>
              {result.samplePromptResult.competitorsMentioned.join(' · ') ||
                'Category directories'}
            </div>
            {result.samplePromptResult.decompiledFanoutQueries &&
            result.samplePromptResult.decompiledFanoutQueries.length > 0 ? (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontWeight: 600, marginBottom: '3px', fontSize: '12px' }}>
                  Observed AI Search Sub-Queries:
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
              Websites Feeding Those AI Answers:
            </div>
            <div className="vs-mono" style={{ fontSize: '12px' }}>
              {result.samplePromptResult.citedSourceUrlsBlurred.map((u, idx) => (
                <div key={idx} style={{ marginBottom: '2px' }}>
                  {u.split('/••••••')[0]}/
                  <span className="vs-blur-token">exact-thread-slug-locked</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
            Reveal every exact source link, full 3-engine fact checks, and
            copy-paste <code className="vs-mono">JSON-LD</code> +{' '}
            <code className="vs-mono">/agents.md</code> fixes.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link
              href={`/pricing?plan=tripwire_19&domain=${encodeURIComponent(
                result.hostname
              )}`}
              className="vs-btn"
            >
              Get Full Audit + Fixes — $19 One-Time
            </Link>
            <Link
              href={`/dashboard?domain=${encodeURIComponent(result.hostname)}`}
              className="vs-btn vs-btn-secondary"
            >
              Open Guided Console →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
