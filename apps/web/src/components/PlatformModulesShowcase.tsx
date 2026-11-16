'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { StatusBadge } from '@verisource/ui';

type PillarId =
  | 'answer_insights'
  | 'conversation_explorer'
  | 'agent_analytics'
  | 'shopping_fixes'
  | 'agency_mcp';

interface PillarSpec {
  id: PillarId;
  stepTag: string;
  title: string;
  subtitle: string;
  description: string;
  consoleLocation: string;
}

const PILLARS: PillarSpec[] = [
  {
    id: 'answer_insights',
    stepTag: '01 · ANSWER ENGINE INSIGHTS',
    title: 'Mention Rate, Citation Rate & Rival Share-of-Voice',
    subtitle: 'Separate being named in prose from being linked as a trusted footnote.',
    description:
      'Track your visibility across ChatGPT Search, Perplexity, and Google Gemini side by side. Measure brand sentiment framing (Recommended, Neutral, Cautionary), average rank, and head-to-head Share-of-Voice against your top 3 named competitors—while flagging hallucinated prices against your Brand Truth Sheet.',
    consoleLocation: 'Console Step 1 · Visibility & Brand Truth',
  },
  {
    id: 'conversation_explorer',
    stepTag: '02 · CONVERSATION EXPLORER',
    title: 'Suggested Funnel Prompts & Source-Type Leaderboard',
    subtitle: 'Win unbranded category shortlists before buyers ever type your name.',
    description:
      'Activate 1-click auto-suggested buyer prompts grouped across Unbranded Discovery, Commercial Comparison, Pricing & Fit, and Branded Trust. Decompile engine search sub-queries and see every external citation source tagged as UGC / Reddit, Review Directory (G2 / Clutch), Editorial, or Competitor.',
    consoleLocation: 'Console Step 3 · Prompts & Citation Sources',
  },
  {
    id: 'agent_analytics',
    stepTag: '03 · AGENT ANALYTICS',
    title: 'JS Readability Audit, Bot Crawl Logs & AI Revenue',
    subtitle: 'Google Analytics misses server-side AI bots. Verisource tracks both.',
    description:
      'Verify HTTP 200 vs. silent WAF 403 responses for GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot. Catch empty client-side React/JS shells before crawlers skip your pages, log incoming server-side bot crawls at the edge, and attribute real checkout revenue from chatgpt.com and perplexity.ai.',
    consoleLocation: 'Console Step 1 · Agent Analytics & Attribution',
  },
  {
    id: 'shopping_fixes',
    stepTag: '04 · AI SHOPPING, FIXES & CITATION PAGES',
    title: 'Shopping Checklist, Validated Schema & vs. Rival Page Studio',
    subtitle: 'Where passive $499/mo trackers stop, Verisource writes the fix and the comparison page.',
    description:
      'Audit all 5 structured Offer, Fulfillment, Guardrail, Entity, and Protocol attributes required by ChatGPT Shopping and Perplexity. Copy syntax-validated JSON-LD entity graphs, /llms.txt, /agents.md, 1-click AI Fix Prompts, and Brand-Truth-locked Head-to-Head Comparison Pages (/compare/you-vs-rival) to win commercial shortlists.',
    consoleLocation: 'Console Step 2 · Copy-Paste Website Fixes & Citation Studio',
  },
  {
    id: 'agency_mcp',
    stepTag: '05 · WHITE-LABEL & /MCP SERVER',
    title: '60-Second Client Pitch Links & Streamable HTTP /mcp',
    subtitle: 'Built for agencies closing retainers and engineering teams running agents.',
    description:
      'Mint pure white-label /audit/[slug] client scorecards with your agency logo, brand color, and calendar CTA—backed by real-time prospect open alerts. Connect Claude Desktop, Cursor, Windsurf, or Antigravity directly to https://mcp.verisource.dev/mcp via SHA-256 Bearer keys.',
    consoleLocation: 'Console Step 3 · Client Links & MCP Sync',
  },
];

export function PlatformModulesShowcase(): React.ReactElement {
  const [activeId, setActiveId] = useState<PillarId>('answer_insights');
  const active = PILLARS.find((p) => p.id === activeId) ?? PILLARS[0]!;

  return (
    <section id="platform" style={{ marginTop: '72px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        <div style={{ maxWidth: '680px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            SUBSCRIBER CONSOLE ARCHITECTURE · 5 INTEGRATED MODULES
          </div>
          <h2
            style={{
              fontSize: 'clamp(25px, 3vw, 31px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 8px 0',
            }}
          >
            Everything inside your private Admin Console once you subscribe.
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '14.5px',
              lineHeight: 1.58,
              color: 'var(--vs-ink-secondary)',
            }}
          >
            Organized into a calm 3-Step workspace with Guided Mode for founders
            and Pro Mode for search engineers and agencies.
          </p>
        </div>

        <Link href="/pricing" className="vs-btn vs-btn-secondary">
          Compare Console Plans →
        </Link>
      </div>

      <div
        className="vs-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          overflow: 'hidden',
        }}
      >
        {/* Left Selector Rail */}
        <div
          style={{
            borderRight: '1px solid var(--vs-border)',
            background: 'var(--vs-surface-subtle)',
          }}
        >
          {PILLARS.map((pillar, index) => {
            const isSelected = pillar.id === active.id;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActiveId(pillar.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '16px 20px',
                  border: 'none',
                  borderBottom:
                    index < PILLARS.length - 1
                      ? '1px solid var(--vs-border)'
                      : 'none',
                  borderLeft: isSelected
                    ? '3px solid var(--vs-ink)'
                    : '3px solid transparent',
                  background: isSelected ? '#FFFFFF' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 120ms ease',
                }}
              >
                <div
                  className="vs-mono"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isSelected ? 'var(--vs-ink)' : 'var(--vs-ink-muted)',
                    marginBottom: '4px',
                  }}
                >
                  {pillar.stepTag}
                </div>
                <div
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 700,
                    color: 'var(--vs-ink)',
                    marginBottom: '3px',
                  }}
                >
                  {pillar.title}
                </div>
                <div
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--vs-ink-secondary)',
                    lineHeight: 1.45,
                  }}
                >
                  {pillar.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Live Console Specimen Preview */}
        <div
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px',
            background: '#FFFFFF',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <span className="vs-eyebrow">{active.consoleLocation}</span>
              <StatusBadge tone="pass">INCLUDED IN SUBSCRIBER CONSOLE</StatusBadge>
            </div>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '0 0 8px 0',
              }}
            >
              {active.title}
            </h3>
            <p
              style={{
                margin: '0 0 20px 0',
                fontSize: '13.5px',
                lineHeight: 1.6,
                color: 'var(--vs-ink-secondary)',
              }}
            >
              {active.description}
            </p>

            {/* Module-Specific High-Contrast Data Preview */}
            {active.id === 'answer_insights' ? (
              <div
                style={{
                  border: '1px solid var(--vs-border)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--vs-surface-warm)',
                    borderBottom: '1px solid var(--vs-border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: '8px',
                    fontSize: '12px',
                  }}
                >
                  <span className="vs-mono" style={{ fontWeight: 600 }}>
                    SENTIMENT: 88% RECOMMENDED · AVG RANK #1.4
                  </span>
                  <span className="vs-mono" style={{ color: 'var(--vs-pass-fg)' }}>
                    0 PRICING HALLUCINATIONS
                  </span>
                </div>
                <table className="vs-table" style={{ fontSize: '12.5px' }}>
                  <thead>
                    <tr>
                      <th>Answer Engine</th>
                      <th>Mention Rate</th>
                      <th>Citation Rate</th>
                      <th>Framing</th>
                    </tr>
                  </thead>
                  <tbody className="vs-mono">
                    <tr>
                      <td>ChatGPT Search</td>
                      <td>86%</td>
                      <td>64%</td>
                      <td>
                        <StatusBadge tone="pass">RECOMMENDED #1</StatusBadge>
                      </td>
                    </tr>
                    <tr>
                      <td>Perplexity Agent</td>
                      <td>92%</td>
                      <td>85%</td>
                      <td>
                        <StatusBadge tone="pass">CITED FOOTNOTE #1</StatusBadge>
                      </td>
                    </tr>
                    <tr>
                      <td>Google Gemini</td>
                      <td>79%</td>
                      <td>57%</td>
                      <td>
                        <StatusBadge>LISTED #2</StatusBadge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {active.id === 'conversation_explorer' ? (
              <div
                style={{
                  border: '1px solid var(--vs-border)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <table className="vs-table" style={{ fontSize: '12.5px' }}>
                  <thead>
                    <tr>
                      <th>Auto-Suggested Buyer Prompt</th>
                      <th>Funnel Stage</th>
                      <th>Top Cited Source Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        &ldquo;Best B2B workflow platforms with transparent API
                        pricing&rdquo;
                      </td>
                      <td>
                        <StatusBadge tone="pass">DISCOVERY · UNBRANDED</StatusBadge>
                      </td>
                      <td className="vs-mono" style={{ fontSize: '11.5px' }}>
                        reddit.com (UGC) · g2.com (Directory)
                      </td>
                    </tr>
                    <tr>
                      <td>
                        &ldquo;YourBrand vs RivalCloud: SLA, pricing tiers &amp;
                        SOC2&rdquo;
                      </td>
                      <td>
                        <StatusBadge>COMPARISON · SHORTLIST</StatusBadge>
                      </td>
                      <td className="vs-mono" style={{ fontSize: '11.5px' }}>
                        rivalcloud.io (Competitor Site)
                      </td>
                    </tr>
                    <tr>
                      <td>
                        &ldquo;YourBrand enterprise seat limits and annual
                        billing&rdquo;
                      </td>
                      <td>
                        <StatusBadge tone="warn">PRICING &amp; FIT</StatusBadge>
                      </td>
                      <td className="vs-mono" style={{ fontSize: '11.5px' }}>
                        yourbrand.com/agents.md (Owned)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {active.id === 'agent_analytics' ? (
              <div
                style={{
                  border: '1px solid var(--vs-border)',
                  borderRadius: '6px',
                  padding: '14px',
                  background: 'var(--vs-surface-warm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <StatusBadge tone="pass">SSR CLEAN · 1,640 TOKENS</StatusBadge>
                  <StatusBadge tone="pass">GPTBot: 200 OK</StatusBadge>
                  <StatusBadge tone="pass">PerplexityBot: 200 OK</StatusBadge>
                  <StatusBadge tone="pass">ClaudeBot: 200 OK</StatusBadge>
                </div>
                <div
                  className="vs-mono"
                  style={{
                    fontSize: '12px',
                    lineHeight: 1.7,
                    padding: '10px 12px',
                    background: '#FFFFFF',
                    border: '1px solid var(--vs-border)',
                    borderRadius: '4px',
                  }}
                >
                  <div>[ai_bot_crawl] PerplexityBot → /pricing (HTTP 200)</div>
                  <div>[ai_bot_crawl] OAI-SearchBot → /agents.md (HTTP 200)</div>
                  <div style={{ color: 'var(--vs-pass-fg)', fontWeight: 600 }}>
                    [ai_referral_conversion] chatgpt.com → /checkout ($290.00 USD)
                  </div>
                </div>
              </div>
            ) : null}

            {active.id === 'shopping_fixes' ? (
              <div
                style={{
                  border: '1px solid var(--vs-border)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <table className="vs-table" style={{ fontSize: '12.5px' }}>
                  <thead>
                    <tr>
                      <th>Commerce &amp; Offer Attribute</th>
                      <th>Generated Artifact</th>
                      <th>Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Plan Tiers / SKU OfferCatalog</td>
                      <td className="vs-mono" style={{ fontSize: '11.5px' }}>
                        application/ld+json
                      </td>
                      <td>
                        <StatusBadge tone="pass">SYNTAX VALIDATED</StatusBadge>
                      </td>
                    </tr>
                    <tr>
                      <td>Negative SKU &amp; Policy Guardrails</td>
                      <td className="vs-mono" style={{ fontSize: '11.5px' }}>
                        /agents.md + agents.md.liquid
                      </td>
                      <td>
                        <StatusBadge tone="pass">TRUTH LOCKED</StatusBadge>
                      </td>
                    </tr>
                    <tr>
                      <td>Canonical Retrieval Directory</td>
                      <td className="vs-mono" style={{ fontSize: '11.5px' }}>
                        /llms.txt + FAQPage Graph
                      </td>
                      <td>
                        <StatusBadge tone="pass">SYNTAX VALIDATED</StatusBadge>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>1-Click AI Fix Prompt</strong> (Claude · ChatGPT · Antigravity)
                      </td>
                      <td className="vs-mono" style={{ fontSize: '11.5px' }}>
                        Master Remediation Prompt
                      </td>
                      <td>
                        <StatusBadge tone="pass">READY TO PASTE</StatusBadge>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Rival Comparison &amp; Buyer Guide Studio</strong>
                      </td>
                      <td className="vs-mono" style={{ fontSize: '11.5px' }}>
                        /compare/brand-vs-rival + FAQPage
                      </td>
                      <td>
                        <StatusBadge tone="pass">BRAND TRUTH LOCKED</StatusBadge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {active.id === 'agency_mcp' ? (
              <div
                style={{
                  border: '1px solid var(--vs-border)',
                  borderRadius: '6px',
                  padding: '14px',
                  background: 'var(--vs-surface-warm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <StatusBadge tone="pass">STREAMABLE HTTP · SDK V2</StatusBadge>
                  <StatusBadge>WHITE-LABEL /AUDIT/[SLUG]</StatusBadge>
                </div>
                <div
                  className="vs-mono"
                  style={{
                    fontSize: '12px',
                    lineHeight: 1.65,
                    padding: '10px 12px',
                    background: '#FFFFFF',
                    border: '1px solid var(--vs-border)',
                    borderRadius: '4px',
                  }}
                >
                  <div>POST https://mcp.verisource.dev/mcp</div>
                  <div>tool: &quot;get_citation_gaps_and_fanouts&quot;</div>
                  <div style={{ color: 'var(--vs-ink-muted)' }}>
                    → returns Mention vs. Citation %, Source Types &amp;
                    verified outreach drafts
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div
            style={{
              paddingTop: '14px',
              borderTop: '1px solid var(--vs-border)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '12.5px', color: 'var(--vs-ink-muted)' }}>
              Test your own domain free above, then activate your private Console.
            </span>
            <a href="#grader" className="vs-btn">
              Test Your Website Free ↑
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
