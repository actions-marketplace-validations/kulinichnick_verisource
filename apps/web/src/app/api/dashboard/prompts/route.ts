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
