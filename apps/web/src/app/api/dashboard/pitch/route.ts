import { NextResponse } from 'next/server';
import {
  DEMO_PROFILE,
  runFullGeoAudit,
  type AgencyPitchReportRow,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  getPitchIpMap,
  getServiceSupabaseClient,
  resolveAuthenticatedProfile,
} from '../../../../lib/data-store';

function sanitizeHexColor(raw?: string | null): string {
  if (!raw) return '#0F172A';
  const trimmed = raw.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : '#0F172A';
}

function sanitizeHttpUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      prospect_domain?: string;
      agency_brand_name?: string;
      agency_logo_url?: string;
      agency_primary_color?: string;
      agency_cta_url?: string;
    };

    if (!body.prospect_domain) {
      return NextResponse.json(
        {
          error: 'MISSING_PROSPECT_DOMAIN',
          message: 'Enter a prospect domain.',
        },
        { status: 400 }
      );
    }

    let cleanedCta: string | null | undefined = undefined;
    if (body.agency_cta_url !== undefined) {
      cleanedCta = sanitizeHttpUrl(body.agency_cta_url);
      if (body.agency_cta_url.trim() && !cleanedCta) {
        return NextResponse.json(
          {
            error: 'INVALID_CTA_URL',
            message: 'Booking CTA URL must use https:// or http://.',
          },
          { status: 400 }
        );
      }
    }

    let cleanedLogo: string | null | undefined = undefined;
    if (body.agency_logo_url !== undefined) {
      cleanedLogo = sanitizeHttpUrl(body.agency_logo_url);
      if (body.agency_logo_url.trim() && !cleanedLogo) {
        return NextResponse.json(
          {
            error: 'INVALID_LOGO_URL',
            message: 'Agency logo URL must use https:// or http://.',
          },
          { status: 400 }
        );
      }
    }

    const auth = await resolveAuthenticatedProfile(request);
    const serviceSupabase = auth?.supabase ?? getServiceSupabaseClient();
    const store = getLocalMockStore();

    // Rate-limit unauthenticated demo pitch generation in production to 5/IP/hour
    if (!auth && serviceSupabase) {
      const ip =
        request.headers.get('cf-connecting-ip') ??
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        '127.0.0.1';
      const hourBucket = new Date().toISOString().slice(0, 13);
      const ipMap = getPitchIpMap();
      const entry = ipMap.get(ip);
      const used = entry && entry.hourBucket === hourBucket ? entry.count : 0;
      if (used >= 5) {
        return NextResponse.json(
          {
            error: 'PITCH_RATE_LIMIT',
            message:
              'Demo pitch preview limit reached (5/hour). Sign in at /login for unlimited Agency White-Label links.',
          },
          { status: 429 }
        );
      }
      ipMap.set(ip, { hourBucket, count: used + 1 });
    }

    const brandNameSnapshot =
      body.agency_brand_name !== undefined
        ? body.agency_brand_name.trim().slice(0, 80) || 'Partner GEO Practice'
        : (auth?.profile.agency_brand_name ??
          store.profile.agency_brand_name ??
          'Partner GEO Practice');

    const colorSnapshot =
      body.agency_primary_color !== undefined
        ? sanitizeHexColor(body.agency_primary_color)
        : sanitizeHexColor(
            auth?.profile.agency_primary_color ??
              store.profile.agency_primary_color
          );

    const ctaSnapshot =
      cleanedCta !== undefined
        ? cleanedCta
        : sanitizeHttpUrl(
            auth?.profile.agency_cta_url ?? store.profile.agency_cta_url
          );

    const logoSnapshot =
      cleanedLogo !== undefined
        ? cleanedLogo
        : sanitizeHttpUrl(
            auth?.profile.agency_logo_url ?? store.profile.agency_logo_url
          );

    if (auth) {
      await auth.supabase
        .from('profiles')
        .update({
          agency_brand_name: brandNameSnapshot,
          agency_logo_url: logoSnapshot,
          agency_primary_color: colorSnapshot,
          agency_cta_url: ctaSnapshot,
        })
        .eq('id', auth.profile.id);
    } else {
      store.profile.agency_brand_name = brandNameSnapshot;
      store.profile.agency_logo_url = logoSnapshot;
      store.profile.agency_primary_color = colorSnapshot;
      store.profile.agency_cta_url = ctaSnapshot;
    }

    const audit = await runFullGeoAudit({
      domainInput: body.prospect_domain,
    });

    const slugBase = audit.hostname
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    const randomSuffix = Math.random().toString(36).slice(2, 6);
    const shareSlug = `${slugBase}-${randomSuffix}`;

    const ttlDays = auth ? 30 : 1;
    const created: AgencyPitchReportRow = {
      id: crypto.randomUUID(),
      agency_user_id: auth ? auth.profile.id : DEMO_PROFILE.id,
      share_slug: shareSlug,
      prospect_domain: audit.domainUrl,
      prospect_brand_name: audit.brandName,
      visibility_score: audit.visibilityScore,
      hallucination_count: audit.allHallucinations.length,
      agency_brand_name_snapshot: brandNameSnapshot,
      agency_logo_url_snapshot: logoSnapshot,
      agency_primary_color_snapshot: colorSnapshot,
      agency_cta_url_snapshot: ctaSnapshot,
      summary_payload: audit.pitchSummaryPayload,
      views_count: 0,
      expires_at: new Date(Date.now() + ttlDays * 86400 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    if (serviceSupabase) {
      await serviceSupabase.from('agency_pitch_reports').insert(created);
    }
    store.pitchReports.unshift(created);

    return NextResponse.json({
      report: created,
      share_url: `/audit/${created.share_slug}`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'PITCH_GENERATION_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to generate pitch report.',
      },
      { status: 400 }
    );
  }
}
