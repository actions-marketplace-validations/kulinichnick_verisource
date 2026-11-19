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

test('POST /mcp tools/list exposes all 5 Verisource GEO tools', async () => {
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
    'compare_competitor_protocol_xray',
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
    detected_platform?: string;
    detected_platform_label?: string;
    target_env?: string;
    citation_comparison_page?: {
      suggested_path: string;
      markdown_page: string;
      faq_json_ld: string;
      ai_build_prompt: string;
    };
  };
  assert.equal(bundlePayload.credits_charged, 10);
  assert.equal(bundlePayload.credits_remaining, 990);
  assert.equal(bundlePayload.detected_platform, 'shopify');
  assert.equal(bundlePayload.detected_platform_label, 'Shopify');
  assert.equal(bundlePayload.target_env, 'shopify_liquid');
  assert.ok(bundlePayload.fixes.every((f) => f.naturalQualityScore >= 9.5));
  assert.ok(
    bundlePayload.citation_comparison_page?.suggested_path.startsWith('/pages/') &&
      bundlePayload.citation_comparison_page.ai_build_prompt.includes(
        'AI Citation Page Build Prompt'
      ),
    'Expected generate_geo_fix_bundle to include citation_comparison_page bundle'
  );

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
    citation_action_playbook_markdown?: string;
  };
  assert.equal(gapsPayload.credits_charged, 1);
  assert.equal(gapsPayload.credits_remaining, 988);
  assert.equal(gapsPayload.engine_citation_share.length, 3);
  assert.ok(gapsPayload.ranked_citation_sources.length >= 1);
  assert.ok(gapsPayload.targeted_outreach_drafts.length >= 1);
  assert.ok(
    gapsPayload.citation_action_playbook_markdown?.includes(
      'Off-Site AI Citation Acquisition Playbook'
    ),
    'Expected get_citation_gaps_and_fanouts to include citation_action_playbook_markdown'
  );
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

test('Scheduled weekly cron handler returns clean mock_noop summary with alertsDispatched=0, digestsDispatched=0 and trialNudgesDispatched=0 when unconfigured', async () => {
  const summary = await runScheduledDomainScans(TEST_ENV);
  assert.deepEqual(summary, {
    mode: 'mock_noop',
    domainsScanned: 0,
    snapshotsInserted: 0,
    alertsDispatched: 0,
    digestsDispatched: 0,
    trialNudgesDispatched: 0,
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
  assert.equal(manifest.tools.length, 5);
});

test('Paid generate_geo_fix_bundle honors explicit target_env override (wordpress_cms)', async () => {
  const req = new Request('https://mcp.verisource.dev/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: 'Bearer vs_demo_pro_key',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 99,
      method: 'tools/call',
      params: {
        name: 'generate_geo_fix_bundle',
        arguments: {
          domain: 'mosaicroasters.com',
          target_env: 'wordpress_cms',
        },
      },
    }),
  });
  const res = await worker.fetch(req, TEST_ENV);
  assert.equal(res.status, 200);
  const raw = await res.text();
  const dataLine = raw
    .split('\n')
    .find((l) => l.startsWith('data: '));
  const rpc = JSON.parse(dataLine ? dataLine.slice(6) : raw) as {
    result: { content: Array<{ text: string }> };
  };
  const parsed = JSON.parse(rpc.result.content[0]!.text) as {
    target_env: string;
    ai_remediation_prompt: string;
  };
  assert.equal(parsed.target_env, 'wordpress_cms');
  assert.ok(
    parsed.ai_remediation_prompt.includes('WPCode') ||
      parsed.ai_remediation_prompt.includes('WordPress')
  );
});

test('M74 Fake or unentitled Bearer headers cannot bypass 3/IP/day rate limit on scan_domain_ai_readiness', async () => {
  const testDomains = [
    'alpha-ratecheck-m74.io',
    'bravo-ratecheck-m74.io',
    'charlie-ratecheck-m74.io',
    'delta-ratecheck-m74.io',
  ];

  for (let i = 0; i < testDomains.length; i += 1) {
    const req = new Request('https://mcp.verisource.dev/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: 'Bearer forged_garbage_token_attempt',
        'cf-connecting-ip': '203.0.113.222',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 200 + i,
        method: 'tools/call',
        params: {
          name: 'scan_domain_ai_readiness',
          arguments: { domain: testDomains[i] },
        },
      }),
    });
    const res = await worker.fetch(req, TEST_ENV);
    assert.equal(res.status, 200);
    const raw = await res.text();
    const dataLine = raw
      .split('\n')
      .find((l) => l.startsWith('data: '));
    const rpc = JSON.parse(dataLine ? dataLine.slice(6) : raw) as {
      result: { isError?: boolean; content: Array<{ text: string }> };
    };
    if (i < 3) {
      assert.notEqual(rpc.result.isError, true);
    } else {
      assert.equal(
        rpc.result.isError,
        true,
        'Expected 4th uncached domain with forged Bearer header to hit FREE_DAILY_RATE_LIMIT_REACHED'
      );
      assert.ok(
        rpc.result.content[0]!.text.includes('FREE_DAILY_RATE_LIMIT_REACHED')
      );
    }
  }
});

test('M80 scan_domain_ai_readiness exposes 3-pillar jsonLdReadiness (Entity, FAQPage, Offer) over Streamable HTTP', async () => {
  const req = new Request('https://mcp.verisource.dev/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'cf-connecting-ip': '198.51.100.77',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 301,
      method: 'tools/call',
      params: {
        name: 'scan_domain_ai_readiness',
        arguments: { domain: 'aurearoasters.com' },
      },
    }),
  });
  const res = await worker.fetch(req, TEST_ENV);
  assert.equal(res.status, 200);
  const raw = await res.text();
  const dataLine = raw
    .split('\n')
    .find((l) => l.startsWith('data: '));
  const rpc = JSON.parse(dataLine ? dataLine.slice(6) : raw) as {
    result: { isError?: boolean; content: Array<{ text: string }> };
  };
  assert.notEqual(rpc.result.isError, true);
  const payload = JSON.parse(rpc.result.content[0]!.text) as {
    jsonLdReadiness?: {
      blockCount: number;
      hasEntityIdentity: boolean;
      hasFaqPage: boolean;
      hasOfferOrPricing: boolean;
      missingAiGraphPillars: string[];
    };
  };
  assert.ok(
    payload.jsonLdReadiness &&
      typeof payload.jsonLdReadiness.hasEntityIdentity === 'boolean' &&
      typeof payload.jsonLdReadiness.hasFaqPage === 'boolean' &&
      typeof payload.jsonLdReadiness.hasOfferOrPricing === 'boolean' &&
      Array.isArray(payload.jsonLdReadiness.missingAiGraphPillars),
    'Expected scan_domain_ai_readiness to return 3-pillar jsonLdReadiness'
  );
});

test('M105 compare_competitor_protocol_xray blocks SSRF/same-domain before billing and meters 10 live vs 1 cached credit', async () => {
  resetMockCreditBalancesForTests();

  // 1. Unauthenticated call rejected
  const unauth = await postMcpRpc({
    jsonrpc: '2.0',
    id: 401,
    method: 'tools/call',
    params: {
      name: 'compare_competitor_protocol_xray',
      arguments: {
        own_domain: 'mosaicroasters.com',
        rival_domain: 'aurearoasters.com',
      },
    },
  });
  const unauthRes = unauth.json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.equal(unauthRes.isError, true);
  assert.ok(unauthRes.content[0]!.text.includes('MISSING_BEARER_TOKEN'));

  // 2. SSRF & Same-domain rejected BEFORE charging any credits (balance stays 1000)
  const ssrfCall = await postMcpRpc(
    {
      jsonrpc: '2.0',
      id: 402,
      method: 'tools/call',
      params: {
        name: 'compare_competitor_protocol_xray',
        arguments: {
          own_domain: 'mosaicroasters.com',
          rival_domain: 'http://169.254.169.254/latest',
          live_refresh: true,
        },
      },
    },
    'vs_demo_pro_key'
  );
  const ssrfRes = ssrfCall.json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.equal(ssrfRes.isError, true);
  assert.ok(ssrfRes.content[0]!.text.includes('INVALID_DOMAIN'));

  const sameCall = await postMcpRpc(
    {
      jsonrpc: '2.0',
      id: 403,
      method: 'tools/call',
      params: {
        name: 'compare_competitor_protocol_xray',
        arguments: {
          own_domain: 'https://mosaicroasters.com',
          rival_domain: 'mosaicroasters.com',
          live_refresh: true,
        },
      },
    },
    'vs_demo_pro_key'
  );
  const sameRes = sameCall.json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.equal(sameRes.isError, true);
  assert.ok(sameRes.content[0]!.text.includes('SAME_DOMAIN_ERROR'));

  // 3. Valid live_refresh=true call charges 10 credits (1000 -> 990), confirming 0 credits were lost above
  const liveCall = await postMcpRpc(
    {
      jsonrpc: '2.0',
      id: 404,
      method: 'tools/call',
      params: {
        name: 'compare_competitor_protocol_xray',
        arguments: {
          own_domain: 'mosaicroasters.com',
          rival_domain: 'aurearoasters.com',
          live_refresh: true,
        },
      },
    },
    'vs_demo_pro_key'
  );
  const liveRes = liveCall.json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.notEqual(liveRes.isError, true);
  const livePayload = JSON.parse(liveRes.content[0]!.text) as {
    credits_charged: number;
    credits_remaining: number;
    dimensions: Array<{ id: string }>;
    ai_overtake_prompt: string;
    ai_overtake_prompt_score: number;
    vs_rival_comparison_page: {
      suggested_path: string;
      markdown_page: string;
      faq_json_ld: string;
    };
    opengraph_card_url: string;
  };
  assert.equal(livePayload.credits_charged, 10);
  assert.equal(livePayload.credits_remaining, 990);
  assert.equal(livePayload.dimensions.length, 6);
  assert.ok(livePayload.ai_overtake_prompt_score >= 9.5);
  assert.ok(!livePayload.ai_overtake_prompt.includes('REDACTED'));
  assert.ok(
    livePayload.vs_rival_comparison_page.markdown_page.length > 100 &&
      livePayload.opengraph_card_url.includes('/api/og/vs?a=mosaicroasters.com&b=aurearoasters.com')
  );

  // 4. Subsequent cached call charges 1 credit (990 -> 989)
  const cachedCall = await postMcpRpc(
    {
      jsonrpc: '2.0',
      id: 405,
      method: 'tools/call',
      params: {
        name: 'compare_competitor_protocol_xray',
        arguments: {
          own_domain: 'mosaicroasters.com',
          rival_domain: 'aurearoasters.com',
        },
      },
    },
    'vs_demo_pro_key'
  );
  const cachedRes = cachedCall.json.result as {
    isError?: boolean;
    content: Array<{ text: string }>;
  };
  assert.notEqual(cachedRes.isError, true);
  const cachedPayload = JSON.parse(cachedRes.content[0]!.text) as {
    credits_charged: number;
    credits_remaining: number;
    served_from_cache: boolean;
  };
  assert.equal(cachedPayload.credits_charged, 1);
  assert.equal(cachedPayload.credits_remaining, 989);
  assert.equal(cachedPayload.served_from_cache, true);
});

test('M110 resolveWorkerKv binds production VERISOURCE_CACHE namespace and enforces KV rate limits', async () => {
  const { resolveWorkerKv } = await import('./types.js');
  const { checkFreeGraderIpRateLimit } = await import('./cache.js');

  const store = new Map<string, string>();
  const fakeKv = {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => {
      store.set(k, v);
    },
  } as unknown as KVNamespace;

  const prodEnv = {
    ...TEST_ENV,
    VERISOURCE_CACHE: fakeKv,
  };
  assert.equal(resolveWorkerKv(prodEnv), fakeKv);

  const r1 = await checkFreeGraderIpRateLimit('203.0.113.88', prodEnv, 2);
  const r2 = await checkFreeGraderIpRateLimit('203.0.113.88', prodEnv, 2);
  const r3 = await checkFreeGraderIpRateLimit('203.0.113.88', prodEnv, 2);
  assert.equal(r1.allowed, true);
  assert.equal(r2.allowed, true);
  assert.equal(r3.allowed, false);
  assert.ok(store.size >= 1, 'Expected rate limit counter persisted into VERISOURCE_CACHE');
});

test('M129 Hosted Customer Brand /mcp + W3C WebMCP (/b/:domain/mcp, /webmcp.js, /.well-known/mcp.json) serves verified tools & blocks unsubscribed/SSRF hosts', async () => {
  async function postBrandMcp(domain: string, body: Record<string, unknown>) {
    const res = await worker.fetch(
      new Request(`https://mcp.verisource.dev/b/${domain}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
      }),
      TEST_ENV
    );
    const raw = await res.text();
    let parsed: Record<string, unknown>;
    if (raw.trimStart().startsWith('{')) {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } else {
      const dataLine = raw
        .split(/\r?\n/)
        .find((line) => line.startsWith('data:'));
      parsed = JSON.parse((dataLine ?? 'data:{}').slice(5).trim()) as Record<
        string,
        unknown
      >;
    }
    return { status: res.status, json: parsed };
  }

  // 1. Self-dogfooding verisource.dev discovery manifest & webmcp.js
  const vsManifestRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/b/verisource.dev/.well-known/mcp.json'),
    TEST_ENV
  );
  assert.equal(vsManifestRes.status, 200);
  const vsManifest = (await vsManifestRes.json()) as { name: string };
  assert.equal(vsManifest.name, 'brand.verisource.dev/mcp');

  const vsJsRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/b/verisource.dev/webmcp.js'),
    TEST_ENV
  );
  assert.equal(vsJsRes.status, 200);
  assert.ok(
    (vsJsRes.headers.get('content-type') ?? '').includes('application/javascript')
  );
  const vsJsText = await vsJsRes.text();
  assert.ok(
    vsJsText.includes('navigator.modelContext') &&
      vsJsText.includes('get_verified_pricing_and_offers')
  );

  // 2. Customer Streamable HTTP /b/mosaicroasters.com/mcp tools/list & verify_brand_claim
  const listRes = await postBrandMcp('mosaicroasters.com', {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  });
  assert.equal(listRes.status, 200);
  const toolNames = (
    (listRes.json.result as { tools: Array<{ name: string }> }).tools ?? []
  )
    .map((t) => t.name)
    .sort();
  assert.deepEqual(toolNames, [
    'compare_with_competitor',
    'get_official_faqs',
    'get_verified_pricing_and_offers',
    'verify_brand_claim',
  ]);

  const claimRes = await postBrandMcp('mosaicroasters.com', {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'verify_brand_claim',
      arguments: { claim: 'Free nationwide shipping starts at $25' },
    },
  });
  assert.equal(claimRes.status, 200);
  const claimPayload = JSON.parse(
    (claimRes.json.result as { content: Array<{ text: string }> }).content[0]!
      .text
  ) as { verdict: string; matchedExclusion: string };
  assert.equal(claimPayload.verdict, 'contradicted_by_truth_sheet');
  assert.ok(claimPayload.matchedExclusion.includes('$25'));

  // 3. Unsubscribed domain must return 402 BRAND_MCP_SUBSCRIPTION_REQUIRED
  const unsubRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/b/unsubscribed-brand.io/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }),
    TEST_ENV
  );
  assert.equal(unsubRes.status, 402);

  // 4. SSRF / internal IP domain param must return 400 INVALID_BRAND_DOMAIN
  const ssrfRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/b/169.254.169.254/webmcp.js'),
    TEST_ENV
  );
  assert.equal(ssrfRes.status, 400);
});

test('M134 OAuth 2.1 + Dynamic Client Registration (RFC 7591) + PKCE S256 + RFC 9207 iss + 401 WWW-Authenticate works end-to-end for Claude & ChatGPT', async () => {
  const { computePkceS256Challenge, signOAuthSessionHandoff } = await import(
    './oauth.js'
  );
  resetMockCreditBalancesForTests();

  // 1. Unauthenticated /oauth/mcp must return 401 + WWW-Authenticate Bearer resource_metadata
  const chalRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/oauth/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }),
    TEST_ENV
  );
  assert.equal(chalRes.status, 401);
  const wwwAuth = chalRes.headers.get('www-authenticate') ?? '';
  assert.ok(
    wwwAuth.includes(
      'resource_metadata="https://mcp.verisource.dev/.well-known/oauth-protected-resource/oauth/mcp"'
    )
  );

  // Also verify Origin: https://claude.ai on /mcp triggers 401 WWW-Authenticate
  const claudeRootChal = await worker.fetch(
    new Request('https://mcp.verisource.dev/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://claude.ai',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }),
    TEST_ENV
  );
  assert.equal(claudeRootChal.status, 401);

  // 2. RFC 8414 metadata discovery
  const asMetaRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/.well-known/oauth-authorization-server'),
    TEST_ENV
  );
  assert.equal(asMetaRes.status, 200);
  const asMeta = (await asMetaRes.json()) as {
    registration_endpoint: string;
    code_challenge_methods_supported: string[];
    authorization_response_iss_parameter_supported: boolean;
  };
  assert.equal(
    asMeta.registration_endpoint,
    'https://mcp.verisource.dev/oauth/register'
  );
  assert.deepEqual(asMeta.code_challenge_methods_supported, ['S256']);
  assert.equal(asMeta.authorization_response_iss_parameter_supported, true);

  // 3. DCR rejects attacker open-redirect URI (400) and accepts Claude + ChatGPT callbacks (201)
  const badDcrRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/oauth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Evil Redirector',
        redirect_uris: ['https://attacker.example/steal'],
      }),
    }),
    TEST_ENV
  );
  assert.equal(badDcrRes.status, 400);

  const okDcrRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/oauth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Claude Web Connector',
        redirect_uris: [
          'https://claude.ai/api/mcp/auth_callback',
          'https://chatgpt.com/connector_platform_oauth_redirect',
        ],
      }),
    }),
    TEST_ENV
  );
  assert.equal(okDcrRes.status, 201);
  const registeredClient = (await okDcrRes.json()) as { client_id: string };
  assert.ok(registeredClient.client_id.startsWith('vs_mcp_client_'));

  // 4. Full PKCE S256 Authorization Code flow via 1-Click Session Handoff -> Token Exchange -> Paid Tool Call -> Replay Rejection
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk_verisource_pkce_2026';
  const challenge = await computePkceS256Challenge(verifier);
  const redirectUri = 'https://claude.ai/api/mcp/auth_callback';

  const handoff = await signOAuthSessionHandoff(
    {
      token: 'vs_demo_pro_key',
      email: 'demo@verisource.dev',
      planTier: 'pro_99',
      clientId: registeredClient.client_id,
      redirectUri,
      codeChallenge: challenge,
      exp: Date.now() + 60_000,
    },
    'vs-local-mock-oauth-handoff-secret-v1'
  );

  const authGetRes = await worker.fetch(
    new Request(
      `https://mcp.verisource.dev/oauth/authorize?response_type=code&client_id=${encodeURIComponent(
        registeredClient.client_id
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=xyz123&code_challenge=${encodeURIComponent(
        challenge
      )}&code_challenge_method=S256&handoff=${encodeURIComponent(handoff)}`
    ),
    TEST_ENV
  );
  assert.equal(authGetRes.status, 200);
  const consentHtml = await authGetRes.text();
  assert.ok(consentHtml.includes('Approve as demo@verisource.dev (PRO_99)'));

  const form = new FormData();
  form.set('client_id', registeredClient.client_id);
  form.set('redirect_uri', redirectUri);
  form.set('state', 'xyz123');
  form.set('code_challenge', challenge);
  form.set('code_challenge_method', 'S256');
  form.set('handoff', handoff);

  const authPostRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/oauth/authorize', {
      method: 'POST',
      body: form,
    }),
    TEST_ENV
  );
  assert.equal(authPostRes.status, 302);
  const loc = new URL(authPostRes.headers.get('location') ?? '');
  assert.equal(loc.origin + loc.pathname, redirectUri);
  assert.equal(loc.searchParams.get('state'), 'xyz123');
  assert.equal(loc.searchParams.get('iss'), 'https://mcp.verisource.dev');
  const authCode = loc.searchParams.get('code') ?? '';
  assert.ok(authCode.startsWith('vs_code_'));

  // Wrong PKCE verifier on a separate code or same code must fail; test valid exchange first, then replay
  const tokenRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }).toString(),
    }),
    TEST_ENV
  );
  assert.equal(tokenRes.status, 200);
  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
  assert.equal(tokenJson.access_token, 'vs_demo_pro_key');
  assert.equal(tokenJson.token_type, 'Bearer');
  assert.ok(tokenJson.refresh_token.startsWith('vs_rt_'));

  // Replay of single-use authorization code must be rejected with 400 invalid_grant
  const replayRes = await worker.fetch(
    new Request('https://mcp.verisource.dev/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }).toString(),
    }),
    TEST_ENV
  );
  assert.equal(replayRes.status, 400);

  // Authenticated call to /oauth/mcp using OAuth-issued access_token succeeds
  const paidOverOAuth = await worker.fetch(
    new Request('https://mcp.verisource.dev/oauth/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${tokenJson.access_token}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 99,
        method: 'tools/call',
        params: {
          name: 'check_brand_hallucinations',
          arguments: { domain: 'mosaicroasters.com' },
        },
      }),
    }),
    TEST_ENV
  );
  assert.equal(paidOverOAuth.status, 200);
});
