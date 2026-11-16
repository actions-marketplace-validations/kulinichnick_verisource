'use client';

import React, { useState } from 'react';
import {
  computePartnerCommissionBreakdown,
  sanitizeAffiliateCode,
} from '@verisource/core-geo';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';

export function PartnerHubClient(): React.ReactElement {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [starterCount, setStarterCount] = useState<number>(4);
  const [proCount, setProCount] = useState<number>(6);
  const [agencyCount, setAgencyCount] = useState<number>(4);

  const [partnerName, setPartnerName] = useState<string>('');
  const [partnerEmail, setPartnerEmail] = useState<string>('');
  const [partnerSlug, setPartnerSlug] = useState<string>('');
  const [channelUrl, setChannelUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mintedLinks, setMintedLinks] = useState<{
    partnerSlug: string;
    referralShortUrl: string;
    benchmarkRefUrl: string;
    toolsRefUrl: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const breakdown = computePartnerCommissionBreakdown({
    starterCount,
    proCount,
    agencyCount,
    cycle,
  });

  async function handleMintPartnerLink(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErrorMsg(null);

    const previewSlug = sanitizeAffiliateCode(partnerSlug);
    if (!previewSlug) {
      setErrorMsg(
        'Choose a 3–40 character partner code using letters, numbers, hyphens, or underscores.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: partnerName,
          email: partnerEmail,
          slug: previewSlug,
          channel_url: channelUrl,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        partnerSlug?: string;
        referralShortUrl?: string;
        benchmarkRefUrl?: string;
        toolsRefUrl?: string;
      };
      if (!res.ok || !data.ok || !data.referralShortUrl) {
        setErrorMsg(data.message ?? 'Unable to generate partner link.');
        return;
      }
      setMintedLinks({
        partnerSlug: data.partnerSlug ?? previewSlug,
        referralShortUrl: data.referralShortUrl,
        benchmarkRefUrl: data.benchmarkRefUrl ?? '',
        toolsRefUrl: data.toolsRefUrl ?? '',
      });
    } catch {
      setErrorMsg('Network error while minting partner link.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopy(text: string): void {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 1800);
  }

  return (
    <div style={{ display: 'grid', gap: '28px', marginBottom: '36px' }}>
      {/* Interactive 25% Recurring Commission Calculator */}
      <div className="vs-card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--vs-border)',
            background: 'var(--vs-surface-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <span className="vs-eyebrow">25% RECURRING COMMISSION MODEL</span>
            <StatusBadge tone="pass">90-DAY VS_REF COOKIE WINDOW</StatusBadge>
          </div>

          <div
            role="group"
            aria-label="Referred subscriber billing cycle"
            className="vs-pill-group"
          >
            <button
              type="button"
              className="vs-pill-btn vs-pill-btn-sm"
              data-active={cycle === 'monthly' ? 'true' : 'false'}
              onClick={() => setCycle('monthly')}
            >
              Monthly Plans
            </button>
            <button
              type="button"
              className="vs-pill-btn vs-pill-btn-sm"
              data-active={cycle === 'annual' ? 'true' : 'false'}
              onClick={() => setCycle('annual')}
            >
              Annual Plans (Paid Upfront)
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '20px',
            background: 'var(--vs-surface-warm)',
            borderBottom: '1px solid var(--vs-border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              <span>Starter ($49/mo)</span>
              <span className="vs-mono">{`${starterCount} workspaces`}</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={starterCount}
              aria-label="Referred Starter Brand workspaces"
              onChange={(e) => setStarterCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0A0E17' }}
            />
            <div style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
              {cycle === 'annual'
                ? '$117.00/yr commission per workspace'
                : '$12.25/mo commission per workspace'}
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              <span>Pro + MCP ($99/mo)</span>
              <span className="vs-mono">{`${proCount} workspaces`}</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={proCount}
              aria-label="Referred Pro + MCP workspaces"
              onChange={(e) => setProCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0A0E17' }}
            />
            <div style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
              {cycle === 'annual'
                ? '$237.00/yr commission per workspace'
                : '$24.75/mo commission per workspace'}
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              <span>Agency ($249/mo)</span>
              <span className="vs-mono">{`${agencyCount} workspaces`}</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={agencyCount}
              aria-label="Referred Agency White-Label workspaces"
              onChange={(e) => setAgencyCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0A0E17' }}
            />
            <div style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
              {cycle === 'annual'
                ? '$597.00/yr commission per workspace'
                : '$62.25/mo commission per workspace'}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          <MetricLedgerCell
            label="Active Referrals"
            value={String(breakdown.totalReferredWorkspaces)}
            sublabel={`$${breakdown.grossMrrUsd.toLocaleString()}/mo referred MRR`}
          />
          <MetricLedgerCell
            label="Your Monthly Payout (25%)"
            value={`$${breakdown.partnerMonthlyCommissionUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sublabel="Recurring every active billing month"
          />
          <MetricLedgerCell
            label="Annualized Partner Revenue"
            value={`$${breakdown.partnerAnnualizedCommissionUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sublabel={
              cycle === 'annual'
                ? 'Settled upfront upon annual Stripe invoice'
                : '12-month recurring run rate'
            }
          />
        </div>
      </div>

      {/* Instant Partner Link Minter */}
      <div className="vs-card" style={{ padding: '24px' }} id="mint-partner-link">
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
              INSTANT PARTNER LINK GENERATOR
            </div>
            <h2
              style={{
                fontSize: '21px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Mint your <code className="vs-mono">/r/[slug]</code> 25% recurring
              attribution links in 15 seconds
            </h2>
          </div>
          <StatusBadge tone="pass">STRIPE METADATA SYNCED</StatusBadge>
        </div>

        <form
          onSubmit={handleMintPartnerLink}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          <input
            type="text"
            className="vs-input"
            placeholder="Your name or agency (e.g. Alex Rivera)"
            aria-label="Partner or agency name"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            required
          />
          <input
            type="email"
            className="vs-input"
            placeholder="Partner payout email"
            aria-label="Partner payout email"
            value={partnerEmail}
            onChange={(e) => setPartnerEmail(e.target.value)}
            required
          />
          <input
            type="text"
            className="vs-input vs-mono"
            placeholder="Desired code (e.g. alex-seo)"
            aria-label="Desired partner referral slug"
            value={partnerSlug}
            onChange={(e) => setPartnerSlug(e.target.value)}
            required
          />
          <input
            type="text"
            className="vs-input"
            placeholder="YouTube, newsletter, or agency URL"
            aria-label="Partner channel or agency URL"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            required
          />
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" className="vs-btn" disabled={submitting}>
              {submitting
                ? 'Minting Partner Links...'
                : 'Generate My 25% Partner Links →'}
            </button>
            <span style={{ fontSize: '12.5px', color: 'var(--vs-ink-muted)' }}>
              Self-referrals are automatically filtered at checkout; recurring
              payouts settle monthly via Stripe.
            </span>
          </div>
        </form>

        {errorMsg && (
          <div
            role="alert"
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #FCA5A5',
              background: '#FEF2F2',
              color: '#991B1B',
              fontSize: '13px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {mintedLinks && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--vs-border-strong)',
              background: 'var(--vs-surface-warm)',
              display: 'grid',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusBadge tone="pass">ACTIVE · /R/{mintedLinks.partnerSlug.toUpperCase()}</StatusBadge>
              <span style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
                Partner kit dispatched—copy any deep link below:
              </span>
            </div>

            {[
              {
                label: 'Primary Shortlink',
                url: mintedLinks.referralShortUrl,
              },
              {
                label: '2026 40-Domain Benchmark Link',
                url: mintedLinks.benchmarkRefUrl,
              },
              {
                label: 'Free Zero-Signup Validators Link',
                url: mintedLinks.toolsRefUrl,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '8px 12px',
                  background: 'var(--vs-surface)',
                  border: '1px solid var(--vs-border)',
                  borderRadius: '6px',
                }}
              >
                <div>
                  <strong style={{ fontSize: '12.5px', marginRight: '8px' }}>
                    {item.label}:
                  </strong>
                  <code className="vs-mono" style={{ fontSize: '12px' }}>
                    {item.url}
                  </code>
                </div>
                <button
                  type="button"
                  className="vs-btn vs-btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => handleCopy(item.url)}
                >
                  {copiedUrl === item.url ? '✓ Copied' : 'Copy Link'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
