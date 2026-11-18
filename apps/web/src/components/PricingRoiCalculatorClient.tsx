'use client';

import React, { useState } from 'react';
import {
  AI_ROI_VERTICAL_PRESETS,
  computeAiSearchRoiProjection,
  type AiRoiVerticalPresetId,
} from '@verisource/core-geo';
import { MetricLedgerCell, StatusBadge } from '@verisource/ui';

export function PricingRoiCalculatorClient(props: {
  annual: boolean;
  domainParam: string;
  envParam: string;
}): React.ReactElement {
  const [presetId, setPresetId] = useState<AiRoiVerticalPresetId>('b2b_saas');
  const activePreset =
    AI_ROI_VERTICAL_PRESETS.find((p) => p.id === presetId) ??
    AI_ROI_VERTICAL_PRESETS[0]!;

  const [monthlyVisits, setMonthlyVisits] = useState<number>(
    activePreset.defaultMonthlyAiVisits
  );
  const [customerValue, setCustomerValue] = useState<number>(
    activePreset.defaultCustomerValueUsd
  );

  function handleSelectPreset(nextId: AiRoiVerticalPresetId): void {
    const found =
      AI_ROI_VERTICAL_PRESETS.find((p) => p.id === nextId) ??
      AI_ROI_VERTICAL_PRESETS[0]!;
    setPresetId(found.id);
    setMonthlyVisits(found.defaultMonthlyAiVisits);
    setCustomerValue(found.defaultCustomerValueUsd);
  }

  const projection = computeAiSearchRoiProjection({
    presetId,
    monthlyAiVisits: monthlyVisits,
    customerValueUsd: customerValue,
    annualBilling: props.annual,
  });

  const cycle = props.annual ? 'annual' : 'monthly';
  const checkoutHref = `/api/checkout?plan=${projection.recommendedPlan}&cycle=${cycle}${props.domainParam}${props.envParam}`;
  const isTrialEligible =
    !props.annual &&
    (projection.recommendedPlan === 'starter_49' ||
      projection.recommendedPlan === 'pro_99');

  const aiBarWidth = Math.min(280, Math.round(projection.aiConversionPct * 16));
  const orgBarWidth = Math.max(
    18,
    Math.round(projection.organicBaselineConversionPct * 16)
  );

  return (
    <div className="vs-bezel" style={{ marginTop: '24px' }}>
      <div
        id="vs-pricing-roi-calculator"
        className="vs-card vs-stack"
        style={{
          padding: '22px 24px',
          gap: '16px',
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
        <div>
          <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
            AI CITATION CONVERSION PAYBACK CALCULATOR · 14.2%–15.9% AI BUYER CONVERSION
          </div>
          <strong style={{ fontSize: '17px', letterSpacing: '-0.015em' }}>
            See how few AI-referred buyers cover an entire year of Verisource
          </strong>
        </div>

        <div
          role="group"
          aria-label="Select business vertical for ROI projection"
          className="vs-pill-group"
        >
          {AI_ROI_VERTICAL_PRESETS.map((preset) => {
            const active = preset.id === presetId;
            return (
              <button
                key={preset.id}
                type="button"
                className="vs-pill-btn vs-pill-btn-sm"
                data-active={active ? 'true' : 'false'}
                onClick={() => handleSelectPreset(preset.id)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="vs-grid-2" style={{ gap: '16px' }}>
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '6px',
            border: '1px solid var(--vs-border)',
            background: 'var(--vs-surface-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              marginBottom: '6px',
            }}
          >
            <label htmlFor="vs-roi-visits-slider" style={{ fontWeight: 600 }}>
              Monthly AI-Referred Buyer Visits
            </label>
            <strong className="vs-mono">{`${monthlyVisits} visits/mo`}</strong>
          </div>
          <input
            id="vs-roi-visits-slider"
            type="range"
            min={activePreset.minVisits}
            max={activePreset.maxVisits}
            step={activePreset.visitStep}
            value={monthlyVisits}
            onChange={(e) => setMonthlyVisits(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--vs-accent)' }}
          />
          <div
            style={{
              fontSize: '11.5px',
              color: 'var(--vs-ink-muted)',
              marginTop: '4px',
            }}
          >
            Clicks from ChatGPT Search, Google Gemini, Perplexity &amp; Claude citations
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            borderRadius: '6px',
            border: '1px solid var(--vs-border)',
            background: 'var(--vs-surface-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              marginBottom: '6px',
            }}
          >
            <label htmlFor="vs-roi-value-slider" style={{ fontWeight: 600 }}>
              Average Customer / Order Value
            </label>
            <strong className="vs-mono">{`$${customerValue.toLocaleString('en-US')}`}</strong>
          </div>
          <input
            id="vs-roi-value-slider"
            type="range"
            min={activePreset.minValueUsd}
            max={activePreset.maxValueUsd}
            step={activePreset.valueStepUsd}
            value={customerValue}
            onChange={(e) => setCustomerValue(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--vs-accent)' }}
          />
          <div
            style={{
              fontSize: '11.5px',
              color: 'var(--vs-ink-muted)',
              marginTop: '4px',
            }}
          >
            First-order cart value, patient/case value, or annual SaaS/retainer value
          </div>
        </div>
      </div>

      <div className="vs-card vs-ledger-strip-4" style={{ overflow: 'hidden' }}>
        <MetricLedgerCell
          label="AI-Referred Buyers / Mo"
          value={projection.projectedAiCustomersPerMonth}
          sublabel={`At ${projection.aiConversionPct}% AI conv vs. ${projection.organicEquivalentCustomersPerMonth} (${projection.organicBaselineConversionPct}% search)`}
          tone="pass"
        />
        <MetricLedgerCell
          label="Projected AI Revenue / Mo"
          value={`$${projection.projectedMonthlyAiRevenueUsd.toLocaleString('en-US')}`}
          sublabel={`$${projection.projectedAnnualAiRevenueUsd.toLocaleString('en-US')}/yr annualized`}
          tone="pass"
        />
        <MetricLedgerCell
          label="Matched Verisource Plan"
          value={`$${projection.planMonthlyCostUsd}/mo`}
          sublabel={
            props.annual
              ? 'Annual billing (20% saved)'
              : isTrialEligible
                ? '$0.00 due today · 7-day trial'
                : '15 client domains included'
          }
        />
        <MetricLedgerCell
          label="Projected Plan Return"
          value={`${projection.roiMultiple}x`}
          sublabel={`1 buyer covers ${projection.monthsCoveredBySingleCustomer} mo of software`}
          tone="pass"
        />
      </div>

      {/* Live Reactive SVG Conversion Advantage Bar */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid var(--vs-border)',
          background: 'var(--vs-terminal)',
        }}
      >
        <svg
          viewBox="0 0 640 62"
          width="100%"
          role="img"
          aria-label={`Conversion rate comparison for ${activePreset.label}: ${projection.organicBaselineConversionPct} percent traditional search vs ${projection.aiConversionPct} percent AI cited referral.`}
        >
          <text
            x="8"
            y="22"
            fill="#EEF1F6"
            fontSize="10"
            fontFamily="var(--vs-mono)"
            fontWeight="600"
          >
            {`Organic Search Baseline (${projection.organicBaselineConversionPct}%)`}
          </text>
          <rect
            x="248"
            y="11"
            width={orgBarWidth}
            height="13"
            rx="4"
            fill="#94A3B8"
          />
          <text
            x={256 + orgBarWidth}
            y="21.5"
            fill="#B4BCC9"
            fontSize="9.5"
            fontFamily="var(--vs-mono)"
          >
            {`${projection.organicEquivalentCustomersPerMonth} buyer(s)/mo`}
          </text>

          <text
            x="8"
            y="48"
            fill="#6EE7B7"
            fontSize="10"
            fontFamily="var(--vs-mono)"
            fontWeight="700"
          >
            {`Cited AI Search Clicks (${projection.aiConversionPct}%)`}
          </text>
          <rect
            x="248"
            y="37"
            width={aiBarWidth}
            height="13"
            rx="4"
            fill="#10B981"
          />
          <circle
            className="vs-live-dot"
            cx={248 + aiBarWidth - 6}
            cy="43.5"
            r="3"
            fill="#FFFFFF"
          />
          <text
            x={256 + aiBarWidth}
            y="47.5"
            fill="#6EE7B7"
            fontSize="9.8"
            fontFamily="var(--vs-mono)"
            fontWeight="700"
          >
            {`${projection.projectedAiCustomersPerMonth} buyer(s)/mo`}
          </text>
        </svg>
      </div>

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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <StatusBadge tone="pass">EMPIRICAL 6X+ CONVERSION ADVANTAGE</StatusBadge>
          <span style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)' }}>
            Track actual AI referral visits and checkout revenue with the optional 10-line Step 01 Pixel.
          </span>
        </div>
        <a href={checkoutHref} className="vs-btn">
          {isTrialEligible
            ? `Start 7-Day Free Trial ($0 Today) →`
            : `Activate Plan ($${projection.planMonthlyCostUsd}/mo) →`}
        </a>
      </div>
      </div>
    </div>
  );
}
