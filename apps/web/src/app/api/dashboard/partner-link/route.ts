import { NextResponse } from 'next/server';
import {
  deriveWorkspacePartnerSlug,
  dispatchPartnerOnboardingEmail,
  sanitizeAffiliateCode,
  type DomainRow,
} from '@verisource/core-geo';
import {
  checkHourlyOutboundVerifyLimit,
  getLocalMockStore,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export async function POST(request: Request): Promise<NextResponse> {
  const access = await resolveConsoleRequestAccess(request);
  if (access.status === 'unauthenticated') {
    return NextResponse.json(
      {
        error: 'AUTHENTICATION_REQUIRED',
        message:
          'Sign in to your Verisource Console to activate your 25% subscriber partner link.',
      },
      { status: 401 }
    );
  }
  if (access.status === 'plan_activation_required') {
    return NextResponse.json(
      {
        error: 'PLAN_ACTIVATION_REQUIRED',
        message:
          'Activate a Console plan to register your workspace 25% partner payout link.',
      },
      { status: 402 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    slug?: string;
  };

  let primaryDomain: DomainRow | undefined;
  if (access.supabase) {
    const { data } = await access.supabase
      .from('domains')
      .select('*')
      .eq('user_id', access.profile.id)
      .order('created_at', { ascending: true })
      .limit(1);
    primaryDomain = ((data ?? []) as DomainRow[])[0];
  } else {
    primaryDomain = getLocalMockStore().domains[0];
  }

  const requestedSlug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const resolvedSlug = requestedSlug
    ? sanitizeAffiliateCode(requestedSlug)
    : deriveWorkspacePartnerSlug({
        agencyBrandName: access.profile.agency_brand_name,
        primaryBrandName: primaryDomain?.brand_name,
        primaryDomainUrl: primaryDomain?.domain_url,
        email: access.profile.email,
      });

  if (!resolvedSlug) {
    return NextResponse.json(
      {
        error: 'INVALID_PARTNER_SLUG',
        message:
          'Partner code must be 3–40 letters, numbers, hyphens, or underscores.',
      },
      { status: 400 }
    );
  }

  if (
    !checkHourlyOutboundVerifyLimit(`sub_partner:${access.profile.id}`, 10)
  ) {
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message:
          'Partner link confirmation was already sent recently. Check your inbox or wait a few minutes.',
      },
      { status: 429 }
    );
  }

  const partnerName =
    access.profile.agency_brand_name?.trim() ||
    primaryDomain?.brand_name?.trim() ||
    access.profile.email.split('@')[0] ||
    'Workspace Partner';

  const channelUrl =
    primaryDomain?.domain_url?.trim() || 'https://verisource.dev';

  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://verisource.dev';

  const dispatched = await dispatchPartnerOnboardingEmail({
    partnerName,
    partnerEmail: access.profile.email,
    partnerSlug: resolvedSlug,
    channelUrl,
    appOrigin,
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.ALERT_FROM_EMAIL,
    bccEmail: process.env.ALERT_FALLBACK_EMAIL,
  });

  return NextResponse.json({
    ok: true,
    partnerSlug: dispatched.alert.partnerSlug,
    payoutEmail: access.profile.email,
    referralShortUrl: dispatched.alert.referralShortUrl,
    benchmarkRefUrl: dispatched.alert.benchmarkRefUrl,
    toolsRefUrl: dispatched.alert.toolsRefUrl,
    mode: dispatched.mode,
    delivered: dispatched.delivered,
    qualityScore: dispatched.qualityScore,
  });
}
