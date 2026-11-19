import { NextResponse } from 'next/server';
import {
  buildFollowUpVerificationAiPrompt,
  computeScoreDeltaSummary,
  computeVisibilityScore,
  getWebsitePlatformMeta,
  selectLatestLiveSnapshotsPerPromptEngine,
  verifyLiveFixDeployment,
  type AiRemediationTargetEnv,
  type CitationSnapshotRow,
  type DomainRow,
  type EngineScanResult,
  type GeneratedFixRow,
} from '@verisource/core-geo';
import {
  getGraderCacheMap,
  getLocalMockStore,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

const ALLOWED_TARGET_ENVS = new Set<AiRemediationTargetEnv>([
  'coding_agent',
  'chat_assistant',
  'shopify_liquid',
  'wordpress_cms',
  'webflow_cms',
  'wix_squarespace_framer',
]);

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to verify live fixes.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a $19 Audit Pass or monthly Console plan to verify live fix deployment.',
        },
        { status: 402 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      domain_id?: string;
      env?: string;
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

    let explicitEnv: AiRemediationTargetEnv | undefined;
    if (body.env !== undefined) {
      if (
        typeof body.env !== 'string' ||
        !ALLOWED_TARGET_ENVS.has(body.env as AiRemediationTargetEnv)
      ) {
        return NextResponse.json(
          {
            error: 'INVALID_TARGET_ENV',
            message:
              'Unsupported AI remediation environment. Choose coding_agent, chat_assistant, shopify_liquid, wordpress_cms, webflow_cms, or wix_squarespace_framer.',
          },
          { status: 400 }
        );
      }
      explicitEnv = body.env as AiRemediationTargetEnv;
    }

    const store = getLocalMockStore();

    let domain: DomainRow | undefined;
    let existingSnapshots: CitationSnapshotRow[] = [];
    let existingFixes: GeneratedFixRow[] = [];

    if (access.supabase) {
      const { data: domData } = await access.supabase
        .from('domains')
        .select('*')
        .eq('id', body.domain_id)
        .eq('user_id', access.profile.id)
        .maybeSingle();
      domain = domData ?? undefined;

      if (domain) {
        const [{ data: snapData }, { data: fixData }] = await Promise.all([
          access.supabase
            .from('citation_snapshots')
            .select('*')
            .eq('domain_id', domain.id),
          access.supabase
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

    const mappedScans: EngineScanResult[] =
      selectLatestLiveSnapshotsPerPromptEngine(existingSnapshots);

    const recalculatedVisibility = computeVisibilityScore({
      robotsAiBotStatus: verification.robotsAiBotStatus,
      llmsTxtStatus: verification.llmsTxtStatus,
      agentsMdStatus: verification.agentsMdStatus,
      jsonLdCount: verification.jsonLdCount,
      isShopify: verification.isShopify,
      detectedPlatform: verification.detectedPlatform,
      detectedPlatformLabel: verification.detectedPlatformLabel,
      shopifyMcpStatus: verification.shopifyMcpStatus,
      scanResults: mappedScans,
    });

    const previousVisibilityScore = domain.visibility_score;
    const previousAccuracyScore = domain.accuracy_score;

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
          last_scanned_at: updatedDomain.last_scanned_at,
        })
        .eq('id', domain.id)
        .eq('user_id', access.profile.id);

      for (const fix of existingFixes) {
        const nextApplied = appliedSet.has(fix.fix_type);
        if (fix.is_applied !== nextApplied) {
          await access.supabase
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

    const scoreDelta = computeScoreDeltaSummary({
      previousVisibilityScore,
      currentVisibilityScore: updatedDomain.visibility_score,
      previousAccuracyScore,
      currentAccuracyScore: updatedDomain.accuracy_score,
      baselineLabel: 'previous_scan',
      verifiedLiveChecksCount: verification.checks.filter((c) => c.live).length,
    });

    const resolvedTargetEnv: AiRemediationTargetEnv =
      explicitEnv ??
      getWebsitePlatformMeta(
        verification.detectedPlatform ??
          (verification.isShopify ? 'shopify' : 'nextjs_custom')
      ).recommendedAiEnv;

    const updatedFixesForPrompt: GeneratedFixRow[] = existingFixes.map((f) => ({
      ...f,
      is_applied: appliedSet.has(f.fix_type),
    }));

    const followUpResult = buildFollowUpVerificationAiPrompt({
      domain: updatedDomain,
      verification,
      fixes: updatedFixesForPrompt,
      targetEnv: resolvedTargetEnv,
    });

    return NextResponse.json({
      verification,
      domain: updatedDomain,
      appliedFixIds,
      scoreDelta,
      followUp: {
        targetEnv: resolvedTargetEnv,
        allVerified: followUpResult.allVerified,
        liveCount: followUpResult.liveCount,
        remainingCount: followUpResult.remainingCount,
        remainingCheckIds: followUpResult.remainingCheckIds,
        checkGuidance: followUpResult.checkGuidance,
        promptScore: followUpResult.prompt.score,
        promptContent: followUpResult.prompt.content,
      },
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
