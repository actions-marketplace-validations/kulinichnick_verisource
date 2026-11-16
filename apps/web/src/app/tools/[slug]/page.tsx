import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { FreeSeoToolClient } from '../../../components/FreeSeoToolClient';
import { FREE_SEO_TOOLS } from '../../../lib/gtm-content';

export function generateStaticParams(): Array<{ slug: string }> {
  return FREE_SEO_TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = FREE_SEO_TOOLS.find((t) => t.slug === slug);
  if (!tool) {
    return { title: 'Tool Not Found | Verisource' };
  }
  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    alternates: {
      canonical: `https://verisource.dev/tools/${tool.slug}`,
    },
  };
}

export default async function FreeSeoToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const tool = FREE_SEO_TOOLS.find((t) => t.slug === slug);
  if (!tool) {
    notFound();
  }

  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title,
    url: `https://verisource.dev/tools/${tool.slug}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    description: tool.metaDescription,
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '44px 0 42px 0',
          marginBottom: '34px',
        }}
      >
        <div className="vs-container">
          <div style={{ marginBottom: '12px' }}>
            <Link
              href="/tools"
              className="vs-mono"
              style={{
                fontSize: '12px',
                color: 'var(--vs-ink-muted)',
                textDecoration: 'none',
              }}
            >
              ← All Free GEO Diagnostic Tools
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
            <StatusBadge tone="pass">{tool.eyebrow}</StatusBadge>
            <StatusBadge>$0 · NO ACCOUNT REQUIRED</StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 3.6vw, 42px)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: '0 0 14px 0',
              maxWidth: '840px',
            }}
          >
            {tool.title}
          </h1>

          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: 'var(--vs-ink-secondary)',
              margin: 0,
              maxWidth: '760px',
            }}
          >
            {tool.answerFirstSummary}
          </p>
        </div>
      </section>

      <div className="vs-container">
        <FreeSeoToolClient
          toolSlug={tool.slug}
          placeholderDomain={tool.placeholderDomain}
        />

        <section style={{ marginBottom: '40px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            DIAGNOSTIC COVERAGE
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 14px 0',
            }}
          >
            What this live HTTP inspector checks
          </h2>
          <div className="vs-grid-2">
            {tool.whatItChecks.map((item, idx) => (
              <div
                key={item}
                className="vs-card"
                style={{ padding: '16px 18px' }}
              >
                <div
                  className="vs-mono"
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--vs-ink-muted)',
                    marginBottom: '4px',
                  }}
                >
                  {`CHECK 0${idx + 1}`}
                </div>
                <div style={{ fontSize: '13.5px', color: 'var(--vs-ink)' }}>
                  {item}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            PROTOCOL QUESTIONS
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 14px 0',
            }}
          >
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tool.faqs.map((faq) => (
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
      </div>
    </div>
  );
}
