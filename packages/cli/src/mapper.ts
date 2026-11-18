import fs from 'node:fs';
import path from 'node:path';
import { crawlDomainSiteHealth } from '@verisource/core-geo';
import { ensureVerisourceWorkspaceDir } from './store.js';

export interface MappedRouteEntry {
  route: string;
  kind: 'page' | 'api' | 'live_url';
  sourceFile?: string;
  httpMethods?: string[];
  emitsJsonLd: boolean;
  jsonLdTypes: string[];
  clientApiCalls: string[];
  httpStatus?: number | null;
  visibleWordCount?: number;
}

export interface SiteMapReport {
  mode: 'static_codebase' | 'live_url';
  target: string;
  mappedAt: string;
  totalRoutes: number;
  pageRoutesCount: number;
  apiRoutesCount: number;
  jsonLdRoutesCount: number;
  routes: MappedRouteEntry[];
  addedSinceLastMap?: string[];
  removedSinceLastMap?: string[];
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  '.output',
  '.wxt',
  '.git',
  '.verisource',
  'coverage',
]);

function walkSourceFiles(rootDir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(rootDir)) return acc;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(full, acc);
    } else if (/\.(?:tsx?|jsx?)$/i.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function normalizeNextAppRoute(appRoot: string, filePath: string): string {
  const rel = path
    .relative(appRoot, path.dirname(filePath))
    .split(path.sep)
    .filter((seg) => seg && !(seg.startsWith('(') && seg.endsWith(')')));
  return `/${rel.join('/')}`.replace(/\/+/g, '/') || '/';
}

function extractStaticSignals(sourceText: string): {
  emitsJsonLd: boolean;
  jsonLdTypes: string[];
  clientApiCalls: string[];
  httpMethods: string[];
} {
  const emitsJsonLd = /application\/ld\+json/i.test(sourceText);
  const jsonLdTypes = new Set<string>();
  const typeRegex = /['"]@type['"]\s*:\s*['"]([A-Za-z0-9_]+)['"]/g;
  let tm: RegExpExecArray | null;
  while ((tm = typeRegex.exec(sourceText)) !== null) {
    if (tm[1]) jsonLdTypes.add(tm[1]);
  }

  const clientApiCalls = new Set<string>();
  const fetchRegex = /\bfetch\(\s*[`'"]((?:\/api\/|https?:\/\/)[^`'"${]+)[`'"]/g;
  let fm: RegExpExecArray | null;
  while ((fm = fetchRegex.exec(sourceText)) !== null) {
    if (fm[1]) clientApiCalls.add(fm[1]);
  }

  const httpMethods = new Set<string>();
  const methodRegex =
    /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g;
  let mm: RegExpExecArray | null;
  while ((mm = methodRegex.exec(sourceText)) !== null) {
    if (mm[1]) httpMethods.add(mm[1]);
  }

  return {
    emitsJsonLd,
    jsonLdTypes: Array.from(jsonLdTypes),
    clientApiCalls: Array.from(clientApiCalls),
    httpMethods: Array.from(httpMethods),
  };
}

function applyMapDiff(
  report: SiteMapReport,
  enableDiff: boolean,
  cwd: string
): SiteMapReport {
  const dir = ensureVerisourceWorkspaceDir(cwd);
  const mapPath = path.join(dir, 'last-map.json');

  if (enableDiff && fs.existsSync(mapPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as SiteMapReport;
      const prevSet = new Set(prev.routes.map((r) => r.route));
      const currSet = new Set(report.routes.map((r) => r.route));
      report.addedSinceLastMap = report.routes
        .map((r) => r.route)
        .filter((r) => !prevSet.has(r));
      report.removedSinceLastMap = prev.routes
        .map((r) => r.route)
        .filter((r) => !currSet.has(r));
    } catch {
      // Ignore corrupt prior map
    }
  }

  fs.writeFileSync(mapPath, JSON.stringify(report, null, 2), 'utf8');
  return report;
}

export function mapStaticCodebase(params: {
  targetDir: string;
  filterText?: string;
  diff?: boolean;
  cwd?: string;
}): SiteMapReport {
  const resolvedRoot = path.resolve(params.targetDir);
  const candidates = [
    path.join(resolvedRoot, 'src', 'app'),
    path.join(resolvedRoot, 'app'),
    path.join(resolvedRoot, 'apps', 'web', 'src', 'app'),
  ];
  const appRoot = candidates.find((c) => fs.existsSync(c));
  const routes: MappedRouteEntry[] = [];

  if (appRoot) {
    const files = walkSourceFiles(appRoot);
    const layoutPath = files.find((f) => path.basename(f).startsWith('layout.'));
    const rootLayoutSignals = layoutPath
      ? extractStaticSignals(fs.readFileSync(layoutPath, 'utf8'))
      : null;

    for (const file of files) {
      const base = path.basename(file);
      const isPage = /^page\.(?:tsx?|jsx?)$/i.test(base);
      const isRoute = /^route\.(?:tsx?|jsx?)$/i.test(base);
      if (!isPage && !isRoute) continue;

      const route = normalizeNextAppRoute(appRoot, file);
      const text = fs.readFileSync(file, 'utf8');
      const sig = extractStaticSignals(text);

      const mergedTypes = new Set(sig.jsonLdTypes);
      let emitsJsonLd = sig.emitsJsonLd;
      if (isPage && route === '/' && rootLayoutSignals?.emitsJsonLd) {
        emitsJsonLd = true;
        for (const t of rootLayoutSignals.jsonLdTypes) mergedTypes.add(t);
      }

      routes.push({
        route,
        kind: isPage ? 'page' : 'api',
        sourceFile: path.relative(resolvedRoot, file).replace(/\\/g, '/'),
        ...(isRoute ? { httpMethods: sig.httpMethods } : {}),
        emitsJsonLd,
        jsonLdTypes: Array.from(mergedTypes),
        clientApiCalls: sig.clientApiCalls,
      });
    }
  } else {
    // React Router fallback (`path="/..."`)
    const files = walkSourceFiles(resolvedRoot);
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      const sig = extractStaticSignals(text);
      const rrRegex = /\bpath\s*=\s*['"]([^'"]+)['"]/g;
      let rm: RegExpExecArray | null;
      while ((rm = rrRegex.exec(text)) !== null) {
        if (!rm[1]) continue;
        routes.push({
          route: rm[1].startsWith('/') ? rm[1] : `/${rm[1]}`,
          kind: 'page',
          sourceFile: path.relative(resolvedRoot, file).replace(/\\/g, '/'),
          emitsJsonLd: sig.emitsJsonLd,
          jsonLdTypes: sig.jsonLdTypes,
          clientApiCalls: sig.clientApiCalls,
        });
      }
    }
  }

  routes.sort((a, b) => a.route.localeCompare(b.route));
  const filtered = params.filterText
    ? routes.filter((r) =>
        JSON.stringify(r)
          .toLowerCase()
          .includes(params.filterText!.toLowerCase())
      )
    : routes;

  const report: SiteMapReport = {
    mode: 'static_codebase',
    target: resolvedRoot,
    mappedAt: new Date().toISOString(),
    totalRoutes: filtered.length,
    pageRoutesCount: filtered.filter((r) => r.kind === 'page').length,
    apiRoutesCount: filtered.filter((r) => r.kind === 'api').length,
    jsonLdRoutesCount: filtered.filter((r) => r.emitsJsonLd).length,
    routes: filtered,
  };

  return applyMapDiff(report, Boolean(params.diff), params.cwd ?? process.cwd());
}

export async function mapLiveDomain(params: {
  url: string;
  filterText?: string;
  diff?: boolean;
  skipNetwork?: boolean;
  cwd?: string;
}): Promise<SiteMapReport> {
  const crawl = await crawlDomainSiteHealth({
    domainInput: params.url,
    mode: 'workspace',
    skipNetwork: params.skipNetwork,
  });

  let routes: MappedRouteEntry[] = crawl.pages.map((pg) => ({
    route: pg.path,
    kind: 'live_url',
    emitsJsonLd: pg.jsonLdTypes.length > 0,
    jsonLdTypes: pg.jsonLdTypes,
    clientApiCalls: [],
    httpStatus: pg.httpStatus,
    visibleWordCount: pg.visibleWordCount,
  }));

  if (params.filterText) {
    const needle = params.filterText.toLowerCase();
    routes = routes.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(needle)
    );
  }

  const report: SiteMapReport = {
    mode: 'live_url',
    target: crawl.origin,
    mappedAt: crawl.scannedAt,
    totalRoutes: routes.length,
    pageRoutesCount: routes.length,
    apiRoutesCount: 0,
    jsonLdRoutesCount: routes.filter((r) => r.emitsJsonLd).length,
    routes,
  };

  return applyMapDiff(report, Boolean(params.diff), params.cwd ?? process.cwd());
}
