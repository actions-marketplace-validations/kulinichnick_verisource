import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  crawlDomainSiteHealth,
  runDomainReadinessScan,
} from '@verisource/core-geo';
import {
  browseClickHandle,
  browseOpenUrl,
  recordBaselineWorkflow,
  runSavedWorkflow,
  saveBrowseSessionAsWorkflow,
  validateWorkflowFiles,
  type VerisourceWorkflowSpec,
} from './browser.js';
import {
  clearVerisourceCloudCredentials,
  collectGitEnvironmentMeta,
  pushCliRunToCloud,
  resolveVerisourceCloudCredentials,
  saveVerisourceCloudCredentials,
  verifyCliCloudAuth,
  type CliCloudSyncResult,
} from './cloud.js';
import {
  upsertGithubPrComment,
  VERISOURCE_PR_COMMENT_MARKER,
  type GithubPrCommentResult,
} from './github-pr.js';
import {
  queryCorrelatedBackendLogs,
  type LogProviderId,
} from './logs.js';
import { mapLiveDomain, mapStaticCodebase } from './mapper.js';
import { installAgentSkills, type AgentSkillTarget } from './skills.js';
import {
  findStoredHandle,
  loadOrInitChecksPolicy,
  queryStoredHandles,
  saveLastRunLedger,
  type StoredHandleItem,
} from './store.js';

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function getFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

function printHelp(): void {
  console.log(`verisource — AI Search GEO, Site Health & Browser Flow Verifier

Usage:
  verisource auth [--key vs_live_...] [--status|--logout] Save or verify Verisource Cloud API key (.verisource/config.json)
  verisource scan <url> [--push] [--json] [--github-summary] [--pr-comment] Scan AI readiness, bots, JSON-LD & 20-page link health
  verisource verify <url> [--init] [--push] [--json] [--github-summary] [--pr-comment] Deterministic CI check (exit 0 pass, 1 fail, 2 error)
  verisource show <handle> [--json]                  Drill into handle (h1, b1, l1, a1, n1, g1, e1)
  verisource query "<text>" [--json]                 Filter recent handles by keyword or status code
  verisource map [url | ./dir] [--diff] [--json]     Map live domain routes or static Next.js/React routes
  verisource browse open <url>                       Open page & index compact element handles (e1..eN)
  verisource browse click <e#>                       Click element handle in active browse session
  verisource browse save <name>                      Save active browse session into .verisource/workflows/
  verisource record <name> <url>                     Record baseline workflow into .verisource/workflows/
  verisource run [name] [--headed] [--json]          Replay saved workflow(s) with zero LLM calls
  verisource workflow check                          Validate all .verisource/workflows/*.json schemas
  verisource log <vercel|supabase|cloudflare>        Query error logs in recent 5-minute window
  verisource agent --skill --install <target>        Install agent skill (claude|cursor|codex|antigravity|all)
`);
}

export function buildGithubStepSummaryMarkdown(params: {
  mode: 'scan' | 'verify';
  status: 'PASS' | 'WARN' | 'FAIL';
  hostname: string;
  detectedPlatformLabel?: string;
  visibilityScore: number;
  healthScore: number;
  pagesScanned: number;
  linksChecked: number;
  botsAllowed: boolean;
  llmsTxtStatus: string;
  agentsMdStatus: string;
  jsonLdCount: number;
  failures?: string[];
  handles?: StoredHandleItem[];
}): string {
  const badge =
    params.status === 'PASS'
      ? 'PASS'
      : params.status === 'WARN'
        ? 'WARN'
        : 'FAIL';
  const badgeUrl = `https://verisource.dev/api/badge/${encodeURIComponent(params.hostname)}`;
  const reportUrl = `https://verisource.dev/report/${encodeURIComponent(params.hostname)}`;
  const lines: string[] = [
    VERISOURCE_PR_COMMENT_MARKER,
    `### Verisource AI Search & Site Health Gate — \`${badge}\``,
    '',
    `[![AI Search Readiness](${badgeUrl})](${reportUrl})`,
    '',
    '| Check | Measured Value | Status |',
    '| :--- | :--- | :--- |',
    `| **Target Domain** | \`${params.hostname}\` | \`${params.detectedPlatformLabel ?? 'Web'}\` |`,
    `| **AI Visibility Score** | \`${params.visibilityScore} / 100\` | \`${params.visibilityScore >= 60 ? 'PASS' : 'NEEDS WORK'}\` |`,
    `| **Site Health Crawler** | \`${params.healthScore} / 100\` (\`${params.pagesScanned}\` page(s) · \`${params.linksChecked}\` link(s)) | \`${params.healthScore >= 90 ? 'PASS' : 'CHECK LINKS'}\` |`,
    `| **AI Crawler WAF** | \`GPTBot · OAI-SearchBot · PerplexityBot · ClaudeBot\` | \`${params.botsAllowed ? 'HTTP 200 ALLOWED' : 'RESTRICTED / 403'}\` |`,
    `| **Protocol Artifacts** | \`/llms.txt\`: \`${params.llmsTxtStatus}\` · \`/agents.md\`: \`${params.agentsMdStatus}\` | \`JSON-LD: ${params.jsonLdCount} block(s)\` |`,
  ];

  if (params.failures && params.failures.length > 0) {
    lines.push('', '#### Policy Threshold Failures');
    for (const f of params.failures) {
      lines.push(`- \`FAIL\` ${f}`);
    }
  }

  if (params.handles && params.handles.length > 0) {
    lines.push(
      '',
      '#### Compact Action Handles',
      '',
      '| Handle | Severity | Finding | Fix Hint |',
      '| :--- | :--- | :--- | :--- |'
    );
    for (const h of params.handles.slice(0, 12)) {
      lines.push(
        `| \`[${h.handle}]\` | \`${h.severity.toUpperCase()}\` | ${h.summary.replace(/\|/g, '/')} | ${(h.fixHint ?? 'Inspect with verisource show ' + h.handle).replace(/\|/g, '/')} |`
      );
    }
  }

  lines.push(
    '',
    `<sub>Verified by <a href="https://verisource.dev/features">@verisource/cli</a> (\`VerisourceScan/1.0\`)</sub>`,
    ''
  );
  return lines.join('\n');
}

function writeGithubSummaryArtifact(markdown: string, cwd: string): string {
  const dir = path.resolve(cwd, '.verisource');
  fs.mkdirSync(dir, { recursive: true });
  const localPath = path.join(dir, 'github-summary.md');
  fs.writeFileSync(localPath, markdown, 'utf8');

  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY?.trim();
  if (stepSummaryPath) {
    fs.appendFileSync(stepSummaryPath, `${markdown}\n`, 'utf8');
  }
  return localPath;
}

export async function runCli(argv: string[], cwd: string = process.cwd()): Promise<number> {
  const args = argv.slice(2);
  const jsonOut = hasFlag(args, '--json');
  const cmd = args[0];

  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    printHelp();
    return 0;
  }

  try {
    if (cmd === 'auth') {
      const explicitOrigin = getFlagValue(args, '--api-origin');
      if (hasFlag(args, '--logout')) {
        const cfgPath = clearVerisourceCloudCredentials(cwd);
        if (jsonOut) {
          console.log(JSON.stringify({ ok: true, loggedOut: true, cfgPath }, null, 2));
        } else {
          console.log(`✓ Removed Verisource Cloud API key from ${cfgPath}`);
        }
        return 0;
      }

      const providedKey = getFlagValue(args, '--key');
      if (providedKey) {
        const cleanKey = providedKey.trim().replace(/^Bearer\s+/i, '').trim();
        if (!/^vs_live_[0-9a-f]{48}$/.test(cleanKey)) {
          console.error(
            'Invalid API key format. Expected vs_live_<48 lowercase hex chars> from https://verisource.dev/dashboard?tab=tab3_offsite.'
          );
          return 2;
        }
        const status = await verifyCliCloudAuth({
          apiKey: cleanKey,
          apiOrigin: explicitOrigin,
        });
        const savedPath = saveVerisourceCloudCredentials({
          apiKey: cleanKey,
          apiOrigin: explicitOrigin,
          cwd,
        });
        if (jsonOut) {
          console.log(
            JSON.stringify({ ...status, savedConfigPath: savedPath }, null, 2)
          );
        } else {
          console.log(
            `✓ Authenticated ${status.email} (${status.planTier} · ${status.trackedDomainCount}/${status.domainCap} domains) -> saved to ${savedPath}`
          );
        }
        return 0;
      }

      const resolved = resolveVerisourceCloudCredentials({
        explicitApiOrigin: explicitOrigin,
        cwd,
      });
      if (!resolved.apiKey) {
        console.error(
          'Not authenticated. Run `verisource auth --key vs_live_...` or set VERISOURCE_API_KEY.'
        );
        return 1;
      }
      const status = await verifyCliCloudAuth({
        apiKey: resolved.apiKey,
        apiOrigin: resolved.apiOrigin,
      });
      if (jsonOut) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        console.log(
          `PASS  Authenticated as ${status.email} (${status.planTier}) · key ${status.keyPrefix}•••• · ${status.trackedDomainCount}/${status.domainCap} tracked domains`
        );
      }
      return 0;
    }

    if (cmd === 'scan') {
      const target = args[1];
      if (!target || target.startsWith('-')) {
        console.error('Usage: verisource scan <url> [--json]');
        return 2;
      }
      const startedAt = new Date().toISOString();
      const [readiness, health] = await Promise.all([
        runDomainReadinessScan(target),
        crawlDomainSiteHealth({ domainInput: target, mode: 'workspace' }),
      ]);

      const handles: StoredHandleItem[] = [];
      if (!readiness.robotsAiBotStatus.GPTBot || !readiness.robotsAiBotStatus.PerplexityBot) {
        handles.push({
          handle: 'b1',
          kind: 'bot_waf',
          severity: 'critical',
          summary: `AI crawler blocked in robots.txt or WAF on ${readiness.hostname}`,
          url: `${readiness.domainUrl}/robots.txt`,
          fixHint: 'Allow GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot.',
        });
      }
      if (readiness.samplePromptResult.hallucinationDetected) {
        handles.push({
          handle: 'h1',
          kind: 'hallucination',
          severity: 'critical',
          summary: `AI claim conflict detected on prompt "${readiness.samplePromptResult.promptText}"`,
          url: readiness.domainUrl,
          fixHint: 'Publish verified pricing & exclusions in JSON-LD and /agents.md.',
        });
      }
      for (const f of health.findings) {
        handles.push({
          handle: f.handle,
          kind: f.category === 'ai_readability_gap' ? 'ai_readability' : f.category,
          severity: f.severity,
          summary: f.summary,
          url: f.targetUrl,
          httpStatus: f.httpStatus,
          fixHint: f.fixHint,
        });
      }

      const overallStatus = handles.some((h) => h.severity === 'critical')
        ? 'FAIL'
        : handles.length > 0
          ? 'WARN'
          : 'PASS';

      saveLastRunLedger(
        {
          runId: `scan-${Date.now()}`,
          command: `scan ${target}`,
          target: readiness.domainUrl,
          startedAt,
          finishedAt: new Date().toISOString(),
          status: overallStatus,
          handles,
        },
        cwd
      );

      let prComment: GithubPrCommentResult | null = null;
      if (hasFlag(args, '--github-summary') || hasFlag(args, '--pr-comment')) {
        const botsAllowed =
          Boolean(readiness.robotsAiBotStatus.GPTBot) &&
          Boolean(readiness.robotsAiBotStatus.PerplexityBot) &&
          !readiness.robotsAiBotStatus.waf_blocked;
        const md = buildGithubStepSummaryMarkdown({
          mode: 'scan',
          status: overallStatus,
          hostname: readiness.hostname,
          detectedPlatformLabel: readiness.detectedPlatformLabel,
          visibilityScore: readiness.visibilityScore,
          healthScore: health.healthScore,
          pagesScanned: health.pagesScanned,
          linksChecked: health.linksChecked,
          botsAllowed,
          llmsTxtStatus: readiness.llmsTxtStatus,
          agentsMdStatus: readiness.agentsMdStatus,
          jsonLdCount: readiness.jsonLdCount,
          handles,
        });
        if (hasFlag(args, '--github-summary')) {
          writeGithubSummaryArtifact(md, cwd);
        }
        if (hasFlag(args, '--pr-comment')) {
          prComment = await upsertGithubPrComment({ markdownBody: md });
        }
      }

      let cloudSync: CliCloudSyncResult | null = null;
      if (hasFlag(args, '--push')) {
        const creds = resolveVerisourceCloudCredentials({
          explicitApiKey: getFlagValue(args, '--api-key'),
          explicitApiOrigin: getFlagValue(args, '--api-origin'),
          cwd,
        });
        if (!creds.apiKey) {
          throw new Error(
            'Missing API key for --push. Run `verisource auth --key vs_live_...` or set VERISOURCE_API_KEY.'
          );
        }
        cloudSync = await pushCliRunToCloud({
          apiKey: creds.apiKey,
          apiOrigin: creds.apiOrigin,
          payload: {
            domain: readiness.domainUrl,
            mode: 'scan',
            status: overallStatus,
            visibilityScore: readiness.visibilityScore,
            llmsTxtStatus: readiness.llmsTxtStatus,
            agentsMdStatus: readiness.agentsMdStatus,
            robotsAiBotStatus: readiness.robotsAiBotStatus,
            siteHealth: {
              healthScore: health.healthScore,
              pagesScanned: health.pagesScanned,
              linksChecked: health.linksChecked,
            },
            handles,
            gitMeta: collectGitEnvironmentMeta(),
          },
        });
      }

      if (jsonOut) {
        console.log(
          JSON.stringify(
            {
              status: overallStatus,
              visibilityScore: readiness.visibilityScore,
              detectedPlatform: readiness.detectedPlatform,
              llmsTxtStatus: readiness.llmsTxtStatus,
              agentsMdStatus: readiness.agentsMdStatus,
              jsonLdCount: readiness.jsonLdCount,
              siteHealth: {
                healthScore: health.healthScore,
                pagesScanned: health.pagesScanned,
                linksChecked: health.linksChecked,
              },
              handles,
              ...(cloudSync ? { cloudSync } : {}),
              ...(prComment ? { prComment } : {}),
            },
            null,
            2
          )
        );
      } else {
        console.log(
          `${overallStatus}  ${readiness.hostname} · visibility ${readiness.visibilityScore}/100 · health ${health.healthScore}/100 · ${health.pagesScanned} pages`
        );
        for (const h of handles) {
          console.log(`  [${h.handle}] ${h.summary}`);
        }
        if (cloudSync?.synced) {
          console.log(
            `✓ Synced to Verisource Cloud (${cloudSync.planTier}) -> ${cloudSync.dashboardUrl}`
          );
        } else if (cloudSync?.message) {
          console.log(`ℹ Cloud Sync: ${cloudSync.message}`);
        }
      }
      return overallStatus === 'FAIL' ? 1 : 0;
    }

    if (cmd === 'verify') {
      const target = args[1];
      if (!target || target.startsWith('-')) {
        console.error('Usage: verisource verify <url> [--init] [--json]');
        return 2;
      }
      const policy = loadOrInitChecksPolicy(
        target,
        hasFlag(args, '--init'),
        cwd
      );
      const [readiness, health] = await Promise.all([
        runDomainReadinessScan(target),
        crawlDomainSiteHealth({ domainInput: target, mode: 'quick' }),
      ]);

      const failures: string[] = [];
      if (readiness.visibilityScore < policy.minVisibilityScore) {
        failures.push(
          `visibility ${readiness.visibilityScore} < min ${policy.minVisibilityScore}`
        );
      }
      if (policy.requireLlmsTxt && readiness.llmsTxtStatus !== 'present') {
        failures.push('/llms.txt missing');
      }
      if (
        policy.requireAgentsMd &&
        readiness.agentsMdStatus !== 'custom_enriched'
      ) {
        failures.push(`/agents.md is ${readiness.agentsMdStatus}`);
      }
      if (readiness.jsonLdCount < policy.minJsonLdNodes) {
        failures.push(
          `JSON-LD nodes ${readiness.jsonLdCount} < ${policy.minJsonLdNodes}`
        );
      }
      if (
        !policy.allowBrokenLinks &&
        health.findings.some(
          (f) => f.category === 'broken_link' || f.category === 'page_error'
        )
      ) {
        failures.push('broken links or 4xx/5xx pages detected');
      }
      if (
        !policy.allowDeadAnchors &&
        health.findings.some((f) => f.category === 'dead_anchor')
      ) {
        failures.push('dead #anchor targets detected');
      }

      const passed = failures.length === 0;
      let prComment: GithubPrCommentResult | null = null;
      if (hasFlag(args, '--github-summary') || hasFlag(args, '--pr-comment')) {
        const botsAllowed =
          Boolean(readiness.robotsAiBotStatus.GPTBot) &&
          Boolean(readiness.robotsAiBotStatus.PerplexityBot) &&
          !readiness.robotsAiBotStatus.waf_blocked;
        const md = buildGithubStepSummaryMarkdown({
          mode: 'verify',
          status: passed ? 'PASS' : 'FAIL',
          hostname: readiness.hostname,
          detectedPlatformLabel: readiness.detectedPlatformLabel,
          visibilityScore: readiness.visibilityScore,
          healthScore: health.healthScore,
          pagesScanned: health.pagesScanned,
          linksChecked: health.linksChecked,
          botsAllowed,
          llmsTxtStatus: readiness.llmsTxtStatus,
          agentsMdStatus: readiness.agentsMdStatus,
          jsonLdCount: readiness.jsonLdCount,
          failures,
        });
        if (hasFlag(args, '--github-summary')) {
          writeGithubSummaryArtifact(md, cwd);
        }
        if (hasFlag(args, '--pr-comment')) {
          prComment = await upsertGithubPrComment({ markdownBody: md });
        }
      }
      let cloudSync: CliCloudSyncResult | null = null;
      if (hasFlag(args, '--push')) {
        const creds = resolveVerisourceCloudCredentials({
          explicitApiKey: getFlagValue(args, '--api-key'),
          explicitApiOrigin: getFlagValue(args, '--api-origin'),
          cwd,
        });
        if (!creds.apiKey) {
          throw new Error(
            'Missing API key for --push. Run `verisource auth --key vs_live_...` or set VERISOURCE_API_KEY.'
          );
        }
        cloudSync = await pushCliRunToCloud({
          apiKey: creds.apiKey,
          apiOrigin: creds.apiOrigin,
          payload: {
            domain: readiness.domainUrl,
            mode: 'verify',
            status: passed ? 'PASS' : 'FAIL',
            visibilityScore: readiness.visibilityScore,
            llmsTxtStatus: readiness.llmsTxtStatus,
            agentsMdStatus: readiness.agentsMdStatus,
            robotsAiBotStatus: readiness.robotsAiBotStatus,
            siteHealth: {
              healthScore: health.healthScore,
              pagesScanned: health.pagesScanned,
              linksChecked: health.linksChecked,
            },
            handles: health.findings.map((f) => ({
              handle: f.handle,
              kind: f.category === 'ai_readability_gap' ? 'ai_readability' : f.category,
              severity: f.severity,
              summary: f.summary,
              url: f.targetUrl,
              httpStatus: f.httpStatus,
              fixHint: f.fixHint,
            })),
            gitMeta: collectGitEnvironmentMeta(),
          },
        });
      }
      if (jsonOut) {
        console.log(
          JSON.stringify(
            {
              status: passed ? 'PASS' : 'FAIL',
              hostname: readiness.hostname,
              visibilityScore: readiness.visibilityScore,
              failures,
              ...(cloudSync ? { cloudSync } : {}),
              ...(prComment ? { prComment } : {}),
            },
            null,
            2
          )
        );
      } else if (passed) {
        console.log(
          `PASS  ${readiness.hostname} · visibility ${readiness.visibilityScore}/100 · all policy checks passed`
        );
      } else {
        console.log(
          `FAIL  ${readiness.hostname} · ${failures.length} check(s) failed: ${failures.join('; ')}`
        );
      }
      if (!jsonOut && cloudSync?.synced) {
        console.log(
          `✓ Synced to Verisource Cloud (${cloudSync.planTier}) -> ${cloudSync.dashboardUrl}`
        );
      }
      return passed ? 0 : 1;
    }

    if (cmd === 'show') {
      const handleId = args[1];
      if (!handleId) {
        console.error('Usage: verisource show <handle>');
        return 2;
      }
      const item = findStoredHandle(handleId, cwd);
      if (!item) {
        console.error(`Handle "${handleId}" not found in .verisource/last-run.json`);
        return 1;
      }
      console.log(JSON.stringify(item, null, 2));
      return 0;
    }

    if (cmd === 'query') {
      const q = args[1] ?? '';
      const matches = queryStoredHandles(q, cwd);
      if (jsonOut) {
        console.log(JSON.stringify(matches, null, 2));
      } else {
        console.log(`Found ${matches.length} handle(s):`);
        for (const m of matches) {
          console.log(`  [${m.handle}] (${m.kind}) ${m.summary}`);
        }
      }
      return 0;
    }

    if (cmd === 'map') {
      const target =
        args[1] && !args[1].startsWith('-') ? args[1] : '.';
      const filterText = getFlagValue(args, '--find');
      const diff = hasFlag(args, '--diff');
      const isUrl = /^https?:\/\//i.test(target) || /^[a-z0-9-]+\.[a-z]{2,}$/i.test(target);

      const report = isUrl
        ? await mapLiveDomain({ url: target, filterText, diff, cwd })
        : mapStaticCodebase({ targetDir: path.resolve(cwd, target), filterText, diff, cwd });

      if (jsonOut) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(
          `MAP  ${report.mode} · ${report.totalRoutes} route(s) (${report.pageRoutesCount} pages, ${report.apiRoutesCount} APIs, ${report.jsonLdRoutesCount} JSON-LD)`
        );
        for (const r of report.routes.slice(0, 30)) {
          const schemaTag =
            r.jsonLdTypes.length > 0 ? ` [JSON-LD: ${r.jsonLdTypes.join(',')}]` : '';
          console.log(`  ${r.kind.padEnd(8)} ${r.route}${schemaTag}`);
        }
      }
      return 0;
    }

    if (cmd === 'agent') {
      const installTarget = (getFlagValue(args, '--install') ??
        'all') as AgentSkillTarget;
      const allowed = new Set(['claude', 'cursor', 'codex', 'antigravity', 'all']);
      if (!allowed.has(installTarget)) {
        console.error(
          'Invalid target. Expected claude, cursor, codex, antigravity, or all.'
        );
        return 2;
      }
      const written = installAgentSkills({ target: installTarget, cwd });
      if (jsonOut) {
        console.log(JSON.stringify({ installed: written }, null, 2));
      } else {
        for (const f of written) {
          console.log(`✓ Installed ${f}`);
        }
      }
      return 0;
    }

    if (cmd === 'workflow' && args[1] === 'check') {
      const check = validateWorkflowFiles(cwd);
      if (jsonOut) {
        console.log(JSON.stringify(check, null, 2));
      } else if (check.valid) {
        console.log(`PASS  ${check.checkedCount} workflow file(s) valid`);
      } else {
        console.error(`FAIL  ${check.errors.join('; ')}`);
      }
      return check.valid ? 0 : 1;
    }

    if (cmd === 'browse') {
      const sub = args[1];
      const arg = args[2];
      if (sub === 'open' && arg) {
        const state = await browseOpenUrl(arg, cwd);
        if (jsonOut) {
          console.log(JSON.stringify(state, null, 2));
        } else {
          console.log(
            `OPEN  ${state.currentUrl} (HTTP ${state.httpStatus}) · ${state.elements.length} element handles`
          );
          for (const el of state.elements.slice(0, 15)) {
            console.log(`  [${el.handle}] <${el.tag}> "${el.label}"`);
          }
        }
        return 0;
      }
      if (sub === 'click' && arg) {
        const state = await browseClickHandle(arg, cwd);
        console.log(
          `CLICK ${arg} -> ${state.currentUrl} (HTTP ${state.httpStatus})`
        );
        return 0;
      }
      if (sub === 'save' && arg) {
        const saved = saveBrowseSessionAsWorkflow(arg, cwd);
        console.log(`✓ Saved workflow: ${saved}`);
        return 0;
      }
      console.error('Usage: verisource browse <open|click|save> <arg>');
      return 2;
    }

    if (cmd === 'record') {
      const name = args[1];
      const url = args[2];
      if (!name || !url) {
        console.error('Usage: verisource record <name> <url>');
        return 2;
      }
      const saved = await recordBaselineWorkflow({ name, targetUrl: url, cwd });
      console.log(`✓ Recorded baseline workflow: ${saved}`);
      return 0;
    }

    if (cmd === 'run') {
      const wfName = args[1] && !args[1].startsWith('-') ? args[1] : undefined;
      const wfDir = path.resolve(cwd, '.verisource', 'workflows');
      if (!fs.existsSync(wfDir)) {
        console.error('No .verisource/workflows directory found.');
        return 2;
      }
      const files = fs
        .readdirSync(wfDir)
        .filter((f) => f.endsWith('.json'))
        .filter((f) => !wfName || f === `${wfName}.json` || f === wfName);

      if (files.length === 0) {
        console.error(`No matching workflow found${wfName ? ` for "${wfName}"` : ''}.`);
        return 2;
      }

      const results = [];
      const allHandles: StoredHandleItem[] = [];
      const startedAt = new Date().toISOString();

      for (const file of files) {
        const spec = JSON.parse(
          fs.readFileSync(path.join(wfDir, file), 'utf8')
        ) as VerisourceWorkflowSpec;
        const res = await runSavedWorkflow({
          workflowSpec: spec,
          headed: hasFlag(args, '--headed'),
          cwd,
        });
        results.push(res);
        allHandles.push(...res.handles);
      }

      const allPassed = results.every((r) => r.status === 'PASS');
      saveLastRunLedger(
        {
          runId: `run-${Date.now()}`,
          command: `run ${wfName ?? '--all'}`,
          target: wfName ?? 'all',
          startedAt,
          finishedAt: new Date().toISOString(),
          status: allPassed ? 'PASS' : 'FAIL',
          handles: allHandles,
        },
        cwd
      );

      if (jsonOut) {
        console.log(JSON.stringify({ status: allPassed ? 'PASS' : 'FAIL', results }, null, 2));
      } else {
        for (const r of results) {
          console.log(
            `${r.status}  ${r.workflow} · ${r.stepsPassed}/${r.stepsTotal} steps · ${r.durationMs}ms`
          );
          for (const h of r.handles) {
            console.log(`  [${h.handle}] ${h.summary}`);
          }
        }
      }
      return allPassed ? 0 : 1;
    }

    if (cmd === 'log') {
      const provider = (args[1] ?? 'vercel') as LogProviderId;
      const now = Date.now();
      const events = await queryCorrelatedBackendLogs({
        providers: [provider],
        windowStartMs: now - 5 * 60 * 1000,
        windowEndMs: now,
        cwd,
      });
      if (jsonOut) {
        console.log(JSON.stringify(events, null, 2));
      } else {
        console.log(`Logs (${provider}): ${events.length} error/warn event(s) in last 5m`);
        for (const ev of events) {
          console.log(`  [${ev.handle}] ${ev.timestamp} ${ev.message}`);
        }
      }
      return 0;
    }

    console.error(`Unknown command: "${cmd}". Run \`verisource --help\`.`);
    return 2;
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 2;
  }
}

function checkIsDirectExecution(): boolean {
  if (!process.argv[1]) return false;
  try {
    return (
      fs.realpathSync(process.argv[1]) ===
      fs.realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return path.resolve(process.argv[1]).endsWith(path.join('dist', 'bin.js'));
  }
}

if (checkIsDirectExecution()) {
  runCli(process.argv).then((code) => {
    process.exitCode = code;
  });
}
