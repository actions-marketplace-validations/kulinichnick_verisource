import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { submitUrlsToIndexNow } from '../../../lib/indexnow';

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
  const isMockMode = (process.env.PROVIDER_MODE ?? '').toLowerCase() === 'mock';

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

  let body: { dryRun?: boolean; urls?: string[] } = {};
  try {
    body = (await request.json()) as { dryRun?: boolean; urls?: string[] };
  } catch {
    body = {};
  }

  const dryRun = isMockMode ? true : Boolean(body.dryRun);
  const result = await submitUrlsToIndexNow({
    urls: Array.isArray(body.urls) ? body.urls : undefined,
    dryRun,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
