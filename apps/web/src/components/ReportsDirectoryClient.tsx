'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { StatusBadge } from '@verisource/ui';
import type { PublishedDomainScorecard } from '../lib/published-reports';

type DirectoryFilterId =
  | 'all'
  | 'top_ready'
  | 'at_risk'
  | 'headless_dtc'
  | 'shopify_os2'
  | 'b2b_saas'
  | 'waf_blocked'
  | 'missing_agents_md';

type DirectorySortId = 'score_desc' | 'score_asc' | 'domain_asc';

function isBotsAllowed(item: PublishedDomainScorecard): boolean {
  return (
    item.robotsAiBotStatus.GPTBot &&
    item.robotsAiBotStatus.PerplexityBot &&
    !item.robotsAiBotStatus.waf_blocked
  );
}

export function ReportsDirectoryClient({
  reports,
}: {
  reports: PublishedDomainScorecard[];
}): React.ReactElement {
  const [query, setQuery] = useState<string>('');
  const [filter, setFilter] = useState<DirectoryFilterId>('all');
  const [sortBy, setSortBy] = useState<DirectorySortId>('score_desc');
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  const counts = useMemo(() => {
    return {
      all: reports.length,
      top_ready: reports.filter((r) => r.readinessScore >= 75).length,
      at_risk: reports.filter((r) => r.readinessScore < 55).length,
      headless_dtc: reports.filter(
        (r) =>
          r.vertical === 'shopify_dtc' && r.detectedPlatform === 'nextjs_custom'
      ).length,
      shopify_os2: reports.filter((r) => r.detectedPlatform === 'shopify')
        .length,
      b2b_saas: reports.filter((r) => r.vertical === 'b2b_saas').length,
      waf_blocked: reports.filter((r) => !isBotsAllowed(r)).length,
      missing_agents_md: reports.filter(
        (r) => r.agentsMdStatus !== 'custom_enriched'
      ).length,
    };
  }, [reports]);

  const filteredAndSortedReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = reports.filter((r) => {
      if (filter === 'top_ready' && r.readinessScore < 75) return false;
      if (filter === 'at_risk' && r.readinessScore >= 55) return false;
      if (
        filter === 'headless_dtc' &&
        !(
          r.vertical === 'shopify_dtc' && r.detectedPlatform === 'nextjs_custom'
        )
      ) {
        return false;
      }
      if (filter === 'shopify_os2' && r.detectedPlatform !== 'shopify') {
        return false;
      }
      if (filter === 'b2b_saas' && r.vertical !== 'b2b_saas') return false;
      if (filter === 'waf_blocked' && isBotsAllowed(r)) return false;
      if (
        filter === 'missing_agents_md' &&
        r.agentsMdStatus === 'custom_enriched'
      ) {
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

    const sorted = [...matched];
    if (sortBy === 'score_desc') {
      sorted.sort(
        (a, b) =>
          b.readinessScore - a.readinessScore ||
          a.domain.localeCompare(b.domain)
      );
    } else if (sortBy === 'score_asc') {
      sorted.sort(
        (a, b) =>
          a.readinessScore - b.readinessScore ||
          a.domain.localeCompare(b.domain)
      );
    } else {
      sorted.sort((a, b) => a.domain.localeCompare(b.domain));
    }
    return sorted;
  }, [reports, query, filter, sortBy]);

  const cohortMean = useMemo(() => {
    if (filteredAndSortedReports.length === 0) return null;
    const sum = filteredAndSortedReports.reduce(
      (acc, r) => acc + r.readinessScore,
      0
    );
    return (sum / filteredAndSortedReports.length).toFixed(1);
  }, [filteredAndSortedReports]);

  const toggleCompareDomain = (domain: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(domain)) {
        return prev.filter((d) => d !== domain);
      }
      if (prev.length >= 2) {
        return [prev[1]!, domain];
      }
      return [...prev, domain];
    });
  };

  const filterOptions: ReadonlyArray<{
    id: DirectoryFilterId;
    label: string;
  }> = [
    { id: 'all', label: `All Domains (${counts.all})` },
    { id: 'top_ready', label: `Top Ready ≥75 (${counts.top_ready})` },
    { id: 'at_risk', label: `At Risk <55 (${counts.at_risk})` },
    {
      id: 'headless_dtc',
      label: `Headless Next.js DTC (${counts.headless_dtc})`,
    },
    { id: 'shopify_os2', label: `Shopify OS 2.0 (${counts.shopify_os2})` },
    { id: 'b2b_saas', label: `B2B SaaS & AI (${counts.b2b_saas})` },
    { id: 'waf_blocked', label: `WAF / Bot Blocked (${counts.waf_blocked})` },
    {
      id: 'missing_agents_md',
      label: `Missing /agents.md (${counts.missing_agents_md})`,
    },
  ];

  const sortOptions: ReadonlyArray<{
    id: DirectorySortId;
    label: string;
  }> = [
    { id: 'score_desc', label: 'Highest Score ↓' },
    { id: 'score_asc', label: 'Lowest Score ↑' },
    { id: 'domain_asc', label: 'Domain A–Z' },
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
        {/* 2-Domain Interactive Head-to-Head Picker Tray */}
        {compareSelection.length > 0 ? (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'var(--vs-surface-warm)',
              border: '1px solid var(--vs-accent)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--vs-ink)' }}>
              {compareSelection.length === 1 ? (
                <>
                  <strong className="vs-mono">{compareSelection[0]}</strong>{' '}
                  selected — click <code className="vs-mono">+ vs</code> on any
                  second domain below to compare head-to-head.
                </>
              ) : (
                <>
                  Head-to-head matchup ready:{' '}
                  <strong className="vs-mono">{compareSelection[0]}</strong> vs.{' '}
                  <strong className="vs-mono">{compareSelection[1]}</strong>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {compareSelection.length === 2 ? (
                <Link
                  href={`/vs?a=${encodeURIComponent(
                    compareSelection[0]!
                  )}&b=${encodeURIComponent(compareSelection[1]!)}`}
                  className="vs-btn"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Run 6-Dimension X-Ray →
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setCompareSelection([])}
                className="vs-btn vs-btn-secondary"
                style={{ padding: '5px 10px', fontSize: '11.5px' }}
              >
                Clear
              </button>
            </div>
          </div>
        ) : null}

        {/* Filter Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '7px',
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

        {/* Sort Controls, Live Cohort Mean & Search Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              className="vs-mono"
              style={{
                fontSize: '11px',
                color: 'var(--vs-ink-muted)',
                fontWeight: 700,
              }}
            >
              LEADERBOARD SORT:
            </span>
            {sortOptions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="vs-pill-btn vs-pill-btn-sm"
                data-active={sortBy === s.id ? 'true' : 'false'}
                onClick={() => setSortBy(s.id)}
              >
                {s.label}
              </button>
            ))}
            {cohortMean !== null ? (
              <span
                className="vs-mono"
                style={{
                  fontSize: '12px',
                  color: 'var(--vs-ink-secondary)',
                  marginLeft: '4px',
                }}
              >
                · {filteredAndSortedReports.length} shown (Mean: {cohortMean}
                /100)
              </span>
            ) : null}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by domain, stack, or gap (e.g. perplexity.ai, Shopify)..."
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
          <table
            className="vs-table"
            style={{ width: '100%', minWidth: '820px' }}
          >
            <thead>
              <tr>
                <th style={{ width: '52px' }}>Rank</th>
                <th>Domain &amp; Brand</th>
                <th>Detected Stack</th>
                <th>Readiness</th>
                <th>AI Bots</th>
                <th>/llms.txt</th>
                <th>/agents.md</th>
                <th>JSON-LD</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedReports.map((item, idx) => {
                const botsOk = isBotsAllowed(item);
                const isSelected = compareSelection.includes(item.domain);
                return (
                  <tr key={item.domain}>
                    <td
                      className="vs-mono"
                      style={{
                        fontSize: '12px',
                        color: 'var(--vs-ink-muted)',
                        fontWeight: 600,
                      }}
                    >
                      #{idx + 1}
                    </td>
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
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCompareDomain(item.domain)}
                          className="vs-pill-btn vs-pill-btn-sm vs-mono"
                          data-active={isSelected ? 'true' : 'false'}
                          title="Select two domains to run a Head-to-Head X-Ray"
                          style={{ padding: '5px 8px', fontSize: '11px' }}
                        >
                          {isSelected ? '✓ vs' : '+ vs'}
                        </button>
                        <Link
                          href={`/report/${item.domain}`}
                          className="vs-btn vs-btn-secondary"
                          style={{ padding: '6px 11px', fontSize: '12px' }}
                        >
                          Scorecard →
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAndSortedReports.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
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
