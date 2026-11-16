import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { HeroSignalSchematic } from '../components/HeroSignalSchematic';
import { PlatformModulesShowcase } from '../components/PlatformModulesShowcase';
import { PricingLadderSection } from '../components/PricingLadderSection';
import { PublicGraderClient } from '../components/PublicGraderClient';

export default function HomePage(): React.ReactElement {
  return (
    <div>
      {/* Profound-Caliber Editorial AI Search Platform Hero */}
      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '48px 0 52px 0',
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
              <StatusBadge tone="pass">
                CHATGPT · PERPLEXITY · GEMINI · CLAUDE
              </StatusBadge>
              <StatusBadge>NO CODING REQUIRED · 1-CLICK AI PROMPT</StatusBadge>
              <StatusBadge>SCHEMA &amp; FACT VERIFIED</StatusBadge>
            </div>

            <h1
              style={{
                fontSize: 'clamp(33px, 4.3vw, 48px)',
                lineHeight: 1.07,
                letterSpacing: '-0.032em',
                fontWeight: 700,
                margin: '0 0 16px 0',
              }}
            >
              Control how AI search recommends your brand.{' '}
              <span
                className="vs-display-serif"
                style={{ fontSize: '1.08em', fontWeight: 400 }}
              >
                And let your own AI fix your site.
              </span>
            </h1>

            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.62,
                color: 'var(--vs-ink-secondary)',
                margin: '0 0 24px 0',
                maxWidth: '600px',
              }}
            >
              40%–58% of buyers now ask ChatGPT, Perplexity, and Google Gemini
              who to hire or buy from—and AI-referred visitors convert at{' '}
              <strong className="vs-mono">14.2%–15.9%</strong> vs. Google
              organic&rsquo;s <strong className="vs-mono">1.76%–2.8%</strong>.
              Verisource scans your website, explains in plain English why
              competitors get recommended instead (or where AI quotes wrong
              prices), and gives you{' '}
              <strong style={{ color: 'var(--vs-ink)' }}>
                one ready-made prompt to paste into ChatGPT, Claude, Antigravity,
                Cursor, or Shopify
              </strong>{' '}
              to fix everything on your site.
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
                Scan My Website Free ↓
              </a>
              <a href="#how-it-works" className="vs-btn vs-btn-secondary">
                See How It Works (3 Steps)
              </a>
              <Link href="/dashboard" className="vs-btn vs-btn-secondary">
                Subscriber Sign In →
              </Link>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '18px',
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
                Scan your site &amp; see plain-English issues
              </span>
              <span>
                <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
                  02
                </strong>{' '}
                Copy 1 Verisource prompt into your AI tool
              </span>
              <span>
                <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
                  03
                </strong>{' '}
                Verify live fixes &amp; win buyer shortlists
              </span>
            </div>
          </div>

          <HeroSignalSchematic />
        </div>
      </section>

      <div className="vs-container">
        {/* Customer Tests Their Own Domain — Plain-English Free Diagnosis */}
        <PublicGraderClient />

        {/* Calm 3-Step Workflow: How Business Owners Use Verisource Without Coding */}
        <section id="how-it-works" style={{ marginTop: '64px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '14px',
              marginBottom: '18px',
            }}
          >
            <div style={{ maxWidth: '720px' }}>
              <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
                HOW VERISOURCE WORKS · BUILT FOR BUSINESS OWNERS &amp; TEAMS
              </div>
              <h2
                style={{
                  fontSize: 'clamp(24px, 2.8vw, 30px)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  margin: '0 0 8px 0',
                }}
              >
                Get recommended by AI search in 3 steps—without touching raw code.
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '14.5px',
                  lineHeight: 1.58,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                You don&rsquo;t need to be an SEO specialist or software
                engineer. Verisource finds every problem holding your business
                back in AI search and hands you a single prompt for whatever AI
                assistant you already use.
              </p>
            </div>
            <StatusBadge tone="pass">
              WORKS WITH CHATGPT · CLAUDE · ANTIGRAVITY · CURSOR · SHOPIFY
            </StatusBadge>
          </div>

          <div className="vs-card" style={{ overflow: 'hidden' }}>
            <div className="vs-ledger-strip-3">
              <div style={{ padding: '22px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                    STEP 01 · DIAGNOSE
                  </span>
                  <StatusBadge>60 SECONDS</StatusBadge>
                </div>
                <h3
                  style={{
                    fontSize: '16.5px',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.015em',
                  }}
                >
                  See why AI skips your business (or states wrong prices)
                </h3>
                <p
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '13.5px',
                    lineHeight: 1.55,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  Enter your website URL. Verisource checks real buyer questions
                  across ChatGPT, Gemini, and Perplexity, flags invented pricing
                  claims, and explains in everyday English what is missing on
                  your site.
                </p>
                <div
                  className="vs-mono"
                  style={{
                    fontSize: '11.5px',
                    color: 'var(--vs-ink-muted)',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--vs-border)',
                  }}
                >
                  Checks: Real Prices · Bot Access · Competitor Shortlists
                </div>
              </div>

              <div
                style={{
                  padding: '22px',
                  background: 'var(--vs-surface-warm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                    STEP 02 · COPY 1 AI PROMPT
                  </span>
                  <StatusBadge tone="pass">ZERO MANUAL CODING</StatusBadge>
                </div>
                <h3
                  style={{
                    fontSize: '16.5px',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.015em',
                  }}
                >
                  Paste 1 Verisource prompt into your own AI to fix your site
                </h3>
                <p
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '13.5px',
                    lineHeight: 1.55,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  Verisource bundles every needed fix—structured{' '}
                  <code className="vs-mono">JSON-LD</code> facts,{' '}
                  <code className="vs-mono">/llms.txt</code>,{' '}
                  <code className="vs-mono">/agents.md</code>, and crawler
                  access—into <strong>one ready-to-paste prompt</strong>. Paste
                  it into Claude, ChatGPT, Antigravity, Cursor, or Lovable and
                  let your AI apply the changes.
                </p>
                <div
                  className="vs-mono"
                  style={{
                    fontSize: '11.5px',
                    color: 'var(--vs-ink-muted)',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--vs-border)',
                  }}
                >
                  Works with: Coding Agents · WordPress/Webflow · Shopify
                </div>
              </div>

              <div style={{ padding: '22px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                    STEP 03 · GROW CUSTOMERS
                  </span>
                  <StatusBadge>WEEKLY TRACKING</StatusBadge>
                </div>
                <h3
                  style={{
                    fontSize: '16.5px',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.015em',
                  }}
                >
                  Verify live fixes, overtake rivals &amp; track AI leads
                </h3>
                <p
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '13.5px',
                    lineHeight: 1.55,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  Click <strong>✓ Verify Live Fixes</strong> to confirm your new
                  AI files are live and watch your Visibility Score climb. Launch
                  1-click <strong>You vs. Competitor</strong> pages and track
                  visits &amp; sales coming from ChatGPT and Perplexity.
                </p>
                <div
                  className="vs-mono"
                  style={{
                    fontSize: '11.5px',
                    color: 'var(--vs-ink-muted)',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--vs-border)',
                  }}
                >
                  Includes: vs. Rival Page Studio · Reddit/G2 Playbooks · ROI
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive 5-Pillar Platform Showcase (Inspired by Category Leaders, Powered by Action Tools) */}
        <PlatformModulesShowcase />

        {/* Passive GEO Trackers vs. Verisource Read-Write Action Engine */}
        <section style={{ marginTop: '72px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            READ-ONLY DASHBOARDS VS. READ-WRITE EXECUTION
          </div>
          <h2
            style={{
              fontSize: 'clamp(24px, 2.8vw, 29px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 8px 0',
            }}
          >
            Why business owners and agencies switch from $499/mo chart-only tools.
          </h2>
          <p
            style={{
              fontSize: '14.5px',
              lineHeight: 1.58,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 18px 0',
              maxWidth: '760px',
            }}
          >
            Knowing ChatGPT left out your business is useless if you don&rsquo;t
            know how to fix it. Verisource pairs multi-engine visibility
            tracking with a 1-click prompt that fixes your site through your own
            AI tool.
          </p>

          <div className="vs-card vs-table-wrap">
            <table className="vs-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Passive Enterprise Trackers ($245–$499+/mo)</th>
                  <th>Verisource Action Console ($0 7-Day Trial · $49–$249/mo)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Plain-English Diagnosis &amp; Pricing Check</strong>
                  </td>
                  <td style={{ color: 'var(--vs-ink-secondary)' }}>
                    Raw charts &amp; SEO jargon only
                  </td>
                  <td>
                    <StatusBadge tone="pass">INCLUDED ALL PLANS</StatusBadge>{' '}
                    <span style={{ fontSize: '13px', marginLeft: '6px' }}>
                      ChatGPT, Perplexity &amp; Gemini + wrong-price alerts
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>1-Click Prompt for Your Own AI Tool</strong>
                  </td>
                  <td style={{ color: 'var(--vs-crit-fg)' }}>
                    Not included — hire a developer
                  </td>
                  <td>
                    <StatusBadge tone="pass">READY TO PASTE</StatusBadge>{' '}
                    <span style={{ fontSize: '13px', marginLeft: '6px' }}>
                      Paste 1 prompt into ChatGPT, Claude, Antigravity, Cursor,
                      or Shopify
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>
                      Verified Website AI Files (<code className="vs-mono">JSON-LD</code>
                      , <code className="vs-mono">/llms.txt</code>,{' '}
                      <code className="vs-mono">/agents.md</code>)
                    </strong>
                  </td>
                  <td style={{ color: 'var(--vs-crit-fg)' }}>
                    Not included — charts only
                  </td>
                  <td>
                    <StatusBadge tone="pass">SYNTAX VALIDATED</StatusBadge>{' '}
                    <span style={{ fontSize: '13px', marginLeft: '6px' }}>
                      Auto-generated for your business + 1-click live verifier
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>You vs. Competitor Comparison Page Studio</strong>
                  </td>
                  <td style={{ color: 'var(--vs-crit-fg)' }}>
                    Not included — manual copywriting
                  </td>
                  <td>
                    <StatusBadge tone="pass">1-CLICK STUDIO</StatusBadge>{' '}
                    <span style={{ fontSize: '13px', marginLeft: '6px' }}>
                      Truth-locked{' '}
                      <code className="vs-mono">/compare/you-vs-rival</code>{' '}
                      pages + AI builder prompt
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Reddit, G2 &amp; Review Citation Playbooks</strong>
                  </td>
                  <td style={{ color: 'var(--vs-ink-secondary)' }}>
                    Enterprise add-on
                  </td>
                  <td>
                    <StatusBadge tone="pass">1-CLICK ACTIVATION</StatusBadge>{' '}
                    <span style={{ fontSize: '13px', marginLeft: '6px' }}>
                      Exact sources AI trusts + ready-to-post outreach drafts
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Optional AI Visitor Tracker &amp; /mcp Server</strong>
                  </td>
                  <td style={{ color: 'var(--vs-crit-fg)' }}>
                    Closed web UI or custom enterprise API
                  </td>
                  <td>
                    <StatusBadge tone="pass">BUILT IN</StatusBadge>{' '}
                    <span style={{ fontSize: '13px', marginLeft: '6px' }}>
                      Track AI-referred sales + connect Cursor &amp; Claude in 30s
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Transparent Pricing Ladder */}
        <PricingLadderSection />
      </div>
    </div>
  );
}
