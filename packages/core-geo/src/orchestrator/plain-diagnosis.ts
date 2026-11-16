import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type {
  AgentsMdStatus,
  LlmsTxtStatus,
  RobotsAiBotStatus,
  ShopifyMcpStatus,
} from '../db/types.js';
import type { CrawlerReadabilityReport } from '../scanner/bot-waf-prober.js';
import type { RecommendedRemediationEnv } from '../scanner/cms-detector.js';

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
