import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  crawlDomainSiteHealth,
  matchesPublicHostname,
  normalizePublicDomain,
  PATIENT_ZERO_DOMAINS,
  type DomainRow,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  getVerifyFixesIpMap,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export const maxDuration = 35;

const SiteScanBodySchema = z.object({
  domain_id: z.string().min(8).max(80),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message:
            'Sign in to your Verisource Console to run a 20-page site health crawl.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a 7-day free trial, $19 Audit Pass, or Console plan to run multi-page site health scans.',
        },
        { status: 402 }
      );
    }

    const ip =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      '127.0.0.1';
    const hourBucket = `sitescan:${new Date().toISOString().slice(0, 13)}`;
    const ipMap = getVerifyFixesIpMap();
    const existingRate = ipMap.get(`${ip}:${hourBucket}`);
    const used = existingRate ? existingRate.count : 0;
    if (used >= 20) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message:
            'Hourly multi-page crawl limit reached (20/hr). Try again shortly.',
        },
        { status: 429 }
      );
    }
    ipMap.set(`${ip}:${hourBucket}`, { hourBucket, count: used + 1 });

    const rawBody = await request.json().catch(() => null);
    const parsed = SiteScanBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST_BODY',
          message: 'Provide a valid domain_id to run the 20-page crawl.',
        },
        { status: 400 }
      );
    }

    const domainId = parsed.data.domain_id;
    let domain: DomainRow | undefined;

    if (access.supabase) {
      const { data: domData } = await access.supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', access.profile.id)
        .maybeSingle();
      if (domData) {
        domain = domData as DomainRow;
      }
    } else {
      const store = getLocalMockStore();
      domain = store.domains.find(
        (d) => d.id === domainId && d.user_id === access.profile.id
      );
    }

    if (!domain) {
      return NextResponse.json(
        {
          error: 'DOMAIN_NOT_FOUND',
          message: 'Tracked domain was not found in your workspace.',
        },
        { status: 404 }
      );
    }

    const isMockMode = (process.env.PROVIDER_MODE ?? 'mock') === 'mock';
    const targetHost = normalizePublicDomain(domain.domain_url).hostname;
    const isFixture = PATIENT_ZERO_DOMAINS.some((d) =>
      matchesPublicHostname(d.domain_url, targetHost)
    );

    const report = await crawlDomainSiteHealth({
      domainInput: domain.domain_url,
      mode: 'workspace',
      skipNetwork: isMockMode && isFixture,
    });

    if (access.supabase) {
      await access.supabase
        .from('domains')
        .update({
          crawl_health_summary: report as unknown as Record<string, unknown>,
        })
        .eq('id', domain.id)
        .eq('user_id', access.profile.id);
    } else {
      domain.crawl_health_summary = report as unknown as Record<string, unknown>;
    }

    return NextResponse.json({ report });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unable to complete site crawl.';
    return NextResponse.json(
      { error: 'SITE_SCAN_FAILED', message },
      { status: 400 }
    );
  }
}
