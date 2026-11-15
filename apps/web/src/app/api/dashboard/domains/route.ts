import { NextResponse } from 'next/server';
import {
  computeScoreDeltaSummary,
  isFixTypeLiveOnDomain,
  runFullGeoAudit,
  type CitationSnapshotRow,
  type DomainRow,
  type GeneratedFixRow,
  type TrackedPromptRow,
} from '@verisource/core-geo';
import {
  PROTECTED_PATIENT_ZERO_IDS,
  domainCapForPlan,
  getLocalMockStore,
  provisionDomainAuditForWorkspace,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to add a domain.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a $19 Audit Pass or monthly Console plan to add domains and generate fixes.',
        },
        { status: 402 }
      );
    }

    const body = (await request.json()) as {
      domain_url?: string;
      brand_name?: string;
    };
    if (!body.domain_url) {
      return NextResponse.json(
        { error: 'MISSING_DOMAIN', message: 'Provide a domain URL to add.' },
        { status: 400 }
      );
    }

    const activeProfile = access.profile;
    const maxDomains = domainCapForPlan(activeProfile.plan_tier);

    const provisioned = await provisionDomainAuditForWorkspace({
      domainInput: body.domain_url,
      customBrandName: body.brand_name,
      userId: activeProfile.id,
      planTier: activeProfile.plan_tier,
      supabase: access.supabase,
    });

    if (provisioned.alreadyExists && provisioned.domain) {
      return NextResponse.json({
        domain: provisioned.domain,
        alreadyExists: true,
      });
    }

    if (provisioned.capReached || !provisioned.domain) {
      return NextResponse.json(
        {
          error: 'DOMAIN_CAP_REACHED',
          message: `Your ${activeProfile.plan_tier} plan supports up to ${maxDomains} tracked domain(s). Upgrade to add more domains.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      domain: provisioned.domain,
      prompts: provisioned.prompts,
      snapshots: provisioned.snapshots,
      fixes: provisioned.fixes,
      crawlerReadability: provisioned.crawlerReadability,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'ADD_DOMAIN_FAILED',
        message: err instanceof Error ? err.message : 'Unable to scan domain.',
      },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to re-scan a domain.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a $19 Audit Pass or monthly Console plan to run live workspace scans.',
        },
        { status: 402 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      domain_id?: string;
    };
    if (!body.domain_id) {
      return NextResponse.json(
        { error: 'MISSING_DOMAIN_ID', message: 'Provide a domain_id to re-scan.' },
        { status: 400 }
      );
    }

    const store = getLocalMockStore();
    let domain: DomainRow | undefined;
    let trackedPrompts: TrackedPromptRow[] = [];

    if (access.supabase) {
      const { data: domData } = await access.supabase
        .from('domains')
        .select('*')
        .eq('id', body.domain_id)
        .eq('user_id', access.profile.id)
        .maybeSingle();
      domain = domData ?? undefined;

      if (domain) {
        const { data: promptData } = await access.supabase
          .from('tracked_prompts')
          .select('*')
          .eq('domain_id', domain.id)
          .eq('is_active', true);
        trackedPrompts = promptData ?? [];
      }
    } else {
      domain = store.domains.find((d) => d.id === body.domain_id);
      if (domain) {
        trackedPrompts = store.prompts.filter(
          (p) => p.domain_id === domain!.id && p.is_active
        );
      }
    }

    if (!domain) {
      return NextResponse.json(
        { error: 'DOMAIN_NOT_FOUND', message: 'Domain not found in workspace.' },
        { status: 404 }
      );
    }

    const audit = await runFullGeoAudit({
      domainInput: domain.domain_url,
      customBrandName: domain.brand_name,
      customPrompts:
        trackedPrompts.length > 0
          ? trackedPrompts.map((p) => p.prompt_text)
          : undefined,
      customTruthSheet: domain.brand_truth_sheet.is_user_verified
        ? domain.brand_truth_sheet
        : undefined,
    });

    const previousVisibilityScore = domain.visibility_score;
    const previousAccuracyScore = domain.accuracy_score;

    const nowIso = new Date().toISOString();
    const updatedDomain: DomainRow = {
      ...domain,
      is_shopify: audit.shopify.isShopify,
      shopify_mcp_status: audit.shopify.shopifyMcpStatus,
      agents_md_status: audit.shopify.agentsMdStatus,
      llms_txt_status: audit.probe.llmsTxtStatus,
      robots_ai_bot_status: audit.probe.robotsAiBotStatus,
      visibility_score: audit.visibilityScore,
      accuracy_score: audit.accuracyScore,
      last_scanned_at: nowIso,
    };

    const refreshedSnapshots: CitationSnapshotRow[] = audit.scanResults.map(
      (s) => ({
        id: crypto.randomUUID(),
        domain_id: domain!.id,
        prompt_id:
          trackedPrompts.find((p) => p.prompt_text === s.promptText)?.id ?? null,
        ai_engine: s.aiEngine,
        brand_mentioned: s.brandMentioned,
        citation_rank: s.citationRank,
        competitors_mentioned: s.competitorsMentioned,
        cited_source_urls: s.citedSourceUrls,
        fanout_telemetry_type: s.fanoutTelemetryType,
        hallucination_detected: s.hallucinationDetected,
        hallucination_details:
          s.hallucinationDetails.length > 0 ? s.hallucinationDetails : null,
        raw_answer_excerpt: s.rawAnswerExcerpt,
        scanned_at: nowIso,
      })
    );

    const refreshedFixes: GeneratedFixRow[] = audit.fixes.map((f) => ({
      id: crypto.randomUUID(),
      domain_id: domain!.id,
      fix_type: f.fixType,
      title: f.title,
      content_payload: f.contentPayload,
      natural_quality_score: f.naturalQualityScore,
      quality_rubric_breakdown: f.qualityRubricBreakdown,
      is_applied: isFixTypeLiveOnDomain(f.fixType, audit.probe, audit.shopify),
      created_at: nowIso,
    }));

    if (access.supabase) {
      await access.supabase
        .from('domains')
        .update({
          is_shopify: updatedDomain.is_shopify,
          shopify_mcp_status: updatedDomain.shopify_mcp_status,
          agents_md_status: updatedDomain.agents_md_status,
          llms_txt_status: updatedDomain.llms_txt_status,
          robots_ai_bot_status: updatedDomain.robots_ai_bot_status,
          visibility_score: updatedDomain.visibility_score,
          accuracy_score: updatedDomain.accuracy_score,
          last_scanned_at: nowIso,
        })
        .eq('id', domain.id)
        .eq('user_id', access.profile.id);

      await access.supabase
        .from('citation_snapshots')
        .delete()
        .eq('domain_id', domain.id);
      if (refreshedSnapshots.length > 0) {
        await access.supabase
          .from('citation_snapshots')
          .insert(refreshedSnapshots);
      }

      await access.supabase
        .from('generated_fixes')
        .delete()
        .eq('domain_id', domain.id);
      if (refreshedFixes.length > 0) {
        await access.supabase.from('generated_fixes').insert(refreshedFixes);
      }
    } else {
      Object.assign(domain, updatedDomain);
      store.snapshots = [
        ...refreshedSnapshots,
        ...store.snapshots.filter((s) => s.domain_id !== domain!.id),
      ];
      store.fixes = [
        ...refreshedFixes,
        ...store.fixes.filter((f) => f.domain_id !== domain!.id),
      ];
    }

    const scoreDelta = computeScoreDeltaSummary({
      previousVisibilityScore,
      currentVisibilityScore: updatedDomain.visibility_score,
      previousAccuracyScore,
      currentAccuracyScore: updatedDomain.accuracy_score,
      baselineLabel: 'previous_scan',
      verifiedLiveChecksCount: refreshedFixes.filter((f) => f.is_applied).length,
    });

    return NextResponse.json({
      domain: updatedDomain,
      snapshots: refreshedSnapshots,
      fixes: refreshedFixes,
      scoreDelta,
      crawlerReadability: audit.probe.crawlerReadability,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'RESCAN_FAILED',
        message: err instanceof Error ? err.message : 'Unable to re-scan domain.',
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const access = await resolveConsoleRequestAccess(request);
  if (access.status === 'unauthenticated') {
    return NextResponse.json(
      {
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Sign in to your Verisource Console to remove a domain.',
      },
      { status: 401 }
    );
  }
  if (access.status === 'plan_activation_required') {
    return NextResponse.json(
      {
        error: 'PLAN_ACTIVATION_REQUIRED',
        message: 'Activate a Console plan to manage workspace domains.',
      },
      { status: 402 }
    );
  }

  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as {
    domain_id?: string;
    id?: string;
  };
  const domainId = (
    body.domain_id ??
    body.id ??
    url.searchParams.get('id') ??
    ''
  ).trim();

  if (!domainId) {
    return NextResponse.json(
      { error: 'MISSING_DOMAIN_ID', message: 'Provide a domain id to delete.' },
      { status: 400 }
    );
  }

  if (access.supabase) {
    const { data, error } = await access.supabase
      .from('domains')
      .delete()
      .eq('id', domainId)
      .eq('user_id', access.profile.id)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: 'DOMAIN_NOT_FOUND', message: 'Domain not found in workspace.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ deleted: true, domain_id: domainId });
  }

  if (PROTECTED_PATIENT_ZERO_IDS.has(domainId)) {
    return NextResponse.json(
      {
        error: 'PROTECTED_DEMO_DOMAIN',
        message:
          'Protected local fixture domains cannot be deleted in mock mode.',
      },
      { status: 403 }
    );
  }

  const store = getLocalMockStore();
  const exists = store.domains.some((d) => d.id === domainId);
  if (!exists) {
    return NextResponse.json(
      { error: 'DOMAIN_NOT_FOUND', message: 'Domain not found in workspace.' },
      { status: 404 }
    );
  }

  store.domains = store.domains.filter((d) => d.id !== domainId);
  store.prompts = store.prompts.filter((p) => p.domain_id !== domainId);
  store.snapshots = store.snapshots.filter((s) => s.domain_id !== domainId);
  store.fixes = store.fixes.filter((f) => f.domain_id !== domainId);
  store.attributionEvents = store.attributionEvents.filter(
    (e) => e.domain_id !== domainId
  );

  return NextResponse.json({ deleted: true, domain_id: domainId });
}
