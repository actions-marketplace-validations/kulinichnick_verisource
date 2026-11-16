import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';
import { AuditViewTracker } from '../../../components/AuditViewTracker';
import { CopyAuditBriefButton } from '../../../components/CopyAuditBriefButton';
import { PrintAuditBriefButton } from '../../../components/PrintAuditBriefButton';
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
  const topRivals = report.summary_payload.competitors_winning
    .slice(0, 3)
    .join(', ');
  const rivalsClause = topRivals ? ` · Rivals Cited: ${topRivals}` : '';
  const description = `AI Visibility Score: ${report.visibility_score}/100${rivalsClause} · Active Hallucinations: ${report.hallucination_count}. Confidential retrieval & schema audit prepared by ${agencyName}.`;

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
  const isVerisourceDirect = /verisource/i.test(agencyName);
  const brandColor = /^#[0-9A-Fa-f]{6}$/.test(report.agency_primary_color ?? '')
    ? report.agency_primary_color!
    : '#0A0E17';
  const rawCta = report.agency_cta_url?.trim() ?? '';
  const ctaUrl = /^https?:\/\//i.test(rawCta) ? rawCta : '/pricing';
  const rawLogo = report.agency_logo_url?.trim() ?? '';
  const logoUrl = /^https?:\/\//i.test(rawLogo) ? rawLogo : null;

  return (
    <div
      className={`${isVerisourceDirect ? '' : 'vs-whitelabel-audit-root '}vs-container`}
      style={{
        paddingTop: '36px',
        paddingBottom: isVerisourceDirect ? undefined : '56px',
        maxWidth: '940px',
      }}
    >
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
          <AuditViewTracker
            slug={slug}
            domain={report.prospect_domain}
            initialViews={report.views_count}
          />
        </div>

        <div
          className="vs-no-print"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
        >
          <CopyAuditBriefButton slug={slug} />
          <PrintAuditBriefButton />
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
              report.summary_payload.competitors_winning.slice(0, 3).join(', ') ||
              'Category directories'
            }
          />
        </div>
      </div>

      {/* Rival Shortlist Strip */}
      {report.summary_payload.competitors_winning.length > 0 ? (
        <div
          className="vs-card"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div className="vs-eyebrow" style={{ marginBottom: '3px' }}>
              AI-RECOMMENDED CATEGORY ALTERNATIVES
            </div>
            <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
              ChatGPT, Google Gemini, and Perplexity cite these alternatives
              when buyers compare options in your category.
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {report.summary_payload.competitors_winning.map((rival) => (
              <StatusBadge key={rival}>{rival}</StatusBadge>
            ))}
          </div>
        </div>
      ) : null}

      {/* Enriched M44 Executive Intelligence: Sentiment + Head-to-Head Rival SoV & Categorized Sources */}
      {(report.summary_payload.head_to_head_sov?.length ?? 0) > 0 ||
      (report.summary_payload.top_citation_sources?.length ?? 0) > 0 ? (
        <div className="vs-grid-2" style={{ marginBottom: '20px' }}>
          {report.summary_payload.head_to_head_sov &&
          report.summary_payload.head_to_head_sov.length > 0 ? (
            <div className="vs-card" style={{ padding: '18px 20px' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <div className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                  HEAD-TO-HEAD RIVAL SHARE OF VOICE
                </div>
                {report.summary_payload.sentiment_framing ? (
                  <StatusBadge
                    tone={
                      report.summary_payload.sentiment_framing === 'recommended'
                        ? 'pass'
                        : report.summary_payload.sentiment_framing ===
                              'cautionary' ||
                            report.summary_payload.sentiment_framing ===
                              'invisible'
                          ? 'critical'
                          : 'warn'
                    }
                  >
                    {`FRAMING: ${report.summary_payload.sentiment_framing.toUpperCase()}${
                      report.summary_payload.sentiment_score !== undefined
                        ? ` · ${report.summary_payload.sentiment_score}/100`
                        : ''
                    }`}
                  </StatusBadge>
                ) : null}
              </div>

              {report.summary_payload.mention_rate_pct !== undefined ? (
                <div
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--vs-ink-secondary)',
                    marginBottom: '12px',
                  }}
                >
                  Mention Rate:{' '}
                  <strong className="vs-mono">
                    {`${report.summary_payload.mention_rate_pct}%`}
                  </strong>{' '}
                  · Direct Cited URL Rate:{' '}
                  <strong className="vs-mono">
                    {`${report.summary_payload.citation_rate_pct ?? 0}%`}
                  </strong>
                  {report.summary_payload.crawler_readability_status ? (
                    <>
                      {' '}
                      · HTML Readability:{' '}
                      <strong className="vs-mono">
                        {report.summary_payload.crawler_readability_status
                          .replace(/_/g, ' ')
                          .toUpperCase()}
                      </strong>
                    </>
                  ) : null}
                </div>
              ) : null}

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {report.summary_payload.head_to_head_sov.map((row) => (
                  <div key={row.entityName}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12.5px',
                        marginBottom: '3px',
                      }}
                    >
                      <span
                        style={{ fontWeight: row.isTargetBrand ? 700 : 500 }}
                      >
                        {row.entityName}
                        {row.isTargetBrand ? ' (Your Brand)' : ''}
                      </span>
                      <span className="vs-mono">
                        {`${row.shareOfVoicePct}% (${row.mentions})`}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '999px',
                        background: 'var(--vs-border)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(
                            row.shareOfVoicePct,
                            row.mentions > 0 ? 6 : 0
                          )}%`,
                          height: '100%',
                          background: row.isTargetBrand
                            ? brandColor
                            : 'var(--vs-ink-muted)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {report.summary_payload.top_citation_sources &&
          report.summary_payload.top_citation_sources.length > 0 ? (
            <div className="vs-card" style={{ padding: '18px 20px' }}>
              <div
                className="vs-eyebrow"
                style={{ color: 'var(--vs-ink)', marginBottom: '10px' }}
              >
                THIRD-PARTY SOURCES FEEDING AI ANSWERS
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {report.summary_payload.top_citation_sources.map((src) => (
                  <div
                    key={src.sourceHost}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--vs-border)',
                      background: 'var(--vs-surface-subtle)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        flexWrap: 'wrap',
                        marginBottom: '3px',
                      }}
                    >
                      <strong className="vs-mono" style={{ fontSize: '12px' }}>
                        {src.sourceHost}
                      </strong>
                      <div
                        style={{
                          display: 'inline-flex',
                          gap: '4px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <StatusBadge>{src.sourceCategoryLabel}</StatusBadge>
                        <StatusBadge
                          tone={
                            src.ownership === 'citation_gap'
                              ? 'critical'
                              : 'pass'
                          }
                        >
                          {src.ownership === 'citation_gap'
                            ? 'CITATION GAP'
                            : src.ownership === 'co_cited'
                              ? 'CO-CITED'
                              : 'OWNED'}
                        </StatusBadge>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--vs-ink-secondary)',
                      }}
                    >
                      {src.recommendedAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

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
        <div
          className="vs-no-print"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}
        >
          <a
            href={ctaUrl}
            target={ctaUrl.startsWith('http') ? '_blank' : undefined}
            rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="vs-btn"
            style={{ background: brandColor, borderColor: brandColor }}
          >
            Schedule Implementation Call
          </a>
          {isVerisourceDirect ? (
            <>
              <a
                href={`/api/checkout?plan=tripwire_19&cycle=one_time&domain=${encodeURIComponent(
                  report.prospect_domain
                )}&slug=${encodeURIComponent(slug)}`}
                className="vs-btn vs-btn-secondary"
              >
                Self-Serve Fix Pack ($19) →
              </a>
              <Link href="/#grader" className="vs-btn vs-btn-secondary">
                Scan Another Website
              </Link>
            </>
          ) : (
            <PrintAuditBriefButton />
          )}
        </div>
      </div>
    </div>
  );
}
