import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import {
  matchesPublicHostname,
  normalizePublicDomain,
  PATIENT_ZERO_DOMAINS,
  runDomainReadinessScan,
} from '@verisource/core-geo';
import { findPublishedScorecardByDomain } from '../../../../lib/published-reports';

const MAX_CACHE = 400;
const CACHE_TTL_MS = 60 * 60 * 1000;
const ogScoreCache = new Map<
  string,
  { brandName: string; platformLabel: string; score: number; expiresAt: number }
>();

function evictOldestIfFull<K, V>(map: Map<K, V>, max: number): void {
  if (map.size < max) return;
  const k = map.keys().next().value;
  if (k !== undefined) map.delete(k);
}

function scoreColor(score: number): string {
  if (score >= 75) return '#6EE7B7';
  if (score >= 50) return '#E5A93C';
  return '#FCA5A5';
}

async function resolveFastDomainOgMeta(cleanHost: string): Promise<{
  hostname: string;
  brandName: string;
  platformLabel: string;
  score: number;
}> {
  if (cleanHost === 'verisource.dev') {
    return {
      hostname: 'verisource.dev',
      brandName: 'Verisource',
      platformLabel: 'Custom Code / Next.js',
      score: 96,
    };
  }

  const published = findPublishedScorecardByDomain(cleanHost);
  if (published) {
    return {
      hostname: published.domain,
      brandName: published.brandName,
      platformLabel: published.detectedPlatformLabel,
      score: published.readinessScore,
    };
  }

  const fixture = PATIENT_ZERO_DOMAINS.find((d) =>
    matchesPublicHostname(d.domain_url, cleanHost)
  );
  if (fixture) {
    return {
      hostname: cleanHost,
      brandName: fixture.brand_name,
      platformLabel: fixture.is_shopify ? 'Shopify' : 'Custom Code / Next.js',
      score: fixture.visibility_score,
    };
  }

  const now = Date.now();
  const cached = ogScoreCache.get(cleanHost);
  if (cached && now < cached.expiresAt) {
    return {
      hostname: cleanHost,
      brandName: cached.brandName,
      platformLabel: cached.platformLabel,
      score: cached.score,
    };
  }

  try {
    const live = await Promise.race([
      runDomainReadinessScan(cleanHost),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OG_TIMEOUT')), 2500)
      ),
    ]);
    const entry = {
      brandName: live.brandName,
      platformLabel: live.detectedPlatformLabel ?? 'Public Web',
      score: live.visibilityScore,
      expiresAt: now + CACHE_TTL_MS,
    };
    evictOldestIfFull(ogScoreCache, MAX_CACHE);
    ogScoreCache.set(cleanHost, entry);
    return {
      hostname: cleanHost,
      brandName: entry.brandName,
      platformLabel: entry.platformLabel,
      score: entry.score,
    };
  } catch {
    const inferred =
      cleanHost.split('.')[0]!.charAt(0).toUpperCase() +
      cleanHost.split('.')[0]!.slice(1);
    return {
      hostname: cleanHost,
      brandName: inferred,
      platformLabel: 'Public Web',
      score: 60,
    };
  }
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const rawA = (url.searchParams.get('a') ?? '').trim();
  const rawB = (url.searchParams.get('b') ?? '').trim();

  // Generic /vs card when no matchup query params are supplied
  if (!rawA || !rawB) {
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
            padding: '52px 60px',
            color: '#EEF1F6',
            fontFamily: 'sans-serif',
          }}
        >
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
              <span style={{ fontSize: '23px', fontWeight: 700 }}>
                verisource
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                padding: '8px 14px',
                backgroundColor: '#171C26',
                border: '1px solid #364156',
                borderRadius: '7px',
                fontSize: '15px',
                color: '#E5A93C',
                fontWeight: 700,
              }}
            >
              verisource.dev/vs
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '52px', fontWeight: 700, lineHeight: 1.08 }}>
              Compare any two domains head-to-head for AI search.
            </span>
            <span style={{ fontSize: '22px', color: '#B4BCC9' }}>
              6-dimension live HTTP diff: GPTBot &amp; PerplexityBot WAF, SSR
              tokens, JSON-LD @graph, /llms.txt, and /agents.md.
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              padding: '18px 24px',
              backgroundColor: '#171C26',
              border: '1px solid #262E3D',
              borderRadius: '10px',
              fontSize: '16px',
              color: '#E5A93C',
              fontWeight: 700,
            }}
          >
            ZERO SIGNUP REQUIRED · SHAREABLE MATCHUP LINKS · 1-CLICK OVERTAKE PROMPTS
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control':
            'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  }

  let cleanA = '';
  let cleanB = '';
  try {
    cleanA = normalizePublicDomain(rawA).hostname;
    cleanB = normalizePublicDomain(rawB).hostname;
  } catch (err) {
    return NextResponse.json(
      {
        error: 'INVALID_OR_BLOCKED_DOMAIN',
        message:
          err instanceof Error
            ? err.message
            : 'Provide two valid public domains.',
      },
      { status: 400 }
    );
  }

  const [metaA, metaB] = await Promise.all([
    resolveFastDomainOgMeta(cleanA),
    resolveFastDomainOgMeta(cleanB),
  ]);

  const aLeads = metaA.score > metaB.score;
  const bLeads = metaB.score > metaA.score;

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
          padding: '46px 54px',
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
            <span style={{ fontSize: '23px', fontWeight: 700 }}>verisource</span>
          </div>

          <div
            style={{
              display: 'flex',
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
            HEAD-TO-HEAD AI SEARCH X-RAY · VERISOURCE.DEV/VS
          </div>
        </div>

        {/* Side-by-Side Rivalry Cards */}
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            width: '100%',
            gap: '22px',
          }}
        >
          {/* Card A */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flex: 1,
              padding: '28px 30px',
              backgroundColor: '#131720',
              border: aLeads ? '2px solid #10B981' : '2px solid #262E3D',
              borderRadius: '14px',
              gap: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{ fontSize: '14px', color: '#848E9F', fontWeight: 700 }}
              >
                {metaA.platformLabel.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: aLeads ? '#6EE7B7' : bLeads ? '#E5A93C' : '#B4BCC9',
                }}
              >
                {aLeads
                  ? `LEADING (+${metaA.score - metaB.score})`
                  : bLeads
                    ? 'TRAILING'
                    : 'TIED'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '30px', fontWeight: 700, color: '#EEF1F6' }}>
                {metaA.brandName}
              </span>
              <span style={{ fontSize: '17px', color: '#B4BCC9' }}>
                {metaA.hostname}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                style={{
                  fontSize: '64px',
                  fontWeight: 700,
                  color: scoreColor(metaA.score),
                  lineHeight: 1,
                }}
              >
                {`${metaA.score}`}
              </span>
              <span style={{ fontSize: '24px', color: '#848E9F', fontWeight: 600 }}>
                /100
              </span>
            </div>
          </div>

          {/* Center VS Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '28px',
                backgroundColor: '#E5A93C',
                color: '#161004',
                fontSize: '18px',
                fontWeight: 800,
              }}
            >
              VS
            </div>
          </div>

          {/* Card B */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flex: 1,
              padding: '28px 30px',
              backgroundColor: '#131720',
              border: bLeads ? '2px solid #10B981' : '2px solid #262E3D',
              borderRadius: '14px',
              gap: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{ fontSize: '14px', color: '#848E9F', fontWeight: 700 }}
              >
                {metaB.platformLabel.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: bLeads ? '#6EE7B7' : aLeads ? '#E5A93C' : '#B4BCC9',
                }}
              >
                {bLeads
                  ? `LEADING (+${metaB.score - metaA.score})`
                  : aLeads
                    ? 'TRAILING'
                    : 'TIED'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '30px', fontWeight: 700, color: '#EEF1F6' }}>
                {metaB.brandName}
              </span>
              <span style={{ fontSize: '17px', color: '#B4BCC9' }}>
                {metaB.hostname}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                style={{
                  fontSize: '64px',
                  fontWeight: 700,
                  color: scoreColor(metaB.score),
                  lineHeight: 1,
                }}
              >
                {`${metaB.score}`}
              </span>
              <span style={{ fontSize: '24px', color: '#848E9F', fontWeight: 600 }}>
                /100
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Protocol Strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: '16px 24px',
            backgroundColor: '#171C26',
            border: '1px solid #262E3D',
            borderRadius: '10px',
            fontSize: '15px',
            color: '#B4BCC9',
          }}
        >
          <span>
            GPTBot &amp; PerplexityBot WAF · Non-JS SSR Signal · JSON-LD @graph ·
            /llms.txt · /agents.md
          </span>
          <span style={{ color: '#E5A93C', fontWeight: 700 }}>
            {`verisource.dev/vs?a=${metaA.hostname}&b=${metaB.hostname}`}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control':
          'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
