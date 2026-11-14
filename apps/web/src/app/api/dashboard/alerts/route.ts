import { NextResponse } from 'next/server';
import {
  dispatchHallucinationDriftEmail,
  type CitationSnapshotRow,
  type DomainRow,
  type HallucinationDetail,
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

function collectUniqueHallucinations(
  snapshots: CitationSnapshotRow[]
): HallucinationDetail[] {
  const seen = new Set<string>();
  const collected: HallucinationDetail[] = [];

  for (const snap of snapshots) {
    for (const detail of snap.hallucination_details ?? []) {
      const sig = `${detail.category}:${detail.claim_text.toLowerCase()}`;
      if (!seen.has(sig)) {
        seen.add(sig);
        collected.push(detail);
      }
    }
  }

  return collected;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      domain_id?: string;
      recipient_email?: string;
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
            error: 'ALERT_RATE_LIMIT',
            message:
              'Demo drift-alert preview limit reached (5/hour). Sign in at /login to enable scheduled Resend delivery.',
          },
          { status: 429 }
        );
      }
      ipMap.set(ip, { hourBucket, count: used + 1 });
    }

    const rawRecipient =
      body.recipient_email !== undefined
        ? body.recipient_email.trim()
        : (auth?.profile.email ?? store.profile.email);

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
        const { data: snapRows } = await auth.supabase
          .from('citation_snapshots')
          .select('*')
          .eq('domain_id', domain.id)
          .order('scanned_at', { ascending: false })
          .limit(30);
        snapshots = (snapRows ?? []) as CitationSnapshotRow[];
      }
    } else {
      domain = body.domain_id
        ? (store.domains.find((d) => d.id === body.domain_id) ?? null)
        : (store.domains[0] ?? null);

      if (domain) {
        snapshots = store.snapshots.filter((s) => s.domain_id === domain!.id);
      }
    }

    if (!domain) {
      return NextResponse.json(
        {
          error: 'DOMAIN_NOT_FOUND',
          message: 'Select a tracked domain before dispatching a drift alert.',
        },
        { status: 404 }
      );
    }

    const hallucinations = collectUniqueHallucinations(snapshots);
    const blockedBots = extractBlockedBots(domain.robots_ai_bot_status);

    // Prevent unauthenticated callers from using live Resend as an open relay
    const canSendLiveEmail = Boolean(auth && auth.profile.plan_tier !== 'free');
    const recipientForDispatch = auth ? auth.profile.email : rawRecipient;

    const result = await dispatchHallucinationDriftEmail({
      recipientEmail: recipientForDispatch,
      brandName: domain.brand_name,
      domainUrl: domain.domain_url,
      visibilityScore: domain.visibility_score,
      accuracyScore: domain.accuracy_score,
      hallucinations,
      blockedBots,
      consoleBaseUrl:
        process.env.NEXT_PUBLIC_APP_URL ?? 'https://verisource.dev',
      resendApiKey: canSendLiveEmail ? process.env.RESEND_API_KEY : undefined,
      fromEmail: process.env.ALERT_FROM_EMAIL,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'ALERT_DISPATCH_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to dispatch hallucination drift alert.',
      },
      { status: 400 }
    );
  }
}
