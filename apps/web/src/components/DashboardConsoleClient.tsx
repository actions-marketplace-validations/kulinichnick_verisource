'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  buildAgencyColdOutreachNote,
  buildAiAttributionSnippet,
  buildImplementationBundleMarkdown,
  type AgencyPitchReportRow,
  type AiAttributionEventRow,
  type CitationSnapshotRow,
  type DomainRow,
  type GeneratedFixRow,
  type McpApiKeyRow,
  type ProfileRow,
  type QualityRubricBreakdown,
  type TrackedPromptRow,
} from '@verisource/core-geo';
import {
  CodeArtifactCard,
  MetricLedgerCell,
  StatusBadge,
  ThreeTabShell,
  type ThreeTabId,
} from '@verisource/ui';

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
  upgradedPlan?: string;
  creditApplied?: boolean;
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
  const [activeTab, setActiveTab] = useState<ThreeTabId>('tab1_visibility');

  // Domain lifecycle state
  const [newDomainUrl, setNewDomainUrl] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [rescanningDomain, setRescanningDomain] = useState(false);
  const [deletingDomain, setDeletingDomain] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(
    props.upgradedPlan
      ? `Plan active: ${props.upgradedPlan.toUpperCase()}${
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

  // Tab 3 Agency White-Label Pitch generator state
  const [pitchDomain, setPitchDomain] = useState('mosaicroasters.com');
  const [agencyName, setAgencyName] = useState(
    data.profile.agency_brand_name ?? 'Verisource Partner Agency'
  );
  const [agencyLogoUrl, setAgencyLogoUrl] = useState(
    data.profile.agency_logo_url ?? ''
  );
  const [agencyColor, setAgencyColor] = useState(
    data.profile.agency_primary_color ?? '#0F172A'
  );
  const [agencyCtaUrl, setAgencyCtaUrl] = useState(
    data.profile.agency_cta_url ?? 'https://cal.com/verisource-demo/geo-audit'
  );
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [selectedPitchSlug, setSelectedPitchSlug] = useState<string>(
    () => props.initialData.pitchReports[0]?.share_slug ?? ''
  );

  // Tab 1 Hallucination Drift Alert state
  const [sendingAlert, setSendingAlert] = useState(false);
  const [lastAlertPreview, setLastAlertPreview] = useState<{
    subject: string;
    text: string;
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
        const res = await fetch('/api/dashboard/state', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const payload = (await res.json()) as WorkspacePayload;
        if (cancelled) return;
        setData(payload);
        setSelectedDomainId((prev) => {
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.auth.signOut();
    }
    window.location.href = '/login';
  }

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
    setLastAlertPreview(null);
  }, [activeDomain]);

  const domainSnapshots = data.snapshots.filter(
    (s) => s.domain_id === activeDomain?.id
  );
  const domainPrompts = data.prompts.filter(
    (p) => p.domain_id === activeDomain?.id
  );
  const domainFixes = data.fixes.filter(
    (f) => f.domain_id === activeDomain?.id
  );
  const domainAttribution = data.attributionEvents.filter(
    (e) => e.domain_id === activeDomain?.id
  );

  const totalAiRevenueUsd = domainAttribution
    .filter((e) => e.event_type === 'ai_referral_conversion')
    .reduce((acc, e) => acc + (e.conversion_value_usd ?? 0), 0);

  const totalAiVisits = domainAttribution.filter(
    (e) => e.event_type === 'ai_referral_visit'
  ).length;

  const flaggedSnapshots = domainSnapshots.filter(
    (s) => s.hallucination_detected && (s.hallucination_details?.length ?? 0) > 0
  );

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomainUrl.trim()) return;
    setAddingDomain(true);
    setBannerError(null);
    try {
      const res = await fetch('/api/dashboard/domains', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ domain_url: newDomainUrl }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        alreadyExists?: boolean;
        domain?: DomainRow;
        prompts?: TrackedPromptRow[];
        snapshots?: CitationSnapshotRow[];
        fixes?: GeneratedFixRow[];
      };
      if (!res.ok || json.error || !json.domain) {
        setBannerError(json.message ?? 'Could not add domain.');
      } else if (json.alreadyExists) {
        setSelectedDomainId(json.domain.id);
        setNewDomainUrl('');
      } else {
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
          `Scanned ${json.domain.brand_name} and generated >=9.5/10 fixes.`
        );
      }
    } catch {
      setBannerError('Network error while scanning new domain.');
    } finally {
      setAddingDomain(false);
    }
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
      };
      if (!res.ok || json.error || !json.domain) {
        setBannerError(json.message ?? 'Unable to re-scan domain.');
      } else {
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
        setBannerSuccess(
          `Re-scanned ${json.domain.brand_name}: ${json.domain.visibility_score}/100 visibility, ${json.domain.accuracy_score}% accuracy.`
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
      };
      if (!res.ok || json.error || !json.domain) {
        setBannerError(json.message ?? 'Unable to save Brand Truth Sheet.');
      } else {
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
          `Verified Brand Truth Sheet for ${json.domain.brand_name} and regenerated 9.5+/10 schema & /agents.md fixes.`
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
      const res = await fetch('/api/dashboard/pitch', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          prospect_domain: pitchDomain,
          agency_brand_name: agencyName,
          agency_logo_url: agencyLogoUrl,
          agency_primary_color: agencyColor,
          agency_cta_url: agencyCtaUrl,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        report?: AgencyPitchReportRow;
        share_url?: string;
      };
      if (!res.ok || json.error || !json.report) {
        setBannerError(json.message ?? 'Unable to generate pitch link.');
      } else {
        setData((prev) => ({
          ...prev,
          pitchReports: [json.report!, ...prev.pitchReports],
        }));
        setSelectedPitchSlug(json.report.share_slug);
        setBannerSuccess(
          `60-Second White-Label Pitch Link & cold outreach note ready: ${json.share_url}`
        );
      }
    } catch {
      setBannerError('Network error generating pitch report.');
    } finally {
      setGeneratingPitch(false);
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
          subject: json.subject,
          text: json.text,
          qualityScore: json.qualityScore,
          qualityBreakdown: json.qualityBreakdown,
          mode,
          recipientEmail: recipient,
        });
        setBannerSuccess(
          mode === 'live_resend'
            ? `Dispatched hallucination drift alert to ${recipient} via Resend (${json.qualityScore}/10 Critic score).`
            : `Generated drift-alert preview for ${recipient} (${json.qualityScore}/10 Critic score). Set RESEND_API_KEY for automated weekly delivery.`
        );
      }
    } catch {
      setBannerError('Network error while dispatching drift alert.');
    } finally {
      setSendingAlert(false);
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

  const selectedPitchReport: AgencyPitchReportRow | undefined =
    data.pitchReports.find((r) => r.share_slug === selectedPitchSlug) ??
    data.pitchReports[0];

  const pitchOutreachArtifact = selectedPitchReport
    ? buildAgencyColdOutreachNote(selectedPitchReport, 'https://verisource.dev')
    : null;

  const pixelSnippet = activeDomain
    ? buildAiAttributionSnippet({
        trackingPixelToken: activeDomain.tracking_pixel_token,
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
            <div style={{ display: 'inline-flex', gap: '6px' }}>
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
          <StatusBadge tone="pass">
            PLAN: {data.profile.plan_tier.toUpperCase()}
          </StatusBadge>
          <StatusBadge>
            MCP CREDITS: {data.profile.mcp_calls_used_this_month} /{' '}
            {data.profile.mcp_calls_limit}
          </StatusBadge>
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
          }}
        >
          {bannerError}
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
          }}
        >
          {bannerSuccess}
        </div>
      ) : null}

      {/* Strict 3-Tab Layout */}
      <ThreeTabShell activeTab={activeTab} onSelectTab={setActiveTab}>
        {!activeDomain ? (
          <div className="vs-card" style={{ padding: '28px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
              Scan your first domain to initialize your workspace
            </h2>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '13.5px',
                color: 'var(--vs-ink-secondary)',
                maxWidth: '620px',
              }}
            >
              Enter your storefront or B2B domain in the top bar and click{' '}
              <strong>+ Scan Domain</strong>. Verisource probes{' '}
              <code className="vs-mono">/robots.txt</code>,{' '}
              <code className="vs-mono">/llms.txt</code>,{' '}
              <code className="vs-mono">/agents.md</code>, and Shopify{' '}
              <code className="vs-mono">/api/ucp/mcp</code>, then builds your
              9.5+/10 fix bundle.
            </p>
          </div>
        ) : null}

        {activeTab === 'tab1_visibility' && activeDomain ? (
          <div>
            {/* Metric Summary Strip */}
            <div
              className="vs-card"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                marginBottom: '22px',
              }}
            >
              <div style={{ borderRight: '1px solid var(--vs-border)' }}>
                <MetricLedgerCell
                  label="AI Share of Voice"
                  value={activeDomain.visibility_score}
                  suffix="/ 100"
                  tone={activeDomain.visibility_score < 50 ? 'warn' : 'pass'}
                  sublabel="ChatGPT · Gemini · Perplexity"
                />
              </div>
              <div style={{ borderRight: '1px solid var(--vs-border)' }}>
                <MetricLedgerCell
                  label="Brand Truth Accuracy"
                  value={`${activeDomain.accuracy_score}%`}
                  tone={activeDomain.accuracy_score < 85 ? 'critical' : 'pass'}
                  sublabel={`${flaggedSnapshots.length} engine snapshot(s) w/ conflicts`}
                />
              </div>
              <div style={{ borderRight: '1px solid var(--vs-border)' }}>
                <MetricLedgerCell
                  label="AI Referral Visits"
                  value={totalAiVisits}
                  sublabel="Attributed via utm_source + referrer"
                />
              </div>
              <div>
                <MetricLedgerCell
                  label="Verified AI Checkout Revenue"
                  value={`$${totalAiRevenueUsd.toFixed(2)}`}
                  tone="pass"
                  sublabel="Origin-verified conversion events"
                />
              </div>
            </div>

            {/* Module 1: Hallucination Watchdog + 1-Click Truth Sheet */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.15fr 0.85fr',
                gap: '18px',
                marginBottom: '24px',
              }}
            >
              <div className="vs-card" style={{ overflow: 'hidden' }}>
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
                    Module 1 — AI Hallucination &amp; Claim Watchdog
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
                      disabled={sendingAlert}
                      onClick={() => void handleSendDriftAlert()}
                      className="vs-btn vs-btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '11.5px' }}
                      title="Dispatch or preview weekly hallucination drift email"
                    >
                      {sendingAlert ? 'Dispatching...' : 'Send Drift Alert'}
                    </button>
                  </div>
                </div>

                <table className="vs-table">
                  <thead>
                    <tr>
                      <th>Engine</th>
                      <th>Rank</th>
                      <th>Observed Answer / Hallucination Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domainSnapshots.map((snap) => (
                      <tr key={snap.id}>
                        <td>
                          <span className="vs-mono" style={{ fontWeight: 600 }}>
                            {snap.ai_engine.toUpperCase()}
                          </span>
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
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: 'var(--vs-crit-fg)',
                                marginTop: '4px',
                              }}
                            >
                              <strong>HALLUCINATION ({h.category}):</strong>{' '}
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
                    Brand Truth Sheet
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
                  Core Offering
                </label>
                <textarea
                  rows={2}
                  value={coreOffering}
                  onChange={(e) => setCoreOffering(e.target.value)}
                  className="vs-input"
                  style={{ marginBottom: '10px', fontFamily: 'var(--vs-sans)' }}
                />

                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Verified Pricing Summary
                </label>
                <input
                  type="text"
                  value={pricingSummary}
                  onChange={(e) => setPricingSummary(e.target.value)}
                  className="vs-input"
                  style={{ marginBottom: '10px', fontFamily: 'var(--vs-sans)' }}
                />

                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Shipping / Local Service Radius
                </label>
                <input
                  type="text"
                  value={shippingSummary}
                  onChange={(e) => setShippingSummary(e.target.value)}
                  className="vs-input"
                  style={{ marginBottom: '10px', fontFamily: 'var(--vs-sans)' }}
                />

                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  False Claims / Exclusions to Flag (1 per line)
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
                    ? 'Re-Running Watchdog & Critic...'
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
                    WATCHDOG ALERT ARTIFACT (
                    {lastAlertPreview.mode === 'live_resend'
                      ? 'SENT VIA RESEND'
                      : 'DRY-RUN PREVIEW'}{' '}
                    → {lastAlertPreview.recipientEmail})
                  </span>
                  <button
                    type="button"
                    onClick={() => setLastAlertPreview(null)}
                    className="vs-btn vs-btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '11.5px' }}
                  >
                    Dismiss
                  </button>
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

            {/* Module 2: AI Bot WAF Status & 10-Line Attribution Snippet */}
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
                  Module 2 — Simulated Crawler WAF Check &amp; Referral Revenue Pixel
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
                    ] as const
                  ).map(([bot, ok]) => (
                    <StatusBadge key={bot} tone={ok ? 'pass' : 'critical'}>
                      {bot}: {ok ? 'ALLOWED' : '403 BLOCKED'}
                    </StatusBadge>
                  ))}
                </div>
              </div>

              <CodeArtifactCard
                title={`10-Line Attribution Pixel (${activeDomain.brand_name})`}
                fileHint="Paste before </head>; call window.verisourceConversion(orderTotal) on checkout thank-you"
                code={pixelSnippet}
              />
            </div>
          </div>
        ) : null}

        {activeTab === 'tab2_fixes' && activeDomain ? (
          <div>
            {/* Shopify Native Adapter Callout */}
            {activeDomain.is_shopify ? (
              <div
                className="vs-card"
                style={{
                  padding: '16px 18px',
                  marginBottom: '20px',
                  background: 'var(--vs-surface-subtle)',
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
                <strong style={{ fontSize: '13.5px' }}>
                  Critic-Verified Implementation Bundle ({domainFixes.length}{' '}
                  artifacts)
                </strong>
                <div
                  style={{ fontSize: '12px', color: 'var(--vs-ink-muted)' }}
                >
                  Single-file handoff for engineering or agency client delivery (
                  <code className="vs-mono">JSON-LD</code>,{' '}
                  <code className="vs-mono">/llms.txt</code>,{' '}
                  <code className="vs-mono">/agents.md</code>, and FAQ blocks).
                </div>
              </div>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {domainFixes.map((fix) => (
                <CodeArtifactCard
                  key={fix.id}
                  title={fix.title}
                  fileHint={`Fix Type: ${fix.fix_type}`}
                  code={fix.content_payload}
                  qualityScore={Number(fix.natural_quality_score)}
                  qualityBreakdown={fix.quality_rubric_breakdown}
                />
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'tab3_offsite' && activeDomain ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Module 3: Query Fanout Decompiler & Citation Gap Map */}
            <div className="vs-card" style={{ overflow: 'hidden' }}>
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
                  Module 3 — Query Fanout Decompiler &amp; Third-Party Citation Gaps
                </strong>
                <form
                  onSubmit={handleAddPrompt}
                  style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}
                >
                  <input
                    type="text"
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    placeholder="Add buyer prompt (e.g. best single origin coffee)"
                    className="vs-input"
                    style={{
                      width: '310px',
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
              <table className="vs-table">
                <thead>
                  <tr>
                    <th>Buyer Prompt</th>
                    <th>Observed Engine Fanout Sub-Queries</th>
                    <th>Unblurred Competitor Citation Targets</th>
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
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.prompt_text}</td>
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

            {/* Module 4: Agency 60-Second White-Label Pitch Mode */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '18px',
              }}
            >
              <form
                onSubmit={handleGeneratePitchLink}
                className="vs-card"
                style={{ padding: '18px' }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ fontSize: '14px' }}>
                    Module 4 — 60-Second White-Label Prospect Pitch Generator
                  </strong>
                  <div
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--vs-ink-muted)',
                      marginTop: '2px',
                    }}
                  >
                    Scans any prospect URL and mints an unbranded/agency-branded
                    teaser report at <code className="vs-mono">/audit/[slug]</code>.
                  </div>
                </div>

                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Prospect Domain
                </label>
                <input
                  type="text"
                  required
                  value={pitchDomain}
                  onChange={(e) => setPitchDomain(e.target.value)}
                  className="vs-input"
                  style={{ marginBottom: '10px' }}
                />

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
                    ? 'Scanning Prospect & Minting Slug...'
                    : 'Generate White-Label Pitch URL'}
                </button>
              </form>

              <div className="vs-card" style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--vs-border)',
                    background: 'var(--vs-surface-subtle)',
                  }}
                >
                  <strong style={{ fontSize: '13.5px' }}>
                    Active Prospect Pitch Links
                  </strong>
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
                          <td className="vs-mono">{r.views_count}</td>
                          <td>
                            <Link
                              href={`/audit/${r.share_slug}`}
                              className="vs-mono"
                              style={{ fontSize: '12px', color: 'var(--vs-ink)' }}
                            >
                              /audit/{r.share_slug} →
                            </Link>
                          </td>
                          <td style={{ textAlign: 'right' }}>
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedPitchReport && pitchOutreachArtifact ? (
              <CodeArtifactCard
                title={`4-Sentence Founder Cold Outreach Note (${selectedPitchReport.prospect_brand_name})`}
                fileHint={`Target: https://verisource.dev/audit/${selectedPitchReport.share_slug} · Copy into Gmail, Superhuman, or LinkedIn DM`}
                code={pitchOutreachArtifact.content}
                qualityScore={pitchOutreachArtifact.score}
                qualityBreakdown={pitchOutreachArtifact.breakdown}
              />
            ) : null}

            {/* Paid MCP Server Connection Hub */}
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
                  style={{
                    marginTop: '16px',
                    border: '1px solid var(--vs-border)',
                    borderRadius: '6px',
                    overflow: 'hidden',
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
          </div>
        ) : null}
      </ThreeTabShell>
    </div>
  );
}
