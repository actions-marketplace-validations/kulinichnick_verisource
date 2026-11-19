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
  {
    cohort: 'SECURITY COMPLIANCE SAAS',
    domainA: 'vanta.com',
    domainB: 'drata.com',
    angle:
      'Webflow open crawler posture and SSR copy vs. custom Next.js edge firewall restrictions.',
  },
  {
    cohort: 'ENTERPRISE OBSERVABILITY & INCIDENT',
    domainA: 'pagerduty.com',
    domainB: 'datadoghq.com',
    angle:
      'Multi-block WordPress JSON-LD + /llms.txt vs. custom Next.js developer telemetry landing graph.',
  },
  {
    cohort: 'FUNCTIONAL BEVERAGE SHOPIFY',
    domainA: 'athleticbrewing.com',
    domainB: 'drinklmnt.com',
    angle:
      'Shopify Product + Offer JSON-LD parity vs. storefront /agents.md pricing guardrails.',
  },
  {
    cohort: 'INCIDENT RESPONSE AUTOMATION',
    domainA: 'rootly.com',
    domainB: 'incident.io',
    angle:
      'Multi-pillar JSON-LD + /llms.txt coverage vs. missing /agents.md pricing guardrails.',
  },
  {
    cohort: 'ENTERPRISE PRODUCT ANALYTICS',
    domainA: 'amplitude.com',
    domainB: 'mixpanel.com',
    angle:
      'Custom Next.js vs. Framer SSR readability, /llms.txt, and schema.org entity parity.',
  },
  {
    cohort: 'CUSTOMER LIFECYCLE PLATFORMS',
    domainA: 'customer.io',
    domainB: 'braze.com',
    angle:
      'Published /llms.txt + entity metadata across enterprise messaging and lifecycle clouds.',
  },
  {
    cohort: 'CORPORATE TRAVEL & EXPENSE',
    domainA: 'brex.com',
    domainB: 'navan.com',
    angle:
      'Server-rendered B2B spend copy and JSON-LD baseline across travel and card platforms.',
  },
  {
    cohort: 'DEVELOPER NETWORKING & TUNNELS',
    domainA: 'ngrok.com',
    domainB: 'tailscale.com',
    angle:
      'Published /llms.txt + technical entity metadata across developer networking stacks.',
  },
  {
    cohort: 'INTERNAL DEVELOPER PORTALS',
    domainA: 'port.io',
    domainB: 'cortex.io',
    angle:
      'Webflow structured schema + /llms.txt vs. custom Next.js portal landing baseline.',
  },
  {
    cohort: 'ENGINEERING VELOCITY SAAS',
    domainA: 'linearb.io',
    domainB: 'swarmia.com',
    angle:
      'B2B engineering metrics /llms.txt posture, SSR copy density, and JSON-LD coverage.',
  },
  {
    cohort: 'EVERYDAY CARRY SHOPIFY VS. HEADLESS',
    domainA: 'peakdesign.com',
    domainB: 'bellroy.com',
    angle:
      'Shopify Product + Offer JSON-LD catalog feed vs. custom headless Next.js storefront.',
  },
  {
    cohort: 'AI CUSTOMER SUPPORT PLATFORMS',
    domainA: 'intercom.com',
    domainB: 'zendesk.com',
    angle:
      'Enterprise customer service /llms.txt posture, SSR copy density, and entity schema.',
  },
  {
    cohort: 'MODERN GTM & CRM WORKFLOWS',
    domainA: 'folk.app',
    domainB: 'clay.com',
    angle:
      'Webflow structured entity metadata and /llms.txt readiness across modern GTM stacks.',
  },
  {
    cohort: 'FINE JEWELRY SHOPIFY',
    domainA: 'gorjana.com',
    domainB: 'mejuri.com',
    angle:
      'Shopify Product + Offer JSON-LD parity vs. storefront /agents.md pricing guardrails.',
  },
  {
    cohort: 'MODERN APPAREL COMMERCE',
    domainA: 'everlane.com',
    domainB: 'quince.com',
    angle:
      'Native Shopify OS 2.0 catalog schema vs. custom Next.js direct-to-consumer storefront.',
  },
  {
    cohort: 'AI APP BUILDERS',
    domainA: 'replit.com',
    domainB: 'lovable.dev',
    angle:
      'Published /llms.txt + SSR developer copy vs. client-heavy SPA landing page gap.',
  },
  {
    cohort: 'PROMPT-TO-UI PLATFORMS',
    domainA: 'bolt.new',
    domainB: 'v0.dev',
    angle:
      'Head-to-head AI code generator crawler access, /llms.txt status, and JSON-LD baseline.',
  },
  {
    cohort: 'AI VIDEO GENERATION',
    domainA: 'runwayml.com',
    domainB: 'pika.art',
    angle:
      'Generative video foundation model SSR readability, /llms.txt, and entity schema.',
  },
  {
    cohort: 'B2B OUTBOUND & ENRICHMENT',
    domainA: 'apollo.io',
    domainB: 'clay.com',
    angle:
      'Enterprise sales intelligence /llms.txt index vs. Webflow GTM workflow metadata.',
  },
  {
    cohort: 'AI IMAGE GENERATION',
    domainA: 'ideogram.ai',
    domainB: 'midjourney.com',
    angle:
      'Multi-pillar JSON-LD + /llms.txt readiness vs. strict edge WAF crawler blocks.',
  },
  {
    cohort: 'AI MUSIC GENERATION',
    domainA: 'suno.com',
    domainB: 'udio.com',
    angle:
      'Published /llms.txt + entity metadata vs. client-rendered audio app landing baseline.',
  },
  {
    cohort: 'AI PODCAST & VIDEO EDITING',
    domainA: 'descript.com',
    domainB: 'riverside.fm',
    angle:
      'Next.js /llms.txt + structured schema vs. Webflow studio landing metadata.',
  },
  {
    cohort: 'LUXURY STREETWEAR SHOPIFY',
    domainA: 'kith.com',
    domainB: 'aimeleondore.com',
    angle:
      'Shopify Plus Product + Offer JSON-LD parity vs. storefront /agents.md guardrails.',
  },
  {
    cohort: 'VISUAL DESIGN SUITE WAF POSTURE',
    domainA: 'figma.com',
    domainB: 'canva.com',
    angle:
      'Head-to-head enterprise design suite edge WAF crawler rules, /llms.txt, and JSON-LD.',
  },
  {
    cohort: 'VISUAL COLLABORATION BOARDS',
    domainA: 'whimsical.com',
    domainB: 'miro.com',
    angle:
      'Custom Next.js /llms.txt + SSR copy vs. Framer visual workspace landing baseline.',
  },
  {
    cohort: 'AI MEETING NOTETAKERS',
    domainA: 'fireflies.ai',
    domainB: 'otter.ai',
    angle:
      'Next.js structured schema + /llms.txt vs. Webflow meeting assistant landing graph.',
  },
  {
    cohort: 'AI PRESENTATION PLATFORMS',
    domainA: 'pitch.com',
    domainB: 'gamma.app',
    angle:
      'Framer SSR deck copy + entity metadata vs. client-rendered presentation app.',
  },
  {
    cohort: 'ENTERPRISE WORK MANAGEMENT',
    domainA: 'asana.com',
    domainB: 'monday.com',
    angle:
      'Multi-pillar JSON-LD + /llms.txt readiness vs. Webflow work OS landing graph.',
  },
  {
    cohort: 'PROJECT MANAGEMENT SAAS',
    domainA: 'monday.com',
    domainB: 'clickup.com',
    angle:
      'Head-to-head B2B project management /llms.txt status, SSR copy, and schema coverage.',
  },
  {
    cohort: 'COLLABORATIVE DOCS & WORKSPACES',
    domainA: 'notion.so',
    domainB: 'coda.io',
    angle:
      'AI workspace crawler access, /llms.txt posture, and homepage JSON-LD parity.',
  },
  {
    cohort: 'AI CALENDAR SCHEDULING',
    domainA: 'reclaim.ai',
    domainB: 'clockwise.com',
    angle:
      'Webflow structured entity metadata vs. custom Next.js AI calendar landing baseline.',
  },
  {
    cohort: 'MODERN FORM BUILDERS',
    domainA: 'tally.so',
    domainB: 'typeform.com',
    angle:
      'Published /llms.txt + SSR copy density vs. Webflow form builder schema graph.',
  },
  {
    cohort: 'SMB & MID-MARKET CRM',
    domainA: 'hubspot.com',
    domainB: 'pipedrive.com',
    angle:
      'Head-to-head B2B CRM crawler rules, /llms.txt index, and homepage JSON-LD parity.',
  },
  {
    cohort: 'CUSTOMER SUPPORT DESKS',
    domainA: 'crisp.chat',
    domainB: 'helpscout.com',
    angle:
      'Live chat & helpdesk /llms.txt posture, SSR word count, and entity schema.',
  },
  {
    cohort: 'OUTDOOR TECHNICAL APPAREL',
    domainA: 'patagonia.com',
    domainB: 'arcteryx.com',
    angle:
      'Custom commerce crawler access, Product JSON-LD, and /agents.md readiness.',
  },
  {
    cohort: 'CREATOR NEWSLETTER PLATFORMS',
    domainA: 'beehiiv.com',
    domainB: 'substack.com',
    angle:
      'Multi-pillar JSON-LD + /llms.txt index on beehiiv vs. Substack SSR discovery baseline.',
  },
  {
    cohort: 'ECOMMERCE LIFECYCLE MARKETING',
    domainA: 'klaviyo.com',
    domainB: 'mailchimp.com',
    angle:
      'Head-to-head AI crawler rules, /llms.txt protocol feeds, and entity schema parity.',
  },
  {
    cohort: 'FREELANCE TALENT MARKETPLACES',
    domainA: 'upwork.com',
    domainB: 'fiverr.com',
    angle:
      'Edge WAF bot posture, SSR token extraction, and marketplace JSON-LD readiness.',
  },
  {
    cohort: 'PERFORMANCE RUNNING FOOTWEAR',
    domainA: 'on-running.com',
    domainB: 'hoka.com',
    angle:
      'Custom athletic commerce crawler access, Product Offer JSON-LD, and /agents.md posture.',
  },
  {
    cohort: 'SAAS MERCHANT OF RECORD BILLING',
    domainA: 'paddle.com',
    domainB: 'lemonsqueezy.com',
    angle:
      'Head-to-head AI crawler rules, /llms.txt feeds, and billing entity JSON-LD.',
  },
  {
    cohort: 'DEVELOPER & CREATOR CHECKOUT',
    domainA: 'polar.sh',
    domainB: 'gumroad.com',
    angle:
      'Open-source developer monetization vs. creator checkout SSR copy and protocol feeds.',
  },
  {
    cohort: 'CREATOR COURSE & MEMBERSHIP SAAS',
    domainA: 'kajabi.com',
    domainB: 'teachable.com',
    angle:
      'Course platform /llms.txt readiness, GPTBot access, and homepage schema.org coverage.',
  },
  {
    cohort: 'DIGITAL COURSE & PRODUCT BUILDERS',
    domainA: 'podia.com',
    domainB: 'thinkific.com',
    angle:
      'Server-rendered pricing & product copy, /llms.txt index, and entity JSON-LD parity.',
  },
  {
    cohort: 'PAID COMMUNITY & COHORT PLATFORMS',
    domainA: 'skool.com',
    domainB: 'circle.so',
    angle:
      'Community platform crawler access, /llms.txt feeds, and homepage entity JSON-LD.',
  },
  {
    cohort: 'INDEPENDENT CREATOR MEMBERSHIP',
    domainA: 'ghost.org',
    domainB: 'patreon.com',
    angle:
      'Open-source publishing protocol feeds vs. creator membership WAF and schema posture.',
  },
  {
    cohort: 'GLOBAL B2B TREASURY & FX',
    domainA: 'wise.com',
    domainB: 'airwallex.com',
    angle:
      'Cross-border B2B payment crawler rules, /llms.txt feeds, and fee entity schema.',
  },
  {
    cohort: 'CLOUD ACCOUNTING & EXPENSE SAAS',
    domainA: 'xero.com',
    domainB: 'expensify.com',
    angle:
      'Accounting platform AI bot readability, /llms.txt posture, and homepage JSON-LD.',
  },
  {
    cohort: 'AI WORKFLOW & AGENT AUTOMATION',
    domainA: 'make.com',
    domainB: 'n8n.io',
    angle:
      'Visual workflow builder /llms.txt index vs. open-source AI agent automation SSR copy and entity JSON-LD.',
  },
  {
    cohort: 'CUSTOMER IDENTITY & AUTH INFRASTRUCTURE',
    domainA: 'auth0.com',
    domainB: 'descope.com',
    angle:
      'Enterprise CIAM crawler posture, /llms.txt documentation feeds, and authentication entity JSON-LD.',
  },
  {
    cohort: 'SMB & CLOUD ACCOUNTING SAAS',
    domainA: 'xero.com',
    domainB: 'freshbooks.com',
    angle:
      'Small-business cloud accounting AI bot rules, /llms.txt readiness, and homepage schema.org parity.',
  },
  {
    cohort: 'DTC MATTRESS & SLEEP COMMERCE',
    domainA: 'purple.com',
    domainB: 'saatva.com',
    angle:
      'Direct-to-consumer mattress crawler readability, Product Offer JSON-LD, and /agents.md commerce readiness.',
  },
  {
    cohort: 'OPEN-SOURCE FEATURE FLAGS & EXPERIMENTATION',
    domainA: 'flagsmith.com',
    domainB: 'growthbook.io',
    angle:
      'Open-source feature flag /llms.txt feeds, GPTBot access, and developer documentation JSON-LD parity.',
  },
  {
    cohort: 'ENTERPRISE CRO & A/B TESTING',
    domainA: 'optimizely.com',
    domainB: 'vwo.com',
    angle:
      'Enterprise experimentation WAF posture, /llms.txt protocol feeds, and homepage entity JSON-LD.',
  },
  {
    cohort: 'SESSION REPLAY & PRODUCT ANALYTICS',
    domainA: 'fullstory.com',
    domainB: 'logrocket.com',
    angle:
      'Digital experience analytics crawler rules, SSR token density, and schema.org entity coverage.',
  },
  {
    cohort: 'PRODUCT ADOPTION & IN-APP ONBOARDING',
    domainA: 'appcues.com',
    domainB: 'userpilot.com',
    angle:
      'SaaS onboarding platform AI bot readability, /llms.txt index, and pricing entity schema.',
  },
  {
    cohort: 'PRODUCT DISCOVERY & USER RESEARCH',
    domainA: 'maze.co',
    domainB: 'usertesting.com',
    angle:
      'Continuous product research /llms.txt feeds vs. enterprise UX testing WAF and entity JSON-LD posture.',
  },
  {
    cohort: 'COMPETITIVE INTELLIGENCE & BATTLECARDS',
    domainA: 'klue.com',
    domainB: 'crayon.co',
    angle:
      'Competitive enablement AI crawler rules, /llms.txt documentation feeds, and homepage entity schema.',
  },
  {
    cohort: 'DIGITAL ADOPTION & PRODUCT ANALYTICS',
    domainA: 'walkme.com',
    domainB: 'pendo.io',
    angle:
      'Enterprise digital adoption WAF posture, SSR token extraction, and schema.org entity coverage.',
  },
  {
    cohort: 'DTC MATTRESS & BEDDING COMMERCE',
    domainA: 'tuftandneedle.com',
    domainB: 'nectarsleep.com',
    angle:
      'Direct-to-consumer sleep commerce crawler readability, Product Offer JSON-LD, and /agents.md readiness.',
  },
  {
    cohort: 'SALES ENGAGEMENT & REVENUE WORKFLOWS',
    domainA: 'outreach.io',
    domainB: 'salesloft.com',
    angle:
      'Enterprise sales engagement crawler rules, /llms.txt documentation feeds, and homepage entity JSON-LD.',
  },
  {
    cohort: 'ACCOUNT-BASED MARKETING & INTENT DATA',
    domainA: '6sense.com',
    domainB: 'demandbase.com',
    angle:
      'B2B intent platform WAF posture, SSR token extraction, and schema.org entity coverage.',
  },
  {
    cohort: 'B2B CONTACT & GTM INTELLIGENCE',
    domainA: 'zoominfo.com',
    domainB: 'lusha.com',
    angle:
      'GTM data provider AI bot readability, /llms.txt protocol feeds, and pricing entity schema.',
  },
  {
    cohort: 'LUXURY TRAVEL & LUGGAGE COMMERCE',
    domainA: 'rimowa.com',
    domainB: 'tumi.com',
    angle:
      'Global travel goods crawler access, Product Offer JSON-LD, and /agents.md commerce readiness.',
  },
  {
    cohort: 'ENTERPRISE DATA CLOUD & LAKEHOUSE',
    domainA: 'snowflake.com',
    domainB: 'databricks.com',
    angle:
      'Enterprise data cloud WAF posture, /llms.txt documentation feeds, and schema.org entity coverage.',
  },
  {
    cohort: 'ELT DATA INTEGRATION PIPELINES',
    domainA: 'fivetran.com',
    domainB: 'airbyte.com',
    angle:
      'Data connector platform AI crawler access, /llms.txt feeds, and homepage entity JSON-LD.',
  },
  {
    cohort: 'ENTERPRISE VS. OPEN-SOURCE BI',
    domainA: 'tableau.com',
    domainB: 'metabase.com',
    angle:
      'Business intelligence AI bot readability, /llms.txt index, and pricing entity schema.',
  },
  {
    cohort: 'CLOUD BI & AGENTIC ANALYTICS',
    domainA: 'preset.io',
    domainB: 'thoughtspot.com',
    angle:
      'Analytics platform SSR token extraction, /llms.txt feeds, and homepage JSON-LD parity.',
  },
  {
    cohort: 'EVENT STREAMING & KAFKA PLATFORMS',
    domainA: 'confluent.io',
    domainB: 'redpanda.com',
    angle:
      'Streaming data infrastructure AI bot access, /llms.txt docs index, and homepage JSON-LD.',
  },
  {
    cohort: 'REAL-TIME OLAP & SERVERLESS DUCKDB',
    domainA: 'clickhouse.com',
    domainB: 'motherduck.com',
    angle:
      'High-speed analytical database SSR word density, /llms.txt feeds, and schema.org entity coverage.',
  },
  {
    cohort: 'E-SIGNATURE & DOCUMENT WORKFLOWS',
    domainA: 'pandadoc.com',
    domainB: 'docusign.com',
    angle:
      'Document automation WAF posture, GPTBot readability, and structured pricing schema.',
  },
  {
    cohort: 'SALES PROPOSALS & DEAL ROOMS',
    domainA: 'proposify.com',
    domainB: 'qwilr.com',
    angle:
      'Proposal software AI crawler access, non-JS HTML extraction, and entity JSON-LD coverage.',
  },
  {
    cohort: 'CONTRACT LIFECYCLE MANAGEMENT',
    domainA: 'juro.com',
    domainB: 'spotdraft.com',
    angle:
      'Legal Ops Webflow comparison: /llms.txt + entity schema coverage vs. partial schema structure.',
  },
  {
    cohort: 'CLOUD SECURITY & CNAPP PLATFORMS',
    domainA: 'crowdstrike.com',
    domainB: 'wiz.io',
    angle:
      'Enterprise cloud security AI bot readability, SSR extractability, and schema.org metadata.',
  },
  {
    cohort: 'CUSTOMER DATA INFRASTRUCTURE',
    domainA: 'segment.com',
    domainB: 'rudderstack.com',
    angle:
      'Customer data pipeline docs /llms.txt indexing, crawler rules, and entity JSON-LD parity.',
  },
  {
    cohort: 'ENTERPRISE SSO & IDENTITY AUTH',
    domainA: 'okta.com',
    domainB: 'workos.com',
    angle:
      'Developer-first identity JSON-LD + /llms.txt docs structure vs. enterprise IAM SSR posture.',
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
