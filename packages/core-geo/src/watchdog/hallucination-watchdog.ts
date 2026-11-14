import type {
  BrandTruthSheet,
  HallucinationDetail,
} from '../db/types.js';
import { PATIENT_ZERO_DOMAINS } from '../fixtures/patient-zero.js';
import type { DomainHttpProbeResult } from '../scanner/bot-waf-prober.js';
import type { ShopifyInspectionResult } from '../shopify/shopify-adapter.js';

export function autoDraftBrandTruthSheet(
  probe: DomainHttpProbeResult,
  shopify: ShopifyInspectionResult
): BrandTruthSheet {
  const knownFixture = PATIENT_ZERO_DOMAINS.find((d) =>
    d.domain_url.toLowerCase().includes(probe.domain.hostname)
  );
  if (knownFixture) {
    return structuredClone(knownFixture.brand_truth_sheet);
  }

  const coreOffering =
    probe.metaDescription ??
    probe.title ??
    (shopify.isShopify
      ? `Direct-to-consumer e-commerce storefront hosted at ${probe.domain.origin}.`
      : `Commercial products and services offered by ${probe.domain.inferredBrandName} (${probe.domain.origin}).`);

  const verifiedPricingSummary =
    shopify.priceRangeSummary ??
    (probe.extractedPriceMentions.length > 0
      ? `Observed on-page pricing markers: ${probe.extractedPriceMentions.join(', ')}.`
      : 'Pricing varies by plan or SKU; verify exact tiers in 1 click.');

  const shippingOrServiceArea =
    probe.extractedShippingMentions[0] ??
    (shopify.isShopify
      ? 'Standard e-commerce shipping; confirm free-shipping threshold.'
      : 'Global or regional B2B service coverage; confirm local service radius.');

  const keyDifferentiators: string[] = [];
  if (shopify.catalogSkus.length > 0) {
    keyDifferentiators.push(
      `Active catalog SKUs include: ${shopify.catalogSkus
        .slice(0, 4)
        .map((s) => s.title)
        .join(', ')}.`
    );
  }
  if (probe.jsonLdBlocks.length > 0) {
    const schemaTypes = Array.from(
      new Set(
        probe.jsonLdBlocks
          .map((b) => String(b['@type'] ?? ''))
          .filter(Boolean)
      )
    );
    if (schemaTypes.length > 0) {
      keyDifferentiators.push(
        `Publishes structured schema types: ${schemaTypes.join(', ')}.`
      );
    }
  }

  return {
    is_user_verified: false,
    core_offering: coreOffering,
    verified_pricing_summary: verifiedPricingSummary,
    shipping_or_service_area: shippingOrServiceArea,
    key_differentiators: keyDifferentiators,
    discontinued_or_false_claims_to_flag: [],
  };
}

function extractDollarNumbers(text: string): number[] {
  const matches = text.match(/\$(\d{1,5}(?:\.\d{1,2})?)/g) ?? [];
  return matches
    .map((m) => Number.parseFloat(m.slice(1)))
    .filter((n) => Number.isFinite(n));
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function hasNegationNear(sentenceLower: string, termLower: string): boolean {
  const idx = sentenceLower.indexOf(termLower);
  if (idx === -1) return false;
  const prefixWindow = sentenceLower.slice(Math.max(0, idx - 32), idx);
  return /\b(?:not|no|never|without|doesn't|does not|don't|do not|excludes?)\b/.test(
    prefixWindow
  );
}

export function detectHallucinations(
  answerExcerpt: string | null,
  brandName: string,
  truthSheet: BrandTruthSheet
): HallucinationDetail[] {
  if (!answerExcerpt || answerExcerpt.trim().length === 0) {
    return [];
  }

  const details: HallucinationDetail[] = [];
  const sentences = splitSentences(answerExcerpt);
  const brandFirstToken = brandName.split(/\s+/)[0]?.toLowerCase() ?? '';

  // 1. Check explicit false-claim / exclusion rules in Brand Truth Sheet
  for (const rule of truthSheet.discontinued_or_false_claims_to_flag) {
    const candidateTerms: string[] = [];
    const kCupMatch = /k-cup|pods|instant/gi;
    let m: RegExpExecArray | null;
    while ((m = kCupMatch.exec(rule)) !== null) {
      candidateTerms.push(m[0].toLowerCase());
    }

    // Also extract quoted terms or capitalized product nouns after "NOT sell/offer/source"
    const afterNotMatch = rule.match(
      /\bnot\s+(?:sell|offer|source|manufacture|operate)\s+([^.;,()]+)/i
    );
    if (afterNotMatch?.[1]) {
      const stopWords = new Set([
        'keurig',
        'compatible',
        'packets',
        'coffee',
        'free',
        'nationwide',
        'shipping',
        'orders',
        'over',
        'chain',
        'blends',
      ]);
      const words = afterNotMatch[1]
        .toLowerCase()
        .split(/[\s/]+/)
        .map((w) => w.replace(/[^a-z0-9$-]/g, ''))
        .filter((w) => w.length >= 4 && !stopWords.has(w));
      candidateTerms.push(...words);
    }

    const uniqueTerms = Array.from(new Set(candidateTerms));
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (brandFirstToken && !lower.includes(brandFirstToken)) continue;

      for (const term of uniqueTerms) {
        if (term.startsWith('$')) continue;
        if (lower.includes(term) && !hasNegationNear(lower, term)) {
          details.push({
            claim_text: sentence,
            verified_truth: rule,
            severity: 'high',
            category: 'offering',
          });
          break;
        }
      }
    }
  }

  // 2. Check free-shipping / delivery dollar threshold hallucinations
  const truthShippingNums = extractDollarNumbers(
    truthSheet.shipping_or_service_area
  );
  const verifiedThreshold = truthShippingNums[0] ?? null;

  if (verifiedThreshold !== null) {
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (brandFirstToken && !lower.includes(brandFirstToken)) continue;
      if (!/free\s+(?:nationwide\s+|local\s+)?(?:shipping|delivery)/i.test(sentence)) {
        continue;
      }

      const claimedNums = extractDollarNumbers(sentence);
      for (const claimed of claimedNums) {
        if (Math.abs(claimed - verifiedThreshold) >= 5) {
          details.push({
            claim_text: sentence,
            verified_truth: truthSheet.shipping_or_service_area,
            severity: 'high',
            category: 'shipping',
          });
          break;
        }
      }

      // Also catch claiming "free nationwide shipping" when verified truth is strictly local delivery
      if (
        /free\s+nationwide\s+shipping/i.test(sentence) &&
        /local\s+(?:hand-)?delivery/i.test(truthSheet.shipping_or_service_area) &&
        !/free\s+nationwide/i.test(truthSheet.shipping_or_service_area) &&
        !details.some((d) => d.claim_text === sentence)
      ) {
        details.push({
          claim_text: sentence,
          verified_truth: truthSheet.shipping_or_service_area,
          severity: 'high',
          category: 'shipping',
        });
      }
    }
  }

  // 3. Check minimum unit price undercutting verified floor price
  const truthPriceNums = extractDollarNumbers(
    truthSheet.verified_pricing_summary
  );
  if (truthPriceNums.length > 0) {
    const minVerifiedPrice = Math.min(...truthPriceNums);
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (brandFirstToken && !lower.includes(brandFirstToken)) continue;
      if (/shipping|delivery/i.test(sentence)) continue;

      const claimedPrices = extractDollarNumbers(sentence);
      for (const claimed of claimedPrices) {
        if (
          claimed > 0 &&
          claimed < minVerifiedPrice - 3 &&
          !details.some((d) => d.claim_text === sentence)
        ) {
          details.push({
            claim_text: sentence,
            verified_truth: truthSheet.verified_pricing_summary,
            severity: 'medium',
            category: 'pricing',
          });
          break;
        }
      }
    }
  }

  return details;
}

export function computeAccuracyScore(
  hallucinations: HallucinationDetail[]
): number {
  if (hallucinations.length === 0) return 100;
  let penalty = 0;
  for (const h of hallucinations) {
    if (h.severity === 'high') penalty += 28;
    else if (h.severity === 'medium') penalty += 16;
    else penalty += 8;
  }
  return Math.max(15, 100 - penalty);
}
