import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { InteractiveTutorialClient } from '../../components/InteractiveTutorialClient';

export const metadata: Metadata = {
  title:
    'Interactive 90-Second Product Tour & 7-CMS Setup Tutorial | Verisource',
  description:
    'Click through Verisource’s 3-step AI Search Console: spot pricing hallucinations, copy 1 platform-tailored AI Fix Prompt across Shopify, WordPress, Webflow, Wix, Squarespace, Framer, or Next.js, and verify live fixes.',
  alternates: {
    canonical: 'https://verisource.dev/tutorial',
  },
};

const TUTORIAL_HOWTO_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Fix Website AI Search Visibility & Citations with Verisource',
  description:
    'Three-step workflow to audit ChatGPT, Google Gemini, and Perplexity citations, deploy validated JSON-LD, /llms.txt, and /agents.md via one AI prompt, and verify live crawler access.',
  totalTime: 'PT5M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Run a 60-Second Domain & AI Crawler Scan',
      text: 'Enter your website URL at https://verisource.dev to check ChatGPT, Gemini, and Perplexity buyer shortlists, false pricing claims, CMS platform detection, and GPTBot/PerplexityBot HTTP access.',
      url: 'https://verisource.dev/#grader',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Copy Your Platform-Tailored 1-Click AI Fix Prompt',
      text: 'Paste the auto-detected prompt for Shopify, WordPress, Webflow, Wix/Squarespace/Framer (/ai-facts), or Coding Agents (Cursor, Claude, Antigravity) to publish validated JSON-LD, /llms.txt, and /agents.md.',
      url: 'https://verisource.dev/tutorial#cms-quickstarts',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Verify Live Fixes & Publish Rival Comparison Pages',
      text: 'Click Verify Live Fixes to confirm 4/4 live HTTP 200 protocol checks, launch You vs. Competitor comparison tables, and track AI crawler and referral events.',
      url: 'https://verisource.dev/tutorial',
    },
  ],
};

export default function InteractiveTutorialPage(): React.ReactElement {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(TUTORIAL_HOWTO_JSON_LD),
        }}
      />

      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '44px 0 46px 0',
          marginBottom: '34px',
        }}
      >
        <div className="vs-container">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <StatusBadge tone="pass">
              INTERACTIVE 90-SECOND PRODUCT TOUR
            </StatusBadge>
            <StatusBadge>3 PERSONA TRACKS · ZERO SIGNUP REQUIRED</StatusBadge>
            <StatusBadge>7 WEBSITE PLATFORMS COVERED</StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 3.9vw, 44px)',
              lineHeight: 1.09,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: '0 0 14px 0',
              maxWidth: '860px',
            }}
          >
            Test-drive the Verisource Console in 90 seconds.{' '}
            <span
              className="vs-display-serif"
              style={{ fontSize: '1.08em', fontWeight: 400 }}
            >
              Before entering a card.
            </span>
          </h1>

          <p
            style={{
              fontSize: '15.5px',
              lineHeight: 1.6,
              color: 'var(--vs-ink-secondary)',
              margin: '0 0 20px 0',
              maxWidth: '720px',
            }}
          >
            Click through every workflow below—from spotting false AI pricing
            claims and copying a 1-Click AI Fix Prompt to minting white-label{' '}
            <code className="vs-mono">/audit/[slug]</code> client scorecards and
            connecting Cursor or Claude to{' '}
            <code className="vs-mono">mcp.verisource.dev/mcp</code>.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <a href="#try-your-domain" className="vs-btn">
              Skip to My Live Website Scan ↓
            </a>
            <a href="#cms-quickstarts" className="vs-btn vs-btn-secondary">
              Jump to CMS Setup Guides (7 Stacks)
            </a>
            <Link href="/sample-audit" className="vs-btn vs-btn-secondary">
              View 18 Live Brand Benchmarks →
            </Link>
          </div>
        </div>
      </section>

      <div className="vs-container">
        <InteractiveTutorialClient />
      </div>
    </div>
  );
}
