import {
  findPublishedScorecardByDomain,
  type PublishedDomainScorecard,
} from './published-reports';

export interface CuratedMatchupSpec {
  slug: string;
  cohort: string;
  domainA: string;
  domainB: string;
  angle: string;
}

export function buildMatchupSlug(domainA: string, domainB: string): string {
  const cleanA = domainA
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const cleanB = domainB
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${cleanA}-vs-${cleanB}`;
}

const RAW_CURATED_MATCHUPS: ReadonlyArray<Omit<CuratedMatchupSpec, 'slug'>> = [
  {
    cohort: 'AI & CODE EDITORS',
    domainA: 'cursor.com',
    domainB: 'zed.dev',
    angle:
      'Published /llms.txt + clean SSR copy vs. missing retrieval directory and thin schema.',
  },
  {
    cohort: 'AI SEARCH & FOUNDATION',
    domainA: 'mistral.ai',
    domainB: 'perplexity.ai',
    angle:
      'Open crawler rules + structured entity metadata vs. strict edge WAF restrictions.',
  },
  {
    cohort: 'TERMINAL & RUNTIME',
    domainA: 'warp.dev',
    domainB: 'deno.com',
    angle:
      'Multi-block JSON-LD + /llms.txt coverage vs. partial schema.org entity declarations.',
  },
  {
    cohort: 'SHOPIFY VS. HEADLESS DTC',
    domainA: 'floydhome.com',
    domainB: 'article.com',
    angle:
      'Native Shopify Product/Offer JSON-LD vs. custom headless Next.js hydration gap.',
  },
  {
    cohort: 'WEARABLES ARCHITECTURE',
    domainA: 'ouraring.com',
    domainB: 'whoop.com',
    angle:
      'Server-rendered commerce schema vs. client-heavy React storefront blocking extraction.',
  },
  {
    cohort: 'APPAREL COMMERCE STACK',
    domainA: 'goodamerican.com',
    domainB: 'fabletics.com',
    angle:
      'Shopify OS 2.0 bot readability + Offer graph vs. custom JS membership gate.',
  },
  {
    cohort: 'CLOUD DATABASES',
    domainA: 'supabase.com',
    domainB: 'planetscale.com',
    angle:
      'Developer docs /llms.txt + entity graph vs. lean marketing landing schema.',
  },
  {
    cohort: 'COOKWARE & HOME DTC',
    domainA: 'madeincookware.com',
    domainB: 'materialkitchen.com',
    angle:
      '3-pillar Organization/Product/FAQ JSON-LD vs. single-pillar storefront baseline.',
  },
  {
    cohort: 'B2B WORKFLOW SAAS',
    domainA: 'linear.app',
    domainB: 'cal.com',
    angle:
      'High-density SSR product copy vs. open-source scheduling schema & crawler rules.',
  },
  {
    cohort: 'AI CLOUD COMPUTE',
    domainA: 'railway.app',
    domainB: 'modal.com',
    angle:
      'Structured Organization + FAQPage JSON-LD vs. developer docs crawler posture.',
  },
  {
    cohort: 'LLM INFERENCE INFRA',
    domainA: 'cohere.com',
    domainB: 'groq.com',
    angle:
      'Enterprise entity schema + open crawler rules vs. minimal homepage JSON-LD.',
  },
  {
    cohort: 'MODEL HOSTING PLATFORMS',
    domainA: 'together.ai',
    domainB: 'replicate.com',
    angle:
      'Published /llms.txt + Webflow schema vs. developer API landing structure.',
  },
  {
    cohort: 'SLEEP & HOME COMMERCE',
    domainA: 'casper.com',
    domainB: 'parachutehome.com',
    angle:
      'Multi-pillar Offer + Product schema vs. single-pillar DTC storefront metadata.',
  },
  {
    cohort: 'DTC FURNITURE STACK',
    domainA: 'burrow.com',
    domainB: 'outer.com',
    angle:
      'Shopify OS 2.0 structured product catalog vs. custom Next.js client rendering.',
  },
  {
    cohort: 'HIGH-TRAFFIC SHOPIFY',
    domainA: 'skims.com',
    domainB: 'ruggable.com',
    angle:
      'Storefront crawler WAF posture, /agents.md status, and Offer JSON-LD comparison.',
  },
  {
    cohort: 'DEVELOPER EMAIL API',
    domainA: 'resend.com',
    domainB: 'loops.so',
    angle:
      'Technical docs /llms.txt + SSR density vs. SaaS marketing schema graph.',
  },
  {
    cohort: 'PRODUCT & LINK ANALYTICS',
    domainA: 'posthog.com',
    domainB: 'dub.co',
    angle:
      'Open-source docs retrieval index vs. modern SaaS JSON-LD & crawler rules.',
  },
  {
    cohort: 'DEV DOCS & PRODUCTIVITY',
    domainA: 'mintlify.com',
    domainB: 'raycast.com',
    angle:
      'Documentation-native /llms.txt protocol support vs. desktop app web metadata.',
  },
  {
    cohort: 'PRESTIGE BEAUTY STACK',
    domainA: 'fentybeauty.com',
    domainB: 'dae.com',
    angle:
      'Shopify OS 2.0 Product + Offer JSON-LD vs. custom headless Next.js hydration gap.',
  },
  {
    cohort: 'HAIRCARE COMMERCE',
    domainA: 'crownaffair.com',
    domainB: 'amika.com',
    angle:
      'Server-rendered Shopify catalog schema vs. custom Next.js storefront.',
  },
  {
    cohort: 'AI AGENT FRAMEWORKS',
    domainA: 'llamaindex.ai',
    domainB: 'langchain.com',
    angle:
      'Next.js documentation schema + /llms.txt vs. Webflow marketing site metadata.',
  },
  {
    cohort: 'AGENT CODE SANDBOXES',
    domainA: 'e2b.dev',
    domainB: 'daytona.io',
    angle:
      'Multi-pillar JSON-LD + /llms.txt readiness vs. Framer landing page structure.',
  },
  {
    cohort: 'WEB DESIGN & VISUAL TOOLS',
    domainA: 'webflow.com',
    domainB: 'figma.com',
    angle:
      'Open crawler posture + SSR marketing copy vs. strict edge crawler restrictions.',
  },
  {
    cohort: 'ENTERPRISE AUTH INFRA',
    domainA: 'workos.com',
    domainB: 'stytch.com',
    angle:
      'Webflow structured entity metadata + /llms.txt vs. custom Next.js landing baseline.',
  },
  {
    cohort: 'BACKGROUND WORKFLOW QUEUES',
    domainA: 'inngest.com',
    domainB: 'trigger.dev',
    angle:
      'Developer docs /llms.txt + JSON-LD coverage across background job engines.',
  },
  {
    cohort: 'SERVERLESS DATA & CACHING',
    domainA: 'upstash.com',
    domainB: 'turso.tech',
    angle:
      'Published /llms.txt + entity schema vs. edge SQLite developer landing metadata.',
  },
  {
    cohort: 'ERROR & INCIDENT OBSERVABILITY',
    domainA: 'sentry.io',
    domainB: 'betterstack.com',
    angle:
      'Open crawler access + structured telemetry docs vs. SaaS observability landing graph.',
  },
  {
    cohort: 'SHOPIFY PLUS COMMERCE',
    domainA: 'oseamalibu.com',
    domainB: 'trueclassictees.com',
    angle:
      'Side-by-side Shopify Plus Product + Offer JSON-LD and /agents.md protocol parity.',
  },
  {
    cohort: 'CORPORATE SPEND & FINTECH',
    domainA: 'brex.com',
    domainB: 'ramp.com',
    angle:
      'Head-to-head B2B fintech crawler access, SSR copy density, and schema.org entity coverage.',
  },
  {
    cohort: 'GLOBAL HRIS & PAYROLL',
    domainA: 'deel.com',
    domainB: 'rippling.com',
    angle:
      'Enterprise HRIS /llms.txt posture and structured JSON-LD readiness across global payroll platforms.',
  },
  {
    cohort: 'MENSWEAR SHOPIFY VS. HEADLESS',
    domainA: 'buckmason.com',
    domainB: 'rhone.com',
    angle:
      'Shopify Product + Offer JSON-LD and SSR catalog copy vs. custom Next.js WAF/crawler gap.',
  },
];

export interface ResolvedPublishedMatchup extends CuratedMatchupSpec {
  cardA: PublishedDomainScorecard;
  cardB: PublishedDomainScorecard;
}

export function getPublishedMatchups(): ResolvedPublishedMatchup[] {
  const out: ResolvedPublishedMatchup[] = [];
  for (const item of RAW_CURATED_MATCHUPS) {
    const cardA = findPublishedScorecardByDomain(item.domainA);
    const cardB = findPublishedScorecardByDomain(item.domainB);
    if (!cardA || !cardB) continue;
    out.push({
      ...item,
      slug: buildMatchupSlug(cardA.domain, cardB.domain),
      cardA,
      cardB,
    });
  }
  return out;
}

export function findPublishedMatchupBySlug(
  rawSlug: string
): ResolvedPublishedMatchup | null {
  const clean = decodeURIComponent(rawSlug ?? '')
    .trim()
    .toLowerCase();
  if (!clean) return null;

  const all = getPublishedMatchups();
  const exact = all.find((m) => m.slug === clean);
  if (exact) return exact;

  // Also resolve reversed slug order cleanly
  const reversed = all.find(
    (m) => buildMatchupSlug(m.domainB, m.domainA) === clean
  );
  return reversed ?? null;
}
