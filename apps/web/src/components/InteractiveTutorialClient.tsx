'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { StatusBadge } from '@verisource/ui';

type PersonaTrackId = 'business_owner' | 'seo_agency' | 'developer_mcp';

type CmsQuickstartId =
  | 'shopify_liquid'
  | 'wordpress_cms'
  | 'webflow_cms'
  | 'wix_squarespace_framer'
  | 'coding_agent'
  | 'chat_assistant';

interface TutorialStepSpec {
  stepNumber: string;
  badge: string;
  title: string;
  summary: string;
  actionOutcome: string;
}

const PERSONA_OPTIONS: ReadonlyArray<{
  id: PersonaTrackId;
  label: string;
  planHint: string;
  headline: string;
  subhead: string;
}> = [
  {
    id: 'business_owner',
    label: 'Business Owner · No Coding',
    planHint: '$0 7-DAY TRIAL · $49–$99/MO',
    headline:
      'Go from invisible or misquoted in ChatGPT to 4/4 Verified Live in under 10 minutes.',
    subhead:
      'Walk through a realistic B2B workspace (Vanguard FreightOps) to see how Verisource diagnoses missing facts, generates 1 ready-to-paste AI prompt for your CMS, and verifies live fixes.',
  },
  {
    id: 'seo_agency',
    label: 'SEO & Web Agency · White-Label',
    planHint: '$249/MO · 15 CLIENT SITES',
    headline:
      'Mint 60-second client scorecards with your agency logo and close $1,500–$3,000/mo retainers.',
    subhead:
      'Walk through Northstar Search Studio pitching 10 prospects in Batch Mode, catching bot-filtered open alerts, and fulfilling any client CMS stack in 15 minutes.',
  },
  {
    id: 'developer_mcp',
    label: 'Developer & Growth Eng · /mcp',
    planHint: 'PRO $99/MO · STREAMABLE HTTP',
    headline:
      'Connect Claude, Cursor, Windsurf, or Antigravity to stateless Streamable HTTP /mcp.',
    subhead:
      'Inspect live GPTBot and PerplexityBot non-JS DOM extraction, diff rival schemas, and write validated JSON-LD, /llms.txt, and /agents.md directly into your repository.',
  },
];

const STEPS_BY_PERSONA: Record<PersonaTrackId, readonly TutorialStepSpec[]> = {
  business_owner: [
    {
      stepNumber: '01',
      badge: '60-SECOND SCAN',
      title: 'Diagnose why AI skips your brand or quotes wrong prices',
      summary:
        'Enter your website URL. Verisource probes real buyer questions across ChatGPT, Google Gemini, and Perplexity, flags false pricing claims against your Brand Truth Sheet, and checks AI bot access.',
      actionOutcome:
        'Spots HTTP 403 WAF blocks on PerplexityBot + invented "$2,500 minimum" pricing claim.',
    },
    {
      stepNumber: '02',
      badge: '1-CLICK AI PROMPT',
      title: 'Copy 1 platform-tailored prompt & verify live uplift',
      summary:
        'Verisource auto-detects your stack (Shopify, WordPress, Webflow, Wix, Squarespace, Framer, or Custom Code) and bundles JSON-LD, /llms.txt, /agents.md, and bot rules into one prompt.',
      actionOutcome:
        'Click "Simulate Live Verification" on the right to watch 38/100 jump to 92/100 (4/4 LIVE).',
    },
    {
      stepNumber: '03',
      badge: 'VS. RIVAL STUDIO',
      title: 'Publish a truth-locked You vs. Competitor comparison page',
      summary:
        'Turn top rivals capturing your buyer shortlists into structured /compare/brand-vs-rival HTML tables with route-level FAQPage JSON-LD—then verify GPTBot extraction in one click.',
      actionOutcome:
        'Generates semantic comparison table + FAQPage schema + 1-click AI Page-Builder Prompt.',
    },
    {
      stepNumber: '04',
      badge: 'OFF-SITE CITATIONS',
      title: 'Win Reddit, G2, and editorial third-party citations',
      summary:
        'AI engines cross-check your domain against external consensus. Step 03 groups cited third-party URLs by Source Type and generates channel-specific outreach and profile sync playbooks.',
      actionOutcome:
        'Delivers disclosed founder Reddit replies, G2 review sync kits, and 4-sentence media pitches.',
    },
    {
      stepNumber: '05',
      badge: 'REVENUE LEDGER',
      title: 'Track live AI crawler hits & high-converting referrals',
      summary:
        'Verify real GPTBot, OAI-SearchBot, and PerplexityBot visits alongside AI-referred signups and checkouts converting at 14.2%–15.9%.',
      actionOutcome:
        'Logs HMAC-verified bot crawls and origin-verified checkout conversions in Step 01.',
    },
  ],
  seo_agency: [
    {
      stepNumber: '01',
      badge: '10-SITE BATCH MODE',
      title: 'Audit up to 10 prospect domains in parallel',
      summary:
        'Paste a prospect list into Step 03 Batch Mode. Verisource fingerprints each prospect CMS, probes 5 AI crawlers, and records live 3-engine rival Share of Voice in 60 seconds.',
      actionOutcome:
        'Stamps PLATFORM: SHOPIFY / WEBFLOW / WORDPRESS on every row before your sales call.',
    },
    {
      stepNumber: '02',
      badge: 'PURE WHITE-LABEL',
      title: 'Share branded /audit/[slug] Business Impact scorecards',
      summary:
        'Every minted link renders your agency logo, hex accent bar, calendar CTA, and a clear Business Impact diagnosis—with Verisource global navigation completely suppressed.',
      actionOutcome:
        'Dynamic 1200x630 rival OpenGraph preview unfurls cleanly in Gmail, Slack, and LinkedIn.',
    },
    {
      stepNumber: '03',
      badge: 'HUMAN OPEN ALERTS',
      title: 'Follow up within minutes on bot-filtered [Hot Lead] alerts',
      summary:
        'Slackbot, LinkedInBot, and preview crawlers are filtered out. When a real buyer opens their brief (1x) or forwards it internally (3x), an instant alert hits your inbox.',
      actionOutcome:
        'Exports 3-touch Day 0 / Day 3 / Day 7 CSV sequences ready for Instantly, Smartlead, or Apollo.',
    },
    {
      stepNumber: '04',
      badge: '15-MINUTE DELIVERY',
      title: 'Fulfill $1,500–$3,000/mo retainers on any client CMS',
      summary:
        'At $249/mo across 15 client slots ($16.60/client), closing a single retainer covers software 6x over. Fulfill WordPress, Webflow, Wix, Shopify, or Next.js clients with 1 AI prompt.',
      actionOutcome:
        'Includes /ai-facts verification for builders without root static file uploads.',
    },
    {
      stepNumber: '05',
      badge: 'MONDAY CLIENT DIGEST',
      title: 'Prove retention with white-label weekly executive emails',
      summary:
        'Automated Monday executive digests summarize week-over-week AI Visibility score gains, 3-engine citation share, and AI-referred conversions under your agency masthead.',
      actionOutcome:
        'Keeps agency client churn anchored at 1.5%–2.5%/mo with verifiable weekly proof.',
    },
  ],
  developer_mcp: [
    {
      stepNumber: '01',
      badge: 'STREAMABLE HTTP',
      title: 'Add https://mcp.verisource.dev/mcp in 30 seconds',
      summary:
        'Verisource runs on MCP TypeScript SDK v2 over stateless Streamable HTTP (zero deprecated /sse endpoints) and is published on registry.modelcontextprotocol.io (dev.verisource/mcp@1.0.0).',
      actionOutcome:
        'Works natively in Claude Desktop, Cursor IDE, Antigravity, Windsurf, and HTTP JSON-RPC.',
    },
    {
      stepNumber: '02',
      badge: '0-CREDIT PREVIEW',
      title: 'Invoke scan_domain_ai_readiness with zero API key',
      summary:
        'Test any public domain directly inside your IDE before authenticating. Returns Visibility Score, 7-platform CMS detection, 5-bot WAF status, SSR token density, and Shopify UCP readiness.',
      actionOutcome:
        'Free preview tool (3 custom scans/IP/day, 24h edge KV cache, 0 credits consumed).',
    },
    {
      stepNumber: '03',
      badge: 'DOM & RIVAL X-RAY',
      title: 'Inspect non-JS bot extraction & 6-dimension rival diffs',
      summary:
        'Probe /pricing or /docs as GPTBot/1.2 to catch client-side JS hydration traps, then run zero-token Competitor Technical X-Ray diffs against any rival hostname.',
      actionOutcome:
        'Surfaces exact missing schema.org @type nodes (SoftwareApplication, FAQPage, Product).',
    },
    {
      stepNumber: '04',
      badge: 'SHA-256 VS_LIVE_ KEY',
      title: 'Pull generate_geo_fix_bundle straight into your repo',
      summary:
        'Authenticate with a workspace vs_live_ Bearer token (1 credit cached / 10 credits live) so your coding agent commits syntax-validated JSON-LD, /llms.txt, /agents.md, and comparison routes.',
      actionOutcome:
        'Pro includes 150 trial credits stepping up to 1,000/mo on Day 7; Agency includes 5,000/mo.',
    },
    {
      stepNumber: '05',
      badge: 'EDGE BOT TELEMETRY',
      title: 'Verify live deployments & stream HMAC bot crawl events',
      summary:
        'Drop our 12-line Next.js / Cloudflare Edge middleware logger alongside the origin-verified pixel to record real-time GPTBot, OAI-SearchBot, and PerplexityBot crawls.',
      actionOutcome:
        '1-click "⚡ Send Test Bot Ping" and 0-credit "/mcp" handshake verifier built into Console.',
    },
  ],
};

const CMS_QUICKSTARTS: ReadonlyArray<{
  id: CmsQuickstartId;
  pillLabel: string;
  detectedBadge: string;
  timeEstimate: string;
  whereItGoes: string;
  steps: readonly string[];
  verificationMethod: string;
}> = [
  {
    id: 'shopify_liquid',
    pillLabel: 'Shopify',
    detectedBadge: 'SHOPIFY (/API/UCP/MCP + LIQUID)',
    timeEstimate: '4 minutes',
    whereItGoes:
      'Online Store → Themes → Edit code → layout/theme.liquid + templates/agents.md.liquid (or /pages/ai-facts)',
    steps: [
      'Verisource probes your /api/ucp/mcp Universal Commerce Protocol endpoint and detects whether /agents.md is serving generic Shopify stock boilerplate.',
      'Click "Copy Prompt for My AI" in Step 02 (auto-set to Shopify Theme mode) or copy the generated Product + Organization JSON-LD and agents.md.liquid snippet.',
      'Paste into Shopify Sidekick / Cursor or drop the snippet into layout/theme.liquid + Shopify Custom Pixels, then click "✓ Verify Live Fixes".',
    ],
    verificationMethod:
      'Confirms JSON-LD @graph nodes, custom /agents.md (or <article class="verisource-ai-facts"> alternate link), and 5/5 AI bot HTTP 200 responses.',
  },
  {
    id: 'wordpress_cms',
    pillLabel: 'WordPress',
    detectedBadge: 'WORDPRESS (WPCODE · RANKMATH · YOAST)',
    timeEstimate: '3 minutes',
    whereItGoes:
      'WPCode Header Snippet (JSON-LD) + domain root /llms.txt & /agents.md (or /ai-facts page)',
    steps: [
      'Scan your WordPress site; Verisource fingerprints WordPress and formats Step 02 instructions specifically for WPCode, RankMath, or Yoast.',
      'Paste the 1-Click AI Fix Prompt into ChatGPT or Claude (or upload /llms.txt and /agents.md via SFTP / File Manager and paste JSON-LD into WPCode Site-Wide Header).',
      'Purge WP Rocket / Cloudflare / LiteSpeed cache once and click "✓ Verify Live Fixes" in Console Step 02.',
    ],
    verificationMethod:
      'Verifies live uncached HTTP 200 on /llms.txt, /agents.md, <head> schema.org JSON-LD, and WAF allowlist rules.',
  },
  {
    id: 'webflow_cms',
    pillLabel: 'Webflow',
    detectedBadge: 'WEBFLOW (CUSTOM CODE + /AI-FACTS)',
    timeEstimate: '4 minutes',
    whereItGoes:
      'Site Settings → Custom Code → Head Code + /ai-facts static page (+ optional 301 redirect)',
    steps: [
      'Webflow automatically selects Webflow CMS mode in Step 02 so you never struggle with root static file restrictions.',
      'Paste the generated <head> JSON-LD + <link rel="alternate" type="text/markdown" href="/ai-facts"> tag into Webflow Head Code and publish the structured /ai-facts Embed block.',
      'Click "Publish to Selected Domains" in Webflow, then click "✓ Verify Live Fixes" inside Verisource.',
    ],
    verificationMethod:
      'Verisource recognizes same-origin <link rel="alternate" type="text/markdown" href="/ai-facts"> + <article class="verisource-ai-facts"> for a full 4/4 LIVE pass.',
  },
  {
    id: 'wix_squarespace_framer',
    pillLabel: 'Wix · Squarespace · Framer',
    detectedBadge: 'HOSTED BUILDERS (NO ROOT UPLOAD NEEDED)',
    timeEstimate: '5 minutes',
    whereItGoes:
      'Settings → Custom Code (<head> injection) + dedicated /ai-facts page',
    steps: [
      'Hosted builders block root /agents.md file uploads—Verisource detects Wix, Squarespace, or Framer automatically and switches to our /ai-facts protocol contract.',
      'Copy the 1-Click AI Fix Prompt into ChatGPT/Claude (or paste the <head> block into Custom Code Header and publish a /ai-facts page containing your verified truth block).',
      'Publish site changes and click "✓ Verify Live Fixes" to confirm AI crawler readability.',
    ],
    verificationMethod:
      'Probes /ai-facts as GPTBot and PerplexityBot, confirming non-JS SSR readability, JSON-LD entity graphs, and verified pricing facts.',
  },
  {
    id: 'coding_agent',
    pillLabel: 'Next.js & Coding Agents',
    detectedBadge: 'CURSOR · CLAUDE CODE · ANTIGRAVITY · WINDSURF',
    timeEstimate: '90 seconds',
    whereItGoes:
      'app/layout.tsx (JSON-LD + alternate links) + public/llms.txt + public/agents.md + public/robots.txt',
    steps: [
      'Copy the Coding Agent 1-Click AI Fix Prompt from Step 02—or connect https://mcp.verisource.dev/mcp directly in .cursor/mcp.json or Claude Desktop.',
      'Your coding agent writes public/llms.txt, public/agents.md, robots.txt bot rules, and layout JSON-LD in one commit with strict Brand Truth guardrails.',
      'Push to Vercel / Cloudflare / Netlify and run "✓ Verify Live Fixes" (plus Sub-Page Bot Inspection on /pricing).',
    ],
    verificationMethod:
      'Checks SSR HTML token density (catching CSR blank-page traps), root protocol files, and all 5 AI search user-agents.',
  },
  {
    id: 'chat_assistant',
    pillLabel: 'ChatGPT / Claude Web',
    detectedBadge: 'UNIVERSAL STEP-BY-STEP ASSISTANT MODE',
    timeEstimate: '5 minutes',
    whereItGoes:
      'Works in any standard ChatGPT or Claude browser tab for custom or legacy CMS platforms',
    steps: [
      'Select "ChatGPT / Claude Web" in Step 02 and click "Copy Prompt for My AI".',
      'Paste into a regular ChatGPT or Claude chat window and tell it who hosts your website (GoDaddy, cPanel, Ghost, HubSpot CMS, Craft, or custom PHP).',
      'Your AI walks you click-by-click through pasting the exact pre-validated Verisource files without inventing unverified claims.',
    ],
    verificationMethod:
      'If any single item is still cached after publishing, Verisource generates a targeted Follow-Up Prompt covering only the remaining check.',
  },
];

const SAMPLE_PROMPT_BY_ENV: Record<CmsQuickstartId, string> = {
  shopify_liquid: `# VERISOURCE 1-CLICK AI REMEDIATION PROMPT (SHOPIFY LIQUID + UCP)
Target Storefront: https://vanguardsupply.com (Auto-Detected: Shopify)
Guardrail: Use ONLY the verified pricing & shipping facts below. Never invent discounts or SKUs.

1. In layout/theme.liquid inside <head>, insert validated Organization + Product + FAQPage JSON-LD
   and <link rel="alternate" type="text/markdown" href="/pages/ai-facts" />.
2. Create templates/agents.md.liquid (or /pages/ai-facts wrapped in <article class="verisource-ai-facts">)
   replacing generic Shopify boilerplate with verified $45+ free US shipping & catalog truth.
3. Keep GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot allowed in robots.txt.liquid.`,
  wordpress_cms: `# VERISOURCE 1-CLICK AI REMEDIATION PROMPT (WORDPRESS CMS)
Target Domain: https://vanguardfreight.io (Auto-Detected: WordPress)
Guardrail: Lock all claims strictly to Self-Serve LTL plans from $390/mo ($0 setup fee).

1. Paste validated Organization + SoftwareApplication + FAQPage JSON-LD into WPCode Site-Wide Header.
2. Publish /llms.txt and /agents.md at domain root (or /ai-facts with <link rel="alternate" type="text/markdown">).
3. Remove Cloudflare/WAF HTTP 403 challenge blocks on PerplexityBot and GPTBot, then purge page cache.`,
  webflow_cms: `# VERISOURCE 1-CLICK AI REMEDIATION PROMPT (WEBFLOW CMS)
Target Domain: https://vanguardfreight.io (Auto-Detected: Webflow)
Guardrail: Lock all claims strictly to Self-Serve LTL plans from $390/mo ($0 setup fee).

1. Open Webflow Site Settings → Custom Code → Head Code and paste the validated JSON-LD graph
   plus <link rel="alternate" type="text/markdown" href="/ai-facts" />.
2. Create static page /ai-facts with an HTML Embed containing <article class="verisource-ai-facts">...</article>.
3. Click "Publish to Selected Domains" and run Verify Live Fixes in Verisource Step 02.`,
  wix_squarespace_framer: `# VERISOURCE 1-CLICK AI REMEDIATION PROMPT (WIX · SQUARESPACE · FRAMER)
Target Domain: https://vanguardfreight.io (Hosted Website Builder Mode)
Guardrail: Lock all claims strictly to Self-Serve LTL plans from $390/mo ($0 setup fee).

1. In Custom Code → Header (<head>), paste validated JSON-LD + <link rel="alternate" type="text/markdown" href="/ai-facts" />.
2. Create page /ai-facts containing <article class="verisource-ai-facts"> with verified entity & pricing facts.
3. Publish live changes so GPTBot and PerplexityBot extract clean SSR HTML on / and /ai-facts.`,
  coding_agent: `# VERISOURCE 1-CLICK AI REMEDIATION PROMPT (CODING AGENT · NEXT.JS / REPO)
Target Repository: vanguardfreight.io (Cursor · Claude Code · Antigravity · Windsurf)
Guardrail: Do NOT alter visible UI styling or invent pricing outside the Brand Truth Sheet.

1. Write public/llms.txt and public/agents.md using the syntax-verified payloads below.
2. Inject Organization + SoftwareApplication + FAQPage JSON-LD + alternate Markdown <link> in app/layout.tsx.
3. Update app/robots.ts to explicitly allow GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, and Google-Extended.`,
  chat_assistant: `# VERISOURCE 1-CLICK AI REMEDIATION PROMPT (CHATGPT / CLAUDE STEP-BY-STEP)
Target Website: https://vanguardfreight.io
Instruction: Give me exact click-by-click steps for my host using ONLY these verified files:

1. Head Schema Block: Validated Organization + FAQPage JSON-LD ($390/mo LTL starting tier, $0 setup).
2. Machine Truth Files: Canonical /llms.txt and /agents.md (or /ai-facts alternate feed).
3. Crawler Check: Confirm Cloudflare / CDN firewall rules allow GPTBot, OAI-SearchBot, and PerplexityBot.`,
};

export function InteractiveTutorialClient(): React.ReactElement {
  const router = useRouter();
  const [persona, setPersona] = useState<PersonaTrackId>('business_owner');
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [selectedEnv, setSelectedEnv] =
    useState<CmsQuickstartId>('webflow_cms');
  const [simulatedVerified, setSimulatedVerified] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedMcpConfig, setCopiedMcpConfig] = useState<boolean>(false);
  const [selectedMcpClient, setSelectedMcpClient] = useState<
    'cursor' | 'claude' | 'antigravity' | 'curl'
  >('cursor');
  const [activeQuickstart, setActiveQuickstart] =
    useState<CmsQuickstartId>('shopify_liquid');
  const [customDomainInput, setCustomDomainInput] = useState<string>('');

  const activePersonaMeta =
    PERSONA_OPTIONS.find((p) => p.id === persona) ?? PERSONA_OPTIONS[0];
  const steps = STEPS_BY_PERSONA[persona];
  const currentStep = steps[stepIdx] ?? steps[0];
  const activeQuickstartMeta =
    CMS_QUICKSTARTS.find((c) => c.id === activeQuickstart) ??
    CMS_QUICKSTARTS[0];

  function selectPersonaTrack(nextPersona: PersonaTrackId): void {
    setPersona(nextPersona);
    setStepIdx(0);
    setSimulatedVerified(false);
    setCopiedPrompt(false);
  }

  function handleCopySamplePrompt(): void {
    const text = SAMPLE_PROMPT_BY_ENV[selectedEnv];
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2200);
  }

  function getMcpSnippet(): string {
    if (selectedMcpClient === 'curl') {
      return `curl -X POST https://mcp.verisource.dev/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"scan_domain_ai_readiness","arguments":{"domain":"linear.app"}}}'`;
    }
    return `{
  "mcpServers": {
    "verisource": {
      "url": "https://mcp.verisource.dev/mcp",
      "headers": {
        "Authorization": "Bearer vs_live_YOUR_WORKSPACE_KEY"
      }
    }
  }
}`;
  }

  function handleCopyMcpSnippet(): void {
    const text = getMcpSnippet();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
    setCopiedMcpConfig(true);
    setTimeout(() => setCopiedMcpConfig(false), 2200);
  }

  function handleRunOwnSiteSubmit(e: React.FormEvent): void {
    e.preventDefault();
    const cleaned = customDomainInput
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '');
    if (!cleaned) {
      router.push('/#grader');
      return;
    }
    router.push(`/?domain=${encodeURIComponent(cleaned)}#grader`);
  }

  return (
    <div>
      {/* Persona Selector Bar */}
      <div
        className="vs-card"
        style={{
          padding: '18px 20px',
          marginBottom: '22px',
          background: 'var(--vs-surface-warm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <div>
            <div className="vs-eyebrow" style={{ marginBottom: '3px' }}>
              CHOOSE YOUR INTERACTIVE TOUR TRACK (5 CLICKABLE STEPS)
            </div>
            <div style={{ fontSize: '14px', color: 'var(--vs-ink-secondary)' }}>
              Switch tracks anytime to inspect the exact workflow for business
              owners, white-label agencies, or developers.
            </div>
          </div>
          <StatusBadge tone="pass">{activePersonaMeta.planHint}</StatusBadge>
        </div>

        <div
          className="vs-pill-group"
          role="tablist"
          aria-label="Interactive tutorial persona tracks"
        >
          {PERSONA_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={persona === opt.id}
              data-active={persona === opt.id ? 'true' : 'false'}
              className="vs-pill-btn"
              onClick={() => selectPersonaTrack(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive 2-Column Tour Sandbox */}
      <div className="vs-bezel" style={{ marginBottom: '56px' }}>
      <div className="vs-card vs-showcase-grid">
        {/* Left Step Rail */}
        <div className="vs-showcase-rail" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              {`ACTIVE TRACK · STEP ${currentStep.stepNumber} OF 05`}
            </div>
            <h2
              style={{
                fontSize: '18.5px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '0 0 6px 0',
              }}
            >
              {activePersonaMeta.headline}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: 1.55,
                color: 'var(--vs-ink-secondary)',
              }}
            >
              {activePersonaMeta.subhead}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {steps.map((st, idx) => {
              const isActive = idx === stepIdx;
              return (
                <button
                  key={st.stepNumber}
                  type="button"
                  onClick={() => setStepIdx(idx)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    border: isActive
                      ? '1.5px solid var(--vs-ink)'
                      : '1px solid var(--vs-border)',
                    background: isActive ? '#FFFFFF' : 'var(--vs-surface-warm)',
                    cursor: 'pointer',
                    transition: 'border-color 120ms ease, background 120ms ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      className="vs-mono"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isActive
                          ? 'var(--vs-ink)'
                          : 'var(--vs-ink-muted)',
                      }}
                    >
                      {`STEP ${st.stepNumber}`}
                    </span>
                    <StatusBadge tone={isActive ? 'pass' : 'neutral'}>
                      {st.badge}
                    </StatusBadge>
                  </div>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: 'var(--vs-ink)',
                      marginBottom: isActive ? '5px' : 0,
                    }}
                  >
                    {st.title}
                  </div>
                  {isActive ? (
                    <div
                      style={{
                        fontSize: '12.5px',
                        lineHeight: 1.5,
                        color: 'var(--vs-ink-secondary)',
                      }}
                    >
                      {st.summary}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--vs-border)',
            }}
          >
            <button
              type="button"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
              disabled={stepIdx === 0}
              onClick={() => setStepIdx((prev) => Math.max(0, prev - 1))}
            >
              ← Previous Step
            </button>
            {stepIdx < steps.length - 1 ? (
              <button
                type="button"
                className="vs-btn"
                style={{ padding: '7px 14px', fontSize: '12px' }}
                onClick={() =>
                  setStepIdx((prev) => Math.min(steps.length - 1, prev + 1))
                }
              >
                {`Next: Step 0${stepIdx + 2} →`}
              </button>
            ) : (
              <a
                href="#try-your-domain"
                className="vs-btn"
                style={{ padding: '7px 14px', fontSize: '12px' }}
              >
                Scan My Own Site Free ↓
              </a>
            )}
          </div>
        </div>

        {/* Right Interactive Console Specimen */}
        <div style={{ padding: '22px', background: '#FFFFFF' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              paddingBottom: '12px',
              marginBottom: '16px',
              borderBottom: '1px solid var(--vs-border)',
            }}
          >
            <div>
              <span className="vs-eyebrow">
                {`INTERACTIVE CONSOLE SANDBOX · STEP ${currentStep.stepNumber}`}
              </span>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--vs-ink)',
                }}
              >
                {currentStep.title}
              </div>
            </div>
            <StatusBadge tone="pass">SYNTAX &amp; TRUTH VERIFIED</StatusBadge>
          </div>

          {/* BUSINESS OWNER SANDBOX */}
          {persona === 'business_owner' && stepIdx === 0 ? (
            <div>
              <div
                className="vs-card vs-ledger-strip-3"
                style={{ marginBottom: '14px', overflow: 'hidden' }}
              >
                <div style={{ padding: '12px 14px' }}>
                  <div className="vs-eyebrow">AI VISIBILITY SCORE</div>
                  <div
                    className="vs-mono"
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--vs-warn-fg)',
                    }}
                  >
                    38 / 100
                  </div>
                  <div
                    style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}
                  >
                    PLATFORM: WEBFLOW AUTO-DETECTED
                  </div>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div className="vs-eyebrow">WRONG PRICE ALERTS</div>
                  <div
                    className="vs-mono"
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--vs-crit-fg)',
                    }}
                  >
                    1 CONFLICT
                  </div>
                  <div
                    style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}
                  >
                    AI quotes $2,500 min vs. $390/mo truth
                  </div>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div className="vs-eyebrow">RIVALS CITED INSTEAD</div>
                  <div
                    className="vs-mono"
                    style={{ fontSize: '18px', fontWeight: 700 }}
                  >
                    Flexport · Freightos
                  </div>
                  <div
                    style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}
                  >
                    Capturing 62% of buyer shortlists
                  </div>
                </div>
              </div>

              <div className="vs-guided-banner" style={{ marginBottom: '14px' }}>
                <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                  SITE DIAGNOSIS &amp; ACTION PLAN · VANGUARDFREIGHT.IO
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '18px',
                    fontSize: '13px',
                    color: 'var(--vs-ink-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  <li>
                    <strong style={{ color: 'var(--vs-ink)' }}>
                      What&rsquo;s Wrong:
                    </strong>{' '}
                    <code className="vs-mono">PerplexityBot</code> hits an edge
                    HTTP 403 block, and ChatGPT guesses a{' '}
                    <strong>$2,500 monthly minimum</strong> because your site
                    lacks <code className="vs-mono">/llms.txt</code> and{' '}
                    <code className="vs-mono">JSON-LD</code> offer facts.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--vs-ink)' }}>
                      How You Fix It Without Coding:
                    </strong>{' '}
                    Click to Step 02 to copy 1 Webflow-tailored AI prompt and
                    verify live uplift.
                  </li>
                </ul>
              </div>

              <button
                type="button"
                className="vs-btn"
                onClick={() => setStepIdx(1)}
              >
                Continue to Step 02: Copy 1-Click AI Fix Prompt →
              </button>
            </div>
          ) : null}

          {persona === 'business_owner' && stepIdx === 1 ? (
            <div>
              <div style={{ marginBottom: '10px' }}>
                <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
                  ① PICK YOUR WEBSITE STACK OR AI TOOL (AUTO-DETECTED: WEBFLOW)
                </div>
                <div className="vs-pill-group">
                  {CMS_QUICKSTARTS.map((cms) => (
                    <button
                      key={cms.id}
                      type="button"
                      className="vs-pill-btn vs-pill-btn-sm"
                      data-active={selectedEnv === cms.id ? 'true' : 'false'}
                      onClick={() => setSelectedEnv(cms.id)}
                    >
                      {cms.pillLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="vs-card"
                style={{ overflow: 'hidden', marginBottom: '14px' }}
              >
                <div
                  style={{
                    padding: '9px 14px',
                    background: 'var(--vs-surface-subtle)',
                    borderBottom: '1px solid var(--vs-border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <span className="vs-mono" style={{ fontSize: '11.5px' }}>
                    1-CLICK AI FIX PROMPT · SCHEMA &amp; FACT VERIFIED
                  </span>
                  <button
                    type="button"
                    className="vs-pill-btn vs-pill-btn-sm"
                    onClick={handleCopySamplePrompt}
                  >
                    {copiedPrompt
                      ? '✓ Sample Prompt Copied'
                      : 'Copy Sample AI Prompt'}
                  </button>
                </div>
                <pre className="vs-code-block" style={{ fontSize: '11.5px' }}>
                  {SAMPLE_PROMPT_BY_ENV[selectedEnv]}
                </pre>
              </div>

              <div
                className="vs-card"
                style={{
                  padding: '14px 16px',
                  background: simulatedVerified
                    ? 'var(--vs-pass-bg)'
                    : 'var(--vs-surface-warm)',
                  borderColor: simulatedVerified
                    ? 'var(--vs-pass-border)'
                    : 'var(--vs-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <div>
                    <div className="vs-eyebrow">
                      LIVE FIX DEPLOYMENT SCORECARD
                    </div>
                    <div
                      className="vs-mono"
                      style={{ fontSize: '15px', fontWeight: 700 }}
                    >
                      {simulatedVerified
                        ? '4/4 VERIFIED LIVE · SCORE: 38 → 92 / 100 (+54 PTS)'
                        : '1/4 CHECKS LIVE · READY FOR VERIFICATION'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="vs-btn"
                    style={{ padding: '8px 14px', fontSize: '12.5px' }}
                    onClick={() => setSimulatedVerified((prev) => !prev)}
                  >
                    {simulatedVerified
                      ? '↺ Reset Simulation'
                      : '✓ Simulate Live Verification'}
                  </button>
                </div>

                <div
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}
                >
                  <StatusBadge tone={simulatedVerified ? 'pass' : 'warn'}>
                    {simulatedVerified
                      ? 'JSON-LD: 3 NODES LIVE'
                      : 'JSON-LD: PENDING'}
                  </StatusBadge>
                  <StatusBadge tone={simulatedVerified ? 'pass' : 'warn'}>
                    {simulatedVerified
                      ? '/LLMS.TXT: HTTP 200'
                      : '/LLMS.TXT: MISSING'}
                  </StatusBadge>
                  <StatusBadge tone={simulatedVerified ? 'pass' : 'warn'}>
                    {simulatedVerified
                      ? '/AI-FACTS: VERIFIED'
                      : '/AGENTS.MD: MISSING'}
                  </StatusBadge>
                  <StatusBadge tone={simulatedVerified ? 'pass' : 'critical'}>
                    {simulatedVerified
                      ? '5/5 AI BOTS: ALLOWED'
                      : 'PERPLEXITYBOT: 403'}
                  </StatusBadge>
                </div>
              </div>
            </div>
          ) : null}

          {persona === 'business_owner' && stepIdx === 2 ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '12px',
                }}
              >
                <StatusBadge tone="pass">
                  ROUTE: /COMPARE/VANGUARD-VS-FLEXPORT
                </StatusBadge>
                <StatusBadge tone="pass">5/5 BOT EXTRACTION CHECKS</StatusBadge>
                <StatusBadge>FAQPAGE JSON-LD INCLUDED</StatusBadge>
              </div>
              <div
                className="vs-card vs-table-wrap"
                style={{ marginBottom: '14px' }}
              >
                <table className="vs-table">
                  <thead>
                    <tr>
                      <th>Evaluation Criteria</th>
                      <th>Vanguard FreightOps (Verified Truth)</th>
                      <th>Flexport (Buyer Verification Check)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Starting Monthly Commitment</strong>
                      </td>
                      <td className="vs-mono">
                        $390/mo Self-Serve LTL ($0 setup)
                      </td>
                      <td style={{ color: 'var(--vs-ink-secondary)' }}>
                        Confirm enterprise minimum volume tiers
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Live Pallet API &amp; SLA</strong>
                      </td>
                      <td>Same-day North American LTL dispatch</td>
                      <td style={{ color: 'var(--vs-ink-secondary)' }}>
                        Compare ocean vs. domestic LTL transit SLAs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
                Once published, clicking{' '}
                <strong style={{ color: 'var(--vs-ink)' }}>
                  ✓ Verify Page Live
                </strong>{' '}
                confirms <code className="vs-mono">GPTBot</code> and{' '}
                <code className="vs-mono">PerplexityBot</code> read your{' '}
                <code className="vs-mono">&lt;table&gt;</code> and{' '}
                <code className="vs-mono">FAQPage</code> schema cleanly, then
                tracks the head-to-head buyer prompt across all 3 AI engines.
              </div>
            </div>
          ) : null}

          {persona === 'business_owner' && stepIdx === 3 ? (
            <div className="vs-card vs-table-wrap">
              <table className="vs-table">
                <thead>
                  <tr>
                    <th>Cited Source Domain</th>
                    <th>Source Category</th>
                    <th>Ready-to-Run Playbook</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="vs-mono">reddit.com/r/logistics</td>
                    <td>
                      <StatusBadge>UGC / COMMUNITY</StatusBadge>
                    </td>
                    <td>
                      Disclosed founder reply citing $390/mo LTL spec &amp;{' '}
                      <code className="vs-mono">/ai-facts</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="vs-mono">g2.com/categories/3pl</td>
                    <td>
                      <StatusBadge tone="pass">REVIEW DIRECTORY</StatusBadge>
                    </td>
                    <td>
                      Profile pricing sync + candid customer review request kit
                    </td>
                  </tr>
                  <tr>
                    <td className="vs-mono">supplychaindive.com</td>
                    <td>
                      <StatusBadge>EDITORIAL MEDIA</StatusBadge>
                    </td>
                    <td>4-sentence factual inclusion note to section editor</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          {persona === 'business_owner' && stepIdx === 4 ? (
            <div className="vs-card vs-table-wrap">
              <table className="vs-table">
                <thead>
                  <tr>
                    <th>Event Type</th>
                    <th>AI Engine / Bot</th>
                    <th>Target Path</th>
                    <th>Attribution Proof</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <StatusBadge>BOT CRAWL</StatusBadge>
                    </td>
                    <td className="vs-mono">OAI-SearchBot</td>
                    <td className="vs-mono">/ai-facts</td>
                    <td className="vs-mono">HMAC Verified · HTTP 200</td>
                  </tr>
                  <tr>
                    <td>
                      <StatusBadge>BOT CRAWL</StatusBadge>
                    </td>
                    <td className="vs-mono">PerplexityBot</td>
                    <td className="vs-mono">/compare/vanguard-vs-flexport</td>
                    <td className="vs-mono">HMAC Verified · HTTP 200</td>
                  </tr>
                  <tr>
                    <td>
                      <StatusBadge tone="pass">CHECKOUT SALE</StatusBadge>
                    </td>
                    <td className="vs-mono">chatgpt.com</td>
                    <td className="vs-mono">/signup/complete</td>
                    <td className="vs-mono" style={{ fontWeight: 700 }}>
                      +$390.00 USD (Origin Verified)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          {/* SEO AGENCY SANDBOX */}
          {persona === 'seo_agency' && stepIdx === 0 ? (
            <div className="vs-card vs-table-wrap">
              <table className="vs-table">
                <thead>
                  <tr>
                    <th>Prospect Domain</th>
                    <th>Detected Stack</th>
                    <th>AI Score</th>
                    <th>Top Rival Winning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="vs-mono">vanguardfreight.io</td>
                    <td>
                      <StatusBadge>WEBFLOW</StatusBadge>
                    </td>
                    <td className="vs-mono">38 / 100</td>
                    <td>Flexport · Freightos</td>
                  </tr>
                  <tr>
                    <td className="vs-mono">luminabotanicals.com</td>
                    <td>
                      <StatusBadge tone="pass">SHOPIFY</StatusBadge>
                    </td>
                    <td className="vs-mono">51 / 100</td>
                    <td>Stock /agents.md boilerplate</td>
                  </tr>
                  <tr>
                    <td className="vs-mono">apexdentalgroup.com</td>
                    <td>
                      <StatusBadge>WORDPRESS</StatusBadge>
                    </td>
                    <td className="vs-mono">44 / 100</td>
                    <td>Missing Dentist JSON-LD</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          {persona === 'seo_agency' && stepIdx === 1 ? (
            <div
              className="vs-card"
              style={{
                borderTop: '4px solid #0A0E17',
                padding: '18px',
                background: 'var(--vs-surface-warm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <div className="vs-eyebrow">
                    PREPARED BY NORTHSTAR SEARCH STUDIO · ZERO VERISOURCE CHROME
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 700 }}>
                    Vanguard FreightOps — AI Search Diagnostic (38/100)
                  </div>
                </div>
                <span className="vs-btn" style={{ padding: '7px 12px', fontSize: '12px' }}>
                  Book 15-Min AI Audit Call →
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '10px',
                }}
              >
                <StatusBadge>PLATFORM: WEBFLOW</StatusBadge>
                <StatusBadge tone="critical">2 FALSE PRICING CLAIMS</StatusBadge>
                <StatusBadge tone="warn">RIVALS: FLEXPORT · FREIGHTOS</StatusBadge>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
                Includes printable PDF stylesheet (<code className="vs-mono">@media print</code>
                ), custom agency logo, dynamic <code className="vs-mono">1200x630</code>{' '}
                rival OpenGraph card, and 1-click in-place URL refresh after you
                deploy client fixes.
              </div>
            </div>
          ) : null}

          {persona === 'seo_agency' && stepIdx === 2 ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <StatusBadge tone="pass">
                  HOT · 3 HUMAN OPENS (SLACKBOT FILTERED)
                </StatusBadge>
                <StatusBadge>DAY 0 / DAY 3 / DAY 7 CSV READY</StatusBadge>
              </div>
              <pre className="vs-code-block" style={{ borderRadius: '7px' }}>
                {`Subject: Vanguard FreightOps — AI search claim audit (38/100 visibility)

Ran a 3-engine retrieval check on https://vanguardfreight.io.
Vanguard FreightOps currently scores 38/100 while Flexport and Freightos capture commercial shortlists—and ChatGPT quotes a $2,500 monthly minimum instead of your $390/mo Self-Serve LTL tier.
Here is your private Webflow diagnostic brief: https://verisource.dev/audit/vanguard-freightops-audit
We already generated the validated JSON-LD and /ai-facts fixes—happy to walk through them in 15 minutes.`}
              </pre>
            </div>
          ) : null}

          {persona === 'seo_agency' && stepIdx === 3 ? (
            <div className="vs-guided-banner">
              <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
                AGENCY UNIT ECONOMICS · 96.7% SOFTWARE MARGIN AT 5 RETAINERS
              </div>
              <div
                style={{
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                <strong style={{ color: 'var(--vs-ink)' }}>
                  Software Cost:
                </strong>{' '}
                <span className="vs-mono">$249/mo</span> ($16.60/client across
                15 slots, or $13.27/client on Annual) ·{' '}
                <strong style={{ color: 'var(--vs-ink)' }}>
                  5 Client Retainers at $1,500/mo:
                </strong>{' '}
                <span className="vs-mono">$7,500/mo</span> gross (
                <strong className="vs-mono" style={{ color: 'var(--vs-pass-fg)' }}>
                  $7,251/mo net margin
                </strong>
                ). Includes 5,000 monthly <code className="vs-mono">/mcp</code>{' '}
                credits so your engineers automate multi-client updates in
                minutes.
              </div>
            </div>
          ) : null}

          {persona === 'seo_agency' && stepIdx === 4 ? (
            <div className="vs-card" style={{ padding: '16px' }}>
              <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                MONDAY EXECUTIVE CLIENT DIGEST · NORTHSTAR SEARCH STUDIO
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                Weekly AI Visibility Uplift: 38 → 92 / 100 (+54 pts)
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: 'var(--vs-ink-secondary)',
                  lineHeight: 1.55,
                }}
              >
                Dispatched automatically via Resend every Monday (or exported as
                standalone HTML) summarizing week-over-week score gains,
                resolved pricing hallucinations, and verified AI-referred
                conversions—with your agency header and booking link at the top.
              </p>
            </div>
          ) : null}

          {/* DEVELOPER / MCP SANDBOX */}
          {persona === 'developer_mcp' && stepIdx === 0 ? (
            <div>
              <div className="vs-pill-group" style={{ marginBottom: '10px' }}>
                {(
                  [
                    ['cursor', 'Cursor IDE'],
                    ['claude', 'Claude Desktop'],
                    ['antigravity', 'Antigravity'],
                    ['curl', 'cURL / HTTP'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className="vs-pill-btn vs-pill-btn-sm"
                    data-active={selectedMcpClient === id ? 'true' : 'false'}
                    onClick={() => setSelectedMcpClient(id)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  className="vs-pill-btn vs-pill-btn-sm"
                  onClick={handleCopyMcpSnippet}
                >
                  {copiedMcpConfig ? '✓ Copied' : 'Copy Config'}
                </button>
              </div>
              <pre className="vs-code-block" style={{ borderRadius: '7px' }}>
                {getMcpSnippet()}
              </pre>
            </div>
          ) : null}

          {persona === 'developer_mcp' && stepIdx > 0 ? (
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div className="vs-table-wrap">
                <table className="vs-table">
                <thead>
                  <tr>
                    <th>MCP Tool / Endpoint</th>
                    <th>Metering</th>
                    <th>Returned Payload</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="vs-mono">scan_domain_ai_readiness</td>
                    <td>
                      <StatusBadge tone="pass">0 CREDITS (NO KEY)</StatusBadge>
                    </td>
                    <td>
                      Score, <code className="vs-mono">detectedPlatform</code>,
                      5-bot WAF status, SSR readability &amp; UCP check
                    </td>
                  </tr>
                  <tr>
                    <td className="vs-mono">get_citation_gaps_and_fanouts</td>
                    <td className="vs-mono">1 cached / 10 live</td>
                    <td>
                      Observed search fanout queries, ranked gap hosts &amp;
                      channel playbooks
                    </td>
                  </tr>
                  <tr>
                    <td className="vs-mono">check_brand_hallucinations</td>
                    <td className="vs-mono">1 cached / 10 live</td>
                    <td>
                      Multi-engine claim diff &amp; sentiment framing vs. Brand
                      Truth Sheet
                    </td>
                  </tr>
                  <tr>
                    <td className="vs-mono">generate_geo_fix_bundle</td>
                    <td className="vs-mono">1 cached / 10 live</td>
                    <td>
                      Validated <code className="vs-mono">JSON-LD</code>,{' '}
                      <code className="vs-mono">/llms.txt</code>,{' '}
                      <code className="vs-mono">/agents.md</code>,{' '}
                      <code className="vs-mono">ai_remediation_prompt</code>{' '}
                      &amp; rival page
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          ) : null}

          <div
            className="vs-mono"
            style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--vs-border)',
              fontSize: '11.5px',
              color: 'var(--vs-pass-fg)',
            }}
          >
            {`→ ${currentStep.actionOutcome}`}
          </div>
        </div>
      </div>
      </div>

      {/* Section 2: 6-Environment / 7-CMS Visual Quickstart Guides */}
      <section id="cms-quickstarts" style={{ marginBottom: '56px' }}>
        <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
          7-PLATFORM DEPLOYMENT TUTORIALS · NO ROOT FILE ACCESS REQUIRED
        </div>
        <h2
          style={{
            fontSize: 'clamp(23px, 2.7vw, 29px)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            margin: '0 0 8px 0',
          }}
        >
          Exact setup steps for your website platform.
        </h2>
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '14.5px',
            color: 'var(--vs-ink-secondary)',
            maxWidth: '740px',
          }}
        >
          Verisource fingerprints your CMS automatically during your initial
          scan and formats Step 02&rsquo;s 1-Click AI Fix Prompt for your exact
          stack—including hosted builders without root static file uploads.
        </p>

        <div className="vs-pill-group" style={{ marginBottom: '16px' }}>
          {CMS_QUICKSTARTS.map((cms) => (
            <button
              key={cms.id}
              type="button"
              className="vs-pill-btn"
              data-active={activeQuickstart === cms.id ? 'true' : 'false'}
              onClick={() => setActiveQuickstart(cms.id)}
            >
              {cms.pillLabel}
            </button>
          ))}
        </div>

        <div className="vs-bezel">
        <div className="vs-card" style={{ padding: '22px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              paddingBottom: '14px',
              marginBottom: '16px',
              borderBottom: '1px solid var(--vs-border)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <StatusBadge tone="pass">
                {activeQuickstartMeta.detectedBadge}
              </StatusBadge>
              <StatusBadge>
                {`SETUP TIME: ${activeQuickstartMeta.timeEstimate.toUpperCase()}`}
              </StatusBadge>
            </div>
            <span
              className="vs-mono"
              style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
            >
              {activeQuickstartMeta.whereItGoes}
            </span>
          </div>

          <div className="vs-grid-3" style={{ marginBottom: '16px' }}>
            {activeQuickstartMeta.steps.map((stepText, idx) => (
              <div
                key={stepText}
                className="vs-card"
                style={{
                  padding: '16px',
                  background: 'var(--vs-surface-warm)',
                }}
              >
                <div
                  className="vs-mono"
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--vs-ink)',
                    marginBottom: '6px',
                  }}
                >
                  {`STEP 0${idx + 1}`}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.56,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {stepText}
                </div>
              </div>
            ))}
          </div>

          <div className="vs-guided-banner">
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div>
                <strong style={{ fontSize: '13px' }}>
                  How Live Verification Scores This Stack:{' '}
                </strong>
                <span
                  style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}
                >
                  {activeQuickstartMeta.verificationMethod}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <Link
                  href="/connectors"
                  className="vs-btn vs-btn-secondary"
                  style={{ padding: '6px 11px', fontSize: '12px' }}
                >
                  WordPress &amp; Shopify Connectors →
                </Link>
                <Link
                  href="/templates"
                  className="vs-btn vs-btn-secondary"
                  style={{ padding: '6px 11px', fontSize: '12px' }}
                >
                  Copy Starter Templates →
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Section 3: Direct Own-Domain Scan & Trial Handoff */}
      <section id="try-your-domain" style={{ marginBottom: '24px' }}>
        <div className="vs-bezel-obsidian">
          <div
            className="vs-card"
            style={{
              padding: '26px',
              background: 'var(--vs-surface-warm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div>
                <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                  READY TO TEST YOUR OWN DOMAIN?
                </div>
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}
                >
                  Run your free 60-second AI Visibility &amp; CMS diagnosis now.
                </h2>
              </div>
              <StatusBadge tone="pass">
                $0 FREE SCAN · 7-DAY FREE TRIAL AVAILABLE
              </StatusBadge>
            </div>

            <form
              onSubmit={handleRunOwnSiteSubmit}
              className="vs-grader-form"
              style={{
                padding: 0,
                borderBottom: 'none',
                marginBottom: '12px',
              }}
            >
              <input
                type="text"
                className="vs-input"
                placeholder="Enter your website (e.g. yourcompany.com)"
                aria-label="Enter your website domain to run a free AI audit"
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
              />
              <button
                type="submit"
                className="vs-btn"
                style={{ whiteSpace: 'nowrap' }}
              >
                Audit My Website Free →
              </button>
            </form>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '16px',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--vs-border)',
              }}
            >
              <span
                className="vs-eyebrow"
                style={{ fontSize: '10.5px', marginRight: '4px' }}
              >
                OR JUMP WITH A SAMPLE DOMAIN:
              </span>
              {(['stripe.com', 'linear.app', 'cal.com', 'shopify.com'] as const).map(
                (sampleHost) => (
                  <Link
                    key={sampleHost}
                    href={`/?domain=${sampleHost}#grader`}
                    className="vs-pill-btn vs-pill-btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    {sampleHost}
                  </Link>
                )
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link href="/pricing" className="vs-btn vs-btn-secondary">
                Start 7-Day Free Trial ($0 Today) →
              </Link>
              <Link href="/agencies#sandbox" className="vs-btn vs-btn-secondary">
                Agency White-Label ($249/mo · 15 Sites)
              </Link>
              <Link href="/mcp-guide" className="vs-btn vs-btn-secondary">
                Open Live /mcp Playground
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
