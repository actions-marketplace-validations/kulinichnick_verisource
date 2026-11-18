'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { LightBrowserFrame, StatusBadge } from '@verisource/ui';

type SuiteTab = 'guided_recorder' | 'multi_suite';

export function SuiteReplayPlayground(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<SuiteTab>('guided_recorder');

  return (
    <div className="vs-stage-shell">
      <div className="vs-stage-toolbar">
        <div
          className="vs-pill-group"
          role="tablist"
          aria-label="No-code and suite replay modes"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'guided_recorder'}
            data-active={activeTab === 'guided_recorder' ? 'true' : 'false'}
            className="vs-pill-btn"
            onClick={() => setActiveTab('guided_recorder')}
          >
            1 · No-Code 1-Click Fix &amp; Flow Recorder
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'multi_suite'}
            data-active={activeTab === 'multi_suite' ? 'true' : 'false'}
            className="vs-pill-btn"
            onClick={() => setActiveTab('multi_suite')}
          >
            2 · Replay 4 Routes or Client Sites at Once
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge tone="pass">ZERO CODING REQUIRED</StatusBadge>
          <Link
            href="/tutorial"
            className="vs-pill-btn vs-pill-btn-sm"
            style={{ textDecoration: 'none' }}
          >
            Interactive 90s Tour →
          </Link>
        </div>
      </div>

      <div className="vs-stage-narration">
        {activeTab === 'guided_recorder' ? (
          <span>
            <strong
              className="vs-mono"
              style={{ color: 'var(--vs-accent)', marginRight: '8px' }}
            >
              WITHOUT TOUCHING CODE:
            </strong>
            Copy 1 CMS-tailored prompt into ChatGPT, Claude, or Shopify—or click
            through your site once with <code className="vs-mono">verisource record</code>{' '}
            to lock a reusable check.
          </span>
        ) : (
          <span>
            <strong
              className="vs-mono"
              style={{ color: 'var(--vs-accent)', marginRight: '8px' }}
            >
              PARALLEL SUITE &amp; AGENCY PITCHING:
            </strong>
            Verify every commercial route (or batch-audit up to 15 agency client
            domains) in parallel and export branded{' '}
            <code className="vs-mono">/audit/[slug]</code> scorecards.
          </span>
        )}
      </div>

      {activeTab === 'guided_recorder' ? (
        <div className="vs-stage-split">
          <LightBrowserFrame
            url="verisource.dev/dashboard · Guided Mode (Shopify / WordPress / Webflow)"
            statusLabel="REC · FLOW SAVED"
            statusTone="rec"
          >
            <div style={{ display: 'grid', gap: '10px' }}>
              <div
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: '#0F172A',
                }}
              >
                Auto-Detected Platform: Shopify OS 2.0 (or WordPress / Webflow / Next.js)
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  fontSize: '12.5px',
                  color: '#334155',
                  lineHeight: 1.5,
                }}
              >
                <strong>① Copy 1 Prompt for Your AI:</strong> Bundles verified{' '}
                <code className="vs-mono">JSON-LD</code>,{' '}
                <code className="vs-mono">/agents.md</code>,{' '}
                <code className="vs-mono">/llms.txt</code>, and crawler rules
                into one pasteable instruction.
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  fontSize: '12.5px',
                  color: '#065F46',
                  lineHeight: 1.5,
                }}
              >
                <strong>② ✓ Verify Live Fixes (4/4 LIVE):</strong> Confirms HTTP{' '}
                <code className="vs-mono">200</code> bot readability, zero
                broken links, and accurate pricing across 3 AI engines.
              </div>
            </div>
          </LightBrowserFrame>

          <div className="vs-terminal-frame">
            <div className="vs-terminal-chrome">
              <span>Local Recorder · .verisource/workflows/pricing-checkout.json</span>
              <StatusBadge>ZERO-AI REPLAY</StatusBadge>
            </div>
            <div className="vs-terminal-body">
              <div style={{ color: '#EEF1F6', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ color: 'var(--vs-accent)', marginRight: '8px' }}>$</span>
                verisource record pricing-checkout --channel chrome
              </div>
              <div style={{ color: 'var(--vs-ink-muted)', marginBottom: '4px' }}>
                ● Recording manual clicks &amp; assertions in Chrome...
              </div>
              <div style={{ color: '#DCE2EC', marginBottom: '4px' }}>
                [step 1] navigate  https://yourbrand.com/pricing (HTTP 200)
              </div>
              <div style={{ color: '#DCE2EC', marginBottom: '4px' }}>
                [step 2] assert    JSON-LD OfferCatalog &amp; FAQPage present
              </div>
              <div style={{ color: '#DCE2EC', marginBottom: '6px' }}>
                [step 3] click     button[data-plan=&quot;pro&quot;] -&gt; /checkout (200)
              </div>
              <div style={{ color: 'var(--vs-pass-fg)', fontWeight: 600 }}>
                ✓ Saved .verisource/workflows/pricing-checkout.json (replay anytime in 1.4s)
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '14px', display: 'grid', gap: '14px' }}>
          <div className="vs-grid-2" style={{ gap: '12px' }}>
            {[
              {
                url: 'yourbrand.com/ · Entity & Bot WAF',
                badge: 'PASS · 200 OK',
                tone: 'pass' as const,
                summary:
                  'GPTBot, PerplexityBot & ClaudeBot allowed · Organization JSON-LD valid.',
              },
              {
                url: 'yourbrand.com/pricing · Offer Truth',
                badge: 'PASS · TRUTH LOCKED',
                tone: 'pass' as const,
                summary:
                  'OfferCatalog matches Brand Truth Sheet ($49 / $99 / $249) · 0 dead anchors.',
              },
              {
                url: 'yourbrand.com/compare/you-vs-rival',
                badge: 'PASS · 5/5 CHECKS',
                tone: 'pass' as const,
                summary:
                  'SSR comparison <table> + FAQPage JSON-LD live and tracked across 3 AI engines.',
              },
              {
                url: 'verisource.dev/audit/client-pitch',
                badge: 'AGENCY READY',
                tone: 'warn' as const,
                summary:
                  'White-label scorecard minted with custom agency logo, hex bar & booking CTA.',
              },
            ].map((item) => (
              <LightBrowserFrame
                key={item.url}
                url={item.url}
                statusLabel={item.badge}
                statusTone={item.tone}
              >
                <div
                  style={{
                    fontSize: '12.5px',
                    color: '#334155',
                    lineHeight: 1.5,
                  }}
                >
                  {item.summary}
                </div>
              </LightBrowserFrame>
            ))}
          </div>

          <div className="vs-terminal-frame">
            <div className="vs-terminal-chrome">
              <span>Parallel Suite Output</span>
              <StatusBadge tone="pass">4/4 TARGETS VERIFIED</StatusBadge>
            </div>
            <div className="vs-terminal-body">
              <div style={{ color: 'var(--vs-pass-fg)', fontWeight: 600 }}>
                PASS  suite · 4/4 routes &amp; flows passed · 0 broken links · 0 backend errors (2.1s)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
