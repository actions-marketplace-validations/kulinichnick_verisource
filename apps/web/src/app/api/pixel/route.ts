import { NextResponse } from 'next/server';
import { normalizeAiReferralSource } from '@verisource/core-geo';
import { z } from 'zod';
import {
  lookupDomainByPixelToken,
  recordAttributionEvent,
} from '../../../lib/data-store';

const PIXEL_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const PixelPayloadSchema = z.object({
  token: z.string().uuid(),
  event_type: z.enum([
    'ai_referral_visit',
    'ai_referral_conversion',
    'ai_bot_crawl',
  ]),
  source_engine: z.string().min(2).max(64),
  landing_path: z.string().max(512).nullable().optional(),
  conversion_value_usd: z.number().min(0).max(1_000_000).nullable().optional(),
});

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: PIXEL_CORS_HEADERS });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const parsed = PixelPayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_PIXEL_PAYLOAD' },
        { status: 400, headers: PIXEL_CORS_HEADERS }
      );
    }

    const domain = await lookupDomainByPixelToken(parsed.data.token);
    if (!domain) {
      return NextResponse.json(
        { error: 'UNKNOWN_PIXEL_TOKEN' },
        { status: 404, headers: PIXEL_CORS_HEADERS }
      );
    }

    // Strict mandatory Origin / Referer verification to block headerless curl spoofing
    const originHeader =
      request.headers.get('origin') ?? request.headers.get('referer');
    if (!originHeader) {
      return NextResponse.json(
        {
          error: 'MISSING_ORIGIN',
          message: 'Origin or Referer header is required for attribution telemetry.',
        },
        { status: 403, headers: PIXEL_CORS_HEADERS }
      );
    }

    let callerHost: string;
    let expectedHost: string;
    try {
      callerHost = new URL(originHeader).hostname
        .toLowerCase()
        .replace(/^www\./, '');
      expectedHost = new URL(domain.domain_url).hostname
        .toLowerCase()
        .replace(/^www\./, '');
    } catch {
      return NextResponse.json(
        { error: 'MALFORMED_ORIGIN' },
        { status: 403, headers: PIXEL_CORS_HEADERS }
      );
    }

    const isLocalhostDev =
      process.env.NODE_ENV !== 'production' &&
      (callerHost === 'localhost' || callerHost === '127.0.0.1');

    if (!isLocalhostDev && callerHost !== expectedHost) {
      return NextResponse.json(
        {
          error: 'ORIGIN_MISMATCH',
          message: `Origin ${callerHost} is not authorized to record attribution for ${expectedHost}.`,
        },
        { status: 403, headers: PIXEL_CORS_HEADERS }
      );
    }

    const normalizedEngine = normalizeAiReferralSource(parsed.data.source_engine);
    if (!normalizedEngine) {
      return NextResponse.json(
        { error: 'UNSUPPORTED_AI_ENGINE' },
        { status: 400, headers: PIXEL_CORS_HEADERS }
      );
    }

    const safeConversionValue =
      parsed.data.event_type === 'ai_referral_conversion'
        ? (parsed.data.conversion_value_usd ?? null)
        : null;

    const created = await recordAttributionEvent({
      domain_id: domain.id,
      event_type: parsed.data.event_type,
      source_engine: normalizedEngine,
      landing_path: parsed.data.landing_path ?? '/',
      conversion_value_usd: safeConversionValue,
    });

    return NextResponse.json(
      { ok: true, event_id: created.id, source_engine: created.source_engine },
      { status: 201, headers: PIXEL_CORS_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: 'PIXEL_INGEST_ERROR' },
      { status: 400, headers: PIXEL_CORS_HEADERS }
    );
  }
}
