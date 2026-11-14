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
  GuidedExplainerBanner,
  MetricLedgerCell,
  StatusBadge,
  ThreeTabShell,
  UxModeSwitch,
  VerisourceStyleTag,
  type ThreeTabId,
  type UxMode,
} from '@verisource/ui';

function describeFixPlainly(fixType: string): string {
  switch (fixType) {
    case 'json_ld_schema':
      return 'Hidden fact-sheet code for your site header so AI reads your real prices and FAQs.';
    case 'shopify_agents_liquid':
      return 'Shopify theme template giving AI shopping assistants verified product rules.';
    case 'agents_md':
      return 'Plain-English rulebook telling AI bots what you sell and what not to invent.';
    case 'llms_txt':
      return 'Quick-read directory of your key pages built for AI search crawlers.';
    case 'fanout_faq_block':
      return 'Ready-to-paste Q&A answering the exact questions buyers ask AI.';
    case 'citation_outreach_brief':
      return 'Short note to get your business included in third-party comparison guides.';
    default:
      return 'Verified copy-paste website fix.';
  }
}

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
  const [uxMode, setUxMode] = useState<UxMode>('guided');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audit, setAudit] = useState<FullGeoAuditResult>(() =>
    buildInitialAureaAudit()
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('vs_ux_mode');
      if (saved === 'guided' || saved === 'pro') {
        setUxMode(saved);
      }
    } catch {
      // Ignore storage boundary in restricted contexts
    }
  }, []);

  const handleChangeUxMode = (next: UxMode) => {
    setUxMode(next);
    try {
      window.localStorage.setItem('vs_ux_mode', next);
    } catch {
      // Ignore storage boundary
    }
  };

  const inspectDomain = useCallback(
    async (target: string, preferredOrigin?: string) => {
      const cleaned = target.trim();
      if (!cleaned) return;
      setLoading(true);
      setErrorMessage(null);
      setStatusMessage(null);

      try {
        const fullAudit = await runFullGeoAudit({
          domainInput: cleaned,
          rawEnv: { PROVIDER_MODE: 'mock' },
          skipDirectHttpProbe: true,
        });

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
            setStatusMessage(`Synced live check via ${originToQuery}`);
          }
        } catch {
          if (!fullAudit.probe.reachable) {
            setStatusMessage(
              'Offline preview active; connect to verisource.dev for live site checks.'
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

  const isGuided = uxMode === 'guided';

  return (
    <div style={{ padding: '12px', minHeight: '100vh', background: 'var(--vs-canvas)' }}>
      <VerisourceStyleTag />

      {/* Top Brand Header + Guided/Pro Toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--vs-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span
            className="vs-mono"
            style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '-0.02em' }}
          >
            VERISOURCE
          </span>
          <UxModeSwitch mode={uxMode} onChange={handleChangeUxMode} compact />
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
            placeholder="yourwebsite.com"
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
            {loading ? 'Scanning...' : 'Scan Site'}
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            type="button"
            className="vs-btn vs-btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => void readActiveTabAndScan()}
          >
            {activeTabUrl ? `Current Tab (${activeTabUrl})` : 'Scan Current Tab'}
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
            borderRadius: '6px',
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
            borderRadius: '6px',
            fontSize: '11.5px',
          }}
        >
          {statusMessage}
        </div>
      ) : null}

      {/* Strict 3-Tab Shared Shell */}
      <ThreeTabShell
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        compact
        mode={uxMode}
      >
        {activeTab === 'tab1_visibility' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isGuided ? (
              <GuidedExplainerBanner
                stepLabel="STEP 1 · QUICK HEALTH CHECK"
                title="See how AI describes this website"
                description="Higher scores mean AI engines can read your pages and state your real prices accurately."
              />
            ) : null}

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
                  label={isGuided ? 'AI Visibility' : 'AI Share of Voice'}
                  value={audit.visibilityScore}
                  suffix="/ 100"
                  tone={audit.visibilityScore < 50 ? 'warn' : 'pass'}
                  sublabel={audit.hostname}
                />
              </div>
              <div>
                <MetricLedgerCell
                  label={isGuided ? 'Fact Accuracy' : 'Truth Accuracy'}
                  value={`${audit.accuracyScore}%`}
                  tone={audit.accuracyScore < 80 ? 'critical' : 'pass'}
                  sublabel={`${audit.allHallucinations.length} issue(s)`}
                />
              </div>
            </div>

            {/* Protocol & Crawler Readout */}
            <div className="vs-card" style={{ padding: '10px 12px' }}>
              <div className="vs-eyebrow" style={{ marginBottom: '6px', fontSize: '10px' }}>
                {isGuided ? 'CAN AI BOTS READ THIS SITE?' : 'CRAWLER & PROTOCOL STATUS'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                <StatusBadge
                  tone={audit.probe.robotsAiBotStatus.GPTBot ? 'pass' : 'critical'}
                >
                  GPTBot: {audit.probe.robotsAiBotStatus.GPTBot ? 'ALLOWED' : 'BLOCKED'}
                </StatusBadge>
                <StatusBadge
                  tone={
                    audit.probe.robotsAiBotStatus.PerplexityBot ? 'pass' : 'critical'
                  }
                >
                  PerplexityBot:{' '}
                  {audit.probe.robotsAiBotStatus.PerplexityBot ? 'ALLOWED' : 'BLOCKED'}
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
                  {isGuided
                    ? `AI Rulebook: ${
                        audit.shopify.agentsMdStatus === 'custom_enriched'
                          ? 'Verified'
                          : audit.shopify.agentsMdStatus === 'default_boilerplate'
                            ? 'Generic'
                            : 'Missing'
                      }`
                    : `/agents.md: ${audit.shopify.agentsMdStatus}`}
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
                  {isGuided ? 'Wrong AI Claims Caught' : 'Hallucination Watchdog'}
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
                        borderRadius: '5px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ color: 'var(--vs-crit-fg)', fontWeight: 600 }}>
                        AI Says: &ldquo;{h.claim_text}&rdquo;
                      </div>
                      <div style={{ color: 'var(--vs-ink)', marginTop: '4px' }}>
                        <strong>Real Fact:</strong> {h.verified_truth}
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
                {isGuided ? 'Real Website Facts' : 'Verified Storefront Ground Truth'}
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
            {isGuided ? (
              <GuidedExplainerBanner
                stepLabel="STEP 2 · COPY-PASTE FIXES"
                title="Download or copy your website fix code"
                description="Send the single .md bundle to your web designer, or copy individual blocks below."
              />
            ) : null}

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
                {audit.fixes.length} Ready-to-Paste Fix{audit.fixes.length === 1 ? '' : 'es'}
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
                ↓ Download All (.md)
              </button>
            </div>

            {audit.shopify.isShopify ? (
              <div
                className="vs-card"
                style={{
                  padding: '10px 12px',
                  background: 'var(--vs-surface-warm)',
                  fontSize: '12px',
                }}
              >
                <strong>Shopify Tip:</strong> Save{' '}
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
                plainSummary={isGuided ? describeFixPlainly(fix.fixType) : undefined}
                fileHint={isGuided ? undefined : `Artifact Type: ${fix.fixType}`}
                code={fix.contentPayload}
                qualityScore={fix.naturalQualityScore}
                qualityBreakdown={fix.qualityRubricBreakdown}
              />
            ))}

            <CodeArtifactCard
              title="10-Line AI Visit & Order Tracker"
              plainSummary={
                isGuided
                  ? 'Tracks visitors and purchases referred by ChatGPT, Perplexity, Gemini, and Claude.'
                  : undefined
              }
              fileHint="Paste before </head> on your site"
              code={pixelPreview}
            />
          </div>
        ) : null}

        {activeTab === 'tab3_offsite' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isGuided ? (
              <GuidedExplainerBanner
                stepLabel="STEP 3 · COMPETITORS & CLIENT LINKS"
                title="See where competitors get mentioned"
                description="Review the external articles AI trusts in your category, or create a shareable client audit page."
              />
            ) : null}

            <div className="vs-card" style={{ padding: '10px 12px' }}>
              <strong style={{ fontSize: '12.5px', display: 'block', marginBottom: '6px' }}>
                {isGuided
                  ? 'What AI Searches Behind the Scenes'
                  : 'Decompiled Engine Search Fanouts'}
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
                  Open Full Console to run multi-engine search tracking.
                </div>
              )}
            </div>

            <div className="vs-card" style={{ padding: '10px 12px' }}>
              <strong style={{ fontSize: '12.5px', display: 'block', marginBottom: '6px' }}>
                {isGuided ? 'Articles Feeding AI Answers' : 'Cited Third-Party URLs'}
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
                  No external articles cited for this sample prompt.
                </div>
              )}
            </div>

            {/* White-Label Pitch Handoff */}
            <div className="vs-card" style={{ padding: '10px 12px' }}>
              <strong style={{ fontSize: '12.5px', display: 'block', marginBottom: '4px' }}>
                60-Second Branded Client Link
              </strong>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--vs-ink-secondary)',
                  margin: '0 0 8px 0',
                }}
              >
                Send a clean executive audit page with your agency logo and booking button.
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
                  ? 'Open Mosaic Client Report →'
                  : 'Create Branded Client Link →'}
              </a>
            </div>

            {/* Developer /mcp Config: collapsed in Guided Mode, expanded in Pro Mode */}
            {isGuided ? (
              <div
                className="vs-card"
                style={{
                  padding: '10px 12px',
                  background: 'var(--vs-surface-warm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--vs-ink-secondary)' }}>
                  Using Cursor or Claude Desktop?
                </span>
                <button
                  type="button"
                  className="vs-btn vs-btn-secondary"
                  style={{ padding: '5px 9px', fontSize: '11px' }}
                  onClick={() => handleChangeUxMode('pro')}
                >
                  Open Pro /mcp →
                </button>
              </div>
            ) : (
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
            )}
          </div>
        ) : null}
      </ThreeTabShell>
    </div>
  );
}
