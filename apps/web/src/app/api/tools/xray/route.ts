import { NextResponse } from 'next/server';
import {
  CompetitorXrayError,
  normalizePublicDomain,
  runPublicDomainHeadToHeadXray,
  type PublicHeadToHeadXrayReport,
} from '@verisource/core-geo';

export const maxDuration = 30;

const MAX_MAP_SIZE = 500;
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_UNCACHED_PER_IP_DAY = 15;

const xrayCache = new Map<
  string,
  { expiresAt: number; report: PublicHeadToHeadXrayReport }
>();
const ipDailyBuckets = new Map<string, { day: string; count: number }>();

function evictOldestIfFull<K, V>(map: Map<K, V>, max: number): void {
  if (map.size < max) return;
  const firstKey = map.keys().next().value;
  if (firstKey !== undefined) {
    map.delete(firstKey);
  }
}

function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      domainA?: string;
      domainB?: string;
    };

    if (
      !body.domainA ||
      typeof body.domainA !== 'string' ||
      !body.domainB ||
      typeof body.domainB !== 'string'
    ) {
      return NextResponse.json(
        {
          error: 'INVALID_DOMAIN',
          message:
            'Provide two public website domains to compare (e.g. yourcompany.com and rival.com).',
        },
        { status: 400 }
      );
    }

    let normA: ReturnType<typeof normalizePublicDomain>;
    let normB: ReturnType<typeof normalizePublicDomain>;
    try {
      normA = normalizePublicDomain(body.domainA);
      normB = normalizePublicDomain(body.domainB);
    } catch (err) {
      return NextResponse.json(
        {
          error: 'INVALID_DOMAIN',
          message:
            err instanceof Error
              ? err.message
              : 'Provide valid public website domains.',
        },
        { status: 400 }
      );
    }

    if (normA.hostname === normB.hostname) {
      return NextResponse.json(
        {
          error: 'SAME_DOMAIN_ERROR',
          message: `Choose a second distinct domain rather than comparing ${normA.hostname} against itself.`,
        },
        { status: 400 }
      );
    }

    const cacheKey = `${normA.hostname}::${normB.hostname}`;
    const cached = xrayCache.get(cacheKey);
    const shareUrl = `https://verisource.dev/vs?a=${encodeURIComponent(
      normA.hostname
    )}&b=${encodeURIComponent(normB.hostname)}`;

    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        ok: true,
        report: cached.report,
        shareUrl,
        cached1h: true,
      });
    }

    const ip = getClientIp(request);
    const utcDay = new Date().toISOString().slice(0, 10);
    const bucket = ipDailyBuckets.get(ip);
    if (!bucket || bucket.day !== utcDay) {
      evictOldestIfFull(ipDailyBuckets, MAX_MAP_SIZE);
      ipDailyBuckets.set(ip, { day: utcDay, count: 1 });
    } else if (bucket.count >= MAX_UNCACHED_PER_IP_DAY) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message:
            'Daily free head-to-head live scan cap reached for this IP. Sign in to Console Step 01 for unlimited Competitor X-Ray comparisons.',
        },
        { status: 429 }
      );
    } else {
      bucket.count += 1;
    }

    const report = await runPublicDomainHeadToHeadXray({
      domainAInput: normA.origin,
      domainBInput: normB.origin,
    });

    evictOldestIfFull(xrayCache, MAX_MAP_SIZE);
    xrayCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      report,
    });

    return NextResponse.json({
      ok: true,
      report,
      shareUrl,
      cached1h: false,
    });
  } catch (err) {
    if (err instanceof CompetitorXrayError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: 'XRAY_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to complete head-to-head HTTP probe.',
      },
      { status: 500 }
    );
  }
}
