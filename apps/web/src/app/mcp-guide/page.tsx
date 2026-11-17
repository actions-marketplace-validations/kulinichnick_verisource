import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { buildMcpDiscoveryManifest } from '@verisource/core-geo';
import {
  CodeArtifactCard,
  MetricLedgerCell,
  StatusBadge,
} from '@verisource/ui';
import { McpQuickstartClient } from '../../components/McpQuickstartClient';
import { McpStreamSchematic } from '../../components/McpStreamSchematic';

export const metadata: Metadata = {
  title: 'MCP Server Quickstart (Claude, Cursor, Windsurf, Antigravity) | Verisource',
  description:
    'Connect Claude Desktop, Cursor, Windsurf, or Antigravity to https://mcp.verisource.dev/mcp over stateless Streamable HTTP. Run free readiness scans or meter Pro/Agency GEO fix bundles.',
  alternates: {
    canonical: 'https://verisource.dev/mcp-guide',
  },
};

const READY_TO_ASK_PROMPTS = [
  {
    persona: 'FOR STORE OWNERS & FOUNDERS',
    title: 'Catch invented prices & missing /agents.md facts',
    prompt:
      'Use Verisource to check our company domain for AI pricing hallucinations and give us a clear, step-by-step list of what to fix first.',
  },
  {
    persona: 'FOR DEVELOPERS & B2B SAAS TEAMS',
    title: 'Generate & commit syntax-validated schema.org JSON-LD + /llms.txt',
    prompt:
      'Call Verisource generate_geo_fix_bundle for our production domain, validate the JSON-LD, and write /public/llms.txt and /public/agents.md.',
  },
  {
    persona: 'FOR SEO & DIGITAL PR AGENCIES',
    title: 'Pull rival citation URLs feeding ChatGPT & Perplexity',
    prompt:
      'Run Verisource get_citation_gaps_and_fanouts on our client domain and list the exact third-party articles citing competitors ahead of them.',
  },
];

const MCP_GUIDE_FAQS = [
  {
    question:
      'Does the Verisource MCP server use stateless Streamable HTTP or legacy /sse?',
    answer:
      'Verisource runs exclusively on stateless Streamable HTTP at https://mcp.verisource.dev/mcp (MCP TypeScript SDK v2) with RFC 9728 OAuth 2.0 Protected Resource discovery—zero deprecated /sse transports.',
  },
  {
    question:
      'Can I test https://mcp.verisource.dev/mcp without an API key or credit card?',
    answer:
      'Yes. Unauthenticated MCP clients can call scan_domain_ai_readiness immediately at 0 credits (up to 3 custom domains per IP per UTC day, backed by a 24-hour Cloudflare KV cache).',
  },
  {
    question:
      'How are cached reads vs. live multi-engine scans metered on Pro and Agency plans?',
    answer:
      'Cached reads from the 12-hour Cloudflare KV cache consume 1 credit in under 100ms, while fresh live scans across ChatGPT, Google Gemini, and Perplexity consume 10 credits via atomic PostgreSQL row locks. Connection handshake checks charge 0 credits.',
  },
  {
    question:
      'Which AI coding and desktop clients connect out of the box?',
    answer:
      'Claude Desktop, Cursor IDE, Google Antigravity, Windsurf, Cline, and custom JSON-RPC 2.0 HTTP pipelines connect via a single mcpServers JSON snippet minted inside Console Step 03.',
  },
] as const;

export default function McpQuickstartGuidePage(): React.ReactElement {
  const manifest = buildMcpDiscoveryManifest();

  const softwareSourceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: 'Verisource Streamable HTTP MCP Server (dev.verisource/mcp)',
    codeRepository: 'https://github.com/kulinichnick/verisource',
    programmingLanguage: 'TypeScript',
    runtimePlatform: 'Cloudflare Workers (Stateless Streamable HTTP)',
    url: 'https://verisource.dev/mcp-guide',
    description:
      'Official MCP Registry server (dev.verisource/mcp) exposing AI search readiness scans, citation gap fanouts, hallucination watchdogs, and syntax-validated JSON-LD + /agents.md fix bundles at https://mcp.verisource.dev/mcp.',
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: MCP_GUIDE_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSourceJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Hero Section with Zero-Lag Animated SVG Streamable HTTP Schematic */}
      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '48px 0 54px 0',
          marginBottom: '40px',
        }}
      >
        <div className="vs-container">
          <div className="vs-hero-grid">
            <div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <StatusBadge tone="pass">OFFICIAL MCP REGISTRY · DEV.VERISOURCE/MCP</StatusBadge>
                <StatusBadge>STREAMABLE HTTP (SDK V2)</StatusBadge>
                <StatusBadge>FREE + METERED PRO</StatusBadge>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(31px, 4vw, 45px)',
                  lineHeight: 1.08,
                  letterSpacing: '-0.03em',
                  fontWeight: 700,
                  margin: '0 0 16px 0',
                }}
              >
                Give Claude, Cursor, and Antigravity live brand truth.{' '}
                <span
                  className="vs-display-serif"
                  style={{ fontSize: '1.08em', fontWeight: 400 }}
                >
                  One URL. Thirty seconds.
                </span>
              </h1>

              <p
                style={{
                  fontSize: '15.5px',
                  lineHeight: 1.62,
                  color: 'var(--vs-ink-secondary)',
                  margin: '0 0 24px 0',
                  maxWidth: '580px',
                }}
              >
                Point your favorite AI assistant to{' '}
                <code className="vs-mono">https://mcp.verisource.dev/mcp</code>.
                Ask it directly to check if{' '}
                <code className="vs-mono">GPTBot</code> is blocked, see which
                rival articles ChatGPT cites, or write verified{' '}
                <code className="vs-mono">JSON-LD</code> and{' '}
                <code className="vs-mono">/agents.md</code> fixes straight into
                your site.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <a
                  href="/api/checkout?plan=pro_99&cycle=monthly"
                  className="vs-btn"
                >
                  Start 7-Day Free Trial ($0 Today · 150 Credits) →
                </a>
                <Link
                  href="/dashboard?tab=tab3_offsite"
                  className="vs-btn vs-btn-secondary"
                >
                  Mint API Key in Console →
                </Link>
                <a href="#live-test" className="vs-btn vs-btn-secondary">
                  Try Free Scan Below ↓
                </a>
              </div>
            </div>

            <McpStreamSchematic />
          </div>
        </div>
      </section>

      <div className="vs-container">
        {/* Transparent Credit Metering Ledger */}
        <section style={{ marginBottom: '48px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            PREDICTABLE CREDIT METERING
          </div>
          <h2
            style={{
              fontSize: '24px',
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
            }}
          >
            Start free without an API key. Pay only when your agents pull deep fixes.
          </h2>

          <div className="vs-bezel">
            <div
              className="vs-card vs-ledger-strip-4"
              style={{ overflow: 'hidden', background: 'var(--vs-surface)' }}
            >
              <MetricLedgerCell
                label="Free Readiness Scan"
                value="$0"
                sublabel="0 credits · 3 custom domains/day/IP (24h KV cache)"
                tone="pass"
              />
              <MetricLedgerCell
                label="Cached Tool Read"
                value="1"
                suffix="credit"
                sublabel="Sub-100ms read from 12h Cloudflare KV cache"
              />
              <MetricLedgerCell
                label="Live Multi-Engine Refresh"
                value="10"
                suffix="credits"
                sublabel="Fresh ChatGPT, Gemini & Perplexity crawl + schema validation"
              />
              <MetricLedgerCell
                label="Monthly Plan Quotas"
                value="1,000"
                suffix="/ 5,000 cr"
                sublabel="Pro: 150 7d-trial cr → 1,000/mo · Agency: 5,000/mo"
                tone="pass"
              />
            </div>
          </div>
        </section>

        {/* Interactive Client Setup & Live JSON-RPC Playground */}
        <section style={{ marginBottom: '54px' }}>
          <McpQuickstartClient />
        </section>

        {/* 4-Tool Reference Table */}
        <section style={{ marginBottom: '54px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            EXPOSED STREAMABLE HTTP TOOLS ({manifest.name} · v{manifest.version})
          </div>
          <h2
            style={{
              fontSize: '24px',
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
            }}
          >
            Four focused tools. Zero deprecated <code className="vs-mono">/sse</code> bloat.
          </h2>

          <div className="vs-bezel">
            <div
              className="vs-card"
              style={{ overflow: 'hidden', background: 'var(--vs-surface)' }}
            >
              <div className="vs-table-wrap">
                <table className="vs-table">
              <thead>
                <tr>
                  <th>Tool Name</th>
                  <th>Access Tier</th>
                  <th>Credit Cost</th>
                  <th>What Your Agent Receives</th>
                </tr>
              </thead>
              <tbody>
                {manifest.tools.map((tool) => (
                  <tr key={tool.name}>
                    <td>
                      <code
                        className="vs-mono"
                        style={{ fontWeight: 700, fontSize: '12.5px' }}
                      >
                        {tool.name}
                      </code>
                    </td>
                    <td>
                      {tool.tier === 'free_preview' ? (
                        <StatusBadge tone="pass">FREE PREVIEW</StatusBadge>
                      ) : (
                        <StatusBadge>PRO / AGENCY</StatusBadge>
                      )}
                    </td>
                    <td className="vs-mono" style={{ fontSize: '12.5px' }}>
                      {tool.creditsCost === 0
                        ? '0 credits'
                        : '1 cached / 10 live'}
                    </td>
                    <td style={{ fontSize: '13.5px', color: 'var(--vs-ink-secondary)' }}>
                      {tool.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </div>
          </div>
        </section>

        {/* Ready-to-Use Prompts Section */}
        <section style={{ marginBottom: '54px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            EASY-TO-USE AGENT PROMPTS
          </div>
          <h2
            style={{
              fontSize: '24px',
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
            }}
          >
            No terminal commands required—just ask your AI in everyday words
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            {READY_TO_ASK_PROMPTS.map((item) => (
              <CodeArtifactCard
                key={item.title}
                title={item.title}
                fileHint={item.persona}
                code={item.prompt}
              />
            ))}
          </div>
        </section>

        {/* MCP Protocol & Credit Metering FAQ */}
        <section style={{ marginBottom: '54px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            MCP TRANSPORT &amp; METERING FAQ
          </div>
          <h2
            style={{
              fontSize: '24px',
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
            }}
          >
            Streamable HTTP transport, authentication, and credit rules.
          </h2>
          <div className="vs-grid-2">
            {MCP_GUIDE_FAQS.map((faq) => (
              <div
                key={faq.question}
                className="vs-card vs-card-interactive"
                style={{ padding: '20px 22px' }}
              >
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    margin: '0 0 8px 0',
                    lineHeight: 1.4,
                  }}
                >
                  {faq.question}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Conversion Banner */}
        <section style={{ marginBottom: '24px' }}>
          <div
            className="vs-band-obsidian"
            style={{
              padding: '28px 30px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div style={{ maxWidth: '620px' }}>
              <div
                className="vs-eyebrow"
                style={{ color: '#34D399', marginBottom: '6px' }}
              >
                READY TO AUTOMATE CITATION AUDITS &amp; SITE FIXES?
              </div>
              <h2
                style={{
                  fontSize: '22px',
                  letterSpacing: '-0.02em',
                  margin: '0 0 8px 0',
                  color: '#FFFFFF',
                }}
              >
                Mint your SHA-256 <code className="vs-mono">vs_live_</code> Bearer key in Step 03
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: '#CBD5E1',
                  margin: 0,
                }}
              >
                Start with a $19 One-Time Audit Pass (100% credited toward Month 1
                if you upgrade within 7 days), or activate Pro ($99/mo · 1,000
                credits) or Agency White-Label ($249/mo · 5,000 credits + 15
                client domains).
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a
                href="/api/checkout?plan=pro_99&cycle=monthly"
                className="vs-btn"
                style={{
                  background: '#FFFFFF',
                  color: '#0A0E17',
                  borderColor: '#FFFFFF',
                }}
              >
                Activate Pro + MCP ($99/mo) →
              </a>
              <Link href="/agencies#sandbox" className="vs-btn vs-btn-secondary">
                Agency Plan ($249/mo · 5,000 cr) →
              </Link>
              <a
                href="/.well-known/mcp.json"
                className="vs-btn vs-btn-secondary"
              >
                View /.well-known/mcp.json
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
