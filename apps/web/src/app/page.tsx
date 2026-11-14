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

      {/* Patient Zero Empirical Before -> After Case Ledger */}
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
          PATIENT ZERO · BEFORE &rarr; AFTER REMEDIATION LEDGER
        </div>
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 8px 0',
          }}
        >
          Live production deployments on specialty Shopify storefronts.
        </h2>
        <p
          style={{
            fontSize: '14.5px',
            lineHeight: 1.55,
            color: 'var(--vs-ink-secondary)',
            margin: '0 0 18px 0',
            maxWidth: '780px',
          }}
        >
          Every metric below is live in production right now. Type{' '}
          <code className="vs-mono">aurearoasters.com</code> or{' '}
          <code className="vs-mono">mosaicroasters.com</code> into the grader
          above to verify the deployed <code className="vs-mono">JSON-LD</code>{' '}
          graphs, <code className="vs-mono">/api/ucp/mcp</code> status, and
          linked Markdown truth sheets in real time.
        </p>

        <div className="vs-card" style={{ overflowX: 'auto' }}>
          <table className="vs-table">
            <thead>
              <tr>
                <th>Storefront</th>
                <th>AI Readiness Uplift</th>
                <th>Live Protocol &amp; Schema State</th>
                <th>Hallucination Guardrail Deployed</th>
                <th>White-Label Audit</th>
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
                <td className="vs-mono" style={{ fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--vs-ink-muted)' }}>41</span>{' '}
                  &rarr;{' '}
                  <strong style={{ color: '#059669' }}>92 / 100</strong>
                  <div style={{ fontSize: '11px', color: '#059669' }}>+51 pts live</div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <StatusBadge tone="pass">UCP /api/ucp/mcp Active</StatusBadge>
                    <StatusBadge tone="pass">Custom Truth Linked</StatusBadge>
                    <StatusBadge>7 JSON-LD Nodes</StatusBadge>
                  </div>
                </td>
                <td style={{ fontSize: '13px', maxWidth: '320px' }}>
                  Countered false <strong>$15 K-Cup pod</strong> claims with an
                  8-SKU <code className="vs-mono">OfferCatalog</code> ($21.95–$109.95),{' '}
                  <code className="vs-mono">FAQPage</code>, and canonical
                  Markdown truth file via Shopify Admin API.
                </td>
                <td className="vs-mono" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                  <a
                    href="/audit/aurearoasters-com-vf9w"
                    style={{
                      color: 'var(--vs-ink)',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    View Pitch &rarr;
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Mosaic Coffee Roasters</strong>
                  <div className="vs-mono" style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
                    mosaicroasters.com
                  </div>
                </td>
                <td className="vs-mono" style={{ fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--vs-ink-muted)' }}>52</span>{' '}
                  &rarr;{' '}
                  <strong style={{ color: '#059669' }}>84 / 100</strong>
                  <div style={{ fontSize: '11px', color: '#059669' }}>+32 pts live</div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <StatusBadge tone="pass">UCP /api/ucp/mcp Active</StatusBadge>
                    <StatusBadge tone="pass">/pages/ai-facts Live</StatusBadge>
                    <StatusBadge>5 JSON-LD Nodes</StatusBadge>
                  </div>
                </td>
                <td style={{ fontSize: '13px', maxWidth: '320px' }}>
                  Countered false <strong>$25 nationwide free shipping</strong>{' '}
                  claims with a <code className="vs-mono">40.2km GeoCircle</code>{' '}
                  schema encoding <strong>$45+ local delivery</strong> within 25
                  miles of Springfield, MO.
                </td>
                <td className="vs-mono" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                  <a
                    href="/audit/mosaic-springfield-audit"
                    style={{
                      color: 'var(--vs-ink)',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    View Pitch &rarr;
                  </a>
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
