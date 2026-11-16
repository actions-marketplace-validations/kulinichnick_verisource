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
    'Mint branded 60-second /audit/[slug] client scorecards with auto-detected CMS badges, Business Impact action plans, and your agency logo ($249/mo for 15 sites).',
  alternates: {
    canonical: 'https://verisource.dev/agencies',
  },
};

const AGENCY_WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Paste up to 10 prospect domains in Batch Mode',
    detail:
      'Step 03 Batch Mode audits up to 10 websites in parallel—auto-detecting Shopify, WordPress, Webflow, Wix, Squarespace, Framer, or custom stacks while probing GPTBot, PerplexityBot, and live ChatGPT, Gemini, and Perplexity citations.',
  },
  {
    step: '02',
    title: 'Share pure white-label /audit/[slug] Business Impact briefs',
    detail:
      'Every client report carries your agency logo, hex accent bar, calendar booking button, and an easy-to-use Site Diagnosis & Business Impact card that explains why missing AI facts cost 14.2%–15.9% converting leads—with zero Verisource chrome.',
  },
  {
    step: '03',
    title: 'Follow up on verified human open alerts',
    detail:
      'Slackbot, LinkedInBot, and email preview crawlers are filtered out. When a real prospect opens their brief (1x) or forwards it internally (3x), an instant alert hits your agency inbox.',
  },
  {
    step: '04',
    title: 'Fulfill retainers in 15 minutes via 1-Click AI Fix Prompts',
    detail:
      'Copy a platform-tailored 1-Click AI Fix Prompt (WordPress WPCode, Webflow Custom Code, Wix/Squarespace/Framer /ai-facts, Shopify Liquid, or Coding Agent)—or automate across repos with 5,000 monthly /mcp credits.',
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
      detected_platform: 'webflow',
      detected_platform_label: 'Webflow',
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
        'Publish syntax-validated Organization + FAQPage JSON-LD schema.',
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
                <StatusBadge>7-PLATFORM AUTO-CMS + 5,000 /MCP CR</StatusBadge>
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
                SEO, web design, digital PR, and Shopify agencies use Verisource
                to pitch AI search visibility with concrete proof—not slide
                decks. Mint 60-second branded{' '}
                <code className="vs-mono">/audit/[slug]</code> scorecards that
                auto-detect the prospect&rsquo;s CMS, explain business impact
                without jargon, and fulfill fixes in one AI prompt.
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
                  href="/tutorial"
                  className="vs-btn vs-btn-secondary"
                >
                  Interactive Agency Tour →
                </Link>
                <Link
                  href="/#grader"
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
        <div
          className="vs-guided-banner"
          style={{
            marginBottom: '36px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ maxWidth: '820px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '3px' }}>
              FOUNDING AGENCY PARTNER COHORT · FIRST 30 AGENCIES LOCK $249/MO FOR LIFE
            </div>
            <div
              style={{
                fontSize: '13.5px',
                lineHeight: 1.56,
                color: 'var(--vs-ink-secondary)',
              }}
            >
              Lock <strong style={{ color: 'var(--vs-ink)' }}>$249/mo</strong>{' '}
              ($199/mo annual, standard $349/mo) across 15 client slots
              permanently—plus a complimentary{' '}
              <strong style={{ color: 'var(--vs-ink)' }}>
                founder-verified setup &amp; white-label pitch check on your
                first 3 client domains
              </strong>
              .
            </div>
          </div>
          <StatusBadge tone="pass">FOUNDING PARTNER RATE ACTIVE</StatusBadge>
        </div>
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
            From cold prospect list to deployed client fixes in four steps.
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

        {/* Supported Client CMS & Fulfillment Matrix */}
        <section style={{ marginBottom: '54px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            7-PLATFORM AUTO-DETECTED CLIENT DELIVERY
          </div>
          <h2
            style={{
              fontSize: '25px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 14px 0',
            }}
          >
            Fulfill any client website stack—even builders without root file access.
          </h2>

          <div className="vs-card" style={{ padding: '18px 20px' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <StatusBadge tone="pass">SHOPIFY (/API/UCP/MCP + LIQUID)</StatusBadge>
              <StatusBadge tone="pass">WORDPRESS (WPCODE / RANKMATH / YOAST)</StatusBadge>
              <StatusBadge tone="pass">WEBFLOW (CUSTOM CODE + 301 REDIRECTS)</StatusBadge>
              <StatusBadge tone="pass">WIX · SQUARESPACE · FRAMER (/AI-FACTS)</StatusBadge>
              <StatusBadge tone="pass">NEXT.JS &amp; CUSTOM REPOS (CODING AGENTS)</StatusBadge>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '13.5px',
                lineHeight: 1.6,
                color: 'var(--vs-ink-secondary)',
              }}
            >
              Every minted <code className="vs-mono">/audit/[slug]</code> link
              stamps the prospect&rsquo;s detected platform in the header so your
              account executive knows their stack before the call—and Step 02
              generates a tailored <strong>1-Click AI Fix Prompt</strong> for
              that exact builder (including{' '}
              <code className="vs-mono">/ai-facts</code> verification for Wix,
              Squarespace, Webflow, and Framer sites).
            </p>
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
            Instantly, Smartlead, Apollo, or Gmail—anchored strictly to verified
            crawl facts with zero generic marketing filler.
          </p>

          <CodeArtifactCard
            title="White-Label Agency Cold Outreach Note (Northstar Search Studio)"
            fileHint="Exported per prospect in Console Step 03 · Ready for Gmail, Instantly, or LinkedIn DM"
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
