import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  PATIENT_ZERO_DOMAINS,
  PATIENT_ZERO_FIXES,
  PATIENT_ZERO_PITCH_REPORT,
  PATIENT_ZERO_SNAPSHOTS,
  CompetitorXrayError,
  SubPageInspectionError,
  VERISOURCE_VERSION,
  analyzeCrawlerHtmlReadability,
  analyzeHtmlForBotExtraction,
  buildAgencyColdOutreachNote,
  buildAgencyColdOutreachSequence,
  buildAgencyPartnerBatchCsv,
  buildAgencyPartnerOutreachNote,
  buildAgencyPartnerOutreachSequence,
  buildAgencyPartnerPlaybookMarkdown,
  buildAgencyPitchPayload,
  buildAiRemediationMasterPrompt,
  buildBatchOutreachCsv,
  buildBatchOutreachMarkdown,
  buildCitationAnswerPageBundle,
  buildCitationGapActionPlaybookMarkdown,
  buildEdgeBotCrawlerSnippet,
  buildExecutiveAuditReportMarkdown,
  buildHallucinationDriftAlert,
  buildImplementationBundleMarkdown,
  buildLocalServiceBatchCsv,
  buildLocalServiceOutreachSequence,
  buildLocalServicePlaybookMarkdown,
  buildMcpDiscoveryManifest,
  buildPostPurchaseWelcomeAlert,
  buildProspectOpenAlert,
  buildShopifyCustomerEventsPixel,
  buildTargetedCitationOutreachDraft,
  buildWeeklyExecutiveDigest,
  classifyAgentsMdContent,
  classifyCitationSourceCategory,
  classifyIndustryVertical,
  classifyPitchShowcaseBucket,
  classifyPromptIntent,
  computeScoreDeltaSummary,
  computeShopifyCheckoutKey,
  dispatchHallucinationDriftEmail,
  dispatchPostPurchaseWelcomeEmail,
  dispatchProspectOpenEmail,
  dispatchWeeklyExecutiveDigestEmail,
  enforceQualityGate95,
  evaluateCommerceAttributeReadiness,
  extractAlternateMarkdownHref,
  extractBrandNameFromTitle,
  extractCleanCategoryTopic,
  extractColdOutreachParts,
  extractCompetingHostsFromCitations,
  extractCompetitorsFromAnswerAndCitations,
  extractVerifiableTruthFromAlternateBody,
  generateDefaultPromptsForDomain,
  generateMcpApiKey,
  generateSuggestedBuyerPrompts,
  gradeArtifactQuality,
  isAutomatedPreviewBot,
  isFixTypeLiveOnDomain,
  normalizeAiBotCrawlerSource,
  normalizePublicDomain,
  parseBatchProspectDomains,
  parsePerplexityAgentResponse,
  parseRobotsAiBotRules,
  rankCitationGapSources,
  resolveInitialDomainScoreDeltas,
  resolveSafeSameDomainTargetUrl,
  runCompetitorTechnicalXray,
  runDomainReadinessScan,
  runFullGeoAudit,
  runPerplexityAgentQuery,
  summarizeBrandSentimentAndSov,
  summarizeEngineCitationShare,
  sanitizeCsvCell,
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
  assert.equal(manifest.documentationUrl, 'https://verisource.dev/mcp-guide');
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

test('Batch prospect parser, SSRF guard, CSV formula-injection defense & Outreach Playbook pass >= 9.5/10 Critic', () => {
  const parsed = parseBatchProspectDomains(
    'https://www.AureaRoasters.com/collections\nmosaicroasters.com, aurearoasters.com; https://linear.app'
  );
  assert.deepEqual(parsed, [
    'aurearoasters.com',
    'mosaicroasters.com',
    'linear.app',
  ]);

  assert.throws(
    () => parseBatchProspectDomains('aurearoasters.com\n169.254.169.254'),
    /non-public/i
  );
  assert.throws(
    () => parseBatchProspectDomains(['a.com', 'b.com', 'c.com'], 2),
    /Batch limit exceeded/i
  );

  assert.equal(sanitizeCsvCell("=CMD|' /C calc'!A0"), `"'=CMD|' /C calc'!A0"`);
  assert.equal(sanitizeCsvCell('Mosaic "Roasters"'), '"Mosaic ""Roasters"""');

  const secondReport = {
    ...PATIENT_ZERO_PITCH_REPORT,
    id: '22222222-2222-4000-8000-000000000002',
    share_slug: 'aurearoasters-com-vf9w',
    prospect_domain: 'https://aurearoasters.com',
    prospect_brand_name: 'Aurea Coffee Roasters',
    visibility_score: 41,
    hallucination_count: 1,
  };

  const parts = extractColdOutreachParts(PATIENT_ZERO_PITCH_REPORT);
  assert.ok(parts.subject.includes('Mosaic Coffee Roasters'));
  assert.ok(parts.body.includes('https://verisource.dev/audit/mosaic-springfield-audit'));
  assert.ok(parts.qualityScore >= 9.5);

  const csv = buildBatchOutreachCsv([PATIENT_ZERO_PITCH_REPORT, secondReport]);
  assert.ok(
    csv.startsWith(
      'prospect_brand_name,prospect_domain,visibility_score,hallucination_count,competitors_winning,audit_share_url,email_subject,email_body,quality_gate_score,followup_day3_body,followup_day7_body\n'
    )
  );
  assert.ok(csv.includes('mosaic-springfield-audit'));
  assert.ok(csv.includes('aurearoasters-com-vf9w'));

  const playbook = buildBatchOutreachMarkdown([
    PATIENT_ZERO_PITCH_REPORT,
    secondReport,
  ]);
  assert.ok(
    playbook.score >= 9.5,
    `Expected batch outreach playbook >= 9.5, got ${playbook.score}: ${playbook.violations.join('; ')}`
  );
  const playbookAudit = gradeArtifactQuality(playbook.content, 'agents_md');
  assert.ok(
    playbookAudit.score >= 9.5,
    `Expected playbook Markdown H1 & craft >= 9.5, got ${playbookAudit.score}: ${playbookAudit.violations.join('; ')}`
  );
});

test('Live grounding citation rival extractor & non-fixture cold outreach avoid synthetic peer placeholders', async () => {
  const rivals = extractCompetingHostsFromCitations(
    'aurearoasters.com',
    [
      'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc123',
      'https://www.onyxcoffeelab.com/collections/coffee',
      'https://aurearoasters.com/products/st-michael',
      'https://www.reddit.com/r/Coffee/comments/specialty',
      'https://www.google.com/search?q=coffee',
    ],
    ['sprudge.com', 'aurearoasters.com', 'Specialty Coffee Guide']
  );
  assert.deepEqual(rivals, ['sprudge.com', 'onyxcoffeelab.com', 'reddit.com']);

  const nonFixtureAudit = await runFullGeoAudit({
    domainInput: 'linear.app',
    skipDirectHttpProbe: true,
    rawEnv: { PROVIDER_MODE: 'mock' },
  });
  assert.ok(
    nonFixtureAudit.pitchSummaryPayload.competitors_winning.every(
      (c) => !c.includes('Category Peer #')
    ),
    'Expected zero synthetic Category Peer # strings in pitch payload'
  );
  const note = buildAgencyColdOutreachNote({
    id: '33333333-3333-4000-8000-000000000003',
    agency_user_id: '00000000-0000-4000-8000-000000000001',
    share_slug: 'linear-app-test',
    prospect_domain: nonFixtureAudit.domainUrl,
    prospect_brand_name: nonFixtureAudit.brandName,
    visibility_score: nonFixtureAudit.visibilityScore,
    hallucination_count: nonFixtureAudit.allHallucinations.length,
    agency_brand_name_snapshot: 'Verisource GEO Advisory',
    agency_logo_url_snapshot: null,
    agency_primary_color_snapshot: '#0A0E17',
    agency_cta_url_snapshot: 'https://verisource.dev/pricing',
    summary_payload: nonFixtureAudit.pitchSummaryPayload,
    views_count: 0,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
  });
  assert.ok(!note.content.includes('Category Peer #'));
  assert.ok(note.score >= 9.5);
});

test('Prospect open alert builder, dry-run dispatcher & unfurl bot filter pass >= 9.5/10 Critic', async () => {
  for (const botUa of [
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'LinkedInBot/1.0 (compatible; Mozilla/5.0)',
    'Twitterbot/1.0',
    'Discordbot/2.0',
    'GPTBot/1.0',
    'curl/8.5.0',
    '',
  ]) {
    assert.equal(
      isAutomatedPreviewBot(botUa),
      true,
      `Expected ${botUa || '<empty>'} to be filtered as bot`
    );
  }

  assert.equal(
    isAutomatedPreviewBot(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    ),
    false
  );

  const openAlert = buildProspectOpenAlert({
    prospectBrandName: 'Onyx Coffee Lab',
    prospectDomain: 'https://onyxcoffeelab.com',
    shareSlug: 'onyxcoffeelab-com-8m6s',
    visibilityScore: 55,
    hallucinationCount: 0,
    viewsCount: 1,
    topGap:
      'Storefront serves generic Shopify boilerplate /agents.md without verified brand pricing or shipping exclusions.',
  });
  assert.ok(openAlert.subject.includes('[Hot Lead] Onyx Coffee Lab'));
  assert.ok(
    openAlert.quality.score >= 9.5,
    `Expected open alert score >= 9.5, got ${openAlert.quality.score}`
  );

  const dryDispatch = await dispatchProspectOpenEmail({
    recipientEmail: 'agency@verisource.dev',
    prospectBrandName: 'Onyx Coffee Lab',
    prospectDomain: 'https://onyxcoffeelab.com',
    shareSlug: 'onyxcoffeelab-com-8m6s',
    visibilityScore: 55,
    hallucinationCount: 0,
    viewsCount: 3,
  });
  assert.equal(dryDispatch.mode, 'preview_dry_run');
  assert.ok(dryDispatch.subject.includes('[Repeat Visit · 3x]'));
  assert.ok(dryDispatch.qualityScore >= 9.5);
});

test('Post-purchase welcome & magic-link Fix Bundle alert passes >= 9.5/10 Critic', async () => {
  const tripwireAlert = buildPostPurchaseWelcomeAlert({
    planTier: 'tripwire_19',
    targetDomain: 'onyxcoffeelab.com',
    visibilityScore: 55,
    fixCount: 5,
    magicLinkUrl:
      'https://verisource.dev/auth/v1/verify?token=magic_test&redirect_to=https://verisource.dev/dashboard',
  });
  assert.ok(tripwireAlert.subject.includes('[Fix Pack Ready] onyxcoffeelab.com'));
  assert.ok(tripwireAlert.html.includes('One-Click Sign In & Open Tab 2 Fixes'));
  assert.ok(
    tripwireAlert.quality.score >= 9.5,
    `Expected post-purchase alert >= 9.5, got ${tripwireAlert.quality.score}`
  );

  const proWelcome = await dispatchPostPurchaseWelcomeEmail({
    recipientEmail: 'buyer@onyxcoffeelab.com',
    planTier: 'pro_99',
    targetDomain: 'onyxcoffeelab.com',
    visibilityScore: 55,
    fixCount: 5,
  });
  assert.equal(proWelcome.mode, 'preview_dry_run');
  assert.ok(proWelcome.actionUrl.includes('tab=tab2_fixes'));
  assert.ok(proWelcome.actionUrl.includes('domain=onyxcoffeelab.com'));
  assert.ok(proWelcome.qualityScore >= 9.5);
});

test('Agency Partner ($249/mo) outreach note, CSV & Playbook pass >= 9.5/10 Critic', () => {
  assert.equal(
    extractBrandNameFromTitle(
      'Full-Service GEO Agency for Brands - Siege Media',
      'siegemedia.com',
      'Siegemedia'
    ),
    'Siege Media'
  );
  assert.equal(
    extractBrandNameFromTitle(
      'Organic Growth Agency for B2B Brands | Omniscient Digital',
      'omniscientdigital.com',
      'Omniscientdigital'
    ),
    'Omniscient Digital'
  );
  assert.equal(
    extractBrandNameFromTitle(
      'Full-Service GEO Agency for Brands',
      'siegemedia.com',
      'Siegemedia',
      [
        { '@type': 'WebPage', name: 'Full-Service GEO Agency for Brands' },
        { '@type': 'Organization', name: 'Siege Media' },
      ]
    ),
    'Siege Media'
  );
  assert.equal(
    extractBrandNameFromTitle(
      'Just a moment...',
      'coalitiontechnologies.com',
      'Coalition Technologies'
    ),
    'Coalition Technologies'
  );

  const partnerReport = {
    ...PATIENT_ZERO_PITCH_REPORT,
    prospect_brand_name: 'Siege Media',
    prospect_domain: 'https://siegemedia.com',
    share_slug: 'siegemedia-com-demo',
    visibility_score: 62,
  };

  const partnerNote = buildAgencyPartnerOutreachNote(partnerReport);
  assert.ok(partnerNote.content.includes('https://verisource.dev/agencies'));
  assert.ok(partnerNote.content.includes('$249/mo'));
  assert.ok(
    partnerNote.score >= 9.5,
    `Expected agency partner note >= 9.5, got ${partnerNote.score}`
  );

  const partnerCsv = buildAgencyPartnerBatchCsv([partnerReport]);
  assert.ok(partnerCsv.startsWith('agency_prospect_name,agency_domain,'));
  assert.ok(partnerCsv.includes('siegemedia-com-demo'));

  const partnerPlaybook = buildAgencyPartnerPlaybookMarkdown([partnerReport]);
  assert.ok(
    partnerPlaybook.score >= 9.5,
    `Expected agency partner playbook >= 9.5, got ${partnerPlaybook.score}`
  );
  const partnerMarkdownAudit = gradeArtifactQuality(
    partnerPlaybook.content,
    'agents_md'
  );
  assert.ok(partnerMarkdownAudit.score >= 9.5);
});

test('3-Touch Cold Outreach Sequence Engine (Day 0 / Day 3 / Day 7) passes >= 9.5/10 Critic for Brand & Agency cohorts', () => {
  const brandSeq = buildAgencyColdOutreachSequence({
    ...PATIENT_ZERO_PITCH_REPORT,
    agency_brand_name_snapshot: 'Verisource GEO Advisory',
    prospect_brand_name: 'Onyx Coffee Lab',
    prospect_domain: 'https://onyxcoffeelab.com',
    share_slug: 'onyxcoffeelab-com-8m6s',
    visibility_score: 55,
  });

  assert.ok(brandSeq.day0.score >= 9.5);
  assert.ok(brandSeq.day3.score >= 9.5);
  assert.ok(brandSeq.day7.score >= 9.5);
  assert.ok(brandSeq.day3.content.includes('Subject: Re:'));
  assert.ok(
    brandSeq.day7.content.includes(
      '/api/checkout?plan=tripwire_19&cycle=one_time&domain=onyxcoffeelab.com'
    )
  );

  const whiteLabelSeq = buildAgencyColdOutreachSequence({
    ...PATIENT_ZERO_PITCH_REPORT,
    agency_brand_name_snapshot: 'Northstar Search Studio',
    agency_cta_url_snapshot: 'https://cal.com/northstar/ai-audit',
  });
  assert.ok(whiteLabelSeq.day7.score >= 9.5);
  assert.ok(
    whiteLabelSeq.day7.content.includes('https://cal.com/northstar/ai-audit')
  );

  const brandCsv = buildBatchOutreachCsv([PATIENT_ZERO_PITCH_REPORT]);
  assert.ok(brandCsv.includes('followup_day3_body,followup_day7_body'));

  const partnerSeq = buildAgencyPartnerOutreachSequence({
    ...PATIENT_ZERO_PITCH_REPORT,
    prospect_brand_name: 'Siege Media',
    prospect_domain: 'https://siegemedia.com',
    share_slug: 'siegemedia-com-80yf',
    visibility_score: 46,
  });
  assert.ok(partnerSeq.day0.score >= 9.5);
  assert.ok(partnerSeq.day3.score >= 9.5);
  assert.ok(partnerSeq.day7.score >= 9.5);
  assert.ok(partnerSeq.day7.content.includes('/dashboard?tab=tab3_offsite'));
});

test('High-Ticket Local Service vertical schema classifier & Cohort 03 3-touch outreach pass >= 9.5/10 Critic', () => {
  assert.equal(
    classifyIndustryVertical({
      hostname: 'lanierlawfirm.com',
      brandName: 'The Lanier Law Firm',
      coreOffering: 'Personal injury and trial law firm representing plaintiffs nationwide.',
    }).schemaOrgType,
    'LegalService'
  );
  assert.equal(
    classifyIndustryVertical({
      hostname: 'hellotend.com',
      brandName: 'Tend Dental',
      coreOffering: 'Modern dental studios for cleanings, Invisalign, and implants.',
    }).schemaOrgType,
    'Dentist'
  );
  assert.equal(
    classifyIndustryVertical({
      hostname: 'everbody.com',
      brandName: 'Ever / Body',
      coreOffering: 'Cosmetic dermatology and medical aesthetic clinics for laser and Botox.',
    }).schemaOrgType,
    'MedicalBusiness'
  );
  assert.equal(
    classifyIndustryVertical({
      hostname: 'bakerroofing.com',
      brandName: 'Baker Roofing Company',
      coreOffering: 'Commercial roofing contractor and storm restoration.',
    }).schemaOrgType,
    'RoofingContractor'
  );
  assert.equal(
    classifyIndustryVertical({
      hostname: 'horizonservices.com',
      brandName: 'Horizon',
      coreOffering: 'AC, heating, HVAC, and plumbing home services.',
    }).schemaOrgType,
    'HVACBusiness'
  );

  const localReport = {
    ...PATIENT_ZERO_PITCH_REPORT,
    prospect_brand_name: 'Tend Dental',
    prospect_domain: 'https://hellotend.com',
    share_slug: 'hellotend-com-demo',
    visibility_score: 48,
  };
  const localSeq = buildLocalServiceOutreachSequence(localReport);
  assert.ok(localSeq.day0.score >= 9.5);
  assert.ok(localSeq.day3.score >= 9.5);
  assert.ok(localSeq.day7.score >= 9.5);
  assert.ok(localSeq.day3.content.includes('LocalBusiness schema.org JSON-LD'));
  assert.ok(localSeq.day7.content.includes('plan=tripwire_19'));

  const localCsv = buildLocalServiceBatchCsv([localReport]);
  assert.ok(localCsv.startsWith('local_group_name,group_domain,'));
  assert.ok(localCsv.includes('followup_day3_body,followup_day7_body'));

  const localPlaybook = buildLocalServicePlaybookMarkdown([localReport]);
  assert.ok(localPlaybook.score >= 9.5);
});

test('Weekly Executive Client Digest (Pro & White-Label Agency modes + XSS CTA guard) passes >= 9.5/10 Critic', async () => {
  const proDigest = buildWeeklyExecutiveDigest({
    brandName: 'Aurea Coffee Roasters',
    domainUrl: 'https://aurearoasters.com',
    visibilityScore: 92,
    previousVisibilityScore: 41,
    accuracyScore: 100,
    enginesCitingCount: 3,
    totalSnapshotsScanned: 3,
    aiReferralVisits7d: 14,
    aiReferralRevenueUsd7d: 219.9,
    appliedFixesCount: 5,
    totalFixesCount: 5,
    activeHallucinationCount: 0,
    blockedBots: [],
    topRivalDomains: ['onyxcoffeelab.com', 'bluebottlecoffee.com'],
  });
  assert.equal(proDigest.scoreDelta, 51);
  assert.equal(proDigest.isWhiteLabel, false);
  assert.ok(proDigest.subject.includes('+51 pts'));
  assert.ok(proDigest.html.includes('VERISOURCE · WEEKLY EXECUTIVE GEO DIGEST'));
  assert.ok(
    proDigest.quality.score >= 9.5,
    `Expected Pro weekly digest >= 9.5, got ${proDigest.quality.score}`
  );

  const agencyDispatch = await dispatchWeeklyExecutiveDigestEmail({
    recipientEmail: 'client@hellotend.com',
    brandName: 'Tend Dental',
    domainUrl: 'https://hellotend.com',
    visibilityScore: 68,
    previousVisibilityScore: 46,
    accuracyScore: 95,
    enginesCitingCount: 2,
    totalSnapshotsScanned: 3,
    aiReferralVisits7d: 9,
    aiReferralRevenueUsd7d: 0,
    appliedFixesCount: 4,
    totalFixesCount: 5,
    activeHallucinationCount: 1,
    blockedBots: ['ClaudeBot'],
    agencyBrandName: 'Northstar Search Studio',
    agencyPrimaryColor: '#1E293B',
    agencyCtaUrl: 'javascript:alert(1)',
  });
  assert.equal(agencyDispatch.mode, 'preview_dry_run');
  assert.equal(agencyDispatch.isWhiteLabel, true);
  assert.equal(agencyDispatch.scoreDelta, 22);
  assert.ok(
    agencyDispatch.html.includes(
      'NORTHSTAR SEARCH STUDIO · WEEKLY AI SEARCH CLIENT DIGEST'
    )
  );
  assert.ok(!agencyDispatch.html.includes('javascript:alert'));
  assert.ok(agencyDispatch.qualityScore >= 9.5);
});

test('Perplexity Agent API SDK adapter parses output_text, search_results queries, annotations & retries 429 Retry-After', async () => {
  const prevEnvKey = process.env.PERPLEXITY_API_KEY;
  delete process.env.PERPLEXITY_API_KEY;
  try {
    await assert.rejects(
      () => runPerplexityAgentQuery({ input: 'Test missing key' }),
      /console\.perplexity\.ai/
    );
  } finally {
    if (prevEnvKey !== undefined) {
      process.env.PERPLEXITY_API_KEY = prevEnvKey;
    }
  }

  let fetchCalls = 0;
  let capturedBody: Record<string, unknown> | null = null;
  const mockFetch: typeof fetch = async (_input, init) => {
    fetchCalls += 1;
    if (init?.body && typeof init.body === 'string') {
      capturedBody = JSON.parse(init.body) as Record<string, unknown>;
    }
    if (fetchCalls === 1) {
      return new Response(
        JSON.stringify({
          error: {
            type: 'request_rate_limit_exceeded',
            message: 'Rate limit exceeded (1 QPS)',
          },
        }),
        {
          status: 429,
          headers: {
            'content-type': 'application/json',
            'retry-after': '0',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        id: 'resp_pplx_agent_test_01',
        object: 'response',
        created_at: 1794643000,
        status: 'completed',
        model: 'openai/gpt-6-luna',
        effort: 'fast@2026-11-11.0',
        output: [
          {
            type: 'search_results',
            queries: [
              'mosaicroasters.com single origin coffee pricing',
              'best specialty coffee roasters Springfield MO delivery',
            ],
            results: [
              {
                id: 1,
                url: 'https://mosaicroasters.com/pages/ai-facts',
                title: 'Mosaic Coffee Roasters — Verified Facts',
                snippet: 'Single-origin specialty coffee roasted in Springfield, MO.',
              },
              {
                id: 2,
                url: 'https://onyxcoffeelab.com/collections/coffee',
                title: 'Onyx Coffee Lab',
                snippet: 'Specialty whole bean coffee.',
              },
            ],
          },
          {
            type: 'message',
            id: 'msg_01',
            role: 'assistant',
            status: 'completed',
            content: [
              {
                type: 'output_text',
                text: 'Mosaic Coffee Roasters offers single-origin beans with free local delivery within 25 miles of Springfield, MO on $45+ orders[1].',
                annotations: [
                  {
                    type: 'url_citation',
                    url: 'https://mosaicroasters.com/pages/ai-facts',
                    title: 'Mosaic Coffee Roasters — Verified Facts',
                    start_index: 120,
                    end_index: 123,
                  },
                ],
              },
            ],
          },
        ],
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  };

  const result = await runPerplexityAgentQuery({
    input: 'Mosaic Coffee Roasters pricing and local delivery',
    apiKey: 'test_unit_only_not_a_real_secret',
    effort: 'fast',
    fetchImpl: mockFetch,
  });

  assert.equal(fetchCalls, 2, 'Expected 1 retry after 429 with Retry-After');
  assert.ok(capturedBody);
  assert.equal((capturedBody as Record<string, unknown>).effort, 'fast');
  assert.deepEqual((capturedBody as Record<string, unknown>).tools, [
    { type: 'web_search' },
  ]);
  assert.equal(result.fanoutTelemetryType, 'observed_query');
  assert.deepEqual(result.decompiledFanoutQueries, [
    'mosaicroasters.com single origin coffee pricing',
    'best specialty coffee roasters Springfield MO delivery',
  ]);
  assert.equal(
    result.citedUrls[0],
    'https://mosaicroasters.com/pages/ai-facts'
  );
  assert.ok(result.citedUrls.includes('https://onyxcoffeelab.com/collections/coffee'));
  assert.ok(result.outputText.includes('Mosaic Coffee Roasters'));

  const citedOnly = parsePerplexityAgentResponse({
    id: 'resp_02',
    object: 'response',
    created_at: 1794643001,
    status: 'completed',
    model: 'openai/gpt-6-luna',
    output_text: 'Answer with citations only.',
    output: [
      {
        type: 'search_results',
        results: [
          {
            id: 1,
            url: 'https://verisource.dev',
            title: 'Verisource',
            snippet: 'GEO & MCP intelligence.',
          },
        ],
      },
    ],
  });
  assert.equal(citedOnly.fanoutTelemetryType, 'cited_source_only');
  assert.equal(citedOnly.decompiledFanoutQueries.length, 0);
});

test('Natural buyer prompt extractor, rival brand vs. directory separator & live fix deployment classifier work cleanly', () => {
  // 1. Raycast meta description previously cut mid-word at 72 chars ("...extendable lau")
  const raycastTopic = extractCleanCategoryTopic(
    'A collection of powerful productivity tools all within an extendable launcher. Fast, ergonomic and reliable.',
    'Raycast'
  );
  assert.ok(raycastTopic.length > 0 && raycastTopic.length <= 54);
  assert.ok(
    !raycastTopic.endsWith(' lau'),
    `Expected whole-word boundary without mid-word "lau", got: "${raycastTopic}"`
  );
  assert.ok(raycastTopic.includes('productivity tools'));

  const raycastPrompts = generateDefaultPromptsForDomain(
    normalizePublicDomain('raycast.com'),
    'Raycast',
    'A collection of powerful productivity tools all within an extendable launcher.',
    false
  );
  assert.equal(raycastPrompts.length, 3);
  assert.ok(!raycastPrompts[0]!.includes('extendable lau '));
  assert.ok(raycastPrompts[0]!.includes('Raycast'));

  // 2. Rival brand extraction separates real product peers from G2/directories/listicles
  const rivals = extractCompetitorsFromAnswerAndCitations({
    targetHostname: 'posthog.com',
    brandName: 'PostHog',
    answerText: [
      'Top alternatives to PostHog for product analytics and feature flags:',
      '1. **Amplitude** — Enterprise product analytics and behavioral cohorts.',
      '2. **Mixpanel** — Self-serve event analytics with transparent funnel reports.',
      '3. **GrowthBook** — Open-source feature flagging and experimentation.',
      '4. **PostHog** — All-in-one developer suite.',
    ].join('\n'),
    urls: [
      'https://g2.com/products/posthog/competitors/alternatives',
      'https://thedigitalprojectmanager.com/tools/posthog-alternatives/',
      'https://directree.io/software/analytics',
      'https://toolifynav.com/tool/posthog',
      'https://saaspic.com/posthog',
      'https://statsig.com/comparisons/posthog',
    ],
  });
  assert.ok(rivals.includes('Amplitude'));
  assert.ok(rivals.includes('Mixpanel'));
  assert.ok(rivals.includes('GrowthBook'));
  assert.ok(!rivals.includes('PostHog'));
  assert.ok(!rivals.includes('g2.com'));
  assert.ok(!rivals.includes('thedigitalprojectmanager.com'));
  assert.ok(!rivals.includes('directree.io'));
  assert.ok(!rivals.includes('toolifynav.com'));
  assert.ok(!rivals.includes('saaspic.com'));

  // 3. Live on-site fix classifier accurately identifies deployed JSON-LD, /llms.txt, /agents.md & FAQPage
  const mockDomain = normalizePublicDomain('aurearoasters.com');
  const liveProbe = {
    domain: mockDomain,
    reachable: true,
    httpStatus: 200,
    title: 'Aurea Coffee Roasters',
    metaDescription: 'Luxury specialty coffee.',
    jsonLdBlocks: [
      { '@type': 'Organization', name: 'Aurea Coffee Roasters' },
      { '@type': 'FAQPage', mainEntity: [] },
    ],
    robotsAiBotStatus: {
      GPTBot: true,
      'OAI-SearchBot': true,
      PerplexityBot: true,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: false,
    },
    llmsTxtStatus: 'present' as const,
    llmsTxtExcerpt: '# Aurea Coffee Roasters',
    agentsMdRaw: '# Aurea Coffee Roasters\nPricing: $22-$28',
    agentsMdInitialStatus: 'custom_enriched' as const,
    htmlSignalsShopify: true,
    extractedPriceMentions: ['$24.00'],
    extractedShippingMentions: ['Free shipping over $50'],
  };
  const liveShopify = {
    isShopify: true,
    shopifyMcpStatus: 'ucp_active' as const,
    activeMcpEndpoint: 'https://aurearoasters.com/api/ucp/mcp',
    exposedMcpTools: ['search_shop_catalog'],
    agentsMdStatus: 'custom_enriched' as const,
    catalogSkus: [],
    priceRangeSummary: '$22.00 - $28.00',
  };

  assert.equal(
    isFixTypeLiveOnDomain('json_ld_schema', liveProbe, liveShopify),
    true
  );
  assert.equal(isFixTypeLiveOnDomain('llms_txt', liveProbe, liveShopify), true);
  assert.equal(
    isFixTypeLiveOnDomain('shopify_agents_liquid', liveProbe, liveShopify),
    true
  );
  assert.equal(
    isFixTypeLiveOnDomain('fanout_faq_block', liveProbe, liveShopify),
    true
  );
  assert.equal(
    isFixTypeLiveOnDomain('citation_outreach_brief', liveProbe, liveShopify),
    false
  );
});

test('buildAgencyPitchPayload strips mock/generic rival placeholders when live rivals exist and deduplicates root brands', () => {
  const payload = buildAgencyPitchPayload({
    brandName: 'Resend',
    robotsAiBotStatus: {
      GPTBot: true,
      'OAI-SearchBot': true,
      PerplexityBot: true,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: false,
    },
    llmsTxtStatus: 'present',
    agentsMdStatus: 'missing',
    isShopify: false,
    shopifyMcpStatus: 'unavailable',
    jsonLdCount: 2,
    scanResults: [
      {
        promptText: 'Best developer email APIs — how does Resend compare to top alternatives?',
        aiEngine: 'perplexity',
        brandMentioned: true,
        citationRank: 1,
        competitorsMentioned: ['Postmark', 'SendGrid', 'Amazon SES'],
        citedSourceUrls: ['https://postmarkapp.com'],
        decompiledFanoutQueries: ['resend vs postmark pricing'],
        fanoutTelemetryType: 'observed_query',
        hallucinationDetected: false,
        hallucinationDetails: [],
        rawAnswerExcerpt: 'Resend competes with Postmark, SendGrid, and Amazon SES.',
      },
      {
        promptText: 'Resend reviews and pricing',
        aiEngine: 'gemini',
        brandMentioned: true,
        citationRank: 2,
        competitorsMentioned: [
          'postmarkapp.com',
          'reddit.com buyer threads',
          'editorial comparison guides',
        ],
        citedSourceUrls: [],
        decompiledFanoutQueries: [],
        fanoutTelemetryType: 'observed_query',
        hallucinationDetected: false,
        hallucinationDetails: [],
        rawAnswerExcerpt: 'Resend offers transactional email.',
      },
      {
        promptText: 'Top alternatives to Resend',
        aiEngine: 'chatgpt',
        brandMentioned: false,
        citationRank: null,
        competitorsMentioned: [
          'Top Resend Category Peer #1',
          'Top Resend Category Peer #2',
        ],
        citedSourceUrls: [],
        decompiledFanoutQueries: [],
        fanoutTelemetryType: 'mock_fixture',
        hallucinationDetected: false,
        hallucinationDetails: [],
        rawAnswerExcerpt: 'Mock fallback.',
      },
    ],
    allHallucinations: [],
  });

  assert.deepEqual(payload.competitors_winning, [
    'Postmark',
    'SendGrid',
    'Amazon SES',
  ]);
  assert.ok(
    !payload.competitors_winning.some((r) => /Category Peer|reddit\.com buyer/i.test(r))
  );

  const dentalPrompts = generateDefaultPromptsForDomain(
    normalizePublicDomain('hellotend.com'),
    'Tend Dental',
    'Modern dental studio for cleanings, Invisalign, and implants.',
    false
  );
  assert.ok(dentalPrompts[0]!.includes('alternatives'));

  // Markdown table header rows (`| Service |`, `| Agency |`) and treatment/menu tables (`| Need |`, `| Botox/Dysport |`) never leak as rival brands
  const tableRivals = extractCompetitorsFromAnswerAndCitations({
    targetHostname: 'ovme.com',
    brandName: 'OVME',
    answerText: [
      '| Treatment | Member Price |',
      '| --- | --- |',
      '| Botox/Dysport | $12/unit |',
      '| Dermal filler | $650 |',
      '',
      '| Clinic | Positioning |',
      '| --- | --- |',
      '| OVME | Membership aesthetics |',
      '| SkinSpirit | Medical-grade injectables |',
      '| LaserAway | Laser hair removal & skin |',
    ].join('\n'),
    urls: [
      'https://amazon.com/dp/B001',
      'https://apps.apple.com/us/app/ovme/id123',
      'https://martindale.com/organization/firm',
      'https://citehawk.com/ovme',
    ],
  });
  assert.deepEqual(tableRivals, ['SkinSpirit', 'LaserAway']);

  const escapedPipeRivals = extractCompetitorsFromAnswerAndCitations({
    targetHostname: 'lanierlawfirm.com',
    brandName: 'The Lanier Law Firm',
    answerText: [
      '**Shipping and returns**',
      '**Alternatives to consider**',
      '| Law Firm | Focus |',
      '| --- | --- |',
      '| Panish \\| Shea \\| Boyle | Trial litigation |',
      '| Arnold & Itkin | Catastrophic injury |',
    ].join('\n'),
    urls: [],
  });
  assert.ok(escapedPipeRivals.includes('Panish | Shea | Boyle'));
  assert.ok(escapedPipeRivals.includes('Arnold & Itkin'));
  assert.ok(!escapedPipeRivals.some((r) => r.endsWith('\\')));
  assert.ok(!escapedPipeRivals.includes('Shipping and returns'));
  assert.ok(!escapedPipeRivals.includes('Alternatives to consider'));
});

test('M37 Engine-by-Engine Citation Share aggregator and /sample-audit vertical classifier compute deterministic metrics', () => {
  const engineShare = summarizeEngineCitationShare([
    {
      id: 'snap-1',
      domain_id: 'dom-1',
      prompt_id: 'p-1',
      ai_engine: 'chatgpt',
      brand_mentioned: false,
      citation_rank: null,
      competitors_mentioned: [
        'reddit.com buyer threads',
        'Postmark',
        'Mailgun',
        'SendGrid',
      ],
      cited_source_urls: [],
      fanout_telemetry_type: 'observed_query',
      hallucination_detected: false,
      hallucination_details: null,
      raw_answer_excerpt: 'Postmark and Mailgun lead.',
      scanned_at: '2026-11-14T00:00:00Z',
    },
    {
      id: 'snap-2',
      domain_id: 'dom-1',
      prompt_id: 'p-1',
      ai_engine: 'gemini',
      brand_mentioned: true,
      citation_rank: 2,
      competitors_mentioned: ['Postmark'],
      cited_source_urls: [],
      fanout_telemetry_type: 'observed_query',
      hallucination_detected: false,
      hallucination_details: null,
      raw_answer_excerpt: 'Resend ranked #2.',
      scanned_at: '2026-11-14T00:00:00Z',
    },
    {
      id: 'snap-3',
      domain_id: 'dom-1',
      prompt_id: 'p-2',
      ai_engine: 'gemini',
      brand_mentioned: true,
      citation_rank: 1,
      competitors_mentioned: ['Mailgun'],
      cited_source_urls: [],
      fanout_telemetry_type: 'observed_query',
      hallucination_detected: true,
      hallucination_details: [
        {
          claim_text: '$10/mo unlimited',
          verified_truth: '$20/mo Pro tier',
          severity: 'high',
          category: 'pricing',
        },
      ],
      raw_answer_excerpt: 'Resend ranked #1.',
      scanned_at: '2026-11-14T00:00:00Z',
    },
    {
      id: 'snap-4',
      domain_id: 'dom-1',
      prompt_id: 'p-1',
      ai_engine: 'perplexity',
      brand_mentioned: true,
      citation_rank: 1,
      competitors_mentioned: ['Top Resend Category Peer #1', 'Amazon SES'],
      cited_source_urls: [],
      fanout_telemetry_type: 'observed_query',
      hallucination_detected: false,
      hallucination_details: null,
      raw_answer_excerpt: 'Resend cited first.',
      scanned_at: '2026-11-14T00:00:00Z',
    },
  ]);

  assert.equal(engineShare.length, 3);
  const chatgpt = engineShare.find((e) => e.aiEngine === 'chatgpt')!;
  const gemini = engineShare.find((e) => e.aiEngine === 'gemini')!;
  const perplexity = engineShare.find((e) => e.aiEngine === 'perplexity')!;

  assert.equal(chatgpt.mentionedCount, 0);
  assert.equal(chatgpt.totalSnapshots, 1);
  assert.equal(chatgpt.mentionRatePct, 0);
  assert.equal(chatgpt.bestRank, null);
  assert.deepEqual(chatgpt.topRivals, ['Postmark', 'Mailgun']);

  assert.equal(gemini.mentionedCount, 2);
  assert.equal(gemini.totalSnapshots, 2);
  assert.equal(gemini.mentionRatePct, 100);
  assert.equal(gemini.bestRank, 1);
  assert.equal(gemini.hallucinationCount, 1);

  assert.equal(perplexity.mentionedCount, 1);
  assert.equal(perplexity.bestRank, 1);
  assert.deepEqual(perplexity.topRivals, ['Amazon SES']);

  assert.equal(
    classifyPitchShowcaseBucket({
      prospect_domain: 'https://resend.com',
      prospect_brand_name: 'Resend',
      summary_payload: {
        top_gaps: [],
        competitors_winning: [],
        hallucination_examples: [],
        recommended_fixes: [],
      },
    }),
    'saas_d2c'
  );
  assert.equal(
    classifyPitchShowcaseBucket({
      prospect_domain: 'https://siegemedia.com',
      prospect_brand_name: 'Siege Media',
      summary_payload: {
        top_gaps: [],
        competitors_winning: [],
        hallucination_examples: [],
        recommended_fixes: [],
      },
    }),
    'agencies'
  );
  assert.equal(
    classifyPitchShowcaseBucket({
      prospect_domain: 'https://lanierlawfirm.com',
      prospect_brand_name: 'The Lanier Law Firm',
      summary_payload: {
        top_gaps: [],
        competitors_winning: [],
        hallucination_examples: [],
        recommended_fixes: [],
      },
    }),
    'local_services'
  );
});

test('M38 Ranked Citation Gap Source Leaderboard & targeted editorial outreach draft pass >= 9.5/10 Critic', () => {
  const aureaSnaps = PATIENT_ZERO_SNAPSHOTS.filter(
    (s) => s.domain_id === PATIENT_ZERO_DOMAINS[0]!.id
  );
  const ranked = rankCitationGapSources({
    targetHostname: 'aurearoasters.com',
    snapshots: aureaSnaps,
  });

  assert.equal(ranked.length, 4);
  assert.equal(ranked[0]!.ownership, 'citation_gap');
  assert.equal(ranked[1]!.ownership, 'citation_gap');
  assert.deepEqual(
    ranked.slice(0, 2).map((r) => r.sourceHost),
    ['catholiccoffee.com', 'mysticmonkcoffee.com']
  );

  const redditRow = ranked.find((r) => r.sourceHost === 'reddit.com')!;
  assert.equal(redditRow.ownership, 'co_cited');
  assert.deepEqual(redditRow.enginesCiting, ['chatgpt']);

  const ownedRow = ranked.find((r) => r.sourceHost === 'aurearoasters.com')!;
  assert.equal(ownedRow.ownership, 'owned');
  assert.deepEqual(ownedRow.rivalsFed, []);

  const outreach = buildTargetedCitationOutreachDraft({
    brandName: 'Aurea Coffee Roasters',
    hostname: 'aurearoasters.com',
    coreOffering: 'Single-origin specialty whole-bean coffee inspired by church heritage',
    pricingSummary: '$21.95 to $109.95 USD across 8 whole-bean bags and bundles',
    sourceHost: redditRow.sourceHost,
    targetUrl: redditRow.urls[0]!,
    enginesCiting: redditRow.enginesCiting,
    rivalsFed: redditRow.rivalsFed,
  });

  assert.ok(outreach.score >= 9.5, `Expected >= 9.5/10, got ${outreach.score}`);
  assert.ok(outreach.content.includes('https://aurearoasters.com/agents.md'));
  assert.ok(outreach.content.includes(redditRow.urls[0]!));
});

test('M39-M41 ScoreDeltaSummary, Patient Zero remediation baselines & v1.0.0 manifest sync work cleanly', () => {
  assert.equal(VERISOURCE_VERSION, '1.0.0');
  const manifest = buildMcpDiscoveryManifest();
  assert.equal(manifest.version, '1.0.0');

  const delta = computeScoreDeltaSummary({
    previousVisibilityScore: 41,
    currentVisibilityScore: 92,
    previousAccuracyScore: 68,
    currentAccuracyScore: 100,
    baselineLabel: 'initial_audit',
    verifiedLiveChecksCount: 4,
  });
  assert.equal(delta.visibilityDelta, 51);
  assert.equal(delta.accuracyDelta, 32);
  assert.equal(delta.baselineLabel, 'initial_audit');
  assert.equal(delta.verifiedLiveChecksCount, 4);

  // Unremediated fixtures (41 and 36) should not report synthetic uplift
  const preRemediationMap = resolveInitialDomainScoreDeltas(PATIENT_ZERO_DOMAINS);
  assert.equal(Object.keys(preRemediationMap).length, 0);

  // Remediated Patient Zero production rows (92 and 84) resolve exact baseline uplifts (+51 and +32)
  const remediatedMap = resolveInitialDomainScoreDeltas([
    {
      ...PATIENT_ZERO_DOMAINS[0]!,
      visibility_score: 92,
      accuracy_score: 100,
    },
    {
      ...PATIENT_ZERO_DOMAINS[1]!,
      visibility_score: 84,
      accuracy_score: 92,
    },
  ]);
  assert.equal(remediatedMap[PATIENT_ZERO_DOMAINS[0]!.id]?.visibilityDelta, 51);
  assert.equal(remediatedMap[PATIENT_ZERO_DOMAINS[0]!.id]?.accuracyDelta, 32);
  assert.equal(remediatedMap[PATIENT_ZERO_DOMAINS[1]!.id]?.visibilityDelta, 32);
  assert.equal(remediatedMap[PATIENT_ZERO_DOMAINS[1]!.id]?.accuracyDelta, 38);
});

test('M42 5 Competitor Intelligence Upgrades (Suggested Prompts, Mention/Citation Split, Source Categories, Sentiment & Rival SoV, JS Readability, Commerce Attributes) work deterministically', () => {
  // 1. Auto-Suggested Buyer Prompts + Funnel-Stage & Branded/Unbranded Tags
  const suggested = generateSuggestedBuyerPrompts({
    hostname: 'resend.com',
    brandName: 'Resend',
    coreOffering: 'Developer email API and transactional email delivery platform.',
    pricingSummary: '$20/mo Pro tier for 50,000 emails',
    topRivals: ['Postmark', 'SendGrid'],
    existingPrompts: ['Resend pricing plans, usage limits, and enterprise billing options'],
  });
  assert.equal(suggested.length, 7, 'Expected 7 remaining prompts after filtering 1 existing');
  assert.ok(suggested.some((p) => p.intentCategory === 'discovery_unbranded' && !p.isBranded));
  assert.ok(
    suggested.some(
      (p) =>
        p.intentCategory === 'commercial_comparison' &&
        p.promptText.includes('Postmark')
    )
  );
  assert.equal(
    classifyPromptIntent('Best developer email APIs for startups', 'Resend')
      .intentCategory,
    'discovery_unbranded'
  );
  assert.equal(
    classifyPromptIntent('Resend vs Postmark deliverability', 'Resend')
      .intentCategory,
    'commercial_comparison'
  );
  assert.equal(
    classifyPromptIntent('Resend monthly pricing tiers', 'Resend').intentCategory,
    'pricing_purchase'
  );

  // 2. Mention Rate vs. Citation Rate Split + Source Type Categorization
  const snaps = [
    {
      id: 's1',
      domain_id: 'd1',
      prompt_id: 'p1',
      ai_engine: 'chatgpt' as const,
      brand_mentioned: true,
      citation_rank: 1,
      competitors_mentioned: ['Postmark', 'SendGrid'],
      cited_source_urls: [
        'https://reddit.com/r/webdev/comments/email_apis',
        'https://g2.com/categories/transactional-email',
        'https://postmarkapp.com/comparison',
      ],
      fanout_telemetry_type: 'observed_query' as const,
      hallucination_detected: false,
      hallucination_details: null,
      raw_answer_excerpt: 'Resend is a top pick for modern React email teams.',
      scanned_at: '2026-11-15T00:00:00Z',
    },
    {
      id: 's2',
      domain_id: 'd1',
      prompt_id: 'p2',
      ai_engine: 'chatgpt' as const,
      brand_mentioned: true,
      citation_rank: 2,
      competitors_mentioned: ['Postmark'],
      cited_source_urls: ['https://resend.com/pricing'],
      fanout_telemetry_type: 'observed_query' as const,
      hallucination_detected: false,
      hallucination_details: null,
      raw_answer_excerpt: 'Resend and Postmark both offer strong APIs.',
      scanned_at: '2026-11-15T00:00:00Z',
    },
  ];
  const share = summarizeEngineCitationShare(snaps, 'resend.com');
  const gptShare = share.find((s) => s.aiEngine === 'chatgpt')!;
  assert.equal(gptShare.mentionRatePct, 100);
  assert.equal(gptShare.citedUrlCount, 1);
  assert.equal(gptShare.citationRatePct, 50);

  const ranked = rankCitationGapSources({
    targetHostname: 'resend.com',
    snapshots: snaps,
  });
  assert.equal(
    ranked.find((r) => r.sourceHost === 'reddit.com')?.sourceCategory,
    'ugc_community'
  );
  assert.equal(
    ranked.find((r) => r.sourceHost === 'g2.com')?.sourceCategory,
    'review_directory'
  );
  assert.equal(
    ranked.find((r) => r.sourceHost === 'postmarkapp.com')?.sourceCategory,
    'competitor_site'
  );
  assert.equal(
    ranked.find((r) => r.sourceHost === 'resend.com')?.sourceCategory,
    'owned_domain'
  );
  assert.equal(
    classifyCitationSourceCategory({
      sourceHost: 'techcrunch.com',
      isOwned: false,
      knownRivals: ['Postmark'],
    }).sourceCategory,
    'editorial_media'
  );

  // 3. Brand Sentiment Framing + Head-to-Head Rival Share-of-Voice
  const sentiment = summarizeBrandSentimentAndSov({
    brandName: 'Resend',
    snapshots: snaps,
  });
  assert.equal(sentiment.dominantFraming, 'recommended');
  assert.equal(sentiment.recommendedPct, 100);
  assert.equal(sentiment.averageRank, 1.5);
  assert.equal(sentiment.headToHeadSov[0]?.entityName, 'Resend');
  assert.equal(sentiment.headToHeadSov[0]?.shareOfVoicePct, 100);
  assert.ok(
    sentiment.headToHeadSov.some(
      (i) => i.entityName === 'Postmark' && i.shareOfVoicePct === 100
    )
  );

  // 4. JS-Rendering / Crawler Readability + Edge Bot Crawl Snippet
  const csrTrap = analyzeCrawlerHtmlReadability(
    '<!doctype html><html><head><title>App</title></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
  );
  assert.equal(csrTrap.status, 'csr_js_trap');
  assert.equal(csrTrap.detectedCsrShell, true);

  const ssrClean = analyzeCrawlerHtmlReadability(
    `<!doctype html><html><body><main><h1>Enterprise Email Infrastructure</h1><p>${'Verified transactional API documentation, transparent pricing tiers, SLA guarantees, and developer SDK guides. '.repeat(12)}</p></main></body></html>`
  );
  assert.equal(ssrClean.status, 'ssr_clean');
  assert.ok(ssrClean.visibleWordCount >= 100);

  assert.equal(
    normalizeAiBotCrawlerSource(
      'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)'
    ),
    'PerplexityBot'
  );
  assert.equal(normalizeAiBotCrawlerSource('GPTBot/1.2'), 'GPTBot');
  const edgeSnippet = buildEdgeBotCrawlerSnippet({
    trackingPixelToken: 'aaaaaaaa-1111-4000-8000-000000000001',
    checkoutKey: '0123456789abcdef01234567',
    ingestionUrl: 'https://verisource.dev/api/pixel',
  });
  assert.ok(edgeSnippet.includes("event_type: 'ai_bot_crawl'"));

  // 5. AI Shopping & Offer Attribute Completeness
  const partialCommerce = evaluateCommerceAttributeReadiness({
    domain: {
      ...PATIENT_ZERO_DOMAINS[0]!,
      agents_md_status: 'custom_enriched',
      llms_txt_status: 'present',
    },
    fixes: PATIENT_ZERO_FIXES.filter(
      (f) => f.domain_id === PATIENT_ZERO_DOMAINS[0]!.id
    ).map((f) => ({ ...f, is_applied: true })),
  });
  assert.equal(partialCommerce.totalCount, 5);
  assert.equal(partialCommerce.passedCount, 4);
  assert.equal(partialCommerce.readinessPct, 80);

  const fullCommerce = evaluateCommerceAttributeReadiness({
    domain: {
      ...PATIENT_ZERO_DOMAINS[0]!,
      agents_md_status: 'custom_enriched',
      llms_txt_status: 'present',
    },
    fixes: [
      ...PATIENT_ZERO_FIXES.filter(
        (f) => f.domain_id === PATIENT_ZERO_DOMAINS[0]!.id
      ).map((f) => ({ ...f, is_applied: true })),
      {
        fix_type: 'json_ld_schema',
        content_payload: '{"@context":"https://schema.org","@type":"Store"}',
        is_applied: true,
      },
    ],
  });
  assert.equal(fullCommerce.passedCount, 5);
  assert.equal(fullCommerce.readinessPct, 100);
});

test('M43 Executive AI Search Audit Report exporter passes >= 9.5/10 Critic with all 5 Competitor Intelligence sections', () => {
  const execReport = buildExecutiveAuditReportMarkdown({
    domain: {
      brand_name: 'Resend',
      domain_url: 'https://resend.com',
      is_shopify: false,
      shopify_mcp_status: 'unavailable',
      agents_md_status: 'custom_enriched',
      llms_txt_status: 'present',
      robots_ai_bot_status: {
        GPTBot: true,
        'OAI-SearchBot': true,
        PerplexityBot: true,
        ClaudeBot: true,
        'Google-Extended': true,
        waf_blocked: false,
      },
      brand_truth_sheet: {
        is_user_verified: true,
        core_offering: 'Developer transactional email API and React Email platform.',
        verified_pricing_summary: 'Free up to 3,000 emails/mo; Pro starts at $20/mo for 50,000 emails.',
        shipping_or_service_area: 'Global cloud API with US and EU regions.',
        key_differentiators: ['React Email SDK', 'REST & SMTP delivery'],
        discontinued_or_false_claims_to_flag: ['Does NOT offer $10/mo unlimited sending'],
      },
      visibility_score: 74,
      accuracy_score: 92,
    },
    snapshots: [
      {
        id: 'exec-s1',
        domain_id: 'exec-d1',
        prompt_id: 'exec-p1',
        ai_engine: 'perplexity',
        brand_mentioned: true,
        citation_rank: 1,
        competitors_mentioned: ['Postmark', 'SendGrid'],
        cited_source_urls: [
          'https://resend.com/pricing',
          'https://reddit.com/r/nextjs/comments/email_providers',
        ],
        fanout_telemetry_type: 'observed_query',
        hallucination_detected: false,
        hallucination_details: null,
        raw_answer_excerpt: 'Resend is a top pick for React developers.',
        scanned_at: '2026-11-15T12:00:00Z',
      },
    ],
    fixes: [
      {
        fix_type: 'json_ld_schema',
        title: 'SoftwareApplication + FAQPage JSON-LD',
        content_payload: '{"@context":"https://schema.org","@type":"SoftwareApplication"}',
        is_applied: true,
        natural_quality_score: 9.8,
      },
    ],
    aiReferralVisits: 14,
    aiReferralRevenueUsd: 240,
    aiBotCrawls: 9,
  });

  assert.ok(
    execReport.score >= 9.5,
    `Expected Executive Audit Report quality score >= 9.5, got ${execReport.score}`
  );
  assert.ok(execReport.content.includes('## 2. Engine-by-Engine Mention vs. Citation Rate'));
  assert.ok(execReport.content.includes('## 3. Brand Sentiment & Head-to-Head Rival Share of Voice'));
  assert.ok(execReport.content.includes('## 6. AI Shopping & Offer Attribute Matrix'));
  assert.ok(execReport.content.includes('## 7. Categorized Citation Gap Sources'));
  assert.ok(execReport.content.includes('## 8. Priority Funnel Prompts to Track Next'));
});

test('M44 Enriched buildAgencyPitchPayload populates Mention/Citation %, Sentiment, Head-to-Head SoV & Categorized Sources', () => {
  const enrichedPitch = buildAgencyPitchPayload({
    brandName: 'Resend',
    hostname: 'resend.com',
    robotsAiBotStatus: {
      GPTBot: true,
      'OAI-SearchBot': true,
      PerplexityBot: true,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: false,
    },
    llmsTxtStatus: 'present',
    agentsMdStatus: 'missing',
    isShopify: false,
    shopifyMcpStatus: 'unavailable',
    jsonLdCount: 2,
    crawlerReadability: {
      status: 'ssr_clean',
      rawHtmlBytes: 24000,
      visibleTextChars: 5400,
      visibleWordCount: 820,
      signalToHtmlPct: 22.5,
      estimatedTokens: 1350,
      hasSemanticLandmarks: true,
      detectedCsrShell: false,
      summary: 'SSR HTML clean.',
    },
    scanResults: [
      {
        promptText: 'Best developer email APIs',
        aiEngine: 'perplexity',
        brandMentioned: true,
        citationRank: 1,
        competitorsMentioned: ['Postmark', 'SendGrid'],
        citedSourceUrls: [
          'https://resend.com/pricing',
          'https://reddit.com/r/webdev/comments/email_apis',
        ],
        decompiledFanoutQueries: ['resend vs postmark'],
        fanoutTelemetryType: 'observed_query',
        hallucinationDetected: false,
        hallucinationDetails: [],
        rawAnswerExcerpt: 'Resend is a top pick for React developers.',
      },
      {
        promptText: 'Compare transactional email deliverability',
        aiEngine: 'chatgpt',
        brandMentioned: true,
        citationRank: 2,
        competitorsMentioned: ['Postmark'],
        citedSourceUrls: ['https://g2.com/categories/transactional-email'],
        decompiledFanoutQueries: [],
        fanoutTelemetryType: 'observed_query',
        hallucinationDetected: false,
        hallucinationDetails: [],
        rawAnswerExcerpt: 'Postmark and Resend lead developer ratings.',
      },
    ],
    allHallucinations: [],
  });

  assert.equal(enrichedPitch.mention_rate_pct, 100);
  assert.equal(enrichedPitch.citation_rate_pct, 50);
  assert.equal(enrichedPitch.sentiment_framing, 'recommended');
  assert.ok((enrichedPitch.head_to_head_sov?.length ?? 0) >= 2);
  assert.ok(
    enrichedPitch.top_citation_sources?.some(
      (s) => s.sourceHost === 'reddit.com' && s.sourceCategoryLabel === 'UGC / Community'
    )
  );
  assert.equal(enrichedPitch.crawler_readability_status, 'ssr_clean');
  assert.equal(enrichedPitch.crawler_signal_pct, 22.5);
});

test('M45 1-Click AI Remediation Master Prompt Generator passes >= 9.5/10 Critic across coding_agent, chat_assistant & shopify_liquid modes', () => {
  const baseDomain = {
    brand_name: 'Resend',
    domain_url: 'https://resend.com',
    is_shopify: false,
    shopify_mcp_status: 'unavailable' as const,
    agents_md_status: 'missing' as const,
    llms_txt_status: 'missing' as const,
    robots_ai_bot_status: {
      GPTBot: true,
      'OAI-SearchBot': true,
      PerplexityBot: false,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: false,
    },
    brand_truth_sheet: {
      is_user_verified: true,
      core_offering: 'Developer transactional email API and React Email SDK.',
      verified_pricing_summary: 'Free up to 3,000 emails/mo; Pro starts at $20/mo.',
      shipping_or_service_area: 'Global cloud API across US, EU, and APAC.',
      key_differentiators: ['React Email templates'],
      discontinued_or_false_claims_to_flag: ['Does NOT offer $10/mo unlimited sending'],
    },
    visibility_score: 54,
    accuracy_score: 76,
  };

  const sampleFixes = [
    {
      fix_type: 'json_ld_schema' as const,
      title: 'SoftwareApplication + FAQPage JSON-LD',
      content_payload: '{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Resend"}',
      is_applied: false,
      natural_quality_score: 9.8,
    },
    {
      fix_type: 'agents_md' as const,
      title: 'Canonical /agents.md Truth Rulebook',
      content_payload: '# Resend Verified AI Truth\n\n- Pro starts at $20/mo.',
      is_applied: false,
      natural_quality_score: 9.8,
    },
  ];

  const codingPrompt = buildAiRemediationMasterPrompt({
    domain: baseDomain,
    fixes: sampleFixes,
    crawlerReadability: {
      status: 'csr_js_trap',
      rawHtmlBytes: 8200,
      visibleTextChars: 110,
      visibleWordCount: 18,
      signalToHtmlPct: 1.3,
      estimatedTokens: 30,
      hasSemanticLandmarks: false,
      detectedCsrShell: true,
      summary: 'Detected CSR shell.',
    },
    targetEnv: 'coding_agent',
  });
  assert.ok(codingPrompt.score >= 9.5, `Expected >= 9.5, got ${codingPrompt.score}`);
  assert.ok(codingPrompt.content.includes('Principal Full-Stack & Technical SEO Engineer'));
  assert.ok(codingPrompt.content.includes('PerplexityBot'));
  assert.ok(codingPrompt.content.includes('JS RENDERING TRAP'));
  assert.ok(codingPrompt.content.includes('SoftwareApplication + FAQPage JSON-LD'));

  const chatPrompt = buildAiRemediationMasterPrompt({
    domain: baseDomain,
    fixes: sampleFixes,
    targetEnv: 'chat_assistant',
  });
  assert.ok(chatPrompt.score >= 9.5);
  assert.ok(chatPrompt.content.includes('WordPress, Webflow, Framer'));

  const shopifyPrompt = buildAiRemediationMasterPrompt({
    domain: { ...baseDomain, is_shopify: true },
    fixes: sampleFixes,
  });
  assert.ok(shopifyPrompt.score >= 9.5);
  assert.ok(shopifyPrompt.content.includes('Online Store 2.0 theme'));
});

test('M47 7-Day Free Trial post-purchase welcome alert passes >= 9.5/10 gate with $0.00 clarity & starter /mcp pacing', () => {
  const proTrialAlert = buildPostPurchaseWelcomeAlert({
    planTier: 'pro_99',
    targetDomain: 'linear.app',
    visibilityScore: 68,
    fixCount: 5,
    trialDays: 7,
  });
  assert.ok(proTrialAlert.quality.score >= 9.5);
  assert.ok(proTrialAlert.subject.includes('[7-Day Trial Active] linear.app'));
  assert.ok(proTrialAlert.text.includes('$0.00 was charged today'));
  assert.ok(proTrialAlert.text.includes('150 starter /mcp credits'));
  assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(proTrialAlert.text));
  assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(proTrialAlert.html));

  const starterTrialAlert = buildPostPurchaseWelcomeAlert({
    planTier: 'starter_49',
    targetDomain: 'resend.com',
    visibilityScore: 64,
    fixCount: 4,
    trialDays: 7,
  });
  assert.ok(starterTrialAlert.quality.score >= 9.5);
  assert.ok(starterTrialAlert.subject.includes('[7-Day Trial Active] resend.com'));
  assert.ok(starterTrialAlert.text.includes('$0.00 was charged today'));
  assert.ok(starterTrialAlert.text.includes('25 /mcp credits/month'));
});

test('M48 AI Citation & Rival Comparison Page Studio passes >= 9.5/10 gate across vs_competitor, buyer_guide & pricing_truth blueprints', () => {
  const sampleDomain = {
    domain_url: 'https://resend.com',
    brand_name: 'Resend',
    industry_vertical: 'b2b_saas_developer',
    is_shopify: false,
    shopify_mcp_status: 'unavailable' as const,
    agents_md_status: 'custom_enriched' as const,
    llms_txt_status: 'present' as const,
    brand_truth_sheet: {
      is_user_verified: true,
      core_offering: 'Developer-first transactional and marketing email API.',
      verified_pricing_summary: 'Free up to 3,000 emails/mo; Pro starts at $20/mo for 50,000 emails.',
      shipping_or_service_area: 'Global multi-region AWS SES & dedicated IP delivery.',
      key_differentiators: ['React Email integration', 'Sub-second webhook telemetry'],
      discontinued_or_false_claims_to_flag: ['$10/mo unlimited email tier'],
    },
  };

  const vsRival = buildCitationAnswerPageBundle({
    domain: sampleDomain,
    blueprintType: 'vs_competitor',
    rivalName: 'Postmark',
    targetPrompt: 'Resend vs Postmark for transactional developer email',
    targetEnv: 'coding_agent',
  });
  assert.equal(vsRival.suggestedPath, '/compare/resend-vs-postmark');
  assert.ok(vsRival.markdownPage.score >= 9.5);
  assert.ok(vsRival.aiBuildPrompt.score >= 9.5);
  const parsedFaq = JSON.parse(vsRival.faqJsonLd) as { '@type': string; mainEntity: unknown[] };
  assert.equal(parsedFaq['@type'], 'FAQPage');
  assert.equal(parsedFaq.mainEntity.length, 3);
  assert.ok(vsRival.markdownPage.content.includes('Resend vs. Postmark'));
  assert.ok(vsRival.markdownPage.content.includes('$20/mo for 50,000 emails'));
  assert.ok(vsRival.markdownPage.content.includes('$10/mo unlimited email tier'));
  assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(vsRival.markdownPage.content));
  assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(vsRival.aiBuildPrompt.content));

  const buyerGuide = buildCitationAnswerPageBundle({
    domain: sampleDomain,
    blueprintType: 'buyer_guide',
    targetPrompt: 'Best transactional email API with React templates',
    fanoutSubQueries: ['transactional email API deliverability SLA', 'React Email SMTP API pricing'],
    targetEnv: 'chat_assistant',
  });
  assert.ok(buyerGuide.suggestedPath.startsWith('/guides/'));
  assert.ok(buyerGuide.markdownPage.score >= 9.5);
  assert.ok(buyerGuide.aiBuildPrompt.score >= 9.5);
  assert.ok(buyerGuide.markdownPage.content.includes('transactional email API deliverability SLA'));

  const shopifyPricing = buildCitationAnswerPageBundle({
    domain: {
      ...sampleDomain,
      is_shopify: true,
      shopify_mcp_status: 'ucp_active',
    },
    blueprintType: 'pricing_truth',
  });
  assert.equal(shopifyPricing.suggestedPath, '/pages/pricing-and-service-facts');
  assert.ok(shopifyPricing.markdownPage.score >= 9.5);
  assert.ok(shopifyPricing.aiBuildPrompt.score >= 9.5);
  assert.ok(shopifyPricing.aiBuildPrompt.content.includes('Online Store 2.0'));
});

test('M49 Sub-Page AI Bot Extraction Inspector enforces same-domain + SSRF guards & grades SSR vs CSR pages (>= 9.5/10 prompt)', () => {
  const samePath = resolveSafeSameDomainTargetUrl('https://resend.com', '/pricing');
  assert.equal(samePath.targetUrl, 'https://resend.com/pricing');
  assert.equal(samePath.pathname, '/pricing');

  const subDomain = resolveSafeSameDomainTargetUrl(
    'https://resend.com',
    'https://docs.resend.com/api-reference'
  );
  assert.equal(subDomain.targetUrl, 'https://docs.resend.com/api-reference');

  assert.throws(
    () =>
      resolveSafeSameDomainTargetUrl(
        'https://resend.com',
        'https://stripe.com/pricing'
      ),
    (err: unknown) =>
      err instanceof SubPageInspectionError &&
      err.code === 'CROSS_DOMAIN_BLOCKED'
  );

  for (const badInput of [
    'http://169.254.169.254/latest/meta-data/',
    'http://127.0.0.1:3000/admin',
    '//evil.com/phish',
    'javascript:alert(1)',
    'https://admin:secret@resend.com/pricing',
  ]) {
    assert.throws(
      () => resolveSafeSameDomainTargetUrl('https://resend.com', badInput),
      (err: unknown) =>
        err instanceof SubPageInspectionError &&
        err.code === 'INVALID_TARGET_URL'
    );
  }

  const truth = {
    is_user_verified: true,
    core_offering: 'Transactional email API for developers.',
    verified_pricing_summary: 'Pro starts at $20/mo for 50,000 emails.',
    shipping_or_service_area: 'Global multi-region AWS delivery.',
    key_differentiators: ['React Email support'],
    discontinued_or_false_claims_to_flag: ['$10/mo unlimited emails'],
  };

  const csrShellReport = analyzeHtmlForBotExtraction({
    targetUrl: 'https://resend.com/pricing',
    pathname: '/pricing',
    hostname: 'resend.com',
    httpStatus: 200,
    gptBotStatus: 200,
    perplexityBotStatus: 403,
    rawHtml: '<!doctype html><html><body><div id="root"></div></body></html>',
    brandName: 'Resend',
    brandTruthSheet: truth,
  });
  assert.equal(csrShellReport.pageReadinessScore, 0);
  assert.equal(csrShellReport.readability.status, 'csr_js_trap');
  assert.ok(csrShellReport.aiPageOptimizationPrompt.score >= 9.5);
  assert.ok(
    !/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(
      csrShellReport.aiPageOptimizationPrompt.content
    )
  );

  const richSsrWords = Array.from({ length: 95 }, () => 'verified').join(' ');
  const richSsrReport = analyzeHtmlForBotExtraction({
    targetUrl: 'https://resend.com/pricing',
    pathname: '/pricing',
    hostname: 'resend.com',
    httpStatus: 200,
    gptBotStatus: 200,
    perplexityBotStatus: 200,
    rawHtml: `<!doctype html><html><head><title>Resend Pricing</title><script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage"}</script></head><body><main><h1>Transparent Pricing</h1><p>Plans start at $20/mo. ${richSsrWords}</p><h2>Plan Comparison</h2><table><tr><th>Tier</th><th>Price</th></tr><tr><td>Pro</td><td>$20/mo</td></tr></table><h2>Enterprise SLA</h2></main></body></html>`,
    brandName: 'Resend',
    brandTruthSheet: truth,
  });
  assert.equal(richSsrReport.pageReadinessScore, 100);
  assert.equal(richSsrReport.tableCount, 1);
  assert.deepEqual(richSsrReport.jsonLdTypes, ['FAQPage']);
  assert.ok(richSsrReport.botExtractedPreview.includes('[HTML TABLE START]'));
  assert.ok(richSsrReport.aiPageOptimizationPrompt.score >= 9.5);
});

test('M50 Competitor Technical X-Ray blocks SSRF + self-domain & computes 6-dimension readiness diff (>= 9.5/10 overtake prompt)', async () => {
  const sampleOwn = PATIENT_ZERO_DOMAINS[0]!;

  await assert.rejects(
    () =>
      runCompetitorTechnicalXray({
        ownDomain: sampleOwn,
        rivalDomainInput: 'http://169.254.169.254/',
        rawEnv: { PROVIDER_MODE: 'mock' },
      }),
    (err: unknown) =>
      err instanceof CompetitorXrayError && err.code === 'INVALID_RIVAL_DOMAIN'
  );

  await assert.rejects(
    () =>
      runCompetitorTechnicalXray({
        ownDomain: sampleOwn,
        rivalDomainInput: sampleOwn.domain_url,
        rawEnv: { PROVIDER_MODE: 'mock' },
      }),
    (err: unknown) =>
      err instanceof CompetitorXrayError && err.code === 'SAME_DOMAIN_ERROR'
  );

  const xray = await runCompetitorTechnicalXray({
    ownDomain: sampleOwn,
    rivalDomainInput: 'bluebottlecoffee.com',
    rawEnv: { PROVIDER_MODE: 'mock' },
  });
  assert.equal(xray.rivalHostname, 'bluebottlecoffee.com');
  assert.equal(xray.dimensions.length, 6);
  assert.ok(xray.aiOvertakePrompt.score >= 9.5);
  assert.ok(
    !/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(xray.aiOvertakePrompt.content)
  );
});

test('M51 Source-Category-Aware Off-Site Citation Acquisition Engine & Playbook Exporter pass >= 9.5/10 across UGC, Directory, Competitor & Editorial channels', () => {
  const ugcDraft = buildTargetedCitationOutreachDraft({
    brandName: 'Resend',
    hostname: 'resend.com',
    coreOffering: 'Developer transactional email API',
    pricingSummary: 'Pro starts at $20/mo for 50,000 emails',
    sourceHost: 'reddit.com',
    sourceCategory: 'ugc_community',
    targetUrl: 'https://www.reddit.com/r/nextjs/comments/1abc/transactional_email/',
    enginesCiting: ['chatgpt', 'perplexity'],
    rivalsFed: ['Postmark', 'SendGrid'],
  });
  assert.ok(ugcDraft.score >= 9.5);
  assert.ok(ugcDraft.content.includes('Disclosure: I work on Resend'));
  assert.ok(!ugcDraft.content.includes('editorial team'));

  const dirDraft = buildTargetedCitationOutreachDraft({
    brandName: 'Resend',
    hostname: 'resend.com',
    coreOffering: 'Developer transactional email API',
    pricingSummary: 'Pro starts at $20/mo for 50,000 emails',
    sourceHost: 'g2.com',
    sourceCategory: 'review_directory',
    targetUrl: 'https://www.g2.com/categories/transactional-email',
    enginesCiting: ['perplexity'],
    rivalsFed: ['Postmark'],
  });
  assert.ok(dirDraft.score >= 9.5);
  assert.ok(dirDraft.content.includes('Zero Incentives'));

  const compDraft = buildTargetedCitationOutreachDraft({
    brandName: 'Resend',
    hostname: 'resend.com',
    coreOffering: 'Developer transactional email API',
    pricingSummary: 'Pro starts at $20/mo for 50,000 emails',
    sourceHost: 'postmarkapp.com',
    sourceCategory: 'competitor_site',
    targetUrl: 'https://postmarkapp.com/compare/sendgrid-alternative',
    enginesCiting: ['chatgpt'],
    rivalsFed: ['Postmark'],
  });
  assert.ok(compDraft.score >= 9.5);
  assert.ok(compDraft.content.includes('Do not email postmarkapp.com'));
  assert.ok(compDraft.content.includes('/compare/resend-vs-postmarkapp'));

  const edDraft = buildTargetedCitationOutreachDraft({
    brandName: 'Resend',
    hostname: 'resend.com',
    coreOffering: 'Developer transactional email API',
    pricingSummary: 'Pro starts at $20/mo for 50,000 emails',
    sourceHost: 'techcrunch.com',
    sourceCategory: 'editorial_media',
    targetUrl: 'https://techcrunch.com/2026/05/email-apis/',
    enginesCiting: ['gemini'],
    rivalsFed: ['Postmark'],
  });
  assert.ok(edDraft.score >= 9.5);
  assert.ok(edDraft.content.includes('Subject: Factual spec update for techcrunch.com'));

  const playbook = buildCitationGapActionPlaybookMarkdown({
    brandName: 'Resend',
    hostname: 'resend.com',
    coreOffering: 'Developer transactional email API',
    pricingSummary: 'Pro starts at $20/mo for 50,000 emails',
    rankedSources: [
      {
        sourceHost: 'reddit.com',
        ownership: 'citation_gap',
        sourceCategory: 'ugc_community',
        sourceCategoryLabel: 'UGC / Community',
        recommendedAction: 'Post disclosed founder thread reply.',
        enginesCiting: ['chatgpt'],
        citationCount: 2,
        rivalsFed: ['Postmark'],
        urls: ['https://www.reddit.com/r/nextjs/comments/1abc/transactional_email/'],
      },
      {
        sourceHost: 'g2.com',
        ownership: 'citation_gap',
        sourceCategory: 'review_directory',
        sourceCategoryLabel: 'Review Directory',
        recommendedAction: 'Sync G2 listing and request candid reviews.',
        enginesCiting: ['perplexity'],
        citationCount: 1,
        rivalsFed: ['Postmark'],
        urls: ['https://www.g2.com/categories/transactional-email'],
      },
    ],
  });
  assert.ok(playbook.score >= 9.5);
  assert.ok(playbook.content.includes('Off-Site AI Citation Acquisition Playbook'));
  assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(playbook.content));
});
