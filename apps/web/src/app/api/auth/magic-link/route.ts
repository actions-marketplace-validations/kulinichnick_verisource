import { NextResponse } from 'next/server';
import { dispatchMagicLinkSignInEmail } from '@verisource/core-geo';
import { getServiceSupabaseClient } from '../../../../lib/data-store';

interface RateBucket {
  count: number;
  resetAt: number;
}

const ipHourlyWindow = new Map<string, RateBucket>();
const recipientQuarterHourWindow = new Map<string, RateBucket>();

function checkRateBucket(
  map: Map<string, RateBucket>,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  if (map.size > 4000) {
    for (const [k, v] of map) {
      if (now >= v.resetAt) map.delete(k);
    }
  }
  const bucket = map.get(key);
  if (!bucket || now >= bucket.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

function extractClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('cf-connecting-ip')?.trim() ?? '127.0.0.1';
}

function isSameOriginRequest(request: Request): boolean {
  const expectedHost = (
    request.headers.get('host') ?? new URL(request.url).hostname
  )
    .split(':')[0]
    ?.trim()
    .toLowerCase();
  const originHeader = request.headers.get('origin');
  const refererHeader = request.headers.get('referer');
  const candidate = originHeader || refererHeader;
  if (!candidate || !expectedHost) return false;
  try {
    return new URL(candidate).hostname.toLowerCase() === expectedHost;
  } catch {
    return false;
  }
}

function isValidEmail(raw: string): boolean {
  if (!raw || raw.length > 254) return false;
  if (/[\r\n\t\s]/.test(raw)) return false;
  return /^[^\s@<>()[\]\\,;:"']+@[^\s@<>()[\]\\,;:"']+\.[a-z]{2,24}$/i.test(
    raw
  );
}

function validateSafeNextPath(rawNext: unknown): string | null {
  if (rawNext === undefined || rawNext === null || rawNext === '') {
    return '/dashboard';
  }
  if (typeof rawNext !== 'string' || rawNext.length > 400) {
    return null;
  }
  const trimmed = rawNext.trim();
  if (
    !trimmed.startsWith('/dashboard') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed.includes('://') ||
    /[\r\n]/.test(trimmed)
  ) {
    return null;
  }
  return trimmed;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      {
        error: 'FORBIDDEN_ORIGIN',
        message: 'Sign-in link requests must originate from Verisource.',
      },
      { status: 403 }
    );
  }

  let body: { email?: unknown; nextPath?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; nextPath?: unknown };
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Invalid JSON request body.' },
      { status: 400 }
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!isValidEmail(email)) {
    return NextResponse.json(
      {
        error: 'INVALID_EMAIL',
        message: 'Enter a valid email address to receive your sign-in link.',
      },
      { status: 400 }
    );
  }

  const safeNextPath = validateSafeNextPath(body.nextPath);
  if (!safeNextPath) {
    return NextResponse.json(
      {
        error: 'INVALID_REDIRECT_PATH',
        message: 'Sign-in redirect path must point to /dashboard.',
      },
      { status: 400 }
    );
  }

  const ip = extractClientIp(request);
  if (!checkRateBucket(ipHourlyWindow, ip, 12, 60 * 60 * 1000)) {
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message:
          'Too many sign-in requests from this network. Please wait a few minutes and try again.',
      },
      { status: 429 }
    );
  }

  const normalizedEmail = email.toLowerCase();
  if (
    !checkRateBucket(
      recipientQuarterHourWindow,
      normalizedEmail,
      5,
      15 * 60 * 1000
    )
  ) {
    return NextResponse.json(
      {
        error: 'RECIPIENT_RATE_LIMITED',
        message:
          'We already sent several sign-in links to this email recently. Check your inbox or spam folder.',
      },
      { status: 429 }
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  const fromEmail = process.env.ALERT_FROM_EMAIL?.trim() ?? '';
  const serviceSupabase = getServiceSupabaseClient();

  const reqUrl = new URL(request.url);
  const hostHeader = request.headers.get('host') ?? reqUrl.host;
  const proto =
    request.headers.get('x-forwarded-proto') ??
    reqUrl.protocol.replace(':', '');
  const publicOrigin = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || `${proto}://${hostHeader}`
  ).replace(/\/+$/, '');
  const redirectTo = `${publicOrigin}${safeNextPath}`;

  // Local developer mode where Supabase client auth is configured without RESEND_API_KEY:
  // signal client to fall back to standard client OTP.
  if (serviceSupabase && !resendApiKey) {
    return NextResponse.json({
      ok: false,
      fallbackToClientOtp: true,
    });
  }

  if (serviceSupabase && resendApiKey) {
    const { data: linkData, error: linkErr } =
      await serviceSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: {
          redirectTo,
        },
      });

    const actionLink = linkData?.properties?.action_link;
    if (linkErr || !actionLink) {
      return NextResponse.json(
        {
          error: 'AUTH_LINK_GENERATION_FAILED',
          message:
            linkErr?.message ??
            'Unable to generate your sign-in link right now. Please try again.',
        },
        { status: 500 }
      );
    }

    try {
      const dispatched = await dispatchMagicLinkSignInEmail({
        recipientEmail: normalizedEmail,
        actionLink,
        appOrigin: publicOrigin,
        resendApiKey,
        fromEmail,
      });

      // Security invariant: NEVER return actionLink in the HTTP response body
      return NextResponse.json({
        ok: true,
        mode: dispatched.mode,
        delivered: dispatched.delivered,
        qualityScore: dispatched.qualityScore,
      });
    } catch {
      return NextResponse.json(
        {
          error: 'EMAIL_DELIVERY_FAILED',
          message:
            'Unable to deliver sign-in email right now. Please try again in a moment.',
        },
        { status: 502 }
      );
    }
  }

  // Zero-key mock / E2E verification mode (never leaks live tokens)
  const dryRun = await dispatchMagicLinkSignInEmail({
    recipientEmail: normalizedEmail,
    actionLink: `${publicOrigin}${safeNextPath}`,
    appOrigin: publicOrigin,
  });

  return NextResponse.json({
    ok: true,
    mode: dryRun.mode,
    delivered: dryRun.delivered,
    qualityScore: dryRun.qualityScore,
  });
}
