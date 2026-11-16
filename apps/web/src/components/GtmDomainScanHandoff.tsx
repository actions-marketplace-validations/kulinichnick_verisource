'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { StatusBadge } from '@verisource/ui';

export function GtmDomainScanHandoff(props: {
  eyebrow?: string;
  headline?: string;
}): React.ReactElement {
  const router = useRouter();
  const [domain, setDomain] = useState<string>('');

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    const cleaned = domain
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '');
    if (!cleaned) {
      router.push('/#grader');
      return;
    }
    router.push(`/?domain=${encodeURIComponent(cleaned)}#grader`);
  }

  return (
    <div
      className="vs-card"
      style={{
        padding: '24px',
        background: 'var(--vs-surface-warm)',
        marginTop: '44px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <div>
          <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
            {props.eyebrow ?? 'FREE 60-SECOND AI VISIBILITY & CMS AUDIT'}
          </div>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {props.headline ??
              'Test your own domain across ChatGPT, Gemini & Perplexity right now.'}
          </h3>
        </div>
        <StatusBadge tone="pass">$0 TODAY · 7-DAY FREE TRIAL</StatusBadge>
      </div>

      <form
        onSubmit={handleSubmit}
        className="vs-grader-form"
        style={{ padding: 0, borderBottom: 'none', marginBottom: '14px' }}
      >
        <input
          type="text"
          className="vs-input"
          placeholder="Enter your website (e.g. yourcompany.com)"
          aria-label="Website domain for free AI search audit"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
        <button
          type="submit"
          className="vs-btn"
          style={{ whiteSpace: 'nowrap' }}
        >
          Audit My Site Free →
        </button>
      </form>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <Link href="/pricing" className="vs-btn vs-btn-secondary">
          Start 7-Day Free Trial ($0 Today) →
        </Link>
        <Link href="/tutorial" className="vs-btn vs-btn-secondary">
          Interactive 90s Product Tour
        </Link>
        <Link href="/agencies" className="vs-btn vs-btn-secondary">
          $249/mo Agency White-Label (15 Sites)
        </Link>
      </div>
    </div>
  );
}
