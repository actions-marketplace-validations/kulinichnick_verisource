import { NextResponse } from 'next/server';
import {
  buildMcpDiscoveryManifest,
  VERISOURCE_VERSION,
} from '@verisource/core-geo';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(): Promise<NextResponse> {
  const manifest = buildMcpDiscoveryManifest({
    version: VERISOURCE_VERSION,
    appOrigin: process.env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev',
    mcpOrigin: 'https://mcp.verisource.dev',
  });
  return NextResponse.json(manifest, { status: 200, headers: CORS_HEADERS });
}
