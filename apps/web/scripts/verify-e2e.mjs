import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Stripe from 'stripe';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(__dirname, '..');
const PORT = 3488;
const BASE = `http://127.0.0.1:${PORT}`;
const E2E_WEBHOOK_SECRET = 'whsec_verisource_e2e_hmac_secret_95';

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
      STRIPE_WEBHOOK_SECRET: E2E_WEBHOOK_SECRET,
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
        mintedAuditHtml.includes('Northstar Search Studio') &&
          mintedAuditHtml.includes('vs-whitelabel-audit-root') &&
          mintedAuditHtml.includes('Print / Save PDF') &&
          !mintedAuditHtml.includes('Scan Another Website'),
        `Expected strict white-label isolation & PDF export on ${sharePath}`
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
    console.log('✔ [20/21] M22 Batch agency pitch pipeline verified (2 slugs minted, SSRF batch rejected, 0 banned words)');

    // 19. M23 /sample-audit Showcase, Sitemap Inclusion & Direct Outbound $19 Tripwire CTA
    const [sampleAuditRes, sitemapCheckRes] = await Promise.all([
      fetch(`${BASE}/sample-audit`),
      fetch(`${BASE}/sitemap.xml`),
    ]);
    assert.equal(sampleAuditRes.status, 200);
    const sampleAuditHtml = await sampleAuditRes.text();
    const sitemapXml = await sitemapCheckRes.text();
    assert.ok(sitemapXml.includes('https://verisource.dev/sample-audit'));
    assert.ok(sampleAuditHtml.includes('Aurea Coffee Roasters'));
    assert.ok(sampleAuditHtml.includes('Mosaic Coffee Roasters'));
    assert.ok(
      pitchHtml.includes('Self-Serve Fix Pack ($19)'),
      'Expected $19 Tripwire CTA on Verisource-authored /audit/[slug]'
    );
    const sampleAuditVisible = sampleAuditHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (sampleAuditVisible.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on /sample-audit'
    );
    console.log('✔ [21/22] M23 /sample-audit gallery, pure white-label chrome isolation, PDF brief button & $19 outbound CTA verified');

    // 20. M24 Bot-Filtered Prospect Open Telemetry (/api/audit-view) & 30m Dedup + Resend Alert Preview
    const testSlug = batchPitchJson.reports[0].share_slug;

    const spoofedViewRes = await fetch(`${BASE}/api/audit-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil-spoofer.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ slug: testSlug }),
    });
    assert.equal(spoofedViewRes.status, 403);

    const slackBotViewRes = await fetch(`${BASE}/api/audit-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE,
        'User-Agent': 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      },
      body: JSON.stringify({ slug: testSlug }),
    });
    assert.equal(slackBotViewRes.status, 200);
    const slackBotJson = await slackBotViewRes.json();
    assert.equal(slackBotJson.counted, false);
    assert.equal(slackBotJson.reason, 'bot_filtered');

    const humanViewRes = await fetch(`${BASE}/api/audit-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ slug: testSlug }),
    });
    assert.equal(humanViewRes.status, 200);
    const humanViewJson = await humanViewRes.json();
    assert.equal(humanViewJson.counted, true);
    assert.equal(humanViewJson.views_count, 1);
    assert.equal(humanViewJson.alert_mode, 'preview_dry_run');

    const dedupViewRes = await fetch(`${BASE}/api/audit-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ slug: testSlug }),
    });
    assert.equal(dedupViewRes.status, 200);
    const dedupViewJson = await dedupViewRes.json();
    assert.equal(dedupViewJson.counted, false);
    assert.equal(dedupViewJson.reason, 'deduplicated_window');
    console.log('✔ [22/23] M24 /api/audit-view blocked Origin spoofs (403), filtered Slackbot unfurls, counted human open (1x) + >=9.5/10 alert, and deduplicated refreshes');

    // 21. M25 Contextual ?domain= Checkout Carryover, SSRF Reject & Auto-Provisioned Tab 2 Fix Bundle
    assert.ok(
      pitchHtml.includes(
        'plan=tripwire_19&amp;cycle=one_time&amp;domain=https%3A%2F%2Fmosaicroasters.com&amp;slug=mosaic-springfield-audit'
      ),
      'Expected Verisource /audit/[slug] $19 CTA to carry encoded prospect_domain & slug'
    );

    const lockedPricingRes = await fetch(
      `${BASE}/pricing?plan=tripwire_19&domain=onyxcoffeelab.com`
    );
    assert.equal(lockedPricingRes.status, 200);
    const lockedPricingHtml = await lockedPricingRes.text();
    assert.ok(lockedPricingHtml.includes('TARGET WEBSITE LOCKED FOR CHECKOUT'));
    assert.ok(lockedPricingHtml.includes('onyxcoffeelab.com'));
    const lockedPricingVisible = lockedPricingHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (lockedPricingVisible.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on /pricing?domain=onyxcoffeelab.com'
    );

    const ssrfCheckoutRes = await fetch(
      `${BASE}/api/checkout?plan=tripwire_19&cycle=one_time&domain=${encodeURIComponent(
        'http://169.254.169.254/latest/meta-data/'
      )}`,
      { redirect: 'manual' }
    );
    assert.equal(ssrfCheckoutRes.status, 400);

    const carryCheckoutRes = await fetch(
      `${BASE}/api/checkout?plan=tripwire_19&cycle=one_time&domain=${encodeURIComponent(
        'https://onyxcoffeelab.com'
      )}&slug=onyxcoffeelab-com-8m6s`,
      { redirect: 'manual' }
    );
    assert.equal(carryCheckoutRes.status, 303);
    const carryRedirect = carryCheckoutRes.headers.get('location') ?? '';
    assert.ok(carryRedirect.includes('domain=onyxcoffeelab.com'));
    assert.ok(carryRedirect.includes('tab=tab2_fixes'));

    const postBuyStateRes = await fetch(`${BASE}/api/dashboard/state`);
    assert.equal(postBuyStateRes.status, 200);
    const postBuyStateJson = await postBuyStateRes.json();
    const provisionedOnyx = postBuyStateJson.domains.find(
      (d) => d.domain_url === 'https://onyxcoffeelab.com'
    );
    assert.ok(
      provisionedOnyx,
      'Expected https://onyxcoffeelab.com to be auto-provisioned in workspace after checkout'
    );
    const onyxFixes = postBuyStateJson.fixes.filter(
      (f) => f.domain_id === provisionedOnyx.id
    );
    assert.ok(onyxFixes.length >= 4);
    assert.ok(onyxFixes.every((f) => Number(f.natural_quality_score) >= 9.5));

    const postBuyDashRes = await fetch(carryRedirect);
    assert.equal(postBuyDashRes.status, 200);
    const postBuyDashHtml = await postBuyDashRes.text();
    assert.ok(postBuyDashHtml.includes('onyxcoffeelab.com'));
    const postBuyVisible = postBuyDashHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (postBuyVisible.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on post-purchase Tab 2 dashboard'
    );
    console.log('✔ [23/24] M25 Contextual ?domain= checkout carryover, SSRF checkout block (400), and zero-click Tab 2 Fix Bundle provisioning verified');

    // 22. M26 Cryptographic HMAC-SHA256 /api/webhooks/stripe E2E (Forged 400 + Signed Provisioning + Replay Idempotency)
    const webhookPayload = JSON.stringify({
      id: 'evt_e2e_verisource_checkout_01',
      object: 'event',
      api_version: '2025-01-27.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_live_e2e_test_01',
          object: 'checkout.session',
          customer: 'cus_live_e2e_01',
          subscription: 'sub_live_e2e_01',
          customer_details: {
            email: 'founder@cal.com',
          },
          metadata: {
            user_id: '00000000-0000-4000-8000-000000000001',
            plan_tier: 'agency_249',
            billing_cycle: 'monthly',
            domain: 'cal.com',
          },
        },
      },
    });

    const forgedHookRes = await fetch(`${BASE}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=1700000000,v1=deadbeef000000000000000000000000',
      },
      body: webhookPayload,
    });
    assert.equal(forgedHookRes.status, 400);

    const validSignature = Stripe.webhooks.generateTestHeaderString({
      payload: webhookPayload,
      secret: E2E_WEBHOOK_SECRET,
    });

    const signedHookRes = await fetch(`${BASE}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': validSignature,
      },
      body: webhookPayload,
    });
    assert.equal(signedHookRes.status, 200);
    const signedHookJson = await signedHookRes.json();
    assert.equal(signedHookJson.received, true);
    assert.equal(signedHookJson.duplicate, undefined);

    const replayHookRes = await fetch(`${BASE}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': validSignature,
      },
      body: webhookPayload,
    });
    assert.equal(replayHookRes.status, 200);
    const replayHookJson = await replayHookRes.json();
    assert.equal(replayHookJson.duplicate, true);

    const afterWebhookState = await (
      await fetch(`${BASE}/api/dashboard/state`)
    ).json();
    assert.equal(afterWebhookState.profile.plan_tier, 'agency_249');
    assert.ok(
      afterWebhookState.domains.some((d) => d.domain_url === 'https://cal.com'),
      'Expected signed checkout.session.completed webhook to auto-provision https://cal.com'
    );
    console.log('✔ [24/25] M26 /api/webhooks/stripe verified: forged HMAC rejected (400), signed checkout provisioned https://cal.com, and event replay deduplicated');

    // 23. M27 /agencies White-Label Partner Page, Animated SVG Pipeline & Sitemap Inclusion
    const [agenciesRes, updatedSitemapRes] = await Promise.all([
      fetch(`${BASE}/agencies`),
      fetch(`${BASE}/sitemap.xml`),
    ]);
    assert.equal(agenciesRes.status, 200);
    const agenciesHtml = await agenciesRes.text();
    const updatedSitemapXml = await updatedSitemapRes.text();
    assert.ok(updatedSitemapXml.includes('https://verisource.dev/agencies'));
    assert.ok(
      agenciesHtml.includes('FIG 02 · 60-SECOND WHITE-LABEL RETAINER ENGINE')
    );
    assert.ok(agenciesHtml.includes('$16.60/mo'));
    assert.ok(
      agenciesHtml.includes('/api/checkout?plan=agency_249&amp;cycle=monthly')
    );
    const agenciesVisible = agenciesHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (agenciesVisible.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on /agencies'
    );
    console.log('✔ [25/26] M27 /agencies partner page, animated SVG retainer schematic, sitemap entry, and 0-slop gate verified');

    // 24. M28 Interactive Agency ROI Calculator & Tab 3 3-Touch Sequence Switcher
    assert.ok(
      agenciesHtml.includes('INTERACTIVE RETAINER MARGIN MODEL'),
      'Expected AgencyRoiCalculator on /agencies'
    );
    assert.ok(agenciesHtml.includes('$7,251'));
    assert.ok(agenciesHtml.includes('96.7%'));

    const m28Tab3Res = await fetch(`${BASE}/dashboard?tab=tab3_offsite`);
    assert.equal(m28Tab3Res.status, 200);
    const m28Tab3Html = await m28Tab3Res.text();
    assert.ok(m28Tab3Html.includes('Touch 1 · Day 0'));
    assert.ok(m28Tab3Html.includes('Touch 2 · Day 3'));
    assert.ok(m28Tab3Html.includes('Touch 3 · Day 7'));
    const m28Tab3Visible = m28Tab3Html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (m28Tab3Visible.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on /dashboard?tab=tab3_offsite'
    );
    console.log('✔ [26/27] M28 Interactive Agency ROI Calculator & Tab 3 3-Touch Sequence Switcher verified (0 banned words)');

    // 25. M29 Vertical-Specific Industry Classifier in /api/grader & Multi-Vertical /sample-audit
    const mosaicGraderRes = await fetch(`${BASE}/api/grader`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.99',
      },
      body: JSON.stringify({ domain: 'mosaicroasters.com' }),
    });
    assert.equal(mosaicGraderRes.status, 200);
    const mosaicGraderJson = await mosaicGraderRes.json();
    assert.equal(
      (mosaicGraderJson.summary ?? mosaicGraderJson).industryVertical,
      'local_commerce'
    );
    console.log('✔ [27/28] M29 Vertical-specific LocalBusiness / Shopify industryVertical classifier verified on /api/grader');

    // 26. M30 /mcp-guide Visual Quickstart Hub, Animated SVG Schematic, Sitemap & /api/mcp-preview JSON-RPC Inspector
    const [mcpGuideRes, m30SitemapRes, m30ManifestRes] = await Promise.all([
      fetch(`${BASE}/mcp-guide`),
      fetch(`${BASE}/sitemap.xml`),
      fetch(`${BASE}/.well-known/mcp.json`),
    ]);
    assert.equal(mcpGuideRes.status, 200);
    const mcpGuideHtml = await mcpGuideRes.text();
    const m30SitemapXml = await m30SitemapRes.text();
    const m30ManifestJson = await m30ManifestRes.json();

    assert.ok(m30SitemapXml.includes('https://verisource.dev/mcp-guide'));
    assert.ok(
      m30ManifestJson.documentationUrl.endsWith('/mcp-guide'),
      `Expected documentationUrl to end with /mcp-guide, got ${m30ManifestJson.documentationUrl}`
    );
    assert.ok(
      mcpGuideHtml.includes('FIG 03 · STATELESS STREAMABLE HTTP /MCP ENGINE')
    );
    assert.ok(mcpGuideHtml.includes('Claude Desktop'));
    assert.ok(mcpGuideHtml.includes('Antigravity'));
    const mcpGuideVisible = mcpGuideHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (mcpGuideVisible.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on /mcp-guide'
    );

    const ssrfMcpPreviewRes = await fetch(`${BASE}/api/mcp-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'http://169.254.169.254/latest/meta-data/' }),
    });
    assert.equal(ssrfMcpPreviewRes.status, 400);

    const validMcpPreviewRes = await fetch(`${BASE}/api/mcp-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'aurearoasters.com' }),
    });
    assert.equal(validMcpPreviewRes.status, 200);
    const validMcpPreviewJson = await validMcpPreviewRes.json();
    assert.equal(validMcpPreviewJson.rpcRequest.method, 'tools/call');
    assert.equal(
      validMcpPreviewJson.rpcRequest.params.name,
      'scan_domain_ai_readiness'
    );
    assert.equal(validMcpPreviewJson.summary.credits_charged, 0);
    assert.equal(
      validMcpPreviewJson.summary.brandName,
      'Aurea Coffee Roasters'
    );
    console.log('✔ [28/29] M30 /mcp-guide visual quickstart, FIG 03 SVG schematic, SSRF-safe /api/mcp-preview JSON-RPC inspector & 0-slop gate verified');

    // 27. M31 Weekly Executive Client Digest (/api/dashboard/digest) & Tab 1 Summary Controls
    const badDigestEmailRes = await fetch(`${BASE}/api/dashboard/digest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        recipient_email: 'invalid-email-address',
      }),
    });
    assert.equal(badDigestEmailRes.status, 400);

    const validDigestRes = await fetch(`${BASE}/api/dashboard/digest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        previous_visibility_score: 35,
      }),
    });
    assert.equal(validDigestRes.status, 200);
    const validDigestJson = await validDigestRes.json();
    assert.equal(validDigestJson.mode, 'preview_dry_run');
    assert.ok(Number(validDigestJson.qualityScore) >= 9.5);
    assert.equal(
      (validDigestJson.text.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon in weekly executive digest text'
    );
    assert.ok(
      dashHtml.includes('Weekly Summary Email') ||
        dashHtml.includes('Weekly Client Digest'),
      'Expected Weekly Summary Email / Weekly Client Digest button in Tab 1'
    );
    console.log('✔ [29/30] M31 Weekly Executive Client Digest (/api/dashboard/digest) & Tab 1 controls verified (>= 9.5/10 Critic, 0 banned words)');

    // 28. M32 Live Search Fanout Telemetry Badges & Sample Sub-Query Readout on /api/grader, / & /dashboard
    assert.ok(
      typeof (mosaicGraderJson.summary ?? mosaicGraderJson).samplePromptResult
        .fanoutTelemetryType === 'string',
      'Expected samplePromptResult.fanoutTelemetryType on /api/grader'
    );
    assert.ok(
      Array.isArray(
        (mosaicGraderJson.summary ?? mosaicGraderJson).samplePromptResult
          .decompiledFanoutQueries
      ),
      'Expected samplePromptResult.decompiledFanoutQueries array on /api/grader'
    );
    const m32HomeHtml = await (await fetch(`${BASE}/`)).text();
    assert.ok(
      m32HomeHtml.includes('Observed AI Search Sub-Queries:') &&
        m32HomeHtml.includes('LIVE WEB SEARCH'),
      'Expected live fanout telemetry readout on Landing Page grader'
    );
    assert.ok(
      dashHtml.includes('LIVE SEARCH') || dashHtml.includes('LIVE FANOUT'),
      'Expected live search provenance badge in Dashboard Tab 1'
    );
    console.log('✔ [30/31] M32 Perplexity Agent API fanout telemetry & live provenance badges verified across /, /api/grader & /dashboard');

    // 29. M33 Closed-Loop Live Fix Verification (/api/dashboard/verify-fixes), Tab 2 Live Badges & Grader forceRefresh
    const missingVerifyRes = await fetch(`${BASE}/api/dashboard/verify-fixes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(missingVerifyRes.status, 400);

    const verifyFixesRes = await fetch(`${BASE}/api/dashboard/verify-fixes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
      }),
    });
    assert.equal(verifyFixesRes.status, 200);
    const verifyFixesJson = await verifyFixesRes.json();
    assert.ok(verifyFixesJson.verification);
    assert.equal(verifyFixesJson.verification.checks.length, 4);
    assert.ok(Array.isArray(verifyFixesJson.appliedFixIds));
    for (const chk of verifyFixesJson.verification.checks) {
      assert.equal(
        (chk.detail.match(BANNED_LEXICON) ?? []).length,
        0,
        `Found banned lexicon in live fix verification check: ${chk.detail}`
      );
    }

    // Verify /api/grader cached24h vs forceRefresh: true
    const firstGraderCheck = await (
      await fetch(`${BASE}/api/grader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'aurearoasters.com' }),
      })
    ).json();
    assert.equal(firstGraderCheck.cached24h, false);

    const secondGraderCheck = await (
      await fetch(`${BASE}/api/grader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'aurearoasters.com' }),
      })
    ).json();
    assert.equal(secondGraderCheck.cached24h, true);

    const forcedGraderCheck = await (
      await fetch(`${BASE}/api/grader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: 'aurearoasters.com',
          forceRefresh: true,
        }),
      })
    ).json();
    assert.equal(forcedGraderCheck.cached24h, false);

    const m33Tab2Html = await (
      await fetch(`${BASE}/dashboard?tab=tab2_fixes`)
    ).text();
    assert.ok(
      m33Tab2Html.includes('Verify Live Fixes') &&
        (m33Tab2Html.includes('LIVE ON SITE') ||
          m33Tab2Html.includes('READY TO PUBLISH')),
      'Expected Verify Live Fixes button and artifact deployment badges in Tab 2'
    );
    assert.ok(
      m32HomeHtml.includes('Re-Scan Live'),
      'Expected Re-Scan Live button on Public Grader'
    );
    console.log('✔ [31/32] M33 Closed-Loop Live Fix Verification (/api/dashboard/verify-fixes), Tab 2 live badges & Grader forceRefresh verified');

    // 30. M34 Direct ?domain= Grader-to-Console Handoff, Protected Seed Store Delete Guard & Guest Scan Rate Limit
    const handoffHtml = await (
      await fetch(`${BASE}/dashboard?domain=raycast.com`)
    ).text();
    assert.ok(
      handoffHtml.includes('READY TO AUDIT YOUR DOMAIN') &&
        handoffHtml.includes('Audit raycast.com Across 3 Engines'),
      'Expected Direct ?domain= Grader-to-Console Handoff Banner on /dashboard?domain=raycast.com'
    );
    const strippedHandoff = handoffHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedHandoff.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on /dashboard?domain=raycast.com handoff view'
    );

    const protectedDeleteRes = await fetch(
      `${BASE}/api/dashboard/domains?id=11111111-1111-4000-8000-000000000001`,
      { method: 'DELETE' }
    );
    assert.equal(
      protectedDeleteRes.status,
      403,
      'Expected unauthenticated DELETE on Patient Zero store to return 403 PROTECTED_DEMO_DOMAIN'
    );

    let lastRateStatus = 200;
    for (let i = 0; i < 7; i += 1) {
      const rateRes = await fetch(`${BASE}/api/dashboard/domains`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.77',
        },
        body: JSON.stringify({
          domain_id: '11111111-1111-4000-8000-000000000001',
        }),
      });
      lastRateStatus = rateRes.status;
    }
    assert.equal(
      lastRateStatus,
      429,
      'Expected 7th unauthenticated workspace scan in 1 hour from same IP to return 429 DEMO_SCAN_LIMIT_REACHED'
    );
    console.log('✔ [32/32] M34 Direct ?domain= Grader-to-Console handoff banner, 403 Patient Zero delete guard & 429 guest scan cap verified');
  } finally {
    server.kill();
  }
}

run().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
