import { NextResponse } from 'next/server';
import {
  getLocalMockStore,
  getServiceSupabaseClient,
  resolveAuthenticatedProfile,
} from '../../../../lib/data-store';

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await resolveAuthenticatedProfile(request);
  if (!auth) {
    const store = getLocalMockStore();
    return NextResponse.json({
      mode: getServiceSupabaseClient() ? 'demo_sandbox' : 'mock',
      profile: store.profile,
      domains: store.domains,
      prompts: store.prompts,
      snapshots: store.snapshots,
      fixes: store.fixes,
      attributionEvents: store.attributionEvents,
      pitchReports: store.pitchReports,
      mcpApiKeys: store.mcpApiKeys,
    });
  }

  const { supabase, profile } = auth;
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

  return NextResponse.json({
    mode: 'live_authenticated',
    profile,
    domains: domains ?? [],
    prompts: promptsRes.data ?? [],
    snapshots: snapsRes.data ?? [],
    fixes: fixesRes.data ?? [],
    attributionEvents: attrRes.data ?? [],
    pitchReports: pitchRes.data ?? [],
    mcpApiKeys: keysRes.data ?? [],
  });
}
