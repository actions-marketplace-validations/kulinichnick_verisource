import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import {
  buildAgencyColdOutreachNote,
  type AgencyPitchReportRow,
} from '@verisource/core-geo';
import {
  CodeArtifactCard,
  MetricLedgerCell,
  StatusBadge,
} from '@verisource/ui';
import { AgencyPipelineSchematic } from '../../components/AgencyPipelineSchematic';
import { AgencyRoiCalculator } from '../../components/AgencyRoiCalculator';

export const metadata: Metadata = {
  title: 'White-Label GEO & AI Search Audits for Agencies | Verisource',
  description:
    'Mint branded 60-second /audit/[slug] client scorecards with your agency logo, filter Slackbot opens, and close $1,500–$3,000/mo GEO retainers on 15 client sites ($249/mo).',
  alternates: {
    canonical: 'https://verisource.dev/agencies',
  },
};

const AGENCY_WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Paste up to 10 prospect domains in Batch Mode',
    detail:
      'Tab 3 Batch Mode audits up to 10 Shopify, B2B SaaS, or local service websites in parallel—probing GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot WAF rules plus live ChatGPT, Gemini, and Perplexity citations.',
  },
  {
    step: '02',
    title: 'Share pure white-label /audit/[slug] scorecards',
    detail:
      'Every client report carries your agency logo, hex accent bar, and calendar booking button. Global Verisource navigation is stripped automatically at the CSS root, and prospects can save a clean executive PDF.',
  },
  {
    step: '03',
    title: 'Follow up on verified human open alerts',
    detail:
      'Slackbot, LinkedInBot, and email preview crawlers are filtered out. When a real prospect opens their brief (1x) or shares it internally (3x), an instant alert hits your agency inbox.',
  },
  {
    step: '04',
    title: 'Ship >= 9.5/10 client fixes in one click',
    detail:
      'Export ready-to-paste schema.org JSON-LD, /llms.txt, /agents.md, and Shopify templates/agents.md.liquid overrides—or connect Claude Desktop, Cursor, and Antigravity via 5,000 monthly /mcp credits.',
  },
];

export default function AgenciesPartnerPage(): React.ReactElement {
  const sampleClientBrief: AgencyPitchReportRow = {
    id: '00000000-0000-4000-8000-000000000099',
    agency_user_id: '00000000-0000-4000-8000-000000000001',
    share_slug: 'vanguard-freightops-audit',
    prospect_domain: 'https://vanguardfreight.io',
    prospect_brand_name: 'Vanguard FreightOps',
    visibility_score: 38,
    hallucination_count: 2,
    agency_brand_name_snapshot: 'Northstar Search Studio',
    agency_logo_url_snapshot: null,
    agency_primary_color_snapshot: '#0A0E17',
    agency_cta_url_snapshot: 'https://cal.com/northstar/ai-audit',
    summary_payload: {
      top_gaps: [
        'AI retrieval crawlers (PerplexityBot) encounter edge WAF HTTP 403 restrictions.',
        'Missing /llms.txt machine-readable entity and pricing summary.',
      ],
      competitors_winning: ['Flexport', 'Freightos'],
      hallucination_examples: [
        {
          category: 'pricing',
          claim_text:
            'Vanguard FreightOps requires a $2,500 monthly minimum retainer.',
          verified_truth:
            'Self-Serve LTL plans start at $390/month with zero setup fees.',
          severity: 'high',
        },
      ],
      recommended_fixes: [
        'Publish 9.5+/10 graded Organization + FAQPage JSON-LD schema.',
        'Publish canonical /agents.md and /llms.txt truth files at domain root.',
      ],
    },
    views_count: 3,
    expires_at: null,
    created_at: '2026-11-01T12:00:00.000Z',
  };
  const outreachSample = buildAgencyColdOutreachNote(
    sampleClientBrief,
    'https://verisource.dev'
  );

  return (
    <div>
      {/* Hero Section with Zero-Lag Animated SVG Retainer Schematic */}
      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '48px 0 54px 0',
          marginBottom: '40px',
        }}
      >
        <div className="vs-container">
          <div className="vs-hero-grid">
            <div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <StatusBadge tone="pass">AGENCY WHITE-LABEL · $249/MO</StatusBadge>
                <StatusBadge>15 CLIENT WEBSITES ($16.60/SITE)</StatusBadge>
                <StatusBadge>5,000 /MCP CREDITS</StatusBadge>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(31px, 4vw, 45px)',
                  lineHeight: 1.08,
                  letterSpacing: '-0.03em',
                  fontWeight: 700,
                  margin: '0 0 16px 0',
                }}
              >
                Turn cold prospect domains into $1,500–$3,000/mo retainers.{' '}
                <span
                  className="vs-display-serif"
                  style={{ fontSize: '1.08em', fontWeight: 400 }}
                >
                  Your logo. Zero Verisource chrome.
                </span>
              </h1>

              <p
                style={{
                  fontSize: '15.5px',
                  lineHeight: 1.62,
                  color: 'var(--vs-ink-secondary)',
                  margin: '0 0 24px 0',
                  maxWidth: '580px',
                }}
              >
                SEO, web design, digital PR, and Shopify Plus agencies use
                Verisource to pitch AI search visibility with concrete proof—not
                generic slide decks. Mint 60-second branded{' '}
                <code className="vs-mono">/audit/[slug]</code> scorecards, export
                ready-to-send CSV campaigns, and deliver verified{' '}
                <code className="vs-mono">JSON-LD</code> and{' '}
                <code className="vs-mono">/agents.md</code> fixes.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <a
                  href="/api/checkout?plan=agency_249&cycle=monthly"
                  className="vs-btn"
                >
                  Start Agency Plan ($249/mo) →
                </a>
                <a
                  href="/api/checkout?plan=agency_249&cycle=annual"
                  className="vs-btn vs-btn-secondary"
                >
                  Annual Plan ($199/mo · Save 20%)
                </a>
                <Link
                  href="/#audit"
                  className="vs-btn vs-btn-secondary"
                >
                  Test Free Website Audit →
                </Link>
              </div>
            </div>

            <AgencyPipelineSchematic />
          </div>
        </div>
      </section>

      <div className="vs-container">
        {/* Retainer Margin & Unit Economics Ledger */}
        <section style={{ marginBottom: '54px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            AGENCY RETAINER ECONOMICS
          </div>
          <h2
            style={{
              fontSize: '25px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 16px 0',
            }}
          >
            Built for 87%+ software margin from your first client retainer.
          </h2>

          <div
            className="vs-card vs-ledger-strip-4"
            style={{ overflow: 'hidden' }}
          >
            <MetricLedgerCell
              label="INCLUDED CLIENT SITES"
              value="15"
              sublabel="400 weekly tracked buyer prompts"
            />
            <MetricLedgerCell
              label="EFFECTIVE COST / CLIENT"
              value="$16.60/mo"
              sublabel="$249/mo monthly · $13.27/site annual"
              tone="pass"
            />
            <MetricLedgerCell
              label="TYPICAL GEO RETAINER"
              value="$1,500–$3k"
              sublabel="Local legal/dental, D2C & B2B SaaS"
            />
            <MetricLedgerCell
              label="AGENT /MCP QUOTA"
              value="5,000"
              sublabel="1 credit cached · 10 credits live scan"
            />
          </div>

          <AgencyRoiCalculator />
        </section>

        {/* 4-Step Operational Workflow */}
        <section style={{ marginBottom: '54px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            HOW AGENCIES SELL &amp; DELIVER
          </div>
          <h2
            style={{
              fontSize: '25px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 18px 0',
            }}
          >
            From cold prospect list to deployed client schema in four steps.
          </h2>

          <div className="vs-grid-2">
            {AGENCY_WORKFLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className="vs-card"
                style={{ padding: '22px' }}
              >
                <div
                  className="vs-mono"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--vs-ink-muted)',
                    marginBottom: '8px',
                  }}
                >
                  STEP {item.step}
                </div>
                <h3
                  style={{
                    fontSize: '16.5px',
                    fontWeight: 700,
                    letterSpacing: '-0.015em',
                    margin: '0 0 8px 0',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Live Cold Outreach Artifact Preview */}
        <section style={{ marginBottom: '54px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            AUTO-GENERATED OUTREACH COPY
          </div>
          <h2
            style={{
              fontSize: '25px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 8px 0',
            }}
          >
            Every minted link writes its own 4-sentence founder outreach note.
          </h2>
          <p
            style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: 'var(--vs-ink-secondary)',
              maxWidth: '680px',
            }}
          >
            Export single notes or download a bulk RFC 4180 CSV ready for
            Instantly, Smartlead, Apollo, or Gmail—graded automatically above
            9.5/10 with zero generic marketing filler.
          </p>

          <CodeArtifactCard
            title="White-Label Agency Cold Outreach Note (Northstar Search Studio)"
            fileHint="Exported per prospect in Tab 3 Module 4 · Ready for Gmail, Instantly, or LinkedIn DM"
            code={outreachSample.content}
            qualityScore={outreachSample.score}
            qualityBreakdown={outreachSample.breakdown}
          />
        </section>

        {/* Bottom Agency Callout */}
        <section>
          <div
            className="vs-card"
            style={{
              padding: '26px 28px',
              background: 'var(--vs-surface-warm)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>
                Ready to white-label Verisource across your client roster?
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--vs-ink-secondary)' }}>
                Includes 15 client domains, custom logo &amp; hex branding,
                human open alerts, and 5,000 monthly <code className="vs-mono">/mcp</code>{' '}
                credits.
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link
                href="/sample-audit"
                className="vs-btn vs-btn-secondary"
              >
                Inspect Live Sample Briefs
              </Link>
              <a
                href="/api/checkout?plan=agency_249&cycle=monthly"
                className="vs-btn"
              >
                Start Agency White-Label ($249/mo) →
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
