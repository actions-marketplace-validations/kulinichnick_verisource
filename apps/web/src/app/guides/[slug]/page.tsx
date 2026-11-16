import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { GtmDomainScanHandoff } from '../../../components/GtmDomainScanHandoff';
import { PROTOCOL_GUIDES } from '../../../lib/gtm-content';

export function generateStaticParams(): Array<{ slug: string }> {
  return PROTOCOL_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = PROTOCOL_GUIDES.find((g) => g.slug === slug);
  if (!guide) {
    return { title: 'Guide Not Found | Verisource' };
  }
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: {
      canonical: `https://verisource.dev/guides/${guide.slug}`,
    },
  };
}

export default async function ProtocolGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const guide = PROTOCOL_GUIDES.find((g) => g.slug === slug);
  if (!guide) {
    notFound();
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: guide.title,
    description: guide.metaDescription,
    author: {
      '@type': 'Organization',
      name: 'Verisource',
      url: 'https://verisource.dev',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Verisource',
      url: 'https://verisource.dev',
    },
    mainEntityOfPage: `https://verisource.dev/guides/${guide.slug}`,
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((f) => ({
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
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
              href="/guides"
              className="vs-mono"
              style={{
                fontSize: '12px',
                color: 'var(--vs-ink-muted)',
                textDecoration: 'none',
              }}
            >
              ← All GEO &amp; Protocol Guides
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
            <StatusBadge tone="pass">{guide.eyebrow}</StatusBadge>
            <StatusBadge>{guide.readingTime.toUpperCase()}</StatusBadge>
            <StatusBadge>SYNTAX &amp; TRUTH VERIFIED</StatusBadge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: '0 0 18px 0',
              maxWidth: '880px',
            }}
          >
            {guide.title}
          </h1>

          <div
            className="vs-guided-banner"
            style={{ maxWidth: '860px', marginBottom: '18px' }}
          >
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              DIRECT TECHNICAL SUMMARY
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '14.5px',
                lineHeight: 1.6,
                color: 'var(--vs-ink)',
              }}
            >
              {guide.answerFirstSummary}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <Link href={`/tools/${guide.relatedToolSlug}`} className="vs-btn">
              {guide.relatedToolLabel}
            </Link>
            <Link href="/tutorial#cms-quickstarts" className="vs-btn vs-btn-secondary">
              Interactive 7-CMS Setup Walkthrough
            </Link>
          </div>
        </div>
      </section>

      <div className="vs-container" style={{ maxWidth: '940px' }}>
        <section style={{ marginBottom: '36px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            PROTOCOL REFERENCE MATRIX
          </div>
          <div className="vs-card vs-table-wrap">
            <table className="vs-table">
              <thead>
                <tr>
                  <th>{guide.referenceTable.headers[0]}</th>
                  <th>{guide.referenceTable.headers[1]}</th>
                  <th>{guide.referenceTable.headers[2]}</th>
                </tr>
              </thead>
              <tbody>
                {guide.referenceTable.rows.map((row) => (
                  <tr key={row[0]}>
                    <td>
                      <strong className="vs-mono" style={{ fontSize: '12.5px' }}>
                        {row[0]}
                      </strong>
                    </td>
                    <td style={{ color: 'var(--vs-ink-secondary)' }}>{row[1]}</td>
                    <td>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {guide.sections.map((sec) => (
          <section key={sec.heading} style={{ marginBottom: '34px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '0 0 10px 0',
              }}
            >
              {sec.heading}
            </h2>
            {sec.paragraphs.map((p) => (
              <p
                key={p.slice(0, 32)}
                style={{
                  fontSize: '14.5px',
                  lineHeight: 1.65,
                  color: 'var(--vs-ink-secondary)',
                  margin: '0 0 12px 0',
                }}
              >
                {p.trim()}
              </p>
            ))}
            {sec.codeBlock ? (
              <div
                className="vs-card"
                style={{ overflow: 'hidden', marginTop: '14px' }}
              >
                <div
                  style={{
                    padding: '9px 14px',
                    background: 'var(--vs-surface-subtle)',
                    borderBottom: '1px solid var(--vs-border)',
                    fontSize: '11.5px',
                  }}
                  className="vs-mono"
                >
                  {sec.codeTitle ?? 'Protocol Implementation Specimen'}
                </div>
                <pre className="vs-code-block">{sec.codeBlock}</pre>
              </div>
            ) : null}
          </section>
        ))}

        <section>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            TECHNICAL FAQ
          </div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 14px 0',
            }}
          >
            Common implementation questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {guide.faqs.map((faq) => (
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
          eyebrow="SKIP MANUAL FILE AUTHORING"
          headline="Let Verisource auto-detect your CMS and build your 1-Click AI Fix Prompt."
        />
      </div>
    </div>
  );
}
