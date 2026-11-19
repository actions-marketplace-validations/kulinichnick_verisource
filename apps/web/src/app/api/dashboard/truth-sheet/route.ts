import { NextResponse } from 'next/server';
import {
  computeScoreDeltaSummary,
  isFixTypeLiveOnDomain,
  runFullGeoAudit,
  selectLatestLiveSnapshotsPerPromptEngine,
  type BrandTruthSheet,
  type CitationSnapshotRow,
  type DomainRow,
  type GeneratedFixRow,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to update your Brand Truth Sheet.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a $19 Audit Pass or monthly Console plan to verify Brand Truth Sheets and regenerate fixes.',
        },
        { status: 402 }
      );
    }

    const body = (await request.json()) as {
      domain_id?: string;
      brand_truth_sheet?: BrandTruthSheet;
    };
    if (!body.domain_id || !body.brand_truth_sheet) {
      return NextResponse.json(
        {
          error: 'INVALID_BODY',
          message: 'domain_id and brand_truth_sheet required.',
        },
        { status: 400 }
      );
    }

    const store = getLocalMockStore();

    let domain: DomainRow | undefined;
    let existingSnapshots: CitationSnapshotRow[] = [];
    if (access.supabase) {
      const { data } = await access.supabase
        .from('domains')
        .select('*')
        .eq('id', body.domain_id)
        .eq('user_id', access.profile.id)
        .maybeSingle();
      domain = data ?? undefined;
      if (domain) {
        const { data: snapRows } = await access.supabase
          .from('citation_snapshots')
          .select('*')
          .eq('domain_id', domain.id)
          .order('scanned_at', { ascending: false })
          .limit(24);
        existingSnapshots = (snapRows ?? []) as CitationSnapshotRow[];
      }
    } else {
      domain = store.domains.find((d) => d.id === body.domain_id);
      if (domain) {
        existingSnapshots = store.snapshots.filter(
          (s) => s.domain_id === domain!.id
        );
      }
    }

    if (!domain) {
      return NextResponse.json(
        { error: 'DOMAIN_NOT_FOUND', message: 'Domain not found in workspace.' },
        { status: 404 }
      );
    }

    const verifiedTruth: BrandTruthSheet = {
      ...body.brand_truth_sheet,
      ...(domain.brand_truth_sheet?.report_schedule
        ? { report_schedule: domain.brand_truth_sheet.report_schedule }
        : {}),
      is_user_verified: true,
    };

    const audit = await runFullGeoAudit({
      domainInput: domain.domain_url,
      customBrandName: domain.brand_name,
      customTruthSheet: verifiedTruth,
      priorLiveSnapshots:
        selectLatestLiveSnapshotsPerPromptEngine(existingSnapshots),
    });

    const previousVisibilityScore = domain.visibility_score;
    const previousAccuracyScore = domain.accuracy_score;

    const nowIso = new Date().toISOString();
    const updatedDomain: DomainRow = {
      ...domain,
      brand_truth_sheet: verifiedTruth,
      accuracy_score: audit.accuracyScore,
      visibility_score: audit.visibilityScore,
      last_scanned_at: nowIso,
    };

    const refreshedFixes: GeneratedFixRow[] = audit.fixes.map((f) => ({
      id: crypto.randomUUID(),
      domain_id: domain.id,
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
          brand_truth_sheet: verifiedTruth,
          accuracy_score: audit.accuracyScore,
          visibility_score: audit.visibilityScore,
          last_scanned_at: nowIso,
        })
        .eq('id', domain.id)
        .eq('user_id', access.profile.id);

      await access.supabase
        .from('generated_fixes')
        .delete()
        .eq('domain_id', domain.id);
      if (refreshedFixes.length > 0) {
        await access.supabase.from('generated_fixes').insert(refreshedFixes);
      }
    } else {
      Object.assign(domain, updatedDomain);
      store.fixes = store.fixes.filter((f) => f.domain_id !== domain!.id);
      store.fixes.unshift(...refreshedFixes);
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
      fixes: refreshedFixes,
      hallucinations: audit.allHallucinations,
      scoreDelta,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'TRUTH_UPDATE_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to update Brand Truth Sheet.',
      },
      { status: 400 }
    );
  }
}
