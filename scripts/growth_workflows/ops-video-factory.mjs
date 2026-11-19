import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { enforceQualityGate95 } from '../../packages/core-geo/dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = path.resolve(__dirname, '../..');
const DRIVE_OPS_ROOT = 'g:\\My Drive\\GEO MCP Engine';
const ACTIVE_OPS_DIR = fs.existsSync(path.join(DRIVE_OPS_ROOT, 'growth_ops'))
  ? path.join(DRIVE_OPS_ROOT, 'growth_ops')
  : path.join(MONOREPO_ROOT, 'growth_ops');
const MIRROR_OPS_DIR = path.join(MONOREPO_ROOT, 'growth_ops');

const envLocalPath = path.join(MONOREPO_ROOT, 'apps/web/.env.local');
if (fs.existsSync(envLocalPath)) {
  for (const rawLine of fs.readFileSync(envLocalPath, 'utf8').split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

function getArgValue(args, flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : fallback;
}

function mirrorFileIfNeeded(relPath, content) {
  const primaryPath = path.join(ACTIVE_OPS_DIR, relPath);
  fs.mkdirSync(path.dirname(primaryPath), { recursive: true });
  fs.writeFileSync(primaryPath, content, 'utf8');
  if (path.resolve(ACTIVE_OPS_DIR) !== path.resolve(MIRROR_OPS_DIR)) {
    const mirrorPath = path.join(MIRROR_OPS_DIR, relPath);
    fs.mkdirSync(path.dirname(mirrorPath), { recursive: true });
    fs.writeFileSync(mirrorPath, content, 'utf8');
  }
}

function copyBinaryToMirror(primaryAbsPath, relPath) {
  if (path.resolve(ACTIVE_OPS_DIR) !== path.resolve(MIRROR_OPS_DIR)) {
    const mirrorAbsPath = path.join(MIRROR_OPS_DIR, relPath);
    fs.mkdirSync(path.dirname(mirrorAbsPath), { recursive: true });
    fs.copyFileSync(primaryAbsPath, mirrorAbsPath);
  }
}

function escapeHtml(raw) {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function findChromeBinary() {
  const candidates = [
    process.env.CHROME_BIN,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ].filter(Boolean);

  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function findFfmpegBinary() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {
    return null;
  }
}

function loadVideoLedger() {
  const ledgerPath = path.join(ACTIVE_OPS_DIR, 'ledger/video_published_ledger.json');
  if (!fs.existsSync(ledgerPath)) {
    return { updatedAt: null, renderedDomains: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    return {
      updatedAt: parsed.updatedAt ?? null,
      renderedDomains: parsed.renderedDomains ?? {},
    };
  } catch {
    return { updatedAt: null, renderedDomains: {} };
  }
}

function buildSlideHtml({ stepTag, headline, subline, cards, footerUrl, accentColor }) {
  const cardBlocks = cards
    .map(
      (c) => `
      <div style="background:#141923;border:1px solid ${c.border || '#263042'};border-radius:20px;padding:34px 36px;margin-bottom:24px;">
        <div style="font-family:'JetBrains Mono',Consolas,monospace;font-size:24px;letter-spacing:0.12em;text-transform:uppercase;color:${c.labelColor || '#94A3B8'};margin-bottom:12px;">${escapeHtml(c.label)}</div>
        <div style="font-size:44px;font-weight:800;line-height:1.18;color:${c.valueColor || '#F8FAFC'};">${escapeHtml(c.value)}</div>
        ${c.detail ? `<div style="font-size:28px;line-height:1.38;color:#CBD5E1;margin-top:12px;">${escapeHtml(c.detail)}</div>` : ''}
      </div>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1920px;
    overflow: hidden;
    background: #0A0E17;
    color: #FAF9F6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 96px 76px 88px;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 54px 54px;
  }
</style>
</head>
<body>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1E293B;padding-bottom:32px;margin-bottom:58px;">
      <div style="display:flex;align-items:center;gap:18px;">
        <div style="width:52px;height:52px;border-radius:12px;background:#FAF9F6;color:#0A0E17;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:32px;">V</div>
        <div style="font-family:'JetBrains Mono',Consolas,monospace;font-size:26px;font-weight:700;letter-spacing:0.14em;color:#E2E8F0;">VERISOURCE</div>
      </div>
      <div style="font-family:'JetBrains Mono',Consolas,monospace;font-size:22px;font-weight:700;padding:12px 22px;border-radius:999px;border:1px solid ${accentColor};color:${accentColor};letter-spacing:0.08em;">${escapeHtml(stepTag)}</div>
    </div>

    <h1 style="font-size:74px;font-weight:900;line-height:1.08;letter-spacing:-0.025em;color:#FAF9F6;margin-bottom:28px;">${escapeHtml(headline)}</h1>
    <p style="font-size:34px;line-height:1.4;color:#CBD5E1;margin-bottom:54px;">${escapeHtml(subline)}</p>

    <div>${cardBlocks}</div>
  </div>

  <div style="border-top:1px solid #1E293B;padding-top:34px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-family:'JetBrains Mono',Consolas,monospace;font-size:28px;font-weight:700;color:#D97706;">${escapeHtml(footerUrl)}</div>
    <div style="font-family:'JetBrains Mono',Consolas,monospace;font-size:22px;color:#94A3B8;">LIVE HTTPS AUDIT</div>
  </div>
</body>
</html>`;
}

function renderHtmlToPng(chromeBin, htmlContent, outPngPath) {
  const tmpHtml = path.join(
    os.tmpdir(),
    `vs-short-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.html`
  );
  try {
    fs.writeFileSync(tmpHtml, htmlContent, 'utf8');
    execFileSync(chromeBin, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--window-size=1080,1920',
      `--screenshot=${outPngPath}`,
      `file:///${tmpHtml.replace(/\\/g, '/')}`,
    ]);
    return fs.existsSync(outPngPath);
  } finally {
    try {
      if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
    } catch {
      // Ignore cleanup errors
    }
  }
}

function buildShortsPackage(report) {
  const botsOk =
    report.robotsAiBotStatus?.GPTBot &&
    report.robotsAiBotStatus?.PerplexityBot &&
    !report.robotsAiBotStatus?.waf_blocked;
  const botText = botsOk
    ? 'GPTBot + PerplexityBot: HTTP 200 ALLOWED'
    : 'AI Crawlers: EDGE WAF / ROBOTS RESTRICTED';
  const pillars = Number(report.jsonLdPillarsPassed ?? 0);

  const scriptRaw = [
    `We ran a live HTTPS AI-search audit on ${report.domain}—and it scored ${report.readinessScore} out of 100.`,
    `Here is what ChatGPT, Gemini, and Perplexity actually see when they crawl ${report.brandName}.`,
    `${botText}. /llms.txt is ${report.llmsTxtStatus}. /agents.md is ${report.agentsMdStatus}. And ${pillars} of 3 JSON-LD pillars (Entity, FAQPage, Offer pricing) passed.`,
    `Top fix needed: ${report.topGapSummary}.`,
    `Most brands think SEO alone covers AI search. Without verified JSON-LD and /agents.md, answer engines guess your pricing from third-party sites.`,
    `Check your own site free in 60 seconds at verisource.dev.`,
  ].join(' ');

  const scriptGate = enforceQualityGate95(scriptRaw);

  const titleGate = enforceQualityGate95(
    `${report.brandName} Scored ${report.readinessScore}/100 on Live GPTBot, JSON-LD & /agents.md AI Search Audit #shorts`
  );

  const descGate = enforceQualityGate95(
    [
      `Live read-only HTTPS audit of ${report.domain} (${report.brandName}) across ChatGPT Search, Google Gemini, and Perplexity readiness criteria.`,
      '',
      `Measured Protocol Scorecard (${report.readinessScore}/100):`,
      `- Platform: ${report.detectedPlatformLabel}`,
      `- AI Crawler Access: ${botsOk ? 'GPTBot + PerplexityBot HTTP 200 Allowed' : 'Edge WAF / robots.txt Restricted'}`,
      `- /llms.txt: ${report.llmsTxtStatus}`,
      `- /agents.md: ${report.agentsMdStatus}`,
      `- 3-Pillar JSON-LD: ${pillars}/3 active`,
      `- Top Gap: ${report.topGapSummary}`,
      '',
      `Full public scorecard: https://verisource.dev/report/${report.domain}`,
      `Free 60-second scan for your domain: https://verisource.dev/#scan`,
      `510-domain empirical AI Search Benchmark: https://verisource.dev/benchmarks/ai-search-readiness-2026`,
    ].join('\n')
  );

  const srt = [
    '1',
    '00:00:00,000 --> 00:00:06,500',
    `${report.brandName} scored ${report.readinessScore}/100 in our live AI search audit.`,
    '',
    '2',
    '00:00:06,500 --> 00:00:15,500',
    `${botText}. /llms.txt: ${report.llmsTxtStatus}. /agents.md: ${report.agentsMdStatus}.`,
    '',
    '3',
    '00:00:15,500 --> 00:00:24,500',
    `Only ${pillars}/3 JSON-LD pillars active. Top fix: ${report.topGapSummary}.`,
    '',
    '4',
    '00:00:24,500 --> 00:00:32,000',
    `Run a free 60-second audit on your domain at verisource.dev.`,
    '',
  ].join('\n');

  const slides = [
    {
      stepTag: '01 · LIVE SCORE',
      headline: `${report.brandName} AI Search Audit`,
      subline: `Measured live over HTTPS across ChatGPT, Gemini & Perplexity protocol checks.`,
      accentColor: '#EF4444',
      footerUrl: `verisource.dev/report/${report.domain}`,
      cards: [
        {
          label: 'AI READINESS SCORE',
          value: `${report.readinessScore} / 100`,
          valueColor: report.readinessScore < 50 ? '#F87171' : '#FBBF24',
          border: '#7F1D1D',
          detail: `Detected stack: ${report.detectedPlatformLabel} · ${Number(report.visibleWordCount ?? 0).toLocaleString('en-US')} SSR words`,
        },
        {
          label: 'PRIMARY CITATION BLOCKER',
          value: report.topGapSummary,
          valueColor: '#FAF9F6',
          border: '#334155',
        },
      ],
    },
    {
      stepTag: '02 · PROTOCOL CHECK',
      headline: `What AI Bots Actually Receive`,
      subline: `Direct HTTP probe of ${report.domain} without relying on guesswork.`,
      accentColor: '#D97706',
      footerUrl: `verisource.dev/tools`,
      cards: [
        {
          label: 'GPTBOT & PERPLEXITYBOT ACCESS',
          value: botsOk ? 'HTTP 200 ALLOWED' : 'WAF / ROBOTS BLOCKED',
          valueColor: botsOk ? '#34D399' : '#F87171',
          border: botsOk ? '#065F46' : '#7F1D1D',
        },
        {
          label: '/LLMS.TXT & /AGENTS.MD',
          value: `${report.llmsTxtStatus.toUpperCase()} · ${report.agentsMdStatus.toUpperCase()}`,
          valueColor: '#FBBF24',
          border: '#78350F',
        },
        {
          label: '3-PILLAR SCHEMA.ORG JSON-LD',
          value: `${pillars} / 3 PILLARS ACTIVE`,
          valueColor: pillars === 3 ? '#34D399' : '#F87171',
          detail: 'Entity Identity · FAQPage Q&A · Offer Pricing',
        },
      ],
    },
    {
      stepTag: '03 · WHY IT MATTERS',
      headline: `Why AI Engines Guess Pricing`,
      subline: `Without verified machine-readable files, models pull stale third-party directories.`,
      accentColor: '#D97706',
      footerUrl: `verisource.dev/benchmarks`,
      cards: [
        {
          label: '500-DOMAIN BENCHMARK CONTEXT',
          value: `Only 3.4% Pass All 3 JSON-LD Pillars`,
          valueColor: '#FAF9F6',
          detail: '10.6% silently block GPTBot or PerplexityBot at the CDN edge.',
        },
        {
          label: 'HIGHEST-LEVERAGE REMEDIATION',
          value: 'Ship JSON-LD + /llms.txt + /agents.md',
          valueColor: '#34D399',
          border: '#065F46',
          detail: 'Verify live HTTP 200 responses, then ping Bing IndexNow.',
        },
      ],
    },
    {
      stepTag: '04 · FREE 60S CHECK',
      headline: `Audit Your Own Site Free`,
      subline: `Zero signup required for live crawler, JSON-LD, and /agents.md checks.`,
      accentColor: '#10B981',
      footerUrl: `https://verisource.dev/#scan`,
      cards: [
        {
          label: 'PUBLIC SCORECARD',
          value: `verisource.dev/report/${report.domain}`,
          valueColor: '#FBBF24',
          border: '#78350F',
        },
        {
          label: 'ONE-CLICK FIX PACK + HOSTED /MCP',
          value: 'Starter $49/mo · Pro + MCP $99/mo',
          valueColor: '#34D399',
          border: '#065F46',
          detail: 'Or start with a $19 One-Time Audit Pass (credited toward Month 1).',
        },
      ],
    },
  ];

  return {
    title: titleGate.content,
    description: descGate.content,
    narrationScript: scriptGate.content,
    qualityScore: Math.min(scriptGate.score, descGate.score),
    srt,
    slides,
    tags: [
      'GEO',
      'AI Search Optimization',
      'ChatGPT Search',
      'Perplexity',
      'llms.txt',
      'agents.md',
      'Technical SEO',
      report.brandName,
    ],
  };
}

function stitchSlidesToMp4(ffmpegBin, slidePngPaths, outMp4Path) {
  // Concatenate 4 slides (8s each = 32s total) with silent stereo AAC track so YouTube/Shorts accepts container cleanly
  const listFile = path.join(
    os.tmpdir(),
    `vs-concat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.txt`
  );
  const durations = [6.5, 9.0, 9.0, 7.5];
  const lines = [];
  slidePngPaths.forEach((p, idx) => {
    const safePath = p.replace(/\\/g, '/').replace(/'/g, "'\\''");
    lines.push(`file '${safePath}'`);
    lines.push(`duration ${durations[idx] ?? 8.0}`);
  });
  // Repeat final frame per ffmpeg concat demuxer requirement
  const lastSafe = slidePngPaths[slidePngPaths.length - 1]
    .replace(/\\/g, '/')
    .replace(/'/g, "'\\''");
  lines.push(`file '${lastSafe}'`);

  try {
    fs.writeFileSync(listFile, `${lines.join('\n')}\n`, 'utf8');
    execFileSync(
      ffmpegBin,
      [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        listFile,
        '-f',
        'lavfi',
        '-i',
        'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-t',
        '32',
        '-vf',
        'scale=1080:1920:flags=lanczos,fps=30,format=yuv420p',
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '20',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart',
        outMp4Path,
      ],
      { stdio: 'pipe' }
    );
    return fs.existsSync(outMp4Path);
  } finally {
    try {
      if (fs.existsSync(listFile)) fs.unlinkSync(listFile);
    } catch {
      // Ignore cleanup
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const count = Math.max(
    1,
    Math.min(5, Number(getArgValue(args, '--count', '2')))
  );
  const nowIso = new Date().toISOString();

  const chromeBin = findChromeBinary();
  const ffmpegBin = findFfmpegBinary();

  const reportsPath = path.join(
    MONOREPO_ROOT,
    'apps/web/src/data/published-reports.json'
  );
  const reports = JSON.parse(fs.readFileSync(reportsPath, 'utf8')).reports ?? [];
  const ledger = loadVideoLedger();

  const candidates = [...reports]
    .filter(
      (r) =>
        Number(r.readinessScore ?? 100) <= 44 &&
        !/checkpoint|cloudflare|access denied|attention required/i.test(
          String(r.brandName ?? '')
        ) &&
        !ledger.renderedDomains[r.domain]
    )
    .sort((a, b) => Number(a.readinessScore) - Number(b.readinessScore))
    .slice(0, count);

  const rendered = [];

  for (const report of candidates) {
    const slug = report.domain.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const relFolder = `queue/videos/${slug}`;
    const absFolder = path.join(ACTIVE_OPS_DIR, relFolder);
    fs.mkdirSync(absFolder, { recursive: true });

    const pkg = buildShortsPackage(report);
    const slidePngs = [];

    if (chromeBin) {
      pkg.slides.forEach((slide, idx) => {
        const pngRel = `${relFolder}/slide-0${idx + 1}.png`;
        const pngAbs = path.join(ACTIVE_OPS_DIR, pngRel);
        const ok = renderHtmlToPng(chromeBin, buildSlideHtml(slide), pngAbs);
        if (ok) {
          copyBinaryToMirror(pngAbs, pngRel);
          slidePngs.push(pngAbs);
        }
      });
    }

    const mp4Rel = `${relFolder}/${slug}-ai-audit-short.mp4`;
    const mp4Abs = path.join(ACTIVE_OPS_DIR, mp4Rel);
    let mp4Created = false;
    let mp4Bytes = 0;

    if (ffmpegBin && slidePngs.length === 4) {
      mp4Created = stitchSlidesToMp4(ffmpegBin, slidePngs, mp4Abs);
      if (mp4Created) {
        copyBinaryToMirror(mp4Abs, mp4Rel);
        mp4Bytes = fs.statSync(mp4Abs).size;
      }
    }

    mirrorFileIfNeeded(`${relFolder}/captions.srt`, pkg.srt);
    mirrorFileIfNeeded(
      `${relFolder}/youtube-metadata.json`,
      `${JSON.stringify(
        {
          domain: report.domain,
          brandName: report.brandName,
          readinessScore: report.readinessScore,
          title: pkg.title,
          description: pkg.description,
          tags: pkg.tags,
          narrationScript: pkg.narrationScript,
          qualityScore: pkg.qualityScore,
          mp4File: mp4Created ? mp4Rel : null,
          renderedAt: nowIso,
        },
        null,
        2
      )}\n`
    );

    if (!dryRun) {
      ledger.renderedDomains[report.domain] = {
        renderedAt: nowIso,
        mp4Created,
        readinessScore: report.readinessScore,
      };
    }

    rendered.push({
      domain: report.domain,
      brandName: report.brandName,
      readinessScore: report.readinessScore,
      title: pkg.title,
      qualityScore: pkg.qualityScore,
      slidesCount: slidePngs.length,
      mp4Created,
      mp4Path: mp4Created ? mp4Abs : null,
      mp4Kb: Math.round(mp4Bytes / 1024),
      narrationScript: pkg.narrationScript,
      description: pkg.description,
    });
  }

  if (!dryRun && rendered.length > 0) {
    ledger.updatedAt = nowIso;
    mirrorFileIfNeeded(
      'ledger/video_published_ledger.json',
      `${JSON.stringify(ledger, null, 2)}\n`
    );
  }

  const md = [
    '# VIDEO_FACTORY_QUEUE.md — Automated YouTube Shorts & Teardown Asset Queue',
    '',
    `**Generated:** \`${nowIso}\` · **Renderer:** \`${chromeBin ? 'Headless Chromium' : 'Unavailable'}\` + \`${ffmpegBin ? 'FFmpeg H.264 1080x1920' : 'Unavailable'}\` · **Rendered:** \`${rendered.length}\` Shorts`,
    '',
    '| Brand & Domain | Score | Video Asset (`1080x1920` `32s`) | Quality | YouTube Short Title |',
    '| :--- | :--- | :--- | :--- | :--- |',
    ...rendered.map(
      (r) =>
        `| **${r.brandName}** (\`${r.domain}\`) | \`${r.readinessScore}/100\` | ${r.mp4Created ? `\`READY (${r.mp4Kb} KB)\`` : `\`SLIDES ONLY (${r.slidesCount}/4)\``} | \`${r.qualityScore.toFixed(1)}/10\` | ${r.title.replace(/\|/g, '-')} |`
    ),
    '',
    '---',
    '',
    ...rendered.flatMap((r, i) => [
      `## ${i + 1}. ${r.brandName} (\`${r.domain}\` · \`${r.readinessScore}/100\`)`,
      `- **MP4 Path:** \`${r.mp4Path ?? 'Install ffmpeg to compile MP4'}\``,
      `- **Title:** \`${r.title}\``,
      '',
      '### Voiceover / Narration Script (`32s`)',
      '```text',
      r.narrationScript,
      '```',
      '',
      '### YouTube Description',
      '```text',
      r.description,
      '```',
      '',
    ]),
  ];

  mirrorFileIfNeeded('queue/VIDEO_FACTORY_QUEUE.md', `${md.join('\n')}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        chromeAvailable: Boolean(chromeBin),
        ffmpegAvailable: Boolean(ffmpegBin),
        renderedCount: rendered.length,
        videos: rendered.map((r) => ({
          domain: r.domain,
          score: r.readinessScore,
          mp4Created: r.mp4Created,
          mp4Kb: r.mp4Kb,
        })),
        queuePath: path.join(ACTIVE_OPS_DIR, 'queue/VIDEO_FACTORY_QUEUE.md'),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('[ops:video] Failed:', err);
  process.exit(1);
});
