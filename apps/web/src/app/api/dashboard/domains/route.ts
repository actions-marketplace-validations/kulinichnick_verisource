import { NextResponse } from 'next/server';
import {
  isFixTypeLiveOnDomain,
  runFullGeoAudit,
  type CitationSnapshotRow,
  type DomainRow,
  type GeneratedFixRow,
  type TrackedPromptRow,
} from '@verisource/core-geo';
import {
  domainCapForPlan,
  getLocalMockStore,
  provisionDomainAuditForWorkspace,
  resolveAuthenticatedProfile,
} from '../../../../lib/data-store';

export async function POST(request: Request): Promise<NextResponse> {
  try {
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

    const auth = await resolveAuthenticatedProfile(request);
    const store = getLocalMockStore();
    const activeProfile = auth ? auth.profile : store.profile;
    const maxDomains = domainCapForPlan(activeProfile.plan_tier);

    const provisioned = await provisionDomainAuditForWorkspace({
      domainInput: body.domain_url,
      customBrandName: body.brand_name,
      userId: activeProfile.id,
      planTier: activeProfile.plan_tier,
      supabase: auth?.supabase ?? null,
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
    const body = (await request.json().catch(() => ({}))) as {
      domain_id?: string;
    };
    if (!body.domain_id) {
      return NextResponse.json(
        { error: 'MISSING_DOMAIN_ID', message: 'Provide a domain_id to re-scan.' },
        { status: 400 }
      );
    }

    const auth = await resolveAuthenticatedProfile(request);
    const store = getLocalMockStore();

    let domain: DomainRow | undefined;
    let trackedPrompts: TrackedPromptRow[] = [];

    if (auth) {
      const { data: domData } = await auth.supabase
        .from('domains')
        .select('*')
        .eq('id', body.domain_id)
        .eq('user_id', auth.profile.id)
        .maybeSingle();
      domain = domData ?? undefined;

      if (domain) {
        const { data: promptData } = await auth.supabase
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

    if (auth) {
      await auth.supabase
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
        .eq('user_id', auth.profile.id);

      await auth.supabase
        .from('citation_snapshots')
        .delete()
        .eq('domain_id', domain.id);
      if (refreshedSnapshots.length > 0) {
        await auth.supabase
          .from('citation_snapshots')
          .insert(refreshedSnapshots);
      }

      await auth.supabase
        .from('generated_fixes')
        .delete()
        .eq('domain_id', domain.id);
      if (refreshedFixes.length > 0) {
        await auth.supabase.from('generated_fixes').insert(refreshedFixes);
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

    return NextResponse.json({
      domain: updatedDomain,
      snapshots: refreshedSnapshots,
      fixes: refreshedFixes,
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

  const auth = await resolveAuthenticatedProfile(request);
  if (auth) {
    const { data, error } = await auth.supabase
      .from('domains')
      .delete()
      .eq('id', domainId)
      .eq('user_id', auth.profile.id)
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
