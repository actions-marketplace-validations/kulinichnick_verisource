'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import {
  classifyPitchShowcaseBucket,
  type AgencyPitchReportRow,
  type PitchShowcaseBucket,
} from '@verisource/core-geo';
import { StatusBadge } from '@verisource/ui';

type FilterTab = 'all' | PitchShowcaseBucket;

function verticalBadgeLabel(bucket: PitchShowcaseBucket): string {
  switch (bucket) {
    case 'agencies':
      return 'AGENCY';
    case 'local_services':
      return 'LOCAL SERVICE';
    default:
      return 'SAAS / D2C';
  }
}

export function SampleAuditCohortClient(props: {
  reports: AgencyPitchReportRow[];
}): React.ReactElement {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [customDomain, setCustomDomain] = useState('');

  const classified = useMemo(
    () =>
      props.reports.map((report) => ({
        report,
        bucket: classifyPitchShowcaseBucket(report),
      })),
    [props.reports]
  );

  const counts = useMemo(() => {
    const tally: Record<PitchShowcaseBucket, number> = {
      saas_d2c: 0,
      agencies: 0,
      local_services: 0,
    };
    for (const item of classified) {
      tally[item.bucket] += 1;
    }
    return tally;
  }, [classified]);

  const visibleItems = useMemo(
    () =>
      activeFilter === 'all'
        ? classified
        : classified.filter((item) => item.bucket === activeFilter),
    [activeFilter, classified]
  );

  function handleQuickScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = customDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      ?.trim();
    if (!cleaned) {
      window.location.href = '/#grader';
      return;
    }
    window.location.href = `/?domain=${encodeURIComponent(cleaned)}#grader`;
  }

  const filterTabs: Array<{ id: FilterTab; label: string; count: number }> = [
    { id: 'all', label: 'All Verticals', count: classified.length },
    { id: 'saas_d2c', label: 'B2B SaaS & D2C', count: counts.saas_d2c },
    { id: 'agencies', label: 'SEO & Web Agencies', count: counts.agencies },
    {
      id: 'local_services',
      label: 'High-Ticket Local Services',
      count: counts.local_services,
    },
  ];

  return (
    <div>
      {/* Filter Bar + Inline Free Domain Scan Handoff */}
      <div
        className="vs-card"
        style={{
          padding: '12px 16px',
          marginBottom: '14px',
          background: 'var(--vs-surface-warm)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div
          role="tablist"
          aria-label="Filter benchmark audits by industry vertical"
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            border: '1px solid var(--vs-border)',
            borderRadius: '5px',
            padding: '2px',
            background: '#FFFFFF',
            gap: '2px',
          }}
        >
          {filterTabs.map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px 11px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: active ? 'var(--vs-ink)' : 'transparent',
                  color: active ? '#FFFFFF' : 'var(--vs-ink-secondary)',
                }}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleQuickScanSubmit}
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <input
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="Check your domain (e.g. acme.com)"
            aria-label="Check your own domain in the free AI readiness grader"
            className="vs-input"
            style={{
              width: '235px',
              padding: '6px 10px',
              fontSize: '12.5px',
              background: '#FFFFFF',
            }}
          />
          <button
            type="submit"
            className="vs-btn"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Scan My Site Free →
          </button>
        </form>
      </div>

      <div className="vs-card vs-table-wrap">
        <table className="vs-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>AI Visibility</th>
              <th>Rivals Cited</th>
              <th>Key Protocol Gap Flagged</th>
              <th style={{ textAlign: 'right' }}>Live Brief</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map(({ report: r, bucket }) => (
              <tr key={r.id}>
                <td>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <strong>{r.prospect_brand_name}</strong>
                    <StatusBadge>{verticalBadgeLabel(bucket)}</StatusBadge>
                  </div>
                  <div
                    className="vs-mono"
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--vs-ink-muted)',
                      marginTop: '2px',
                    }}
                  >
                    {r.prospect_domain}
                  </div>
                </td>
                <td className="vs-mono" style={{ whiteSpace: 'nowrap' }}>
                  <strong>{r.visibility_score}</strong> / 100
                </td>
                <td
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--vs-ink-secondary)',
                    maxWidth: '240px',
                  }}
                >
                  {r.summary_payload.competitors_winning.length > 0
                    ? r.summary_payload.competitors_winning
                        .slice(0, 3)
                        .join(' · ')
                    : 'Category directories'}
                </td>
                <td
                  style={{
                    fontSize: '13px',
                    color: 'var(--vs-ink-secondary)',
                  }}
                >
                  {r.summary_payload.top_gaps[0] ??
                    'Missing /agents.md and structured JSON-LD entity specs.'}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Link
                    href={`/audit/${r.share_slug}`}
                    className="vs-mono"
                    style={{
                      fontSize: '12px',
                      color: 'var(--vs-ink)',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    /audit/{r.share_slug} →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
