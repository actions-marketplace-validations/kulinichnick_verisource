import React, { useCallback, useEffect, useState } from 'react';
import {
  buildAiAttributionSnippet,
  buildAiRemediationMasterPrompt,
  buildAnalyticsInstallAiPrompt,
  buildCitationAnswerPageBundle,
  buildEdgeBotCrawlerSnippet,
  buildExecutiveAuditReportMarkdown,
  buildFollowUpVerificationAiPrompt,
  buildImplementationBundleMarkdown,
  buildLiveFixVerificationFromSummary,
  buildPlainEnglishSiteDiagnosis,
  evaluateCommerceAttributeReadiness,
  generateGeoFixBundle,
  generateSuggestedBuyerPrompts,
  getWebsitePlatformMeta,
  rankCitationGapSources,
  runFullGeoAudit,
  summarizeBrandSentimentAndSov,
  summarizeEngineCitationShare,
  type AiRemediationTargetEnv,
  type FullGeoAuditResult,
  type LiveFixVerificationReport,
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
      return 'Easy-to-read rulebook telling AI bots what you sell and what not to invent.';
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
  const [domainInput, setDomainInput] = useState('');
  const [activeTabUrl, setActiveTabUrl] = useState<string | null>(null);
  const [workspaceOrigin, setWorkspaceOrigin] = useState(
    'https://verisource.dev'
  );
  const [activeTab, setActiveTab] = useState<ThreeTabId>('tab1_visibility');
  const [uxMode, setUxMode] = useState<UxMode>('guided');
  const [attributionMode, setAttributionMode] = useState<
    'browser_pixel' | 'edge_crawler'
  >('browser_pixel');
  const [selectedPromptEnv, setSelectedPromptEnv] =
    useState<AiRemediationTargetEnv>('coding_agent');
  const [copiedAiPrompt, setCopiedAiPrompt] = useState(false);
  const [copiedRivalPagePrompt, setCopiedRivalPagePrompt] = useState(false);
  const [copiedTrackerPrompt, setCopiedTrackerPrompt] = useState(false);
  const [verifyingLiveFixes, setVerifyingLiveFixes] = useState(false);
  const [liveVerificationReport, setLiveVerificationReport] =
    useState<LiveFixVerificationReport | null>(null);
  const [copiedFollowUpPrompt, setCopiedFollowUpPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audit, setAudit] = useState<FullGeoAuditResult | null>(null);

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
      setLiveVerificationReport(null);
      setCopiedFollowUpPrompt(false);

      try {
        const fullAudit = await runFullGeoAudit({
          domainInput: cleaned,
          rawEnv: { PROVIDER_MODE: 'mock' },
          skipDirectHttpProbe: true,
        });

        const originToQuery = (preferredOrigin ?? workspaceOrigin).replace(
          /\/$/,
          ''
        );
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
            if (liveSummary.crawlerReadability) {
              fullAudit.probe.crawlerReadability =
                liveSummary.crawlerReadability;
            }
            if (liveSummary.detectedPlatform) {
              fullAudit.probe.detectedPlatform = liveSummary.detectedPlatform;
            }
            fullAudit.shopify.isShopify = liveSummary.isShopify;
            fullAudit.shopify.shopifyMcpStatus = liveSummary.shopifyMcpStatus;
            fullAudit.shopify.agentsMdStatus = liveSummary.agentsMdStatus;
            if (liveSummary.samplePromptResult && fullAudit.scanResults[0]) {
              const sample = liveSummary.samplePromptResult;
              const safeEngine =
                sample.aiEngine === 'chatgpt' ||
                sample.aiEngine === 'gemini' ||
                sample.aiEngine === 'perplexity' ||
                sample.aiEngine === 'claude'
                  ? sample.aiEngine
                  : fullAudit.scanResults[0].aiEngine;
              fullAudit.scanResults[0] = {
                ...fullAudit.scanResults[0],
                promptText: sample.promptText,
                aiEngine: safeEngine,
                brandMentioned: sample.brandMentioned,
                competitorsMentioned: sample.competitorsMentioned,
                decompiledFanoutQueries:
                  sample.decompiledFanoutQueries ??
                  fullAudit.scanResults[0].decompiledFanoutQueries,
                fanoutTelemetryType:
                  sample.fanoutTelemetryType ??
                  fullAudit.scanResults[0].fanoutTelemetryType,
                hallucinationDetected: sample.hallucinationDetected,
              };
            }
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

        const resolvedPlatform = getWebsitePlatformMeta(
          fullAudit.probe.detectedPlatform ??
            (fullAudit.shopify.isShopify ? 'shopify' : 'nextjs_custom')
        );
        setSelectedPromptEnv(resolvedPlatform.recommendedAiEnv);
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
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const current = tabs[0];
      const host = extractPublicHostname(current?.url);
      if (host) {
        setActiveTabUrl(host);
        await inspectDomain(host);
      } else {
        setStatusMessage(
          'Navigate to a public http(s) webpage or type a domain above to scan.'
        );
      }
    } catch {
      // Ignore if activeTab host was not yet granted
    }
  }, [inspectDomain]);

  useEffect(() => {
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

  const cleanOrigin = workspaceOrigin.replace(/\/$/, '');
  const isGuided = uxMode === 'guided';

  const engineShare = audit
    ? summarizeEngineCitationShare(audit.scanResults, audit.hostname)
    : [];
  const sentimentAndSov = audit
    ? summarizeBrandSentimentAndSov({
        brandName: audit.brandName,
        snapshots: audit.scanResults,
      })
    : null;
  const commerceReadiness = audit
    ? evaluateCommerceAttributeReadiness({
        domain: {
          brand_name: audit.brandName,
          domain_url: audit.domainUrl,
          is_shopify: audit.shopify.isShopify,
          shopify_mcp_status: audit.shopify.shopifyMcpStatus,
          agents_md_status: audit.shopify.agentsMdStatus,
          llms_txt_status: audit.probe.llmsTxtStatus,
          brand_truth_sheet: audit.brandTruthSheet,
        },
        fixes: audit.fixes.map((f) => ({
          fix_type: f.fixType,
          content_payload: f.contentPayload,
          is_applied: false,
        })),
      })
    : null;
  const rankedSources = audit
    ? rankCitationGapSources({
        targetHostname: audit.hostname,
        snapshots: audit.scanResults,
      })
    : [];
  const suggestedPrompts =
    audit && sentimentAndSov
      ? generateSuggestedBuyerPrompts({
          hostname: audit.hostname,
          brandName: audit.brandName,
          coreOffering: audit.brandTruthSheet.core_offering,
          pricingSummary: audit.brandTruthSheet.verified_pricing_summary,
          shippingOrServiceArea:
            audit.brandTruthSheet.shipping_or_service_area,
          isShopify: audit.shopify.isShopify,
          topRivals: sentimentAndSov.headToHeadSov
            .filter((r) => !r.isTargetBrand)
            .map((r) => r.entityName),
          existingPrompts: audit.trackedPrompts,
        })
      : [];
  const uniqueFanoutQueries = audit
    ? Array.from(
        new Set(audit.scanResults.flatMap((s) => s.decompiledFanoutQueries))
      )
    : [];
  const platformMeta = audit
    ? getWebsitePlatformMeta(
        audit.probe.detectedPlatform ??
          (audit.shopify.isShopify ? 'shopify' : 'nextjs_custom')
      )
    : null;
  const plainDiagnosis = audit
    ? buildPlainEnglishSiteDiagnosis({
        brandName: audit.brandName,
        hostname: audit.hostname,
        visibilityScore: audit.visibilityScore,
        accuracyScore: audit.accuracyScore,
        robotsAiBotStatus: audit.probe.robotsAiBotStatus,
        llmsTxtStatus: audit.probe.llmsTxtStatus,
        agentsMdStatus: audit.shopify.agentsMdStatus,
        jsonLdCount: audit.fixes.filter((f) => f.fixType === 'json_ld_schema')
          .length,
        isShopify: audit.shopify.isShopify,
        shopifyMcpStatus: audit.shopify.shopifyMcpStatus,
        crawlerReadability: audit.probe.crawlerReadability,
        hallucinationCount: audit.allHallucinations.length,
        brandMentionedInSample: audit.scanResults.some((s) => s.brandMentioned),
        topRivals:
          sentimentAndSov?.headToHeadSov
            .filter((r) => !r.isTargetBrand)
            .map((r) => r.entityName) ?? [],
      })
    : null;

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

  const pixelPreview = buildAiAttributionSnippet({
    trackingPixelToken: '00000000-0000-4000-8000-000000000001',
    ingestionUrl: `${cleanOrigin}/api/pixel`,
  });

  const edgeCrawlerPreview = buildEdgeBotCrawlerSnippet({
    trackingPixelToken: '00000000-0000-4000-8000-000000000001',
    checkoutKey: 'replace_with_console_hmac',
    ingestionUrl: `${cleanOrigin}/api/pixel`,
  });

  const handleExportAuditMarkdown = () => {
    if (!audit) return;
    const report = buildExecutiveAuditReportMarkdown({
      domain: {
        brand_name: audit.brandName,
        domain_url: audit.domainUrl,
        is_shopify: audit.shopify.isShopify,
        shopify_mcp_status: audit.shopify.shopifyMcpStatus,
        agents_md_status: audit.shopify.agentsMdStatus,
        llms_txt_status: audit.probe.llmsTxtStatus,
        robots_ai_bot_status: audit.probe.robotsAiBotStatus,
        brand_truth_sheet: audit.brandTruthSheet,
        visibility_score: audit.visibilityScore,
        accuracy_score: audit.accuracyScore,
      },
      snapshots: audit.scanResults,
      fixes: audit.fixes.map((f) => ({
        fix_type: f.fixType,
        title: f.title,
        content_payload: f.contentPayload,
        is_applied: false,
        natural_quality_score: f.naturalQualityScore,
      })),
      trackedPrompts: audit.trackedPrompts,
      crawlerReadability: audit.probe.crawlerReadability ?? null,
      suggestedPrompts,
    });
    const blob = new Blob([report.content], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${audit.hostname}-ai-search-audit.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        padding: '12px',
        minHeight: '100vh',
        background: 'var(--vs-canvas)',
      }}
    >
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
            style={{
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '-0.02em',
            }}
          >
            VERISOURCE
          </span>
          <UxModeSwitch mode={uxMode} onChange={handleChangeUxMode} compact />
        </div>

        <a
          href={
            audit
              ? `${cleanOrigin}/dashboard?domain=${encodeURIComponent(
                  audit.hostname
                )}`
              : `${cleanOrigin}/dashboard`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="vs-mono"
          style={{ fontSize: '11.5px', color: 'var(--vs-ink)', fontWeight: 600 }}
        >
          Private Console →
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
            placeholder="Enter website (e.g. yourcompany.com)"
            className="vs-input"
            style={{ padding: '7px 9px', fontSize: '12.5px' }}
            aria-label="Inspect target domain"
          />
          <button
            type="submit"
            disabled={loading}
            className="vs-btn"
            style={{
              padding: '7px 12px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Scanning...' : 'Audit Site'}
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
          }}
        >
          <button
            type="button"
            className="vs-btn vs-btn-secondary"
            style={{ padding: '4px 9px', fontSize: '11px' }}
            onClick={() => void readActiveTabAndScan()}
          >
            {activeTabUrl
              ? `↻ Scan Active Tab (${activeTabUrl})`
              : 'Scan Active Browser Tab'}
          </button>

          {audit ? (
            <button
              type="button"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '4px 9px', fontSize: '11px' }}
              onClick={handleExportAuditMarkdown}
            >
              ↓ Export Audit (.md)
            </button>
          ) : null}
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

      {!audit ? (
        <div className="vs-card" style={{ padding: '18px 14px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '5px' }}>
            AI SEARCH &amp; AGENT INSPECTOR
          </div>
          <strong
            style={{
              display: 'block',
              fontSize: '14.5px',
              marginBottom: '6px',
            }}
          >
            Audit the site in your active tab or enter any domain above.
          </strong>
          <p
            style={{
              margin: '0 0 12px 0',
              fontSize: '12.5px',
              lineHeight: 1.55,
              color: 'var(--vs-ink-secondary)',
            }}
          >
            Checks <code className="vs-mono">GPTBot</code>,{' '}
            <code className="vs-mono">OAI-SearchBot</code>,{' '}
            <code className="vs-mono">PerplexityBot</code>,{' '}
            <code className="vs-mono">ClaudeBot</code>,{' '}
            <code className="vs-mono">Google-Extended</code>, raw HTML crawler
            readability, brand sentiment, rival Share of Voice, and
            syntax-validated schema fixes.
          </p>
          <button
            type="button"
            onClick={() => void readActiveTabAndScan()}
            className="vs-btn"
            style={{ width: '100%', fontSize: '12px', padding: '8px 12px' }}
          >
            Scan Active Browser Tab →
          </button>
        </div>
      ) : (
        <ThreeTabShell
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          compact
          mode={uxMode}
        >
          {activeTab === 'tab1_visibility' ? (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
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

              {isGuided && plainDiagnosis ? (
                <div className="vs-card" style={{ padding: '10px 12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      className="vs-eyebrow"
                      style={{ fontSize: '10px', color: 'var(--vs-ink)' }}
                    >
                      SITE DIAGNOSIS &amp; ACTION PLAN
                    </span>
                    {platformMeta ? (
                      <StatusBadge tone="pass">
                        {`PLATFORM: ${platformMeta.displayName.toUpperCase()}`}
                      </StatusBadge>
                    ) : null}
                  </div>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      marginBottom: '8px',
                    }}
                  >
                    {plainDiagnosis.headline}
                  </strong>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginBottom: '8px',
                    }}
                  >
                    {plainDiagnosis.issues.slice(0, 3).map((issue, idx) => (
                      <div
                        key={issue.id}
                        style={{
                          padding: '7px 9px',
                          borderRadius: '5px',
                          border: '1px solid var(--vs-border)',
                          background:
                            issue.severity === 'fix_first'
                              ? 'var(--vs-crit-bg)'
                              : issue.severity === 'healthy'
                                ? 'var(--vs-pass-bg)'
                                : 'var(--vs-surface-subtle)',
                          fontSize: '11.5px',
                        }}
                      >
                        <strong style={{ display: 'block', marginBottom: '2px' }}>
                          {idx + 1}. {issue.whatIsWrong}
                        </strong>
                        <div style={{ color: 'var(--vs-ink-secondary)' }}>
                          {issue.whyItMatters}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="vs-btn"
                    style={{ width: '100%', fontSize: '11.5px', padding: '7px 10px' }}
                    onClick={() => setActiveTab('tab2_fixes')}
                  >
                    Get 1-Click AI Fix Prompt in Step 2 →
                  </button>
                </div>
              ) : null}

              {/* Compact 3-Engine Mention vs. Citation Share Strip */}
              <div className="vs-card" style={{ padding: '10px 12px' }}>
                <div
                  className="vs-eyebrow"
                  style={{ marginBottom: '6px', fontSize: '10px' }}
                >
                  MENTION VS. CITATION SHARE
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '6px',
                  }}
                >
                  {engineShare.map((item) => {
                    const statusText =
                      item.totalSnapshots === 0
                        ? 'Pending'
                        : item.mentionedCount > 0
                          ? `Cited ${item.citationRatePct}% · #${item.bestRank ?? 1}`
                          : 'Omitted';
                    return (
                      <div
                        key={item.aiEngine}
                        style={{
                          padding: '7px 8px',
                          border: '1px solid var(--vs-border)',
                          borderRadius: '5px',
                          background: 'var(--vs-surface-subtle)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: 'var(--vs-ink-secondary)',
                          }}
                        >
                          {item.shortLabel}
                        </div>
                        <div
                          className="vs-mono"
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            marginTop: '2px',
                          }}
                        >
                          {item.mentionRatePct}%
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color:
                              item.totalSnapshots > 0 &&
                              item.mentionedCount === 0
                                ? 'var(--vs-crit-fg)'
                                : 'var(--vs-ink-muted)',
                            marginTop: '1px',
                          }}
                        >
                          {statusText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compact Brand Sentiment & Rival Share of Voice */}
              {sentimentAndSov ? (
                <div className="vs-card" style={{ padding: '10px 12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      className="vs-eyebrow"
                      style={{ fontSize: '10px', color: 'var(--vs-ink)' }}
                    >
                      SENTIMENT &amp; RIVAL SOV
                    </span>
                    <StatusBadge
                      tone={
                        sentimentAndSov.dominantFraming === 'recommended'
                          ? 'pass'
                          : sentimentAndSov.dominantFraming === 'cautionary' ||
                              sentimentAndSov.dominantFraming === 'invisible'
                            ? 'critical'
                            : 'warn'
                      }
                    >
                      {`${sentimentAndSov.dominantFraming.toUpperCase()} · ${sentimentAndSov.sentimentScore}/100`}
                    </StatusBadge>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                    }}
                  >
                    {sentimentAndSov.headToHeadSov.map((row) => (
                      <div
                        key={row.entityName}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '11.5px',
                        }}
                      >
                        <span
                          style={{ fontWeight: row.isTargetBrand ? 700 : 500 }}
                        >
                          {row.entityName}
                          {row.isTargetBrand ? ' (You)' : ''}
                        </span>
                        <span className="vs-mono">{row.shareOfVoicePct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Protocol, Bots & JS Crawler Readability */}
              <div className="vs-card" style={{ padding: '10px 12px' }}>
                <div
                  className="vs-eyebrow"
                  style={{ marginBottom: '6px', fontSize: '10px' }}
                >
                  {isGuided
                    ? 'BOT ACCESS & HTML READABILITY'
                    : 'CRAWLER, JS READABILITY & PROTOCOLS'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {platformMeta ? (
                    <StatusBadge>
                      {`PLATFORM: ${platformMeta.displayName.toUpperCase()}`}
                    </StatusBadge>
                  ) : null}
                  <StatusBadge
                    tone={
                      audit.probe.robotsAiBotStatus.GPTBot ? 'pass' : 'critical'
                    }
                  >
                    {`GPTBot: ${audit.probe.robotsAiBotStatus.GPTBot ? 'ALLOWED' : 'BLOCKED'}`}
                  </StatusBadge>
                  <StatusBadge
                    tone={
                      audit.probe.robotsAiBotStatus.PerplexityBot
                        ? 'pass'
                        : 'critical'
                    }
                  >
                    {`PerplexityBot: ${audit.probe.robotsAiBotStatus.PerplexityBot ? 'ALLOWED' : 'BLOCKED'}`}
                  </StatusBadge>
                  <StatusBadge
                    tone={
                      audit.probe.robotsAiBotStatus['Google-Extended']
                        ? 'pass'
                        : 'critical'
                    }
                  >
                    {`Google-Extended: ${audit.probe.robotsAiBotStatus['Google-Extended'] ? 'ALLOWED' : 'BLOCKED'}`}
                  </StatusBadge>
                  {audit.probe.crawlerReadability ? (
                    <StatusBadge
                      tone={
                        audit.probe.crawlerReadability.status === 'ssr_clean'
                          ? 'pass'
                          : audit.probe.crawlerReadability.status ===
                              'csr_js_trap'
                            ? 'critical'
                            : 'warn'
                      }
                    >
                      {`HTML: ${audit.probe.crawlerReadability.status.replace(/_/g, ' ').toUpperCase()}`}
                    </StatusBadge>
                  ) : null}
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
                            : audit.shopify.agentsMdStatus ===
                                'default_boilerplate'
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
                      {`Shopify: ${
                        audit.shopify.shopifyMcpStatus === 'ucp_active'
                          ? '/api/ucp/mcp'
                          : '/api/mcp'
                      }`}
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
                    {isGuided
                      ? 'Wrong AI Claims Caught'
                      : 'Hallucination Watchdog'}
                  </strong>
                  <StatusBadge
                    tone={
                      audit.allHallucinations.length > 0 ? 'critical' : 'pass'
                    }
                  >
                    {audit.allHallucinations.length > 0
                      ? `${audit.allHallucinations.length} FLAGGED`
                      : 'CLEAN'}
                  </StatusBadge>
                </div>

                {audit.allHallucinations.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
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
                        <div
                          style={{ color: 'var(--vs-crit-fg)', fontWeight: 600 }}
                        >
                          AI Says: &ldquo;{h.claim_text}&rdquo;
                        </div>
                        <div
                          style={{ color: 'var(--vs-ink)', marginTop: '4px' }}
                        >
                          <strong>Real Fact:</strong> {h.verified_truth}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--vs-ink-secondary)',
                    }}
                  >
                    No pricing or policy mismatches found against{' '}
                    {audit.brandTruthSheet.verified_pricing_summary ||
                      'verified site claims'}
                    .
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'tab2_fixes' ? (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {isGuided ? (
                <GuidedExplainerBanner
                  stepLabel="STEP 2 · 1-CLICK AI FIX PROMPT"
                  title="Copy 1 prompt into your AI tool to fix your site"
                  description="Pick your detected site builder or AI tool below, copy the prompt, and let your AI apply the changes."
                />
              ) : null}

              {/* Platform-Tailored 1-Click AI Fix Prompt Card */}
              <div
                className="vs-card"
                style={{
                  padding: '11px 12px',
                  borderColor: 'var(--vs-ink)',
                  background: 'var(--vs-surface-warm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    className="vs-eyebrow"
                    style={{ fontSize: '10px', color: 'var(--vs-ink)' }}
                  >
                    1-CLICK AI FIX PROMPT
                  </span>
                  {platformMeta ? (
                    <StatusBadge tone="pass">
                      {`AUTO-DETECTED: ${platformMeta.displayName.toUpperCase()}`}
                    </StatusBadge>
                  ) : null}
                </div>

                <div
                  className="vs-pill-group"
                  style={{ gap: '4px', marginBottom: '8px' }}
                >
                  {(
                    [
                      ['coding_agent', 'Coding Agent'],
                      ['wordpress_cms', 'WordPress'],
                      ['webflow_cms', 'Webflow'],
                      ['wix_squarespace_framer', 'Wix · Sqsp · Framer'],
                      ['shopify_liquid', 'Shopify'],
                      ['chat_assistant', 'ChatGPT / Claude'],
                    ] as const
                  ).map(([envId, label]) => {
                    const active = selectedPromptEnv === envId;
                    return (
                      <button
                        key={envId}
                        type="button"
                        className="vs-pill-btn vs-pill-btn-sm"
                        data-active={active ? 'true' : 'false'}
                        onClick={() => setSelectedPromptEnv(envId)}
                        style={{ padding: '3px 8px', fontSize: '10.5px' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="vs-btn"
                    style={{ padding: '6px 10px', fontSize: '11.5px', flex: '1 1 auto' }}
                    onClick={() => {
                      const promptArtifact = buildAiRemediationMasterPrompt({
                        domain: {
                          brand_name: audit.brandName,
                          domain_url: audit.domainUrl,
                          is_shopify: audit.shopify.isShopify,
                          shopify_mcp_status: audit.shopify.shopifyMcpStatus,
                          agents_md_status: audit.shopify.agentsMdStatus,
                          llms_txt_status: audit.probe.llmsTxtStatus,
                          robots_ai_bot_status: audit.probe.robotsAiBotStatus,
                          brand_truth_sheet: audit.brandTruthSheet,
                          visibility_score: audit.visibilityScore,
                          accuracy_score: audit.accuracyScore,
                        },
                        fixes: audit.fixes.map((f) => ({
                          fix_type: f.fixType,
                          title: f.title,
                          content_payload: f.contentPayload,
                          is_applied: false,
                          natural_quality_score: f.naturalQualityScore,
                        })),
                        snapshots: audit.scanResults,
                        crawlerReadability:
                          audit.probe.crawlerReadability ?? null,
                        targetEnv: selectedPromptEnv,
                      });
                      if (
                        typeof navigator !== 'undefined' &&
                        navigator.clipboard?.writeText
                      ) {
                        void navigator.clipboard.writeText(
                          promptArtifact.content
                        );
                      }
                      setCopiedAiPrompt(true);
                      setTimeout(() => setCopiedAiPrompt(false), 2400);
                    }}
                  >
                    {copiedAiPrompt ? '✓ Prompt Copied' : 'Copy AI Fix Prompt'}
                  </button>
                  <button
                    type="button"
                    className="vs-btn vs-btn-secondary"
                    style={{ padding: '5px 9px', fontSize: '11px' }}
                    onClick={() => {
                      const topRival =
                        sentimentAndSov?.headToHeadSov.find(
                          (r) => !r.isTargetBrand
                        )?.entityName ?? null;
                      const pageBundle = buildCitationAnswerPageBundle({
                        domain: {
                          brand_name: audit.brandName,
                          domain_url: audit.domainUrl,
                          industry_vertical: audit.industryVertical,
                          is_shopify: audit.shopify.isShopify,
                          shopify_mcp_status: audit.shopify.shopifyMcpStatus,
                          agents_md_status: audit.shopify.agentsMdStatus,
                          llms_txt_status: audit.probe.llmsTxtStatus,
                          brand_truth_sheet: audit.brandTruthSheet,
                        },
                        blueprintType: 'vs_competitor',
                        rivalName: topRival,
                        targetPrompt: audit.trackedPrompts[0] ?? null,
                        targetEnv: selectedPromptEnv,
                      });
                      if (
                        typeof navigator !== 'undefined' &&
                        navigator.clipboard?.writeText
                      ) {
                        void navigator.clipboard.writeText(
                          pageBundle.aiBuildPrompt.content
                        );
                      }
                      setCopiedRivalPagePrompt(true);
                      setTimeout(() => setCopiedRivalPagePrompt(false), 2400);
                    }}
                  >
                    {copiedRivalPagePrompt
                      ? '✓ vs. Rival Copied'
                      : 'Copy vs. Rival Prompt'}
                  </button>
                  <button
                    type="button"
                    className="vs-btn vs-btn-secondary"
                    disabled={verifyingLiveFixes}
                    style={{ padding: '5px 9px', fontSize: '11px' }}
                    onClick={async () => {
                      setVerifyingLiveFixes(true);
                      setErrorMessage(null);
                      setCopiedFollowUpPrompt(false);
                      const originToQuery = workspaceOrigin.replace(/\/$/, '');
                      try {
                        const apiRes = await fetch(
                          `${originToQuery}/api/grader`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              domain: audit.hostname,
                              forceRefresh: true,
                            }),
                            signal: AbortSignal.timeout(7500),
                          }
                        );
                        if (!apiRes.ok) {
                          const errJson = (await apiRes
                            .json()
                            .catch(() => ({}))) as { message?: string };
                          setErrorMessage(
                            errJson.message ??
                              'Unable to refresh live verification right now.'
                          );
                          return;
                        }
                        const liveSummary =
                          (await apiRes.json()) as ReadinessScanSummary;
                        const report =
                          buildLiveFixVerificationFromSummary(liveSummary);
                        setLiveVerificationReport(report);
                        setAudit((prev) =>
                          prev
                            ? {
                                ...prev,
                                visibilityScore: liveSummary.visibilityScore,
                                accuracyScore: liveSummary.accuracyScore,
                                probe: {
                                  ...prev.probe,
                                  robotsAiBotStatus:
                                    liveSummary.robotsAiBotStatus,
                                  llmsTxtStatus: liveSummary.llmsTxtStatus,
                                  detectedPlatform:
                                    liveSummary.detectedPlatform ??
                                    prev.probe.detectedPlatform,
                                },
                                shopify: {
                                  ...prev.shopify,
                                  isShopify: liveSummary.isShopify,
                                  shopifyMcpStatus:
                                    liveSummary.shopifyMcpStatus,
                                  agentsMdStatus: liveSummary.agentsMdStatus,
                                },
                              }
                            : prev
                        );
                        const passed = report.checks.filter(
                          (c) => c.live
                        ).length;
                        setStatusMessage(
                          `Verified ${passed}/4 checks live on ${report.hostname} (${liveSummary.visibilityScore}/100 Visibility)`
                        );
                      } catch {
                        setErrorMessage(
                          `Could not reach ${originToQuery}/api/grader to verify live fixes.`
                        );
                      } finally {
                        setVerifyingLiveFixes(false);
                      }
                    }}
                  >
                    {verifyingLiveFixes
                      ? 'Checking...'
                      : '✓ Verify Live Fixes'}
                  </button>
                  <button
                    type="button"
                    className="vs-btn vs-btn-secondary"
                    style={{ padding: '5px 9px', fontSize: '11px' }}
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
                    ↓ Bundle (.md)
                  </button>
                </div>
              </div>

              {liveVerificationReport ? (
                (() => {
                  const appliedSet = new Set(
                    liveVerificationReport.appliedFixTypes
                  );
                  const followUpBundle = buildFollowUpVerificationAiPrompt({
                    domain: {
                      brand_name: audit.brandName,
                      domain_url: audit.domainUrl,
                      is_shopify: audit.shopify.isShopify,
                      brand_truth_sheet: audit.brandTruthSheet,
                      visibility_score: audit.visibilityScore,
                      accuracy_score: audit.accuracyScore,
                    },
                    verification: liveVerificationReport,
                    fixes: audit.fixes.map((f) => ({
                      fix_type: f.fixType,
                      title: f.title,
                      content_payload: f.contentPayload,
                      is_applied: appliedSet.has(f.fixType),
                      natural_quality_score: f.naturalQualityScore,
                    })),
                    targetEnv: selectedPromptEnv,
                  });
                  return (
                    <div
                      className="vs-card"
                      style={{
                        padding: '10px 12px',
                        background: followUpBundle.allVerified
                          ? 'var(--vs-pass-bg)'
                          : 'var(--vs-surface)',
                        borderColor: followUpBundle.allVerified
                          ? 'var(--vs-pass-border)'
                          : 'var(--vs-border-strong)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          flexWrap: 'wrap',
                          marginBottom: '6px',
                        }}
                      >
                        <StatusBadge
                          tone={followUpBundle.allVerified ? 'pass' : 'warn'}
                        >
                          {`${followUpBundle.liveCount}/4 VERIFIED LIVE`}
                        </StatusBadge>
                        {!followUpBundle.allVerified ? (
                          <button
                            type="button"
                            className="vs-btn vs-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '10.5px' }}
                            onClick={() => {
                              if (
                                typeof navigator !== 'undefined' &&
                                navigator.clipboard?.writeText
                              ) {
                                void navigator.clipboard.writeText(
                                  followUpBundle.prompt.content
                                );
                              }
                              setCopiedFollowUpPrompt(true);
                              setTimeout(
                                () => setCopiedFollowUpPrompt(false),
                                2400
                              );
                            }}
                          >
                            {copiedFollowUpPrompt
                              ? '✓ Follow-Up Copied'
                              : `Copy Follow-Up Prompt (${followUpBundle.remainingCount} Left)`}
                          </button>
                        ) : null}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px',
                        }}
                      >
                        {followUpBundle.checkGuidance.map((chk) => (
                          <div
                            key={chk.id}
                            style={{
                              padding: '5px 7px',
                              borderRadius: '4px',
                              background: 'var(--vs-surface-subtle)',
                              border: '1px solid var(--vs-border)',
                              fontSize: '11px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <strong>
                                {chk.live ? '✓ ' : '○ '}
                                {chk.label}
                              </strong>
                              <span
                                className="vs-mono"
                                style={{
                                  fontSize: '10px',
                                  color: chk.live
                                    ? 'var(--vs-pass-fg)'
                                    : 'var(--vs-warn-fg)',
                                }}
                              >
                                {chk.live ? 'LIVE' : 'PENDING'}
                              </span>
                            </div>
                            {!chk.live ? (
                              <div
                                style={{
                                  marginTop: '3px',
                                  color: 'var(--vs-ink-secondary)',
                                  lineHeight: 1.4,
                                }}
                              >
                                {chk.troubleshootingTip}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : null}

              {commerceReadiness ? (
                <div className="vs-card" style={{ padding: '10px 12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      className="vs-eyebrow"
                      style={{ fontSize: '10px', color: 'var(--vs-ink)' }}
                    >
                      AI SHOPPING READINESS
                    </span>
                    <StatusBadge
                      tone={
                        commerceReadiness.passedCount >= 4 ? 'pass' : 'warn'
                      }
                    >
                      {`${commerceReadiness.passedCount}/${commerceReadiness.totalCount} LIVE`}
                    </StatusBadge>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {commerceReadiness.attributes.map((attr) => (
                      <div
                        key={attr.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11.5px',
                          gap: '6px',
                        }}
                      >
                        <span>{attr.label}</span>
                        <StatusBadge
                          tone={attr.liveOnSite ? 'pass' : 'neutral'}
                        >
                          {attr.liveOnSite ? 'LIVE' : 'IN BUNDLE'}
                        </StatusBadge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <details className="vs-disclosure" open={!isGuided}>
                <summary className="vs-disclosure-summary">
                  <div>
                    <strong style={{ fontSize: '12px', display: 'block' }}>
                      Individual Raw Code Files ({audit.fixes.length})
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--vs-ink-secondary)' }}>
                      Optional — already bundled inside your 1-Click AI Fix Prompt above.
                    </span>
                  </div>
                  <span className="vs-disclosure-pill">Files</span>
                </summary>
                <div
                  className="vs-disclosure-body"
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  {audit.fixes.map((fix, idx) => (
                    <CodeArtifactCard
                      key={`${fix.fixType}-${idx}`}
                      title={fix.title}
                      plainSummary={
                        isGuided ? describeFixPlainly(fix.fixType) : undefined
                      }
                      fileHint={
                        isGuided ? undefined : `Artifact Type: ${fix.fixType}`
                      }
                      code={fix.contentPayload}
                      qualityScore={fix.naturalQualityScore}
                      qualityBreakdown={fix.qualityRubricBreakdown}
                    />
                  ))}
                </div>
              </details>

              <details className="vs-disclosure" open={!isGuided}>
                <summary className="vs-disclosure-summary">
                  <div>
                    <strong style={{ fontSize: '12px', display: 'block' }}>
                      Optional AI Visitor &amp; Bot Crawl Tracker
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--vs-ink-secondary)' }}>
                      Track visits and conversions referred by ChatGPT and Perplexity.
                    </span>
                  </div>
                  <span className="vs-disclosure-pill">Code</span>
                </summary>
                <div className="vs-disclosure-body">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      className="vs-btn vs-btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '10.5px' }}
                      onClick={() => {
                        const trackerPrompt = buildAnalyticsInstallAiPrompt({
                          brandName: audit.brandName,
                          hostname: audit.hostname,
                          isShopify: audit.shopify.isShopify,
                          browserPixelSnippet: pixelPreview,
                          edgeCrawlerSnippet: edgeCrawlerPreview,
                        });
                        if (
                          typeof navigator !== 'undefined' &&
                          navigator.clipboard?.writeText
                        ) {
                          void navigator.clipboard.writeText(
                            trackerPrompt.content
                          );
                        }
                        setCopiedTrackerPrompt(true);
                        setTimeout(() => setCopiedTrackerPrompt(false), 2400);
                      }}
                    >
                      {copiedTrackerPrompt
                        ? '✓ Tracker Prompt Copied'
                        : 'Copy AI Prompt to Install Tracker'}
                    </button>
                    <div className="vs-pill-group" style={{ gap: '4px' }}>
                      <button
                        type="button"
                        className="vs-pill-btn vs-pill-btn-sm"
                        data-active={
                          attributionMode === 'browser_pixel' ? 'true' : 'false'
                        }
                        onClick={() => setAttributionMode('browser_pixel')}
                        style={{ padding: '3px 8px', fontSize: '10.5px' }}
                      >
                        Browser Pixel
                      </button>
                      <button
                        type="button"
                        className="vs-pill-btn vs-pill-btn-sm"
                        data-active={
                          attributionMode === 'edge_crawler' ? 'true' : 'false'
                        }
                        onClick={() => setAttributionMode('edge_crawler')}
                        style={{ padding: '3px 8px', fontSize: '10.5px' }}
                      >
                        Edge Bot Logger
                      </button>
                    </div>
                  </div>
                  <CodeArtifactCard
                    title={
                      attributionMode === 'browser_pixel'
                        ? '10-Line AI Referral Pixel'
                        : 'Edge AI Bot Crawl Logger'
                    }
                    fileHint={
                      attributionMode === 'browser_pixel'
                        ? 'Paste before </head> using your Console token'
                        : 'Next.js middleware.ts / Cloudflare Worker'
                    }
                    code={
                      attributionMode === 'browser_pixel'
                        ? pixelPreview
                        : edgeCrawlerPreview
                    }
                  />
                </div>
              </details>
            </div>
          ) : null}

          {activeTab === 'tab3_offsite' ? (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {isGuided ? (
                <GuidedExplainerBanner
                  stepLabel="STEP 3 · COMPETITORS & CLIENT LINKS"
                  title="See where competitors get mentioned"
                  description="Review suggested buyer prompts, external articles AI trusts, or create a shareable client audit page."
                />
              ) : null}

              {suggestedPrompts.length > 0 ? (
                <div className="vs-card" style={{ padding: '10px 12px' }}>
                  <strong
                    style={{
                      fontSize: '12.5px',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Suggested Buyer Prompts
                  </strong>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {suggestedPrompts.slice(0, 3).map((sug) => (
                      <div
                        key={sug.promptText}
                        style={{
                          padding: '7px 9px',
                          border: '1px solid var(--vs-border)',
                          borderRadius: '5px',
                          background: 'var(--vs-surface-subtle)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: '4px',
                            marginBottom: '3px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <StatusBadge
                            tone={sug.isBranded ? 'neutral' : 'pass'}
                          >
                            {sug.shortBadge}
                          </StatusBadge>
                          <StatusBadge>
                            {sug.isBranded ? 'BRANDED' : 'UNBRANDED'}
                          </StatusBadge>
                        </div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600 }}>
                          &ldquo;{sug.promptText}&rdquo;
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="vs-card" style={{ padding: '10px 12px' }}>
                <strong
                  style={{
                    fontSize: '12.5px',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
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
                    Open Private Console to run multi-engine search tracking.
                  </div>
                )}
              </div>

              <div className="vs-card" style={{ padding: '10px 12px' }}>
                <strong
                  style={{
                    fontSize: '12.5px',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  {isGuided
                    ? 'Categorized Citation Gap Domains'
                    : 'Citation Gap Source Leaderboard'}
                </strong>
                {rankedSources.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '7px',
                    }}
                  >
                    {rankedSources.map((src) => {
                      const primaryUrl =
                        src.urls[0] ?? `https://${src.sourceHost}`;
                      return (
                        <div
                          key={src.sourceHost}
                          style={{
                            padding: '7px 9px',
                            border: '1px solid var(--vs-border)',
                            borderRadius: '5px',
                            background: 'var(--vs-surface-subtle)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              marginBottom: '3px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <strong style={{ fontSize: '12px' }}>
                              {src.sourceHost}
                            </strong>
                            <div
                              style={{
                                display: 'inline-flex',
                                gap: '4px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <StatusBadge>
                                {src.sourceCategoryLabel}
                              </StatusBadge>
                              <StatusBadge
                                tone={
                                  src.ownership === 'citation_gap'
                                    ? 'critical'
                                    : 'pass'
                                }
                              >
                                {src.ownership === 'citation_gap'
                                  ? 'GAP'
                                  : src.ownership === 'co_cited'
                                    ? 'CO-CITED'
                                    : 'OWNED'}
                              </StatusBadge>
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--vs-ink-secondary)',
                              marginBottom: '3px',
                            }}
                          >
                            {src.recommendedAction}
                          </div>
                          <div
                            className="vs-mono"
                            style={{ fontSize: '11px', wordBreak: 'break-all' }}
                          >
                            <a
                              href={primaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--vs-ink-secondary)' }}
                            >
                              {primaryUrl}
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
                    No external articles cited for this sample prompt.
                  </div>
                )}
              </div>

              {/* White-Label Pitch Handoff */}
              <div className="vs-card" style={{ padding: '10px 12px' }}>
                <strong
                  style={{
                    fontSize: '12.5px',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  60-Second Branded Client Link
                </strong>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--vs-ink-secondary)',
                    margin: '0 0 8px 0',
                  }}
                >
                  Send a clean executive audit page with your agency logo and
                  booking button.
                </p>
                <a
                  href={`${cleanOrigin}/dashboard?tab=tab3_offsite&domain=${encodeURIComponent(
                    audit.hostname
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vs-btn"
                  style={{ width: '100%', fontSize: '12px', padding: '8px 12px' }}
                >
                  Create Branded Client Link →
                </a>
              </div>

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
                  <span
                    style={{ fontSize: '12px', color: 'var(--vs-ink-secondary)' }}
                  >
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
                    style={{
                      padding: '6px 8px',
                      fontSize: '12px',
                      marginBottom: '8px',
                    }}
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
      )}
    </div>
  );
}
