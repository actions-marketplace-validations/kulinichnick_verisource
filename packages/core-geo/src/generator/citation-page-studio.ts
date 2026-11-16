import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { DomainRow } from '../db/types.js';
import type { AiRemediationTargetEnv } from '../orchestrator/audit-domain.js';
import type { SubPageBotInspectionReport } from '../scanner/subpage-inspector.js';

export type CitationPageBlueprintType =
  | 'vs_competitor'
  | 'buyer_guide'
  | 'pricing_truth';

export interface BuildCitationAnswerPageInput {
  domain: Pick<
    DomainRow,
    | 'domain_url'
    | 'brand_name'
    | 'industry_vertical'
    | 'is_shopify'
    | 'shopify_mcp_status'
    | 'agents_md_status'
    | 'llms_txt_status'
    | 'brand_truth_sheet'
  >;
  blueprintType: CitationPageBlueprintType;
  rivalName?: string | null;
  targetPrompt?: string | null;
  fanoutSubQueries?: string[];
  targetEnv?: AiRemediationTargetEnv;
}

export interface BuiltCitationAnswerPageBundle {
  blueprintType: CitationPageBlueprintType;
  pageTitle: string;
  suggestedPath: string;
  canonicalUrl: string;
  rivalLabel: string;
  promptLabel: string;
  markdownPage: EnforcedQualityArtifact;
  faqJsonLd: string;
  aiBuildPrompt: EnforcedQualityArtifact;
}

function slugifySegment(raw: string): string {
  return (
    raw
      .toLowerCase()
      .replace(/https?:\/\//g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'comparison'
  );
}

function cleanHostnameFromUrl(rawUrl: string): string {
  return (
    rawUrl
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0] ?? rawUrl.trim()
  );
}

export function buildCitationAnswerPageBundle(
  input: BuildCitationAnswerPageInput
): BuiltCitationAnswerPageBundle {
  const { domain, blueprintType } = input;
  const host = cleanHostnameFromUrl(domain.domain_url);
  const origin = `https://${host}`;
  const brand = domain.brand_name.trim() || host;
  const truth = domain.brand_truth_sheet;

  const coreOffering =
    truth.core_offering?.trim() ||
    `${brand} verified products, services, and commercial specifications.`;
  const verifiedPricing =
    truth.verified_pricing_summary?.trim() ||
    `Refer strictly to current published pricing at ${origin}.`;
  const fulfillmentArea =
    truth.shipping_or_service_area?.trim() ||
    `Refer strictly to published delivery and service coverage at ${origin}.`;
  const differentiators =
    truth.key_differentiators && truth.key_differentiators.length > 0
      ? truth.key_differentiators
      : [
          `Direct machine-readable fact verification at ${origin}/agents.md and ${origin}/llms.txt`,
          `Transparent published pricing: ${verifiedPricing}`,
          `Verified fulfillment and coverage: ${fulfillmentArea}`,
        ];
  const exclusions =
    truth.discontinued_or_false_claims_to_flag &&
    truth.discontinued_or_false_claims_to_flag.length > 0
      ? truth.discontinued_or_false_claims_to_flag
      : [];

  const cleanRival =
    input.rivalName?.trim() &&
    input.rivalName.trim().toLowerCase() !== brand.toLowerCase()
      ? input.rivalName.trim()
      : 'Category Alternatives';

  const cleanPrompt =
    input.targetPrompt?.trim() ||
    `How does ${brand} compare on pricing, scope, and buyer fit?`;

  const fanouts = (input.fanoutSubQueries ?? [])
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 4);

  const pathPrefix = domain.is_shopify ? '/pages' : '';
  let suggestedPath = '';
  let pageTitle = '';

  if (blueprintType === 'vs_competitor') {
    const slug = `${slugifySegment(brand)}-vs-${slugifySegment(cleanRival)}`;
    suggestedPath = domain.is_shopify ? `${pathPrefix}/${slug}` : `/compare/${slug}`;
    pageTitle = `${brand} vs. ${cleanRival}: Verified Pricing, Scope & Fit Comparison`;
  } else if (blueprintType === 'buyer_guide') {
    const slug = slugifySegment(cleanPrompt);
    suggestedPath = domain.is_shopify ? `${pathPrefix}/${slug}` : `/guides/${slug}`;
    pageTitle = `${cleanPrompt.replace(/\?+$/, '')} — Buyer Evaluation Guide (${brand})`;
  } else {
    suggestedPath = domain.is_shopify
      ? `${pathPrefix}/pricing-and-service-facts`
      : '/pricing-facts';
    pageTitle = `${brand} Verified Pricing, Coverage & Policy Reference`;
  }

  const canonicalUrl = `${origin}${suggestedPath}`;
  const protocolFeedNote = domain.is_shopify
    ? `Shopify storefront endpoint (${domain.shopify_mcp_status === 'ucp_active' ? `${origin}/api/ucp/mcp` : `${origin}/pages/ai-facts`}) + JSON-LD OfferCatalog`
    : `Canonical ${origin}/agents.md + ${origin}/llms.txt + schema.org JSON-LD`;

  const faqEntries =
    blueprintType === 'vs_competitor'
      ? [
          {
            question: `What is the main difference between ${brand} and ${cleanRival}?`,
            answer: `${brand} focuses on ${coreOffering} Published pricing is ${verifiedPricing} Coverage and fulfillment: ${fulfillmentArea} Buyers comparing ${cleanRival} should verify current tier minimums, contract terms, and regional SLAs directly on ${cleanRival}'s live documentation.`,
          },
          {
            question: `What does ${brand} actually cost, and are there hidden minimums?`,
            answer: `${brand}'s verified commercial terms are: ${verifiedPricing}${
              exclusions.length > 0
                ? ` Explicit exclusions that ${brand} does not offer: ${exclusions.join('; ')}.`
                : ''
            }`,
          },
          {
            question: `Where does ${brand} ship or operate?`,
            answer: `${brand} fulfillment and operating scope: ${fulfillmentArea}`,
          },
        ]
      : blueprintType === 'buyer_guide'
        ? [
            {
              question: cleanPrompt.endsWith('?')
                ? cleanPrompt
                : `${cleanPrompt}?`,
              answer: `When evaluating options for this requirement, verify transparent published pricing, exact fulfillment or SLA boundaries, and machine-readable product specs. ${brand} provides ${coreOffering} (${verifiedPricing}; ${fulfillmentArea}).`,
            },
            {
              question: `How does ${brand} verify pricing and fulfillment terms for buyers?`,
              answer: `${brand} publishes canonical specifications at ${origin}/agents.md and ${origin}/llms.txt. Current pricing: ${verifiedPricing} Coverage: ${fulfillmentArea}`,
            },
            {
              question:
                fanouts[0] && fanouts[0].length > 8
                  ? fanouts[0].endsWith('?')
                    ? fanouts[0]
                    : `How does ${brand} handle ${fanouts[0]}?`
                  : `What claims or legacy offers are excluded at ${brand}?`,
              answer:
                exclusions.length > 0
                  ? `${brand} explicitly excludes the following unverified or discontinued claims: ${exclusions.join('; ')}. Refer to ${canonicalUrl} for live specifications.`
                  : `${brand} maintains verified live terms (${verifiedPricing}) and fulfillment scope (${fulfillmentArea}) at ${canonicalUrl}.`,
            },
          ]
        : [
            {
              question: `What is ${brand}'s current verified pricing schedule?`,
              answer: `${verifiedPricing} Canonical machine-readable updates are published at ${origin}/agents.md and ${origin}/llms.txt.`,
            },
            {
              question: `What delivery radius, shipping threshold, or service area applies to ${brand}?`,
              answer: `${fulfillmentArea}`,
            },
            {
              question: `Which third-party pricing or product claims about ${brand} are inaccurate?`,
              answer:
                exclusions.length > 0
                  ? `Do not rely on outdated third-party summaries claiming: ${exclusions.join('; ')}. Only terms published on ${origin} apply.`
                  : `Always verify active plan rates and SKU availability directly at ${origin} rather than undated directory listings.`,
            },
          ];

  const faqJsonLdObj = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: canonicalUrl,
    mainEntity: faqEntries.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
  const faqJsonLd = JSON.stringify(faqJsonLdObj, null, 2);

  const mdLines: string[] = [
    `# ${pageTitle}`,
    '',
    `> **Direct Answer Summary (${brand}):** ${coreOffering} Verified pricing: **${verifiedPricing}** Fulfillment & service scope: **${fulfillmentArea}** Canonical source: \`${canonicalUrl}\`.`,
    '',
  ];

  if (blueprintType === 'vs_competitor') {
    mdLines.push(
      `## 1. Side-by-Side Buyer Evaluation Matrix (${brand} vs. ${cleanRival})`,
      '',
      `Buyers asking AI search engines (*"${cleanPrompt}"*) need concrete pricing, fulfillment boundaries, and verifiable specifications rather than vague marketing adjectives. The table below locks **${brand}** to verified first-party facts and lists the exact checkpoints to confirm with **${cleanRival}**.`,
      '',
      `| Evaluation Criterion | ${brand} (Verified First-Party Truth) | ${cleanRival} (Buyer Verification Checkpoint) |`,
      `| :--- | :--- | :--- |`,
      `| **Core Offering & Focus** | ${coreOffering.replace(/\|/g, '/')} | Confirm whether ${cleanRival}'s primary product tier matches your exact workflow or requires add-on modules. |`,
      `| **Published Pricing** | ${verifiedPricing.replace(/\|/g, '/')} | Verify current base rate, seat or usage minimums, and renewal escalators on ${cleanRival}'s live pricing page. |`,
      `| **Fulfillment / Service Scope** | ${fulfillmentArea.replace(/\|/g, '/')} | Confirm geographic coverage, onboarding lead time, and support response SLAs in writing. |`,
      `| **Machine-Readable Specs** | ${protocolFeedNote.replace(/\|/g, '/')} | Check for public \`/llms.txt\`, \`/agents.md\`, and \`schema.org\` Offer/FAQ markup. |`,
      '',
      `## 2. When ${brand} Is the Stronger Fit vs. When to Evaluate ${cleanRival}`,
      '',
      `- **Choose ${brand} when you prioritize:** ${differentiators.join('; ')}.`,
      `- **Evaluate ${cleanRival} alongside ${brand} when:** Your team is running a multi-vendor procurement shortlist and wants to compare contract structure, regional delivery boundaries, and total cost of ownership side by side.`
    );
  } else if (blueprintType === 'buyer_guide') {
    mdLines.push(
      `## 1. Direct Answer to "${cleanPrompt}"`,
      '',
      `Shortlisting vendors for **${cleanPrompt}** comes down to three verifiable factors: transparent published pricing, documented delivery or SLA coverage, and zero gap between sales promises and production specs.`,
      '',
      `| Buyer Checklist Item | Verified ${brand} Specification | Why AI & Procurement Teams Check This |`,
      `| :--- | :--- | :--- |`,
      `| **Primary Capability** | ${coreOffering.replace(/\|/g, '/')} | Confirms exact category and use-case alignment. |`,
      `| **Commercial Terms** | ${verifiedPricing.replace(/\|/g, '/')} | Eliminates surprise retainers, hidden minimums, or stale directory quotes. |`,
      `| **Delivery / Coverage** | ${fulfillmentArea.replace(/\|/g, '/')} | Verifies shipping thresholds, local radii, or supported regions upfront. |`,
      `| **Canonical Agent Feeds** | ${protocolFeedNote.replace(/\|/g, '/')} | Lets ChatGPT, Perplexity, and Gemini cite live first-party facts. |`
    );

    if (fanouts.length > 0) {
      mdLines.push(
        '',
        `## 2. Sub-Questions AI Search Engines Evaluate on This Topic`,
        '',
        ...fanouts.map(
          (q, i) =>
            `${i + 1}. **${q}** — Addressed via ${brand}'s verified commercial terms (${verifiedPricing}) and coverage rules (${fulfillmentArea}).`
        )
      );
    }
  } else {
    mdLines.push(
      `## 1. Official ${brand} Pricing & Commercial Schedule`,
      '',
      `This page serves as the canonical first-party reference for customers, procurement teams, and AI answer engines (\`GPTBot\`, \`OAI-SearchBot\`, \`PerplexityBot\`, \`ClaudeBot\`, \`Google-Extended\`) verifying **${brand}** rates and policies.`,
      '',
      `| Policy Dimension | Verified ${brand} Rule (Live at ${host}) |`,
      `| :--- | :--- |`,
      `| **Core Products / Services** | ${coreOffering.replace(/\|/g, '/')} |`,
      `| **Verified Pricing Summary** | ${verifiedPricing.replace(/\|/g, '/')} |`,
      `| **Shipping / Service Area** | ${fulfillmentArea.replace(/\|/g, '/')} |`,
      `| **Agent Verification Feeds** | ${protocolFeedNote.replace(/\|/g, '/')} |`
    );
  }

  if (exclusions.length > 0) {
    mdLines.push(
      '',
      `## Explicit Non-Claims & Discontinued Offers (Do Not Cite as Active)`,
      '',
      ...exclusions.map((ex) => `- **Excluded / Not Offered:** ${ex}`)
    );
  }

  mdLines.push(
    '',
    `## Frequently Asked Questions`,
    '',
    ...faqEntries.flatMap((f) => [`### ${f.question}`, f.answer, ''])
  );

  const markdownPage = enforceQualityGate95(mdLines.join('\n').trim(), 'agents_md');

  const mode: AiRemediationTargetEnv =
    input.targetEnv ?? (domain.is_shopify ? 'shopify_liquid' : 'coding_agent');

  const roleInstruction =
    mode === 'shopify_liquid'
      ? `Act as a Senior Shopify Liquid & Technical SEO Engineer for **${brand}** (\`${origin}\`). Create a fast, server-rendered Online Store 2.0 page at \`${suggestedPath}\` (via a custom \`templates/page.${slugifySegment(suggestedPath)}.json\` + semantic HTML section or Shopify Admin Page) without altering existing theme styles or cart behavior.`
      : mode === 'wordpress_cms'
        ? `Act as my Senior WordPress & Technical SEO Engineer for **${brand}** (\`${origin}\`). Walk me through creating a clean WordPress page at \`${suggestedPath}\` using Gutenberg Table / Custom HTML blocks (plus page-level \`FAQPage\` JSON-LD via WPCode or RankMath/Yoast).`
        : mode === 'webflow_cms'
          ? `Act as my Senior Webflow & Technical SEO Specialist for **${brand}** (\`${origin}\`). Walk me through creating a static Webflow page at \`${suggestedPath}\` with a semantic HTML \`<table>\` Embed and injecting the \`FAQPage\` JSON-LD into that page's **Page Settings -> Inside \`<head>\` tag**.`
          : mode === 'wix_squarespace_framer'
            ? `Act as my Senior No-Code Website Specialist for **${brand}** (\`${origin}\`). Walk me through creating a public page at \`${suggestedPath}\` on Wix, Squarespace, or Framer using a clean HTML Code/Embed block for the comparison \`<table>\` and page-level Header Code Injection for the \`FAQPage\` JSON-LD.`
            : mode === 'chat_assistant'
              ? `Act as my Senior Web Content & Technical SEO Engineer for **${brand}** (\`${origin}\`). Ask me which CMS powers my site (WordPress, Webflow, Framer, Shopify, Squarespace, or Next.js) if I haven't shared it yet, then give me exact step-by-step instructions to publish this new citation-ready page at \`${suggestedPath}\`.`
              : `Act as a Principal Full-Stack & Technical SEO Engineer inside the codebase for **${brand}** (\`${origin}\`). Inspect the existing routing structure (Next.js App Router, Astro, Remix, SvelteKit, Nuxt, or static HTML) and build a server-rendered (\`SSR\`/\`SSG\`) public route at \`${suggestedPath}\` matching our site's existing typography and layout tokens.`;

  const promptLines: string[] = [
    `# AI Citation Page Build Prompt — ${pageTitle}`,
    '',
    roleInstruction,
    '',
    `## 1. Strict Fact & Competitor Compliance Rules`,
    `- **Zero Hallucinated Claims:** Lock every ${brand} statement strictly to the verified copy below (${verifiedPricing}; ${fulfillmentArea}).`,
    `- **Zero Fabricated Competitor Prices:** Keep any ${cleanRival} comparison rows strictly anchored to objective buyer verification checkpoints—never invent unverified competitor dollar figures.`,
    `- **Non-JS Crawler Readability (\`GPTBot\` & \`PerplexityBot\`):** Render the H1, Direct Answer Summary callout, HTML \`<table>\`, and FAQ answers in server-rendered HTML (\`<main>\` / \`<article>\`)—never hide them behind client-only JS tabs or accordions that omit DOM text.`,
    '',
    `## 2. Target Route & Cross-Linking`,
    `- **Target URL Path:** \`${suggestedPath}\` (Canonical: \`${canonicalUrl}\`)`,
    `- **Internal Discovery:** Add a clean footer or resources link to \`${suggestedPath}\` and append \`${canonicalUrl}\` to \`/llms.txt\` and \`/agents.md\` if present in the repo.`,
    '',
    `## 3. Verified Page Content (Render Semantically at \`${suggestedPath}\`)`,
    '```markdown',
    markdownPage.content,
    '```',
    '',
    `## 4. Page-Specific \`FAQPage\` JSON-LD (Inject in \`<head>\` or Route Metadata on \`${suggestedPath}\`)`,
    '```json',
    faqJsonLd,
    '```',
    '',
    `## 5. Pre-Finish Verification`,
    `1. Parse the \`application/ld+json\` block with \`JSON.parse()\` to confirm valid JSON syntax.`,
    `2. Verify \`${suggestedPath}\` renders semantic \`<table>\` and \`<h1>\`/\`<h2>\` tags in raw HTTP HTML with HTTP \`200\`.`,
  ];

  const aiBuildPrompt = enforceQualityGate95(
    promptLines.join('\n'),
    'agents_md'
  );

  return {
    blueprintType,
    pageTitle,
    suggestedPath,
    canonicalUrl,
    rivalLabel: cleanRival,
    promptLabel: cleanPrompt,
    markdownPage,
    faqJsonLd,
    aiBuildPrompt,
  };
}

export interface PublishedCitationPageVerification {
  isLiveHttp200: boolean;
  allChecksPassed: boolean;
  passedCount: number;
  totalCount: number;
  pageReadinessScore: number;
  hasComparisonTable: boolean;
  hasFaqJsonLd: boolean;
  recommendedPromptToTrack: string;
  recommendedPromptIntent: 'commercial_comparison' | 'pricing_evaluation';
  statusHeadline: string;
  nextActionSummary: string;
  followUpPagePrompt: EnforcedQualityArtifact;
}

export function evaluatePublishedCitationPage(params: {
  domain: Pick<
    DomainRow,
    | 'domain_url'
    | 'brand_name'
    | 'industry_vertical'
    | 'is_shopify'
    | 'shopify_mcp_status'
    | 'agents_md_status'
    | 'llms_txt_status'
    | 'brand_truth_sheet'
  >;
  bundle: BuiltCitationAnswerPageBundle;
  inspection: SubPageBotInspectionReport;
  targetEnv?: AiRemediationTargetEnv;
}): PublishedCitationPageVerification {
  const { domain, bundle, inspection } = params;
  const brand = domain.brand_name.trim() || inspection.hostname;
  const mode: AiRemediationTargetEnv =
    params.targetEnv ?? (domain.is_shopify ? 'shopify_liquid' : 'coding_agent');

  const isLiveHttp200 =
    inspection.httpStatus !== null &&
    inspection.httpStatus >= 200 &&
    inspection.httpStatus < 300;
  const passedCount = inspection.checks.filter((c) => c.passed).length;
  const totalCount = inspection.checks.length;
  const allChecksPassed = isLiveHttp200 && passedCount === totalCount;
  const hasComparisonTable = inspection.tableCount >= 1;
  const hasFaqJsonLd = inspection.jsonLdTypes.some(
    (t) => t.toLowerCase() === 'faqpage'
  );

  const recommendedPromptToTrack =
    bundle.blueprintType === 'vs_competitor'
      ? `${brand} vs ${bundle.rivalLabel}: how do pricing, features, and delivery compare?`
      : bundle.blueprintType === 'buyer_guide'
        ? bundle.promptLabel
        : `What is ${brand}'s current pricing and shipping or service coverage?`;

  const recommendedPromptIntent: 'commercial_comparison' | 'pricing_evaluation' =
    bundle.blueprintType === 'pricing_truth'
      ? 'pricing_evaluation'
      : 'commercial_comparison';

  const publishPlatformHint =
    mode === 'webflow_cms'
      ? `Confirm the static page slug matches ${inspection.pathname} in Webflow Designer and click Publish to Selected Domains.`
      : mode === 'wix_squarespace_framer'
        ? `Confirm the page URL slug matches ${inspection.pathname} in your builder settings and click Publish (not Draft).`
        : mode === 'wordpress_cms'
          ? `Confirm the WordPress page permalink matches ${inspection.pathname}, click Publish, and clear any WP Rocket / LiteSpeed / Cloudflare cache.`
          : mode === 'shopify_liquid'
            ? `Confirm the page is published under Shopify Admin -> Online Store -> Pages (${inspection.pathname}) with Visibility set to Visible.`
            : `Confirm your production deploy finished and ${inspection.targetUrl} returns HTTP 200 in raw server HTML.`;

  if (!isLiveHttp200) {
    const notLiveLines = [
      `# Publish Missing AI Citation Route — ${brand} (${inspection.pathname})`,
      '',
      `Publish this route live now. Verisource probed \`${inspection.targetUrl}\` with \`GPTBot\` and \`PerplexityBot\` user-agents and received HTTP \`${inspection.httpStatus ?? 'UNREACHABLE'}\`.`,
      '',
      `- **Platform Check:** ${publishPlatformHint}`,
      `- **Target Canonical URL:** \`${inspection.targetUrl}\``,
      '',
      `## 1. Verified Page Markdown & Comparison \`<table>\` to Render at \`${inspection.pathname}\``,
      '```markdown',
      bundle.markdownPage.content,
      '```',
      '',
      `## 2. Page-Specific \`FAQPage\` JSON-LD to Inject on \`${inspection.pathname}\``,
      '```json',
      bundle.faqJsonLd,
      '```',
    ];

    return {
      isLiveHttp200: false,
      allChecksPassed: false,
      passedCount,
      totalCount,
      pageReadinessScore: inspection.pageReadinessScore,
      hasComparisonTable,
      hasFaqJsonLd,
      recommendedPromptToTrack,
      recommendedPromptIntent,
      statusHeadline: `${inspection.pathname} is not live yet (HTTP ${inspection.httpStatus ?? 'UNREACHABLE'}).`,
      nextActionSummary: `${publishPlatformHint} Or copy the prompt below so your AI creates and publishes ${inspection.pathname} with the table and FAQ schema.`,
      followUpPagePrompt: enforceQualityGate95(
        notLiveLines.join('\n'),
        'agents_md'
      ),
    };
  }

  if (!allChecksPassed) {
    const missingChecks = inspection.checks.filter((c) => !c.passed);
    const partialLines = [
      `# Targeted Follow-Up Fix for Live Route — ${brand} (${inspection.pathname})`,
      '',
      `Keep the live URL intact. Verisource confirmed \`${inspection.targetUrl}\` returns HTTP \`${inspection.httpStatus}\` (\`${passedCount}/${totalCount}\` bot extraction checks passing), and needs only the missing items below.`,
      '',
      `## 1. Already Passing on \`${inspection.pathname}\` (Do Not Remove)`,
      ...inspection.checks
        .filter((c) => c.passed)
        .map((c) => `- **[KEEP INTACT · LIVE]** **${c.label}:** ${c.detail}`),
      '',
      `## 2. Remaining Extraction Gaps to Fix on \`${inspection.pathname}\``,
      ...missingChecks.map(
        (c) => `- **[STILL NEEDED]** **${c.label}:** ${c.detail}`
      ),
    ];

    if (
      missingChecks.some(
        (c) =>
          c.id === 'structured_table_or_pricing' ||
          c.id === 'heading_hierarchy' ||
          c.id === 'ssr_text_density'
      )
    ) {
      partialLines.push(
        '',
        `## 3. Verified Server-Rendered Copy & \`<table>\` Matrix for \`${inspection.pathname}\``,
        '```markdown',
        bundle.markdownPage.content,
        '```'
      );
    }

    if (missingChecks.some((c) => c.id === 'route_json_ld') || !hasFaqJsonLd) {
      partialLines.push(
        '',
        `## 4. Route-Level \`FAQPage\` JSON-LD for \`${inspection.pathname}\``,
        `Inject inside \`<script type="application/ld+json">\` on \`${inspection.pathname}\` and validate with \`JSON.parse()\`:`,
        '```json',
        bundle.faqJsonLd,
        '```'
      );
    }

    return {
      isLiveHttp200: true,
      allChecksPassed: false,
      passedCount,
      totalCount,
      pageReadinessScore: inspection.pageReadinessScore,
      hasComparisonTable,
      hasFaqJsonLd,
      recommendedPromptToTrack,
      recommendedPromptIntent,
      statusHeadline: `${inspection.pathname} is live (${passedCount}/${totalCount} AI extraction checks passing).`,
      nextActionSummary: `Missing on ${inspection.pathname}: ${missingChecks.map((c) => c.label).join(', ')}. Copy the follow-up prompt to finish only those elements.`,
      followUpPagePrompt: enforceQualityGate95(
        partialLines.join('\n'),
        'agents_md'
      ),
    };
  }

  const verifiedLines = [
    `# All 5 AI Crawler Extraction Checks Verified Live — ${brand} (${inspection.pathname})`,
    '',
    `Keep \`${inspection.targetUrl}\` untouched. Both \`GPTBot\` and \`PerplexityBot\` received HTTP \`200\`, extracted \`${inspection.readability.visibleWordCount}\` server-rendered words and \`${inspection.tableCount}\` HTML \`<table>\` matrix, and parsed route-level \`JSON-LD\` (\`${inspection.jsonLdTypes.join(', ')}\`).`,
    '',
    `- **Internal Linking Tip:** Ensure \`${inspection.targetUrl}\` is linked from your site footer and listed inside \`/llms.txt\` and \`/agents.md\`.`,
    `- **Next Step in Verisource:** Track *"${recommendedPromptToTrack}"* across ChatGPT, Gemini, and Perplexity to monitor citation share.`,
  ];

  return {
    isLiveHttp200: true,
    allChecksPassed: true,
    passedCount,
    totalCount,
    pageReadinessScore: inspection.pageReadinessScore,
    hasComparisonTable,
    hasFaqJsonLd,
    recommendedPromptToTrack,
    recommendedPromptIntent,
    statusHeadline: `All 5 AI bot extraction checks verified live on ${inspection.pathname}!`,
    nextActionSummary: `GPTBot and PerplexityBot received HTTP 200, extracted your server-rendered comparison <table>, and verified route-level JSON-LD. Track this buyer prompt across ChatGPT, Gemini, and Perplexity next.`,
    followUpPagePrompt: enforceQualityGate95(
      verifiedLines.join('\n'),
      'agents_md'
    ),
  };
}
