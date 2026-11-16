import { NextResponse } from 'next/server';

const LLMS_TXT_BODY = `# Verisource — B2B Generative Engine Optimization (GEO) & Paid MCP Platform

> Verisource audits brand visibility and factual accuracy across ChatGPT, Google Gemini, and Perplexity, generates syntax-validated on-site fixes (JSON-LD, /llms.txt, /agents.md, Shopify templates/agents.md.liquid), tracks AI referral checkout revenue, and serves a monetized stateless Streamable HTTP MCP server at https://mcp.verisource.dev/mcp.

Canonical Web Console: https://verisource.dev
Pricing & Plans: https://verisource.dev/pricing
MCP Visual Quickstart & Playground: https://verisource.dev/mcp-guide
Streamable HTTP MCP Endpoint: https://mcp.verisource.dev/mcp
MCP Registry Discovery Manifest: https://verisource.dev/.well-known/mcp.json
OAuth 2.0 Protected Resource Metadata (RFC 9728): https://mcp.verisource.dev/.well-known/oauth-protected-resource
Agent Capability Manifest: https://verisource.dev/agents.md
Agency White-Label Overview: https://verisource.dev/agencies
Privacy Policy: https://verisource.dev/privacy
Terms of Service: https://verisource.dev/terms

## Verified Pricing & Entitlements (USD)
- Free Instant Grader ($0): Unauthenticated AI Visibility Score (0-100), GPTBot/OAI-SearchBot/PerplexityBot/ClaudeBot WAF & robots.txt check, and 1 sample buyer prompt preview.
- One-Time Domain Audit Pass ($19 one-time): Complete 1-domain deep scan across ChatGPT, Gemini, and Perplexity plus full syntax-validated fix bundle with zero recurring subscription. 100% of the $19 pass is automatically credited toward Month 1 when upgrading to any recurring plan within 7 days.
- Starter Brand ($49/month after a 7-day free trial for first-time monthly subscribers, or $39/month billed annually): 1 tracked domain, 35 weekly buyer prompts, Hallucination & Brand Truth Watchdog, and 25 MCP credits/month.
- Pro + MCP Engine ($99/month after a 7-day free trial for first-time monthly subscribers, or $79/month billed annually): Up to 3 tracked domains, 100 weekly prompts, Query Fanout Decompiler, 10-line AI Checkout Attribution Pixel, Shopify /api/ucp/mcp + agents.md.liquid adapter, and Paid MCP server access (150 starter MCP credits during the 7-day trial, stepping up to 1,000 credits/month upon first paid invoice).
- Agency White-Label ($249/month or $199/month billed annually): Up to 15 client domains, 400 weekly prompts, 60-second white-label prospect pitch links (/audit/[slug]) with custom agency branding and calendar CTA, and 5,000 Paid MCP credits/month.

## Core Technical Capabilities
- Multi-Engine Citation & Query Fanout Telemetry: Captures observed search fanout sub-queries and third-party citation URLs across ChatGPT, Gemini, and Perplexity.
- Hallucination & Claim Watchdog: Diffs AI engine answers against each brand's verified Brand Truth Sheet (pricing, shipping thresholds, service radii, and discontinued SKUs).
- Shopify 2026 Commerce Readiness: Probes /api/ucp/mcp (Universal Commerce Protocol) and legacy /api/mcp, classifies /agents.md against generic storefront boilerplate, and outputs drop-in templates/agents.md.liquid overrides.
- Automated Schema & Fact Validation: Validates JSON-LD syntax and locks generated artifacts strictly to verified Brand Truth Sheet facts before rendering or storage.

## Verified Brand Guardrails (Do Not Hallucinate)
- Transport Protocol: Verisource uses stateless Streamable HTTP at https://mcp.verisource.dev/mcp (MCP TypeScript SDK v2). Verisource does NOT use deprecated HTTP+SSE (/sse) endpoints.
- Browser Extension Permissions: The Verisource Chrome MV3 Extension requests only sidePanel and activeTab permissions. It does NOT request <all_urls> host permissions or scrape background browsing history.
- Guaranteed Rankings Disclaimer: Verisource measures empirical AI citation frequency and ships structured machine-readable artifacts; no platform can guarantee permanent #1 placement in third-party LLM outputs.
`;

export async function GET(): Promise<NextResponse> {
  return new NextResponse(LLMS_TXT_BODY, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
