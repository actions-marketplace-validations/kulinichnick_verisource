import { NextResponse } from 'next/server';
import {
  matchesPublicHostname,
  normalizePublicDomain,
  PATIENT_ZERO_DOMAINS,
  runDomainReadinessScan,
  type ReadinessScanSummary,
} from '@verisource/core-geo';
import { getGraderCacheMap, getGraderIpMap } from '../../../lib/data-store';

export const maxDuration = 60;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      domain?: string;
      forceRefresh?: boolean;
    };
    if (!body.domain || typeof body.domain !== 'string') {
      return NextResponse.json(
        {
          error: 'INVALID_DOMAIN',
          message: 'Enter a valid public domain (e.g. yourcompany.com).',
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const normalized = normalizePublicDomain(body.domain);
    const cacheMap = getGraderCacheMap();
    const cached = cacheMap.get(normalized.hostname);

    if (!body.forceRefresh && cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(
        {
          ...(cached.data as ReadinessScanSummary),
          cached24h: true,
        },
        { headers: CORS_HEADERS }
      );
    }

    const isPatientZeroSample = PATIENT_ZERO_DOMAINS.some((d) =>
      matchesPublicHostname(d.domain_url, normalized.hostname)
    );

    // Rate-limit custom unauthenticated scans to 5/IP/day (and cap forceRefresh cache-busts at 15/IP/day even on sample domains)
    if (!isPatientZeroSample || Boolean(body.forceRefresh)) {
      const ip =
        request.headers.get('cf-connecting-ip') ??
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        '127.0.0.1';
      const today = new Date().toISOString().slice(0, 10);
      const ipMap = getGraderIpMap();
      const bucketKey = isPatientZeroSample ? `refresh:${ip}` : ip;
      const dailyLimit = isPatientZeroSample ? 15 : 5;
      const entry = ipMap.get(bucketKey);
      const used = entry && entry.day === today ? entry.count : 0;

      if (used >= dailyLimit) {
        return NextResponse.json(
          {
            error: 'FREE_SCAN_LIMIT_REACHED',
            message:
              'Daily unauthenticated scan limit reached. Activate a full domain audit + all 1-click fixes for $19 (credited toward any monthly plan within 7 days).',
          },
          { status: 429, headers: CORS_HEADERS }
        );
      }
      ipMap.set(bucketKey, { day: today, count: used + 1 });
    }

    const summary = await runDomainReadinessScan(normalized.origin);
    cacheMap.set(normalized.hostname, {
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      data: summary,
    });

    return NextResponse.json(
      { ...summary, cached24h: false },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unable to scan domain readiness.';
    return NextResponse.json(
      { error: 'SCAN_FAILED', message },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
