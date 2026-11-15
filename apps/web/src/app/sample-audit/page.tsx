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
    'Inspect live 3-engine white-label /audit/[slug] client briefs (ChatGPT, Gemini & Perplexity) across B2B SaaS, Agencies, and Local Services.',
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
        'Publish >= 9.5/10 SoftwareApplication + FAQPage JSON-LD graph.',
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
            <StatusBadge>BATCH CSV + PLAYBOOK EXPORT</StatusBadge>
            <StatusBadge>PRINT / SAVE PDF READY</StatusBadge>
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
            audit up to 10 prospect domains in parallel, mint white-label{' '}
            <code className="vs-mono">/audit/[slug]</code> scorecards with their
            own logo and calendar link, and export a ready-to-send outreach CSV.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link href="/#grader" className="vs-btn">
              Audit Any Website Free →
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

        {/* Critic-Verified 4-Sentence Cold Outreach Preview */}
        <section style={{ marginBottom: '40px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            ZERO AI-SLOP OUTREACH EXPORT
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 8px 0',
            }}
          >
            Every batch exports a Critic-verified 4-sentence founder note.
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
