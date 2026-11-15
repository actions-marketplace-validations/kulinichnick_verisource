import { NextResponse } from 'next/server';
import {
  dispatchHallucinationDriftEmail,
  type CitationSnapshotRow,
  type DomainRow,
  type HallucinationDetail,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  resolveConsoleRequestAccess,
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
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to dispatch drift alerts.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a Console plan to dispatch hallucination drift alerts.',
        },
        { status: 402 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      domain_id?: string;
      recipient_email?: string;
    };

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
        const { data: snapRows } = await access.supabase
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

    const canSendLiveEmail = Boolean(
      access.supabase && access.profile.plan_tier !== 'free'
    );
    const recipientForDispatch = access.supabase
      ? access.profile.email
      : rawRecipient;

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
