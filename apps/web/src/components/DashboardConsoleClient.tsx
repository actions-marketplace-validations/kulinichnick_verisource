'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  buildAgencyColdOutreachNote,
  buildAgencyColdOutreachSequence,
  buildAiAttributionSnippet,
  buildAiRemediationMasterPrompt,
  buildBatchOutreachCsv,
  buildBatchOutreachMarkdown,
  buildCitationAnswerPageBundle,
  buildEdgeBotCrawlerSnippet,
  buildExecutiveAuditReportMarkdown,
  buildImplementationBundleMarkdown,
  buildShopifyCustomerEventsPixel,
  buildTargetedCitationOutreachDraft,
  computeShopifyCheckoutKey,
  evaluateCommerceAttributeReadiness,
  generateSuggestedBuyerPrompts,
  getPromptIntentMeta,
  normalizePublicDomain,
  rankCitationGapSources,
  resolveInitialDomainScoreDeltas,
  summarizeBrandSentimentAndSov,
  summarizeEngineCitationShare,
  type AgencyPitchReportRow,
  type AiAttributionEventRow,
  type AiRemediationTargetEnv,
  type CitationPageBlueprintType,
  type CitationSnapshotRow,
  type CrawlerReadabilityReport,
  type DomainRow,
  type GeneratedFixRow,
  type LiveFixVerificationReport,
  type McpApiKeyRow,
  type ProfileRow,
  type QualityRubricBreakdown,
  type ScoreDeltaSummary,
  type TrackedPromptRow,
} from '@verisource/core-geo';
import {
  CodeArtifactCard,
  GuidedExplainerBanner,
  MetricLedgerCell,
  StatusBadge,
  ThreeTabShell,
  UxModeSwitch,
  type ThreeTabId,
  type UxMode,
} from '@verisource/ui';

function describeFixPlainly(fixType: string): string {
  switch (fixType) {
    case 'json_ld_schema':
      return 'Hidden fact-sheet code for your website header so AI engines read your real prices, products, and FAQs.';
    case 'shopify_agents_liquid':
      return 'Shopify theme file that gives AI shopping assistants your verified catalog and store rules.';
    case 'agents_md':
      return 'Plain-English instruction manual telling AI bots what you sell and what false claims to reject.';
    case 'llms_txt':
      return 'Clean 1-page directory of your key pages and policies built for AI search bots.';
    case 'fanout_faq_block':
      return 'Ready-to-publish Q&A section answering the exact questions buyers ask AI engines.';
    case 'citation_outreach_brief':
      return 'Short founder note to get your business included in third-party review and comparison articles.';
    default:
      return 'Verified copy-paste website fix.';
  }
}

function extractSafeHandoffHostname(raw?: string): string | null {
  if (!raw) return null;
  try {
    return normalizePublicDomain(raw).hostname;
  } catch {
    return null;
  }
}

export interface WorkspacePayload {
  mode: string;
  profile: ProfileRow;
  domains: DomainRow[];
  prompts: TrackedPromptRow[];
  snapshots: CitationSnapshotRow[];
  fixes: GeneratedFixRow[];
  attributionEvents: AiAttributionEventRow[];
  pitchReports: AgencyPitchReportRow[];
  mcpApiKeys: McpApiKeyRow[];
}

export function DashboardConsoleClient(props: {
  initialData: WorkspacePayload;
  initialDomainQuery?: string;
  initialTab?: string;
  upgradedPlan?: string;
  creditApplied?: boolean;
  trialActive?: boolean;
}): React.ReactElement {
  const [data, setData] = useState<WorkspacePayload>(props.initialData);
  const [selectedDomainId, setSelectedDomainId] = useState<string>(() => {
    if (props.initialDomainQuery) {
      const matched = props.initialData.domains.find((d) =>
        d.domain_url.toLowerCase().includes(props.initialDomainQuery!.toLowerCase())
      );
      if (matched) return matched.id;
    }
    return props.initialData.domains[0]?.id ?? '';
  });
  const [activeTab, setActiveTab] = useState<ThreeTabId>(() => {
    if (
      props.initialTab === 'tab1_visibility' ||
      props.initialTab === 'tab2_fixes' ||
      props.initialTab === 'tab3_offsite'
    ) {
      return props.initialTab;
    }
    return 'tab1_visibility';
  });
  const [uxMode, setUxMode] = useState<UxMode>('guided');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('vs_ux_mode');
      if (saved === 'guided' || saved === 'pro') {
        setUxMode(saved);
      }
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  function handleChangeUxMode(next: UxMode) {
    setUxMode(next);
    try {
      window.localStorage.setItem('vs_ux_mode', next);
    } catch {
      // Ignore storage restrictions
    }
  }
  const isGuided = uxMode === 'guided';

  // Domain lifecycle state
  const [newDomainUrl, setNewDomainUrl] = useState(() => {
    if (!props.initialDomainQuery) return '';
    const alreadyPresent = props.initialData.domains.some((d) =>
      d.domain_url.toLowerCase().includes(props.initialDomainQuery!.toLowerCase())
    );
    return alreadyPresent ? '' : props.initialDomainQuery;
  });
  const [addingDomain, setAddingDomain] = useState(false);
  const [rescanningDomain, setRescanningDomain] = useState(false);
  const [deletingDomain, setDeletingDomain] = useState(false);
  const [dismissedHandoffHost, setDismissedHandoffHost] = useState<
    string | null
  >(null);
  const [dismissedTrialChecklist, setDismissedTrialChecklist] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(
    props.upgradedPlan
      ? props.trialActive
        ? `7-day free trial active: ${props.upgradedPlan.toUpperCase()}${
            props.initialDomainQuery ? ` for ${props.initialDomainQuery}` : ''
          } ($0.00 charged today · 1-click cancel anytime via Manage Billing).`
        : `Plan active: ${props.upgradedPlan.toUpperCase()}${
            props.initialDomainQuery ? ` for ${props.initialDomainQuery}` : ''
          }${
            props.creditApplied
              ? ' ($19 7-day Tripwire credit applied automatically).'
              : '.'
          }`
      : null
  );

  const activeDomain: DomainRow | undefined =
    data.domains.find((d) => d.id === selectedDomainId) ?? data.domains[0];

  // Truth sheet local editable state synced to activeDomain
  const [coreOffering, setCoreOffering] = useState(
    activeDomain?.brand_truth_sheet.core_offering ?? ''
  );
  const [pricingSummary, setPricingSummary] = useState(
    activeDomain?.brand_truth_sheet.verified_pricing_summary ?? ''
  );
  const [shippingSummary, setShippingSummary] = useState(
    activeDomain?.brand_truth_sheet.shipping_or_service_area ?? ''
  );
  const [exclusionsText, setExclusionsText] = useState(
    (
      activeDomain?.brand_truth_sheet.discontinued_or_false_claims_to_flag ?? []
    ).join('\n')
  );
  const [savingTruth, setSavingTruth] = useState(false);

  // Tab 3 Buyer Prompt tracking state
  const [newPromptText, setNewPromptText] = useState('');
  const [addingPrompt, setAddingPrompt] = useState(false);
  const [scanningSuggestedPrompt, setScanningSuggestedPrompt] = useState<
    string | null
  >(null);
  const [rescanningPromptId, setRescanningPromptId] = useState<string | null>(
    null
  );
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const [attributionTab, setAttributionTab] = useState<
    'browser_pixel' | 'edge_crawler'
  >('browser_pixel');

  // Gate inline sign-in state (when unauthenticated on /dashboard)
  const [gateAuthMethod, setGateAuthMethod] = useState<
    'magic_link' | 'password'
  >('magic_link');
  const [gateEmail, setGateEmail] = useState('');
  const [gatePassword, setGatePassword] = useState('');
  const [gateSent, setGateSent] = useState(false);
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  // Tab 3 Agency White-Label Pitch generator state
  const [pitchInputMode, setPitchInputMode] = useState<'single' | 'batch'>(
    'single'
  );
  const [pitchDomain, setPitchDomain] = useState(
    () => extractSafeHandoffHostname(props.initialDomainQuery) ?? ''
  );
  const [batchPitchDomains, setBatchPitchDomains] = useState('');
  const [agencyName, setAgencyName] = useState(
    data.profile.agency_brand_name ?? 'Verisource Partner Agency'
  );
  const [agencyLogoUrl, setAgencyLogoUrl] = useState(
    data.profile.agency_logo_url ?? ''
  );
  const [agencyColor, setAgencyColor] = useState(
    data.profile.agency_primary_color ?? '#0A0E17'
  );
  const [agencyCtaUrl, setAgencyCtaUrl] = useState(
    data.profile.agency_cta_url ?? 'https://cal.com/verisource-demo/geo-audit'
  );
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [refreshingPitchSlug, setRefreshingPitchSlug] = useState<string | null>(
    null
  );
  const [copiedPitchSlug, setCopiedPitchSlug] = useState<string | null>(null);
  const [selectedPitchSlug, setSelectedPitchSlug] = useState<string>(
    () => props.initialData.pitchReports[0]?.share_slug ?? ''
  );

  // Tab 1 Hallucination Drift Alert, Weekly Executive Digest & Shopify Checkout Pixel state
  const [sendingAlert, setSendingAlert] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [verifyingFixes, setVerifyingFixes] = useState(false);
  const [lastFixVerification, setLastFixVerification] =
    useState<LiveFixVerificationReport | null>(null);
  const [scoreDeltaByDomainId, setScoreDeltaByDomainId] = useState<
    Record<string, ScoreDeltaSummary>
  >(() => resolveInitialDomainScoreDeltas(props.initialData.domains));
  const [crawlerReadabilityByDomainId, setCrawlerReadabilityByDomainId] =
    useState<Record<string, CrawlerReadabilityReport>>({});
  const [shopifyCheckoutKey, setShopifyCheckoutKey] = useState<string>('');
  const [attributionEventFilter, setAttributionEventFilter] = useState<
    'all' | 'bot_crawls' | 'human_referrals'
  >('all');
  const [sendingTestBotPing, setSendingTestBotPing] = useState(false);
  const [aiPromptTargetEnv, setAiPromptTargetEnv] =
    useState<AiRemediationTargetEnv>('coding_agent');
  const [copiedAiFixPrompt, setCopiedAiFixPrompt] = useState(false);
  const [expandedAiFixPrompt, setExpandedAiFixPrompt] = useState(false);
  const [citationBlueprintType, setCitationBlueprintType] =
    useState<CitationPageBlueprintType>('vs_competitor');
  const [customCitationRival, setCustomCitationRival] = useState('');
  const [customCitationPrompt, setCustomCitationPrompt] = useState('');
  const [copiedCitationPagePrompt, setCopiedCitationPagePrompt] =
    useState(false);
  const [copiedCitationPageMd, setCopiedCitationPageMd] = useState(false);
  const [expandedCitationPageStudio, setExpandedCitationPageStudio] =
    useState(false);
  const [lastAlertPreview, setLastAlertPreview] = useState<{
    kind?: 'drift' | 'weekly_digest';
    subject: string;
    text: string;
    html?: string;
    isWhiteLabel?: boolean;
    qualityScore: number;
    qualityBreakdown: QualityRubricBreakdown;
    mode: 'live_resend' | 'preview_dry_run';
    recipientEmail: string;
  } | null>(null);

  // Tab 3 MCP Key Minting & Revocation state
  const [keyLabel, setKeyLabel] = useState('Cursor & Antigravity Agent Key');
  const [newlyMintedRawKey, setNewlyMintedRawKey] = useState<string | null>(
    null
  );
  const [mintingKey, setMintingKey] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    let cancelled = false;

    async function syncWorkspaceForToken(token: string, email?: string | null) {
      if (cancelled) return;
      setAccessToken(token);
      setAuthEmail(email ?? null);
      try {
        document.cookie = `vs_access_token=${encodeURIComponent(
          token
        )}; Path=/; Max-Age=604800; SameSite=Lax`;
      } catch {
        // Ignore cookie write restrictions
      }
      try {
        const res = await fetch('/api/dashboard/state', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const payload = (await res.json()) as WorkspacePayload;
        if (cancelled) return;
        setData(payload);
        setScoreDeltaByDomainId((prev) => ({
          ...resolveInitialDomainScoreDeltas(payload.domains),
          ...prev,
        }));
        setSelectedDomainId((prev) => {
          if (props.initialDomainQuery) {
            const matchedQuery = payload.domains.find((d) =>
              d.domain_url
                .toLowerCase()
                .includes(props.initialDomainQuery!.toLowerCase())
            );
            if (matchedQuery) return matchedQuery.id;
          }
          if (payload.domains.some((d) => d.id === prev)) return prev;
          return payload.domains[0]?.id ?? '';
        });
        setSelectedPitchSlug((prev) => {
          if (payload.pitchReports.some((r) => r.share_slug === prev)) {
            return prev;
          }
          return payload.pitchReports[0]?.share_slug ?? '';
        });
        if (payload.profile.agency_brand_name) {
          setAgencyName(payload.profile.agency_brand_name);
        }
        if (payload.profile.agency_logo_url !== undefined) {
          setAgencyLogoUrl(payload.profile.agency_logo_url ?? '');
        }
        if (payload.profile.agency_primary_color) {
          setAgencyColor(payload.profile.agency_primary_color);
        }
        if (payload.profile.agency_cta_url) {
          setAgencyCtaUrl(payload.profile.agency_cta_url);
        }
      } catch {
        // Keep initial workspace fallback on transient network failure
      }
    }

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      const s = sessionData.session;
      if (s?.access_token) {
        void syncWorkspaceForToken(s.access_token, s.user.email);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        void syncWorkspaceForToken(session.access_token, session.user.email);
      } else {
        setAccessToken(null);
        setAuthEmail(null);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    try {
      document.cookie = 'vs_access_token=; Path=/; Max-Age=0; SameSite=Lax';
      document.cookie = 'vs_mock_session=; Path=/; Max-Age=0; SameSite=Lax';
    } catch {
      // Ignore cookie write restrictions
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.auth.signOut();
    }
    window.location.href = '/login';
  }

  async function handleGateSignIn(e: React.FormEvent) {
    e.preventDefault();
    setGateError(null);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasLiveAuth = Boolean(supabaseUrl && supabaseAnonKey);

    if (!hasLiveAuth) {
      document.cookie = 'vs_mock_session=owner; Path=/; SameSite=Lax';
      window.location.reload();
      return;
    }

    setGateLoading(true);
    try {
      const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
      if (gateAuthMethod === 'password') {
        const { data: signInRes, error: signInErr } =
          await supabase.auth.signInWithPassword({
            email: gateEmail.trim(),
            password: gatePassword,
          });
        if (signInErr || !signInRes.session) {
          setGateError(
            signInErr?.message ??
              'Invalid email or password. Switch to 1-Click Email Link if you have not set a password.'
          );
        } else {
          document.cookie = `vs_access_token=${encodeURIComponent(
            signInRes.session.access_token
          )}; Path=/; Max-Age=604800; SameSite=Lax`;
          window.location.reload();
        }
        return;
      }

      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: gateEmail.trim(),
        options: {
          emailRedirectTo: window.location.href,
        },
      });
      if (otpErr) {
        setGateError(otpErr.message);
      } else {
        setGateSent(true);
      }
    } catch {
      setGateError('Unable to authenticate right now. Please try again.');
    } finally {
      setGateLoading(false);
    }
  }

  useEffect(() => {
    setLastAlertPreview(null);
    setLastFixVerification(null);
    setSelectedEngineFilter('all');
    setCitationSourceFilter('all');
    setSelectedCitationSourceHost(null);
    setCopiedAiFixPrompt(false);
    setExpandedAiFixPrompt(false);
    setCustomCitationRival('');
    setCustomCitationPrompt('');
    setCopiedCitationPagePrompt(false);
    setCopiedCitationPageMd(false);
    setExpandedCitationPageStudio(false);
    setAiPromptTargetEnv(
      activeDomain?.is_shopify ? 'shopify_liquid' : 'coding_agent'
    );
  }, [activeDomain?.id, activeDomain?.is_shopify]);

  useEffect(() => {
    if (!activeDomain) return;
    setCoreOffering(activeDomain.brand_truth_sheet.core_offering);
    setPricingSummary(activeDomain.brand_truth_sheet.verified_pricing_summary);
    setShippingSummary(activeDomain.brand_truth_sheet.shipping_or_service_area);
    setExclusionsText(
      activeDomain.brand_truth_sheet.discontinued_or_false_claims_to_flag.join(
        '\n'
      )
    );
    let cancelled = false;
    void computeShopifyCheckoutKey({
      domainId: activeDomain.id,
      trackingPixelToken: activeDomain.tracking_pixel_token,
    }).then((key) => {
      if (!cancelled) setShopifyCheckoutKey(key);
    });
    return () => {
      cancelled = true;
    };
  }, [
    activeDomain?.id,
    activeDomain?.tracking_pixel_token,
    activeDomain?.brand_truth_sheet,
  ]);

  const domainSnapshots = data.snapshots.filter(
    (s) => s.domain_id === activeDomain?.id
  );
  const domainPrompts = data.prompts.filter(
    (p) => p.domain_id === activeDomain?.id
  );
  const domainFixes = data.fixes.filter(
    (f) => f.domain_id === activeDomain?.id
  );
  const onSiteDomainFixes = domainFixes.filter(
    (f) => f.fix_type !== 'citation_outreach_brief'
  );
  const appliedOnSiteFixesCount = onSiteDomainFixes.filter(
    (f) => f.is_applied
  ).length;
  const activeScoreDelta: ScoreDeltaSummary | null = activeDomain
    ? scoreDeltaByDomainId[activeDomain.id] ?? null
    : null;

  function recordDomainScoreDelta(
    domainId: string,
    incoming?: ScoreDeltaSummary
  ) {
    if (!incoming) return;
    setScoreDeltaByDomainId((prev) => {
      const existing = prev[domainId];
      if (
        existing &&
        incoming.visibilityDelta === 0 &&
        existing.previousVisibilityScore !== incoming.currentVisibilityScore
      ) {
        return {
          ...prev,
          [domainId]: {
            previousVisibilityScore: existing.previousVisibilityScore,
            currentVisibilityScore: incoming.currentVisibilityScore,
            visibilityDelta:
              incoming.currentVisibilityScore -
              existing.previousVisibilityScore,
            previousAccuracyScore: existing.previousAccuracyScore,
            currentAccuracyScore: incoming.currentAccuracyScore,
            accuracyDelta:
              incoming.currentAccuracyScore - existing.previousAccuracyScore,
            baselineLabel: existing.baselineLabel,
            ...(incoming.verifiedLiveChecksCount !== undefined
              ? { verifiedLiveChecksCount: incoming.verifiedLiveChecksCount }
              : {}),
          },
        };
      }
      return {
        ...prev,
        [domainId]: incoming,
      };
    });
  }
  const domainAttribution = data.attributionEvents.filter(
    (e) => e.domain_id === activeDomain?.id
  );

  const totalAiRevenueUsd = domainAttribution
    .filter((e) => e.event_type === 'ai_referral_conversion')
    .reduce((acc, e) => acc + (e.conversion_value_usd ?? 0), 0);

  const totalAiVisits = domainAttribution.filter(
    (e) => e.event_type === 'ai_referral_visit'
  ).length;

  const totalBotCrawls = domainAttribution.filter(
    (e) => e.event_type === 'ai_bot_crawl'
  ).length;

  const flaggedSnapshots = domainSnapshots.filter(
    (s) => s.hallucination_detected && (s.hallucination_details?.length ?? 0) > 0
  );

  const [selectedEngineFilter, setSelectedEngineFilter] = useState<
    'all' | 'chatgpt' | 'gemini' | 'perplexity'
  >('all');

  const activeDomainHostname = (() => {
    if (!activeDomain) return '';
    try {
      return new URL(activeDomain.domain_url).hostname
        .replace(/^www\./, '')
        .toLowerCase();
    } catch {
      return '';
    }
  })();

  const engineCitationShare = summarizeEngineCitationShare(
    domainSnapshots,
    activeDomainHostname
  );
  const visibleSnapshots =
    selectedEngineFilter === 'all'
      ? domainSnapshots
      : domainSnapshots.filter((s) => s.ai_engine === selectedEngineFilter);

  const [citationSourceFilter, setCitationSourceFilter] = useState<
    'all' | 'citation_gap' | 'co_cited_or_owned'
  >('all');
  const [selectedCitationSourceHost, setSelectedCitationSourceHost] = useState<
    string | null
  >(null);
  const [copiedCitationUrl, setCopiedCitationUrl] = useState<string | null>(
    null
  );

  const activeCrawlerReadability: CrawlerReadabilityReport | null = activeDomain
    ? crawlerReadabilityByDomainId[activeDomain.id] ?? null
    : null;

  const brandSentimentAndSov = activeDomain
    ? summarizeBrandSentimentAndSov({
        brandName: activeDomain.brand_name,
        snapshots: domainSnapshots,
      })
    : null;

  const commerceReadiness = activeDomain
    ? evaluateCommerceAttributeReadiness({
        domain: activeDomain,
        fixes: domainFixes,
      })
    : null;

  const aiRemediationMasterPrompt = activeDomain
    ? buildAiRemediationMasterPrompt({
        domain: activeDomain,
        fixes: domainFixes,
        snapshots: domainSnapshots,
        crawlerReadability: activeCrawlerReadability,
        targetEnv: aiPromptTargetEnv,
      })
    : null;

  const suggestedBuyerPrompts =
    activeDomain && brandSentimentAndSov
      ? generateSuggestedBuyerPrompts({
          hostname: activeDomainHostname,
          brandName: activeDomain.brand_name,
          coreOffering: activeDomain.brand_truth_sheet.core_offering,
          pricingSummary:
            activeDomain.brand_truth_sheet.verified_pricing_summary,
          shippingOrServiceArea:
            activeDomain.brand_truth_sheet.shipping_or_service_area,
          isShopify: activeDomain.is_shopify,
          topRivals: brandSentimentAndSov.headToHeadSov
            .filter((r) => !r.isTargetBrand)
            .map((r) => r.entityName),
          existingPrompts: domainPrompts.map((p) => p.prompt_text),
        })
      : [];

  const detectedRivalNames = (brandSentimentAndSov?.headToHeadSov ?? [])
    .filter((r) => !r.isTargetBrand)
    .map((r) => r.entityName);

  const effectiveRivalForStudio =
    customCitationRival.trim() ||
    detectedRivalNames[0] ||
    'Category Alternatives';

  const effectivePromptForStudio =
    customCitationPrompt.trim() ||
    domainPrompts[0]?.prompt_text ||
    suggestedBuyerPrompts[0]?.promptText ||
    '';

  const matchingStudioPromptRow = domainPrompts.find(
    (p) => p.prompt_text === effectivePromptForStudio
  );
  const studioFanouts =
    matchingStudioPromptRow &&
    matchingStudioPromptRow.decompiled_fanout_queries.length > 0
      ? matchingStudioPromptRow.decompiled_fanout_queries
      : domainPrompts.flatMap((p) => p.decompiled_fanout_queries).slice(0, 4);

  const activeCitationPageBundle = activeDomain
    ? buildCitationAnswerPageBundle({
        domain: activeDomain,
        blueprintType: citationBlueprintType,
        rivalName: effectiveRivalForStudio,
        targetPrompt: effectivePromptForStudio,
        fanoutSubQueries: studioFanouts,
        targetEnv: aiPromptTargetEnv,
      })
    : null;

  const rankedCitationSources = activeDomain
    ? rankCitationGapSources({
        targetHostname: activeDomainHostname,
        snapshots: domainSnapshots,
      })
    : [];

  const citationGapCount = rankedCitationSources.filter(
    (s) => s.ownership === 'citation_gap'
  ).length;

  const filteredCitationSources =
    citationSourceFilter === 'all'
      ? rankedCitationSources
      : citationSourceFilter === 'citation_gap'
        ? rankedCitationSources.filter((s) => s.ownership === 'citation_gap')
        : rankedCitationSources.filter((s) => s.ownership !== 'citation_gap');

  const activeOutreachTarget =
    rankedCitationSources.find(
      (s) =>
        s.sourceHost === selectedCitationSourceHost && s.ownership !== 'owned'
    ) ?? null;

  const targetedCitationOutreach =
    activeDomain && activeOutreachTarget && activeOutreachTarget.urls[0]
      ? buildTargetedCitationOutreachDraft({
          brandName: activeDomain.brand_name,
          hostname: activeDomainHostname,
          coreOffering: activeDomain.brand_truth_sheet.core_offering,
          pricingSummary: activeDomain.brand_truth_sheet.verified_pricing_summary,
          sourceHost: activeOutreachTarget.sourceHost,
          targetUrl: activeOutreachTarget.urls[0],
          enginesCiting: activeOutreachTarget.enginesCiting,
          rivalsFed: activeOutreachTarget.rivalsFed,
        })
      : null;

  async function handleCopyCitationSourceUrl(url: string) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedCitationUrl(url);
      setTimeout(() => {
        setCopiedCitationUrl((prev) => (prev === url ? null : prev));
      }, 2200);
    } catch {
      // Ignore clipboard permission denial
    }
  }

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const handoffHostname = (() => {
    if (props.upgradedPlan) return null;
    const candidate = extractSafeHandoffHostname(props.initialDomainQuery);
    if (!candidate || dismissedHandoffHost === candidate) return null;
    const alreadyInWorkspace = data.domains.some((d) =>
      d.domain_url.toLowerCase().includes(candidate)
    );
    return alreadyInWorkspace ? null : candidate;
  })();

  const isProtectedDemoSeedDomain =
    data.mode === 'mock' &&
    Boolean(
      activeDomain &&
        (activeDomain.id === '11111111-1111-4000-8000-000000000001' ||
          activeDomain.id === '22222222-2222-4000-8000-000000000002')
    );

  async function scanDomainIntoWorkspace(rawDomain: string) {
    const trimmed = rawDomain.trim();
    if (!trimmed) return;
    setAddingDomain(true);
    setBannerError(null);
    try {
      const res = await fetch('/api/dashboard/domains', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ domain_url: trimmed }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        alreadyExists?: boolean;
        domain?: DomainRow;
        prompts?: TrackedPromptRow[];
        snapshots?: CitationSnapshotRow[];
        fixes?: GeneratedFixRow[];
        crawlerReadability?: CrawlerReadabilityReport;
      };
      if (!res.ok || json.error || !json.domain) {
        setBannerError(json.message ?? 'Could not add domain.');
      } else if (json.alreadyExists) {
        setSelectedDomainId(json.domain.id);
        setNewDomainUrl('');
      } else {
        if (json.crawlerReadability) {
          setCrawlerReadabilityByDomainId((prev) => ({
            ...prev,
            [json.domain!.id]: json.crawlerReadability!,
          }));
        }
        setData((prev) => ({
          ...prev,
          domains: [...prev.domains, json.domain!],
          prompts: [...prev.prompts, ...(json.prompts ?? [])],
          snapshots: [...(json.snapshots ?? []), ...prev.snapshots],
          fixes: [...(json.fixes ?? []), ...prev.fixes],
        }));
        setSelectedDomainId(json.domain.id);
        setNewDomainUrl('');
        setBannerSuccess(
          `Scanned ${json.domain.brand_name} and generated syntax-validated site fixes.`
        );
      }
    } catch {
      setBannerError('Network error while scanning new domain.');
    } finally {
      setAddingDomain(false);
    }
  }

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault();
    await scanDomainIntoWorkspace(newDomainUrl);
  }

  async function handleRescanDomain() {
    if (!activeDomain) return;
    setRescanningDomain(true);
    setBannerError(null);
    try {
      const res = await fetch('/api/dashboard/domains', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ domain_id: activeDomain.id }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        domain?: DomainRow;
        snapshots?: CitationSnapshotRow[];
        fixes?: GeneratedFixRow[];
        scoreDelta?: ScoreDeltaSummary;
        crawlerReadability?: CrawlerReadabilityReport;
      };
      if (!res.ok || json.error || !json.domain) {
        setBannerError(json.message ?? 'Unable to re-scan domain.');
      } else {
        recordDomainScoreDelta(json.domain.id, json.scoreDelta);
        if (json.crawlerReadability) {
          setCrawlerReadabilityByDomainId((prev) => ({
            ...prev,
            [json.domain!.id]: json.crawlerReadability!,
          }));
        }
        setData((prev) => ({
          ...prev,
          domains: prev.domains.map((d) =>
            d.id === json.domain!.id ? json.domain! : d
          ),
          snapshots: [
            ...(json.snapshots ?? []),
            ...prev.snapshots.filter((s) => s.domain_id !== json.domain!.id),
          ],
          fixes: [
            ...(json.fixes ?? []),
            ...prev.fixes.filter((f) => f.domain_id !== json.domain!.id),
          ],
        }));
        const deltaNote =
          json.scoreDelta && json.scoreDelta.visibilityDelta !== 0
            ? ` (${json.scoreDelta.previousVisibilityScore} → ${json.scoreDelta.currentVisibilityScore}, ${json.scoreDelta.visibilityDelta > 0 ? '+' : ''}${json.scoreDelta.visibilityDelta} pts)`
            : '';
        setBannerSuccess(
          `Re-scanned ${json.domain.brand_name}: ${json.domain.visibility_score}/100 visibility${deltaNote}, ${json.domain.accuracy_score}% accuracy.`
        );
      }
    } catch {
      setBannerError('Network error while re-scanning domain.');
    } finally {
      setRescanningDomain(false);
    }
  }

  async function handleDeleteDomain() {
    if (!activeDomain) return;
    const targetId = activeDomain.id;
    const targetBrand = activeDomain.brand_name;
    setDeletingDomain(true);
    setBannerError(null);
    try {
      const res = await fetch(
        `/api/dashboard/domains?id=${encodeURIComponent(targetId)}`,
        {
          method: 'DELETE',
          headers: authHeaders,
        }
      );
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        deleted?: boolean;
      };
      if (!res.ok || json.error || !json.deleted) {
        setBannerError(json.message ?? 'Unable to remove domain.');
      } else {
        const remaining = data.domains.filter((d) => d.id !== targetId);
        setData((prev) => ({
          ...prev,
          domains: prev.domains.filter((d) => d.id !== targetId),
          prompts: prev.prompts.filter((p) => p.domain_id !== targetId),
          snapshots: prev.snapshots.filter((s) => s.domain_id !== targetId),
          fixes: prev.fixes.filter((f) => f.domain_id !== targetId),
          attributionEvents: prev.attributionEvents.filter(
            (e) => e.domain_id !== targetId
          ),
        }));
        setSelectedDomainId(remaining[0]?.id ?? '');
        setBannerSuccess(
          `Removed ${targetBrand} and purged its crawl snapshots from your workspace.`
        );
      }
    } catch {
      setBannerError('Network error while removing domain.');
    } finally {
      setDeletingDomain(false);
    }
  }

  async function handleAddPrompt(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDomain || !newPromptText.trim()) return;
    setAddingPrompt(true);
    setBannerError(null);
    try {
      const res = await fetch('/api/dashboard/prompts', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          domain_id: activeDomain.id,
          prompt_text: newPromptText.trim(),
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        prompt?: TrackedPromptRow;
        snapshots?: CitationSnapshotRow[];
      };
      if (!res.ok || json.error || !json.prompt) {
        setBannerError(json.message ?? 'Unable to add buyer prompt.');
      } else {
        setData((prev) => ({
          ...prev,
          prompts: [...prev.prompts, json.prompt!],
          snapshots: [...(json.snapshots ?? []), ...prev.snapshots],
        }));
        setNewPromptText('');
        setBannerSuccess(
          `Tracked buyer prompt across ChatGPT, Gemini, and Perplexity (${
            json.snapshots?.length ?? 3
          } snapshots recorded).`
        );
      }
    } catch {
      setBannerError('Network error while scanning buyer prompt.');
    } finally {
      setAddingPrompt(false);
    }
  }

  async function handleTrackSuggestedPrompt(
    promptText: string,
    intentCategory: string
  ) {
    if (!activeDomain) return;
    setScanningSuggestedPrompt(promptText);
    setBannerError(null);
    try {
      const res = await fetch('/api/dashboard/prompts', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          domain_id: activeDomain.id,
          prompt_text: promptText,
          intent_category: intentCategory,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        prompt?: TrackedPromptRow;
        snapshots?: CitationSnapshotRow[];
      };
      if (!res.ok || json.error || !json.prompt) {
        setBannerError(json.message ?? 'Unable to track suggested buyer prompt.');
      } else {
        setData((prev) => ({
          ...prev,
          prompts: [...prev.prompts, json.prompt!],
          snapshots: [...(json.snapshots ?? []), ...prev.snapshots],
        }));
        setBannerSuccess(
          `Tracked "${json.prompt.prompt_text}" across ChatGPT, Gemini, and Perplexity (${
            json.snapshots?.length ?? 3
          } snapshots recorded).`
        );
      }
    } catch {
      setBannerError('Network error while scanning suggested buyer prompt.');
    } finally {
      setScanningSuggestedPrompt(null);
    }
  }

  async function handleRescanPrompt(promptId: string) {
    setRescanningPromptId(promptId);
    setBannerError(null);
    try {
      const res = await fetch('/api/dashboard/prompts', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ prompt_id: promptId }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        prompt?: TrackedPromptRow;
        snapshots?: CitationSnapshotRow[];
      };
      if (!res.ok || json.error || !json.prompt) {
        setBannerError(json.message ?? 'Unable to re-scan buyer prompt.');
      } else {
        setData((prev) => ({
          ...prev,
          prompts: prev.prompts.map((p) =>
            p.id === json.prompt!.id ? json.prompt! : p
          ),
          snapshots: [
            ...(json.snapshots ?? []),
            ...prev.snapshots.filter((s) => s.prompt_id !== json.prompt!.id),
          ],
        }));
        setBannerSuccess(
          `Re-scanned "${json.prompt.prompt_text}" across ChatGPT, Gemini, and Perplexity.`
        );
      }
    } catch {
      setBannerError('Network error while re-scanning buyer prompt.');
    } finally {
      setRescanningPromptId(null);
    }
  }

  async function handleDeletePrompt(promptId: string, promptText: string) {
    setDeletingPromptId(promptId);
    setBannerError(null);
    try {
      const res = await fetch(
        `/api/dashboard/prompts?id=${encodeURIComponent(promptId)}`,
        {
          method: 'DELETE',
          headers: authHeaders,
        }
      );
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        deleted?: boolean;
      };
      if (!res.ok || json.error || !json.deleted) {
        setBannerError(json.message ?? 'Unable to remove tracked prompt.');
      } else {
        setData((prev) => ({
          ...prev,
          prompts: prev.prompts.filter((p) => p.id !== promptId),
          snapshots: prev.snapshots.filter((s) => s.prompt_id !== promptId),
        }));
        setBannerSuccess(
          `Removed "${promptText}" from your tracked prompt quota.`
        );
      }
    } catch {
      setBannerError('Network error while removing tracked prompt.');
    } finally {
      setDeletingPromptId(null);
    }
  }

  function handleExportExecutiveAuditReport() {
    if (!activeDomain) return;
    const artifact = buildExecutiveAuditReportMarkdown({
      domain: activeDomain,
      snapshots: domainSnapshots,
      fixes: domainFixes,
      trackedPrompts: domainPrompts.map((p) => p.prompt_text),
      crawlerReadability: activeCrawlerReadability,
      aiReferralVisits: totalAiVisits,
      aiReferralRevenueUsd: totalAiRevenueUsd,
      aiBotCrawls: totalBotCrawls,
      suggestedPrompts: suggestedBuyerPrompts,
    });
    const hostSlug =
      activeDomainHostname.replace(/[^a-z0-9.-]/g, '') || 'domain';
    const blob = new Blob([artifact.content], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hostSlug}-ai-search-audit.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setBannerSuccess(
      `Exported Executive AI Search Report as ${hostSlug}-ai-search-audit.md.`
    );
  }

  async function handleSendTestBotPing() {
    if (!activeDomain) return;
    setSendingTestBotPing(true);
    setBannerError(null);
    try {
      const hmacKey =
        shopifyCheckoutKey ||
        (await computeShopifyCheckoutKey({
          domainId: activeDomain.id,
          trackingPixelToken: activeDomain.tracking_pixel_token,
        }));
      const res = await fetch('/api/pixel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeDomain.tracking_pixel_token,
          checkout_key: hmacKey,
          event_type: 'ai_bot_crawl',
          source_engine:
            'Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)',
          landing_path: '/agents.md',
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        id?: string;
        event_type?: AiAttributionEventRow['event_type'];
        source_engine?: string;
      };
      if (!res.ok || json.error) {
        setBannerError('Unable to record test AI bot crawl ping.');
      } else {
        const createdRow: AiAttributionEventRow = {
          id: json.id ?? crypto.randomUUID(),
          domain_id: activeDomain.id,
          event_type: 'ai_bot_crawl',
          source_engine: json.source_engine ?? 'GPTBot',
          landing_path: '/agents.md',
          conversion_value_usd: null,
          created_at: new Date().toISOString(),
        };
        setData((prev) => ({
          ...prev,
          attributionEvents: [createdRow, ...prev.attributionEvents],
        }));
        setBannerSuccess(
          `Verified live HMAC ingestion: recorded GPTBot crawl on /agents.md for ${activeDomain.brand_name}.`
        );
      }
    } catch {
      setBannerError('Network error sending test AI bot crawl ping.');
    } finally {
      setSendingTestBotPing(false);
    }
  }

  async function handleCopyAiRemediationPrompt() {
    if (!aiRemediationMasterPrompt) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(aiRemediationMasterPrompt.content);
      }
      setCopiedAiFixPrompt(true);
      setTimeout(() => setCopiedAiFixPrompt(false), 2600);
    } catch {
      // Ignore clipboard permission denial
    }
  }

  function handleDownloadAiRemediationPrompt() {
    if (!aiRemediationMasterPrompt) return;
    const hostSlug =
      activeDomainHostname.replace(/[^a-z0-9.-]/g, '') || 'domain';
    const blob = new Blob([aiRemediationMasterPrompt.content], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hostSlug}-ai-remediation-prompt.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleCopyCitationPageAiPrompt() {
    if (!activeCitationPageBundle) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(
          activeCitationPageBundle.aiBuildPrompt.content
        );
      }
      setCopiedCitationPagePrompt(true);
      setTimeout(() => setCopiedCitationPagePrompt(false), 2600);
    } catch {
      // Ignore clipboard permission denial
    }
  }

  async function handleCopyCitationPageMarkdown() {
    if (!activeCitationPageBundle) return;
    const combined = `${activeCitationPageBundle.markdownPage.content}\n\n<!-- Page-Specific FAQPage JSON-LD -->\n<script type="application/ld+json">\n${activeCitationPageBundle.faqJsonLd}\n</script>\n`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(combined);
      }
      setCopiedCitationPageMd(true);
      setTimeout(() => setCopiedCitationPageMd(false), 2600);
    } catch {
      // Ignore clipboard permission denial
    }
  }

  function handleDownloadCitationPageMarkdown() {
    if (!activeCitationPageBundle) return;
    const fileSlug =
      activeCitationPageBundle.suggestedPath
        .replace(/^\/+/, '')
        .replace(/[^a-z0-9-]+/gi, '-') || 'citation-answer-page';
    const combined = `${activeCitationPageBundle.markdownPage.content}\n\n<!-- Page-Specific FAQPage JSON-LD -->\n<script type="application/ld+json">\n${activeCitationPageBundle.faqJsonLd}\n</script>\n`;
    const blob = new Blob([combined], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileSlug}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleVerifyTruthSheet(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDomain) return;
    setSavingTruth(true);
    setBannerError(null);
    try {
      const updatedTruth = {
        ...activeDomain.brand_truth_sheet,
        is_user_verified: true,
        core_offering: coreOffering,
        verified_pricing_summary: pricingSummary,
        shipping_or_service_area: shippingSummary,
        discontinued_or_false_claims_to_flag: exclusionsText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean),
      };

      const res = await fetch('/api/dashboard/truth-sheet', {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          domain_id: activeDomain.id,
          brand_truth_sheet: updatedTruth,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        domain?: DomainRow;
        fixes?: GeneratedFixRow[];
        scoreDelta?: ScoreDeltaSummary;
      };
      if (!res.ok || json.error || !json.domain) {
        setBannerError(json.message ?? 'Unable to save Brand Truth Sheet.');
      } else {
        recordDomainScoreDelta(json.domain.id, json.scoreDelta);
        setData((prev) => ({
          ...prev,
          domains: prev.domains.map((d) =>
            d.id === json.domain!.id ? json.domain! : d
          ),
          fixes: [
            ...(json.fixes ?? []),
            ...prev.fixes.filter((f) => f.domain_id !== json.domain!.id),
          ],
        }));
        setBannerSuccess(
          `Verified Brand Truth Sheet for ${json.domain.brand_name} and regenerated syntax-validated schema & /agents.md fixes.`
        );
      }
    } catch {
      setBannerError('Network error updating Brand Truth Sheet.');
    } finally {
      setSavingTruth(false);
    }
  }

  async function handleGeneratePitchLink(e: React.FormEvent) {
    e.preventDefault();
    setGeneratingPitch(true);
    setBannerError(null);
    try {
      const payload =
        pitchInputMode === 'batch'
          ? {
              prospect_domains: batchPitchDomains,
              agency_brand_name: agencyName,
              agency_logo_url: agencyLogoUrl,
              agency_primary_color: agencyColor,
              agency_cta_url: agencyCtaUrl,
            }
          : {
              prospect_domain: pitchDomain,
              agency_brand_name: agencyName,
              agency_logo_url: agencyLogoUrl,
              agency_primary_color: agencyColor,
              agency_cta_url: agencyCtaUrl,
            };

      const res = await fetch('/api/dashboard/pitch', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        report?: AgencyPitchReportRow;
        reports?: AgencyPitchReportRow[];
        share_url?: string;
      };
      const minted =
        json.reports && json.reports.length > 0
          ? json.reports
          : json.report
            ? [json.report]
            : [];
      if (!res.ok || json.error || minted.length === 0) {
        setBannerError(json.message ?? 'Unable to generate pitch link.');
      } else {
        setData((prev) => ({
          ...prev,
          pitchReports: [...minted, ...prev.pitchReports],
        }));
        setSelectedPitchSlug(minted[0]!.share_slug);
        setBannerSuccess(
          minted.length > 1
            ? `Minted ${minted.length} white-label /audit/[slug] reports with fact-verified outreach notes. Use Export CSV or Playbook (.md) to download.`
            : `60-Second White-Label Pitch Link & cold outreach note ready: ${json.share_url}`
        );
      }
    } catch {
      setBannerError('Network error generating pitch report.');
    } finally {
      setGeneratingPitch(false);
    }
  }

  async function handleRefreshPitchReport(shareSlug: string) {
    setRefreshingPitchSlug(shareSlug);
    setBannerError(null);
    try {
      const res = await fetch('/api/dashboard/pitch', {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ share_slug: shareSlug }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        report?: AgencyPitchReportRow;
        share_url?: string;
      };
      if (!res.ok || json.error || !json.report) {
        setBannerError(json.message ?? 'Unable to refresh pitch report.');
      } else {
        setData((prev) => ({
          ...prev,
          pitchReports: prev.pitchReports.map((r) =>
            r.share_slug === json.report!.share_slug ? json.report! : r
          ),
        }));
        setSelectedPitchSlug(json.report.share_slug);
        setBannerSuccess(
          `Refreshed /audit/${json.report.share_slug} in-place (${json.report.visibility_score}/100 visibility · link preserved).`
        );
      }
    } catch {
      setBannerError('Network error while refreshing pitch report.');
    } finally {
      setRefreshingPitchSlug(null);
    }
  }

  async function handleCopyPitchShareUrl(shareSlug: string) {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/audit/${shareSlug}`
        : `https://verisource.dev/audit/${shareSlug}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (typeof document !== 'undefined') {
        const temp = document.createElement('textarea');
        temp.value = shareUrl;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      setCopiedPitchSlug(shareSlug);
      setTimeout(() => {
        setCopiedPitchSlug((prev) => (prev === shareSlug ? null : prev));
      }, 2000);
    } catch {
      // Ignore clipboard permission errors in restricted contexts
    }
  }

  async function handleMintMcpKey(e: React.FormEvent) {
    e.preventDefault();
    setMintingKey(true);
    setBannerError(null);
    try {
      const res = await fetch('/api/dashboard/mcp-keys', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ label: keyLabel }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        keyRow?: McpApiKeyRow;
        rawKeyOnce?: string;
        sandboxNotice?: string;
      };
      if (!res.ok || json.error || !json.keyRow || !json.rawKeyOnce) {
        setBannerError(json.message ?? 'Unable to mint MCP key.');
      } else {
        setNewlyMintedRawKey(json.rawKeyOnce);
        setData((prev) => ({
          ...prev,
          mcpApiKeys: [json.keyRow!, ...prev.mcpApiKeys],
        }));
        if (json.sandboxNotice) {
          setBannerSuccess(json.sandboxNotice);
        }
      }
    } finally {
      setMintingKey(false);
    }
  }

  async function handleRevokeMcpKey(keyId: string) {
    setRevokingKeyId(keyId);
    setBannerError(null);
    try {
      const res = await fetch(
        `/api/dashboard/mcp-keys?id=${encodeURIComponent(keyId)}`,
        {
          method: 'DELETE',
          headers: authHeaders,
        }
      );
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        revoked?: boolean;
      };
      if (!res.ok || json.error || !json.revoked) {
        setBannerError(json.message ?? 'Unable to revoke MCP key.');
      } else {
        setData((prev) => ({
          ...prev,
          mcpApiKeys: prev.mcpApiKeys.map((k) =>
            k.id === keyId ? { ...k, is_active: false } : k
          ),
        }));
        setBannerSuccess(
          'Revoked MCP Bearer key. Edge calls with that token now return HTTP 401.'
        );
      }
    } catch {
      setBannerError('Network error while revoking MCP key.');
    } finally {
      setRevokingKeyId(null);
    }
  }

  async function handleSendDriftAlert() {
    if (!activeDomain) return;
    setSendingAlert(true);
    setBannerError(null);
    try {
      const res = await fetch('/api/dashboard/alerts', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ domain_id: activeDomain.id }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        delivered?: boolean;
        mode?: 'live_resend' | 'preview_dry_run';
        recipientEmail?: string;
        subject?: string;
        text?: string;
        qualityScore?: number;
        qualityBreakdown?: QualityRubricBreakdown;
      };
      if (
        !res.ok ||
        json.error ||
        !json.subject ||
        !json.text ||
        json.qualityScore === undefined ||
        !json.qualityBreakdown
      ) {
        setBannerError(
          json.message ?? 'Unable to dispatch hallucination drift alert.'
        );
      } else {
        const mode = json.mode ?? 'preview_dry_run';
        const recipient = json.recipientEmail ?? data.profile.email;
        setLastAlertPreview({
          kind: 'drift',
          subject: json.subject,
          text: json.text,
          qualityScore: json.qualityScore,
          qualityBreakdown: json.qualityBreakdown,
          mode,
          recipientEmail: recipient,
        });
        setBannerSuccess(
          mode === 'live_resend'
            ? `Dispatched hallucination drift alert to ${recipient} via Resend.`
            : `Generated drift-alert preview for ${recipient}. Set RESEND_API_KEY for automated weekly delivery.`
        );
      }
    } catch {
      setBannerError('Network error while dispatching drift alert.');
    } finally {
      setSendingAlert(false);
    }
  }

  async function handleSendWeeklyDigest() {
    if (!activeDomain) return;
    setSendingDigest(true);
    setBannerError(null);
    try {
      const res = await fetch('/api/dashboard/digest', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ domain_id: activeDomain.id }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        delivered?: boolean;
        mode?: 'live_resend' | 'preview_dry_run';
        recipientEmail?: string;
        subject?: string;
        text?: string;
        html?: string;
        isWhiteLabel?: boolean;
        qualityScore?: number;
        qualityBreakdown?: QualityRubricBreakdown;
      };
      if (
        !res.ok ||
        json.error ||
        !json.subject ||
        !json.text ||
        json.qualityScore === undefined ||
        !json.qualityBreakdown
      ) {
        setBannerError(
          json.message ?? 'Unable to generate weekly executive digest.'
        );
      } else {
        const mode = json.mode ?? 'preview_dry_run';
        const recipient = json.recipientEmail ?? data.profile.email;
        setLastAlertPreview({
          kind: 'weekly_digest',
          subject: json.subject,
          text: json.text,
          html: json.html,
          isWhiteLabel: json.isWhiteLabel,
          qualityScore: json.qualityScore,
          qualityBreakdown: json.qualityBreakdown,
          mode,
          recipientEmail: recipient,
        });
        setBannerSuccess(
          mode === 'live_resend'
            ? `Dispatched weekly executive digest to ${recipient} via Resend.`
            : `Generated forward-ready weekly executive digest for ${recipient}.`
        );
      }
    } catch {
      setBannerError('Network error while generating weekly executive digest.');
    } finally {
      setSendingDigest(false);
    }
  }

  function handleDownloadDigestHtml() {
    if (!lastAlertPreview?.html || !activeDomain) return;
    const hostSlug = new URL(activeDomain.domain_url).hostname.replace(
      /[^a-z0-9.-]+/gi,
      '-'
    );
    const blob = new Blob([lastAlertPreview.html], {
      type: 'text/html;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${hostSlug}-weekly-geo-digest.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleVerifyLiveFixes() {
    if (!activeDomain) return;
    setVerifyingFixes(true);
    setBannerError(null);
    try {
      const res = await fetch('/api/dashboard/verify-fixes', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ domain_id: activeDomain.id }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        verification?: LiveFixVerificationReport;
        domain?: DomainRow;
        appliedFixIds?: string[];
        scoreDelta?: ScoreDeltaSummary;
      };
      if (!res.ok || json.error || !json.verification || !json.domain) {
        setBannerError(
          json.message ?? 'Unable to verify live fix deployment.'
        );
      } else {
        const appliedIdSet = new Set(json.appliedFixIds ?? []);
        recordDomainScoreDelta(json.domain.id, json.scoreDelta);
        setLastFixVerification(json.verification);
        setData((prev) => ({
          ...prev,
          domains: prev.domains.map((d) =>
            d.id === json.domain!.id ? json.domain! : d
          ),
          fixes: prev.fixes.map((f) =>
            f.domain_id === json.domain!.id
              ? { ...f, is_applied: appliedIdSet.has(f.id) }
              : f
          ),
        }));
        const liveCheckCount = json.verification.checks.filter(
          (c) => c.live
        ).length;
        const deltaText =
          json.scoreDelta && json.scoreDelta.visibilityDelta !== 0
            ? `${json.scoreDelta.previousVisibilityScore} → ${json.scoreDelta.currentVisibilityScore}/100 (${json.scoreDelta.visibilityDelta > 0 ? '+' : ''}${json.scoreDelta.visibilityDelta} pts)`
            : `${json.domain.visibility_score}/100`;
        setBannerSuccess(
          `Verified ${liveCheckCount}/4 on-site checks live on ${json.verification.hostname} (${appliedIdSet.size} artifact(s) marked live · Visibility ${deltaText}).`
        );
      }
    } catch {
      setBannerError('Network error while verifying live fixes.');
    } finally {
      setVerifyingFixes(false);
    }
  }

  function handleDownloadFixBundle() {
    if (!activeDomain || domainFixes.length === 0) return;
    const bundleMarkdown = buildImplementationBundleMarkdown({
      domain: activeDomain,
      fixes: domainFixes,
    });
    const hostSlug = new URL(activeDomain.domain_url).hostname.replace(
      /[^a-z0-9.-]+/gi,
      '-'
    );
    const blob = new Blob([bundleMarkdown], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${hostSlug}-verisource-geo-bundle.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportOutreachCsv() {
    if (data.pitchReports.length === 0) return;
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://verisource.dev';
    const csvContent = buildBatchOutreachCsv(data.pitchReports, origin);
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'verisource-outreach-batch.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportOutreachPlaybook() {
    if (data.pitchReports.length === 0) return;
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://verisource.dev';
    const playbook = buildBatchOutreachMarkdown(data.pitchReports, origin);
    const blob = new Blob([playbook.content], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'verisource-outreach-playbook.md';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const selectedPitchReport: AgencyPitchReportRow | undefined =
    data.pitchReports.find((r) => r.share_slug === selectedPitchSlug) ??
    data.pitchReports[0];

  const [selectedOutreachTouch, setSelectedOutreachTouch] = useState<
    'day0' | 'day3' | 'day7'
  >('day0');

  const pitchOutreachSequence = selectedPitchReport
    ? buildAgencyColdOutreachSequence(
        selectedPitchReport,
        'https://verisource.dev'
      )
    : null;

  const pitchOutreachArtifact = pitchOutreachSequence
    ? pitchOutreachSequence[selectedOutreachTouch]
    : selectedPitchReport
      ? buildAgencyColdOutreachNote(
          selectedPitchReport,
          'https://verisource.dev'
        )
      : null;

  const pixelSnippet = activeDomain
    ? buildAiAttributionSnippet({
        trackingPixelToken: activeDomain.tracking_pixel_token,
        ingestionUrl: 'https://verisource.dev/api/pixel',
      })
    : '';

  const shopifyCheckoutPixel =
    activeDomain?.is_shopify && shopifyCheckoutKey
      ? buildShopifyCustomerEventsPixel({
          trackingPixelToken: activeDomain.tracking_pixel_token,
          checkoutKey: shopifyCheckoutKey,
          ingestionUrl: 'https://verisource.dev/api/pixel',
        })
      : '';

  const edgeCrawlerSnippet = activeDomain
    ? buildEdgeBotCrawlerSnippet({
        trackingPixelToken: activeDomain.tracking_pixel_token,
        checkoutKey: shopifyCheckoutKey || 'pending_hmac_key',
        ingestionUrl: 'https://verisource.dev/api/pixel',
      })
    : '';

  const mcpClientConfigJson = JSON.stringify(
    {
      mcpServers: {
        verisource: {
          url: 'https://mcp.verisource.dev/mcp',
          headers: {
            Authorization: `Bearer ${
              newlyMintedRawKey ?? 'vs_demo_pro_key'
            }`,
          },
        },
      },
    },
    null,
    2
  );

  const gateDomainParam = extractSafeHandoffHostname(props.initialDomainQuery);
  const buildGateCheckoutHref = (
    plan: 'tripwire_19' | 'starter_49' | 'pro_99' | 'agency_249',
    cycle: 'one_time' | 'monthly'
  ): string => {
    const qs = new URLSearchParams({ plan, cycle });
    if (gateDomainParam) qs.set('domain', gateDomainParam);
    if (accessToken) qs.set('access_token', accessToken);
    return `/api/checkout?${qs.toString()}`;
  };

  if (
    data.mode === 'unauthenticated_locked' ||
    data.mode === 'plan_activation_required'
  ) {
    const isPlanActivation = data.mode === 'plan_activation_required';
    const gateEligibleForTrial =
      !data.profile.stripe_customer_id &&
      !data.profile.stripe_subscription_id &&
      !data.profile.tripwire_paid_at;
    const gateEligibleFor19Credit = Boolean(
      data.profile.tripwire_paid_at &&
        Date.now() - Date.parse(data.profile.tripwire_paid_at) <=
          7 * 86400 * 1000
    );
    return (
      <div
        className="vs-container"
        style={{ paddingTop: '44px', paddingBottom: '72px', maxWidth: '1040px' }}
      >
        {props.upgradedPlan ? (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '6px',
              background: 'var(--vs-pass-bg)',
              border: '1px solid var(--vs-pass-border)',
              color: 'var(--vs-pass-fg)',
              fontSize: '13px',
            }}
          >
            <strong>
              {props.trialActive
                ? `7-day free trial confirmed (${props.upgradedPlan.toUpperCase()} · $0.00 charged today).`
                : `Stripe checkout confirmed (${props.upgradedPlan.toUpperCase()}).`}
            </strong>{' '}
            Sign in below with the email you used at checkout to open your
            private Console and generated code fixes.
          </div>
        ) : null}

        <div style={{ marginBottom: '26px' }}>
          <div className="vs-eyebrow" style={{ marginBottom: '8px' }}>
            PRIVATE SUBSCRIBER CONSOLE · WORKSPACE ACCESS REQUIRED
          </div>
          <h1
            style={{
              margin: '0 0 10px 0',
              fontSize: 'clamp(26px, 3.6vw, 36px)',
              letterSpacing: '-0.03em',
              lineHeight: 1.12,
            }}
          >
            {isPlanActivation
              ? 'Activate a plan to provision your private AI Search Console.'
              : 'Sign in to your private AI Search Console.'}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '15px',
              color: 'var(--vs-ink-secondary)',
              maxWidth: '720px',
              lineHeight: 1.6,
            }}
          >
            Every subscriber gets an isolated 3-tab workspace to add their own
            domains, monitor ChatGPT, Gemini, and Perplexity answers, ship{' '}
            <code className="vs-mono">JSON-LD</code> +{' '}
            <code className="vs-mono">/agents.md</code> +{' '}
            <code className="vs-mono">/llms.txt</code> fixes, and log real AI
            crawler hits. Want to test a domain for free first?{' '}
            <Link
              href="/#audit"
              style={{
                color: 'var(--vs-ink)',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              Run a free limited site audit on the homepage →
            </Link>
          </p>
        </div>

        <div className="vs-grid-2" style={{ alignItems: 'start' }}>
          {/* Left Column: Sign-In Card or Signed-In Account Card */}
          <div className="vs-card" style={{ padding: '26px' }}>
            {isPlanActivation ? (
              <div>
                <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
                  AUTHENTICATED ACCOUNT
                </div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '19px' }}>
                  Signed in as{' '}
                  <span className="vs-mono">
                    {data.profile.email || authEmail || 'verified user'}
                  </span>
                </h2>
                <p
                  style={{
                    margin: '0 0 18px 0',
                    fontSize: '13.5px',
                    color: 'var(--vs-ink-secondary)',
                    lineHeight: 1.55,
                  }}
                >
                  Your account is currently on the public{' '}
                  <code className="vs-mono">FREE</code> tier. Choose the{' '}
                  <strong>$19 One-Time Audit Pass</strong> or a monthly Console
                  plan on the right to provision your workspace immediately.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link href="/#audit" className="vs-btn vs-btn-secondary">
                    Run Free Homepage Audit
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="vs-btn vs-btn-secondary"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <div className="vs-eyebrow" style={{ marginBottom: '3px' }}>
                      SUBSCRIBER SIGN-IN
                    </div>
                    <strong style={{ fontSize: '17px' }}>
                      Open Your Workspace
                    </strong>
                  </div>

                  <div
                    role="group"
                    aria-label="Console sign-in method"
                    style={{
                      display: 'inline-flex',
                      border: '1px solid var(--vs-border)',
                      borderRadius: '6px',
                      padding: '2px',
                      background: 'var(--vs-surface-subtle)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setGateAuthMethod('magic_link');
                        setGateError(null);
                      }}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 9px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        background:
                          gateAuthMethod === 'magic_link'
                            ? 'var(--vs-ink)'
                            : 'transparent',
                        color:
                          gateAuthMethod === 'magic_link'
                            ? '#FFFFFF'
                            : 'var(--vs-ink-secondary)',
                      }}
                    >
                      1-Click Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGateAuthMethod('password');
                        setGateError(null);
                      }}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 9px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        background:
                          gateAuthMethod === 'password'
                            ? 'var(--vs-ink)'
                            : 'transparent',
                        color:
                          gateAuthMethod === 'password'
                            ? '#FFFFFF'
                            : 'var(--vs-ink-secondary)',
                      }}
                    >
                      Password
                    </button>
                  </div>
                </div>

                {gateSent ? (
                  <div
                    style={{
                      padding: '14px',
                      background: 'var(--vs-pass-bg)',
                      border: '1px solid var(--vs-pass-border)',
                      color: 'var(--vs-pass-fg)',
                      borderRadius: '6px',
                      fontSize: '13.5px',
                    }}
                  >
                    <strong>Sign-in link dispatched to {gateEmail}.</strong>{' '}
                    Click the verification link in your inbox to enter your
                    private Console.
                  </div>
                ) : (
                  <form onSubmit={handleGateSignIn}>
                    <label
                      htmlFor="vs-gate-email"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginBottom: '6px',
                      }}
                    >
                      Subscriber / Checkout Email
                    </label>
                    <input
                      id="vs-gate-email"
                      type="email"
                      required
                      placeholder="founder@yourcompany.com"
                      value={gateEmail}
                      onChange={(e) => setGateEmail(e.target.value)}
                      className="vs-input"
                      style={{
                        marginBottom: '12px',
                        fontFamily: 'var(--vs-sans)',
                      }}
                    />

                    {gateAuthMethod === 'password' ? (
                      <>
                        <label
                          htmlFor="vs-gate-password"
                          style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 600,
                            marginBottom: '6px',
                          }}
                        >
                          Password
                        </label>
                        <input
                          id="vs-gate-password"
                          type="password"
                          required
                          placeholder="••••••••••••"
                          value={gatePassword}
                          onChange={(e) => setGatePassword(e.target.value)}
                          className="vs-input"
                          style={{
                            marginBottom: '12px',
                            fontFamily: 'var(--vs-sans)',
                          }}
                        />
                      </>
                    ) : null}

                    {gateError ? (
                      <div
                        style={{
                          padding: '9px 11px',
                          marginBottom: '12px',
                          borderRadius: '5px',
                          background: 'var(--vs-crit-bg)',
                          border: '1px solid var(--vs-crit-border)',
                          color: 'var(--vs-crit-fg)',
                          fontSize: '12.5px',
                        }}
                      >
                        {gateError}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={gateLoading}
                      className="vs-btn"
                      style={{ width: '100%' }}
                    >
                      {gateLoading
                        ? 'Authenticating...'
                        : gateAuthMethod === 'password'
                          ? 'Sign In to Private Console →'
                          : 'Send 1-Click Console Link →'}
                    </button>
                  </form>
                )}

                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--vs-border)',
                    fontSize: '12.5px',
                    color: 'var(--vs-ink-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  What is inside your Console: Prompt Discovery, Mention vs.
                  Citation Rate split, Brand Sentiment &amp; Rival Share of
                  Voice, syntax-validated <code className="vs-mono">JSON-LD</code> +{' '}
                  <code className="vs-mono">/agents.md</code> +{' '}
                  <code className="vs-mono">/llms.txt</code> bundles, Dual
                  Attribution, and Streamable HTTP{' '}
                  <code className="vs-mono">/mcp</code> keys.
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Plan Activation Cards */}
          <div className="vs-card" style={{ padding: '26px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
              NEW TO VERISOURCE?
            </div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>
              Activate Your Private Console
              {gateDomainParam ? (
                <>
                  {' '}
                  for <span className="vs-mono">{gateDomainParam}</span>
                </>
              ) : null}
            </h2>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '13px',
                color: 'var(--vs-ink-secondary)',
                lineHeight: 1.5,
              }}
            >
              {gateEligibleForTrial
                ? 'Start a 7-day free trial on Starter or Pro ($0.00 due today · cancel in 1 click before Day 7), or pick the $19 one-time Audit Pass with zero recurring billing.'
                : 'Choose a workspace plan below to provision your private 3-tab Console immediately.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(
                [
                  {
                    plan: 'tripwire_19',
                    cycle: 'one_time',
                    title: '$19 One-Time Audit Pass',
                    badge: 'NO SUBSCRIPTION',
                    desc: '1 domain · Full Tab 2 Fix Bundle (JSON-LD, /agents.md, /llms.txt) · $19 credits if you subscribe in 7d.',
                    cta: 'Buy $19 Pass →',
                  },
                  {
                    plan: 'starter_49',
                    cycle: 'monthly',
                    title: gateEligibleForTrial
                      ? '$49/mo Starter (7-Day Free Trial)'
                      : '$49/mo Starter Console',
                    badge: gateEligibleFor19Credit
                      ? '-$19 CREDIT'
                      : gateEligibleForTrial
                        ? '$0 TODAY · 7D TRIAL'
                        : '1 DOMAIN',
                    desc: '1 domain · Weekly drift alerts · Prompt Discovery · Browser + Edge Bot Crawl Logger.',
                    cta: gateEligibleForTrial
                      ? 'Start 7-Day Trial →'
                      : 'Activate →',
                  },
                  {
                    plan: 'pro_99',
                    cycle: 'monthly',
                    title: gateEligibleForTrial
                      ? '$99/mo Pro + MCP (7-Day Free Trial)'
                      : '$99/mo Pro + Paid MCP',
                    badge: gateEligibleFor19Credit
                      ? '-$19 CREDIT'
                      : gateEligibleForTrial
                        ? 'MOST POPULAR · $0 TODAY'
                        : 'MOST POPULAR',
                    desc: gateEligibleForTrial
                      ? '3 domains · 100 prompts · Streamable HTTP /mcp keys (150 trial credits → 1,000/mo).'
                      : '3 domains · 100 prompts · 1,000 Streamable HTTP /mcp credits for Cursor & Claude.',
                    cta: gateEligibleForTrial
                      ? 'Start 7-Day Trial →'
                      : 'Activate →',
                  },
                  {
                    plan: 'agency_249',
                    cycle: 'monthly',
                    title: '$249/mo Agency Pipeline',
                    badge: gateEligibleFor19Credit
                      ? '-$19 CREDIT'
                      : 'WHITE-LABEL',
                    desc: '15 client domains · 400 prompts · Branded /audit/[slug] links · 5,000 /mcp credits.',
                    cta: 'Activate →',
                  },
                ] as const
              ).map((tier) => (
                <div
                  key={tier.plan}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--vs-border)',
                    background:
                      tier.plan === 'pro_99'
                        ? 'var(--vs-surface-warm)'
                        : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 220px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '3px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <strong style={{ fontSize: '13.5px' }}>
                        {tier.title}
                      </strong>
                      <StatusBadge
                        tone={
                          tier.plan === 'pro_99' ||
                          (tier.plan === 'starter_49' && gateEligibleForTrial)
                            ? 'pass'
                            : 'neutral'
                        }
                      >
                        {tier.badge}
                      </StatusBadge>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--vs-ink-secondary)',
                      }}
                    >
                      {tier.desc}
                    </div>
                  </div>
                  <a
                    href={buildGateCheckoutHref(tier.plan, tier.cycle)}
                    className={
                      tier.plan === 'pro_99' || tier.plan === 'starter_49'
                        ? 'vs-btn'
                        : 'vs-btn vs-btn-secondary'
                    }
                    style={{ padding: '7px 12px', fontSize: '12px' }}
                  >
                    {tier.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vs-container" style={{ paddingTop: '28px' }}>
      {/* Workspace Top Control Bar */}
      <div
        className="vs-card"
        style={{
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            className="vs-mono"
            style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}
          >
            ACTIVE DOMAIN:
          </span>
          <select
            value={activeDomain?.id ?? ''}
            onChange={(e) => setSelectedDomainId(e.target.value)}
            className="vs-input"
            style={{ width: 'auto', minWidth: '250px', padding: '7px 10px' }}
            aria-label="Select tracked domain"
          >
            {data.domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.brand_name} ({new URL(d.domain_url).hostname})
              </option>
            ))}
          </select>

          {activeDomain ? (
            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={rescanningDomain || deletingDomain}
                onClick={() => void handleRescanDomain()}
                className="vs-btn vs-btn-secondary"
                style={{ padding: '7px 11px', fontSize: '12px' }}
                title="Run live HTTP & multi-engine re-scan on active domain"
              >
                {rescanningDomain ? 'Re-Scanning...' : '↻ Re-Scan'}
              </button>
              <button
                type="button"
                onClick={handleExportExecutiveAuditReport}
                className="vs-btn vs-btn-secondary"
                style={{ padding: '7px 11px', fontSize: '12px' }}
                title="Download full Executive AI Search Report (.md)"
              >
                ↓ Export Audit (.md)
              </button>
              {!isProtectedDemoSeedDomain ? (
                <button
                  type="button"
                  disabled={deletingDomain || rescanningDomain}
                  onClick={() => void handleDeleteDomain()}
                  className="vs-btn vs-btn-secondary"
                  style={{
                    padding: '7px 10px',
                    fontSize: '12px',
                    color: 'var(--vs-crit-fg)',
                  }}
                  title="Remove domain and purge its crawl snapshots"
                >
                  {deletingDomain ? 'Removing...' : 'Remove'}
                </button>
              ) : null}
            </div>
          ) : null}

          <form
            onSubmit={handleAddDomain}
            style={{ display: 'inline-flex', gap: '6px' }}
          >
            <input
              type="text"
              value={newDomainUrl}
              onChange={(e) => setNewDomainUrl(e.target.value)}
              placeholder="Add domain (e.g. stripe.com)"
              className="vs-input"
              style={{ width: '210px', padding: '7px 10px', fontSize: '12.5px' }}
            />
            <button
              type="submit"
              disabled={addingDomain}
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12.5px' }}
            >
              {addingDomain ? 'Scanning...' : '+ Scan Domain'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <UxModeSwitch mode={uxMode} onChange={handleChangeUxMode} />
          <StatusBadge tone="pass">
            {`PLAN: ${data.profile.plan_tier.toUpperCase()}`}
          </StatusBadge>
          {!isGuided ? (
            <StatusBadge>
              {`MCP CREDITS: ${data.profile.mcp_calls_used_this_month} / ${data.profile.mcp_calls_limit}`}
            </StatusBadge>
          ) : null}
          <form action="/api/billing/portal" method="POST">
            {accessToken ? (
              <input type="hidden" name="access_token" value={accessToken} />
            ) : null}
            <button
              type="submit"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              Manage Billing
            </button>
          </form>
          {accessToken ? (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
              title={authEmail ?? 'Signed in'}
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="vs-btn vs-btn-secondary"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {handoffHostname ? (
        <div
          className="vs-card"
          style={{
            padding: '15px 18px',
            marginBottom: '16px',
            background: 'var(--vs-surface-warm)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ maxWidth: '720px' }}>
            <div className="vs-eyebrow" style={{ marginBottom: '3px' }}>
              READY TO AUDIT YOUR DOMAIN
            </div>
            <div style={{ fontWeight: 700, fontSize: '14.5px', marginBottom: '3px' }}>
              Scan <span className="vs-mono">{handoffHostname}</span> across
              ChatGPT, Gemini &amp; Perplexity
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)' }}>
              {activeDomain ? (
                <>
                  Your workspace is currently inspecting{' '}
                  <strong>{activeDomain.brand_name}</strong>.{' '}
                </>
              ) : null}
              Run a live 3-engine audit on{' '}
              <span className="vs-mono">{handoffHostname}</span> to inspect its AI
              Share of Voice, claim accuracy, and syntax-validated code fixes
              across all 3 tabs.
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              disabled={addingDomain}
              onClick={() => void scanDomainIntoWorkspace(handoffHostname)}
              className="vs-btn"
              style={{ padding: '8px 15px', fontSize: '12.5px' }}
            >
              {addingDomain
                ? `Scanning ${handoffHostname}...`
                : `+ Audit ${handoffHostname} Across 3 Engines`}
            </button>
            {!accessToken || data.profile.plan_tier === 'free' ? (
              <Link
                href={`/pricing?plan=tripwire_19&domain=${encodeURIComponent(
                  handoffHostname
                )}`}
                className="vs-btn vs-btn-secondary"
                style={{ padding: '8px 13px', fontSize: '12.5px' }}
              >
                Get Permanent Audit + Fixes — $19
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setDismissedHandoffHost(handoffHostname)}
              className="vs-btn vs-btn-secondary"
              style={{ padding: '8px 11px', fontSize: '12px' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {bannerError ? (
        <div
          style={{
            padding: '10px 14px',
            marginBottom: '14px',
            borderRadius: '5px',
            background: 'var(--vs-crit-bg)',
            border: '1px solid var(--vs-crit-border)',
            color: 'var(--vs-crit-fg)',
            fontSize: '13px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <span>{bannerError}</span>
          {/upgrade|\$19|limit reached/i.test(bannerError) ? (
            <Link
              href={`/pricing${
                handoffHostname
                  ? `?domain=${encodeURIComponent(handoffHostname)}`
                  : activeDomain
                    ? `?domain=${encodeURIComponent(
                        new URL(activeDomain.domain_url).hostname
                      )}`
                    : ''
              }`}
              className="vs-btn vs-btn-secondary"
              style={{ padding: '5px 11px', fontSize: '12px' }}
            >
              View Plans &amp; $19 Audit Pass →
            </Link>
          ) : null}
        </div>
      ) : null}

      {bannerSuccess ? (
        <div
          style={{
            padding: '10px 14px',
            marginBottom: '14px',
            borderRadius: '5px',
            background: 'var(--vs-pass-bg)',
            border: '1px solid var(--vs-pass-border)',
            color: 'var(--vs-pass-fg)',
            fontSize: '13px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <span>
            {bannerSuccess}
            {props.upgradedPlan &&
            !accessToken &&
            Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
              ? ' Check your checkout email for your one-click sign-in link, or sign in below to load your private Fix Bundle.'
              : ''}
          </span>
          {props.upgradedPlan &&
          !accessToken &&
          Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) ? (
            <Link
              href={`/login?tab=tab2_fixes${
                props.initialDomainQuery
                  ? `&domain=${encodeURIComponent(props.initialDomainQuery)}`
                  : ''
              }`}
              className="vs-btn vs-btn-secondary"
              style={{ padding: '5px 11px', fontSize: '12px' }}
            >
              Sign In with Checkout Email →
            </Link>
          ) : null}
        </div>
      ) : null}

      {(props.trialActive ||
        (data.profile.plan_tier === 'pro_99' &&
          data.profile.mcp_calls_limit === 150)) &&
      !dismissedTrialChecklist ? (
        <div
          className="vs-card"
          style={{
            padding: '15px 18px',
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
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                7-DAY FREE TRIAL ROADMAP · GET LIVE CRAWL PROOF BEFORE DAY 7
              </span>
              <StatusBadge tone="pass">$0.00 CHARGED TODAY</StatusBadge>
            </div>
            <button
              type="button"
              onClick={() => setDismissedTrialChecklist(true)}
              className="vs-btn vs-btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11.5px' }}
            >
              Dismiss
            </button>
          </div>
          <div className="vs-grid-2" style={{ gap: '12px', fontSize: '12.5px' }}>
            <div style={{ color: 'var(--vs-ink-secondary)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--vs-ink)' }}>
                1. Day 1 — Lock Truth &amp; Ship Code Fixes:
              </strong>{' '}
              Confirm your Brand Truth Sheet in{' '}
              <button
                type="button"
                onClick={() => setActiveTab('tab1_visibility')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  color: 'var(--vs-ink)',
                }}
              >
                Step 01
              </button>
              , then copy the{' '}
              <button
                type="button"
                onClick={() => setActiveTab('tab2_fixes')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  color: 'var(--vs-ink)',
                }}
              >
                Step 02 1-Click AI Fix Prompt
              </button>{' '}
              into Claude, Cursor, Antigravity, or Shopify and run{' '}
              <code className="vs-mono">✓ Verify Live Fixes</code>.
            </div>
            <div style={{ color: 'var(--vs-ink-secondary)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--vs-ink)' }}>
                2. Days 3–7 — Track Bot Crawls &amp; Weekly Lift:
              </strong>{' '}
              Watch live <code className="vs-mono">GPTBot</code> and{' '}
              <code className="vs-mono">PerplexityBot</code> hits appear in your
              Step 01 Crawl Ledger as AI engines re-index your facts. Stay on for
              Monday Share-of-Voice digests{data.profile.plan_tier === 'pro_99' ? ' and your full 1,000 /mcp monthly credit step-up' : ''}, or cancel anytime via{' '}
              <strong style={{ color: 'var(--vs-ink)' }}>Manage Billing</strong>.
            </div>
          </div>
        </div>
      ) : null}

      {/* Strict 3-Tab Layout */}
      <ThreeTabShell activeTab={activeTab} onSelectTab={setActiveTab} mode={uxMode}>
        {!activeDomain ? (
          <div
            className="vs-card"
            style={{
              padding: '32px',
              marginBottom: activeTab === 'tab3_offsite' ? '24px' : undefined,
            }}
          >
            <div className="vs-eyebrow" style={{ marginBottom: '6px' }}>
              PRIVATE WORKSPACE READY · 0 DOMAINS TRACKED
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '21px' }}>
              Add your website to start your 3-engine AI audit
            </h2>
            <p
              style={{
                margin: '0 0 18px 0',
                fontSize: '14px',
                color: 'var(--vs-ink-secondary)',
                maxWidth: '660px',
                lineHeight: 1.55,
              }}
            >
              Enter your primary domain below. Verisource probes{' '}
              <code className="vs-mono">GPTBot</code>,{' '}
              <code className="vs-mono">OAI-SearchBot</code>,{' '}
              <code className="vs-mono">PerplexityBot</code>,{' '}
              <code className="vs-mono">ClaudeBot</code>, and{' '}
              <code className="vs-mono">Google-Extended</code>, checks ChatGPT,
              Gemini, and Perplexity buyer prompts, and generates your
              syntax-validated <code className="vs-mono">JSON-LD</code>,{' '}
              <code className="vs-mono">/agents.md</code>, and{' '}
              <code className="vs-mono">/llms.txt</code> Fix Bundle.
            </p>
            <form
              onSubmit={handleAddDomain}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                maxWidth: '580px',
              }}
            >
              <input
                type="text"
                required
                value={newDomainUrl}
                onChange={(e) => setNewDomainUrl(e.target.value)}
                placeholder="yourcompany.com"
                className="vs-input vs-mono"
                style={{ flex: '1 1 260px', fontSize: '13.5px' }}
              />
              <button
                type="submit"
                disabled={addingDomain}
                className="vs-btn"
                style={{ padding: '10px 18px' }}
              >
                {addingDomain
                  ? 'Scanning Across 3 AI Engines...'
                  : '+ Scan My Website →'}
              </button>
            </form>
          </div>
        ) : null}

        {activeTab === 'tab1_visibility' && activeDomain ? (
          <div>
            {isGuided ? (
              <GuidedExplainerBanner
                stepLabel="STEP 01 OF 03 · BRAND HEALTH & AI MISTAKES"
                title="See what AI tells buyers—and correct any invented facts"
                description="Review ChatGPT, Gemini, and Perplexity answers on the left. Confirm your real prices and delivery rules on the right, then click Save Facts & Update Fixes."
                glossary={[
                  {
                    term: 'AI Visibility',
                    meaning: 'How often AI recommends your business (0–100)',
                  },
                  {
                    term: 'Fact Accuracy',
                    meaning: 'Whether AI states your real prices & policies',
                  },
                  {
                    term: 'GPTBot / PerplexityBot',
                    meaning: 'AI crawlers reading your pages',
                  },
                ]}
              />
            ) : null}

            {/* Metric Summary Strip */}
            <div
              className="vs-card vs-ledger-strip-4"
              style={{ marginBottom: '14px' }}
            >
              <div>
                <MetricLedgerCell
                  label={isGuided ? 'AI Visibility Score' : 'AI Share of Voice'}
                  value={activeDomain.visibility_score}
                  suffix="/ 100"
                  tone={activeDomain.visibility_score < 50 ? 'warn' : 'pass'}
                  sublabel={
                    activeScoreDelta
                      ? activeScoreDelta.visibilityDelta > 0
                        ? `${
                            activeScoreDelta.baselineLabel === 'initial_audit'
                              ? 'Baseline'
                              : 'Prev'
                          } ${activeScoreDelta.previousVisibilityScore} → ${
                            activeScoreDelta.currentVisibilityScore
                          } (+${activeScoreDelta.visibilityDelta} pts)`
                        : activeScoreDelta.visibilityDelta < 0
                          ? `Prev ${activeScoreDelta.previousVisibilityScore} → ${activeScoreDelta.currentVisibilityScore} (${activeScoreDelta.visibilityDelta} pts)`
                          : `Verified ${activeScoreDelta.previousVisibilityScore} → ${activeScoreDelta.currentVisibilityScore} (0 pts)`
                      : 'ChatGPT · Gemini · Perplexity'
                  }
                />
              </div>
              <div>
                <MetricLedgerCell
                  label={isGuided ? 'Fact Accuracy' : 'Brand Truth Accuracy'}
                  value={`${activeDomain.accuracy_score}%`}
                  tone={activeDomain.accuracy_score < 85 ? 'critical' : 'pass'}
                  sublabel={
                    activeScoreDelta && activeScoreDelta.accuracyDelta !== 0
                      ? `${activeScoreDelta.previousAccuracyScore}% → ${
                          activeScoreDelta.currentAccuracyScore
                        }% (${
                          activeScoreDelta.accuracyDelta > 0 ? '+' : ''
                        }${activeScoreDelta.accuracyDelta}%)`
                      : isGuided
                        ? `${flaggedSnapshots.length} AI answer(s) w/ wrong facts`
                        : `${flaggedSnapshots.length} engine snapshot(s) w/ conflicts`
                  }
                />
              </div>
              <div>
                <MetricLedgerCell
                  label="AI Referral Visits"
                  value={totalAiVisits}
                  sublabel={
                    isGuided
                      ? 'Visitors sent by AI engines'
                      : 'Attributed via utm_source + referrer'
                  }
                />
              </div>
              <div>
                <MetricLedgerCell
                  label={isGuided ? 'AI-Referred Sales' : 'Verified AI Checkout Revenue'}
                  value={`$${totalAiRevenueUsd.toFixed(2)}`}
                  tone="pass"
                  sublabel={
                    isGuided
                      ? 'Completed orders from AI clicks'
                      : 'Origin-verified conversion events'
                  }
                />
              </div>
            </div>

            {/* Before -> After Remediation Proof Bar */}
            <div
              className="vs-card"
              style={{
                padding: '10px 16px',
                marginBottom: '22px',
                background:
                  activeScoreDelta && activeScoreDelta.visibilityDelta > 0
                    ? 'var(--vs-surface-warm)'
                    : 'var(--vs-surface-subtle)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12.5px',
                }}
              >
                <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                  BEFORE → AFTER REMEDIATION PROOF
                </span>
                {activeScoreDelta && activeScoreDelta.visibilityDelta > 0 ? (
                  <span style={{ color: 'var(--vs-ink-secondary)' }}>
                    AI Visibility moved from{' '}
                    <strong className="vs-mono">
                      {activeScoreDelta.previousVisibilityScore}/100
                    </strong>{' '}
                    to{' '}
                    <strong className="vs-mono">
                      {activeScoreDelta.currentVisibilityScore}/100 (+
                      {activeScoreDelta.visibilityDelta} pts)
                    </strong>
                    {activeScoreDelta.accuracyDelta > 0
                      ? ` · Fact accuracy ${activeScoreDelta.previousAccuracyScore}% → ${activeScoreDelta.currentAccuracyScore}% (+${activeScoreDelta.accuracyDelta}%)`
                      : ''}
                    .
                  </span>
                ) : activeScoreDelta ? (
                  <span style={{ color: 'var(--vs-ink-secondary)' }}>
                    Latest live check:{' '}
                    <strong className="vs-mono">
                      {activeScoreDelta.previousVisibilityScore}/100 →{' '}
                      {activeScoreDelta.currentVisibilityScore}/100 (
                      {activeScoreDelta.visibilityDelta >= 0
                        ? `+${activeScoreDelta.visibilityDelta}`
                        : activeScoreDelta.visibilityDelta}{' '}
                      pts)
                    </strong>
                    . Publish pending Tab 2 fixes to lift visibility.
                  </span>
                ) : (
                  <span style={{ color: 'var(--vs-ink-secondary)' }}>
                    Baseline locked at{' '}
                    <strong className="vs-mono">
                      {activeDomain.visibility_score}/100
                    </strong>{' '}
                    ({appliedOnSiteFixesCount}/{onSiteDomainFixes.length} on-site
                    fixes live). Publish Tab 2 fixes, then run{' '}
                    <strong>✓ Verify Live Fixes</strong> to record score uplift.
                  </span>
                )}
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {activeScoreDelta && activeScoreDelta.visibilityDelta > 0 ? (
                  <StatusBadge tone="pass">
                    +{activeScoreDelta.visibilityDelta} PTS VERIFIED
                  </StatusBadge>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab('tab2_fixes')}
                    className="vs-btn vs-btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '11.5px' }}
                  >
                    {isGuided ? 'Open Step 2 Fixes →' : 'Inspect Tab 2 Fixes →'}
                  </button>
                )}
              </div>
            </div>

            {/* Engine-by-Engine Citation Share Strip + 1-Click Engine Filter */}
            <div className="vs-card" style={{ marginBottom: '22px', overflow: 'hidden' }}>
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--vs-border)',
                  background: 'var(--vs-surface-subtle)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                    ENGINE-BY-ENGINE CITATION SHARE
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}>
                    {isGuided
                      ? 'Click an engine to inspect only its answers below'
                      : 'Prompt mention rate & best rank across tracked retrieval engines'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    border: '1px solid var(--vs-border)',
                    borderRadius: '5px',
                    padding: '2px',
                    background: '#FFFFFF',
                    gap: '2px',
                  }}
                >
                  {(
                    [
                      {
                        id: 'all',
                        label: `All (${domainSnapshots.length})`,
                      },
                      ...engineCitationShare.map((item) => ({
                        id: item.aiEngine,
                        label: `${item.shortLabel} (${item.totalSnapshots})`,
                      })),
                    ] as const
                  ).map((pill) => {
                    const active = selectedEngineFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setSelectedEngineFilter(pill.id)}
                        style={{
                          border: 'none',
                          cursor: 'pointer',
                          padding: '3px 9px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          background: active ? 'var(--vs-ink)' : 'transparent',
                          color: active ? '#FFFFFF' : 'var(--vs-ink-secondary)',
                        }}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="vs-ledger-strip-3">
                {engineCitationShare.map((item) => {
                  const isFiltered = selectedEngineFilter === item.aiEngine;
                  const cellTone: 'pass' | 'warn' | 'critical' =
                    item.hallucinationCount > 0 ||
                    (item.totalSnapshots > 0 && item.mentionedCount === 0)
                      ? 'critical'
                      : item.mentionRatePct >= 66
                        ? 'pass'
                        : 'warn';
                  const sublabel =
                    item.totalSnapshots === 0
                      ? 'Click Re-Scan to record snapshots'
                      : item.mentionedCount > 0
                        ? `Mention ${item.mentionRatePct}% · Cited URL ${item.citationRatePct}% · Best #${item.bestRank ?? 1}${
                            item.hallucinationCount > 0
                              ? ` · ${item.hallucinationCount} conflict(s)`
                              : ''
                          }`
                        : `Mention 0% · Cited URL ${item.citationRatePct}%${
                            item.topRivals.length > 0
                              ? ` · Rivals: ${item.topRivals.join(', ')}`
                              : ' · Rivals cited instead'
                          }`;

                  return (
                    <div
                      key={item.aiEngine}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setSelectedEngineFilter((prev) =>
                          prev === item.aiEngine ? 'all' : item.aiEngine
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedEngineFilter((prev) =>
                            prev === item.aiEngine ? 'all' : item.aiEngine
                          );
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        background: isFiltered
                          ? 'var(--vs-surface-warm)'
                          : undefined,
                        transition: 'background 120ms ease',
                      }}
                      title={`Filter answers by ${item.engineLabel}`}
                    >
                      <MetricLedgerCell
                        label={item.engineLabel}
                        value={`${item.mentionedCount} / ${item.totalSnapshots}`}
                        suffix="mentioned"
                        tone={cellTone}
                        sublabel={sublabel}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Brand Sentiment Framing & Head-to-Head Rival Share of Voice */}
            {brandSentimentAndSov ? (
              <div
                className="vs-card"
                style={{ marginBottom: '22px', overflow: 'hidden' }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--vs-border)',
                    background: 'var(--vs-surface-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                      BRAND SENTIMENT FRAMING &amp; RIVAL SHARE OF VOICE
                    </span>
                    <span
                      style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
                    >
                      {isGuided
                        ? 'Whether AI recommends your business positively vs. naming competitors instead'
                        : 'Answer framing polarity & head-to-head entity share across tracked prompts'}
                    </span>
                  </div>
                  <StatusBadge
                    tone={
                      brandSentimentAndSov.dominantFraming === 'recommended'
                        ? 'pass'
                        : brandSentimentAndSov.dominantFraming === 'cautionary' ||
                            brandSentimentAndSov.dominantFraming === 'invisible'
                          ? 'critical'
                          : 'warn'
                    }
                  >
                    DOMINANT FRAMING:{' '}
                    {brandSentimentAndSov.dominantFraming.toUpperCase()} ·{' '}
                    {brandSentimentAndSov.sentimentScore}/100
                  </StatusBadge>
                </div>

                <div
                  className="vs-grid-2"
                  style={{ padding: '16px', gap: '18px', alignItems: 'center' }}
                >
                  <div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: '10px',
                        marginBottom: '10px',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--vs-border)',
                          background: 'var(--vs-surface-subtle)',
                        }}
                      >
                        <div
                          className="vs-mono"
                          style={{
                            fontSize: '11px',
                            color: 'var(--vs-ink-muted)',
                            marginBottom: '3px',
                          }}
                        >
                          RECOMMENDED
                        </div>
                        <strong
                          className="vs-mono"
                          style={{
                            fontSize: '17px',
                            color: 'var(--vs-pass-fg)',
                          }}
                        >
                          {brandSentimentAndSov.recommendedPct}%
                        </strong>
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--vs-ink-secondary)',
                          }}
                        >
                          {brandSentimentAndSov.recommendedCount} answer(s)
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--vs-border)',
                          background: 'var(--vs-surface-subtle)',
                        }}
                      >
                        <div
                          className="vs-mono"
                          style={{
                            fontSize: '11px',
                            color: 'var(--vs-ink-muted)',
                            marginBottom: '3px',
                          }}
                        >
                          NEUTRAL LISTING
                        </div>
                        <strong className="vs-mono" style={{ fontSize: '17px' }}>
                          {brandSentimentAndSov.neutralPct}%
                        </strong>
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--vs-ink-secondary)',
                          }}
                        >
                          {brandSentimentAndSov.neutralCount} answer(s)
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--vs-border)',
                          background: 'var(--vs-surface-subtle)',
                        }}
                      >
                        <div
                          className="vs-mono"
                          style={{
                            fontSize: '11px',
                            color: 'var(--vs-ink-muted)',
                            marginBottom: '3px',
                          }}
                        >
                          CAUTION / DRIFT
                        </div>
                        <strong
                          className="vs-mono"
                          style={{
                            fontSize: '17px',
                            color:
                              brandSentimentAndSov.cautionaryCount > 0
                                ? 'var(--vs-crit-fg)'
                                : 'var(--vs-ink)',
                          }}
                        >
                          {brandSentimentAndSov.cautionaryPct}%
                        </strong>
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--vs-ink-secondary)',
                          }}
                        >
                          {brandSentimentAndSov.cautionaryCount} conflict(s)
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--vs-ink-secondary)',
                      }}
                    >
                      Average citation rank when mentioned:{' '}
                      <strong className="vs-mono">
                        {brandSentimentAndSov.averageRank !== null
                          ? `#${brandSentimentAndSov.averageRank}`
                          : 'OMITTED'}
                      </strong>{' '}
                      · Omitted in{' '}
                      <strong className="vs-mono">
                        {brandSentimentAndSov.omittedCount}
                      </strong>{' '}
                      of {domainSnapshots.length} tracked engine snapshot(s).
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      className="vs-mono"
                      style={{ fontSize: '11px', color: 'var(--vs-ink-muted)' }}
                    >
                      HEAD-TO-HEAD ENTITY SHARE OF VOICE (TOP RIVALS)
                    </div>
                    {brandSentimentAndSov.headToHeadSov.map((row) => (
                      <div key={row.entityName}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12.5px',
                            marginBottom: '3px',
                          }}
                        >
                          <span style={{ fontWeight: row.isTargetBrand ? 700 : 500 }}>
                            {row.entityName}{' '}
                            {row.isTargetBrand ? (
                              <span
                                className="vs-mono"
                                style={{
                                  fontSize: '10.5px',
                                  color: 'var(--vs-pass-fg)',
                                  marginLeft: '4px',
                                }}
                              >
                                (YOUR BRAND)
                              </span>
                            ) : null}
                          </span>
                          <span
                            className="vs-mono"
                            style={{
                              fontSize: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <span>
                              {row.shareOfVoicePct}% ({row.mentions} mentions)
                            </span>
                            {!row.isTargetBrand ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setCitationBlueprintType('vs_competitor');
                                  setCustomCitationRival(row.entityName);
                                  setExpandedCitationPageStudio(true);
                                  setActiveTab('tab2_fixes');
                                }}
                                className="vs-btn vs-btn-secondary"
                                style={{
                                  padding: '2px 7px',
                                  fontSize: '10.5px',
                                  fontFamily: 'var(--vs-sans)',
                                }}
                                title={`Generate ${activeDomain.brand_name} vs. ${row.entityName} comparison page in Step 02`}
                              >
                                Build vs. Page →
                              </button>
                            ) : null}
                          </span>
                        </div>
                        <div
                          style={{
                            height: '6px',
                            borderRadius: '999px',
                            background: 'var(--vs-border)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(row.shareOfVoicePct, row.mentions > 0 ? 6 : 0)}%`,
                              height: '100%',
                              background: row.isTargetBrand
                                ? 'var(--vs-pass-fg)'
                                : 'var(--vs-ink-muted)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Module 1: Hallucination Watchdog + 1-Click Truth Sheet */}
            <div className="vs-grid-split" style={{ marginBottom: '24px' }}>
              <div className="vs-card vs-table-wrap">
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--vs-border)',
                    background: 'var(--vs-surface-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <strong style={{ fontSize: '13.5px' }}>
                    {isGuided
                      ? 'What AI Engines Tell Buyers Right Now'
                      : 'Module 1 — AI Hallucination & Claim Watchdog'}
                  </strong>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <StatusBadge
                      tone={flaggedSnapshots.length > 0 ? 'critical' : 'pass'}
                    >
                      {flaggedSnapshots.length > 0
                        ? `${flaggedSnapshots.length} RED ALERT(S)`
                        : 'ALL CLAIMS VERIFIED'}
                    </StatusBadge>
                    <button
                      type="button"
                      disabled={sendingAlert || sendingDigest}
                      onClick={() => void handleSendDriftAlert()}
                      className="vs-btn vs-btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '11.5px' }}
                      title="Dispatch or preview urgent hallucination drift email"
                    >
                      {sendingAlert
                        ? 'Dispatching...'
                        : isGuided
                          ? 'Preview Mistake Alert'
                          : 'Send Drift Alert'}
                    </button>
                    <button
                      type="button"
                      disabled={sendingDigest || sendingAlert}
                      onClick={() => void handleSendWeeklyDigest()}
                      className="vs-btn vs-btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '11.5px' }}
                      title="Generate or dispatch Monday weekly executive client summary"
                    >
                      {sendingDigest
                        ? 'Building...'
                        : isGuided
                          ? 'Weekly Summary Email'
                          : 'Weekly Client Digest'}
                    </button>
                  </div>
                </div>

                <table className="vs-table">
                  <thead>
                    <tr>
                      <th>Engine</th>
                      <th>Rank</th>
                      <th>
                        {isGuided
                          ? 'What AI Says vs. Your Real Facts'
                          : 'Observed Answer / Hallucination Diff'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSnapshots.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            padding: '18px 16px',
                            fontSize: '13px',
                            color: 'var(--vs-ink-secondary)',
                          }}
                        >
                          No snapshots recorded for this engine filter yet. Click{' '}
                          <strong>↻ Re-Scan</strong> above or switch back to{' '}
                          <button
                            type="button"
                            onClick={() => setSelectedEngineFilter('all')}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              fontWeight: 600,
                              color: 'var(--vs-ink)',
                            }}
                          >
                            All ({domainSnapshots.length})
                          </button>
                          .
                        </td>
                      </tr>
                    ) : null}
                    {visibleSnapshots.map((snap) => (
                      <tr key={snap.id}>
                        <td>
                          <div className="vs-mono" style={{ fontWeight: 600 }}>
                            {snap.ai_engine.toUpperCase()}
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <StatusBadge
                              tone={
                                snap.fanout_telemetry_type !== 'mock_fixture'
                                  ? 'pass'
                                  : 'neutral'
                              }
                            >
                              {snap.fanout_telemetry_type === 'observed_query'
                                ? isGuided
                                  ? 'LIVE SEARCH'
                                  : 'LIVE FANOUT'
                                : snap.fanout_telemetry_type ===
                                    'cited_source_only'
                                  ? 'LIVE CITED'
                                  : isGuided
                                    ? 'DEMO SAMPLE'
                                    : 'FIXTURE'}
                            </StatusBadge>
                          </div>
                        </td>
                        <td className="vs-mono">
                          {snap.brand_mentioned
                            ? `#${snap.citation_rank ?? 2}`
                            : 'OMITTED'}
                        </td>
                        <td>
                          <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                            {snap.raw_answer_excerpt}
                          </div>
                          {(snap.hallucination_details ?? []).map((h, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '8px 10px',
                                background: 'var(--vs-crit-bg)',
                                border: '1px solid var(--vs-crit-border)',
                                borderRadius: '5px',
                                fontSize: '12px',
                                color: 'var(--vs-crit-fg)',
                                marginTop: '4px',
                              }}
                            >
                              <strong>
                                {isGuided
                                  ? `WRONG AI CLAIM (${h.category}):`
                                  : `HALLUCINATION (${h.category}):`}
                              </strong>{' '}
                              &ldquo;{h.claim_text}&rdquo;
                              <div style={{ color: 'var(--vs-ink)', marginTop: '2px' }}>
                                <strong>Verified Truth:</strong> {h.verified_truth}
                              </div>
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form
                onSubmit={handleVerifyTruthSheet}
                className="vs-card"
                style={{ padding: '16px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <strong style={{ fontSize: '13.5px' }}>
                    {isGuided ? 'Your Real Business Facts' : 'Brand Truth Sheet'}
                  </strong>
                  <StatusBadge
                    tone={
                      activeDomain.brand_truth_sheet.is_user_verified
                        ? 'pass'
                        : 'warn'
                    }
                  >
                    {activeDomain.brand_truth_sheet.is_user_verified
                      ? 'USER VERIFIED'
                      : 'AUTO-DRAFTED'}
                  </StatusBadge>
                </div>

                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  {isGuided ? 'What You Sell (1–2 sentences)' : 'Core Offering'}
                </label>
                <textarea
                  rows={2}
                  value={coreOffering}
                  onChange={(e) => setCoreOffering(e.target.value)}
                  className="vs-input"
                  style={{ marginBottom: '10px', fontFamily: 'var(--vs-sans)' }}
                />

                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  {isGuided ? 'Your Real Prices' : 'Verified Pricing Summary'}
                </label>
                <input
                  type="text"
                  value={pricingSummary}
                  onChange={(e) => setPricingSummary(e.target.value)}
                  className="vs-input"
                  style={{ marginBottom: '10px', fontFamily: 'var(--vs-sans)' }}
                />

                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  {isGuided
                    ? 'Shipping Rules or Service Area'
                    : 'Shipping / Local Service Radius'}
                </label>
                <input
                  type="text"
                  value={shippingSummary}
                  onChange={(e) => setShippingSummary(e.target.value)}
                  className="vs-input"
                  style={{ marginBottom: '10px', fontFamily: 'var(--vs-sans)' }}
                />

                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  {isGuided
                    ? 'Things You Do NOT Offer (1 per line)'
                    : 'False Claims / Exclusions to Flag (1 per line)'}
                </label>
                <textarea
                  rows={3}
                  value={exclusionsText}
                  onChange={(e) => setExclusionsText(e.target.value)}
                  className="vs-input"
                  style={{ marginBottom: '12px', fontFamily: 'var(--vs-sans)' }}
                />

                <button
                  type="submit"
                  disabled={savingTruth}
                  className="vs-btn"
                  style={{ width: '100%' }}
                >
                  {savingTruth
                    ? 'Updating Website Fixes...'
                    : isGuided
                      ? 'Save Facts & Update Website Fixes'
                      : 'Verify Truth & Regenerate Fixes'}
                </button>
              </form>
            </div>

            {lastAlertPreview ? (
              <div style={{ marginBottom: '22px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    className="vs-mono"
                    style={{ fontSize: '12px', color: 'var(--vs-ink-secondary)' }}
                  >
                    {lastAlertPreview.kind === 'weekly_digest'
                      ? lastAlertPreview.isWhiteLabel
                        ? 'WHITE-LABEL WEEKLY CLIENT DIGEST'
                        : 'WEEKLY EXECUTIVE DIGEST ARTIFACT'
                      : 'WATCHDOG ALERT ARTIFACT'}{' '}
                    (
                    {lastAlertPreview.mode === 'live_resend'
                      ? 'SENT VIA RESEND'
                      : 'DRY-RUN PREVIEW'}{' '}
                    → {lastAlertPreview.recipientEmail})
                  </span>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    {lastAlertPreview.html ? (
                      <button
                        type="button"
                        onClick={handleDownloadDigestHtml}
                        className="vs-btn vs-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                      >
                        ↓ HTML Email
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setLastAlertPreview(null)}
                      className="vs-btn vs-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11.5px' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <CodeArtifactCard
                  title={lastAlertPreview.subject}
                  fileHint={`Recipient: ${lastAlertPreview.recipientEmail} · Mode: ${lastAlertPreview.mode}`}
                  code={lastAlertPreview.text}
                  qualityScore={lastAlertPreview.qualityScore}
                  qualityBreakdown={lastAlertPreview.qualityBreakdown}
                />
              </div>
            ) : null}

            {/* Module 2: AI Bot WAF Status, Crawler Readability & Dual Attribution */}
            <div className="vs-card" style={{ padding: '16px', marginBottom: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  marginBottom: '12px',
                }}
              >
                <strong style={{ fontSize: '13.5px' }}>
                  {isGuided
                    ? 'AI Bot Access, Crawler Readability & Dual Attribution'
                    : 'Module 2 — AI Bot WAF Check, HTML Signal Density & Dual Attribution'}
                </strong>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(
                    [
                      ['GPTBot', activeDomain.robots_ai_bot_status.GPTBot],
                      [
                        'OAI-SearchBot',
                        activeDomain.robots_ai_bot_status['OAI-SearchBot'],
                      ],
                      [
                        'PerplexityBot',
                        activeDomain.robots_ai_bot_status.PerplexityBot,
                      ],
                      ['ClaudeBot', activeDomain.robots_ai_bot_status.ClaudeBot],
                      [
                        'Google-Extended',
                        activeDomain.robots_ai_bot_status['Google-Extended'],
                      ],
                    ] as const
                  ).map(([bot, ok]) => (
                    <StatusBadge key={bot} tone={ok ? 'pass' : 'critical'}>
                      {`${bot}: ${ok ? 'ALLOWED' : '403 BLOCKED'}`}
                    </StatusBadge>
                  ))}
                  <StatusBadge tone={totalBotCrawls > 0 ? 'pass' : 'neutral'}>
                    {`BOT CRAWLS: ${totalBotCrawls}`}
                  </StatusBadge>
                </div>
              </div>

              {activeCrawlerReadability ? (
                <div
                  style={{
                    padding: '10px 14px',
                    marginBottom: '14px',
                    borderRadius: '6px',
                    border: '1px solid var(--vs-border)',
                    background: 'var(--vs-surface-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    fontSize: '12.5px',
                  }}
                >
                  <div>
                    <strong className="vs-mono" style={{ fontSize: '11.5px' }}>
                      RAW HTML CRAWLER READABILITY:
                    </strong>{' '}
                    <span style={{ color: 'var(--vs-ink-secondary)' }}>
                      {activeCrawlerReadability.summary}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <StatusBadge
                      tone={
                        activeCrawlerReadability.status === 'ssr_clean'
                          ? 'pass'
                          : activeCrawlerReadability.status === 'csr_js_trap'
                            ? 'critical'
                            : 'warn'
                      }
                    >
                      {activeCrawlerReadability.status
                        .replace(/_/g, ' ')
                        .toUpperCase()}
                    </StatusBadge>
                    <StatusBadge>
                      SIGNAL DENSITY: {activeCrawlerReadability.signalToHtmlPct}%
                    </StatusBadge>
                    <StatusBadge>
                      WORDS: {activeCrawlerReadability.visibleWordCount} · TOKENS: ~
                      {activeCrawlerReadability.estimatedTokens}
                    </StatusBadge>
                  </div>
                </div>
              ) : null}

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  marginBottom: '12px',
                }}
              >
                <span style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)' }}>
                  {attributionTab === 'browser_pixel'
                    ? 'Track human AI-referred visits and checkout conversions from ChatGPT, Perplexity, Gemini, and Claude.'
                    : 'Log verified server/edge crawls from GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, and Google-Extended.'}
                </span>
                <div
                  role="group"
                  aria-label="Attribution snippet mode"
                  style={{
                    display: 'inline-flex',
                    border: '1px solid var(--vs-border)',
                    borderRadius: '6px',
                    padding: '2px',
                    background: 'var(--vs-surface-subtle)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setAttributionTab('browser_pixel')}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      background:
                        attributionTab === 'browser_pixel'
                          ? 'var(--vs-ink)'
                          : 'transparent',
                      color:
                        attributionTab === 'browser_pixel'
                          ? '#FFFFFF'
                          : 'var(--vs-ink-secondary)',
                    }}
                  >
                    Browser Revenue Pixel (10 Lines)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttributionTab('edge_crawler')}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      background:
                        attributionTab === 'edge_crawler'
                          ? 'var(--vs-ink)'
                          : 'transparent',
                      color:
                        attributionTab === 'edge_crawler'
                          ? '#FFFFFF'
                          : 'var(--vs-ink-secondary)',
                    }}
                  >
                    Edge AI Bot Crawl Logger
                  </button>
                </div>
              </div>

              {attributionTab === 'browser_pixel' ? (
                <>
                  <CodeArtifactCard
                    title={`10-Line Attribution Pixel (${activeDomain.brand_name})`}
                    plainSummary={
                      isGuided
                        ? 'Paste once into your site header to track visits coming from ChatGPT, Perplexity, Gemini, and Claude.'
                        : undefined
                    }
                    fileHint="Paste before </head> in layout/theme.liquid for AI referral visits"
                    code={pixelSnippet}
                  />

                  {shopifyCheckoutPixel ? (
                    <div style={{ marginTop: '14px' }}>
                      <CodeArtifactCard
                        title={`Shopify Customer Events Checkout Pixel (${activeDomain.brand_name})`}
                        plainSummary={
                          isGuided
                            ? 'Tracks exact checkout order dollars from AI shoppers inside Shopify Admin -> Settings -> Customer events.'
                            : undefined
                        }
                        fileHint="Shopify Admin -> Settings -> Customer events -> Add custom pixel (tracks checkout_completed USD)"
                        code={shopifyCheckoutPixel}
                      />
                    </div>
                  ) : null}
                </>
              ) : (
                <CodeArtifactCard
                  title={`Edge / Next.js Middleware AI Bot Crawl Logger (${activeDomain.brand_name})`}
                  plainSummary={
                    isGuided
                      ? 'Optional server middleware snippet that logs real GPTBot, PerplexityBot, ClaudeBot, and Google-Extended hits without slowing page loads.'
                      : undefined
                  }
                  fileHint="Paste into middleware.ts or Cloudflare Worker fetch() — authenticated via HMAC-SHA256 checkout_key"
                  code={edgeCrawlerSnippet}
                />
              )}

              {/* Live Agent Crawl & AI Referral Event Ledger */}
              <div
                style={{
                  marginTop: '16px',
                  border: '1px solid var(--vs-border)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--vs-surface-subtle)',
                    borderBottom: '1px solid var(--vs-border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    <span
                      className="vs-eyebrow"
                      style={{ color: 'var(--vs-ink)' }}
                    >
                      LIVE AGENT CRAWL &amp; REFERRAL LEDGER
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--vs-ink-muted)',
                        marginLeft: '8px',
                      }}
                    >
                      {`${domainAttribution.length} verified telemetry event(s)`}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        border: '1px solid var(--vs-border)',
                        borderRadius: '5px',
                        padding: '2px',
                        background: '#FFFFFF',
                        gap: '2px',
                      }}
                    >
                      {(
                        [
                          {
                            id: 'all',
                            label: `All (${domainAttribution.length})`,
                          },
                          {
                            id: 'bot_crawls',
                            label: `Bot Crawls (${totalBotCrawls})`,
                          },
                          {
                            id: 'human_referrals',
                            label: `Visits & Sales (${
                              domainAttribution.length - totalBotCrawls
                            })`,
                          },
                        ] as const
                      ).map((pill) => {
                        const active = attributionEventFilter === pill.id;
                        return (
                          <button
                            key={pill.id}
                            type="button"
                            onClick={() => setAttributionEventFilter(pill.id)}
                            style={{
                              border: 'none',
                              cursor: 'pointer',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: active
                                ? 'var(--vs-ink)'
                                : 'transparent',
                              color: active
                                ? '#FFFFFF'
                                : 'var(--vs-ink-secondary)',
                            }}
                          >
                            {pill.label}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={sendingTestBotPing}
                      onClick={() => void handleSendTestBotPing()}
                      className="vs-btn vs-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11.5px' }}
                      title="Send a signed HMAC test GPTBot crawl ping to verify your telemetry pipeline"
                    >
                      {sendingTestBotPing
                        ? 'Pinging...'
                        : '⚡ Send Test Bot Ping'}
                    </button>
                  </div>
                </div>

                {(() => {
                  const filteredEvents = domainAttribution.filter((ev) => {
                    if (attributionEventFilter === 'bot_crawls') {
                      return ev.event_type === 'ai_bot_crawl';
                    }
                    if (attributionEventFilter === 'human_referrals') {
                      return ev.event_type !== 'ai_bot_crawl';
                    }
                    return true;
                  });

                  if (filteredEvents.length === 0) {
                    return (
                      <div
                        style={{
                          padding: '14px',
                          fontSize: '12.5px',
                          color: 'var(--vs-ink-secondary)',
                        }}
                      >
                        No telemetry events recorded in this filter yet. Paste
                        the pixel or Edge Bot Crawl Logger above, or click{' '}
                        <strong>⚡ Send Test Bot Ping</strong> to verify live
                        ingestion.
                      </div>
                    );
                  }

                  return (
                    <div className="vs-table-wrap">
                      <table className="vs-table">
                        <thead>
                          <tr>
                            <th>Signal</th>
                            <th>Engine / Crawler</th>
                            <th>Target Path</th>
                            <th>Outcome / Revenue</th>
                            <th>Observed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEvents.slice(0, 10).map((ev) => (
                            <tr key={ev.id}>
                              <td>
                                <StatusBadge
                                  tone={
                                    ev.event_type === 'ai_referral_conversion'
                                      ? 'pass'
                                      : ev.event_type === 'ai_bot_crawl'
                                        ? 'neutral'
                                        : 'warn'
                                  }
                                >
                                  {ev.event_type === 'ai_bot_crawl'
                                    ? 'BOT CRAWL'
                                    : ev.event_type === 'ai_referral_conversion'
                                      ? 'CHECKOUT SALE'
                                      : 'AI REFERRAL'}
                                </StatusBadge>
                              </td>
                              <td
                                className="vs-mono"
                                style={{ fontSize: '12px', fontWeight: 600 }}
                              >
                                {ev.source_engine}
                              </td>
                              <td
                                className="vs-mono"
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--vs-ink-secondary)',
                                }}
                              >
                                {ev.landing_path || '/'}
                              </td>
                              <td
                                className="vs-mono"
                                style={{ fontSize: '12px' }}
                              >
                                {ev.event_type === 'ai_referral_conversion' &&
                                typeof ev.conversion_value_usd === 'number'
                                  ? `$${ev.conversion_value_usd.toFixed(2)} USD`
                                  : ev.event_type === 'ai_bot_crawl'
                                    ? 'HMAC Verified'
                                    : 'Session Landed'}
                              </td>
                              <td
                                className="vs-mono"
                                style={{
                                  fontSize: '11.5px',
                                  color: 'var(--vs-ink-muted)',
                                }}
                              >
                                {ev.created_at.slice(0, 16).replace('T', ' ')}{' '}
                                UTC
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'tab2_fixes' && activeDomain ? (
          <div>
            {isGuided ? (
              <GuidedExplainerBanner
                stepLabel="STEP 02 OF 03 · COPY-PASTE WEBSITE FIXES"
                title="Publish verified facts onto your website"
                description="Click Download Full Fix Bundle (.md) to hand one ready-to-use file to your web designer, or click Copy Code on any block below."
                glossary={[
                  {
                    term: 'JSON-LD',
                    meaning: 'Hidden fact-sheet code AI & search engines read',
                  },
                  {
                    term: '/agents.md',
                    meaning: 'Instruction rulebook for AI shopping assistants',
                  },
                  {
                    term: '/llms.txt',
                    meaning: 'Quick-read 1-page directory of your website',
                  },
                ]}
              />
            ) : null}

            {/* 1-Click AI Remediation Master Prompt (Claude · ChatGPT · Antigravity · Cursor) */}
            {aiRemediationMasterPrompt ? (
              <div
                className="vs-card"
                style={{
                  marginBottom: '20px',
                  overflow: 'hidden',
                  border: '1px solid var(--vs-ink)',
                }}
              >
                <div
                  style={{
                    padding: '14px 18px',
                    background: 'var(--vs-surface-warm)',
                    borderBottom: expandedAiFixPrompt
                      ? '1px solid var(--vs-border)'
                      : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ maxWidth: '720px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          className="vs-eyebrow"
                          style={{ color: 'var(--vs-ink)' }}
                        >
                          1-CLICK AI FIX PROMPT · CLAUDE · CHATGPT · ANTIGRAVITY · CURSOR
                        </span>
                        <StatusBadge tone="pass">
                          SYNTAX &amp; TRUTH VERIFIED
                        </StatusBadge>
                      </div>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '15px',
                          marginBottom: '4px',
                        }}
                      >
                        {isGuided
                          ? `Copy one prompt and let your AI fix ${activeDomain.brand_name} automatically`
                          : `Master Remediation Prompt for ${activeDomainHostname}`}
                      </strong>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--vs-ink-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        Bundles every issue Verisource found on{' '}
                        <code className="vs-mono">{activeDomainHostname}</code>{' '}
                        (crawler access, JS readability, hallucinated claims,
                        and syntax-validated <code className="vs-mono">JSON-LD</code> +{' '}
                        <code className="vs-mono">/agents.md</code> +{' '}
                        <code className="vs-mono">/llms.txt</code> code) into a
                        single zero-hallucination prompt for whatever AI tool you
                        use.
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => void handleCopyAiRemediationPrompt()}
                        className="vs-btn"
                        style={{ padding: '8px 15px', fontSize: '12.5px' }}
                      >
                        {copiedAiFixPrompt
                          ? '✓ Copied — Paste Into Your AI!'
                          : 'Copy Prompt for My AI'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadAiRemediationPrompt}
                        className="vs-btn vs-btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        ↓ Prompt (.md)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAiFixPrompt((prev) => !prev)
                        }
                        className="vs-btn vs-btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        {expandedAiFixPrompt
                          ? 'Hide Prompt'
                          : 'Inspect Full Prompt'}
                      </button>
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
                      className="vs-mono"
                      style={{
                        fontSize: '11px',
                        color: 'var(--vs-ink-muted)',
                      }}
                    >
                      TARGET AI TOOL:
                    </span>
                    <div
                      role="group"
                      aria-label="Target AI environment"
                      style={{
                        display: 'inline-flex',
                        flexWrap: 'wrap',
                        border: '1px solid var(--vs-border)',
                        borderRadius: '6px',
                        padding: '2px',
                        background: '#FFFFFF',
                        gap: '2px',
                      }}
                    >
                      {(
                        [
                          {
                            id: 'coding_agent',
                            label:
                              'Coding Agent (Antigravity · Claude · Cursor)',
                          },
                          {
                            id: 'chat_assistant',
                            label: 'ChatGPT / Claude Web (CMS & No-Code)',
                          },
                          {
                            id: 'shopify_liquid',
                            label: 'Shopify Theme (Liquid)',
                          },
                        ] as const
                      ).map((opt) => {
                        const active = aiPromptTargetEnv === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setAiPromptTargetEnv(opt.id)}
                            style={{
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              background: active
                                ? 'var(--vs-ink)'
                                : 'transparent',
                              color: active
                                ? '#FFFFFF'
                                : 'var(--vs-ink-secondary)',
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {expandedAiFixPrompt ? (
                  <div style={{ padding: '14px 18px', background: '#FFFFFF' }}>
                    <CodeArtifactCard
                      title={`Master AI Remediation Prompt (${activeDomain.brand_name})`}
                      fileHint="Paste directly into Antigravity, Claude Code, ChatGPT, Cursor, Windsurf, or Lovable"
                      code={aiRemediationMasterPrompt.content}
                      qualityScore={aiRemediationMasterPrompt.score}
                      qualityBreakdown={aiRemediationMasterPrompt.breakdown}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* M48: AI Citation & Rival Comparison Page Studio */}
            {activeCitationPageBundle ? (
              <div
                className="vs-card"
                style={{
                  overflow: 'hidden',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    padding: '14px 18px',
                    background: 'var(--vs-surface-subtle)',
                    borderBottom: expandedCitationPageStudio
                      ? '1px solid var(--vs-border)'
                      : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ maxWidth: '720px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          className="vs-eyebrow"
                          style={{ color: 'var(--vs-ink)' }}
                        >
                          AI CITATION &amp; RIVAL COMPARISON PAGE STUDIO
                        </span>
                        <StatusBadge tone="pass">BRAND TRUTH LOCKED</StatusBadge>
                        <StatusBadge>
                          {`ROUTE: ${activeCitationPageBundle.suggestedPath}`}
                        </StatusBadge>
                      </div>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '15px',
                          marginBottom: '4px',
                        }}
                      >
                        {isGuided
                          ? `Win buyer comparisons and uncited prompts with a structured Answer Page`
                          : activeCitationPageBundle.pageTitle}
                      </strong>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--vs-ink-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        ChatGPT and Perplexity cite structured{' '}
                        <code className="vs-mono">&lt;table&gt;</code>{' '}
                        comparisons and Answer-First buyer guides on commercial
                        shortlists. Generate a truth-locked{' '}
                        <strong>{activeDomain.brand_name} vs. Competitor</strong>{' '}
                        or <strong>Buyer Guide</strong> page—or copy one prompt so
                        your AI builds the route automatically.
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => void handleCopyCitationPageAiPrompt()}
                        className="vs-btn"
                        style={{ padding: '8px 14px', fontSize: '12.5px' }}
                      >
                        {copiedCitationPagePrompt
                          ? '✓ AI Page Prompt Copied!'
                          : 'Copy AI Prompt to Build Page'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCopyCitationPageMarkdown()}
                        className="vs-btn vs-btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        {copiedCitationPageMd
                          ? '✓ Page Copied'
                          : 'Copy Page + Schema'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadCitationPageMarkdown}
                        className="vs-btn vs-btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        ↓ Page (.md)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCitationPageStudio((prev) => !prev)
                        }
                        className="vs-btn vs-btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        {expandedCitationPageStudio
                          ? 'Hide Preview'
                          : 'Inspect Page & Schema'}
                      </button>
                    </div>
                  </div>

                  {/* Blueprint Selector + Rival / Prompt Input Row */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div
                      role="group"
                      aria-label="Citation page blueprint"
                      style={{
                        display: 'inline-flex',
                        flexWrap: 'wrap',
                        border: '1px solid var(--vs-border)',
                        borderRadius: '6px',
                        padding: '2px',
                        background: '#FFFFFF',
                        gap: '2px',
                      }}
                    >
                      {(
                        [
                          {
                            id: 'vs_competitor',
                            label: `${activeDomain.brand_name} vs. Competitor`,
                          },
                          {
                            id: 'buyer_guide',
                            label: 'Buyer Guide (Win Prompt)',
                          },
                          {
                            id: 'pricing_truth',
                            label: 'Pricing & Policy Reference',
                          },
                        ] as const
                      ).map((bp) => {
                        const active = citationBlueprintType === bp.id;
                        return (
                          <button
                            key={bp.id}
                            type="button"
                            onClick={() => setCitationBlueprintType(bp.id)}
                            style={{
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              background: active
                                ? 'var(--vs-ink)'
                                : 'transparent',
                              color: active
                                ? '#FFFFFF'
                                : 'var(--vs-ink-secondary)',
                            }}
                          >
                            {bp.label}
                          </button>
                        );
                      })}
                    </div>

                    {citationBlueprintType === 'vs_competitor' ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span
                          className="vs-mono"
                          style={{
                            fontSize: '11px',
                            color: 'var(--vs-ink-muted)',
                          }}
                        >
                          COMPARE AGAINST:
                        </span>
                        {detectedRivalNames.slice(0, 3).map((rival) => {
                          const isSelected =
                            effectiveRivalForStudio.toLowerCase() ===
                            rival.toLowerCase();
                          return (
                            <button
                              key={rival}
                              type="button"
                              onClick={() => setCustomCitationRival(rival)}
                              className="vs-btn vs-btn-secondary"
                              style={{
                                padding: '3px 9px',
                                fontSize: '11.5px',
                                borderColor: isSelected
                                  ? 'var(--vs-ink)'
                                  : undefined,
                                fontWeight: isSelected ? 700 : 500,
                              }}
                            >
                              {rival}
                            </button>
                          );
                        })}
                        <input
                          type="text"
                          value={customCitationRival}
                          onChange={(e) =>
                            setCustomCitationRival(e.target.value)
                          }
                          placeholder="Or type rival name..."
                          className="vs-input"
                          style={{
                            width: '175px',
                            padding: '4px 9px',
                            fontSize: '12px',
                            fontFamily: 'var(--vs-sans)',
                          }}
                        />
                      </div>
                    ) : citationBlueprintType === 'buyer_guide' ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: '6px',
                          flex: '1 1 320px',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <select
                          aria-label="Select tracked buyer prompt"
                          value={effectivePromptForStudio}
                          onChange={(e) =>
                            setCustomCitationPrompt(e.target.value)
                          }
                          className="vs-input"
                          style={{
                            width: 'auto',
                            maxWidth: '340px',
                            padding: '4px 9px',
                            fontSize: '12px',
                            fontFamily: 'var(--vs-sans)',
                          }}
                        >
                          {[
                            ...domainPrompts.map((p) => p.prompt_text),
                            ...suggestedBuyerPrompts
                              .slice(0, 4)
                              .map((s) => s.promptText),
                          ].map((txt) => (
                            <option key={txt} value={txt}>
                              {txt}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={customCitationPrompt}
                          onChange={(e) =>
                            setCustomCitationPrompt(e.target.value)
                          }
                          placeholder="Or type custom buyer question..."
                          className="vs-input"
                          style={{
                            width: '220px',
                            padding: '4px 9px',
                            fontSize: '12px',
                            fontFamily: 'var(--vs-sans)',
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                {expandedCitationPageStudio ? (
                  <div
                    style={{
                      padding: '14px 18px',
                      background: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <CodeArtifactCard
                      title={activeCitationPageBundle.pageTitle}
                      fileHint={`Publish at ${activeCitationPageBundle.canonicalUrl} (SSR HTML / Markdown)`}
                      code={activeCitationPageBundle.markdownPage.content}
                      qualityScore={activeCitationPageBundle.markdownPage.score}
                      qualityBreakdown={
                        activeCitationPageBundle.markdownPage.breakdown
                      }
                    />
                    <CodeArtifactCard
                      title={`Page-Specific FAQPage JSON-LD (${activeCitationPageBundle.suggestedPath})`}
                      fileHint={`Inject inside <script type="application/ld+json"> on ${activeCitationPageBundle.suggestedPath}`}
                      code={activeCitationPageBundle.faqJsonLd}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Shopify Native Adapter Callout */}
            {activeDomain.is_shopify ? (
              <div
                className="vs-card"
                style={{
                  padding: '16px 18px',
                  marginBottom: '20px',
                  background: 'var(--vs-surface-warm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '8px',
                  }}
                >
                  <strong>
                    Shopify Native Storefront Adapter ({activeDomain.brand_name})
                  </strong>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <StatusBadge
                      tone={
                        activeDomain.shopify_mcp_status === 'ucp_active'
                          ? 'pass'
                          : 'warn'
                      }
                    >
                      MCP ENDPOINT:{' '}
                      {activeDomain.shopify_mcp_status === 'ucp_active'
                        ? '/api/ucp/mcp ACTIVE'
                        : activeDomain.shopify_mcp_status === 'legacy_mcp_active'
                          ? '/api/mcp LEGACY'
                          : 'UNAVAILABLE'}
                    </StatusBadge>
                    <StatusBadge
                      tone={
                        activeDomain.agents_md_status === 'custom_enriched'
                          ? 'pass'
                          : 'warn'
                      }
                    >
                      /agents.md: {activeDomain.agents_md_status.toUpperCase()}
                    </StatusBadge>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
                  <strong>Shopify Deployment Path:</strong> Save the Liquid
                  override below as{' '}
                  <code className="vs-mono">templates/agents.md.liquid</code> in
                  your Online Store theme, paste the{' '}
                  <code className="vs-mono">JSON-LD</code> block inside{' '}
                  <code className="vs-mono">layout/theme.liquid</code> before{' '}
                  <code className="vs-mono">&lt;/head&gt;</code>, and map{' '}
                  <code className="vs-mono">/llms.txt</code> via Shopify URL
                  Redirects or Cloudflare Worker edge route.
                </div>
              </div>
            ) : null}

            {/* AI Shopping & Offer Attribute Readiness Matrix */}
            {commerceReadiness ? (
              <div
                className="vs-card"
                style={{ overflow: 'hidden', marginBottom: '18px' }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--vs-border)',
                    background: 'var(--vs-surface-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                      AI SHOPPING &amp; OFFER ATTRIBUTE READINESS
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--vs-ink-muted)',
                        marginLeft: '8px',
                      }}
                    >
                      {isGuided
                        ? '5 structured fields ChatGPT Shopping & Perplexity check before recommending products or services'
                        : 'Structured offer, policy & entity completeness across live pages and generated Fix Bundle'}
                    </span>
                  </div>
                  <StatusBadge
                    tone={
                      commerceReadiness.readinessPct >= 80 ? 'pass' : 'warn'
                    }
                  >
                    {commerceReadiness.passedCount} /{' '}
                    {commerceReadiness.totalCount} LIVE (
                    {commerceReadiness.readinessPct}%)
                  </StatusBadge>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '1px',
                    background: 'var(--vs-border)',
                  }}
                >
                  {commerceReadiness.attributes.map((attr) => (
                    <div
                      key={attr.id}
                      style={{
                        padding: '12px 14px',
                        background: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '6px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            marginBottom: '5px',
                          }}
                        >
                          <strong style={{ fontSize: '12.5px' }}>
                            {attr.label}
                          </strong>
                          <StatusBadge
                            tone={
                              attr.liveOnSite
                                ? 'pass'
                                : attr.readyInBundle
                                  ? 'neutral'
                                  : 'warn'
                            }
                          >
                            {attr.liveOnSite
                              ? 'LIVE'
                              : attr.readyInBundle
                                ? 'IN BUNDLE'
                                : 'PENDING'}
                          </StatusBadge>
                        </div>
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--vs-ink-secondary)',
                            lineHeight: 1.4,
                          }}
                        >
                          {attr.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div
              className="vs-card"
              style={{
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '3px',
                  }}
                >
                  <strong style={{ fontSize: '13.5px' }}>
                    Syntax-Validated Implementation Bundle ({domainFixes.length}{' '}
                    artifacts)
                  </strong>
                  {activeScoreDelta && activeScoreDelta.visibilityDelta > 0 ? (
                    <StatusBadge tone="pass">
                      BEFORE → AFTER: {activeScoreDelta.previousVisibilityScore} →{' '}
                      {activeScoreDelta.currentVisibilityScore} (+
                      {activeScoreDelta.visibilityDelta} PTS)
                    </StatusBadge>
                  ) : activeScoreDelta ? (
                    <StatusBadge tone="neutral">
                      VERIFIED: {activeScoreDelta.previousVisibilityScore} →{' '}
                      {activeScoreDelta.currentVisibilityScore} (
                      {activeScoreDelta.visibilityDelta >= 0
                        ? `+${activeScoreDelta.visibilityDelta}`
                        : activeScoreDelta.visibilityDelta}{' '}
                      PTS)
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">
                      BASELINE: {activeDomain.visibility_score}/100 ·{' '}
                      {appliedOnSiteFixesCount}/{onSiteDomainFixes.length} LIVE
                    </StatusBadge>
                  )}
                </div>
                <div
                  style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
                >
                  Single-file handoff for engineering or agency client delivery (
                  <code className="vs-mono">JSON-LD</code>,{' '}
                  <code className="vs-mono">/llms.txt</code>,{' '}
                  <code className="vs-mono">/agents.md</code>, and FAQ blocks).
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => void handleVerifyLiveFixes()}
                  disabled={verifyingFixes}
                  className="vs-btn vs-btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12.5px' }}
                >
                  {verifyingFixes ? 'Probing Live Site...' : '✓ Verify Live Fixes'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadFixBundle}
                  disabled={domainFixes.length === 0}
                  className="vs-btn"
                  style={{ padding: '8px 14px', fontSize: '12.5px' }}
                >
                  ↓ Download Full Fix Bundle (.md)
                </button>
              </div>
            </div>

            {lastFixVerification ? (
              <div
                className="vs-card"
                style={{ overflow: 'hidden', marginBottom: '18px' }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--vs-border)',
                    background: 'var(--vs-surface-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <strong style={{ fontSize: '13px' }}>
                    Live Fix Deployment Check — {lastFixVerification.hostname}
                  </strong>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {activeScoreDelta ? (
                      <StatusBadge
                        tone={
                          activeScoreDelta.visibilityDelta > 0
                            ? 'pass'
                            : 'neutral'
                        }
                      >
                        SCORE IMPACT: {activeScoreDelta.previousVisibilityScore}{' '}
                        → {activeScoreDelta.currentVisibilityScore} (
                        {activeScoreDelta.visibilityDelta >= 0
                          ? `+${activeScoreDelta.visibilityDelta}`
                          : activeScoreDelta.visibilityDelta}{' '}
                        PTS)
                      </StatusBadge>
                    ) : null}
                    <span
                      className="vs-mono"
                      style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}
                    >
                      Checked{' '}
                      {new Date(
                        lastFixVerification.checkedAt
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="vs-ledger-strip-4">
                  {lastFixVerification.checks.map((item) => (
                    <div key={item.id} style={{ padding: '13px 15px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          marginBottom: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '12.5px',
                            color: 'var(--vs-ink)',
                          }}
                        >
                          {item.label}
                        </span>
                        <StatusBadge tone={item.live ? 'pass' : 'warn'}>
                          {item.live ? 'LIVE' : 'PENDING'}
                        </StatusBadge>
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--vs-ink-secondary)',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {domainFixes.map((fix) => (
                <CodeArtifactCard
                  key={fix.id}
                  title={fix.title}
                  plainSummary={
                    isGuided ? describeFixPlainly(fix.fix_type) : undefined
                  }
                  fileHint={`Fix Type: ${fix.fix_type}`}
                  code={fix.content_payload}
                  statusBadge={
                    fix.fix_type === 'citation_outreach_brief'
                      ? { label: 'OFF-SITE OUTREACH DRAFT', tone: 'neutral' }
                      : fix.is_applied
                        ? { label: 'LIVE ON SITE', tone: 'pass' }
                        : { label: 'READY TO PUBLISH', tone: 'neutral' }
                  }
                  qualityScore={Number(fix.natural_quality_score)}
                  qualityBreakdown={fix.quality_rubric_breakdown}
                />
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'tab3_offsite' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {isGuided ? (
              <GuidedExplainerBanner
                stepLabel="STEP 03 OF 03 · COMPETITORS & CLIENT REPORTS"
                title="See where competitors get recommended & share client links"
                description="Add real questions buyers ask to uncover which blogs and Reddit threads AI trusts, or create a clean branded audit page to send to a prospect."
                glossary={[
                  {
                    term: 'Competitor Sources',
                    meaning: 'Third-party articles & threads AI trusts',
                  },
                  {
                    term: 'White-Label Pitch URL',
                    meaning: 'Shareable client report with your logo & booking button',
                  },
                ]}
              />
            ) : null}

            {activeDomain ? (
              <>
            {/* Citation Gap Source Leaderboard */}
            <div className="vs-card vs-table-wrap">
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--vs-border)',
                  background: 'var(--vs-surface-subtle)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div>
                  <div className="vs-eyebrow" style={{ color: 'var(--vs-ink)', marginBottom: '2px' }}>
                    CITATION GAP SOURCE LEADERBOARD
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--vs-ink-muted)' }}>
                    {isGuided
                      ? 'External articles and threads AI trusts — ranked so you know where to get listed first'
                      : 'Third-party domains ranked by engine citation frequency and brand omission priority'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    border: '1px solid var(--vs-border)',
                    borderRadius: '5px',
                    padding: '2px',
                    background: '#FFFFFF',
                    gap: '2px',
                  }}
                >
                  {(
                    [
                      {
                        id: 'all',
                        label: `All Sources (${rankedCitationSources.length})`,
                      },
                      {
                        id: 'citation_gap',
                        label: `Citation Gaps (${citationGapCount})`,
                      },
                      {
                        id: 'co_cited_or_owned',
                        label: `Co-Cited / Owned (${
                          rankedCitationSources.length - citationGapCount
                        })`,
                      },
                    ] as const
                  ).map((pill) => {
                    const active = citationSourceFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setCitationSourceFilter(pill.id)}
                        style={{
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          background: active ? 'var(--vs-ink)' : 'transparent',
                          color: active ? '#FFFFFF' : 'var(--vs-ink-secondary)',
                        }}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <table className="vs-table">
                <thead>
                  <tr>
                    <th>Source Domain &amp; Cited URL</th>
                    <th>Engines Citing</th>
                    <th>Rivals Fed</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCitationSources.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: '16px',
                          fontSize: '13px',
                          color: 'var(--vs-ink-secondary)',
                        }}
                      >
                        No citation sources match this filter yet. Add a buyer
                        question below or switch back to{' '}
                        <strong>All Sources ({rankedCitationSources.length})</strong>.
                      </td>
                    </tr>
                  ) : null}
                  {filteredCitationSources.map((src) => {
                    const primaryUrl = src.urls[0] ?? `https://${src.sourceHost}`;
                    const isPitchSelected =
                      selectedCitationSourceHost === src.sourceHost;
                    return (
                      <tr key={src.sourceHost}>
                        <td>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <strong>{src.sourceHost}</strong>
                            <StatusBadge>{src.sourceCategoryLabel}</StatusBadge>
                            {src.urls.length > 1 ? (
                              <span
                                className="vs-mono"
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--vs-ink-muted)',
                                }}
                              >
                                (+{src.urls.length - 1} URL
                                {src.urls.length - 1 === 1 ? '' : 's'})
                              </span>
                            ) : null}
                          </div>
                          <div
                            className="vs-mono"
                            style={{
                              fontSize: '11.5px',
                              marginTop: '3px',
                              wordBreak: 'break-all',
                            }}
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
                          <div
                            style={{
                              fontSize: '11.5px',
                              marginTop: '3px',
                              color: 'var(--vs-ink-muted)',
                            }}
                          >
                            {src.recommendedAction}
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              flexWrap: 'wrap',
                              gap: '4px',
                            }}
                          >
                            {src.enginesCiting.map((eng) => (
                              <StatusBadge key={eng}>
                                {eng.toUpperCase()}
                              </StatusBadge>
                            ))}
                          </div>
                        </td>
                        <td
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--vs-ink-secondary)',
                            maxWidth: '220px',
                          }}
                        >
                          {src.ownership === 'owned'
                            ? 'Direct brand asset'
                            : src.rivalsFed.length > 0
                              ? src.rivalsFed.join(' · ')
                              : 'Category peers'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {src.ownership === 'citation_gap' ? (
                            <StatusBadge tone="critical">CITATION GAP</StatusBadge>
                          ) : src.ownership === 'co_cited' ? (
                            <StatusBadge tone="pass">BRAND CO-CITED</StatusBadge>
                          ) : (
                            <StatusBadge tone="pass">OWNED ASSET</StatusBadge>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                void handleCopyCitationSourceUrl(primaryUrl)
                              }
                              className="vs-btn vs-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11.5px' }}
                            >
                              {copiedCitationUrl === primaryUrl
                                ? '✓ Copied'
                                : 'Copy URL'}
                            </button>
                            {src.ownership !== 'owned' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedCitationSourceHost((prev) =>
                                    prev === src.sourceHost
                                      ? null
                                      : src.sourceHost
                                  )
                                }
                                className="vs-btn vs-btn-secondary"
                                style={{
                                  padding: '4px 9px',
                                  fontSize: '11.5px',
                                  borderColor: isPitchSelected
                                    ? 'var(--vs-ink)'
                                    : undefined,
                                }}
                              >
                                {isPitchSelected ? 'Selected' : 'Draft Pitch'}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {activeOutreachTarget && targetedCitationOutreach ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
                    Targeted Editorial Inclusion Note —{' '}
                    <span className="vs-mono">{activeOutreachTarget.sourceHost}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCitationSourceHost(null)}
                    className="vs-btn vs-btn-secondary"
                    style={{ padding: '3px 9px', fontSize: '11.5px' }}
                  >
                    Close Draft
                  </button>
                </div>
                <CodeArtifactCard
                  title={`Editorial Spec Update (${activeOutreachTarget.sourceHost})`}
                  plainSummary={
                    isGuided
                      ? 'Short, polite 4-sentence note sharing your verified /agents.md fact sheet with the author of this cited article.'
                      : undefined
                  }
                  fileHint={`Cited URL: ${activeOutreachTarget.urls[0] ?? activeOutreachTarget.sourceHost}`}
                  code={targetedCitationOutreach.content}
                  qualityScore={targetedCitationOutreach.score}
                  qualityBreakdown={targetedCitationOutreach.breakdown}
                />
              </div>
            ) : null}

            {/* Module 3: Query Fanout Decompiler & Citation Gap Map */}
            <div className="vs-card vs-table-wrap">
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--vs-border)',
                  background: 'var(--vs-surface-subtle)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <strong style={{ fontSize: '13.5px' }}>
                  {isGuided
                    ? 'Questions Buyers Ask AI & Auto-Suggested Prompts'
                    : 'Module 3 — Prompt Discovery, Funnel Intent & Query Fanout Decompiler'}
                </strong>
                <form
                  onSubmit={handleAddPrompt}
                  style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}
                >
                  <input
                    type="text"
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    placeholder="Add buyer question (e.g. best B2B software or storefront for...)"
                    className="vs-input"
                    style={{
                      width: '300px',
                      maxWidth: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontFamily: 'var(--vs-sans)',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={addingPrompt}
                    className="vs-btn vs-btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    {addingPrompt ? 'Scanning 3 Engines...' : '+ Track Prompt'}
                  </button>
                </form>
              </div>

              {suggestedBuyerPrompts.length > 0 ? (
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--vs-border)',
                    background: 'var(--vs-surface-warm)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '8px',
                    }}
                  >
                    <span className="vs-eyebrow" style={{ color: 'var(--vs-ink)' }}>
                      AUTO-SUGGESTED BUYER PROMPTS (1-CLICK SCAN ACROSS 3 ENGINES)
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}>
                      Synthesized from your Brand Truth Sheet &amp; named category rivals
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {suggestedBuyerPrompts.slice(0, 4).map((sug) => {
                      const isScanningThis =
                        scanningSuggestedPrompt === sug.promptText;
                      return (
                        <div
                          key={sug.promptText}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--vs-border)',
                            background: '#FFFFFF',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                flexWrap: 'wrap',
                                marginBottom: '5px',
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
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '12.5px',
                                marginBottom: '3px',
                              }}
                            >
                              &ldquo;{sug.promptText}&rdquo;
                            </div>
                            <div
                              style={{
                                fontSize: '11.5px',
                                color: 'var(--vs-ink-secondary)',
                              }}
                            >
                              {sug.rationale}
                            </div>
                          </div>
                          <div>
                            <button
                              type="button"
                              disabled={scanningSuggestedPrompt !== null}
                              onClick={() =>
                                void handleTrackSuggestedPrompt(
                                  sug.promptText,
                                  sug.intentCategory
                                )
                              }
                              className="vs-btn vs-btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '11.5px' }}
                            >
                              {isScanningThis
                                ? 'Scanning 3 Engines...'
                                : '+ Track & Scan →'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <table className="vs-table">
                <thead>
                  <tr>
                    <th>{isGuided ? 'Question Buyers Ask' : 'Buyer Prompt & Funnel Stage'}</th>
                    <th>
                      {isGuided
                        ? 'What AI Searches Behind the Scenes'
                        : 'Observed Engine Fanout Sub-Queries'}
                    </th>
                    <th>
                      {isGuided
                        ? 'Websites Mentioning Competitors'
                        : 'Unblurred Competitor Citation Targets'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {domainPrompts.map((p) => {
                    const relatedSnaps = domainSnapshots.filter(
                      (s) => s.prompt_id === p.id
                    );
                    const citedUrls = Array.from(
                      new Set(relatedSnaps.flatMap((s) => s.cited_source_urls))
                    );
                    const intentMeta = getPromptIntentMeta(
                      p.intent_category,
                      p.prompt_text,
                      activeDomain.brand_name
                    );
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600, marginBottom: '5px' }}>
                            {p.prompt_text}
                          </div>
                          <div
                            style={{
                              display: 'inline-flex',
                              gap: '5px',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                            }}
                          >
                            <StatusBadge
                              tone={intentMeta.isBranded ? 'neutral' : 'pass'}
                            >
                              {intentMeta.shortBadge}
                            </StatusBadge>
                            <StatusBadge>
                              {intentMeta.isBranded ? 'BRANDED' : 'UNBRANDED'}
                            </StatusBadge>
                            <button
                              type="button"
                              disabled={
                                rescanningPromptId !== null ||
                                deletingPromptId !== null
                              }
                              onClick={() => void handleRescanPrompt(p.id)}
                              className="vs-btn vs-btn-secondary"
                              style={{ padding: '2px 7px', fontSize: '10.5px' }}
                              title="Re-scan this prompt across ChatGPT, Gemini & Perplexity"
                            >
                              {rescanningPromptId === p.id
                                ? 'Scanning...'
                                : '↻ Re-Scan'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCitationBlueprintType('buyer_guide');
                                setCustomCitationPrompt(p.prompt_text);
                                setExpandedCitationPageStudio(true);
                                setActiveTab('tab2_fixes');
                              }}
                              className="vs-btn vs-btn-secondary"
                              style={{ padding: '2px 7px', fontSize: '10.5px' }}
                              title="Generate an Answer-First Buyer Guide page for this prompt in Step 02"
                            >
                              Draft Answer Page →
                            </button>
                            {!isProtectedDemoSeedDomain ||
                            domainPrompts.length > 1 ? (
                              <button
                                type="button"
                                disabled={
                                  deletingPromptId !== null ||
                                  rescanningPromptId !== null
                                }
                                onClick={() =>
                                  void handleDeletePrompt(p.id, p.prompt_text)
                                }
                                className="vs-btn vs-btn-secondary"
                                style={{
                                  padding: '2px 7px',
                                  fontSize: '10.5px',
                                  color: 'var(--vs-crit-fg)',
                                }}
                                title="Remove prompt to free up plan quota"
                              >
                                {deletingPromptId === p.id
                                  ? 'Removing...'
                                  : 'Remove'}
                              </button>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          {p.decompiled_fanout_queries.map((q) => (
                            <div
                              key={q}
                              className="vs-mono"
                              style={{
                                fontSize: '12px',
                                marginBottom: '4px',
                                color: 'var(--vs-ink-secondary)',
                              }}
                            >
                              → {q}
                            </div>
                          ))}
                        </td>
                        <td className="vs-mono" style={{ fontSize: '12px' }}>
                          {citedUrls.map((u) => (
                            <div key={u} style={{ marginBottom: '4px' }}>
                              <a
                                href={u}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--vs-ink)' }}
                              >
                                {u}
                              </a>
                            </div>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              </>
            ) : null}

            {/* Module 4: Agency 60-Second White-Label Pitch Mode (Single + Batch Prospecting) */}
            <div className="vs-grid-2">
              <form
                onSubmit={handleGeneratePitchLink}
                className="vs-card"
                style={{ padding: '18px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ flex: '1 1 220px' }}>
                    <strong style={{ fontSize: '14px' }}>
                      {isGuided
                        ? 'Create Shareable Client Audit Pages (60 Seconds)'
                        : 'Module 4 — White-Label Prospect Pitch & Batch Pipeline'}
                    </strong>
                    <div
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--vs-ink-muted)',
                        marginTop: '2px',
                      }}
                    >
                      {isGuided
                        ? 'Scan one client site or paste a list to build branded report pages with ready-to-send intro emails.'
                        : 'Scans 1–10 prospect domains in parallel and mints agency-branded /audit/[slug] reports.'}
                    </div>
                  </div>

                  <div
                    role="group"
                    aria-label="Prospect input mode"
                    style={{
                      display: 'inline-flex',
                      background: 'var(--vs-surface-warm)',
                      border: '1px solid var(--vs-border)',
                      borderRadius: '6px',
                      padding: '2px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setPitchInputMode('single')}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        background:
                          pitchInputMode === 'single'
                            ? 'var(--vs-ink)'
                            : 'transparent',
                        color:
                          pitchInputMode === 'single'
                            ? '#FFFFFF'
                            : 'var(--vs-ink-secondary)',
                      }}
                    >
                      Single Site
                    </button>
                    <button
                      type="button"
                      onClick={() => setPitchInputMode('batch')}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        background:
                          pitchInputMode === 'batch'
                            ? 'var(--vs-ink)'
                            : 'transparent',
                        color:
                          pitchInputMode === 'batch'
                            ? '#FFFFFF'
                            : 'var(--vs-ink-secondary)',
                      }}
                    >
                      Batch List
                    </button>
                  </div>
                </div>

                {pitchInputMode === 'single' ? (
                  <>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>
                      {isGuided ? 'Client Website' : 'Prospect Domain'}
                    </label>
                    <input
                      type="text"
                      required
                      value={pitchDomain}
                      onChange={(e) => setPitchDomain(e.target.value)}
                      className="vs-input"
                      style={{ marginBottom: '10px' }}
                    />
                  </>
                ) : (
                  <>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>
                      {isGuided
                        ? 'Client Websites (1 per line — up to 10)'
                        : 'Prospect Domains Batch (1 per line or comma-separated, max 10)'}
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder={'vanguardfreight.io\nlinear.app\nstripe.com'}
                      value={batchPitchDomains}
                      onChange={(e) => setBatchPitchDomains(e.target.value)}
                      className="vs-input vs-mono"
                      style={{
                        marginBottom: '10px',
                        fontSize: '12.5px',
                        lineHeight: 1.5,
                        resize: 'vertical',
                      }}
                    />
                  </>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 110px',
                    gap: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>
                      Your Agency Brand Name
                    </label>
                    <input
                      type="text"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="vs-input"
                      style={{ fontFamily: 'var(--vs-sans)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>
                      Brand Hex
                    </label>
                    <input
                      type="text"
                      value={agencyColor}
                      onChange={(e) => setAgencyColor(e.target.value)}
                      className="vs-input"
                    />
                  </div>
                </div>

                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Agency Logo URL (Optional — https:// PNG or SVG)
                </label>
                <input
                  type="url"
                  placeholder="https://youragency.com/logo.svg"
                  value={agencyLogoUrl}
                  onChange={(e) => setAgencyLogoUrl(e.target.value)}
                  className="vs-input"
                  style={{ marginBottom: '10px' }}
                />

                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Booking / Calendar CTA Link
                </label>
                <input
                  type="url"
                  value={agencyCtaUrl}
                  onChange={(e) => setAgencyCtaUrl(e.target.value)}
                  className="vs-input"
                  style={{ marginBottom: '14px' }}
                />

                <button
                  type="submit"
                  disabled={generatingPitch}
                  className="vs-btn"
                  style={{ width: '100%' }}
                >
                  {generatingPitch
                    ? pitchInputMode === 'batch'
                      ? 'Scanning Batch & Minting Slugs...'
                      : 'Scanning Prospect & Minting Slug...'
                    : pitchInputMode === 'batch'
                      ? isGuided
                        ? 'Build All Client Audit Pages'
                        : 'Run Batch Audit & Mint Pitch Slugs'
                      : 'Generate White-Label Pitch URL'}
                </button>
              </form>

              <div className="vs-card vs-table-wrap">
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--vs-border)',
                    background: 'var(--vs-surface-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13.5px' }}>
                      {isGuided
                        ? 'Your Shareable Client Links'
                        : 'Active Prospect Pitch Links'}
                    </strong>
                    <span
                      className="vs-mono"
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--vs-ink-muted)',
                        marginLeft: '8px',
                      }}
                    >
                      ({data.pitchReports.length})
                    </span>
                  </div>

                  {data.pitchReports.length > 0 ? (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleExportOutreachCsv}
                        className="vs-btn vs-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        title="Download RFC 4180 CSV with subjects, outreach notes, and /audit/[slug] URLs"
                      >
                        ↓ Export CSV
                      </button>
                      <button
                        type="button"
                        onClick={handleExportOutreachPlaybook}
                        className="vs-btn vs-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        title="Download Fact-Verified Markdown Cold-Outreach Playbook"
                      >
                        ↓ Playbook (.md)
                      </button>
                    </div>
                  ) : null}
                </div>
                <table className="vs-table">
                  <thead>
                    <tr>
                      <th>Prospect</th>
                      <th>Score</th>
                      <th>Views</th>
                      <th>Share Link</th>
                      <th style={{ textAlign: 'right' }}>Outreach</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pitchReports.map((r) => {
                      const isSelected =
                        selectedPitchReport?.share_slug === r.share_slug;
                      return (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.prospect_brand_name}</strong>
                            <div
                              className="vs-mono"
                              style={{
                                fontSize: '11.5px',
                                color: 'var(--vs-ink-muted)',
                              }}
                            >
                              {r.prospect_domain}
                            </div>
                          </td>
                          <td className="vs-mono">{r.visibility_score}/100</td>
                          <td>
                            {r.views_count >= 3 ? (
                              <StatusBadge tone="pass">
                                HOT · {r.views_count} VIEWS
                              </StatusBadge>
                            ) : r.views_count >= 1 ? (
                              <StatusBadge tone="pass">
                                OPENED · {r.views_count}x
                              </StatusBadge>
                            ) : (
                              <StatusBadge>
                                {isGuided ? 'UNOPENED' : 'SENT · 0'}
                              </StatusBadge>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <Link
                                href={`/audit/${r.share_slug}`}
                                className="vs-mono"
                                style={{ fontSize: '12px', color: 'var(--vs-ink)' }}
                              >
                                /audit/{r.share_slug} →
                              </Link>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleCopyPitchShareUrl(r.share_slug)
                                }
                                className="vs-btn vs-btn-secondary"
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                }}
                                title="Copy shareable /audit/[slug] link to clipboard"
                              >
                                {copiedPitchSlug === r.share_slug
                                  ? '✓ Copied'
                                  : 'Copy URL'}
                              </button>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              {accessToken ||
                              data.mode === 'mock' ||
                              r.expires_at !== null ? (
                                <button
                                  type="button"
                                  disabled={refreshingPitchSlug !== null}
                                  onClick={() =>
                                    void handleRefreshPitchReport(r.share_slug)
                                  }
                                  className="vs-btn vs-btn-secondary"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '11.5px',
                                  }}
                                  title="Re-scan client domain across ChatGPT, Gemini & Perplexity and update this /audit/[slug] link in-place"
                                >
                                  {refreshingPitchSlug === r.share_slug
                                    ? 'Refreshing...'
                                    : '↻'}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => setSelectedPitchSlug(r.share_slug)}
                                className="vs-btn vs-btn-secondary"
                                style={{
                                  padding: '4px 9px',
                                  fontSize: '11.5px',
                                  borderColor: isSelected
                                    ? 'var(--vs-ink)'
                                    : undefined,
                                }}
                              >
                                {isSelected ? 'Selected' : 'Cold Note'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedPitchReport && pitchOutreachArtifact ? (
              <div style={{ marginBottom: '22px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    className="vs-eyebrow"
                    style={{ color: 'var(--vs-ink-secondary)' }}
                  >
                    {isGuided
                      ? '3-STEP EMAIL FOLLOW-UP SEQUENCE'
                      : 'FACT-VERIFIED 3-TOUCH SEQUENCE (INSTANTLY / SMARTLEAD / GMAIL)'}
                  </span>
                  <div
                    style={{
                      display: 'inline-flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {accessToken ||
                    data.mode === 'mock' ||
                    selectedPitchReport.expires_at !== null ? (
                      <button
                        type="button"
                        disabled={refreshingPitchSlug !== null}
                        onClick={() =>
                          void handleRefreshPitchReport(
                            selectedPitchReport.share_slug
                          )
                        }
                        className="vs-btn vs-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        title="Re-run 3-engine audit and update this /audit/[slug] link in-place"
                      >
                        {refreshingPitchSlug === selectedPitchReport.share_slug
                          ? 'Refreshing Brief...'
                          : '↻ Refresh Live Brief'}
                      </button>
                    ) : null}
                    <div
                      role="group"
                      aria-label="Cold outreach sequence touch"
                      style={{
                        display: 'inline-flex',
                        border: '1px solid var(--vs-border)',
                        borderRadius: '6px',
                        padding: '2px',
                        background: 'var(--vs-surface)',
                      }}
                    >
                    {(
                      [
                        { id: 'day0', label: 'Touch 1 · Day 0' },
                        { id: 'day3', label: 'Touch 2 · Day 3' },
                        { id: 'day7', label: 'Touch 3 · Day 7' },
                      ] as const
                    ).map((step) => {
                      const active = selectedOutreachTouch === step.id;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => setSelectedOutreachTouch(step.id)}
                          style={{
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            background: active ? 'var(--vs-ink)' : 'transparent',
                            color: active
                              ? '#FFFFFF'
                              : 'var(--vs-ink-secondary)',
                          }}
                        >
                          {step.label}
                        </button>
                      );
                    })}
                    </div>
                  </div>
                </div>

                <CodeArtifactCard
                  title={
                    selectedOutreachTouch === 'day0'
                      ? `Touch 1 (Day 0) — Diagnostic Scorecard (${selectedPitchReport.prospect_brand_name})`
                      : selectedOutreachTouch === 'day3'
                        ? `Touch 2 (Day 3) — Technical Gap Reply (${selectedPitchReport.prospect_brand_name})`
                        : `Touch 3 (Day 7) — Direct Fix Handoff (${selectedPitchReport.prospect_brand_name})`
                  }
                  plainSummary={
                    isGuided
                      ? selectedOutreachTouch === 'day0'
                        ? 'First message introducing the client audit link.'
                        : selectedOutreachTouch === 'day3'
                          ? 'Polite Day 3 thread reply highlighting why competitors rank higher in AI.'
                          : 'Calm Day 7 final follow-up offering the finished website fixes.'
                      : undefined
                  }
                  fileHint={`Target: https://verisource.dev/audit/${selectedPitchReport.share_slug} · Export CSV above for all 3 touches`}
                  code={pitchOutreachArtifact.content}
                  qualityScore={pitchOutreachArtifact.score}
                  qualityBreakdown={pitchOutreachArtifact.breakdown}
                />
              </div>
            ) : null}

            {/* Paid MCP Server Connection Hub: Calm optional handoff in Guided Mode, full developer hub in Pro Mode */}
            {isGuided ? (
              <div
                className="vs-card"
                style={{
                  padding: '16px 20px',
                  background: 'var(--vs-surface-warm)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <strong style={{ fontSize: '13.5px' }}>
                    Optional Developer &amp; AI Assistant Sync (MCP)
                  </strong>
                  <div style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)', marginTop: '2px' }}>
                    Want to connect Claude Desktop, Cursor, or Antigravity directly to your workspace? Switch to Pro Mode to manage API keys.
                  </div>
                </div>
                <button
                  type="button"
                  className="vs-btn vs-btn-secondary"
                  onClick={() => handleChangeUxMode('pro')}
                >
                  Switch to Pro Mode for API Keys →
                </button>
              </div>
            ) : (
            <div className="vs-card" style={{ padding: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <strong style={{ fontSize: '14px' }}>
                    Paid Streamable HTTP /mcp Connection Hub
                  </strong>
                  <div style={{ fontSize: '12.5px', color: 'var(--vs-ink-muted)' }}>
                    Connect Claude Desktop, Cursor, Windsurf, or Antigravity via
                    SHA-256 Bearer key (1 credit cached read / 10 credits live scan).
                  </div>
                </div>

                <form
                  onSubmit={handleMintMcpKey}
                  style={{ display: 'flex', gap: '8px' }}
                >
                  <input
                    type="text"
                    value={keyLabel}
                    onChange={(e) => setKeyLabel(e.target.value)}
                    className="vs-input"
                    style={{
                      width: '220px',
                      fontFamily: 'var(--vs-sans)',
                      padding: '8px 10px',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={mintingKey}
                    className="vs-btn"
                  >
                    {mintingKey ? 'Minting...' : '+ Mint vs_live_ Key'}
                  </button>
                </form>
              </div>

              {newlyMintedRawKey ? (
                <div
                  style={{
                    padding: '10px 14px',
                    marginBottom: '14px',
                    background: 'var(--vs-warn-bg)',
                    border: '1px solid var(--vs-warn-border)',
                    color: 'var(--vs-warn-fg)',
                    borderRadius: '5px',
                    fontSize: '12.5px',
                  }}
                >
                  <strong>Copy your secret key now (shown once):</strong>{' '}
                  <code className="vs-mono">{newlyMintedRawKey}</code>
                </div>
              ) : null}

              <CodeArtifactCard
                title="mcp_config.json (Streamable HTTP — No Deprecated /sse)"
                fileHint="Endpoint: https://mcp.verisource.dev/mcp"
                code={mcpClientConfigJson}
              />

              {data.mcpApiKeys.length > 0 ? (
                <div
                  className="vs-table-wrap"
                  style={{
                    marginTop: '16px',
                    border: '1px solid var(--vs-border)',
                    borderRadius: '6px',
                  }}
                >
                  <table className="vs-table">
                    <thead>
                      <tr>
                        <th>Key Prefix (SHA-256)</th>
                        <th>Agent Label</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Access Control</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.mcpApiKeys.map((k) => (
                        <tr key={k.id}>
                          <td className="vs-mono" style={{ fontSize: '12px' }}>
                            {k.key_prefix}••••••••
                          </td>
                          <td style={{ fontSize: '13px' }}>{k.label}</td>
                          <td>
                            <StatusBadge tone={k.is_active ? 'pass' : 'critical'}>
                              {k.is_active ? 'ACTIVE' : 'REVOKED'}
                            </StatusBadge>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {k.is_active ? (
                              <button
                                type="button"
                                disabled={revokingKeyId === k.id}
                                onClick={() => void handleRevokeMcpKey(k.id)}
                                className="vs-btn vs-btn-secondary"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '11.5px',
                                  color: 'var(--vs-crit-fg)',
                                }}
                              >
                                {revokingKeyId === k.id ? 'Revoking...' : 'Revoke'}
                              </button>
                            ) : (
                              <span
                                className="vs-mono"
                                style={{
                                  fontSize: '11.5px',
                                  color: 'var(--vs-ink-muted)',
                                }}
                              >
                                Revoked
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
            )}
          </div>
        ) : null}
      </ThreeTabShell>
    </div>
  );
}
