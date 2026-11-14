import { NextResponse } from 'next/server';

const DEFAULT_MCP_REGISTRY_ED25519_PUBKEY =
  '1Jz3uDgGEjNLR5zl3BQpjwrRwT12l9WINFNyVeNgeFs=';

export async function GET(): Promise<NextResponse> {
  const pubKey = (
    process.env.MCP_REGISTRY_PUBLIC_KEY ?? DEFAULT_MCP_REGISTRY_ED25519_PUBKEY
  ).trim();

  const proofRecord = `v=MCPv1; k=ed25519; p=${pubKey}\n`;

  return new NextResponse(proofRecord, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
