import { NextResponse } from 'next/server';
import {
  normalizePublicDomain,
  PATIENT_ZERO_DOMAINS,
  runDomainReadinessScan,
  type ReadinessScanSummary,
} from '@verisource/core-geo';
import { getGraderCacheMap, getGraderIpMap } from '../../../lib/data-store';

export async function POST(request: Request): Promise<NextResponse> {
  const startedAt = Date.now();
  try {
    const body = (await request.json()) as { domain?: string };
    if (!body.domain || typeof body.domain !== 'string') {
      return NextResponse.json(
        {
          error: 'INVALID_DOMAIN',
          message: 'Enter a valid public domain (e.g. yourcompany.com).',
        },
        { status: 400 }
      );
    }

    const normalized = normalizePublicDomain(body.domain);
    const cacheMap = getGraderCacheMap();
    const cached = cacheMap.get(normalized.hostname);

    let summary: ReadinessScanSummary;
    let cached24h = false;

    if (cached && cached.expiresAt > Date.now()) {
      summary = cached.data as ReadinessScanSummary;
      cached24h = true;
    } else {
      const isUnlimitedDemo =
        normalized.hostname === 'verisource.dev' ||
        PATIENT_ZERO_DOMAINS.some((d) =>
          d.domain_url.toLowerCase().includes(normalized.hostname)
        );

      if (!isUnlimitedDemo) {
        const ip =
          request.headers.get('cf-connecting-ip') ??
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          '127.0.0.1';
        const today = new Date().toISOString().slice(0, 10);
        const ipMap = getGraderIpMap();
        const entry = ipMap.get(ip);
        const used = entry && entry.day === today ? entry.count : 0;

        if (used >= 5) {
          return NextResponse.json(
            {
              error: 'FREE_SCAN_LIMIT_REACHED',
              message:
                'Daily free preview limit reached. Mint a Pro ($99/mo · 1,000 credits) or Agency ($249/mo · 5,000 credits) key for continuous /mcp access.',
            },
            { status: 429 }
          );
        }
        ipMap.set(ip, { day: today, count: used + 1 });
      }

      summary = await runDomainReadinessScan(normalized.origin);
      cacheMap.set(normalized.hostname, {
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        data: summary,
      });
    }

    const toolPayload = {
      ...summary,
      cached_24h: cached24h,
      credits_charged: 0,
    };

    const rpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'scan_domain_ai_readiness',
        arguments: {
          domain: normalized.hostname,
        },
      },
    };

    const rpcResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(toolPayload, null, 2),
          },
        ],
      },
    };

    return NextResponse.json({
      endpoint: 'https://mcp.verisource.dev/mcp',
      transport: 'streamable-http',
      latencyMs: Math.max(1, Date.now() - startedAt),
      summary: toolPayload,
      rpcRequest,
      rpcResponse,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Unable to execute scan_domain_ai_readiness.';
    return NextResponse.json(
      { error: 'MCP_PREVIEW_FAILED', message },
      { status: 400 }
    );
  }
}
