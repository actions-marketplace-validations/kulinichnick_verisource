'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { StatusBadge } from '@verisource/ui';
import type { FreeToolCheckPayload } from '../app/api/tools/check/route';
import type { FreeToolSlug } from '../lib/gtm-content';

export function FreeSeoToolClient(props: {
  toolSlug: FreeToolSlug;
  placeholderDomain: string;
}): React.ReactElement {
  const [domainInput, setDomainInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<FreeToolCheckPayload | null>(null);

  async function executeToolProbe(rawTarget: string): Promise<void> {
    const trimmed = rawTarget.trim();
    if (!trimmed) {
      setErrorMsg('Enter a public website domain to run the live check.');
      return;
    }
    setDomainInput(trimmed);
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/tools/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: trimmed, tool: props.toolSlug }),
      });
      const json = (await res.json()) as
        | FreeToolCheckPayload
        | { error?: string; message?: string };
      if (!res.ok || !('ok' in json)) {
        setErrorMsg(
          ('message' in json && json.message) ||
            'Unable to inspect that domain right now.'
        );
        setResult(null);
      } else {
        setResult(json);
      }
    } catch {
      setErrorMsg('Network error while checking domain readiness.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRunCheck(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    await executeToolProbe(domainInput);
  }

  return (
    <div className="vs-bezel-obsidian" style={{ marginBottom: '36px' }}>
      <div className="vs-card" style={{ overflow: 'hidden' }}>
        <form onSubmit={handleRunCheck} className="vs-grader-form">
          <input
            type="text"
            className="vs-input"
            placeholder={`Enter website URL (e.g. ${props.placeholderDomain})`}
            aria-label="Enter website domain to test"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
          />
          <button
            type="submit"
            className="vs-btn"
            disabled={loading}
            style={{ whiteSpace: 'nowrap' }}
          >
            {loading ? 'Running Live HTTP Probe…' : 'Run Free Live Check →'}
          </button>
        </form>

        <div
          style={{
            padding: '10px 20px',
            background: 'var(--vs-surface-subtle)',
            borderBottom: result || errorMsg ? '1px solid var(--vs-border)' : 'none',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            className="vs-eyebrow"
            style={{ fontSize: '10.5px', marginRight: '4px' }}
          >
            OR TEST A LIVE BENCHMARK DOMAIN:
          </span>
          {(['stripe.com', 'linear.app', 'cal.com', 'shopify.com'] as const).map(
            (sampleHost) => (
              <button
                key={sampleHost}
                type="button"
                disabled={loading}
                className="vs-pill-btn vs-pill-btn-sm"
                onClick={() => void executeToolProbe(sampleHost)}
              >
                {sampleHost}
              </button>
            )
          )}
        </div>

      {errorMsg ? (
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--vs-crit-bg)',
            color: 'var(--vs-crit-fg)',
            fontSize: '13px',
            borderBottom: '1px solid var(--vs-crit-border)',
          }}
        >
          {errorMsg}
        </div>
      ) : null}

      {result ? (
        <div style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              paddingBottom: '14px',
              marginBottom: '16px',
              borderBottom: '1px solid var(--vs-border)',
            }}
          >
            <div>
              <div className="vs-eyebrow">LIVE HTTP READINESS REPORT</div>
              <div className="vs-mono" style={{ fontSize: '17px', fontWeight: 700 }}>
                {result.hostname}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <StatusBadge tone="pass">
                {`PLATFORM: ${result.detectedPlatformLabel.toUpperCase()}`}
              </StatusBadge>
              <StatusBadge
                tone={result.reachable ? 'pass' : 'critical'}
              >
                {result.reachable
                  ? `HTTP ${result.httpStatus ?? 200} REACHABLE`
                  : 'UNREACHABLE / BLOCKED'}
              </StatusBadge>
            </div>
          </div>

          {props.toolSlug === 'llms-txt-validator' ? (
            <div
              className="vs-card vs-ledger-strip-3"
              style={{ marginBottom: '18px', overflow: 'hidden' }}
            >
              <div style={{ padding: '14px' }}>
                <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                  /LLMS.TXT STATUS
                </div>
                <StatusBadge
                  tone={result.llmsTxtStatus === 'present' ? 'pass' : 'warn'}
                >
                  {result.llmsTxtStatus === 'present'
                    ? 'VALID HTTP 200'
                    : 'MISSING (HTTP 404)'}
                </StatusBadge>
              </div>
              <div style={{ padding: '14px' }}>
                <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                  /AGENTS.MD OR /AI-FACTS
                </div>
                <StatusBadge
                  tone={
                    result.agentsMdStatus === 'custom_enriched'
                      ? 'pass'
                      : result.agentsMdStatus === 'default_boilerplate'
                        ? 'warn'
                        : 'critical'
                  }
                >
                  {result.agentsMdStatus === 'custom_enriched'
                    ? 'CUSTOM VERIFIED TRUTH'
                    : result.agentsMdStatus === 'default_boilerplate'
                      ? 'STOCK SHOPIFY BOILERPLATE'
                      : 'MISSING'}
                </StatusBadge>
              </div>
              <div style={{ padding: '14px' }}>
                <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                  SCHEMA.ORG JSON-LD
                </div>
                <div className="vs-mono" style={{ fontSize: '14px', fontWeight: 700 }}>
                  {`${result.jsonLdCount} Block(s)`}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}>
                  {result.jsonLdTypes.length > 0
                    ? result.jsonLdTypes.join(' · ')
                    : 'No @type entities detected'}
                </div>
              </div>
            </div>
          ) : null}

          {props.toolSlug === 'ai-crawler-waf-checker' ? (
            <div style={{ marginBottom: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '14px',
                }}
              >
                {(
                  [
                    ['GPTBot', result.robotsAiBotStatus.GPTBot],
                    ['OAI-SearchBot', result.robotsAiBotStatus['OAI-SearchBot']],
                    ['PerplexityBot', result.robotsAiBotStatus.PerplexityBot],
                    ['ClaudeBot', result.robotsAiBotStatus.ClaudeBot],
                    [
                      'Google-Extended',
                      result.robotsAiBotStatus['Google-Extended'],
                    ],
                  ] as const
                ).map(([botName, allowed]) => (
                  <StatusBadge
                    key={botName}
                    tone={allowed ? 'pass' : 'critical'}
                  >
                    {`${botName}: ${allowed ? 'ALLOWED' : 'BLOCKED'}`}
                  </StatusBadge>
                ))}
                <StatusBadge
                  tone={result.robotsAiBotStatus.waf_blocked ? 'critical' : 'pass'}
                >
                  {result.robotsAiBotStatus.waf_blocked
                    ? 'EDGE WAF: HTTP 403 CHALLENGE DETECTED'
                    : 'EDGE WAF: NO BOT CHALLENGE'}
                </StatusBadge>
              </div>

              {result.crawlerReadability ? (
                <div className="vs-guided-banner">
                  <div className="vs-eyebrow" style={{ marginBottom: '3px' }}>
                    {`NON-JS HTML READABILITY · ${result.crawlerReadability.status.toUpperCase()}`}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
                    {`${result.crawlerReadability.summary} (${result.crawlerReadability.visibleWordCount} visible words · ~${result.crawlerReadability.estimatedTokens} tokens · ${result.crawlerReadability.signalToHtmlPct}% text-to-HTML ratio).`}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {props.toolSlug === 'shopify-ai-readiness-checker' ? (
            <div
              className="vs-card vs-ledger-strip-3"
              style={{ marginBottom: '18px', overflow: 'hidden' }}
            >
              <div style={{ padding: '14px' }}>
                <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                  SHOPIFY STOREFRONT MCP
                </div>
                <StatusBadge
                  tone={
                    result.shopifyMcpStatus === 'ucp_active'
                      ? 'pass'
                      : result.shopifyMcpStatus === 'legacy_mcp_active'
                        ? 'warn'
                        : 'neutral'
                  }
                >
                  {result.shopifyMcpStatus === 'ucp_active'
                    ? '/API/UCP/MCP ACTIVE'
                    : result.shopifyMcpStatus === 'legacy_mcp_active'
                      ? 'LEGACY /API/MCP ACTIVE'
                      : result.isShopify
                        ? 'MCP ENDPOINT INACTIVE'
                        : 'NON-SHOPIFY PLATFORM'}
                </StatusBadge>
              </div>
              <div style={{ padding: '14px' }}>
                <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                  STOREFRONT /AGENTS.MD
                </div>
                <StatusBadge
                  tone={
                    result.agentsMdStatus === 'custom_enriched'
                      ? 'pass'
                      : result.agentsMdStatus === 'default_boilerplate'
                        ? 'warn'
                        : 'critical'
                  }
                >
                  {result.agentsMdStatus === 'custom_enriched'
                    ? 'CUSTOM MERCHANT TRUTH'
                    : result.agentsMdStatus === 'default_boilerplate'
                      ? 'GENERIC STOCK BOILERPLATE'
                      : 'MISSING'}
                </StatusBadge>
              </div>
              <div style={{ padding: '14px' }}>
                <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                  EXPOSED CATALOG TOOLS
                </div>
                <div className="vs-mono" style={{ fontSize: '12.5px' }}>
                  {result.exposedMcpTools.length > 0
                    ? result.exposedMcpTools.slice(0, 3).join(', ')
                    : `${result.jsonLdCount} JSON-LD node(s) on homepage`}
                </div>
              </div>
            </div>
          ) : null}

          {props.toolSlug === 'json-ld-ai-schema-checker' ? (
            <div style={{ marginBottom: '18px' }}>
              <div
                className="vs-card vs-ledger-strip-3"
                style={{ marginBottom: '12px', overflow: 'hidden' }}
              >
                <div style={{ padding: '14px' }}>
                  <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                    1. ENTITY IDENTITY GRAPH
                  </div>
                  <StatusBadge
                    tone={
                      result.jsonLdReadiness?.hasEntityIdentity
                        ? 'pass'
                        : 'critical'
                    }
                  >
                    {result.jsonLdReadiness?.hasEntityIdentity
                      ? 'TYPED ENTITY LIVE'
                      : 'ENTITY SCHEMA MISSING'}
                  </StatusBadge>
                  <div
                    className="vs-mono"
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--vs-ink-muted)',
                      marginTop: '6px',
                    }}
                  >
                    {result.jsonLdTypes.length > 0
                      ? result.jsonLdTypes.join(' · ')
                      : '0 @type entities parsed'}
                  </div>
                </div>

                <div style={{ padding: '14px' }}>
                  <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                    2. FAQPAGE Q&amp;A SCHEMA
                  </div>
                  <StatusBadge
                    tone={result.jsonLdReadiness?.hasFaqPage ? 'pass' : 'warn'}
                  >
                    {result.jsonLdReadiness?.hasFaqPage
                      ? `LIVE · ${result.jsonLdReadiness.faqQuestionCount} Q&A PAIR(S)`
                      : 'MISSING · 0 Q&A PAIRS'}
                  </StatusBadge>
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--vs-ink-muted)',
                      marginTop: '6px',
                    }}
                  >
                    {result.jsonLdReadiness?.hasFaqPage
                      ? 'Answer-First Q&A chunks exposed to AI crawlers'
                      : '92.5% of sites miss FAQPage schema for AI prompts'}
                  </div>
                </div>

                <div style={{ padding: '14px' }}>
                  <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                    3. OFFER &amp; PRICING GRAPH
                  </div>
                  <StatusBadge
                    tone={
                      result.jsonLdReadiness?.hasOfferOrPricing
                        ? 'pass'
                        : 'warn'
                    }
                  >
                    {result.jsonLdReadiness?.hasOfferOrPricing
                      ? 'OFFER / PRICING LIVE'
                      : 'PRICING SCHEMA MISSING'}
                  </StatusBadge>
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--vs-ink-muted)',
                      marginTop: '6px',
                    }}
                  >
                    {result.jsonLdReadiness?.hasOfferOrPricing
                      ? 'Structured Offer or Product pricing detected'
                      : 'AI engines must guess pricing from prose or directories'}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Contextual Conversion Handoff */}
          <div
            className="vs-card"
            style={{
              padding: '16px 18px',
              background: 'var(--vs-surface-warm)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ maxWidth: '620px' }}>
              <div style={{ fontWeight: 700, fontSize: '14.5px', marginBottom: '3px' }}>
                {`Generate validated ${result.detectedPlatformLabel} fixes & scan 3 AI engines for ${result.hostname}`}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)' }}>
                See which rivals steal your ChatGPT &amp; Perplexity citations
                and copy 1 ready-to-paste AI prompt to fix every missing check
                above.
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <Link
                href={`/?domain=${encodeURIComponent(result.hostname)}#grader`}
                className="vs-btn vs-btn-secondary"
              >
                Full 3-Engine Scan (Free) →
              </Link>
              <a
                href={`/api/checkout?plan=pro_99&cycle=monthly&domain=${encodeURIComponent(
                  result.hostname
                )}&env=${encodeURIComponent(result.recommendedEnv)}`}
                className="vs-btn"
              >
                Get 1-Click AI Fix Prompt ($0 Trial) →
              </a>
              <Link
                href={`/pricing?domain=${encodeURIComponent(
                  result.hostname
                )}&env=${encodeURIComponent(result.recommendedEnv)}`}
                className="vs-btn vs-btn-secondary"
              >
                Compare Plans
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '14px 20px',
            fontSize: '12.5px',
            color: 'var(--vs-ink-muted)',
            background: 'var(--vs-surface-warm)',
          }}
        >
          Instant live HTTP &amp; simulated AI bot inspection — zero signup or
          credit card required.
        </div>
      )}
      </div>
    </div>
  );
}
