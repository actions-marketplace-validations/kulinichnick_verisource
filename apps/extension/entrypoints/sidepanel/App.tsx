import React, { useCallback, useEffect, useState } from 'react';
import {
  buildAiAttributionSnippet,
  buildImplementationBundleMarkdown,
  generateGeoFixBundle,
  PATIENT_ZERO_DOMAINS,
  PATIENT_ZERO_FIXES,
  PATIENT_ZERO_PROMPTS,
  PATIENT_ZERO_SNAPSHOTS,
  runFullGeoAudit,
  type FullGeoAuditResult,
  type ReadinessScanSummary,
} from '@verisource/core-geo';
import {
  CodeArtifactCard,
  MetricLedgerCell,
  StatusBadge,
  ThreeTabShell,
  VerisourceStyleTag,
  type ThreeTabId,
} from '@verisource/ui';

function buildInitialAureaAudit(): FullGeoAuditResult {
  const domain = PATIENT_ZERO_DOMAINS[0]!;
  const fix = PATIENT_ZERO_FIXES[0]!;
  const snaps = PATIENT_ZERO_SNAPSHOTS.filter((s) => s.domain_id === domain.id);
  const prompt = PATIENT_ZERO_PROMPTS.find((p) => p.domain_id === domain.id);

  return {
    domainUrl: domain.domain_url,
    hostname: 'aurearoasters.com',
    brandName: domain.brand_name,
    visibilityScore: domain.visibility_score,
    accuracyScore: domain.accuracy_score,
    probe: {
      domain: {
        origin: domain.domain_url,
        hostname: 'aurearoasters.com',
        inferredBrandName: domain.brand_name,
      },
      reachable: true,
      httpStatus: 200,
      title: domain.brand_name,
      metaDescription: domain.brand_truth_sheet.core_offering,
      jsonLdBlocks: [],
      robotsAiBotStatus: domain.robots_ai_bot_status,
      llmsTxtStatus: domain.llms_txt_status,
      llmsTxtExcerpt: null,
      agentsMdRaw: null,
      agentsMdInitialStatus: domain.agents_md_status,
      htmlSignalsShopify: domain.is_shopify,
      extractedPriceMentions: ['$22.00', '$28.00', '$50.00'],
      extractedShippingMentions: [
        domain.brand_truth_sheet.shipping_or_service_area,
      ],
    },
    shopify: {
      isShopify: domain.is_shopify,
      shopifyMcpStatus: domain.shopify_mcp_status,
      activeMcpEndpoint: 'https://aurearoasters.com/api/ucp/mcp',
      exposedMcpTools: ['search_shop_catalog', 'get_shop_policies'],
      agentsMdStatus: domain.agents_md_status,
      catalogSkus: [],
      priceRangeSummary: domain.brand_truth_sheet.verified_pricing_summary,
    },
    brandTruthSheet: domain.brand_truth_sheet,
    trackedPrompts: prompt ? [prompt.prompt_text] : [],
    scanResults: snaps.map((s) => ({
      promptText:
        prompt?.prompt_text ??
        'Best luxury Catholic or saint-inspired specialty coffee gifts online',
      aiEngine: s.ai_engine,
      brandMentioned: s.brand_mentioned,
      citationRank: s.citation_rank,
      competitorsMentioned: s.competitors_mentioned,
      citedSourceUrls: s.cited_source_urls,
      decompiledFanoutQueries: prompt?.decompiled_fanout_queries ?? [],
      fanoutTelemetryType: s.fanout_telemetry_type,
      hallucinationDetected: s.hallucination_detected,
      hallucinationDetails: s.hallucination_details ?? [],
      rawAnswerExcerpt: s.raw_answer_excerpt ?? '',
    })),
    allHallucinations: snaps.flatMap((s) => s.hallucination_details ?? []),
    fixes: [
      {
        fixType: fix.fix_type,
        title: fix.title,
        contentPayload: fix.content_payload,
        naturalQualityScore: fix.natural_quality_score,
        qualityRubricBreakdown: fix.quality_rubric_breakdown,
      },
    ],
    pitchSummaryPayload: {
      top_gaps: [
        'Missing /llms.txt machine-readable catalog and shipping summary.',
        'Storefront serves generic Shopify boilerplate /agents.md without excluded K-Cup guardrails.',
      ],
      competitors_winning: ['Mystic Monk Coffee', 'Catholic Coffee'],
      hallucination_examples: snaps.flatMap(
        (s) => s.hallucination_details ?? []
      ),
      recommended_fixes: [
        'Publish custom templates/agents.md.liquid referencing /api/ucp/mcp.',
        'Inject 9.5+/10 Organization and FAQPage JSON-LD schema.',
      ],
    },
  };
}

function extractPublicHostname(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

export default function App(): React.ReactElement {
  const [domainInput, setDomainInput] = useState('aurearoasters.com');
  const [activeTabUrl, setActiveTabUrl] = useState<string | null>(null);
  const [workspaceOrigin, setWorkspaceOrigin] = useState('https://verisource.dev');
  const [activeTab, setActiveTab] = useState<ThreeTabId>('tab1_visibility');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audit, setAudit] = useState<FullGeoAuditResult>(() =>
    buildInitialAureaAudit()
  );

  const inspectDomain = useCallback(
    async (target: string, preferredOrigin?: string) => {
      const cleaned = target.trim();
      if (!cleaned) return;
      setLoading(true);
      setErrorMessage(null);
      setStatusMessage(null);

      try {
        // Compute deterministic + Critic-verified full bundle without cross-origin browser fetch errors
        const fullAudit = await runFullGeoAudit({
          domainInput: cleaned,
          rawEnv: { PROVIDER_MODE: 'mock' },
          skipDirectHttpProbe: true,
        });

        // Sync live server-side HTTP/WAF/Shopify probe via CORS-enabled Verisource /api/grader
        const originToQuery = (preferredOrigin ?? workspaceOrigin).replace(/\/$/, '');
        try {
          const apiRes = await fetch(`${originToQuery}/api/grader`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: fullAudit.hostname }),
            signal: AbortSignal.timeout(6000),
          });
          if (apiRes.ok) {
            const liveSummary = (await apiRes.json()) as ReadinessScanSummary;
            fullAudit.brandName = liveSummary.brandName || fullAudit.brandName;
            fullAudit.visibilityScore = liveSummary.visibilityScore;
            fullAudit.accuracyScore = liveSummary.accuracyScore;
            fullAudit.probe.reachable = true;
            fullAudit.probe.robotsAiBotStatus = liveSummary.robotsAiBotStatus;
            fullAudit.probe.llmsTxtStatus = liveSummary.llmsTxtStatus;
            fullAudit.shopify.isShopify = liveSummary.isShopify;
            fullAudit.shopify.shopifyMcpStatus = liveSummary.shopifyMcpStatus;
            fullAudit.shopify.agentsMdStatus = liveSummary.agentsMdStatus;
            fullAudit.fixes = generateGeoFixBundle({
              domain: fullAudit.probe.domain,
              brandName: fullAudit.brandName,
              truthSheet: fullAudit.brandTruthSheet,
              shopify: fullAudit.shopify,
              scanResults: fullAudit.scanResults,
            });
            setStatusMessage(`Live HTTP probe synced via ${originToQuery}`);
          }
        } catch {
          if (!fullAudit.probe.reachable) {
            setStatusMessage(
              'Offline sandbox active; connect to verisource.dev for live edge HTTP probes.'
            );
          }
        }

        setAudit(fullAudit);
        setDomainInput(fullAudit.hostname);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to audit that domain.'
        );
      } finally {
        setLoading(false);
      }
    },
    [workspaceOrigin]
  );

  const readActiveTabAndScan = useCallback(async () => {
    if (typeof browser === 'undefined' || !browser.tabs?.query) return;
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const current = tabs[0];
      const host = extractPublicHostname(current?.url);
      if (host) {
        setActiveTabUrl(host);
        await inspectDomain(host);
      }
    } catch {
      // Ignore if activeTab host was not yet granted
    }
  }, [inspectDomain]);

  useEffect(() => {
    void inspectDomain('aurearoasters.com');

    if (typeof browser !== 'undefined' && browser.tabs?.query) {
      void browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          const host = extractPublicHostname(tabs[0]?.url);
          if (host) {
            setActiveTabUrl(host);
            void inspectDomain(host);
          }
        })
        .catch(() => {
          // Safe noop in non-extension browser preview
        });
    }
  }, [inspectDomain]);

  const uniqueFanoutQueries = Array.from(
    new Set(audit.scanResults.flatMap((s) => s.decompiledFanoutQueries))
  );
  const uniqueCitationUrls = Array.from(
    new Set(audit.scanResults.flatMap((s) => s.citedSourceUrls))
  );

  const mcpSnippet = JSON.stringify(
    {
      mcpServers: {
        verisource: {
          url: 'https://mcp.verisource.dev/mcp',
          headers: {
            Authorization: 'Bearer vs_live_replace_with_key',
          },
        },
      },
    },
    null,
    2
  );

  const cleanOrigin = workspaceOrigin.replace(/\/$/, '');
  const pixelPreview = buildAiAttributionSnippet({
    trackingPixelToken:
      audit.hostname === 'mosaicroasters.com'
        ? 'bbbbbbbb-1111-4000-8000-000000000002'
        : 'aaaaaaaa-1111-4000-8000-000000000001',
    ingestionUrl: `${cleanOrigin}/api/pixel`,
  });

  return (
    <div style={{ padding: '12px', minHeight: '100vh', background: 'var(--vs-canvas)' }}>
      <VerisourceStyleTag />

      {/* Top Brand Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--vs-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="vs-mono"
            style={{ fontWeight: 700, fontSize: '13.5px', letterSpacing: '-0.02em' }}
          >
            VERISOURCE
          </span>
          <StatusBadge tone="pass">MV3 SIDEPANEL</StatusBadge>
        </div>

        <a
          href={`${cleanOrigin}/dashboard?domain=${encodeURIComponent(audit.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="vs-mono"
          style={{ fontSize: '11.5px', color: 'var(--vs-ink)', fontWeight: 600 }}
        >
          Full Console →
        </a>
      </div>

      {/* Domain Inspector Bar */}
      <div className="vs-card" style={{ padding: '10px', marginBottom: '10px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void inspectDomain(domainInput);
          }}
          style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}
        >
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="domain.com"
            className="vs-input"
            style={{ padding: '7px 9px', fontSize: '12.5px' }}
            aria-label="Inspect target domain"
          />
          <button
            type="submit"
            disabled={loading}
            className="vs-btn"
            style={{ padding: '7px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
          >
            {loading ? 'Scanning...' : 'Audit'}
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            type="button"
            className="vs-btn vs-btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => void readActiveTabAndScan()}
          >
            {activeTabUrl ? `Active Tab (${activeTabUrl})` : 'Inspect Active Tab'}
          </button>
          <button
            type="button"
            className="vs-btn vs-btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => void inspectDomain('aurearoasters.com')}
          >
            aurearoasters.com
          </button>
          <button
            type="button"
            className="vs-btn vs-btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => void inspectDomain('mosaicroasters.com')}
          >
            mosaicroasters.com
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div
          style={{
            padding: '8px 10px',
            marginBottom: '10px',
            background: 'var(--vs-crit-bg)',
            border: '1px solid var(--vs-crit-border)',
            color: 'var(--vs-crit-fg)',
            borderRadius: '5px',
            fontSize: '12px',
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      {statusMessage ? (
        <div
          style={{
            padding: '7px 10px',
            marginBottom: '10px',
            background: 'var(--vs-surface-subtle)',
            border: '1px solid var(--vs-border)',
            color: 'var(--vs-ink-secondary)',
            borderRadius: '5px',
            fontSize: '11.5px',
          }}
        >
          {statusMessage}
        </div>
      ) : null}

      {/* Strict 3-Tab Shared Shell */}
      <ThreeTabShell activeTab={activeTab} onSelectTab={setActiveTab} compact>
        {activeTab === 'tab1_visibility' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              className="vs-card"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                overflow: 'hidden',
              }}
            >
              <div style={{ borderRight: '1px solid var(--vs-border)' }}>
                <MetricLedgerCell
                  label="AI Visibility"
                  value={audit.visibilityScore}
                  suffix="/ 100"
                  tone={audit.visibilityScore < 50 ? 'warn' : 'pass'}
                  sublabel={audit.hostname}
                />
              </div>
              <div>
                <MetricLedgerCell
                  label="Truth Accuracy"
                  value={`${audit.accuracyScore}%`}
                  tone={audit.accuracyScore < 80 ? 'critical' : 'pass'}
                  sublabel={`${audit.allHallucinations.length} conflict(s)`}
                />
              </div>
            </div>

            {/* Protocol & Crawler Readout */}
            <div className="vs-card" style={{ padding: '10px 12px' }}>
              <div
                className="vs-mono"
                style={{
                  fontSize: '10.5px',
                  color: 'var(--vs-ink-muted)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                CRAWLER &amp; PROTOCOL STATUS
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                <StatusBadge
                  tone={audit.probe.robotsAiBotStatus.GPTBot ? 'pass' : 'critical'}
                >
                  GPTBot: {audit.probe.robotsAiBotStatus.GPTBot ? '200' : '403'}
                </StatusBadge>
                <StatusBadge
                  tone={
                    audit.probe.robotsAiBotStatus.PerplexityBot ? 'pass' : 'critical'
                  }
                >
                  PerplexityBot:{' '}
                  {audit.probe.robotsAiBotStatus.PerplexityBot ? '200' : '403'}
                </StatusBadge>
                <StatusBadge
                  tone={
                    audit.shopify.agentsMdStatus === 'custom_enriched'
                      ? 'pass'
                      : audit.shopify.agentsMdStatus === 'default_boilerplate'
                        ? 'warn'
                        : 'critical'
                  }
                >
                  /agents.md: {audit.shopify.agentsMdStatus}
                </StatusBadge>
                {audit.shopify.isShopify ? (
                  <StatusBadge
                    tone={
                      audit.shopify.shopifyMcpStatus === 'ucp_active'
                        ? 'pass'
                        : 'warn'
                    }
                  >
                    Shopify:{' '}
                    {audit.shopify.shopifyMcpStatus === 'ucp_active'
                      ? '/api/ucp/mcp'
                      : '/api/mcp'}
                  </StatusBadge>
                ) : null}
              </div>
            </div>

            {/* Flagged Hallucinations */}
            <div className="vs-card" style={{ padding: '10px 12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <strong style={{ fontSize: '12.5px' }}>
                  Hallucination Watchdog
                </strong>
                <StatusBadge
                  tone={audit.allHallucinations.length > 0 ? 'critical' : 'pass'}
                >
                  {audit.allHallucinations.length > 0
                    ? `${audit.allHallucinations.length} FLAGGED`
                    : 'CLEAN'}
                </StatusBadge>
              </div>

              {audit.allHallucinations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {audit.allHallucinations.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--vs-crit-bg)',
                        border: '1px solid var(--vs-crit-border)',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ color: 'var(--vs-crit-fg)', fontWeight: 600 }}>
                        LLM Claim: &ldquo;{h.claim_text}&rdquo;
                      </div>
                      <div style={{ color: 'var(--vs-ink)', marginTop: '4px' }}>
                        <strong>Verified Truth:</strong> {h.verified_truth}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--vs-ink-secondary)' }}>
                  No pricing or policy mismatches found against{' '}
                  {audit.brandTruthSheet.verified_pricing_summary}.
                </div>
              )}
            </div>

            {/* Brand Truth Snapshot */}
            <div className="vs-card" style={{ padding: '10px 12px', fontSize: '12px' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>
                Verified Storefront Ground Truth
              </strong>
              <div style={{ color: 'var(--vs-ink-secondary)', marginBottom: '4px' }}>
                <strong>Pricing:</strong>{' '}
                {audit.brandTruthSheet.verified_pricing_summary}
              </div>
              <div style={{ color: 'var(--vs-ink-secondary)' }}>
                <strong>Shipping:</strong>{' '}
                {audit.brandTruthSheet.shipping_or_service_area}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'tab2_fixes' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              className="vs-card"
              style={{
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600 }}>
                {audit.fixes.length} Critic-Verified Artifacts
              </span>
              <button
                type="button"
                className="vs-btn vs-btn-secondary"
                style={{ padding: '5px 10px', fontSize: '11.5px' }}
                onClick={() => {
                  const md = buildImplementationBundleMarkdown({
                    domain: {
                      brand_name: audit.brandName,
                      domain_url: audit.domainUrl,
                      is_shopify: audit.shopify.isShopify,
                      shopify_mcp_status: audit.shopify.shopifyMcpStatus,
                      visibility_score: audit.visibilityScore,
                      accuracy_score: audit.accuracyScore,
                    },
                    fixes: audit.fixes.map((f) => ({
                      title: f.title,
                      fix_type: f.fixType,
                      content_payload: f.contentPayload,
                      natural_quality_score: f.naturalQualityScore,
                    })),
                  });
                  const blob = new Blob([md], {
                    type: 'text/markdown;charset=utf-8',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${audit.hostname}-verisource-geo-bundle.md`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
              >
                ↓ Export Bundle (.md)
              </button>
            </div>

            {audit.shopify.isShopify ? (
              <div
                className="vs-card"
                style={{
                  padding: '10px 12px',
                  background: 'var(--vs-surface-subtle)',
                  fontSize: '12px',
                }}
              >
                <strong>Shopify Deployment Guide:</strong> Save{' '}
                <code className="vs-mono">templates/agents.md.liquid</code> inside
                your theme and paste <code className="vs-mono">JSON-LD</code> into{' '}
                <code className="vs-mono">layout/theme.liquid</code> before{' '}
                <code className="vs-mono">&lt;/head&gt;</code>.
              </div>
            ) : null}

            {audit.fixes.map((fix, idx) => (
              <CodeArtifactCard
                key={`${fix.fixType}-${idx}`}
                title={fix.title}
                fileHint={`Artifact Type: ${fix.fixType}`}
                code={fix.contentPayload}
                qualityScore={fix.naturalQualityScore}
                qualityBreakdown={fix.qualityRubricBreakdown}
              />
            ))}

            <CodeArtifactCard
              title="10-Line AI Referral Attribution Pixel"
              fileHint="Captures chatgpt.com, perplexity.ai, gemini.google.com, claude.ai"
              code={pixelPreview}
            />
          </div>
        ) : null}

        {activeTab === 'tab3_offsite' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="vs-card" style={{ padding: '10px 12px' }}>
              <strong style={{ fontSize: '12.5px', display: 'block', marginBottom: '6px' }}>
                Decompiled Engine Search Fanouts
              </strong>
              {uniqueFanoutQueries.length > 0 ? (
                uniqueFanoutQueries.map((q) => (
                  <div
                    key={q}
                    className="vs-mono"
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--vs-ink-secondary)',
                      marginBottom: '4px',
                    }}
                  >
                    → {q}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
                  Run a multi-engine scan in Full Console for fanout sub-queries.
                </div>
              )}
            </div>

            <div className="vs-card" style={{ padding: '10px 12px' }}>
              <strong style={{ fontSize: '12.5px', display: 'block', marginBottom: '6px' }}>
                Cited Third-Party URLs
              </strong>
              {uniqueCitationUrls.length > 0 ? (
                uniqueCitationUrls.map((url) => (
                  <div
                    key={url}
                    className="vs-mono"
                    style={{ fontSize: '11.5px', marginBottom: '4px', wordBreak: 'break-all' }}
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--vs-ink)' }}
                    >
                      {url}
                    </a>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
                  Zero external citations detected for sample prompt.
                </div>
              )}
            </div>

            {/* White-Label Pitch Handoff */}
            <div className="vs-card" style={{ padding: '10px 12px' }}>
              <strong style={{ fontSize: '12.5px', display: 'block', marginBottom: '4px' }}>
                60-Second White-Label Pitch Handoff
              </strong>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--vs-ink-secondary)',
                  margin: '0 0 8px 0',
                }}
              >
                Send a branded executive brief with your agency logo and calendar link.
              </p>
              <a
                href={
                  audit.hostname === 'mosaicroasters.com'
                    ? `${cleanOrigin}/audit/mosaic-springfield-audit`
                    : `${cleanOrigin}/dashboard?domain=${encodeURIComponent(audit.hostname)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="vs-btn"
                style={{ width: '100%', fontSize: '12px', padding: '8px 12px' }}
              >
                {audit.hostname === 'mosaicroasters.com'
                  ? 'Open Mosaic White-Label Audit →'
                  : 'Create Branded /audit/[slug] Pitch →'}
              </a>
            </div>

            {/* Workspace Origin + MCP Config */}
            <div className="vs-card" style={{ padding: '10px 12px' }}>
              <label
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Verisource API Base URL
              </label>
              <input
                type="url"
                value={workspaceOrigin}
                onChange={(e) => setWorkspaceOrigin(e.target.value)}
                className="vs-input"
                style={{ padding: '6px 8px', fontSize: '12px', marginBottom: '8px' }}
              />
              <CodeArtifactCard
                title="Streamable HTTP /mcp Config"
                fileHint="Endpoint: https://mcp.verisource.dev/mcp"
                code={mcpSnippet}
              />
            </div>
          </div>
        ) : null}
      </ThreeTabShell>
    </div>
  );
}
