import { NextResponse } from 'next/server';
import {
  dispatchTrialActivationNudgeEmail,
  type AiAttributionEventRow,
  type CitationSnapshotRow,
  type DomainRow,
  type GeneratedFixRow,
  type TrialLifecycleStage,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const globalForTrialNudge = globalThis as unknown as {
  __verisourceTrialNudgeIpMap?: Map<
    string,
    { hourBucket: string; count: number }
  >;
};

function checkTrialNudgeRateLimit(request: Request): boolean {
  if (!globalForTrialNudge.__verisourceTrialNudgeIpMap) {
    globalForTrialNudge.__verisourceTrialNudgeIpMap = new Map();
  }
  const map = globalForTrialNudge.__verisourceTrialNudgeIpMap;
  if (map.size > 1500) {
    map.clear();
  }
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1';
  const hourBucket = new Date().toISOString().slice(0, 13);
  const existing = map.get(ip);
  if (!existing || existing.hourBucket !== hourBucket) {
    map.set(ip, { hourBucket, count: 1 });
    return true;
  }
  if (existing.count >= 20) {
    return false;
  }
  existing.count += 1;
  return true;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message:
            'Sign in to your Verisource Console to dispatch your trial quickstart email.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a 7-day free trial or Console plan to dispatch quickstart emails.',
        },
        { status: 402 }
      );
    }

    if (!checkTrialNudgeRateLimit(request)) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'Too many quickstart email requests this hour. Try again shortly.',
        },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      domain_id?: string;
      stage?: string;
      recipient_email?: string;
    };

    if (
      body.stage !== undefined &&
      body.stage !== 'day3_copy_ai_prompt' &&
      body.stage !== 'day5_value_proof'
    ) {
      return NextResponse.json(
        {
          error: 'INVALID_STAGE',
          message:
            'stage must be either "day3_copy_ai_prompt" or "day5_value_proof".',
        },
        { status: 400 }
      );
    }

    const store = getLocalMockStore();
    const rawRecipient =
      body.recipient_email !== undefined
        ? body.recipient_email.trim()
        : access.profile.email;

    if (!rawRecipient || !EMAIL_REGEX.test(rawRecipient)) {
      return NextResponse.json(
        {
          error: 'INVALID_EMAIL',
          message: 'Provide a valid recipient email address.',
        },
        { status: 400 }
      );
    }

    let domain: DomainRow | null = null;
    let snapshots: CitationSnapshotRow[] = [];
    let fixes: GeneratedFixRow[] = [];
    let events: AiAttributionEventRow[] = [];

    if (access.supabase) {
      let query = access.supabase
        .from('domains')
        .select('*')
        .eq('user_id', access.profile.id);

      if (body.domain_id) {
        query = query.eq('id', body.domain_id);
      } else {
        query = query.order('created_at', { ascending: true }).limit(1);
      }

      const { data: domainRows } = await query;
      domain = (domainRows?.[0] as DomainRow | undefined) ?? null;

      if (domain) {
        const sevenDaysAgoIso = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();

        const [{ data: snapRows }, { data: fixRows }, { data: attrRows }] =
          await Promise.all([
            access.supabase
              .from('citation_snapshots')
              .select('*')
              .eq('domain_id', domain.id)
              .order('scanned_at', { ascending: false })
              .limit(30),
            access.supabase
              .from('generated_fixes')
              .select('*')
              .eq('domain_id', domain.id),
            access.supabase
              .from('ai_attribution_events')
              .select('*')
              .eq('domain_id', domain.id)
              .gte('created_at', sevenDaysAgoIso),
          ]);

        snapshots = (snapRows ?? []) as CitationSnapshotRow[];
        fixes = (fixRows ?? []) as GeneratedFixRow[];
        events = (attrRows ?? []) as AiAttributionEventRow[];
      }
    } else {
      domain = body.domain_id
        ? (store.domains.find((d) => d.id === body.domain_id) ?? null)
        : (store.domains[0] ?? null);

      if (domain) {
        snapshots = store.snapshots.filter((s) => s.domain_id === domain!.id);
        fixes = store.fixes.filter((f) => f.domain_id === domain!.id);
        events = store.attributionEvents.filter(
          (ev) => ev.domain_id === domain!.id
        );
      }
    }

    const onSiteFixes = fixes.filter(
      (f) => f.fix_type !== 'citation_outreach_brief'
    );
    const appliedOnSiteCount = onSiteFixes.filter((f) => f.is_applied).length;
    const jsonLdLiveCount =
      (onSiteFixes.some((f) => f.fix_type === 'json_ld_schema' && f.is_applied)
        ? 1
        : 0) +
      (onSiteFixes.some((f) => f.fix_type === 'fanout_faq_block' && f.is_applied)
        ? 1
        : 0);

    const seenHallucinations = new Set<string>();
    const rivalSet = new Set<string>();
    for (const snap of snapshots) {
      for (const detail of snap.hallucination_details ?? []) {
        seenHallucinations.add(
          `${detail.category}:${detail.claim_text.toLowerCase()}`
        );
      }
      for (const comp of snap.competitors_mentioned ?? []) {
        if (comp) rivalSet.add(comp);
      }
    }

    const botCrawlCount = events.filter(
      (ev) => ev.event_type === 'ai_bot_crawl'
    ).length;
    const aiReferralVisits7d = events.filter(
      (ev) => ev.event_type === 'ai_referral_visit'
    ).length;

    const effectiveStage: TrialLifecycleStage =
      body.stage === 'day3_copy_ai_prompt' || body.stage === 'day5_value_proof'
        ? body.stage
        : appliedOnSiteCount > 0
          ? 'day5_value_proof'
          : 'day3_copy_ai_prompt';

    // Strict owner-only email dispatch in production to prevent open-relay abuse
    const canSendLiveEmail = Boolean(
      access.supabase && access.profile.plan_tier !== 'free'
    );
    const recipientForDispatch = access.supabase
      ? access.profile.email
      : rawRecipient;

    const result = await dispatchTrialActivationNudgeEmail({
      recipientEmail: recipientForDispatch,
      stage: effectiveStage,
      planTier: access.profile.plan_tier,
      brandName: domain?.brand_name ?? null,
      domainUrl: domain?.domain_url ?? null,
      visibilityScore: domain?.visibility_score ?? null,
      accuracyScore: domain?.accuracy_score ?? null,
      appliedFixesCount: appliedOnSiteCount,
      totalFixesCount: onSiteFixes.length || 4,
      botCrawlCount,
      aiReferralVisits7d,
      hallucinationCount: seenHallucinations.size,
      robotsAiBotStatus: domain?.robots_ai_bot_status ?? null,
      llmsTxtStatus: domain?.llms_txt_status ?? null,
      agentsMdStatus: domain?.agents_md_status ?? null,
      jsonLdCount: jsonLdLiveCount,
      topRivals: Array.from(rivalSet).slice(0, 3),
      consoleBaseUrl:
        process.env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev',
      resendApiKey: canSendLiveEmail ? process.env.RESEND_API_KEY : undefined,
      fromEmail: process.env.ALERT_FROM_EMAIL,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'TRIAL_NUDGE_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to dispatch trial quickstart email.',
      },
      { status: 400 }
    );
  }
}
