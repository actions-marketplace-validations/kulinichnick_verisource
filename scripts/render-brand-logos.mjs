import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = path.resolve(__dirname, '..');
const DRIVE_BRAND_DIR = 'g:\\My Drive\\GEO MCP Engine\\brand-assets';
const PUBLIC_BRAND_DIR = path.join(MONOREPO_ROOT, 'apps/web/public/brand');
const EXT_ICON_DIR = path.join(MONOREPO_ROOT, 'apps/extension/public/icon');
const WEB_FAVICON_PATH = path.join(MONOREPO_ROOT, 'apps/web/src/app/icon.png');

const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const chromeBin = chromeCandidates.find((p) => fs.existsSync(p));
if (!chromeBin) {
  throw new Error('Headless Chrome/Edge binary not found.');
}

// Canonical Verisource Mark SVG (matches SiteHeaderClient.tsx 1:1)
// Warm Brass (#E5A93C) rounded tile with subtle top bevel + #161004 rotated hollow diamond
export function buildMarkSvg({
  size = 512,
  mode = 'rounded_tile', // 'rounded_tile' | 'full_bleed_square' | 'obsidian_framed'
}) {
  if (mode === 'obsidian_framed') {
    // 1024x1024 Obsidian (#0E1116) canvas with centered 672x672 Warm Brass tile (ideal for LinkedIn avatar frame)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="vsBrassGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ECC968"/>
      <stop offset="12%" stop-color="#E5A93C"/>
      <stop offset="100%" stop-color="#D89A2B"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="#0E1116"/>
  <rect x="176" y="176" width="672" height="672" rx="156" fill="url(#vsBrassGrad)"/>
  <rect x="178" y="178" width="668" height="668" rx="154" fill="none" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="4"/>
  <g transform="translate(512 512) rotate(45)">
    <rect x="-132" y="-132" width="264" height="264" rx="8" fill="none" stroke="#161004" stroke-width="58" stroke-linejoin="round"/>
  </g>
</svg>`;
  }

  if (mode === 'full_bleed_square') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="vsBrassFull" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ECC968"/>
      <stop offset="12%" stop-color="#E5A93C"/>
      <stop offset="100%" stop-color="#D89A2B"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#vsBrassFull)"/>
  <g transform="translate(512 512) rotate(45)">
    <rect x="-184" y="-184" width="368" height="368" rx="10" fill="none" stroke="#161004" stroke-width="80" stroke-linejoin="round"/>
  </g>
</svg>`;
  }

  // 'rounded_tile' (transparent outside rounded corners — ideal for favicon & Chrome extension icons)
  const strokeW = size <= 16 ? 104 : size <= 32 ? 94 : 86;
  const halfBox = size <= 16 ? 196 : 186;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="vsBrassTile" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ECC968"/>
      <stop offset="14%" stop-color="#E5A93C"/>
      <stop offset="100%" stop-color="#D89A2B"/>
    </linearGradient>
  </defs>
  <rect x="32" y="32" width="960" height="960" rx="228" fill="url(#vsBrassTile)"/>
  <rect x="36" y="36" width="952" height="952" rx="224" fill="none" stroke="#FFFFFF" stroke-opacity="0.32" stroke-width="8"/>
  <g transform="translate(512 512) rotate(45)">
    <rect x="-${halfBox}" y="-${halfBox}" width="${halfBox * 2}" height="${halfBox * 2}" rx="10" fill="none" stroke="#161004" stroke-width="${strokeW}" stroke-linejoin="round"/>
  </g>
</svg>`;
}

function buildLinkedInBannerSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1128" height="191" viewBox="0 0 1128 191">
  <defs>
    <linearGradient id="vsBannerBrass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ECC968"/>
      <stop offset="15%" stop-color="#E5A93C"/>
      <stop offset="100%" stop-color="#D89A2B"/>
    </linearGradient>
  </defs>
  <rect width="1128" height="191" fill="#0E1116"/>
  <line x1="0" y1="190" x2="1128" y2="190" stroke="#262E3D" stroke-width="2"/>

  <!-- Left Title Cluster (leaves bottom-left safe for LinkedIn overlapping company avatar) -->
  <g transform="translate(224, 34)">
    <rect width="26" height="26" rx="6" fill="url(#vsBannerBrass)"/>
    <g transform="translate(13 13) rotate(45)">
      <rect x="-4.8" y="-4.8" width="9.6" height="9.6" fill="none" stroke="#161004" stroke-width="2.4"/>
    </g>
    <text x="36" y="19" fill="#EEF1F6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="19" font-weight="700" letter-spacing="-0.025em">verisource</text>

    <text x="0" y="56" fill="#EEF1F6" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="22" font-weight="700" letter-spacing="-0.025em">AI answers buyers about your brand.</text>
    <text x="0" y="84" fill="#E5A93C" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="22" font-weight="700" letter-spacing="-0.025em">Verisource checks—and ships the fix.</text>
    <text x="0" y="114" fill="#B4BCC9" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12.2">GPTBot WAF · 3-Pillar JSON-LD · /llms.txt · /agents.md · 20-Page Crawler · /mcp</text>
  </g>

  <!-- Right Terminal Badge -->
  <g transform="translate(866, 66)">
    <rect width="226" height="58" rx="8" fill="#171C26" stroke="#364156" stroke-width="1.2"/>
    <circle cx="20" cy="22" r="4" fill="#34D399"/>
    <text x="32" y="26" fill="#EEF1F6" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12.5" font-weight="700">verisource.dev</text>
    <text x="20" y="45" fill="#E5A93C" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11.5" font-weight="600">npx @verisource/cli</text>
  </g>
</svg>`;
}

function renderSvgToPng(svgContent, width, height, outPath, transparentBg = false) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const tmpHtml = path.join(
    os.tmpdir(),
    `vs-logo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.html`
  );
  try {
    fs.writeFileSync(
      tmpHtml,
      `<!doctype html><html><body style="margin:0;padding:0;overflow:hidden;width:${width}px;height:${height}px;background:${
        transparentBg ? 'transparent' : '#0E1116'
      };">${svgContent}</body></html>`,
      'utf8'
    );
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${width},${height}`,
      ...(transparentBg ? ['--default-background-color=00000000'] : []),
      `--screenshot=${outPath}`,
      `file:///${tmpHtml.replace(/\\/g, '/')}`,
    ];
    execFileSync(chromeBin, args);
  } finally {
    try {
      if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
    } catch {
      // Ignore cleanup error
    }
  }
}

fs.mkdirSync(DRIVE_BRAND_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_BRAND_DIR, { recursive: true });
fs.mkdirSync(EXT_ICON_DIR, { recursive: true });

// 1. Vector SVG Master
const masterSvg = buildMarkSvg({ size: 512, mode: 'rounded_tile' });
fs.writeFileSync(path.join(DRIVE_BRAND_DIR, 'verisource-logo-mark.svg'), masterSvg, 'utf8');
fs.writeFileSync(path.join(PUBLIC_BRAND_DIR, 'verisource-logo-mark.svg'), masterSvg, 'utf8');

// 2. LinkedIn Company Logo Pack (Obsidian Framed 1024 & 400 + Full-Bleed Brass 1024 & 400 + Cover Banner 1128x191)
const obsidian1024 = buildMarkSvg({ size: 1024, mode: 'obsidian_framed' });
const obsidian400 = buildMarkSvg({ size: 400, mode: 'obsidian_framed' });
const brass1024 = buildMarkSvg({ size: 1024, mode: 'full_bleed_square' });
const brass400 = buildMarkSvg({ size: 400, mode: 'full_bleed_square' });
const bannerSvg = buildLinkedInBannerSvg();

const linkedInTargets = [
  ['verisource-linkedin-logo-obsidian-1024x1024.png', obsidian1024, 1024, 1024, false],
  ['verisource-linkedin-logo-obsidian-400x400.png', obsidian400, 400, 400, false],
  ['verisource-linkedin-logo-brass-1024x1024.png', brass1024, 1024, 1024, false],
  ['verisource-linkedin-logo-brass-400x400.png', brass400, 400, 400, false],
  ['verisource-linkedin-banner-1128x191.png', bannerSvg, 1128, 191, false],
];

for (const [filename, svg, w, h, trans] of linkedInTargets) {
  const driveOut = path.join(DRIVE_BRAND_DIR, filename);
  const pubOut = path.join(PUBLIC_BRAND_DIR, filename);
  renderSvgToPng(svg, w, h, driveOut, trans);
  fs.copyFileSync(driveOut, pubOut);
  console.log(`✔ Rendered ${filename} (${w}x${h})`);
}

// 3. Site Favicon (apps/web/src/app/icon.png — 512x512 transparent-corner Warm Brass tile)
renderSvgToPng(buildMarkSvg({ size: 512, mode: 'rounded_tile' }), 512, 512, WEB_FAVICON_PATH, true);
console.log('✔ Synced apps/web/src/app/icon.png (512x512)');

// 4. Chrome MV3 Extension Icons (16, 32, 48, 128)
for (const px of [16, 32, 48, 128]) {
  const out = path.join(EXT_ICON_DIR, `${px}.png`);
  renderSvgToPng(buildMarkSvg({ size: px, mode: 'rounded_tile' }), px, px, out, true);
  console.log(`✔ Synced apps/extension/public/icon/${px}.png`);
}
