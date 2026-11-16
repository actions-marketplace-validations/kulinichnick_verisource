import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  CompetitorXrayError,
  normalizePublicDomain,
  runCompetitorTechnicalXray,
  type CompetitorTechnicalXrayReport,
  type DomainRow,
} from '@verisource/core-geo';
import {
  getGraderCacheMap,
  getLocalMockStore,
  getVerifyFixesIpMap,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export const maxDuration = 30;

const XrayBodySchema = z.object({
  domain_id: z.string().min(8).max(80),
  rival_domain: z.string().min(3).max(256),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to run Competitor Technical X-Ray.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a 7-day free trial, $19 Audit Pass, or Console plan to benchmark competitor domains.',
        },
        { status: 402 }
      );
    }

    const ip =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      '127.0.0.1';
    const hourBucket = `xray:${new Date().toISOString().slice(0, 13)}`;
    const ipMap = getVerifyFixesIpMap();
    const existingRate = ipMap.get(`${ip}:${hourBucket}`);
    const used = existingRate ? existingRate.count : 0;
    if (used >= 25) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'Hourly competitor X-Ray limit reached (25/hr). Try again shortly.',
        },
        { status: 429 }
      );
    }
    ipMap.set(`${ip}:${hourBucket}`, { hourBucket, count: used + 1 });

    const rawBody = await request.json().catch(() => null);
    const parsed = XrayBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST_BODY',
          message: 'Provide a valid domain_id and rival_domain (e.g. rival.com).',
        },
        { status: 400 }
      );
    }

    const { domain_id: domainId, rival_domain: rivalDomainInput } = parsed.data;

    let domain: DomainRow | undefined;
    if (access.supabase) {
      const { data: domData } = await access.supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', access.profile.id)
        .maybeSingle();
      domain = domData ?? undefined;
    } else {
      const store = getLocalMockStore();
      domain = store.domains.find((d) => d.id === domainId);
    }

    if (!domain) {
      return NextResponse.json(
        {
          error: 'DOMAIN_NOT_FOUND',
          message: 'Domain not found in your workspace.',
        },
        { status: 404 }
      );
    }

    try {
      let cleanRivalHost: string;
      try {
        cleanRivalHost = normalizePublicDomain(rivalDomainInput).hostname;
      } catch (normErr) {
        return NextResponse.json(
          {
            error: 'INVALID_RIVAL_DOMAIN',
            message:
              normErr instanceof Error
                ? normErr.message
                : 'Enter a valid public competitor domain (e.g. rival.com).',
          },
          { status: 400 }
        );
      }
      const cacheKey = `xray:${domain.id}:${cleanRivalHost}`;
      const cacheMap = getGraderCacheMap();
      const cached = cacheMap.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return NextResponse.json(
          {
            xray: cached.data as CompetitorTechnicalXrayReport,
            cached: true,
          },
          { status: 200 }
        );
      }

      const xray = await runCompetitorTechnicalXray({
        ownDomain: domain,
        rivalDomainInput,
      });

      cacheMap.set(cacheKey, {
        expiresAt: Date.now() + 60 * 60 * 1000,
        data: xray,
      });

      return NextResponse.json({ xray, cached: false }, { status: 200 });
    } catch (err) {
      if (err instanceof CompetitorXrayError) {
        return NextResponse.json(
          {
            error: err.code,
            message: err.message,
          },
          { status: 400 }
        );
      }
      throw err;
    }
  } catch {
    return NextResponse.json(
      {
        error: 'COMPETITOR_XRAY_FAILED',
        message: 'Unable to complete live Competitor Technical X-Ray.',
      },
      { status: 500 }
    );
  }
}
