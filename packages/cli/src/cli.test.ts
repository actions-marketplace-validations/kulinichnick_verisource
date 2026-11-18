import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildGithubStepSummaryMarkdown, runCli } from './bin.js';
import {
  browseClickHandle,
  browseOpenUrl,
  findStoredHandle,
  installAgentSkills,
  mapStaticCodebase,
  pushCliRunToCloud,
  queryStoredHandles,
  recordBaselineWorkflow,
  resolveVerisourceCloudCredentials,
  runSavedWorkflow,
  saveBrowseSessionAsWorkflow,
  upsertGithubPrComment,
  validateWorkflowFiles,
  VERISOURCE_PR_COMMENT_MARKER,
} from './index.js';

test('static Next.js App Router codebase mapper detects pages, APIs, and JSON-LD', () => {
  const webRoot = path.resolve(process.cwd(), '..', '..', 'apps', 'web');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vs-cli-map-'));
  try {
    const report = mapStaticCodebase({
      targetDir: webRoot,
      diff: true,
      cwd: tmpDir,
    });
    assert.ok(report.pageRoutesCount >= 10, 'Expected >= 10 static page routes');
    assert.ok(report.apiRoutesCount >= 8, 'Expected >= 8 API routes');
    assert.ok(
      report.routes.some((r) => r.route === '/features'),
      'Expected /features route in map'
    );
    assert.ok(
      report.routes.some((r) => r.route === '/scanner' && r.emitsJsonLd),
      'Expected /scanner route with JSON-LD in map'
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('agent skill installer writes compact skills for claude, cursor, codex, and antigravity', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vs-cli-skill-'));
  try {
    const written = installAgentSkills({ target: 'all', cwd: tmpDir });
    assert.equal(written.length, 4);
    for (const rel of written) {
      assert.ok(fs.existsSync(path.join(tmpDir, rel)), `Missing ${rel}`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('browse, record, workflow check, deterministic run, and handle show/query work end-to-end', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/pricing') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!doctype html><html><head><title>Pricing Tiers</title>
        <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage"}</script>
      </head><body><a href="/checkout">Start Trial</a></body></html>`);
      return;
    }
    if (req.url === '/checkout') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!doctype html><html><head><title>Checkout Ready</title></head><body><h1>Checkout</h1></body></html>`);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('Not found');
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}`;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vs-cli-run-'));

  try {
    const opened = await browseOpenUrl(`${baseUrl}/pricing`, tmpDir);
    assert.equal(opened.httpStatus, 200);
    assert.equal(opened.elements.length, 1);
    assert.ok(findStoredHandle('e1', tmpDir));
    assert.equal(queryStoredHandles('Start Trial', tmpDir).length, 1);

    const clicked = await browseClickHandle('e1', tmpDir);
    assert.ok(clicked.currentUrl.endsWith('/checkout'));

    const savedWfPath = saveBrowseSessionAsWorkflow('signup-flow', tmpDir);
    assert.ok(fs.existsSync(savedWfPath));

    await recordBaselineWorkflow({
      name: 'pricing-check',
      targetUrl: `${baseUrl}/pricing`,
      cwd: tmpDir,
    });

    const validation = validateWorkflowFiles(tmpDir);
    assert.equal(validation.valid, true);
    assert.equal(validation.checkedCount, 2);

    const exitPass = await runCli(
      ['node', 'bin.js', 'run', 'pricing-check', '--json'],
      tmpDir
    );
    assert.equal(exitPass, 0);

    // Verify failing expectation returns exit code 1
    const brokenResult = await runSavedWorkflow({
      workflowSpec: {
        name: 'broken-route',
        baseUrl,
        steps: [
          { action: 'goto', url: '/missing-route' },
          { action: 'expectStatus', status: 200 },
        ],
      },
      cwd: tmpDir,
    });
    assert.equal(brokenResult.status, 'FAIL');
    assert.ok(brokenResult.handles.some((h) => h.handle === 'n1'));
  } finally {
    server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('standalone dist/bin.js bundle has zero workspace runtime dependencies and passes README quality gate', () => {
  const pkgJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')
  ) as { dependencies?: Record<string, string> };
  assert.equal(
    Object.keys(pkgJson.dependencies ?? {}).length,
    0,
    'Expected zero runtime dependencies so npx @verisource/cli publishes cleanly'
  );

  const binPath = path.resolve(process.cwd(), 'dist', 'bin.js');
  const binSource = fs.readFileSync(binPath, 'utf8');
  assert.ok(
    binSource.startsWith('#!/usr/bin/env node\n'),
    'Expected single shebang at line 1 of dist/bin.js'
  );
  assert.ok(
    !binSource.includes('@verisource/core-geo'),
    'Expected @verisource/core-geo to be bundled into dist/bin.js'
  );

  const helpOut = execFileSync(process.execPath, [binPath, '--help'], {
    encoding: 'utf8',
  });
  assert.ok(helpOut.includes('verisource scan <url>'));
  assert.ok(helpOut.includes('verisource verify <url>'));

  const readme = fs.readFileSync(
    path.resolve(process.cwd(), 'README.md'),
    'utf8'
  );
  const banned = /\b(delve|testament|tapestry|elevate|elevating|game-changer|game-changing|unleash|unlock|unlocks|unlocking|seamless|seamlessly|comprehensive|moreover|furthermore|beacon|symphony|turbocharge|turbocharged)\b/i;
  assert.equal(
    banned.test(readme),
    false,
    'Expected zero banned AI lexicon words in packages/cli/README.md'
  );
});

test('GitHub Step Summary formatter and composite action.yml pass zero-slop checks', () => {
  const md = buildGithubStepSummaryMarkdown({
    mode: 'verify',
    status: 'FAIL',
    hostname: 'preview.acme.dev',
    detectedPlatformLabel: 'Custom Code / Next.js',
    visibilityScore: 72,
    healthScore: 88,
    pagesScanned: 5,
    linksChecked: 19,
    botsAllowed: true,
    llmsTxtStatus: 'present',
    agentsMdStatus: 'missing',
    jsonLdCount: 2,
    failures: ['/agents.md is missing'],
    handles: [
      {
        handle: 'a1',
        kind: 'dead_anchor',
        severity: 'warn',
        summary: 'Dead #pricing-faq anchor on /pricing',
        fixHint: 'Add id="pricing-faq" target element.',
      },
    ],
  });
  assert.ok(md.includes('### Verisource AI Search & Site Health Gate — `FAIL`'));
  assert.ok(md.includes('`preview.acme.dev`'));
  assert.ok(md.includes('`[a1]`'));

  const actionYml = fs.readFileSync(
    path.resolve(process.cwd(), '..', '..', 'action.yml'),
    'utf8'
  );
  assert.ok(actionYml.includes("using: 'composite'"));
  assert.ok(actionYml.includes('--github-summary'));
  assert.ok(actionYml.includes('VERISOURCE_API_KEY'));
});

test('verisource auth --key, --status, --logout and pushCliRunToCloud work end-to-end', async () => {
  const validKey = `vs_live_${'a'.repeat(48)}`;
  let receivedSyncPayload: Record<string, unknown> | null = null;

  const server = http.createServer((req, res) => {
    const auth = req.headers.authorization ?? '';
    if (auth !== `Bearer ${validKey}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'INVALID_OR_REVOKED_KEY' }));
      return;
    }

    if (req.url === '/api/cli/sync' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          authenticated: true,
          email: 'ni***@verisource.dev',
          planTier: 'pro_99',
          keyPrefix: 'vs_live_aaaaaa',
          keyLabel: 'CI Key',
          trackedDomainCount: 1,
          domainCap: 3,
          dashboardUrl: 'https://verisource.dev/dashboard',
        })
      );
      return;
    }

    if (req.url === '/api/cli/sync' && req.method === 'POST') {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk;
      });
      req.on('end', () => {
        receivedSyncPayload = JSON.parse(raw) as Record<string, unknown>;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            synced: true,
            autoRegistered: false,
            hostname: 'verisource.dev',
            planTier: 'pro_99',
            dashboardUrl: 'https://verisource.dev/dashboard',
          })
        );
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as { port: number };
  const apiOrigin = `http://127.0.0.1:${addr.port}`;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vs-cli-auth-'));

  try {
    const badExit = await runCli(
      ['node', 'bin.js', 'auth', '--key', 'invalid_short_key'],
      tmpDir
    );
    assert.equal(badExit, 2);

    const loginExit = await runCli(
      [
        'node',
        'bin.js',
        'auth',
        '--key',
        validKey,
        '--api-origin',
        apiOrigin,
        '--json',
      ],
      tmpDir
    );
    assert.equal(loginExit, 0);

    const statusExit = await runCli(
      ['node', 'bin.js', 'auth', '--status', '--json'],
      tmpDir
    );
    assert.equal(statusExit, 0);

    const syncRes = await pushCliRunToCloud({
      apiKey: validKey,
      apiOrigin,
      payload: {
        domain: 'https://verisource.dev',
        mode: 'verify',
        status: 'PASS',
        visibilityScore: 94,
        llmsTxtStatus: 'present',
        agentsMdStatus: 'custom_enriched',
        robotsAiBotStatus: {
          GPTBot: true,
          'OAI-SearchBot': true,
          PerplexityBot: true,
          ClaudeBot: true,
        },
        siteHealth: { healthScore: 100, pagesScanned: 5, linksChecked: 18 },
        handles: [],
      },
    });
    assert.equal(syncRes.synced, true);
    assert.equal(
      (receivedSyncPayload as { visibilityScore?: number } | null)?.visibilityScore,
      94
    );

    const logoutExit = await runCli(
      ['node', 'bin.js', 'auth', '--logout', '--json'],
      tmpDir
    );
    assert.equal(logoutExit, 0);
    assert.equal(
      resolveVerisourceCloudCredentials({ cwd: tmpDir }).apiKey,
      null
    );
  } finally {
    server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('upsertGithubPrComment creates once, updates idempotently in place, and skips 403 forks cleanly', async () => {
  const storedComments: Array<{ id: number; body: string }> = [];

  const ghServer = http.createServer((req, res) => {
    const auth = req.headers.authorization ?? '';
    if (auth === 'Bearer fork_readonly_token') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Resource not accessible by integration' }));
      return;
    }

    if (
      req.method === 'GET' &&
      req.url?.startsWith('/repos/acme/web/issues/42/comments')
    ) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(storedComments));
      return;
    }

    if (
      req.method === 'POST' &&
      req.url === '/repos/acme/web/issues/42/comments'
    ) {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        const parsed = JSON.parse(raw) as { body: string };
        const created = { id: 901, body: parsed.body };
        storedComments.push(created);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            id: 901,
            html_url: 'https://github.com/acme/web/pull/42#issuecomment-901',
          })
        );
      });
      return;
    }

    if (
      req.method === 'PATCH' &&
      req.url === '/repos/acme/web/issues/comments/901'
    ) {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        const parsed = JSON.parse(raw) as { body: string };
        storedComments[0] = { id: 901, body: parsed.body };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            id: 901,
            html_url: 'https://github.com/acme/web/pull/42#issuecomment-901',
          })
        );
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => ghServer.listen(0, '127.0.0.1', resolve));
  const addr = ghServer.address() as { port: number };
  const apiBaseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    const md1 = buildGithubStepSummaryMarkdown({
      mode: 'verify',
      status: 'WARN',
      hostname: 'preview-42.acme.dev',
      visibilityScore: 68,
      healthScore: 95,
      pagesScanned: 4,
      linksChecked: 12,
      botsAllowed: true,
      llmsTxtStatus: 'present',
      agentsMdStatus: 'missing',
      jsonLdCount: 2,
    });
    assert.ok(md1.includes(VERISOURCE_PR_COMMENT_MARKER));
    assert.ok(md1.includes('/api/badge/preview-42.acme.dev'));

    const first = await upsertGithubPrComment({
      markdownBody: md1,
      context: {
        token: 'ghs_valid',
        repository: 'acme/web',
        prNumber: 42,
        apiBaseUrl,
      },
    });
    assert.equal(first.posted, true);
    assert.equal(first.action, 'created');
    assert.equal(first.commentId, 901);
    assert.equal(storedComments.length, 1);

    const second = await upsertGithubPrComment({
      markdownBody: md1.replace('WARN', 'PASS'),
      context: {
        token: 'ghs_valid',
        repository: 'acme/web',
        prNumber: 42,
        apiBaseUrl,
      },
    });
    assert.equal(second.posted, true);
    assert.equal(second.action, 'updated');
    assert.equal(second.commentId, 901);
    assert.equal(storedComments.length, 1);
    assert.ok(storedComments[0]?.body.includes('PASS'));

    const forkRes = await upsertGithubPrComment({
      markdownBody: md1,
      context: {
        token: 'fork_readonly_token',
        repository: 'acme/web',
        prNumber: 42,
        apiBaseUrl,
      },
    });
    assert.equal(forkRes.posted, false);
    assert.equal(forkRes.action, 'skipped');
    assert.equal(forkRes.reason, 'GITHUB_API_403');
  } finally {
    ghServer.close();
  }
});
