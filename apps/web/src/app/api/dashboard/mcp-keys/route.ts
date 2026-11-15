import { NextResponse } from 'next/server';
import { generateMcpApiKey, type McpApiKeyRow } from '@verisource/core-geo';
import {
  getLocalMockStore,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export async function POST(request: Request): Promise<NextResponse> {
  const access = await resolveConsoleRequestAccess(request);
  if (access.status === 'unauthenticated') {
    return NextResponse.json(
      {
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Sign in to your Verisource Console to mint an MCP API key.',
      },
      { status: 401 }
    );
  }
  if (access.status === 'plan_activation_required') {
    return NextResponse.json(
      {
        error: 'PLAN_ACTIVATION_REQUIRED',
        message:
          'Activate a Console plan to mint live Bearer keys for mcp.verisource.dev.',
      },
      { status: 402 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { label?: string };
  const store = getLocalMockStore();
  const minted = await generateMcpApiKey();

  const row: McpApiKeyRow = {
    id: crypto.randomUUID(),
    user_id: access.profile.id,
    key_hash: minted.keyHash,
    key_prefix: minted.keyPrefix,
    label: body.label?.trim().slice(0, 80) || 'Agent Key',
    last_used_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  if (access.supabase) {
    const { error } = await access.supabase.from('mcp_api_keys').insert(row);
    if (error) {
      return NextResponse.json(
        {
          error: 'KEY_MINT_FAILED',
          message:
            'Unable to persist MCP API key. Ensure database schema is initialized.',
        },
        { status: 500 }
      );
    }
  } else {
    store.mcpApiKeys.unshift(row);
  }

  return NextResponse.json({
    keyRow: row,
    rawKeyOnce: minted.rawKey,
    persistedToLiveMcp: Boolean(access.supabase),
  });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const access = await resolveConsoleRequestAccess(request);
  if (access.status === 'unauthenticated') {
    return NextResponse.json(
      {
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Sign in to your Verisource Console to revoke an MCP API key.',
      },
      { status: 401 }
    );
  }
  if (access.status === 'plan_activation_required') {
    return NextResponse.json(
      {
        error: 'PLAN_ACTIVATION_REQUIRED',
        message: 'Activate a Console plan to manage MCP API keys.',
      },
      { status: 402 }
    );
  }

  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  const keyId = (body.id ?? url.searchParams.get('id') ?? '').trim();

  if (!keyId) {
    return NextResponse.json(
      { error: 'MISSING_KEY_ID', message: 'Provide an MCP key id to revoke.' },
      { status: 400 }
    );
  }

  if (access.supabase) {
    const { data, error } = await access.supabase
      .from('mcp_api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', access.profile.id)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: 'KEY_NOT_FOUND', message: 'MCP key not found in workspace.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ revoked: true, keyRow: data });
  }

  const store = getLocalMockStore();
  const target = store.mcpApiKeys.find((k) => k.id === keyId);
  if (!target) {
    return NextResponse.json(
      { error: 'KEY_NOT_FOUND', message: 'MCP key not found in workspace.' },
      { status: 404 }
    );
  }
  target.is_active = false;
  return NextResponse.json({ revoked: true, keyRow: target });
}
