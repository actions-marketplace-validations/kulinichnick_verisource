'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import type { ReadinessScanSummary } from '@verisource/core-geo';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';

const INITIAL_AUREA_PREVIEW: ReadinessScanSummary = {
  domainUrl: 'https://aurearoasters.com',
  hostname: 'aurearoasters.com',
  brandName: 'Aurea Coffee Roasters',
  visibilityScore: 41,
  accuracyScore: 68,
  isShopify: true,
  shopifyMcpStatus: 'ucp_active',
  agentsMdStatus: 'default_boilerplate',
  llmsTxtStatus: 'missing',
  robotsAiBotStatus: {
    GPTBot: true,
    'OAI-SearchBot': true,
    PerplexityBot: true,
    ClaudeBot: true,
    'Google-Extended': true,
    waf_blocked: false,
  },
  jsonLdCount: 1,
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
    hallucinationDetected: true,
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
          <span
            className="vs-mono"
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            LIVE AI READINESS &amp; PROTOCOL GRADER
          </span>
          <span
            style={{
              fontSize: '12.5px',
              color: 'var(--vs-ink-muted)',
              marginLeft: '10px',
            }}
          >
            Probes robots.txt, simulated GPTBot/PerplexityBot WAF headers, /agents.md, and Shopify UCP.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
            Patient Zero presets:
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

      <form
        onSubmit={handleSubmit}
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--vs-border)',
          display: 'flex',
          gap: '10px',
        }}
      >
        <input
          type="text"
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          placeholder="Enter any domain (e.g. mosaicroasters.com or yourcompany.com)"
          className="vs-input"
          aria-label="Target domain to audit"
        />
        <button
          type="submit"
          disabled={loading}
          className="vs-btn"
          style={{ whiteSpace: 'nowrap', padding: '10px 20px' }}
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
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          borderBottom: '1px solid var(--vs-border)',
        }}
      >
        <div style={{ borderRight: '1px solid var(--vs-border)' }}>
          <MetricLedgerCell
            label="AI Visibility Score"
            value={result.visibilityScore}
            suffix="/ 100"
            tone={result.visibilityScore < 50 ? 'warn' : 'pass'}
            sublabel={result.hostname}
          />
        </div>
        <div style={{ borderRight: '1px solid var(--vs-border)' }}>
          <MetricLedgerCell
            label="Brand Truth Accuracy"
            value={`${result.accuracyScore}%`}
            tone={result.accuracyScore < 80 ? 'critical' : 'pass'}
            sublabel={
              result.samplePromptResult.hallucinationDetected
                ? 'Hallucination flagged in sample'
                : 'No pricing conflict in sample'
            }
          />
        </div>
        <div style={{ borderRight: '1px solid var(--vs-border)' }}>
          <MetricLedgerCell
            label="/agents.md Status"
            value={
              result.agentsMdStatus === 'custom_enriched'
                ? 'CUSTOM'
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
            sublabel={
              result.llmsTxtStatus === 'present'
                ? '/llms.txt present'
                : '/llms.txt missing (404)'
            }
          />
        </div>
        <div>
          <MetricLedgerCell
            label={result.isShopify ? 'Shopify MCP / UCP' : 'JSON-LD Graph'}
            value={
              result.isShopify
                ? result.shopifyMcpStatus === 'ucp_active'
                  ? 'UCP ACTIVE'
                  : result.shopifyMcpStatus === 'legacy_mcp_active'
                    ? 'LEGACY MCP'
                    : 'UNAVAILABLE'
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
                ? 'Storefront catalog protocol'
                : 'Schema.org entities on /'
            }
          />
        </div>
      </div>

      <div
        style={{
          padding: '14px 20px',
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
            marginRight: '6px',
          }}
        >
          BOT &amp; WAF ACCESS:
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
          <StatusBadge tone="critical">
            EDGE WAF CHALLENGE DETECTED
          </StatusBadge>
        ) : (
          <StatusBadge tone="pass">EDGE WAF CLEAR</StatusBadge>
        )}
      </div>

      <div style={{ padding: '18px 20px' }}>
        <div
          className="vs-mono"
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            color: 'var(--vs-ink-muted)',
            marginBottom: '6px',
          }}
        >
          SAMPLE BUYER PROMPT ({result.samplePromptResult.aiEngine.toUpperCase()})
        </div>
        <div style={{ fontWeight: 600, marginBottom: '10px' }}>
          &ldquo;{result.samplePromptResult.promptText}&rdquo;
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            padding: '12px 14px',
            border: '1px solid var(--vs-border)',
            borderRadius: '5px',
            background: 'var(--vs-canvas)',
            fontSize: '13px',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              Competitors Recommended Ahead / Alongside {result.brandName}:
            </div>
            <div style={{ color: 'var(--vs-ink-secondary)' }}>
              {result.samplePromptResult.competitorsMentioned.join(' · ') ||
                'Incumbent category directories'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              Third-Party Citation URLs Feeding AI Answers:
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
            Reveal every unblurred citation URL, full 3-engine hallucinations, and all 1-click{' '}
            <code className="vs-mono">JSON-LD</code> +{' '}
            <code className="vs-mono">/agents.md</code> fixes.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
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
              Inspect in 3-Tab Console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
