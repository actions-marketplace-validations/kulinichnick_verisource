import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type {
  AgentsMdStatus,
  DomainRow,
  GeneratedFixRow,
  LlmsTxtStatus,
  RobotsAiBotStatus,
  ShopifyMcpStatus,
} from '../db/types.js';
import type { CrawlerReadabilityReport } from '../scanner/bot-waf-prober.js';
import type { RecommendedRemediationEnv } from '../scanner/cms-detector.js';
import type {
  AiRemediationTargetEnv,
  LiveFixCheckItem,
  LiveFixVerificationReport,
} from './audit-domain.js';

export type PlainDiagnosisActionTarget =
  | 'confirm_truth_step1'
  | 'copy_ai_fix_prompt_step2'
  | 'build_vs_page_step2'
  | 'offsite_citations_step3';

export interface PlainDiagnosisIssue {
  id:
    | 'bots_blocked'
    | 'js_blank_page'
    | 'wrong_ai_facts'
    | 'missing_ai_files'
    | 'rivals_shortlisted_ahead'
    | 'all_core_healthy';
  severity: 'fix_first' | 'high_impact' | 'healthy';
  badgeLabel: string;
  whatIsWrong: string;
  whyItMatters: string;
  howToFixPlain: string;
  actionLabel: string;
  actionTarget: PlainDiagnosisActionTarget;
}

export interface PlainEnglishSiteDiagnosisInput {
  brandName: string;
  hostname: string;
  visibilityScore: number;
  accuracyScore: number;
  robotsAiBotStatus: RobotsAiBotStatus;
  llmsTxtStatus: LlmsTxtStatus;
  agentsMdStatus: AgentsMdStatus;
  jsonLdCount: number;
  isShopify?: boolean;
  shopifyMcpStatus?: ShopifyMcpStatus;
  crawlerReadability?: CrawlerReadabilityReport | null;
  hallucinationCount?: number;
  isTruthVerified?: boolean;
  brandMentionedInSample?: boolean;
  topRivals?: string[];
}

export interface PlainEnglishSiteDiagnosis {
  headline: string;
  plainTakeaway: string;
  issueCount: number;
  issues: PlainDiagnosisIssue[];
}

export function buildPlainEnglishSiteDiagnosis(
  input: PlainEnglishSiteDiagnosisInput
): PlainEnglishSiteDiagnosis {
  const issues: PlainDiagnosisIssue[] = [];
  const brand = input.brandName.trim() || input.hostname;
  const host = input.hostname.trim().toLowerCase();

  // 1. Blocked AI Search Bots or Firewall Challenge
  const blockedBots: string[] = [];
  if (!input.robotsAiBotStatus.GPTBot) blockedBots.push('GPTBot (ChatGPT)');
  if (!input.robotsAiBotStatus['OAI-SearchBot']) {
    blockedBots.push('OAI-SearchBot (ChatGPT Search)');
  }
  if (!input.robotsAiBotStatus.PerplexityBot) {
    blockedBots.push('PerplexityBot');
  }
  if (!input.robotsAiBotStatus.ClaudeBot) blockedBots.push('ClaudeBot');
  if (
    input.robotsAiBotStatus['Google-Extended'] === false
  ) {
    blockedBots.push('Google-Extended (Gemini)');
  }

  if (blockedBots.length > 0 || input.robotsAiBotStatus.waf_blocked) {
    const blockedText =
      blockedBots.length > 0
        ? blockedBots.join(', ')
        : 'AI search crawlers (firewall challenge)';
    issues.push({
      id: 'bots_blocked',
      severity: 'fix_first',
      badgeLabel: 'FIX FIRST · AI BLOCKED',
      whatIsWrong: `${host} is blocking ${blockedText} from opening your pages.`,
      whyItMatters:
        'When ChatGPT or Perplexity cannot read your website, they either leave your business out of buyer recommendations or copy outdated info from third-party directories.',
      howToFixPlain:
        'Open Step 02 and copy the 1-Click AI Fix Prompt into your AI tool (Claude, ChatGPT, Antigravity, or Cursor) to update robots.txt and firewall rules.',
      actionLabel: 'Fix With 1-Click AI Prompt →',
      actionTarget: 'copy_ai_fix_prompt_step2',
    });
  }

  // 2. Client-Side JavaScript Blank Page Trap / HTML Bloat
  if (input.crawlerReadability?.status === 'csr_js_trap') {
    issues.push({
      id: 'js_blank_page',
      severity: 'fix_first',
      badgeLabel: 'FIX FIRST · BLANK TO AI BOTS',
      whatIsWrong: `AI crawlers only see ${input.crawlerReadability.visibleWordCount} words on ${host} because your main text loads inside browser JavaScript.`,
      whyItMatters:
        'Human visitors see your full page, but fast AI crawlers like GPTBot and PerplexityBot do not run heavy JavaScript—so your products and prices look nearly empty to them.',
      howToFixPlain:
        'Copy the Step 02 1-Click AI Fix Prompt into Claude, Cursor, Antigravity, or ChatGPT so your AI renders your core offer and pricing directly in server HTML.',
      actionLabel: 'Fix With 1-Click AI Prompt →',
      actionTarget: 'copy_ai_fix_prompt_step2',
    });
  } else if (input.crawlerReadability?.status === 'low_signal_bloat') {
    issues.push({
      id: 'js_blank_page',
      severity: 'high_impact',
      badgeLabel: 'PAGE CLARITY ISSUE',
      whatIsWrong: `Your page code on ${host} is heavy on scripts and light on clear, readable text (${input.crawlerReadability.signalToHtmlPct}% text-to-code ratio).`,
      whyItMatters:
        'AI answer engines favor pages where pricing, services, and buyer FAQs sit near the top in clean text and structured tables.',
      howToFixPlain:
        'Use the Step 02 1-Click AI Fix Prompt to add clean structured business facts and an Answer-First FAQ section to your site.',
      actionLabel: 'Fix With 1-Click AI Prompt →',
      actionTarget: 'copy_ai_fix_prompt_step2',
    });
  }

  // 3. Wrong AI Pricing or Policy Claims (Hallucinations)
  const conflictCount = input.hallucinationCount ?? 0;
  if (conflictCount > 0 || input.accuracyScore < 85) {
    issues.push({
      id: 'wrong_ai_facts',
      severity: 'fix_first',
      badgeLabel:
        conflictCount > 0
          ? `FIX FIRST · ${conflictCount} WRONG AI CLAIM${conflictCount === 1 ? '' : 'S'}`
          : 'FIX FIRST · FACT DRIFT',
      whatIsWrong: `AI engines are stating inaccurate prices, policies, or service details about ${brand} (${input.accuracyScore}% fact accuracy).`,
      whyItMatters:
        'High-intent buyers comparing vendors in ChatGPT or Gemini move on to a competitor when AI quotes the wrong price or claims you lack a feature you actually offer.',
      howToFixPlain:
        'Confirm your real prices and rules in "Your Real Business Facts" in Step 01, then copy the Step 02 1-Click AI Fix Prompt to publish those facts onto your site.',
      actionLabel: 'Confirm Real Prices & Facts ↓',
      actionTarget: 'confirm_truth_step1',
    });
  }

  // 4. Missing AI Fact-Sheet Files (JSON-LD, /llms.txt, /agents.md)
  const missingParts: string[] = [];
  if (input.jsonLdCount < 2) {
    missingParts.push(
      input.jsonLdCount === 0
        ? 'structured business & FAQ schema (JSON-LD)'
        : 'FAQ & offer schema (JSON-LD)'
    );
  }
  if (input.llmsTxtStatus === 'missing') {
    missingParts.push('an AI site directory (/llms.txt)');
  }
  if (input.agentsMdStatus === 'missing') {
    missingParts.push('an AI instruction rulebook (/agents.md)');
  } else if (input.agentsMdStatus === 'default_boilerplate') {
    missingParts.push(
      'custom business facts inside /agents.md (currently generic template text)'
    );
  }

  if (missingParts.length > 0) {
    issues.push({
      id: 'missing_ai_files',
      severity: issues.length === 0 ? 'fix_first' : 'high_impact',
      badgeLabel: 'MISSING AI FACT FILES',
      whatIsWrong: `${host} is missing ${missingParts.join(', ')}.`,
      whyItMatters:
        'These files act as an official nutrition label for AI search engines—without them, ChatGPT, Gemini, and Perplexity have to guess what you sell and how much it costs.',
      howToFixPlain: `Verisource has already written these exact files for ${brand}. Open Step 02 and click "Copy Prompt for My AI" so Claude, ChatGPT, Antigravity, Cursor, or Shopify installs all of them for you—no manual coding needed.`,
      actionLabel: 'Copy 1-Click AI Fix Prompt →',
      actionTarget: 'copy_ai_fix_prompt_step2',
    });
  }

  // 5. Competitors Getting Recommended Ahead of the Brand
  const cleanRivals = (input.topRivals ?? [])
    .map((r) => r.trim())
    .filter((r) => r.length > 0 && r.toLowerCase() !== brand.toLowerCase());

  if (
    input.brandMentionedInSample === false ||
    (cleanRivals.length > 0 && input.visibilityScore < 78)
  ) {
    const rivalPreview =
      cleanRivals.length > 0
        ? cleanRivals.slice(0, 3).join(', ')
        : 'competing businesses';
    const firstRival = cleanRivals[0] ?? 'Competitors';
    issues.push({
      id: 'rivals_shortlisted_ahead',
      severity: 'high_impact',
      badgeLabel: 'WIN MORE BUYER CLICKS',
      whatIsWrong:
        input.brandMentionedInSample === false
          ? `When buyers ask AI who to pick in your category, AI recommends ${rivalPreview} and leaves ${brand} out.`
          : `AI engines are recommending ${rivalPreview} alongside or ahead of ${brand} (${input.visibilityScore}/100 AI Visibility).`,
      whyItMatters:
        'AI search visitors convert at 14.2%–15.9% (over 5x Google organic traffic), yet AI answers usually name only 2–3 businesses per buyer question.',
      howToFixPlain: `First publish your Step 02 AI Fix Prompt, then click "Build ${brand} vs. ${firstRival} Page" in Step 02 so AI engines have a clear side-by-side comparison table to cite.`,
      actionLabel: `Build ${brand} vs. ${firstRival} Page →`,
      actionTarget: 'build_vs_page_step2',
    });
  }

  const realIssueCount = issues.length;

  if (realIssueCount === 0) {
    return {
      headline: `${brand} passes every core on-site AI readiness check (${input.visibilityScore}/100 Visibility).`,
      plainTakeaway: `AI search bots can read ${host}, your structured JSON-LD, /llms.txt, and /agents.md fact files are live, and no pricing mistakes were flagged. Next step: publish vs.-competitor comparison pages in Step 02 and win third-party review mentions in Step 03.`,
      issueCount: 0,
      issues: [
        {
          id: 'all_core_healthy',
          severity: 'healthy',
          badgeLabel: 'ALL CORE CHECKS LIVE',
          whatIsWrong: `No technical blockers or wrong pricing claims detected on ${host}.`,
          whyItMatters:
            'Because your core AI files are already live, your biggest growth lever is publishing structured buyer comparison pages and earning mentions on Reddit, G2, and industry roundups.',
          howToFixPlain:
            'Use Step 02 Comparison Page Studio to launch a vs.-competitor page, or open Step 03 to see which third-party articles AI trusts in your niche.',
          actionLabel: 'Open Step 03 Competitor Sources →',
          actionTarget: 'offsite_citations_step3',
        },
      ],
    };
  }

  const headline =
    realIssueCount === 1
      ? `We found 1 clear fix to help AI engines recommend ${brand} accurately.`
      : `We found ${realIssueCount} things holding ${brand} back in ChatGPT, Gemini & Perplexity.`;

  const plainTakeaway =
    'You do not need to read raw code or edit files by hand: Verisource bundles every website fix below into one ready-made prompt you paste into Claude, ChatGPT, Antigravity, Cursor, or Shopify.';

  return {
    headline,
    plainTakeaway,
    issueCount: realIssueCount,
    issues,
  };
}

export interface AnalyticsInstallAiPromptParams {
  brandName: string;
  hostname: string;
  isShopify: boolean;
  browserPixelSnippet: string;
  shopifyCheckoutPixel?: string;
  edgeCrawlerSnippet?: string;
}

export function buildAnalyticsInstallAiPrompt(
  params: AnalyticsInstallAiPromptParams
): EnforcedQualityArtifact {
  const sections: string[] = [
    `# Task: Install Optional Verisource AI Visitor & Bot Tracking on ${params.hostname}`,
    '',
    `Please install the lightweight Verisource attribution tag on **${params.brandName}** (\`https://${params.hostname}\`) so we can see human visits and purchases coming from \`chatgpt.com\`, \`perplexity.ai\`, \`gemini.google.com\`, and \`claude.ai\`.`,
    '',
    '## Rules',
    '1. Keep the token string and `https://verisource.dev/api/pixel` endpoint unchanged.',
    '2. Load the browser tag once in the shared site layout before `</head>` so page speed is unaffected.',
    '3. Tell me which file you updated (or exact click-by-click steps if I use a no-code builder like Webflow, WordPress, Wix, Squarespace, or Shopify).',
    '',
    '## 1. Browser AI Visit & Conversion Tag (Paste before `</head>`)',
    '```html',
    params.browserPixelSnippet.trim(),
    '```',
  ];

  if (params.isShopify && params.shopifyCheckoutPixel) {
    sections.push(
      '',
      '## 2. Shopify Checkout Order Value Tracker (Shopify Admin -> Settings -> Customer events -> Add custom pixel)',
      '```javascript',
      params.shopifyCheckoutPixel.trim(),
      '```'
    );
  } else if (params.edgeCrawlerSnippet) {
    sections.push(
      '',
      '## 2. Optional Server / Edge AI Bot Crawl Logger (`GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`)',
      'Only add this if the codebase uses Next.js `middleware.ts` or a Cloudflare Worker; skip if this is a static or CMS site:',
      '```typescript',
      params.edgeCrawlerSnippet.trim(),
      '```'
    );
  }

  return enforceQualityGate95(sections.join('\n'), 'agents_md');
}

export interface PublicAiPromptTeaserInput {
  brandName: string;
  hostname: string;
  targetEnv: RecommendedRemediationEnv;
  robotsAiBotStatus: RobotsAiBotStatus;
  llmsTxtStatus: LlmsTxtStatus;
  agentsMdStatus: AgentsMdStatus;
  jsonLdCount: number;
  isShopify?: boolean;
  hallucinationDetected?: boolean;
}

export interface PublicAiPromptTeaser {
  targetEnv: RecommendedRemediationEnv;
  envBadgeLabel: string;
  whereToPasteLine: string;
  visibleHeaderText: string;
  redactedPayloadLines: string[];
  qualityScore: number;
}

export function buildPublicAiPromptTeaser(
  input: PublicAiPromptTeaserInput
): PublicAiPromptTeaser {
  const host = input.hostname.trim().toLowerCase();
  const brand = input.brandName.trim() || host;

  const blockedBots: string[] = [];
  if (!input.robotsAiBotStatus.GPTBot) blockedBots.push('GPTBot');
  if (!input.robotsAiBotStatus['OAI-SearchBot']) {
    blockedBots.push('OAI-SearchBot');
  }
  if (!input.robotsAiBotStatus.PerplexityBot) {
    blockedBots.push('PerplexityBot');
  }
  if (!input.robotsAiBotStatus.ClaudeBot) blockedBots.push('ClaudeBot');

  const actionsToApply: string[] = [];
  if (blockedBots.length > 0 || input.robotsAiBotStatus.waf_blocked) {
    actionsToApply.push(
      `allow ${
        blockedBots.length > 0 ? blockedBots.join(', ') : 'AI search crawlers'
      } in /robots.txt`
    );
  }
  if (input.jsonLdCount < 2) {
    actionsToApply.push('inject Organization + FAQPage JSON-LD in <head>');
  }
  if (input.agentsMdStatus !== 'custom_enriched') {
    actionsToApply.push(
      input.targetEnv === 'webflow_cms' ||
        input.targetEnv === 'wix_squarespace_framer'
        ? 'publish /ai-facts brand & pricing rules'
        : input.targetEnv === 'shopify_liquid'
          ? 'deploy templates/agents.md.liquid + /pages/ai-facts'
          : 'publish /agents.md brand & pricing rules'
    );
  }
  if (input.llmsTxtStatus !== 'present') {
    actionsToApply.push(
      input.targetEnv === 'webflow_cms' ||
        input.targetEnv === 'wix_squarespace_framer'
        ? 'add <link rel="alternate" type="text/markdown" href="/ai-facts">'
        : 'publish /llms.txt crawler directory'
    );
  }
  if (input.hallucinationDetected) {
    actionsToApply.push('correct wrong AI pricing claims');
  }
  if (actionsToApply.length === 0) {
    actionsToApply.push(
      'refresh JSON-LD FAQPage schema & build a You vs. Competitor comparison page'
    );
  }

  let envBadgeLabel = 'CODING AGENT (ANTIGRAVITY · CLAUDE · CURSOR)';
  let whereToPasteLine =
    'Paste this prompt into Cursor, Claude Code, Windsurf, or Antigravity so your coding agent writes the files directly into your repo.';
  let usesAiFactsPage = false;

  switch (input.targetEnv) {
    case 'wordpress_cms':
      envBadgeLabel = 'WORDPRESS (WPCODE · RANKMATH · YOAST)';
      whereToPasteLine =
        'Paste this prompt into ChatGPT or Claude—it walks you step by step through WPCode Header Injection and publishing /agents.md + /llms.txt on WordPress.';
      break;
    case 'webflow_cms':
      envBadgeLabel = 'WEBFLOW (CUSTOM CODE + /AI-FACTS)';
      whereToPasteLine =
        'Paste this prompt into ChatGPT or Claude—it gives exact Webflow Site Settings -> Custom Code -> Head snippets, your /ai-facts page, and 301 Redirect rules.';
      usesAiFactsPage = true;
      break;
    case 'wix_squarespace_framer':
      envBadgeLabel = 'WIX · SQUARESPACE · FRAMER (/AI-FACTS)';
      whereToPasteLine =
        'Paste this prompt into ChatGPT or Claude—it walks you through Header Code Injection plus a /ai-facts page so no root file upload is needed.';
      usesAiFactsPage = true;
      break;
    case 'shopify_liquid':
      envBadgeLabel = 'SHOPIFY THEME (LIQUID + UCP)';
      whereToPasteLine =
        'Paste this prompt into Shopify Sidekick, ChatGPT, Claude, or Cursor to add layout/theme.liquid JSON-LD and templates/agents.md.liquid.';
      break;
    case 'chat_assistant':
      envBadgeLabel = 'CHATGPT / CLAUDE WEB (NO-CODE STEP-BY-STEP)';
      whereToPasteLine =
        'Paste this prompt into ChatGPT or Claude Web—your AI assistant explains exactly where to paste each block in your website dashboard.';
      break;
    case 'coding_agent':
    default:
      break;
  }

  const rawVisibleLines = [
    `# Task: Fix AI Search Visibility & Verified Brand Facts on ${host}`,
    `Target Website: https://${host} (${brand})`,
    `Mode: ${envBadgeLabel}`,
    `Rule 1: Lock every price, plan, and service area strictly to ${brand}'s verified facts—do not invent discounts or unverified claims.`,
    `Rule 2: Apply ${actionsToApply.join(' + ')}.`,
  ].join('\n');

  const enforced = enforceQualityGate95(rawVisibleLines, 'agents_md');

  const redactedPayloadLines = usesAiFactsPage
    ? [
        `## 1. Validated JSON-LD Graph (<script type="application/ld+json">{"@context":"https://schema.org","@graph":[/* console-locked */]}</script>)`,
        `## 2. Hosted Builder AI Rulebook (/ai-facts -> <article class="verisource-ai-facts">/* verified-pricing-locked */</article>)`,
        `## 3. Alternate Markdown Feed (<link rel="alternate" type="text/markdown" href="/ai-facts"> + 301 redirect rules)`,
      ]
    : input.targetEnv === 'shopify_liquid'
      ? [
          `## 1. Storefront Offer & Product JSON-LD (layout/theme.liquid -> {"@context":"https://schema.org","@type":"Organization" /* locked */})`,
          `## 2. Shopify Agent Truth Override (templates/agents.md.liquid + /pages/ai-facts /* verified-sku-rules-locked */)`,
          `## 3. Canonical Storefront Directory (/llms.txt + /api/ucp/mcp commerce verification checklist)`,
        ]
      : [
          `## 1. Validated JSON-LD Entity & FAQPage Graph (<script type="application/ld+json">{"@context":"https://schema.org" /* locked */}</script>)`,
          `## 2. Verified Brand & Pricing Rulebook (/agents.md -> /* verified-pricing-and-exclusions-locked */)`,
          `## 3. Canonical AI Crawler Directory (/llms.txt -> /* canonical-routes-and-faq-locked */)`,
        ];

  return {
    targetEnv: input.targetEnv,
    envBadgeLabel,
    whereToPasteLine,
    visibleHeaderText: enforced.content,
    redactedPayloadLines,
    qualityScore: enforced.score,
  };
}

export interface VerificationCheckGuidance {
  id: LiveFixCheckItem['id'];
  label: string;
  live: boolean;
  statusDetail: string;
  troubleshootingTip: string;
}

export interface FollowUpVerificationAiPromptResult {
  allVerified: boolean;
  liveCount: number;
  remainingCount: number;
  remainingCheckIds: Array<LiveFixCheckItem['id']>;
  checkGuidance: VerificationCheckGuidance[];
  prompt: EnforcedQualityArtifact;
}

export interface BuildFollowUpVerificationAiPromptInput {
  domain: Pick<
    DomainRow,
    | 'brand_name'
    | 'domain_url'
    | 'is_shopify'
    | 'brand_truth_sheet'
    | 'visibility_score'
    | 'accuracy_score'
  >;
  verification: LiveFixVerificationReport;
  fixes: Array<
    Pick<
      GeneratedFixRow,
      | 'fix_type'
      | 'title'
      | 'content_payload'
      | 'is_applied'
      | 'natural_quality_score'
    >
  >;
  targetEnv?: AiRemediationTargetEnv;
}

function buildPlatformTroubleshootingTip(
  checkId: LiveFixCheckItem['id'],
  live: boolean,
  mode: AiRemediationTargetEnv,
  host: string
): string {
  if (live) {
    switch (checkId) {
      case 'json_ld':
        return `Verified live on https://${host}—keep existing <script type="application/ld+json"> tags intact.`;
      case 'llms_txt':
        return `Verified live—AI search bots can read your site directory feed without errors.`;
      case 'agents_md':
        return `Verified live—custom brand pricing and policy rules are exposed to AI crawlers.`;
      case 'crawler_waf':
        return `Verified live—GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot receive HTTP 200.`;
    }
  }

  switch (checkId) {
    case 'json_ld':
      if (mode === 'webflow_cms') {
        return `Open Webflow Site Settings -> Custom Code -> Head Code, confirm both Organization and FAQPage <script type="application/ld+json"> blocks are saved, then click Publish to Selected Domains.`;
      }
      if (mode === 'wix_squarespace_framer') {
        return `Paste the <script type="application/ld+json"> block into site-wide Header Code Injection (not a draft page) and click Publish so live HTML includes 2+ schema.org nodes.`;
      }
      if (mode === 'wordpress_cms') {
        return `Confirm your WPCode Header snippet is switched to Active and purge WP Rocket, LiteSpeed, Autoptimize, or Cloudflare page cache.`;
      }
      if (mode === 'shopify_liquid') {
        return `Confirm <script type="application/ld+json"> is saved inside layout/theme.liquid before </head> on your Live Published Theme (not an unpublished draft theme).`;
      }
      return `Confirm your production deploy completed and root <head> outputs both Organization/Product and FAQPage <script type="application/ld+json"> blocks on https://${host}.`;

    case 'llms_txt':
      if (mode === 'webflow_cms' || mode === 'wix_squarespace_framer') {
        return `Add <link rel="alternate" type="text/markdown" href="/ai-facts" /> in site-wide Head Code, map a 301 redirect from /llms.txt -> /ai-facts, and click Publish.`;
      }
      if (mode === 'wordpress_cms') {
        return `Upload llms.txt to your WordPress public web root (or 301-redirect /llms.txt -> /ai-facts with <link rel="alternate" type="text/markdown" href="/ai-facts" />) and clear cache.`;
      }
      if (mode === 'shopify_liquid') {
        return `Publish /pages/ai-facts with <link rel="alternate" type="text/markdown" href="/pages/ai-facts" /> in layout/theme.liquid or serve https://${host}/llms.txt at the edge.`;
      }
      return `Serve https://${host}/llms.txt with HTTP 200 and Content-Type: text/plain or text/markdown (avoid SPA HTML fallback pages).`;

    case 'agents_md':
      if (mode === 'webflow_cms' || mode === 'wix_squarespace_framer') {
        return `Publish a public https://${host}/ai-facts page wrapping your Brand Truth Markdown inside <article class="verisource-ai-facts">...</article>, add <link rel="alternate" type="text/markdown" href="/ai-facts" /> in <head>, and 301-redirect /agents.md -> /ai-facts.`;
      }
      if (mode === 'wordpress_cms') {
        return `Upload agents.md to your public web root (or publish <article class="verisource-ai-facts"> on /ai-facts linked via <link rel="alternate" type="text/markdown" href="/ai-facts" />) and purge cache.`;
      }
      if (mode === 'shopify_liquid') {
        return `Save templates/agents.md.liquid (or publish /pages/ai-facts wrapped in <article class="verisource-ai-facts"> with <link rel="alternate" type="text/markdown" href="/pages/ai-facts" /> in <head>) to replace stock Shopify boilerplate.`;
      }
      return `Serve custom Brand Truth Markdown at https://${host}/agents.md with HTTP 200 and link <link rel="alternate" type="text/markdown" href="/agents.md" /> in <head>.`;

    case 'crawler_waf':
      if (mode === 'webflow_cms' || mode === 'wix_squarespace_framer') {
        return `Check your builder's SEO -> robots.txt settings so GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot have Allow: /, then republish your site.`;
      }
      if (mode === 'wordpress_cms') {
        return `Check RankMath / Yoast robots.txt rules and disable Cloudflare or Wordfence bot challenges on public URLs for GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot.`;
      }
      if (mode === 'shopify_liquid') {
        return `Check templates/robots.txt.liquid and edge WAF rules so GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot receive HTTP 200 on public product and policy routes.`;
      }
      return `Allow GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot in /robots.txt and exempt verified AI search crawlers from HTTP 403/429 WAF challenges.`;
  }
}

export function buildFollowUpVerificationAiPrompt(
  input: BuildFollowUpVerificationAiPromptInput
): FollowUpVerificationAiPromptResult {
  const { domain, verification, fixes } = input;
  const host =
    verification.hostname.trim().toLowerCase() ||
    domain.domain_url
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0] ||
    'site';
  const brand = domain.brand_name.trim() || verification.brandName || host;
  const mode: AiRemediationTargetEnv =
    input.targetEnv ??
    (domain.is_shopify || verification.isShopify
      ? 'shopify_liquid'
      : 'coding_agent');
  const isNoRootFileBuilder =
    mode === 'webflow_cms' || mode === 'wix_squarespace_framer';

  const checkGuidance: VerificationCheckGuidance[] = verification.checks.map(
    (chk) => ({
      id: chk.id,
      label: chk.label,
      live: chk.live,
      statusDetail: chk.detail,
      troubleshootingTip: buildPlatformTroubleshootingTip(
        chk.id,
        chk.live,
        mode,
        host
      ),
    })
  );

  const liveChecks = checkGuidance.filter((c) => c.live);
  const remainingChecks = checkGuidance.filter((c) => !c.live);
  const remainingIds = new Set(remainingChecks.map((c) => c.id));

  if (remainingChecks.length === 0) {
    const completeLines: string[] = [
      `# All 4 Core AI Readiness Checks Verified Live — ${brand} (${host})`,
      '',
      `Keep every live check untouched. Verisource confirmed HTTP \`200\` readiness across \`JSON-LD\`, \`/llms.txt\`, \`/agents.md\`, and AI crawler access (\`GPTBot\`, \`OAI-SearchBot\`, \`PerplexityBot\`, \`ClaudeBot\`) on \`https://${host}\`.`,
      '',
      `## Guardrails for Future Deploys`,
      `- Preserve existing \`<script type="application/ld+json">\` blocks, \`/llms.txt\`, \`/agents.md\` (or \`/ai-facts\`), and \`robots.txt\` \`Allow: /\` rules.`,
      `- Lock all future pricing and fulfillment copy strictly to verified truth: **${domain.brand_truth_sheet.verified_pricing_summary || `${brand} published pricing`}** (${domain.brand_truth_sheet.shipping_or_service_area || 'published coverage'}).`,
      `- Next high-converting step: open **AI Citation & Rival Comparison Page Studio** in Verisource Step 02 to publish a structured \`<table>\` comparison route.`,
    ];

    return {
      allVerified: true,
      liveCount: liveChecks.length,
      remainingCount: 0,
      remainingCheckIds: [],
      checkGuidance,
      prompt: enforceQualityGate95(completeLines.join('\n'), 'agents_md'),
    };
  }

  const roleInstruction =
    mode === 'shopify_liquid'
      ? `Act as my Senior Shopify Liquid & Technical SEO Engineer for **${brand}** (\`https://${host}\`). Finish only the remaining unverified AI readiness items below on the Live Published Theme without altering working files.`
      : mode === 'wordpress_cms'
        ? `Act as my Senior WordPress & Technical SEO Engineer for **${brand}** (\`https://${host}\`). Give me exact WordPress Admin clicks (WPCode, RankMath/Yoast, File Manager, and cache purge steps) to finish only the remaining unverified items below.`
        : mode === 'webflow_cms'
          ? `Act as my Senior Webflow & Technical SEO Specialist for **${brand}** (\`https://${host}\`). Guide me through Webflow **Site Settings -> Custom Code -> Head Code**, a public \`/ai-facts\` page containing \`<article class="verisource-ai-facts">\`, **301 Redirects**, and clicking **Publish to Selected Domains** for the remaining items below.`
          : mode === 'wix_squarespace_framer'
            ? `Act as my Senior No-Code Website Specialist for **${brand}** (\`https://${host}\`). Walk me step by step through site-wide Header Code Injection, a public \`/ai-facts\` page wrapped in \`<article class="verisource-ai-facts">\`, 301 redirects, and clicking **Publish** for the remaining items below.`
            : mode === 'chat_assistant'
              ? `Act as my Senior Web Implementation Engineer for **${brand}** (\`https://${host}\`). Walk me step by step through finishing only the remaining unverified items below inside my website dashboard.`
              : `Act as a Principal Full-Stack & Technical SEO Engineer inside the repository for **${brand}** (\`https://${host}\`). Implement and deploy only the remaining unverified items below without breaking existing routes or live checks.`;

  const lines: string[] = [
    `# Targeted Follow-Up AI Fix Prompt — ${brand} (${host})`,
    '',
    `Publish only the missing items below. Verisource scanned \`https://${host}\` live and confirmed **${liveChecks.length} of 4** checks are already active while **${remainingChecks.length} of 4** still need deployment or cache clearing.`,
    '',
    roleInstruction,
    '',
    `## 1. Do Not Break Already-Live Checks (${liveChecks.length}/4 Passing)`,
  ];

  if (liveChecks.length === 0) {
    lines.push(
      `- \`0/4\` checks were detected on the live domain yet—confirm you published changes to your production domain (\`https://${host}\`) rather than a staging preview URL.`
    );
  } else {
    for (const passed of liveChecks) {
      lines.push(
        `- **[KEEP INTACT · LIVE]** **${passed.label}:** ${passed.statusDetail}.`
      );
    }
  }

  lines.push(
    '',
    `## 2. Remaining Checks to Fix Now (${remainingChecks.length}/4 Still Needed)`
  );

  for (const pending of remainingChecks) {
    lines.push(
      `- **[STILL NEEDED]** **${pending.label}** — Live scan result: *${pending.statusDetail}*. **Fix:** ${pending.troubleshootingTip}`
    );
  }

  lines.push(
    '',
    `## 3. Verified Brand Facts (Zero Invented Claims)`,
    `- **Core Offering:** ${domain.brand_truth_sheet.core_offering || `${brand} products and services.`}`,
    `- **Verified Pricing:** ${domain.brand_truth_sheet.verified_pricing_summary || 'Use live published pricing only.'}`,
    `- **Fulfillment / Coverage:** ${domain.brand_truth_sheet.shipping_or_service_area || 'Use live published coverage terms only.'}`
  );

  if (
    domain.brand_truth_sheet.discontinued_or_false_claims_to_flag.length > 0
  ) {
    lines.push(
      `- **Never State These Claims:** ${domain.brand_truth_sheet.discontinued_or_false_claims_to_flag.join(' | ')}`
    );
  }

  lines.push('', `## 4. Exact Payloads for Remaining Items Only`);

  if (
    isNoRootFileBuilder &&
    (remainingIds.has('llms_txt') || remainingIds.has('agents_md'))
  ) {
    lines.push(
      '',
      `### Hosted Builder Rule (\`/ai-facts\` + \`<head>\` Link)`,
      `Place the Markdown blocks below inside an HTML Embed wrapped in \`<article class="verisource-ai-facts">...</article>\` on \`https://${host}/ai-facts\`, add \`<link rel="alternate" type="text/markdown" href="/ai-facts" title="${brand} Verified AI Truth" />\` to site-wide \`<head>\` custom code, set 301 redirects from \`/llms.txt\` and \`/agents.md\` -> \`/ai-facts\`, and click **Publish**.`
    );
  }

  if (remainingIds.has('crawler_waf')) {
    lines.push(
      '',
      `### Remaining Item — Allow AI Search Bots in \`/robots.txt\` & Firewall`,
      'Ensure `/robots.txt` includes these explicit allow rules on public routes and remove HTTP `403`/`429` bot blocks:',
      '```txt',
      ...[
        'GPTBot',
        'OAI-SearchBot',
        'PerplexityBot',
        'ClaudeBot',
        'Google-Extended',
      ].flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
      `Sitemap: https://${host}/sitemap.xml`,
      '```'
    );
  }

  const targetedFixes = fixes.filter((fix) => {
    if (fix.fix_type === 'json_ld_schema') {
      return remainingIds.has('json_ld');
    }
    if (fix.fix_type === 'fanout_faq_block') {
      return remainingIds.has('json_ld') && !verification.hasFaqSchema;
    }
    if (fix.fix_type === 'llms_txt') {
      return remainingIds.has('llms_txt');
    }
    if (fix.fix_type === 'shopify_agents_liquid') {
      return (
        remainingIds.has('agents_md') &&
        (mode === 'shopify_liquid' ||
          domain.is_shopify ||
          verification.isShopify)
      );
    }
    if (fix.fix_type === 'agents_md') {
      if (!remainingIds.has('agents_md')) return false;
      const hasShopifyLiquid = fixes.some(
        (f) => f.fix_type === 'shopify_agents_liquid'
      );
      if (
        hasShopifyLiquid &&
        (mode === 'shopify_liquid' ||
          domain.is_shopify ||
          verification.isShopify)
      ) {
        return false;
      }
      return true;
    }
    return false;
  });

  targetedFixes.forEach((fix, idx) => {
    const codeFence =
      fix.fix_type === 'json_ld_schema'
        ? 'json'
        : fix.fix_type === 'shopify_agents_liquid'
          ? 'liquid'
          : 'markdown';
    lines.push(
      '',
      `### Remaining Artifact ${idx + 1}: ${fix.title}`,
      `\`\`\`${codeFence}`,
      fix.content_payload.trim(),
      `\`\`\``
    );
  });

  lines.push(
    '',
    `## 5. Final Publish & Cache Check`,
    `1. Validate any \`application/ld+json\` block with \`JSON.parse()\` so zero trailing commas or syntax errors exist.`,
    `2. Publish to your live production domain (\`https://${host}\`) and purge any CMS/CDN page cache.`,
    `3. Return to Verisource Console Step 02 and click **Verify Live Fixes** to confirm \`4/4\` live checks.`
  );

  return {
    allVerified: false,
    liveCount: liveChecks.length,
    remainingCount: remainingChecks.length,
    remainingCheckIds: remainingChecks.map((c) => c.id),
    checkGuidance,
    prompt: enforceQualityGate95(lines.join('\n'), 'agents_md'),
  };
}
