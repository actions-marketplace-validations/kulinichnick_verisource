import fs from 'node:fs';
import path from 'node:path';
import {
  ensureVerisourceWorkspaceDir,
  saveLastRunLedger,
  type StoredHandleItem,
} from './store.js';
import {
  logEventsToStoredHandles,
  queryCorrelatedBackendLogs,
} from './logs.js';

export type WorkflowStepAction =
  | { action: 'goto'; url: string }
  | { action: 'click'; selector: string }
  | { action: 'fill'; selector: string; value: string }
  | { action: 'select'; selector: string; value: string }
  | { action: 'press'; key: string }
  | { action: 'expectStatus'; status: number }
  | { action: 'expectText'; text: string }
  | { action: 'expectJsonLd'; type: string };

export interface VerisourceWorkflowSpec {
  name: string;
  baseUrl: string;
  steps: WorkflowStepAction[];
}

export interface BrowserElementHandle {
  handle: string;
  tag: string;
  selector: string;
  label: string;
  href?: string;
}

export interface BrowseSessionState {
  currentUrl: string;
  httpStatus: number | null;
  title: string | null;
  elements: BrowserElementHandle[];
  history: WorkflowStepAction[];
}

export interface WorkflowRunResult {
  workflow: string;
  status: 'PASS' | 'FAIL';
  stepsPassed: number;
  stepsTotal: number;
  durationMs: number;
  engine: 'playwright' | 'http_dom';
  handles: StoredHandleItem[];
}

export function validateWorkflowFiles(cwd: string = process.cwd()): {
  valid: boolean;
  checkedCount: number;
  errors: string[];
} {
  const wfDir = path.resolve(cwd, '.verisource', 'workflows');
  if (!fs.existsSync(wfDir)) {
    return { valid: true, checkedCount: 0, errors: [] };
  }
  const files = fs
    .readdirSync(wfDir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const errors: string[] = [];

  for (const file of files) {
    const full = path.join(wfDir, file);
    try {
      const parsed = JSON.parse(
        fs.readFileSync(full, 'utf8')
      ) as Partial<VerisourceWorkflowSpec>;
      if (!parsed.name || typeof parsed.name !== 'string') {
        errors.push(`${file}: missing string "name"`);
      }
      if (!parsed.baseUrl || typeof parsed.baseUrl !== 'string') {
        errors.push(`${file}: missing string "baseUrl"`);
      }
      if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        errors.push(`${file}: "steps" must be a non-empty array`);
      } else {
        parsed.steps.forEach((st, idx) => {
          if (!st || typeof st !== 'object' || !('action' in st)) {
            errors.push(`${file}[step ${idx}]: missing "action"`);
          }
        });
      }
    } catch (err) {
      errors.push(
        `${file}: invalid JSON (${err instanceof Error ? err.message : 'parse error'})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    checkedCount: files.length,
    errors,
  };
}

function extractInteractiveElementsFromHtml(html: string): {
  title: string | null;
  elements: BrowserElementHandle[];
} {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.replace(/\s+/g, ' ').trim() ?? null;
  const elements: BrowserElementHandle[] = [];
  let idx = 0;

  const tagRegex =
    /<(a|button|input|select)\b([^>]*)>([\s\S]*?)<\/\1>|<(input)\b([^>]*)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(html)) !== null && elements.length < 40) {
    const tag = (m[1] ?? m[4] ?? '').toLowerCase();
    const attrs = m[2] ?? m[5] ?? '';
    const inner = (m[3] ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i);
    const nameMatch = attrs.match(/\bname\s*=\s*["']([^"']+)["']/i);
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    const placeholderMatch = attrs.match(
      /\bplaceholder\s*=\s*["']([^"']+)["']/i
    );
    const ariaMatch = attrs.match(/\baria-label\s*=\s*["']([^"']+)["']/i);

    const label = (
      inner ||
      ariaMatch?.[1] ||
      placeholderMatch?.[1] ||
      nameMatch?.[1] ||
      idMatch?.[1] ||
      hrefMatch?.[1] ||
      tag
    ).slice(0, 64);

    const selector = idMatch?.[1]
      ? `#${idMatch[1]}`
      : nameMatch?.[1]
        ? `${tag}[name="${nameMatch[1]}"]`
        : hrefMatch?.[1] && tag === 'a'
          ? `a[href="${hrefMatch[1]}"]`
          : `${tag}:nth-of-type(${idx + 1})`;

    idx += 1;
    elements.push({
      handle: `e${idx}`,
      tag,
      selector,
      label,
      ...(hrefMatch?.[1] ? { href: hrefMatch[1] } : {}),
    });
  }

  return { title, elements };
}

export async function browseOpenUrl(
  targetUrl: string,
  cwd: string = process.cwd()
): Promise<BrowseSessionState> {
  const dir = ensureVerisourceWorkspaceDir(cwd);
  const res = await fetch(targetUrl, {
    headers: { Accept: 'text/html,application/xhtml+xml' },
  });
  const html = await res.text();
  const { title, elements } = extractInteractiveElementsFromHtml(html);

  const session: BrowseSessionState = {
    currentUrl: res.url || targetUrl,
    httpStatus: res.status,
    title,
    elements,
    history: [{ action: 'goto', url: targetUrl }],
  };

  fs.writeFileSync(
    path.join(dir, 'browser-session.json'),
    JSON.stringify(session, null, 2),
    'utf8'
  );

  saveLastRunLedger(
    {
      runId: `browse-${Date.now()}`,
      command: `browse open ${targetUrl}`,
      target: targetUrl,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      status: res.ok ? 'PASS' : 'FAIL',
      handles: elements.map((el) => ({
        handle: el.handle,
        kind: 'element',
        severity: 'info',
        summary: `<${el.tag}> "${el.label}" (${el.selector})`,
        url: el.href,
      })),
    },
    cwd
  );

  return session;
}

export async function browseClickHandle(
  handleId: string,
  cwd: string = process.cwd()
): Promise<BrowseSessionState> {
  const sessionPath = path.resolve(cwd, '.verisource', 'browser-session.json');
  if (!fs.existsSync(sessionPath)) {
    throw new Error(
      'No active browse session. Run `verisource browse open <url>` first.'
    );
  }
  const prev = JSON.parse(
    fs.readFileSync(sessionPath, 'utf8')
  ) as BrowseSessionState;
  const clean = handleId.replace(/^\[|\]$/g, '').trim().toLowerCase();
  const target = prev.elements.find((e) => e.handle.toLowerCase() === clean);
  if (!target) {
    throw new Error(`Element handle "${handleId}" not found in active page.`);
  }

  const nextHistory: WorkflowStepAction[] = [
    ...prev.history,
    { action: 'click', selector: target.selector },
  ];

  if (target.href && !target.href.startsWith('#')) {
    const nextUrl = new URL(target.href, prev.currentUrl).toString();
    const updated = await browseOpenUrl(nextUrl, cwd);
    updated.history = nextHistory;
    fs.writeFileSync(sessionPath, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  }

  prev.history = nextHistory;
  fs.writeFileSync(sessionPath, JSON.stringify(prev, null, 2), 'utf8');
  return prev;
}

export function saveBrowseSessionAsWorkflow(
  name: string,
  cwd: string = process.cwd()
): string {
  const dir = ensureVerisourceWorkspaceDir(cwd);
  const sessionPath = path.join(dir, 'browser-session.json');
  if (!fs.existsSync(sessionPath)) {
    throw new Error(
      'No active browse session to save. Run `verisource browse open <url>` first.'
    );
  }
  const session = JSON.parse(
    fs.readFileSync(sessionPath, 'utf8')
  ) as BrowseSessionState;
  const parsedOrigin = new URL(session.currentUrl).origin;
  const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '-');

  const spec: VerisourceWorkflowSpec = {
    name: cleanName,
    baseUrl: parsedOrigin,
    steps: [
      ...session.history,
      { action: 'expectStatus', status: 200 },
    ],
  };

  const outPath = path.join(dir, 'workflows', `${cleanName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf8');
  return outPath;
}

export async function recordBaselineWorkflow(params: {
  name: string;
  targetUrl: string;
  cwd?: string;
}): Promise<string> {
  const cwd = params.cwd ?? process.cwd();
  const dir = ensureVerisourceWorkspaceDir(cwd);
  const cleanName = params.name.replace(/[^a-zA-Z0-9_-]/g, '-');
  const res = await fetch(params.targetUrl);
  const html = await res.text();
  const { title } = extractInteractiveElementsFromHtml(html);
  const parsed = new URL(params.targetUrl);

  const steps: WorkflowStepAction[] = [
    { action: 'goto', url: parsed.pathname + parsed.search || '/' },
    { action: 'expectStatus', status: res.status },
  ];
  if (title) {
    steps.push({ action: 'expectText', text: title.slice(0, 36) });
  }
  if (/application\/ld\+json/i.test(html)) {
    const typeMatch = html.match(/['"]@type['"]\s*:\s*['"]([A-Za-z0-9_]+)['"]/);
    if (typeMatch?.[1]) {
      steps.push({ action: 'expectJsonLd', type: typeMatch[1] });
    }
  }

  const spec: VerisourceWorkflowSpec = {
    name: cleanName,
    baseUrl: parsed.origin,
    steps,
  };

  const outPath = path.join(dir, 'workflows', `${cleanName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf8');
  return outPath;
}

async function tryLoadPlaywrightChromium(): Promise<{
  launch: (opts: { headless: boolean }) => Promise<unknown>;
} | null> {
  for (const pkgName of ['playwright', 'playwright-core']) {
    try {
      const dynamicImport = new Function('m', 'return import(m)') as (
        m: string
      ) => Promise<{ chromium?: { launch: (opts: { headless: boolean }) => Promise<unknown> } }>;
      const mod = await dynamicImport(pkgName);
      if (mod?.chromium) return mod.chromium;
    } catch {
      // Optional peer package not installed
    }
  }
  return null;
}

export async function runSavedWorkflow(params: {
  workflowSpec: VerisourceWorkflowSpec;
  headed?: boolean;
  timeoutMs?: number;
  cwd?: string;
}): Promise<WorkflowRunResult> {
  const cwd = params.cwd ?? process.cwd();
  const startedAt = Date.now();
  const handles: StoredHandleItem[] = [];
  let stepsPassed = 0;
  let netCounter = 0;

  const needsInteractiveBrowser = params.workflowSpec.steps.some((s) =>
    ['click', 'fill', 'select', 'press'].includes(s.action)
  );
  const chromium = needsInteractiveBrowser
    ? await tryLoadPlaywrightChromium()
    : null;

  if (chromium) {
    // Execute with real Playwright Chromium when interactive steps are present & installed
    const browser = (await chromium.launch({
      headless: !params.headed,
    })) as {
      newPage: () => Promise<{
        goto: (u: string, o?: unknown) => Promise<{ status: () => number } | null>;
        click: (sel: string, o?: unknown) => Promise<void>;
        fill: (sel: string, val: string, o?: unknown) => Promise<void>;
        selectOption: (sel: string, val: string) => Promise<unknown>;
        keyboard: { press: (k: string) => Promise<void> };
        content: () => Promise<string>;
        screenshot: (o: { path: string }) => Promise<void>;
        on: (ev: string, fn: (arg: unknown) => void) => void;
      }>;
      close: () => Promise<void>;
    };

    try {
      const page = await browser.newPage();
      let lastStatus = 200;

      page.on('response', (resp: unknown) => {
        const r = resp as { status: () => number; url: () => string };
        if (r.status() >= 400) {
          netCounter += 1;
          handles.push({
            handle: `n${netCounter}`,
            kind: 'network',
            severity: r.status() >= 500 ? 'critical' : 'warn',
            summary: `HTTP ${r.status()} on ${r.url()}`,
            url: r.url(),
            httpStatus: r.status(),
          });
        }
      });

      for (const step of params.workflowSpec.steps) {
        if (step.action === 'goto') {
          const full = new URL(step.url, params.workflowSpec.baseUrl).toString();
          const nav = await page.goto(full, {
            timeout: params.timeoutMs ?? 10_000,
          });
          lastStatus = nav?.status() ?? 200;
        } else if (step.action === 'click') {
          await page.click(step.selector, {
            timeout: params.timeoutMs ?? 6_000,
          });
        } else if (step.action === 'fill') {
          await page.fill(step.selector, step.value);
        } else if (step.action === 'select') {
          await page.selectOption(step.selector, step.value);
        } else if (step.action === 'press') {
          await page.keyboard.press(step.key);
        } else if (step.action === 'expectStatus') {
          if (lastStatus !== step.status) {
            throw new Error(
              `Expected HTTP ${step.status}, got ${lastStatus}`
            );
          }
        } else if (step.action === 'expectText') {
          const html = await page.content();
          if (!html.includes(step.text)) {
            throw new Error(`Expected page text "${step.text}" not found`);
          }
        } else if (step.action === 'expectJsonLd') {
          const html = await page.content();
          if (!new RegExp(`['"]@type['"]\\s*:\\s*['"]${step.type}['"]`, 'i').test(html)) {
            throw new Error(`Expected JSON-LD @type "${step.type}" not found`);
          }
        }
        stepsPassed += 1;
      }

      const logEvents = await queryCorrelatedBackendLogs({
        windowStartMs: startedAt,
        windowEndMs: Date.now(),
        cwd,
      });
      handles.push(...logEventsToStoredHandles(logEvents));

      const hasCrit = handles.some((h) => h.severity === 'critical');
      return {
        workflow: params.workflowSpec.name,
        status: hasCrit ? 'FAIL' : 'PASS',
        stepsPassed,
        stepsTotal: params.workflowSpec.steps.length,
        durationMs: Date.now() - startedAt,
        engine: 'playwright',
        handles,
      };
    } catch (err) {
      netCounter += 1;
      handles.push({
        handle: `n${netCounter}`,
        kind: 'page_error',
        severity: 'critical',
        summary: err instanceof Error ? err.message : 'Workflow step failed',
      });
      return {
        workflow: params.workflowSpec.name,
        status: 'FAIL',
        stepsPassed,
        stepsTotal: params.workflowSpec.steps.length,
        durationMs: Date.now() - startedAt,
        engine: 'playwright',
        handles,
      };
    } finally {
      await browser.close();
    }
  }

  // Zero-dependency deterministic HTTP + DOM replay engine
  let currentUrl = params.workflowSpec.baseUrl;
  let lastStatus: number | null = null;
  let lastHtml = '';

  try {
    for (const step of params.workflowSpec.steps) {
      if (step.action === 'goto') {
        currentUrl = new URL(step.url, params.workflowSpec.baseUrl).toString();
        const res = await fetch(currentUrl);
        lastStatus = res.status;
        lastHtml = await res.text();
        if (res.status >= 400) {
          netCounter += 1;
          handles.push({
            handle: `n${netCounter}`,
            kind: 'network',
            severity: res.status >= 500 ? 'critical' : 'warn',
            summary: `GET ${currentUrl} -> HTTP ${res.status}`,
            url: currentUrl,
            httpStatus: res.status,
          });
        }
      } else if (step.action === 'click') {
        const hrefMatch = step.selector.match(/a\[href=["']([^"']+)["']\]/i);
        if (hrefMatch?.[1]) {
          currentUrl = new URL(hrefMatch[1], currentUrl).toString();
          const res = await fetch(currentUrl);
          lastStatus = res.status;
          lastHtml = await res.text();
        }
      } else if (step.action === 'expectStatus') {
        if (lastStatus !== step.status) {
          netCounter += 1;
          handles.push({
            handle: `n${netCounter}`,
            kind: 'network',
            severity: 'critical',
            summary: `Expected HTTP ${step.status} on ${currentUrl}, received ${lastStatus}`,
            url: currentUrl,
            httpStatus: lastStatus,
          });
          throw new Error(`Status mismatch: expected ${step.status}, got ${lastStatus}`);
        }
      } else if (step.action === 'expectText') {
        if (!lastHtml.includes(step.text)) {
          handles.push({
            handle: `p1`,
            kind: 'page_error',
            severity: 'critical',
            summary: `Expected text "${step.text}" missing on ${currentUrl}`,
            url: currentUrl,
          });
          throw new Error(`Missing text "${step.text}"`);
        }
      } else if (step.action === 'expectJsonLd') {
        const re = new RegExp(`['"]@type['"]\\s*:\\s*['"]${step.type}['"]`, 'i');
        if (!re.test(lastHtml)) {
          handles.push({
            handle: `s1`,
            kind: 'ai_readability',
            severity: 'critical',
            summary: `Expected JSON-LD @type "${step.type}" missing on ${currentUrl}`,
            url: currentUrl,
          });
          throw new Error(`Missing JSON-LD @type "${step.type}"`);
        }
      }
      stepsPassed += 1;
    }

    const logEvents = await queryCorrelatedBackendLogs({
      windowStartMs: startedAt,
      windowEndMs: Date.now(),
      cwd,
    });
    handles.push(...logEventsToStoredHandles(logEvents));

    const hasCrit = handles.some((h) => h.severity === 'critical');
    return {
      workflow: params.workflowSpec.name,
      status: hasCrit ? 'FAIL' : 'PASS',
      stepsPassed,
      stepsTotal: params.workflowSpec.steps.length,
      durationMs: Date.now() - startedAt,
      engine: 'http_dom',
      handles,
    };
  } catch {
    const logEvents = await queryCorrelatedBackendLogs({
      windowStartMs: startedAt,
      windowEndMs: Date.now(),
      cwd,
    });
    handles.push(...logEventsToStoredHandles(logEvents));

    return {
      workflow: params.workflowSpec.name,
      status: 'FAIL',
      stepsPassed,
      stepsTotal: params.workflowSpec.steps.length,
      durationMs: Date.now() - startedAt,
      engine: 'http_dom',
      handles,
    };
  }
}
