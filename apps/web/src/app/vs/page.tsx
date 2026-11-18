import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { DomainHeadToHeadClient } from '../../components/DomainHeadToHeadClient';

export const metadata: Metadata = {
  title:
    'Head-to-Head Domain AI Search X-Ray: Compare Any Two Websites | Verisource',
  description:
    'Compare any two public domains across 6 AI search & crawler dimensions: GPTBot/PerplexityBot WAF access, non-JS HTML signal, schema.org JSON-LD @graph, /llms.txt, and /agents.md.',
  alternates: {
    canonical: 'https://verisource.dev/vs',
  },
};

const VS_FAQS = [
  {
    question:
      'What does the Head-to-Head Domain AI Search X-Ray inspect over HTTP?',
    answer:
      'Verisource probes both domains live across six dimensions: overall technical AI readiness (0–100), five AI search crawler rules (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended) plus edge WAF HTTP 403 drops, non-JavaScript SSR word/token density, schema.org JSON-LD entity types, /llms.txt availability, and /agents.md or Shopify /api/ucp/mcp coverage.',
  },
  {
    question:
      'Why can a competitor with weaker domain authority still win AI search citations?',
    answer:
      'Answer engines extract structured facts under tight retrieval budgets. If your site blocks PerplexityBot at Cloudflare WAF, renders pricing inside client-only JavaScript bundles, or omits FAQPage and Offer JSON-LD while a smaller rival serves clean SSR HTML and /agents.md, retrieval models cite the rival instead.',
  },
  {
    question: 'Can agencies share Head-to-Head X-Ray links in prospect outreach?',
    answer:
      'Yes. Every comparison updates the browser URL (?a=client.com&b=rival.com) for instant sharing, and $249/mo Agency workspaces can mint white-label /audit/[slug] executive scorecards with custom logos, brand hex accents, and booking links.',
  },
] as const;

export default async function HeadToHeadVsPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}): Promise<React.ReactElement> {
  const resolved = await searchParams;
  const initialA = typeof resolved?.a === 'string' ? resolved.a : '';
  const initialB = typeof resolved?.b === 'string' ? resolved.b : '';

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Verisource Head-to-Head Domain AI Search X-Ray',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        url: 'https://verisource.dev/vs',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description:
          'Side-by-side HTTP protocol and schema.org JSON-LD benchmark comparing any two websites for ChatGPT Search, Google Gemini, and Perplexity readiness.',
      },
      {
        '@type': 'FAQPage',
        mainEntity: VS_FAQS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
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
              ZERO-SIGNUP 6-DIMENSION PROTOCOL DIFF
            </StatusBadge>
            <StatusBadge>GPTBOT · JSON-LD · /LLMS.TXT · /AGENTS.MD</StatusBadge>
            <StatusBadge>SHAREABLE MATCHUP URLS</StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 3.8vw, 44px)',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: '0 0 14px 0',
              maxWidth: '820px',
            }}
          >
            Compare any two domains head-to-head for AI search citations.
          </h1>

          <p
            style={{
              fontSize: '15.5px',
              lineHeight: 1.6,
              color: 'var(--vs-ink-secondary)',
              margin: 0,
              maxWidth: '720px',
            }}
          >
            Inspect why answer engines cite a competitor ahead of your site.
            Benchmark live <code className="vs-mono">GPTBot</code> and{' '}
            <code className="vs-mono">PerplexityBot</code> WAF responses, SSR
            token density, <code className="vs-mono">schema.org</code>{' '}
            <code className="vs-mono">JSON-LD</code> nodes,{' '}
            <code className="vs-mono">/llms.txt</code>, and{' '}
            <code className="vs-mono">/agents.md</code> side by side.
          </p>
        </div>
      </section>

      <div className="vs-container" style={{ paddingBottom: '64px' }}>
        <DomainHeadToHeadClient
          initialDomainA={initialA}
          initialDomainB={initialB}
        />

        {/* FAQ & Internal Directory Links */}
        <section style={{ marginTop: '52px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            COMPETITOR X-RAY METHODOLOGY
          </div>
          <h2
            style={{
              fontSize: '23px',
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
            }}
          >
            How answer engines weigh competing domains.
          </h2>

          <div className="vs-grid-3" style={{ marginBottom: '26px' }}>
            {VS_FAQS.map((faq) => (
              <div
                key={faq.question}
                className="vs-card"
                style={{ padding: '18px 20px' }}
              >
                <h3
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                    lineHeight: 1.4,
                  }}
                >
                  {faq.question}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <Link href="/reports" className="vs-btn vs-btn-secondary">
              Browse All Audited Domain Scorecards →
            </Link>
            <Link href="/tools" className="vs-btn vs-btn-secondary">
              Explore 4 Single-Protocol Validators →
            </Link>
            <Link href="/mcp-guide" className="vs-btn vs-btn-secondary">
              Automate via Streamable HTTP /mcp →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
