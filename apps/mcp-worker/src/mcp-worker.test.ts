import assert from 'node:assert/strict';
import test from 'node:test';
import { resetMockCreditBalancesForTests } from './auth.js';
import { runScheduledDomainScans } from './cron.js';
import worker from './index.js';
import type { WorkerEnv } from './types.js';

const TEST_ENV: WorkerEnv = {
  PROVIDER_MODE: 'mock',
  NEXT_PUBLIC_APP_URL: 'https://verisource.dev',
  NEXT_PUBLIC_MCP_URL: 'https://mcp.verisource.dev/mcp',
};

async function postMcpRpc(
  body: Record<string, unknown>,
  bearerToken?: string
): Promise<{ status: number; json: Record<string, unknown> }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  const req = new Request('https://mcp.verisource.dev/mcp', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const res = await worker.fetch(req, TEST_ENV);
  const raw = await res.text();

  let parsed: Record<string, unknown>;
  if (raw.trimStart().startsWith('{')) {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } else {
    const dataLine = raw
      .split(/\r?\n/)
      .find((line) => line.startsWith('data:'));
    if (!dataLine) {
      throw new Error(`Expected JSON or SSE data frame, got: ${raw}`);
    }
    parsed = JSON.parse(dataLine.slice(5).trim()) as Record<string, unknown>;
  }

  return { status: res.status, json: parsed };
}

test('GET /health and /.well-known/oauth-protected-resource respond cleanly', async () => {
  const healthRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/health'),
    TEST_ENV
  );
  assert.equal(healthRes.status, 200);
  const healthJson = (await healthRes.json()) as { transport: string };
  assert.equal(healthJson.transport, 'streamable_http_stateless');

  const oauthRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/.well-known/oauth-protected-resource'),
    TEST_ENV
  );
  assert.equal(oauthRes.status, 200);
  const oauthJson = (await oauthRes.json()) as { resource: string };
  assert.equal(oauthJson.resource, 'https://mcp.verisource.dev/mcp');
});

test('POST /mcp tools/list exposes all 4 Verisource GEO tools', async () => {
  const { status, json } = await postMcpRpc({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  });

  assert.equal(status, 200);
  const result = json.result as { tools: Array<{ name: string }> };
  const names = result.tools.map((t) => t.name);
  assert.deepEqual(names.sort(), [
    'check_brand_hallucinations',
    'generate_geo_fix_bundle',
    'get_citation_gaps_and_fanouts',
    'scan_domain_ai_readiness',
  ]);
});

test('Free preview tool scan_domain_ai_readiness runs without auth and blurs competitor URLs', async () => {
  const { status, json } = await postMcpRpc({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'scan_domain_ai_readiness',
      arguments: { domain: 'aurearoasters.com' },
    },
  });

  assert.equal(status, 200);
  const result = json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.notEqual(result.isError, true);
  const payload = JSON.parse(result.content[0]!.text) as {
    brandName: string;
    credits_charged: number;
    samplePromptResult: { citedSourceUrlsBlurred: string[] };
  };
  assert.equal(payload.brandName, 'Aurea Coffee Roasters');
  assert.equal(payload.credits_charged, 0);
  assert.ok(
    payload.samplePromptResult.citedSourceUrlsBlurred[0]?.includes(
      'locked-citation'
    )
  );
});

test('Paid tools enforce Bearer token & Pro/Agency plan tier, and meter 10 live vs 1 cached credit', async () => {
  resetMockCreditBalancesForTests();

  // 1. Unauthenticated call to paid tool must return MISSING_BEARER_TOKEN
  const unauth = await postMcpRpc({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'generate_geo_fix_bundle',
      arguments: { domain: 'mosaicroasters.com' },
    },
  });
  const unauthRes = unauth.json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.equal(unauthRes.isError, true);
  assert.ok(unauthRes.content[0]!.text.includes('MISSING_BEARER_TOKEN'));

  // 2. Free-tier key must return PLAN_UPGRADE_REQUIRED
  const freeKeyCall = await postMcpRpc(
    {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'get_citation_gaps_and_fanouts',
        arguments: { domain: 'mosaicroasters.com' },
      },
    },
    'vs_free_key'
  );
  const freeRes = freeKeyCall.json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.equal(freeRes.isError, true);
  assert.ok(freeRes.content[0]!.text.includes('PLAN_UPGRADE_REQUIRED'));

  // 3. Pro key with live_refresh=true deducts 10 credits (1000 -> 990) and returns >=9.5/10 fixes
  const liveProCall = await postMcpRpc(
    {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'generate_geo_fix_bundle',
        arguments: { domain: 'mosaicroasters.com', live_refresh: true },
      },
    },
    'vs_demo_pro_key'
  );
  const liveProRes = liveProCall.json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.notEqual(liveProRes.isError, true);
  const bundlePayload = JSON.parse(liveProRes.content[0]!.text) as {
    credits_charged: number;
    credits_remaining: number;
    fixes: Array<{ naturalQualityScore: number }>;
  };
  assert.equal(bundlePayload.credits_charged, 10);
  assert.equal(bundlePayload.credits_remaining, 990);
  assert.ok(bundlePayload.fixes.every((f) => f.naturalQualityScore >= 9.5));

  // 4. Subsequent cached call deducts only 1 credit (990 -> 989)
  const cachedProCall = await postMcpRpc(
    {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'check_brand_hallucinations',
        arguments: { domain: 'mosaicroasters.com' },
      },
    },
    'vs_demo_pro_key'
  );
  const cachedProRes = cachedProCall.json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.notEqual(cachedProRes.isError, true);
  const hallPayload = JSON.parse(cachedProRes.content[0]!.text) as {
    credits_charged: number;
    credits_remaining: number;
    served_from_cache?: boolean;
    hallucinations_count: number;
  };
  assert.equal(hallPayload.credits_charged, 1);
  assert.equal(hallPayload.credits_remaining, 989);
  assert.ok(hallPayload.hallucinations_count >= 1);

  // 5. Paid get_citation_gaps_and_fanouts returns 3-engine citation share, ranked sources & >=9.5/10 outreach drafts (989 -> 988)
  const gapsProCall = await postMcpRpc(
    {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'get_citation_gaps_and_fanouts',
        arguments: { domain: 'mosaicroasters.com' },
      },
    },
    'vs_demo_pro_key'
  );
  const gapsProRes = gapsProCall.json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.notEqual(gapsProRes.isError, true);
  const gapsPayload = JSON.parse(gapsProRes.content[0]!.text) as {
    credits_charged: number;
    credits_remaining: number;
    engine_citation_share: Array<{ aiEngine: string }>;
    ranked_citation_sources: Array<{ sourceHost: string; ownership: string }>;
    targeted_outreach_drafts: Array<{
      source_host: string;
      quality_score: number;
      draft_markdown: string;
    }>;
  };
  assert.equal(gapsPayload.credits_charged, 1);
  assert.equal(gapsPayload.credits_remaining, 988);
  assert.equal(gapsPayload.engine_citation_share.length, 3);
  assert.ok(gapsPayload.ranked_citation_sources.length >= 1);
  assert.ok(gapsPayload.targeted_outreach_drafts.length >= 1);
  assert.ok(
    gapsPayload.targeted_outreach_drafts.every(
      (d) =>
        d.quality_score >= 9.5 &&
        d.draft_markdown.includes('https://mosaicroasters.com/agents.md')
    )
  );

  // 6. Forged short vs_live_fake key is rejected with INVALID_OR_REVOKED_KEY
  const forgedCall = await postMcpRpc(
    {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: {
        name: 'check_brand_hallucinations',
        arguments: { domain: 'mosaicroasters.com' },
      },
    },
    'vs_live_forged_short_token'
  );
  const forgedRes = forgedCall.json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.equal(forgedRes.isError, true);
  assert.ok(forgedRes.content[0]!.text.includes('INVALID_OR_REVOKED_KEY'));
});

test('Scheduled weekly cron handler returns clean mock_noop summary with alertsDispatched=0 and digestsDispatched=0 when unconfigured', async () => {
  const summary = await runScheduledDomainScans(TEST_ENV);
  assert.deepEqual(summary, {
    mode: 'mock_noop',
    domainsScanned: 0,
    snapshotsInserted: 0,
    alertsDispatched: 0,
    digestsDispatched: 0,
  });
});

test('GET /.well-known/mcp.json and /server.json expose 4-tool Streamable HTTP registry manifest', async () => {
  const res = await worker.fetch(
    new Request('https://mcp.verisource.dev/.well-known/mcp.json'),
    TEST_ENV
  );
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  const manifest = (await res.json()) as {
    name: string;
    version: string;
    remotes: Array<{ type: string; url: string }>;
    tools: Array<{ name: string }>;
  };
  assert.equal(manifest.name, 'dev.verisource/mcp');
  assert.equal(manifest.version, '1.0.0');
  assert.equal(manifest.remotes[0]?.type, 'streamable-http');
  assert.equal(manifest.remotes[0]?.url, 'https://mcp.verisource.dev/mcp');
  assert.equal(manifest.tools.length, 4);
});
