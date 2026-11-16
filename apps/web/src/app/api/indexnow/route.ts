import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  submitUrlsToIndexNow,
  VERISOURCE_ORIGIN,
} from '../../../lib/indexnow';

function constantTimeBearerMatch(header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return false;
  const provided = Buffer.from(match[1].trim(), 'utf8');
  const expected = Buffer.from(secret.trim(), 'utf8');
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function POST(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_MAINTENANCE_TOKEN ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const isMockMode =
    !serviceRoleKey &&
    (process.env.PROVIDER_MODE ?? '').toLowerCase() === 'mock';

  const authorized =
    (adminToken && constantTimeBearerMatch(authHeader, adminToken)) ||
    (serviceRoleKey && constantTimeBearerMatch(authHeader, serviceRoleKey)) ||
    (isMockMode &&
      constantTimeBearerMatch(authHeader, 'vs_mock_owner_session'));

  if (!authorized) {
    return NextResponse.json(
      {
        error: 'UNAUTHORIZED',
        message: 'Valid maintenance Bearer token required for IndexNow submission.',
      },
      { status: 401 }
    );
  }

  let body: { dryRun?: boolean; urls?: unknown } = {};
  try {
    body = (await request.json()) as { dryRun?: boolean; urls?: unknown };
  } catch {
    body = {};
  }

  let validatedUrls: string[] | undefined;
  if (body.urls !== undefined) {
    if (
      !Array.isArray(body.urls) ||
      body.urls.length === 0 ||
      body.urls.length > 100
    ) {
      return NextResponse.json(
        {
          error: 'INVALID_INDEXNOW_URLS',
          message: 'Provide 1 to 100 canonical https://verisource.dev URLs.',
        },
        { status: 400 }
      );
    }

    const sanitized: string[] = [];
    for (const item of body.urls) {
      if (typeof item !== 'string' || item.length > 300) {
        return NextResponse.json(
          { error: 'INVALID_INDEXNOW_URLS' },
          { status: 400 }
        );
      }
      try {
        const parsed = new URL(item.trim());
        if (parsed.origin !== VERISOURCE_ORIGIN) {
          return NextResponse.json(
            {
              error: 'INVALID_INDEXNOW_URLS',
              message: `All IndexNow URLs must belong to ${VERISOURCE_ORIGIN}.`,
            },
            { status: 400 }
          );
        }
        sanitized.push(parsed.toString());
      } catch {
        return NextResponse.json(
          { error: 'INVALID_INDEXNOW_URLS' },
          { status: 400 }
        );
      }
    }
    validatedUrls = sanitized;
  }

  const dryRun = isMockMode ? true : Boolean(body.dryRun);
  const result = await submitUrlsToIndexNow({
    urls: validatedUrls,
    dryRun,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
