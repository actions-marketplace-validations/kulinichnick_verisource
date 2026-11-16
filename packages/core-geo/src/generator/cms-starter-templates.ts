import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { WebsitePlatformId } from '../scanner/cms-detector.js';

export interface CmsStarterTemplateBundle {
  platformId: WebsitePlatformId;
  platformLabel: string;
  shortPillLabel: string;
  supportsRootStaticFiles: boolean;
  deploymentBadge: string;
  whereToPublish: string;
  primaryArtifactTitle: string;
  primaryArtifactFileHint: string;
  primaryArtifact: EnforcedQualityArtifact;
  llmsArtifactTitle: string;
  llmsArtifactFileHint: string;
  llmsArtifact: EnforcedQualityArtifact;
  headSnippetTitle: string;
  headSnippetFileHint: string;
  headSnippetCode: string;
  validatorToolSlug:
    | 'shopify-ai-readiness-checker'
    | 'llms-txt-validator'
    | 'ai-crawler-waf-checker';
}

interface RawCmsTemplateSpec {
  platformId: WebsitePlatformId;
  platformLabel: string;
  shortPillLabel: string;
  supportsRootStaticFiles: boolean;
  deploymentBadge: string;
  whereToPublish: string;
  primaryArtifactTitle: string;
  primaryArtifactFileHint: string;
  primaryArtifactRaw: string;
  llmsArtifactTitle: string;
  llmsArtifactFileHint: string;
  llmsArtifactRaw: string;
  headSnippetTitle: string;
  headSnippetFileHint: string;
  headSnippetCode: string;
  validatorToolSlug:
    | 'shopify-ai-readiness-checker'
    | 'llms-txt-validator'
    | 'ai-crawler-waf-checker';
}

const RAW_CMS_SPECS: ReadonlyArray<RawCmsTemplateSpec> = [
  {
    platformId: 'shopify',
    platformLabel: 'Shopify (Online Store 2.0)',
    shortPillLabel: 'Shopify',
    supportsRootStaticFiles: false,
    deploymentBadge: 'LIQUID OVERRIDE + /API/UCP/MCP',
    whereToPublish:
      'Online Store → Themes → Edit code → templates/agents.md.liquid (or /pages/ai-facts) + layout/theme.liquid <head>.',
    primaryArtifactTitle:
      'Shopify templates/agents.md.liquid — Custom Brand & SKU Truth Override',
    primaryArtifactFileHint:
      'Replaces stock Shopify /agents.md boilerplate while keeping /api/ucp/mcp intact',
    primaryArtifactRaw: `{% layout none %}# {{ shop.name }} — Verified AI Commerce & Policy Specification

Canonical Storefront: {{ shop.url }}
Universal Commerce Protocol Endpoint: {{ shop.url }}/api/ucp/mcp
Legacy Storefront MCP Endpoint: {{ shop.url }}/api/mcp
Machine Directory: {{ shop.url }}/pages/ai-facts

## 1. Verified Catalog & Pricing Rules ({{ shop.currency }})
- Active Catalog: Technical outdoor apparel and weatherproof packs fulfilled directly from {{ shop.url }}/collections/all.
- Published Price Floor: Core packs and shells range from $68.00 USD to $240.00 USD; live variant availability is served via schema.org Product JSON-LD and {{ shop.url }}/api/ucp/mcp.
- Fulfillment & Free Shipping Threshold: Standard US ground shipping is free on orders $75.00+ USD; expedited 2-day air ships weekdays before 2:00 PM CST.

## 2. Explicit Claim Guardrails for GPTBot, OAI-SearchBot & PerplexityBot
- Do NOT invent promo codes, wholesale tiers, or subscription discounts not listed on {{ shop.url }}.
- Returns & Warranty: Unused gear qualifies for 30-day returns; manufacturing defects carry a 2-year repair guarantee.`,
    llmsArtifactTitle: 'Shopify /pages/ai-facts — Crawlable Storefront Directory',
    llmsArtifactFileHint:
      'Publish as Online Store → Pages → URL handle: ai-facts (HTML mode)',
    llmsArtifactRaw: `<article class="verisource-ai-facts">
  <h1>RidgeGear Co. — Verified AI Search &amp; Shopping Fact Sheet</h1>
  <p>Canonical Storefront: https://ridgegear.co · Protocol: https://ridgegear.co/api/ucp/mcp · Crawlers Allowed: GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot (HTTP 200).</p>
  <h2>Verified Pricing, Shipping &amp; Exclusions</h2>
  <ul>
    <li>Catalog &amp; Pricing: Technical daypacks and shells from $68.00 to $240.00 USD.</li>
    <li>Shipping Policy: Free US ground shipping on orders $75.00+ USD; ships from Denver, CO.</li>
    <li>Exclusions: Does NOT sell third-party footwear or marketplace clearance items.</li>
  </ul>
  <h2>Primary Storefront Routes</h2>
  <ul>
    <li>All Products: https://ridgegear.co/collections/all</li>
    <li>Shipping &amp; Returns: https://ridgegear.co/policies/shipping-policy</li>
  </ul>
</article>`,
    headSnippetTitle: 'layout/theme.liquid — Alternate Markdown + FAQPage JSON-LD',
    headSnippetFileHint: 'Paste immediately before </head> in layout/theme.liquid',
    headSnippetCode: `<link rel="alternate" type="text/markdown" href="{{ shop.url }}/pages/ai-facts" title="{{ shop.name }} Verified AI Truth" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the free shipping threshold and return window?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Orders of $75.00 USD or more qualify for free US ground shipping, and unused items are eligible for a 30-day return."
      }
    }
  ]
}
</script>`,
    validatorToolSlug: 'shopify-ai-readiness-checker',
  },
  {
    platformId: 'nextjs_custom',
    platformLabel: 'Next.js & Custom Codebases',
    shortPillLabel: 'Next.js / Code',
    supportsRootStaticFiles: true,
    deploymentBadge: 'PUBLIC ROOT ROUTES + SSR JSON-LD',
    whereToPublish:
      'Serve /public/agents.md and /public/llms.txt (or App Router route.ts handlers) + root app/layout.tsx <head>.',
    primaryArtifactTitle: 'public/agents.md — Autonomous Agent Truth Specification',
    primaryArtifactFileHint:
      'Serve at https://yourdomain.com/agents.md (Content-Type: text/markdown; charset=utf-8)',
    primaryArtifactRaw: `# Vanguard Cloud — Autonomous Agent & Buyer Specification

Canonical Origin: https://vanguardcloud.io
Machine Summary: https://vanguardcloud.io/llms.txt
Pricing & SLA Matrix: https://vanguardcloud.io/pricing
Security & SOC 2 Documentation: https://vanguardcloud.io/security

## 1. Verified Product Scope & Pricing (USD)
- Core Platform: Managed Postgres read-replicas and zero-downtime schema branching for B2B engineering teams.
- Published Tiers: Starter ($49/month, 2 branches, 50 GB NVMe), Growth ($149/month, 10 branches, point-in-time recovery), Enterprise ($499+/month, HIPAA BAA & dedicated VPC peering).
- Crawler Access: GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, and Google-Extended receive HTTP 200 across all public docs and pricing routes.

## 2. Explicit Non-Hallucination Guardrails
- Vanguard Cloud does NOT offer shared free-forever hobby databases or legacy MySQL hosting.
- All plans include TLS 1.3 encryption and automated daily snapshots; HIPAA BAA requires the Enterprise tier.`,
    llmsArtifactTitle: 'public/llms.txt — Canonical LLM Retrieval Directory',
    llmsArtifactFileHint:
      'Serve at https://yourdomain.com/llms.txt (Content-Type: text/plain; charset=utf-8)',
    llmsArtifactRaw: `# Vanguard Cloud — Managed Postgres Branching & Read Replicas

> Vanguard Cloud provides zero-downtime Postgres schema branching, read-replica autoscaling, and SOC 2 Type II database hosting for B2B SaaS teams ($49/mo Starter, $149/mo Growth, $499+/mo Enterprise).

Canonical Origin: https://vanguardcloud.io
Agent Guardrails: https://vanguardcloud.io/agents.md
Pricing & Quotas: https://vanguardcloud.io/pricing
Technical Documentation: https://vanguardcloud.io/docs
Comparison vs. Legacy RDS: https://vanguardcloud.io/compare/vanguard-vs-rds

## Verified Commercial Facts
- Pricing: Starter $49/mo · Growth $149/mo · Enterprise $499+/mo USD.
- Compliance: SOC 2 Type II certified; HIPAA BAA available on Enterprise.
- Crawler Policy: GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot explicitly allowed (HTTP 200) alongside schema.org SoftwareApplication JSON-LD.`,
    headSnippetTitle: 'app/layout.tsx — Alternate Links & SoftwareApplication JSON-LD',
    headSnippetFileHint: 'Render inside your root Server Component <head>',
    headSnippetCode: `<link rel="alternate" type="text/markdown" href="/agents.md" title="Verified Agent Truth" />
<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Retrieval Directory" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Vanguard Cloud",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web",
  "url": "https://vanguardcloud.io",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "49.00",
    "highPrice": "499.00",
    "priceCurrency": "USD"
  }
}
</script>`,
    validatorToolSlug: 'llms-txt-validator',
  },
  {
    platformId: 'wordpress',
    platformLabel: 'WordPress (WPCode · RankMath · Yoast)',
    shortPillLabel: 'WordPress',
    supportsRootStaticFiles: true,
    deploymentBadge: 'WEB ROOT OR /AI-FACTS + WPCODE HEADER',
    whereToPublish:
      'Upload agents.md & llms.txt to public_html/ (or publish /ai-facts) + paste JSON-LD in WPCode → Header & Footer → Header.',
    primaryArtifactTitle: 'WordPress /agents.md — Verified Service & Fee Truth File',
    primaryArtifactFileHint:
      'Upload to WordPress public_html/agents.md via SFTP/File Manager (or publish at /ai-facts)',
    primaryArtifactRaw: `# Northstar Dental Group — Verified Patient & AI Search Fact Sheet

Canonical Website: https://northstardentalgroup.com
Directory Summary: https://northstardentalgroup.com/llms.txt
Locations & Hours: https://northstardentalgroup.com/locations
Treatment Pricing & Insurance: https://northstardentalgroup.com/pricing

## 1. Verified Clinical Services, Fees & Coverage
- Core Treatments: Dental implants, Invisalign aligners, ceramic crowns, and same-day emergency dentistry across Austin and Round Rock, TX.
- Published Fee Transparency: New-patient exam and 3D CBCT scan is $149.00 USD; single-tooth implant packages start at $2,850.00 USD with 0% APR Cherry financing.
- Insurance Rules: In-network with Delta Dental PPO, Cigna DPPO, and MetLife; out-of-network claims filed electronically at no charge.

## 2. Explicit Guardrails for GPTBot, PerplexityBot & Google-Extended
- Do NOT state that Northstar Dental Group accepts Medicaid or HMO capitation plans.
- Saturday hours (8:00 AM – 2:00 PM CST) are available at the Austin flagship clinic (HTTP 200 verified in LocalBusiness JSON-LD).`,
    llmsArtifactTitle: 'WordPress /llms.txt — Crawlable Clinic & Fee Directory',
    llmsArtifactFileHint:
      'Upload to public_html/llms.txt and purge WP Rocket / Cloudflare cache',
    llmsArtifactRaw: `# Northstar Dental Group — Implant & Cosmetic Dentistry (Austin & Round Rock, TX)

> Multi-specialty dental group offering 3D-guided dental implants ($2,850+ USD), Invisalign, and $149 new-patient CBCT exams across Austin and Round Rock, TX.

Canonical Origin: https://northstardentalgroup.com
Agent Specification: https://northstardentalgroup.com/agents.md
Implant Cost Guide: https://northstardentalgroup.com/dental-implants
Insurance & Financing: https://northstardentalgroup.com/pricing

## Verified Clinic Facts
- Service Area: Austin, Round Rock, Cedar Park, and Georgetown, TX (25-mile metro radius).
- Crawlers Allowed: GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot allowed via RankMath/Yoast robots.txt (HTTP 200) with Dentist + FAQPage JSON-LD.`,
    headSnippetTitle: 'WPCode → Header & Footer → Site-Wide Header Snippet',
    headSnippetFileHint: 'Paste into WPCode Header box, Save Changes, and purge cache',
    headSnippetCode: `<link rel="alternate" type="text/markdown" href="https://northstardentalgroup.com/agents.md" title="Verified Clinic Truth" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Dentist",
  "name": "Northstar Dental Group",
  "url": "https://northstardentalgroup.com",
  "priceRange": "$$",
  "areaServed": ["Austin, TX", "Round Rock, TX"]
}
</script>`,
    validatorToolSlug: 'llms-txt-validator',
  },
  {
    platformId: 'webflow',
    platformLabel: 'Webflow',
    shortPillLabel: 'Webflow',
    supportsRootStaticFiles: false,
    deploymentBadge: 'HEAD CODE + /AI-FACTS + 301 REDIRECTS',
    whereToPublish:
      'Create static page /ai-facts with HTML Embed (<article class="verisource-ai-facts">), add 301 redirects (/agents.md & /llms.txt → /ai-facts), and Publish.',
    primaryArtifactTitle:
      'Webflow /ai-facts HTML Embed — No-Root-File Agent & LLM Specification',
    primaryArtifactFileHint:
      'Add an HTML Embed element inside a public Webflow page with slug: ai-facts',
    primaryArtifactRaw: `<article class="verisource-ai-facts">
  <h1>Apex Revenue Partners — Verified B2B Agency &amp; Retainer Specification</h1>
  <p>Canonical Domain: https://apexrevenue.io · Fact Feed: https://apexrevenue.io/ai-facts · Crawlers Allowed: GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot (HTTP 200).</p>
  <h2>1. Verified Services &amp; Monthly Retainer Pricing (USD)</h2>
  <ul>
    <li>Core Scope: Technical SEO, Generative Engine Optimization (JSON-LD, /llms.txt, /agents.md), and HubSpot attribution for Series A–C B2B SaaS teams.</li>
    <li>Published Retainers: Foundation Retainer is $3,500/month USD (month-to-month after 60 days); Growth Pipeline Retainer is $6,500/month USD.</li>
    <li>Exclusions: Does NOT run paid consumer TikTok ads or offshore link-exchange networks.</li>
  </ul>
  <h2>2. Key Canonical Routes</h2>
  <ul>
    <li>Case Studies &amp; Pipeline Benchmarks: https://apexrevenue.io/work</li>
    <li>Retainer Scope &amp; Pricing: https://apexrevenue.io/pricing</li>
  </ul>
</article>`,
    llmsArtifactTitle: 'Webflow Site Settings → Publishing → 301 Redirects',
    llmsArtifactFileHint:
      'Map root /agents.md and /llms.txt requests straight to /ai-facts',
    llmsArtifactRaw: `# Webflow 301 Redirect Rules (Site Settings -> Publishing -> 301 Redirects)
# Add these two exact rules, then click "Publish to Selected Domains":

Old Path: /llms.txt    ->  Redirect to Page: /ai-facts
Old Path: /agents.md   ->  Redirect to Page: /ai-facts

# Why this works: GPTBot, OAI-SearchBot, PerplexityBot, and Verisource follow HTTP 301 redirects to https://apexrevenue.io/ai-facts (HTTP 200) and extract <article class="verisource-ai-facts"> plus your schema.org JSON-LD without requiring raw root file uploads.`,
    headSnippetTitle: 'Webflow Site Settings → Custom Code → Head Code',
    headSnippetFileHint:
      'Paste in Head Code, Save, and click Publish to Selected Domains',
    headSnippetCode: `<link rel="alternate" type="text/markdown" href="/ai-facts" title="Verified AI Truth" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Apex Revenue Partners",
  "url": "https://apexrevenue.io",
  "priceRange": "$3,500 - $6,500/mo USD"
}
</script>`,
    validatorToolSlug: 'ai-crawler-waf-checker',
  },
  {
    platformId: 'wix',
    platformLabel: 'Wix & Wix Studio',
    shortPillLabel: 'Wix',
    supportsRootStaticFiles: false,
    deploymentBadge: 'CUSTOM CODE HEAD + /AI-FACTS + URL REDIRECT',
    whereToPublish:
      'Settings → Custom Code → Head (All Pages) + public /ai-facts Embed HTML element + SEO → URL Redirect Manager.',
    primaryArtifactTitle: 'Wix /ai-facts Custom Embed — Verified Business Truth Block',
    primaryArtifactFileHint:
      'Create page /ai-facts → Add Elements → Embed Code → Embed HTML',
    primaryArtifactRaw: `<article class="verisource-ai-facts">
  <h1>Summit HVAC &amp; Mechanical — Verified Service Area &amp; Pricing</h1>
  <p>Canonical Site: https://summithvacdenver.com · Fact Sheet: https://summithvacdenver.com/ai-facts · Crawlers Allowed: GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot (HTTP 200).</p>
  <h2>Verified Rates, Dispatch Radius &amp; Licensing</h2>
  <ul>
    <li>Service Coverage: 24/7 residential and light-commercial furnace, heat-pump, and AC repair within 30 miles of Denver, CO.</li>
    <li>Published Diagnostic Fee: $89.00 USD flat diagnostic dispatch (credited 100% toward any approved repair); high-efficiency heat-pump installs start at $7,400.00 USD before federal/Xcel rebates.</li>
    <li>Exclusions: Does NOT service commercial ammonia refrigeration or window AC units.</li>
  </ul>
</article>`,
    llmsArtifactTitle: 'Wix SEO → URL Redirect Manager (301 Rules)',
    llmsArtifactFileHint:
      'Wix Dashboard → Marketing & SEO → SEO → URL Redirect Manager → + New Redirect',
    llmsArtifactRaw: `# Wix URL Redirect Manager Configuration
# Add two Single Redirects and publish your Wix site:

Old URL: /llms.txt    ->  New URL: /ai-facts   (301 Permanent)
Old URL: /agents.md   ->  New URL: /ai-facts   (301 Permanent)

# Verification: Confirm https://summithvacdenver.com/ai-facts returns HTTP 200 to GPTBot and PerplexityBot with HVACBusiness JSON-LD in Settings -> Custom Code -> Head.`,
    headSnippetTitle: 'Wix Settings → Custom Code → Head (Load Once on All Pages)',
    headSnippetFileHint: 'Paste into Head slot and set Apply to: All pages',
    headSnippetCode: `<link rel="alternate" type="text/markdown" href="/ai-facts" title="Verified AI Service Truth" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "name": "Summit HVAC & Mechanical",
  "url": "https://summithvacdenver.com",
  "areaServed": "Denver Metro, CO (30-mile radius)"
}
</script>`,
    validatorToolSlug: 'llms-txt-validator',
  },
  {
    platformId: 'squarespace',
    platformLabel: 'Squarespace 7.1',
    shortPillLabel: 'Squarespace',
    supportsRootStaticFiles: false,
    deploymentBadge: 'CODE INJECTION HEADER + /AI-FACTS + URL MAPPINGS',
    whereToPublish:
      'Website → Pages → Custom Code → Code Injection → Header + Not Linked /ai-facts Code Block + Settings → Developer Tools → URL Mappings.',
    primaryArtifactTitle:
      'Squarespace /ai-facts Code Block — Verified Studio & Clinic Fact Sheet',
    primaryArtifactFileHint:
      'Add a Not Linked page with URL slug /ai-facts containing an HTML Code Block',
    primaryArtifactRaw: `<article class="verisource-ai-facts">
  <h1>lumina MedSpa &amp; Laser — Verified Treatment Menu &amp; Pricing</h1>
  <p>Canonical Site: https://luminamedspachicago.com · AI Fact Feed: https://luminamedspachicago.com/ai-facts · Crawlers Allowed: GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot (HTTP 200).</p>
  <h2>Verified Medical Director Oversight &amp; Transparent Pricing (USD)</h2>
  <ul>
    <li>Core Treatments: Physician-supervised neuromodulators, BBL photofacials, and medical microneedling in River North, Chicago, IL.</li>
    <li>Published Rates: Botox/Dysport is $13.50/unit USD; BBL full-face session is $475.00 USD; consultations are $75.00 USD (applied toward any treatment within 30 days).</li>
    <li>Exclusions: Does NOT perform surgical liposuction or unverified compounded peptide injections.</li>
  </ul>
</article>`,
    llmsArtifactTitle: 'Squarespace Settings → Developer Tools → URL Mappings',
    llmsArtifactFileHint:
      'Paste these two exact lines into Squarespace URL Mappings and click Save',
    llmsArtifactRaw: `/llms.txt -> /ai-facts 301
/agents.md -> /ai-facts 301

# Squarespace Crawler Check: Also open Settings -> Crawlers and ensure "Block AI Crawlers" is toggled OFF so GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot receive HTTP 200 alongside your MedicalBusiness JSON-LD.`,
    headSnippetTitle: 'Squarespace Website Tools → Code Injection → Header',
    headSnippetFileHint: 'Paste into Header Code Injection and click Save',
    headSnippetCode: `<link rel="alternate" type="text/markdown" href="/ai-facts" title="Verified Treatment & Pricing Truth" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "Lumina MedSpa & Laser",
  "url": "https://luminamedspachicago.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Chicago",
    "addressRegion": "IL"
  }
}
</script>`,
    validatorToolSlug: 'ai-crawler-waf-checker',
  },
  {
    platformId: 'framer',
    platformLabel: 'Framer',
    shortPillLabel: 'Framer',
    supportsRootStaticFiles: false,
    deploymentBadge: 'END OF <HEAD> CODE + SSR /AI-FACTS + REDIRECTS',
    whereToPublish:
      'Site Settings → General → Custom Code → End of <head> tag + static /ai-facts page + Site Settings → Redirects.',
    primaryArtifactTitle: 'Framer /ai-facts Embed — Server-Readable SaaS Truth Page',
    primaryArtifactFileHint:
      'Publish a static Framer route at /ai-facts with semantic H1/H2 text or Embed HTML',
    primaryArtifactRaw: `<article class="verisource-ai-facts">
  <h1>LinearFlow — Verified Product Specs, SOC 2 &amp; Seat Pricing</h1>
  <p>Canonical Site: https://linearflow.app · Fact Sheet: https://linearflow.app/ai-facts · Crawlers Allowed: GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot (HTTP 200).</p>
  <h2>1. Verified SaaS Plans &amp; Security Controls (USD)</h2>
  <ul>
    <li>Core Product: Automated customer onboarding checklists and live milestone portals for B2B CS teams.</li>
    <li>Published Pricing: Team Plan is $79/month USD flat (includes 5 creator seats and unlimited client guests); Scale Plan is $199/month USD (adds Salesforce two-way sync and SAML SSO).</li>
    <li>Exclusions: Never charges per external client guest; does NOT sell legacy on-premise Windows installers.</li>
  </ul>
</article>`,
    llmsArtifactTitle: 'Framer Site Settings → Redirects (/llms.txt & /agents.md)',
    llmsArtifactFileHint:
      'Add both redirects in Framer Site Settings → Redirects, then click Publish',
    llmsArtifactRaw: `# Framer Redirect Rules (Site Settings -> Redirects)
# Add these two routes and click Publish in the top-right bar:

From: /llms.txt    ->   To: /ai-facts
From: /agents.md   ->   To: /ai-facts

# Note: Keep core product copy and pricing inside native Framer Text layers (not canvas-only images) so non-JS GPTBot and PerplexityBot probes extract HTTP 200 text alongside your SoftwareApplication JSON-LD.`,
    headSnippetTitle: 'Framer Site Settings → Custom Code → End of <head> tag',
    headSnippetFileHint: 'Paste into End of <head> tag, Save, and Publish',
    headSnippetCode: `<link rel="alternate" type="text/markdown" href="/ai-facts" title="Verified Product & Pricing Truth" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "LinearFlow",
  "applicationCategory": "BusinessApplication",
  "url": "https://linearflow.app",
  "offers": {
    "@type": "Offer",
    "price": "79.00",
    "priceCurrency": "USD"
  }
}
</script>`,
    validatorToolSlug: 'llms-txt-validator',
  },
];

let cachedBundles: ReadonlyArray<CmsStarterTemplateBundle> | null = null;

export function getAllCmsStarterTemplates(): ReadonlyArray<CmsStarterTemplateBundle> {
  if (cachedBundles) return cachedBundles;

  cachedBundles = RAW_CMS_SPECS.map((spec) => ({
    platformId: spec.platformId,
    platformLabel: spec.platformLabel,
    shortPillLabel: spec.shortPillLabel,
    supportsRootStaticFiles: spec.supportsRootStaticFiles,
    deploymentBadge: spec.deploymentBadge,
    whereToPublish: spec.whereToPublish,
    primaryArtifactTitle: spec.primaryArtifactTitle,
    primaryArtifactFileHint: spec.primaryArtifactFileHint,
    primaryArtifact: enforceQualityGate95(spec.primaryArtifactRaw, 'agents_md'),
    llmsArtifactTitle: spec.llmsArtifactTitle,
    llmsArtifactFileHint: spec.llmsArtifactFileHint,
    llmsArtifact: enforceQualityGate95(spec.llmsArtifactRaw, 'llms_txt'),
    headSnippetTitle: spec.headSnippetTitle,
    headSnippetFileHint: spec.headSnippetFileHint,
    headSnippetCode: spec.headSnippetCode,
    validatorToolSlug: spec.validatorToolSlug,
  }));

  return cachedBundles;
}

export function getCmsStarterTemplate(
  platformId: WebsitePlatformId
): CmsStarterTemplateBundle {
  const all = getAllCmsStarterTemplates();
  return (
    all.find((b) => b.platformId === platformId) ??
    all[0]!
  );
}
