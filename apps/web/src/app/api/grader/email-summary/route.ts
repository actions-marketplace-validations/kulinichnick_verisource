import { NextResponse } from 'next/server';
import {
  dispatchFreeAuditSummaryEmail,
  normalizePublicDomain,
  resolveCoreGeoEnv,
  runDomainReadinessScan,
  type ReadinessScanSummary,
  type RecommendedRemediationEnv,
} from '@verisource/core-geo';
import { getGraderCacheMap } from '../../../../lib/data-store';

export const maxDuration = 45;

const VALID_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,180}\.[a-zA-Z]{2,24}$/;

const VALID_PROMPT_ENVS = new Set<RecommendedRemediationEnv>([
  'coding_agent',
  'wordpress_cms',
  'webflow_cms',
  'wix_squarespace_framer',
  'shopify_liquid',
  'chat_assistant',
]);

interface DailyCounter {
  day: string;
  count: number;
}

const ipEmailMap = new Map<string, DailyCounter>();
const recipientEmailMap = new Map<string, DailyCounter>();

function incrementBoundedCounter(
  map: Map<string, DailyCounter>,
  key: string,
  day: string,
  limit: number
): boolean {
  if (map.size > 500) {
    map.clear();
  }
  const existing = map.get(key);
  const used = existing && existing.day === day ? existing.count : 0;
  if (used >= limit) {
    return false;
  }
  map.set(key, { day, count: used + 1 });
  return true;
}

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

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      {
        error: 'FORBIDDEN_ORIGIN',
        message: 'Email summary requests must originate from verisource.dev.',
      },
      { status: 403 }
    );
  }

  let body: {
    domain?: unknown;
    recipient_email?: unknown;
    env?: unknown;
  };
  try {
    body = (await request.json()) as {
      domain?: unknown;
      recipient_email?: unknown;
      env?: unknown;
    };
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Invalid JSON request body.' },
      { status: 400 }
    );
  }

  const rawEmail =
    typeof body.recipient_email === 'string'
      ? body.recipient_email.trim().toLowerCase()
      : '';
  if (
    !rawEmail ||
    rawEmail.length > 160 ||
    /[\r\n\s,;]/.test(rawEmail) ||
    !VALID_EMAIL_REGEX.test(rawEmail)
  ) {
    return NextResponse.json(
      {
        error: 'INVALID_EMAIL',
        message: 'Enter a valid email address (for example, you@company.com).',
      },
      { status: 400 }
    );
  }

  const rawDomain =
    typeof body.domain === 'string' ? body.domain.trim() : '';
  if (!rawDomain) {
    return NextResponse.json(
      { error: 'INVALID_DOMAIN', message: 'Enter a valid public website domain.' },
      { status: 400 }
    );
  }

  let normalized: ReturnType<typeof normalizePublicDomain>;
  try {
    normalized = normalizePublicDomain(rawDomain);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'INVALID_DOMAIN',
        message:
          err instanceof Error
            ? err.message
            : 'Target domain must be a valid public hostname.',
      },
      { status: 400 }
    );
  }

  let safeEnv: RecommendedRemediationEnv | undefined;
  if (typeof body.env === 'string' && body.env.trim().length > 0) {
    const candidate = body.env.trim() as RecommendedRemediationEnv;
    if (!VALID_PROMPT_ENVS.has(candidate)) {
      return NextResponse.json(
        { error: 'INVALID_TARGET_ENV', message: 'Unsupported target environment.' },
        { status: 400 }
      );
    }
    safeEnv = candidate;
  }

  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1';
  const today = new Date().toISOString().slice(0, 10);

  if (!incrementBoundedCounter(ipEmailMap, ip, today, 4)) {
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_REACHED',
        message:
          'Daily email summary limit reached for this network. Use Share Audit Link above to copy the URL directly.',
      },
      { status: 429 }
    );
  }

  if (!incrementBoundedCounter(recipientEmailMap, rawEmail, today, 2)) {
    return NextResponse.json(
      {
        error: 'RECIPIENT_LIMIT_REACHED',
        message:
          'We already sent two audit summaries to that inbox today. Check your inbox or spam folder.',
      },
      { status: 429 }
    );
  }

  try {
    const cacheMap = getGraderCacheMap();
    const cached = cacheMap.get(normalized.hostname);
    let summary: ReadinessScanSummary;

    if (cached && cached.expiresAt > Date.now()) {
      summary = cached.data as ReadinessScanSummary;
    } else {
      summary = await runDomainReadinessScan(normalized.origin);
      cacheMap.set(normalized.hostname, {
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        data: summary,
      });
    }

    const coreEnv = resolveCoreGeoEnv();
    const resendKey = process.env.RESEND_API_KEY?.trim() ?? '';
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? undefined;
    const reqOrigin = new URL(request.url).origin;
    const appOrigin = coreEnv.appUrl || reqOrigin || 'https://verisource.dev';

    const dispatched = await dispatchFreeAuditSummaryEmail({
      summary,
      targetEnv: safeEnv,
      appOrigin,
      recipientEmail: rawEmail,
      resendApiKey: resendKey,
      fromEmail,
    });

    return NextResponse.json({
      ok: true,
      delivered: dispatched.delivered,
      mode: dispatched.mode,
      recipientEmail: dispatched.recipientEmail,
      subject: dispatched.subject,
      trialUrl: dispatched.trialUrl,
      passUrl: dispatched.passUrl,
      auditReplayUrl: dispatched.auditReplayUrl,
      qualityScore: dispatched.qualityScore,
      ...(dispatched.mode === 'preview_dry_run'
        ? { text: dispatched.text }
        : {}),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'EMAIL_DISPATCH_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to send audit summary right now.',
      },
      { status: 500 }
    );
  }
}
