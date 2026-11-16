import { NextResponse } from 'next/server';
import {
  AFFILIATE_COOKIE_MAX_AGE_SECONDS,
  AFFILIATE_COOKIE_NAME,
  normalizePublicDomain,
  sanitizeAffiliateCode,
} from '@verisource/core-geo';

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  const { code } = await context.params;
  const safeCode = sanitizeAffiliateCode(code);
  if (!safeCode) {
    return NextResponse.json(
      {
        error: 'INVALID_REFERRAL_CODE',
        message:
          'Partner referral code must be 3-40 alphanumeric, hyphen, or underscore characters.',
      },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const rawTo = (url.searchParams.get('to') ?? '/').trim();
  const rawDomain = (url.searchParams.get('domain') ?? '').trim();

  if (
    !rawTo.startsWith('/') ||
    rawTo.startsWith('//') ||
    rawTo.includes('\\') ||
    /[\r\n]/.test(rawTo) ||
    rawTo.length > 200
  ) {
    return NextResponse.json(
      {
        error: 'INVALID_REDIRECT_PATH',
        message: 'Destination path must be a relative Verisource route.',
      },
      { status: 400 }
    );
  }

  const dest = new URL(rawTo, url.origin);
  if (dest.origin !== url.origin) {
    return NextResponse.json(
      { error: 'INVALID_REDIRECT_PATH' },
      { status: 400 }
    );
  }

  if (rawDomain) {
    try {
      const normalized = normalizePublicDomain(rawDomain);
      dest.searchParams.set('domain', normalized.hostname);
    } catch {
      return NextResponse.json(
        { error: 'INVALID_TARGET_DOMAIN' },
        { status: 400 }
      );
    }
  }

  dest.searchParams.set('ref', safeCode);

  const response = NextResponse.redirect(dest.toString(), { status: 302 });
  response.cookies.set(AFFILIATE_COOKIE_NAME, safeCode, {
    path: '/',
    maxAge: AFFILIATE_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
    httpOnly: false,
    secure: url.protocol === 'https:',
  });
  return response;
}
