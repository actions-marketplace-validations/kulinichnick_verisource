import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  enforceQualityGate95,
  normalizePublicDomain,
  runDomainReadinessScan,
} from '../../packages/core-geo/dist/index.js';

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

const USER_AGENT = 'VerisourceCommunityScout/1.0 (+https://verisource.dev/scanner)';
const MAX_AGE_DAYS = 20;

const IGNORED_URL_HOSTS = new Set([
  'reddit.com',
  'www.reddit.com',
  'old.reddit.com',
  'redd.it',
  'i.redd.it',
  'v.redd.it',
  'news.ycombinator.com',
  'github.com',
  'gist.github.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'www.linkedin.com',
  'medium.com',
  'stackoverflow.com',
  'webmasters.stackexchange.com',
  'dev.to',
  'verisource.dev',
  'imgur.com',
  'i.imgur.com',
  'google.com',
  'www.google.com',
  'docs.google.com',
  'openai.com',
  'chatgpt.com',
  'perplexity.ai',
  'anthropic.com',
  'claude.ai',
]);

const INTENT_RULES = [
  {
    pattern: /\b(profound|otterly|peec\s*ai|athenahq|scrunch\s*ai)\b/i,
    weight: 34,
    topic: 'geo_tool_alternative',
    label: 'GEO competitor evaluation',
  },
  {
    pattern: /\b(\/?llms\.txt|\/?agents\.md)\b/i,
    weight: 32,
    topic: 'llms_agents_protocol',
    label: '/llms.txt or /agents.md setup',
  },
  {
    pattern: /\b(gptbot|oai-searchbot|perplexitybot|claudebot|ai\s*crawler|waf\s*403)\b/i,
    weight: 30,
    topic: 'ai_crawler_waf',
    label: 'AI crawler / WAF 403',
  },
  {
    pattern: /\b(generative\s*engine\s*optimization|ai\s*search\s*visibility|chatgpt\s*citations?|perplexity\s*citations?|ai\s*overviews?\s*citations?)\b/i,
    weight: 28,
    topic: 'ai_citation_visibility',
    label: 'AI search citation gap',
  },
  {
    pattern: /\b(hallucinat\w*.*pric|wrong\s*price.*(chatgpt|ai|perplexity)|chatgpt.*wrong\s*(price|shipping|info))\b/i,
    weight: 35,
    topic: 'brand_hallucination',
    label: 'AI pricing/fact hallucination',
  },
  {
    pattern: /\b(shopify.*(mcp|ucp|llms|ai\s*search|chatgpt\s*shopping)|api\/ucp\/mcp)\b/i,
    weight: 30,
    topic: 'shopify_ai_commerce',
    label: 'Shopify AI/UCP readiness',
  },
  {
    pattern: /\b(json-?ld|faqpage\s*schema|structured\s*data.*(ai|llm|chatgpt|perplexity))\b/i,
    weight: 22,
    topic: 'json_ld_schema',
    label: 'JSON-LD / FAQPage schema',
  },
  {
    pattern: /\b(mcp\s*server|model\s*context\s*protocol|webmcp|navigator\.modelcontext)\b/i,
    weight: 20,
    topic: 'mcp_protocol',
    label: 'MCP / WebMCP protocol',
  },
  {
    pattern: /\b(how\s+do\s+i|how\s+to|anyone\s+using|recommend|alternative|tool\s+for|audit|check\s+if|\?)\b/i,
    weight: 12,
    topic: 'question_intent',
    label: 'Active question',
  },
];

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

function loadSeenLedger() {
  const filePath = path.join(ACTIVE_OPS_DIR, 'ledger/community_seen_ids.json');
  if (!fs.existsSync(filePath)) {
    return { updatedAt: null, seenIds: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      updatedAt: parsed.updatedAt ?? null,
      seenIds:
        parsed.seenIds && typeof parsed.seenIds === 'object'
          ? parsed.seenIds
          : {},
    };
  } catch {
    return { updatedAt: null, seenIds: {} };
  }
}

function pruneOldSeenIds(seenIds) {
  const cutoff = Date.now() - 45 * 86400 * 1000;
  const cleaned = {};
  for (const [id, iso] of Object.entries(seenIds)) {
    const ts = Date.parse(String(iso));
    if (Number.isFinite(ts) && ts >= cutoff) {
      cleaned[id] = iso;
    }
  }
  return cleaned;
}

function stripHtml(raw) {
  return String(raw ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreThreadIntent(item) {
  const combined = `${item.title} ${item.excerpt}`;
  let score = 0;
  const matchedLabels = [];
  let primaryTopic = 'ai_citation_visibility';
  let topWeight = 0;

  for (const rule of INTENT_RULES) {
    if (rule.pattern.test(combined)) {
      score += rule.weight;
      matchedLabels.push(rule.label);
      if (rule.topic !== 'question_intent' && rule.weight > topWeight) {
        topWeight = rule.weight;
        primaryTopic = rule.topic;
      }
    }
  }

  // Freshness boost: < 3 days gets +12, < 7 days gets +6
  const ageDays = Math.max(
    0,
    (Date.now() - Date.parse(item.createdAt)) / (86400 * 1000)
  );
  if (ageDays <= 3) score += 12;
  else if (ageDays <= 7) score += 6;

  // Penalty for obvious self-promo spam posts
  if (/\b(i\s+launched|show\s+hn|discount\s+code|affiliate\s+link)\b/i.test(item.title)) {
    score -= 10;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    primaryTopic,
    matchedLabels: Array.from(new Set(matchedLabels)),
    ageDays: Number(ageDays.toFixed(1)),
  };
}

function extractAuditableDomainFromText(text) {
  const matches = String(text ?? '').match(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s)\]"']*)?/gi) ?? [];
  for (const rawUrl of matches) {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      if (IGNORED_URL_HOSTS.has(host) || IGNORED_URL_HOSTS.has(parsed.hostname.toLowerCase())) {
        continue;
      }
      const norm = normalizePublicDomain(host);
      return norm.hostname;
    } catch {
      // Skip invalid or private URLs
    }
  }
  return null;
}

async function fetchHnSignals() {
  const cutoffUnix = Math.floor((Date.now() - MAX_AGE_DAYS * 86400 * 1000) / 1000);
  const queries = [
    'llms.txt',
    'agents.md',
    'GPTBot',
    '"AI search" visibility',
    'PerplexityBot',
    'Shopify MCP',
  ];
  const results = [];
  for (const q of queries) {
    try {
      const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(
        q
      )}&tags=(story,ask_hn)&numericFilters=created_at_i>${cutoffUnix}&hitsPerPage=8`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      for (const hit of json.hits ?? []) {
        const title = stripHtml(hit.title || hit.story_title || '');
        if (!title) continue;
        const excerpt = stripHtml(hit.story_text || hit.comment_text || '').slice(0, 400);
        results.push({
          id: `hn:${hit.objectID}`,
          source: 'Hacker News',
          channel: 'HN',
          title,
          url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
          targetUrlInPost: hit.url || null,
          excerpt,
          author: hit.author || 'hn-user',
          createdAt: hit.created_at || new Date().toISOString(),
          engagement: `${hit.points ?? 0} pts · ${hit.num_comments ?? 0} comments`,
        });
      }
    } catch {
      // Non-fatal source timeout
    }
  }
  return results;
}

async function fetchRedditSignals() {
  const subreddits = 'TechSEO+bigseo+SEO+shopify+SaaS+webflow+ClaudeAI+Cursor';
  const queries = [
    'llms.txt OR agents.md',
    'GPTBot OR PerplexityBot OR "AI search visibility"',
    'Profound OR Otterly OR "AI visibility tool"',
    'ChatGPT wrong price OR hallucinating pricing',
  ];
  const results = [];
  const cutoffMs = Date.now() - MAX_AGE_DAYS * 86400 * 1000;

  for (const q of queries) {
    try {
      const url = `https://www.reddit.com/r/${subreddits}/search.json?q=${encodeURIComponent(
        q
      )}&restrict_sr=1&sort=new&t=month&limit=8`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      for (const child of json?.data?.children ?? []) {
        const d = child?.data;
        if (!d || !d.id || !d.title) continue;
        const createdMs = Number(d.created_utc ?? 0) * 1000;
        if (createdMs < cutoffMs) continue;
        results.push({
          id: `reddit:${d.id}`,
          source: `Reddit (r/${d.subreddit})`,
          channel: `r/${d.subreddit}`,
          title: stripHtml(d.title),
          url: `https://www.reddit.com${d.permalink}`,
          targetUrlInPost: d.is_self ? null : d.url || null,
          excerpt: stripHtml(d.selftext || '').slice(0, 400),
          author: d.author || 'redditor',
          createdAt: new Date(createdMs).toISOString(),
          engagement: `${d.score ?? 0} upvotes · ${d.num_comments ?? 0} comments`,
        });
      }
    } catch {
      // Reddit can rate-limit cloud IPs; degrade silently
    }
  }
  return results;
}

async function fetchStackExchangeSignals() {
  const fromDate = Math.floor((Date.now() - MAX_AGE_DAYS * 86400 * 1000) / 1000);
  const queries = [
    { site: 'webmasters', q: 'GPTBot' },
    { site: 'webmasters', q: 'llms.txt' },
    { site: 'webmasters', q: 'JSON-LD FAQPage' },
    { site: 'stackoverflow', q: 'llms.txt' },
    { site: 'stackoverflow', q: 'agents.md' },
  ];
  const results = [];
  for (const item of queries) {
    try {
      const url = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=creation&q=${encodeURIComponent(
        item.q
      )}&fromdate=${fromDate}&site=${item.site}&pagesize=6`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      for (const q of json.items ?? []) {
        if (!q.question_id || !q.title) continue;
        results.push({
          id: `se:${item.site}:${q.question_id}`,
          source: `StackExchange (${item.site})`,
          channel: item.site,
          title: stripHtml(q.title),
          url: q.link,
          targetUrlInPost: null,
          excerpt: `Tags: ${(q.tags ?? []).join(', ')}`,
          author: q.owner?.display_name || 'se-user',
          createdAt: new Date(Number(q.creation_date ?? 0) * 1000).toISOString(),
          engagement: `${q.score ?? 0} score · ${q.answer_count ?? 0} answers`,
        });
      }
    } catch {
      // Non-fatal
    }
  }
  return results;
}

async function fetchDevToSignals() {
  const tags = ['seo', 'mcp', 'shopify', 'webdev'];
  const cutoffMs = Date.now() - MAX_AGE_DAYS * 86400 * 1000;
  const results = [];

  for (const tag of tags) {
    try {
      const url = `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=15`;
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const articles = await res.json();
      if (!Array.isArray(articles)) continue;
      for (const a of articles) {
        const pubMs = Date.parse(a.published_at || '');
        if (!Number.isFinite(pubMs) || pubMs < cutoffMs) continue;
        const text = `${a.title ?? ''} ${a.description ?? ''} ${(a.tag_list ?? []).join(' ')}`;
        if (
          !/\b(llms\.txt|agents\.md|gptbot|perplexitybot|geo|ai\s*search|json-?ld|mcp|shopify)\b/i.test(
            text
          )
        ) {
          continue;
        }
        results.push({
          id: `devto:${a.id}`,
          source: 'DEV.to',
          channel: `#${tag}`,
          title: stripHtml(a.title),
          url: a.url,
          targetUrlInPost: null,
          excerpt: stripHtml(a.description || '').slice(0, 360),
          author: a.user?.username || 'devto-author',
          createdAt: new Date(pubMs).toISOString(),
          engagement: `${a.positive_reactions_count ?? 0} reactions · ${a.comments_count ?? 0} comments`,
        });
      }
    } catch {
      // Non-fatal
    }
  }
  return results;
}

function buildDisclosedTechnicalReply(item, liveScan) {
  let coreEvidence = '';

  if (liveScan) {
    const bots = liveScan.robotsAiBotStatus;
    const blocked = [];
    if (!bots.GPTBot) blocked.push('GPTBot');
    if (!bots['OAI-SearchBot']) blocked.push('OAI-SearchBot');
    if (!bots.PerplexityBot) blocked.push('PerplexityBot');
    if (!bots.ClaudeBot) blocked.push('ClaudeBot');

    const botNote =
      bots.waf_blocked || blocked.length > 0
        ? `Edge WAF or robots.txt restricted ${blocked.join(', ') || 'AI bots'} on root fetch`
        : 'GPTBot and PerplexityBot both returned HTTP 200';
    const pillars = Array.isArray(liveScan.jsonLdReadiness?.missingAiGraphPillars)
      ? 3 - liveScan.jsonLdReadiness.missingAiGraphPillars.length
      : liveScan.jsonLdCount > 0
        ? 1
        : 0;

    coreEvidence = `Ran a quick read-only HTTP check on ${liveScan.hostname} (${liveScan.visibilityScore}/100): ${botNote}, /llms.txt is ${liveScan.llmsTxtStatus}, /agents.md is ${liveScan.agentsMdStatus}, and ${pillars}/3 JSON-LD pillars (Entity, FAQPage, Offer) are live. Closing those missing machine-readable files first usually resolves citation misses faster than publishing extra blog posts.`;
  } else if (item.primaryTopic === 'ai_crawler_waf') {
    coreEvidence =
      'Check edge WAF rules separately from /robots.txt. Across 500 live commercial domains we probed over HTTPS, 10.6% returned HTTP 403 to GPTBot or PerplexityBot at Cloudflare/CDN edge rules even when /robots.txt allowed them. Test with explicit GPTBot/1.2 and PerplexityBot/1.0 User-Agent headers from a neutral IP.';
  } else if (item.primaryTopic === 'llms_agents_protocol') {
    coreEvidence =
      'Serve /llms.txt as plain text (text/plain; charset=utf-8) and /agents.md as Markdown with verified pricing, exclusions, and canonical docs links. In our 500-domain HTTP benchmark, 65.6% published /llms.txt, but only 10.0% served a custom /agents.md—and many Next.js/SPA setups accidentally return HTTP 200 HTML soft-404s unless routed explicitly.';
  } else if (item.primaryTopic === 'shopify_ai_commerce') {
    coreEvidence =
      'Shopify OS 2.0 stores already expose /api/ucp/mcp out of the box, but nearly all still serve Shopify stock boilerplate at /agents.md without real free-shipping thresholds or return windows. Adding a verified /pages/ai-facts feed linked via <link rel="alternate" type="text/markdown"> plus Offer + FAQPage JSON-LD closes that gap in one afternoon (and avoids the -28.7 pt headless Next.js penalty we measured across 500 stores).';
  } else if (item.primaryTopic === 'geo_tool_alternative') {
    coreEvidence =
      'Most visibility trackers ($245-$579/mo) stop at mention charts and leave you writing JSON-LD, /llms.txt, and /agents.md manually. Whatever stack you pick, verify three things before paying: real GPTBot/PerplexityBot HTTP 200 probes (not just /robots.txt parsing), pricing claim diffs against your actual site truth, and syntax-verified schema output.';
  } else if (item.primaryTopic === 'brand_hallucination') {
    coreEvidence =
      'When ChatGPT or Perplexity quotes an old price or shipping threshold, it is usually pulling stale third-party directories because your own page lacks explicit Offer + FAQPage JSON-LD and a plain-text /agents.md rulebook. Publish an explicit pricing & exclusions block server-side, verify GPTBot gets HTTP 200, and ping Bing IndexNow so ChatGPT Search re-crawls within hours.';
  } else {
    coreEvidence =
      'Across 500 commercial SaaS and DTC domains we probed over HTTPS, only 3.4% shipped all 3 JSON-LD pillars (Entity Identity, FAQPage, Offer pricing) and 10.6% silently blocked GPTBot or PerplexityBot at the CDN edge. Fixing crawler access and machine-readable pricing facts tends to move citation share faster than chasing volume keywords.';
  }

  const disclosure =
    'Full disclosure: I built Verisource (https://verisource.dev/benchmarks/ai-search-readiness-2026) to run these read-only HTTP, JSON-LD, and /agents.md audits automatically—the free protocol checkers at /tools work with zero signup if you want to verify your own domain.';

  return enforceQualityGate95(`${coreEvidence}\n\n${disclosure}`);
}

async function sendFounderDigestEmail({ toEmail, subject, bodyText }) {
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim();
  const appOrigin = (
    rawAppUrl && !/localhost|127\.0\.0\.1/i.test(rawAppUrl)
      ? rawAppUrl
      : 'https://verisource.dev'
  ).replace(/\/+$/, '');

  if (!serviceKey) {
    return { sent: false, reason: 'MISSING_SUPABASE_SERVICE_ROLE_KEY' };
  }

  const trimmedBody =
    bodyText.length > 3850
      ? `${bodyText.slice(0, 3810).trimEnd()}\n\n[Full queue in growth_ops/queue/COMMUNITY_SIGNAL_DIGEST.md]`
      : bodyText;

  const res = await fetch(`${appOrigin}/api/dashboard/outbound-send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: toEmail,
      subject: subject.slice(0, 175),
      text: trimmedBody,
      replyTo: toEmail,
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return { sent: false, reason: `HTTP_${res.status}:${errText.slice(0, 160)}` };
  }
  const json = await res.json();
  return {
    sent: Boolean(json.delivered),
    id: json.providerMessageId ?? null,
    reason: null,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const sendEmail = args.includes('--send-email') && !dryRun;
  const ignoreSeen = args.includes('--ignore-seen');
  const topLimit = Math.max(
    1,
    Math.min(15, Number(getArgValue(args, '--limit', '8')))
  );
  const minScore = Math.max(
    15,
    Math.min(90, Number(getArgValue(args, '--min-score', '35')))
  );
  const nowIso = new Date().toISOString();

  console.log('[ops:community] Polling HN Algolia, Reddit, StackExchange, and DEV.to...');
  const [hn, reddit, stackEx, devTo] = await Promise.all([
    fetchHnSignals(),
    fetchRedditSignals(),
    fetchStackExchangeSignals(),
    fetchDevToSignals(),
  ]);

  const rawAll = [...hn, ...reddit, ...stackEx, ...devTo];
  const dedupedById = new Map();
  for (const item of rawAll) {
    if (!dedupedById.has(item.id)) {
      dedupedById.set(item.id, item);
    }
  }

  const ledger = loadSeenLedger();
  const seenIds = pruneOldSeenIds(ledger.seenIds);

  const scored = Array.from(dedupedById.values())
    .filter((item) => {
      const urlCombined = `${item.url ?? ''} ${item.targetUrlInPost ?? ''}`.toLowerCase();
      if (urlCombined.includes('verisource.dev')) return false;
      return ignoreSeen || !seenIds[item.id];
    })
    .map((item) => {
      const intent = scoreThreadIntent(item);
      return { ...item, ...intent };
    })
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score || a.ageDays - b.ageDays)
    .slice(0, topLimit);

  const enriched = [];
  for (const item of scored) {
    const candidateHost = extractAuditableDomainFromText(
      `${item.targetUrlInPost ?? ''} ${item.title} ${item.excerpt}`
    );
    let liveScan = null;
    if (candidateHost) {
      try {
        liveScan = await Promise.race([
          runDomainReadinessScan(candidateHost),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('SCAN_TIMEOUT')), 7000)
          ),
        ]);
      } catch {
        liveScan = null;
      }
    }
    const reply = buildDisclosedTechnicalReply(item, liveScan);
    enriched.push({
      ...item,
      scannedDomain: liveScan?.hostname ?? null,
      scannedScore: liveScan?.visibilityScore ?? null,
      replyText: reply.content,
      replyQualityScore: reply.score,
    });
  }

  // Persist seen IDs unless dry-run
  if (!dryRun) {
    for (const item of enriched) {
      seenIds[item.id] = nowIso;
    }
    mirrorFileIfNeeded(
      'ledger/community_seen_ids.json',
      `${JSON.stringify({ updatedAt: nowIso, seenIds }, null, 2)}\n`
    );
  }

  const sourceCounts = `HN: ${hn.length} | Reddit: ${reddit.length} | StackExchange: ${stackEx.length} | DEV.to: ${devTo.length}`;

  const mdLines = [
    '# COMMUNITY_SIGNAL_DIGEST.md — High-Intent Organic Thread Queue (< 20 Days Old)',
    '',
    `**Generated:** \`${nowIso}\` · **Sources Scanned:** \`${sourceCounts}\` · **Actionable Matches (>= ${minScore} intent):** \`${enriched.length}\``,
    '',
    '> **Zero-Spam Policy:** Never auto-post via bots. Spend 5 minutes pasting the top 2–3 disclosed technical replies below to earn Google Page-1 rankings and ChatGPT/Perplexity consensus citations.',
    '',
  ];

  if (enriched.length === 0) {
    mdLines.push(
      '_No net-new threads cleared the intent threshold on this sweep. Next 6-hour cron sweep will re-check automatically._'
    );
  } else {
    mdLines.push(
      '| Rank | Score | Source | Age | Signals | Thread |',
      '| :--- | :--- | :--- | :--- | :--- | :--- |'
    );
    enriched.forEach((item, idx) => {
      mdLines.push(
        `| ${idx + 1} | \`${item.score}/100\` | ${item.source} | \`${item.ageDays}d\` | ${item.matchedLabels.join(', ')} | [${item.title.replace(/\|/g, '-').slice(0, 72)}](${item.url}) |`
      );
    });
    mdLines.push('', '---', '');

    enriched.forEach((item, idx) => {
      mdLines.push(
        `## ${idx + 1}. ${item.title}`,
        `- **Source:** ${item.source} · **Intent:** \`${item.score}/100\` · **Age:** \`${item.ageDays}d\` · **Activity:** ${item.engagement}`,
        `- **Thread URL:** ${item.url}`,
        item.scannedDomain
          ? `- **Live HTTP Scan Included:** \`${item.scannedDomain}\` (\`${item.scannedScore}/100\`)`
          : '- **Live HTTP Scan:** General `N = 500` empirical benchmark evidence',
        `- **Quality Gate:** \`${item.replyQualityScore.toFixed(1)}/10.0\``,
        '',
        '```text',
        item.replyText,
        '```',
        ''
      );
    });
  }

  mirrorFileIfNeeded('queue/COMMUNITY_SIGNAL_DIGEST.md', `${mdLines.join('\n')}\n`);

  let emailStatus = 'SKIPPED (--send-email not set)';
  const founderEmail = (
    process.env.OUTBOUND_REPLY_TO_EMAIL ?? 'kulinichnick@gmail.com'
  ).trim();
  const topForEmail = enriched.filter((x) => x.score >= 55).slice(0, 3);

  if (sendEmail && topForEmail.length > 0) {
    const emailBlocks = topForEmail.map(
      (item, idx) =>
        `${idx + 1}) [${item.score}/100 · ${item.source}] ${item.title}\nLink: ${item.url}\nDraft reply:\n${item.replyText}`
    );
    const emailBody = [
      `Verisource Community Citation Digest (${topForEmail.length} high-intent threads found):`,
      '',
      ...emailBlocks.flatMap((b) => [b, '---']),
      'Review and paste the best 1-2 replies directly from your own account (zero bot posting).',
    ].join('\n');

    const sent = await sendFounderDigestEmail({
      toEmail: founderEmail,
      subject: `[Verisource Community] ${topForEmail.length} high-intent AI search threads ready (5-min paste)`,
      bodyText: emailBody,
    });
    emailStatus = sent.sent
      ? `SENT (${sent.id})`
      : `NOT_SENT (${sent.reason})`;
  } else if (sendEmail) {
    emailStatus = 'SKIPPED (no threads >= 55 intent score)';
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        sources: {
          hn: hn.length,
          reddit: reddit.length,
          stackExchange: stackEx.length,
          devTo: devTo.length,
        },
        matched: enriched.length,
        topScore: enriched[0]?.score ?? 0,
        digestPath: path.join(ACTIVE_OPS_DIR, 'queue/COMMUNITY_SIGNAL_DIGEST.md'),
        emailStatus,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('[ops:community] Failed:', err);
  process.exit(1);
});
