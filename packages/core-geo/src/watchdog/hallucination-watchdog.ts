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
    const cloned = structuredClone(knownFixture.brand_truth_sheet);
    // If live storefront HTML is reachable and exposes a concrete $ shipping banner that differs, prefer live store truth
    if (probe.reachable && probe.extractedShippingMentions.length > 0) {
      const liveBanner = probe.extractedShippingMentions.find((s) =>
        /\$\d{1,4}/.test(s)
      );
      if (liveBanner) {
        const liveNums = extractDollarNumbers(liveBanner);
        const fixtureNums = extractDollarNumbers(
          cloned.shipping_or_service_area
        );
        if (
          liveNums.length > 0 &&
          fixtureNums.length > 0 &&
          liveNums[0] !== fixtureNums[0]
        ) {
          cloned.shipping_or_service_area = liveBanner;
        }
      }
    }
    return cloned;
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

function extractShippingThresholdDollars(clause: string): number[] {
  const results: number[] = [];
  const patterns = [
    /(?:free\s+(?:[\w-]+\s+){0,3}(?:shipping|delivery)|ships?\s+(?:[\w-]+\s+){0,2}free)\s+(?:on\s+orders?\s+)?(?:over|above|at|from|of|for|minimum)?\s*\$(\d{1,5}(?:\.\d{1,2})?)/gi,
    /(?:orders?\s+(?:of|over|above|at\s+least)|minimum(?:\s+order)?(?:\s+of|\s+is)?|threshold(?:\s+is|\s+of)?)\s*\$(\d{1,5}(?:\.\d{1,2})?)/gi,
    /\$(\d{1,5}(?:\.\d{1,2})?)\+?\s*(?:minimum|min\b|orders?\s+ship\s+free|free\s+(?:shipping|delivery)|local\s+orders?)/gi,
  ];
  for (const rx of patterns) {
    let match: RegExpExecArray | null;
    while ((match = rx.exec(clause)) !== null) {
      const val = Number.parseFloat(match[1] ?? '');
      if (Number.isFinite(val) && !results.includes(val)) {
        results.push(val);
      }
    }
  }
  return results;
}

function cleanClaimExcerpt(raw: string): string {
  return raw
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?:\[\d+\])+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitBrandScopedUnits(text: string, brandFirstToken: string): string[] {
  // 1. Split across newlines, Markdown list bullets (both multiline and inline collapsed `- **Brand**`),
  //    and sentence punctuation even when followed by Perplexity/ChatGPT `[1]` footnote brackets.
  const primarySegments = text
    .split(
      /\r?\n+\s*(?:[-*•]|\d+[.)])\s+|\r?\n+|\s+[-•*]\s+(?=\*\*[A-Z0-9])|(?<=[.!?])(?:\s*(?:\[\d+\]|\(\d+\)|["'”’])+)*\s+/
    )
    .map((s) => s.trim())
    .filter(Boolean);

  const units: string[] = [];
  for (const segment of primarySegments) {
    if (brandFirstToken && !segment.toLowerCase().includes(brandFirstToken)) {
      continue;
    }

    // 2. If a compound sentence contrasts multiple brands (`Kingdom charges $14, while Mosaic...`),
    //    narrow down to the sub-clause(s) that actually mention the target brand.
    const subClauses = segment
      .split(/\s*(?:;\s+|,\s+(?:while|whereas|but|although)\s+)/i)
      .map((c) => c.trim())
      .filter(Boolean);

    if (subClauses.length > 1 && brandFirstToken) {
      const matchingSub = subClauses.filter((c) =>
        c.toLowerCase().includes(brandFirstToken)
      );
      if (matchingSub.length > 0) {
        units.push(...matchingSub);
        continue;
      }
    }
    units.push(segment);
  }

  return units;
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
  const brandFirstToken = brandName.split(/\s+/)[0]?.toLowerCase() ?? '';
  const sentences = splitBrandScopedUnits(answerExcerpt, brandFirstToken);

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
      const cleanedClaim = cleanClaimExcerpt(sentence);

      for (const term of uniqueTerms) {
        if (term.startsWith('$')) continue;
        if (lower.includes(term) && !hasNegationNear(lower, term)) {
          details.push({
            claim_text: cleanedClaim,
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
      if (
        !/free\s+(?:nationwide\s+|local\s+|us\s+|standard\s+)?(?:shipping|delivery)|ships?\s+(?:nationwide\s+|us\s+)?free/i.test(
          sentence
        )
      ) {
        continue;
      }

      const cleanedClaim = cleanClaimExcerpt(sentence);
      const claimedNums = extractShippingThresholdDollars(sentence);
      for (const claimed of claimedNums) {
        if (Math.abs(claimed - verifiedThreshold) >= 5) {
          details.push({
            claim_text: cleanedClaim,
            verified_truth: truthSheet.shipping_or_service_area,
            severity: 'high',
            category: 'shipping',
          });
          break;
        }
      }

      // Also catch claiming "free nationwide shipping" ONLY when verified truth is strictly local-only delivery
      if (
        /free\s+nationwide\s+shipping/i.test(sentence) &&
        /local\s+(?:hand-)?delivery/i.test(truthSheet.shipping_or_service_area) &&
        !/free\s+(?:us\s+|nationwide\s+)?shipping/i.test(
          truthSheet.shipping_or_service_area
        ) &&
        !details.some((d) => d.claim_text === cleanedClaim)
      ) {
        details.push({
          claim_text: cleanedClaim,
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

      const cleanedClaim = cleanClaimExcerpt(sentence);
      const claimedPrices = extractDollarNumbers(sentence);
      for (const claimed of claimedPrices) {
        if (
          claimed > 0 &&
          claimed < minVerifiedPrice - 3 &&
          !details.some((d) => d.claim_text === cleanedClaim)
        ) {
          details.push({
            claim_text: cleanedClaim,
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
