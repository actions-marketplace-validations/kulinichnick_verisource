import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const distDir = path.join(pkgRoot, 'dist');

const CJS_SHIM =
  'import { createRequire as __vsCreateRequire } from "node:module"; const require = __vsCreateRequire(import.meta.url);';

await build({
  entryPoints: [path.join(pkgRoot, 'src', 'bin.ts')],
  outfile: path.join(distDir, 'bin.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  external: ['playwright', 'playwright-core'],
  banner: {
    js: `#!/usr/bin/env node\n${CJS_SHIM}`,
  },
  logLevel: 'silent',
});

await build({
  entryPoints: [path.join(pkgRoot, 'src', 'index.ts')],
  outfile: path.join(distDir, 'index.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  external: ['playwright', 'playwright-core'],
  banner: {
    js: CJS_SHIM,
  },
  logLevel: 'silent',
});

fs.chmodSync(path.join(distDir, 'bin.js'), 0o755);
console.log('✓ Bundled standalone @verisource/cli (dist/bin.js, dist/index.js)');
