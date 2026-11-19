import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';

/**
 * Spotlights all major Verisource capabilities built across M48–M80 right on
 * the homepage using crisp, zero-lag animated Motion SVG micro-graphics,
 * simple "How to use" instructions for non-pros & pros, and 1-click links.
 */
export function StandoutFeaturesBento(): React.ReactElement {
  return (
    <section
      id="standout-features"
      style={{ marginTop: '72px', scrollMarginTop: '80px' }}
    >
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
        <div style={{ maxWidth: '720px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            STANDOUT PLATFORM CAPABILITIES · BUILT FOR NON-PROS &amp; TECHNICAL TEAMS
          </div>
          <h2
            style={{
              fontSize: 'clamp(25px, 3vw, 32px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 8px 0',
            }}
          >
            Six built-in tools you will not find in passive tracking dashboards.
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '14.5px',
              lineHeight: 1.58,
              color: 'var(--vs-ink-secondary)',
            }}
          >
            Every tool includes Guided Mode instructions for business owners who
            never touch code—plus sharp HTTP, schema, and{' '}
            <code className="vs-mono">/mcp</code> controls for pros.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Link href="/tools" className="vs-btn vs-btn-secondary">
            4 Free Diagnostic Tools →
          </Link>
          <Link href="/pricing" className="vs-btn">
            Start 7-Day Free Trial →
          </Link>
        </div>
      </div>

      {/* Top Row: 2 Featured Flagship Motion Cards */}
      <div className="vs-grid-2" style={{ marginBottom: '18px' }}>
        {/* Card 1: 7-Platform Auto-Detected CMS Prompts & Drop-In Connectors */}
        <div
          className="vs-card vs-card-interactive"
          style={{
            padding: '22px',
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
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '10px',
              }}
            >
              <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                01 · 7-CMS AUTO-DETECTION &amp; DROP-IN CONNECTORS
              </span>
              <StatusBadge tone="pass">NO CODING NEEDED</StatusBadge>
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '19px', fontWeight: 700 }}>
              1-Click AI Fix Prompts + WordPress &amp; Shopify Bridges
            </h3>
            <p
              style={{
                margin: '0 0 14px 0',
                fontSize: '13.5px',
                color: 'var(--vs-ink-secondary)',
                lineHeight: 1.55,
              }}
            >
              Verisource auto-detects Shopify, WordPress, Webflow, Wix,
              Squarespace, Framer, or Next.js—giving you either a 1-file{' '}
              <code className="vs-mono">verisource-geo-connector.php</code>{' '}
              plugin, a Shopify Liquid bridge, or one ready-made AI prompt.
            </p>

            {/* Motion SVG: 7-CMS Auto-Router -> 4/4 Verified Live */}
            <div
              style={{
                borderRadius: '8px',
                border: '1px solid var(--vs-border)',
                background: 'var(--vs-terminal)',
                padding: '10px 12px',
                marginBottom: '12px',
              }}
            >
              <svg
                viewBox="0 0 480 118"
                width="100%"
                role="img"
                aria-label="Animated motion diagram showing Shopify, WordPress, Webflow, and Next.js routing through 1-Click Auto-Fix into 4 out of 4 live website checks."
              >
                <path
                  d="M 134 28 C 168 28, 168 59, 196 59"
                  fill="none"
                  stroke="#364156"
                  strokeWidth="1.4"
                />
                <path
                  d="M 134 59 L 196 59"
                  fill="none"
                  stroke="#364156"
                  strokeWidth="1.4"
                />
                <path
                  d="M 134 90 C 168 90, 168 59, 196 59"
                  fill="none"
                  stroke="#364156"
                  strokeWidth="1.4"
                />
                <path
                  className="vs-signal-path"
                  d="M 134 28 C 168 28, 168 59, 196 59"
                  fill="none"
                  stroke="#E5A93C"
                  strokeWidth="2"
                />
                <path
                  className="vs-signal-path vs-signal-path-delay-1"
                  d="M 134 59 L 196 59"
                  fill="none"
                  stroke="#E5A93C"
                  strokeWidth="2"
                />
                <path
                  className="vs-signal-path vs-signal-path-delay-2"
                  d="M 134 90 C 168 90, 168 59, 196 59"
                  fill="none"
                  stroke="#E5A93C"
                  strokeWidth="2"
                />

                <path
                  d="M 308 59 L 346 59"
                  fill="none"
                  stroke="#065F46"
                  strokeWidth="2"
                />
                <path
                  className="vs-signal-path-out"
                  d="M 308 59 L 346 59"
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="2.6"
                />

                {/* CMS Chips */}
                <g transform="translate(8, 15)">
                  <rect width="126" height="24" rx="5" fill="#FFFFFF" stroke="#CBD5E1" />
                  <text x="63" y="15.5" textAnchor="middle" fill="#0F172A" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="600">
                    Shopify · WordPress
                  </text>
                </g>
                <g transform="translate(8, 47)">
                  <rect width="126" height="24" rx="5" fill="#FFFFFF" stroke="#CBD5E1" />
                  <text x="63" y="15.5" textAnchor="middle" fill="#0F172A" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="600">
                    Webflow · Wix · Framer
                  </text>
                </g>
                <g transform="translate(8, 79)">
                  <rect width="126" height="24" rx="5" fill="#FFFFFF" stroke="#CBD5E1" />
                  <text x="63" y="15.5" textAnchor="middle" fill="#0F172A" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="600">
                    Next.js · Custom Repo
                  </text>
                </g>

                {/* Center Router */}
                <g transform="translate(196, 31)">
                  <rect className="vs-pulse-ring" x="-4" y="-4" width="120" height="64" rx="10" fill="none" stroke="#E5A93C" />
                  <rect width="112" height="56" rx="7" fill="#171C26" stroke="#E5A93C" />
                  <circle className="vs-live-dot" cx="18" cy="20" r="3" fill="#34D399" />
                  <text x="27" y="23" fill="#EEF1F6" fontSize="9.2" fontFamily="var(--vs-mono)" fontWeight="700">
                    AUTO-CMS FIX
                  </text>
                  <text x="56" y="41" textAnchor="middle" fill="#B4BCC9" fontSize="8.5" fontFamily="var(--vs-mono)">
                    1 Prompt / Plugin
                  </text>
                </g>

                {/* Verified Badge */}
                <g transform="translate(346, 23)">
                  <rect width="126" height="72" rx="7" fill="#ECFDF5" stroke="#A7F3D0" />
                  <text x="10" y="20" fill="#065F46" fontSize="9" fontFamily="var(--vs-mono)" fontWeight="700">
                    ✓ 4/4 LIVE CHECKS
                  </text>
                  <text x="10" y="38" fill="#0A0E17" fontSize="9.5" fontFamily="var(--vs-mono)">
                    • JSON-LD + FAQ
                  </text>
                  <text x="10" y="53" fill="#0A0E17" fontSize="9.5" fontFamily="var(--vs-mono)">
                    • /agents.md 200
                  </text>
                  <text x="10" y="66" fill="#065F46" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="600">
                    • /llms.txt 200 OK
                  </text>
                </g>
              </svg>
            </div>

            <div
              style={{
                padding: '9px 12px',
                borderRadius: '6px',
                background: 'var(--vs-surface-subtle)',
                fontSize: '12px',
                color: 'var(--vs-ink-secondary)',
              }}
            >
              <strong style={{ color: 'var(--vs-ink)' }}>How to use it:</strong>{' '}
              Scan your site above → open <strong>Step 02</strong> → click{' '}
              <strong>Copy Prompt for My AI</strong> (or download the WordPress{' '}
              <code className="vs-mono">.php</code> plugin) → click{' '}
              <strong>✓ Verify Live Fixes</strong>.
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Link
              href="/connectors"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              WordPress &amp; Shopify Connectors →
            </Link>
            <Link
              href="/templates"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              Browse 6 Vertical Templates →
            </Link>
          </div>
        </div>

        {/* Card 2: 60-Second Agency White-Label Pitch & Live Deal Alerts */}
        <div
          className="vs-card vs-card-interactive"
          style={{
            padding: '22px',
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
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '10px',
              }}
            >
              <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                02 · WHITE-LABEL CLIENT PITCH &amp; LIVE DEAL ALERTS
              </span>
              <StatusBadge tone="pass">OPENED · PDF SAVED · CTA</StatusBadge>
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '19px', fontWeight: 700 }}>
              60-Second Branded Client Scorecards + Board-Ready PDFs
            </h3>
            <p
              style={{
                margin: '0 0 14px 0',
                fontSize: '13.5px',
                color: 'var(--vs-ink-secondary)',
                lineHeight: 1.55,
              }}
            >
              Mint pure white-label <code className="vs-mono">/audit/[slug]</code>{' '}
              briefs with your agency logo, hex color, and booking button—and
              receive bot-filtered alerts the instant a prospect opens the page,
              saves the PDF, or clicks your calendar CTA.
            </p>

            {/* Motion SVG: Branded Scorecard -> Live Deal Telemetry */}
            <div
              style={{
                borderRadius: '8px',
                border: '1px solid var(--vs-border)',
                background: 'var(--vs-terminal)',
                padding: '10px 12px',
                marginBottom: '12px',
              }}
            >
              <svg
                viewBox="0 0 480 118"
                width="100%"
                role="img"
                aria-label="Animated motion diagram showing a white-label client audit link triggering live Opened, PDF Saved, and Booking CTA Clicked alerts."
              >
                <path
                  d="M 192 59 L 254 30"
                  fill="none"
                  stroke="#364156"
                  strokeWidth="1.4"
                />
                <path
                  d="M 192 59 L 254 59"
                  fill="none"
                  stroke="#364156"
                  strokeWidth="1.4"
                />
                <path
                  d="M 192 59 L 254 88"
                  fill="none"
                  stroke="#065F46"
                  strokeWidth="1.6"
                />
                <path
                  className="vs-signal-path"
                  d="M 192 59 L 254 30"
                  fill="none"
                  stroke="#E5A93C"
                  strokeWidth="2"
                />
                <path
                  className="vs-signal-path vs-signal-path-delay-1"
                  d="M 192 59 L 254 59"
                  fill="none"
                  stroke="#E5A93C"
                  strokeWidth="2"
                />
                <path
                  className="vs-signal-path-out"
                  d="M 192 59 L 254 88"
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="2.4"
                />

                {/* Left White-Label Card */}
                <g transform="translate(8, 20)">
                  <rect width="184" height="78" rx="7" fill="#171C26" stroke="#364156" />
                  <circle className="vs-live-dot" cx="18" cy="20" r="3.5" fill="#34D399" />
                  <text x="28" y="23" fill="#EEF1F6" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                    YOUR AGENCY LOGO
                  </text>
                  <text x="14" y="44" fill="#B4BCC9" fontSize="9" fontFamily="var(--vs-mono)">
                    /audit/prospect-brief
                  </text>
                  <rect x="14" y="53" width="156" height="17" rx="4" fill="#252D3D" />
                  <text x="92" y="64.5" textAnchor="middle" fill="#EEF1F6" fontSize="8.5" fontFamily="var(--vs-mono)">
                    Print PDF · Book Strategy Call
                  </text>
                </g>

                {/* Right 3 Telemetry Pills */}
                <g transform="translate(254, 16)">
                  <rect width="218" height="25" rx="5" fill="#FFFFFF" stroke="#CFCBC0" />
                  <circle className="vs-live-dot" cx="13" cy="12.5" r="3" fill="#0A0E17" />
                  <text x="23" y="16" fill="#0A0E17" fontSize="9.2" fontFamily="var(--vs-mono)" fontWeight="600">
                    OPENED · 3x (Slackbot filtered)
                  </text>
                </g>
                <g transform="translate(254, 46.5)">
                  <rect width="218" height="25" rx="5" fill="#FFFBEB" stroke="#FDE68A" />
                  <circle className="vs-live-dot" cx="13" cy="12.5" r="3" fill="#D97706" />
                  <text x="23" y="16" fill="#92400E" fontSize="9.2" fontFamily="var(--vs-mono)" fontWeight="700">
                    PDF SAVED · 1x (Forwarded to VP)
                  </text>
                </g>
                <g transform="translate(254, 77)">
                  <rect width="218" height="25" rx="5" fill="#ECFDF5" stroke="#A7F3D0" />
                  <circle className="vs-live-dot" cx="13" cy="12.5" r="3" fill="#059669" />
                  <text x="23" y="16" fill="#065F46" fontSize="9.2" fontFamily="var(--vs-mono)" fontWeight="700">
                    CTA CLICKED · Booking Calendar!
                  </text>
                </g>
              </svg>
            </div>

            <div
              style={{
                padding: '9px 12px',
                borderRadius: '6px',
                background: 'var(--vs-surface-subtle)',
                fontSize: '12px',
                color: 'var(--vs-ink-secondary)',
              }}
            >
              <strong style={{ color: 'var(--vs-ink)' }}>How to use it:</strong>{' '}
              Test your branding free in the{' '}
              <strong>Live Agency Sandbox</strong> below, or paste 1–10 client
              domains in <strong>Console Step 03</strong> to mint shareable links
              and 3-touch outreach emails.
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Link
              href="/agencies#sandbox"
              className="vs-btn"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              Try Live Agency Sandbox →
            </Link>
            <Link
              href="/sample-audit"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              View Sample Scorecards →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: 4 Crisp Motion Utility & Protocol Cards */}
      <div className="vs-grid-2">
        {/* Card 3: AI Citation & Rival Comparison Page Studio */}
        <div
          className="vs-card vs-card-interactive"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '8px',
              }}
            >
              <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                03 · RIVAL COMPARISON PAGE STUDIO
              </span>
              <StatusBadge tone="pass">BRAND TRUTH LOCKED</StatusBadge>
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17.5px', fontWeight: 700 }}>
              Generate “You vs. Competitor” &amp; Buyer Guide Routes
            </h3>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: 'var(--vs-ink-secondary)',
                lineHeight: 1.55,
              }}
            >
              AI answer engines heavily cite structured{' '}
              <code className="vs-mono">&lt;table&gt;</code> comparison pages.
              Generate a ready-to-publish{' '}
              <code className="vs-mono">/compare/you-vs-rival</code> page +{' '}
              <code className="vs-mono">FAQPage</code> schema locked to your
              verified pricing.
            </p>

            <svg
              viewBox="0 0 460 74"
              width="100%"
              role="img"
              aria-label="Motion diagram showing Rival Comparison Studio outputting HTML table and FAQPage JSON-LD."
              style={{
                borderRadius: '6px',
                border: '1px solid var(--vs-border)',
                background: 'var(--vs-terminal)',
                padding: '6px',
                marginBottom: '10px',
              }}
            >
              <rect x="8" y="14" width="152" height="46" rx="5" fill="#FFFFFF" stroke="#CBD5E1" />
              <text x="18" y="33" fill="#0F172A" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                “You vs. RivalCloud”
              </text>
              <text x="18" y="49" fill="#475569" fontSize="8.5" fontFamily="var(--vs-mono)">
                Shortlist buyer query
              </text>
              <path d="M 160 37 L 232 37" fill="none" stroke="#065F46" strokeWidth="2" />
              <path className="vs-signal-path-out" d="M 160 37 L 232 37" fill="none" stroke="#34D399" strokeWidth="2.5" />
              <rect x="232" y="14" width="220" height="46" rx="5" fill="#ECFDF5" stroke="#A7F3D0" />
              <text x="244" y="33" fill="#065F46" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                ✓ /compare/you-vs-rivalcloud
              </text>
              <text x="244" y="49" fill="#0F172A" fontSize="8.5" fontFamily="var(--vs-mono)">
                &lt;table&gt; matrix + FAQPage JSON-LD
              </text>
            </svg>

            <div style={{ fontSize: '12px', color: 'var(--vs-ink-secondary)' }}>
              <strong style={{ color: 'var(--vs-ink)' }}>How to use:</strong> In{' '}
              <strong>Console Step 02</strong>, pick any rival named by AI and
              click <strong>Copy AI Prompt to Create Page</strong>.
            </div>
          </div>

          <div>
            <Link
              href="/tutorial"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              See Studio in 90s Tour →
            </Link>
          </div>
        </div>

        {/* Card 4: Hosted Brand /mcp, W3C Chrome WebMCP & 1-Click OAuth 2.1 */}
        <div
          className="vs-card vs-card-interactive"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '8px',
              }}
            >
              <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                04 · HOSTED BRAND /MCP, WEBMCP &amp; 1-CLICK OAUTH
              </span>
              <StatusBadge tone="pass">DEV.VERISOURCE/MCP@1.0.0</StatusBadge>
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17.5px', fontWeight: 700 }}>
              Host Your Brand&apos;s Own /mcp + Connect Claude &amp; ChatGPT in 1 Click
            </h3>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: 'var(--vs-ink-secondary)',
                lineHeight: 1.55,
              }}
            >
              Every paid domain gets a hosted read-only Brand Truth server (
              <code className="vs-mono">/b/&#123;domain&#125;/mcp</code>) plus a
              W3C Chrome <code className="vs-mono">WebMCP</code> script via 2
              lines in <code className="vs-mono">&lt;head&gt;</code>—alongside
              1-click OAuth 2.1 (<code className="vs-mono">/oauth/mcp</code>) for{' '}
              <code className="vs-mono">claude.ai</code> and{' '}
              <code className="vs-mono">chatgpt.com</code>.
            </p>

            <svg
              viewBox="0 0 460 74"
              width="100%"
              role="img"
              aria-label="Motion diagram showing Claude, ChatGPT, and Chrome AI agents calling Hosted Brand MCP and OAuth 2.1 endpoints."
              style={{
                borderRadius: '6px',
                border: '1px solid var(--vs-border)',
                background: 'var(--vs-terminal)',
                padding: '6px',
                marginBottom: '10px',
              }}
            >
              <rect x="8" y="14" width="166" height="46" rx="5" fill="#FFFFFF" stroke="#CBD5E1" />
              <text x="18" y="33" fill="#0F172A" fontSize="9.2" fontFamily="var(--vs-mono)" fontWeight="700">
                Claude · ChatGPT · Chrome
              </text>
              <text x="18" y="49" fill="#475569" fontSize="8.3" fontFamily="var(--vs-mono)">
                OAuth 2.1 + WebMCP
              </text>
              <path d="M 174 37 L 236 37" fill="none" stroke="#364156" strokeWidth="2" />
              <path className="vs-signal-path" d="M 174 37 L 236 37" fill="none" stroke="#E5A93C" strokeWidth="2.5" />
              <rect x="236" y="14" width="216" height="46" rx="5" fill="#171C26" stroke="#364156" />
              <circle className="vs-live-dot" cx="250" cy="30" r="3" fill="#34D399" />
              <text x="259" y="33" fill="#EEF1F6" fontSize="9.0" fontFamily="var(--vs-mono)" fontWeight="700">
                mcp.verisource.dev/b/brand
              </text>
              <text x="250" y="49" fill="#B4BCC9" fontSize="8.3" fontFamily="var(--vs-mono)">
                4 Brand Truth Tools · 2-Line Embed
              </text>
            </svg>

            <div style={{ fontSize: '12px', color: 'var(--vs-ink-secondary)' }}>
              <strong style={{ color: 'var(--vs-ink)' }}>How to use:</strong>{' '}
              Paste the 2-line <code className="vs-mono">&lt;head&gt;</code> tag
              from <strong>Console Step 02</strong>, or connect{' '}
              <code className="vs-mono">/oauth/mcp</code> on{' '}
              <code className="vs-mono">/mcp-guide</code>.
            </div>
          </div>

          <div>
            <Link
              href="/mcp-guide#hosted-brand-mcp"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              Explore Hosted /mcp &amp; OAuth Guide →
            </Link>
          </div>
        </div>

        {/* Card 5: 4 Free Zero-Signup Diagnostic Validators */}
        <div
          className="vs-card vs-card-interactive"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '8px',
              }}
            >
              <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                05 · 4 FREE PROTOCOL VALIDATORS
              </span>
              <StatusBadge tone="pass">ZERO SIGNUP · INSTANT</StatusBadge>
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17.5px', fontWeight: 700 }}>
              Check JSON-LD, FAQPage, /llms.txt, Bot WAF &amp; Shopify Live
            </h3>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: 'var(--vs-ink-secondary)',
                lineHeight: 1.55,
              }}
            >
              Run targeted HTTP checks on any public URL: our 3-pillar{' '}
              <code className="vs-mono">JSON-LD</code> &amp;{' '}
              <code className="vs-mono">FAQPage</code> Inspector,{' '}
              <code className="vs-mono">/llms.txt</code> +{' '}
              <code className="vs-mono">/agents.md</code> Validator, 5-Bot WAF
              Checker, and Shopify AI Readiness Checker.
            </p>

            <svg
              viewBox="0 0 460 74"
              width="100%"
              role="img"
              aria-label="Motion radar sweeping 4 free protocol validators: JSON-LD, llms.txt, 5-Bot WAF, and Shopify."
              style={{
                borderRadius: '6px',
                border: '1px solid var(--vs-border)',
                background: 'var(--vs-terminal)',
                padding: '6px',
                marginBottom: '10px',
              }}
            >
              <g transform="translate(8, 16)">
                <rect width="104" height="42" rx="5" fill="#FFFFFF" stroke="#A7F3D0" />
                <text x="52" y="19" textAnchor="middle" fill="#065F46" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="700">
                  ✓ JSON-LD 3/3
                </text>
                <text x="52" y="33" textAnchor="middle" fill="#686D78" fontSize="8" fontFamily="var(--vs-mono)">
                  Entity · FAQ · $
                </text>
              </g>
              <g transform="translate(121, 16)">
                <rect width="104" height="42" rx="5" fill="#FFFFFF" stroke="#A7F3D0" />
                <text x="52" y="19" textAnchor="middle" fill="#065F46" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="700">
                  ✓ /agents.md
                </text>
                <text x="52" y="33" textAnchor="middle" fill="#686D78" fontSize="8" fontFamily="var(--vs-mono)">
                  HTTP 200 OK
                </text>
              </g>
              <g transform="translate(234, 16)">
                <rect width="104" height="42" rx="5" fill="#FFFFFF" stroke="#A7F3D0" />
                <text x="52" y="19" textAnchor="middle" fill="#065F46" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="700">
                  ✓ 5-Bot WAF
                </text>
                <text x="52" y="33" textAnchor="middle" fill="#686D78" fontSize="8" fontFamily="var(--vs-mono)">
                  GPT · Perplexity
                </text>
              </g>
              <g transform="translate(347, 16)">
                <rect width="105" height="42" rx="5" fill="#FFFFFF" stroke="#A7F3D0" />
                <text x="52.5" y="19" textAnchor="middle" fill="#065F46" fontSize="8.8" fontFamily="var(--vs-mono)" fontWeight="700">
                  ✓ Shopify AI
                </text>
                <text x="52.5" y="33" textAnchor="middle" fill="#686D78" fontSize="8" fontFamily="var(--vs-mono)">
                  Liquid + UCP
                </text>
              </g>
              <rect className="vs-scan-sweep" x="8" y="12" width="64" height="2.5" rx="1" fill="#059669" />
            </svg>

            <div style={{ fontSize: '12px', color: 'var(--vs-ink-secondary)' }}>
              <strong style={{ color: 'var(--vs-ink)' }}>How to use:</strong>{' '}
              Pick any validator below, enter a URL, and inspect exact HTTP
              headers and schema nodes in under 5 seconds.
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Link
              href="/tools/json-ld-ai-schema-checker"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              JSON-LD &amp; FAQ Validator →
            </Link>
            <Link
              href="/tools"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              All 4 Free Checkers →
            </Link>
          </div>
        </div>

        {/* Card 6: 2026 40-Domain Benchmark, ROI Payback Calculator & 25% Partner Program */}
        <div
          className="vs-card vs-card-interactive"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '8px',
              }}
            >
              <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                06 · 2026 BENCHMARK, ROI MODEL &amp; 25% PARTNER SHARE
              </span>
              <StatusBadge tone="pass">40-DOMAIN RESEARCH</StatusBadge>
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17.5px', fontWeight: 700 }}>
              Empirical AI Conversion Math + 25% Recurring Referrals
            </h3>
            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: 'var(--vs-ink-secondary)',
                lineHeight: 1.55,
              }}
            >
              Explore our 40-domain HTTP crawl study (95% still lack{' '}
              <code className="vs-mono">/agents.md</code>), model your monthly
              payback from 14.2%–15.9% AI referral conversions, or cover your
              plan in 2–4 peer referrals.
            </p>

            <svg
              viewBox="0 0 460 74"
              width="100%"
              role="img"
              aria-label="Comparison chart showing 95 percent of domains missing agents.md and 14.2 to 15.9 percent AI search conversion rate."
              style={{
                borderRadius: '6px',
                border: '1px solid var(--vs-border)',
                background: 'var(--vs-terminal)',
                padding: '6px',
                marginBottom: '10px',
              }}
            >
              <text x="12" y="26" fill="#EEF1F6" fontSize="9.2" fontFamily="var(--vs-mono)" fontWeight="600">
                Traditional Search (2.1%)
              </text>
              <rect x="176" y="16" width="48" height="12" rx="3" fill="#94A3B8" />

              <text x="12" y="52" fill="#6EE7B7" fontSize="9.2" fontFamily="var(--vs-mono)" fontWeight="700">
                AI Cited Referral (15.1%)
              </text>
              <rect x="176" y="42" width="264" height="12" rx="3" fill="#10B981" />
              <circle className="vs-live-dot" cx="432" cy="48" r="3" fill="#FFFFFF" />
            </svg>

            <div style={{ fontSize: '12px', color: 'var(--vs-ink-secondary)' }}>
              <strong style={{ color: 'var(--vs-ink)' }}>How to use:</strong>{' '}
              Model your vertical deal value on <code className="vs-mono">/pricing</code>{' '}
              or read the full 40-domain dataset.
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Link
              href="/benchmarks/ai-search-readiness-2026"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              Read 2026 Study →
            </Link>
            <Link
              href="/pricing#vs-pricing-roi-calculator"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              ROI Payback Calculator →
            </Link>
            <Link
              href="/partners"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              25% Partner Program →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
