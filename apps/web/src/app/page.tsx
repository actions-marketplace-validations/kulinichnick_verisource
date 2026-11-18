import Link from 'next/link';
import React from 'react';
import { CopyCommandPill, StatusBadge } from '@verisource/ui';
import { AgentSplitPlayground } from '../components/AgentSplitPlayground';
import { HeroCommandSwitcher } from '../components/HeroCommandSwitcher';
import { PricingLadderSection } from '../components/PricingLadderSection';
import { PublicGraderClient } from '../components/PublicGraderClient';
import { SampleBusinessMotionShowcase } from '../components/SampleBusinessMotionShowcase';
import { StandoutFeaturesBento } from '../components/StandoutFeaturesBento';
import { SuiteReplayPlayground } from '../components/SuiteReplayPlayground';
import { TokenBenchmarkCard } from '../components/TokenBenchmarkCard';

export default function HomePage(): React.ReactElement {
  return (
    <div>
      {/* Band 1 — Centered Full-Viewport Obsidian & Warm Brass Studio Hero */}
      <section
        className="vs-arch-backdrop"
        style={{
          minHeight: 'calc(92svh - 60px)',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--vs-border)',
          padding: '64px 0 72px 0',
        }}
      >
        <div
          className="vs-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '940px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '22px',
            }}
          >
            <StatusBadge tone="pass">
              CHATGPT · PERPLEXITY · GEMINI · CLAUDE
            </StatusBadge>
            <StatusBadge>1-CLICK AI FIX PROMPT · CLI · /MCP</StatusBadge>
            <StatusBadge>SCHEMA &amp; FACT VERIFIED</StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(34px, 4.8vw, 58px)',
              lineHeight: 1.05,
              letterSpacing: '-0.038em',
              fontWeight: 700,
              margin: '0 0 20px 0',
              maxWidth: '18.5ch',
            }}
          >
            Control how AI search recommends your brand.{' '}
            <span
              style={{
                display: 'block',
                color: 'var(--vs-accent)',
                marginTop: '4px',
              }}
            >
              Verisource checks—and ships the fix.
            </span>
          </h1>

          <p
            style={{
              fontSize: '16.5px',
              lineHeight: 1.64,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 28px 0',
              maxWidth: '62ch',
            }}
          >
            AI-referred buyers convert at{' '}
            <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
              14.2%–15.9%
            </strong>{' '}
            vs. Google organic&rsquo;s{' '}
            <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
              1.76%–2.8%
            </strong>
            . Verisource checks real buyer citations across 3 AI engines, flags
            invented pricing claims and broken pages, and gives your team—or
            your coding agent—validated{' '}
            <code className="vs-mono">JSON-LD</code>,{' '}
            <code className="vs-mono">/agents.md</code>, and real-browser{' '}
            <code className="vs-mono">PASS/FAIL</code> proof.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '28px',
            }}
          >
            <a
              href="#scan"
              className="vs-btn"
              style={{ padding: '12px 22px', fontSize: '14px' }}
            >
              Scan Your Site Free ↓
            </a>
            <Link
              href="/pricing"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '12px 20px', fontSize: '14px' }}
            >
              Start 7-Day Free Trial ($0 Today) →
            </Link>
            <Link
              href="/features"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '12px 18px', fontSize: '14px' }}
            >
              Explore All 11 Capabilities →
            </Link>
          </div>

          <HeroCommandSwitcher />
        </div>
      </section>

      {/* Band 2 — Focused Live Site, AI Readiness & Broken-Link Scanner */}
      <section id="scan" className="vs-sec-alt">
        <div className="vs-container">
          <div
            style={{
              textAlign: 'center',
              maxWidth: '680px',
              margin: '0 auto 26px auto',
            }}
          >
            <div className="vs-kicker" style={{ marginBottom: '8px' }}>
              Free · No signup required
            </div>
            <h2
              style={{
                fontSize: 'clamp(25px, 3vw, 34px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                margin: '0 0 10px 0',
              }}
            >
              Scan your site for AI visibility, wrong prices, and broken links.
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '14.5px',
                lineHeight: 1.6,
                color: 'var(--vs-ink-secondary)',
              }}
            >
              Checks ChatGPT, Gemini, and Perplexity buyer mentions,{' '}
              <code className="vs-mono">GPTBot</code>/
              <code className="vs-mono">PerplexityBot</code> access,{' '}
              <code className="vs-mono">JSON-LD</code> facts, and internal link
              health—then drafts one ready-to-paste prompt for your AI tool.
            </p>
          </div>

          <div id="audit" className="vs-bezel-obsidian">
            <PublicGraderClient />
          </div>

          <div
            className="vs-card"
            style={{
              marginTop: '18px',
              padding: '13px 18px',
              background: 'var(--vs-surface)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px 18px',
              fontSize: '12.5px',
              color: 'var(--vs-ink-secondary)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px' }}>
              <span>
                <strong className="vs-mono" style={{ color: 'var(--vs-accent)' }}>
                  95%
                </strong>{' '}
                of 40 audited sites lack <code className="vs-mono">/agents.md</code>
              </span>
              <span>
                <strong className="vs-mono" style={{ color: 'var(--vs-pass-fg)' }}>
                  14.2%–15.9%
                </strong>{' '}
                AI referral buyer conversion
              </span>
              <span>
                <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
                  7 CMS
                </strong>{' '}
                platforms auto-detected in 1 click
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              <Link
                href="/benchmarks/ai-search-readiness-2026"
                style={{
                  color: 'var(--vs-ink)',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                2026 40-Domain Study →
              </Link>
              <Link
                href="/agencies#sandbox"
                style={{
                  color: 'var(--vs-accent)',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                Agency White-Label Sandbox →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Band 3 — Split-Screen Coding Agent & AI Verification Playground */}
      <section id="agents" className="vs-sec">
        <div className="vs-container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '22px',
            }}
          >
            <div style={{ maxWidth: '680px' }}>
              <div className="vs-kicker" style={{ marginBottom: '8px' }}>
                For Claude Code, Cursor, Codex, Antigravity &amp; ChatGPT
              </div>
              <h2
                style={{
                  fontSize: 'clamp(25px, 3vw, 35px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  margin: '0 0 10px 0',
                }}
              >
                Your AI updates your site. Verisource proves it works in the real world.
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '14.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Whether you paste our 1-Click Fix Prompt into ChatGPT or wire{' '}
                <code className="vs-mono">@verisource/cli</code> +{' '}
                <code className="vs-mono">/mcp</code> into a coding agent,
                Verisource verifies live schema, bot readability, browser flows,
                and backend error logs before anything ships.
              </p>
            </div>
            <CopyCommandPill command="npx @verisource/cli agent --skill --install all" />
          </div>

          <AgentSplitPlayground />
        </div>
      </section>

      {/* Band 4 — Codebase-Free Site Checks & Token Overhead Benchmark */}
      <section id="any-site" className="vs-sec-alt">
        <div className="vs-container">
          <div
            className="vs-grid-split"
            style={{
              alignItems: 'center',
              gap: '28px',
              marginBottom: '28px',
            }}
          >
            <div>
              <div className="vs-kicker" style={{ marginBottom: '8px' }}>
                verisource scan &lt;any-url&gt; · mcp.verisource.dev/mcp
              </div>
              <h2
                style={{
                  fontSize: 'clamp(24px, 2.9vw, 33px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  margin: '0 0 12px 0',
                }}
              >
                No source code needed. Point it at any live store, SaaS app, or rival domain.
              </h2>
              <p
                style={{
                  margin: '0 0 18px 0',
                  fontSize: '14.5px',
                  lineHeight: 1.62,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Audit Shopify storefronts (including{' '}
                <code className="vs-mono">/api/ucp/mcp</code>), WordPress,
                Webflow, or custom Next.js apps over live HTTP. Compare your
                domain head-to-head against a competitor, inspect exact{' '}
                <code className="vs-mono">GPTBot</code> DOM streams, and drill
                into short handle IDs without flooding your agent&rsquo;s context
                window.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <Link href="/mcp-guide" className="vs-btn vs-btn-secondary">
                  30s MCP Setup Guide →
                </Link>
                <Link href="/features" className="vs-btn vs-btn-secondary">
                  CLI &amp; Scanner Specs →
                </Link>
              </div>
            </div>

            <div className="vs-terminal-frame">
              <div className="vs-terminal-chrome">
                <span>Terminal · Live Multi-Page + GEO Check</span>
                <StatusBadge tone="pass">EXIT 0 · 1.6S</StatusBadge>
              </div>
              <div className="vs-terminal-body">
                <div style={{ color: '#EEF1F6', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: 'var(--vs-accent)', marginRight: '8px' }}>$</span>
                  verisource scan https://acmecloud.io --depth 2
                </div>
                <div style={{ color: 'var(--vs-ink-muted)', marginBottom: '4px' }}>
                  robots.txt obeyed · probing 14 routes + 3 AI engines...
                </div>
                <div style={{ color: 'var(--vs-pass-fg)', marginBottom: '4px' }}>
                  ✓ [bots]   GPTBot, OAI-SearchBot, PerplexityBot  HTTP 200
                </div>
                <div style={{ color: 'var(--vs-pass-fg)', marginBottom: '4px' }}>
                  ✓ [schema] Organization + OfferCatalog + FAQPage  valid
                </div>
                <div style={{ color: 'var(--vs-pass-fg)', marginBottom: '4px' }}>
                  ✓ [truth]  0 pricing or policy hallucinations     100%
                </div>
                <div style={{ color: 'var(--vs-pass-fg)', fontWeight: 600, marginTop: '8px' }}>
                  PASS  acmecloud.io · 14/14 pages · 38/38 links · 1.6s
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div className="vs-eyebrow">
              READ-ONLY DASHBOARDS VS. READ-WRITE EXECUTION &amp; COMPACT VERIFICATION
            </div>
          </div>
          <TokenBenchmarkCard />
        </div>
      </section>

      {/* Band 5 — Guided No-Code Recorder & Parallel 4-Target Suite Replay */}
      <section id="demo" className="vs-sec">
        <div className="vs-container">
          <div style={{ maxWidth: '720px', marginBottom: '20px' }}>
            <div className="vs-kicker" style={{ marginBottom: '6px' }}>
              HOW VERISOURCE WORKS · FOR FOUNDERS, AGENCIES &amp; TEAMS
            </div>
            <h2
              style={{
                fontSize: 'clamp(25px, 3vw, 34px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                margin: '0 0 10px 0',
              }}
            >
              Fix your site without writing code—or replay every key flow after a deploy.
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '14.5px',
                lineHeight: 1.6,
                color: 'var(--vs-ink-secondary)',
              }}
            >
              Switch Console Guided Mode on for step-by-step instructions tailored
              to your website builder, record browser checks once in Chrome, or
              batch-audit 15 agency client domains into white-label{' '}
              <code className="vs-mono">/audit/[slug]</code> pitch links.
            </p>
          </div>

          <div
            className="vs-card vs-ledger-strip-3"
            style={{ marginBottom: '20px', overflow: 'hidden' }}
          >
            <div style={{ padding: '14px 18px' }}>
              <div className="vs-eyebrow" style={{ color: 'var(--vs-accent)', marginBottom: '4px' }}>
                STEP 01 · DIAGNOSE &amp; CRAWL
              </div>
              <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
                Scan AI citations, wrong prices, and broken links across your pages.
              </div>
            </div>
            <div style={{ padding: '14px 18px', background: 'var(--vs-surface-warm)' }}>
              <div className="vs-eyebrow" style={{ color: 'var(--vs-accent)', marginBottom: '4px' }}>
                STEP 02 · COPY 1 AI PROMPT
              </div>
              <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
                Paste 1 ready-made prompt into ChatGPT, Claude, Cursor, or Shopify.
              </div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div className="vs-eyebrow" style={{ color: 'var(--vs-pass-fg)', marginBottom: '4px' }}>
                STEP 03 · VERIFY LIVE
              </div>
              <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
                Confirm 4/4 files live, replay flows, and track weekly Share-of-Voice.
              </div>
            </div>
          </div>

          <SuiteReplayPlayground />
        </div>
      </section>

      {/* Band 6 — Real-Business Uplift Storyboard & 6-Capability Motion Showcase */}
      <section className="vs-sec-alt">
        <div className="vs-container">
          <SampleBusinessMotionShowcase />
          <StandoutFeaturesBento />
        </div>
      </section>

      {/* Band 7 — Transparent Pricing Ladder ($19 Pass · $49 Starter · $99 Pro+MCP · $249 Agency) */}
      <section className="vs-sec">
        <div className="vs-container">
          <PricingLadderSection />
        </div>
      </section>

      {/* Band 8 — Closing High-Contrast Conversion Band */}
      <section className="vs-sec-alt" style={{ borderBottom: 'none' }}>
        <div className="vs-container">
          <div
            className="vs-band-obsidian"
            style={{
              padding: '36px 32px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '22px',
            }}
          >
            <div style={{ maxWidth: '640px' }}>
              <div className="vs-kicker" style={{ marginBottom: '8px' }}>
                Start in 60 seconds · $0.00 due today on 7-day free trial
              </div>
              <h2
                style={{
                  margin: '0 0 10px 0',
                  fontSize: 'clamp(22px, 2.8vw, 30px)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: 'var(--vs-ink)',
                }}
              >
                Stop letting AI search quote wrong prices or send your buyers to competitors.
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Run a free audit on your domain right now, or start a 7-day free
                trial ($0.00 charged today, cancel in 1 click) to activate your
                1-Click AI Fix Prompt, 20-page site health crawls, and weekly
                Share-of-Voice tracking.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a
                href="#scan"
                className="vs-btn vs-btn-secondary"
                style={{ padding: '11px 18px' }}
              >
                Scan My Site Free ↑
              </a>
              <Link
                href="/pricing"
                className="vs-btn"
                style={{ padding: '11px 20px' }}
              >
                Start 7-Day Free Trial →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
