import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { PricingLadderSection } from '../components/PricingLadderSection';
import { PublicGraderClient } from '../components/PublicGraderClient';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://verisource.dev',
  },
};

export default function HomePage(): React.ReactElement {
  return (
    <div>
      {/* Section 1 — Calm Hero + Immediate Free Website Audit */}
      <section
        id="scan"
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '52px 0 68px 0',
        }}
      >
        <div className="vs-container" style={{ maxWidth: '980px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <StatusBadge tone="pass">
                CHATGPT · PERPLEXITY · GEMINI · CLAUDE
              </StatusBadge>
              <StatusBadge>HOSTED BRAND /MCP + CHROME WEBMCP</StatusBadge>
              <StatusBadge>SCHEMA &amp; FACT VERIFIED</StatusBadge>
            </div>

            <h1
              style={{
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                lineHeight: 1.07,
                letterSpacing: '-0.036em',
                fontWeight: 700,
                margin: '0 0 16px 0',
                maxWidth: '19ch',
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
                fontSize: '16px',
                lineHeight: 1.62,
                color: 'var(--vs-ink-secondary)',
                margin: '0 0 22px 0',
                maxWidth: '58ch',
              }}
            >
              Buyers arriving from AI search convert at{' '}
              <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
                14.2%–15.9%
              </strong>{' '}
              vs. Google organic&rsquo;s{' '}
              <strong className="vs-mono" style={{ color: 'var(--vs-ink)' }}>
                1.76%–2.8%
              </strong>
              . Test your website below to see what AI engines tell customers,
              catch wrong pricing claims, and copy one ready-made fix for your
              platform.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <Link
                href="/features"
                className="vs-btn vs-btn-secondary"
                style={{ padding: '10px 18px', fontSize: '13.5px' }}
              >
                Explore All Tools &amp; Live Tests →
              </Link>
              <Link
                href="/pricing"
                className="vs-btn vs-btn-secondary"
                style={{ padding: '10px 18px', fontSize: '13.5px' }}
              >
                Start 7-Day Free Trial ($0 Today) →
              </Link>
            </div>
          </div>

          {/* Live Free 60-Second Website Test */}
          <div id="grader">
            <div id="audit" className="vs-bezel-obsidian">
              <PublicGraderClient />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — 3 Clear Steps: How Verisource Works */}
      <section
        style={{
          padding: '64px 0',
          borderBottom: '1px solid var(--vs-border)',
          background: 'var(--vs-bg)',
        }}
      >
        <div className="vs-container" style={{ maxWidth: '1040px' }}>
          <div
            style={{
              textAlign: 'center',
              maxWidth: '640px',
              margin: '0 auto 34px auto',
            }}
          >
            <div className="vs-kicker" style={{ marginBottom: '8px' }}>
              HOW VERISOURCE WORKS · NO CODING REQUIRED
            </div>
            <h2
              style={{
                fontSize: 'clamp(24px, 3vw, 33px)',
                fontWeight: 700,
                letterSpacing: '-0.028em',
                margin: '0 0 10px 0',
              }}
            >
              From first website test to verified AI visibility in three steps.
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '14.5px',
                lineHeight: 1.6,
                color: 'var(--vs-ink-secondary)',
              }}
            >
              Built so store owners, marketers, and agencies can fix their site
              in minutes—while giving developers full CLI and API control when
              they want it.
            </p>
          </div>

          <div className="vs-grid-3" style={{ gap: '20px' }}>
            <div className="vs-card" style={{ padding: '22px 24px' }}>
              <div
                className="vs-mono"
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--vs-accent)',
                  marginBottom: '8px',
                }}
              >
                STEP 01 · TEST YOUR WEBSITE
              </div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.015em',
                }}
              >
                See what AI tells buyers—and what blocks bots.
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Verisource checks ChatGPT, Gemini, and Perplexity answers, tests{' '}
                <code className="vs-mono">GPTBot</code> and{' '}
                <code className="vs-mono">PerplexityBot</code> firewall rules,
                and scans up to 20 pages for broken links.
              </p>
            </div>

            <div className="vs-card" style={{ padding: '22px 24px' }}>
              <div
                className="vs-mono"
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--vs-accent)',
                  marginBottom: '8px',
                }}
              >
                STEP 02 · COPY 1 AI PROMPT
              </div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.015em',
                }}
              >
                Auto-tailored to how your website is built.
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Auto-detects Shopify, WordPress, Webflow, Wix, Squarespace,
                Framer, or Next.js—giving you one prompt to paste into ChatGPT,
                Claude, Cursor, or Shopify Sidekick.
              </p>
            </div>

            <div className="vs-card" style={{ padding: '22px 24px' }}>
              <div
                className="vs-mono"
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--vs-pass-fg)',
                  marginBottom: '8px',
                }}
              >
                STEP 03 · VERIFY &amp; TRACK ON YOUR SCHEDULE
              </div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.015em',
                }}
              >
                Confirm 4/4 fixes live and track weekly gains.
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Click once to verify your schema and AI fact files return{' '}
                <code className="vs-mono">HTTP 200</code>, then receive
                automated Daily, Weekly, or Monthly score reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — The 4 Core Tools, Clearly Explained & Visualized */}
      <section
        id="core-tools"
        className="vs-sec-alt"
        style={{ padding: '72px 0' }}
      >
        <div className="vs-container" style={{ maxWidth: '1060px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            <div style={{ maxWidth: '640px' }}>
              <div className="vs-kicker" style={{ marginBottom: '8px' }}>
                CORE PLATFORM TOOLS
              </div>
              <h2
                style={{
                  fontSize: 'clamp(25px, 3.1vw, 35px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  margin: '0 0 10px 0',
                }}
              >
                Four essential tools that turn AI search into real customers.
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '14.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                Each tool solves one clear problem—without burying you in noisy
                charts or unfamiliar developer settings.
              </p>
            </div>

            <Link href="/features" className="vs-btn">
              Explore All Tools &amp; Live Tests →
            </Link>
          </div>

          <div className="vs-grid-2" style={{ gap: '24px' }}>
            {/* Core Tool 1: AI Visibility & Competitor X-Ray */}
            <div className="vs-bezel">
              <div
                className="vs-card"
                style={{
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <span className="vs-eyebrow">
                      01 · AI VISIBILITY &amp; RIVAL X-RAY
                    </span>
                    <StatusBadge tone="pass">3 AI ENGINES</StatusBadge>
                  </div>

                  {/* Visual 1: Conversion & Citation Bar Schematic */}
                  <div
                    style={{
                      borderRadius: '8px',
                      border: '1px solid var(--vs-border)',
                      background: '#0E1116',
                      padding: '14px 16px',
                      marginBottom: '16px',
                    }}
                  >
                    <svg
                      viewBox="0 0 420 112"
                      width="100%"
                      role="img"
                      aria-label="Comparison chart showing Cited AI Search Clicks converting at 14.9% versus Traditional Search at 2.1%."
                    >
                      <text
                        x="6"
                        y="18"
                        fill="#6EE7B7"
                        fontSize="10"
                        fontFamily="var(--vs-mono)"
                        fontWeight="700"
                      >
                        Cited AI Search Clicks (14.2%–15.9% buyer conversion)
                      </text>
                      <rect
                        x="6"
                        y="26"
                        width="380"
                        height="20"
                        rx="4"
                        fill="#171C26"
                      />
                      <rect
                        x="6"
                        y="26"
                        width="334"
                        height="20"
                        rx="4"
                        fill="#059669"
                      />
                      <text
                        x="350"
                        y="40"
                        fill="#6EE7B7"
                        fontSize="10"
                        fontFamily="var(--vs-mono)"
                        fontWeight="700"
                      >
                        6.8x
                      </text>

                      <text
                        x="6"
                        y="68"
                        fill="#EEF1F6"
                        fontSize="10"
                        fontFamily="var(--vs-mono)"
                        fontWeight="600"
                      >
                        Traditional Search (2.1%)
                      </text>
                      <rect
                        x="6"
                        y="76"
                        width="380"
                        height="18"
                        rx="4"
                        fill="#171C26"
                      />
                      <rect
                        x="6"
                        y="76"
                        width="58"
                        height="18"
                        rx="4"
                        fill="#64748B"
                      />
                    </svg>
                  </div>

                  <h3
                    style={{
                      fontSize: '18.5px',
                      fontWeight: 700,
                      margin: '0 0 8px 0',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    See when AI recommends you—or sends buyers to a competitor.
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: 'var(--vs-ink-secondary)',
                    }}
                  >
                    Track real buyer questions across ChatGPT, Gemini, and
                    Perplexity, separate brand mentions from clickable website
                    links, and compare any two domains head to head.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <Link href="/vs" className="vs-btn vs-btn-secondary">
                    Compare Two Domains Free →
                  </Link>
                  <Link href="/reports" className="vs-btn vs-btn-secondary">
                    400+ Brand Scorecards →
                  </Link>
                </div>
              </div>
            </div>

            {/* Core Tool 2: Wrong-Price & Brand Fact Watchdog */}
            <div className="vs-bezel">
              <div
                className="vs-card"
                style={{
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <span className="vs-eyebrow">
                      02 · WRONG-PRICE &amp; FACT WATCHDOG
                    </span>
                    <StatusBadge tone="warn">TRUTH GUARDRAILS</StatusBadge>
                  </div>

                  {/* Visual 2: Wrong AI Price vs Verified Truth */}
                  <div
                    style={{
                      borderRadius: '8px',
                      border: '1px solid var(--vs-border)',
                      background: '#0E1116',
                      padding: '14px 16px',
                      marginBottom: '16px',
                    }}
                  >
                    <svg
                      viewBox="0 0 420 112"
                      width="100%"
                      role="img"
                      aria-label="Diagram comparing a flagged inaccurate AI price quote against your verified website pricing."
                    >
                      <rect
                        x="6"
                        y="10"
                        width="194"
                        height="92"
                        rx="6"
                        fill="#261317"
                        stroke="#7F1D1D"
                      />
                      <text
                        x="18"
                        y="32"
                        fill="#FCA5A5"
                        fontSize="9.8"
                        fontFamily="var(--vs-mono)"
                        fontWeight="700"
                      >
                        ✕ FLAGGED AI CLAIM
                      </text>
                      <text
                        x="18"
                        y="56"
                        fill="#EEF1F6"
                        fontSize="11.5"
                        fontFamily="var(--vs-sans)"
                        fontWeight="600"
                      >
                        &ldquo;$19/mo unlimited seats&rdquo;
                      </text>
                      <text
                        x="18"
                        y="78"
                        fill="#94A3B8"
                        fontSize="9.6"
                        fontFamily="var(--vs-mono)"
                      >
                        Outdated quote caught
                      </text>

                      <rect
                        x="218"
                        y="10"
                        width="196"
                        height="92"
                        rx="6"
                        fill="#0D231D"
                        stroke="#065F46"
                      />
                      <text
                        x="230"
                        y="32"
                        fill="#6EE7B7"
                        fontSize="9.8"
                        fontFamily="var(--vs-mono)"
                        fontWeight="700"
                      >
                        ✓ VERIFIED TRUTH SHEET
                      </text>
                      <text
                        x="230"
                        y="56"
                        fill="#EEF1F6"
                        fontSize="11.5"
                        fontFamily="var(--vs-sans)"
                        fontWeight="600"
                      >
                        &ldquo;$49/mo Starter (5 seats)&rdquo;
                      </text>
                      <text
                        x="230"
                        y="78"
                        fill="#6EE7B7"
                        fontSize="9.6"
                        fontFamily="var(--vs-mono)"
                      >
                        Published to /agents.md
                      </text>
                    </svg>
                  </div>

                  <h3
                    style={{
                      fontSize: '18.5px',
                      fontWeight: 700,
                      margin: '0 0 8px 0',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Stop AI assistants from quoting wrong prices or old rules.
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: 'var(--vs-ink-secondary)',
                    }}
                  >
                    Auto-drafts a Brand Truth Sheet from your website, flags
                    inaccurate AI claims, and sends Daily, Weekly, or Monthly
                    reports on whichever day you choose—never nagging twice for
                    the same issue.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <Link href="/sample-audit" className="vs-btn vs-btn-secondary">
                    View Sample Audit →
                  </Link>
                  <Link href="/tutorial" className="vs-btn vs-btn-secondary">
                    90-Second Product Tour →
                  </Link>
                </div>
              </div>
            </div>

            {/* Core Tool 3: 1-Click 7-Platform Fix Generator */}
            <div className="vs-bezel">
              <div
                className="vs-card"
                style={{
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <span className="vs-eyebrow">
                      03 · 1-CLICK WEBSITE FIX GENERATOR
                    </span>
                    <StatusBadge tone="pass">7 PLATFORMS</StatusBadge>
                  </div>

                  {/* Visual 3: 7-CMS Auto-Detect -> 4/4 Verified Live */}
                  <div
                    style={{
                      borderRadius: '8px',
                      border: '1px solid var(--vs-border)',
                      background: '#0E1116',
                      padding: '14px 16px',
                      marginBottom: '16px',
                    }}
                  >
                    <svg
                      viewBox="0 0 420 112"
                      width="100%"
                      role="img"
                      aria-label="Flowchart showing auto-detected CMS platform generating JSON-LD, /llms.txt, and /agents.md verified live."
                    >
                      <rect
                        x="6"
                        y="18"
                        width="168"
                        height="76"
                        rx="6"
                        fill="#171C26"
                        stroke="#2B3344"
                      />
                      <text
                        x="18"
                        y="40"
                        fill="#E5A93C"
                        fontSize="9.8"
                        fontFamily="var(--vs-mono)"
                        fontWeight="700"
                      >
                        AUTO-DETECTED STACK
                      </text>
                      <text
                        x="18"
                        y="60"
                        fill="#EEF1F6"
                        fontSize="10.5"
                        fontFamily="var(--vs-sans)"
                      >
                        Shopify · WordPress
                      </text>
                      <text
                        x="18"
                        y="77"
                        fill="#94A3B8"
                        fontSize="10"
                        fontFamily="var(--vs-sans)"
                      >
                        Webflow · Wix · Next.js
                      </text>

                      <path
                        className="vs-signal-path"
                        d="M 180 56 L 224 56"
                        stroke="#E5A93C"
                        strokeWidth="2"
                        fill="none"
                      />

                      <rect
                        x="230"
                        y="18"
                        width="184"
                        height="76"
                        rx="6"
                        fill="#0D231D"
                        stroke="#065F46"
                      />
                      <text
                        x="242"
                        y="40"
                        fill="#6EE7B7"
                        fontSize="9.8"
                        fontFamily="var(--vs-mono)"
                        fontWeight="700"
                      >
                        ✓ 4/4 VERIFIED LIVE
                      </text>
                      <text
                        x="242"
                        y="60"
                        fill="#EEF1F6"
                        fontSize="10.2"
                        fontFamily="var(--vs-mono)"
                      >
                        JSON-LD · /llms.txt
                      </text>
                      <text
                        x="242"
                        y="77"
                        fill="#EEF1F6"
                        fontSize="10.2"
                        fontFamily="var(--vs-mono)"
                      >
                        /agents.md · Bot WAF 200
                      </text>
                    </svg>
                  </div>

                  <h3
                    style={{
                      fontSize: '18.5px',
                      fontWeight: 700,
                      margin: '0 0 8px 0',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Ship verified schema, AI files &amp; your Hosted Brand /mcp server in one click.
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: 'var(--vs-ink-secondary)',
                    }}
                  >
                    Writes syntax-checked <code className="vs-mono">JSON-LD</code>,{' '}
                    <code className="vs-mono">/llms.txt</code>,{' '}
                    <code className="vs-mono">/agents.md</code>, and a 2-line{' '}
                    <strong>Hosted Brand /mcp + Chrome WebMCP</strong>{' '}
                    (<code className="vs-mono">navigator.modelContext</code>)
                    bridge so AI agents query your verified pricing directly—with
                    zero backend code.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <Link
                    href="/tools/json-ld-ai-schema-checker"
                    className="vs-btn vs-btn-secondary"
                  >
                    Free Schema Checker →
                  </Link>
                  <Link href="/connectors" className="vs-btn vs-btn-secondary">
                    WP &amp; Shopify Bridges →
                  </Link>
                </div>
              </div>
            </div>

            {/* Core Tool 4: Agency White-Label & Developer Automation */}
            <div className="vs-bezel">
              <div
                className="vs-card"
                style={{
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <span className="vs-eyebrow">
                      04 · AGENCIES &amp; DEVELOPER AUTOMATION
                    </span>
                    <StatusBadge>WHITE-LABEL · CLI · /MCP</StatusBadge>
                  </div>

                  {/* Visual 4: Agency Pitch Link + CLI / MCP */}
                  <div
                    style={{
                      borderRadius: '8px',
                      border: '1px solid var(--vs-border)',
                      background: '#0E1116',
                      padding: '14px 16px',
                      marginBottom: '16px',
                    }}
                  >
                    <svg
                      viewBox="0 0 420 112"
                      width="100%"
                      role="img"
                      aria-label="Preview of an agency white-label client scorecard alongside developer CLI and MCP verification."
                    >
                      <rect
                        x="6"
                        y="14"
                        width="196"
                        height="84"
                        rx="6"
                        fill="#FAF9F6"
                        stroke="#D6D3CD"
                      />
                      <text
                        x="18"
                        y="35"
                        fill="#0E1116"
                        fontSize="9.8"
                        fontFamily="var(--vs-mono)"
                        fontWeight="700"
                      >
                        YOUR AGENCY BRAND
                      </text>
                      <text
                        x="18"
                        y="56"
                        fill="#334155"
                        fontSize="10.2"
                        fontFamily="var(--vs-sans)"
                      >
                        /audit/client-scorecard
                      </text>
                      <text
                        x="18"
                        y="76"
                        fill="#059669"
                        fontSize="9.6"
                        fontFamily="var(--vs-mono)"
                        fontWeight="700"
                      >
                        ● OPENED · CTA CLICKED
                      </text>

                      <rect
                        x="216"
                        y="14"
                        width="198"
                        height="84"
                        rx="6"
                        fill="#171C26"
                        stroke="#2B3344"
                      />
                      <text
                        x="228"
                        y="35"
                        fill="#E5A93C"
                        fontSize="9.8"
                        fontFamily="var(--vs-mono)"
                        fontWeight="700"
                      >
                        AGENT &amp; CI READY
                      </text>
                      <text
                        x="228"
                        y="56"
                        fill="#EEF1F6"
                        fontSize="9.8"
                        fontFamily="var(--vs-mono)"
                      >
                        npx @verisource/cli
                      </text>
                      <text
                        x="228"
                        y="76"
                        fill="#6EE7B7"
                        fontSize="9.8"
                        fontFamily="var(--vs-mono)"
                      >
                        mcp.verisource.dev/mcp
                      </text>
                    </svg>
                  </div>

                  <h3
                    style={{
                      fontSize: '18.5px',
                      fontWeight: 700,
                      margin: '0 0 8px 0',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Close agency retainers in 60s—or connect Claude &amp; ChatGPT in 1 click.
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: 'var(--vs-ink-secondary)',
                    }}
                  >
                    Agencies mint branded{' '}
                    <code className="vs-mono">/audit/[slug]</code> client reports
                    and deploy 15 Hosted Client{' '}
                    <code className="vs-mono">/mcp</code> servers, while any team
                    connects <code className="vs-mono">claude.ai</code> or{' '}
                    <code className="vs-mono">chatgpt.com</code> via 1-click
                    OAuth 2.1 (zero API keys) or runs{' '}
                    <code className="vs-mono">npx @verisource/cli</code>.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <Link href="/agencies#sandbox" className="vs-btn vs-btn-secondary">
                    Agency Sandbox →
                  </Link>
                  <Link href="/mcp-guide" className="vs-btn vs-btn-secondary">
                    30s /mcp Setup →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Progressive-Disclosure Handoff to Full Tools & Tests Catalog */}
          <div className="vs-bezel-obsidian" style={{ marginTop: '32px' }}>
            <div
              className="vs-card"
              style={{
                padding: '26px 28px',
                background: 'var(--vs-surface-warm)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
              }}
            >
              <div style={{ maxWidth: '620px' }}>
                <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
                  FULL PLATFORM CATALOG · 6 FREE TESTS + 11 CAPABILITIES
                </div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '18px',
                    marginBottom: '6px',
                  }}
                >
                  Want to see every diagnostic test, browser verifier, and
                  industry walkthrough we offer?
                </strong>
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    lineHeight: 1.58,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  Browse all 6 free instant HTTP tests, interactive before/after
                  industry examples, 20-page broken-link scanning, Playwright
                  flow replay, and backend log correlation on one organized page.
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <Link href="/features" className="vs-btn">
                  Explore All Tools &amp; Live Tests →
                </Link>
                <Link href="/tools" className="vs-btn vs-btn-secondary">
                  Try Free Diagnostic Validators →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Transparent Pricing Ladder & Clean Closing CTA */}
      <section className="vs-sec" style={{ borderBottom: 'none' }}>
        <div className="vs-container">
          <PricingLadderSection />
        </div>
      </section>
    </div>
  );
}
