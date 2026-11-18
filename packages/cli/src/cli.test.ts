import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runCli } from './bin.js';
import {
  browseClickHandle,
  browseOpenUrl,
  recordBaselineWorkflow,
  runSavedWorkflow,
  saveBrowseSessionAsWorkflow,
  validateWorkflowFiles,
} from './browser.js';
import { mapStaticCodebase } from './mapper.js';
import { installAgentSkills } from './skills.js';
import { findStoredHandle, queryStoredHandles } from './store.js';

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
