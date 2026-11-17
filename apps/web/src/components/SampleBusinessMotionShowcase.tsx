'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { StatusBadge } from '@verisource/ui';

type ScenarioId = 'local_service' | 'b2b_saas' | 'shopify_d2c' | 'seo_agency';

interface BusinessScenario {
  id: ScenarioId;
  pillLabel: string;
  figCode: string;
  businessName: string;
  domain: string;
  cmsBadge: string;
  buyerPrompt: string;
  beforeScore: number;
  beforeStatus: string;
  beforeBugs: [string, string, string];
  engineActionTitle: string;
  engineActionSub: string;
  afterScore: number;
  afterStatus: string;
  afterWins: [string, string, string];
  commercialOutcome: string;
  howCustomerUsesIt: [string, string, string];
}

const SCENARIOS: BusinessScenario[] = [
  {
    id: 'local_service',
    pillLabel: 'Local Service · Dental & Clinic',
    figCode: 'FIG 02A · LOCAL SERVICE CASE',
    businessName: 'Summit Dental Studio',
    domain: 'summitdentalstudio.com',
    cmsBadge: 'AUTO-DETECTED: WORDPRESS',
    buyerPrompt: '“Best dental implant clinic in Denver with transparent pricing?”',
    beforeScore: 36,
    beforeStatus: 'OMITTED · WRONG PRICE',
    beforeBugs: [
      'PerplexityBot blocked (HTTP 403)',
      'ChatGPT invents “$499 full implant”',
      '0 Dentist / FAQPage JSON-LD nodes',
    ],
    engineActionTitle: '1-Click WordPress Connector',
    engineActionSub: 'Dentist JSON-LD + /ai-facts',
    afterScore: 92,
    afterStatus: '4/4 VERIFIED LIVE',
    afterWins: [
      'True $1,850+ implant pricing locked',
      'Dentist + 6-Q FAQPage schema live',
      'Cited #1 in ChatGPT & Google Gemini',
    ],
    commercialOutcome: '+14 high-intent consult bookings/mo · 14.8% AI referral conversion',
    howCustomerUsesIt: [
      '1. Owner scans summitdentalstudio.com free (takes 60 seconds, zero code).',
      '2. Installs our 1-file WordPress plugin or pastes 1 AI prompt into ChatGPT.',
      '3. Clicks ✓ Verify Live Fixes — score jumps 36 → 92/100 and false prices stop.',
    ],
  },
  {
    id: 'b2b_saas',
    pillLabel: 'B2B SaaS · Cloud & API',
    figCode: 'FIG 02B · B2B SAAS CASE',
    businessName: 'Northstar Cloud',
    domain: 'northstarcloud.io',
    cmsBadge: 'AUTO-DETECTED: NEXT.JS',
    buyerPrompt: '“Northstar Cloud vs RivalCloud enterprise SLA & SOC2 pricing”',
    beforeScore: 44,
    beforeStatus: 'RIVAL CITED #1',
    beforeBugs: [
      'Client-side JS hides /pricing table',
      'Gemini quotes retired “$19/mo” tier',
      'No /compare/northstar-vs-rival page',
    ],
    engineActionTitle: 'Cursor Prompt + Page Studio',
    engineActionSub: 'OfferCatalog + vs. Rival Route',
    afterScore: 94,
    afterStatus: '4/4 VERIFIED LIVE',
    afterWins: [
      'Verified $99–$499/mo SOC2 tiers live',
      '/agents.md + /llms.txt HTTP 200 OK',
      'Cited #1 footnote on shortlist queries',
    ],
    commercialOutcome: '15.4% trial signup rate from Perplexity & ChatGPT Search clicks',
    howCustomerUsesIt: [
      '1. Founder runs a live audit and confirms real plan tiers in Step 01.',
      '2. Copies the 1-Click Coding Agent Prompt + vs. Rival page into Cursor or Claude.',
      '3. Streams ongoing Share-of-Voice checks directly inside Cursor via /mcp.',
    ],
  },
  {
    id: 'shopify_d2c',
    pillLabel: 'Shopify Brand · E-Commerce',
    figCode: 'FIG 02C · SHOPIFY STOREFRONT',
    businessName: 'Veloce Cycling Gear',
    domain: 'velocecycling.com',
    cmsBadge: 'AUTO-DETECTED: SHOPIFY',
    buyerPrompt: '“Carbon gravel wheelset under $1,400 with free US crash replacement”',
    beforeScore: 41,
    beforeStatus: 'MISSING SHOPPING DATA',
    beforeBugs: [
      'Missing templates/agents.md.liquid',
      'AI claims “free worldwide shipping”',
      '2/5 ChatGPT Shopping fields missing',
    ],
    engineActionTitle: 'Shopify Liquid AI Bridge',
    engineActionSub: '5/5 Shopping + Pixel HMAC',
    afterScore: 91,
    afterStatus: '5/5 SHOPPING READY',
    afterWins: [
      'Live SKU stock & US/CA shipping rules',
      '2-year crash warranty cited verbatim',
      'HMAC checkout pixel tracks AI orders',
    ],
    commercialOutcome: '$6,480/mo in verified checkout sales attributed to chatgpt.com',
    howCustomerUsesIt: [
      '1. Merchant enters velocecycling.com — Verisource auto-detects Shopify Liquid.',
      '2. Copies the ready-made Shopify theme prompt + Customer Events pixel.',
      '3. Watches real AI bot crawls and attributed $ orders land in Step 01.',
    ],
  },
  {
    id: 'seo_agency',
    pillLabel: 'SEO & Web Agency · Retainers',
    figCode: 'FIG 02D · AGENCY PITCH ENGINE',
    businessName: 'Apex Search Partners',
    domain: '10 Prospect Domains / Batch',
    cmsBadge: 'WHITE-LABEL /AUDIT/[SLUG]',
    buyerPrompt: '“Cold-pitching 10 local & B2B prospects on $2,500/mo AI Search retainers”',
    beforeScore: 28,
    beforeStatus: '4 HRS MANUAL PREP',
    beforeBugs: [
      '4 hours screenshotting ChatGPT per lead',
      'Static PDFs with 0 open tracking',
      'Prospects ignore generic SEO cold emails',
    ],
    engineActionTitle: '60s Batch White-Label Pitch',
    engineActionSub: 'Logo + Color + Deal Alerts',
    afterScore: 96,
    afterStatus: 'DEAL ALERTS ACTIVE',
    afterWins: [
      '10 branded /audit/[slug] links in 60s',
      'Live OPENED · PDF SAVED · CTA CLICKED',
      '96.7% gross margin on $249/mo plan',
    ],
    commercialOutcome: '2 × $2,500/mo retainers closed from 10 branded audit links',
    howCustomerUsesIt: [
      '1. Agency pastes up to 10 prospect URLs + their logo and Cal.com link in Step 03.',
      '2. Sends the auto-drafted 3-touch outreach sequence with live rival proof.',
      '3. Follows up the moment Verisource emails an OPENED, PDF SAVED, or CTA CLICKED alert.',
    ],
  },
];

export function SampleBusinessMotionShowcase(): React.ReactElement {
  const [activeId, setActiveId] = useState<ScenarioId>('local_service');
  const active = SCENARIOS.find((s) => s.id === activeId) ?? SCENARIOS[0]!;

  const beforeDash = Math.round((active.beforeScore / 100) * 113);
  const afterDash = Math.round((active.afterScore / 100) * 113);

  return (
    <section
      id="sample-workflow"
      style={{ marginTop: '68px', scrollMarginTop: '80px' }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ maxWidth: '700px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            LIVE SAMPLE BUSINESS WORKFLOW · BEFORE &amp; AFTER MOTION STORYBOARD
          </div>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 31px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 8px 0',
            }}
          >
            Watch how a real business moves from skipped by AI to cited #1.
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '14.5px',
              lineHeight: 1.58,
              color: 'var(--vs-ink-secondary)',
            }}
          >
            Pick your business type below to see the exact broken signals
            Verisource catches—and how non-technical owners and pros ship the
            verified fix in minutes.
          </p>
        </div>

        <Link href="/tutorial" className="vs-btn vs-btn-secondary">
          Take 90-Second Guided Tour →
        </Link>
      </div>

      {/* Interactive Scenario Selector Pills */}
      <div
        role="tablist"
        aria-label="Sample business scenarios"
        className="vs-pill-group"
        style={{ marginBottom: '16px' }}
      >
        {SCENARIOS.map((sc) => {
          const isSelected = sc.id === active.id;
          return (
            <button
              key={sc.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              data-active={isSelected ? 'true' : 'false'}
              className="vs-pill-btn"
              onClick={() => setActiveId(sc.id)}
            >
              {sc.pillLabel}
            </button>
          );
        })}
      </div>

      <div className="vs-bezel">
        <div className="vs-card" style={{ overflow: 'hidden' }}>
          {/* Top Telemetry Strip */}
          <div className="vs-schematic-header">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                {active.figCode} · {active.businessName.toUpperCase()} (
                {active.domain})
              </span>
              <StatusBadge tone="pass">{active.cmsBadge}</StatusBadge>
            </div>
            <span
              className="vs-mono"
              style={{
                fontSize: '11.5px',
                color: 'var(--vs-ink-secondary)',
              }}
            >
              Buyer asks AI: <strong>{active.buyerPrompt}</strong>
            </span>
          </div>

          {/* Animated Motion SVG Canvas */}
          <div style={{ padding: '18px 16px 12px 16px', background: '#FFFFFF' }}>
            {/* Desktop Landscape Motion SVG (> 640px) */}
            <svg
              className="vs-schematic-desktop"
              viewBox="0 0 920 276"
              width="100%"
              role="img"
              aria-label={`Before and after animated workflow for ${active.businessName}: moving from ${active.beforeScore} out of 100 to ${active.afterScore} out of 100 via ${active.engineActionTitle}.`}
            >
              <defs>
                <filter
                  id="vsCaseShadow"
                  x="-5%"
                  y="-5%"
                  width="110%"
                  height="116%"
                >
                  <feDropShadow
                    dx="0"
                    dy="3"
                    stdDeviation="3.5"
                    floodColor="#0A0E17"
                    floodOpacity="0.065"
                  />
                </filter>
              </defs>

              {/* Subtle Architectural Grid Guide Lines */}
              <g stroke="#F0EDE5" strokeWidth="1">
                <line x1="16" y1="32" x2="904" y2="32" />
                <line x1="16" y1="244" x2="904" y2="244" />
              </g>

              {/* Connecting Motion Tracks: Left -> Center -> Right */}
              <path
                d="M 314 138 L 368 138"
                fill="none"
                stroke="#FECACA"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                className="vs-signal-path"
                d="M 314 138 L 368 138"
                fill="none"
                stroke="#991B1B"
                strokeWidth="2.6"
                strokeLinecap="round"
              />

              <path
                d="M 552 138 L 606 138"
                fill="none"
                stroke="#A7F3D0"
                strokeWidth="2.2"
              />
              <path
                className="vs-signal-path-out"
                d="M 552 138 L 606 138"
                fill="none"
                stroke="#059669"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* LEFT PANEL: BEFORE VERISOURCE */}
              <g transform="translate(18, 22)" filter="url(#vsCaseShadow)">
                <rect
                  width="296"
                  height="226"
                  rx="10"
                  fill="#FFFBFB"
                  stroke="#FECACA"
                  strokeWidth="1.2"
                />
                <rect
                  width="296"
                  height="34"
                  rx="10"
                  fill="#FEF2F2"
                />
                <line
                  x1="0"
                  y1="34"
                  x2="296"
                  y2="34"
                  stroke="#FECACA"
                  strokeWidth="1"
                />
                <circle
                  className="vs-live-dot"
                  cx="16"
                  cy="17"
                  r="4"
                  fill="#DC2626"
                />
                <text
                  x="27"
                  y="21"
                  fill="#991B1B"
                  fontSize="9.5"
                  fontFamily="var(--vs-mono)"
                  fontWeight="700"
                  letterSpacing="0.05em"
                >
                  1. BEFORE · {active.beforeStatus}
                </text>

                {/* Before Circular Score Gauge */}
                <g transform="translate(36, 76)">
                  <circle
                    cx="0"
                    cy="0"
                    r="18"
                    fill="none"
                    stroke="#FEE2E2"
                    strokeWidth="4"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="18"
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="4"
                    strokeDasharray={`${beforeDash} 113`}
                    strokeLinecap="round"
                    transform="rotate(-90)"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#991B1B"
                    fontSize="11"
                    fontFamily="var(--vs-mono)"
                    fontWeight="700"
                  >
                    {active.beforeScore}
                  </text>
                </g>

                <text
                  x="68"
                  y="71"
                  fill="#0A0E17"
                  fontSize="12.5"
                  fontFamily="var(--vs-sans)"
                  fontWeight="700"
                >
                  {active.businessName}
                </text>
                <text
                  x="68"
                  y="87"
                  fill="#686D78"
                  fontSize="10"
                  fontFamily="var(--vs-mono)"
                >
                  AI Readiness: {active.beforeScore} / 100
                </text>

                {/* 3 Flagged Issues */}
                {active.beforeBugs.map((bug, idx) => (
                  <g
                    key={bug}
                    transform={`translate(14, ${112 + idx * 34})`}
                  >
                    <rect
                      width="268"
                      height="27"
                      rx="5"
                      fill="#FFFFFF"
                      stroke="#FEE2E2"
                    />
                    <text
                      x="10"
                      y="17.5"
                      fill="#991B1B"
                      fontSize="10"
                      fontFamily="var(--vs-mono)"
                      fontWeight="600"
                    >
                      ✕ {bug}
                    </text>
                  </g>
                ))}
              </g>

              {/* CENTER ENGINE MONOLITH: VERISOURCE AUTO-REMEDIATION */}
              <g transform="translate(368, 56)" filter="url(#vsCaseShadow)">
                <rect
                  className="vs-pulse-ring"
                  x="-7"
                  y="-7"
                  width="198"
                  height="178"
                  rx="15"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="1.4"
                />
                <rect width="184" height="164" rx="12" fill="#0A0E17" />

                {/* Animated Top Radar Sweep Bar */}
                <g clipPath="inset(0 0 0 0 round 12px)">
                  <rect
                    className="vs-scan-sweep"
                    x="0"
                    y="0"
                    width="36"
                    height="3"
                    fill="#34D399"
                  />
                </g>

                <polygon
                  points="92,22 107,37 92,52 77,37"
                  fill="none"
                  stroke="#FAF9F6"
                  strokeWidth="1.6"
                />
                <circle
                  className="vs-live-dot"
                  cx="92"
                  cy="37"
                  r="3.5"
                  fill="#34D399"
                />

                <text
                  x="92"
                  y="74"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontFamily="var(--vs-mono)"
                  fontWeight="700"
                  letterSpacing="0.05em"
                >
                  2. VERISOURCE FIX
                </text>
                <text
                  x="92"
                  y="95"
                  textAnchor="middle"
                  fill="#34D399"
                  fontSize="9.8"
                  fontFamily="var(--vs-sans)"
                  fontWeight="700"
                >
                  {active.engineActionTitle}
                </text>
                <text
                  x="92"
                  y="113"
                  textAnchor="middle"
                  fill="#A3A8B4"
                  fontSize="8.8"
                  fontFamily="var(--vs-mono)"
                >
                  {active.engineActionSub}
                </text>

                <rect
                  x="26"
                  y="128"
                  width="132"
                  height="22"
                  rx="5"
                  fill="#162032"
                  stroke="#2B3954"
                />
                <text
                  x="92"
                  y="142.5"
                  textAnchor="middle"
                  fill="#EAE8E1"
                  fontSize="8.8"
                  fontFamily="var(--vs-mono)"
                  fontWeight="600"
                >
                  ZERO MANUAL CODE
                </text>
              </g>

              {/* RIGHT PANEL: AFTER VERISOURCE (VERIFIED LIVE) */}
              <g transform="translate(606, 22)" filter="url(#vsCaseShadow)">
                <rect
                  width="296"
                  height="226"
                  rx="10"
                  fill="#F6FEF9"
                  stroke="#A7F3D0"
                  strokeWidth="1.3"
                />
                <rect
                  width="296"
                  height="34"
                  rx="10"
                  fill="#ECFDF5"
                />
                <line
                  x1="0"
                  y1="34"
                  x2="296"
                  y2="34"
                  stroke="#A7F3D0"
                  strokeWidth="1"
                />
                <circle
                  className="vs-live-dot"
                  cx="16"
                  cy="17"
                  r="4"
                  fill="#059669"
                />
                <text
                  x="27"
                  y="21"
                  fill="#065F46"
                  fontSize="9.5"
                  fontFamily="var(--vs-mono)"
                  fontWeight="700"
                  letterSpacing="0.05em"
                >
                  3. AFTER · {active.afterStatus}
                </text>

                {/* After Circular Score Gauge */}
                <g transform="translate(36, 76)">
                  <circle
                    cx="0"
                    cy="0"
                    r="18"
                    fill="none"
                    stroke="#D1FAE5"
                    strokeWidth="4"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="18"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="4"
                    strokeDasharray={`${afterDash} 113`}
                    strokeLinecap="round"
                    transform="rotate(-90)"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#065F46"
                    fontSize="11"
                    fontFamily="var(--vs-mono)"
                    fontWeight="700"
                  >
                    {active.afterScore}
                  </text>
                </g>

                <text
                  x="68"
                  y="71"
                  fill="#0A0E17"
                  fontSize="12.5"
                  fontFamily="var(--vs-sans)"
                  fontWeight="700"
                >
                  +{active.afterScore - active.beforeScore} pt Readiness Lift
                </text>
                <text
                  x="68"
                  y="87"
                  fill="#065F46"
                  fontSize="10"
                  fontFamily="var(--vs-mono)"
                  fontWeight="600"
                >
                  Verified Live: {active.afterScore} / 100
                </text>

                {/* 3 Verified Wins */}
                {active.afterWins.map((win, idx) => (
                  <g
                    key={win}
                    transform={`translate(14, ${112 + idx * 34})`}
                  >
                    <rect
                      width="268"
                      height="27"
                      rx="5"
                      fill="#FFFFFF"
                      stroke="#A7F3D0"
                    />
                    <text
                      x="10"
                      y="17.5"
                      fill="#065F46"
                      fontSize="10"
                      fontFamily="var(--vs-mono)"
                      fontWeight="600"
                    >
                      ✓ {win}
                    </text>
                  </g>
                ))}
              </g>
            </svg>

            {/* Mobile Portrait Vertical Motion SVG (<= 640px) */}
            <svg
              className="vs-schematic-mobile"
              viewBox="0 0 340 420"
              width="100%"
              role="img"
              aria-label={`Mobile before and after diagram for ${active.businessName}: ${active.beforeScore} out of 100 to ${active.afterScore} out of 100.`}
            >
              {/* Before Card */}
              <g transform="translate(8, 8)">
                <rect
                  width="324"
                  height="136"
                  rx="8"
                  fill="#FFFBFB"
                  stroke="#FECACA"
                />
                <text
                  x="14"
                  y="22"
                  fill="#991B1B"
                  fontSize="9.5"
                  fontFamily="var(--vs-mono)"
                  fontWeight="700"
                >
                  1. BEFORE ({active.beforeScore}/100) · {active.beforeStatus}
                </text>
                {active.beforeBugs.map((bug, idx) => (
                  <text
                    key={bug}
                    x="14"
                    y={48 + idx * 28}
                    fill="#991B1B"
                    fontSize="10"
                    fontFamily="var(--vs-mono)"
                    fontWeight="600"
                  >
                    ✕ {bug}
                  </text>
                ))}
              </g>

              {/* Vertical Pulse Track 1 */}
              <path
                d="M 170 144 L 170 176"
                fill="none"
                stroke="#FECACA"
                strokeWidth="2"
              />
              <path
                className="vs-signal-path"
                d="M 170 144 L 170 176"
                fill="none"
                stroke="#991B1B"
                strokeWidth="2.5"
              />

              {/* Center Engine Bar */}
              <g transform="translate(24, 176)">
                <rect width="292" height="68" rx="8" fill="#0A0E17" />
                <circle
                  className="vs-live-dot"
                  cx="22"
                  cy="34"
                  r="4"
                  fill="#34D399"
                />
                <text
                  x="36"
                  y="28"
                  fill="#FFFFFF"
                  fontSize="10.5"
                  fontFamily="var(--vs-mono)"
                  fontWeight="700"
                >
                  2. {active.engineActionTitle.toUpperCase()}
                </text>
                <text
                  x="36"
                  y="46"
                  fill="#34D399"
                  fontSize="9.5"
                  fontFamily="var(--vs-mono)"
                >
                  {active.engineActionSub} · No manual coding
                </text>
              </g>

              {/* Vertical Pulse Track 2 */}
              <path
                d="M 170 244 L 170 276"
                fill="none"
                stroke="#A7F3D0"
                strokeWidth="2"
              />
              <path
                className="vs-signal-path-out"
                d="M 170 244 L 170 276"
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
              />

              {/* After Card */}
              <g transform="translate(8, 276)">
                <rect
                  width="324"
                  height="136"
                  rx="8"
                  fill="#F6FEF9"
                  stroke="#A7F3D0"
                />
                <text
                  x="14"
                  y="22"
                  fill="#065F46"
                  fontSize="9.5"
                  fontFamily="var(--vs-mono)"
                  fontWeight="700"
                >
                  3. AFTER ({active.afterScore}/100) · {active.afterStatus}
                </text>
                {active.afterWins.map((win, idx) => (
                  <text
                    key={win}
                    x="14"
                    y={48 + idx * 28}
                    fill="#065F46"
                    fontSize="10"
                    fontFamily="var(--vs-mono)"
                    fontWeight="600"
                  >
                    ✓ {win}
                  </text>
                ))}
              </g>
            </svg>
          </div>

          {/* How-To-Use 3-Step Strip + Commercial Result */}
          <div
            style={{
              padding: '14px 18px',
              borderTop: '1px solid var(--vs-border)',
              background: 'var(--vs-surface-warm)',
            }}
          >
            <div
              className="vs-grid-3"
              style={{ gap: '12px', marginBottom: '14px' }}
            >
              {active.howCustomerUsesIt.map((stepText) => (
                <div
                  key={stepText}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '7px',
                    background: '#FFFFFF',
                    border: '1px solid var(--vs-border)',
                    fontSize: '12.5px',
                    color: 'var(--vs-ink-secondary)',
                    lineHeight: 1.48,
                  }}
                >
                  {stepText}
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--vs-border)',
              }}
            >
              <div style={{ fontSize: '13px', color: 'var(--vs-ink)' }}>
                <span
                  className="vs-eyebrow"
                  style={{ color: 'var(--vs-pass-fg)', marginRight: '8px' }}
                >
                  MEASURED OUTCOME:
                </span>
                <strong>{active.commercialOutcome}</strong>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <a
                  href="#grader"
                  className="vs-btn vs-btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12.5px' }}
                >
                  Test My Website Free ↑
                </a>
                <Link
                  href="/pricing"
                  className="vs-btn"
                  style={{ padding: '8px 14px', fontSize: '12.5px' }}
                >
                  Start 7-Day Free Trial ($0 Today) →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
