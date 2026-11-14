import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';
import { fetchPublicPitchBySlug } from '../../../lib/data-store';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = await fetchPublicPitchBySlug(slug);

  if (!report) {
    return {
      title: 'Audit Report Not Found',
      robots: { index: false, follow: false },
    };
  }

  const agencyName = report.agency_brand_name || 'Partner GEO Advisory';
  const title = `AI Search & Hallucination Audit: ${report.prospect_brand_name} | ${agencyName}`;
  const description = `AI Visibility Score: ${report.visibility_score}/100 · Active Hallucinations: ${report.hallucination_count}. Confidential retrieval & schema audit prepared by ${agencyName}.`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      siteName: agencyName,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

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
    : '#0A0E17';
  const rawCta = report.agency_cta_url?.trim() ?? '';
  const ctaUrl = /^https?:\/\//i.test(rawCta) ? rawCta : '/pricing';
  const rawLogo = report.agency_logo_url?.trim() ?? '';
  const logoUrl = /^https?:\/\//i.test(rawLogo) ? rawLogo : null;

  return (
    <div className="vs-container" style={{ paddingTop: '36px', maxWidth: '940px' }}>
      {/* White-Label Agency Header Banner */}
      <div
        className="vs-card"
        style={{
          padding: '22px 24px',
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
            <div style={{ marginBottom: '10px' }}>
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
          <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
            PREPARED BY {agencyName.toUpperCase()} · EXECUTIVE AI SEARCH BRIEF
          </div>
          <h1 style={{ margin: 0, fontSize: '25px', letterSpacing: '-0.025em' }}>
            AI Search &amp; Hallucination Audit: {report.prospect_brand_name}
          </h1>
          <div
            className="vs-mono"
            style={{
              fontSize: '12.5px',
              color: 'var(--vs-ink-muted)',
              marginTop: '5px',
            }}
          >
            Website: {report.prospect_domain} · Views: {report.views_count}
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

      {/* Plain-English Executive Context Strip */}
      <div className="vs-guided-banner" style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: '2px' }}>
          How to read this 60-second audit
        </div>
        <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
          We tested how ChatGPT, Google Gemini, and Perplexity answer buyer
          questions in your category, checked whether your website gives AI bots
          verified pricing facts, and listed the exact fixes ready to publish.
        </div>
      </div>

      {/* Top Executive Score Strip */}
      <div
        className="vs-card vs-ledger-strip-3"
        style={{ marginBottom: '20px' }}
      >
        <div>
          <MetricLedgerCell
            label="AI Visibility Score"
            value={report.visibility_score}
            suffix="/ 100"
            tone={report.visibility_score < 50 ? 'critical' : 'pass'}
            sublabel="Across ChatGPT, Gemini & Perplexity"
          />
        </div>
        <div>
          <MetricLedgerCell
            label="Wrong AI Claims Found"
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
            label="Competitors Recommended"
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
        <div className="vs-card vs-table-wrap" style={{ marginBottom: '20px' }}>
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
            Flagged AI Mistakes Affecting Buyer Trust
          </div>
          <table className="vs-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>What AI Engines Currently Tell Buyers</th>
                <th>Your Verified Website Truth</th>
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
      <div className="vs-grid-2" style={{ marginBottom: '24px' }}>
        <div className="vs-card" style={{ padding: '20px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '10px' }}>
            WHAT IS HOLDING YOUR SCORE BACK
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
          <div className="vs-eyebrow" style={{ marginBottom: '10px' }}>
            READY-TO-PUBLISH WEBSITE FIXES
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
          background: 'var(--vs-surface-warm)',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>
            Want these verified website fixes published for{' '}
            {report.prospect_brand_name}?
          </div>
          <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
            {agencyName} has already prepared the copy-paste implementation
            package for your site.
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
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
            Scan Another Website
          </Link>
        </div>
      </div>
    </div>
  );
}
