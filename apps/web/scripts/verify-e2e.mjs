import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(__dirname, '..');
const PORT = 3488;
const BASE = `http://127.0.0.1:${PORT}`;

const BANNED_LEXICON =
  /\b(delve\w*|testament\w*|tapestr\w*|elevat\w*|game[- ]chang\w*|unleash\w*|unlock\w*|seamless\w*|comprehensive\w*|moreover|furthermore|beacon\w*|symphon\w*|turbocharg\w*|lorem ipsum)\b/gi;

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Server still booting
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Next.js server did not become ready within ${timeoutMs}ms`);
}

async function run() {
  const nextBin = path.resolve(
    webDir,
    'node_modules',
    'next',
    'dist',
    'bin',
    'next'
  );
  const server = spawn(process.execPath, [nextBin, 'start', '-p', String(PORT)], {
    cwd: webDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PROVIDER_MODE: 'mock',
      STRIPE_SECRET_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
    stdio: 'pipe',
  });

  try {
    await waitForServer(`${BASE}/`);
    console.log('✔ [1/12] Production Next.js server booted cleanly on port', PORT);

    // 1. Landing Page & Zero AI-Slop HTML check
    const homeHtml = await (await fetch(`${BASE}/`)).text();
    assert.ok(homeHtml.includes('Aurea Coffee Roasters'));
    assert.ok(homeHtml.includes('Mosaic Coffee Roasters'));
    const strippedVisible = homeHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    const bannedMatches = strippedVisible.match(BANNED_LEXICON) ?? [];
    assert.equal(
      bannedMatches.length,
      0,
      `Found banned lexicon on /: ${bannedMatches.join(', ')}`
    );
    console.log('✔ [2/12] Landing page rendered with 0 Quality Gate lexicon violations');

    // 2. Public Instant Grader on Aurea & Mosaic + CORS preflight + SSRF block
    const graderCorsRes = await fetch(`${BASE}/api/grader`, {
      method: 'OPTIONS',
    });
    assert.equal(graderCorsRes.status, 204);
    assert.equal(graderCorsRes.headers.get('access-control-allow-origin'), '*');

    const aureaRes = await fetch(`${BASE}/api/grader`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'aurearoasters.com' }),
    });
    assert.equal(aureaRes.status, 200);
    const aureaJson = await aureaRes.json();
    assert.equal(aureaJson.brandName, 'Aurea Coffee Roasters');
    assert.equal(aureaJson.isShopify, true);
    assert.ok(
      aureaJson.samplePromptResult.citedSourceUrlsBlurred[0].includes(
        'locked-citation'
      )
    );

    const mosaicRes = await fetch(`${BASE}/api/grader`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'mosaicroasters.com' }),
    });
    assert.equal(mosaicRes.status, 200);
    const mosaicJson = await mosaicRes.json();
    assert.equal(mosaicJson.brandName, 'Mosaic Coffee Roasters');
    assert.equal(mosaicJson.robotsAiBotStatus.PerplexityBot, false);

    const ssrfRes = await fetch(`${BASE}/api/grader`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'http://169.254.169.254/latest/meta-data/' }),
    });
    assert.equal(ssrfRes.status, 400);
    console.log('✔ [3/12] /api/grader verified on Aurea, Mosaic, and SSRF metadata defense');

    // 3. /api/pixel Origin spoofing & headerless curl rejection + valid conversion ingestion
    const noOriginPixel = await fetch(`${BASE}/api/pixel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'aaaaaaaa-1111-4000-8000-000000000001',
        event_type: 'ai_referral_conversion',
        source_engine: 'chatgpt.com',
        conversion_value_usd: 999,
      }),
    });
    assert.equal(noOriginPixel.status, 403);

    const spoofedPixel = await fetch(`${BASE}/api/pixel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://spoofed-competitor.com',
      },
      body: JSON.stringify({
        token: 'aaaaaaaa-1111-4000-8000-000000000001',
        event_type: 'ai_referral_conversion',
        source_engine: 'chatgpt.com',
        conversion_value_usd: 999,
      }),
    });
    assert.equal(spoofedPixel.status, 403);

    const validPixel = await fetch(`${BASE}/api/pixel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://aurearoasters.com',
      },
      body: JSON.stringify({
        token: 'aaaaaaaa-1111-4000-8000-000000000001',
        event_type: 'ai_referral_conversion',
        source_engine: 'chatgpt.com',
        landing_path: '/checkouts/thank-you',
        conversion_value_usd: 56.0,
      }),
    });
    assert.equal(validPixel.status, 201);
    console.log('✔ [4/12] /api/pixel blocked headerless & cross-origin spoofs (403) and recorded valid conversion (201)');

    // 4. 3-Tab Dashboard & White-Label Prospect Pitch View (+ Zero AI-Slop HTML check)
    const dashRes = await fetch(`${BASE}/dashboard`);
    assert.equal(dashRes.status, 200);
    const dashHtml = await dashRes.text();
    assert.ok(dashHtml.includes('Aurea Coffee Roasters'));
    const strippedDash = dashHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedDash.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on /dashboard'
    );

    const pitchViewRes = await fetch(`${BASE}/audit/mosaic-springfield-audit`);
    assert.equal(pitchViewRes.status, 200);
    const pitchHtml = await pitchViewRes.text();
    assert.ok(pitchHtml.includes('Mosaic Coffee Roasters'));
    assert.ok(pitchHtml.includes('Springfield, MO'));
    console.log('✔ [5/12] /dashboard and /audit/mosaic-springfield-audit rendered cleanly (0 banned words)');

    // 5. Agency Pitch XSS defense (CTA + Logo) + live White-Label slug creation with Agency Logo
    const xssPitchRes = await fetch(`${BASE}/api/dashboard/pitch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospect_domain: 'aurearoasters.com',
        agency_brand_name: 'Apex GEO Partners',
        agency_cta_url: 'javascript:alert(1)',
      }),
    });
    assert.equal(xssPitchRes.status, 400);

    const xssLogoRes = await fetch(`${BASE}/api/dashboard/pitch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospect_domain: 'aurearoasters.com',
        agency_brand_name: 'Apex GEO Partners',
        agency_logo_url: 'javascript:alert(1)',
      }),
    });
    assert.equal(xssLogoRes.status, 400);

    const cleanPitchRes = await fetch(`${BASE}/api/dashboard/pitch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospect_domain: 'aurearoasters.com',
        agency_brand_name: 'Apex GEO Partners',
        agency_logo_url: 'https://verisource.dev/favicon.ico',
        agency_primary_color: '#1E293B',
        agency_cta_url: 'https://cal.com/apex-geo/review',
      }),
    });
    assert.equal(cleanPitchRes.status, 200);
    const cleanPitchJson = await cleanPitchRes.json();
    const mintedPage = await fetch(`${BASE}${cleanPitchJson.share_url}`);
    assert.equal(mintedPage.status, 200);
    const mintedHtml = await mintedPage.text();
    assert.ok(mintedHtml.includes('https://verisource.dev/favicon.ico'));
    console.log('✔ [6/12] 60-Second White-Label Pitch blocked javascript: CTA & logo (400) and rendered custom agency logo on /audit/[slug]');

    // 6. Paid MCP SHA-256 Key Minting
    const keyRes = await fetch(`${BASE}/api/dashboard/mcp-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'E2E Test Agent Key' }),
    });
    assert.equal(keyRes.status, 200);
    const keyJson = await keyRes.json();
    assert.ok(/^vs_live_[0-9a-f]{48}$/.test(keyJson.rawKeyOnce));
    console.log('✔ [7/12] /api/dashboard/mcp-keys minted valid 56-char SHA-256 vs_live_ key');

    // 7. Brand Truth Sheet Verification & 9.5+/10 Fix Regeneration
    const truthRes = await fetch(`${BASE}/api/dashboard/truth-sheet`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        brand_truth_sheet: {
          is_user_verified: true,
          core_offering:
            'Luxury single-origin specialty coffee inspired by Catholic saints.',
          verified_pricing_summary: '12oz whole-bean bags from $22 to $28 USD.',
          shipping_or_service_area: 'Nationwide US shipping; free over $50.',
          key_differentiators: ['QR saint biography & brew guide on every bag'],
          discontinued_or_false_claims_to_flag: ['Does NOT sell K-Cup pods'],
        },
      }),
    });
    assert.equal(truthRes.status, 200);
    const truthJson = await truthRes.json();
    assert.ok(
      truthJson.fixes.every((f) => Number(f.natural_quality_score) >= 9.5)
    );
    console.log('✔ [8/12] Brand Truth Sheet PATCH regenerated fixes with 100% >= 9.5/10 Quality Scores');

    // 8. $19 Tripwire -> 7-Day -$19 Automatic Upgrade Credit -> Single-Use Consumption
    const tripwireRes = await fetch(
      `${BASE}/api/checkout?plan=tripwire_19&cycle=one_time`,
      { redirect: 'manual' }
    );
    assert.equal(tripwireRes.status, 303);
    assert.ok(
      tripwireRes.headers.get('location')?.includes('upgraded=tripwire_19')
    );

    const upgradeRes = await fetch(
      `${BASE}/api/checkout?plan=pro_99&cycle=monthly`,
      { redirect: 'manual' }
    );
    assert.equal(upgradeRes.status, 303);
    assert.ok(
      upgradeRes.headers.get('location')?.includes('credit_applied=true'),
      'Expected 7-day $19 Tripwire credit to apply automatically on upgrade'
    );

    const secondUpgradeRes = await fetch(
      `${BASE}/api/checkout?plan=agency_249&cycle=monthly`,
      { redirect: 'manual' }
    );
    assert.equal(secondUpgradeRes.status, 303);
    assert.ok(
      !secondUpgradeRes.headers.get('location')?.includes('credit_applied=true'),
      'Expected consumed $19 Tripwire credit not to apply a second time'
    );
    console.log('✔ [9/12] Pricing ladder verified: $19 Tripwire -> automatic 7-day -$19 credit -> single-use enforcement');

    // 9. Self-GEO Dogfooding & Chrome Web Store Legal Endpoints (/llms.txt, /agents.md, /robots.txt, /sitemap.xml, /privacy, /terms, JSON-LD)
    const jsonLdMatches =
      homeHtml.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi) ?? [];
    assert.ok(jsonLdMatches.length >= 2, 'Expected >= 2 JSON-LD schema blocks on /');

    const [llmsRes, agentsRes, robotsRes, sitemapRes, privacyRes, termsRes] =
      await Promise.all([
        fetch(`${BASE}/llms.txt`),
        fetch(`${BASE}/agents.md`),
        fetch(`${BASE}/robots.txt`),
        fetch(`${BASE}/sitemap.xml`),
        fetch(`${BASE}/privacy`),
        fetch(`${BASE}/terms`),
      ]);
    assert.equal(llmsRes.status, 200);
    assert.equal(agentsRes.status, 200);
    assert.equal(robotsRes.status, 200);
    assert.equal(sitemapRes.status, 200);
    assert.equal(privacyRes.status, 200);
    assert.equal(termsRes.status, 200);

    const llmsText = await llmsRes.text();
    const agentsText = await agentsRes.text();
    assert.equal((llmsText.match(BANNED_LEXICON) ?? []).length, 0);
    assert.equal((agentsText.match(BANNED_LEXICON) ?? []).length, 0);
    assert.ok(agentsText.includes('https://mcp.verisource.dev/mcp'));
    console.log('✔ [10/12] Self-GEO dogfooding (/llms.txt, /agents.md, /robots.txt, JSON-LD) & legal pages verified');

    // 10. Custom Buyer Prompt Tracking + Self-Serve Live Domain Re-Scan
    const promptRes = await fetch(`${BASE}/api/dashboard/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        prompt_text: 'best single origin specialty coffee gift box online',
      }),
    });
    assert.equal(promptRes.status, 200);
    const promptJson = await promptRes.json();
    assert.equal(promptJson.snapshots.length, 3);
    assert.ok(promptJson.prompt.decompiled_fanout_queries.length > 0);

    const rescanRes = await fetch(`${BASE}/api/dashboard/domains`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
      }),
    });
    assert.equal(rescanRes.status, 200);
    const rescanJson = await rescanRes.json();
    assert.ok(
      rescanJson.fixes.every((f) => Number(f.natural_quality_score) >= 9.5)
    );
    console.log('✔ [11/12] Custom buyer prompt fanout scan (3 engines) & live domain PUT re-scan verified');

    // 11. 1-Click MCP Key Revocation + Self-Serve Domain Addition & Deletion
    const revokeRes = await fetch(
      `${BASE}/api/dashboard/mcp-keys?id=${encodeURIComponent(keyJson.keyRow.id)}`,
      { method: 'DELETE' }
    );
    assert.equal(revokeRes.status, 200);
    const revokeJson = await revokeRes.json();
    assert.equal(revokeJson.revoked, true);
    assert.equal(revokeJson.keyRow.is_active, false);

    const addDomainRes = await fetch(`${BASE}/api/dashboard/domains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain_url: 'stripe.com' }),
    });
    assert.equal(addDomainRes.status, 200);
    const addDomainJson = await addDomainRes.json();
    assert.ok(addDomainJson.domain.id);

    const deleteDomainRes = await fetch(
      `${BASE}/api/dashboard/domains?id=${encodeURIComponent(addDomainJson.domain.id)}`,
      { method: 'DELETE' }
    );
    assert.equal(deleteDomainRes.status, 200);
    const deleteDomainJson = await deleteDomainRes.json();
    assert.equal(deleteDomainJson.deleted, true);

    const deleteAgainRes = await fetch(
      `${BASE}/api/dashboard/domains?id=${encodeURIComponent(addDomainJson.domain.id)}`,
      { method: 'DELETE' }
    );
    assert.equal(deleteAgainRes.status, 404);
    console.log('✔ [12/13] 1-click MCP key revocation (DELETE) & self-serve domain lifecycle (POST + DELETE + 404 verify) passed');

    // 12. Dynamic OpenGraph Social Cards (/opengraph-image & white-labeled /audit/[slug]/opengraph-image)
    assert.ok(
      pitchHtml.includes(
        '<title>AI Search &amp; Hallucination Audit: Mosaic Coffee Roasters'
      ),
      'Expected white-labeled <title> on /audit/[slug]'
    );

    const [rootOgRes, pitchOgRes] = await Promise.all([
      fetch(`${BASE}/opengraph-image`),
      fetch(`${BASE}/audit/mosaic-springfield-audit/opengraph-image`),
    ]);
    assert.equal(rootOgRes.status, 200);
    assert.equal(pitchOgRes.status, 200);
    assert.ok(rootOgRes.headers.get('content-type')?.includes('image/png'));
    assert.ok(pitchOgRes.headers.get('content-type')?.includes('image/png'));

    const rootOgBytes = new Uint8Array(await rootOgRes.arrayBuffer());
    const pitchOgBytes = new Uint8Array(await pitchOgRes.arrayBuffer());
    assert.equal(rootOgBytes[0], 137);
    assert.equal(rootOgBytes[1], 80);
    assert.equal(pitchOgBytes[0], 137);
    assert.equal(pitchOgBytes[1], 80);
    console.log('✔ [13/14] Root & white-label /audit/[slug] OpenGraph PNG cards (1200x630) verified');

    // 13. Hallucination Drift Alert API (/api/dashboard/alerts): invalid email rejection + >=9.5/10 Critic preview
    const badEmailAlertRes = await fetch(`${BASE}/api/dashboard/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        recipient_email: 'not-an-email',
      }),
    });
    assert.equal(badEmailAlertRes.status, 400);

    const driftAlertRes = await fetch(`${BASE}/api/dashboard/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
      }),
    });
    assert.equal(driftAlertRes.status, 200);
    const driftAlertJson = await driftAlertRes.json();
    assert.equal(driftAlertJson.mode, 'preview_dry_run');
    assert.ok(
      Number(driftAlertJson.qualityScore) >= 9.5,
      `Expected drift alert qualityScore >= 9.5, got ${driftAlertJson.qualityScore}`
    );
    assert.equal(
      (driftAlertJson.text.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon in drift alert email text'
    );
    console.log('✔ [14/15] /api/dashboard/alerts rejected malformed email (400) & generated >= 9.5/10 drift alert');

    // 14. MCP Registry Discovery Manifest (/.well-known/mcp.json) & Domain Ownership Proof (/.well-known/mcp-registry-auth)
    const mcpManifestRes = await fetch(`${BASE}/.well-known/mcp.json`);
    assert.equal(mcpManifestRes.status, 200);
    assert.equal(mcpManifestRes.headers.get('access-control-allow-origin'), '*');
    const mcpManifestJson = await mcpManifestRes.json();
    assert.equal(mcpManifestJson.name, 'dev.verisource/mcp');
    assert.equal(mcpManifestJson.remotes[0]?.url, 'https://mcp.verisource.dev/mcp');
    assert.equal(mcpManifestJson.tools.length, 4);
    assert.equal(
      (JSON.stringify(mcpManifestJson).match(BANNED_LEXICON) ?? []).length,
      0
    );
    console.log('✔ [15/16] /.well-known/mcp.json registry discovery manifest verified (dev.verisource/mcp, 4 tools, CORS *)');

    const registryAuthRes = await fetch(`${BASE}/.well-known/mcp-registry-auth`);
    assert.equal(registryAuthRes.status, 200);
    const registryAuthText = await registryAuthRes.text();
    assert.ok(registryAuthText.startsWith('v=MCPv1; k=ed25519; p='));
    console.log('✔ [16/17] /.well-known/mcp-registry-auth Ed25519 domain proof verified');

    // 15. Shopify Customer Events Sandboxed Checkout Pixel (Origin: null CSRF defense + valid checkout_key 201)
    const unauthNullOriginRes = await fetch(`${BASE}/api/pixel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'null',
      },
      body: JSON.stringify({
        token: 'aaaaaaaa-1111-4000-8000-000000000001',
        event_type: 'ai_referral_conversion',
        source_engine: 'chatgpt.com',
        conversion_value_usd: 109.95,
      }),
    });
    assert.equal(unauthNullOriginRes.status, 403);

    const validShopifySandboxPixelRes = await fetch(`${BASE}/api/pixel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'null',
      },
      body: JSON.stringify({
        token: 'aaaaaaaa-1111-4000-8000-000000000001',
        checkout_key: 'e2b962fabcc3dc0ef625ae83',
        event_type: 'ai_referral_conversion',
        source_engine: 'chatgpt.com',
        landing_path: '/checkouts/thank-you',
        conversion_value_usd: 109.95,
      }),
    });
    assert.equal(validShopifySandboxPixelRes.status, 201);
    console.log('✔ [17/18] Shopify Customer Events sandboxed pixel blocked unauthenticated Origin:null (403) & recorded verified checkout_key (201)');

    // 16. Before -> After Patient Zero Case Study Ledger on Landing Page
    const homeAfterRes = await fetch(`${BASE}/`);
    const homeAfterHtml = await homeAfterRes.text();
    assert.ok(homeAfterHtml.includes('92 / 100'), 'Expected Aurea 92 / 100 post-remediation score');
    assert.ok(homeAfterHtml.includes('84 / 100'), 'Expected Mosaic 84 / 100 post-remediation score');
    assert.ok(homeAfterHtml.includes('/audit/aurearoasters-com-vf9w'));
    assert.ok(homeAfterHtml.includes('/audit/mosaic-springfield-audit'));
    const homeAfterVisible = homeAfterHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal((homeAfterVisible.match(BANNED_LEXICON) ?? []).length, 0);
    console.log('✔ [18/19] Before -> After Patient Zero case study ledger verified on / (0 banned words)');

    // 17. M21 Warm Architectural Paper Design System, Zero-Lag SVG Schematic, Responsive CSS & Guided/Pro UX Switch
    assert.ok(
      homeAfterHtml.includes('<svg') && homeAfterHtml.includes('vs-signal-path'),
      'Expected inline zero-lag animated SVG signal schematic on /'
    );
    assert.ok(
      homeAfterHtml.includes('--vs-canvas: #FAF9F6') &&
        homeAfterHtml.includes('vs-ledger-strip-4'),
      'Expected Warm Architectural Paper CSS tokens and responsive ledger grid classes'
    );
    assert.ok(
      dashHtml.includes('Guided Mode') &&
        dashHtml.includes('Pro Mode') &&
        dashHtml.includes('STEP 01'),
      'Expected 1-click Guided Mode / Pro Mode switch and plain-English step banner on /dashboard'
    );

    const [pricingHtml, loginHtml, privacyHtml, termsHtml] = await Promise.all([
      fetch(`${BASE}/pricing`).then((r) => r.text()),
      fetch(`${BASE}/login`).then((r) => r.text()),
      fetch(`${BASE}/privacy`).then((r) => r.text()),
      fetch(`${BASE}/terms`).then((r) => r.text()),
    ]);
    for (const [routeLabel, rawHtml] of [
      ['/pricing', pricingHtml],
      ['/login', loginHtml],
      ['/privacy', privacyHtml],
      ['/terms', termsHtml],
      ['/audit/mosaic-springfield-audit', pitchHtml],
    ]) {
      const visible = rawHtml
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ');
      const violations = visible.match(BANNED_LEXICON) ?? [];
      assert.equal(
        violations.length,
        0,
        `Found banned lexicon on ${routeLabel}: ${violations.join(', ')}`
      );
    }
    console.log('✔ [19/20] M21 Animated SVG schematic, Warm Architectural Paper tokens, Guided/Pro switch & 7-route 0-slop gate passed');

    // 18. M22 Automated Agency Batch Prospecting Pipeline (/api/dashboard/pitch batch + SSRF guard + live /audit/[slug] verify)
    const [tab2Html, tab3Html] = await Promise.all([
      fetch(`${BASE}/dashboard?tab=tab2_fixes`).then((r) => r.text()),
      fetch(`${BASE}/dashboard?tab=tab3_offsite`).then((r) => r.text()),
    ]);
    assert.ok(
      tab3Html.includes('Batch List') &&
        tab3Html.includes('Single Site') &&
        tab3Html.includes('Export CSV') &&
        tab3Html.includes('Playbook (.md)'),
      'Expected Single Site / Batch List toggle and CSV/Playbook export controls in Tab 3 Module 4 on /dashboard?tab=tab3_offsite'
    );
    for (const [tabLabel, tabRaw] of [
      ['/dashboard?tab=tab2_fixes', tab2Html],
      ['/dashboard?tab=tab3_offsite', tab3Html],
    ]) {
      const tabVisible = tabRaw
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ');
      assert.equal(
        (tabVisible.match(BANNED_LEXICON) ?? []).length,
        0,
        `Found banned lexicon on ${tabLabel}`
      );
    }

    const ssrfBatchRes = await fetch(`${BASE}/api/dashboard/pitch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospect_domains: [
          'aurearoasters.com',
          'http://169.254.169.254/latest/meta-data/',
        ],
        agency_brand_name: 'Northstar Search Studio',
      }),
    });
    assert.equal(
      ssrfBatchRes.status,
      400,
      'Expected SSRF host inside batch pitch request to return HTTP 400'
    );

    const batchPitchRes = await fetch(`${BASE}/api/dashboard/pitch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospect_domains: 'aurearoasters.com\nmosaicroasters.com',
        agency_brand_name: 'Northstar Search Studio',
        agency_primary_color: '#0A0E17',
        agency_cta_url: 'https://cal.com/northstar/geo-brief',
      }),
    });
    assert.equal(batchPitchRes.status, 200);
    const batchPitchJson = await batchPitchRes.json();
    assert.equal(batchPitchJson.batch_count, 2);
    assert.equal(batchPitchJson.reports.length, 2);
    assert.equal(batchPitchJson.share_urls.length, 2);

    for (const sharePath of batchPitchJson.share_urls) {
      const mintedAuditRes = await fetch(`${BASE}${sharePath}`);
      assert.equal(mintedAuditRes.status, 200);
      const mintedAuditHtml = await mintedAuditRes.text();
      assert.ok(
        mintedAuditHtml.includes('Northstar Search Studio'),
        `Expected white-label agency brand on ${sharePath}`
      );
      const mintedVisible = mintedAuditHtml
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ');
      assert.equal(
        (mintedVisible.match(BANNED_LEXICON) ?? []).length,
        0,
        `Found banned lexicon on minted batch route ${sharePath}`
      );
    }
    console.log('✔ [20/20] M22 Batch agency pitch pipeline verified (2 slugs minted, SSRF batch rejected, 0 banned words)');
  } finally {
    server.kill();
  }
}

run().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
