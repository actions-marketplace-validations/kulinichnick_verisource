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
      'Use Verisource to check mosaicroasters.com for AI pricing hallucinations and summarize what we should fix first in plain English.',
  },
  {
    persona: 'FOR DEVELOPERS & B2B SAAS TEAMS',
    title: 'Generate & commit >= 9.5/10 schema.org JSON-LD + /llms.txt',
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

export default function McpQuickstartGuidePage(): React.ReactElement {
  const manifest = buildMcpDiscoveryManifest();

  return (
    <div>
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
                Ask it in plain English to check if{' '}
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
                  Get Pro + 1,000 Credits ($99/mo) →
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
              sublabel="Fresh ChatGPT, Gemini & Perplexity crawl + Critic pass"
            />
            <MetricLedgerCell
              label="Monthly Plan Quotas"
              value="1,000"
              suffix="/ 5,000 cr"
              sublabel="Pro ($99/mo) includes 1,000 · Agency ($249/mo) includes 5,000"
              tone="pass"
            />
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

          <div
            className="vs-card"
            style={{ overflowX: 'auto', background: 'var(--vs-surface)' }}
          >
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
        </section>

        {/* Plain-English Prompts Section */}
        <section style={{ marginBottom: '54px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            PLAIN-ENGLISH PROMPTS
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

        {/* Bottom Conversion Banner */}
        <section>
          <div
            className="vs-card"
            style={{
              padding: '28px',
              background: 'var(--vs-surface)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div style={{ maxWidth: '620px' }}>
              <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
                READY TO AUTOMATE CITATION AUDITS &amp; SITE FIXES?
              </div>
              <h2
                style={{
                  fontSize: '22px',
                  letterSpacing: '-0.02em',
                  margin: '0 0 8px 0',
                }}
              >
                Mint your SHA-256 <code className="vs-mono">vs_live_</code> Bearer key in Tab 3
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--vs-ink-secondary)',
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
              >
                Activate Pro + MCP ($99/mo) →
              </a>
              <Link href="/agencies" className="vs-btn vs-btn-secondary">
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
