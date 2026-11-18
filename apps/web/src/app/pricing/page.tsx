import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import React from 'react';
import { PricingLadderSection } from '../../components/PricingLadderSection';
import { resolveConsoleRequestAccess } from '../../lib/data-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title:
    'Pricing ($0 7-Day Trial, $19 Audit Pass & $49–$249/mo Plans) | Verisource',
  description:
    'Transparent self-serve GEO & Streamable HTTP /mcp pricing: $0.00 due today 7-day trial on Starter ($49/mo) & Pro + MCP ($99/mo), $19 One-Time Audit Pass, and $249/mo Agency White-Label.',
  alternates: {
    canonical: 'https://verisource.dev/pricing',
  },
};

const PRICING_FAQS = [
  {
    question: 'Am I charged anything today on the 7-day trial?',
    answer:
      'No. First-time monthly subscribers on Starter ($49/mo) and Pro + MCP ($99/mo) pay $0.00 today. Cancel in 1 click inside Stripe Billing Portal anytime before Day 7 to avoid billing.',
  },
  {
    question: 'How does the $19 One-Time Audit Pass credit toward a monthly plan?',
    answer:
      'The $19 One-Time Audit Pass runs one complete 3-engine audit and generates your validated JSON-LD, /llms.txt, /agents.md, and 1-Click AI Fix Prompt with zero recurring subscription. If you upgrade to any monthly plan within 7 days, $19.00 is automatically deducted from Month 1.',
  },
  {
    question: 'Do we keep our published site fixes if we cancel later?',
    answer:
      'Yes. Every schema.org JSON-LD graph, /llms.txt directory, /agents.md truth sheet, Shopify Liquid template, and comparison page published on your domain remains yours permanently.',
  },
  {
    question: 'What does the Founding Partner Rate Lock guarantee?',
    answer:
      'The first 30 active workspaces lock current Founding Partner rates ($49/mo Starter, $99/mo Pro vs. $149/mo standard, and $249/mo Agency vs. $349/mo standard, or 20% lower on annual billing) for as long as the subscription remains active.',
  },
] as const;

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; plan?: string; env?: string }>;
}): Promise<React.ReactElement> {
  const [params, reqHeaders, reqCookies] = await Promise.all([
    searchParams,
    headers(),
    cookies(),
  ]);

  const forwardedHeaders = new Headers();
  const authHeader = reqHeaders.get('authorization');
  if (authHeader) {
    forwardedHeaders.set('authorization', authHeader);
  }
  const cookieHeader = reqCookies
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');
  if (cookieHeader) {
    forwardedHeaders.set('cookie', cookieHeader);
  }

  const syntheticReq = new Request('http://127.0.0.1/pricing', {
    headers: forwardedHeaders,
  });
  const access = await resolveConsoleRequestAccess(syntheticReq);

  const initialSubscriber =
    (access.status === 'authenticated' || access.status === 'mock_owner') &&
    access.profile.plan_tier !== 'free'
      ? {
          email: access.profile.email,
          planTier: access.profile.plan_tier,
          billingCycle: access.profile.billing_cycle ?? 'monthly',
          hasStripeCustomer: Boolean(
            access.profile.stripe_customer_id &&
              !access.profile.stripe_customer_id.startsWith('cus_demo_')
          ),
        }
      : null;

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Verisource Pricing & Plan Comparison',
    url: 'https://verisource.dev/pricing',
    description:
      'Self-serve Generative Engine Optimization (GEO) and Streamable HTTP /mcp server pricing ($19 One-Time Pass, $49/mo Starter, $99/mo Pro + MCP, and $249/mo Agency White-Label).',
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PRICING_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="vs-container" style={{ paddingTop: '20px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      {!initialSubscriber ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}

      <PricingLadderSection
        preselectedDomain={params.domain}
        preselectedPlan={params.plan}
        preselectedEnv={params.env}
        initialSubscriber={initialSubscriber}
      />

      {!initialSubscriber ? (
        <section style={{ marginTop: '48px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
            BILLING, TRIAL &amp; OWNERSHIP FAQ
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0',
            }}
          >
            Straight answers before you start.
          </h2>
          <div className="vs-grid-2">
            {PRICING_FAQS.map((faq) => (
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

          <div
            className="vs-band-obsidian"
            style={{
              marginTop: '44px',
              marginBottom: '20px',
              padding: '26px 28px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ maxWidth: '620px' }}>
              <div
                className="vs-eyebrow"
                style={{ color: '#34D399', marginBottom: '4px' }}
              >
                WANT TO SEE YOUR SCORE FIRST?
              </div>
              <strong style={{ fontSize: '18px', color: '#FFFFFF' }}>
                Run a free 60-second audit on your domain before choosing a plan.
              </strong>
              <div
                style={{
                  fontSize: '13.5px',
                  color: '#CBD5E1',
                  marginTop: '4px',
                }}
              >
                Check ChatGPT, Gemini, and Perplexity buyer visibility, auto-detect
                your CMS, and preview your 1-Click AI Fix Prompt with zero account
                required.
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link href="/#grader" className="vs-btn vs-btn-secondary">
                Run Free Domain Audit →
              </Link>
              <Link
                href="/agencies#sandbox"
                className="vs-btn"
              >
                Agency Sandbox ($249/mo) →
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
