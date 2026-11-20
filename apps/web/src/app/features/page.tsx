import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import {
  CopyCommandPill,
  LightBrowserFrame,
  StatusBadge,
} from '@verisource/ui';
import { AgentSplitPlayground } from '../../components/AgentSplitPlayground';
import { SampleBusinessMotionShowcase } from '../../components/SampleBusinessMotionShowcase';
import { StandoutFeaturesBento } from '../../components/StandoutFeaturesBento';
import { SuiteReplayPlayground } from '../../components/SuiteReplayPlayground';
import { TokenBenchmarkCard } from '../../components/TokenBenchmarkCard';

export const metadata: Metadata = {
  title:
    'All Tools, Hosted Brand /mcp & Free Website Tests | Verisource',
  description:
    'Explore every Verisource tool: Hosted Brand Truth /mcp + W3C Chrome WebMCP, 1-Click Claude/ChatGPT OAuth Connector, 60s AI Search Grader, Head-to-Head X-Ray, Wrong-Price Watchdog, 7-CMS Fix Generator, Agency White-Label Suite, and @verisource/cli.',
  alternates: {
    canonical: 'https://verisource.dev/features',
  },
};

const FREE_LIVE_TESTS: ReadonlyArray<{
  tag: string;
  title: string;
  whatItChecks: string;
  whyItMatters: string;
  href: string;
  cta: string;
  metricBadge: string;
}> = [
  {
    tag: 'TEST 01 · FULL DOMAIN AUDIT',
    title: '60-Second AI Search & Site Health Audit',
    whatItChecks:
      'Checks ChatGPT, Gemini, and Perplexity buyer mentions, 5 AI bot rules, JSON-LD schemas, and broken links in one pass.',
    whyItMatters:
      'Shows your live 0–100 score, auto-detects how your site is built, and previews your 1-click remediation prompt.',
    href: '/#scan',
    cta: 'Run Free Full Audit →',
    metricBadge: '$0 · 60 SECONDS',
  },
  {
    tag: 'TEST 02 · COMPETITOR BENCHMARK',
    title: 'Head-to-Head Competitor Domain X-Ray',
    whatItChecks:
      'Compares any two public websites across 6 technical dimensions: AI bot WAF access, SSR text density, JSON-LD, /llms.txt, and /agents.md.',
    whyItMatters:
      'Pinpoints the exact technical reason AI search cites a smaller rival ahead of your site.',
    href: '/vs',
    cta: 'Compare Two Domains →',
    metricBadge: '6 DIMENSIONS',
  },
  {
    tag: 'TEST 03 · STRUCTURED FACTS',
    title: '3-Pillar JSON-LD & FAQ Schema Checker',
    whatItChecks:
      'Inspects your live HTML for valid Organization/Brand identity, Offer pricing, and FAQPage question-and-answer blocks.',
    whyItMatters:
      'Answer engines extract structured schema blocks directly when summarizing prices and services for buyers.',
    href: '/tools/json-ld-ai-schema-checker',
    cta: 'Check Schema Free →',
    metricBadge: '3 SCHEMA PILLARS',
  },
  {
    tag: 'TEST 04 · BOT & FIREWALL ACCESS',
    title: 'GPTBot & PerplexityBot Firewall (WAF) Test',
    whatItChecks:
      'Simulates real AI search crawler requests against your /robots.txt and edge firewall (Cloudflare, Akamai, AWS WAF).',
    whyItMatters:
      'Many sites accidentally block PerplexityBot or OAI-SearchBot with HTTP 403 rules, making them invisible in AI answers.',
    href: '/tools/ai-crawler-waf-checker',
    cta: 'Test Bot Access →',
    metricBadge: '5 AI CRAWLERS',
  },
  {
    tag: 'TEST 05 · AI DIRECTORY FILES',
    title: '/llms.txt & /agents.md Live Validator',
    whatItChecks:
      'Verifies whether your root AI directory and brand rulebook files return clean HTTP 200 Markdown or hidden soft-404 pages.',
    whyItMatters:
      'Gives AI assistants an authoritative map of your real plans, pricing, and policies so they stop guessing.',
    href: '/tools/llms-txt-validator',
    cta: 'Validate AI Files →',
    metricBadge: 'HTTP 200 CHECK',
  },
  {
    tag: 'TEST 06 · SHOPIFY COMMERCE',
    title: 'Shopify AI & /api/ucp/mcp Readiness Test',
    whatItChecks:
      'Probes Shopify storefronts for 2026 Universal Commerce Protocol (/api/ucp/mcp) endpoints, Product Offer schema, and custom /agents.md overrides.',
    whyItMatters:
      'Prepares your catalog for ChatGPT Shopping and Perplexity product discovery—especially on custom or headless themes.',
    href: '/tools/shopify-ai-readiness-checker',
    cta: 'Test Shopify Store →',
    metricBadge: 'UCP + LIQUID',
  },
];

const FEATURES_FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do I need coding skills to use Verisource?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Store owners, marketers, and agencies use Console Guided Mode to copy one platform-tailored prompt into ChatGPT, Claude, or Shopify—while engineers and coding agents can also use @verisource/cli and https://mcp.verisource.dev/mcp.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I choose how often Verisource sends email reports?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Every tracked domain lets you choose Daily, Weekly (on any day of the week, defaulting to Monday), Monthly (Day 1–28), or Paused—and Watchdog Alerts fire only when a brand-new pricing conflict or bot block appears.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Verisource reduce token usage compared to browser MCP servers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Instead of streaming multi-thousand-token accessibility snapshots on every step, Verisource returns short handles (e4, n3, h1, l2) and deterministic PASS/FAIL diffs—averaging 290 tokens per scan and 24 tokens on saved workflow replays.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do the 7-day free trial and $19 One-Time Audit Pass work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Monthly Starter ($49/mo) and Pro + MCP ($99/mo) include a $0.00 due today 7-day free trial with 1-click cancellation in Stripe. If you prefer zero recurring billing, the $19 One-Time Audit Pass activates 1 complete domain audit and credits 100% toward Month 1 within 7 days.',
      },
    },
  ],
};

export default function FeaturesPage(): React.ReactElement {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(FEATURES_FAQ_JSON_LD),
        }}
      />

      {/* Hero + Clear 5-Zone Jump Bar */}
      <section
        className="vs-arch-backdrop"
        style={{
          padding: '56px 0 48px 0',
          borderBottom: '1px solid var(--vs-border)',
        }}
      >
        <div className="vs-container" style={{ maxWidth: '1040px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <StatusBadge tone="pass">ALL TOOLS &amp; LIVE TESTS</StatusBadge>
            <StatusBadge>WEB CONSOLE · CHROME SIDE PANEL · CLI · /MCP</StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 4.1vw, 46px)',
              fontWeight: 700,
              letterSpacing: '-0.034em',
              lineHeight: 1.08,
              margin: '0 0 14px 0',
              maxWidth: '22ch',
            }}
          >
            Every tool and diagnostic test we offer—organized clearly.
          </h1>

          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.62,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 26px 0',
              maxWidth: '66ch',
            }}
          >
            Try any of our six free live website tests right away, explore how
            subscribers fix AI visibility without writing code, or jump to our
            white-label agency and developer automation suites below.
          </p>

          {/* Spacious Category Jump Pills */}
          <nav
            aria-label="Tools and capabilities sections"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              paddingTop: '18px',
              borderTop: '1px solid var(--vs-border)',
            }}
          >
            <a href="#free-tests" className="vs-pill-btn vs-mono">
              01 · 6 Free Live Tests
            </a>
            <a href="#standout-features" className="vs-pill-btn vs-mono">
              02 · Core AI Visibility &amp; Fixes
            </a>
            <a href="#sample-workflow" className="vs-pill-btn vs-mono">
              03 · Industry Walkthroughs
            </a>
            <a href="#agency-suite" className="vs-pill-btn vs-mono">
              04 · Agency White-Label Suite
            </a>
            <a href="#developer-tools" className="vs-pill-btn vs-mono">
              05 · Developer CLI, Browser &amp; /mcp
            </a>
          </nav>
        </div>
      </section>

      {/* Zone 01 — 6 Free Instant Website Tests ($0 · No Login) */}
      <section
        id="free-tests"
        className="vs-sec-alt"
        style={{
          padding: '72px 0',
          borderBottom: '1px solid var(--vs-border)',
          scrollMarginTop: '72px',
        }}
      >
        <div className="vs-container" style={{ maxWidth: '1060px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '16px',
              marginBottom: '30px',
            }}
          >
            <div style={{ maxWidth: '680px' }}>
              <div className="vs-kicker" style={{ marginBottom: '8px' }}>
                SECTION 01 OF 05 · TRY FREE RIGHT NOW ($0 · NO ACCOUNT NEEDED)
              </div>
              <h2
                style={{
                  fontSize: 'clamp(24px, 3vw, 34px)',
                  fontWeight: 700,
                  letterSpacing: '-0.028em',
                  margin: '0 0 10px 0',
                }}
              >
                Six instant website tests you can run before signing up.
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '14.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Every test inspects your live public URL over HTTPS and shows
                exact findings in seconds—zero credit card or login required.
              </p>
            </div>

            <Link href="/reports" className="vs-btn vs-btn-secondary">
              Browse 520+ Audited Brand Scorecards →
            </Link>
          </div>

          <div className="vs-grid-3" style={{ gap: '22px' }}>
            {FREE_LIVE_TESTS.map((testItem) => (
              <div
                key={testItem.title}
                className="vs-card vs-card-interactive"
                style={{
                  padding: '22px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    <span
                      className="vs-mono"
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: 'var(--vs-accent)',
                      }}
                    >
                      {testItem.tag}
                    </span>
                    <StatusBadge tone="pass">{testItem.metricBadge}</StatusBadge>
                  </div>

                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      margin: '0 0 10px 0',
                      lineHeight: 1.32,
                    }}
                  >
                    {testItem.title}
                  </h3>

                  <p
                    style={{
                      margin: '0 0 10px 0',
                      fontSize: '13.5px',
                      lineHeight: 1.58,
                      color: 'var(--vs-ink-secondary)',
                    }}
                  >
                    <strong style={{ color: 'var(--vs-ink)' }}>
                      What it checks:
                    </strong>{' '}
                    {testItem.whatItChecks}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      lineHeight: 1.55,
                      color: 'var(--vs-ink-muted)',
                    }}
                  >
                    <strong style={{ color: 'var(--vs-ink-secondary)' }}>
                      Why it matters:
                    </strong>{' '}
                    {testItem.whyItMatters}
                  </p>
                </div>

                <div
                  style={{
                    paddingTop: '12px',
                    borderTop: '1px solid var(--vs-border)',
                  }}
                >
                  <Link
                    href={testItem.href}
                    className="vs-btn vs-btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {testItem.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zone 02 — Core Subscriber Platform Capabilities (Visual Motion Bento + Crawler & Schedule Cards) */}
      <section
        className="vs-sec"
        style={{
          padding: '24px 0 76px 0',
          borderBottom: '1px solid var(--vs-border)',
        }}
      >
        <div className="vs-container" style={{ maxWidth: '1060px' }}>
          <StandoutFeaturesBento />

          {/* Additional 2 Spacious Core Modules: 20-Page Link Crawler & Custom Report Schedules */}
          <div className="vs-grid-2" style={{ gap: '22px', marginTop: '24px' }}>
            <div className="vs-card" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <span className="vs-eyebrow">
                  07 · 20-PAGE SITE HEALTH &amp; BROKEN-LINK SCANNER
                </span>
                <StatusBadge tone="pass">ROBOTS.TXT OBEYED</StatusBadge>
              </div>
              <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>
                Catch 404 links, dead #anchors, and blank JavaScript pages.
              </h3>
              <p
                style={{
                  margin: '0 0 14px 0',
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                AI crawlers drop citations immediately when your{' '}
                <code className="vs-mono">/pricing</code> or product links return{' '}
                <code className="vs-mono">HTTP 404</code> or render empty
                client-only shells. <code className="vs-mono">VerisourceScan/1.0</code>{' '}
                audits up to 20 internal pages read-only and highlights exact
                broken targets.
              </p>
              <Link href="/scanner" className="vs-btn vs-btn-secondary">
                Read Crawler Transparency Spec →
              </Link>
            </div>

            <div className="vs-card" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <span className="vs-eyebrow">
                  08 · CUSTOM REPORT CADENCE &amp; CHROME SIDE PANEL
                </span>
                <StatusBadge tone="pass">DAILY · WEEKLY · MONTHLY</StatusBadge>
              </div>
              <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>
                Reports on your exact schedule—plus a live Chrome Side Panel.
              </h3>
              <p
                style={{
                  margin: '0 0 14px 0',
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Choose Daily, Weekly (pick your exact day of the week), Monthly
                (Day 1–28), or Paused for each domain, with Watchdog Alerts sent
                strictly on brand-new regressions—or inspect any tab live inside
                our Chrome Extension.
              </p>
              <a
                href="https://chromewebstore.google.com/detail/hkkihmaeffcpapckhiciaaadbanbjddb"
                target="_blank"
                rel="noopener noreferrer"
                className="vs-btn vs-btn-secondary"
              >
                Open Chrome Web Store Extension →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Zone 03 — Interactive Real-Business Before & After Walkthroughs */}
      <section
        className="vs-sec-alt"
        style={{
          padding: '72px 0',
          borderBottom: '1px solid var(--vs-border)',
        }}
      >
        <div className="vs-container" style={{ maxWidth: '1060px' }}>
          <div style={{ marginBottom: '10px' }}>
            <span className="vs-kicker">
              SECTION 03 OF 05 · REAL-WORLD BEFORE &amp; AFTER EXAMPLES
            </span>
          </div>
          <SampleBusinessMotionShowcase />
        </div>
      </section>

      {/* Zone 04 — Agency White-Label Pitch & Client Reporting Suite */}
      <section
        id="agency-suite"
        className="vs-sec"
        style={{
          padding: '72px 0',
          borderBottom: '1px solid var(--vs-border)',
          scrollMarginTop: '72px',
        }}
      >
        <div className="vs-container" style={{ maxWidth: '1060px' }}>
          <div
            className="vs-grid-split"
            style={{ alignItems: 'center', gap: '36px' }}
          >
            <div>
              <div className="vs-kicker" style={{ marginBottom: '8px' }}>
                SECTION 04 OF 05 · AGENCY WHITE-LABEL SUITE ($249/MO)
              </div>
              <h2
                style={{
                  fontSize: 'clamp(24px, 3vw, 34px)',
                  fontWeight: 700,
                  letterSpacing: '-0.028em',
                  margin: '0 0 12px 0',
                }}
              >
                Turn any prospect website into a branded executive pitch link in 60 seconds.
              </h2>
              <p
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '14.5px',
                  lineHeight: 1.62,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                SEO, web design, and Shopify agencies use Verisource to audit up
                to 15 client domains, generate custom-branded{' '}
                <code className="vs-mono">/audit/[slug]</code> scorecards with
                zero Verisource branding, and receive instant alerts the moment a
                prospect opens the report or clicks to book a call.
              </p>
              <ul
                style={{
                  margin: '0 0 20px 0',
                  paddingLeft: '18px',
                  display: 'grid',
                  gap: '8px',
                  fontSize: '13.5px',
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                <li>
                  Upload a CSV of prospect domains to mint pitch links, outreach
                  emails, and LinkedIn notes in one batch.
                </li>
                <li>
                  Custom agency logo, accent hex color, calendar booking CTA,
                  and print-ready PDF executive briefs.
                </li>
                <li>
                  Includes 5,000 monthly <code className="vs-mono">/mcp</code>{' '}
                  credits to automate multi-client fixes in Cursor or Claude.
                </li>
              </ul>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <Link href="/agencies#sandbox" className="vs-btn">
                  Try Live White-Label Sandbox →
                </Link>
                <Link href="/sample-audit" className="vs-btn vs-btn-secondary">
                  View Sample Client Brief →
                </Link>
              </div>
            </div>

            {/* Clean Light-Paper Client Brief Visual Preview */}
            <div className="vs-bezel">
              <div
                className="vs-card"
                style={{
                  padding: '22px 24px',
                  background: '#FAF9F6',
                  color: '#0F172A',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '12px',
                    marginBottom: '14px',
                    borderBottom: '2px solid #0F172A',
                  }}
                >
                  <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>
                    YOUR AGENCY LOGO · AI SEARCH AUDIT
                  </strong>
                  <span
                    className="vs-mono"
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '99px',
                      background: '#ECFDF5',
                      color: '#065F46',
                    }}
                  >
                    CTA CLICKED · 3 VIEWS
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '10px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div
                      className="vs-mono"
                      style={{ fontSize: '10.5px', color: '#64748B' }}
                    >
                      PROSPECT AI SCORE
                    </div>
                    <div
                      className="vs-mono"
                      style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#B45309',
                      }}
                    >
                      38 / 100
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div
                      className="vs-mono"
                      style={{ fontSize: '10.5px', color: '#64748B' }}
                    >
                      DETECTED PLATFORM
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#0F172A',
                        marginTop: '4px',
                      }}
                    >
                      Shopify Storefront
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    fontSize: '12.5px',
                    color: '#7F1D1D',
                    marginBottom: '14px',
                  }}
                >
                  <strong>Fix First:</strong> Missing Product Offer{' '}
                  <code>JSON-LD</code> and custom <code>/agents.md</code>—AI
                  assistants recommend 3 rival stores ahead of you.
                </div>

                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Book 15-Minute Fix Walkthrough with Your Agency →
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone 05 — Developer CLI, Real-Browser Flow Replay & Paid /mcp Server */}
      <section
        id="developer-tools"
        className="vs-sec-alt"
        style={{
          padding: '72px 0',
          borderBottom: '1px solid var(--vs-border)',
          scrollMarginTop: '72px',
        }}
      >
        <div className="vs-container" style={{ maxWidth: '1060px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            <div style={{ maxWidth: '680px' }}>
              <div className="vs-kicker" style={{ marginBottom: '8px' }}>
                SECTION 05 OF 05 · FOR DEVELOPERS, CI PIPELINES &amp; CODING AGENTS
              </div>
              <h2
                style={{
                  fontSize: 'clamp(24px, 3vw, 34px)',
                  fontWeight: 700,
                  letterSpacing: '-0.028em',
                  margin: '0 0 10px 0',
                }}
              >
                Verify AI readiness, browser flows, and backend logs from your terminal or IDE.
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '14.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Wire Verisource into Claude Code, Cursor, Windsurf, Antigravity,
                or GitHub Actions so every deploy proves its schema, links, UI
                flows, and server logs pass cleanly.
              </p>
            </div>
            <CopyCommandPill command="npx --yes https://verisource.dev/downloads/verisource-cli.tgz agent --skill --install all" />
          </div>

          {/* Sub-Block A: Interactive Coding Agent Split Playground */}
          <div id="agents" style={{ marginBottom: '40px' }}>
            <AgentSplitPlayground />
          </div>

          {/* Sub-Block B: Deterministic Browser Suite Replay & Token Benchmark */}
          <div id="demo" style={{ marginBottom: '40px' }}>
            <div style={{ marginBottom: '20px' }}>
              <SuiteReplayPlayground />
            </div>
            <TokenBenchmarkCard />
          </div>

          {/* Sub-Block C: 3 Separated Developer Capability Cards (/mcp, Route Mapper, Log Correlation) */}
          <div className="vs-grid-3" style={{ gap: '22px' }}>
            <div className="vs-card" style={{ padding: '22px 24px' }}>
              <div className="vs-eyebrow" style={{ marginBottom: '8px' }}>
                HOSTED BRAND /MCP · WEBMCP · OAUTH 2.1
              </div>
              <h3 style={{ fontSize: '17px', margin: '0 0 8px 0' }}>
                Hosted Brand Truth /mcp + 1-Click Claude/ChatGPT Connector
              </h3>
              <p
                style={{
                  margin: '0 0 14px 0',
                  fontSize: '13.5px',
                  lineHeight: 1.58,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Give every paid domain a hosted{' '}
                <code className="vs-mono">/b/&#123;domain&#125;/mcp</code>{' '}
                endpoint + W3C Chrome <code className="vs-mono">WebMCP</code>{' '}
                script via 2 lines in <code className="vs-mono">&lt;head&gt;</code>
                —and connect <code className="vs-mono">claude.ai</code> or{' '}
                <code className="vs-mono">chatgpt.com</code> in 1 click at{' '}
                <code className="vs-mono">/oauth/mcp</code>.
              </p>
              <Link href="/mcp-guide#hosted-brand-mcp" className="vs-btn vs-btn-secondary">
                Hosted /mcp &amp; OAuth Setup →
              </Link>
            </div>

            <div id="route-mapper" className="vs-card" style={{ padding: '22px 24px' }}>
              <div className="vs-eyebrow" style={{ marginBottom: '8px' }}>
                VERISOURCE MAP [URL | ./REPO]
              </div>
              <h3 style={{ fontSize: '17px', margin: '0 0 8px 0' }}>
                Map live routes, JSON-LD emitters, and API handlers
              </h3>
              <p
                style={{
                  margin: '0 0 14px 0',
                  fontSize: '13.5px',
                  lineHeight: 1.58,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Run <code className="vs-mono">verisource map</code> against any
                live domain or local Next.js / React repo to index routes,{' '}
                <code className="vs-mono">application/ld+json</code> emitters,
                and diff route changes in CI.
              </p>
              <CopyCommandPill command="npx --yes https://verisource.dev/downloads/verisource-cli.tgz map . --diff" />
            </div>

            <div id="log-correlation" className="vs-card" style={{ padding: '22px 24px' }}>
              <div className="vs-eyebrow" style={{ marginBottom: '8px' }}>
                BACKEND LOG CORRELATION &amp; PRIVACY
              </div>
              <h3 style={{ fontSize: '17px', margin: '0 0 8px 0' }}>
                Join misleading UI toasts to server errors
              </h3>
              <p
                style={{
                  margin: '0 0 14px 0',
                  fontSize: '13.5px',
                  lineHeight: 1.58,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                <code className="vs-mono">
                  verisource log vercel | supabase | cloudflare
                </code>{' '}
                correlates recent 5-minute runtime errors locally while keeping{' '}
                <code className="vs-mono">.verisource/config.json</code> tokens
                strictly on your machine.
              </p>
              <LightBrowserFrame
                url="Correlated [n2 + g1]"
                statusLabel="HTTP 500 CAUGHT"
                statusTone="critical"
              >
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  UI showed &ldquo;Saved&rdquo; while{' '}
                  <code>POST /api/billing</code> threw <code>HTTP 500</code>.
                </div>
              </LightBrowserFrame>
            </div>
          </div>
        </div>
      </section>

      {/* Zone 06 — Closing Conversion Band & Expandable FAQ Accordion */}
      <section className="vs-sec" style={{ borderBottom: 'none', padding: '72px 0' }}>
        <div className="vs-container" style={{ maxWidth: '920px' }}>
          <div
            className="vs-band-obsidian"
            style={{
              padding: '32px',
              marginBottom: '48px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div style={{ maxWidth: '560px' }}>
              <div className="vs-kicker" style={{ marginBottom: '6px' }}>
                READY TO TEST YOUR SITE?
              </div>
              <h2
                style={{
                  margin: '0 0 8px 0',
                  fontSize: 'clamp(22px, 2.7vw, 29px)',
                  fontWeight: 700,
                }}
              >
                Start with a free 60-second audit or a $0 7-day trial.
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Test your website free on the homepage, activate a $19 One-Time
                Audit Pass (zero recurring billing), or start a 7-day free trial
                on Starter or Pro.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link href="/#scan" className="vs-btn">
                Test My Website Free →
              </Link>
              <Link href="/pricing" className="vs-btn vs-btn-secondary">
                View Plans &amp; Trial →
              </Link>
            </div>
          </div>

          <div className="vs-kicker" style={{ marginBottom: '8px' }}>
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2
            style={{
              fontSize: 'clamp(23px, 2.8vw, 31px)',
              fontWeight: 700,
              letterSpacing: '-0.028em',
              margin: '0 0 18px 0',
            }}
          >
            Clear answers before you start
          </h2>

          <div className="vs-stack" style={{ gap: '12px' }}>
            {[
              {
                q: 'Do I need coding skills to use Verisource?',
                a: 'No. Store owners, marketers, and agencies use Console Guided Mode to copy one platform-tailored prompt into ChatGPT, Claude, or Shopify—or install our drop-in WordPress and Shopify bridges on /connectors. Developers and coding agents get full @verisource/cli and Streamable HTTP /mcp access.',
              },
              {
                q: 'Can I choose Daily, Weekly, or Monthly email reports—and pick which day?',
                a: 'Yes. Inside your Console, each domain lets you select Daily, Weekly (any day from Sunday to Saturday, defaulting to Monday), Monthly (Day 1–28), or Paused. Watchdog Alerts only fire when a brand-new regression appears.',
              },
              {
                q: 'Which website platforms are auto-detected for 1-click fixes?',
                a: 'Shopify (including /api/ucp/mcp and agents.md.liquid), WordPress, Webflow, Wix, Squarespace, Framer, and custom Next.js or React sites.',
              },
              {
                q: 'Does the 20-page link scanner obey /robots.txt?',
                a: 'Yes. VerisourceScan/1.0 fetches /robots.txt first, respects Disallow and Crawl-delay rules, sends only read-only GET and HEAD requests, and blocks private IPs.',
              },
              {
                q: 'What is the Hosted Brand /mcp Server + W3C Chrome WebMCP embed?',
                a: 'Every Starter ($49/mo), Pro ($99/mo), and Agency ($249/mo) domain automatically receives a hosted, read-only Brand Truth MCP server at https://mcp.verisource.dev/b/{domain}/mcp plus an edge-cached WebMCP script (/webmcp.js). Paste 2 lines into your site <head> and AI assistants plus Chrome WebMCP agents can query your exact pricing, verify claims, compare against rivals, and read official FAQs directly—zero backend code required.',
              },
              {
                q: 'How does the $19 One-Time Audit Pass compare to the 7-day free trial?',
                a: 'Monthly Starter ($49/mo) and Pro + MCP ($99/mo) include a $0.00 due today 7-day trial with 1-click cancellation. Buyers who want zero recurring billing can purchase the $19 One-Time Audit Pass—and if they upgrade within 7 days, the full $19 credits toward Month 1.',
              },
            ].map((item) => (
              <details key={item.q} className="vs-disclosure">
                <summary className="vs-disclosure-summary">
                  <strong style={{ fontSize: '14.5px' }}>{item.q}</strong>
                  <span className="vs-disclosure-pill">Answer</span>
                </summary>
                <div
                  className="vs-disclosure-body"
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.62,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
