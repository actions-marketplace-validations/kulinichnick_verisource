import Link from 'next/link';
import React from 'react';
import { buildAiAttributionSnippet } from '@verisource/core-geo';
import { CodeArtifactCard, StatusBadge } from '@verisource/ui';
import { HeroSignalSchematic } from '../components/HeroSignalSchematic';
import { PricingLadderSection } from '../components/PricingLadderSection';
import { PublicGraderClient } from '../components/PublicGraderClient';

export default function HomePage(): React.ReactElement {
  const samplePixel = buildAiAttributionSnippet({
    trackingPixelToken: 'aaaaaaaa-1111-4000-8000-000000000001',
    ingestionUrl: 'https://verisource.dev/api/pixel',
  });

  return (
    <div>
      {/* Architectural Warm-Paper Hero Band with Zero-Lag Animated SVG Schematic */}
      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '46px 0 50px 0',
          marginBottom: '36px',
        }}
      >
        <div className="vs-container vs-hero-grid">
          <div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <StatusBadge tone="pass">GUIDED + PRO /MCP MODES</StatusBadge>
              <StatusBadge>SHOPIFY &amp; ANY WEBSITE</StatusBadge>
              <StatusBadge>QUALITY GATE &gt;= 9.5 / 10</StatusBadge>
            </div>

            <h1
              style={{
                fontSize: 'clamp(32px, 4.2vw, 46px)',
                lineHeight: 1.09,
                letterSpacing: '-0.03em',
                fontWeight: 700,
                margin: '0 0 16px 0',
              }}
            >
              See what ChatGPT, Gemini, and Perplexity tell buyers about you.{' '}
              <span
                className="vs-display-serif"
                style={{ fontSize: '1.08em', fontWeight: 400 }}
              >
                Fix wrong claims in 60 seconds.
              </span>
            </h1>

            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.62,
                color: 'var(--vs-ink-secondary)',
                margin: '0 0 22px 0',
                maxWidth: '580px',
              }}
            >
              40%–58% of buyer discovery now happens inside AI engines, where
              referred visitors convert at{' '}
              <strong className="vs-mono">14.2%–15.9%</strong> compared to
              Google organic&rsquo;s{' '}
              <strong className="vs-mono">1.76%–2.8%</strong>. Most trackers
              charge $245–$579/mo just to show passive charts. Verisource flags
              invented prices, checks whether AI bots can read your pages, and
              writes ready-to-paste fix code (
              <code className="vs-mono">JSON-LD</code> and{' '}
              <code className="vs-mono">/agents.md</code>) for non-technical
              owners and engineering teams alike.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '22px',
              }}
            >
              <a href="#grader" className="vs-btn">
                Scan Your Website Free ↓
              </a>
              <Link href="/dashboard" className="vs-btn vs-btn-secondary">
                Explore Guided Console →
              </Link>
              <Link href="/sample-audit" className="vs-btn vs-btn-secondary">
                View Sample Audits
              </Link>
            </div>

            {/* Plain-English 3-Step Strip */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                paddingTop: '14px',
                borderTop: '1px solid var(--vs-border)',
                fontSize: '12.5px',
                color: 'var(--vs-ink-secondary)',
              }}
            >
              <span>
                <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
                  01
                </strong>{' '}
                Enter your URL below
              </span>
              <span>
                <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
                  02
                </strong>{' '}
                Spot wrong claims &amp; blocked bots
              </span>
              <span>
                <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
                  03
                </strong>{' '}
                Paste your verified site fix
              </span>
            </div>
          </div>

          <HeroSignalSchematic />
        </div>
      </section>

      <div className="vs-container">
        {/* Live Interactive Domain Grader */}
        <PublicGraderClient />

        {/* 2x2 Architectural Module Specification Matrix */}
        <section style={{ marginTop: '68px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            PLAIN ENGLISH FOR OWNERS · FULL PROTOCOL DEPTH FOR ENGINEERS
          </div>
          <h2
            style={{
              fontSize: '27px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 20px 0',
            }}
          >
            Four practical tools inside one calm 3-Tab workspace.
          </h2>

          <div className="vs-card vs-arch-matrix">
            <div className="vs-arch-cell">
              <div className="vs-eyebrow">MODULE 01 · STEP 1</div>
              <h3 style={{ margin: '6px 0 8px 0', fontSize: '17px' }}>
                Catch Wrong Prices &amp; Invented Policies
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                AI engines routinely invent expired discounts, K-Cup SKUs you do
                not sell, or wrong delivery zones. Verisource drafts a simple
                Brand Truth Sheet from your real site and alerts you the moment
                ChatGPT, Gemini, or Perplexity states a false fact.
              </p>
            </div>

            <div className="vs-arch-cell">
              <div className="vs-eyebrow">MODULE 02 · STEP 1</div>
              <h3 style={{ margin: '6px 0 8px 0', fontSize: '17px' }}>
                AI Bot Access Check &amp; 10-Line Revenue Pixel
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Firewall rules often block{' '}
                <code className="vs-mono">GPTBot</code> and{' '}
                <code className="vs-mono">PerplexityBot</code> with silent HTTP
                403 errors even when <code className="vs-mono">robots.txt</code>{' '}
                looks fine. We test live crawler headers and give you a 10-line
                script to measure orders coming from{' '}
                <code className="vs-mono">chatgpt.com</code>,{' '}
                <code className="vs-mono">perplexity.ai</code>,{' '}
                <code className="vs-mono">gemini.google.com</code>, and{' '}
                <code className="vs-mono">claude.ai</code>.
              </p>
            </div>

            <div className="vs-arch-cell">
              <div className="vs-eyebrow">MODULE 03 · STEP 2 &amp; STEP 3</div>
              <h3 style={{ margin: '6px 0 8px 0', fontSize: '17px' }}>
                Copy-Paste Website Fixes &amp; Competitor Sources
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                See the exact Reddit threads, directories, and comparison blogs
                feeding competitor recommendations via Gemini{' '}
                <code className="vs-mono">webSearchQueries</code> and OpenAI{' '}
                <code className="vs-mono">web_search_call</code>. Then copy
                ready-to-publish <code className="vs-mono">JSON-LD</code>{' '}
                fact-sheets, <code className="vs-mono">/llms.txt</code>, and
                Shopify <code className="vs-mono">agents.md.liquid</code> files.
              </p>
            </div>

            <div className="vs-arch-cell">
              <div className="vs-eyebrow">MODULE 04 · STEP 3</div>
              <h3 style={{ margin: '6px 0 8px 0', fontSize: '17px' }}>
                60-Second Client Pitch Links &amp; Paid /mcp Sync
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Agencies generate clean, branded client audit links (
                <code className="vs-mono">verisource.dev/audit/[slug]</code>)
                with their own logo and calendar button in one click. Technical
                teams connect Cursor, Claude Desktop, or Antigravity directly to{' '}
                <code className="vs-mono">https://mcp.verisource.dev/mcp</code>.
              </p>
            </div>
          </div>
        </section>

        {/* Patient Zero Empirical Before -> After Case Ledger */}
        <section id="case-ledger" style={{ marginTop: '68px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            LIVE CASE STUDIES · BEFORE &rarr; AFTER PROOF
          </div>
          <h2
            style={{
              fontSize: '27px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 8px 0',
            }}
          >
            Verified score jumps on real specialty Shopify stores.
          </h2>
          <p
            style={{
              fontSize: '14.5px',
              lineHeight: 1.58,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 18px 0',
              maxWidth: '780px',
            }}
          >
            Both storefronts below run Verisource fixes in live production right
            now. Click either preset inside the free grader above to inspect
            their live <code className="vs-mono">JSON-LD</code> fact graphs,{' '}
            <code className="vs-mono">/api/ucp/mcp</code> catalog endpoints, and
            verified Markdown truth sheets.
          </p>

          <div className="vs-card vs-table-wrap">
            <table className="vs-table">
              <thead>
                <tr>
                  <th>Storefront</th>
                  <th>AI Readiness Uplift</th>
                  <th>Live Protocol &amp; Schema State</th>
                  <th>False AI Claim Corrected</th>
                  <th>Client Report</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Aurea Coffee Roasters</strong>
                    <div
                      className="vs-mono"
                      style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
                    >
                      aurearoasters.com
                    </div>
                  </td>
                  <td
                    className="vs-mono"
                    style={{ fontSize: '13.5px', whiteSpace: 'nowrap' }}
                  >
                    <span style={{ color: 'var(--vs-ink-muted)' }}>41</span>{' '}
                    &rarr;{' '}
                    <strong style={{ color: 'var(--vs-pass-fg)' }}>
                      92 / 100
                    </strong>
                    <div
                      style={{ fontSize: '11px', color: 'var(--vs-pass-fg)' }}
                    >
                      +51 pts live
                    </div>
                  </td>
                  <td>
                    <div
                      style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}
                    >
                      <StatusBadge tone="pass">
                        UCP /api/ucp/mcp Active
                      </StatusBadge>
                      <StatusBadge tone="pass">Custom Truth Linked</StatusBadge>
                      <StatusBadge>7 JSON-LD Nodes</StatusBadge>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', maxWidth: '320px' }}>
                    Replaced invented <strong>$15 K-Cup pod</strong> claims with
                    an 8-SKU <code className="vs-mono">OfferCatalog</code>{' '}
                    ($21.95–$109.95), <code className="vs-mono">FAQPage</code>,
                    and canonical Markdown truth file via Shopify Admin API.
                  </td>
                  <td
                    className="vs-mono"
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    <a
                      href="/audit/aurearoasters-com-vf9w"
                      style={{
                        color: 'var(--vs-ink)',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                      }}
                    >
                      View Report &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Mosaic Coffee Roasters</strong>
                    <div
                      className="vs-mono"
                      style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
                    >
                      mosaicroasters.com
                    </div>
                  </td>
                  <td
                    className="vs-mono"
                    style={{ fontSize: '13.5px', whiteSpace: 'nowrap' }}
                  >
                    <span style={{ color: 'var(--vs-ink-muted)' }}>52</span>{' '}
                    &rarr;{' '}
                    <strong style={{ color: 'var(--vs-pass-fg)' }}>
                      84 / 100
                    </strong>
                    <div
                      style={{ fontSize: '11px', color: 'var(--vs-pass-fg)' }}
                    >
                      +32 pts live
                    </div>
                  </td>
                  <td>
                    <div
                      style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}
                    >
                      <StatusBadge tone="pass">
                        UCP /api/ucp/mcp Active
                      </StatusBadge>
                      <StatusBadge tone="pass">/pages/ai-facts Live</StatusBadge>
                      <StatusBadge>5 JSON-LD Nodes</StatusBadge>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px', maxWidth: '320px' }}>
                    Replaced wrong{' '}
                    <strong>$25 nationwide free shipping</strong> claims with a{' '}
                    <code className="vs-mono">40.2km GeoCircle</code> schema
                    specifying <strong>$45+ local delivery</strong> within 25
                    miles of Springfield, MO.
                  </td>
                  <td
                    className="vs-mono"
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    <a
                      href="/audit/mosaic-springfield-audit"
                      style={{
                        color: 'var(--vs-ink)',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                      }}
                    >
                      View Report &rarr;
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 10-Line Zero-Code AI Referral Pixel Preview */}
        <section style={{ marginTop: '68px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            SIMPLE REVENUE ATTRIBUTION
          </div>
          <h2
            style={{
              fontSize: '25px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 8px 0',
            }}
          >
            Know when a ChatGPT or Perplexity visitor buys from you.
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 14px 0',
              maxWidth: '700px',
            }}
          >
            Paste 10 lines once into your site header. No cookies, zero page
            slowdown, and automatic source matching across{' '}
            <code className="vs-mono">chatgpt.com</code>,{' '}
            <code className="vs-mono">perplexity.ai</code>,{' '}
            <code className="vs-mono">gemini.google.com</code>, and{' '}
            <code className="vs-mono">claude.ai</code>.
          </p>
          <CodeArtifactCard
            title="Origin-Verified AI Visit & Checkout Pixel"
            plainSummary="Tracks visits and completed purchases referred by AI answer engines."
            fileHint="Paste before </head> on any site or Shopify theme"
            code={samplePixel}
          />
        </section>

        {/* Transparent Pricing Ladder */}
        <PricingLadderSection />
      </div>
    </div>
  );
}
