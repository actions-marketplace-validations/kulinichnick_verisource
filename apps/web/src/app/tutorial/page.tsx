import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { InteractiveTutorialClient } from '../../components/InteractiveTutorialClient';

export const metadata: Metadata = {
  title:
    'Interactive 90-Second Product Tour & 7-CMS Setup Tutorial | Verisource',
  description:
    'Click through Verisource’s 3-step AI Search Console: spot pricing hallucinations, copy 1 platform-tailored AI Fix Prompt across Shopify, WordPress, Webflow, Wix, Squarespace, Framer, or Next.js, and verify live fixes.',
  alternates: {
    canonical: 'https://verisource.dev/tutorial',
  },
};

const TUTORIAL_HOWTO_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Fix Website AI Search Visibility & Citations with Verisource',
  description:
    'Three-step workflow to audit ChatGPT, Google Gemini, and Perplexity citations, deploy validated JSON-LD, /llms.txt, and /agents.md via one AI prompt, and verify live crawler access.',
  totalTime: 'PT5M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Run a 60-Second Domain & AI Crawler Scan',
      text: 'Enter your website URL at https://verisource.dev to check ChatGPT, Gemini, and Perplexity buyer shortlists, false pricing claims, CMS platform detection, and GPTBot/PerplexityBot HTTP access.',
      url: 'https://verisource.dev/#grader',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Copy Your Platform-Tailored 1-Click AI Fix Prompt',
      text: 'Paste the auto-detected prompt for Shopify, WordPress, Webflow, Wix/Squarespace/Framer (/ai-facts), or Coding Agents (Cursor, Claude, Antigravity) to publish validated JSON-LD, /llms.txt, and /agents.md.',
      url: 'https://verisource.dev/tutorial#cms-quickstarts',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Verify Live Fixes & Publish Rival Comparison Pages',
      text: 'Click Verify Live Fixes to confirm 4/4 live HTTP 200 protocol checks, launch You vs. Competitor comparison tables, and track AI crawler and referral events.',
      url: 'https://verisource.dev/tutorial',
    },
  ],
};

export default function InteractiveTutorialPage(): React.ReactElement {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(TUTORIAL_HOWTO_JSON_LD),
        }}
      />

      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '44px 0 46px 0',
          marginBottom: '34px',
        }}
      >
        <div className="vs-container vs-hero-grid">
          <div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              <StatusBadge tone="pass">
                INTERACTIVE 90-SECOND PRODUCT TOUR
              </StatusBadge>
              <StatusBadge>3 PERSONA TRACKS · ZERO SIGNUP REQUIRED</StatusBadge>
              <StatusBadge>7 WEBSITE PLATFORMS COVERED</StatusBadge>
            </div>

            <h1
              style={{
                fontSize: 'clamp(30px, 3.8vw, 43px)',
                lineHeight: 1.09,
                letterSpacing: '-0.03em',
                fontWeight: 700,
                margin: '0 0 14px 0',
              }}
            >
              Test-drive the Verisource Console in 90 seconds.{' '}
              <span
                className="vs-display-serif"
                style={{ fontSize: '1.08em', fontWeight: 400 }}
              >
                Before entering a card.
              </span>
            </h1>

            <p
              style={{
                fontSize: '15.5px',
                lineHeight: 1.6,
                color: 'var(--vs-ink-secondary)',
                margin: '0 0 20px 0',
                maxWidth: '580px',
              }}
            >
              Click through every workflow below—from spotting false AI pricing
              claims and pasting a 2-line Hosted Brand{' '}
              <code className="vs-mono">/mcp</code> + Chrome{' '}
              <code className="vs-mono">WebMCP</code> embed to minting white-label{' '}
              <code className="vs-mono">/audit/[slug]</code> client scorecards and
              connecting <code className="vs-mono">claude.ai</code> or ChatGPT in
              1 click via <code className="vs-mono">mcp.verisource.dev/oauth/mcp</code>.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a href="#try-your-domain" className="vs-btn">
                Skip to My Live Website Scan ↓
              </a>
              <a href="#cms-quickstarts" className="vs-btn vs-btn-secondary">
                Jump to CMS Setup Guides (7 Stacks)
              </a>
              <Link href="/sample-audit" className="vs-btn vs-btn-secondary">
                View 18 Live Brand Benchmarks →
              </Link>
            </div>
          </div>

          {/* Dual-Orientation Motion SVG Tour Map */}
          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div className="vs-schematic-header">
                <span className="vs-eyebrow" style={{ fontSize: '10.5px' }}>
                  FIG 04 · 90-SECOND INTERACTIVE TOUR MAP
                </span>
                <span
                  className="vs-mono"
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--vs-pass-fg)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '999px',
                      background: '#059669',
                      display: 'inline-block',
                    }}
                  />
                  3 GUIDED SANDBOXES
                </span>
              </div>

              <div style={{ padding: '14px 12px', background: '#FFFFFF' }}>
                <svg
                  className="vs-schematic-desktop"
                  viewBox="0 0 500 236"
                  width="100%"
                  role="img"
                  aria-label="Motion diagram showing Business Owner, SEO Agency, and Developer tracks flowing into the 5-step interactive sandbox and outputting 4 out of 4 verified live checks."
                >
                  <path d="M 154 52 C 184 52, 184 118, 210 118" fill="none" stroke="#DDD9CE" strokeWidth="1.4" />
                  <path d="M 154 118 L 210 118" fill="none" stroke="#DDD9CE" strokeWidth="1.4" />
                  <path d="M 154 184 C 184 184, 184 118, 210 118" fill="none" stroke="#DDD9CE" strokeWidth="1.4" />
                  <path className="vs-signal-path" d="M 154 52 C 184 52, 184 118, 210 118" fill="none" stroke="#0A0E17" strokeWidth="2" />
                  <path className="vs-signal-path vs-signal-path-delay-1" d="M 154 118 L 210 118" fill="none" stroke="#0A0E17" strokeWidth="2" />
                  <path className="vs-signal-path vs-signal-path-delay-2" d="M 154 184 C 184 184, 184 118, 210 118" fill="none" stroke="#0A0E17" strokeWidth="2" />

                  <path d="M 326 118 L 358 118" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                  <path className="vs-signal-path-out" d="M 326 118 L 358 118" fill="none" stroke="#059669" strokeWidth="2.5" />

                  <g transform="translate(10, 30)">
                    <rect width="144" height="44" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <circle className="vs-live-dot" cx="14" cy="22" r="3.2" fill="#0A0E17" />
                    <text x="24" y="19" fill="#0A0E17" fontSize="10.5" fontFamily="var(--vs-sans)" fontWeight="700">
                      Business Owner
                    </text>
                    <text x="24" y="34" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      No coding · 1 prompt
                    </text>
                  </g>

                  <g transform="translate(10, 96)">
                    <rect width="144" height="44" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <circle className="vs-live-dot" cx="14" cy="22" r="3.2" fill="#0A0E17" />
                    <text x="24" y="19" fill="#0A0E17" fontSize="10.5" fontFamily="var(--vs-sans)" fontWeight="700">
                      SEO &amp; Web Agency
                    </text>
                    <text x="24" y="34" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      White-label + alerts
                    </text>
                  </g>

                  <g transform="translate(10, 162)">
                    <rect width="144" height="44" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <circle className="vs-live-dot" cx="14" cy="22" r="3.2" fill="#0A0E17" />
                    <text x="24" y="19" fill="#0A0E17" fontSize="10.5" fontFamily="var(--vs-sans)" fontWeight="700">
                      Developer · /mcp
                    </text>
                    <text x="24" y="34" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Cursor · Claude · AGY
                    </text>
                  </g>

                  <g transform="translate(210, 72)">
                    <rect className="vs-pulse-ring" x="-5" y="-5" width="126" height="102" rx="11" fill="none" stroke="#059669" />
                    <rect width="116" height="92" rx="8" fill="#0A0E17" />
                    <circle className="vs-live-dot" cx="58" cy="24" r="3.5" fill="#34D399" />
                    <text x="58" y="48" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      5-STEP TOUR
                    </text>
                    <text x="58" y="66" textAnchor="middle" fill="#34D399" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Click-through
                    </text>
                    <text x="58" y="80" textAnchor="middle" fill="#A3A8B4" fontSize="8.5" fontFamily="var(--vs-mono)">
                      0 signup needed
                    </text>
                  </g>

                  <g transform="translate(358, 72)">
                    <rect width="132" height="92" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="12" y="24" fill="#065F46" fontSize="9.2" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ 4/4 LIVE PROOF
                    </text>
                    <text x="12" y="44" fill="#0A0E17" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="600">
                      38 → 92 / 100
                    </text>
                    <text x="12" y="62" fill="#065F46" fontSize="8.8" fontFamily="var(--vs-mono)">
                      7 CMS Quickstarts
                    </text>
                    <text x="12" y="78" fill="#3A3F4B" fontSize="8.5" fontFamily="var(--vs-mono)">
                      + Live URL Scan
                    </text>
                  </g>
                </svg>

                <svg
                  className="vs-schematic-mobile"
                  viewBox="0 0 320 158"
                  width="100%"
                  role="img"
                  aria-label="Mobile tour diagram showing 3 persona tracks flowing into 5-step interactive Console sandbox."
                >
                  <g transform="translate(6, 8)">
                    <rect width="308" height="44" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <text x="154" y="20" textAnchor="middle" fill="#0A0E17" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="700">
                      1. PICK TRACK: OWNER · AGENCY · /MCP DEV
                    </text>
                    <text x="154" y="35" textAnchor="middle" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Zero account or card required
                    </text>
                  </g>
                  <path d="M 160 52 L 160 72" fill="none" stroke="#DDD9CE" strokeWidth="2" />
                  <path className="vs-signal-path" d="M 160 52 L 160 72" fill="none" stroke="#0A0E17" strokeWidth="2.4" />
                  <g transform="translate(6, 72)">
                    <rect width="308" height="78" rx="7" fill="#0A0E17" />
                    <circle className="vs-live-dot" cx="22" cy="24" r="3.5" fill="#34D399" />
                    <text x="34" y="27" fill="#FFFFFF" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="700">
                      2. CLICK THROUGH ALL 5 CONSOLE STEPS
                    </text>
                    <text x="22" y="48" fill="#34D399" fontSize="9.2" fontFamily="var(--vs-mono)">
                      Simulate 38 → 92/100 live fix verification
                    </text>
                    <text x="22" y="65" fill="#A3A8B4" fontSize="8.8" fontFamily="var(--vs-mono)">
                      + Copy 7-CMS setup guides &amp; scan your own URL
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="vs-container">
        <InteractiveTutorialClient />
      </div>
    </div>
  );
}
