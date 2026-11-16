import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  DEMO_PROFILE,
  parseBatchProspectDomains,
  runFullGeoAudit,
  type AgencyPitchReportRow,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  getServiceSupabaseClient,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export const maxDuration = 60;

function isServiceRoleAdminBearer(request: Request): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
  if (!serviceKey) return false;
  const authHeader = request.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) return false;
  const candidate = match[1].trim();
  const expectedBuf = Buffer.from(serviceKey, 'utf8');
  const candidateBuf = Buffer.from(candidate, 'utf8');
  if (expectedBuf.length !== candidateBuf.length) return false;
  return timingSafeEqual(expectedBuf, candidateBuf);
}

function sanitizeHexColor(raw?: string | null): string {
  if (!raw) return '#0A0E17';
  const trimmed = raw.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : '#0A0E17';
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

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const laneCount = Math.max(1, Math.min(concurrency, items.length));

  await Promise.all(
    Array.from({ length: laneCount }, async () => {
      while (cursor < items.length) {
        const idx = cursor;
        cursor += 1;
        results[idx] = await worker(items[idx]!, idx);
      }
    })
  );

  return results;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const isServiceAdmin = isServiceRoleAdminBearer(request);
    const access = isServiceAdmin
      ? null
      : await resolveConsoleRequestAccess(request);

    if (!isServiceAdmin && access?.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message:
            'Sign in to your Verisource Console to generate white-label client briefs.',
        },
        { status: 401 }
      );
    }
    if (!isServiceAdmin && access?.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a Console plan to mint white-label /audit/[slug] client briefs.',
        },
        { status: 402 }
      );
    }

    const body = (await request.json()) as {
      prospect_domain?: string;
      prospect_domains?: string[] | string;
      agency_brand_name?: string;
      agency_logo_url?: string;
      agency_primary_color?: string;
      agency_cta_url?: string;
    };

    const rawDomainsInput = body.prospect_domains ?? body.prospect_domain;
    if (
      rawDomainsInput === undefined ||
      (typeof rawDomainsInput === 'string' && !rawDomainsInput.trim()) ||
      (Array.isArray(rawDomainsInput) && rawDomainsInput.length === 0)
    ) {
      return NextResponse.json(
        {
          error: 'MISSING_PROSPECT_DOMAIN',
          message: 'Enter at least one prospect domain.',
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

    const activeProfile =
      access && access.status !== 'unauthenticated'
        ? access.profile
        : null;
    const serviceSupabase =
      (access && access.status !== 'unauthenticated' ? access.supabase : null) ??
      getServiceSupabaseClient();
    const store = getLocalMockStore();

    const normalizedDomains = parseBatchProspectDomains(rawDomainsInput, 10);

    const brandNameSnapshot =
      body.agency_brand_name !== undefined
        ? body.agency_brand_name.trim().slice(0, 80) || 'Partner GEO Practice'
        : (activeProfile?.agency_brand_name ??
          store.profile.agency_brand_name ??
          'Partner GEO Practice');

    const colorSnapshot =
      body.agency_primary_color !== undefined
        ? sanitizeHexColor(body.agency_primary_color)
        : sanitizeHexColor(
            activeProfile?.agency_primary_color ??
              store.profile.agency_primary_color
          );

    const ctaSnapshot =
      cleanedCta !== undefined
        ? cleanedCta
        : sanitizeHttpUrl(
            activeProfile?.agency_cta_url ?? store.profile.agency_cta_url
          );

    const logoSnapshot =
      cleanedLogo !== undefined
        ? cleanedLogo
        : sanitizeHttpUrl(
            activeProfile?.agency_logo_url ?? store.profile.agency_logo_url
          );

    if (access?.status === 'authenticated' && access.supabase) {
      await access.supabase
        .from('profiles')
        .update({
          agency_brand_name: brandNameSnapshot,
          agency_logo_url: logoSnapshot,
          agency_primary_color: colorSnapshot,
          agency_cta_url: ctaSnapshot,
        })
        .eq('id', access.profile.id);
    } else if (!serviceSupabase) {
      store.profile.agency_brand_name = brandNameSnapshot;
      store.profile.agency_logo_url = logoSnapshot;
      store.profile.agency_primary_color = colorSnapshot;
      store.profile.agency_cta_url = ctaSnapshot;
    }

    const ttlDays = 30;
    const expiresIso = new Date(
      Date.now() + ttlDays * 86400 * 1000
    ).toISOString();
    const createdIso = new Date().toISOString();
    const ownerUserId = activeProfile ? activeProfile.id : DEMO_PROFILE.id;

    const createdReports = await mapWithConcurrency(
      normalizedDomains,
      3,
      async (domainHost) => {
        const audit = await runFullGeoAudit({
          domainInput: domainHost,
        });

        const slugBase = audit.hostname
          .replace(/[^a-z0-9]+/gi, '-')
          .replace(/^-|-$/g, '')
          .toLowerCase();
        const randomSuffix = Math.random().toString(36).slice(2, 6);
        const shareSlug = `${slugBase}-${randomSuffix}`;

        const row: AgencyPitchReportRow = {
          id: crypto.randomUUID(),
          agency_user_id: ownerUserId,
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
          expires_at: expiresIso,
          created_at: createdIso,
        };
        return row;
      }
    );

    if (serviceSupabase && createdReports.length > 0) {
      await serviceSupabase.from('agency_pitch_reports').insert(createdReports);
    }
    store.pitchReports.unshift(...createdReports);

    const first = createdReports[0]!;
    return NextResponse.json({
      report: first,
      share_url: `/audit/${first.share_slug}`,
      reports: createdReports,
      share_urls: createdReports.map((r) => `/audit/${r.share_slug}`),
      batch_count: createdReports.length,
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

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const isServiceAdmin = isServiceRoleAdminBearer(request);
    const access = isServiceAdmin
      ? null
      : await resolveConsoleRequestAccess(request);

    if (!isServiceAdmin && access?.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to refresh client briefs.',
        },
        { status: 401 }
      );
    }
    if (!isServiceAdmin && access?.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message: 'Activate a Console plan to refresh client briefs.',
        },
        { status: 402 }
      );
    }

    const body = (await request.json()) as {
      share_slug?: string;
      preserve_permanent_expiry?: boolean;
    };

    const cleanSlug = (body.share_slug ?? '').trim();
    if (!cleanSlug || !/^[a-z0-9][a-z0-9-]{1,95}$/i.test(cleanSlug)) {
      return NextResponse.json(
        {
          error: 'INVALID_SHARE_SLUG',
          message: 'Provide a valid /audit/[slug] identifier to refresh.',
        },
        { status: 400 }
      );
    }

    const activeProfile =
      access && access.status !== 'unauthenticated' ? access.profile : null;
    const serviceSupabase =
      (access && access.status !== 'unauthenticated' ? access.supabase : null) ??
      getServiceSupabaseClient();
    const store = getLocalMockStore();

    let existing: AgencyPitchReportRow | null = null;
    if (serviceSupabase) {
      const { data } = await serviceSupabase
        .from('agency_pitch_reports')
        .select('*')
        .eq('share_slug', cleanSlug)
        .maybeSingle();
      if (data) {
        existing = data as AgencyPitchReportRow;
      }
    }
    if (!existing) {
      existing =
        store.pitchReports.find((r) => r.share_slug === cleanSlug) ?? null;
    }

    if (!existing) {
      return NextResponse.json(
        {
          error: 'PITCH_REPORT_NOT_FOUND',
          message: 'Pitch report slug not found in this workspace.',
        },
        { status: 404 }
      );
    }

    if (!isServiceAdmin && activeProfile) {
      if (existing.agency_user_id !== activeProfile.id) {
        return NextResponse.json(
          {
            error: 'PITCH_REPORT_NOT_FOUND',
            message: 'Pitch report slug not found in this workspace.',
          },
          { status: 404 }
        );
      }
    }

    const audit = await runFullGeoAudit({
      domainInput: existing.prospect_domain,
    });

    const ttlDays = 30;
    const nextExpiresAt =
      (isServiceAdmin && body.preserve_permanent_expiry) ||
      existing.expires_at === null
        ? null
        : new Date(Date.now() + ttlDays * 86400 * 1000).toISOString();

    const preservedPayload = {
      ...audit.pitchSummaryPayload,
      ...(existing.summary_payload?.cta_clicks_count !== undefined
        ? { cta_clicks_count: existing.summary_payload.cta_clicks_count }
        : {}),
      ...(existing.summary_payload?.last_cta_clicked_at
        ? { last_cta_clicked_at: existing.summary_payload.last_cta_clicked_at }
        : {}),
    };

    const updatedFields = {
      prospect_brand_name: audit.brandName || existing.prospect_brand_name,
      visibility_score: audit.visibilityScore,
      hallucination_count: audit.allHallucinations.length,
      summary_payload: preservedPayload,
      expires_at: nextExpiresAt,
    };

    let updatedRow: AgencyPitchReportRow = {
      ...existing,
      ...updatedFields,
    };

    if (serviceSupabase) {
      const { data: dbRow } = await serviceSupabase
        .from('agency_pitch_reports')
        .update(updatedFields)
        .eq('share_slug', cleanSlug)
        .select('*')
        .maybeSingle();
      if (dbRow) {
        updatedRow = dbRow as AgencyPitchReportRow;
      }
    }

    store.pitchReports = store.pitchReports.map((r) =>
      r.share_slug === cleanSlug ? updatedRow : r
    );

    return NextResponse.json({
      report: updatedRow,
      share_url: `/audit/${updatedRow.share_slug}`,
      refreshed: true,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'PITCH_REFRESH_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to refresh pitch report.',
      },
      { status: 400 }
    );
  }
}
