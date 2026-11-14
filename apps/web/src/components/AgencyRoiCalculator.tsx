'use client';

import React, { useState } from 'react';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';

export function AgencyRoiCalculator(): React.ReactElement {
  const [clientCount, setClientCount] = useState<number>(5);
  const [retainerUsd, setRetainerUsd] = useState<number>(1500);
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');

  const softwareCostMonthly = cycle === 'annual' ? 199 : 249;
  const grossMonthly = clientCount * retainerUsd;
  const netMonthly = grossMonthly - softwareCostMonthly;
  const netAnnual = netMonthly * 12;
  const marginPct =
    grossMonthly > 0
      ? Math.max(0, ((grossMonthly - softwareCostMonthly) / grossMonthly) * 100)
      : 0;
  const effectivePerClient = softwareCostMonthly / clientCount;
  const remainingSlots = Math.max(0, 15 - clientCount);

  return (
    <div
      className="vs-card"
      style={{
        marginTop: '18px',
        overflow: 'hidden',
        background: 'var(--vs-surface)',
      }}
    >
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--vs-border)',
          background: 'var(--vs-surface-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="vs-eyebrow">INTERACTIVE RETAINER MARGIN MODEL</span>
          <StatusBadge tone="pass">UP TO 15 CLIENT SITES INCLUDED</StatusBadge>
        </div>

        <div
          role="group"
          aria-label="Agency billing cycle"
          style={{
            display: 'inline-flex',
            border: '1px solid var(--vs-border)',
            borderRadius: '6px',
            padding: '2px',
            background: 'var(--vs-surface)',
          }}
        >
          <button
            type="button"
            onClick={() => setCycle('monthly')}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11.5px',
              fontWeight: 600,
              background: cycle === 'monthly' ? 'var(--vs-ink)' : 'transparent',
              color: cycle === 'monthly' ? '#FFFFFF' : 'var(--vs-ink-secondary)',
            }}
          >
            Monthly ($249/mo)
          </button>
          <button
            type="button"
            onClick={() => setCycle('annual')}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11.5px',
              fontWeight: 600,
              background: cycle === 'annual' ? 'var(--vs-ink)' : 'transparent',
              color: cycle === 'annual' ? '#FFFFFF' : 'var(--vs-ink-secondary)',
            }}
          >
            Annual ($199/mo · -20%)
          </button>
        </div>
      </div>

      <div
        className="vs-grid-2"
        style={{
          padding: '20px 18px',
          borderBottom: '1px solid var(--vs-border)',
          background: 'var(--vs-surface-warm)',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '8px',
            }}
          >
            <label
              htmlFor="vs-roi-clients"
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              Active Client Retainers (out of 15 slots)
            </label>
            <span
              className="vs-mono"
              style={{ fontSize: '14px', fontWeight: 700 }}
            >
              {clientCount} {clientCount === 1 ? 'client' : 'clients'}
            </span>
          </div>
          <input
            id="vs-roi-clients"
            type="range"
            min={1}
            max={15}
            step={1}
            value={clientCount}
            onChange={(e) => setClientCount(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#0A0E17',
              cursor: 'pointer',
            }}
          />
          <div
            className="vs-mono"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--vs-ink-muted)',
              marginTop: '4px',
            }}
          >
            <span>1 client</span>
            <span>8 clients</span>
            <span>15 clients (max)</span>
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '8px',
            }}
          >
            <label
              htmlFor="vs-roi-retainer"
              style={{ fontSize: '13px', fontWeight: 600 }}
            >
              Monthly Client GEO Retainer Fee
            </label>
            <span
              className="vs-mono"
              style={{ fontSize: '14px', fontWeight: 700 }}
            >
              ${retainerUsd.toLocaleString('en-US')}/mo
            </span>
          </div>
          <input
            id="vs-roi-retainer"
            type="range"
            min={750}
            max={3500}
            step={250}
            value={retainerUsd}
            onChange={(e) => setRetainerUsd(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#0A0E17',
              cursor: 'pointer',
            }}
          />
          <div
            className="vs-mono"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--vs-ink-muted)',
              marginTop: '4px',
            }}
          >
            <span>$750/mo</span>
            <span>$2,000/mo</span>
            <span>$3,500/mo</span>
          </div>
        </div>
      </div>

      <div className="vs-ledger-strip-3">
        <MetricLedgerCell
          label="GROSS CLIENT BILLINGS"
          value={`$${grossMonthly.toLocaleString('en-US')}`}
          suffix="/mo"
          sublabel={`${clientCount} × $${retainerUsd.toLocaleString('en-US')}/mo`}
        />
        <MetricLedgerCell
          label="NET PROFIT AFTER VERISOURCE"
          value={`$${netMonthly.toLocaleString('en-US')}`}
          suffix="/mo"
          tone="pass"
          sublabel={`$${netAnnual.toLocaleString('en-US')}/yr annualized net`}
        />
        <MetricLedgerCell
          label="AGENCY SOFTWARE MARGIN"
          value={`${marginPct.toFixed(1)}%`}
          tone="pass"
          sublabel={`$${effectivePerClient.toFixed(2)}/active client · ${remainingSlots} open slots`}
        />
      </div>

      <div
        style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--vs-border)',
          background: 'var(--vs-surface-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)' }}>
          Includes white-label <code className="vs-mono">/audit/[slug]</code>{' '}
          links, 3-touch CSV sequence export, and 5,000{' '}
          <code className="vs-mono">/mcp</code> credits/mo.
        </span>
        <a
          href={`/api/checkout?plan=agency_249&cycle=${cycle}`}
          className="vs-btn"
          style={{ padding: '7px 14px', fontSize: '12.5px' }}
        >
          Lock In 15 Client Slots (${softwareCostMonthly}/mo) →
        </a>
      </div>
    </div>
  );
}
