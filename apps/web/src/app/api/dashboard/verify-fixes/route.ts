import { NextResponse } from 'next/server';
import {
  computeVisibilityScore,
  verifyLiveFixDeployment,
  type CitationSnapshotRow,
  type DomainRow,
  type EngineScanResult,
  type GeneratedFixRow,
} from '@verisource/core-geo';
import {
  getGraderCacheMap,
  getLocalMockStore,
  getVerifyFixesIpMap,
  resolveAuthenticatedProfile,
} from '../../../../lib/data-store';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      domain_id?: string;
    };

    if (!body.domain_id || typeof body.domain_id !== 'string') {
      return NextResponse.json(
        {
          error: 'MISSING_DOMAIN_ID',
          message: 'Provide a domain_id to verify live fixes.',
        },
        { status: 400 }
      );
    }

    const auth = await resolveAuthenticatedProfile(request);
    const store = getLocalMockStore();

    if (!auth) {
      const ip =
        request.headers.get('cf-connecting-ip') ??
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        '127.0.0.1';
      const hourBucket = new Date().toISOString().slice(0, 13);
      const ipMap = getVerifyFixesIpMap();
      const entry = ipMap.get(ip);
      const used = entry && entry.hourBucket === hourBucket ? entry.count : 0;
      if (used >= 15) {
        return NextResponse.json(
          {
            error: 'VERIFY_RATE_LIMITED',
            message:
              'Hourly demo verification limit reached. Sign in to run unlimited live fix checks.',
          },
          { status: 429 }
        );
      }
      ipMap.set(ip, { hourBucket, count: used + 1 });
    }

    let domain: DomainRow | undefined;
    let existingSnapshots: CitationSnapshotRow[] = [];
    let existingFixes: GeneratedFixRow[] = [];

    if (auth) {
      const { data: domData } = await auth.supabase
        .from('domains')
        .select('*')
        .eq('id', body.domain_id)
        .eq('user_id', auth.profile.id)
        .maybeSingle();
      domain = domData ?? undefined;

      if (domain) {
        const [{ data: snapData }, { data: fixData }] = await Promise.all([
          auth.supabase
            .from('citation_snapshots')
            .select('*')
            .eq('domain_id', domain.id),
          auth.supabase
            .from('generated_fixes')
            .select('*')
            .eq('domain_id', domain.id),
        ]);
        existingSnapshots = snapData ?? [];
        existingFixes = fixData ?? [];
      }
    } else {
      domain = store.domains.find((d) => d.id === body.domain_id);
      if (domain) {
        existingSnapshots = store.snapshots.filter(
          (s) => s.domain_id === domain!.id
        );
        existingFixes = store.fixes.filter((f) => f.domain_id === domain!.id);
      }
    }

    if (!domain) {
      return NextResponse.json(
        { error: 'DOMAIN_NOT_FOUND', message: 'Domain not found in workspace.' },
        { status: 404 }
      );
    }

    const verification = await verifyLiveFixDeployment(domain.domain_url);

    const mappedScans: EngineScanResult[] = existingSnapshots.map((s) => ({
      promptText: '',
      aiEngine: s.ai_engine,
      brandMentioned: s.brand_mentioned,
      citationRank: s.citation_rank,
      competitorsMentioned: s.competitors_mentioned,
      citedSourceUrls: s.cited_source_urls,
      decompiledFanoutQueries: [],
      fanoutTelemetryType: s.fanout_telemetry_type,
      hallucinationDetected: s.hallucination_detected,
      hallucinationDetails: s.hallucination_details ?? [],
      rawAnswerExcerpt: s.raw_answer_excerpt ?? '',
    }));

    const recalculatedVisibility = computeVisibilityScore({
      robotsAiBotStatus: verification.robotsAiBotStatus,
      llmsTxtStatus: verification.llmsTxtStatus,
      agentsMdStatus: verification.agentsMdStatus,
      jsonLdCount: verification.jsonLdCount,
      isShopify: verification.isShopify,
      shopifyMcpStatus: verification.shopifyMcpStatus,
      scanResults: mappedScans,
    });

    const updatedDomain: DomainRow = {
      ...domain,
      is_shopify: verification.isShopify,
      shopify_mcp_status: verification.shopifyMcpStatus,
      agents_md_status: verification.agentsMdStatus,
      llms_txt_status: verification.llmsTxtStatus,
      robots_ai_bot_status: verification.robotsAiBotStatus,
      visibility_score: recalculatedVisibility,
      last_scanned_at: verification.checkedAt,
    };

    const appliedSet = new Set(verification.appliedFixTypes);
    const appliedFixIds = existingFixes
      .filter((f) => appliedSet.has(f.fix_type))
      .map((f) => f.id);

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
          last_scanned_at: updatedDomain.last_scanned_at,
        })
        .eq('id', domain.id)
        .eq('user_id', auth.profile.id);

      for (const fix of existingFixes) {
        const nextApplied = appliedSet.has(fix.fix_type);
        if (fix.is_applied !== nextApplied) {
          await auth.supabase
            .from('generated_fixes')
            .update({ is_applied: nextApplied })
            .eq('id', fix.id)
            .eq('domain_id', domain.id);
        }
      }
    } else {
      Object.assign(domain, updatedDomain);
      for (const fix of store.fixes) {
        if (fix.domain_id === domain.id) {
          fix.is_applied = appliedSet.has(fix.fix_type);
        }
      }
    }

    // Evict 24h public grader cache for this hostname so re-checks reflect fresh fixes immediately
    getGraderCacheMap().delete(verification.hostname);

    return NextResponse.json({
      verification,
      domain: updatedDomain,
      appliedFixIds,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'VERIFY_FIXES_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to verify live fix deployment.',
      },
      { status: 400 }
    );
  }
}
