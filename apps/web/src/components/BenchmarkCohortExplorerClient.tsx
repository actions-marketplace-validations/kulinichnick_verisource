'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { StatusBadge } from '@verisource/ui';
import {
  BENCHMARK_COHORT_ROWS,
  BENCHMARK_VERTICAL_SUMMARIES,
  type BenchmarkVerticalId,
} from '../lib/benchmark-study-2026';

type CohortFilter = 'all' | BenchmarkVerticalId;

export function BenchmarkCohortExplorerClient(): React.ReactElement {
  const [selectedVertical, setSelectedVertical] = useState<CohortFilter>('all');

  const filteredRows =
    selectedVertical === 'all'
      ? BENCHMARK_COHORT_ROWS
      : BENCHMARK_COHORT_ROWS.filter(
          (row) => row.verticalId === selectedVertical
        );

  const activeSummary =
    selectedVertical === 'all'
      ? null
      : BENCHMARK_VERTICAL_SUMMARIES.find(
          (v) => v.verticalId === selectedVertical
        ) ?? null;

  return (
    <div style={{ marginBottom: '38px' }}>
      <div
        className="vs-card"
        style={{
          padding: '18px 20px',
          marginBottom: '16px',
          background: 'var(--vs-surface-warm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <div>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              DOMAIN-LEVEL HTTP DATASET · REPRODUCIBLE TELEMETRY
            </div>
            <strong style={{ fontSize: '16px' }}>
              Filter all 40 probed domains by industry vertical
            </strong>
          </div>
          <StatusBadge tone="pass">
            {`SHOWING ${filteredRows.length} OF ${BENCHMARK_COHORT_ROWS.length} DOMAINS`}
          </StatusBadge>
        </div>

        <div
          role="group"
          aria-label="Filter benchmark domains by industry vertical"
          className="vs-pill-group"
          style={{ marginBottom: activeSummary ? '12px' : 0 }}
        >
          <button
            type="button"
            className="vs-pill-btn"
            data-active={selectedVertical === 'all' ? 'true' : 'false'}
            onClick={() => setSelectedVertical('all')}
          >
            {`All Verticals (${BENCHMARK_COHORT_ROWS.length})`}
          </button>
          {BENCHMARK_VERTICAL_SUMMARIES.map((v) => (
            <button
              key={v.verticalId}
              type="button"
              className="vs-pill-btn"
              data-active={selectedVertical === v.verticalId ? 'true' : 'false'}
              onClick={() => setSelectedVertical(v.verticalId)}
            >
              {v.shortPillLabel}
            </button>
          ))}
        </div>

        {activeSummary && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              background: 'var(--vs-surface)',
              border: '1px solid var(--vs-border)',
              fontSize: '13px',
              color: 'var(--vs-ink-secondary)',
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: 'var(--vs-ink)' }}>
              {activeSummary.verticalLabel}:
            </strong>{' '}
            {activeSummary.keyObservation}
          </div>
        )}
      </div>

      <div className="vs-card vs-table-wrap">
        <table className="vs-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Vertical</th>
              <th>/llms.txt</th>
              <th>/agents.md</th>
              <th>Homepage JSON-LD</th>
              <th>GPTBot / PerplexityBot</th>
              <th>Shopify UCP</th>
              <th>Live Check</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const botRestricted =
                row.gptBotAccess !== 'allowed_200' ||
                row.perplexityBotAccess !== 'allowed_200';
              return (
                <tr key={row.domain}>
                  <td className="vs-mono" style={{ fontWeight: 600 }}>
                    {row.domain}
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)' }}>
                    {row.verticalShortLabel}
                  </td>
                  <td>
                    {row.llmsStatus === 'custom_curated' ? (
                      <StatusBadge tone="pass">CUSTOM CURATED</StatusBadge>
                    ) : row.llmsStatus === 'auto_boilerplate' ? (
                      <StatusBadge tone="warn">AUTO BOILERPLATE</StatusBadge>
                    ) : row.llmsSoft404Html ? (
                      <StatusBadge tone="critical">HTML SOFT-404</StatusBadge>
                    ) : (
                      <StatusBadge>MISSING</StatusBadge>
                    )}
                  </td>
                  <td>
                    {row.agentsStatus === 'custom_enriched' ? (
                      <StatusBadge tone="pass">CUSTOM ENRICHED</StatusBadge>
                    ) : row.agentsStatus === 'default_boilerplate' ? (
                      <StatusBadge tone="warn">STOCK SHOPIFY</StatusBadge>
                    ) : (
                      <StatusBadge>MISSING</StatusBadge>
                    )}
                  </td>
                  <td className="vs-mono" style={{ fontSize: '12px' }}>
                    {row.jsonLdCount > 0 ? (
                      <span>
                        {row.jsonLdCount} node{row.jsonLdCount === 1 ? '' : 's'}
                        {row.hasFaqSchema ? ' · FAQPage' : ''}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--vs-ink-muted)' }}>0 nodes</span>
                    )}
                  </td>
                  <td>
                    {botRestricted ? (
                      <StatusBadge tone="critical">
                        {row.gptBotAccess === 'waf_403' &&
                        row.perplexityBotAccess === 'waf_403'
                          ? 'BOTH WAF 403'
                          : row.gptBotAccess === 'waf_403'
                          ? 'GPTBOT WAF 403'
                          : 'PERPLEXITY WAF 403'}
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="pass">HTTP 200 OPEN</StatusBadge>
                    )}
                  </td>
                  <td>
                    {row.verticalId === 'shopify_d2c' ? (
                      row.shopifyUcpActive ? (
                        <StatusBadge tone="pass">UCP ACTIVE</StatusBadge>
                      ) : (
                        <StatusBadge>UNAVAILABLE</StatusBadge>
                      )
                    ) : (
                      <span
                        className="vs-mono"
                        style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/?domain=${encodeURIComponent(row.domain)}#grader`}
                      className="vs-mono"
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--vs-ink)',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Re-Probe →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
