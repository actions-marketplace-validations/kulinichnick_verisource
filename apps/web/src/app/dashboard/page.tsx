import React from 'react';
import { cookies, headers } from 'next/headers';
import {
  DashboardConsoleClient,
  type WorkspacePayload,
} from '../../components/DashboardConsoleClient';
import {
  createLockedPlaceholderProfile,
  getLocalMockStore,
  resolveConsoleRequestAccess,
} from '../../lib/data-store';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    domain?: string;
    tab?: string;
    upgraded?: string;
    credit_applied?: string;
    trial?: string;
  }>;
}): Promise<React.ReactElement> {
  const [params, reqHeaders, reqCookies] = await Promise.all([
    searchParams,
    headers(),
    cookies(),
  ]);

  const forwardedHeaders = new Headers();
  const authHeader = reqHeaders.get('authorization');
  if (authHeader) {
    forwardedHeaders.set('authorization', authHeader);
  }
  const cookieHeader = reqCookies
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');
  if (cookieHeader) {
    forwardedHeaders.set('cookie', cookieHeader);
  }

  const syntheticRequest = new Request('http://127.0.0.1/dashboard', {
    headers: forwardedHeaders,
  });
  const access = await resolveConsoleRequestAccess(syntheticRequest);

  let initialData: WorkspacePayload;

  if (access.status === 'unauthenticated') {
    initialData = {
      mode: 'unauthenticated_locked',
      profile: createLockedPlaceholderProfile(),
      domains: [],
      prompts: [],
      snapshots: [],
      fixes: [],
      attributionEvents: [],
      pitchReports: [],
      mcpApiKeys: [],
    };
  } else if (access.status === 'plan_activation_required') {
    initialData = {
      mode: 'plan_activation_required',
      profile: access.profile,
      domains: [],
      prompts: [],
      snapshots: [],
      fixes: [],
      attributionEvents: [],
      pitchReports: [],
      mcpApiKeys: [],
    };
  } else if (access.status === 'mock_owner') {
    const store = getLocalMockStore();
    initialData = {
      mode: 'mock',
      profile: store.profile,
      domains: store.domains,
      prompts: store.prompts,
      snapshots: store.snapshots,
      fixes: store.fixes,
      attributionEvents: store.attributionEvents,
      pitchReports: store.pitchReports,
      mcpApiKeys: store.mcpApiKeys,
    };
  } else {
    const { supabase, profile } = access;
    const { data: domains } = await supabase
      .from('domains')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true });

    const domainIds = (domains ?? []).map((d) => d.id);

    const [promptsRes, snapsRes, fixesRes, attrRes, pitchRes, keysRes] =
      await Promise.all([
        domainIds.length
          ? supabase
              .from('tracked_prompts')
              .select('*')
              .in('domain_id', domainIds)
          : Promise.resolve({ data: [] }),
        domainIds.length
          ? supabase
              .from('citation_snapshots')
              .select('*')
              .in('domain_id', domainIds)
              .order('scanned_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        domainIds.length
          ? supabase
              .from('generated_fixes')
              .select('*')
              .in('domain_id', domainIds)
          : Promise.resolve({ data: [] }),
        domainIds.length
          ? supabase
              .from('ai_attribution_events')
              .select('*')
              .in('domain_id', domainIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        supabase
          .from('agency_pitch_reports')
          .select('*')
          .eq('agency_user_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('mcp_api_keys')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
      ]);

    initialData = {
      mode: 'live_authenticated',
      profile,
      domains: domains ?? [],
      prompts: promptsRes.data ?? [],
      snapshots: snapsRes.data ?? [],
      fixes: fixesRes.data ?? [],
      attributionEvents: attrRes.data ?? [],
      pitchReports: pitchRes.data ?? [],
      mcpApiKeys: keysRes.data ?? [],
    };
  }

  return (
    <DashboardConsoleClient
      initialData={initialData}
      initialDomainQuery={params.domain}
      initialTab={params.tab}
      upgradedPlan={params.upgraded}
      creditApplied={params.credit_applied === 'true'}
      trialActive={params.trial === '7d'}
    />
  );
}
