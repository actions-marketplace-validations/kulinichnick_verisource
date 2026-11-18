'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { StatusBadge } from '@verisource/ui';
import type { PublishedDomainScorecard } from '../lib/published-reports';

type DirectoryFilterId =
  | 'all'
  | 'b2b_saas'
  | 'shopify_dtc'
  | 'missing_agents_md'
  | 'has_llms_txt';

export function ReportsDirectoryClient({
  reports,
}: {
  reports: PublishedDomainScorecard[];
}): React.ReactElement {
  const [query, setQuery] = useState<string>('');
  const [filter, setFilter] = useState<DirectoryFilterId>('all');

  const counts = useMemo(() => {
    return {
      all: reports.length,
      b2b_saas: reports.filter((r) => r.vertical === 'b2b_saas').length,
      shopify_dtc: reports.filter(
        (r) => r.isShopify || r.vertical === 'shopify_dtc'
      ).length,
      missing_agents_md: reports.filter(
        (r) => r.agentsMdStatus !== 'custom_enriched'
      ).length,
      has_llms_txt: reports.filter((r) => r.llmsTxtStatus === 'present').length,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (filter === 'b2b_saas' && r.vertical !== 'b2b_saas') return false;
      if (
        filter === 'shopify_dtc' &&
        !r.isShopify &&
        r.vertical !== 'shopify_dtc'
      ) {
        return false;
      }
      if (
        filter === 'missing_agents_md' &&
        r.agentsMdStatus === 'custom_enriched'
      ) {
        return false;
      }
      if (filter === 'has_llms_txt' && r.llmsTxtStatus !== 'present') {
        return false;
      }
      if (!q) return true;
      return (
        r.domain.toLowerCase().includes(q) ||
        r.brandName.toLowerCase().includes(q) ||
        r.detectedPlatformLabel.toLowerCase().includes(q) ||
        r.topGapSummary.toLowerCase().includes(q)
      );
    });
  }, [reports, query, filter]);

  const filterOptions: ReadonlyArray<{
    id: DirectoryFilterId;
    label: string;
  }> = [
    { id: 'all', label: `All Domains (${counts.all})` },
    { id: 'b2b_saas', label: `B2B SaaS & DevTools (${counts.b2b_saas})` },
    { id: 'shopify_dtc', label: `Shopify & Commerce (${counts.shopify_dtc})` },
    {
      id: 'missing_agents_md',
      label: `Missing Custom /agents.md (${counts.missing_agents_md})`,
    },
    { id: 'has_llms_txt', label: `Live /llms.txt (${counts.has_llms_txt})` },
  ];

  return (
    <div className="vs-bezel">
      <div
        className="vs-card"
        style={{
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="vs-pill-btn vs-pill-btn-sm"
                data-active={filter === opt.id ? 'true' : 'false'}
                onClick={() => setFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by domain, CMS, or gap (e.g. supabase.com, Shopify)..."
            aria-label="Filter domain scorecards"
            className="vs-input"
            style={{
              maxWidth: '340px',
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="vs-table" style={{ width: '100%', minWidth: '760px' }}>
            <thead>
              <tr>
                <th>Domain &amp; Brand</th>
                <th>Detected Stack</th>
                <th>Readiness</th>
                <th>AI Bots</th>
                <th>/llms.txt</th>
                <th>/agents.md</th>
                <th>JSON-LD</th>
                <th style={{ textAlign: 'right' }}>Scorecard</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((item) => {
                const botsOk =
                  item.robotsAiBotStatus.GPTBot &&
                  item.robotsAiBotStatus.PerplexityBot &&
                  !item.robotsAiBotStatus.waf_blocked;
                return (
                  <tr key={item.domain}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--vs-ink)' }}>
                        {item.brandName}
                      </div>
                      <div
                        className="vs-mono"
                        style={{
                          fontSize: '12px',
                          color: 'var(--vs-ink-secondary)',
                        }}
                      >
                        {item.domain}
                      </div>
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      {item.detectedPlatformLabel}
                    </td>
                    <td className="vs-mono" style={{ fontWeight: 700 }}>
                      <StatusBadge
                        tone={
                          item.readinessScore >= 75
                            ? 'pass'
                            : item.readinessScore >= 55
                              ? 'warn'
                              : 'critical'
                        }
                      >
                        {`${item.readinessScore}/100`}
                      </StatusBadge>
                    </td>
                    <td>
                      <StatusBadge tone={botsOk ? 'pass' : 'critical'}>
                        {botsOk ? '200 OK' : '403 / BLOCK'}
                      </StatusBadge>
                    </td>
                    <td className="vs-mono" style={{ fontSize: '12px' }}>
                      <StatusBadge
                        tone={
                          item.llmsTxtStatus === 'present' ? 'pass' : 'neutral'
                        }
                      >
                        {item.llmsTxtStatus === 'present' ? 'LIVE' : 'MISSING'}
                      </StatusBadge>
                    </td>
                    <td className="vs-mono" style={{ fontSize: '12px' }}>
                      <StatusBadge
                        tone={
                          item.agentsMdStatus === 'custom_enriched'
                            ? 'pass'
                            : item.agentsMdStatus === 'default_boilerplate'
                              ? 'warn'
                              : 'neutral'
                        }
                      >
                        {item.agentsMdStatus === 'custom_enriched'
                          ? 'VERIFIED'
                          : item.agentsMdStatus === 'default_boilerplate'
                            ? 'BOILERPLATE'
                            : 'MISSING'}
                      </StatusBadge>
                    </td>
                    <td
                      className="vs-mono"
                      style={{ fontSize: '12.5px', fontWeight: 600 }}
                    >
                      {`${item.jsonLdPillarsPassed}/3`}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/report/${item.domain}`}
                        className="vs-btn vs-btn-secondary"
                        style={{ padding: '6px 11px', fontSize: '12px' }}
                      >
                        Inspect Scorecard →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: 'center',
                      padding: '28px 16px',
                      color: 'var(--vs-ink-secondary)',
                    }}
                  >
                    No published scorecards matched &ldquo;{query}&rdquo;.{' '}
                    <Link
                      href="/#scan"
                      style={{ color: 'var(--vs-accent)', fontWeight: 600 }}
                    >
                      Run a live scan on any domain →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
