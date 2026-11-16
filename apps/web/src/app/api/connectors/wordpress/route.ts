import { NextResponse } from 'next/server';
import {
  buildWordPressConnectorPluginPhp,
  normalizePublicDomain,
} from '@verisource/core-geo';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const rawDomain = (url.searchParams.get('domain') ?? '').trim();

  let defaultHostname = 'verisource.dev';
  let defaultBrandName = 'Verisource';

  if (rawDomain) {
    try {
      const normalized = normalizePublicDomain(rawDomain);
      defaultHostname = normalized.hostname;
      defaultBrandName = normalized.inferredBrandName;
    } catch {
      return NextResponse.json(
        {
          error: 'INVALID_TARGET_DOMAIN',
          message: 'Optional ?domain= must be a valid public hostname.',
        },
        { status: 400 }
      );
    }
  }

  const bundle = buildWordPressConnectorPluginPhp({
    defaultBrandName,
    defaultHostname,
  });

  return new NextResponse(bundle.phpSource, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${bundle.filename}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
