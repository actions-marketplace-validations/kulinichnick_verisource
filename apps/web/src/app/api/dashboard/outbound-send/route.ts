import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { enforceQualityGate95 } from '@verisource/core-geo';

function constantTimeBearerMatch(
  header: string | null,
  secret: string
): boolean {
  if (!header || !secret) return false;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  const provided = Buffer.from(match[1].trim(), 'utf8');
  const expected = Buffer.from(secret.trim(), 'utf8');
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

function isValidEmailAddress(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length < 5 || trimmed.length > 180 || /[\r\n\s]/.test(trimmed)) {
    return false;
  }
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed);
}

export async function POST(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_MAINTENANCE_TOKEN ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const isMockMode =
    !serviceRoleKey &&
    (process.env.PROVIDER_MODE ?? '').toLowerCase() === 'mock';

  const authorized = Boolean(
    (adminToken && constantTimeBearerMatch(authHeader, adminToken)) ||
      (serviceRoleKey && constantTimeBearerMatch(authHeader, serviceRoleKey)) ||
      (isMockMode &&
        constantTimeBearerMatch(authHeader, 'vs_mock_owner_session'))
  );

  if (!authorized) {
    return NextResponse.json(
      {
        error: 'UNAUTHORIZED',
        message: 'Valid service-role or maintenance Bearer token required.',
      },
      { status: 401 }
    );
  }

  let body: {
    to?: unknown;
    subject?: unknown;
    text?: unknown;
    fromName?: unknown;
    replyTo?: unknown;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const toEmail = typeof body.to === 'string' ? body.to.trim() : '';
  const subject =
    typeof body.subject === 'string'
      ? body.subject.replace(/[\r\n]+/g, ' ').trim()
      : '';
  const rawText = typeof body.text === 'string' ? body.text.trim() : '';
  const replyTo =
    typeof body.replyTo === 'string' && isValidEmailAddress(body.replyTo)
      ? body.replyTo.trim()
      : 'kulinichnick@gmail.com';

  if (!isValidEmailAddress(toEmail)) {
    return NextResponse.json(
      { error: 'INVALID_RECIPIENT_EMAIL' },
      { status: 400 }
    );
  }
  if (subject.length < 4 || subject.length > 180) {
    return NextResponse.json({ error: 'INVALID_SUBJECT' }, { status: 400 });
  }
  if (rawText.length < 40 || rawText.length > 4000) {
    return NextResponse.json({ error: 'INVALID_BODY_LENGTH' }, { status: 400 });
  }

  const quality = enforceQualityGate95(rawText);

  const resendKey = (process.env.RESEND_API_KEY ?? '').trim();
  if (!resendKey || !resendKey.startsWith('re_') || isMockMode) {
    return NextResponse.json({
      ok: true,
      delivered: false,
      mode: 'preview_dry_run',
      providerMessageId: null,
      to: toEmail,
      qualityScore: quality.score,
    });
  }

  const primaryFrom = 'Nick Kulinich <nick@verisource.dev>';
  const fallbackFrom = (
    process.env.ALERT_FROM_EMAIL ?? 'Nick Kulinich <alerts@verisource.dev>'
  ).trim();

  let res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: primaryFrom,
      to: [toEmail],
      reply_to: replyTo,
      bcc: [replyTo],
      subject,
      text: quality.content,
    }),
  });

  if (!res.ok && primaryFrom !== fallbackFrom) {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fallbackFrom,
        to: [toEmail],
        reply_to: replyTo,
        bcc: [replyTo],
        subject,
        text: quality.content,
      }),
    });
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    return NextResponse.json(
      {
        error: 'RESEND_DISPATCH_FAILED',
        message: errBody.slice(0, 200),
      },
      { status: 502 }
    );
  }

  const json = (await res.json()) as { id?: string };
  return NextResponse.json({
    ok: true,
    delivered: true,
    mode: 'live_resend',
    providerMessageId: json.id ?? null,
    to: toEmail,
    qualityScore: quality.score,
  });
}
