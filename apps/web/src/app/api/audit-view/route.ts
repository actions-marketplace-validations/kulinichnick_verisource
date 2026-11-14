import { NextResponse } from 'next/server';
import {
  dispatchProspectOpenEmail,
  isAutomatedPreviewBot,
} from '@verisource/core-geo';
import {
  getAuditViewDedupMap,
  recordVerifiedPitchOpen,
} from '../../../lib/data-store';

const DEDUP_WINDOW_MS = 30 * 60 * 1000;

function extractHostname(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { slug?: string };
    const slug = body.slug?.trim() ?? '';
    if (!slug || !/^[a-z0-9-]{3,120}$/i.test(slug)) {
      return NextResponse.json(
        { error: 'INVALID_SLUG', message: 'Malformed audit report slug.' },
        { status: 400 }
      );
    }

    const expectedHost = (request.headers.get('host') ?? '')
      .split(':')[0]
      ?.toLowerCase();
    const originHost = extractHostname(request.headers.get('origin'));
    const refererHost = extractHostname(request.headers.get('referer'));
    const callerHost = originHost ?? refererHost;

    if (!callerHost || (expectedHost && callerHost !== expectedHost)) {
      return NextResponse.json(
        {
          error: 'ORIGIN_MISMATCH',
          message: 'Audit view telemetry requires a same-origin browser request.',
        },
        { status: 403 }
      );
    }

    const ua = request.headers.get('user-agent');
    if (isAutomatedPreviewBot(ua)) {
      return NextResponse.json({
        counted: false,
        reason: 'bot_filtered',
      });
    }

    const ip =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      '127.0.0.1';
    const dedupKey = `${ip}:${slug.toLowerCase()}`;
    const dedupMap = getAuditViewDedupMap();
    const existingExpiry = dedupMap.get(dedupKey);
    const now = Date.now();
    if (existingExpiry && existingExpiry > now) {
      return NextResponse.json({
        counted: false,
        reason: 'deduplicated_window',
      });
    }

    const opened = await recordVerifiedPitchOpen(slug);
    if (!opened) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Audit report not found or expired.' },
        { status: 404 }
      );
    }

    dedupMap.set(dedupKey, now + DEDUP_WINDOW_MS);

    const { report, ownerEmail } = opened;
    let alertMode: 'live_resend' | 'preview_dry_run' | 'skipped_milestone' =
      'skipped_milestone';

    if (report.views_count === 1 || report.views_count === 3) {
      const fallbackRecipient = process.env.ALERT_FALLBACK_EMAIL?.trim() || null;
      const targetEmail =
        ownerEmail && ownerEmail !== 'demo@verisource.dev'
          ? ownerEmail
          : fallbackRecipient;

      if (targetEmail) {
        try {
          const dispatched = await dispatchProspectOpenEmail({
            recipientEmail: targetEmail,
            prospectBrandName: report.prospect_brand_name,
            prospectDomain: report.prospect_domain,
            shareSlug: report.share_slug,
            visibilityScore: report.visibility_score,
            hallucinationCount: report.hallucination_count,
            viewsCount: report.views_count,
            topGap: report.summary_payload.top_gaps[0],
            agencyBrandName: report.agency_brand_name,
            resendApiKey: process.env.RESEND_API_KEY,
            fromEmail: process.env.ALERT_FROM_EMAIL,
          });
          alertMode = dispatched.mode;
        } catch {
          // Never fail view telemetry if external email provider experiences transient timeout
        }
      } else if (!process.env.RESEND_API_KEY) {
        // Run dry-run Critic verification in local/E2E zero-key mode
        const dryRun = await dispatchProspectOpenEmail({
          recipientEmail: ownerEmail ?? 'demo@verisource.dev',
          prospectBrandName: report.prospect_brand_name,
          prospectDomain: report.prospect_domain,
          shareSlug: report.share_slug,
          visibilityScore: report.visibility_score,
          hallucinationCount: report.hallucination_count,
          viewsCount: report.views_count,
          topGap: report.summary_payload.top_gaps[0],
          agencyBrandName: report.agency_brand_name,
        });
        alertMode = dryRun.mode;
      }
    }

    return NextResponse.json({
      counted: true,
      views_count: report.views_count,
      alert_mode: alertMode,
    });
  } catch {
    return NextResponse.json(
      { error: 'TELEMETRY_FAILED', message: 'Unable to record view event.' },
      { status: 400 }
    );
  }
}
