import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  PATIENT_ZERO_DOMAINS,
  PATIENT_ZERO_FIXES,
  PATIENT_ZERO_PITCH_REPORT,
  PATIENT_ZERO_SNAPSHOTS,
  CitationMentionVerifyError,
  CompetitorXrayError,
  SubPageInspectionError,
  VERISOURCE_VERSION,
  analyzeCrawlerHtmlReadability,
  analyzeHtmlForBotExtraction,
  autoDraftBrandTruthSheet,
  AGENCY_SANDBOX_COLOR_SWATCHES,
  buildAgencyColdOutreachNote,
  buildAgencyColdOutreachSequence,
  buildAgencyPartnerBatchCsv,
  buildAgencyPartnerOutreachNote,
  buildAgencyPartnerOutreachSequence,
  buildAgencyPartnerPlaybookMarkdown,
  buildAgencyPitchPayload,
  buildAgencySandboxPreview,
  buildAiAttributionSnippet,
  buildAiRemediationMasterPrompt,
  buildAnalyticsInstallAiPrompt,
  buildBatchOutreachCsv,
  buildBatchOutreachMarkdown,
  buildCitationAnswerPageBundle,
  buildCitationGapActionPlaybookMarkdown,
  buildEdgeBotCrawlerSnippet,
  buildExecutiveAuditReportMarkdown,
  buildFollowUpVerificationAiPrompt,
  buildFreeAuditSummaryAlert,
  buildHallucinationDriftAlert,
  buildImplementationBundleMarkdown,
  buildLiveFixVerificationFromSummary,
  buildLocalServiceBatchCsv,
  buildLocalServiceOutreachSequence,
  buildLocalServicePlaybookMarkdown,
  buildMagicLinkSignInAlert,
  buildMcpClientSetupBundle,
  buildMcpDiscoveryManifest,
  MCP_CLIENT_APP_OPTIONS,
  AI_ROI_VERTICAL_PRESETS,
  buildAffiliateConversionAlert,
  buildPartnerOnboardingAlert,
  buildShopifyThemeExtensionBundle,
  buildWordPressConnectorPluginPhp,
  computeAiSearchRoiProjection,
  computePartnerCommissionBreakdown,
  deriveWorkspacePartnerSlug,
  dispatchPartnerOnboardingEmail,
  isSelfReferralAttempt,
  sanitizeAffiliateCode,
  SUBSCRIBER_REFERRAL_DESTINATIONS,
  buildSubscriberReferralBundle,
  buildPlainEnglishSiteDiagnosis,
  buildPostPurchaseWelcomeAlert,
  buildProspectCtaClickAlert,
  buildProspectOpenAlert,
  buildProspectPdfExportAlert,
  buildPublicAiPromptTeaser,
  buildShopifyCustomerEventsPixel,
  buildTargetedCitationOutreachDraft,
  buildTrialActivationNudgeAlert,
  buildWeeklyExecutiveDigest,
  buildWhiteLabelExecutiveBriefMarkdown,
  classifyAgentsMdContent,
  classifyCitationSourceCategory,
  classifyIndustryVertical,
  classifyPitchShowcaseBucket,
  classifyPromptIntent,
  computeScoreDeltaSummary,
  computeShopifyCheckoutKey,
  detectHallucinations,
  detectWebsitePlatform,
  dispatchFreeAuditSummaryEmail,
  dispatchHallucinationDriftEmail,
  dispatchMagicLinkSignInEmail,
  dispatchPostPurchaseWelcomeEmail,
  dispatchProspectCtaClickEmail,
  dispatchProspectOpenEmail,
  dispatchProspectPdfExportEmail,
  dispatchTrialActivationNudgeEmail,
  dispatchWeeklyExecutiveDigestEmail,
  enforceQualityGate95,
  evaluateCommerceAttributeReadiness,
  evaluateOffSiteCitationMention,
  evaluatePublishedCitationPage,
  evaluateTrackerInstallation,
  evaluateTrialLifecycleStage,
  filterAndRankPitchReports,
  resolveSafeExternalCitationUrl,
  summarizePitchEngagementCounts,
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
  getAllCmsStarterTemplates,
  getCmsStarterTemplate,
  getWebsitePlatformMeta,
  gradeArtifactQuality,
  inspectJsonLdAiReadiness,
  isAutomatedPreviewBot,
  isFixTypeLiveOnDomain,
  fetchWithSafePublicRedirects,
  matchesPublicHostname,
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
        <p>Free US shipping on orders over $35.00 USD plus local delivery within 25 miles of Springfield, MO.</p>
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
                text: 'Mosaic Coffee Roasters offers single-origin beans with free US shipping on orders over $35 plus local delivery within 25 miles of Springfield, MO[1].',
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

test('M52 Plain-English Site Diagnosis & 1-Click Analytics Install AI Prompt translate technical issues cleanly (>= 9.5/10, 0 jargon leaks)', () => {
  const brokenDiagnosis = buildPlainEnglishSiteDiagnosis({
    brandName: 'Acme Roofing',
    hostname: 'acmeroofing.com',
    visibilityScore: 34,
    accuracyScore: 62,
    robotsAiBotStatus: {
      GPTBot: false,
      'OAI-SearchBot': true,
      PerplexityBot: false,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: false,
    },
    llmsTxtStatus: 'missing',
    agentsMdStatus: 'missing',
    jsonLdCount: 0,
    crawlerReadability: {
      status: 'csr_js_trap',
      rawHtmlBytes: 42000,
      visibleTextChars: 112,
      visibleWordCount: 18,
      estimatedTokens: 24,
      signalToHtmlPct: 0.4,
      hasSemanticLandmarks: false,
      detectedCsrShell: true,
      summary: 'Empty SPA shell',
    },
    hallucinationCount: 2,
    brandMentionedInSample: false,
    topRivals: ['Apex Exteriors', 'Summit Roof Co'],
  });

  assert.equal(brokenDiagnosis.issueCount, 5);
  assert.equal(brokenDiagnosis.issues[0]?.id, 'bots_blocked');
  assert.equal(brokenDiagnosis.issues[1]?.id, 'js_blank_page');
  assert.equal(brokenDiagnosis.issues[2]?.id, 'wrong_ai_facts');
  assert.equal(brokenDiagnosis.issues[3]?.id, 'missing_ai_files');
  assert.equal(brokenDiagnosis.issues[4]?.id, 'rivals_shortlisted_ahead');

  for (const issue of brokenDiagnosis.issues) {
    const combined = `${issue.whatIsWrong} ${issue.whyItMatters} ${issue.howToFixPlain}`;
    const graded = gradeArtifactQuality(combined);
    assert.equal(graded.breakdown.lexicon_filter, 2.0, `Banned word in ${issue.id}`);
    assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(combined));
  }

  const healthyDiagnosis = buildPlainEnglishSiteDiagnosis({
    brandName: 'Verisource',
    hostname: 'verisource.dev',
    visibilityScore: 94,
    accuracyScore: 100,
    robotsAiBotStatus: {
      GPTBot: true,
      'OAI-SearchBot': true,
      PerplexityBot: true,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: false,
    },
    llmsTxtStatus: 'present',
    agentsMdStatus: 'custom_enriched',
    jsonLdCount: 2,
    hallucinationCount: 0,
    brandMentionedInSample: true,
    topRivals: [],
  });
  assert.equal(healthyDiagnosis.issueCount, 0);
  assert.equal(healthyDiagnosis.issues[0]?.id, 'all_core_healthy');

  const pixel = buildAiAttributionSnippet({
    trackingPixelToken: '11111111-2222-4000-8000-333333333333',
    ingestionUrl: 'https://verisource.dev/api/pixel',
  });
  const trackerPrompt = buildAnalyticsInstallAiPrompt({
    brandName: 'Acme Roofing',
    hostname: 'acmeroofing.com',
    isShopify: false,
    browserPixelSnippet: pixel,
  });
  assert.ok(trackerPrompt.score >= 9.5);
  assert.ok(trackerPrompt.content.includes('https://verisource.dev/api/pixel'));
  assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(trackerPrompt.content));
});

test('M53 7-Day Trial Lifecycle Evaluator & Day-3 / Day-5 Plain-English Activation Nudges pass >= 9.5/10 with strict guardrails', async () => {
  const baseNow = Date.parse('2026-11-20T12:00:00Z');
  const hrsAgo = (h: number) => new Date(baseNow - h * 3600 * 1000).toISOString();

  // Day-3 window (72h) on active Starter & Pro trials
  assert.equal(
    evaluateTrialLifecycleStage({
      planTier: 'pro_99',
      billingCycle: 'monthly',
      mcpCallsLimit: 150,
      stripeSubscriptionId: 'sub_trial_123',
      profileCreatedAtIso: hrsAgo(72),
      nowMs: baseNow,
    }),
    'day3_copy_ai_prompt'
  );

  // Day-5 window (120h)
  assert.equal(
    evaluateTrialLifecycleStage({
      planTier: 'starter_49',
      billingCycle: 'monthly',
      mcpCallsLimit: 25,
      stripeSubscriptionId: 'sub_trial_456',
      profileCreatedAtIso: hrsAgo(120),
      nowMs: baseNow,
    }),
    'day5_value_proof'
  );

  // Excludes renewed Pro (1000 credits), annual, Agency, Tripwire-upgraded, Day-0 (12h), and Month-2 (300h)
  assert.equal(
    evaluateTrialLifecycleStage({
      planTier: 'pro_99',
      billingCycle: 'monthly',
      mcpCallsLimit: 1000,
      stripeSubscriptionId: 'sub_paid_123',
      profileCreatedAtIso: hrsAgo(72),
      nowMs: baseNow,
    }),
    null
  );
  assert.equal(
    evaluateTrialLifecycleStage({
      planTier: 'agency_249',
      billingCycle: 'monthly',
      stripeSubscriptionId: 'sub_agency',
      profileCreatedAtIso: hrsAgo(72),
      nowMs: baseNow,
    }),
    null
  );
  assert.equal(
    evaluateTrialLifecycleStage({
      planTier: 'pro_99',
      billingCycle: 'annual',
      mcpCallsLimit: 150,
      stripeSubscriptionId: 'sub_ann',
      profileCreatedAtIso: hrsAgo(72),
      nowMs: baseNow,
    }),
    null
  );
  assert.equal(
    evaluateTrialLifecycleStage({
      planTier: 'starter_49',
      billingCycle: 'monthly',
      stripeSubscriptionId: 'sub_trip',
      tripwirePaidAt: hrsAgo(90),
      profileCreatedAtIso: hrsAgo(72),
      nowMs: baseNow,
    }),
    null
  );
  assert.equal(
    evaluateTrialLifecycleStage({
      planTier: 'pro_99',
      billingCycle: 'monthly',
      mcpCallsLimit: 150,
      stripeSubscriptionId: 'sub_day0',
      profileCreatedAtIso: hrsAgo(12),
      nowMs: baseNow,
    }),
    null
  );

  const day3DomainAlert = buildTrialActivationNudgeAlert({
    stage: 'day3_copy_ai_prompt',
    planTier: 'pro_99',
    brandName: 'Acme Dental',
    domainUrl: 'https://acmedental.com',
    visibilityScore: 38,
    accuracyScore: 72,
    appliedFixesCount: 0,
    totalFixesCount: 4,
    hallucinationCount: 1,
  });
  assert.ok(day3DomainAlert.quality.score >= 9.5);
  assert.ok(day3DomainAlert.subject.includes('acmedental.com'));
  assert.ok(day3DomainAlert.text.includes('Copy Prompt for My AI'));
  assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(day3DomainAlert.text));
  assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(day3DomainAlert.html));

  const day3ZeroDomain = buildTrialActivationNudgeAlert({
    stage: 'day3_copy_ai_prompt',
    planTier: 'starter_49',
    domainUrl: null,
  });
  assert.ok(day3ZeroDomain.quality.score >= 9.5);
  assert.ok(day3ZeroDomain.subject.includes('[7-Day Trial Quickstart]'));

  const day5Progress = await dispatchTrialActivationNudgeEmail({
    recipientEmail: 'founder@acmedental.com',
    stage: 'day5_value_proof',
    planTier: 'pro_99',
    brandName: 'Acme Dental',
    domainUrl: 'https://acmedental.com',
    visibilityScore: 84,
    accuracyScore: 100,
    appliedFixesCount: 4,
    totalFixesCount: 4,
    botCrawlCount: 3,
    aiReferralVisits7d: 5,
    topRivals: ['BrightSmile Clinic'],
  });
  assert.equal(day5Progress.mode, 'preview_dry_run');
  assert.ok(day5Progress.qualityScore >= 9.5);
  assert.ok(day5Progress.subject.includes('4/4 AI files live'));
  assert.ok(day5Progress.text.includes('Acme Dental vs. BrightSmile Clinic'));
  assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(day5Progress.text));
});

test('M54 Website Builder / CMS Detector (7 platforms) & Platform-Specific 1-Click AI Prompts pass >= 9.5/10 with /ai-facts no-code routing', () => {
  assert.equal(
    detectWebsitePlatform({
      html: '<link href="https://cdn.shopify.com/s/files/theme.css" />',
    }).platformId,
    'shopify'
  );
  assert.equal(
    detectWebsitePlatform({
      html: '<link rel="stylesheet" href="/wp-content/themes/astra/style.css" />',
    }).platformId,
    'wordpress'
  );
  assert.equal(
    detectWebsitePlatform({
      html: '<html data-wf-site="65a123" data-wf-page="65a456"></html>',
    }).platformId,
    'webflow'
  );
  assert.equal(
    detectWebsitePlatform({
      html: '<meta name="generator" content="Wix.com Website Builder" />',
    }).platformId,
    'wix'
  );
  assert.equal(
    detectWebsitePlatform({
      html: '<!-- This is Squarespace. --><script src="https://static1.squarespace.com/static/ta.js"></script>',
    }).platformId,
    'squarespace'
  );
  assert.equal(
    detectWebsitePlatform({
      html: '<div data-framer-hydrate-v2="true"></div>',
    }).platformId,
    'framer'
  );
  assert.equal(
    detectWebsitePlatform({
      html: '<!doctype html><html><body><div id="__next">App</div></body></html>',
    }).platformId,
    'nextjs_custom'
  );

  assert.equal(
    getWebsitePlatformMeta('webflow').recommendedAiEnv,
    'webflow_cms'
  );
  assert.equal(
    getWebsitePlatformMeta('squarespace').recommendedAiEnv,
    'wix_squarespace_framer'
  );

  const sampleDom = {
    ...PATIENT_ZERO_DOMAINS[1]!,
    domain_url: 'https://acmedental.com',
    brand_name: 'Acme Dental',
    is_shopify: false,
  };
  const sampleFixes = PATIENT_ZERO_FIXES.filter(
    (f) => f.domain_id === PATIENT_ZERO_DOMAINS[1]!.id
  );

  for (const envMode of [
    'wordpress_cms',
    'webflow_cms',
    'wix_squarespace_framer',
  ] as const) {
    const prompt = buildAiRemediationMasterPrompt({
      domain: sampleDom,
      fixes: sampleFixes,
      targetEnv: envMode,
    });
    assert.ok(prompt.score >= 9.5, `Expected >= 9.5 for ${envMode}`);
    assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|\bCritic\b/i.test(prompt.content));
    if (envMode !== 'wordpress_cms') {
      assert.ok(
        prompt.content.includes('verisource-ai-facts'),
        `Expected /ai-facts container guidance for ${envMode}`
      );
    } else {
      assert.ok(prompt.content.includes('WPCode'));
    }

    const studio = buildCitationAnswerPageBundle({
      domain: sampleDom,
      blueprintType: 'vs_competitor',
      rivalName: 'BrightSmile',
      targetEnv: envMode,
    });
    assert.ok(studio.aiBuildPrompt.score >= 9.5);
  }
});

test('M55 White-Label PitchSummaryPayload populates detected_platform & pure business_impact_items with zero Verisource or plain-English leaks', () => {
  const pitch = buildAgencyPitchPayload({
    brandName: 'Summit Orthodontics',
    hostname: 'summitortho.com',
    robotsAiBotStatus: {
      GPTBot: false,
      'OAI-SearchBot': true,
      PerplexityBot: false,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: false,
    },
    llmsTxtStatus: 'missing',
    agentsMdStatus: 'missing',
    isShopify: false,
    detectedPlatform: 'squarespace',
    detectedPlatformLabel: 'Squarespace',
    shopifyMcpStatus: 'unavailable',
    jsonLdCount: 0,
    scanResults: [
      {
        promptText: 'Best orthodontist in Denver',
        aiEngine: 'chatgpt',
        brandMentioned: false,
        citationRank: null,
        competitorsMentioned: ['Mile High Braces', 'Peak Ortho'],
        citedSourceUrls: ['https://yelp.com/biz/mile-high-braces'],
        decompiledFanoutQueries: ['denver invisalign pricing'],
        fanoutTelemetryType: 'observed_query',
        hallucinationDetected: true,
        hallucinationDetails: [
          {
            claim_text: 'Summit Orthodontics starts at $1,900',
            verified_truth: 'Comprehensive treatment starts at $4,500',
            severity: 'high',
            category: 'pricing',
          },
        ],
        rawAnswerExcerpt: 'Mile High Braces and Peak Ortho lead Denver reviews.',
      },
    ],
    allHallucinations: [
      {
        claim_text: 'Summit Orthodontics starts at $1,900',
        verified_truth: 'Comprehensive treatment starts at $4,500',
        severity: 'high',
        category: 'pricing',
      },
    ],
  });

  assert.equal(pitch.detected_platform, 'squarespace');
  assert.equal(pitch.detected_platform_label, 'Squarespace');
  assert.ok((pitch.business_impact_items?.length ?? 0) >= 3);

  for (const item of pitch.business_impact_items ?? []) {
    const combined = `${item.whatIsWrong} ${item.whyItMatters} ${item.howToFix}`;
    assert.ok(
      !/verisource/i.test(combined),
      `Expected pure white-label agency isolation in business_impact_items, got: ${combined}`
    );
    assert.ok(
      !/plain[- ]english|in english|everyday english/i.test(combined),
      `Expected zero "plain English" phrasing in business_impact_items`
    );
    const graded = gradeArtifactQuality(combined);
    assert.equal(graded.breakdown.lexicon_filter, 2.0);
  }
});

test('M58 buildPublicAiPromptTeaser generates >= 9.5/10 tailored headers and non-scrapeable redacted lines across all 6 environments', () => {
  const envs = [
    'coding_agent',
    'wordpress_cms',
    'webflow_cms',
    'wix_squarespace_framer',
    'shopify_liquid',
    'chat_assistant',
  ] as const;

  for (const targetEnv of envs) {
    const teaser = buildPublicAiPromptTeaser({
      brandName: 'Northstar Dental Studio',
      hostname: 'northstardental.com',
      targetEnv,
      robotsAiBotStatus: {
        GPTBot: true,
        'OAI-SearchBot': true,
        PerplexityBot: false,
        ClaudeBot: true,
        'Google-Extended': true,
        waf_blocked: false,
      },
      llmsTxtStatus: 'missing',
      agentsMdStatus: 'missing',
      jsonLdCount: 0,
      isShopify: targetEnv === 'shopify_liquid',
      hallucinationDetected: true,
    });

    assert.equal(teaser.targetEnv, targetEnv);
    assert.ok(
      teaser.qualityScore >= 9.5,
      `Expected teaser qualityScore >= 9.5 for ${targetEnv}, got ${teaser.qualityScore}`
    );
    assert.ok(teaser.visibleHeaderText.includes('northstardental.com'));
    assert.ok(teaser.visibleHeaderText.includes('PerplexityBot'));
    assert.equal(teaser.redactedPayloadLines.length, 3);
    assert.ok(
      teaser.redactedPayloadLines.every(
        (l) => l.includes('locked') || l.includes('301 redirect') || l.includes('checklist')
      ),
      'Expected redacted lines to contain only structural placeholders without paid schema payloads'
    );
    if (targetEnv === 'webflow_cms' || targetEnv === 'wix_squarespace_framer') {
      assert.ok(
        teaser.redactedPayloadLines.some((l) =>
          l.includes('verisource-ai-facts')
        )
      );
    }
    const combined = `${teaser.whereToPasteLine} ${teaser.visibleHeaderText}`;
    assert.ok(!/plain[- ]english|\bin english\b|everyday english/i.test(combined));
    assert.ok(!/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(combined));
    assert.equal(gradeArtifactQuality(combined).breakdown.lexicon_filter, 2.0);
  }
});

test('M60 buildFreeAuditSummaryAlert & dispatchFreeAuditSummaryEmail generate >= 9.5/10 mobile-to-desktop action plans', async () => {
  const sampleSummary = await runDomainReadinessScan('https://mosaicroasters.com', {
    PROVIDER_MODE: 'mock',
  });
  const built = buildFreeAuditSummaryAlert({
    summary: sampleSummary,
    targetEnv: 'shopify_liquid',
    appOrigin: 'https://verisource.dev',
  });
  assert.ok(built.quality.score >= 9.5);
  assert.ok(built.trialUrl.includes('domain=mosaicroasters.com'));
  assert.ok(built.trialUrl.includes('env=shopify_liquid'));
  assert.ok(!/plain[- ]english|\bin english\b|everyday english/i.test(built.text));
  assert.ok(!/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(built.text));
  assert.equal(gradeArtifactQuality(built.text).breakdown.lexicon_filter, 2.0);

  const dryRun = await dispatchFreeAuditSummaryEmail({
    summary: sampleSummary,
    targetEnv: 'shopify_liquid',
    recipientEmail: 'founder@mosaicroasters.com',
  });
  assert.equal(dryRun.mode, 'preview_dry_run');
  assert.equal(dryRun.delivered, false);
  assert.ok(dryRun.qualityScore >= 9.5);
});

test('M61 buildFollowUpVerificationAiPrompt targets only unverified checks across all 6 CMS modes (>= 9.5/10) and celebrates 4/4 live', () => {
  const sampleDom = {
    ...PATIENT_ZERO_DOMAINS[1]!,
    domain_url: 'https://summitdental.com',
    brand_name: 'Summit Dental',
    is_shopify: false,
  };
  const sampleFixes = PATIENT_ZERO_FIXES.filter(
    (f) => f.domain_id === PATIENT_ZERO_DOMAINS[1]!.id
  );

  const partialVerification = {
    domainUrl: 'https://summitdental.com',
    hostname: 'summitdental.com',
    brandName: 'Summit Dental',
    checkedAt: '2026-11-16T00:00:00.000Z',
    isShopify: false,
    detectedPlatform: 'webflow' as const,
    detectedPlatformLabel: 'Webflow',
    shopifyMcpStatus: 'unavailable' as const,
    agentsMdStatus: 'missing' as const,
    llmsTxtStatus: 'missing' as const,
    robotsAiBotStatus: {
      GPTBot: true,
      'OAI-SearchBot': true,
      PerplexityBot: true,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: false,
    },
    jsonLdCount: 2,
    hasFaqSchema: true,
    appliedFixTypes: ['json_ld_schema' as const, 'fanout_faq_block' as const],
    checks: [
      {
        id: 'json_ld' as const,
        label: 'JSON-LD Entity + FAQ Graph',
        live: true,
        detail: '2 schema.org nodes live (includes FAQPage)',
      },
      {
        id: 'llms_txt' as const,
        label: 'Canonical /llms.txt',
        live: false,
        detail: 'Missing or soft-404 at /llms.txt',
      },
      {
        id: 'agents_md' as const,
        label: 'Canonical /agents.md',
        live: false,
        detail: 'No /agents.md or alternate Markdown link detected',
      },
      {
        id: 'crawler_waf' as const,
        label: 'AI Bot & Edge WAF Access',
        live: true,
        detail:
          'GPTBot, OAI-SearchBot, PerplexityBot & ClaudeBot allowed (HTTP 200)',
      },
    ],
  };

  for (const targetEnv of [
    'coding_agent',
    'wordpress_cms',
    'webflow_cms',
    'wix_squarespace_framer',
    'shopify_liquid',
    'chat_assistant',
  ] as const) {
    const res = buildFollowUpVerificationAiPrompt({
      domain: sampleDom,
      verification: partialVerification,
      fixes: sampleFixes,
      targetEnv,
    });
    assert.equal(res.allVerified, false);
    assert.equal(res.liveCount, 2);
    assert.equal(res.remainingCount, 2);
    assert.deepEqual(res.remainingCheckIds, ['llms_txt', 'agents_md']);
    assert.ok(
      res.prompt.score >= 9.5,
      `Expected >= 9.5 for ${targetEnv}, got ${res.prompt.score}`
    );
    // Already-live JSON-LD schema payload must NOT be re-emitted
    assert.ok(
      !res.prompt.content.includes('```json'),
      `Expected live JSON-LD block to be omitted from targeted follow-up prompt (${targetEnv})`
    );
    assert.ok(res.prompt.content.includes('KEEP INTACT · LIVE'));

    if (targetEnv === 'webflow_cms') {
      assert.ok(res.prompt.content.includes('Publish to Selected Domains'));
      assert.ok(res.prompt.content.includes('verisource-ai-facts'));
    }
    if (targetEnv === 'wordpress_cms') {
      assert.ok(res.prompt.content.includes('WPCode'));
    }

    const combinedText = [
      res.prompt.content,
      ...res.checkGuidance.map(
        (g) => `${g.statusDetail} ${g.troubleshootingTip}`
      ),
    ].join('\n');
    assert.ok(
      !/plain[- ]english|\bin english\b|everyday english/i.test(combinedText)
    );
    assert.ok(
      !/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(combinedText)
    );
    assert.equal(
      gradeArtifactQuality(combinedText).breakdown.lexicon_filter,
      2.0
    );
  }

  const allLiveVerification = {
    ...partialVerification,
    agentsMdStatus: 'custom_enriched' as const,
    llmsTxtStatus: 'present' as const,
    checks: partialVerification.checks.map((c) => ({
      ...c,
      live: true,
      detail: 'Verified HTTP 200 live',
    })),
  };

  const fullPass = buildFollowUpVerificationAiPrompt({
    domain: sampleDom,
    verification: allLiveVerification,
    fixes: sampleFixes,
    targetEnv: 'webflow_cms',
  });
  assert.equal(fullPass.allVerified, true);
  assert.equal(fullPass.liveCount, 4);
  assert.equal(fullPass.remainingCount, 0);
  assert.equal(fullPass.remainingCheckIds.length, 0);
  assert.ok(fullPass.prompt.score >= 9.5);
  assert.ok(
    fullPass.prompt.content.includes('AI Citation & Rival Comparison Page Studio')
  );
});

test('M61.1 detectHallucinations isolates multi-vendor Perplexity bullet lists (.[3] footnotes) & autoDraftBrandTruthSheet prefers live $35 shipping banner', () => {
  const mosaicTruth = PATIENT_ZERO_DOMAINS[1]!.brand_truth_sheet;
  assert.ok(
    mosaicTruth.shipping_or_service_area.includes('$35'),
    'Expected Mosaic verified shipping policy to reflect real $35 free-shipping threshold'
  );

  // Exact verbatim multi-vendor Perplexity answer where $38 belonged to Springfield Coffee Roasting, NOT Mosaic
  const multiVendorPerplexityAnswer = [
    '**Top picks for single-origin beans with local delivery:**',
    '',
    '- **Journey Coffee Roasters** — Best fit if you want specialty single-origin options and an easy subscription: it roasts to order and offers free delivery in the Springfield area, including with subscriptions.[1]',
    '- **Springfield Coffee Roasting** — Offers air-roasted single-origin coffee, roasted to order, with free delivery in Springfield; the minimum is two bags, with a two-bag offer listed at $38.[3]',
    '- **Mosaic Coffee Roasters** — A local small-batch option with single-origin coffees and free delivery within 25 miles, according to a Springfield roaster directory.[5]',
    '- **Copper Canyon Coffee Roasters** — Just outside Springfield in Battlefield, with fresh-to-order single origins such as Ethiopian, Colombian, and Kenyan coffees.',
  ].join('\n');

  const falsePositives = detectHallucinations(
    multiVendorPerplexityAnswer,
    'Mosaic Coffee Roasters',
    mosaicTruth
  );
  assert.equal(
    falsePositives.length,
    0,
    `Expected 0 false-positive hallucinations from rival $38 bullet, got: ${JSON.stringify(falsePositives)}`
  );

  // Single-line collapsed variant (as rendered in excerpt snippets) must also produce 0 false positives
  const inlineCollapsedVariant = multiVendorPerplexityAnswer.replace(/\n+/g, ' ');
  assert.equal(
    detectHallucinations(
      inlineCollapsedVariant,
      'Mosaic Coffee Roasters',
      mosaicTruth
    ).length,
    0
  );

  // Product bag price ($21.95) in same sentence as free delivery must NOT be misread as a shipping threshold
  assert.equal(
    detectHallucinations(
      'Mosaic Coffee Roasters sells 12oz single-origin bags for $21.95 with free local delivery within 25 miles.',
      'Mosaic Coffee Roasters',
      mosaicTruth
    ).length,
    0
  );

  // Genuine wrong Mosaic shipping threshold ($15 or $25 vs $35) MUST still be flagged cleanly without raw ** or [2]
  const genuineWrongClaim = detectHallucinations(
    '- **Mosaic Coffee Roasters** — Offers free shipping on orders over $15 nationwide.[2]',
    'Mosaic Coffee Roasters',
    mosaicTruth
  );
  assert.equal(genuineWrongClaim.length, 1);
  assert.equal(genuineWrongClaim[0]!.category, 'shipping');
  assert.ok(!genuineWrongClaim[0]!.claim_text.includes('**'));
  assert.ok(!genuineWrongClaim[0]!.claim_text.includes('[2]'));
  assert.ok(genuineWrongClaim[0]!.verified_truth.includes('$35'));

  // Live storefront HTML shipping banner overrides any stale fixture dollar figure
  const drafted = autoDraftBrandTruthSheet(
    {
      domain: normalizePublicDomain('https://mosaicroasters.com'),
      reachable: true,
      httpStatus: 200,
      title: 'Mosaic Coffee Roasters',
      metaDescription: null,
      jsonLdBlocks: [],
      robotsAiBotStatus: {
        GPTBot: true,
        'OAI-SearchBot': true,
        PerplexityBot: true,
        ClaudeBot: true,
        'Google-Extended': true,
        waf_blocked: false,
      },
      llmsTxtStatus: 'missing',
      llmsTxtExcerpt: null,
      agentsMdRaw: null,
      agentsMdInitialStatus: 'missing',
      htmlSignalsShopify: true,
      extractedPriceMentions: ['$21.95'],
      extractedShippingMentions: ['FREE SHIPPING ON ORDERS OVER $40!'],
    },
    {
      isShopify: true,
      shopifyMcpStatus: 'ucp_active',
      activeMcpEndpoint: 'https://mosaicroasters.com/api/ucp/mcp',
      exposedMcpTools: [],
      agentsMdStatus: 'custom_enriched',
      catalogSkus: [],
      priceRangeSummary: '$21.95 USD',
    }
  );
  assert.equal(drafted.shipping_or_service_area, 'FREE SHIPPING ON ORDERS OVER $40!');
});

test('M61.2 buildMagicLinkSignInAlert & dispatchMagicLinkSignInEmail generate >= 9.5/10 Resend sign-in emails with HTML escaping', async () => {
  const built = buildMagicLinkSignInAlert({
    recipientEmail: 'aurearoasters@gmail.com',
    actionLink: 'https://verisource.dev/dashboard#access_token=test_otp_token',
    appOrigin: 'https://verisource.dev',
  });
  assert.ok(built.quality.score >= 9.5);
  assert.ok(built.html.includes('aurearoasters@gmail.com'));
  assert.ok(built.html.includes('Sign In to Console'));
  assert.ok(!/plain[- ]english|\bin english\b|everyday english/i.test(built.text));
  assert.ok(!/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(built.text));
  assert.equal(gradeArtifactQuality(built.text).breakdown.lexicon_filter, 2.0);

  const dryRun = await dispatchMagicLinkSignInEmail({
    recipientEmail: 'aurearoasters@gmail.com',
    actionLink: 'https://verisource.dev/dashboard#access_token=test_otp_token',
  });
  assert.equal(dryRun.mode, 'preview_dry_run');
  assert.equal(dryRun.delivered, false);
  assert.ok(dryRun.qualityScore >= 9.5);
});

test('M62 evaluatePublishedCitationPage handles 404 missing routes, partial routes, and 5/5 live comparison pages (>= 9.5/10)', () => {
  const sampleDom = {
    ...PATIENT_ZERO_DOMAINS[1]!,
    domain_url: 'https://summitdental.com',
    brand_name: 'Summit Dental',
    is_shopify: false,
  };
  const bundle = buildCitationAnswerPageBundle({
    domain: sampleDom,
    blueprintType: 'vs_competitor',
    rivalName: 'BrightSmile Clinic',
    targetEnv: 'webflow_cms',
  });

  // 1. Missing 404 route
  const missingInspect = analyzeHtmlForBotExtraction({
    targetUrl: 'https://summitdental.com/compare/summit-dental-vs-brightsmile-clinic',
    pathname: '/compare/summit-dental-vs-brightsmile-clinic',
    hostname: 'summitdental.com',
    httpStatus: 404,
    gptBotStatus: 404,
    perplexityBotStatus: 404,
    rawHtml: '<html><body><h1>404 Not Found</h1></body></html>',
    brandName: 'Summit Dental',
    brandTruthSheet: sampleDom.brand_truth_sheet,
    isShopify: false,
  });
  const missingEval = evaluatePublishedCitationPage({
    domain: sampleDom,
    bundle,
    inspection: missingInspect,
    targetEnv: 'webflow_cms',
  });
  assert.equal(missingEval.isLiveHttp200, false);
  assert.equal(missingEval.allChecksPassed, false);
  assert.ok(missingEval.followUpPagePrompt.score >= 9.5);
  assert.ok(missingEval.nextActionSummary.includes('Publish to Selected Domains'));

  // 2. Partial HTTP 200 route (missing HTML <table> and FAQPage JSON-LD)
  const partialInspect = analyzeHtmlForBotExtraction({
    targetUrl: 'https://summitdental.com/compare/summit-dental-vs-brightsmile-clinic',
    pathname: '/compare/summit-dental-vs-brightsmile-clinic',
    hostname: 'summitdental.com',
    httpStatus: 200,
    gptBotStatus: 200,
    perplexityBotStatus: 200,
    rawHtml:
      '<html><head><title>Summit vs BrightSmile</title></head><body><main><h1>Summit Dental vs BrightSmile</h1><p>' +
      'Verified dental care comparison text for patients evaluating pricing and service coverage. '.repeat(
        12
      ) +
      '</p><h2>Pricing Overview</h2><h2>Coverage Scope</h2></main></body></html>',
    brandName: 'Summit Dental',
    brandTruthSheet: sampleDom.brand_truth_sheet,
    isShopify: false,
  });
  const partialEval = evaluatePublishedCitationPage({
    domain: sampleDom,
    bundle,
    inspection: partialInspect,
    targetEnv: 'wordpress_cms',
  });
  assert.equal(partialEval.isLiveHttp200, true);
  assert.equal(partialEval.allChecksPassed, false);
  assert.ok(partialEval.followUpPagePrompt.score >= 9.5);
  assert.ok(partialEval.followUpPagePrompt.content.includes('KEEP INTACT · LIVE'));
  assert.ok(partialEval.followUpPagePrompt.content.includes('FAQPage'));

  // 3. Full 5/5 verified live comparison page
  const fullInspect = analyzeHtmlForBotExtraction({
    targetUrl: 'https://summitdental.com/compare/summit-dental-vs-brightsmile-clinic',
    pathname: '/compare/summit-dental-vs-brightsmile-clinic',
    hostname: 'summitdental.com',
    httpStatus: 200,
    gptBotStatus: 200,
    perplexityBotStatus: 200,
    rawHtml:
      `<html><head><title>Summit vs BrightSmile</title><script type="application/ld+json">${bundle.faqJsonLd}</script></head><body><main><h1>Summit Dental vs BrightSmile Clinic</h1><p>` +
      'Transparent first-party comparison of dental treatment plans, coverage scope, and appointment scheduling. '.repeat(
        10
      ) +
      '</p><h2>Side-by-Side Matrix</h2><table><tr><th>Factor</th><th>Summit Dental</th></tr><tr><td>Pricing</td><td>$199 exam</td></tr></table><h2>Buyer FAQ</h2></main></body></html>',
    brandName: 'Summit Dental',
    brandTruthSheet: sampleDom.brand_truth_sheet,
    isShopify: false,
  });
  const fullEval = evaluatePublishedCitationPage({
    domain: sampleDom,
    bundle,
    inspection: fullInspect,
    targetEnv: 'coding_agent',
  });
  assert.equal(fullEval.isLiveHttp200, true);
  assert.equal(fullEval.allChecksPassed, true);
  assert.equal(fullEval.hasComparisonTable, true);
  assert.equal(fullEval.hasFaqJsonLd, true);
  assert.ok(
    fullEval.recommendedPromptToTrack.includes(
      'Summit Dental vs BrightSmile Clinic'
    )
  );
  assert.ok(fullEval.followUpPagePrompt.score >= 9.5);

  for (const ev of [missingEval, partialEval, fullEval]) {
    const combined = `${ev.statusHeadline} ${ev.nextActionSummary}\n${ev.followUpPagePrompt.content}`;
    assert.ok(!/plain[- ]english|\bin english\b|everyday english/i.test(combined));
    assert.ok(!/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(combined));
    assert.equal(gradeArtifactQuality(combined).breakdown.lexicon_filter, 2.0);
  }
});

test('M63 buildMcpClientSetupBundle supports all 5 MCP clients, 3 key states, valid JSON configs, and zero-slop starter prompts', () => {
  assert.equal(MCP_CLIENT_APP_OPTIONS.length, 5);
  const rawSampleKey = `vs_live_${'a1b2c3d4'.repeat(6)}`;

  for (const opt of MCP_CLIENT_APP_OPTIONS) {
    const liveBundle = buildMcpClientSetupBundle({
      clientId: opt.id,
      rawBearerKey: rawSampleKey,
      activeKeyPrefix: 'vs_live_a1b2c3',
      targetDomain: 'https://www.SummitDental.com/pricing?utm=test',
    });
    assert.equal(liveBundle.clientId, opt.id);
    assert.equal(liveBundle.keyState, 'live_raw_key');
    assert.ok(liveBundle.configSnippet.includes('https://mcp.verisource.dev/mcp'));
    assert.ok(!liveBundle.configSnippet.includes('/sse'));
    assert.ok(liveBundle.configSnippet.includes(rawSampleKey));
    if (opt.id !== 'curl_rpc') {
      const parsed = JSON.parse(liveBundle.configSnippet) as {
        mcpServers?: {
          verisource?: { url?: string; headers?: { Authorization?: string } };
        };
      };
      assert.equal(
        parsed.mcpServers?.verisource?.url,
        'https://mcp.verisource.dev/mcp'
      );
      assert.equal(
        parsed.mcpServers?.verisource?.headers?.Authorization,
        `Bearer ${rawSampleKey}`
      );
      assert.ok(liveBundle.starterAgentPrompt.includes('summitdental.com'));
    } else {
      assert.ok(liveBundle.configSnippet.includes('summitdental.com'));
      assert.ok(liveBundle.starterAgentPrompt.includes('tools/list'));
    }

    const combined = `${liveBundle.label} ${liveBundle.setupStepsText}\n${liveBundle.starterAgentPrompt}`;
    assert.ok(!/plain[- ]english|\bin english\b|everyday english/i.test(combined));
    assert.ok(!/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(combined));
    assert.equal(gradeArtifactQuality(combined).breakdown.lexicon_filter, 2.0);
  }

  const prefixBundle = buildMcpClientSetupBundle({
    clientId: 'cursor',
    activeKeyPrefix: 'vs_live_9f8e7d',
    targetDomain: 'acmecloud.io',
  });
  assert.equal(prefixBundle.keyState, 'active_prefix_placeholder');
  assert.ok(
    prefixBundle.configSnippet.includes('vs_live_9f8e7d...PASTE_YOUR_SECRET_KEY')
  );

  const unmintedBundle = buildMcpClientSetupBundle({
    clientId: 'antigravity',
    targetDomain: '',
  });
  assert.equal(unmintedBundle.keyState, 'unminted_placeholder');
  assert.ok(unmintedBundle.configSnippet.includes('vs_live_MINT_KEY_ABOVE'));
  assert.ok(unmintedBundle.starterAgentPrompt.includes('yourcompany.com'));
});

test('M64 evaluateTrackerInstallation detects verified_live, token_mismatch, Shopify sandbox telemetry, and CMS not_installed_yet (>= 9.5/10)', () => {
  const token = 'aaaaaaaa-1111-4000-8000-000000000001';
  const snippet = buildAiAttributionSnippet({
    trackingPixelToken: token,
    ingestionUrl: 'https://verisource.dev/api/pixel',
  });
  const shopifySnippet = buildShopifyCustomerEventsPixel({
    trackingPixelToken: token,
    checkoutKey: 'e2b962fabcc3dc0ef625ae83',
    ingestionUrl: 'https://verisource.dev/api/pixel',
  });

  // 1. Verified live in <head>
  const liveRes = evaluateTrackerInstallation({
    hostname: 'mosaicroasters.com',
    brandName: 'Mosaic Coffee Roasters',
    trackingPixelToken: token,
    isShopify: true,
    detectedPlatform: 'shopify',
    httpStatus: 200,
    rawHtml: `<!doctype html><html><head>${snippet}</head><body><h1>Mosaic</h1></body></html>`,
    attributionEvents: [],
    browserPixelSnippet: snippet,
    shopifyCheckoutPixel: shopifySnippet,
  });
  assert.equal(liveRes.overallStatus, 'verified_live');
  assert.equal(liveRes.browserPixelLive, true);
  assert.equal(liveRes.foreignTokenMismatch, false);
  assert.ok(liveRes.followUpInstallPrompt.score >= 9.5);

  // 2. Wrong domain token mismatch (e.g., agency pasted Client A's snippet on Client B)
  const foreignSnippet = buildAiAttributionSnippet({
    trackingPixelToken: 'bbbbbbbb-2222-4000-8000-000000000099',
    ingestionUrl: 'https://verisource.dev/api/pixel',
  });
  const mismatchRes = evaluateTrackerInstallation({
    hostname: 'summitdental.com',
    brandName: 'Summit Dental',
    trackingPixelToken: token,
    isShopify: false,
    detectedPlatform: 'wordpress',
    httpStatus: 200,
    rawHtml: `<!doctype html><html><head>${foreignSnippet}</head><body><h1>Summit</h1></body></html>`,
    attributionEvents: [],
    browserPixelSnippet: snippet,
  });
  assert.equal(mismatchRes.overallStatus, 'token_mismatch');
  assert.equal(mismatchRes.foreignTokenMismatch, true);
  assert.ok(mismatchRes.followUpInstallPrompt.content.includes(token));
  assert.ok(mismatchRes.followUpInstallPrompt.score >= 9.5);

  // 3. Shopify Customer Events sandbox active (events flowing without raw theme.liquid <script>)
  const sandboxRes = evaluateTrackerInstallation({
    hostname: 'mosaicroasters.com',
    brandName: 'Mosaic Coffee Roasters',
    trackingPixelToken: token,
    isShopify: true,
    detectedPlatform: 'shopify',
    httpStatus: 200,
    rawHtml: '<!doctype html><html><head><title>Mosaic</title></head><body></body></html>',
    attributionEvents: [
      {
        id: 'ev-1',
        domain_id: 'd-1',
        event_type: 'ai_referral_conversion',
        source_engine: 'chatgpt.com',
        landing_path: '/checkouts/thank-you',
        conversion_value_usd: 42.5,
        created_at: '2026-11-16T00:00:00Z',
      },
    ],
    browserPixelSnippet: snippet,
    shopifyCheckoutPixel: shopifySnippet,
  });
  assert.equal(sandboxRes.overallStatus, 'telemetry_active_sandbox');
  assert.equal(sandboxRes.conversionEventsCount, 1);
  assert.ok(sandboxRes.followUpInstallPrompt.score >= 9.5);

  // 4. Not installed yet on Webflow
  const missingRes = evaluateTrackerInstallation({
    hostname: 'acmecloud.io',
    brandName: 'Acme Cloud',
    trackingPixelToken: token,
    isShopify: false,
    detectedPlatform: 'webflow',
    httpStatus: 200,
    rawHtml: '<!doctype html><html><head><title>Acme</title></head><body></body></html>',
    attributionEvents: [],
    browserPixelSnippet: snippet,
  });
  assert.equal(missingRes.overallStatus, 'not_installed_yet');
  assert.ok(
    missingRes.cmsTroubleshootingHint.includes('Publish to Selected Domains')
  );
  assert.ok(missingRes.followUpInstallPrompt.score >= 9.5);

  for (const r of [liveRes, mismatchRes, sandboxRes, missingRes]) {
    const combined = `${r.statusHeadline} ${r.cmsTroubleshootingHint}\n${r.followUpInstallPrompt.content}`;
    assert.ok(!/plain[- ]english|\bin english\b|everyday english/i.test(combined));
    assert.ok(!/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(combined));
    assert.equal(gradeArtifactQuality(combined).breakdown.lexicon_filter, 2.0);
  }
});

test('M66 resolveSafeExternalCitationUrl & evaluateOffSiteCitationMention enforce SSRF + own-domain guards and grade all 4 off-site citation states (>= 9.5/10)', () => {
  assert.throws(
    () =>
      resolveSafeExternalCitationUrl(
        'http://169.254.169.254/latest/meta-data/',
        'https://mosaicroasters.com'
      ),
    (err: unknown) =>
      err instanceof CitationMentionVerifyError &&
      err.code === 'INVALID_CITATION_URL'
  );
  assert.throws(
    () =>
      resolveSafeExternalCitationUrl(
        'https://www.mosaicroasters.com/pages/ai-facts',
        'https://mosaicroasters.com'
      ),
    (err: unknown) =>
      err instanceof CitationMentionVerifyError &&
      err.code === 'OWN_DOMAIN_ENTERED'
  );

  const truth = PATIENT_ZERO_DOMAINS[1]!.brand_truth_sheet;

  // 1. Linked citation live (dofollow)
  const linkedRes = evaluateOffSiteCitationMention({
    citationUrl: 'https://sprudge.com/springfield-coffee-guide',
    sourceHost: 'sprudge.com',
    brandName: 'Mosaic Coffee Roasters',
    targetHostname: 'mosaicroasters.com',
    brandTruthSheet: truth,
    httpStatus: 200,
    gptBotStatus: 200,
    perplexityBotStatus: 200,
    rawHtml:
      '<html><body><article><h1>Springfield Guide</h1><p>Local favorites include <a href="https://mosaicroasters.com/collections/all">Mosaic Coffee Roasters</a> with $35+ free shipping.</p></article></body></html>',
  });
  assert.equal(linkedRes.overallStatus, 'citation_live_linked');
  assert.equal(linkedRes.linkRelType, 'dofollow');
  assert.ok(linkedRes.matchedSnippetExcerpt?.includes('Mosaic Coffee Roasters'));
  assert.ok(linkedRes.nextActionNote.score >= 9.5);

  // 2. Linked UGC / nofollow on Reddit
  const ugcRes = evaluateOffSiteCitationMention({
    citationUrl: 'https://reddit.com/r/coffee/comments/abc123',
    sourceHost: 'reddit.com',
    brandName: 'Mosaic Coffee Roasters',
    targetHostname: 'mosaicroasters.com',
    brandTruthSheet: truth,
    httpStatus: 200,
    gptBotStatus: 200,
    perplexityBotStatus: 200,
    rawHtml:
      '<html><body><p>Try <a href="https://mosaicroasters.com" rel="nofollow ugc">Mosaic Coffee Roasters</a> in Springfield.</p></body></html>',
  });
  assert.equal(ugcRes.overallStatus, 'citation_live_linked');
  assert.equal(ugcRes.linkRelType, 'nofollow_or_ugc');
  assert.equal(ugcRes.sourceCategory, 'ugc_community');

  // 3. Unlinked text mention
  const unlinkedRes = evaluateOffSiteCitationMention({
    citationUrl: 'https://feastmagazine.com/missouri-roasters',
    sourceHost: 'feastmagazine.com',
    brandName: 'Mosaic Coffee Roasters',
    targetHostname: 'mosaicroasters.com',
    brandTruthSheet: truth,
    httpStatus: 200,
    gptBotStatus: 200,
    perplexityBotStatus: 200,
    rawHtml:
      '<html><body><p>Mosaic Coffee Roasters roasts small-batch single-origin beans in Springfield, Missouri.</p></body></html>',
  });
  assert.equal(unlinkedRes.overallStatus, 'mention_live_unlinked');
  assert.equal(unlinkedRes.domainLinkPresent, false);
  assert.ok(unlinkedRes.nextActionNote.score >= 9.5);

  // 4. Not mentioned yet + Bot blocked
  const missingRes = evaluateOffSiteCitationMention({
    citationUrl: 'https://g2.com/categories/office-coffee',
    sourceHost: 'g2.com',
    brandName: 'Mosaic Coffee Roasters',
    targetHostname: 'mosaicroasters.com',
    brandTruthSheet: truth,
    httpStatus: 200,
    gptBotStatus: 200,
    perplexityBotStatus: 200,
    rawHtml: '<html><body><p>Top office coffee vendors compared.</p></body></html>',
  });
  assert.equal(missingRes.overallStatus, 'not_mentioned_yet');
  assert.ok(missingRes.nextActionNote.score >= 9.5);

  const blockedRes = evaluateOffSiteCitationMention({
    citationUrl: 'https://protected-blog.io/list',
    sourceHost: 'protected-blog.io',
    brandName: 'Mosaic Coffee Roasters',
    targetHostname: 'mosaicroasters.com',
    brandTruthSheet: truth,
    httpStatus: 403,
    gptBotStatus: 403,
    perplexityBotStatus: 403,
    rawHtml: '',
  });
  assert.equal(blockedRes.overallStatus, 'bot_blocked_or_unreachable');
  assert.ok(blockedRes.nextActionNote.score >= 9.5);

  for (const r of [linkedRes, ugcRes, unlinkedRes, missingRes, blockedRes]) {
    const combined = `${r.statusHeadline}\n${r.nextActionNote.content}`;
    assert.ok(!/plain[- ]english|\bin english\b|everyday english/i.test(combined));
    assert.ok(!/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(combined));
    assert.equal(gradeArtifactQuality(combined).breakdown.lexicon_filter, 2.0);
  }
});

test('M68 summarizePitchEngagementCounts, filterAndRankPitchReports & buildLiveFixVerificationFromSummary work deterministically (>= 9.5/10)', () => {
  const sampleReports = [
    { ...PATIENT_ZERO_PITCH_REPORT, id: 'p-0', share_slug: 'unopened-1', views_count: 0 },
    { ...PATIENT_ZERO_PITCH_REPORT, id: 'p-1', share_slug: 'opened-once', views_count: 1 },
    { ...PATIENT_ZERO_PITCH_REPORT, id: 'p-2', share_slug: 'hot-five', views_count: 5 },
    { ...PATIENT_ZERO_PITCH_REPORT, id: 'p-3', share_slug: 'unopened-2', views_count: 0 },
  ];

  const counts = summarizePitchEngagementCounts(sampleReports);
  assert.equal(counts.allCount, 4);
  assert.equal(counts.openedCount, 2);
  assert.equal(counts.hotCount, 1);
  assert.equal(counts.awaitingOpenCount, 2);

  const openedSorted = filterAndRankPitchReports(sampleReports, 'opened_hot');
  assert.equal(openedSorted.length, 2);
  assert.equal(openedSorted[0]?.share_slug, 'hot-five');
  assert.equal(openedSorted[1]?.share_slug, 'opened-once');

  const awaiting = filterAndRankPitchReports(sampleReports, 'awaiting_open');
  assert.equal(awaiting.length, 2);
  assert.ok(awaiting.every((r) => r.views_count === 0));

  // Extension Side Panel live verification adapter
  const partialSummary = {
    domainUrl: 'https://summitdental.com',
    hostname: 'summitdental.com',
    brandName: 'Summit Dental',
    industryVertical: 'dental_group' as const,
    visibilityScore: 54,
    accuracyScore: 100,
    isShopify: false,
    detectedPlatform: 'webflow' as const,
    detectedPlatformLabel: 'Webflow',
    shopifyMcpStatus: 'unavailable' as const,
    agentsMdStatus: 'missing' as const,
    llmsTxtStatus: 'missing' as const,
    robotsAiBotStatus: {
      GPTBot: true,
      'OAI-SearchBot': true,
      PerplexityBot: true,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: false,
    },
    jsonLdCount: 2,
    samplePromptResult: {
      promptText: 'Best dental implant clinic',
      aiEngine: 'chatgpt',
      brandMentioned: true,
      competitorsMentioned: ['BrightSmile'],
      citedSourceUrlsBlurred: [],
      hallucinationDetected: false,
    },
    upgradeUrl: 'https://verisource.dev/pricing',
  };

  const extVerify = buildLiveFixVerificationFromSummary(partialSummary);
  assert.equal(extVerify.detectedPlatform, 'webflow');
  assert.equal(extVerify.checks.filter((c) => c.live).length, 2);
  assert.ok(extVerify.appliedFixTypes.includes('json_ld_schema'));

  const extFollowUp = buildFollowUpVerificationAiPrompt({
    domain: {
      brand_name: 'Summit Dental',
      domain_url: 'https://summitdental.com',
      is_shopify: false,
      brand_truth_sheet: PATIENT_ZERO_DOMAINS[0]!.brand_truth_sheet,
      visibility_score: 54,
      accuracy_score: 100,
    },
    verification: extVerify,
    fixes: PATIENT_ZERO_FIXES.filter(
      (f) => f.domain_id === PATIENT_ZERO_DOMAINS[0]!.id
    ),
    targetEnv: 'webflow_cms',
  });
  assert.equal(extFollowUp.liveCount, 2);
  assert.equal(extFollowUp.remainingCount, 2);
  assert.ok(extFollowUp.prompt.score >= 9.5);
  assert.equal(
    gradeArtifactQuality(extFollowUp.prompt.content).breakdown.lexicon_filter,
    2.0
  );
});

test('M69 buildProspectCtaClickAlert, dispatchProspectCtaClickEmail & cta_clicked engagement filter pass >= 9.5/10 Critic', async () => {
  const alert = buildProspectCtaClickAlert({
    prospectBrandName: 'Summit Dental <Group>',
    prospectDomain: 'summitdental.com',
    shareSlug: 'summit-dental-audit',
    visibilityScore: 41,
    hallucinationCount: 2,
    viewsCount: 3,
    ctaClicksCount: 1,
    agencyCtaUrl: 'https://cal.com/apex-geo/strategy',
    topGap: 'Missing LocalBusiness JSON-LD and /agents.md pricing truth.',
    agencyBrandName: 'Apex GEO Advisory',
  });
  assert.ok(alert.quality.score >= 9.5);
  assert.ok(alert.subject.includes('[Booking CTA Clicked]'));
  assert.ok(alert.html.includes('Summit Dental &lt;Group&gt;'));
  assert.ok(!/plain[- ]english|\bin english\b|everyday english/i.test(alert.text));
  assert.ok(!/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(alert.text));

  const dryRun = await dispatchProspectCtaClickEmail({
    recipientEmail: 'partner@apexgeo.io',
    prospectBrandName: 'Summit Dental',
    prospectDomain: 'summitdental.com',
    shareSlug: 'summit-dental-audit',
    visibilityScore: 41,
    hallucinationCount: 2,
    viewsCount: 2,
    ctaClicksCount: 1,
    agencyCtaUrl: 'https://cal.com/apex-geo/strategy',
  });
  assert.equal(dryRun.mode, 'preview_dry_run');
  assert.ok(dryRun.qualityScore >= 9.5);

  const reports = [
    { ...PATIENT_ZERO_PITCH_REPORT, id: 'c-0', share_slug: 'views-only', views_count: 4 },
    {
      ...PATIENT_ZERO_PITCH_REPORT,
      id: 'c-1',
      share_slug: 'clicked-once',
      views_count: 1,
      summary_payload: {
        ...PATIENT_ZERO_PITCH_REPORT.summary_payload,
        cta_clicks_count: 1,
      },
    },
    {
      ...PATIENT_ZERO_PITCH_REPORT,
      id: 'c-2',
      share_slug: 'clicked-twice',
      views_count: 2,
      summary_payload: {
        ...PATIENT_ZERO_PITCH_REPORT.summary_payload,
        cta_clicks_count: 2,
      },
    },
  ];
  const counts = summarizePitchEngagementCounts(reports);
  assert.equal(counts.ctaClickedCount, 2);
  assert.equal(counts.openedCount, 3);

  const clickedOnly = filterAndRankPitchReports(reports, 'cta_clicked');
  assert.equal(clickedOnly.length, 2);
  assert.equal(clickedOnly[0]?.share_slug, 'clicked-twice');
  assert.equal(clickedOnly[1]?.share_slug, 'clicked-once');
});

test('M70 (Sprint GTM-3) 7-CMS Starter Templates & smithery.yaml pass >= 9.5/10 Critic with valid JSON-LD and Streamable HTTP', () => {
  const templates = getAllCmsStarterTemplates();
  assert.equal(templates.length, 7);
  assert.equal(getCmsStarterTemplate('webflow').platformId, 'webflow');

  for (const tpl of templates) {
    assert.ok(
      tpl.primaryArtifact.score >= 9.5,
      `Expected ${tpl.platformId} primaryArtifact >= 9.5, got ${tpl.primaryArtifact.score}`
    );
    assert.ok(
      tpl.llmsArtifact.score >= 9.5,
      `Expected ${tpl.platformId} llmsArtifact >= 9.5, got ${tpl.llmsArtifact.score}`
    );

    const jsonLdMatch = tpl.headSnippetCode.match(
      /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/
    );
    assert.ok(jsonLdMatch?.[1], `Expected JSON-LD inside ${tpl.platformId} headSnippetCode`);
    const parsedLd = JSON.parse(jsonLdMatch[1]!) as { '@context'?: string; '@type'?: string };
    assert.equal(parsedLd['@context'], 'https://schema.org');
    assert.ok(parsedLd['@type']);

    const combined = `${tpl.whereToPublish}\n${tpl.primaryArtifact.content}\n${tpl.llmsArtifact.content}`;
    assert.ok(!/example\.com|\bTODO\b|\[Insert /i.test(combined));
    assert.ok(!/plain[- ]english|\bin english\b|everyday english/i.test(combined));
    assert.ok(!/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(combined));
    assert.equal(gradeArtifactQuality(combined).breakdown.lexicon_filter, 2.0);
  }

  const smitheryPath = path.resolve(process.cwd(), '../../smithery.yaml');
  const smitheryRaw = fs.readFileSync(smitheryPath, 'utf8');
  assert.ok(smitheryRaw.includes('url: https://mcp.verisource.dev/mcp'));
  assert.ok(smitheryRaw.includes('name: dev.verisource/mcp'));
  assert.ok(!smitheryRaw.includes('url: https://mcp.verisource.dev/sse'));
});

test('M71 (Sprint GTM-5) COMMUNITY_LAUNCH_KIT.md & 2026 40-Domain Benchmark Study pass >= 9.5/10 Critic with zero Beta or coffee leaks', () => {
  const communityKitPath = path.resolve(
    process.cwd(),
    '../../COMMUNITY_LAUNCH_KIT.md'
  );
  const communityKitMd = fs.readFileSync(communityKitPath, 'utf8');
  const kitAudit = gradeArtifactQuality(communityKitMd, 'agents_md');
  assert.ok(
    kitAudit.score >= 9.5,
    `Expected COMMUNITY_LAUNCH_KIT.md >= 9.5, got ${kitAudit.score}: ${kitAudit.violations.join('; ')}`
  );
  assert.equal(kitAudit.breakdown.lexicon_filter, 2.0);
  assert.ok(
    communityKitMd.includes(
      'https://verisource.dev/benchmarks/ai-search-readiness-2026'
    )
  );
  assert.ok(communityKitMd.includes('https://mcp.verisource.dev/mcp'));
  assert.ok(!communityKitMd.includes('https://mcp.verisource.dev/sse'));
  assert.ok(!/example\.com|\bTODO\b|\[Insert /i.test(communityKitMd));
  assert.ok(
    !/plain[- ]english|\bin english\b|everyday english/i.test(communityKitMd)
  );
  assert.ok(
    !/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(
      communityKitMd
    )
  );
  assert.ok(!/\bbeta\b/i.test(communityKitMd));
  assert.ok(
    !/aurearoasters|mosaicroasters/i.test(communityKitMd),
    'Expected zero coffee-store fixture names in COMMUNITY_LAUNCH_KIT.md'
  );

  const benchmarkSrcPath = path.resolve(
    process.cwd(),
    '../../apps/web/src/lib/benchmark-study-2026.ts'
  );
  const benchmarkSrc = fs.readFileSync(benchmarkSrcPath, 'utf8');
  assert.equal(gradeArtifactQuality(benchmarkSrc).breakdown.lexicon_filter, 2.0);
  assert.ok(!/aurearoasters|mosaicroasters/i.test(benchmarkSrc));
  assert.ok(!/\bbeta\b/i.test(benchmarkSrc));
  assert.ok(
    !/plain[- ]english|\bin english\b|everyday english/i.test(benchmarkSrc)
  );
});

test('M72 (Sprint GTM-6) 25% Recurring Partner Engine, Self-Referral Guard & WordPress/Shopify Connector Bridges pass >= 9.5/10 Critic', async () => {
  assert.equal(sanitizeAffiliateCode('Alex-SEO_2026'), 'alex-seo_2026');
  assert.equal(sanitizeAffiliateCode('ab'), null);
  assert.equal(sanitizeAffiliateCode('bad<script>'), null);
  assert.equal(sanitizeAffiliateCode('-leadinghyphen'), null);

  assert.equal(
    isSelfReferralAttempt({
      affiliateCode: 'alex-rivera',
      buyerEmail: 'alex.rivera@agency.io',
    }),
    true
  );
  assert.equal(
    isSelfReferralAttempt({
      affiliateCode: 'alex-rivera',
      buyerEmail: 'client@otherbrand.com',
    }),
    false
  );

  // 4 Agency referrals ($249/mo) = $249.00/mo ($2,988.00/yr) at 25%
  const fourAgencyMonthly = computePartnerCommissionBreakdown({
    starterCount: 0,
    proCount: 0,
    agencyCount: 4,
    cycle: 'monthly',
  });
  assert.equal(fourAgencyMonthly.grossMrrUsd, 996);
  assert.equal(fourAgencyMonthly.partnerMonthlyCommissionUsd, 249);
  assert.equal(fourAgencyMonthly.partnerAnnualizedCommissionUsd, 2988);

  const annualMix = computePartnerCommissionBreakdown({
    starterCount: 1,
    proCount: 1,
    agencyCount: 1,
    cycle: 'annual',
  });
  // ($39 + $79 + $199) = $317/mo * 0.25 = $79.25/mo * 12 = $951.00 upfront
  assert.equal(annualMix.partnerMonthlyCommissionUsd, 79.25);
  assert.equal(annualMix.upfrontAnnualPayoutUsd, 951);

  const onboardDry = await dispatchPartnerOnboardingEmail({
    partnerName: 'Northstar Search <Studio>',
    partnerEmail: 'partners@northstarseo.io',
    partnerSlug: 'northstar-seo',
    channelUrl: 'https://northstarseo.io/newsletter',
  });
  assert.equal(onboardDry.mode, 'preview_dry_run');
  assert.ok(onboardDry.qualityScore >= 9.5);
  assert.ok(onboardDry.alert.html.includes('Northstar Search &lt;Studio&gt;'));
  assert.equal(
    onboardDry.alert.referralShortUrl,
    'https://verisource.dev/r/northstar-seo'
  );
  assert.ok(!/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(onboardDry.alert.text));

  const paidLedger = buildAffiliateConversionAlert({
    partnerSlug: 'northstar-seo',
    planTier: 'agency_249',
    billingCycle: 'monthly',
    grossAmountCents: 24900,
    isTrialStart: false,
    targetDomain: 'summitdental.com',
  });
  assert.equal(paidLedger.commissionUsd, 62.25);
  assert.ok(paidLedger.quality.score >= 9.5);

  const tripwireLedger = buildAffiliateConversionAlert({
    partnerSlug: 'northstar-seo',
    planTier: 'tripwire_19',
    billingCycle: 'one_time',
    grossAmountCents: 1900,
    isTrialStart: false,
  });
  assert.equal(tripwireLedger.commissionUsd, 0);
  assert.ok(tripwireLedger.quality.score >= 9.5);

  const wpConnector = buildWordPressConnectorPluginPhp({
    defaultBrandName: 'Summit Dental',
    defaultHostname: 'summitdental.com',
  });
  assert.equal(wpConnector.filename, 'verisource-geo-connector.php');
  assert.ok(wpConnector.phpSource.includes("if ( ! defined( 'ABSPATH' ) )"));
  assert.ok(wpConnector.phpSource.includes("'/llms.txt' === $request_path"));
  assert.ok(wpConnector.phpSource.includes("'/agents.md' === $request_path"));
  assert.ok(wpConnector.readmeNotes.score >= 9.5);

  const shopifyConnector = buildShopifyThemeExtensionBundle();
  assert.equal(
    shopifyConnector.liquidBlockFilename,
    'blocks/verisource-ai-truth.liquid'
  );
  assert.ok(shopifyConnector.extensionToml.includes('type = "theme"'));
  const schemaMatch = shopifyConnector.liquidBlockSource.match(
    /\{%\s*schema\s*%\}\s*([\s\S]*?)\s*\{%\s*endschema\s*%\}/
  );
  assert.ok(schemaMatch?.[1], 'Expected valid {% schema %} block in Liquid connector');
  const parsedSchema = JSON.parse(schemaMatch[1]!) as { target?: string };
  assert.equal(parsedSchema.target, 'head');
  assert.ok(shopifyConnector.setupGuide.score >= 9.5);
});

test('M74 Adversarial SSRF Hardening: blocks 0.x.x.x, CGNAT, DNS-rebinding suffixes, non-80/443 ports, substring fixture collisions & 302 metadata redirects', async () => {
  for (const blockedTarget of [
    'http://0.1.2.3/',
    'http://100.100.100.200/latest/meta-data/',
    'https://8.8.8.8/',
    'https://169.254.169.254.nip.io/',
    'https://127.0.0.1.sslip.io/',
    'https://admin.localtest.me/',
    'http://metadata.google.internal/computeMetadata/v1/',
    'https://stripe.com:6379/',
    'https://admin:secret@stripe.com/',
  ]) {
    assert.throws(
      () => normalizePublicDomain(blockedTarget),
      `Expected normalizePublicDomain to block "${blockedTarget}"`
    );
  }

  assert.equal(
    matchesPublicHostname('https://aurearoasters.com', 'aurearoasters.com'),
    true
  );
  assert.equal(
    matchesPublicHostname('https://aurearoasters.com', 'www.aurearoasters.com'),
    true
  );
  assert.equal(
    matchesPublicHostname('https://aurearoasters.com', 'roasters.com'),
    false
  );
  assert.equal(
    matchesPublicHostname('https://aurearoasters.com', 's.com'),
    false
  );

  // Simulate an external domain responding with 302 -> AWS IMDS 169.254.169.254
  const originalFetch = globalThis.fetch;
  try {
    let hitInternalMetadata = false;
    globalThis.fetch = (async (input: string | URL | Request) => {
      const targetStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      if (targetStr.includes('169.254.169.254')) {
        hitInternalMetadata = true;
      }
      return new Response(null, {
        status: 302,
        headers: {
          Location: 'http://169.254.169.254/latest/meta-data/',
        },
      });
    }) as typeof fetch;

    await assert.rejects(() =>
      fetchWithSafePublicRedirects('https://public-attacker-redirect.io/')
    );
    assert.equal(
      hitInternalMetadata,
      false,
      'Expected fetchWithSafePublicRedirects to abort before issuing HTTP request to 169.254.169.254'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('M75 deriveWorkspacePartnerSlug & buildSubscriberReferralBundle generate >= 9.5/10 peer share notes across all 4 destinations & 3 plan tiers', () => {
  assert.equal(
    deriveWorkspacePartnerSlug({
      agencyBrandName: 'Northstar Search Studio',
      email: 'alex@gmail.com',
    }),
    'northstar-search-studio'
  );
  assert.equal(
    deriveWorkspacePartnerSlug({
      primaryDomainUrl: 'https://summitdental.com',
      email: 'dr@gmail.com',
    }),
    'summitdental-partner'
  );
  assert.equal(
    deriveWorkspacePartnerSlug({
      email: 'founder@acmerobotics.io',
    }),
    'acmerobotics-partner'
  );

  for (const planTier of ['starter_49', 'pro_99', 'agency_249'] as const) {
    for (const dest of SUBSCRIBER_REFERRAL_DESTINATIONS) {
      const bundle = buildSubscriberReferralBundle({
        partnerSlug: 'northstar-seo',
        planTier,
        destinationId: dest.id,
      });
      assert.ok(bundle.referralUrl.startsWith('https://verisource.dev/r/northstar-seo'));
      assert.ok(
        bundle.peerShareNote.score >= 9.5,
        `Expected peerShareNote >= 9.5 for ${dest.id}, got ${bundle.peerShareNote.score}`
      );
      assert.equal(bundle.peerShareNote.breakdown.lexicon_filter, 2.0);
      const combined = `${bundle.offsetBillSummary}\n${bundle.peerShareNote.content}`;
      assert.ok(!/plain[- ]english|\bin english\b|everyday english/i.test(combined));
      assert.ok(!/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(combined));
      assert.ok(!/\bbeta\b/i.test(combined));
    }
  }
});

test('M76 buildWhiteLabelExecutiveBriefMarkdown, buildProspectPdfExportAlert & pdf_exports_count pass >= 9.5/10 Critic with strict white-label isolation', async () => {
  const thirdPartyReport = {
    ...PATIENT_ZERO_PITCH_REPORT,
    share_slug: 'summit-dental-exec-audit',
    prospect_domain: 'https://summitdental.com',
    prospect_brand_name: 'Summit Dental Group',
    visibility_score: 41,
    hallucination_count: 1,
    agency_brand_name_snapshot: 'Northstar Search Studio',
    agency_cta_url_snapshot: 'https://cal.com/northstar/ai-audit',
    summary_payload: {
      ...PATIENT_ZERO_PITCH_REPORT.summary_payload,
      detected_platform_label: 'Webflow',
      hallucination_examples: [
        {
          claim_text: 'Summit Dental charges $350 for initial consultations.',
          verified_truth: 'New patient exam and X-ray consultation is $149.',
          severity: 'high' as const,
          category: 'pricing' as const,
        },
      ],
    },
  };

  const wlBrief = buildWhiteLabelExecutiveBriefMarkdown(thirdPartyReport);
  assert.equal(wlBrief.isWhiteLabelIsolated, true);
  assert.equal(wlBrief.agencyName, 'Northstar Search Studio');
  assert.equal(wlBrief.filename, 'summitdental.com-ai-audit-brief.md');
  assert.equal(wlBrief.bookingUrl, 'https://cal.com/northstar/ai-audit');
  assert.ok(wlBrief.markdown.score >= 9.5);
  assert.equal(wlBrief.markdown.breakdown.lexicon_filter, 2.0);
  assert.ok(wlBrief.markdown.content.includes('Northstar Search Studio'));
  assert.ok(wlBrief.markdown.content.includes('https://cal.com/northstar/ai-audit'));
  assert.ok(wlBrief.markdown.content.includes('Webflow'));
  assert.ok(
    !/verisource/i.test(wlBrief.markdown.content) &&
      !/verisource/i.test(wlBrief.filename),
    'Expected strict white-label isolation (zero Verisource mentions) in third-party Executive Brief'
  );
  assert.ok(
    !/plain[- ]english|\bin english\b|everyday english/i.test(
      wlBrief.markdown.content
    )
  );
  assert.ok(
    !/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(
      wlBrief.markdown.content
    )
  );
  assert.ok(!/\bbeta\b/i.test(wlBrief.markdown.content));

  const directBrief = buildWhiteLabelExecutiveBriefMarkdown({
    ...thirdPartyReport,
    agency_brand_name: 'Verisource GEO Advisory',
    agency_brand_name_snapshot: null,
    agency_cta_url: null,
    agency_cta_url_snapshot: null,
  });
  assert.equal(directBrief.isWhiteLabelIsolated, false);
  assert.equal(directBrief.bookingUrl, 'https://verisource.dev/pricing');
  assert.ok(directBrief.markdown.score >= 9.5);

  const pdfAlert = buildProspectPdfExportAlert({
    prospectBrandName: 'Summit Dental <Group>',
    prospectDomain: 'summitdental.com',
    shareSlug: 'summit-dental-exec-audit',
    visibilityScore: 41,
    hallucinationCount: 1,
    viewsCount: 2,
    pdfExportsCount: 1,
    agencyCtaUrl: 'https://cal.com/northstar/ai-audit',
    topGap: 'Missing LocalBusiness JSON-LD and /agents.md pricing truth.',
    agencyBrandName: 'Northstar Search Studio',
  });
  assert.ok(pdfAlert.quality.score >= 9.5);
  assert.ok(pdfAlert.subject.includes('[Executive PDF Saved]'));
  assert.ok(pdfAlert.html.includes('Summit Dental &lt;Group&gt;'));

  const dryRun = await dispatchProspectPdfExportEmail({
    recipientEmail: 'partner@northstar.io',
    prospectBrandName: 'Summit Dental Group',
    prospectDomain: 'summitdental.com',
    shareSlug: 'summit-dental-exec-audit',
    visibilityScore: 41,
    hallucinationCount: 1,
    viewsCount: 2,
    pdfExportsCount: 1,
  });
  assert.equal(dryRun.mode, 'preview_dry_run');
  assert.ok(dryRun.qualityScore >= 9.5);

  const engagementSample = [
    { ...PATIENT_ZERO_PITCH_REPORT, id: 'p-none', share_slug: 'none', views_count: 0 },
    {
      ...PATIENT_ZERO_PITCH_REPORT,
      id: 'p-pdf',
      share_slug: 'pdf-saved',
      views_count: 1,
      summary_payload: {
        ...PATIENT_ZERO_PITCH_REPORT.summary_payload,
        pdf_exports_count: 2,
      },
    },
    {
      ...PATIENT_ZERO_PITCH_REPORT,
      id: 'p-views',
      share_slug: 'views-three',
      views_count: 3,
    },
  ];
  const counts = summarizePitchEngagementCounts(engagementSample);
  assert.equal(counts.pdfExportedCount, 1);
  assert.equal(counts.hotCount, 2);
  const rankedHot = filterAndRankPitchReports(engagementSample, 'opened_hot');
  assert.equal(rankedHot[0]?.share_slug, 'pdf-saved');
});

test('M77 buildAgencySandboxPreview enforces XSS/hex sanitization, strict white-label impact isolation, and >= 9.5/10 Critic outreach preview', () => {
  assert.equal(AGENCY_SANDBOX_COLOR_SWATCHES.length, 5);
  for (const sw of AGENCY_SANDBOX_COLOR_SWATCHES) {
    assert.match(sw.hex, /^#[0-9A-Fa-f]{6}$/);
  }

  const sampleSummary = {
    domainUrl: 'https://vanguardfreight.io',
    hostname: 'vanguardfreight.io',
    brandName: 'Vanguard FreightOps',
    industryVertical: 'general_b2b' as const,
    visibilityScore: 38,
    accuracyScore: 76,
    isShopify: false,
    detectedPlatform: 'webflow' as const,
    detectedPlatformLabel: 'Webflow',
    shopifyMcpStatus: 'unavailable' as const,
    agentsMdStatus: 'missing' as const,
    llmsTxtStatus: 'missing' as const,
    robotsAiBotStatus: {
      GPTBot: true,
      'OAI-SearchBot': true,
      PerplexityBot: false,
      ClaudeBot: true,
      'Google-Extended': true,
      waf_blocked: false,
    },
    jsonLdCount: 1,
    samplePromptResult: {
      promptText: 'Best LTL freight management platform',
      aiEngine: 'chatgpt',
      brandMentioned: false,
      competitorsMentioned: ['Flexport', 'Freightos'],
      citedSourceUrlsBlurred: [],
      hallucinationDetected: true,
    },
    upgradeUrl: 'https://verisource.dev/pricing',
  };

  // XSS javascript: URL + invalid hex + "Verisource" in agency input must all be sanitized
  const sanitized = buildAgencySandboxPreview({
    summary: sampleSummary,
    agencyBrandName: 'Verisource',
    agencyPrimaryColor: 'javascript:bad',
    agencyCtaUrl: 'javascript:alert(1)',
  });
  assert.equal(sanitized.agencyName, 'Northstar Search Studio');
  assert.equal(sanitized.brandColor, '#0A0E17');
  assert.equal(sanitized.bookingUrl, 'https://cal.com/northstar/ai-audit');

  const customAgency = buildAgencySandboxPreview({
    summary: sampleSummary,
    agencyBrandName: 'Apex Search Partners',
    agencyPrimaryColor: '#1E3A8A',
    agencyCtaUrl: 'https://cal.com/apex-search/review',
  });
  assert.equal(customAgency.agencyName, 'Apex Search Partners');
  assert.equal(customAgency.brandColor, '#1E3A8A');
  assert.equal(customAgency.bookingUrl, 'https://cal.com/apex-search/review');
  assert.equal(customAgency.detectedPlatformLabel, 'Webflow');
  assert.ok(customAgency.whiteLabelImpactItems.length >= 2);

  for (const item of customAgency.whiteLabelImpactItems) {
    const itemText = `${item.badgeLabel} ${item.whatIsWrong} ${item.whyItMatters} ${item.howToFix}`;
    assert.ok(
      !/verisource/i.test(itemText),
      `Expected zero Verisource mentions inside white-label impact item: ${itemText}`
    );
    assert.ok(item.howToFix.includes('Apex Search Partners'));
    assert.equal(gradeArtifactQuality(itemText).breakdown.lexicon_filter, 2.0);
  }

  assert.ok(customAgency.outreachPreview.score >= 9.5);
  assert.equal(customAgency.outreachPreview.breakdown.lexicon_filter, 2.0);
  assert.ok(customAgency.outreachPreview.content.includes('[activates on Agency plan]'));
  assert.ok(customAgency.outreachPreview.content.includes('— Apex Search Partners'));
  assert.ok(
    !/plain[- ]english|\bin english\b|everyday english/i.test(
      customAgency.outreachPreview.content
    )
  );
  assert.ok(
    !/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(
      customAgency.outreachPreview.content
    )
  );
  assert.ok(!/\bbeta\b/i.test(customAgency.outreachPreview.content));
});

test('M78 inspectJsonLdAiReadiness classifies empty, partial Organization-only, and full 3-pillar @graph JSON-LD + gtm-content zero-slop check', () => {
  const emptyGraph = inspectJsonLdAiReadiness([]);
  assert.equal(emptyGraph.blockCount, 0);
  assert.equal(emptyGraph.hasEntityIdentity, false);
  assert.equal(emptyGraph.hasFaqPage, false);
  assert.equal(emptyGraph.hasOfferOrPricing, false);
  assert.deepEqual(emptyGraph.missingAiGraphPillars, [
    'entity_identity',
    'faq_page',
    'offer_pricing',
  ]);

  const partialOrgOnly = inspectJsonLdAiReadiness([
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Acme Cloud',
    },
  ]);
  assert.equal(partialOrgOnly.hasEntityIdentity, true);
  assert.equal(partialOrgOnly.hasFaqPage, false);
  assert.equal(partialOrgOnly.hasOfferOrPricing, false);
  assert.deepEqual(partialOrgOnly.missingAiGraphPillars, [
    'faq_page',
    'offer_pricing',
  ]);

  const fullThreePillar = inspectJsonLdAiReadiness([
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'Acme Cloud',
          offers: [
            { '@type': 'Offer', price: '49.00', priceCurrency: 'USD' },
            { '@type': 'Offer', price: '99.00', priceCurrency: 'USD' },
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Q1?',
              acceptedAnswer: { '@type': 'Answer', text: 'A1' },
            },
            {
              '@type': 'Question',
              name: 'Q2?',
              acceptedAnswer: { '@type': 'Answer', text: 'A2' },
            },
          ],
        },
      ],
    },
  ]);
  assert.equal(fullThreePillar.hasEntityIdentity, true);
  assert.equal(fullThreePillar.hasFaqPage, true);
  assert.equal(fullThreePillar.faqQuestionCount, 2);
  assert.equal(fullThreePillar.hasOfferOrPricing, true);
  assert.equal(fullThreePillar.missingAiGraphPillars.length, 0);

  const gtmSrcPath = path.resolve(
    process.cwd(),
    '../../apps/web/src/lib/gtm-content.ts'
  );
  const gtmSrc = fs.readFileSync(gtmSrcPath, 'utf8');
  assert.equal(gradeArtifactQuality(gtmSrc).breakdown.lexicon_filter, 2.0);
  assert.ok(!/aurearoasters|mosaicroasters/i.test(gtmSrc));
  assert.ok(!/\bbeta\b/i.test(gtmSrc));
  assert.ok(!/plain[- ]english|\bin english\b|everyday english/i.test(gtmSrc));
});

test('M79 computeAiSearchRoiProjection computes deterministic 6x+ AI conversion asymmetry across all 4 vertical presets & billing cycles', () => {
  assert.equal(AI_ROI_VERTICAL_PRESETS.length, 4);

  for (const preset of AI_ROI_VERTICAL_PRESETS) {
    const monthlyProj = computeAiSearchRoiProjection({
      presetId: preset.id,
      annualBilling: false,
    });
    const annualProj = computeAiSearchRoiProjection({
      presetId: preset.id,
      annualBilling: true,
    });

    assert.ok(
      monthlyProj.projectedAiCustomersPerMonth >
        monthlyProj.organicEquivalentCustomersPerMonth * 5,
      `Expected >5x AI buyer conversion advantage for ${preset.id}`
    );
    assert.ok(monthlyProj.projectedMonthlyAiRevenueUsd > monthlyProj.planMonthlyCostUsd);
    assert.ok(monthlyProj.roiMultiple > 10);
    assert.ok(annualProj.planMonthlyCostUsd < monthlyProj.planMonthlyCostUsd);
    assert.ok(annualProj.roiMultiple > monthlyProj.roiMultiple);
  }

  // Dental/Legal single $2,800 case covers 28.3 months of $99/mo Pro
  const localProj = computeAiSearchRoiProjection({
    presetId: 'local_services',
    monthlyAiVisits: 20,
    customerValueUsd: 2800,
    annualBilling: false,
  });
  assert.equal(localProj.planMonthlyCostUsd, 99);
  assert.equal(localProj.projectedAiCustomersPerMonth, 3);
  assert.equal(localProj.projectedMonthlyAiRevenueUsd, 8400);
  assert.equal(localProj.monthsCoveredBySingleCustomer, 28.3);
});
