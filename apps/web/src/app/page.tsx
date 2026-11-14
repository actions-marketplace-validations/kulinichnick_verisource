import React from 'react';
import { buildAiAttributionSnippet } from '@verisource/core-geo';
import { CodeArtifactCard, StatusBadge } from '@verisource/ui';
import { PricingLadderSection } from '../components/PricingLadderSection';
import { PublicGraderClient } from '../components/PublicGraderClient';

export default function HomePage(): React.ReactElement {
  const samplePixel = buildAiAttributionSnippet({
    trackingPixelToken: 'aaaaaaaa-1111-4000-8000-000000000001',
    ingestionUrl: 'https://verisource.dev/api/pixel',
  });

  return (
    <div className="vs-container" style={{ paddingTop: '44px' }}>
      {/* Editorial Hero */}
      <section style={{ maxWidth: '860px', marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px',
          }}
        >
          <StatusBadge tone="pass">STREAMABLE HTTP /MCP READY</StatusBadge>
          <StatusBadge>SHOPIFY /API/UCP/MCP ADAPTER</StatusBadge>
          <StatusBadge>QUALITY GATE &gt;= 9.5 / 10</StatusBadge>
        </div>

        <h1
          style={{
            fontSize: '40px',
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            fontWeight: 700,
            margin: '0 0 16px 0',
          }}
        >
          Audit what ChatGPT, Gemini, and Perplexity claim about your brand.
          Ship verified fixes in 60 seconds.
        </h1>

        <p
          style={{
            fontSize: '16.5px',
            lineHeight: 1.6,
            color: 'var(--vs-ink-secondary)',
            margin: 0,
          }}
        >
          40%–58% of buyer shortlisting now happens inside AI search engines,
          where referred traffic converts at{' '}
          <strong className="vs-mono">14.2%–15.9%</strong> versus Google
          organic&rsquo;s <strong className="vs-mono">1.76%–2.8%</strong>.
          Passive trackers charge $245–$579/mo to show charts while leaving
          broken <code className="vs-mono">JSON-LD</code>, blocked crawlers, and
          hallucinated prices untouched. Verisource audits your domain and
          generates ready-to-publish fixes.
        </p>
      </section>

      {/* Live Interactive Domain Grader */}
      <PublicGraderClient />

      {/* 2x2 Architectural Module Specification Matrix */}
      <section style={{ marginTop: '64px' }}>
        <div
          className="vs-mono"
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--vs-ink-muted)',
            marginBottom: '6px',
          }}
        >
          READ-WRITE SYSTEM ARCHITECTURE
        </div>
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 20px 0',
          }}
        >
          Four production modules inside a strict 3-Tab console.
        </h2>

        <div
          className="vs-card"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          }}
        >
          <div
            style={{
              padding: '24px',
              borderRight: '1px solid var(--vs-border)',
              borderBottom: '1px solid var(--vs-border)',
            }}
          >
            <div className="vs-mono" style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}>
              MODULE 01 · TAB 1
            </div>
            <h3 style={{ margin: '6px 0 8px 0', fontSize: '17px' }}>
              Hallucination &amp; Brand Truth Watchdog
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--vs-ink-secondary)' }}>
              Auto-drafts a structured Brand Truth Sheet from your storefront
              pricing, shipping policies, and SKU catalog on first scan. Flags
              high-severity alerts whenever an LLM invents discontinued products,
              wrong free-shipping thresholds, or unverified service territories.
            </p>
          </div>

          <div
            style={{
              padding: '24px',
              borderBottom: '1px solid var(--vs-border)',
            }}
          >
            <div className="vs-mono" style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}>
              MODULE 02 · TAB 1
            </div>
            <h3 style={{ margin: '6px 0 8px 0', fontSize: '17px' }}>
              Simulated Bot WAF Prober &amp; 10-Line Revenue Pixel
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--vs-ink-secondary)' }}>
              Tests live HTTP responses with simulated{' '}
              <code className="vs-mono">GPTBot</code> and{' '}
              <code className="vs-mono">PerplexityBot</code> headers to catch
              silent Cloudflare 403 blocks that{' '}
              <code className="vs-mono">robots.txt</code> parsers miss. Pairs
              with an Origin-verified JS snippet tracking conversions from{' '}
              <code className="vs-mono">chatgpt.com</code>,{' '}
              <code className="vs-mono">perplexity.ai</code>,{' '}
              <code className="vs-mono">gemini.google.com</code>, and{' '}
              <code className="vs-mono">claude.ai</code>.
            </p>
          </div>

          <div
            style={{
              padding: '24px',
              borderRight: '1px solid var(--vs-border)',
            }}
          >
            <div className="vs-mono" style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}>
              MODULE 03 · TAB 2 &amp; TAB 3
            </div>
            <h3 style={{ margin: '6px 0 8px 0', fontSize: '17px' }}>
              Query Fanout Decompiler &amp; 9.5+/10 Fix Generator
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--vs-ink-secondary)' }}>
              Extracts observed engine sub-queries (Gemini{' '}
              <code className="vs-mono">webSearchQueries</code>, OpenAI{' '}
              <code className="vs-mono">web_search_call</code>) and pinpoints the
              exact Reddit threads and comparison guides feeding competitor
              ranks. Generates critic-verified{' '}
              <code className="vs-mono">JSON-LD</code>,{' '}
              <code className="vs-mono">/llms.txt</code>, and Shopify{' '}
              <code className="vs-mono">agents.md.liquid</code> files.
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            <div className="vs-mono" style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}>
              MODULE 04 · TAB 3
            </div>
            <h3 style={{ margin: '6px 0 8px 0', fontSize: '17px' }}>
              60-Second White-Label Pitch Mode &amp; Paid /mcp Server
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--vs-ink-secondary)' }}>
              Agencies mint branded prospect audit links (
              <code className="vs-mono">verisource.dev/audit/[slug]</code>) with
              custom logos and booking CTAs in one click. Engineering teams
              connect Cursor, Claude Desktop, or Antigravity directly to{' '}
              <code className="vs-mono">https://mcp.verisource.dev/mcp</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Patient Zero Empirical Case Ledger */}
      <section id="case-ledger" style={{ marginTop: '64px' }}>
        <div
          className="vs-mono"
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--vs-ink-muted)',
            marginBottom: '6px',
          }}
        >
          PATIENT ZERO BENCHMARK LEDGER
        </div>
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 18px 0',
          }}
        >
          Verified live findings on specialty Shopify storefronts.
        </h2>

        <div className="vs-card" style={{ overflow: 'hidden' }}>
          <table className="vs-table">
            <thead>
              <tr>
                <th>Storefront</th>
                <th>Protocol &amp; Bot Status</th>
                <th>Detected LLM Hallucination</th>
                <th>Generated 9.5+/10 Fix</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Aurea Coffee Roasters</strong>
                  <div className="vs-mono" style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
                    aurearoasters.com
                  </div>
                </td>
                <td>
                  <StatusBadge tone="pass">UCP /api/ucp/mcp Active</StatusBadge>{' '}
                  <StatusBadge tone="warn">Boilerplate /agents.md</StatusBadge>
                </td>
                <td style={{ fontSize: '13px' }}>
                  ChatGPT claimed Aurea sells <strong>$15 K-Cup pods</strong>.
                  Verified truth: 12oz whole-bean single-origin bags ($22–$28)
                  with saint-biography QR codes; zero K-Cups.
                </td>
                <td className="vs-mono" style={{ fontSize: '12px' }}>
                  agents.md.liquid override + Product Offer JSON-LD (9.8 / 10.0)
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Mosaic Coffee Roasters</strong>
                  <div className="vs-mono" style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
                    mosaicroasters.com
                  </div>
                </td>
                <td>
                  <StatusBadge tone="critical">PerplexityBot 403 WAF</StatusBadge>{' '}
                  <StatusBadge tone="critical">/agents.md Missing</StatusBadge>
                </td>
                <td style={{ fontSize: '13px' }}>
                  Perplexity claimed <strong>free nationwide shipping over $25</strong>.
                  Verified truth: free local hand-delivery applies to{' '}
                  <strong>$45+ orders within 25 miles of Springfield, MO</strong>.
                </td>
                <td className="vs-mono" style={{ fontSize: '12px' }}>
                  LocalBusiness GeoCircle JSON-LD + WAF allowlist (9.7 / 10.0)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 10-Line Zero-Code AI Referral Pixel Preview */}
      <section style={{ marginTop: '64px' }}>
        <div
          className="vs-mono"
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--vs-ink-muted)',
            marginBottom: '6px',
          }}
        >
          ZERO-CODE ATTRIBUTION TELEMETRY
        </div>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 14px 0',
          }}
        >
          10-line AI referral &amp; checkout revenue snippet.
        </h2>
        <CodeArtifactCard
          title="Origin-Verified Referral & Conversion Pixel"
          fileHint="Captures document.referrer + ?utm_source=chatgpt.com across checkout sessions"
          code={samplePixel}
        />
      </section>

      {/* Transparent Pricing Ladder */}
      <PricingLadderSection />
    </div>
  );
}
