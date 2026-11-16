import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SubPageInspectionError,
  buildCitationAnswerPageBundle,
  evaluatePublishedCitationPage,
  inspectSubPageForAiCrawlers,
  type AiRemediationTargetEnv,
  type CitationPageBlueprintType,
  type DomainRow,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  getVerifyFixesIpMap,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export const maxDuration = 30;

const ALLOWED_TARGET_ENVS = new Set<AiRemediationTargetEnv>([
  'coding_agent',
  'chat_assistant',
  'shopify_liquid',
  'wordpress_cms',
  'webflow_cms',
  'wix_squarespace_framer',
]);

const InspectUrlBodySchema = z.object({
  domain_id: z.string().min(8).max(80),
  target_path_or_url: z.string().min(1).max(512),
  blueprint_type: z
    .enum(['vs_competitor', 'buyer_guide', 'pricing_truth'])
    .optional(),
  rival_name: z.string().max(120).optional(),
  target_prompt: z.string().max(320).optional(),
  env: z.string().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to inspect sub-page bot extraction.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a 7-day free trial, $19 Audit Pass, or Console plan to inspect sub-page bot extraction.',
        },
        { status: 402 }
      );
    }

    const ip =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      '127.0.0.1';
    const hourBucket = `inspect:${new Date().toISOString().slice(0, 13)}`;
    const ipMap = getVerifyFixesIpMap();
    const existingRate = ipMap.get(`${ip}:${hourBucket}`);
    const used = existingRate ? existingRate.count : 0;
    if (used >= 30) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'Hourly sub-page bot inspection limit reached (30/hr). Try again shortly.',
        },
        { status: 429 }
      );
    }
    ipMap.set(`${ip}:${hourBucket}`, { hourBucket, count: used + 1 });

    const rawBody = await request.json().catch(() => null);
    const parsed = InspectUrlBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST_BODY',
          message: 'Provide a valid domain_id and target_path_or_url (e.g. /pricing).',
        },
        { status: 400 }
      );
    }

    const {
      domain_id: domainId,
      target_path_or_url: targetPathOrUrl,
      blueprint_type: blueprintType,
      rival_name: rivalName,
      target_prompt: targetPrompt,
      env: rawEnv,
    } = parsed.data;

    let validatedEnv: AiRemediationTargetEnv | undefined;
    if (rawEnv !== undefined) {
      if (!ALLOWED_TARGET_ENVS.has(rawEnv as AiRemediationTargetEnv)) {
        return NextResponse.json(
          {
            error: 'INVALID_TARGET_ENV',
            message:
              'Unsupported AI remediation environment on sub-page verification.',
          },
          { status: 400 }
        );
      }
      validatedEnv = rawEnv as AiRemediationTargetEnv;
    }

    let domain: DomainRow | undefined;
    if (access.supabase) {
      const { data: domData } = await access.supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', access.profile.id)
        .maybeSingle();
      domain = domData ?? undefined;
    } else {
      const store = getLocalMockStore();
      domain = store.domains.find((d) => d.id === domainId);
    }

    if (!domain) {
      return NextResponse.json(
        {
          error: 'DOMAIN_NOT_FOUND',
          message: 'Domain not found in your workspace.',
        },
        { status: 404 }
      );
    }

    try {
      const inspection = await inspectSubPageForAiCrawlers({
        trackedDomainUrl: domain.domain_url,
        targetPathOrUrl,
        brandName: domain.brand_name,
        brandTruthSheet: domain.brand_truth_sheet,
        isShopify: domain.is_shopify,
      });

      if (blueprintType) {
        const bundle = buildCitationAnswerPageBundle({
          domain,
          blueprintType: blueprintType as CitationPageBlueprintType,
          rivalName: rivalName ?? null,
          targetPrompt: targetPrompt ?? null,
          targetEnv: validatedEnv,
        });
        const evaluated = evaluatePublishedCitationPage({
          domain,
          bundle,
          inspection,
          targetEnv: validatedEnv,
        });

        return NextResponse.json(
          {
            inspection,
            studioVerification: {
              isLiveHttp200: evaluated.isLiveHttp200,
              allChecksPassed: evaluated.allChecksPassed,
              passedCount: evaluated.passedCount,
              totalCount: evaluated.totalCount,
              pageReadinessScore: evaluated.pageReadinessScore,
              hasComparisonTable: evaluated.hasComparisonTable,
              hasFaqJsonLd: evaluated.hasFaqJsonLd,
              recommendedPromptToTrack: evaluated.recommendedPromptToTrack,
              recommendedPromptIntent: evaluated.recommendedPromptIntent,
              statusHeadline: evaluated.statusHeadline,
              nextActionSummary: evaluated.nextActionSummary,
              promptScore: evaluated.followUpPagePrompt.score,
              promptContent: evaluated.followUpPagePrompt.content,
            },
          },
          { status: 200 }
        );
      }

      return NextResponse.json({ inspection }, { status: 200 });
    } catch (err) {
      if (err instanceof SubPageInspectionError) {
        return NextResponse.json(
          {
            error: err.code,
            message: err.message,
          },
          { status: err.code === 'CROSS_DOMAIN_BLOCKED' ? 403 : 400 }
        );
      }
      throw err;
    }
  } catch {
    return NextResponse.json(
      {
        error: 'SUBPAGE_INSPECTION_FAILED',
        message: 'Unable to complete live sub-page bot inspection.',
      },
      { status: 500 }
    );
  }
}
