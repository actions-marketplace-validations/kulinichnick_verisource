import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const DRIVE_CWS_DIR = 'g:\\My Drive\\GEO MCP Engine\\chrome-store-assets';
const DRIVE_BRAND_DIR = 'g:\\My Drive\\GEO MCP Engine\\brand-assets';

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const chromeBin = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!chromeBin) throw new Error('Chrome/Edge binary not found.');

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}
function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}
function decodePngToRgb(pngBuf, bgR = 14, bgG = 17, bgB = 22) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];
  while (offset < pngBuf.length) {
    const length = pngBuf.readUInt32BE(offset);
    const type = pngBuf.subarray(offset + 4, offset + 8).toString('ascii');
    const data = pngBuf.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  assert.equal(bitDepth, 8);
  const bpp = colorType === 6 ? 4 : 3;
  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * bpp;
  const recon = new Uint8Array(height * stride);
  let inPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = inflated[inPos++];
    const rowStart = y * stride;
    const prevStart = (y - 1) * stride;
    for (let i = 0; i < stride; i++) {
      const raw = inflated[inPos++];
      const a = i >= bpp ? recon[rowStart + i - bpp] : 0;
      const b = y > 0 ? recon[prevStart + i] : 0;
      const c = y > 0 && i >= bpp ? recon[prevStart + i - bpp] : 0;
      let val = raw;
      if (filter === 1) val = (raw + a) & 0xff;
      else if (filter === 2) val = (raw + b) & 0xff;
      else if (filter === 3) val = (raw + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) val = (raw + paethPredictor(a, b, c)) & 0xff;
      recon[rowStart + i] = val;
    }
  }
  const rgb = new Uint8Array(width * height * 3);
  for (let px = 0; px < width * height; px++) {
    const r = recon[px * bpp];
    const g = recon[px * bpp + 1];
    const b = recon[px * bpp + 2];
    const a = bpp === 4 ? recon[px * bpp + 3] / 255 : 1;
    rgb[px * 3] = Math.round(r * a + bgR * (1 - a));
    rgb[px * 3 + 1] = Math.round(g * a + bgG * (1 - a));
    rgb[px * 3 + 2] = Math.round(b * a + bgB * (1 - a));
  }
  return { width, height, rgb };
}
function encodeRgb24Png(width, height, rgb, srcWidth, srcHeight) {
  const rawScanlines = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    rawScanlines[rowOffset] = 0;
    const sy = Math.min(y, srcHeight - 1);
    for (let x = 0; x < width; x++) {
      const sx = Math.min(x, srcWidth - 1);
      const srcIdx = (sy * srcWidth + sx) * 3;
      const dstIdx = rowOffset + 1 + x * 3;
      rawScanlines[dstIdx] = rgb[srcIdx];
      rawScanlines[dstIdx + 1] = rgb[srcIdx + 1];
      rawScanlines[dstIdx + 2] = rgb[srcIdx + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // 24-bit Truecolor RGB (no alpha)
  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderSvgToRgb24Png(svgContent, width, height, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vs-rgb24-'));
  const htmlPath = path.join(tmpDir, 'scene.html');
  const rawPng = path.join(tmpDir, 'raw.png');
  try {
    fs.writeFileSync(
      htmlPath,
      `<!doctype html><html><body style="margin:0;padding:0;overflow:hidden;width:${width}px;height:${height}px;background:#0E1116;">${svgContent}</body></html>`,
      'utf8'
    );
    execFileSync(chromeBin, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${width},${height + 120}`,
      `--screenshot=${rawPng}`,
      `file:///${htmlPath.replace(/\\/g, '/')}`,
    ]);
    const rawBuf = fs.readFileSync(rawPng);
    const decoded = decodePngToRgb(rawBuf, 14, 17, 22);
    const rgb24 = encodeRgb24Png(width, height, decoded.rgb, decoded.width, decoded.height);
    fs.writeFileSync(outPath, rgb24);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// 1. CWS Screenshot 1 (1280x800, Obsidian & Warm Brass, Yellow Argon clean)
const cwsHero1Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  <rect width="1280" height="800" fill="#0E1116" />
  <rect x="36" y="36" width="1208" height="728" rx="18" fill="#131720" stroke="#262E3D" stroke-width="2" />

  <!-- Top Obsidian & Warm Brass Masthead -->
  <g transform="translate(84, 84)">
    <rect width="34" height="34" rx="8" fill="#E5A93C" />
    <g transform="translate(17 17) rotate(45)">
      <rect x="-6.5" y="-6.5" width="13" height="13" fill="none" stroke="#161004" stroke-width="3" stroke-linejoin="round" />
    </g>
    <text x="48" y="25" fill="#EEF1F6" font-size="24" font-family="system-ui, -apple-system, sans-serif" font-weight="700" letter-spacing="-0.025em">verisource</text>
    <text x="174" y="24" fill="#848E9F" font-size="16" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="600">· CHROME MV3 SIDE PANEL v1.0.1</text>
  </g>

  <!-- Left Value Proposition -->
  <g transform="translate(84, 174)">
    <rect width="276" height="34" rx="6" fill="#171C26" stroke="#364156" />
    <text x="16" y="22" fill="#E5A93C" font-size="13" font-family="ui-monospace, monospace" font-weight="700">SIDEPANEL + ACTIVETAB ONLY</text>

    <text x="0" y="98" fill="#EEF1F6" font-size="52" font-family="system-ui, -apple-system, sans-serif" font-weight="800">Inspect AI search</text>
    <text x="0" y="160" fill="#E5A93C" font-size="52" font-family="system-ui, -apple-system, sans-serif" font-weight="800">citations on any tab.</text>

    <text x="0" y="220" fill="#B4BCC9" font-size="21" font-family="system-ui, -apple-system, sans-serif">Audit answer-engine citation share, catch silent</text>
    <text x="0" y="252" fill="#B4BCC9" font-size="21" font-family="system-ui, -apple-system, sans-serif">GPTBot WAF 403 blocks, and validate 3-pillar</text>
    <text x="0" y="284" fill="#B4BCC9" font-size="21" font-family="system-ui, -apple-system, sans-serif">JSON-LD, /llms.txt &amp; /agents.md in one click.</text>

    <rect x="0" y="336" width="328" height="58" rx="10" fill="#E5A93C" />
    <text x="164" y="372" text-anchor="middle" fill="#161004" font-size="19" font-family="system-ui, -apple-system, sans-serif" font-weight="700">Scan Active Browser Tab →</text>
  </g>

  <!-- Right Side Panel Mockup -->
  <g transform="translate(760, 88)">
    <rect x="-10" y="-10" width="444" height="644" rx="20" fill="#090B0E" stroke="#262E3D" stroke-width="1.5" />
    <rect width="424" height="624" rx="14" fill="#0E1116" stroke="#262E3D" stroke-width="1.5" />

    <rect x="20" y="20" width="384" height="58" rx="8" fill="#171C26" stroke="#262E3D" />
    <text x="36" y="45" fill="#EEF1F6" font-size="14" font-family="ui-monospace, monospace" font-weight="700">FIG EXT · ACTIVE TAB PROBE</text>
    <text x="36" y="64" fill="#6EE7B7" font-size="12" font-family="ui-monospace, monospace">✓ AUTO-DETECTED STACK · HTTP 200</text>

    <rect x="20" y="96" width="384" height="176" rx="10" fill="#171C26" stroke="#262E3D" />
    <text x="36" y="128" fill="#848E9F" font-size="12" font-family="ui-monospace, monospace" font-weight="700">CITATION SIGNAL</text>
    <text x="36" y="166" fill="#6EE7B7" font-size="34" font-family="ui-monospace, monospace" font-weight="700">78 / 100</text>
    <text x="220" y="128" fill="#848E9F" font-size="12" font-family="ui-monospace, monospace" font-weight="700">FACT ACCURACY</text>
    <text x="220" y="166" fill="#EEF1F6" font-size="34" font-family="ui-monospace, monospace" font-weight="700">100%</text>

    <text x="36" y="206" fill="#848E9F" font-size="11" font-family="ui-monospace, monospace" font-weight="700">VISIBILITY SIGNAL</text>
    <rect x="36" y="216" width="352" height="10" rx="5" fill="#090B0E" />
    <rect x="36" y="216" width="274" height="10" rx="5" fill="#10B981" />

    <text x="36" y="254" fill="#EEF1F6" font-size="12" font-family="ui-monospace, monospace">● WAF 200   ● /llms   ● /agents   ● JSON-LD (3/3)</text>

    <rect x="20" y="290" width="384" height="130" rx="10" fill="#171C26" stroke="#262E3D" />
    <text x="36" y="320" fill="#EEF1F6" font-size="13" font-family="ui-monospace, monospace" font-weight="700">SITE DIAGNOSIS &amp; ACTION PLAN</text>
    <text x="36" y="350" fill="#B4BCC9" font-size="14" font-family="system-ui, sans-serif">1. Enrich boilerplate /agents.md rules</text>
    <text x="36" y="374" fill="#B4BCC9" font-size="14" font-family="system-ui, sans-serif">2. Lock FAQPage + Offer JSON-LD</text>
    <text x="36" y="398" fill="#6EE7B7" font-size="13" font-family="ui-monospace, monospace" font-weight="700">✓ GPTBot &amp; PerplexityBot Allowed</text>

    <rect x="20" y="438" width="384" height="164" rx="10" fill="#090B0E" stroke="#364156" />
    <text x="36" y="472" fill="#E5A93C" font-size="13" font-family="ui-monospace, monospace" font-weight="700">STEP 02 · 1-CLICK REMEDIATION PROMPT</text>
    <text x="36" y="502" fill="#EEF1F6" font-size="15" font-family="system-ui, sans-serif">Copy a stack-tailored remediation prompt</text>
    <text x="36" y="526" fill="#EEF1F6" font-size="15" font-family="system-ui, sans-serif">and verify all 4 checks live over HTTP.</text>
    <rect x="36" y="544" width="352" height="40" rx="7" fill="#E5A93C" />
    <text x="212" y="570" text-anchor="middle" fill="#161004" font-size="14" font-family="system-ui, sans-serif" font-weight="700">✓ Verify 4/4 Live Over HTTP</text>
  </g>
</svg>`;

// 2. CWS Screenshot 2 (1280x800, Obsidian & Warm Brass, Yellow Argon clean)
const cwsHero2Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800">
  <rect width="1280" height="800" fill="#0E1116" />
  <rect x="44" y="44" width="1192" height="712" rx="18" fill="#131720" stroke="#262E3D" stroke-width="2" />

  <g transform="translate(96, 86)">
    <rect width="32" height="32" rx="7" fill="#E5A93C" />
    <g transform="translate(16 16) rotate(45)">
      <rect x="-6" y="-6" width="12" height="12" fill="none" stroke="#161004" stroke-width="2.8" stroke-linejoin="round" />
    </g>
    <text x="46" y="23" fill="#EEF1F6" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="700">verisource</text>
    <text x="166" y="22" fill="#E5A93C" font-size="15" font-family="ui-monospace, monospace" font-weight="700">· STACK AUTO-DETECTION &amp; CLOSED-LOOP HTTP VERIFIER</text>
  </g>

  <text x="96" y="182" fill="#EEF1F6" font-size="48" font-family="system-ui, -apple-system, sans-serif" font-weight="800">Copy 1 fix prompt. Verify 4/4 checks live.</text>
  <text x="96" y="224" fill="#B4BCC9" font-size="21" font-family="system-ui, sans-serif">Auto-detects your site architecture to tailor JSON-LD, /llms.txt &amp; /agents.md fixes.</text>

  <g transform="translate(96, 286)">
    <rect width="330" height="360" rx="14" fill="#171C26" stroke="#262E3D" />
    <text x="28" y="48" fill="#E5A93C" font-size="13" font-family="ui-monospace, monospace" font-weight="700">01 · DETECT &amp; DIAGNOSE</text>
    <text x="28" y="92" fill="#EEF1F6" font-size="24" font-family="system-ui, sans-serif" font-weight="700">Stack + WAF Probe</text>
    <text x="28" y="138" fill="#B4BCC9" font-size="16" font-family="system-ui, sans-serif">• Detects publishing stack</text>
    <text x="28" y="172" fill="#B4BCC9" font-size="16" font-family="system-ui, sans-serif">• Tests GPTBot HTTP 200</text>
    <text x="28" y="206" fill="#B4BCC9" font-size="16" font-family="system-ui, sans-serif">• Audits 3-pillar JSON-LD</text>
    <text x="28" y="240" fill="#B4BCC9" font-size="16" font-family="system-ui, sans-serif">• Checks /llms.txt &amp; /agents.md</text>
  </g>

  <g transform="translate(475, 286)">
    <rect width="330" height="360" rx="14" fill="#171C26" stroke="#E5A93C" stroke-width="1.5" />
    <text x="28" y="48" fill="#E5A93C" font-size="13" font-family="ui-monospace, monospace" font-weight="700">02 · REMEDIATE</text>
    <text x="28" y="92" fill="#EEF1F6" font-size="24" font-family="system-ui, sans-serif" font-weight="700">1-Click Fix Prompt</text>
    <text x="28" y="138" fill="#B4BCC9" font-size="16" font-family="system-ui, sans-serif">• Code repository workflows</text>
    <text x="28" y="172" fill="#B4BCC9" font-size="16" font-family="system-ui, sans-serif">• Storefront theme templates</text>
    <text x="28" y="206" fill="#B4BCC9" font-size="16" font-family="system-ui, sans-serif">• Site header &amp; route hooks</text>
    <text x="28" y="240" fill="#B4BCC9" font-size="16" font-family="system-ui, sans-serif">• Hosted /ai-facts + 301</text>
  </g>

  <g transform="translate(854, 286)">
    <rect width="330" height="360" rx="14" fill="#090B0E" stroke="#10B981" stroke-width="2" />
    <text x="28" y="48" fill="#6EE7B7" font-size="13" font-family="ui-monospace, monospace" font-weight="700">03 · VERIFY LIVE</text>
    <text x="28" y="92" fill="#EEF1F6" font-size="24" font-family="system-ui, sans-serif" font-weight="700">4/4 Live Over HTTP</text>
    <text x="28" y="138" fill="#6EE7B7" font-size="16" font-family="ui-monospace, monospace">✓ JSON-LD @graph LIVE</text>
    <text x="28" y="172" fill="#6EE7B7" font-size="16" font-family="ui-monospace, monospace">✓ /llms.txt HTTP 200</text>
    <text x="28" y="206" fill="#6EE7B7" font-size="16" font-family="ui-monospace, monospace">✓ /agents.md TRUTH</text>
    <text x="28" y="240" fill="#6EE7B7" font-size="16" font-family="ui-monospace, monospace">✓ GPTBot WAF OPEN</text>
  </g>
</svg>`;

// 3. CWS Small Promo Tile (440x280, Obsidian & Warm Brass, Yellow Argon clean)
const cwsPromoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 280" width="440" height="280">
  <rect width="440" height="280" fill="#0E1116" />
  <rect x="14" y="14" width="412" height="252" rx="12" fill="#131720" stroke="#262E3D" stroke-width="1.5" />

  <g transform="translate(30, 32)">
    <rect width="24" height="24" rx="5.5" fill="#E5A93C" />
    <g transform="translate(12 12) rotate(45)">
      <rect x="-4.5" y="-4.5" width="9" height="9" fill="none" stroke="#161004" stroke-width="2.2" stroke-linejoin="round" />
    </g>
    <text x="34" y="17" fill="#EEF1F6" font-size="15" font-family="system-ui, -apple-system, sans-serif" font-weight="700">verisource</text>
    <text x="118" y="17" fill="#E5A93C" font-size="11.5" font-family="ui-monospace, monospace" font-weight="700">· GEO + /MCP</text>
  </g>

  <text x="30" y="96" fill="#EEF1F6" font-size="25" font-family="system-ui, -apple-system, sans-serif" font-weight="800">Inspect Search</text>
  <text x="30" y="128" fill="#E5A93C" font-size="25" font-family="system-ui, -apple-system, sans-serif" font-weight="800">&amp; Citations Live.</text>

  <text x="30" y="162" fill="#B4BCC9" font-size="13" font-family="system-ui, sans-serif">GPTBot WAF · /llms.txt · /agents.md</text>
  <text x="30" y="182" fill="#B4BCC9" font-size="13" font-family="system-ui, sans-serif">3-Pillar JSON-LD · Stack-Tailored Fixes</text>

  <rect x="30" y="206" width="224" height="36" rx="7" fill="#E5A93C" />
  <text x="142" y="229" text-anchor="middle" fill="#161004" font-size="13" font-family="system-ui, sans-serif" font-weight="700">Open Chrome Side Panel →</text>
</svg>`;

// 4. CWS Store Icon (128x128 24-bit RGB on #0E1116)
const cwsIcon128Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" fill="#0E1116" />
  <rect x="14" y="14" width="100" height="100" rx="23" fill="#E5A93C" />
  <g transform="translate(64 64) rotate(45)">
    <rect x="-19" y="-19" width="38" height="38" rx="1.5" fill="none" stroke="#161004" stroke-width="8.5" stroke-linejoin="round" />
  </g>
</svg>`;

// 5. Personal LinkedIn Profile Cover (1584x396 Obsidian & Warm Brass)
const nickPersonalCoverSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1584 396" width="1584" height="396">
  <rect width="1584" height="396" fill="#0E1116" />
  <line x1="0" y1="394" x2="1584" y2="394" stroke="#262E3D" stroke-width="2" />

  <!-- Right-aligned safe zone (leaves left avatar clear on desktop & mobile LinkedIn profile) -->
  <g transform="translate(520, 84)">
    <rect width="38" height="38" rx="9" fill="#E5A93C" />
    <g transform="translate(19 19) rotate(45)">
      <rect x="-7" y="-7" width="14" height="14" fill="none" stroke="#161004" stroke-width="3.2" stroke-linejoin="round" />
    </g>
    <text x="52" y="28" fill="#EEF1F6" font-size="28" font-family="system-ui, -apple-system, sans-serif" font-weight="700" letter-spacing="-0.025em">verisource</text>
    <text x="206" y="27" fill="#E5A93C" font-size="16" font-family="ui-monospace, monospace" font-weight="700">· verisource.dev</text>

    <text x="0" y="96" fill="#EEF1F6" font-size="40" font-family="system-ui, -apple-system, sans-serif" font-weight="800" letter-spacing="-0.025em">AI answers buyers about your brand.</text>
    <text x="0" y="146" fill="#E5A93C" font-size="40" font-family="system-ui, -apple-system, sans-serif" font-weight="800" letter-spacing="-0.025em">Verisource checks—and ships the fix.</text>

    <text x="0" y="198" fill="#B4BCC9" font-size="18" font-family="ui-monospace, monospace">GPTBot WAF · 3-Pillar JSON-LD · /llms.txt · /agents.md · npx @verisource/cli · /mcp</text>
  </g>
</svg>`;

fs.mkdirSync(DRIVE_CWS_DIR, { recursive: true });
fs.mkdirSync(DRIVE_BRAND_DIR, { recursive: true });

fs.writeFileSync(path.join(DRIVE_CWS_DIR, 'verisource-cws-marquee-1-hero-1280x800.svg'), cwsHero1Svg, 'utf8');
fs.writeFileSync(path.join(DRIVE_CWS_DIR, 'verisource-cws-marquee-2-fixes-1280x800.svg'), cwsHero2Svg, 'utf8');
fs.writeFileSync(path.join(DRIVE_CWS_DIR, 'verisource-cws-small-promo-440x280.svg'), cwsPromoSvg, 'utf8');

renderSvgToRgb24Png(cwsHero1Svg, 1280, 800, path.join(DRIVE_CWS_DIR, 'verisource-cws-screenshot-1-hero-1280x800.png'));
renderSvgToRgb24Png(cwsHero2Svg, 1280, 800, path.join(DRIVE_CWS_DIR, 'verisource-cws-screenshot-2-fixes-1280x800.png'));
renderSvgToRgb24Png(cwsPromoSvg, 440, 280, path.join(DRIVE_CWS_DIR, 'verisource-cws-small-promo-440x280.png'));
renderSvgToRgb24Png(cwsIcon128Svg, 128, 128, path.join(DRIVE_CWS_DIR, 'verisource-cws-store-icon-128x128.png'));
renderSvgToRgb24Png(nickPersonalCoverSvg, 1584, 396, path.join(DRIVE_CWS_DIR, 'nick-linkedin-cover-obsidian-1584x396.png'));
renderSvgToRgb24Png(nickPersonalCoverSvg, 1584, 396, path.join(DRIVE_BRAND_DIR, 'nick-linkedin-cover-obsidian-1584x396.png'));

// Also sync legacy 300x300 logo filenames in chrome-store-assets so zero old logos remain
const logo400 = fs.readFileSync(path.join(DRIVE_BRAND_DIR, 'verisource-linkedin-logo-obsidian-400x400.png'));
fs.writeFileSync(path.join(DRIVE_CWS_DIR, 'verisource-linkedin-logo-300x300.png'), logo400);
fs.writeFileSync(path.join(DRIVE_CWS_DIR, 'verisource-site-logo-300x300.png'), logo400);

console.log('✓ Rendered all 24-bit RGB CWS screenshots, store icon, and personal LinkedIn cover');
