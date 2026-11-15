import { NextResponse } from 'next/server';
import {
  classifyPromptIntent,
  normalizePublicDomain,
  resolveCoreGeoEnv,
  runMultiEnginePromptScan,
  type CitationSnapshotRow,
  type DomainRow,
  type TrackedPromptRow,
} from '@verisource/core-geo';
import {
  PROTECTED_PATIENT_ZERO_IDS,
  getLocalMockStore,
  promptCapForPlan,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to track buyer prompts.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a $19 Audit Pass or monthly Console plan to track buyer prompts across AI engines.',
        },
        { status: 402 }
      );
    }

    const body = (await request.json()) as {
      domain_id?: string;
      prompt_text?: string;
      intent_category?: string;
    };

    const domainId = body.domain_id?.trim() ?? '';
    const promptText = body.prompt_text?.replace(/\s+/g, ' ').trim() ?? '';

    if (!domainId || promptText.length < 5 || promptText.length > 220) {
      return NextResponse.json(
        {
          error: 'INVALID_PROMPT',
          message:
            'Enter a buyer prompt between 5 and 220 characters for an active domain.',
        },
        { status: 400 }
      );
    }

    const store = getLocalMockStore();
    const activeProfile = access.profile;
    const maxPrompts = promptCapForPlan(activeProfile.plan_tier);

    let domain: DomainRow | undefined;
    let totalUserPrompts = 0;

    if (access.supabase) {
      const { data: domData } = await access.supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', activeProfile.id)
        .maybeSingle();
      domain = domData ?? undefined;

      if (domain) {
        const { data: userDomains } = await access.supabase
          .from('domains')
          .select('id')
          .eq('user_id', activeProfile.id);
        const ids = (userDomains ?? []).map((d) => d.id);
        if (ids.length > 0) {
          const { count } = await access.supabase
            .from('tracked_prompts')
            .select('id', { count: 'exact', head: true })
            .in('domain_id', ids);
          totalUserPrompts = count ?? 0;
        }
      }
    } else {
      domain = store.domains.find((d) => d.id === domainId);
      if (store.prompts.length >= maxPrompts) {
        const removableIdx = store.prompts.findIndex(
          (p) => !PROTECTED_PATIENT_ZERO_IDS.has(p.domain_id)
        );
        if (removableIdx !== -1) {
          store.prompts.splice(removableIdx, 1);
        }
      }
      totalUserPrompts = store.prompts.length;
    }

    if (!domain) {
      return NextResponse.json(
        { error: 'DOMAIN_NOT_FOUND', message: 'Domain not found in workspace.' },
        { status: 404 }
      );
    }

    if (totalUserPrompts >= maxPrompts) {
      return NextResponse.json(
        {
          error: 'PROMPT_CAP_REACHED',
          message: `Your ${activeProfile.plan_tier} plan supports up to ${maxPrompts} tracked buyer prompts. Upgrade to add more prompts.`,
        },
        { status: 403 }
      );
    }

    const env = resolveCoreGeoEnv();
    const normalized = normalizePublicDomain(domain.domain_url);

    const scanResults = await runMultiEnginePromptScan({
      prompts: [promptText],
      engines: ['chatgpt', 'gemini', 'perplexity'],
      domain: normalized,
      brandName: domain.brand_name,
      truthSheet: domain.brand_truth_sheet,
      env,
    });

    const nowIso = new Date().toISOString();
    const promptId = crypto.randomUUID();
    const inferredIntent = classifyPromptIntent(
      promptText,
      domain.brand_name
    ).intentCategory;

    const newPrompt: TrackedPromptRow = {
      id: promptId,
      domain_id: domain.id,
      prompt_text: promptText,
      intent_category: body.intent_category?.trim() || inferredIntent,
      decompiled_fanout_queries: Array.from(
        new Set(scanResults.flatMap((s) => s.decompiledFanoutQueries))
      ),
      is_active: true,
      created_at: nowIso,
    };

    const newSnapshots: CitationSnapshotRow[] = scanResults.map((s) => ({
      id: crypto.randomUUID(),
      domain_id: domain!.id,
      prompt_id: promptId,
      ai_engine: s.aiEngine,
      brand_mentioned: s.brandMentioned,
      citation_rank: s.citationRank,
      competitors_mentioned: s.competitorsMentioned,
      cited_source_urls: s.citedSourceUrls,
      fanout_telemetry_type: s.fanoutTelemetryType,
      hallucination_detected: s.hallucinationDetected,
      hallucination_details:
        s.hallucinationDetails.length > 0 ? s.hallucinationDetails : null,
      raw_answer_excerpt: s.rawAnswerExcerpt,
      scanned_at: nowIso,
    }));

    if (access.supabase) {
      await access.supabase.from('tracked_prompts').insert(newPrompt);
      if (newSnapshots.length > 0) {
        await access.supabase.from('citation_snapshots').insert(newSnapshots);
      }
    } else {
      store.prompts.push(newPrompt);
      store.snapshots.unshift(...newSnapshots);
    }

    return NextResponse.json({
      prompt: newPrompt,
      snapshots: newSnapshots,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'ADD_PROMPT_FAILED',
        message:
          err instanceof Error ? err.message : 'Unable to scan buyer prompt.',
      },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to re-scan buyer prompts.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a Console plan to run fresh multi-engine prompt scans.',
        },
        { status: 402 }
      );
    }

    const body = (await request.json()) as { prompt_id?: string };
    const promptId = body.prompt_id?.trim() ?? '';
    if (!promptId) {
      return NextResponse.json(
        { error: 'MISSING_PROMPT_ID', message: 'Provide prompt_id to re-scan.' },
        { status: 400 }
      );
    }

    const store = getLocalMockStore();
    let promptRow: TrackedPromptRow | undefined;
    let domain: DomainRow | undefined;

    if (access.supabase) {
      const { data: pData } = await access.supabase
        .from('tracked_prompts')
        .select('*')
        .eq('id', promptId)
        .maybeSingle();
      if (pData) {
        const { data: dData } = await access.supabase
          .from('domains')
          .select('*')
          .eq('id', pData.domain_id)
          .eq('user_id', access.profile.id)
          .maybeSingle();
        if (dData) {
          promptRow = pData;
          domain = dData;
        }
      }
    } else {
      promptRow = store.prompts.find((p) => p.id === promptId);
      if (promptRow) {
        domain = store.domains.find((d) => d.id === promptRow!.domain_id);
      }
    }

    if (!promptRow || !domain) {
      return NextResponse.json(
        { error: 'PROMPT_NOT_FOUND', message: 'Tracked prompt not found in workspace.' },
        { status: 404 }
      );
    }

    const env = resolveCoreGeoEnv();
    const normalized = normalizePublicDomain(domain.domain_url);
    const scanResults = await runMultiEnginePromptScan({
      prompts: [promptRow.prompt_text],
      engines: ['chatgpt', 'gemini', 'perplexity'],
      domain: normalized,
      brandName: domain.brand_name,
      truthSheet: domain.brand_truth_sheet,
      env,
    });

    const nowIso = new Date().toISOString();
    const updatedFanouts = Array.from(
      new Set(scanResults.flatMap((s) => s.decompiledFanoutQueries))
    );

    const refreshedPrompt: TrackedPromptRow = {
      ...promptRow,
      decompiled_fanout_queries:
        updatedFanouts.length > 0
          ? updatedFanouts
          : promptRow.decompiled_fanout_queries,
    };

    const newSnapshots: CitationSnapshotRow[] = scanResults.map((s) => ({
      id: crypto.randomUUID(),
      domain_id: domain!.id,
      prompt_id: refreshedPrompt.id,
      ai_engine: s.aiEngine,
      brand_mentioned: s.brandMentioned,
      citation_rank: s.citationRank,
      competitors_mentioned: s.competitorsMentioned,
      cited_source_urls: s.citedSourceUrls,
      fanout_telemetry_type: s.fanoutTelemetryType,
      hallucination_detected: s.hallucinationDetected,
      hallucination_details:
        s.hallucinationDetails.length > 0 ? s.hallucinationDetails : null,
      raw_answer_excerpt: s.rawAnswerExcerpt,
      scanned_at: nowIso,
    }));

    if (access.supabase) {
      await access.supabase
        .from('tracked_prompts')
        .update({
          decompiled_fanout_queries: refreshedPrompt.decompiled_fanout_queries,
        })
        .eq('id', refreshedPrompt.id);
      await access.supabase
        .from('citation_snapshots')
        .delete()
        .eq('prompt_id', refreshedPrompt.id);
      if (newSnapshots.length > 0) {
        await access.supabase.from('citation_snapshots').insert(newSnapshots);
      }
    } else {
      const idx = store.prompts.findIndex((p) => p.id === refreshedPrompt.id);
      if (idx !== -1) store.prompts[idx] = refreshedPrompt;
      store.snapshots = [
        ...newSnapshots,
        ...store.snapshots.filter((s) => s.prompt_id !== refreshedPrompt.id),
      ];
    }

    return NextResponse.json({
      prompt: refreshedPrompt,
      snapshots: newSnapshots,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'RESCAN_PROMPT_FAILED',
        message:
          err instanceof Error ? err.message : 'Unable to re-scan buyer prompt.',
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message: 'Sign in to your Verisource Console to remove tracked prompts.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message: 'Activate a Console plan to manage tracked buyer prompts.',
        },
        { status: 402 }
      );
    }

    const url = new URL(request.url);
    const promptId = url.searchParams.get('id')?.trim() ?? '';
    if (!promptId) {
      return NextResponse.json(
        { error: 'MISSING_PROMPT_ID', message: 'Provide ?id=<prompt_id>.' },
        { status: 400 }
      );
    }

    if (access.supabase) {
      const { data: pData } = await access.supabase
        .from('tracked_prompts')
        .select('*')
        .eq('id', promptId)
        .maybeSingle();

      if (!pData) {
        return NextResponse.json(
          { error: 'PROMPT_NOT_FOUND', message: 'Tracked prompt not found.' },
          { status: 404 }
        );
      }

      const { data: dData } = await access.supabase
        .from('domains')
        .select('id')
        .eq('id', pData.domain_id)
        .eq('user_id', access.profile.id)
        .maybeSingle();

      if (!dData) {
        return NextResponse.json(
          { error: 'PROMPT_NOT_FOUND', message: 'Tracked prompt not found.' },
          { status: 404 }
        );
      }

      await access.supabase
        .from('tracked_prompts')
        .delete()
        .eq('id', promptId);
      return NextResponse.json({ deleted: true, id: promptId });
    }

    const store = getLocalMockStore();
    const idx = store.prompts.findIndex((p) => p.id === promptId);
    if (idx === -1) {
      return NextResponse.json(
        { error: 'PROMPT_NOT_FOUND', message: 'Tracked prompt not found.' },
        { status: 404 }
      );
    }
    store.prompts.splice(idx, 1);
    store.snapshots = store.snapshots.filter((s) => s.prompt_id !== promptId);
    return NextResponse.json({ deleted: true, id: promptId });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'DELETE_PROMPT_FAILED',
        message:
          err instanceof Error ? err.message : 'Unable to remove tracked prompt.',
      },
      { status: 400 }
    );
  }
}
