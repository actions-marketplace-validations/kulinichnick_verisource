import { NextResponse } from 'next/server';
import {
  CitationMentionVerifyError,
  verifyOffSiteCitationMention,
  type DomainRow,
} from '@verisource/core-geo';
import {
  checkHourlyOutboundVerifyLimit,
  getLocalMockStore,
  resolveConsoleRequestAccess,
} from '../../../../lib/data-store';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const access = await resolveConsoleRequestAccess(request);
    if (access.status === 'unauthenticated') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_REQUIRED',
          message:
            'Sign in to your Verisource Console to verify off-site citation mentions.',
        },
        { status: 401 }
      );
    }
    if (access.status === 'plan_activation_required') {
      return NextResponse.json(
        {
          error: 'PLAN_ACTIVATION_REQUIRED',
          message:
            'Activate a Console plan to verify off-site citation mentions.',
        },
        { status: 402 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      domain_id?: string;
      citation_url?: string;
    };
    const domainId = (body.domain_id ?? '').trim();
    const citationUrl = (body.citation_url ?? '').trim();

    if (!domainId) {
      return NextResponse.json(
        {
          error: 'MISSING_DOMAIN_ID',
          message: 'Provide a domain_id to verify an off-site citation URL.',
        },
        { status: 400 }
      );
    }
    if (!citationUrl) {
      return NextResponse.json(
        {
          error: 'MISSING_CITATION_URL',
          message:
            'Enter a public third-party article, directory, or community URL to verify.',
        },
        { status: 400 }
      );
    }

    let domain: DomainRow | undefined;
    if (access.supabase) {
      const { data: domData } = await access.supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', access.profile.id)
        .maybeSingle();
      domain = (domData as DomainRow | null) ?? undefined;
    } else {
      domain = getLocalMockStore().domains.find((d) => d.id === domainId);
    }

    if (!domain) {
      return NextResponse.json(
        {
          error: 'DOMAIN_NOT_FOUND',
          message: 'Domain not found in your workspace.',
        },
        { status: 404 }
      );
    }

    if (
      !checkHourlyOutboundVerifyLimit(`verify_cit:${access.profile.id}`, 60)
    ) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message:
            'Hourly live citation verification quota reached (60 checks/hour). Please wait a few minutes and try again.',
        },
        { status: 429 }
      );
    }

    const report = await verifyOffSiteCitationMention({
      citationUrl,
      ownDomainUrl: domain.domain_url,
      brandName: domain.brand_name,
      brandTruthSheet: domain.brand_truth_sheet,
    });

    return NextResponse.json({
      ok: true,
      report: {
        citationUrl: report.citationUrl,
        sourceHost: report.sourceHost,
        sourceCategory: report.sourceCategory,
        sourceCategoryLabel: report.sourceCategoryLabel,
        httpStatus: report.httpStatus,
        gptBotStatus: report.gptBotStatus,
        perplexityBotStatus: report.perplexityBotStatus,
        aiBotsAllowed: report.aiBotsAllowed,
        brandNameMentioned: report.brandNameMentioned,
        domainLinkPresent: report.domainLinkPresent,
        linkRelType: report.linkRelType,
        matchedAnchorHref: report.matchedAnchorHref,
        matchedSnippetExcerpt: report.matchedSnippetExcerpt,
        overallStatus: report.overallStatus,
        statusHeadline: report.statusHeadline,
        checkedAt: report.checkedAt,
      },
      noteScore: report.nextActionNote.score,
      noteContent: report.nextActionNote.content,
    });
  } catch (err) {
    if (err instanceof CitationMentionVerifyError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: 'VERIFY_CITATION_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to verify off-site citation URL.',
      },
      { status: 400 }
    );
  }
}
