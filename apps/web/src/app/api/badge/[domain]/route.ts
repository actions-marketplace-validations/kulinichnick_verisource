import { NextResponse } from 'next/server';
import {
  matchesPublicHostname,
  normalizePublicDomain,
  PATIENT_ZERO_DOMAINS,
  renderReadinessBadgeSvg,
  runDomainReadinessScan,
} from '@verisource/core-geo';
import { findPublishedScorecardByDomain } from '../../../../lib/published-reports';

const MAX_CACHE_ENTRIES = 500;
const CACHE_TTL_MS = 60 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_LIVE_SCANS_PER_IP_HOUR = 8;

const liveBadgeScoreCache = new Map<
  string,
  { score: number | null; expiresAt: number }
>();
const ipLiveScanBuckets = new Map<
  string,
  { count: number; resetAt: number }
>();

function evictOldestIfFull<K, V>(map: Map<K, V>, max: number): void {
  if (map.size < max) return;
  const firstKey = map.keys().next().value;
  if (firstKey !== undefined) {
    map.delete(firstKey);
  }
}

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0]?.trim() || 'unknown';
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function allowLiveBadgeScan(ip: string): boolean {
  const now = Date.now();
  const bucket = ipLiveScanBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    evictOldestIfFull(ipLiveScanBuckets, MAX_CACHE_ENTRIES);
    ipLiveScanBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_LIVE_SCANS_PER_IP_HOUR) {
    return false;
  }
  bucket.count += 1;
  return true;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ domain: string }> }
): Promise<Response> {
  const { domain: rawDomain } = await context.params;

  let cleanHost = '';
  try {
    cleanHost = normalizePublicDomain(decodeURIComponent(rawDomain ?? '')).hostname;
  } catch (err) {
    return NextResponse.json(
      {
        error: 'INVALID_OR_BLOCKED_DOMAIN',
        message:
          err instanceof Error
            ? err.message
            : 'Provide a valid public domain hostname.',
      },
      { status: 400 }
    );
  }

  let resolvedScore: number | null = null;

  if (cleanHost === 'verisource.dev') {
    resolvedScore = 96;
  } else {
    const published = findPublishedScorecardByDomain(cleanHost);
    if (published) {
      resolvedScore = published.readinessScore;
    } else {
      const fixtureMatch = PATIENT_ZERO_DOMAINS.find((d) =>
        matchesPublicHostname(d.domain_url, cleanHost)
      );
      if (fixtureMatch) {
        resolvedScore = fixtureMatch.visibility_score;
      } else {
        const now = Date.now();
        const cached = liveBadgeScoreCache.get(cleanHost);
        if (cached && now < cached.expiresAt) {
          resolvedScore = cached.score;
        } else if (allowLiveBadgeScan(getClientIp(req))) {
          try {
            const liveSummary = await Promise.race([
              runDomainReadinessScan(cleanHost),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('BADGE_SCAN_TIMEOUT')), 4500)
              ),
            ]);
            resolvedScore = liveSummary.visibilityScore;
          } catch {
            resolvedScore = null;
          }
          evictOldestIfFull(liveBadgeScoreCache, MAX_CACHE_ENTRIES);
          liveBadgeScoreCache.set(cleanHost, {
            score: resolvedScore,
            expiresAt: now + CACHE_TTL_MS,
          });
        }
      }
    }
  }

  const svg = renderReadinessBadgeSvg({
    hostname: cleanHost,
    score: resolvedScore,
  });

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control':
        'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
