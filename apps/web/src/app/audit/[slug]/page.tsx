import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';
import { fetchPublicPitchBySlug } from '../../../lib/data-store';

export const dynamic = 'force-dynamic';

export default async function AgencyPitchReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const report = await fetchPublicPitchBySlug(slug);

  if (!report) {
    notFound();
  }

  const agencyName = report.agency_brand_name || 'Partner GEO Advisory';
  const brandColor = /^#[0-9A-Fa-f]{6}$/.test(report.agency_primary_color ?? '')
    ? report.agency_primary_color!
    : '#0F172A';
  const rawCta = report.agency_cta_url?.trim() ?? '';
  const ctaUrl = /^https?:\/\//i.test(rawCta) ? rawCta : '/pricing';
  const rawLogo = report.agency_logo_url?.trim() ?? '';
  const logoUrl = /^https?:\/\//i.test(rawLogo) ? rawLogo : null;

  return (
    <div className="vs-container" style={{ paddingTop: '36px', maxWidth: '920px' }}>
      {/* White-Label Agency Header Banner */}
      <div
        className="vs-card"
        style={{
          padding: '20px 24px',
          marginBottom: '20px',
          borderTop: `4px solid ${brandColor}`,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          {logoUrl ? (
            <div style={{ marginBottom: '8px' }}>
              <img
                src={logoUrl}
                alt={`${agencyName} logo`}
                style={{
                  maxHeight: '30px',
                  maxWidth: '180px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          ) : null}
          <div
            className="vs-mono"
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--vs-ink-muted)',
              marginBottom: '4px',
            }}
          >
            PREPARED BY {agencyName.toUpperCase()} · CONFIDENTIAL AI RETRIEVAL BRIEF
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '-0.02em' }}>
            AI Search &amp; Hallucination Audit: {report.prospect_brand_name}
          </h1>
          <div
            className="vs-mono"
            style={{
              fontSize: '12.5px',
              color: 'var(--vs-ink-muted)',
              marginTop: '4px',
            }}
          >
            Target Domain: {report.prospect_domain} · Views: {report.views_count}
          </div>
        </div>

        <a
          href={ctaUrl}
          target={ctaUrl.startsWith('http') ? '_blank' : undefined}
          rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="vs-btn"
          style={{ background: brandColor, borderColor: brandColor }}
        >
          Book 15-Min Fix Review with {agencyName} →
        </a>
      </div>

      {/* Top Executive Score Strip */}
      <div
        className="vs-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          marginBottom: '20px',
        }}
      >
        <div style={{ borderRight: '1px solid var(--vs-border)' }}>
          <MetricLedgerCell
            label="AI Visibility Score"
            value={report.visibility_score}
            suffix="/ 100"
            tone={report.visibility_score < 50 ? 'critical' : 'pass'}
            sublabel="Across ChatGPT, Gemini & Perplexity"
          />
        </div>
        <div style={{ borderRight: '1px solid var(--vs-border)' }}>
          <MetricLedgerCell
            label="Active Hallucinations"
            value={report.hallucination_count}
            tone={report.hallucination_count > 0 ? 'critical' : 'pass'}
            sublabel={
              report.hallucination_count > 0
                ? 'Inaccurate pricing or policy claims live'
                : 'No factual discrepancies flagged'
            }
          />
        </div>
        <div>
          <MetricLedgerCell
            label="Competitors Winning Share"
            value={report.summary_payload.competitors_winning.length}
            sublabel={
              report.summary_payload.competitors_winning.slice(0, 2).join(', ') ||
              'Category directories'
            }
          />
        </div>
      </div>

      {/* Hallucination Evidence Alert */}
      {report.summary_payload.hallucination_examples.length > 0 ? (
        <div className="vs-card" style={{ marginBottom: '20px', overflow: 'hidden' }}>
          <div
            style={{
              padding: '12px 18px',
              background: 'var(--vs-crit-bg)',
              borderBottom: '1px solid var(--vs-crit-border)',
              color: 'var(--vs-crit-fg)',
              fontWeight: 600,
              fontSize: '13.5px',
            }}
          >
            Flagged AI Hallucinations Affecting Buyer Trust
          </div>
          <table className="vs-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>What AI Engines Currently Tell Buyers</th>
                <th>Verified Storefront Truth</th>
              </tr>
            </thead>
            <tbody>
              {report.summary_payload.hallucination_examples.map((h, i) => (
                <tr key={i}>
                  <td>
                    <StatusBadge tone="critical">
                      {h.severity.toUpperCase()} · {h.category.toUpperCase()}
                    </StatusBadge>
                  </td>
                  <td style={{ fontWeight: 500 }}>&ldquo;{h.claim_text}&rdquo;</td>
                  <td style={{ color: 'var(--vs-ink-secondary)' }}>
                    {h.verified_truth}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Technical Gaps & Remediation Plan */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        <div className="vs-card" style={{ padding: '20px' }}>
          <div
            className="vs-mono"
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              color: 'var(--vs-ink-muted)',
              marginBottom: '10px',
            }}
          >
            DIAGNOSED RETRIEVAL GAPS
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px' }}>
            {report.summary_payload.top_gaps.map((gap, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>
                {gap}
              </li>
            ))}
          </ul>
        </div>

        <div className="vs-card" style={{ padding: '20px' }}>
          <div
            className="vs-mono"
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              color: 'var(--vs-ink-muted)',
              marginBottom: '10px',
            }}
          >
            RECOMMENDED ENGINEERING FIXES
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px' }}>
            {report.summary_payload.recommended_fixes.map((fix, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>
                {fix}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Conversion Strip */}
      <div
        className="vs-card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          background: 'var(--vs-surface-subtle)',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>
            Ready to deploy verified schema, /agents.md, and citation fixes for{' '}
            {report.prospect_brand_name}?
          </div>
          <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
            {agencyName} has already generated the implementation bundle for this domain.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href={ctaUrl}
            target={ctaUrl.startsWith('http') ? '_blank' : undefined}
            rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="vs-btn"
            style={{ background: brandColor, borderColor: brandColor }}
          >
            Schedule Implementation Call
          </a>
          <Link href="/" className="vs-btn vs-btn-secondary">
            Run Another Domain Scan
          </Link>
        </div>
      </div>
    </div>
  );
}
