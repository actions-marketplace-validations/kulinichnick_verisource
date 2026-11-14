import { ImageResponse } from 'next/og';
import { fetchPublicPitchBySlug } from '../../../lib/data-store';

export const runtime = 'nodejs';
export const alt = 'Confidential AI Search & Hallucination Audit';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function PitchOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ImageResponse> {
  const { slug } = await params;
  const report = await fetchPublicPitchBySlug(slug);

  const agencyName = report?.agency_brand_name || 'Partner GEO Advisory';
  const brandColor = /^#[0-9A-Fa-f]{6}$/.test(
    report?.agency_primary_color ?? ''
  )
    ? report!.agency_primary_color!
    : '#0A0E17';

  const prospectBrand = report?.prospect_brand_name ?? 'Prospect Domain';
  const prospectDomain = report?.prospect_domain ?? 'https://verisource.dev';
  const visibilityScore = report?.visibility_score ?? 0;
  const hallucinationCount = report?.hallucination_count ?? 0;
  const competitorCount =
    report?.summary_payload.competitors_winning.length ?? 0;

  const scoreDanger = visibilityScore < 50;
  const hallucinationDanger = hallucinationCount > 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FAF9F6',
          borderTop: `12px solid ${brandColor}`,
          padding: '48px 60px 52px 60px',
          color: '#0A0E17',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top White-Label Agency Bar (Zero Verisource Brand Leak) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#475569',
            }}
          >
            {`PREPARED BY ${agencyName.toUpperCase()} · CONFIDENTIAL AI RETRIEVAL BRIEF`}
          </div>

          <div
            style={{
              display: 'flex',
              padding: '7px 14px',
              borderRadius: '5px',
              backgroundColor: hallucinationDanger ? '#FEF2F2' : '#ECFDF5',
              border: `1px solid ${hallucinationDanger ? '#FECACA' : '#A7F3D0'}`,
              color: hallucinationDanger ? '#991B1B' : '#065F46',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            {hallucinationDanger
              ? `${hallucinationCount} ACTIVE HALLUCINATION(S) FLAGGED`
              : 'CLAIMS VERIFIED'}
          </div>
        </div>

        {/* Prospect Title Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              fontSize: '52px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.12,
            }}
          >
            {`AI Search & Hallucination Audit: ${prospectBrand}`}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '22px',
              color: '#475569',
            }}
          >
            {`Target Domain: ${prospectDomain} · ChatGPT, Google Gemini & Perplexity Retrieval Scan`}
          </div>
        </div>

        {/* 3-Metric Executive Scorecard */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '24px 28px',
              borderRight: '1px solid #E2E8F0',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.05em',
              }}
            >
              AI VISIBILITY SCORE
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span
                style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  color: scoreDanger ? '#991B1B' : '#065F46',
                }}
              >
                {String(visibilityScore)}
              </span>
              <span style={{ fontSize: '22px', color: '#64748B' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '15px', color: '#475569' }}>
              Share-of-Voice across 3 answer engines
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '24px 28px',
              borderRight: '1px solid #E2E8F0',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.05em',
              }}
            >
              ACTIVE HALLUCINATIONS
            </span>
            <span
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: hallucinationDanger ? '#991B1B' : '#065F46',
              }}
            >
              {String(hallucinationCount)}
            </span>
            <span style={{ fontSize: '15px', color: '#475569' }}>
              Pricing, radius, or SKU policy conflicts
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '24px 28px',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.05em',
              }}
            >
              COMPETITORS WINNING SHARE
            </span>
            <span
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: '#0F172A',
              }}
            >
              {String(competitorCount)}
            </span>
            <span style={{ fontSize: '15px', color: '#475569' }}>
              Rival domains cited in commercial fanouts
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
