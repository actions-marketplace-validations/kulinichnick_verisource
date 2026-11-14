import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import {
  PATIENT_ZERO_PITCH_REPORT,
  buildAgencyColdOutreachNote,
  type AgencyPitchReportRow,
} from '@verisource/core-geo';
import { CodeArtifactCard, StatusBadge } from '@verisource/ui';
import {
  getLocalMockStore,
  getServiceSupabaseClient,
} from '../../lib/data-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sample White-Label Client Audits & Outbound Playbook | Verisource',
  description:
    'Inspect live 3-engine white-label /audit/[slug] client briefs (ChatGPT, Gemini & Perplexity) and Critic-verified (>= 9.5/10) 4-sentence founder outreach notes.',
  alternates: {
    canonical: 'https://verisource.dev/sample-audit',
  },
};

export default async function SampleAuditShowcasePage(): Promise<React.ReactElement> {
  const sampleOutreach = buildAgencyColdOutreachNote(
    PATIENT_ZERO_PITCH_REPORT,
    'https://verisource.dev'
  );

  let liveCohortReports: AgencyPitchReportRow[] = [];
  const supabase = getServiceSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from('agency_pitch_reports')
      .select('*')
      .eq('agency_brand_name_snapshot', 'Verisource GEO Advisory')
      .order('created_at', { ascending: false })
      .limit(18);
    if (data && data.length > 0) {
      liveCohortReports = data as AgencyPitchReportRow[];
    }
  } else {
    liveCohortReports = getLocalMockStore().pitchReports.slice(0, 6);
  }

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
            SEO, web design, and digital PR agencies use Tab 3 Batch Mode to
            audit up to 10 prospect domains in parallel, mint white-label{' '}
            <code className="vs-mono">/audit/[slug]</code> scorecards with their
            own logo and calendar link, and export a ready-to-send outreach CSV.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link href="/dashboard?tab=tab3_offsite" className="vs-btn">
              Build a Free Sample Pitch Link →
            </Link>
            <Link
              href="/audit/mosaic-springfield-audit"
              className="vs-btn vs-btn-secondary"
            >
              Open Full Mosaic Brief →
            </Link>
            <Link href="/pricing" className="vs-btn vs-btn-secondary">
              Agency Plan ($249/mo)
            </Link>
          </div>
        </div>
      </section>

      <div className="vs-container">
        {/* Flagship Before -> After Verified Briefs */}
        <section style={{ marginBottom: '52px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            FLAGSHIP CASE-STUDY REPORTS
          </div>
          <h2
            style={{
              fontSize: '25px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
            }}
          >
            Inspect live executive briefs before and after remediation.
          </h2>

          <div className="vs-grid-2">
            <div className="vs-card" style={{ padding: '22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <span className="vs-eyebrow">SPECIALTY SHOPIFY · NATIONWIDE</span>
                <StatusBadge tone="pass">41 → 92 / 100 LIVE</StatusBadge>
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>
                Aurea Coffee Roasters (<code className="vs-mono">aurearoasters.com</code>)
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  color: 'var(--vs-ink-secondary)',
                  margin: '0 0 16px 0',
                }}
              >
                Flagged an invented $15 K-Cup pod claim in ChatGPT and
                Perplexity, then published an 8-SKU{' '}
                <code className="vs-mono">OfferCatalog</code> ($21.95–$109.95)
                and canonical Markdown truth link.
              </p>
              <Link
                href="/audit/aurearoasters-com-vf9w"
                className="vs-btn vs-btn-secondary"
              >
                Open Live Aurea Audit →
              </Link>
            </div>

            <div className="vs-card" style={{ padding: '22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <span className="vs-eyebrow">REGIONAL + E-COMMERCE · SPRINGFIELD MO</span>
                <StatusBadge tone="pass">52 → 84 / 100 LIVE</StatusBadge>
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>
                Mosaic Coffee Roasters (<code className="vs-mono">mosaicroasters.com</code>)
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  color: 'var(--vs-ink-secondary)',
                  margin: '0 0 16px 0',
                }}
              >
                Corrected a false $25 nationwide free-shipping claim with a{' '}
                <code className="vs-mono">40.2km GeoCircle</code> schema and
                live <code className="vs-mono">/pages/ai-facts</code> endpoint
                stating $45+ local delivery within 25 miles.
              </p>
              <Link
                href="/audit/mosaic-springfield-audit"
                className="vs-btn vs-btn-secondary"
              >
                Open Live Mosaic Audit →
              </Link>
            </div>
          </div>
        </section>

        {/* Live Multi-Vertical Cohort Gallery (populated automatically when Supabase cohort rows exist) */}
        {liveCohortReports.length > 0 ? (
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
              Recent live 3-engine HTTP + AI Search audits (ChatGPT, Gemini &amp;
              Perplexity).
            </h2>
            <div className="vs-card vs-table-wrap">
              <table className="vs-table">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>AI Visibility</th>
                    <th>Rivals Cited</th>
                    <th>Key Protocol Gap Flagged</th>
                    <th style={{ textAlign: 'right' }}>Live Brief</th>
                  </tr>
                </thead>
                <tbody>
                  {liveCohortReports.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.prospect_brand_name}</strong>
                        <div
                          className="vs-mono"
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--vs-ink-muted)',
                          }}
                        >
                          {r.prospect_domain}
                        </div>
                      </td>
                      <td className="vs-mono" style={{ whiteSpace: 'nowrap' }}>
                        <strong>{r.visibility_score}</strong> / 100
                      </td>
                      <td
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--vs-ink-secondary)',
                          maxWidth: '240px',
                        }}
                      >
                        {r.summary_payload.competitors_winning.length > 0
                          ? r.summary_payload.competitors_winning
                              .slice(0, 3)
                              .join(' · ')
                          : 'Category directories'}
                      </td>
                      <td
                        style={{
                          fontSize: '13px',
                          color: 'var(--vs-ink-secondary)',
                        }}
                      >
                        {r.summary_payload.top_gaps[0] ??
                          'Missing /agents.md and structured JSON-LD entity specs.'}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Link
                          href={`/audit/${r.share_slug}`}
                          className="vs-mono"
                          style={{
                            fontSize: '12px',
                            color: 'var(--vs-ink)',
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px',
                          }}
                        >
                          /audit/{r.share_slug} →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

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
            title="Sample Exported Cold-Outreach Note (Mosaic Coffee Roasters)"
            plainSummary="Generated automatically alongside every single or batch client audit."
            fileHint="Exported in 1 click via ↓ Export CSV or ↓ Playbook (.md) in Tab 3"
            code={sampleOutreach.content}
            qualityScore={sampleOutreach.score}
            qualityBreakdown={sampleOutreach.breakdown}
          />
        </section>
      </div>
    </div>
  );
}
