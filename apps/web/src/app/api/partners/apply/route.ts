import { NextResponse } from 'next/server';
import {
  dispatchPartnerOnboardingEmail,
  normalizePublicDomain,
  sanitizeAffiliateCode,
} from '@verisource/core-geo';
import {
  checkDisposableOrBotEmail,
  isGibberishBotPartnerSubmission,
} from '../../../../lib/signup-guard';

const ipWindowMap = new Map<string, { count: number; resetAt: number }>();
const MAX_PARTNER_APPLICATIONS_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

function isSameOriginRequest(request: Request): boolean {
  const expectedHost = (
    request.headers.get('host') ?? new URL(request.url).hostname
  )
    .split(':')[0]
    ?.trim()
    .toLowerCase();
  const originHeader = request.headers.get('origin')?.trim() ?? '';
  const refererHeader = request.headers.get('referer')?.trim() ?? '';
  const candidate = originHeader || refererHeader;
  if (!candidate) return false;
  try {
    const parsedHost = new URL(candidate).hostname.toLowerCase();
    if (expectedHost && parsedHost === expectedHost) return true;
    if (
      (parsedHost === 'verisource.dev' ||
        parsedHost === 'www.verisource.dev') &&
      (expectedHost === 'verisource.dev' ||
        expectedHost === 'www.verisource.dev' ||
        Boolean(expectedHost?.endsWith('.vercel.app')))
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0]?.trim() || '127.0.0.1';
  }
  return request.headers.get('x-real-ip')?.trim() || '127.0.0.1';
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: 'FORBIDDEN_ORIGIN', message: 'Valid same-origin header required.' },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const rawName = typeof body.name === 'string' ? body.name.trim() : '';
  const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
  const rawSlug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const rawChannelUrl =
    typeof body.channel_url === 'string' ? body.channel_url.trim() : '';

  if (
    rawName.length < 2 ||
    rawName.length > 80 ||
    /[\r\n<>]/.test(rawName)
  ) {
    return NextResponse.json(
      {
        error: 'INVALID_PARTNER_NAME',
        message: 'Enter a valid partner or agency name (2-80 characters).',
      },
      { status: 400 }
    );
  }

  if (
    !rawEmail ||
    rawEmail.length > 120 ||
    /[\r\n]/.test(rawEmail) ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(rawEmail)
  ) {
    return NextResponse.json(
      { error: 'INVALID_EMAIL', message: 'Enter a valid partner contact email.' },
      { status: 400 }
    );
  }

  const emailGuard = checkDisposableOrBotEmail(rawEmail);
  if (emailGuard.blocked) {
    return NextResponse.json(
      {
        error: 'DISPOSABLE_OR_AUTOMATED_EMAIL',
        message:
          'Disposable or automated email aliases are not accepted for partner registration.',
      },
      { status: 400 }
    );
  }

  const safeSlug = sanitizeAffiliateCode(rawSlug);
  if (!safeSlug) {
    return NextResponse.json(
      {
        error: 'INVALID_PARTNER_SLUG',
        message:
          'Partner code must be 3-40 letters, numbers, hyphens, or underscores.',
      },
      { status: 400 }
    );
  }

  if (isGibberishBotPartnerSubmission({ name: rawName, slug: safeSlug })) {
    return NextResponse.json(
      {
        error: 'AUTOMATED_SUBMISSION_BLOCKED',
        message:
          'Automated partner form submissions are blocked. Enter your real agency or creator brand name and code.',
      },
      { status: 400 }
    );
  }

  let normalizedChannelUrl: string;
  try {
    const parsedUrl = new URL(
      /^https?:\/\//i.test(rawChannelUrl)
        ? rawChannelUrl
        : `https://${rawChannelUrl}`
    );
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new Error('Unsupported protocol');
    }
    // Enforce SSRF/public-host check on channel domain
    normalizePublicDomain(parsedUrl.hostname);
    normalizedChannelUrl = parsedUrl.toString();
  } catch {
    return NextResponse.json(
      {
        error: 'INVALID_CHANNEL_URL',
        message:
          'Provide a valid public website, YouTube, newsletter, or LinkedIn URL.',
      },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  const now = Date.now();
  const bucket = ipWindowMap.get(ip);
  if (bucket && bucket.resetAt > now) {
    if (bucket.count >= MAX_PARTNER_APPLICATIONS_PER_HOUR) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message:
            'Too many partner link requests from this IP. Please try again in an hour.',
        },
        { status: 429 }
      );
    }
    bucket.count += 1;
  } else {
    if (ipWindowMap.size > 2000) {
      ipWindowMap.clear();
    }
    ipWindowMap.set(ip, { count: 1, resetAt: now + HOUR_MS });
  }

  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://verisource.dev';

  const dispatched = await dispatchPartnerOnboardingEmail({
    partnerName: rawName,
    partnerEmail: rawEmail,
    partnerSlug: safeSlug,
    channelUrl: normalizedChannelUrl,
    appOrigin,
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.ALERT_FROM_EMAIL,
    bccEmail: process.env.ALERT_FALLBACK_EMAIL,
  });

  return NextResponse.json({
    ok: true,
    partnerSlug: dispatched.alert.partnerSlug,
    referralShortUrl: dispatched.alert.referralShortUrl,
    benchmarkRefUrl: dispatched.alert.benchmarkRefUrl,
    toolsRefUrl: dispatched.alert.toolsRefUrl,
    mode: dispatched.mode,
    delivered: dispatched.delivered,
    qualityScore: dispatched.qualityScore,
  });
}
