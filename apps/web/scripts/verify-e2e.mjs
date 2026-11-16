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
const OWNER_HEADERS = {
  Authorization: 'Bearer vs_mock_owner_session',
};
const OWNER_JSON_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer vs_mock_owner_session',
};

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

    // 1. Landing Page, Coffee-Store Scrub & Zero AI-Slop HTML check
    const homeHtml = await (await fetch(`${BASE}/`)).text();
    assert.ok(
      !homeHtml.includes('Aurea Coffee Roasters') &&
        !homeHtml.includes('Mosaic Coffee Roasters') &&
        !homeHtml.includes('aurearoasters.com') &&
        !homeHtml.includes('mosaicroasters.com'),
      'Expected zero personal coffee-store names or domains on /'
    );
    assert.ok(
      homeHtml.includes('Control how AI search recommends your brand'),
      'Expected Profound-caliber AI search hero positioning on /'
    );
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
    console.log('✔ [2/12] Landing page rendered with 0 coffee-store leaks & 0 Quality Gate lexicon violations');

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

    // 4. Unauthenticated Gate + Authenticated 3-Tab Dashboard & White-Label Prospect Pitch View
    const unauthDashRes = await fetch(`${BASE}/dashboard`);
    assert.equal(unauthDashRes.status, 200);
    const unauthDashHtml = await unauthDashRes.text();
    assert.ok(
      unauthDashHtml.includes('PRIVATE SUBSCRIBER CONSOLE') &&
        !unauthDashHtml.includes('Aurea Coffee Roasters') &&
        !unauthDashHtml.includes('PLAN: AGENCY_249'),
      'Expected unauthenticated /dashboard to render locked Subscriber Console Gate with zero coffee stores'
    );
    const strippedUnauthDash = unauthDashHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedUnauthDash.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on unauthenticated /dashboard gate'
    );

    const unauthStateRes = await fetch(`${BASE}/api/dashboard/state`);
    assert.equal(
      unauthStateRes.status,
      401,
      'Expected unauthenticated GET /api/dashboard/state to return HTTP 401'
    );

    const dashRes = await fetch(`${BASE}/dashboard`, {
      headers: OWNER_HEADERS,
    });
    assert.equal(dashRes.status, 200);
    const dashHtml = await dashRes.text();
    assert.ok(dashHtml.includes('PLAN: AGENCY_249'));
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
    console.log('✔ [5/12] Locked unauthenticated /dashboard gate (401 API), authenticated Console & /audit/[slug] verified (0 banned words)');

    // 5. Agency Pitch XSS defense (CTA + Logo) + live White-Label slug creation with Agency Logo
    const xssPitchRes = await fetch(`${BASE}/api/dashboard/pitch`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        prospect_domain: 'aurearoasters.com',
        agency_brand_name: 'Apex GEO Partners',
        agency_cta_url: 'javascript:alert(1)',
      }),
    });
    assert.equal(xssPitchRes.status, 400);

    const xssLogoRes = await fetch(`${BASE}/api/dashboard/pitch`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        prospect_domain: 'aurearoasters.com',
        agency_brand_name: 'Apex GEO Partners',
        agency_logo_url: 'javascript:alert(1)',
      }),
    });
    assert.equal(xssLogoRes.status, 400);

    const cleanPitchRes = await fetch(`${BASE}/api/dashboard/pitch`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
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
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({ label: 'E2E Test Agent Key' }),
    });
    assert.equal(keyRes.status, 200);
    const keyJson = await keyRes.json();
    assert.ok(/^vs_live_[0-9a-f]{48}$/.test(keyJson.rawKeyOnce));
    console.log('✔ [7/12] /api/dashboard/mcp-keys minted valid 56-char SHA-256 vs_live_ key');

    // 7. Brand Truth Sheet Verification & 9.5+/10 Fix Regeneration
    const truthRes = await fetch(`${BASE}/api/dashboard/truth-sheet`, {
      method: 'PATCH',
      headers: OWNER_JSON_HEADERS,
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
      headers: OWNER_JSON_HEADERS,
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
      headers: OWNER_JSON_HEADERS,
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
      { method: 'DELETE', headers: OWNER_HEADERS }
    );
    assert.equal(revokeRes.status, 200);
    const revokeJson = await revokeRes.json();
    assert.equal(revokeJson.revoked, true);
    assert.equal(revokeJson.keyRow.is_active, false);

    const addDomainRes = await fetch(`${BASE}/api/dashboard/domains`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({ domain_url: 'stripe.com' }),
    });
    assert.equal(addDomainRes.status, 200);
    const addDomainJson = await addDomainRes.json();
    assert.ok(addDomainJson.domain.id);

    const deleteDomainRes = await fetch(
      `${BASE}/api/dashboard/domains?id=${encodeURIComponent(addDomainJson.domain.id)}`,
      { method: 'DELETE', headers: OWNER_HEADERS }
    );
    assert.equal(deleteDomainRes.status, 200);
    const deleteDomainJson = await deleteDomainRes.json();
    assert.equal(deleteDomainJson.deleted, true);

    const deleteAgainRes = await fetch(
      `${BASE}/api/dashboard/domains?id=${encodeURIComponent(addDomainJson.domain.id)}`,
      { method: 'DELETE', headers: OWNER_HEADERS }
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
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        recipient_email: 'not-an-email',
      }),
    });
    assert.equal(badEmailAlertRes.status, 400);

    const driftAlertRes = await fetch(`${BASE}/api/dashboard/alerts`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
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

    // 16. Profound-Caliber Platform Modules & Dual Attribution Showcase on Landing Page
    const homeAfterRes = await fetch(`${BASE}/`);
    const homeAfterHtml = await homeAfterRes.text();
    assert.ok(
      homeAfterHtml.includes('READ-ONLY DASHBOARDS VS. READ-WRITE EXECUTION') &&
        homeAfterHtml.includes('FREE AI SEARCH &amp; AGENT READINESS AUDIT'),
      'Expected Read-Only vs. Read-Write Execution comparison and Free Audit box on /'
    );
    const homeAfterVisible = homeAfterHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal((homeAfterVisible.match(BANNED_LEXICON) ?? []).length, 0);
    console.log('✔ [18/19] Profound-caliber platform showcase & Read-Write comparison verified on / (0 banned words)');

    // 17. M21 Warm Architectural Paper Design System, Zero-Lag SVG Schematic, Responsive CSS & Guided/Pro UX Switch
    assert.ok(
      homeAfterHtml.includes('<svg') && homeAfterHtml.includes('vs-signal-path'),
      'Expected inline zero-lag animated SVG signal schematic on /'
    );
    assert.ok(
      homeAfterHtml.includes('--vs-canvas: #FAF9F6') &&
        dashHtml.includes('vs-ledger-strip-4'),
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
      fetch(`${BASE}/dashboard?tab=tab2_fixes`, {
        headers: OWNER_HEADERS,
      }).then((r) => r.text()),
      fetch(`${BASE}/dashboard?tab=tab3_offsite`, {
        headers: OWNER_HEADERS,
      }).then((r) => r.text()),
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
      headers: OWNER_JSON_HEADERS,
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
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        prospect_domains: 'stripe.com\nlinear.app',
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

    // 19. M23 /sample-audit Showcase (Zero Personal Coffee Stores), Sitemap Inclusion & Direct Outbound $19 Tripwire CTA
    const [sampleAuditRes, sitemapCheckRes] = await Promise.all([
      fetch(`${BASE}/sample-audit`),
      fetch(`${BASE}/sitemap.xml`),
    ]);
    assert.equal(sampleAuditRes.status, 200);
    const sampleAuditHtml = await sampleAuditRes.text();
    const sitemapXml = await sitemapCheckRes.text();
    assert.ok(sitemapXml.includes('https://verisource.dev/sample-audit'));
    assert.ok(
      !sampleAuditHtml.includes('Aurea Coffee Roasters') &&
        !sampleAuditHtml.includes('Mosaic Coffee Roasters'),
      'Expected zero personal coffee stores on /sample-audit'
    );
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

    const postBuyStateRes = await fetch(`${BASE}/api/dashboard/state`, {
      headers: OWNER_HEADERS,
    });
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

    const postBuyDashRes = await fetch(carryRedirect, {
      headers: OWNER_HEADERS,
    });
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
      await fetch(`${BASE}/api/dashboard/state`, { headers: OWNER_HEADERS })
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

    const m28Tab3Res = await fetch(`${BASE}/dashboard?tab=tab3_offsite`, {
      headers: OWNER_HEADERS,
    });
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
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        recipient_email: 'invalid-email-address',
      }),
    });
    assert.equal(badDigestEmailRes.status, 400);

    const validDigestRes = await fetch(`${BASE}/api/dashboard/digest`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
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
      m32HomeHtml.includes('FREE AI SEARCH &amp; AGENT READINESS AUDIT'),
      'Expected customer-first Free Audit section on Landing Page'
    );
    assert.ok(
      dashHtml.includes('LIVE SEARCH') || dashHtml.includes('LIVE FANOUT'),
      'Expected live search provenance badge in Dashboard Tab 1'
    );
    console.log('✔ [30/31] M32 Perplexity Agent API fanout telemetry & live provenance badges verified across /, /api/grader & /dashboard');

    // 29. M33 Closed-Loop Live Fix Verification (/api/dashboard/verify-fixes), Tab 2 Live Badges & Grader forceRefresh
    const missingVerifyRes = await fetch(`${BASE}/api/dashboard/verify-fixes`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({}),
    });
    assert.equal(missingVerifyRes.status, 400);

    const verifyFixesRes = await fetch(`${BASE}/api/dashboard/verify-fixes`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
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
        body: JSON.stringify({ domain: 'linear.app' }),
      })
    ).json();
    assert.equal(firstGraderCheck.cached24h, false);

    const secondGraderCheck = await (
      await fetch(`${BASE}/api/grader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'linear.app' }),
      })
    ).json();
    assert.equal(secondGraderCheck.cached24h, true);

    const forcedGraderCheck = await (
      await fetch(`${BASE}/api/grader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: 'linear.app',
          forceRefresh: true,
        }),
      })
    ).json();
    assert.equal(forcedGraderCheck.cached24h, false);

    const m33Tab2Html = await (
      await fetch(`${BASE}/dashboard?tab=tab2_fixes`, {
        headers: OWNER_HEADERS,
      })
    ).text();
    assert.ok(
      m33Tab2Html.includes('Verify Live Fixes') &&
        (m33Tab2Html.includes('LIVE ON SITE') ||
          m33Tab2Html.includes('READY TO PUBLISH')),
      'Expected Verify Live Fixes button and artifact deployment badges in Tab 2'
    );
    console.log('✔ [31/32] M33 Closed-Loop Live Fix Verification (/api/dashboard/verify-fixes), Tab 2 live badges & Grader forceRefresh verified');

    // 30. M34 Direct ?domain= Grader-to-Console Handoff, Protected Seed Store Delete Guard & Unauthenticated 401 Lock
    const handoffHtml = await (
      await fetch(`${BASE}/dashboard?domain=raycast.com`, {
        headers: OWNER_HEADERS,
      })
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
      { method: 'DELETE', headers: OWNER_HEADERS }
    );
    assert.equal(
      protectedDeleteRes.status,
      403,
      'Expected DELETE on protected fixture store in mock mode to return 403 PROTECTED_DEMO_DOMAIN'
    );

    const unauthScanAttempt = await fetch(`${BASE}/api/dashboard/domains`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.77',
      },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
      }),
    });
    assert.equal(
      unauthScanAttempt.status,
      401,
      'Expected unauthenticated workspace scan attempt to return HTTP 401'
    );
    console.log('✔ [32/33] M34 Direct ?domain= Grader-to-Console handoff banner, 403 fixture delete guard & 401 unauthenticated API lock verified');

    // 31. M35 Slug-Preserving In-Place Pitch Refresh (PATCH /api/dashboard/pitch), Rival Strip & 3-Engine /sample-audit Table
    const invalidSlugPatchRes = await fetch(`${BASE}/api/dashboard/pitch`, {
      method: 'PATCH',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({ share_slug: '../bad-slug' }),
    });
    assert.equal(invalidSlugPatchRes.status, 400);

    const missingSlugPatchRes = await fetch(`${BASE}/api/dashboard/pitch`, {
      method: 'PATCH',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({ share_slug: 'nonexistent-slug-9999' }),
    });
    assert.equal(missingSlugPatchRes.status, 404);

    const mintedSlugToRefresh = cleanPitchJson.report.share_slug;
    const refreshPitchRes = await fetch(`${BASE}/api/dashboard/pitch`, {
      method: 'PATCH',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({ share_slug: mintedSlugToRefresh }),
    });
    assert.equal(refreshPitchRes.status, 200);
    const refreshPitchJson = await refreshPitchRes.json();
    assert.equal(refreshPitchJson.refreshed, true);
    assert.equal(refreshPitchJson.report.share_slug, mintedSlugToRefresh);
    assert.equal(refreshPitchJson.share_url, `/audit/${mintedSlugToRefresh}`);

    const refreshedAuditHtml = await (
      await fetch(`${BASE}/audit/${mintedSlugToRefresh}`)
    ).text();
    assert.ok(
      refreshedAuditHtml.includes('AI-RECOMMENDED CATEGORY ALTERNATIVES'),
      'Expected AI-RECOMMENDED CATEGORY ALTERNATIVES chip strip on /audit/[slug]'
    );
    const strippedRefreshedAudit = refreshedAuditHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedRefreshedAudit.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on refreshed /audit/[slug] brief'
    );

    assert.ok(
      sampleAuditHtml.includes('Live 3-engine HTTP + AI Search audits') &&
        sampleAuditHtml.includes('Rivals Cited'),
      'Expected 3-engine benchmark heading and Rivals Cited column on /sample-audit'
    );
    console.log('✔ [33/35] M35 Slug-preserving PATCH /api/dashboard/pitch refresh, /audit/[slug] rival strip & 3-engine /sample-audit verified');

    // 32. M36 Dynamic 1200x630 /audit/[slug] Rival OpenGraph Card, Rival Meta Unfurl & 1-Click Copy Brief Link Controls
    const m36MosaicHtml = await (
      await fetch(`${BASE}/audit/mosaic-springfield-audit`)
    ).text();
    assert.ok(
      m36MosaicHtml.includes('Copy Brief Link') &&
        m36MosaicHtml.includes('Rivals Cited: Kingdom Coffee'),
      'Expected Copy Brief Link button and Rivals Cited metadata on /audit/mosaic-springfield-audit'
    );

    const m36OgRes = await fetch(
      `${BASE}/audit/mosaic-springfield-audit/opengraph-image`
    );
    assert.equal(m36OgRes.status, 200);
    assert.equal(m36OgRes.headers.get('content-type'), 'image/png');
    const m36OgBuf = Buffer.from(await m36OgRes.arrayBuffer());
    assert.equal(m36OgBuf[0], 0x89);
    assert.equal(m36OgBuf[1], 0x50);
    assert.ok(
      m36OgBuf.length > 5000,
      'Expected non-empty 1200x630 PNG bytes from Satori rival OG card'
    );

    const m36Tab3Html = await (
      await fetch(`${BASE}/dashboard?tab=tab3_offsite`, {
        headers: OWNER_HEADERS,
      })
    ).text();
    assert.ok(
      m36Tab3Html.includes('Copy URL'),
      'Expected 1-click Copy URL button inside Tab 3 Pitch Ledger'
    );
    const strippedM36Tab3 = m36Tab3Html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedM36Tab3.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on Tab 3 Pitch Ledger'
    );
    console.log('✔ [34/35] M36 Dynamic 1200x630 /audit/[slug] rival OG PNG, Rival meta unfurl & 1-click Copy Brief Link / Copy URL verified');

    // 33. M37 Tab 1 Engine-by-Engine Citation Share Strip, /sample-audit Vertical Filter Tabs & /?domain= Grader Deep-Link
    const m37Tab1Html = await (
      await fetch(`${BASE}/dashboard`, { headers: OWNER_HEADERS })
    ).text();
    assert.ok(
      m37Tab1Html.includes('ENGINE-BY-ENGINE CITATION SHARE') &&
        m37Tab1Html.includes('ChatGPT Search') &&
        m37Tab1Html.includes('Google Gemini') &&
        m37Tab1Html.includes('Perplexity Agent'),
      'Expected Tab 1 Engine-by-Engine Citation Share strip across ChatGPT, Gemini & Perplexity'
    );
    const strippedM37Tab1 = m37Tab1Html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedM37Tab1.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on Tab 1 Engine-by-Engine Citation Share strip'
    );

    const m37SampleHtml = await (await fetch(`${BASE}/sample-audit`)).text();
    assert.ok(
      m37SampleHtml.includes('All Verticals') &&
        m37SampleHtml.includes('B2B SaaS &amp; D2C') &&
        m37SampleHtml.includes('SEO &amp; Web Agencies') &&
        m37SampleHtml.includes('High-Ticket Local Services') &&
        m37SampleHtml.includes('Scan My Site Free'),
      'Expected interactive vertical filter tabs and inline Scan My Site Free bar on /sample-audit'
    );
    const strippedM37Sample = m37SampleHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedM37Sample.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on /sample-audit vertical filter cohort'
    );

    const m37DeepLinkHomeRes = await fetch(`${BASE}/?domain=linear.app`);
    assert.equal(m37DeepLinkHomeRes.status, 200);
    const m37DeepLinkHomeHtml = await m37DeepLinkHomeRes.text();
    assert.ok(
      m37DeepLinkHomeHtml.includes('Run Free AI Audit'),
      'Expected Run Free AI Audit button on Landing Page Instant Grader'
    );
    console.log('✔ [35/36] M37 Tab 1 Engine Citation Share Strip, /sample-audit vertical filter tabs & /?domain= grader deep-link verified');

    // 34. M38 Ranked Citation Gap Source Leaderboard & 1-Click Targeted Editorial Outreach Draft inside Tab 3
    const m38Tab3Html = await (
      await fetch(`${BASE}/dashboard?tab=tab3_offsite`, {
        headers: OWNER_HEADERS,
      })
    ).text();
    assert.ok(
      m38Tab3Html.includes('CITATION GAP SOURCE LEADERBOARD') &&
        m38Tab3Html.includes('CITATION GAP') &&
        m38Tab3Html.includes('BRAND CO-CITED') &&
        m38Tab3Html.includes('OWNED ASSET') &&
        m38Tab3Html.includes('Draft Pitch'),
      'Expected Ranked Citation Gap Source Leaderboard with CITATION GAP, BRAND CO-CITED, OWNED ASSET & Draft Pitch on Tab 3'
    );
    const strippedM38Tab3 = m38Tab3Html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedM38Tab3.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on Tab 3 Citation Gap Source Leaderboard'
    );
    console.log('✔ [36/37] M38 Tab 3 Ranked Citation Gap Source Leaderboard & targeted outreach draft verified');

    // 35. M39 + M40 + M41: Self-GEO alternate Markdown + 3-node JSON-LD graph, scoreDelta telemetry, Tab 1/Tab 2 remediation proof & v1.0.0 manifest
    const v1HomeHtml = await (await fetch(`${BASE}/`)).text();
    assert.ok(
      v1HomeHtml.includes('rel="alternate"') &&
        v1HomeHtml.includes('type="text/markdown"') &&
        v1HomeHtml.includes('href="/agents.md"') &&
        v1HomeHtml.includes('href="/llms.txt"'),
      'Expected <link rel="alternate" type="text/markdown" href="/agents.md"> and /llms.txt alternate link on Landing Page <head>'
    );
    const v1JsonLdMatches = [
      ...v1HomeHtml.matchAll(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      ),
    ];
    assert.ok(
      v1JsonLdMatches.length >= 3,
      `Expected >= 3 application/ld+json blocks (Organization + SoftwareApplication + FAQPage), found ${v1JsonLdMatches.length}`
    );
    const parsedTypes = v1JsonLdMatches.map(
      (m) => JSON.parse(m[1].trim())['@type']
    );
    assert.ok(
      parsedTypes.includes('Organization') &&
        parsedTypes.includes('SoftwareApplication') &&
        parsedTypes.includes('FAQPage'),
      `Expected Organization, SoftwareApplication, and FAQPage JSON-LD types, got: ${parsedTypes.join(', ')}`
    );

    assert.ok(
      verifyFixesJson.scoreDelta &&
        typeof verifyFixesJson.scoreDelta.visibilityDelta === 'number' &&
        typeof verifyFixesJson.scoreDelta.accuracyDelta === 'number',
      'Expected scoreDelta payload on POST /api/dashboard/verify-fixes'
    );

    const rescanDeltaRes = await fetch(`${BASE}/api/dashboard/domains`, {
      method: 'PUT',
      headers: {
        ...OWNER_JSON_HEADERS,
        'x-forwarded-for': '198.51.100.41',
      },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
      }),
    });
    assert.equal(rescanDeltaRes.status, 200);
    const rescanDeltaJson = await rescanDeltaRes.json();
    assert.ok(
      rescanDeltaJson.scoreDelta &&
        typeof rescanDeltaJson.scoreDelta.previousVisibilityScore === 'number' &&
        typeof rescanDeltaJson.scoreDelta.currentVisibilityScore === 'number' &&
        typeof rescanDeltaJson.scoreDelta.visibilityDelta === 'number',
      'Expected scoreDelta payload on PUT /api/dashboard/domains'
    );

    const v1Tab1Html = await (
      await fetch(`${BASE}/dashboard`, { headers: OWNER_HEADERS })
    ).text();
    assert.ok(
      v1Tab1Html.includes('BEFORE → AFTER REMEDIATION PROOF'),
      'Expected BEFORE → AFTER REMEDIATION PROOF bar on Tab 1'
    );
    const strippedV1Tab1 = v1Tab1Html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedV1Tab1.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on Tab 1 Before -> After Remediation Proof view'
    );

    const v1Tab2Html = await (
      await fetch(`${BASE}/dashboard?tab=tab2_fixes`, {
        headers: OWNER_HEADERS,
      })
    ).text();
    assert.ok(
      v1Tab2Html.includes('BASELINE:') ||
        v1Tab2Html.includes('BEFORE → AFTER:') ||
        v1Tab2Html.includes('VERIFIED:'),
      'Expected baseline or Before -> After score badge on Tab 2'
    );
    const strippedV1Tab2 = v1Tab2Html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedV1Tab2.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on Tab 2 Before -> After Remediation Proof view'
    );

    const v1ManifestJson = await (
      await fetch(`${BASE}/.well-known/mcp.json`)
    ).json();
    assert.equal(
      v1ManifestJson.version,
      '1.0.0',
      `Expected /.well-known/mcp.json version 1.0.0, got ${v1ManifestJson.version}`
    );
    console.log('✔ [37/38] M39-M41 Self-GEO alternate Markdown + 3-node JSON-LD, scoreDelta telemetry, Tab 1/Tab 2 remediation proof & v1.0.0 manifest verified');

    // 36. M42 Profound-Caliber Brand Architecture, Coffee-Store Scrub, Route-Aware Header, Edge AI Bot Crawl Logger & 5 Competitor Intelligence Tools
    for (const [pubRoute, pubContent] of [
      ['/', v1HomeHtml],
      ['/sample-audit', m37SampleHtml],
      ['/agencies', agenciesHtml],
      ['/mcp-guide', mcpGuideHtml],
      ['/privacy', privacyHtml],
      ['/login', loginHtml],
      ['/dashboard (unauth)', unauthDashHtml],
      ['/llms.txt', llmsText],
      ['/agents.md', agentsText],
    ]) {
      assert.ok(
        !/aurearoasters|mosaicroasters|Aurea Coffee|Mosaic Coffee/i.test(
          pubContent
        ),
        `Expected zero personal coffee-store references on ${pubRoute}`
      );
    }

    assert.ok(
      !unauthDashHtml.includes('Open Console') &&
        !loginHtml.includes('Open Console'),
      'Expected SiteHeaderClient to suppress Open Console CTA on /dashboard and /login'
    );

    const forgedBotCrawlRes = await fetch(`${BASE}/api/pixel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'aaaaaaaa-1111-4000-8000-000000000001',
        checkout_key: '000000000000000000000000',
        event_type: 'ai_bot_crawl',
        source_engine: 'Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)',
        landing_path: '/pricing',
      }),
    });
    assert.equal(
      forgedBotCrawlRes.status,
      403,
      'Expected forged checkout_key on ai_bot_crawl to return HTTP 403'
    );

    const validBotCrawlRes = await fetch(`${BASE}/api/pixel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'aaaaaaaa-1111-4000-8000-000000000001',
        checkout_key: 'e2b962fabcc3dc0ef625ae83',
        event_type: 'ai_bot_crawl',
        source_engine: 'Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)',
        landing_path: '/agents.md',
      }),
    });
    assert.equal(
      validBotCrawlRes.status,
      201,
      'Expected HMAC-verified ai_bot_crawl event to return HTTP 201'
    );
    const validBotCrawlJson = await validBotCrawlRes.json();
    assert.equal(validBotCrawlJson.source_engine, 'GPTBot');

    const [m42Tab1Html, m42Tab2Html, m42Tab3Html] = (
      await Promise.all([
        fetch(`${BASE}/dashboard`, { headers: OWNER_HEADERS }).then((r) =>
          r.text()
        ),
        fetch(`${BASE}/dashboard?tab=tab2_fixes`, {
          headers: OWNER_HEADERS,
        }).then((r) => r.text()),
        fetch(`${BASE}/dashboard?tab=tab3_offsite`, {
          headers: OWNER_HEADERS,
        }).then((r) => r.text()),
      ])
    ).map((h) => h.replace(/<!--[\s\S]*?-->/g, ''));

    assert.ok(
      m42Tab1Html.includes('BRAND SENTIMENT FRAMING &amp; RIVAL SHARE OF VOICE') &&
        m42Tab1Html.includes('Mention ') &&
        m42Tab1Html.includes('Cited URL ') &&
        m42Tab1Html.includes('Google-Extended:') &&
        m42Tab1Html.includes('BOT CRAWLS: 1') &&
        m42Tab1Html.includes('Edge AI Bot Crawl Logger'),
      'Expected Sentiment & Rival SOV, Mention vs Cited URL split, Google-Extended, BOT CRAWLS: 1, and Edge AI Bot Crawl Logger on Tab 1'
    );
    assert.ok(
      m42Tab2Html.includes('AI SHOPPING &amp; OFFER ATTRIBUTE READINESS'),
      'Expected AI Shopping & Offer Attribute Readiness matrix on Tab 2'
    );
    assert.ok(
      m42Tab3Html.includes('AUTO-SUGGESTED BUYER PROMPTS') &&
        m42Tab3Html.includes('UNBRANDED') &&
        (m42Tab3Html.includes('UGC / Community') ||
          m42Tab3Html.includes('Editorial / Media') ||
          m42Tab3Html.includes('Review Directory')),
      'Expected Auto-Suggested Buyer Prompts, Funnel/Branded badges, and Source-Type Categorization on Tab 3'
    );
    console.log('✔ [38/39] M42 Profound-caliber funnel, coffee-store scrub, route-aware nav, HMAC ai_bot_crawl logger & all 5 Competitor Intelligence Tools verified');

    // 37. M43 Sitemap + Hero SVG Coffee-Echo Scrub, Executive Audit Export Button & Full Prompt Lifecycle (POST + PUT Re-Scan + DELETE + 404)
    const m43SitemapXml = await (await fetch(`${BASE}/sitemap.xml`)).text();
    assert.ok(
      !/mosaic-springfield-audit|aurearoasters|mosaicroasters/i.test(
        m43SitemapXml
      ),
      'Expected zero personal coffee-store audit URLs inside /sitemap.xml'
    );
    assert.ok(
      !/K-Cup|Whole-bean|coffee gift/i.test(v1HomeHtml),
      'Expected zero specialty coffee echoes inside HeroSignalSchematic on /'
    );
    assert.ok(
      m42Tab1Html.includes('Export Audit (.md)'),
      'Expected 1-click Export Audit (.md) button in Console Top Control Bar'
    );

    const m43AddPromptRes = await fetch(`${BASE}/api/dashboard/prompts`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        prompt_text: 'Best enterprise email infrastructure with SOC2 compliance',
      }),
    });
    assert.equal(m43AddPromptRes.status, 200);
    const m43AddPromptJson = await m43AddPromptRes.json();
    assert.ok(m43AddPromptJson.prompt?.id);

    const m43RescanPromptRes = await fetch(`${BASE}/api/dashboard/prompts`, {
      method: 'PUT',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({ prompt_id: m43AddPromptJson.prompt.id }),
    });
    assert.equal(m43RescanPromptRes.status, 200);
    const m43RescanPromptJson = await m43RescanPromptRes.json();
    assert.equal(m43RescanPromptJson.snapshots.length, 3);

    const m43DeletePromptRes = await fetch(
      `${BASE}/api/dashboard/prompts?id=${encodeURIComponent(
        m43AddPromptJson.prompt.id
      )}`,
      {
        method: 'DELETE',
        headers: OWNER_HEADERS,
      }
    );
    assert.equal(m43DeletePromptRes.status, 200);
    const m43DeletePromptJson = await m43DeletePromptRes.json();
    assert.equal(m43DeletePromptJson.deleted, true);

    const m43DeletePromptAgainRes = await fetch(
      `${BASE}/api/dashboard/prompts?id=${encodeURIComponent(
        m43AddPromptJson.prompt.id
      )}`,
      {
        method: 'DELETE',
        headers: OWNER_HEADERS,
      }
    );
    assert.equal(m43DeletePromptAgainRes.status, 404);
    console.log('✔ [39/40] M43 Sitemap + Hero SVG coffee-echo scrub, Executive Audit Export & full Prompt CRUD (POST + PUT + DELETE + 404) verified');

    // 38. M44 Enriched /audit/[slug] Rival SoV + Categorized Sources & Tab 1 Live Agent Crawl & Referral Ledger
    assert.ok(
      m42Tab1Html.includes('LIVE AGENT CRAWL &amp; REFERRAL LEDGER') &&
        m42Tab1Html.includes('Send Test Bot Ping') &&
        m42Tab1Html.includes('HMAC Verified'),
      'Expected Live Agent Crawl & Referral Ledger with Send Test Bot Ping and HMAC Verified GPTBot row on Tab 1'
    );

    const m44PitchHtml = (
      await (await fetch(`${BASE}${cleanPitchJson.share_url}`)).text()
    ).replace(/<!--[\s\S]*?-->/g, '');
    assert.ok(
      m44PitchHtml.includes('HEAD-TO-HEAD RIVAL SHARE OF VOICE') &&
        m44PitchHtml.includes('THIRD-PARTY SOURCES FEEDING AI ANSWERS') &&
        m44PitchHtml.includes('Mention Rate:'),
      'Expected Head-to-Head Rival Share of Voice and Categorized Sources on minted /audit/[slug]'
    );
    const strippedM44Pitch = m44PitchHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedM44Pitch.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on M44 enriched /audit/[slug]'
    );
    console.log('✔ [40/41] M44 Enriched /audit/[slug] Rival SoV + Categorized Sources & Tab 1 Live Agent Crawl Ledger verified');

    // 39. M45 1-Click AI Remediation Master Prompt Generator (Claude · ChatGPT · Antigravity · Cursor) on Tab 2
    assert.ok(
      m42Tab2Html.includes(
        '1-CLICK AI FIX PROMPT · CLAUDE · CHATGPT · ANTIGRAVITY · CURSOR'
      ) &&
        m42Tab2Html.includes('Copy Prompt for My AI') &&
        m42Tab2Html.includes('Coding Agent (Antigravity · Claude · Cursor)') &&
        m42Tab2Html.includes('ChatGPT / Claude Web (CMS &amp; No-Code)') &&
        m42Tab2Html.includes('Shopify Theme (Liquid)'),
      'Expected 1-Click AI Fix Prompt card with 3 AI environment pills and Copy Prompt for My AI button on Tab 2'
    );
    const strippedM45Tab2 = m42Tab2Html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedM45Tab2.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on Tab 2 1-Click AI Fix Prompt view'
    );
    console.log('✔ [41/42] M45 1-Click AI Remediation Prompt Generator (Claude · ChatGPT · Antigravity · Cursor) verified');

    // 40. M46 Customer-Facing /10 & Critic Score Scrub -> Concrete SCHEMA & FACT VERIFIED / SYNTAX & TRUTH VERIFIED Badges
    assert.ok(
      v1HomeHtml.includes('SCHEMA &amp; FACT VERIFIED') &&
        m42Tab2Html.includes('SYNTAX &amp; TRUTH VERIFIED'),
      'Expected SCHEMA & FACT VERIFIED on / and SYNTAX & TRUTH VERIFIED on Tab 2'
    );
    const SELF_SCORE_JARGON =
      /QUALITY GATE|9\.5\s*\/\s*10|9\.5\+\/10|Critic-verified|Critic-graded/i;
    for (const [label, body] of [
      ['/', v1HomeHtml.replace(/fontSize="9\.5"/g, '')],
      ['/pricing', pricingHtml],
      ['/agencies', agenciesHtml.replace(/fontSize="9\.5"/g, '')],
      ['/mcp-guide', mcpGuideHtml.replace(/fontSize="9\.5"/g, '')],
      ['/sample-audit', m37SampleHtml],
      ['/llms.txt', llmsText],
      ['/agents.md', agentsText],
      ['/dashboard Tab 1', m42Tab1Html],
      ['/dashboard Tab 2', m42Tab2Html],
      ['/dashboard Tab 3', m42Tab3Html],
    ]) {
      assert.ok(
        !SELF_SCORE_JARGON.test(body),
        `Expected zero customer-facing /10 Quality Gate or Critic jargon on ${label}`
      );
    }
    console.log('✔ [42/43] M46 Zero customer-facing /10 or Critic jargon across 10 routes + SCHEMA & FACT VERIFIED badges verified!');

    // 41. M47 7-Day Free Trial (Monthly Starter & Pro), Anti-Abuse Repeat-Trial Guard, Day-0 vs Day-7 /mcp Credit Pacing & Cancellation Downgrade
    assert.ok(
      pricingHtml.includes('Start 7-Day Free Trial') &&
        pricingHtml.includes('$0.00 due today') &&
        pricingHtml.includes('HOW THE 7-DAY FREE TRIAL WORKS'),
      'Expected 7-Day Free Trial CTAs, $0.00 due today note, and Trial Transparency strip on /pricing'
    );

    // Repeat-trial block: authenticated owner already has cus_live_e2e_01 from M26
    const repeatTrialBlockedRes = await fetch(
      `${BASE}/api/checkout?plan=pro_99&cycle=monthly`,
      { headers: OWNER_HEADERS, redirect: 'manual' }
    );
    assert.equal(repeatTrialBlockedRes.status, 303);
    const repeatTrialLoc = repeatTrialBlockedRes.headers.get('location') ?? '';
    assert.ok(
      !repeatTrialLoc.includes('trial=7d'),
      `Expected repeat trial to be blocked for existing Stripe customer, got ${repeatTrialLoc}`
    );

    // Agency $249/mo and Annual plans remain trial-isolated against hit-and-run scraping & annual charge shock
    const agencyNoTrialRes = await fetch(
      `${BASE}/api/checkout?plan=agency_249&cycle=monthly`,
      { redirect: 'manual' }
    );
    assert.equal(agencyNoTrialRes.status, 303);
    assert.ok(
      !(agencyNoTrialRes.headers.get('location') ?? '').includes('trial=7d'),
      'Expected Agency $249/mo batch plan not to grant a $0 trial'
    );

    const annualNoTrialRes = await fetch(
      `${BASE}/api/checkout?plan=pro_99&cycle=annual`,
      { redirect: 'manual' }
    );
    assert.equal(annualNoTrialRes.status, 303);
    assert.ok(
      !(annualNoTrialRes.headers.get('location') ?? '').includes('trial=7d'),
      'Expected Annual plan not to attach a 7-day trial'
    );

    // First-time unauthenticated visitor starting a monthly Pro 7-day trial
    const freshTrialCheckoutRes = await fetch(
      `${BASE}/api/checkout?plan=pro_99&cycle=monthly&domain=linear.app`,
      { redirect: 'manual' }
    );
    assert.equal(freshTrialCheckoutRes.status, 303);
    const freshTrialLoc = freshTrialCheckoutRes.headers.get('location') ?? '';
    assert.ok(
      freshTrialLoc.includes('upgraded=pro_99') &&
        freshTrialLoc.includes('trial=7d') &&
        freshTrialLoc.includes('domain=linear.app'),
      `Expected fresh Pro monthly checkout redirect to include trial=7d, got ${freshTrialLoc}`
    );

    const trialDashHtml = (
      await (
        await fetch(`${BASE}/dashboard?upgraded=pro_99&trial=7d`, {
          headers: OWNER_HEADERS,
        })
      ).text()
    ).replace(/<!--[\s\S]*?-->/g, '');
    assert.ok(
      trialDashHtml.includes('7-DAY FREE TRIAL ROADMAP') &&
        trialDashHtml.includes('$0.00 CHARGED TODAY'),
      'Expected 7-Day Free Trial Roadmap banner on /dashboard?upgraded=pro_99&trial=7d'
    );
    const strippedTrialDash = trialDashHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedTrialDash.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on /dashboard?trial=7d'
    );
    assert.ok(
      !SELF_SCORE_JARGON.test(trialDashHtml),
      'Found customer-facing /10 or Critic jargon on /dashboard?trial=7d'
    );

    // Signed Stripe webhook: checkout.session.completed with payment_status=no_payment_required (Day-0 Trial Start -> 150 starter /mcp credits)
    const trialWebhookPayload = JSON.stringify({
      id: 'evt_e2e_verisource_trial_start_47',
      object: 'event',
      api_version: '2025-01-27.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_live_trial_47',
          object: 'checkout.session',
          mode: 'subscription',
          payment_status: 'no_payment_required',
          customer: 'cus_trial_e2e_47',
          subscription: 'sub_trial_e2e_47',
          customer_details: { email: 'trial@linear.app' },
          metadata: {
            user_id: '00000000-0000-4000-8000-000000000001',
            plan_tier: 'pro_99',
            billing_cycle: 'monthly',
            trial_days: '7',
          },
        },
      },
    });
    const trialStartSig = Stripe.webhooks.generateTestHeaderString({
      payload: trialWebhookPayload,
      secret: E2E_WEBHOOK_SECRET,
    });
    const trialStartHookRes = await fetch(`${BASE}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': trialStartSig,
      },
      body: trialWebhookPayload,
    });
    assert.equal(trialStartHookRes.status, 200);

    const stateAtDay0 = await (
      await fetch(`${BASE}/api/dashboard/state`, { headers: OWNER_HEADERS })
    ).json();
    assert.equal(stateAtDay0.profile.plan_tier, 'pro_99');
    assert.equal(
      stateAtDay0.profile.mcp_calls_limit,
      150,
      'Expected Pro 7-day trial to cap starter /mcp credits at 150 before first paid invoice'
    );

    // Day-0 $0.00 trial creation invoice must NOT prematurely step up /mcp credits to 1,000
    const zeroDollarInvoicePayload = JSON.stringify({
      id: 'evt_e2e_verisource_trial_inv0_47',
      object: 'event',
      api_version: '2025-01-27.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_trial_zero_47',
          object: 'invoice',
          customer: 'cus_trial_e2e_47',
          amount_paid: 0,
        },
      },
    });
    const zeroInvSig = Stripe.webhooks.generateTestHeaderString({
      payload: zeroDollarInvoicePayload,
      secret: E2E_WEBHOOK_SECRET,
    });
    await fetch(`${BASE}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': zeroInvSig,
      },
      body: zeroDollarInvoicePayload,
    });
    const stateAfterZeroInv = await (
      await fetch(`${BASE}/api/dashboard/state`, { headers: OWNER_HEADERS })
    ).json();
    assert.equal(
      stateAfterZeroInv.profile.mcp_calls_limit,
      150,
      'Expected $0.00 Day-0 trial invoice to preserve 150 starter /mcp cap'
    );

    // Day-7 $99.00 renewal invoice steps /mcp credits up to 1,000 and resets usage to 0
    const paidRenewalInvoicePayload = JSON.stringify({
      id: 'evt_e2e_verisource_trial_inv99_47',
      object: 'event',
      api_version: '2025-01-27.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_trial_paid_47',
          object: 'invoice',
          customer: 'cus_trial_e2e_47',
          amount_paid: 9900,
        },
      },
    });
    const paidInvSig = Stripe.webhooks.generateTestHeaderString({
      payload: paidRenewalInvoicePayload,
      secret: E2E_WEBHOOK_SECRET,
    });
    await fetch(`${BASE}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': paidInvSig,
      },
      body: paidRenewalInvoicePayload,
    });
    const stateAfterDay7Paid = await (
      await fetch(`${BASE}/api/dashboard/state`, { headers: OWNER_HEADERS })
    ).json();
    assert.equal(
      stateAfterDay7Paid.profile.mcp_calls_limit,
      1000,
      'Expected paid Day-7 renewal invoice to step Pro /mcp credits up to 1,000'
    );
    assert.equal(stateAfterDay7Paid.profile.mcp_calls_used_this_month, 0);

    // Subscription cancellation downgrades profile to free (402 on Console mutations) while preserving stripe_customer_id
    const cancelSubPayload = JSON.stringify({
      id: 'evt_e2e_verisource_trial_cancel_47',
      object: 'event',
      api_version: '2025-01-27.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_trial_e2e_47',
          object: 'subscription',
          customer: 'cus_trial_e2e_47',
        },
      },
    });
    const cancelSubSig = Stripe.webhooks.generateTestHeaderString({
      payload: cancelSubPayload,
      secret: E2E_WEBHOOK_SECRET,
    });
    const cancelHookRes = await fetch(`${BASE}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': cancelSubSig,
      },
      body: cancelSubPayload,
    });
    assert.equal(cancelHookRes.status, 200);

    const revokedAddDomainRes = await fetch(`${BASE}/api/dashboard/domains`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({ domain_url: 'vercel.com' }),
    });
    assert.equal(
      revokedAddDomainRes.status,
      402,
      'Expected canceled trial/subscription account to receive HTTP 402 on Console mutations'
    );

    const postCancelGateHtml = (
      await (
        await fetch(`${BASE}/dashboard`, { headers: OWNER_HEADERS })
      ).text()
    ).replace(/<!--[\s\S]*?-->/g, '');
    assert.ok(
      postCancelGateHtml.includes('Activate a plan to provision your private AI Search Console') &&
        !postCancelGateHtml.includes('Start 7-Day Trial'),
      'Expected canceled customer gate to require plan activation without offering a second free trial'
    );
    console.log('✔ [43/44] M47 7-Day Free Trial checkout, repeat-trial block, Day-0 (150) -> Day-7 (1,000) /mcp credit step-up & cancellation 402 downgrade verified!');

    // 42. M48 AI Citation & Rival Comparison Page Studio (Step 1 Rival -> Step 2 Page Studio -> Step 3 Prompt Draft + /mcp-guide 7-Day Trial CTA)
    assert.ok(
      m42Tab1Html.includes('Build vs. Page'),
      'Expected 1-click Build vs. Page trigger inside Step 01 Head-to-Head Rival Share of Voice'
    );
    assert.ok(
      m42Tab2Html.includes('AI CITATION &amp; RIVAL COMPARISON PAGE STUDIO') &&
        m42Tab2Html.includes('BRAND TRUTH LOCKED') &&
        m42Tab2Html.includes('Copy AI Prompt to Build Page') &&
        m42Tab2Html.includes('Buyer Guide (Win Prompt)') &&
        m42Tab2Html.includes('Pricing &amp; Policy Reference'),
      'Expected AI Citation & Rival Comparison Page Studio with 3 blueprints and Copy AI Prompt to Build Page on Step 02'
    );
    assert.ok(
      m42Tab3Html.includes('Draft Answer Page'),
      'Expected 1-click Draft Answer Page trigger inside Step 03 Tracked Buyer Prompts'
    );
    assert.ok(
      mcpGuideHtml.includes('Start 7-Day Free Trial ($0 Today') &&
        !mcpGuideHtml.includes('Critic pass'),
      'Expected /mcp-guide hero 7-Day Free Trial CTA and zero Critic pass copy'
    );
    console.log('✔ [44/45] M48 AI Citation & Rival Comparison Page Studio across Steps 1-3 + /mcp-guide 7-Day Trial CTA verified!');

    // 43. M49 Live Sub-Page AI Bot Extraction Inspector (/api/dashboard/inspect-url: 401 unauth, 402 post-cancel, 400 SSRF, 403 cross-domain & 200 valid route)
    const unauthInspectRes = await fetch(`${BASE}/api/dashboard/inspect-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        target_path_or_url: '/pricing',
      }),
    });
    assert.equal(unauthInspectRes.status, 401);

    // Note: M47 canceled the mock owner subscription to 'free' at the end of check 43; verify 402 first, then re-activate Pro so we test 400, 403, and 200!
    const freePlanInspectRes = await fetch(`${BASE}/api/dashboard/inspect-url`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        target_path_or_url: '/pricing',
      }),
    });
    assert.equal(freePlanInspectRes.status, 402);

    // Re-activate workspace via checkout so authenticated owner tests 400 SSRF, 403 cross-domain & 200 sub-page inspection
    await fetch(`${BASE}/api/checkout?plan=pro_99&cycle=monthly`, {
      headers: OWNER_HEADERS,
      redirect: 'manual',
    });

    const ssrfInspectRes = await fetch(`${BASE}/api/dashboard/inspect-url`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        target_path_or_url: 'http://169.254.169.254/latest/meta-data/',
      }),
    });
    assert.equal(ssrfInspectRes.status, 400);

    const crossDomainInspectRes = await fetch(
      `${BASE}/api/dashboard/inspect-url`,
      {
        method: 'POST',
        headers: OWNER_JSON_HEADERS,
        body: JSON.stringify({
          domain_id: '11111111-1111-4000-8000-000000000001',
          target_path_or_url: 'https://stripe.com/pricing',
        }),
      }
    );
    assert.equal(crossDomainInspectRes.status, 403);

    const validInspectRes = await fetch(`${BASE}/api/dashboard/inspect-url`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        target_path_or_url: '/collections/all',
      }),
    });
    assert.equal(validInspectRes.status, 200);
    const validInspectJson = await validInspectRes.json();
    assert.equal(
      validInspectJson.inspection.targetUrl,
      'https://aurearoasters.com/collections/all'
    );
    assert.equal(validInspectJson.inspection.checks.length, 5);
    assert.ok(
      validInspectJson.inspection.aiPageOptimizationPrompt.score >= 9.5,
      'Expected sub-page optimization prompt score >= 9.5'
    );
    assert.ok(
      m42Tab1Html.includes('SUB-PAGE AI BOT EXTRACTION INSPECTOR') &&
        m42Tab1Html.includes('Inspect Bot View'),
      'Expected Sub-Page AI Bot Extraction Inspector inside Step 01 Module 2'
    );
    console.log('✔ [45/46] M49 Sub-Page AI Bot Extraction Inspector (401/402/400 SSRF/403 Cross-Domain/200 Valid) verified!');

    // 44. M50 Live Competitor Technical X-Ray (/api/dashboard/competitor-xray: 401 unauth, 400 SSRF, 400 self-domain & 200 6-dimension diff + cache hit)
    const unauthXrayRes = await fetch(`${BASE}/api/dashboard/competitor-xray`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        rival_domain: 'bluebottlecoffee.com',
      }),
    });
    assert.equal(unauthXrayRes.status, 401);

    const ssrfXrayRes = await fetch(`${BASE}/api/dashboard/competitor-xray`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        rival_domain: 'http://169.254.169.254/',
      }),
    });
    assert.equal(ssrfXrayRes.status, 400);

    const selfDomainXrayRes = await fetch(
      `${BASE}/api/dashboard/competitor-xray`,
      {
        method: 'POST',
        headers: OWNER_JSON_HEADERS,
        body: JSON.stringify({
          domain_id: '11111111-1111-4000-8000-000000000001',
          rival_domain: 'aurearoasters.com',
        }),
      }
    );
    assert.equal(selfDomainXrayRes.status, 400);

    const validXrayRes = await fetch(`${BASE}/api/dashboard/competitor-xray`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        rival_domain: 'bluebottlecoffee.com',
      }),
    });
    assert.equal(validXrayRes.status, 200);
    const validXrayJson = await validXrayRes.json();
    assert.equal(validXrayJson.cached, false);
    assert.equal(validXrayJson.xray.dimensions.length, 6);
    assert.ok(validXrayJson.xray.aiOvertakePrompt.score >= 9.5);

    const cachedXrayRes = await fetch(`${BASE}/api/dashboard/competitor-xray`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        rival_domain: 'https://www.bluebottlecoffee.com/',
      }),
    });
    assert.equal(cachedXrayRes.status, 200);
    const cachedXrayJson = await cachedXrayRes.json();
    assert.equal(cachedXrayJson.cached, true);

    assert.ok(
      m42Tab3Html.includes('LIVE COMPETITOR TECHNICAL X-RAY') &&
        m42Tab3Html.includes('X-Ray Competitor'),
      'Expected Live Competitor Technical X-Ray card at top of Step 03'
    );
    assert.ok(
      loginHtml.includes('Start 7-Day Free Trial ($0 Today)'),
      'Expected updated 7-Day Free Trial CTA on /login'
    );
    console.log('✔ [46/47] M50 Live Competitor Technical X-Ray (401/400 SSRF/400 Self-Domain/200 Diff + 1h Cache) & /login Trial CTA verified!');

    // 45. M51 Source-Category-Aware Off-Site Citation Acquisition Engine & 1-Click Playbook Exporter on Step 03
    assert.ok(
      m42Tab3Html.includes('Export Citation Playbook (.md)'),
      'Expected Export Citation Playbook (.md) button inside Step 03 Citation Gap Source Leaderboard'
    );
    console.log('✔ [47/48] M51 Source-Category-Aware Off-Site Citation Acquisition Engine & 1-Click Playbook Exporter verified!');

    // 46. M52 Non-Pro Easy-to-Use UX Clarity, De-Cluttered Homepage & Progressive Disclosure Accordions
    assert.ok(
      homeAfterHtml.includes('HOW VERISOURCE WORKS') &&
        homeAfterHtml.includes('STEP 02 · COPY 1 AI PROMPT') &&
        !homeAfterHtml.includes('YOUR-DOMAIN-PIXEL-UUID'),
      'Expected 3-step How Verisource Works guide on / and zero raw tracking pixel code dumps on /'
    );
    assert.ok(
      m42Tab1Html.includes('SITE DIAGNOSIS &amp; ACTION PLAN') &&
        m42Tab1Html.includes('Copy AI Prompt to Install Tracker') &&
        m42Tab1Html.includes('<details class="vs-disclosure">'),
      'Expected Site Diagnosis & Action Plan & collapsed Optional Tracking Codes <details> drawer on Step 01'
    );
    assert.ok(
      m42Tab2Html.includes('RECOMMENDED · NO CODING NEEDED') &&
        m42Tab2Html.includes('Individual Raw Code Files') &&
        m42Tab2Html.includes('<details class="vs-disclosure">'),
      'Expected 1-Click AI Fix Prompt guided flow & collapsed Individual Raw Code Files <details> drawer on Step 02'
    );
    console.log('✔ [48/51] M52 Non-Pro Easy-to-Use UX Clarity, De-Cluttered Homepage & Progressive Disclosure verified!');

    // 47. M53 Automated 7-Day Trial Activation Nudge API (/api/dashboard/trial-nudge: 401 unauth, 400 invalid stage/email, 200 Day-3 & Day-5 >= 9.5/10) + Trial Roadmap CTA
    const unauthTrialNudge = await fetch(`${BASE}/api/dashboard/trial-nudge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(unauthTrialNudge.status, 401);

    const badStageTrialNudge = await fetch(`${BASE}/api/dashboard/trial-nudge`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({ stage: 'invalid_stage' }),
    });
    assert.equal(badStageTrialNudge.status, 400);

    const badEmailTrialNudge = await fetch(`${BASE}/api/dashboard/trial-nudge`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({ recipient_email: 'not-an-email' }),
    });
    assert.equal(badEmailTrialNudge.status, 400);

    const day3NudgeRes = await fetch(`${BASE}/api/dashboard/trial-nudge`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        stage: 'day3_copy_ai_prompt',
      }),
    });
    assert.equal(day3NudgeRes.status, 200);
    const day3NudgeJson = await day3NudgeRes.json();
    assert.equal(day3NudgeJson.stage, 'day3_copy_ai_prompt');
    assert.ok(day3NudgeJson.qualityScore >= 9.5);
    assert.ok(day3NudgeJson.actionUrl.includes('tab=tab2_fixes'));
    assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(day3NudgeJson.text));

    const day5NudgeRes = await fetch(`${BASE}/api/dashboard/trial-nudge`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        stage: 'day5_value_proof',
      }),
    });
    assert.equal(day5NudgeRes.status, 200);
    const day5NudgeJson = await day5NudgeRes.json();
    assert.equal(day5NudgeJson.stage, 'day5_value_proof');
    assert.ok(day5NudgeJson.qualityScore >= 9.5);
    assert.ok(!/9\.5\s*\/\s*10|QUALITY GATE|Critic/i.test(day5NudgeJson.text));

    const trialRoadmapDashHtml = await fetch(`${BASE}/dashboard?trial=7d`, {
      headers: OWNER_HEADERS,
    }).then((r) => r.text());
    assert.ok(
      trialRoadmapDashHtml.includes('Email Me Step-by-Step Link'),
      'Expected Email Me Step-by-Step Link CTA inside 7-Day Trial Roadmap banner'
    );
    console.log('✔ [49/50] M53 Automated 7-Day Trial Onboarding & Activation Nudge Engine (401/400/200 Day-3 & Day-5 >= 9.5/10 + Trial Roadmap CTA) verified!');

    // 48. M54 Automatic Website Builder / CMS Detector & 6-Platform Step 02 Selector
    assert.equal(aureaJson.detectedPlatform, 'shopify');
    assert.equal(aureaJson.detectedPlatformLabel, 'Shopify');
    assert.ok(
      m42Tab2Html.includes('SITE BUILDER / AI TOOL:') &&
        m42Tab2Html.includes('AUTO-DETECTED: SHOPIFY') &&
        m42Tab2Html.includes('WordPress (WPCode') &&
        m42Tab2Html.includes('Webflow') &&
        m42Tab2Html.includes('Wix · Squarespace · Framer'),
      'Expected Auto-Detected Website Builder badge & WordPress/Webflow/Wix-Squarespace-Framer pills in Step 02'
    );
    console.log('✔ [50/51] M54 Automatic Website Builder / CMS Detector & Platform-Specific Step 02 Selector verified!');

    // 49. M55 Easy-to-Use Wording Polish (Zero "plain English" / "in English" Leaks) + /audit/[slug] Business Impact & CMS Upgrade
    const PLAIN_ENGLISH_JARGON =
      /plain[- ]english|\bin english\b|everyday english/i;
    const m55MintedAuditHtml = await fetch(
      `${BASE}${batchPitchJson.share_urls[0]}`
    ).then((r) => r.text());
    const m55DirectAuditHtml = await fetch(
      `${BASE}/audit/mosaic-springfield-audit`
    ).then((r) => r.text());

    assert.ok(
      m55DirectAuditHtml.includes(
        'SITE DIAGNOSIS &amp; BUSINESS IMPACT · WHAT TO FIX FIRST'
      ) && m55DirectAuditHtml.includes('READY-TO-APPLY FIX PLAN'),
      'Expected Site Diagnosis & Business Impact card on /audit/mosaic-springfield-audit'
    );
    const whiteLabelMainBody = (
      m55MintedAuditHtml
        .split('class="vs-whitelabel-audit-root')[1]
        ?.split('</main>')[0] ?? ''
    ).replace(/<script[\s\S]*?<\/script>/gi, ' ');
    assert.ok(
      m55MintedAuditHtml.includes(
        'SITE DIAGNOSIS &amp; BUSINESS IMPACT · WHAT TO FIX FIRST'
      ) &&
        m55MintedAuditHtml.includes('PLATFORM:') &&
        whiteLabelMainBody.length > 100 &&
        !whiteLabelMainBody.includes('Verisource'),
      'Expected Business Impact card, Platform badge, and strict white-label isolation on third-party /audit/[slug]'
    );

    for (const [routeLabel, rawHtml] of [
      ['/', homeAfterHtml],
      ['/mcp-guide', mcpGuideHtml],
      ['/dashboard Step 1', m42Tab1Html],
      ['/dashboard Step 2', m42Tab2Html],
      ['/audit/mosaic-springfield-audit', m55DirectAuditHtml],
      ['white-label /audit/[slug]', m55MintedAuditHtml],
    ]) {
      const visible = rawHtml
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ');
      assert.ok(
        !PLAIN_ENGLISH_JARGON.test(visible),
        `Expected zero "plain English" / "in English" phrasing on ${routeLabel}`
      );
      assert.equal(
        (visible.match(BANNED_LEXICON) ?? []).length,
        0,
        `Found banned lexicon on ${routeLabel}`
      );
    }
    console.log('✔ [51/52] M55 Easy-to-Use Wording Polish (0 "plain English" leaks) & /audit/[slug] Business Impact + CMS Upgrade verified!');

    // 50. M56 Mobile Horizontal Scroll Lock, Dual-Orientation SVG Schematics & /sample-audit + /agencies Showcase Upgrade
    assert.ok(
      homeAfterHtml.includes('overflow-x: clip') &&
        homeAfterHtml.includes('overscroll-behavior-x: none') &&
        homeAfterHtml.includes('vs-schematic-desktop') &&
        homeAfterHtml.includes('vs-schematic-mobile'),
      'Expected horizontal overflow-x: clip lock and dual-orientation SVG schematic classes on /'
    );
    assert.ok(
      agenciesHtml.includes('vs-schematic-desktop') &&
        agenciesHtml.includes('vs-schematic-mobile') &&
        agenciesHtml.includes('7-PLATFORM AUTO-DETECTED CLIENT DELIVERY') &&
        agenciesHtml.includes('href="/#grader"'),
      'Expected dual-orientation SVG schematic, 7-Platform CMS delivery matrix, and /#grader link on /agencies'
    );
    assert.ok(
      mcpGuideHtml.includes('vs-schematic-desktop') &&
        mcpGuideHtml.includes('vs-schematic-mobile'),
      'Expected dual-orientation SVG schematic on /mcp-guide'
    );
    assert.ok(
      sampleAuditHtml.includes('INSIDE EVERY SHAREABLE /AUDIT/[SLUG] BRIEF') &&
        sampleAuditHtml.includes(
          'SITE DIAGNOSIS &amp; BUSINESS IMPACT · WHAT TO FIX FIRST'
        ) &&
        sampleAuditHtml.includes('CMS:'),
      'Expected Business Impact specimen preview and CMS badges on /sample-audit'
    );
    for (const [showcaseLabel, showcaseRaw] of [
      ['/sample-audit', sampleAuditHtml],
      ['/agencies', agenciesHtml],
    ]) {
      const showcaseVisible = showcaseRaw
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ');
      assert.ok(
        !PLAIN_ENGLISH_JARGON.test(showcaseVisible),
        `Expected zero "plain English" phrasing on ${showcaseLabel}`
      );
      assert.ok(
        !/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(
          showcaseVisible
        ),
        `Expected zero /10 or Critic jargon on ${showcaseLabel}`
      );
      assert.equal(
        (showcaseVisible.match(BANNED_LEXICON) ?? []).length,
        0,
        `Found banned lexicon on ${showcaseLabel}`
      );
    }
    console.log('✔ [52/53] M56 Mobile Horizontal Scroll Lock, Dual-Orientation SVG Schematics & /sample-audit + /agencies Showcase Upgrade verified!');

    // 51. M57 Self-GEO /llms.txt & /agents.md 7-Platform CMS + /ai-facts Specification & Zero-Slop Gate
    const [m57LlmsTxt, m57AgentsMd, m57McpManifest] = await Promise.all([
      fetch(`${BASE}/llms.txt`).then((r) => r.text()),
      fetch(`${BASE}/agents.md`).then((r) => r.text()),
      fetch(`${BASE}/.well-known/mcp.json`).then((r) => r.json()),
    ]);
    assert.ok(
      m57LlmsTxt.includes('https://verisource.dev/sample-audit') &&
        m57LlmsTxt.includes('verisource-ai-facts') &&
        m57LlmsTxt.includes('WordPress') &&
        m57LlmsTxt.includes('Webflow'),
      'Expected /llms.txt to document /sample-audit, 7-platform CMS support, and /ai-facts verification'
    );
    assert.ok(
      m57AgentsMd.includes('verisource-ai-facts') &&
        m57AgentsMd.includes('detectedPlatform') &&
        m57AgentsMd.includes('citation_action_playbook_markdown') &&
        m57AgentsMd.includes('https://verisource.dev/sample-audit'),
      'Expected /agents.md to document detectedPlatform, /ai-facts protocol, and citation_action_playbook_markdown'
    );
    assert.ok(
      JSON.stringify(m57McpManifest).includes('WordPress') &&
        JSON.stringify(m57McpManifest).includes('Webflow'),
      'Expected /.well-known/mcp.json tool descriptions to include 7-platform CMS coverage'
    );
    for (const [docLabel, docText] of [
      ['/llms.txt', m57LlmsTxt],
      ['/agents.md', m57AgentsMd],
    ]) {
      assert.ok(
        !PLAIN_ENGLISH_JARGON.test(docText),
        `Expected zero "plain English" phrasing in ${docLabel}`
      );
      assert.ok(
        !/\b\d+(?:\.\d+)?\s*\/\s*10\b|QUALITY GATE|\bCritic\b/i.test(docText),
        `Expected zero /10 or Critic jargon in ${docLabel}`
      );
      assert.equal(
        (docText.match(BANNED_LEXICON) ?? []).length,
        0,
        `Found banned lexicon in ${docLabel}`
      );
    }
    console.log('✔ [53/54] M57 Self-GEO /llms.txt + /agents.md 7-Platform CMS & /ai-facts Specification verified!');

    // 52. M58 Public Grader Interactive 1-Click AI Fix Prompt Preview & Anti-Scraping Redaction Bundle Check
    const pageChunkMatches = [
      ...homeAfterHtml.matchAll(/src="(\/_next\/static\/chunks\/app\/page-[^"]+\.js)"/g),
    ];
    assert.ok(
      pageChunkMatches.length > 0,
      'Expected app/page client JS chunk on /'
    );
    const pageClientJs = await fetch(
      `${BASE}${pageChunkMatches[0][1]}`
    ).then((r) => r.text());
    assert.ok(
      pageClientJs.includes('PREVIEW PROMPT FOR:') &&
        pageClientJs.includes('Full copy-paste prompt + syntax-validated site files') &&
        pageClientJs.includes('$0.00 due today on 7-day trial'),
      'Expected M58 Interactive 1-Click AI Fix Prompt Preview inside PublicGraderClient bundle on /'
    );
    console.log('✔ [54/55] M58 Homepage Free Audit Tailored 1-Click AI Fix Prompt Preview & Redacted Payload Footer verified!');

    // 53. M59 End-to-End ?env= CMS/AI Prompt Mode Carryover (/pricing -> /api/checkout 400/303 -> /dashboard Step 02 Pre-Selection)
    const envLockedPricingHtml = await fetch(
      `${BASE}/pricing?plan=pro_99&domain=onyxcoffeelab.com&env=webflow_cms`
    ).then((r) => r.text());
    assert.ok(
      envLockedPricingHtml.includes('PROMPT MODE: WEBFLOW') &&
        envLockedPricingHtml.includes('inside Console Step 02') &&
        envLockedPricingHtml.includes('env=webflow_cms'),
      'Expected /pricing?domain=...&env=webflow_cms to display PROMPT MODE: WEBFLOW and carry env=webflow_cms on checkout links'
    );

    const invalidEnvCheckoutRes = await fetch(
      `${BASE}/api/checkout?plan=pro_99&cycle=monthly&domain=onyxcoffeelab.com&env=invalid_xss`,
      { redirect: 'manual' }
    );
    assert.equal(
      invalidEnvCheckoutRes.status,
      400,
      'Expected invalid ?env= parameter on /api/checkout to return HTTP 400'
    );

    const validEnvCheckoutRes = await fetch(
      `${BASE}/api/checkout?plan=pro_99&cycle=monthly&domain=onyxcoffeelab.com&env=webflow_cms`,
      { redirect: 'manual' }
    );
    assert.equal(validEnvCheckoutRes.status, 303);
    const validEnvLocation = validEnvCheckoutRes.headers.get('location') ?? '';
    assert.ok(
      validEnvLocation.includes('tab=tab2_fixes') &&
        validEnvLocation.includes('env=webflow_cms'),
      `Expected /api/checkout redirect to carry tab=tab2_fixes&env=webflow_cms, got ${validEnvLocation}`
    );

    const envPreselectedDashHtml = await fetch(validEnvLocation, {
      headers: OWNER_HEADERS,
    }).then((r) => r.text());
    assert.ok(
      envPreselectedDashHtml.includes('Webflow Site Settings') ||
        envPreselectedDashHtml.includes('Custom Code'),
      'Expected Step 02 on /dashboard?tab=tab2_fixes&env=webflow_cms to pre-select Webflow prompt instructions on load'
    );
    console.log('✔ [55/56] M59 End-to-End ?env= CMS Prompt Mode Carryover (/pricing -> 400/303 /api/checkout -> Step 02 pre-selection) verified!');

    // 54. M60 Mobile-to-Desktop Free Audit Email Summary (/api/grader/email-summary: 403 Origin, 400 Email/SSRF/Env, 200 >= 9.5/10, 429 Recipient Cap)
    const noOriginSummaryRes = await fetch(`${BASE}/api/grader/email-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: 'aurearoasters.com',
        recipient_email: 'founder@company.com',
      }),
    });
    assert.equal(noOriginSummaryRes.status, 403);

    const evilOriginSummaryRes = await fetch(`${BASE}/api/grader/email-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil-spoofer.com',
      },
      body: JSON.stringify({
        domain: 'aurearoasters.com',
        recipient_email: 'founder@company.com',
      }),
    });
    assert.equal(evilOriginSummaryRes.status, 403);

    const badEmailSummaryRes = await fetch(`${BASE}/api/grader/email-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE,
      },
      body: JSON.stringify({
        domain: 'aurearoasters.com',
        recipient_email: 'bad@email\r\nBcc:victim@test.com',
      }),
    });
    assert.equal(badEmailSummaryRes.status, 400);

    const ssrfSummaryRes = await fetch(`${BASE}/api/grader/email-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE,
      },
      body: JSON.stringify({
        domain: 'http://169.254.169.254/latest/meta-data/',
        recipient_email: 'founder@company.com',
      }),
    });
    assert.equal(ssrfSummaryRes.status, 400);

    const badEnvSummaryRes = await fetch(`${BASE}/api/grader/email-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE,
      },
      body: JSON.stringify({
        domain: 'aurearoasters.com',
        recipient_email: 'founder@company.com',
        env: 'invalid_xss',
      }),
    });
    assert.equal(badEnvSummaryRes.status, 400);

    const validSummary1 = await fetch(`${BASE}/api/grader/email-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE,
        'x-forwarded-for': '198.51.100.77',
      },
      body: JSON.stringify({
        domain: 'aurearoasters.com',
        recipient_email: 'mobile-founder@company.com',
        env: 'wordpress_cms',
      }),
    });
    assert.equal(validSummary1.status, 200);
    const validSummaryJson = await validSummary1.json();
    assert.equal(validSummaryJson.ok, true);
    assert.equal(validSummaryJson.mode, 'preview_dry_run');
    assert.ok(validSummaryJson.qualityScore >= 9.5);
    assert.ok(validSummaryJson.trialUrl.includes('env=wordpress_cms'));
    assert.equal(
      (validSummaryJson.text.match(BANNED_LEXICON) ?? []).length,
      0,
      'Expected zero banned lexicon in free audit email summary'
    );

    const validSummary2 = await fetch(`${BASE}/api/grader/email-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE,
        'x-forwarded-for': '198.51.100.77',
      },
      body: JSON.stringify({
        domain: 'aurearoasters.com',
        recipient_email: 'mobile-founder@company.com',
        env: 'wordpress_cms',
      }),
    });
    assert.equal(validSummary2.status, 200);

    const rateLimitedSummary3 = await fetch(`${BASE}/api/grader/email-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE,
        'x-forwarded-for': '198.51.100.77',
      },
      body: JSON.stringify({
        domain: 'aurearoasters.com',
        recipient_email: 'mobile-founder@company.com',
        env: 'wordpress_cms',
      }),
    });
    assert.equal(rateLimitedSummary3.status, 429);
    console.log('✔ [56/57] M60 Mobile-to-Desktop Free Audit Email Summary (403 Origin, 400 CRLF/SSRF/Env, 200 >= 9.5/10, 429 Recipient Cap) verified!');

    // 55. M61 Targeted Follow-Up AI Fix Prompt on /api/dashboard/verify-fixes (400 Invalid Env, >= 9.5/10 CMS Guidance, Step 02 Studio Anchor)
    const badVerifyEnvRes = await fetch(`${BASE}/api/dashboard/verify-fixes`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        env: 'invalid_xss_env',
      }),
    });
    assert.equal(badVerifyEnvRes.status, 400);
    const badVerifyEnvJson = await badVerifyEnvRes.json();
    assert.equal(badVerifyEnvJson.error, 'INVALID_TARGET_ENV');

    const notFoundVerifyRes = await fetch(`${BASE}/api/dashboard/verify-fixes`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '00000000-0000-4000-8000-999999999999',
        env: 'webflow_cms',
      }),
    });
    assert.equal(notFoundVerifyRes.status, 404);

    const m61VerifyWebflowRes = await fetch(`${BASE}/api/dashboard/verify-fixes`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        env: 'webflow_cms',
      }),
    });
    assert.equal(m61VerifyWebflowRes.status, 200);
    const m61VerifyWebflowJson = await m61VerifyWebflowRes.json();
    assert.ok(m61VerifyWebflowJson.followUp);
    assert.equal(m61VerifyWebflowJson.followUp.targetEnv, 'webflow_cms');
    assert.equal(m61VerifyWebflowJson.followUp.checkGuidance.length, 4);
    assert.ok(
      m61VerifyWebflowJson.followUp.promptScore >= 9.5,
      `Expected followUp.promptScore >= 9.5, got ${m61VerifyWebflowJson.followUp.promptScore}`
    );
    assert.equal(
      (m61VerifyWebflowJson.followUp.promptContent.match(BANNED_LEXICON) ?? [])
        .length,
      0,
      'Found banned lexicon in M61 followUp.promptContent'
    );
    assert.ok(
      !/plain[- ]english|\bin english\b|everyday english/i.test(
        m61VerifyWebflowJson.followUp.promptContent
      ),
      'Expected zero "plain English" phrasing in M61 followUp.promptContent'
    );
    assert.ok(
      !SELF_SCORE_JARGON.test(m61VerifyWebflowJson.followUp.promptContent),
      'Expected zero /10 or Critic jargon in M61 followUp.promptContent'
    );

    const m61Step2Html = await (
      await fetch(`${BASE}/dashboard?tab=tab2_fixes`, {
        headers: OWNER_HEADERS,
      })
    ).text();
    assert.ok(
      m61Step2Html.includes('id="vs-citation-page-studio"') &&
        m61Step2Html.includes('Verify Live Fixes'),
      'Expected Step 02 to render Comparison Page Studio scroll anchor and Verify Live Fixes controls'
    );
    console.log('✔ [57/58] M61 Targeted Follow-Up AI Fix Prompt (/api/dashboard/verify-fixes 400/200 >= 9.5/10 + CMS Guidance + Step 02 Studio Anchor) verified!');

    // 56. M61.2 Tactile Pill Buttons (.vs-pill-btn), Subscriber-Aware /pricing (Hides $19 + Upgrade/Downgrade CTAs), & Resend /api/auth/magic-link
    assert.ok(
      m61Step2Html.includes('vs-pill-group') &&
        m61Step2Html.includes('vs-pill-btn'),
      'Expected .vs-pill-group and .vs-pill-btn tactile pill buttons on Step 02'
    );

    const subscriberPricingHtml = await (
      await fetch(`${BASE}/pricing`, { headers: OWNER_HEADERS })
    ).text();
    assert.ok(
      !subscriberPricingHtml.includes('Buy $19 Audit Pass') &&
        !subscriberPricingHtml.includes('Start 7-Day Free Trial') &&
        subscriberPricingHtml.includes('CURRENT PLAN') &&
        subscriberPricingHtml.includes('Downgrade to Starter') &&
        subscriberPricingHtml.includes('Upgrade to Agency Plan'),
      'Expected signed-in Pro subscriber /pricing view to hide $19 Audit Pass and show CURRENT PLAN + Upgrade/Downgrade CTAs'
    );
    const strippedSubPricing = subscriberPricingHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    assert.equal(
      (strippedSubPricing.match(BANNED_LEXICON) ?? []).length,
      0,
      'Found banned lexicon on subscriber /pricing view'
    );

    // /api/auth/magic-link security & rate-limit checks
    const noOriginMagicRes = await fetch(`${BASE}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aurearoasters@gmail.com' }),
    });
    assert.equal(noOriginMagicRes.status, 403);

    const openRedirectMagicRes = await fetch(`${BASE}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE },
      body: JSON.stringify({
        email: 'aurearoasters@gmail.com',
        nextPath: 'https://evil-phisher.com/steal',
      }),
    });
    assert.equal(openRedirectMagicRes.status, 400);

    const crlfEmailMagicRes = await fetch(`${BASE}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE },
      body: JSON.stringify({
        email: 'bad@email\r\nBcc:victim@test.com',
      }),
    });
    assert.equal(crlfEmailMagicRes.status, 400);

    for (let i = 0; i < 5; i += 1) {
      const validMagicRes = await fetch(`${BASE}/api/auth/magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: BASE,
          'x-forwarded-for': '198.51.100.88',
        },
        body: JSON.stringify({
          email: 'aurearoasters@gmail.com',
          nextPath: '/dashboard?tab=tab2_fixes',
        }),
      });
      assert.equal(validMagicRes.status, 200);
      const validMagicJson = await validMagicRes.json();
      assert.equal(validMagicJson.ok, true);
      assert.ok(validMagicJson.qualityScore >= 9.5);
      // Security check: actionLink must NEVER be returned in JSON
      assert.ok(!JSON.stringify(validMagicJson).includes('access_token'));
      assert.ok(!JSON.stringify(validMagicJson).includes('actionLink'));
    }

    const sixthMagicRes = await fetch(`${BASE}/api/auth/magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE,
        'x-forwarded-for': '198.51.100.88',
      },
      body: JSON.stringify({
        email: 'aurearoasters@gmail.com',
      }),
    });
    assert.equal(sixthMagicRes.status, 429);
    console.log('✔ [58/59] M61.2 Tactile Pill Buttons (.vs-pill-btn), Subscriber /pricing Upgrade/Downgrade View & Resend /api/auth/magic-link (403/400/200/429) verified!');

    // 57. M62 Closed-Loop Comparison Page Live Verifier (/api/dashboard/inspect-url studioVerification + Step 02 Verify Page Live CTA)
    assert.ok(
      m61Step2Html.includes('✓ Verify Page Live'),
      'Expected Step 02 Comparison Page Studio to include ✓ Verify Page Live button'
    );

    const badStudioEnvRes = await fetch(`${BASE}/api/dashboard/inspect-url`, {
      method: 'POST',
      headers: OWNER_JSON_HEADERS,
      body: JSON.stringify({
        domain_id: '11111111-1111-4000-8000-000000000001',
        target_path_or_url: '/pages/aurea-coffee-roasters-vs-mystic-monk-coffee',
        blueprint_type: 'vs_competitor',
        rival_name: 'Mystic Monk Coffee',
        env: 'invalid_xss_env',
      }),
    });
    assert.equal(badStudioEnvRes.status, 400);

    const validStudioVerifyRes = await fetch(
      `${BASE}/api/dashboard/inspect-url`,
      {
        method: 'POST',
        headers: OWNER_JSON_HEADERS,
        body: JSON.stringify({
          domain_id: '11111111-1111-4000-8000-000000000001',
          target_path_or_url:
            '/pages/aurea-coffee-roasters-vs-mystic-monk-coffee',
          blueprint_type: 'vs_competitor',
          rival_name: 'Mystic Monk Coffee',
          env: 'shopify_liquid',
        }),
      }
    );
    assert.equal(validStudioVerifyRes.status, 200);
    const validStudioVerifyJson = await validStudioVerifyRes.json();
    assert.ok(validStudioVerifyJson.studioVerification);
    assert.ok(validStudioVerifyJson.studioVerification.promptScore >= 9.5);
    assert.ok(
      validStudioVerifyJson.studioVerification.recommendedPromptToTrack.includes(
        'Mystic Monk Coffee'
      )
    );
    assert.equal(
      (
        validStudioVerifyJson.studioVerification.promptContent.match(
          BANNED_LEXICON
        ) ?? []
      ).length,
      0,
      'Found banned lexicon in M62 studioVerification.promptContent'
    );
    assert.ok(
      !SELF_SCORE_JARGON.test(
        validStudioVerifyJson.studioVerification.promptContent
      ),
      'Found /10 or Critic jargon in M62 studioVerification.promptContent'
    );
    console.log('✔ [59/59] M62 Closed-Loop Comparison Page Live Verifier (/api/dashboard/inspect-url studioVerification >= 9.5/10 + Step 02 Verify Page Live) verified!');
  } finally {
    server.kill();
  }
}

run().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
