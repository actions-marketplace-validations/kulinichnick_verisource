import { NextResponse } from 'next/server';
import {
  computeScoreDeltaSummary,
  isFixTypeLiveOnDomain,
  runFullGeoAudit,
  type BrandTruthSheet,
  type DomainRow,
  type GeneratedFixRow,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  resolveAuthenticatedProfile,
} from '../../../../lib/data-store';

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
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

    const auth = await resolveAuthenticatedProfile(request);
    const store = getLocalMockStore();

    let domain: DomainRow | undefined;
    if (auth) {
      const { data } = await auth.supabase
        .from('domains')
        .select('*')
        .eq('id', body.domain_id)
        .eq('user_id', auth.profile.id)
        .maybeSingle();
      domain = data ?? undefined;
    } else {
      domain = store.domains.find((d) => d.id === body.domain_id);
    }

    if (!domain) {
      return NextResponse.json(
        { error: 'DOMAIN_NOT_FOUND', message: 'Domain not found in workspace.' },
        { status: 404 }
      );
    }

    const verifiedTruth: BrandTruthSheet = {
      ...body.brand_truth_sheet,
      is_user_verified: true,
    };

    const audit = await runFullGeoAudit({
      domainInput: domain.domain_url,
      customBrandName: domain.brand_name,
      customTruthSheet: verifiedTruth,
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

    if (auth) {
      await auth.supabase
        .from('domains')
        .update({
          brand_truth_sheet: verifiedTruth,
          accuracy_score: audit.accuracyScore,
          visibility_score: audit.visibilityScore,
          last_scanned_at: nowIso,
        })
        .eq('id', domain.id)
        .eq('user_id', auth.profile.id);

      await auth.supabase
        .from('generated_fixes')
        .delete()
        .eq('domain_id', domain.id);
      if (refreshedFixes.length > 0) {
        await auth.supabase.from('generated_fixes').insert(refreshedFixes);
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
