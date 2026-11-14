import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const outDir = path.join(repoRoot, 'store-assets');
fs.mkdirSync(outDir, { recursive: true });

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const chromeBin = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!chromeBin) {
  throw new Error('Chrome or Edge binary not found for headless asset capture.');
}

// CRC32 table for valid PNG chunk encoding
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
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

function decodePngToRgb(pngBuf, bgR = 248, bgG = 250, bgB = 252) {
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

  assert.equal(bitDepth, 8, 'Expected 8-bit PNG output from headless Chromium');
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  assert.ok(bpp === 3 || bpp === 4, `Unsupported PNG colorType: ${colorType}`);

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
  // Exact top-left crop/pad to target (width x height) in 24-bit RGB (colorType = 2, no alpha)
  const rawScanlines = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    rawScanlines[rowOffset] = 0; // Filter type 0 (None)
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
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 2; // colorType 2 = 24-bit Truecolor RGB (NO ALPHA)
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderHtmlToRgb24Png({ filename, width, height, html }) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vs-cws-'));
  const htmlPath = path.join(tmpDir, 'scene.html');
  const rawPngPath = path.join(tmpDir, 'raw.png');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  // Request slightly taller window so Windows headless frame never clips bottom row, then exact-crop to WxH
  execFileSync(
    chromeBin,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${width},${height + 120}`,
      `--screenshot=${rawPngPath}`,
      fileUrl,
    ],
    { stdio: 'pipe' }
  );

  const rawBuf = fs.readFileSync(rawPngPath);
  const decoded = decodePngToRgb(rawBuf);
  const rgb24Buf = encodeRgb24Png(
    width,
    height,
    decoded.rgb,
    decoded.width,
    decoded.height
  );

  const dest = path.join(outDir, filename);
  fs.writeFileSync(dest, rgb24Buf);
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Verify PNG header matches Chrome Web Store strict spec
  const verifyW = rgb24Buf.readUInt32BE(16);
  const verifyH = rgb24Buf.readUInt32BE(20);
  const verifyColorType = rgb24Buf[25];
  assert.equal(verifyW, width);
  assert.equal(verifyH, height);
  assert.equal(verifyColorType, 2);
  console.log(
    `✔ Generated ${filename} (${verifyW}x${verifyH}, 24-bit RGB no-alpha, ${(
      rgb24Buf.length / 1024
    ).toFixed(1)} kB)`
  );
}

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
    background: #F8FAFC;
    color: #0F172A;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }
  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    border: 1px solid #CBD5E1;
    background: #F1F5F9;
    color: #334155;
  }
  .badge-pass { background: #ECFDF5; border-color: #A7F3D0; color: #065F46; }
  .badge-crit { background: #FEF2F2; border-color: #FECACA; color: #991B1B; }
  .badge-warn { background: #FFFBEB; border-color: #FDE68A; color: #92400E; }
  .card {
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
  }
`;

function buildBrowserSplitScene({
  activeUrl,
  storeTitle,
  storeTagline,
  activeTabIndex,
  sidepanelBodyHtml,
}) {
  const tabs = [
    '1. Visibility & ROI',
    '2. >=9.5 Fixes',
    '3. Citations & MCP',
  ];
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>${BASE_CSS}</style></head>
<body>
  <div style="width:1280px;height:800px;display:flex;flex-direction:column;background:#E2E8F0;">
    <!-- Browser Chrome Top Bar -->
    <div style="height:48px;background:#0F172A;color:#F8FAFC;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid #1E293B;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="display:flex;gap:6px;">
          <span style="width:10px;height:10px;border-radius:50%;background:#475569;"></span>
          <span style="width:10px;height:10px;border-radius:50%;background:#475569;"></span>
          <span style="width:10px;height:10px;border-radius:50%;background:#475569;"></span>
        </div>
        <div class="mono" style="background:#1E293B;border:1px solid #334155;border-radius:5px;padding:5px 14px;font-size:12px;color:#E2E8F0;width:540px;">
          https://${activeUrl}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="mono" style="font-size:11px;color:#94A3B8;">Manifest V3 · sidePanel + activeTab only</span>
        <div style="background:#FFFFFF;color:#0F172A;font-weight:700;font-size:12px;padding:4px 10px;border-radius:4px;display:flex;align-items:center;gap:6px;">
          <span style="background:#0F172A;color:#FFF;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;border-radius:3px;font-size:10px;">V</span>
          Verisource Side Panel
        </div>
      </div>
    </div>

    <!-- Split Workspace: Storefront (780px) + Verisource MV3 Side Panel (500px) -->
    <div style="flex:1;display:flex;overflow:hidden;">
      <!-- Left: Inspected Storefront -->
      <div style="width:780px;background:#F8FAFC;padding:40px 44px;border-right:1px solid #CBD5E1;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div class="mono" style="font-size:11.5px;color:#64748B;letter-spacing:0.06em;margin-bottom:12px;">
            ACTIVE TAB UNDER INSPECTION · LIVE HTTP + MULTI-ENGINE RETRIEVAL AUDIT
          </div>
          <h1 style="font-size:34px;letter-spacing:-0.03em;line-height:1.15;margin-bottom:12px;">
            ${storeTitle}
          </h1>
          <p style="font-size:16px;color:#475569;line-height:1.5;max-width:620px;margin-bottom:28px;">
            ${storeTagline}
          </p>

          <div class="card" style="padding:20px 22px;margin-bottom:20px;">
            <div class="mono" style="font-size:11px;color:#64748B;margin-bottom:10px;font-weight:700;">
              DETECTED STOREFRONT PROTOCOL ENDPOINTS
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
              <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px solid #F1F5F9;">
                <span class="mono">GET /robots.txt</span>
                <span class="badge badge-pass">200 OK · GPTBot &amp; OAI-SearchBot Parsed</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px solid #F1F5F9;">
                <span class="mono">GET /llms.txt</span>
                <span class="badge badge-warn">404 MISSING · Auto-Draft Ready in Tab 2</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px solid #F1F5F9;">
                <span class="mono">GET /agents.md</span>
                <span class="badge badge-warn">DEFAULT BOILERPLATE · Liquid Override Ready</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="mono">POST /api/ucp/mcp</span>
                <span class="badge badge-pass">SHOPIFY UCP ENDPOINT DETECTED</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="padding:16px 20px;background:#0F172A;color:#F8FAFC;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:13.5px;font-weight:700;">Zero Cross-Site Tracking · Strict MV3 Least-Privilege</div>
            <div style="font-size:12px;color:#94A3B8;margin-top:2px;">Audits run only when you click Scan Active Tab. Zero &lt;all_urls&gt; permissions.</div>
          </div>
          <span class="mono" style="font-size:12px;color:#E2E8F0;border:1px solid #334155;padding:5px 10px;border-radius:4px;">verisource.dev</span>
        </div>
      </div>

      <!-- Right: Verisource Chrome Extension Side Panel (500px) -->
      <div style="width:500px;background:#FFFFFF;display:flex;flex-direction:column;">
        <!-- Extension Header -->
        <div style="padding:14px 18px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:10px;height:10px;background:#0F172A;border-radius:2px;display:inline-block;"></span>
            <strong style="font-size:13.5px;letter-spacing:-0.01em;">VERISOURCE SIDE PANEL</strong>
          </div>
          <span class="badge mono">${activeUrl}</span>
        </div>

        <!-- Strict 3-Tab Bar -->
        <div style="display:flex;border-bottom:1px solid #E2E8F0;background:#F8FAFC;padding:0 12px;">
          ${tabs
            .map(
              (label, idx) => `
            <div style="padding:10px 12px;font-size:12px;font-weight:${
              idx === activeTabIndex ? '700' : '500'
            };color:${
              idx === activeTabIndex ? '#0F172A' : '#64748B'
            };border-bottom:${
              idx === activeTabIndex ? '2px solid #0F172A' : '2px solid transparent'
            };">
              ${label}
            </div>`
            )
            .join('')}
        </div>

        <!-- Tab Content -->
        <div style="padding:16px 18px;display:flex;flex-direction:column;gap:14px;flex:1;background:#FFFFFF;">
          ${sidepanelBodyHtml}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// 1. Copy 128x128 store icon as 24-bit RGB PNG
const rawIcon = fs.readFileSync(
  path.join(repoRoot, 'apps', 'extension', 'public', 'icon', '128.png')
);
const decodedIcon = decodePngToRgb(rawIcon, 15, 23, 42);
const icon24 = encodeRgb24Png(
  128,
  128,
  decodedIcon.rgb,
  decodedIcon.width,
  decodedIcon.height
);
fs.writeFileSync(path.join(outDir, 'store-icon-128x128.png'), icon24);
console.log('✔ Generated store-icon-128x128.png (128x128, 24-bit RGB no-alpha)');

// 2. Screenshot 1 (1280x800): Tab 1 — Visibility, Hallucinations & Bot WAF
renderHtmlToRgb24Png({
  filename: 'screenshot-1-visibility-watchdog-1280x800.png',
  width: 1280,
  height: 800,
  html: buildBrowserSplitScene({
    activeUrl: 'aurearoasters.com',
    storeTitle: 'Aurea Coffee Roasters — Single-Origin Specialty Whole Bean',
    storeTagline:
      'Small-batch specialty coffee roasted to order in 12oz bags ($22–$28 USD) with free US shipping over $50.',
    activeTabIndex: 0,
    sidepanelBodyHtml: `
      <div class="card" style="display:flex;">
        <div style="flex:1;padding:12px 14px;border-right:1px solid #E2E8F0;">
          <div class="mono" style="font-size:10.5px;color:#64748B;font-weight:700;">AI VISIBILITY SCORE</div>
          <div class="mono" style="font-size:26px;font-weight:700;color:#92400E;margin-top:4px;">38 <span style="font-size:13px;color:#64748B;">/ 100</span></div>
          <div style="font-size:11px;color:#64748B;margin-top:2px;">ChatGPT · Gemini · Perplexity</div>
        </div>
        <div style="flex:1;padding:12px 14px;">
          <div class="mono" style="font-size:10.5px;color:#64748B;font-weight:700;">TRUTH ACCURACY</div>
          <div class="mono" style="font-size:26px;font-weight:700;color:#991B1B;margin-top:4px;">67%</div>
          <div style="font-size:11px;color:#991B1B;margin-top:2px;">2 claim conflicts detected</div>
        </div>
      </div>

      <div class="card" style="padding:12px 14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="font-size:12px;">AI Crawler &amp; WAF Access</strong>
          <span class="badge badge-pass">4 / 4 ALLOWED</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <span class="badge badge-pass mono">GPTBot: 200</span>
          <span class="badge badge-pass mono">OAI-SearchBot: 200</span>
          <span class="badge badge-pass mono">PerplexityBot: 200</span>
          <span class="badge badge-pass mono">ClaudeBot: 200</span>
        </div>
      </div>

      <div class="card" style="padding:12px 14px;background:#FEF2F2;border-color:#FECACA;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="font-size:12px;color:#991B1B;">HALLUCINATION WATCHDOG ALERT</strong>
          <span class="badge badge-crit">HIGH SEVERITY</span>
        </div>
        <div style="font-size:12px;color:#7F1D1D;line-height:1.45;margin-bottom:8px;">
          <strong>ChatGPT Claim:</strong> &ldquo;Aurea Coffee Roasters sells 24-count single-serve Keurig K-Cup pods for $16.99.&rdquo;
        </div>
        <div style="font-size:12px;color:#0F172A;background:#FFFFFF;padding:8px 10px;border-radius:4px;border:1px solid #FECACA;">
          <strong>Verified Storefront Truth:</strong> Whole-bean &amp; precision ground 12oz bags only ($22–$28). Never sold K-Cup pods.
        </div>
      </div>

      <div class="card" style="padding:12px 14px;">
        <div class="mono" style="font-size:11px;color:#64748B;margin-bottom:4px;font-weight:700;">10-LINE AI ATTRIBUTION PIXEL</div>
        <div class="mono" style="font-size:11px;background:#0F172A;color:#E2E8F0;padding:10px;border-radius:4px;line-height:1.45;">
          &lt;script src="https://verisource.dev/pixel.js"<br/>
          &nbsp;&nbsp;data-token="vs_px_aurea_01"&gt;&lt;/script&gt;
        </div>
      </div>
    `,
  }),
});

// 3. Screenshot 2 (1280x800): Tab 2 — >=9.5/10 On-Site Fixes & Shopify /api/ucp/mcp Adapter
renderHtmlToRgb24Png({
  filename: 'screenshot-2-fixes-shopify-ucp-1280x800.png',
  width: 1280,
  height: 800,
  html: buildBrowserSplitScene({
    activeUrl: 'aurearoasters.com',
    storeTitle: 'Drop-In JSON-LD, /llms.txt & Shopify Liquid Overrides',
    storeTagline:
      'Every generated customer artifact passes a 5-pillar >= 9.5/10 adversarial critic with zero AI cliches and 100% syntax validation.',
    activeTabIndex: 1,
    sidepanelBodyHtml: `
      <div class="card" style="padding:12px 14px;background:#F8FAFC;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="font-size:12px;">Shopify Storefront Adapter</strong>
          <span class="badge badge-pass mono">/api/ucp/mcp ACTIVE</span>
        </div>
        <div style="font-size:11.5px;color:#475569;line-height:1.45;">
          Save Liquid template as <span class="mono">templates/agents.md.liquid</span> and paste validated <span class="mono">JSON-LD</span> before <span class="mono">&lt;/head&gt;</span>.
        </div>
      </div>

      <div class="card" style="overflow:hidden;">
        <div style="padding:10px 12px;border-bottom:1px solid #E2E8F0;background:#F8FAFC;display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:12px;">templates/agents.md.liquid</strong>
          <span class="badge badge-pass mono">QUALITY: 9.9 / 10.0</span>
        </div>
        <pre class="mono" style="padding:12px;font-size:11px;background:#0F172A;color:#F8FAFC;line-height:1.5;overflow:hidden;"># {{ shop.name }} — Verified Agent Specification
Canonical-Origin: {{ shop.url }}
Catalog-MCP-Endpoint: {{ shop.url }}/api/ucp/mcp

## Verified Commercial Facts
- Core Offering: Single-origin whole-bean specialty coffee
- Price Range: $22.00–$28.00 USD per 12oz bag
- Shipping Policy: Free US ground shipping on orders >= $50
- Discontinued / Excluded SKUs: Does NOT sell K-Cup pods</pre>
      </div>

      <div class="card" style="overflow:hidden;">
        <div style="padding:10px 12px;border-bottom:1px solid #E2E8F0;background:#F8FAFC;display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:12px;">Organization + Product JSON-LD</strong>
          <span class="badge badge-pass mono">QUALITY: 9.8 / 10.0</span>
        </div>
        <pre class="mono" style="padding:12px;font-size:11px;background:#0F172A;color:#F8FAFC;line-height:1.45;overflow:hidden;">{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Aurea Coffee Roasters",
  "url": "https://aurearoasters.com"
}</pre>
      </div>
    `,
  }),
});

// 4. Screenshot 3 (1280x800): Tab 3 — Query Fanout Citations, 60s Pitch Link & /mcp Hub
renderHtmlToRgb24Png({
  filename: 'screenshot-3-fanout-mcp-hub-1280x800.png',
  width: 1280,
  height: 800,
  html: buildBrowserSplitScene({
    activeUrl: 'mosaicroasters.com',
    storeTitle: 'Query Fanout Citations, 60s Agency Pitch Links & Paid /mcp',
    storeTagline:
      'Decompile commercial buyer prompts across ChatGPT, Gemini, and Perplexity, mint white-label /audit/[slug] reports, and connect IDE agents.',
    activeTabIndex: 2,
    sidepanelBodyHtml: `
      <div class="card" style="padding:12px 14px;">
        <div class="mono" style="font-size:10.5px;color:#64748B;font-weight:700;margin-bottom:6px;">
          DECOMPILED ENGINE FANOUT SUB-QUERIES
        </div>
        <div style="font-size:12px;font-weight:700;margin-bottom:6px;">
          &ldquo;best specialty coffee roaster springfield mo wholesale&rdquo;
        </div>
        <div class="mono" style="font-size:11px;color:#334155;display:flex;flex-direction:column;gap:4px;">
          <div>→ springfield missouri specialty coffee wholesale beans</div>
          <div>→ local cafe espresso supplier 5lb bags ozarks</div>
        </div>
      </div>

      <div class="card" style="padding:12px 14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="font-size:12px;">60s White-Label Prospect Pitch URL</strong>
          <span class="badge badge-pass">LIVE SLUG</span>
        </div>
        <div class="mono" style="font-size:11.5px;padding:8px 10px;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:4px;">
          https://verisource.dev/audit/mosaic-springfield-audit
        </div>
      </div>

      <div class="card" style="overflow:hidden;">
        <div style="padding:10px 12px;border-bottom:1px solid #E2E8F0;background:#F8FAFC;display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:12px;">Streamable HTTP /mcp Config</strong>
          <span class="badge mono">NO DEPRECATED /SSE</span>
        </div>
        <pre class="mono" style="padding:12px;font-size:11px;background:#0F172A;color:#F8FAFC;line-height:1.5;">{
  "mcpServers": {
    "verisource": {
      "url": "https://mcp.verisource.dev/mcp",
      "headers": {
        "Authorization": "Bearer vs_live_9f4a8c••••"
      }
    }
  }
}</pre>
      </div>
    `,
  }),
});

// 5. Small Promo Tile (440x280, 24-bit RGB)
renderHtmlToRgb24Png({
  filename: 'promo-tile-small-440x280.png',
  width: 440,
  height: 280,
  html: `<!doctype html>
<html>
<head><meta charset="utf-8"><style>${BASE_CSS}</style></head>
<body>
  <div style="width:440px;height:280px;background:#0F172A;color:#FFFFFF;padding:26px 28px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid #1E293B;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:9px;">
        <span style="width:22px;height:22px;background:#FFFFFF;color:#0F172A;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;">V</span>
        <strong style="font-size:14px;letter-spacing:0.02em;">VERISOURCE</strong>
      </div>
      <span class="mono" style="font-size:10.5px;color:#CBD5E1;border:1px solid #334155;padding:3px 7px;border-radius:4px;">MV3 SIDE PANEL</span>
    </div>

    <div>
      <div style="font-size:23px;font-weight:700;line-height:1.2;letter-spacing:-0.02em;margin-bottom:8px;">
        GEO &amp; AI Citation Inspector
      </div>
      <div style="font-size:12.5px;color:#94A3B8;line-height:1.45;">
        Audit ChatGPT, Gemini &amp; Perplexity citations, catch pricing hallucinations, and export &gt;=9.5/10 JSON-LD &amp; /agents.md fixes.
      </div>
    </div>

    <div class="mono" style="display:flex;gap:8px;font-size:10.5px;">
      <span style="background:#1E293B;border:1px solid #334155;padding:4px 8px;border-radius:4px;color:#A7F3D0;">JSON-LD</span>
      <span style="background:#1E293B;border:1px solid #334155;padding:4px 8px;border-radius:4px;color:#E2E8F0;">/agents.md</span>
      <span style="background:#1E293B;border:1px solid #334155;padding:4px 8px;border-radius:4px;color:#E2E8F0;">/api/ucp/mcp</span>
    </div>
  </div>
</body>
</html>`,
});

// 6. Marquee Promo Tile (1400x560, 24-bit RGB)
renderHtmlToRgb24Png({
  filename: 'promo-tile-marquee-1400x560.png',
  width: 1400,
  height: 560,
  html: `<!doctype html>
<html>
<head><meta charset="utf-8"><style>${BASE_CSS}</style></head>
<body>
  <div style="width:1400px;height:560px;background:#0F172A;color:#FFFFFF;padding:56px 72px;display:flex;align-items:center;justify-content:space-between;gap:56px;">
    <div style="width:680px;display:flex;flex-direction:column;gap:22px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="width:30px;height:30px;background:#FFFFFF;color:#0F172A;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;">V</span>
        <span style="font-size:19px;font-weight:700;letter-spacing:0.03em;">VERISOURCE</span>
        <span class="mono" style="font-size:13px;color:#94A3B8;border:1px solid #334155;padding:4px 10px;border-radius:4px;">mcp.verisource.dev/mcp</span>
      </div>
      <h1 style="font-size:48px;line-height:1.12;letter-spacing:-0.03em;">
        Inspect AI Citations, Hallucinations &amp; /agents.md in One Click.
      </h1>
      <p style="font-size:19px;color:#CBD5E1;line-height:1.5;">
        Native Chrome Side Panel for B2B SaaS, Shopify merchants, and GEO agencies. Probe GPTBot &amp; PerplexityBot WAF rules and export verified schema fixes.
      </p>
      <div class="mono" style="display:flex;gap:12px;font-size:13px;">
        <span style="background:#1E293B;border:1px solid #334155;padding:7px 14px;border-radius:5px;color:#A7F3D0;">&gt;= 9.5/10 Fix Critic</span>
        <span style="background:#1E293B;border:1px solid #334155;padding:7px 14px;border-radius:5px;">Shopify /api/ucp/mcp</span>
        <span style="background:#1E293B;border:1px solid #334155;padding:7px 14px;border-radius:5px;">60s Agency Pitch Links</span>
      </div>
    </div>

    <div style="width:520px;background:#FFFFFF;color:#0F172A;border-radius:8px;border:1px solid #334155;padding:24px;display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #E2E8F0;">
        <strong style="font-size:15px;">Live Storefront Readiness Ledger</strong>
        <span class="badge badge-pass mono">3-TAB CONSOLE</span>
      </div>
      <div style="display:flex;gap:14px;">
        <div style="flex:1;padding:14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;">
          <div class="mono" style="font-size:11px;color:#64748B;font-weight:700;">VISIBILITY</div>
          <div class="mono" style="font-size:30px;font-weight:700;color:#065F46;margin-top:4px;">84/100</div>
        </div>
        <div style="flex:1;padding:14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;">
          <div class="mono" style="font-size:11px;color:#64748B;font-weight:700;">ACCURACY</div>
          <div class="mono" style="font-size:30px;font-weight:700;color:#065F46;margin-top:4px;">100%</div>
        </div>
      </div>
      <pre class="mono" style="padding:14px;background:#0F172A;color:#F8FAFC;border-radius:6px;font-size:12px;line-height:1.5;">GPTBot:        200 ALLOWED
OAI-SearchBot: 200 ALLOWED
PerplexityBot: 200 ALLOWED
/llms.txt:     PRESENT (9.9/10)
/agents.md:    CUSTOM_ENRICHED</pre>
    </div>
  </div>
</body>
</html>`,
});
