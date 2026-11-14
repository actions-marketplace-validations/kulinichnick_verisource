import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  PATIENT_ZERO_DOMAINS,
  PATIENT_ZERO_FIXES,
  PATIENT_ZERO_PITCH_REPORT,
  PATIENT_ZERO_SNAPSHOTS,
  buildAgencyColdOutreachNote,
  buildHallucinationDriftAlert,
  buildImplementationBundleMarkdown,
  buildMcpDiscoveryManifest,
  buildShopifyCustomerEventsPixel,
  classifyAgentsMdContent,
  computeShopifyCheckoutKey,
  dispatchHallucinationDriftEmail,
  enforceQualityGate95,
  extractAlternateMarkdownHref,
  extractVerifiableTruthFromAlternateBody,
  generateMcpApiKey,
  gradeArtifactQuality,
  normalizePublicDomain,
  parseRobotsAiBotRules,
  runDomainReadinessScan,
  runFullGeoAudit,
  sha256Hex,
} from './index.js';

test('SSRF Guard rejects localhost, private IPs, and cloud metadata endpoints', () => {
  for (const blocked of [
    'http://localhost:3000',
    'http://127.0.0.1/admin',
    'http://169.254.169.254/latest/meta-data/',
    'https://192.168.1.10',
    'https://internal.local',
  ]) {
    assert.throws(
      () => normalizePublicDomain(blocked),
      /non-public|Invalid/i,
      `Expected ${blocked} to be rejected`
    );
  }

  const valid = normalizePublicDomain('www.AureaRoasters.com/collections');
  assert.equal(valid.origin, 'https://aurearoasters.com');
  assert.equal(valid.hostname, 'aurearoasters.com');
});

test('robots.txt parser handles wildcard and specific AI crawler overrides', () => {
  const sampleRobots = `
    User-agent: *
    Allow: /

    User-agent: PerplexityBot
    Disallow: /

    User-agent: GPTBot
    Allow: /
  `;
  const parsed = parseRobotsAiBotRules(sampleRobots);
  assert.equal(parsed.GPTBot, true);
  assert.equal(parsed.PerplexityBot, false);
  assert.equal(parsed.ClaudeBot, true);
});

test('9.5/10 Adversarial Quality Critic rejects AI-slop and sanitizes to >= 9.5', () => {
  const sloppyDraft = `# Brand Spec
In today's fast-paced digital landscape, we delve into a seamless, comprehensive framework to unlock powerful insights on https://aurearoasters.com/agents.md for GPTBot ($22.00 USD).`;

  const rawAudit = gradeArtifactQuality(sloppyDraft, 'agents_md');
  assert.equal(rawAudit.passed, false);
  assert.ok(rawAudit.score < 9.5, `Expected < 9.5, got ${rawAudit.score}`);
  assert.ok(rawAudit.violations.length >= 4);

  const cleaned = enforceQualityGate95(sloppyDraft, 'agents_md');
  assert.ok(
    cleaned.score >= 9.5,
    `Expected sanitized draft >= 9.5, got ${cleaned.score}`
  );
  assert.ok(!/delve|seamless|comprehensive|unlock/i.test(cleaned.content));
});

test('Patient Zero Full GEO Audit: Aurea Coffee Roasters (aurearoasters.com)', async () => {
  const result = await runFullGeoAudit({
    domainInput: 'aurearoasters.com',
    rawEnv: { PROVIDER_MODE: 'mock' },
  });

  assert.equal(result.brandName, 'Aurea Coffee Roasters');
  assert.equal(result.shopify.isShopify, true);
  assert.ok(
    result.allHallucinations.some((h) => /k-cup|pods|\$15/i.test(h.claim_text)),
    'Expected Hallucination Watchdog to flag false $15 K-Cup pod claim'
  );
  assert.ok(result.fixes.length >= 5);

  for (const fix of result.fixes) {
    assert.ok(
      fix.naturalQualityScore >= 9.5,
      `Fix ${fix.fixType} scored ${fix.naturalQualityScore} (< 9.5)`
    );
    if (fix.fixType === 'json_ld_schema') {
      const parsed = JSON.parse(fix.contentPayload) as Record<string, unknown>;
      assert.equal(parsed['@context'], 'https://schema.org');
    }
    if (fix.fixType === 'shopify_agents_liquid') {
      assert.ok(fix.contentPayload.includes('{{ shop.name }}'));
      assert.ok(fix.contentPayload.includes('/api/ucp/mcp'));
    }
  }
});

test('Patient Zero Full GEO Audit: Mosaic Coffee Roasters (mosaicroasters.com)', async () => {
  const result = await runFullGeoAudit({
    domainInput: 'mosaicroasters.com',
    rawEnv: { PROVIDER_MODE: 'mock' },
  });

  assert.equal(result.brandName, 'Mosaic Coffee Roasters');
  assert.equal(result.probe.robotsAiBotStatus.PerplexityBot, false);
  assert.equal(result.probe.robotsAiBotStatus.waf_blocked, true);
  assert.ok(
    result.allHallucinations.some((h) => /\$25|nationwide/i.test(h.claim_text)),
    'Expected Hallucination Watchdog to flag false $25 nationwide free shipping claim'
  );

  const jsonLdFix = result.fixes.find((f) => f.fixType === 'json_ld_schema');
  assert.ok(jsonLdFix, 'Expected JSON-LD fix for Mosaic');
  assert.ok(
    jsonLdFix.contentPayload.includes('GeoCircle'),
    'Expected GeoCircle schema for 25-mile Springfield, MO delivery zone'
  );

  const readiness = await runDomainReadinessScan('mosaicroasters.com', {
    PROVIDER_MODE: 'mock',
  });
  assert.ok(
    readiness.samplePromptResult.citedSourceUrlsBlurred.every((u) =>
      u.includes('locked-citation')
    ),
    'Expected Free Grader teaser URLs to be blurred'
  );
});

test('Web-Crypto MCP API Key generator & SHA-256 hash determinism', async () => {
  const generated = await generateMcpApiKey();
  assert.ok(/^vs_live_[0-9a-f]{48}$/.test(generated.rawKey));
  assert.equal(generated.keyPrefix.length, 14);
  const verifyHash = await sha256Hex(generated.rawKey);
  assert.equal(generated.keyHash, verifyHash);
});

test('schema.sql enforces RLS on all 8 tables, billing column protection trigger, and atomic RPCs', () => {
  const schemaPath = path.resolve(process.cwd(), '../../schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const tables = [
    'profiles',
    'domains',
    'tracked_prompts',
    'citation_snapshots',
    'generated_fixes',
    'agency_pitch_reports',
    'ai_attribution_events',
    'mcp_api_keys',
  ];

  for (const tbl of tables) {
    assert.ok(
      new RegExp(`alter\\s+table\\s+public\\.${tbl}\\s+enable\\s+row\\s+level\\s+security`, 'i').test(
        sql
      ),
      `Expected RLS enabled on public.${tbl}`
    );
  }

  assert.ok(sql.includes('trg_protect_profile_billing'));
  assert.ok(sql.includes("request.jwt.claim.role"));
  assert.ok(sql.includes('consume_mcp_credits('));
  assert.ok(sql.includes('consume_mcp_credits_for_user('));
  assert.ok(sql.includes('get_public_pitch_report('));
  assert.ok(sql.includes("^#[0-9A-Fa-f]{6}$"));
});

test('Agency cold-outreach note & downloadable implementation bundle pass >= 9.5/10 Critic', () => {
  const outreach = buildAgencyColdOutreachNote(PATIENT_ZERO_PITCH_REPORT);
  assert.ok(outreach.score >= 9.5, `Expected >=9.5, got ${outreach.score}`);
  assert.ok(
    outreach.content.includes(
      'https://verisource.dev/audit/mosaic-springfield-audit'
    )
  );
  assert.ok(outreach.content.includes('Mosaic Coffee Roasters'));

  const cleanReport = {
    ...PATIENT_ZERO_PITCH_REPORT,
    hallucination_count: 0,
    summary_payload: {
      ...PATIENT_ZERO_PITCH_REPORT.summary_payload,
      hallucination_examples: [],
    },
  };
  const outreachNoHallucination = buildAgencyColdOutreachNote(cleanReport);
  assert.ok(outreachNoHallucination.score >= 9.5);

  const bundleMd = buildImplementationBundleMarkdown({
    domain: PATIENT_ZERO_DOMAINS[0]!,
    fixes: PATIENT_ZERO_FIXES,
  });
  assert.ok(
    bundleMd.includes(
      '# Verisource GEO Implementation Bundle — Aurea Coffee Roasters'
    )
  );
  assert.ok(bundleMd.includes('templates/agents.md.liquid'));
});

test('Hallucination drift email alert builder & dry-run dispatcher pass >= 9.5/10 Critic', async () => {
  const mosaicDomain = PATIENT_ZERO_DOMAINS[1]!;
  const mosaicHallucinations = PATIENT_ZERO_SNAPSHOTS.filter(
    (s) => s.domain_id === mosaicDomain.id
  ).flatMap((s) => s.hallucination_details ?? []);

  const built = buildHallucinationDriftAlert({
    brandName: mosaicDomain.brand_name,
    domainUrl: mosaicDomain.domain_url,
    visibilityScore: mosaicDomain.visibility_score,
    accuracyScore: mosaicDomain.accuracy_score,
    hallucinations: mosaicHallucinations,
    blockedBots: ['PerplexityBot'],
    consoleBaseUrl: 'https://verisource.dev',
  });

  assert.ok(
    built.quality.score >= 9.5,
    `Expected drift alert >= 9.5, got ${built.quality.score}`
  );
  assert.ok(built.subject.includes('mosaicroasters.com'));
  assert.ok(
    built.text.includes('https://verisource.dev/dashboard?domain=mosaicroasters.com')
  );
  assert.ok(built.html.includes('VERISOURCE · HALLUCINATION DRIFT WATCHDOG'));

  const dryRun = await dispatchHallucinationDriftEmail({
    recipientEmail: 'founder@mosaicroasters.com',
    brandName: mosaicDomain.brand_name,
    domainUrl: mosaicDomain.domain_url,
    visibilityScore: mosaicDomain.visibility_score,
    accuracyScore: mosaicDomain.accuracy_score,
    hallucinations: [],
    blockedBots: [],
  });
  assert.equal(dryRun.delivered, false);
  assert.equal(dryRun.mode, 'preview_dry_run');
  assert.ok(dryRun.qualityScore >= 9.5);
});

test('MCP Registry discovery manifest & MCP_DIRECTORY_LAUNCH.md pass >= 9.5/10 Critic', () => {
  const manifest = buildMcpDiscoveryManifest();
  assert.equal(manifest.name, 'dev.verisource/mcp');
  assert.ok(manifest.description.length <= 100);
  assert.equal(manifest.remotes[0]?.type, 'streamable-http');
  assert.equal(manifest.remotes[0]?.url, 'https://mcp.verisource.dev/mcp');
  assert.equal(manifest.tools.length, 4);

  const manifestAudit = gradeArtifactQuality(manifest.description);
  assert.ok(
    manifestAudit.score >= 9.5,
    `Expected manifest description >= 9.5, got ${manifestAudit.score}`
  );

  const launchKitPath = path.resolve(
    process.cwd(),
    '../../MCP_DIRECTORY_LAUNCH.md'
  );
  const launchKitMd = fs.readFileSync(launchKitPath, 'utf8');
  const kitAudit = gradeArtifactQuality(launchKitMd, 'agents_md');
  assert.ok(
    kitAudit.score >= 9.5,
    `Expected MCP_DIRECTORY_LAUNCH.md >= 9.5, got ${kitAudit.score}: ${kitAudit.violations.join('; ')}`
  );
});

test('2026 Shopify stock /agents.md boilerplate classifier & Patient Zero deploy-packs pass >= 9.5/10 Critic', async () => {
  const realStockShopifyAgentsMd = `# Agent Instructions — Aurea Coffee Roasters
You can browse products and shop at Aurea Coffee Roasters's online store, https://aurearoasters.com, on your user's behalf. This guide covers the Shop skill and UCP integration, directly or through browser-based WebMCP tools.
## Shop skill — recommended
Use the [Shop skill](https://shop.com/SKILL.md) to help your user shop with this store.
## Store Policies
- **Shipping policy**: https://aurearoasters.com/policies/shipping-policy
## Platform
This store is built on [Shopify](https://www.shopify.com). The Shop skill at [https://shop.app/SKILL.md](https://shop.app/SKILL.md) works across every Shopify store.
- Start your own store: https://www.shopify.com/start
- Build and test against sample data: https://mock.shop`;

  assert.equal(
    classifyAgentsMdContent(realStockShopifyAgentsMd),
    'default_boilerplate'
  );

  const aureaKey = await computeShopifyCheckoutKey({
    domainId: '11111111-1111-4000-8000-000000000001',
    trackingPixelToken: 'aaaaaaaa-1111-4000-8000-000000000001',
  });
  assert.equal(aureaKey, 'e2b962fabcc3dc0ef625ae83');
  const pixelCode = buildShopifyCustomerEventsPixel({
    trackingPixelToken: 'aaaaaaaa-1111-4000-8000-000000000001',
    checkoutKey: aureaKey,
    ingestionUrl: 'https://verisource.dev/api/pixel',
  });
  assert.ok(pixelCode.includes("analytics.subscribe('checkout_completed'"));

  const packsRoot = path.resolve(process.cwd(), '../../deploy-packs');
  for (const storeDir of ['aurearoasters.com', 'mosaicroasters.com']) {
    const factsMd = fs.readFileSync(
      path.join(packsRoot, storeDir, 'page-ai-facts.md'),
      'utf8'
    );
    const factsAudit = gradeArtifactQuality(factsMd, 'agents_md');
    assert.ok(
      factsAudit.score >= 9.5,
      `Expected ${storeDir}/page-ai-facts.md >= 9.5, got ${factsAudit.score}: ${factsAudit.violations.join('; ')}`
    );
    assert.equal(classifyAgentsMdContent(factsMd), 'custom_enriched');

    const liquid = fs.readFileSync(
      path.join(packsRoot, storeDir, 'snippets-verisource-geo.liquid'),
      'utf8'
    );
    const jsonLdMatch = liquid.match(
      /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/
    );
    assert.ok(jsonLdMatch?.[1], `Expected JSON-LD block in ${storeDir} snippet`);
    const jsonLdAudit = gradeArtifactQuality(jsonLdMatch[1]!, 'json_ld_schema');
    assert.ok(
      jsonLdAudit.score >= 9.5,
      `Expected ${storeDir} JSON-LD >= 9.5, got ${jsonLdAudit.score}: ${jsonLdAudit.violations.join('; ')}`
    );
  }
});

test('Same-origin <link rel="alternate" type="text/markdown"> extractor upgrades Shopify truth overrides', () => {
  const sampleHead = `<!doctype html><html><head>
    <link href="https://aurearoasters.com/cdn/shop/files/aurea-verified-ai-facts.md" title="Aurea Truth" type="text/markdown" rel="alternate">
  </head><body></body></html>`;
  assert.equal(
    extractAlternateMarkdownHref(sampleHead),
    'https://aurearoasters.com/cdn/shop/files/aurea-verified-ai-facts.md'
  );

  const sampleShopifyPageHtml = `<!doctype html><html><head><title>Nav</title></head><body>
    <header>Cart (0)</header>
    <main>
      <article class="verisource-ai-facts">
        <h1>Mosaic Coffee Roasters — Verified Brand Truth</h1>
        <p>Free local delivery on orders of $45.00 USD or more within 25 miles of Springfield, MO.</p>
        <p>Exclusions: Mosaic does NOT offer $25 nationwide free shipping.</p>
      </article>
    </main>
    <footer>Start your own store: https://www.shopify.com/start</footer>
  </body></html>`;

  const extracted = extractVerifiableTruthFromAlternateBody(
    sampleShopifyPageHtml,
    'text/html; charset=utf-8'
  );
  assert.ok(extracted && !extracted.includes('shopify.com/start'));
  assert.equal(classifyAgentsMdContent(extracted), 'custom_enriched');
});
