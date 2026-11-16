'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AGENCY_SANDBOX_COLOR_SWATCHES,
  buildAgencySandboxPreview,
  type ReadinessScanSummary,
} from '@verisource/core-geo';
import {
  CodeArtifactCard,
  MetricLedgerCell,
  StatusBadge,
} from '@verisource/ui';

function extractSafeHostnameParam(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0]
    ?.trim();
  if (!cleaned || cleaned.length < 4 || cleaned.length > 120) return null;
  if (
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
      cleaned
    )
  ) {
    return null;
  }
  return cleaned;
}

export function AgencyLiveSandboxClient(): React.ReactElement {
  const [prospectDomainInput, setProspectDomainInput] = useState('');
  const [agencyNameInput, setAgencyNameInput] = useState(
    'Northstar Search Studio'
  );
  const [agencyCtaInput, setAgencyCtaInput] = useState(
    'https://cal.com/northstar/ai-audit'
  );
  const [selectedColor, setSelectedColor] = useState('#0A0E17');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ReadinessScanSummary | null>(
    null
  );
  const autoScannedRef = useRef(false);

  async function runClientPreviewScan(targetDomain: string): Promise<void> {
    const trimmed = targetDomain.trim();
    if (!trimmed) {
      setError('Enter a client or prospect domain (for example, stripe.com).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/grader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: trimmed }),
      });
      const json = (await res.json()) as ReadinessScanSummary & {
        error?: string;
        message?: string;
      };
      if (!res.ok || json.error) {
        setError(json.message ?? 'Unable to scan that client domain.');
      } else {
        setScanResult(json);
      }
    } catch {
      setError('Network error while scanning client domain.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoScannedRef.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const candidate = extractSafeHostnameParam(params.get('domain'));
    if (!candidate) return;
    autoScannedRef.current = true;
    setProspectDomainInput(candidate);
    const anchor = document.getElementById('sandbox');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    void runClientPreviewScan(candidate);
  }, []);

  const sandboxPreview = scanResult
    ? buildAgencySandboxPreview({
        summary: scanResult,
        agencyBrandName: agencyNameInput,
        agencyPrimaryColor: selectedColor,
        agencyCtaUrl: agencyCtaInput,
      })
    : null;

  return (
    <div className="vs-stack" style={{ gap: '18px' }}>
      <div className="vs-card" style={{ padding: '22px 24px' }}>
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
            <div className="vs-eyebrow" style={{ marginBottom: '3px' }}>
              LIVE WHITE-LABEL CLIENT SANDBOX · ZERO SIGNUP REQUIRED
            </div>
            <strong style={{ fontSize: '16.5px', letterSpacing: '-0.015em' }}>
              Test your agency brand, accent color, and booking CTA on any real client domain
            </strong>
          </div>
          <StatusBadge tone="pass">PURE WHITE-LABEL PREVIEW</StatusBadge>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runClientPreviewScan(prospectDomainInput);
          }}
          className="vs-stack"
          style={{ gap: '14px' }}
        >
          <div className="vs-grid-2" style={{ gap: '12px' }}>
            <div>
              <label
                htmlFor="vs-agency-sandbox-domain"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '5px',
                }}
              >
                1. Client / Prospect Website
              </label>
              <input
                id="vs-agency-sandbox-domain"
                type="text"
                value={prospectDomainInput}
                onChange={(e) => setProspectDomainInput(e.target.value)}
                placeholder="e.g., linear.app or clientdomain.com"
                className="vs-input vs-mono"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label
                htmlFor="vs-agency-sandbox-brand"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '5px',
                }}
              >
                2. Your Agency Brand Name
              </label>
              <input
                id="vs-agency-sandbox-brand"
                type="text"
                value={agencyNameInput}
                onChange={(e) => setAgencyNameInput(e.target.value)}
                placeholder="Your Agency Name"
                className="vs-input"
                style={{ width: '100%', fontFamily: 'var(--vs-sans)' }}
              />
            </div>
          </div>

          <div className="vs-grid-2" style={{ gap: '12px' }}>
            <div>
              <label
                htmlFor="vs-agency-sandbox-cta"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '5px',
                }}
              >
                3. Your Calendar / Booking URL
              </label>
              <input
                id="vs-agency-sandbox-cta"
                type="url"
                value={agencyCtaInput}
                onChange={(e) => setAgencyCtaInput(e.target.value)}
                placeholder="https://cal.com/your-agency/15min"
                className="vs-input vs-mono"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '5px',
                }}
              >
                4. Agency Brand Accent Bar
              </span>
              <div
                role="group"
                aria-label="Select agency brand accent color"
                className="vs-pill-group"
              >
                {AGENCY_SANDBOX_COLOR_SWATCHES.map((swatch) => {
                  const active =
                    selectedColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      className="vs-pill-btn vs-pill-btn-sm"
                      data-active={active ? 'true' : 'false'}
                      onClick={() => setSelectedColor(swatch.hex)}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'inline-block',
                          width: '9px',
                          height: '9px',
                          borderRadius: '999px',
                          background: swatch.hex,
                          border: '1px solid rgba(255,255,255,0.35)',
                          marginRight: '5px',
                          verticalAlign: 'middle',
                        }}
                      />
                      {swatch.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error ? (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'var(--vs-crit-bg)',
                border: '1px solid var(--vs-crit-border)',
                color: 'var(--vs-crit-fg)',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontSize: '12.5px',
                color: 'var(--vs-ink-muted)',
              }}
            >
              Editing your agency name, calendar link, or accent color updates the scorecard live without re-scanning.
            </span>
            <button type="submit" disabled={loading} className="vs-btn">
              {loading
                ? 'Probing Client Site & 3 AI Engines...'
                : 'Preview White-Label Brief →'}
            </button>
          </div>
        </form>
      </div>

      {scanResult && sandboxPreview ? (
        <div className="vs-stack" style={{ gap: '18px' }}>
          {/* Pure White-Label Client Scorecard Specimen (Zero Verisource Strings Inside) */}
          <div
            id="vs-agency-sandbox-preview"
            className="vs-card"
            style={{
              padding: '22px 24px',
              borderTop: `4px solid ${sandboxPreview.brandColor}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                paddingBottom: '16px',
                marginBottom: '16px',
                borderBottom: '1px solid var(--vs-border)',
              }}
            >
              <div>
                <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
                  {`PREPARED BY ${sandboxPreview.agencyName.toUpperCase()} · EXECUTIVE AI SEARCH BRIEF`}
                </div>
                <h3
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '21px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {`AI Search & Hallucination Audit: ${scanResult.brandName}`}
                </h3>
                <div
                  className="vs-mono"
                  style={{
                    fontSize: '12px',
                    color: 'var(--vs-ink-muted)',
                  }}
                >
                  {`https://${scanResult.hostname} · PLATFORM: ${sandboxPreview.detectedPlatformLabel.toUpperCase()}`}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  className="vs-btn vs-btn-secondary"
                  style={{
                    fontSize: '12px',
                    padding: '7px 11px',
                    cursor: 'default',
                  }}
                >
                  ↓ Brief (.md)
                </span>
                <span
                  className="vs-btn vs-btn-secondary"
                  style={{
                    fontSize: '12px',
                    padding: '7px 11px',
                    cursor: 'default',
                  }}
                >
                  Print / Save PDF
                </span>
                <a
                  href={sandboxPreview.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vs-btn"
                  style={{
                    background: sandboxPreview.brandColor,
                    borderColor: sandboxPreview.brandColor,
                    color: '#FFFFFF',
                  }}
                >
                  {`Book 15-Min Fix Review with ${sandboxPreview.agencyName} →`}
                </a>
              </div>
            </div>

            <div
              className="vs-card vs-ledger-strip-3"
              style={{ marginBottom: '16px' }}
            >
              <div>
                <MetricLedgerCell
                  label="AI Visibility Score"
                  value={scanResult.visibilityScore}
                  suffix="/ 100"
                  tone={scanResult.visibilityScore < 50 ? 'critical' : 'pass'}
                  sublabel="Across ChatGPT, Gemini & Perplexity"
                />
              </div>
              <div>
                <MetricLedgerCell
                  label="Brand Fact Accuracy"
                  value={`${scanResult.accuracyScore}%`}
                  tone={
                    scanResult.samplePromptResult.hallucinationDetected
                      ? 'critical'
                      : 'pass'
                  }
                  sublabel={
                    scanResult.samplePromptResult.hallucinationDetected
                      ? 'Pricing or policy discrepancy flagged'
                      : 'No pricing conflicts on sample prompt'
                  }
                />
              </div>
              <div>
                <MetricLedgerCell
                  label="Competitors Recommended"
                  value={
                    scanResult.samplePromptResult.competitorsMentioned.length
                  }
                  sublabel={
                    scanResult.samplePromptResult.competitorsMentioned
                      .slice(0, 3)
                      .join(', ') || 'Category directories'
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              {sandboxPreview.whiteLabelImpactItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--vs-border)',
                    background:
                      item.severity === 'fix_first'
                        ? 'var(--vs-crit-bg)'
                        : 'var(--vs-surface-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <StatusBadge
                      tone={
                        item.severity === 'fix_first'
                          ? 'critical'
                          : item.severity === 'healthy'
                            ? 'pass'
                            : 'warn'
                      }
                    >
                      {item.badgeLabel}
                    </StatusBadge>
                    <strong style={{ fontSize: '13.5px' }}>
                      {`${idx + 1}. ${item.whatIsWrong}`}
                    </strong>
                  </div>
                  <div
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--vs-ink-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: 'var(--vs-ink)' }}>
                      Business impact:
                    </strong>{' '}
                    {item.whyItMatters}{' '}
                    <strong style={{ color: 'var(--vs-ink)' }}>Fix:</strong>{' '}
                    {item.howToFix}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px dashed var(--vs-border-strong)',
                fontSize: '12px',
                color: 'var(--vs-ink-secondary)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span>
                <strong>PDF Handoff Footer Included:</strong>{' '}
                {`EXECUTIVE BRIEF HANDOFF · PREPARED BY ${sandboxPreview.agencyName.toUpperCase()}`}
              </span>
              <span className="vs-mono">{sandboxPreview.bookingUrl}</span>
            </div>
          </div>

          {/* Tailored Agency Outreach Note + Direct Agency Plan Activation */}
          <CodeArtifactCard
            title={`Auto-Written Outreach Note (${sandboxPreview.agencyName} → ${scanResult.brandName})`}
            fileHint={`Shareable /audit/${sandboxPreview.slugPreview} URL + 3-touch Day 0/3/7 CSV export activate on Agency Plan`}
            code={sandboxPreview.outreachPreview.content}
            qualityScore={sandboxPreview.outreachPreview.score}
            qualityBreakdown={sandboxPreview.outreachPreview.breakdown}
          />

          <div
            className="vs-card"
            style={{
              padding: '18px 22px',
              background: 'var(--vs-surface-warm)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div style={{ maxWidth: '620px' }}>
              <strong style={{ fontSize: '15px' }}>
                {`Mint live /audit/${sandboxPreview.slugPreview} + onboard ${scanResult.hostname} into your 15-site roster`}
              </strong>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--vs-ink-secondary)',
                  marginTop: '3px',
                }}
              >
                Includes custom agency logo upload, 10-domain parallel batch pitching, bot-filtered{' '}
                <code className="vs-mono">OPENED</code> /{' '}
                <code className="vs-mono">CTA CLICKED</code> /{' '}
                <code className="vs-mono">PDF SAVED</code> deal alerts, and 5,000 monthly{' '}
                <code className="vs-mono">/mcp</code> credits.
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a
                href={`/api/checkout?plan=agency_249&cycle=monthly&domain=${encodeURIComponent(
                  scanResult.hostname
                )}`}
                className="vs-btn"
              >
                Activate Agency Plan ($249/mo) →
              </a>
              <a
                href={`/api/checkout?plan=agency_249&cycle=annual&domain=${encodeURIComponent(
                  scanResult.hostname
                )}`}
                className="vs-btn vs-btn-secondary"
              >
                Annual ($199/mo · Save 20%)
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
