import { NextResponse } from 'next/server';
import { VERISOURCE_INDEXNOW_KEY } from '../../lib/indexnow';

export async function GET(): Promise<NextResponse> {
  return new NextResponse(VERISOURCE_INDEXNOW_KEY, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
