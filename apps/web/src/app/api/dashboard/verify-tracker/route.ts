import { NextResponse } from 'next/server';
import {
  verifyLiveTrackerInstallation,
  type AiAttributionEventRow,
  type DomainRow,
} from '@verisource/core-geo';
import {
  checkHourlyOutboundVerifyLimit,
  getLocalMockStore,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message:
            'Sign in to your Verisource Console to verify live AI tracker installation.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a Console plan to verify live AI visitor tracker installation.',
        },
        { status: 402 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      domain_id?: string;
    };
    const domainId = (body.domain_id ?? '').trim();
    if (!domainId) {
      return NextResponse.json(
        {
          error: 'MISSING_DOMAIN_ID',
          message: 'Provide a domain_id to verify live tracker installation.',
        },
        { status: 400 }
      );
    }

    let domain: DomainRow | undefined;
    let attributionEvents: AiAttributionEventRow[] = [];

    if (access.supabase) {
      const { data: domData } = await access.supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', access.profile.id)
        .maybeSingle();
      domain = (domData as DomainRow | null) ?? undefined;

      if (domain) {
        const { data: evData } = await access.supabase
          .from('ai_attribution_events')
          .select('*')
          .eq('domain_id', domain.id)
          .order('created_at', { ascending: false })
          .limit(100);
        attributionEvents = (evData ?? []) as AiAttributionEventRow[];
      }
    } else {
      const store = getLocalMockStore();
      domain = store.domains.find((d) => d.id === domainId);
      if (domain) {
        attributionEvents = store.attributionEvents.filter(
          (ev) => ev.domain_id === domain!.id
        );
      }
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

    if (
      !checkHourlyOutboundVerifyLimit(`verify_trk:${access.profile.id}`, 60)
    ) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message:
            'Hourly live tracker verification quota reached (60 checks/hour). Please wait a few minutes and try again.',
        },
        { status: 429 }
      );
    }

    const appOrigin = (
      process.env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev'
    ).replace(/\/+$/, '');

    const report = await verifyLiveTrackerInstallation({
      domain,
      attributionEvents,
      ingestionUrl: `${appOrigin}/api/pixel`,
    });

    return NextResponse.json({
      ok: true,
      report: {
        hostname: report.hostname,
        httpStatus: report.httpStatus,
        detectedPlatform: report.detectedPlatform,
        detectedPlatformLabel: report.detectedPlatformLabel,
        checkedAt: report.checkedAt,
        browserPixelLive: report.browserPixelLive,
        foreignTokenMismatch: report.foreignTokenMismatch,
        referralEventsCount: report.referralEventsCount,
        conversionEventsCount: report.conversionEventsCount,
        botCrawlEventsCount: report.botCrawlEventsCount,
        overallStatus: report.overallStatus,
        statusHeadline: report.statusHeadline,
        cmsTroubleshootingHint: report.cmsTroubleshootingHint,
      },
      promptScore: report.followUpInstallPrompt.score,
      promptContent: report.followUpInstallPrompt.content,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'VERIFY_TRACKER_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to verify live tracker installation.',
      },
      { status: 400 }
    );
  }
}
