import Link from 'next/link';
import React from 'react';
import {
  buildAiAttributionSnippet,
  buildEdgeBotCrawlerSnippet,
} from '@verisource/core-geo';
import { CodeArtifactCard, StatusBadge } from '@verisource/ui';
import { HeroSignalSchematic } from '../components/HeroSignalSchematic';
import { PlatformModulesShowcase } from '../components/PlatformModulesShowcase';
import { PricingLadderSection } from '../components/PricingLadderSection';
import { PublicGraderClient } from '../components/PublicGraderClient';

export default function HomePage(): React.ReactElement {
  const samplePixel = buildAiAttributionSnippet({
    trackingPixelToken: 'YOUR-DOMAIN-PIXEL-UUID',
    ingestionUrl: 'https://verisource.dev/api/pixel',
  });

  const sampleEdgeCrawlerSnippet = buildEdgeBotCrawlerSnippet({
    trackingPixelToken: 'YOUR-DOMAIN-PIXEL-UUID',
    checkoutKey: 'YOUR_24_CHAR_SERVER_KEY',
    ingestionUrl: 'https://verisource.dev/api/pixel',
  });

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
              <StatusBadge>ACTION CONSOLE + /MCP SERVER</StatusBadge>
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
                And ship the fixes agents read.
              </span>
            </h1>

            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.62,
                color: 'var(--vs-ink-secondary)',
                margin: '0 0 24px 0',
                maxWidth: '590px',
              }}
            >
              40%–58% of B2B and commerce discovery now happens inside AI answer
              engines, where referred buyers convert at{' '}
              <strong className="vs-mono">14.2%–15.9%</strong> vs. Google
              organic&rsquo;s <strong className="vs-mono">1.76%–2.8%</strong>.
              Passive GEO trackers charge $245–$499+/mo just to show charts.
              Verisource measures your Share-of-Voice, flags hallucinated
              pricing, and generates syntax-validated{' '}
              <code className="vs-mono">JSON-LD</code>,{' '}
              <code className="vs-mono">/llms.txt</code>, and{' '}
              <code className="vs-mono">/agents.md</code> fixes inside your
              private Admin Console.
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
                Audit Your Website Free ↓
              </a>
              <a href="#platform" className="vs-btn vs-btn-secondary">
                Explore Platform Modules
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
                Test your site free below
              </span>
              <span>
                <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
                  02
                </strong>{' '}
                Activate your private Console
              </span>
              <span>
                <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
                  03
                </strong>{' '}
                Deploy &amp; verify live AI fixes
              </span>
            </div>
          </div>

          <HeroSignalSchematic />
        </div>
      </section>

      <div className="vs-container">
        {/* Customer Tests Their Own Domain — Limited Free Preview */}
        <PublicGraderClient />

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
            Why founders and agencies switch from passive $499/mo trackers.
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
            Knowing ChatGPT omitted your brand is only half the job. Verisource
            combines multi-engine visibility analytics with ready-to-paste site
            remediation and a Streamable HTTP{' '}
            <code className="vs-mono">/mcp</code> server.
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
                    <strong>Mention vs. Citation Rate &amp; Sentiment</strong>
                  </td>
                  <td style={{ color: 'var(--vs-ink-secondary)' }}>
                    Included on mid-to-enterprise tiers
                  </td>
                  <td>
                    <StatusBadge tone="pass">INCLUDED ALL PLANS</StatusBadge>{' '}
                    <span style={{ fontSize: '13px', marginLeft: '6px' }}>
                      ChatGPT, Perplexity &amp; Gemini + Rival SoV %
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Suggested Funnel Prompts &amp; Source Types</strong>
                  </td>
                  <td style={{ color: 'var(--vs-ink-secondary)' }}>
                    Manual setup or enterprise add-on
                  </td>
                  <td>
                    <StatusBadge tone="pass">1-CLICK ACTIVATION</StatusBadge>{' '}
                    <span style={{ fontSize: '13px', marginLeft: '6px' }}>
                      Discovery, Comparison, Pricing + Reddit/G2/Editorial tags
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>JS Readability + Server Bot Crawl Logs</strong>
                  </td>
                  <td style={{ color: 'var(--vs-ink-secondary)' }}>
                    Enterprise contracts only
                  </td>
                  <td>
                    <StatusBadge tone="pass">BUILT IN</StatusBadge>{' '}
                    <span style={{ fontSize: '13px', marginLeft: '6px' }}>
                      SSR token density check + Edge{' '}
                      <code className="vs-mono">ai_bot_crawl</code> logger +
                      checkout pixel
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>
                      On-Site Remediation (<code className="vs-mono">JSON-LD</code>
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
                      Copy-paste code + Shopify{' '}
                      <code className="vs-mono">/api/ucp/mcp</code> adapter +
                      live HTTP verifier
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>1-Click AI Fix Prompt &amp; vs. Rival Page Studio</strong>
                  </td>
                  <td style={{ color: 'var(--vs-crit-fg)' }}>
                    Not included — manual copywriting
                  </td>
                  <td>
                    <StatusBadge tone="pass">READY TO PASTE</StatusBadge>{' '}
                    <span style={{ fontSize: '13px', marginLeft: '6px' }}>
                      Master AI prompt + truth-locked{' '}
                      <code className="vs-mono">/compare/you-vs-rival</code>{' '}
                      pages
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Autonomous Coding Agent (/mcp) Access</strong>
                  </td>
                  <td style={{ color: 'var(--vs-crit-fg)' }}>
                    Closed web UI or custom enterprise API
                  </td>
                  <td>
                    <StatusBadge tone="pass">OFFICIAL MCP REGISTRY</StatusBadge>{' '}
                    <span style={{ fontSize: '13px', marginLeft: '6px' }}>
                      Connect Claude, Cursor, Windsurf &amp; Antigravity in 30s
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Agent Analytics: Browser Revenue Pixel + Edge AI Bot Crawler Log */}
        <section id="agent-analytics" style={{ marginTop: '72px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            AGENT ANALYTICS · CRAWLER LOGS + BUYER CONVERSIONS
          </div>
          <h2
            style={{
              fontSize: 'clamp(24px, 2.8vw, 29px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 8px 0',
            }}
          >
            See every AI bot crawl and every AI-referred customer purchase.
          </h2>
          <p
            style={{
              fontSize: '14.5px',
              lineHeight: 1.58,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 18px 0',
              maxWidth: '740px',
            }}
          >
            Standard analytics tools never execute when{' '}
            <code className="vs-mono">GPTBot</code> or{' '}
            <code className="vs-mono">PerplexityBot</code> fetches your pricing
            page. Subscribers get two lightweight drop-in snippets inside the
            Console: a 10-line browser checkout pixel and a non-blocking edge
            middleware logger.
          </p>

          <div className="vs-grid-2">
            <CodeArtifactCard
              title="1. Browser AI Visit & Checkout Revenue Pixel"
              plainSummary="Attributes human visits and completed orders from chatgpt.com, perplexity.ai, gemini.google.com, and claude.ai."
              fileHint="Paste before </head> on any site or Shopify Custom Pixel"
              code={samplePixel}
            />
            <CodeArtifactCard
              title="2. Edge / Middleware AI Bot Crawl Logger"
              plainSummary="Logs server-side hits from GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, and Google-Extended."
              fileHint="Drop into Next.js middleware.ts or Cloudflare Worker"
              code={sampleEdgeCrawlerSnippet}
            />
          </div>
        </section>

        {/* Transparent Pricing Ladder */}
        <PricingLadderSection />
      </div>
    </div>
  );
}
