import fs from 'node:fs';

export const VERISOURCE_PR_COMMENT_MARKER = '<!-- verisource-pr-gate -->';

export interface GithubPrContext {
  token: string;
  repository: string;
  prNumber: number;
  apiBaseUrl: string;
}

export interface GithubPrCommentResult {
  posted: boolean;
  action: 'created' | 'updated' | 'skipped';
  commentId: number | null;
  htmlUrl: string | null;
  reason?: string;
}

export function resolveGithubPrContext(overrides?: {
  token?: string;
  repository?: string;
  prNumber?: number;
  apiBaseUrl?: string;
}): GithubPrContext | null {
  const token = (
    overrides?.token ??
    process.env.GITHUB_TOKEN ??
    process.env.GH_TOKEN ??
    ''
  ).trim();
  const repository = (
    overrides?.repository ??
    process.env.GITHUB_REPOSITORY ??
    ''
  ).trim();

  if (
    !token ||
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)
  ) {
    return null;
  }

  let prNumber = overrides?.prNumber ?? Number(process.env.GITHUB_PR_NUMBER || 0);
  if ((!Number.isInteger(prNumber) || prNumber <= 0) && process.env.GITHUB_EVENT_PATH) {
    try {
      const raw = fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8');
      const parsed = JSON.parse(raw) as {
        pull_request?: { number?: number };
        issue?: { number?: number; pull_request?: unknown };
        number?: number;
      };
      const candidate =
        parsed.pull_request?.number ??
        (parsed.issue?.pull_request ? parsed.issue.number : undefined) ??
        parsed.number ??
        0;
      if (Number.isInteger(candidate) && candidate > 0) {
        prNumber = candidate;
      }
    } catch {
      // Ignore unreadable event payload
    }
  }

  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    return null;
  }

  const apiBaseUrl = (
    overrides?.apiBaseUrl ??
    process.env.GITHUB_API_URL ??
    'https://api.github.com'
  ).replace(/\/+$/, '');

  return {
    token,
    repository,
    prNumber,
    apiBaseUrl,
  };
}

export async function upsertGithubPrComment(params: {
  markdownBody: string;
  context?: GithubPrContext | null;
}): Promise<GithubPrCommentResult> {
  const ctx = params.context ?? resolveGithubPrContext();
  if (!ctx) {
    return {
      posted: false,
      action: 'skipped',
      commentId: null,
      htmlUrl: null,
      reason: 'NO_PR_CONTEXT',
    };
  }

  const bodyWithMarker = params.markdownBody.includes(
    VERISOURCE_PR_COMMENT_MARKER
  )
    ? params.markdownBody
    : `${VERISOURCE_PR_COMMENT_MARKER}\n${params.markdownBody}`;

  const commonHeaders: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${ctx.token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'VerisourceCLI/1.0',
  };

  try {
    const listRes = await fetch(
      `${ctx.apiBaseUrl}/repos/${ctx.repository}/issues/${ctx.prNumber}/comments?per_page=100`,
      {
        method: 'GET',
        headers: commonHeaders,
        signal: AbortSignal.timeout(8000),
      }
    );

    if (listRes.status === 401 || listRes.status === 403 || listRes.status === 404) {
      return {
        posted: false,
        action: 'skipped',
        commentId: null,
        htmlUrl: null,
        reason: `GITHUB_API_${listRes.status}`,
      };
    }

    let existingCommentId: number | null = null;
    if (listRes.ok) {
      const comments = (await listRes.json()) as Array<{
        id?: number;
        body?: string;
      }>;
      const match = comments.find(
        (c) =>
          typeof c.id === 'number' &&
          typeof c.body === 'string' &&
          c.body.includes(VERISOURCE_PR_COMMENT_MARKER)
      );
      if (match?.id) {
        existingCommentId = match.id;
      }
    }

    const writeUrl = existingCommentId
      ? `${ctx.apiBaseUrl}/repos/${ctx.repository}/issues/comments/${existingCommentId}`
      : `${ctx.apiBaseUrl}/repos/${ctx.repository}/issues/${ctx.prNumber}/comments`;
    const writeMethod = existingCommentId ? 'PATCH' : 'POST';

    const writeRes = await fetch(writeUrl, {
      method: writeMethod,
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: bodyWithMarker }),
      signal: AbortSignal.timeout(8000),
    });

    if (!writeRes.ok) {
      return {
        posted: false,
        action: 'skipped',
        commentId: null,
        htmlUrl: null,
        reason: `GITHUB_WRITE_${writeRes.status}`,
      };
    }

    const saved = (await writeRes.json()) as {
      id?: number;
      html_url?: string;
    };
    return {
      posted: true,
      action: existingCommentId ? 'updated' : 'created',
      commentId: saved.id ?? existingCommentId,
      htmlUrl: saved.html_url ?? null,
    };
  } catch (err) {
    return {
      posted: false,
      action: 'skipped',
      commentId: null,
      htmlUrl: null,
      reason: err instanceof Error ? err.message : 'NETWORK_ERROR',
    };
  }
}
