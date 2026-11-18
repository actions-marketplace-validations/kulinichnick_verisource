import { ImageResponse } from 'next/og';
import { findPublishedScorecardByDomain } from '../../../lib/published-reports';

export const alt = 'Verisource Live Domain AI Search Readiness Scorecard';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function scoreAccentHex(score: number): string {
  if (score >= 75) return '#6EE7B7';
  if (score >= 50) return '#E5A93C';
  return '#FCA5A5';
}

function scoreTierLabel(score: number): string {
  if (score >= 75) return 'READY';
  if (score >= 50) return 'PARTIAL';
  return 'AT RISK';
}

export default async function DomainReportOpenGraphImage({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<ImageResponse> {
  const { domain } = await params;
  const scorecard = findPublishedScorecardByDomain(domain);

  const brandName = scorecard?.brandName ?? domain;
  const host = scorecard?.domain ?? domain;
  const platform = (scorecard?.detectedPlatformLabel ?? 'WEB').toUpperCase();
  const score = scorecard?.readinessScore ?? 60;
  const accent = scoreAccentHex(score);
  const tier = scoreTierLabel(score);

  const botsAllowed = scorecard
    ? scorecard.robotsAiBotStatus.GPTBot &&
      scorecard.robotsAiBotStatus['OAI-SearchBot'] &&
      scorecard.robotsAiBotStatus.PerplexityBot &&
      scorecard.robotsAiBotStatus.ClaudeBot &&
      !scorecard.robotsAiBotStatus.waf_blocked
    : true;

  const llmsLabel =
    scorecard?.llmsTxtStatus === 'present' ? 'LIVE (200)' : 'MISSING';
  const agentsLabel =
    scorecard?.agentsMdStatus === 'custom_enriched'
      ? 'CUSTOM VERIFIED'
      : scorecard?.agentsMdStatus === 'default_boilerplate'
        ? 'BOILERPLATE'
        : 'MISSING';
  const jsonLdLabel = scorecard
    ? `${scorecard.jsonLdPillarsPassed}/3 PILLARS`
    : '1/3 PILLARS';

  const gapText = (
    scorecard?.topGapSummary ??
    'Inspect GPTBot crawl rules, schema.org JSON-LD, /llms.txt, and /agents.md over HTTP.'
  ).slice(0, 125);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0E1116',
          padding: '48px 56px',
          color: '#EEF1F6',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Masthead */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#E5A93C',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20">
                <path
                  d="M10 3.2L16.8 10L10 16.8L3.2 10L10 3.2Z"
                  fill="none"
                  stroke="#161004"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: '23px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: '#EEF1F6',
              }}
            >
              verisource
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 14px',
              backgroundColor: '#171C26',
              border: '1px solid #364156',
              borderRadius: '7px',
              fontSize: '14px',
              color: '#E5A93C',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {`LIVE PROTOCOL SCORECARD · ${platform}`}
          </div>
        </div>

        {/* Center Brand + Score Split */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: '36px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxWidth: '720px',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                color: '#E5A93C',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              {host}
            </span>
            <span
              style={{
                fontSize: '50px',
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                color: '#EEF1F6',
              }}
            >
              {`${brandName} AI Search Readiness`}
            </span>
            <span
              style={{
                fontSize: '20px',
                color: '#B4BCC9',
                lineHeight: 1.4,
              }}
            >
              {`Top gap: ${gapText}`}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '290px',
              padding: '28px 30px',
              backgroundColor: '#171C26',
              border: '2px solid #262E3D',
              borderRadius: '14px',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#848E9F',
                letterSpacing: '0.06em',
              }}
            >
              {`READINESS · ${tier}`}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                style={{
                  fontSize: '68px',
                  fontWeight: 700,
                  color: accent,
                  lineHeight: 1,
                }}
              >
                {`${score}`}
              </span>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 600,
                  color: '#848E9F',
                }}
              >
                /100
              </span>
            </div>
            <span style={{ fontSize: '14px', color: '#B4BCC9' }}>
              {`verisource.dev/report/${host}`}
            </span>
          </div>
        </div>

        {/* Bottom 4-Check Strip */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            backgroundColor: '#171C26',
            border: '1px solid #262E3D',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '18px 22px',
              borderRight: '1px solid #262E3D',
              gap: '5px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#848E9F' }}>
              01 · AI CRAWLER WAF
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: botsAllowed ? '#6EE7B7' : '#FCA5A5',
              }}
            >
              {botsAllowed ? 'ALLOWED (HTTP 200)' : 'RESTRICTED / 403'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '18px 22px',
              borderRight: '1px solid #262E3D',
              gap: '5px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#848E9F' }}>
              02 · /LLMS.TXT
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: llmsLabel === 'LIVE (200)' ? '#6EE7B7' : '#E5A93C',
              }}
            >
              {llmsLabel}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '18px 22px',
              borderRight: '1px solid #262E3D',
              gap: '5px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#848E9F' }}>
              03 · /AGENTS.MD
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color:
                  agentsLabel === 'CUSTOM VERIFIED' ? '#6EE7B7' : '#E5A93C',
              }}
            >
              {agentsLabel}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '18px 22px',
              gap: '5px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#848E9F' }}>
              04 · JSON-LD @GRAPH
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: jsonLdLabel.startsWith('3/') ? '#6EE7B7' : '#EEF1F6',
              }}
            >
              {jsonLdLabel}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
