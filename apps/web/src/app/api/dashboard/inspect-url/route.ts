import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SubPageInspectionError,
  inspectSubPageForAiCrawlers,
  type DomainRow,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  getVerifyFixesIpMap,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export const maxDuration = 30;

const InspectUrlBodySchema = z.object({
  domain_id: z.string().min(8).max(80),
  target_path_or_url: z.string().min(1).max(512),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to inspect sub-page bot extraction.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a 7-day free trial, $19 Audit Pass, or Console plan to inspect sub-page bot extraction.',
        },
        { status: 402 }
      );
    }

    const ip =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      '127.0.0.1';
    const hourBucket = `inspect:${new Date().toISOString().slice(0, 13)}`;
    const ipMap = getVerifyFixesIpMap();
    const existingRate = ipMap.get(`${ip}:${hourBucket}`);
    const used = existingRate ? existingRate.count : 0;
    if (used >= 30) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'Hourly sub-page bot inspection limit reached (30/hr). Try again shortly.',
        },
        { status: 429 }
      );
    }
    ipMap.set(`${ip}:${hourBucket}`, { hourBucket, count: used + 1 });

    const rawBody = await request.json().catch(() => null);
    const parsed = InspectUrlBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST_BODY',
          message: 'Provide a valid domain_id and target_path_or_url (e.g. /pricing).',
        },
        { status: 400 }
      );
    }

    const { domain_id: domainId, target_path_or_url: targetPathOrUrl } =
      parsed.data;

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
      const inspection = await inspectSubPageForAiCrawlers({
        trackedDomainUrl: domain.domain_url,
        targetPathOrUrl,
        brandName: domain.brand_name,
        brandTruthSheet: domain.brand_truth_sheet,
        isShopify: domain.is_shopify,
      });

      return NextResponse.json({ inspection }, { status: 200 });
    } catch (err) {
      if (err instanceof SubPageInspectionError) {
        return NextResponse.json(
          {
            error: err.code,
            message: err.message,
          },
          { status: err.code === 'CROSS_DOMAIN_BLOCKED' ? 403 : 400 }
        );
      }
      throw err;
    }
  } catch {
    return NextResponse.json(
      {
        error: 'SUBPAGE_INSPECTION_FAILED',
        message: 'Unable to complete live sub-page bot inspection.',
      },
      { status: 500 }
    );
  }
}
