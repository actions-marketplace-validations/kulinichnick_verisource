import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import {
  buildAgencyColdOutreachNote,
  type AgencyPitchReportRow,
} from '@verisource/core-geo';
import { CodeArtifactCard, StatusBadge } from '@verisource/ui';
import { SampleAuditCohortClient } from '../../components/SampleAuditCohortClient';
import { getServiceSupabaseClient } from '../../lib/data-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sample White-Label Client Audits & Outbound Playbook | Verisource',
  description:
    'Inspect live 3-engine white-label /audit/[slug] client briefs (ChatGPT, Gemini & Perplexity) with auto-detected CMS badges and easy-to-follow Business Impact action plans.',
  alternates: {
    canonical: 'https://verisource.dev/sample-audit',
  },
};

const FALLBACK_COHORT_REPORTS: AgencyPitchReportRow[] = [
  {
    id: '66666666-2222-4000-8000-000000000101',
    agency_user_id: '00000000-0000-4000-8000-000000000001',
    share_slug: 'northstar-cloud-b2b-brief',
    prospect_domain: 'https://resend.com',
    prospect_brand_name: 'Resend',
    visibility_score: 64,
    hallucination_count: 1,
    agency_brand_name_snapshot: 'Verisource GEO Advisory',
    agency_logo_url_snapshot: null,
    agency_primary_color_snapshot: '#0A0E17',
    agency_cta_url_snapshot: 'https://verisource.dev/pricing',
    summary_payload: {
      detected_platform: 'nextjs_custom',
      detected_platform_label: 'Custom / Next.js',
      business_impact_items: [
        {
          severity: 'fix_first',
          badgeLabel: 'FIX FIRST · WRONG PRICING',
          whatIsWrong: 'AI search quotes a non-existent $10/mo unlimited email tier',
          whyItMatters:
            'AI-referred visitors convert at 14.2%–15.9%, yet buyers bounce when checkout shows $20/mo for 50,000 emails instead of $10/mo unlimited.',
          howToFix:
            'Publish /agents.md and OfferCatalog JSON-LD locking verified Pro and Scale API tiers via 1-Click AI Fix Prompt.',
        },
        {
          severity: 'high_impact',
          badgeLabel: 'HIGH IMPACT · RIVAL CITATIONS',
          whatIsWrong: 'Reddit and G2 comparison threads outrank owned docs on commercial prompts',
          whyItMatters:
            'Postmark and SendGrid capture footnote links when unbranded buyers ask ChatGPT and Perplexity to compare transactional email APIs.',
          howToFix:
            'Ship a truth-locked comparison page (/compare/resend-vs-postmark) with FAQPage schema.',
        },
      ],
      top_gaps: [
        'Missing canonical /agents.md pricing and API tier guardrail file.',
        'Third-party Reddit and G2 comparison threads outrank owned docs on commercial queries.',
      ],
      competitors_winning: ['Postmark', 'SendGrid', 'Amazon SES'],
      hallucination_examples: [
        {
          claim_text: 'Offers a $10/mo unlimited transactional email plan.',
          verified_truth: 'Paid Pro tier starts at $20/mo for 50,000 emails.',
          severity: 'high',
          category: 'pricing',
        },
      ],
      recommended_fixes: [
        'Publish syntax-validated SoftwareApplication + FAQPage JSON-LD graph.',
        'Deploy /agents.md and /llms.txt at domain root.',
      ],
    },
    views_count: 12,
    expires_at: null,
    created_at: '2026-11-15T12:00:00.000Z',
  },
  {
    id: '66666666-2222-4000-8000-000000000102',
    agency_user_id: '00000000-0000-4000-8000-000000000001',
    share_slug: 'siegemedia-agency-brief',
    prospect_domain: 'https://siegemedia.com',
    prospect_brand_name: 'Siege Media',
    visibility_score: 58,
    hallucination_count: 0,
    agency_brand_name_snapshot: 'Verisource GEO Advisory',
    agency_logo_url_snapshot: null,
    agency_primary_color_snapshot: '#0A0E17',
    agency_cta_url_snapshot: 'https://verisource.dev/pricing',
    summary_payload: {
      detected_platform: 'wordpress',
      detected_platform_label: 'WordPress',
      business_impact_items: [
        {
          severity: 'high_impact',
          badgeLabel: 'HIGH IMPACT · MISSING AI FILES',
          whatIsWrong: 'Missing /llms.txt and /agents.md retainer scope files on WordPress',
          whyItMatters:
            'Clutch directories and third-party agency roundups answer for your brand when B2B CMOs shortlist content agencies in Perplexity.',
          howToFix:
            'Paste the WordPress WPCode / RankMath 1-Click AI Fix Prompt to publish ProfessionalService JSON-LD and /agents.md.',
        },
      ],
      top_gaps: [
        'Missing /llms.txt machine-readable agency scope and retainer overview.',
        'Clutch and editorial agency listicles dominate unbranded B2B SEO prompts.',
      ],
      competitors_winning: ['Omniscient Digital', 'Animalz', 'Single Grain'],
      hallucination_examples: [],
      recommended_fixes: [
        'Publish ProfessionalService + FAQPage JSON-LD entity graph.',
        'Publish canonical /agents.md engagement and ICP truth file.',
      ],
    },
    views_count: 8,
    expires_at: null,
    created_at: '2026-11-15T12:05:00.000Z',
  },
  {
    id: '66666666-2222-4000-8000-000000000103',
    agency_user_id: '00000000-0000-4000-8000-000000000001',
    share_slug: 'hellotend-dental-brief',
    prospect_domain: 'https://hellotend.com',
    prospect_brand_name: 'Tend Dental',
    visibility_score: 52,
    hallucination_count: 1,
    agency_brand_name_snapshot: 'Verisource GEO Advisory',
    agency_logo_url_snapshot: null,
    agency_primary_color_snapshot: '#0A0E17',
    agency_cta_url_snapshot: 'https://verisource.dev/pricing',
    summary_payload: {
      detected_platform: 'webflow',
      detected_platform_label: 'Webflow',
      business_impact_items: [
        {
          severity: 'fix_first',
          badgeLabel: 'FIX FIRST · POLICY CLAIM',
          whatIsWrong: 'AI claims studio locations accept all state Medicaid dental plans nationwide',
          whyItMatters:
            'Patients arrive expecting unsupported Medicaid coverage instead of accepted PPO dental plans across metro studios.',
          howToFix:
            'Publish Webflow Custom Code Dentist + LocalBusiness JSON-LD and /ai-facts insurance guardrails.',
        },
      ],
      top_gaps: [
        'Missing /agents.md insurance and studio membership policy guardrails.',
        'Zocdoc and Yelp directories capture top Perplexity footnote slots.',
      ],
      competitors_winning: ['Aspen Dental', 'One Medical', 'Local Studio Peers'],
      hallucination_examples: [
        {
          claim_text: 'Accepts all state Medicaid dental plans nationwide.',
          verified_truth:
            'Accepts major PPO dental insurance plans across operating metro studios.',
          severity: 'high',
          category: 'offering',
        },
      ],
      recommended_fixes: [
        'Publish Dentist + LocalBusiness JSON-LD across studio locations.',
        'Publish canonical /agents.md insurance and pricing truth sheet.',
      ],
    },
    views_count: 9,
    expires_at: null,
    created_at: '2026-11-15T12:10:00.000Z',
  },
];

export default async function SampleAuditShowcasePage(): Promise<React.ReactElement> {
  let liveCohortReports: AgencyPitchReportRow[] = [];
  const supabase = getServiceSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from('agency_pitch_reports')
      .select('*')
      .eq('agency_brand_name_snapshot', 'Verisource GEO Advisory')
      .order('created_at', { ascending: false })
      .limit(24);
    if (data && data.length > 0) {
      liveCohortReports = (data as AgencyPitchReportRow[]).filter(
        (r) =>
          !/aurearoasters|mosaicroasters/i.test(
            `${r.prospect_domain} ${r.prospect_brand_name}`
          )
      );
    }
  }

  if (liveCohortReports.length === 0) {
    liveCohortReports = FALLBACK_COHORT_REPORTS;
  }

  const featuredReport = liveCohortReports[0] ?? FALLBACK_COHORT_REPORTS[0]!;
  const sampleOutreach = buildAgencyColdOutreachNote(
    featuredReport,
    'https://verisource.dev'
  );
  const specimenImpact = FALLBACK_COHORT_REPORTS[0]!.summary_payload.business_impact_items!;

  return (
    <div>
      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '44px 0 46px 0',
          marginBottom: '36px',
        }}
      >
        <div className="vs-container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <StatusBadge tone="pass">PURE WHITE-LABEL ISOLATION</StatusBadge>
            <StatusBadge>7-PLATFORM AUTO-CMS DETECTION</StatusBadge>
            <StatusBadge>EASY-TO-USE ACTION PLAN + PDF</StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 3.8vw, 42px)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: '0 0 14px 0',
              maxWidth: '780px',
            }}
          >
            Turn any client domain into a branded 60-second audit brief.{' '}
            <span
              className="vs-display-serif"
              style={{ fontSize: '1.08em', fontWeight: 400 }}
            >
              Zero Verisource branding attached.
            </span>
          </h1>

          <p
            style={{
              fontSize: '15.5px',
              lineHeight: 1.62,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 22px 0',
              maxWidth: '680px',
            }}
          >
            SEO, web design, and digital PR agencies use Console Batch Mode to
            audit up to 10 prospect domains in parallel, detect each client&rsquo;s
            website builder (<code className="vs-mono">Shopify</code>,{' '}
            <code className="vs-mono">WordPress</code>,{' '}
            <code className="vs-mono">Webflow</code>,{' '}
            <code className="vs-mono">Wix</code>,{' '}
            <code className="vs-mono">Squarespace</code>,{' '}
            <code className="vs-mono">Framer</code>, or custom code), and mint
            white-label <code className="vs-mono">/audit/[slug]</code> briefs
            with an easy-to-follow Business Impact action plan.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link href="/#grader" className="vs-btn">
              Audit Any Website Free →
            </Link>
            <Link href="/agencies#sandbox" className="vs-btn vs-btn-secondary">
              Test Your Agency Brand Live →
            </Link>
            <Link href="/agencies" className="vs-btn vs-btn-secondary">
              Agency Partner Architecture →
            </Link>
            <Link href="/pricing" className="vs-btn vs-btn-secondary">
              Agency Plan ($249/mo)
            </Link>
          </div>
        </div>
      </section>

      <div className="vs-container">
        {/* Specimen Preview: What Decision-Makers See Inside Every /audit/[slug] Brief */}
        <section style={{ marginBottom: '44px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            INSIDE EVERY SHAREABLE /AUDIT/[SLUG] BRIEF
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 14px 0',
            }}
          >
            Decision-makers see what is wrong, why it costs leads, and how to fix it.
          </h2>

          <div className="vs-card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '13px 16px',
                background: 'var(--vs-surface-warm)',
                borderBottom: '1px solid var(--vs-border)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div>
                <div className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                  SITE DIAGNOSIS &amp; BUSINESS IMPACT · WHAT TO FIX FIRST
                </div>
                <strong style={{ fontSize: '14px' }}>
                  Auto-generated for every prospect URL alongside your agency booking CTA
                </strong>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <StatusBadge tone="pass">PLATFORM: AUTO-DETECTED CMS</StatusBadge>
                <StatusBadge>1-CLICK AI FIX PROMPT READY</StatusBadge>
              </div>
            </div>

            <div className="vs-grid-2" style={{ padding: '16px' }}>
              {specimenImpact.map((item, index) => (
                <div
                  key={item.whatIsWrong}
                  style={{
                    padding: '14px',
                    borderRadius: '6px',
                    border: '1px solid var(--vs-border)',
                    background:
                      item.severity === 'fix_first'
                        ? 'var(--vs-crit-bg)'
                        : 'var(--vs-surface-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px',
                    }}
                  >
                    <StatusBadge
                      tone={item.severity === 'fix_first' ? 'critical' : 'warn'}
                    >
                      {item.badgeLabel}
                    </StatusBadge>
                    <strong style={{ fontSize: '13.5px' }}>
                      {index + 1}. {item.whatIsWrong}
                    </strong>
                  </div>
                  <div
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--vs-ink-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '6px',
                    }}
                  >
                    <strong style={{ color: 'var(--vs-ink)' }}>
                      Business impact:
                    </strong>{' '}
                    {item.whyItMatters}
                  </div>
                  <div
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--vs-ink-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: 'var(--vs-ink)' }}>Fix:</strong>{' '}
                    {item.howToFix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '52px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            LIVE MULTI-VERTICAL BENCHMARK COHORT
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 14px 0',
            }}
          >
            Live 3-engine HTTP + AI Search audits across B2B SaaS, Agencies, and
            Local Services.
          </h2>
          <SampleAuditCohortClient reports={liveCohortReports} />
        </section>

        {/* Fact-Verified 4-Sentence Cold Outreach Preview */}
        <section style={{ marginBottom: '40px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            FACT-ANCHORED OUTREACH EXPORT
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 8px 0',
            }}
          >
            Every batch exports a fact-verified 4-sentence founder note.
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 16px 0',
              maxWidth: '720px',
            }}
          >
            No generic corporate filler. Every cold email references the
            prospect&rsquo;s exact score, verbatim claim discrepancy or citation
            gap, and private <code className="vs-mono">/audit/[slug]</code>{' '}
            brief—ready for Gmail, Superhuman, Apollo, or LinkedIn DM.
          </p>

          <CodeArtifactCard
            title={`Sample Exported Cold-Outreach Note (${featuredReport.prospect_brand_name})`}
            plainSummary="Generated automatically alongside every single or batch client audit."
            fileHint="Exported in 1 click via ↓ Export CSV or ↓ Playbook (.md) in Console Step 3"
            code={sampleOutreach.content}
            qualityScore={sampleOutreach.score}
            qualityBreakdown={sampleOutreach.breakdown}
          />
        </section>
      </div>
    </div>
  );
}
