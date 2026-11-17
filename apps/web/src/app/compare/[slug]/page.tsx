import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { GtmDomainScanHandoff } from '../../../components/GtmDomainScanHandoff';
import { COMPETITOR_ALTERNATIVES } from '../../../lib/gtm-content';

export function generateStaticParams(): Array<{ slug: string }> {
  return COMPETITOR_ALTERNATIVES.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = COMPETITOR_ALTERNATIVES.find((c) => c.slug === slug);
  if (!entry) {
    return { title: 'Comparison Not Found | Verisource' };
  }
  return {
    title: entry.metaTitle,
    description: entry.metaDescription,
    alternates: {
      canonical: `https://verisource.dev/compare/${entry.slug}`,
    },
  };
}

export default async function CompetitorAlternativePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const entry = COMPETITOR_ALTERNATIVES.find((c) => c.slug === slug);
  if (!entry) {
    notFound();
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entry.faqs.map((faq) => ({
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '44px 0 46px 0',
          marginBottom: '36px',
        }}
      >
        <div className="vs-container">
          <div style={{ marginBottom: '12px' }}>
            <Link
              href="/compare"
              className="vs-mono"
              style={{
                fontSize: '12px',
                color: 'var(--vs-ink-muted)',
                textDecoration: 'none',
              }}
            >
              ← All GEO Platform Comparisons
            </Link>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <StatusBadge tone="pass">{entry.eyebrow}</StatusBadge>
            <StatusBadge>7-DAY FREE TRIAL ($0 TODAY)</StatusBadge>
            <StatusBadge>SCHEMA &amp; FACT VERIFIED</StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 3.8vw, 44px)',
              lineHeight: 1.09,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: '0 0 16px 0',
              maxWidth: '860px',
            }}
          >
            {entry.headline}{' '}
            <span
              className="vs-display-serif"
              style={{ fontSize: '1.08em', fontWeight: 400 }}
            >
              {entry.serifAccent}
            </span>
          </h1>

          {/* Answer-First Executive Summary Block */}
          <div
            className="vs-guided-banner"
            style={{ maxWidth: '840px', marginBottom: '20px' }}
          >
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              EXECUTIVE SUMMARY · VERISOURCE VS.{' '}
              {entry.competitorName.toUpperCase()}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '14.5px',
                lineHeight: 1.6,
                color: 'var(--vs-ink)',
              }}
            >
              {entry.answerFirstSummary}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link href="/#grader" className="vs-btn">
              Scan My Website Free →
            </Link>
            <Link href="/pricing" className="vs-btn vs-btn-secondary">
              Start 7-Day Free Trial ($0 Today)
            </Link>
            <Link href="/tutorial" className="vs-btn vs-btn-secondary">
              Interactive 90s Product Tour
            </Link>
          </div>
        </div>
      </section>

      <div className="vs-container">
        {/* Side-by-Side Technical & Commercial Comparison Table */}
        <section style={{ marginBottom: '44px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            HEAD-TO-HEAD CAPABILITY &amp; PRICING MATRIX
          </div>
          <h2
            style={{
              fontSize: '25px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 16px 0',
            }}
          >
            {`Verisource vs. ${entry.competitorName} (2026 Feature Breakdown)`}
          </h2>

          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div className="vs-table-wrap">
                <table className="vs-table">
                  <thead>
                    <tr>
                      <th>Evaluation Criterion</th>
                      <th>Verisource (Read-Write + /mcp)</th>
                      <th>{`${entry.competitorName} (${entry.competitorPriceAnchor})`}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.comparisonRows.map((row) => (
                      <tr key={row.criterion}>
                        <td>
                          <strong>{row.criterion}</strong>
                        </td>
                        <td>
                          <StatusBadge
                            tone={row.verisourceAdvantage ? 'pass' : 'neutral'}
                          >
                            VERISOURCE
                          </StatusBadge>{' '}
                          <span style={{ fontSize: '13.5px', marginLeft: '6px' }}>
                            {row.verisourceValue}
                          </span>
                        </td>
                        <td style={{ color: 'var(--vs-ink-secondary)' }}>
                          {row.competitorValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Objective Buyer Fit Split */}
        <section style={{ marginBottom: '44px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            OBJECTIVE BUYER FIT CHECKLIST
          </div>
          <h2
            style={{
              fontSize: '25px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 16px 0',
            }}
          >
            Which platform fits your team and budget?
          </h2>

          <div className="vs-grid-2">
            <div className="vs-bezel-obsidian">
              <div
                className="vs-card"
                style={{
                  padding: '22px',
                  height: '100%',
                }}
              >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                  Choose Verisource if:
                </h3>
                <StatusBadge tone="pass">RECOMMENDED FOR EXECUTION</StatusBadge>
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '18px',
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                {entry.whenToPickVerisource.map((point) => (
                  <li key={point} style={{ marginBottom: '8px' }}>
                    {point}
                  </li>
                ))}
              </ul>
              </div>
            </div>

            <div className="vs-card" style={{ padding: '22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                  {`Consider ${entry.competitorName} if:`}
                </h3>
                <StatusBadge>ALTERNATIVE FIT</StatusBadge>
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '18px',
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  color: 'var(--vs-ink-secondary)',
                }}
              >
                {entry.whenToPickCompetitor.map((point) => (
                  <li key={point} style={{ marginBottom: '8px' }}>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            BUYER QUESTIONS &amp; MIGRATION DETAILS
          </div>
          <h2
            style={{
              fontSize: '25px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              margin: '0 0 16px 0',
            }}
          >
            {`Frequently asked questions: Verisource vs. ${entry.competitorName}`}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {entry.faqs.map((faq) => (
              <div
                key={faq.question}
                className="vs-card"
                style={{ padding: '18px 20px' }}
              >
                <h3
                  style={{
                    fontSize: '15.5px',
                    fontWeight: 700,
                    margin: '0 0 6px 0',
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

        <GtmDomainScanHandoff
          eyebrow={`SWITCH FROM PASSIVE TRACKING · TEST YOUR DOMAIN FREE`}
          headline="Run a live 3-engine diagnosis & preview your 1-Click AI Fix Prompt."
        />
      </div>
    </div>
  );
}
