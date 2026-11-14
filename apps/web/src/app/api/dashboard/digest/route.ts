import { NextResponse } from 'next/server';
import {
  dispatchWeeklyExecutiveDigestEmail,
  type AiAttributionEventRow,
  type CitationSnapshotRow,
  type DomainRow,
  type GeneratedFixRow,
} from '@verisource/core-geo';
import {
  getAlertIpMap,
  getLocalMockStore,
  getServiceSupabaseClient,
  resolveAuthenticatedProfile,
} from '../../../../lib/data-store';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function extractBlockedBots(
  botStatus: DomainRow['robots_ai_bot_status']
): string[] {
  const blocked: string[] = [];
  if (!botStatus.GPTBot) blocked.push('GPTBot');
  if (!botStatus['OAI-SearchBot']) blocked.push('OAI-SearchBot');
  if (!botStatus.PerplexityBot) blocked.push('PerplexityBot');
  if (!botStatus.ClaudeBot) blocked.push('ClaudeBot');
  if (!botStatus['Google-Extended']) blocked.push('Google-Extended');
  if (botStatus.waf_blocked && blocked.length === 0) {
    blocked.push('Edge WAF HTTP 403');
  }
  return blocked;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      domain_id?: string;
      recipient_email?: string;
      white_label?: boolean;
      previous_visibility_score?: number;
    };

    const auth = await resolveAuthenticatedProfile(request);
    const serviceSupabase = auth?.supabase ?? getServiceSupabaseClient();
    const store = getLocalMockStore();

    if (!auth && serviceSupabase) {
      const ip =
        request.headers.get('cf-connecting-ip') ??
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        '127.0.0.1';
      const hourBucket = new Date().toISOString().slice(0, 13);
      const ipMap = getAlertIpMap();
      const entry = ipMap.get(ip);
      const used = entry && entry.hourBucket === hourBucket ? entry.count : 0;
      if (used >= 5) {
        return NextResponse.json(
          {
            error: 'DIGEST_RATE_LIMIT',
            message:
              'Demo executive digest preview limit reached (5/hour). Sign in at /login to enable scheduled Monday Resend delivery.',
          },
          { status: 429 }
        );
      }
      ipMap.set(ip, { hourBucket, count: used + 1 });
    }

    const activeProfile = auth?.profile ?? store.profile;
    const rawRecipient =
      body.recipient_email !== undefined
        ? body.recipient_email.trim()
        : activeProfile.email;

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

    if (auth) {
      let query = auth.supabase
        .from('domains')
        .select('*')
        .eq('user_id', auth.profile.id);

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
            auth.supabase
              .from('citation_snapshots')
              .select('*')
              .eq('domain_id', domain.id)
              .order('scanned_at', { ascending: false })
              .limit(30),
            auth.supabase
              .from('generated_fixes')
              .select('*')
              .eq('domain_id', domain.id),
            auth.supabase
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

    if (!domain) {
      return NextResponse.json(
        {
          error: 'DOMAIN_NOT_FOUND',
          message: 'Select a tracked domain before generating a weekly digest.',
        },
        { status: 404 }
      );
    }

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

    const aiReferralVisits7d = events.filter(
      (ev) => ev.event_type === 'ai_referral_visit'
    ).length;
    const aiReferralRevenueUsd7d = events
      .filter((ev) => ev.event_type === 'ai_referral_conversion')
      .reduce((sum, ev) => sum + Number(ev.conversion_value_usd ?? 0), 0);

    const useWhiteLabel =
      body.white_label !== false && Boolean(activeProfile.agency_brand_name);

    // Prevent unauthenticated callers from using live Resend as an open relay
    const canSendLiveEmail = Boolean(auth && auth.profile.plan_tier !== 'free');
    const recipientForDispatch = auth ? auth.profile.email : rawRecipient;

    const result = await dispatchWeeklyExecutiveDigestEmail({
      recipientEmail: recipientForDispatch,
      brandName: domain.brand_name,
      domainUrl: domain.domain_url,
      visibilityScore: domain.visibility_score,
      previousVisibilityScore:
        typeof body.previous_visibility_score === 'number'
          ? body.previous_visibility_score
          : null,
      accuracyScore: domain.accuracy_score,
      enginesCitingCount: snapshots.filter((s) => s.brand_mentioned).length,
      totalSnapshotsScanned: snapshots.length,
      aiReferralVisits7d,
      aiReferralRevenueUsd7d,
      appliedFixesCount: fixes.filter((f) => f.is_applied).length,
      totalFixesCount: fixes.length,
      activeHallucinationCount: seenHallucinations.size,
      blockedBots: extractBlockedBots(domain.robots_ai_bot_status),
      topRivalDomains: Array.from(rivalSet).slice(0, 3),
      agencyBrandName: useWhiteLabel ? activeProfile.agency_brand_name : null,
      agencyPrimaryColor: useWhiteLabel
        ? activeProfile.agency_primary_color
        : null,
      agencyCtaUrl: useWhiteLabel ? activeProfile.agency_cta_url : null,
      consoleBaseUrl:
        process.env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev',
      resendApiKey: canSendLiveEmail ? process.env.RESEND_API_KEY : undefined,
      fromEmail: process.env.ALERT_FROM_EMAIL,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'DIGEST_DISPATCH_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to generate weekly executive digest.',
      },
      { status: 400 }
    );
  }
}
