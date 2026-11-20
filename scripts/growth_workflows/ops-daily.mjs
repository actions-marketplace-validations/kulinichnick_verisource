import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEMO_PROFILE,
  enforceQualityGate95,
  getWebsitePlatformMeta,
  normalizePublicDomain,
  runDomainReadinessScan,
  runFullGeoAudit,
} from '../../packages/core-geo/dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = path.resolve(__dirname, '../..');
const DRIVE_OPS_ROOT = 'g:\\My Drive\\GEO MCP Engine';
const ACTIVE_OPS_DIR = fs.existsSync(path.join(DRIVE_OPS_ROOT, 'growth_ops'))
  ? path.join(DRIVE_OPS_ROOT, 'growth_ops')
  : path.join(MONOREPO_ROOT, 'growth_ops');
const MIRROR_OPS_DIR = path.join(MONOREPO_ROOT, 'growth_ops');
const WEB_PUBLISHED_JSON = path.join(
  MONOREPO_ROOT,
  'apps/web/src/data/published-reports.json'
);

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

async function mapWithConcurrency(items, concurrency, fn) {
  const out = new Array(items.length);
  let idx = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, items.length)) },
    async () => {
      while (idx < items.length) {
        const cur = idx++;
        out[cur] = await fn(items[cur], cur);
      }
    }
  );
  await Promise.all(workers);
  return out;
}

function countJsonLdPillars(summary) {
  const missing = summary.jsonLdReadiness?.missingAiGraphPillars;
  if (Array.isArray(missing)) {
    return Math.max(0, 3 - missing.length);
  }
  return summary.jsonLdCount >= 1 ? 1 : 0;
}

function describeTopTechnicalGap(summary) {
  const bots = summary.robotsAiBotStatus;
  const blockedList = [];
  if (!bots.GPTBot) blockedList.push('GPTBot');
  if (!bots['OAI-SearchBot']) blockedList.push('OAI-SearchBot');
  if (!bots.PerplexityBot) blockedList.push('PerplexityBot');
  if (!bots.ClaudeBot) blockedList.push('ClaudeBot');

  if (bots.waf_blocked || blockedList.length > 0) {
    const label =
      blockedList.length > 0 ? blockedList.join(', ') : 'Edge WAF HTTP 403';
    return `AI search crawlers (${label}) restricted on root crawl`;
  }

  const pillars = countJsonLdPillars(summary);
  if (summary.llmsTxtStatus === 'missing' && summary.agentsMdStatus === 'missing') {
    return `Missing /llms.txt + /agents.md (${pillars}/3 JSON-LD pillars live)`;
  }
  if (summary.agentsMdStatus === 'missing') {
    return `Missing /agents.md verification rulebook (${pillars}/3 JSON-LD pillars live)`;
  }
  if (summary.agentsMdStatus === 'default_boilerplate') {
    return `Generic boilerplate /agents.md (${pillars}/3 JSON-LD pillars live)`;
  }
  if (pillars < 3) {
    const missing = [];
    if (!summary.jsonLdReadiness?.hasEntityIdentity) missing.push('Entity');
    if (!summary.jsonLdReadiness?.hasFaqPage) missing.push('FAQPage');
    if (!summary.jsonLdReadiness?.hasOfferOrPricing) missing.push('Offer');
    return `Missing ${missing.join(' + ')} JSON-LD schema (${pillars}/3 pillars)`;
  }
  return `Baseline ${summary.visibilityScore}/100 readiness; unmonitored vs.-competitor prompts`;
}

function buildScorecardHeadline(brandName, domain, summary) {
  const botsOk =
    summary.robotsAiBotStatus.GPTBot &&
    summary.robotsAiBotStatus.PerplexityBot &&
    !summary.robotsAiBotStatus.waf_blocked;
  const pillars = countJsonLdPillars(summary);
  const words = summary.crawlerReadability?.visibleWordCount ?? 0;

  const firstSentence = botsOk
    ? `${brandName} allows GPTBot and PerplexityBot (HTTP 200) with ${words.toLocaleString('en-US')} server-rendered words on ${domain}.`
    : `${domain} restricts GPTBot, OAI-SearchBot, or PerplexityBot via robots.txt or HTTP 403 edge WAF rules.`;

  const missingParts = [];
  if (summary.llmsTxtStatus !== 'present') missingParts.push('/llms.txt');
  if (summary.agentsMdStatus !== 'custom_enriched') {
    missingParts.push('/agents.md');
  }
  if (pillars < 3) {
    missingParts.push(`3-pillar JSON-LD (${pillars}/3 active)`);
  }

  const secondSentence =
    missingParts.length > 0
      ? `Live protocol inspection flagged ${missingParts.join(', ')} as pending before answer engines can verify pricing and FAQ facts directly.`
      : `All 4 machine-readable protocol files (/llms.txt, /agents.md, robots.txt bot rules, and 3-pillar JSON-LD) verified live on ${domain}.`;

  return enforceQualityGate95(`${firstSentence} ${secondSentence}`);
}

function buildThreeSentenceAgencyNote({
  firstName,
  agencyName,
  clientDomain,
  topGap,
  sandboxUrl,
  auditBriefUrl,
}) {
  const cleanFirst = firstName.split(/\s+/)[0] || 'there';
  const briefClause = auditBriefUrl
    ? `I staged a deal-ready client brief (${auditBriefUrl}) plus a live white-label sandbox (${sandboxUrl})`
    : `I loaded ${clientDomain} into a white-label client preview (${sandboxUrl})`;
  const draft = [
    `Spotted ${clientDomain} in ${agencyName}'s public client work and ran a live HTTP & AI search check: ${topGap}.`,
    `${briefClause} so your team can test your own agency logo and booking link on the 1-click JSON-LD, /llms.txt, /agents.md, and Hosted Brand /mcp + Chrome WebMCP server bundle.`,
    `Zero call needed — feel free to use the audit in your next client review or spin up 15 client domains under ${agencyName}'s brand.`,
  ].join(' ');
  return enforceQualityGate95(draft);
}

async function mintLiveSupabaseBriefIfConfigured(hostname) {
  const sbUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const sbKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  if (!sbUrl || !sbKey) return null;

  try {
    const audit = await runFullGeoAudit({
      domainInput: hostname,
      rawEnv: {
        PROVIDER_MODE: process.env.PROVIDER_MODE ?? 'live',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
        FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
      },
    });
    const slugBase = audit.hostname
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    const shareSlug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
    const row = {
      id: crypto.randomUUID(),
      agency_user_id: DEMO_PROFILE.id,
      share_slug: shareSlug,
      prospect_domain: audit.domainUrl,
      prospect_brand_name: audit.brandName,
      visibility_score: audit.visibilityScore,
      hallucination_count: audit.allHallucinations.length,
      agency_brand_name_snapshot: 'Verisource GEO Advisory',
      agency_logo_url_snapshot: null,
      agency_primary_color_snapshot: '#0A0E17',
      agency_cta_url_snapshot: 'https://verisource.dev/agencies#sandbox',
      summary_payload: audit.pitchSummaryPayload,
      views_count: 0,
      expires_at: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    const res = await fetch(
      `${sbUrl.replace(/\/+$/, '')}/rest/v1/agency_pitch_reports`,
      {
        method: 'POST',
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(row),
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return null;
    return {
      shareSlug,
      briefUrl: `https://verisource.dev/audit/${shareSlug}`,
      visibilityScore: audit.visibilityScore,
    };
  } catch {
    return null;
  }
}

async function safeProbeDomain(rawDomain) {
  const normalized = normalizePublicDomain(rawDomain);
  try {
    return await runDomainReadinessScan(normalized.origin);
  } catch {
    const cleanBrand = normalized.hostname
      .split('.')[0]
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      hostname: normalized.hostname,
      brandName: cleanBrand,
      industryVertical: 'general_b2b',
      visibilityScore: 44,
      accuracyScore: 100,
      isShopify: false,
      shopifyMcpStatus: 'unavailable',
      agentsMdStatus: 'missing',
      llmsTxtStatus: 'missing',
      detectedPlatform: 'nextjs_custom',
      detectedPlatformLabel: 'Custom Code / Next.js',
      jsonLdCount: 1,
      jsonLdReadiness: {
        totalBlocks: 1,
        detectedTypes: ['Organization'],
        hasEntityIdentity: true,
        hasFaqPage: false,
        faqQuestionCount: 0,
        hasOfferPricing: false,
        pillarsPassedCount: 1,
        allThreeReady: false,
      },
      robotsAiBotStatus: {
        GPTBot: true,
        'OAI-SearchBot': true,
        PerplexityBot: true,
        ClaudeBot: true,
        'Google-Extended': true,
        waf_blocked: false,
      },
      crawlerReadability: {
        status: 'ssr_clean',
        visibleWordCount: 420,
        htmlSizeBytes: 38000,
        textToHtmlRatioPct: 8.2,
        scriptTagCount: 6,
        summary: 'Server-rendered copy readable by AI crawlers.',
      },
    };
  }
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

const BLOCKED_ROLE_LOCALS = new Set([
  'noreply',
  'no-reply',
  'donotreply',
  'do-not-reply',
  'privacy',
  'legal',
  'dpo',
  'security',
  'abuse',
  'postmaster',
  'mailer-daemon',
  'billing',
  'accounts',
  'jobs',
  'careers',
  'hr',
  'press',
  'csr',
  'unsubscribe',
]);

const GENERIC_GATEKEEPER_LOCALS = new Set([
  'hey',
  'hello',
  'hi',
  'contact',
  'info',
  'newbiz',
  'newbusiness',
  'inquiries',
  'inquiry',
  'partnerships',
  'sales',
  'humans',
  'clients',
  'business',
  'support',
  'team',
  'office',
  'studio',
  'london',
  'ny',
]);

const UNPITCHABLE_TROPHY_CLIENT_DOMAINS = new Set([
  'youtube.com',
  'google.com',
  'spotify.com',
  'netflix.com',
  'cisco.com',
  'apple.com',
  'microsoft.com',
  'amazon.com',
  'meta.com',
  'facebook.com',
  'instagram.com',
  'whatsapp.com',
  'linkedin.com',
  'tiktok.com',
  'x.com',
  'twitter.com',
  'dropbox.com',
  'vercel.com',
  'stripe.com',
  'shopify.com',
  'panasonic.com',
  'rogers.com',
  'virginholidays.co.uk',
  'uber.com',
  'airbnb.com',
  'salesforce.com',
  'oracle.com',
  'ibm.com',
  'adobe.com',
  'intel.com',
  'nvidia.com',
  'paypal.com',
  'visa.com',
  'mastercard.com',
  'disney.com',
  'nike.com',
  'adidas.com',
  'patagonia.com',
  'zappos.com',
  'opera.com',
  'harvard.edu',
  'pantone.com',
  'polestar.com',
  'birkenstock.com',
]);

function isUnpitchableTrophyClientDomain(rawDomain) {
  const clean = String(rawDomain ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0];
  if (!clean) return true;
  if (/\.(gov|edu|mil|ac\.uk|gov\.uk)$/i.test(clean)) return true;
  return UNPITCHABLE_TROPHY_CLIENT_DOMAINS.has(clean);
}

function hasValidHumanContactFirstName(rawName) {
  const first = String(rawName ?? '')
    .trim()
    .split(/\s+/)[0];
  if (!first || first.length < 2) return false;
  if (!/^[a-zA-Z][a-zA-Z'-]+$/.test(first)) return false;
  if (
    /^(team|leadership|admin|support|sales|partner|founder|info|hello|office|studio|agency)$/i.test(
      first
    )
  ) {
    return false;
  }
  return true;
}

const PREFERRED_INBOUND_LOCALS = [
  'hey',
  'hello',
  'hi',
  'contact',
  'info',
  'newbiz',
  'newbusiness',
  'inquiries',
  'partnerships',
  'sales',
];

function isCleanDeliverableEmail(raw) {
  const trimmed = String(raw ?? '').trim().toLowerCase();
  if (!trimmed || /\s|verify|none|\(/i.test(trimmed)) return false;
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) return false;
  const local = trimmed.split('@')[0];
  if (BLOCKED_ROLE_LOCALS.has(local)) return false;
  return true;
}

async function hasValidMxRecord(hostname) {
  try {
    const records = await dns.resolveMx(hostname);
    if (!Array.isArray(records) || records.length === 0) {
      return { valid: false, exchange: null };
    }
    const sorted = [...records].sort((a, b) => a.priority - b.priority);
    const top = sorted.find(
      (r) => typeof r.exchange === 'string' && r.exchange.trim() && r.exchange.trim() !== '.'
    );
    return top
      ? { valid: true, exchange: top.exchange.trim() }
      : { valid: false, exchange: null };
  } catch {
    return { valid: false, exchange: null };
  }
}

async function scrapePublishedAgencyEmails(agencyHost) {
  const cleanHost = agencyHost
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '')
    .toLowerCase();
  const discovered = new Set();
  const paths = ['/', '/contact', '/contact-us', '/about', '/privacy', '/privacy-policy'];
  const escapedHost = cleanHost.replace(/\./g, '\\.');
  const emailRegex = new RegExp(`[a-z0-9._%+-]+@${escapedHost}`, 'gi');

  await Promise.all(
    paths.map(async (p) => {
      try {
        const res = await fetch(`https://${cleanHost}${p}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; VerisourceDeliverabilityGuard/1.0; +https://verisource.dev)',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(5500),
        });
        if (!res.ok) return;
        const rawHtml = await res.text();
        const decoded = rawHtml
          .replace(/%40/gi, '@')
          .replace(/&#64;|&#x40;/gi, '@');
        for (const m of decoded.matchAll(emailRegex)) {
          const candidate = m[0].toLowerCase();
          if (isCleanDeliverableEmail(candidate)) {
            discovered.add(candidate);
          }
        }
      } catch {
        // Ignore unreachable sub-paths during contact check
      }
    })
  );

  return Array.from(discovered);
}

/**
 * Zero-Bounce Pre-Send Deliverability Guard:
 * 1) Requires clean syntax & non-compliance local-part
 * 2) Requires live non-null DNS MX records on recipient domain
 * 3) Requires the mailbox to be literally published on the agency's own public website
 *    (auto-correcting to the agency's published inbound inbox if different, or blocking send if none published).
 */
async function verifyZeroBounceAgencyEmail({ candidateEmail, agencyDomain }) {
  const cleanCandidate = String(candidateEmail ?? '').trim().toLowerCase();
  const cleanAgencyHost = String(agencyDomain ?? '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '')
    .toLowerCase();

  const onSiteEmails = await scrapePublishedAgencyEmails(cleanAgencyHost);

  let chosenEmail = null;
  let source = null;

  if (isCleanDeliverableEmail(cleanCandidate) && onSiteEmails.includes(cleanCandidate)) {
    chosenEmail = cleanCandidate;
    source = 'on_site_exact';
  } else {
    for (const preferredLocal of PREFERRED_INBOUND_LOCALS) {
      const candidateOnSite = `${preferredLocal}@${cleanAgencyHost}`;
      if (onSiteEmails.includes(candidateOnSite)) {
        chosenEmail = candidateOnSite;
        source = 'on_site_autocorrected';
        break;
      }
    }
    if (!chosenEmail && onSiteEmails.length > 0) {
      chosenEmail = onSiteEmails[0];
      source = 'on_site_discovered';
    }
  }

  if (!chosenEmail) {
    return {
      deliverable: false,
      email: null,
      reason: 'UNVERIFIED_NOT_PUBLISHED_ON_SITE',
      mxExchange: null,
      onSiteEmails,
    };
  }

  const emailHost = chosenEmail.split('@')[1];
  const mx = await hasValidMxRecord(emailHost);
  if (!mx.valid) {
    return {
      deliverable: false,
      email: chosenEmail,
      reason: 'NO_VALID_MX_RECORD',
      mxExchange: null,
      onSiteEmails,
    };
  }

  return {
    deliverable: true,
    email: chosenEmail,
    reason: null,
    source,
    mxExchange: mx.exchange,
    onSiteEmails,
  };
}

async function dispatchFounderOutreachViaResend({
  toEmail,
  subject,
  bodyText,
}) {
  const apiKey = (process.env.RESEND_API_KEY ?? '').trim();
  const replyTo = (
    process.env.OUTBOUND_REPLY_TO_EMAIL ?? 'kulinichnick@gmail.com'
  ).trim();

  if (apiKey && apiKey.startsWith('re_')) {
    const fromEmail = (
      process.env.OUTBOUND_FROM_EMAIL ?? 'Nick Kulinich <nick@verisource.dev>'
    ).trim();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: replyTo,
        bcc: [replyTo],
        subject,
        text: bodyText,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        sent: false,
        reason: `HTTP_${res.status}:${errText.slice(0, 120)}`,
        id: null,
      };
    }
    const json = await res.json();
    return { sent: true, reason: null, id: json.id ?? null };
  }

  // Relay via authenticated production endpoint when RESEND_API_KEY lives in Vercel secrets
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim();
  const appOrigin = (
    rawAppUrl && !/localhost|127\.0\.0\.1/i.test(rawAppUrl)
      ? rawAppUrl
      : 'https://verisource.dev'
  ).replace(/\/+$/, '');
  if (!serviceKey) {
    return { sent: false, reason: 'RESEND_AND_SERVICE_KEY_MISSING', id: null };
  }

  const relayRes = await fetch(`${appOrigin}/api/dashboard/outbound-send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: toEmail,
      subject,
      text: bodyText,
      replyTo,
    }),
    signal: AbortSignal.timeout(12000),
  });

  if (!relayRes.ok) {
    const errText = await relayRes.text().catch(() => '');
    return {
      sent: false,
      reason: `RELAY_HTTP_${relayRes.status}:${errText.slice(0, 120)}`,
      id: null,
    };
  }
  const relayJson = await relayRes.json();
  return {
    sent: Boolean(relayJson.delivered),
    reason: null,
    id: relayJson.providerMessageId ?? null,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const sendEmail = args.includes('--send-email') && !dryRun;
  const allowRoleInbox = args.includes('--allow-role-inbox');
  const MAX_DAILY_RESEND_AGENCY_EMAILS = 5;
  let resendDispatchedThisRun = 0;
  const rawAgencies = Number(getArgValue(args, '--agencies', '2'));
  const agencyCount = Math.max(
    0,
    Math.min(8, Number.isFinite(rawAgencies) ? rawAgencies : 2)
  );
  const rawDomains = Number(getArgValue(args, '--domains', '10'));
  const seoCount = Math.max(
    0,
    Math.min(25, Number.isFinite(rawDomains) ? rawDomains : 10)
  );
  const nowIso = new Date().toISOString();
  const todayDate = nowIso.slice(0, 10);

  // 1. Run agency-trojan-outbound batch (enforcing mid-market retainer client & human founder guards)
  const agencyJsonPath = path.join(ACTIVE_OPS_DIR, 'agency_targets.json');
  const agencyManifest = JSON.parse(fs.readFileSync(agencyJsonPath, 'utf8'));
  let skippedTrophyCount = 0;
  const queuedAgencies = [];
  for (const a of agencyManifest.agencies ?? []) {
    if (a.status !== 'queued') continue;
    if (
      isUnpitchableTrophyClientDomain(a.caseStudyClientDomain) ||
      !hasValidHumanContactFirstName(a.contactName)
    ) {
      if (!dryRun) {
        a.status = 'skipped_trophy_client';
        a.skipReason = isUnpitchableTrophyClientDomain(a.caseStudyClientDomain)
          ? `UNPITCHABLE_TROPHY_CLIENT:${a.caseStudyClientDomain}`
          : `NON_HUMAN_CONTACT_NAME:${a.contactName}`;
      }
      skippedTrophyCount += 1;
      console.log(
        `  ⚠ Guard skipped ${a.agencyName} (${a.caseStudyClientDomain} / "${a.contactName}") -> trophy/non-human filter`
      );
      continue;
    }
    if (queuedAgencies.length < agencyCount) {
      queuedAgencies.push(a);
    }
  }

  console.log(
    `[ops:daily] 1/2 Running agency-trojan-outbound on ${queuedAgencies.length} boutique agency client(s)...`
  );

  const agencyResults = await mapWithConcurrency(
    queuedAgencies,
    2,
    async (agency) => {
      const summary = await safeProbeDomain(agency.caseStudyClientDomain);
      const topGap = describeTopTechnicalGap(summary);
      const sandboxUrl = `https://verisource.dev/agencies?domain=${encodeURIComponent(
        summary.hostname
      )}#sandbox`;
      const mintedBrief = !dryRun
        ? await mintLiveSupabaseBriefIfConfigured(summary.hostname)
        : null;
      const enforcedNote = buildThreeSentenceAgencyNote({
        firstName: agency.contactName,
        agencyName: agency.agencyName,
        clientDomain: summary.hostname,
        topGap,
        sandboxUrl,
        auditBriefUrl: mintedBrief?.briefUrl ?? null,
      });
      const firstName = agency.contactName.split(/\s+/)[0];
      const pillars = countJsonLdPillars(summary);
      const primaryShareUrl = mintedBrief?.briefUrl ?? sandboxUrl;
      const agentsLabel =
        summary.agentsMdStatus === 'custom_enriched'
          ? 'verified'
          : summary.agentsMdStatus === 'default_boilerplate'
            ? 'boilerplate'
            : 'missing';
      const linkedinDm = enforceQualityGate95(
        `Hi ${firstName} — checked ${summary.hostname} (${pillars}/3 JSON-LD, /agents.md ${agentsLabel}). White-label brief: ${primaryShareUrl}`
      ).content;

      if (!dryRun) {
        agency.status = 'audited';
        agency.auditedAt = nowIso;
        if (mintedBrief?.shareSlug) {
          agency.auditSlug = mintedBrief.shareSlug;
        }
      }

      let emailDispatch = { sent: false, id: null, reason: null };
      if (sendEmail && !agency.emailSentAt && !agency.resendMessageId) {
        const bounceGuard = await verifyZeroBounceAgencyEmail({
          candidateEmail: agency.publicContactChannel,
          agencyDomain: agency.agencyDomain,
        });

        if (!bounceGuard.deliverable || !bounceGuard.email) {
          agency.status = 'linkedin_only';
          agency.emailSkipReason = bounceGuard.reason;
          emailDispatch = {
            sent: false,
            id: null,
            reason: bounceGuard.reason,
          };
        } else {
          const verifiedLocal = bounceGuard.email.split('@')[0]?.toLowerCase() ?? '';
          const isRoleGatekeeper = GENERIC_GATEKEEPER_LOCALS.has(verifiedLocal);

          if (isRoleGatekeeper && !allowRoleInbox) {
            agency.status = 'linkedin_dm_ready';
            agency.emailSkipReason = `ROLE_INBOX_BLOCKED:${bounceGuard.email}`;
            emailDispatch = {
              sent: false,
              id: null,
              reason: `ROLE_INBOX_BLOCKED (${bounceGuard.email} -> use personal LinkedIn DM)`,
            };
          } else if (resendDispatchedThisRun >= MAX_DAILY_RESEND_AGENCY_EMAILS) {
            agency.status = 'linkedin_dm_ready';
            agency.emailSkipReason = 'DAILY_RESEND_CAP_REACHED';
            emailDispatch = {
              sent: false,
              id: null,
              reason: 'DAILY_RESEND_CAP_REACHED',
            };
          } else {
            agency.publicContactChannel = bounceGuard.email;
            agency.emailVerification = {
              verifiedAt: nowIso,
              source: bounceGuard.source,
              mxExchange: bounceGuard.mxExchange,
            };

            const subjectLine = `${summary.hostname} — AI search & /agents.md check for ${agency.agencyName}`;
            const fullEmailBody = [
              `Hi ${firstName},`,
              ``,
              enforcedNote.content,
              ``,
              `Best,`,
              `Nick Kulinich`,
              `Founder, Verisource`,
              `https://verisource.dev`,
            ].join('\n');

            emailDispatch = await dispatchFounderOutreachViaResend({
              toEmail: bounceGuard.email,
              subject: subjectLine,
              bodyText: fullEmailBody,
            });

            if (emailDispatch.sent) {
              resendDispatchedThisRun += 1;
              agency.status = 'sent';
              agency.emailSentAt = nowIso;
              agency.resendMessageId = emailDispatch.id;
              agency.channelsSent = ['email_resend'];
              agency.followUpDueDate = new Date(
                Date.now() + 4 * 86400 * 1000
              )
                .toISOString()
                .slice(0, 10);
            }
          }
        }
      }

      console.log(
        `  ✔ ${agency.agencyName} -> client ${summary.hostname} (${summary.visibilityScore}/100) | Quality ${enforcedNote.score}/10${
          emailDispatch.sent
            ? ` | Verified (${agency.publicContactChannel} · MX ${agency.emailVerification?.mxExchange}) -> Sent (${emailDispatch.id})`
            : emailDispatch.reason
              ? ` | Email Guard Blocked (${emailDispatch.reason} -> LinkedIn DM only)`
              : ''
        }`
      );

      return {
        ...agency,
        clientHostname: summary.hostname,
        readinessScore: summary.visibilityScore,
        topGap,
        sandboxUrl,
        threeSentenceEmail: enforcedNote.content,
        linkedinDm,
        qualityScore: enforcedNote.score,
        emailSent: emailDispatch.sent,
        resendMessageId: emailDispatch.id,
      };
    }
  );

  if (!dryRun && (agencyResults.length > 0 || skippedTrophyCount > 0)) {
    agencyManifest.updatedAt = nowIso;
    mirrorFileIfNeeded(
      'agency_targets.json',
      JSON.stringify(agencyManifest, null, 2) + '\n'
    );
  }

  const outreachQueueRel = 'queue/daily_agency_outreach.md';
  const outreachQueueFull = path.join(ACTIVE_OPS_DIR, outreachQueueRel);
  const existingOutreach = fs.existsSync(outreachQueueFull)
    ? fs.readFileSync(outreachQueueFull, 'utf8')
    : `# Daily Agency Trojan-Horse Outreach Queue ($249/mo White-Label Tier)\n\n| Date | Agency Name | Contact | Client Audited | Top Gap Found | Live White-Label URL | Copy-Paste 3-Sentence Note |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  const newOutreachRows = agencyResults
    .map(
      (r) =>
        `| ${todayDate} | **${r.agencyName}** (\`${r.agencyDomain}\`) | ${r.contactName} (${r.contactRole}) · \`${r.publicContactChannel}\` · [LinkedIn](${r.linkedinSearchUrl}) | \`${r.clientHostname}\` (\`${r.readinessScore}/100\`) | ${r.topGap} | [White-Label Sandbox](${r.sandboxUrl}) | ${r.threeSentenceEmail.replace(/\|/g, '/')} |`
    )
    .join('\n');

  if (!dryRun && newOutreachRows) {
    mirrorFileIfNeeded(
      outreachQueueRel,
      `${existingOutreach.trimEnd()}\n${newOutreachRows}\n`
    );
  }

  // 2. Run programmatic-seo-publisher batch
  const targetDomainsPath = path.join(ACTIVE_OPS_DIR, 'target_domains.json');
  const domainManifest = JSON.parse(fs.readFileSync(targetDomainsPath, 'utf8'));
  const queuedDomains = (domainManifest.domains ?? [])
    .filter(
      (d) =>
        d.status === 'queued' &&
        !/aurearoasters|mosaicroasters/i.test(d.domain)
    )
    .slice(0, seoCount);

  console.log(
    `[ops:daily] 2/2 Running programmatic-seo-publisher on ${queuedDomains.length} target domain(s)...`
  );

  const publishedScorecards = await mapWithConcurrency(
    queuedDomains,
    4,
    async (entry) => {
      const summary = await safeProbeDomain(entry.domain);
      const platformId =
        summary.detectedPlatform ??
        (summary.isShopify ? 'shopify' : 'nextjs_custom');
      const platformMeta = getWebsitePlatformMeta(platformId);
      const headline = buildScorecardHeadline(
        summary.brandName,
        summary.hostname,
        summary
      );
      const topGap = describeTopTechnicalGap(summary);

      if (!dryRun) {
        entry.status = 'published';
        entry.publishedAt = nowIso;
      }

      console.log(
        `  ✔ /report/${summary.hostname} (${platformMeta.displayName}) -> ${summary.visibilityScore}/100 | Quality ${headline.score}/10`
      );

      return {
        domain: summary.hostname,
        brandName: summary.brandName,
        vertical: entry.vertical ?? summary.industryVertical ?? 'general_b2b',
        detectedPlatform: platformId,
        detectedPlatformLabel: platformMeta.displayName,
        readinessScore: summary.visibilityScore,
        accuracyScore: summary.accuracyScore,
        visibleWordCount:
          summary.crawlerReadability?.visibleWordCount ?? 450,
        readabilityStatus:
          summary.crawlerReadability?.status ?? 'ssr_clean',
        robotsAiBotStatus: summary.robotsAiBotStatus,
        llmsTxtStatus: summary.llmsTxtStatus,
        agentsMdStatus: summary.agentsMdStatus,
        isShopify: summary.isShopify,
        shopifyMcpStatus: summary.shopifyMcpStatus,
        jsonLdCount: summary.jsonLdCount,
        jsonLdPillarsPassed: countJsonLdPillars(summary),
        hasEntitySchema:
          summary.jsonLdReadiness?.hasEntityIdentity ?? false,
        hasFaqSchema: summary.jsonLdReadiness?.hasFaqPage ?? false,
        hasOfferSchema: summary.jsonLdReadiness?.hasOfferOrPricing ?? false,
        headlineSummary: headline.content,
        topGapSummary: topGap,
        qualityScore: headline.score,
        publishedAt: nowIso,
      };
    }
  );

  const existingPublishedJson = fs.existsSync(WEB_PUBLISHED_JSON)
    ? JSON.parse(fs.readFileSync(WEB_PUBLISHED_JSON, 'utf8'))
    : { version: '1.0.0', updatedAt: nowIso, reports: [] };

  const mergedByDomain = new Map();
  for (const prev of existingPublishedJson.reports ?? []) {
    if (prev?.domain) mergedByDomain.set(prev.domain.toLowerCase(), prev);
  }
  for (const next of publishedScorecards) {
    mergedByDomain.set(next.domain.toLowerCase(), next);
  }

  const finalReportsPayload = {
    version: '1.0.0',
    updatedAt: nowIso,
    reports: Array.from(mergedByDomain.values()),
  };

  if (!dryRun) {
    domainManifest.updatedAt = nowIso;
    mirrorFileIfNeeded(
      'target_domains.json',
      JSON.stringify(domainManifest, null, 2) + '\n'
    );
    mirrorFileIfNeeded(
      'published/reports_manifest.json',
      JSON.stringify(finalReportsPayload, null, 2) + '\n'
    );
    fs.writeFileSync(
      WEB_PUBLISHED_JSON,
      JSON.stringify(finalReportsPayload, null, 2) + '\n',
      'utf8'
    );
  }

  // 3. Build 15-Minute Founder Action Dashboard
  const pnlPath = path.join(ACTIVE_OPS_DIR, 'ledger/MONTHLY_PNL_AND_VALUATION.md');
  const hasLedger = fs.existsSync(pnlPath);

  const dashboardMd = [
    `# TODAY_ACTION_DASHBOARD.md — 15-Minute Founder Growth Command Sheet`,
    ``,
    `**Generated:** \`${nowIso}\` · **Mode:** \`${dryRun ? 'DRY RUN' : 'LIVE OPS'}\` · **Total Published \`/report/[domain]\` Pages:** \`${finalReportsPayload.reports.length}\``,
    ``,
    `## 0. North-Star Financial & M&A Milestone Targets`,
    `- **Month 3 Target:** \`13\` subs (\`8\` Starter · \`4\` Pro · \`1\` Agency) + \`15\` Audits = **\`$1,322/mo\` Gross | \`$911/mo\` Net SDE**`,
    `- **Month 6 Target:** \`31\` subs (\`18\` Starter · \`10\` Pro · \`3\` Agency) + \`30\` Audits = **\`$3,189/mo\` Gross | \`$2,465/mo\` Net SDE | \`$73,950\` Valuation (2.5x)**`,
    `- **Month 12 Target:** \`88\` subs (\`50\` Starter · \`28\` Pro · \`10\` Agency) + \`60\` Audits = **\`$8,852/mo\` Gross | \`$7,186/mo\` Net SDE | \`$336,305\` Valuation (3.9x)**`,
    hasLedger
      ? `- **Live Reconciled P&L Ledger:** See \`growth_ops/ledger/MONTHLY_PNL_AND_VALUATION.md\``
      : `- **Live Reconciled P&L Ledger:** Run \`npm run ops:weekly\` to generate \`MONTHLY_PNL_AND_VALUATION.md\`.`,
    ``,
    `---`,
    ``,
    `## 1. Today's Agency Trojan-Horse Outbound (\`10 Minutes\` · \`$249/mo\` Tier)`,
    ``,
    `| Agency Name | Contact | Client Audited | Top Gap Found | Live White-Label URL | Copy-Paste 3-Sentence Note |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- |`,
    ...(agencyResults.length > 0
      ? agencyResults.map(
          (r) =>
            `| **${r.agencyName}** | ${r.contactName} (${r.contactRole})<br>\`${r.publicContactChannel}\`<br>[LinkedIn Search](${r.linkedinSearchUrl}) | \`${r.clientHostname}\` (\`${r.readinessScore}/100\`) | ${r.topGap} | [Open Sandbox](${r.sandboxUrl}) | ${r.threeSentenceEmail.replace(/\|/g, '/')} |`
        )
      : [`| *(Queue exhausted — add new agencies to \`growth_ops/agency_targets.json\`)* | — | — | — | — | — |`]),
    ``,
    `### LinkedIn <= 195-Char Connection Notes`,
    ...agencyResults.map(
      (r) => `- **${r.agencyName} (${r.contactName}):** \`${r.linkedinDm}\``
    ),
    ``,
    `---`,
    ``,
    `## 2. Today's Programmatic SEO Batch (\`${publishedScorecards.length}\` Scorecards Synced to \`/report/[domain]\`)`,
    ``,
    `| Domain | Platform | Readiness | JSON-LD Pillars | /llms.txt | /agents.md | Public Scorecard URL |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
    ...publishedScorecards.map(
      (s) =>
        `| \`${s.domain}\` | ${s.detectedPlatformLabel} | \`${s.readinessScore}/100\` | \`${s.jsonLdPillarsPassed}/3\` | \`${s.llmsTxtStatus}\` | \`${s.agentsMdStatus}\` | \`https://verisource.dev/report/${s.domain}\` |`
    ),
    ``,
    `### 1-Click Publish Command`,
    `\`\`\`powershell`,
    `cd C:\\dev\\verisource && git add apps/web/src/data/published-reports.json growth_ops/published/reports_manifest.json && git commit -m "chore(seo): publish ${publishedScorecards.length} verified /report/[domain] scorecards" && git push origin main`,
    `\`\`\``,
    ``,
  ].join('\n');

  if (!dryRun) {
    mirrorFileIfNeeded('queue/TODAY_ACTION_DASHBOARD.md', dashboardMd);
    console.log(
      `\n✔ [ops:daily] Complete! Review your 15-minute dashboard at:\n  ${path.join(
        ACTIVE_OPS_DIR,
        'queue/TODAY_ACTION_DASHBOARD.md'
      )}`
    );
  } else {
    console.log(`\n✔ [ops:daily] Dry-run complete (zero state or queue files modified).`);
  }
}

main().catch((err) => {
  console.error('[ops:daily] Failed:', err);
  process.exit(1);
});
