export interface CompetitorComparisonRow {
  criterion: string;
  verisourceValue: string;
  competitorValue: string;
  verisourceAdvantage: boolean;
}

export interface GtmFaqItem {
  question: string;
  answer: string;
}

export interface CompetitorAlternativeEntry {
  slug: string;
  competitorName: string;
  competitorPriceAnchor: string;
  eyebrow: string;
  headline: string;
  serifAccent: string;
  metaTitle: string;
  metaDescription: string;
  answerFirstSummary: string;
  whenToPickCompetitor: string[];
  whenToPickVerisource: string[];
  comparisonRows: CompetitorComparisonRow[];
  faqs: GtmFaqItem[];
}

export interface ProtocolGuideSection {
  heading: string;
  paragraphs: string[];
  codeTitle?: string;
  codeBlock?: string;
}

export interface ProtocolGuideEntry {
  slug: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  readingTime: string;
  answerFirstSummary: string;
  referenceTable: {
    headers: [string, string, string];
    rows: Array<[string, string, string]>;
  };
  sections: ProtocolGuideSection[];
  relatedToolSlug: FreeToolSlug;
  relatedToolLabel: string;
  faqs: GtmFaqItem[];
}

export type FreeToolSlug =
  | 'llms-txt-validator'
  | 'ai-crawler-waf-checker'
  | 'shopify-ai-readiness-checker'
  | 'json-ld-ai-schema-checker';

export interface FreeSeoToolEntry {
  slug: FreeToolSlug;
  shortName: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  answerFirstSummary: string;
  placeholderDomain: string;
  whatItChecks: string[];
  faqs: GtmFaqItem[];
}

export const COMPETITOR_ALTERNATIVES: readonly CompetitorAlternativeEntry[] = [
  {
    slug: 'profound-alternative',
    competitorName: 'Profound',
    competitorPriceAnchor: '$499–$2,000+/mo Enterprise Contracts',
    eyebrow: 'VERISOURCE VS. PROFOUND · 2026 BUYER COMPARISON',
    headline: 'A self-serve Profound alternative built to fix your site.',
    serifAccent: 'Starting at $0 for 7 days.',
    metaTitle:
      'Profound Alternative (2026): Self-Serve GEO, 1-Click Fixes & /mcp | Verisource',
    metaDescription:
      'Compare Verisource vs. Profound across pricing ($49–$249/mo vs. custom enterprise contracts), 7-CMS 1-Click AI Fix Prompts, /agents.md verification, and Streamable HTTP /mcp.',
    answerFirstSummary:
      'Verisource is a self-serve Profound alternative for B2B SaaS teams, Shopify brands, and SEO agencies priced from $49 to $249/month (with a $0 7-day trial). While Profound targets Fortune 500 enterprises with custom-quoted multi-region monitoring, Verisource pairs 3-engine citation tracking with ready-to-paste JSON-LD, /llms.txt, /agents.md, 7-CMS AI Fix Prompts, and a Streamable HTTP /mcp server.',
    whenToPickCompetitor: [
      'You manage a global Fortune 500 enterprise budget ($25,000+/year) requiring 50-country localized prompt seats and custom procurement.',
      'Your internal engineering team already maintains custom schema pipelines and only wants read-only executive share-of-voice reporting.',
    ],
    whenToPickVerisource: [
      'You want transparent self-serve pricing ($49 Starter, $99 Pro + MCP, $249 15-Client Agency) with a $0.00 due today 7-day trial.',
      'You want the software to generate syntax-validated JSON-LD, /llms.txt, /agents.md, and 1-Click AI Fix Prompts across Shopify, WordPress, Webflow, Wix, Squarespace, Framer, or Next.js.',
      'You run an agency closing $1,500–$3,000/mo retainers using branded /audit/[slug] client scorecards (+$0 per extra seat, 15 sites included).',
    ],
    comparisonRows: [
      {
        criterion: 'Public Pricing & Self-Serve Trial',
        verisourceValue:
          '$49 / $99 / $249 per month ($0 7-day trial on Starter & Pro; $19 one-time pass)',
        competitorValue:
          'Custom enterprise contracts; client workspaces billed around +$399/mo',
        verisourceAdvantage: true,
      },
      {
        criterion: 'On-Site Remediation Artifacts',
        verisourceValue:
          'Generates validated JSON-LD, /llms.txt, /agents.md, /ai-facts & You vs. Rival pages',
        competitorValue:
          'Primarily visibility & citation analytics; manual engineering implementation',
        verisourceAdvantage: true,
      },
      {
        criterion: '7-Platform Auto-Detected AI Fix Prompt',
        verisourceValue:
          'Auto-tailored 1-click prompt for Shopify, WordPress, Webflow, Wix/Squarespace/Framer & Code',
        competitorValue: 'Not included out of the box',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Closed-Loop Live HTTP Verification',
        verisourceValue:
          '1-click Verify Live Fixes probes HTTP 200, JSON-LD nodes, /agents.md & 5 AI bots',
        competitorValue: 'Waits for next scheduled prompt crawl cycle',
        verisourceAdvantage: true,
      },
      {
        criterion: 'White-Label Agency Pitch Links',
        verisourceValue:
          '15 client domains + 60s branded /audit/[slug] briefs + bot-filtered open alerts ($249/mo)',
        competitorValue: 'Enterprise agency partner custom pricing',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Native Streamable HTTP /mcp Server',
        verisourceValue:
          'Live at https://mcp.verisource.dev/mcp (Cursor, Claude, Windsurf, Antigravity)',
        competitorValue: 'Proprietary enterprise integrations',
        verisourceAdvantage: true,
      },
    ],
    faqs: [
      {
        question: 'How much does Verisource cost compared to Profound?',
        answer:
          'Verisource starts with a free instant website audit, a $19 One-Time Audit Pass, and recurring plans at $49/month (Starter), $99/month (Pro + MCP), and $249/month (15-Client Agency White-Label), with a $0 7-day trial on monthly Starter and Pro. Profound focuses on custom-quoted enterprise contracts.',
      },
      {
        question: 'Does Verisource track AI crawler visits and AI-referred revenue like Agent Analytics?',
        answer:
          'Yes. Verisource includes both a 10-line origin-verified browser attribution pixel (plus a sandboxed Shopify Customer Events checkout pixel) and an HMAC-signed Edge AI Bot Crawl Logger for GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot.',
      },
      {
        question: 'Can non-technical teams deploy Verisource fixes without a developer?',
        answer:
          'Yes. Verisource fingerprints your CMS (WordPress, Webflow, Wix, Squarespace, Framer, Shopify, or custom code) and builds a single 1-Click AI Fix Prompt you paste into ChatGPT, Claude, or your site builder.',
      },
    ],
  },
  {
    slug: 'otterly-ai-alternative',
    competitorName: 'Otterly.ai',
    competitorPriceAnchor: 'Read-Only Prompt Tracking Tiers',
    eyebrow: 'VERISOURCE VS. OTTERLY.AI · 2026 BUYER COMPARISON',
    headline: 'An Otterly.ai alternative that fixes why AI skips you.',
    serifAccent: 'Read-write execution vs. passive charts.',
    metaTitle:
      'Otterly.ai Alternative (2026): Hallucination Watchdog & 1-Click Fixes | Verisource',
    metaDescription:
      'Compare Verisource vs. Otterly.ai: move beyond passive AI prompt rank tracking to Brand Truth hallucination diffs, 7-CMS JSON-LD + /agents.md fixes, and /mcp tools.',
    answerFirstSummary:
      'Verisource is a read-write Otterly.ai alternative built for businesses and agencies that want to fix missing citations rather than only watch prompt rank charts. Alongside ChatGPT, Gemini, and Perplexity tracking, Verisource catches false pricing claims, probes GPTBot and PerplexityBot WAF blocks, and outputs validated JSON-LD, /llms.txt, and /agents.md fixes.',
    whenToPickCompetitor: [
      'You only want a lightweight entry-level dashboard to observe prompt mentions and plan to write all schema.org JSON-LD, /llms.txt, and comparison pages manually.',
    ],
    whenToPickVerisource: [
      'You want an automated Brand Truth Watchdog that alerts you when ChatGPT or Perplexity invents wrong prices, shipping minimums, or discontinued features.',
      'You want 1-click generated JSON-LD, /llms.txt, /agents.md, and rival comparison pages verified live over HTTP.',
      'You need white-label /audit/[slug] prospect scorecards ($249/mo for 15 sites) or Shopify /api/ucp/mcp commerce diagnostics.',
    ],
    comparisonRows: [
      {
        criterion: 'Core Architecture',
        verisourceValue:
          'Read-Write Action Engine (3-engine tracking + automated site & off-site fixes)',
        competitorValue: 'Read-only prompt monitoring & visibility reporting',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Brand Pricing & Fact Hallucination Watchdog',
        verisourceValue:
          'Auto-drafted Brand Truth Sheet + claim diffing + weekly Resend drift alerts',
        competitorValue: 'Manual review of recorded prompt text',
        verisourceAdvantage: true,
      },
      {
        criterion: 'AI Crawler WAF & Non-JS DOM Inspection',
        verisourceValue:
          'Probes GPTBot & PerplexityBot HTTP 403 challenges + Sub-Page SSR token density',
        competitorValue: 'Basic domain audit checks',
        verisourceAdvantage: true,
      },
      {
        criterion: 'You vs. Competitor Comparison Page Studio',
        verisourceValue:
          'Generates truth-locked HTML comparison tables + FAQPage JSON-LD + live route verifier',
        competitorValue: 'Not included',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Shopify /api/ucp/mcp & Stock /agents.md Check',
        verisourceValue:
          'Detects stock Shopify boilerplate & generates templates/agents.md.liquid overrides',
        competitorValue: 'Not included',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Developer MCP Server (/mcp)',
        verisourceValue:
          'Stateless Streamable HTTP MCP server for Cursor, Claude & Antigravity',
        competitorValue: 'Not included',
        verisourceAdvantage: true,
      },
    ],
    faqs: [
      {
        question: 'What is the biggest difference between Otterly.ai and Verisource?',
        answer:
          'Otterly.ai focuses on monitoring prompt answers, whereas Verisource combines 3-engine monitoring with technical execution: flagging false pricing claims, testing GPTBot and PerplexityBot WAF rules, and generating ready-to-publish JSON-LD, /llms.txt, /agents.md, and competitor comparison pages.',
      },
      {
        question: 'Can I test Verisource on one website without a recurring subscription?',
        answer:
          'Yes. Alongside the free homepage audit and $0 7-day trial on monthly Starter ($49/mo) and Pro ($99/mo), Verisource offers a $19 One-Time Audit Pass with zero recurring billing.',
      },
    ],
  },
  {
    slug: 'peec-ai-alternative',
    competitorName: 'Peec AI',
    competitorPriceAnchor: '~$95–$495/mo Monitoring Tiers',
    eyebrow: 'VERISOURCE VS. PEEC AI · 2026 BUYER COMPARISON',
    headline: 'A Peec AI alternative with built-in code fixes & /mcp.',
    serifAccent: 'Half the price on Starter, 10x the execution.',
    metaTitle:
      'Peec AI Alternative (2026): Read-Write GEO, Comparison Studio & /mcp | Verisource',
    metaDescription:
      'Compare Verisource vs. Peec AI: get multi-engine rival Share-of-Voice plus 1-Click AI Fix Prompts, Competitor Technical X-Ray, and Streamable HTTP /mcp starting at $49/mo.',
    answerFirstSummary:
      'Verisource is an action-first Peec AI alternative starting at $49/month ($99/month for Pro + MCP across 3 domains, vs. Peec AI plans scaling from ~$95 to $495+/month). In addition to Mention vs. Citation Rate % and Rival Share-of-Voice, Verisource ships Competitor Technical X-Ray diffs, Comparison Page Studio, and a live Streamable HTTP /mcp server.',
    whenToPickCompetitor: [
      'You are a European PLG team looking strictly for a clean visibility monitoring dashboard and already handle technical SEO, schema markup, and editorial outreach separately.',
    ],
    whenToPickVerisource: [
      'You want 3 tracked websites, 100 weekly prompts, Competitor Technical X-Ray, and 1,000 monthly /mcp agent credits for $99/mo ($79/mo annual).',
      'You want Step 02 to hand your developer or coding agent (Cursor, Claude Code, Antigravity) exact JSON-LD, /llms.txt, /agents.md, and /compare/brand-vs-rival payloads.',
      'You want categorized off-site playbooks for Reddit, G2, and editorial roundups rather than raw URL lists.',
    ],
    comparisonRows: [
      {
        criterion: 'Entry & Multi-Domain Pricing',
        verisourceValue:
          '$49/mo Starter (1 site) · $99/mo Pro + MCP (3 sites) · $249/mo Agency (15 sites)',
        competitorValue:
          'Starts around ~$95/mo (1 project) scaling to ~$245–$795/mo for larger & agency tiers',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Live Competitor Technical X-Ray',
        verisourceValue:
          'Side-by-side HTTP diff across 5 AI bots, SSR tokens, JSON-LD @types, /llms.txt & /agents.md',
        competitorValue: 'Tracks prompt share-of-voice; no live HTTP protocol diff',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Automated On-Site & Rival Page Generation',
        verisourceValue:
          '1-Click AI Fix Prompts + Rival Comparison Page Studio + live HTTP verifier',
        competitorValue: 'Monitoring & insights only',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Channel-Intelligent Citation Playbooks',
        verisourceValue:
          'Tailored playbooks for Reddit/HN (disclosed), G2/Clutch, Rival Counter-Pages & Press',
        competitorValue: 'Lists cited third-party domains without execution templates',
        verisourceAdvantage: true,
      },
      {
        criterion: 'IDE & Agent Integration (/mcp)',
        verisourceValue:
          'Official MCP Registry dev.verisource/mcp@1.0.0 over stateless Streamable HTTP',
        competitorValue: 'Web dashboard workflow',
        verisourceAdvantage: true,
      },
    ],
    faqs: [
      {
        question: 'Does Verisource separate Mention Rate from Citation Rate like Peec AI?',
        answer:
          'Yes. Step 01 separates Brand Mention Rate % from linked Citation Rate %, tracks Brand Sentiment framing (Recommended, Neutral, Cautionary), and calculates Head-to-Head Rival Share of Voice across ChatGPT, Google Gemini, and Perplexity.',
      },
      {
        question: 'Can my engineering team pull Verisource data directly inside Cursor or Claude Code?',
        answer:
          'Yes. Every Pro ($99/mo) and Agency ($249/mo) workspace can mint SHA-256 vs_live_ Bearer keys to call get_citation_gaps_and_fanouts, check_brand_hallucinations, and generate_geo_fix_bundle at https://mcp.verisource.dev/mcp.',
      },
    ],
  },
  {
    slug: 'athenahq-alternative',
    competitorName: 'AthenaHQ',
    competitorPriceAnchor: '$295+/mo Starter Credit Plans',
    eyebrow: 'VERISOURCE VS. ATHENAHQ · 2026 BUYER COMPARISON',
    headline: 'An AthenaHQ alternative at one-third the monthly cost.',
    serifAccent: '15 agency client sites for less than 1 AthenaHQ seat.',
    metaTitle:
      'AthenaHQ Alternative (2026): $99 Pro + MCP & $249 15-Site Agency GEO | Verisource',
    metaDescription:
      'Compare Verisource vs. AthenaHQ: get action-oriented JSON-LD, /llms.txt, /agents.md, 7-CMS AI Fix Prompts, and 15-client white-label pitch links at $49–$249/mo vs. $295+/mo.',
    answerFirstSummary:
      'Verisource is a streamlined AthenaHQ alternative that delivers automated JSON-LD, /llms.txt, /agents.md, and 7-platform CMS remediation at $49–$99/month (or $249/month for 15 white-label agency client domains), compared with AthenaHQ plans starting at $295/month. Verisource also adds native Shopify /api/ucp/mcp checks, white-label /audit/[slug] sales scorecards, and a stateless /mcp server.',
    whenToPickCompetitor: [
      'Your team specifically needs monitoring across niche secondary chat models beyond ChatGPT, Google Gemini, and Perplexity and has a $3,500+/year single-brand software budget.',
    ],
    whenToPickVerisource: [
      'You want complete on-site protocol fixes, Hallucination Watchdog alerts, and 3 tracked domains at $99/mo—or 15 white-label agency client domains for $249/mo ($46/mo less than a single $295/mo AthenaHQ starter plan).',
      'Your clients run on Webflow, Wix, Squarespace, Framer, WordPress, or Shopify and need platform-specific /ai-facts and 1-Click AI Fix Prompts.',
      'You want a Chrome Manifest V3 Side Panel extension (sidePanel + activeTab only) for instant live-tab inspections.',
    ],
    comparisonRows: [
      {
        criterion: 'Monthly Self-Serve Cost',
        verisourceValue:
          '$49/mo Starter · $99/mo Pro (3 domains) · $249/mo Agency (15 client domains)',
        competitorValue: 'Starts at $295/month for Starter credit plans',
        verisourceAdvantage: true,
      },
      {
        criterion: 'No-Root-File Builder Support (/ai-facts)',
        verisourceValue:
          'Auto-detects Webflow, Wix, Squarespace & Framer and verifies <article class="verisource-ai-facts">',
        competitorValue: 'Focuses on standard root robots.txt / llms.txt workflows',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Agency White-Label Sales Pipeline',
        verisourceValue:
          '10-domain Batch Mode + branded /audit/[slug] briefs + human open alerts + 3-touch CSVs',
        competitorValue: 'Not built around instant white-label cold prospecting links',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Shopify Universal Commerce Protocol',
        verisourceValue:
          'Probes /api/ucp/mcp + legacy /api/mcp + stock /agents.md + Custom Checkout Pixel',
        competitorValue: 'General e-commerce tracking',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Streamable HTTP /mcp Server',
        verisourceValue:
          'Included on Pro ($99/mo) & Agency ($249/mo) with 0-credit handshake tester',
        competitorValue: 'Dashboard-centric Action Center',
        verisourceAdvantage: true,
      },
    ],
    faqs: [
      {
        question: 'Why do agencies choose Verisource over $295/month single-brand GEO tools?',
        answer:
          'For $249/month ($16.60 per client site across 15 included slots), agencies get both fulfillment tools (1-Click AI Fix Prompts across 7 CMS platforms) and a client-acquisition engine that mints pure white-label /audit/[slug] scorecards with real-time prospect open alerts.',
      },
      {
        question: 'How does Verisource handle Webflow, Wix, or Squarespace sites that block root /agents.md uploads?',
        answer:
          'Verisource automatically switches to its /ai-facts verification specification, linking a structured HTML truth block via <link rel="alternate" type="text/markdown" href="/ai-facts"> in <head> so AI crawlers and Verify Live Fixes both score 4/4.',
      },
    ],
  },
  {
    slug: 'scrunch-ai-alternative',
    competitorName: 'Scrunch AI',
    competitorPriceAnchor: '$250+/mo Mid-Market Plans',
    eyebrow: 'VERISOURCE VS. SCRUNCH AI · 2026 BUYER COMPARISON',
    headline: 'A self-serve Scrunch AI alternative you can launch in 60 seconds.',
    serifAccent: 'Instant trial, live bot verification & /mcp.',
    metaTitle:
      'Scrunch AI Alternative (2026): Instant Trial, Sub-Page Bot Inspector & /mcp | Verisource',
    metaDescription:
      'Compare Verisource vs. Scrunch AI: start a $0 7-day trial in 60 seconds, inspect live GPTBot/PerplexityBot DOM extraction, and ship 1-Click AI Fix Prompts from $49/mo.',
    answerFirstSummary:
      'Verisource is an instant-onboarding Scrunch AI alternative starting at $49–$99/month with a $0 7-day free trial (compared with Scrunch AI mid-market plans starting around $250+/month). Verisource combines 3-engine Share-of-Voice and Brand Truth claim auditing with a live Sub-Page AI Bot Extraction Inspector, Comparison Page Studio, and Streamable HTTP /mcp tools.',
    whenToPickCompetitor: [
      'You are a mid-market enterprise looking for a sales-led vendor engagement with SOC 2 procurement workflows and dedicated account management at $3,000+/year.',
    ],
    whenToPickVerisource: [
      'You want to audit your domain right now in 60 seconds and deploy live JSON-LD, /llms.txt, and /agents.md fixes today without booking a sales call.',
      'You want to inspect exact non-JS HTML text streams extracted by GPTBot and PerplexityBot on /pricing and /compare/* sub-pages.',
      'You want native developer /mcp tools in Cursor, Claude Desktop, and Antigravity.',
    ],
    comparisonRows: [
      {
        criterion: 'Time to Value & Pricing',
        verisourceValue:
          '60-second unauthenticated scan + $0 7-day trial ($49 Starter / $99 Pro / $249 Agency)',
        competitorValue: 'Mid-market plans starting around $250+/mo',
        verisourceAdvantage: true,
      },
      {
        criterion: 'Sub-Page Non-JS AI Bot Inspector',
        verisourceValue:
          'Live GPTBot/1.2 & PerplexityBot/1.0 DOM inspector grading SSR text, <table> & JSON-LD',
        competitorValue: 'High-level site journey & visibility reporting',
        verisourceAdvantage: true,
      },
      {
        criterion: '1-Click CMS & Coding Agent Prompts',
        verisourceValue:
          'Platform-tailored remediation prompts + targeted follow-up prompts for remaining gaps',
        competitorValue: 'Manual implementation by internal web team',
        verisourceAdvantage: true,
      },
      {
        criterion: 'One-Time Non-Subscription Option',
        verisourceValue:
          '$19 One-Time Audit Pass (100% credited toward Month 1 within 7 days)',
        competitorValue: 'Recurring contracts only',
        verisourceAdvantage: true,
      },
    ],
    faqs: [
      {
        question: 'Can I verify that my developer actually fixed GPTBot and JSON-LD issues in real time?',
        answer:
          'Yes. Clicking Verify Live Fixes in Step 02 (and Verify Page Live in Comparison Page Studio) runs an immediate uncached HTTP and simulated bot check, updating your scorecard on the spot.',
      },
      {
        question: 'What happens if I cancel during the 7-day free trial?',
        answer:
          'Starter ($49/mo) and Pro + MCP ($99/mo) monthly plans charge $0.00 on Day 0 and can be canceled in one click inside the Stripe Billing Portal before Day 7 with zero charge.',
      },
    ],
  },
];

export const PROTOCOL_GUIDES: readonly ProtocolGuideEntry[] = [
  {
    slug: 'shopify-agents-md-ucp-mcp',
    eyebrow: 'SHOPIFY 2026 AGENTIC COMMERCE ENGINEERING GUIDE',
    title:
      'Shopify /api/ucp/mcp & agents.md Setup Guide: Fixing Stock Boilerplate for ChatGPT Shopping',
    metaTitle:
      'Shopify /api/ucp/mcp & agents.md Guide (2026): Replace Stock Boilerplate | Verisource',
    metaDescription:
      'How Shopify’s Universal Commerce Protocol (/api/ucp/mcp) and /agents.md work in 2026—and how to replace generic storefront boilerplate so ChatGPT and Perplexity cite real SKU prices.',
    readingTime: '6 min technical guide',
    answerFirstSummary:
      'Every modern Shopify storefront exposes a Universal Commerce Protocol endpoint at /api/ucp/mcp (replacing legacy /api/mcp) alongside a default /agents.md discovery file. However, stock Shopify /agents.md files ship generic platform boilerplate without your verified free-shipping thresholds, return exclusions, or brand differentiators—causing ChatGPT Shopping and Perplexity to guess or cite Reddit threads instead.',
    referenceTable: {
      headers: ['Shopify Endpoint / File', 'Default Storefront Behavior', 'Verisource Enriched Standard'],
      rows: [
        [
          'POST /api/ucp/mcp',
          'Exposes Universal Commerce Protocol catalog & cart JSON-RPC tools',
          'Verified reachable (HTTP 200) + paired with SKU-accurate Product JSON-LD',
        ],
        [
          'GET /agents.md',
          '76-line stock Shopify boilerplate referencing generic shop.app / mock.shop links',
          'Classified & upgraded via templates/agents.md.liquid or /pages/ai-facts alternate link',
        ],
        [
          'GET /llms.txt + <head> JSON-LD',
          'Often missing FAQPage, shipping thresholds, and explicit negative SKU guardrails',
          'Organization + Product + FAQPage @graph locked to verified storefront truth',
        ],
        [
          'Shopify Checkout Attribution',
          'Sandboxed Web Pixels run with Origin: null, breaking naive analytics scripts',
          'HMAC-derived checkout_key custom pixel logging exact AI-referred order USD',
        ],
      ],
    },
    sections: [
      {
        heading: '1. Why Stock Shopify /agents.md Costs You Commercial Citations',
        paragraphs: [
          'When Shopify rolled out the Universal Commerce Protocol (/api/ucp/mcp), storefronts automatically began serving a machine-readable /agents.md file. While helpful for basic cart discovery, the stock template contains zero merchant-specific shipping thresholds, regional fulfillment rules, bundle pricing, or discontinued-product exclusions.',
          'When a buyer asks ChatGPT or Perplexity a high-intent commercial question—such as whether your store offers free US shipping over $35 or sells subscription refills—AI engines skip generic boilerplate and fall back to outdated third-party blog posts or Reddit comments.',
        ],
      },
      {
        heading: '2. Linking a Verified Merchant Truth Feed on Shopify',
        paragraphs: [
          'Because Shopify manages root static paths, the cleanest 2026 pattern combines a custom templates/agents.md.liquid override (when supported by your theme routing) with a same-origin alternate Markdown discovery tag in layout/theme.liquid pointing to /pages/ai-facts wrapped in <article class="verisource-ai-facts">.',
        ],
        codeTitle: 'layout/theme.liquid (<head> Discovery + Verified Entity Graph)',
        codeBlock: `<!-- Paste inside <head> in Online Store -> Themes -> Edit code -> layout/theme.liquid -->
<link rel="alternate" type="text/markdown" href="{{ shop.url }}/pages/ai-facts" title="{{ shop.name }} Verified AI Brand Truth" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": {{ shop.name | json }},
  "url": {{ shop.url | json }},
  "description": "Verified catalog, shipping thresholds, and fulfillment policies published at {{ shop.url }}/pages/ai-facts."
}
</script>`,
      },
      {
        heading: '3. Tracking Sandboxed Shopify Checkout Sales from ChatGPT & Perplexity',
        paragraphs: [
          ' AI-referred shoppers convert at 14.2%–15.9% compared with 1.76%–2.8% on traditional organic search. Because Shopify Checkout Extensibility executes Custom Web Pixels inside a strict sandboxed worker (Origin: null), standard referrer scripts drop attribution at checkout.',
          'Verisource solves this by pairing a lightweight storefront <head> capture script (recording chatgpt.com, perplexity.ai, gemini.google.com, and claude.ai in localStorage) with an HMAC-authenticated Shopify Customer Events pixel that logs verified checkout_completed USD totals.',
        ],
      },
    ],
    relatedToolSlug: 'shopify-ai-readiness-checker',
    relatedToolLabel: 'Test Your Store in the Free Shopify /api/ucp/mcp Checker →',
    faqs: [
      {
        question: 'Did Shopify replace /api/mcp with /api/ucp/mcp?',
        answer:
          'Yes. Shopify transitioned legacy Storefront MCP (/api/mcp) catalog and cart actions to the Universal Commerce Protocol endpoint at /api/ucp/mcp. Verisource probes both endpoints automatically so legacy and UCP storefronts are graded accurately.',
      },
      {
        question: 'How do I check if my Shopify store serves generic /agents.md boilerplate?',
        answer:
          'Run your store domain through the free Verisource Shopify AI Readiness Checker at /tools/shopify-ai-readiness-checker. It classifies /agents.md into missing, default_boilerplate, or custom_enriched in under 5 seconds.',
      },
    ],
  },
  {
    slug: 'llms-txt-and-agents-md-setup',
    eyebrow: '7-PLATFORM CMS & HOSTED BUILDER PROTOCOL GUIDE',
    title:
      'How to Deploy /llms.txt, /agents.md & /ai-facts on WordPress, Webflow, Wix, Squarespace, Framer & Next.js',
    metaTitle:
      'How to Add /llms.txt & /agents.md to WordPress, Webflow, Wix, Squarespace & Next.js | Verisource',
    metaDescription:
      'Step-by-step 2026 deployment guide for /llms.txt, /agents.md, schema.org JSON-LD, and no-root-file /ai-facts alternate feeds across all 7 major website platforms.',
    readingTime: '7 min implementation guide',
    answerFirstSummary:
      'Code repositories (Next.js, Astro, Remix) and self-hosted WordPress sites can serve /llms.txt and /agents.md directly at the domain root. Hosted visual builders (Webflow, Wix, Squarespace, Framer, and Shopify) restrict arbitrary root static text files—which you solve cleanly using <link rel="alternate" type="text/markdown" href="/ai-facts"> in <head> paired with a semantic <article class="verisource-ai-facts"> page.',
    referenceTable: {
      headers: ['Website Platform', 'Root Static File Access?', 'Recommended Protocol Deployment'],
      rows: [
        [
          'Next.js / Custom Code',
          'Yes (public/ directory or route handlers)',
          'Serve /llms.txt + /agents.md at root + Organization/FAQPage JSON-LD in layout',
        ],
        [
          'WordPress',
          'Yes (SFTP / File Manager / plugin)',
          'WPCode Site-Wide Header JSON-LD + root /llms.txt & /agents.md + WAF bot allowlist',
        ],
        [
          'Webflow',
          'Restricted on root .md files',
          'Head Custom Code JSON-LD + alternate Markdown <link> + /ai-facts static page',
        ],
        [
          'Wix · Squarespace · Framer',
          'No root static file upload',
          'Header Code Injection JSON-LD + alternate Markdown <link> + /ai-facts truth page',
        ],
        [
          'Shopify',
          'Managed root paths',
          'layout/theme.liquid JSON-LD + templates/agents.md.liquid or /pages/ai-facts',
        ],
      ],
    },
    sections: [
      {
        heading: '1. What Difference Do /llms.txt and /agents.md Serve?',
        paragraphs: [
          'While schema.org JSON-LD gives search and answer crawlers strict typed entities (Organization, SoftwareApplication, Product, LocalBusiness, Dentist, LegalService, FAQPage), /llms.txt provides a concise canonical directory of your pricing, core routes, and product specifications.',
          'Meanwhile, /agents.md defines operational interaction rules, MCP endpoints (if exposed), commercial exclusions, and explicit negative guardrails ("We do NOT charge setup fees; we do NOT sell discontinued Tier X") that stop LLMs from guessing.',
        ],
      },
      {
        heading: '2. Solving Hosted Builders With the /ai-facts Alternate Link Pattern',
        paragraphs: [
          'If your marketing site runs on Webflow, Wix, Squarespace, or Framer, attempting to upload /agents.md at the root returns HTTP 404. Instead, declare a machine-discoverable alternate feed inside your global <head> custom code and wrap your verified fact sheet inside <article class="verisource-ai-facts"> at /ai-facts:',
        ],
        codeTitle: 'Universal Hosted-Builder Pattern (<head> + /ai-facts Body)',
        codeBlock: `<!-- 1. Global Header Code Injection (<head>) -->
<link rel="alternate" type="text/markdown" href="/ai-facts" title="Verified AI Brand & Pricing Specification" />

<!-- 2. Inside your published /ai-facts page HTML Embed -->
<article class="verisource-ai-facts">
  <h1>Acme Cloud — Verified AI Fact Sheet &amp; Pricing</h1>
  <p>Canonical Origin: https://acmecloud.io</p>
  <h2>Verified Plans (USD)</h2>
  <ul>
    <li>Starter: $49/month (zero setup fee)</li>
    <li>Pro: $99/month (includes API &amp; SSO)</li>
  </ul>
</article>`,
      },
      {
        heading: '3. Checking Edge WAF Rules for GPTBot, OAI-SearchBot & PerplexityBot',
        paragraphs: [
          'Even with clean /llms.txt and JSON-LD files, strict CDN bot-fight toggles frequently return HTTP 403 challenges to PerplexityBot and OAI-SearchBot despite /robots.txt allowing them. Always test both /robots.txt directives and live simulated bot User-Agent HTTP responses after publishing.',
        ],
      },
    ],
    relatedToolSlug: 'llms-txt-validator',
    relatedToolLabel: 'Validate Your /llms.txt, /agents.md & /ai-facts Live →',
    faqs: [
      {
        question: 'Should I allow OAI-SearchBot and PerplexityBot in robots.txt?',
        answer:
          'Yes—if you want your brand cited in real-time ChatGPT Search and Perplexity buyer recommendations, OAI-SearchBot and PerplexityBot must receive HTTP 200 responses on both /robots.txt and your key commercial pages.',
      },
      {
        question: 'Does Verisource write all of these files for my exact CMS automatically?',
        answer:
          'Yes. Verisource detects your CMS during the scan and generates both raw syntax-validated files and a single 1-Click AI Fix Prompt tailored to WordPress, Webflow, Wix/Squarespace/Framer, Shopify, or coding agents.',
      },
    ],
  },
  {
    slug: 'json-ld-faqpage-schema-for-ai-search',
    eyebrow: 'SCHEMA.ORG ENTITY, OFFER & FAQPAGE PROTOCOL GUIDE',
    title:
      'How to Structure Schema.org JSON-LD, FAQPage & Offer Graphs for ChatGPT, Gemini & Perplexity',
    metaTitle:
      'JSON-LD & FAQPage Schema for AI Search (2026): ChatGPT, Gemini & Perplexity Guide | Verisource',
    metaDescription:
      'Learn why 92.5% of public sites miss FAQPage JSON-LD and how typed Organization, Product/Offer, LocalBusiness, and FAQPage @graph blocks prevent AI pricing hallucinations.',
    readingTime: '6 min implementation guide',
    answerFirstSummary:
      'In our 2026 40-domain HTTP benchmark, 82.5% of websites shipped basic homepage JSON-LD, yet only 7.5% exposed FAQPage Q&A blocks alongside typed Offer pricing. Combining an Entity Identity node (Organization, SoftwareApplication, OnlineStore, or LocalBusiness), explicit Offer pricing, and 4–6 Answer-First FAQPage entities inside a single @graph gives ChatGPT Search, Google Gemini, and Perplexity verifiable facts to cite.',
    referenceTable: {
      headers: [
        'Business Vertical',
        'Required Primary @type Nodes',
        'High-Converting Offer & FAQPage Fields',
      ],
      rows: [
        [
          'B2B SaaS & DevTools',
          'Organization + SoftwareApplication + FAQPage',
          'Tiered Offer price/priceCurrency, free trial terms, SOC 2 / SSO facts, vs.-competitor FAQs',
        ],
        [
          'Shopify & D2C E-Commerce',
          'OnlineStore + Product + MerchantReturnPolicy + FAQPage',
          'SKU Offer availability, free-shipping threshold USD, return window days, fulfillment regions',
        ],
        [
          'Dental, Medical & MedSpa',
          'Dentist / MedicalClinic + LocalBusiness + FAQPage',
          'Accepted PPO insurance plans, new-patient exam fee, GeoCircle service area, studio hours',
        ],
        [
          'Legal, HVAC & Home Services',
          'LegalService / HomeAndConstructionBusiness + FAQPage',
          'Licensed service counties, consultation or dispatch fee structure, emergency SLA response time',
        ],
        [
          'SEO, Webflow & Shopify Agencies',
          'ProfessionalService + Service + Offer + FAQPage',
          'Monthly retainer floor, supported CMS stacks, deliverable turnaround time, case-study metrics',
        ],
      ],
    },
    sections: [
      {
        heading:
          '1. Why Basic Organization Schema Alone Leaves AI Engines Guessing',
        paragraphs: [
          'Default CMS SEO plugins typically emit a minimal Organization + WebSite JSON-LD snippet containing only your brand name and logo URL. When a buyer asks ChatGPT or Perplexity how much your product costs, whether you charge setup fees, or which insurance plans you accept, an empty Organization node forces the retrieval model to scrape unstructured prose or third-party review directories.',
          'Pairing your primary entity node with explicit Offer / OfferCatalog pricing and an Answer-First FAQPage node turns ambiguous marketing copy into deterministic key-value facts that non-JS crawlers (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot) parse in a single HTTP pass.',
        ],
      },
      {
        heading:
          '2. Production @graph Blueprint: Entity + Offer + FAQPage in One Block',
        paragraphs: [
          'Place a single syntax-validated <script type="application/ld+json"> @graph block inside your root <head> so every entity shares stable @id references and passes JSON.parse() with zero trailing commas:',
        ],
        codeTitle: 'Validated 3-Pillar @graph Specimen (Entity + Offer + FAQPage)',
        codeBlock: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://acmecloud.io/#app",
      "name": "Acme Cloud",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "url": "https://acmecloud.io",
      "offers": [
        {
          "@type": "Offer",
          "name": "Starter Plan",
          "price": "49.00",
          "priceCurrency": "USD"
        },
        {
          "@type": "Offer",
          "name": "Pro Plan",
          "price": "99.00",
          "priceCurrency": "USD"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://acmecloud.io/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Does Acme Cloud charge onboarding or setup fees?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Self-serve Starter ($49/month) and Pro ($99/month) workspaces include zero setup fees and a 7-day free trial."
          }
        }
      ]
    }
  ]
}
</script>`,
      },
      {
        heading:
          '3. Aligning JSON-LD With /agents.md and Visible Page Copy',
        paragraphs: [
          'Never stuff hidden claims into JSON-LD that contradict your visible pricing table or your /agents.md specification. Answer engines cross-check structured schema against visible server-rendered HTML and third-party directories—keeping all three surfaces locked to identical dollar figures eliminates pricing hallucinations.',
        ],
      },
    ],
    relatedToolSlug: 'json-ld-ai-schema-checker',
    relatedToolLabel: 'Test Your Live JSON-LD & FAQPage Graph Free →',
    faqs: [
      {
        question:
          'Does FAQPage JSON-LD still matter for AI search even after Google restricted classic FAQ rich snippets?',
        answer:
          'Yes. Even though Google narrowed classic SERP accordion rich results, LLM retrieval pipelines (ChatGPT Search, Google AI Overviews, Perplexity, and Claude) actively parse FAQPage Question and Answer pairs as high-confidence Q&A chunks for commercial buyer prompts.',
      },
      {
        question:
          'How do I add custom FAQPage and Offer JSON-LD on Webflow, WordPress, Wix, or Shopify without writing JSON by hand?',
        answer:
          'Scan your domain on Verisource to auto-detect your CMS and generate both a syntax-validated @graph JSON-LD block (tested via JSON.parse) and a 1-Click AI Fix Prompt tailored to your exact website platform.',
      },
    ],
  },
];

export const FREE_SEO_TOOLS: readonly FreeSeoToolEntry[] = [
  {
    slug: 'llms-txt-validator',
    shortName: '/llms.txt & /agents.md Validator',
    eyebrow: 'FREE ZERO-SIGNUP GEO PROTOCOL UTILITY',
    title: 'Free /llms.txt, /agents.md & /ai-facts Live Validator',
    metaTitle:
      'Free /llms.txt & /agents.md Validator (2026): Check AI Truth Files Live | Verisource',
    metaDescription:
      'Test any website live for /llms.txt, /agents.md, stock Shopify boilerplate traps, same-origin /ai-facts alternate links, and schema.org JSON-LD nodes in seconds.',
    answerFirstSummary:
      'Enter any public domain below to run a live HTTP check on /llms.txt, /agents.md, same-origin /ai-facts alternate Markdown links, and homepage schema.org JSON-LD entity nodes—with automatic 7-platform CMS detection.',
    placeholderDomain: 'linear.app',
    whatItChecks: [
      'Live HTTP 200 status and soft-404 filtering on /llms.txt and /agents.md',
      'Detection of generic 76-line stock Shopify /agents.md boilerplate vs. custom brand facts',
      'Same-origin <link rel="alternate" type="text/markdown"> /ai-facts discovery for Webflow, Wix, Squarespace & Framer',
      'Count and @type inventory of <head> schema.org JSON-LD nodes (Organization, Product, SoftwareApplication, FAQPage)',
    ],
    faqs: [
      {
        question: 'What counts as a valid /llms.txt and /agents.md file?',
        answer:
          'Both endpoints should return HTTP 200 (not an HTML soft-404), start with a clear Markdown H1 heading, and state canonical URLs, verified pricing tiers, fulfillment scope, and explicit brand guardrails.',
      },
      {
        question: 'What if my website builder does not allow uploading root .txt or .md files?',
        answer:
          'Our validator automatically checks for <link rel="alternate" type="text/markdown" href="/ai-facts"> in your homepage <head> pointing to an <article class="verisource-ai-facts"> block—so Webflow, Wix, Squarespace, and Framer sites pass cleanly.',
      },
    ],
  },
  {
    slug: 'ai-crawler-waf-checker',
    shortName: 'AI Bot & WAF Block Checker',
    eyebrow: 'FREE AI SEARCH CRAWLER & SSR READABILITY TEST',
    title: 'Free GPTBot, OAI-SearchBot & PerplexityBot WAF Checker',
    metaTitle:
      'Free GPTBot, OAI-SearchBot & PerplexityBot Checker: Test WAF & robots.txt | Verisource',
    metaDescription:
      'Check if /robots.txt or Cloudflare/CDN WAF rules block GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, or Google-Extended—and test SSR vs. JS readability.',
    answerFirstSummary:
      'Many sites allow AI crawlers in /robots.txt while unknowingly returning HTTP 403 WAF challenges or empty client-side JavaScript shells to GPTBot and PerplexityBot. Test all 5 AI crawlers and non-JS HTML readability below.',
    placeholderDomain: 'cal.com',
    whatItChecks: [
      '/robots.txt allow/disallow parsing across GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, and Google-Extended',
      'Live simulated GPTBot/1.2 and PerplexityBot/1.0 User-Agent HTTP probes to catch silent CDN/Cloudflare 403 blocks',
      'SSR vs. Client-Side JS hydration readability (raw HTML bytes, visible word count, and token signal ratio)',
      'Auto-detected CMS platform guidance to unblock AI search crawlers safely',
    ],
    faqs: [
      {
        question: 'Why does Perplexity or ChatGPT skip my site even when /robots.txt says Allow: /?',
        answer:
          'Two culprits cause most invisible drops: CDN Bot Fight Mode returning HTTP 403 challenges to AI user-agents, or client-side React/SPA rendering that serves an empty <div id="root"> shell to non-JS AI crawlers.',
      },
      {
        question: 'Does this check consume paid API credits?',
        answer:
          'No. The AI Bot & WAF Checker runs direct HTTP and HTML readiness probes free of charge (up to 15 custom domain checks per IP per day).',
      },
    ],
  },
  {
    slug: 'shopify-ai-readiness-checker',
    shortName: 'Shopify UCP & AI Readiness Checker',
    eyebrow: 'FREE SHOPIFY AGENTIC COMMERCE INSPECTOR',
    title: 'Free Shopify /api/ucp/mcp & ChatGPT Shopping Readiness Checker',
    metaTitle:
      'Free Shopify /api/ucp/mcp & /agents.md Checker (2026) | Verisource',
    metaDescription:
      'Test any Shopify storefront for Universal Commerce Protocol (/api/ucp/mcp), legacy /api/mcp, stock /agents.md boilerplate, Product JSON-LD, and AI bot access.',
    answerFirstSummary:
      'Test any Shopify storefront in 5 seconds to verify whether /api/ucp/mcp (Universal Commerce Protocol) is active, whether /agents.md is stuck on generic Shopify boilerplate, and whether AI shopping bots can read your SKU prices and shipping policies.',
    placeholderDomain: 'allbirds.com',
    whatItChecks: [
      'JSON-RPC tools/list probe on /api/ucp/mcp (2026 Universal Commerce Protocol) and legacy /api/mcp',
      'Storefront /agents.md classification: missing vs. generic Shopify stock boilerplate vs. custom merchant truth',
      'Product, Organization, and FAQPage JSON-LD schema presence plus visible price/shipping extraction',
      'GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot storefront crawler access',
    ],
    faqs: [
      {
        question: 'What does "default_boilerplate" mean on a Shopify /agents.md check?',
        answer:
          'It means your store serves Shopify’s stock auto-generated /agents.md template without your custom shipping thresholds, return policy, or product truth guardrails. Replacing or enriching it prevents AI engines from guessing your policies.',
      },
      {
        question: 'How fast can I fix a Shopify store flagged by this checker?',
        answer:
          'Inside Verisource Step 02, Shopify Theme mode generates a ready-to-paste 1-Click AI Fix Prompt plus drop-in layout/theme.liquid and templates/agents.md.liquid code you can publish and verify live in under 5 minutes.',
      },
    ],
  },
  {
    slug: 'json-ld-ai-schema-checker',
    shortName: 'JSON-LD & FAQPage AI Validator',
    eyebrow: 'FREE 3-PILLAR SCHEMA.ORG AI GRAPH INSPECTOR',
    title: 'Free Schema.org JSON-LD, FAQPage & Offer Pricing Validator',
    metaTitle:
      'Free JSON-LD & FAQPage Schema Validator for AI Search (2026) | Verisource',
    metaDescription:
      'Inspect any URL for the 3 schema.org JSON-LD pillars AI answer engines cite: Entity Identity (Organization/LocalBusiness), Offer/Product pricing, and FAQPage Q&A pairs.',
    answerFirstSummary:
      'Only 7.5% of public websites ship FAQPage JSON-LD alongside typed Offer pricing. Enter any domain below to inspect live <script type="application/ld+json"> syntax, detected @type entities, FAQPage Question counts, and commercial Offer coverage.',
    placeholderDomain: 'stripe.com',
    whatItChecks: [
      'Live <script type="application/ld+json"> extraction and JSON.parse() syntax verification',
      'Pillar 1 — Entity Identity (@type Organization, SoftwareApplication, OnlineStore, LocalBusiness, Dentist, LegalService)',
      'Pillar 2 — Answer-First FAQPage schema presence and exact mainEntity Question pair count',
      'Pillar 3 — Commercial Offer, Product, OfferCatalog, or priceCurrency pricing coverage',
    ],
    faqs: [
      {
        question: 'Why do AI answer engines care about Offer and FAQPage JSON-LD?',
        answer:
          'Without explicit Offer prices and FAQPage Q&A pairs in your HTML <head>, ChatGPT and Perplexity infer your pricing and policies from outdated third-party directories or Reddit threads—causing avoidable buyer hallucinations.',
      },
      {
        question: 'What if my site only has a basic Yoast or RankMath WebSite schema?',
        answer:
          'Basic WebSite + Organization snippets pass Pillar 1 (Entity Identity) while leaving Pillar 2 (FAQPage) and Pillar 3 (Offer Pricing) empty. Verisource Step 02 generates the missing Offer + FAQPage @graph nodes tailored to your exact CMS.',
      },
    ],
  },
];
