import { classifyIndustryVertical } from '../generator/fix-generator.js';
import { normalizePublicDomain } from './bot-waf-prober.js';
import { extractCleanCategoryTopic } from './fanout-scanner.js';

export type PromptIntentCategory =
  | 'discovery_unbranded'
  | 'commercial_comparison'
  | 'pricing_purchase'
  | 'branded_trust';

export interface PromptIntentMeta {
  intentCategory: PromptIntentCategory;
  stageLabel: string;
  shortBadge: string;
  isBranded: boolean;
  commercialWeight: 'high' | 'medium';
}

export interface SuggestedBuyerPrompt extends PromptIntentMeta {
  promptText: string;
  rationale: string;
}

const INTENT_META_BY_CATEGORY: Record<
  PromptIntentCategory,
  Omit<PromptIntentMeta, 'isBranded'>
> = {
  discovery_unbranded: {
    intentCategory: 'discovery_unbranded',
    stageLabel: 'Unbranded Discovery',
    shortBadge: 'DISCOVERY · UNBRANDED',
    commercialWeight: 'high',
  },
  commercial_comparison: {
    intentCategory: 'commercial_comparison',
    stageLabel: 'Commercial Comparison',
    shortBadge: 'COMPARISON · SHORTLIST',
    commercialWeight: 'high',
  },
  pricing_purchase: {
    intentCategory: 'pricing_purchase',
    stageLabel: 'Pricing & Purchase Fit',
    shortBadge: 'PRICING & FIT',
    commercialWeight: 'high',
  },
  branded_trust: {
    intentCategory: 'branded_trust',
    stageLabel: 'Branded Reviews & Policy',
    shortBadge: 'BRANDED · TRUST',
    commercialWeight: 'medium',
  },
};

export function getPromptIntentMeta(
  category: string | null | undefined,
  promptText: string,
  brandName: string
): PromptIntentMeta {
  const normalizedCategory = (category ?? '').trim().toLowerCase();
  const inferred = classifyPromptIntent(promptText, brandName);

  if (
    normalizedCategory === 'discovery_unbranded' ||
    normalizedCategory === 'pricing_purchase' ||
    normalizedCategory === 'branded_trust'
  ) {
    return {
      ...INTENT_META_BY_CATEGORY[normalizedCategory],
      isBranded: inferred.isBranded,
    };
  }

  return inferred;
}

export function classifyPromptIntent(
  promptText: string,
  brandName: string
): PromptIntentMeta {
  const cleanPrompt = promptText.trim();
  const lower = cleanPrompt.toLowerCase();
  const cleanBrand = brandName.trim().toLowerCase();
  const brandFirstWord = cleanBrand.split(/\s+/)[0] ?? '';

  const isBranded =
    (cleanBrand.length >= 2 && lower.includes(cleanBrand)) ||
    (brandFirstWord.length >= 4 && lower.includes(brandFirstWord));

  if (
    /\b(?:price|pricing|cost|plans?|tiers?|retainer|fee|fees|shipping|delivery|discount|subscription|quote|roi)\b/i.test(
      cleanPrompt
    )
  ) {
    return {
      ...INTENT_META_BY_CATEGORY.pricing_purchase,
      isBranded,
    };
  }

  if (
    /\b(?:vs\.?|versus|compare|compared|comparison|alternative|alternatives|compete|competing|instead of|switch from)\b/i.test(
      cleanPrompt
    )
  ) {
    return {
      ...INTENT_META_BY_CATEGORY.commercial_comparison,
      isBranded,
    };
  }

  if (isBranded) {
    return {
      ...INTENT_META_BY_CATEGORY.branded_trust,
      isBranded: true,
    };
  }

  return {
    ...INTENT_META_BY_CATEGORY.discovery_unbranded,
    isBranded: false,
  };
}

export function generateSuggestedBuyerPrompts(params: {
  hostname: string;
  brandName: string;
  coreOffering: string;
  pricingSummary?: string;
  shippingOrServiceArea?: string;
  isShopify?: boolean;
  topRivals?: string[];
  existingPrompts?: string[];
}): SuggestedBuyerPrompt[] {
  let cleanHost = params.hostname.trim().toLowerCase();
  try {
    cleanHost = normalizePublicDomain(params.hostname).hostname;
  } catch {
    // Keep sanitized fallback string
  }

  const brand = params.brandName.trim() || cleanHost;
  const vertical = classifyIndustryVertical({
    hostname: cleanHost,
    brandName: brand,
    coreOffering: params.coreOffering,
    serviceArea: params.shippingOrServiceArea,
    isShopify: params.isShopify,
  });

  const cleanTopic = extractCleanCategoryTopic(params.coreOffering, brand, 48);
  const topRival = (params.topRivals ?? [])
    .map((r) => r.trim())
    .find(
      (r) =>
        r.length >= 2 &&
        r.toLowerCase() !== brand.toLowerCase() &&
        !/^(?:reddit\.com|category|editorial|top\s+)/i.test(r)
    );

  const areaHint =
    params.shippingOrServiceArea &&
    params.shippingOrServiceArea.trim().length > 3 &&
    params.shippingOrServiceArea.trim().length <= 44
      ? params.shippingOrServiceArea.trim().replace(/\.+$/, '')
      : null;

  let rawCandidates: Array<{
    promptText: string;
    intentCategory: PromptIntentCategory;
    isBranded: boolean;
    rationale: string;
  }> = [];

  if (vertical.industryVertical === 'shopify_commerce') {
    const productCategory = cleanTopic || 'specialty online products';
    rawCandidates = [
      {
        promptText: `Best ${productCategory} brands with verified quality and fast shipping`,
        intentCategory: 'discovery_unbranded',
        isBranded: false,
        rationale:
          'Captures net-new shoppers asking ChatGPT Shopping and Perplexity for top category picks before naming a store.',
      },
      {
        promptText: `Where to buy authentic ${productCategory} online with transparent sourcing`,
        intentCategory: 'discovery_unbranded',
        isBranded: false,
        rationale:
          'Tests unbranded commercial shortlist visibility across Gemini and ChatGPT Search.',
      },
      {
        promptText: topRival
          ? `${brand} vs ${topRival}: product quality, pricing, and shipping compared`
          : `How does ${brand} compare to top ${productCategory} brands online?`,
        intentCategory: 'commercial_comparison',
        isBranded: true,
        rationale:
          'Audits head-to-head buyer comparisons where third-party Reddit and review threads shape the verdict.',
      },
      {
        promptText: `Best alternatives to ${topRival ?? brand} for ${productCategory}`,
        intentCategory: 'commercial_comparison',
        isBranded: !topRival,
        rationale:
          'Reveals which rival storefronts AI engines substitute when shoppers ask for alternatives.',
      },
      {
        promptText: `${brand} current SKU prices, bundle options, and free shipping threshold`,
        intentCategory: 'pricing_purchase',
        isBranded: true,
        rationale:
          'Directly stress-tests AI price and shipping accuracy against your verified Brand Truth Sheet.',
      },
      {
        promptText: areaHint
          ? `Best ${productCategory} options with ${areaHint}`
          : `Best value ${productCategory} subscriptions and gift bundles under $100`,
        intentCategory: 'pricing_purchase',
        isBranded: false,
        rationale:
          'Checks whether structured OfferCatalog JSON-LD qualifies your store for price-filtered shopping queries.',
      },
      {
        promptText: `Is ${brand} worth buying from? Customer reviews, return policy, and fulfillment speed`,
        intentCategory: 'branded_trust',
        isBranded: true,
        rationale:
          'Monitors late-stage buyer due diligence and catches outdated policy claims before checkout.',
      },
      {
        promptText: `What products does ${brand} actually sell and what items are excluded?`,
        intentCategory: 'branded_trust',
        isBranded: true,
        rationale:
          'Verifies that /agents.md exclusions prevent AI engines from inventing discontinued SKUs.',
      },
    ];
  } else if (
    vertical.industryVertical === 'legal_service' ||
    vertical.industryVertical === 'dental_group' ||
    vertical.industryVertical === 'medspa_clinic' ||
    vertical.industryVertical === 'hvac_home_service' ||
    vertical.industryVertical === 'roofing_contractor'
  ) {
    const serviceTopic =
      cleanTopic ||
      (vertical.industryVertical === 'legal_service'
        ? 'trial and injury legal representation'
        : vertical.industryVertical === 'dental_group'
          ? 'dental implants, Invisalign, and preventive care'
          : vertical.industryVertical === 'medspa_clinic'
            ? 'medical aesthetics and injectable treatments'
            : vertical.industryVertical === 'hvac_home_service'
              ? 'HVAC repair, installation, and plumbing'
              : 'commercial and residential roof replacement');
    rawCandidates = [
      {
        promptText: `Most trusted providers for ${serviceTopic} with verified client outcomes`,
        intentCategory: 'discovery_unbranded',
        isBranded: false,
        rationale:
          'Measures unbranded local and regional shortlist share for high-ticket service inquiries.',
      },
      {
        promptText: `How to choose a reputable provider for ${serviceTopic}`,
        intentCategory: 'discovery_unbranded',
        isBranded: false,
        rationale:
          'Surfaces which directories (Avvo, Zocdoc, Yelp, Clutch) feed early-stage AI recommendations.',
      },
      {
        promptText: topRival
          ? `${brand} vs ${topRival}: credentials, reviews, and service coverage compared`
          : `How does ${brand} compare to competing providers for ${serviceTopic}?`,
        intentCategory: 'commercial_comparison',
        isBranded: true,
        rationale:
          'Benchmarks direct shortlist framing when high-intent prospects compare top local groups.',
      },
      {
        promptText: `Top-rated alternatives to ${topRival ?? brand} for ${serviceTopic}`,
        intentCategory: 'commercial_comparison',
        isBranded: !topRival,
        rationale:
          'Identifies the exact rival clinics, firms, or contractors AI engines recommend first.',
      },
      {
        promptText: `${brand} consultation fees, financing or insurance options, and service area`,
        intentCategory: 'pricing_purchase',
        isBranded: true,
        rationale:
          'Catches hallucinated fee structures, wrong insurance claims, or outdated service radii.',
      },
      {
        promptText: `Typical cost and coverage options for ${serviceTopic}`,
        intentCategory: 'pricing_purchase',
        isBranded: false,
        rationale:
          'Tests whether your Answer-First FAQ schema wins high-intent cost and coverage questions.',
      },
      {
        promptText: `${brand} client reviews, licensing credentials, and response guarantees`,
        intentCategory: 'branded_trust',
        isBranded: true,
        rationale:
          'Audits reputation sentiment before a prospect books a high-value consultation.',
      },
      {
        promptText: `Which cities and regions does ${brand} actively serve?`,
        intentCategory: 'branded_trust',
        isBranded: true,
        rationale:
          'Verifies LocalBusiness GeoCircle and areaServed JSON-LD ingestion across AI search.',
      },
    ];
  } else if (vertical.industryVertical === 'b2b_agency') {
    const agencyFocus = cleanTopic || 'B2B search, content, and digital growth';
    rawCandidates = [
      {
        promptText: `Best agencies for ${agencyFocus} with proven B2B pipeline results`,
        intentCategory: 'discovery_unbranded',
        isBranded: false,
        rationale:
          'Tracks unbranded agency shortlist prompts where VP Marketing buyers build their vendor list.',
      },
      {
        promptText: `Which specialized agencies lead in ${agencyFocus} right now?`,
        intentCategory: 'discovery_unbranded',
        isBranded: false,
        rationale:
          'Exposes which Clutch, G2, and editorial agency roundups AI engines cite most.',
      },
      {
        promptText: topRival
          ? `${brand} vs ${topRival}: agency deliverables, case studies, and retainers compared`
          : `How does ${brand} compare to other ${agencyFocus} agencies?`,
        intentCategory: 'commercial_comparison',
        isBranded: true,
        rationale:
          'Evaluates side-by-side vendor shortlist framing across ChatGPT, Gemini, and Perplexity.',
      },
      {
        promptText: `Top B2B agency alternatives to ${topRival ?? brand} for ${agencyFocus}`,
        intentCategory: 'commercial_comparison',
        isBranded: !topRival,
        rationale:
          'Pinpoints direct agency competitors winning citations on third-party comparison lists.',
      },
      {
        promptText: `${brand} monthly retainer pricing, engagement minimums, and scope`,
        intentCategory: 'pricing_purchase',
        isBranded: true,
        rationale:
          'Flags invented retainer minimums or wrong contract terms before sales calls.',
      },
      {
        promptText: `Typical monthly retainer cost for a B2B ${agencyFocus} agency`,
        intentCategory: 'pricing_purchase',
        isBranded: false,
        rationale:
          'Checks whether your published pricing guide or FAQ gets cited on budget research prompts.',
      },
      {
        promptText: `${brand} client reviews, verified results, and ideal customer profile`,
        intentCategory: 'branded_trust',
        isBranded: true,
        rationale:
          'Monitors executive due-diligence sentiment and third-party review citations.',
      },
      {
        promptText: `What services are included and excluded in a ${brand} engagement?`,
        intentCategory: 'branded_trust',
        isBranded: true,
        rationale:
          'Verifies /agents.md scope accuracy so AI does not pitch services your team does not offer.',
      },
    ];
  } else {
    const softwareTopic = cleanTopic || 'B2B software and workflow automation';
    rawCandidates = [
      {
        promptText: `Best ${softwareTopic} platforms for modern B2B teams`,
        intentCategory: 'discovery_unbranded',
        isBranded: false,
        rationale:
          'Measures unbranded category discovery — where 89% of B2B software buyers build initial shortlists.',
      },
      {
        promptText: `Most reliable tools for ${softwareTopic} with fast implementation`,
        intentCategory: 'discovery_unbranded',
        isBranded: false,
        rationale:
          'Surfaces which G2, Reddit, and developer blog threads control category recommendations.',
      },
      {
        promptText: topRival
          ? `${brand} vs ${topRival}: capabilities, pricing tiers, and API support compared`
          : `How does ${brand} compare to leading ${softwareTopic} alternatives?`,
        intentCategory: 'commercial_comparison',
        isBranded: true,
        rationale:
          'Audits head-to-head evaluation prompts where technical buyers narrow 4 vendors down to 1.',
      },
      {
        promptText: `Top alternatives to ${topRival ?? brand} for ${softwareTopic}`,
        intentCategory: 'commercial_comparison',
        isBranded: !topRival,
        rationale:
          'Maps competitor substitution risk and uncovers rival comparison pages.',
      },
      {
        promptText: `${brand} pricing plans, usage limits, and enterprise billing options`,
        intentCategory: 'pricing_purchase',
        isBranded: true,
        rationale:
          'Catches outdated plan prices, deprecated free tiers, or invented seat limits.',
      },
      {
        promptText: `Best ${softwareTopic} platform with transparent self-serve pricing`,
        intentCategory: 'pricing_purchase',
        isBranded: false,
        rationale:
          'Tests whether SoftwareApplication Offer JSON-LD earns citations on commercial budget queries.',
      },
      {
        promptText: `Is ${brand} reliable in production? Customer feedback, security, and support`,
        intentCategory: 'branded_trust',
        isBranded: true,
        rationale:
          'Tracks buyer trust framing and flags cautionary or inaccurate claims early.',
      },
      {
        promptText: `What integrations, APIs, or protocols does ${brand} officially support?`,
        intentCategory: 'branded_trust',
        isBranded: true,
        rationale:
          'Verifies technical spec accuracy against /llms.txt and /agents.md documentation.',
      },
    ];
  }

  const existingNormalized = new Set(
    (params.existingPrompts ?? []).map((p) =>
      p.trim().toLowerCase().replace(/\s+/g, ' ')
    )
  );

  return rawCandidates
    .filter((candidate) => {
      const key = candidate.promptText
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
      return !existingNormalized.has(key);
    })
    .map((candidate) => {
      const meta = INTENT_META_BY_CATEGORY[candidate.intentCategory];
      return {
        promptText: candidate.promptText,
        intentCategory: candidate.intentCategory,
        stageLabel: meta.stageLabel,
        shortBadge: meta.shortBadge,
        isBranded: candidate.isBranded,
        commercialWeight: meta.commercialWeight,
        rationale: candidate.rationale,
      };
    });
}
