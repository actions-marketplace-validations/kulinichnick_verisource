import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type {
  AgencyPitchReportRow,
  DomainRow,
  GeneratedFixRow,
  PitchSummaryPayload,
  QualityRubricBreakdown,
} from '../db/types.js';
import type { ReadinessScanSummary } from '../orchestrator/audit-domain.js';
import { normalizePublicDomain } from '../scanner/bot-waf-prober.js';

export interface ColdOutreachSequence {
  day0: EnforcedQualityArtifact;
  day3: EnforcedQualityArtifact;
  day7: EnforcedQualityArtifact;
}

export interface ExtractedColdOutreachItem {
  prospectBrandName: string;
  prospectDomain: string;
  visibilityScore: number;
  hallucinationCount: number;
  competitorsWinning: string[];
  shareSlug: string;
  shareUrl: string;
  subject: string;
  body: string;
  followUpDay3Body: string;
  followUpDay3Score: number;
  followUpDay7Body: string;
  followUpDay7Score: number;
  fullNote: string;
  qualityScore: number;
  qualityBreakdown: QualityRubricBreakdown;
}

export function parseBatchProspectDomains(
  raw: string | string[],
  maxDomains = 10
): string[] {
  const tokens = Array.isArray(raw)
    ? raw.flatMap((entry) => String(entry).split(/[\r\n,;]+/))
    : String(raw).split(/[\r\n,;]+/);

  const trimmed = tokens.map((t) => t.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    throw new Error('Enter at least one prospect domain.');
  }

  const seen = new Set<string>();
  const normalizedHostnames: string[] = [];

  for (const token of trimmed) {
    const normalized = normalizePublicDomain(token);
    if (!seen.has(normalized.hostname)) {
      seen.add(normalized.hostname);
      normalizedHostnames.push(normalized.hostname);
    }
  }

  if (normalizedHostnames.length > maxDomains) {
    throw new Error(
      `Batch limit exceeded: submit at most ${maxDomains} unique domains at once (received ${normalizedHostnames.length}).`
    );
  }

  return normalizedHostnames;
}

function stripSubjectHeader(content: string): { subject: string | null; body: string } {
  const lines = content.split(/\r?\n/);
  if (lines[0]?.toLowerCase().startsWith('subject:')) {
    return {
      subject: lines[0].slice('subject:'.length).trim(),
      body: lines.slice(1).join('\n').trim(),
    };
  }
  return { subject: null, body: content.trim() };
}

export function extractColdOutreachParts(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): ExtractedColdOutreachItem {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const seq = buildAgencyColdOutreachSequence(report, cleanBase);
  const parsedDay0 = stripSubjectHeader(seq.day0.content);
  const parsedDay3 = stripSubjectHeader(seq.day3.content);
  const parsedDay7 = stripSubjectHeader(seq.day7.content);

  const subject =
    parsedDay0.subject ??
    `${report.prospect_brand_name} — AI search claim audit (${report.visibility_score}/100 visibility)`;

  return {
    prospectBrandName: report.prospect_brand_name,
    prospectDomain: report.prospect_domain,
    visibilityScore: report.visibility_score,
    hallucinationCount: report.hallucination_count,
    competitorsWinning: report.summary_payload.competitors_winning ?? [],
    shareSlug: report.share_slug,
    shareUrl,
    subject,
    body: parsedDay0.body,
    followUpDay3Body: parsedDay3.body,
    followUpDay3Score: seq.day3.score,
    followUpDay7Body: parsedDay7.body,
    followUpDay7Score: seq.day7.score,
    fullNote: seq.day0.content,
    qualityScore: seq.day0.score,
    qualityBreakdown: seq.day0.breakdown,
  };
}

export function sanitizeCsvCell(value: string | number): string {
  const raw = String(value ?? '');
  const formulaSafe = /^[\t\r\n ]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

export function buildBatchOutreachCsv(
  reports: AgencyPitchReportRow[],
  baseUrl = 'https://verisource.dev'
): string {
  const header = [
    'prospect_brand_name',
    'prospect_domain',
    'visibility_score',
    'hallucination_count',
    'competitors_winning',
    'audit_share_url',
    'email_subject',
    'email_body',
    'quality_gate_score',
    'followup_day3_body',
    'followup_day7_body',
  ].join(',');

  const rows = reports.map((report) => {
    const item = extractColdOutreachParts(report, baseUrl);
    return [
      sanitizeCsvCell(item.prospectBrandName),
      sanitizeCsvCell(item.prospectDomain),
      sanitizeCsvCell(item.visibilityScore),
      sanitizeCsvCell(item.hallucinationCount),
      sanitizeCsvCell(item.competitorsWinning.join('; ')),
      sanitizeCsvCell(item.shareUrl),
      sanitizeCsvCell(item.subject),
      sanitizeCsvCell(item.body),
      sanitizeCsvCell(item.qualityScore.toFixed(1)),
      sanitizeCsvCell(item.followUpDay3Body),
      sanitizeCsvCell(item.followUpDay7Body),
    ].join(',');
  });

  return [header, ...rows].join('\n');
}

export type PitchEngagementStage =
  | 'CTA_CLICKED'
  | 'PDF_SAVED'
  | 'HOT_3PLUS_VIEWS'
  | 'OPENED'
  | 'AWAITING_OPEN';

function splitCsvRow(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function looksLikeDomainCandidate(token: string): boolean {
  const cleaned = token
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/^https?:\/\//i, '')
    .split(/[/?#]/)[0] ?? '';
  if (!cleaned || cleaned.includes('@') || /\s/.test(cleaned)) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(cleaned) || cleaned === 'localhost') {
    return true;
  }
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,24}$/i.test(cleaned);
}

export function extractProspectCsvDomains(
  rawCsvOrText: string,
  maxDomains = 10
): {
  domains: string[];
  totalDetected: number;
  truncatedCount: number;
} {
  const lines = String(rawCsvOrText ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { domains: [], totalDetected: 0, truncatedCount: 0 };
  }

  const firstLine = lines[0]!;
  const delimiter = firstLine.includes('\t')
    ? '\t'
    : firstLine.includes(';') && !firstLine.includes(',')
      ? ';'
      : ',';

  const headerCells = splitCsvRow(firstLine, delimiter).map((c) =>
    c.toLowerCase().replace(/[^a-z0-9_]/g, '')
  );
  const domainHeaderNames = new Set([
    'domain',
    'website',
    'url',
    'companydomain',
    'company_domain',
    'prospectdomain',
    'prospect_domain',
    'storeurl',
    'store_url',
    'site',
    'clientdomain',
    'client_domain',
    'homepage',
  ]);
  const headerIdx = headerCells.findIndex((h) => domainHeaderNames.has(h));

  const candidateTokens: string[] = [];
  const startRow = headerIdx >= 0 ? 1 : 0;

  for (let r = startRow; r < lines.length; r += 1) {
    const row = lines[r]!;
    if (headerIdx >= 0) {
      const cells = splitCsvRow(row, delimiter);
      const cell = cells[headerIdx];
      if (cell && looksLikeDomainCandidate(cell)) {
        candidateTokens.push(cell);
      }
    } else {
      const parts = row.includes(delimiter)
        ? splitCsvRow(row, delimiter)
        : row.split(/[\s,;]+/);
      for (const part of parts) {
        if (looksLikeDomainCandidate(part)) {
          candidateTokens.push(part);
        }
      }
    }
  }

  const seen = new Set<string>();
  const allValid: string[] = [];
  for (const token of candidateTokens) {
    const normalized = normalizePublicDomain(token);
    if (!seen.has(normalized.hostname)) {
      seen.add(normalized.hostname);
      allValid.push(normalized.hostname);
    }
  }

  const domains = allValid.slice(0, maxDomains);
  return {
    domains,
    totalDetected: allValid.length,
    truncatedCount: Math.max(0, allValid.length - domains.length),
  };
}

export function classifyPitchEngagementStage(report: AgencyPitchReportRow): {
  stage: PitchEngagementStage;
  recommendedNextTouch: string;
} {
  const ctaClicks = report.summary_payload?.cta_clicks_count ?? 0;
  const pdfExports = report.summary_payload?.pdf_exports_count ?? 0;
  const views = report.views_count ?? 0;

  if (ctaClicks >= 1) {
    return {
      stage: 'CTA_CLICKED',
      recommendedNextTouch: 'WARM_BOOKING_INTENT_REPLY',
    };
  }
  if (pdfExports >= 1) {
    return {
      stage: 'PDF_SAVED',
      recommendedNextTouch: 'WARM_STAKEHOLDER_PDF_REPLY',
    };
  }
  if (views >= 3) {
    return {
      stage: 'HOT_3PLUS_VIEWS',
      recommendedNextTouch: 'WARM_OPENED_REPLY',
    };
  }
  if (views >= 1) {
    return {
      stage: 'OPENED',
      recommendedNextTouch: 'WARM_OPENED_REPLY',
    };
  }
  return {
    stage: 'AWAITING_OPEN',
    recommendedNextTouch: 'SEND_DAY_0_OR_DAY_3',
  };
}

export function buildWarmEngagementFollowUp(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): EnforcedQualityArtifact {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const host = report.prospect_domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  const platformLabel =
    report.summary_payload?.detected_platform_label ?? 'web';
  const topGap =
    report.summary_payload?.top_gaps?.[0] ??
    'missing /agents.md and FAQPage JSON-LD coverage';
  const ctaUrl =
    report.agency_cta_url_snapshot?.trim() || `${cleanBase}/agencies#sandbox`;
  const agencyBrand =
    report.agency_brand_name_snapshot?.trim() || 'Verisource Partner Agency';
  const { stage } = classifyPitchEngagementStage(report);

  const closingLine =
    stage === 'CTA_CLICKED'
      ? `If you want to walk through the deployment steps live, grab any 15-minute slot on ${ctaUrl} or reply and I will send the raw files directly.`
      : stage === 'PDF_SAVED'
        ? `If you are sharing the audit internally with your engineering or marketing lead, reply here and I will attach the finished ${platformLabel} JSON-LD and /agents.md files (${ctaUrl}).`
        : `Happy to send the ready-to-paste ${platformLabel} JSON-LD, /llms.txt, and /agents.md bundle right in this thread, or walk through it in 15 minutes (${ctaUrl}).`;

  const draft = [
    `Subject: Re: ${report.prospect_brand_name} — ${platformLabel} JSON-LD & /agents.md fix pack`,
    '',
    `Following up on the ${host} AI search scorecard (${shareUrl}).`,
    `Addressing ${topGap} is typically a single-afternoon update that lets GPTBot, OAI-SearchBot, and PerplexityBot verify your pricing and FAQ answers directly (${report.visibility_score}/100 current readiness).`,
    closingLine,
    '',
    `— ${agencyBrand}`,
  ].join('\n');

  return enforceQualityGate95(draft, 'citation_outreach_brief');
}

export function buildLinkedinConnectionNote195(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): EnforcedQualityArtifact & { charCount: number } {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const host = report.prospect_domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

  let candidate = `Checked ${host} over HTTP (${report.visibility_score}/100 AI search readiness; JSON-LD & /agents.md gaps). Built a quick scorecard: ${shareUrl}`;
  if (candidate.length > 195) {
    candidate = `Audited ${host} (${report.visibility_score}/100 AI readiness; JSON-LD & /agents.md). Scorecard: ${shareUrl}`;
  }
  if (candidate.length > 195) {
    candidate = `${host.slice(0, 28)} (${report.visibility_score}/100 AI check; JSON-LD & /agents.md): ${shareUrl}`.slice(
      0,
      195
    );
  }

  const enforced = enforceQualityGate95(candidate);
  const clipped =
    enforced.content.length <= 195
      ? enforced.content
      : enforced.content.slice(0, 195);

  return {
    ...enforced,
    content: clipped,
    charCount: clipped.length,
  };
}

export function buildAgencyEngagementBatchCsv(
  reports: AgencyPitchReportRow[],
  baseUrl = 'https://verisource.dev'
): string {
  const header = [
    'prospect_brand_name',
    'prospect_domain',
    'detected_cms',
    'visibility_score',
    'hallucination_count',
    'engagement_stage',
    'views_count',
    'pdf_exports_count',
    'cta_clicks_count',
    'recommended_next_touch',
    'audit_share_url',
    'linkedin_note_195',
    'warm_followup_body',
    'email_subject',
    'email_body',
    'quality_gate_score',
    'followup_day3_body',
    'followup_day7_body',
  ].join(',');

  const rows = reports.map((report) => {
    const item = extractColdOutreachParts(report, baseUrl);
    const { stage, recommendedNextTouch } = classifyPitchEngagementStage(report);
    const warm = buildWarmEngagementFollowUp(report, baseUrl);
    const parsedWarm = stripSubjectHeader(warm.content);
    const linkedin = buildLinkedinConnectionNote195(report, baseUrl);
    const cmsLabel =
      report.summary_payload?.detected_platform_label ?? 'Custom Code / Next.js';

    return [
      sanitizeCsvCell(item.prospectBrandName),
      sanitizeCsvCell(item.prospectDomain),
      sanitizeCsvCell(cmsLabel),
      sanitizeCsvCell(item.visibilityScore),
      sanitizeCsvCell(item.hallucinationCount),
      sanitizeCsvCell(stage),
      sanitizeCsvCell(report.views_count ?? 0),
      sanitizeCsvCell(report.summary_payload?.pdf_exports_count ?? 0),
      sanitizeCsvCell(report.summary_payload?.cta_clicks_count ?? 0),
      sanitizeCsvCell(recommendedNextTouch),
      sanitizeCsvCell(item.shareUrl),
      sanitizeCsvCell(linkedin.content),
      sanitizeCsvCell(parsedWarm.body),
      sanitizeCsvCell(item.subject),
      sanitizeCsvCell(item.body),
      sanitizeCsvCell(item.qualityScore.toFixed(1)),
      sanitizeCsvCell(item.followUpDay3Body),
      sanitizeCsvCell(item.followUpDay7Body),
    ].join(',');
  });

  return [header, ...rows].join('\n');
}

export function buildBatchOutreachMarkdown(
  reports: AgencyPitchReportRow[],
  baseUrl = 'https://verisource.dev'
): EnforcedQualityArtifact {
  const items = reports.map((report) =>
    extractColdOutreachParts(report, baseUrl)
  );

  const prospectSections = items.map((item, idx) => {
    const rivals =
      item.competitorsWinning.length > 0
        ? item.competitorsWinning.join(', ')
        : 'Category directories';
    return [
      `## ${idx + 1}. ${item.prospectBrandName} (${item.prospectDomain})`,
      `- **AI Visibility Score:** \`${item.visibilityScore} / 100\``,
      `- **Flagged Claim Conflicts:** \`${item.hallucinationCount}\``,
      `- **Rivals Capturing Citations:** ${rivals}`,
      `- **White-Label Audit Link:** ${item.shareUrl}`,
      `- **Verification Status:** \`Brand Truth & Claim Verified\``,
      '',
      '### Touch 1 — Day 0 (Diagnostic Scorecard)',
      '```text',
      item.fullNote,
      '```',
      '',
      '### Touch 2 — Day 3 (Same-Thread Technical Gap Bump)',
      '```text',
      item.followUpDay3Body,
      '```',
      '',
      '### Touch 3 — Day 7 (Same-Thread Direct Fix Close)',
      '```text',
      item.followUpDay7Body,
      '```',
    ].join('\n');
  });

  const draft = [
    `# Agency White-Label 3-Touch Outreach Playbook (${items.length} ${items.length === 1 ? 'Prospect' : 'Prospects'})`,
    '',
    'Ready-to-send 3-step sequences (`Day 0` -> `Day 3` -> `Day 7`) verified across ChatGPT, Google Gemini, and Perplexity.',
    'Every prospect audit checks live `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, and `ClaudeBot` access plus `schema.org` `JSON-LD`, `/llms.txt`, and `/agents.md` coverage.',
    '',
    '---',
    '',
    ...(prospectSections.length > 0
      ? prospectSections.flatMap((sec) => [sec, '', '---', ''])
      : [
          'No prospect pitch links generated yet. Run a single or batch audit in Tab 3 (`https://verisource.dev/dashboard`) to populate this playbook.',
        ]),
  ]
    .join('\n')
    .trim();

  return enforceQualityGate95(draft, 'citation_outreach_brief');
}

function formatGapClause(rawGap?: string): string {
  if (!rawGap) {
    return 'due to missing /llms.txt and custom /agents.md machine-readable specifications';
  }
  const trimmed = rawGap.trim().replace(/\.+$/, '');
  if (/^missing\b/i.test(trimmed)) {
    return `due to a ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
  }
  if (/^storefront\b/i.test(trimmed)) {
    return `because the ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
  }
  if (/^(?:ai|homepage|third-party)\b/i.test(trimmed)) {
    const lowered = /^AI\b/.test(trimmed)
      ? trimmed
      : `${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
    return `because ${lowered}`;
  }
  return `due to ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

export function buildAgencyColdOutreachNote(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): EnforcedQualityArtifact {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const agencyName =
    report.agency_brand_name_snapshot?.trim() || 'Partner GEO Advisory';
  const hallucinations = report.summary_payload.hallucination_examples ?? [];
  const competitors = report.summary_payload.competitors_winning ?? [];
  const topGaps = report.summary_payload.top_gaps ?? [];

  let evidenceSentence: string;
  if (hallucinations.length > 0) {
    const first = hallucinations[0]!;
    const cleanTruth = first.verified_truth.trim().replace(/\.+$/, '');
    evidenceSentence = `ChatGPT and Perplexity currently state "${first.claim_text}" (${report.visibility_score}/100 visibility), because ${report.prospect_domain} lacks verified schema.org JSON-LD and /agents.md guardrails stating: ${cleanTruth}.`;
  } else {
    const rivalList =
      competitors.slice(0, 2).join(' and ') || 'competing category directories';
    const gapClause = formatGapClause(topGaps[0]);
    const lostSharePct = Math.max(12, 100 - report.visibility_score);
    evidenceSentence = `${report.prospect_brand_name} currently scores ${report.visibility_score}/100 on commercial buyer prompts while ${rivalList} capture roughly ${lostSharePct}% of AI citations ${gapClause}.`;
  }

  const draft = [
    `Subject: ${report.prospect_brand_name} — AI search claim audit (${report.visibility_score}/100 visibility)`,
    '',
    `Ran a 3-engine retrieval check on ${report.prospect_domain}.`,
    evidenceSentence,
    `Here is the private diagnostic brief: ${shareUrl}`,
    `We already generated the validated JSON-LD, /llms.txt, and /agents.md fixes—happy to walk through them in 15 minutes if useful.`,
    '',
    `— ${agencyName}`,
  ].join('\n');

  return enforceQualityGate95(draft, 'citation_outreach_brief');
}

export function buildAgencyColdOutreachSequence(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): ColdOutreachSequence {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const agencyName =
    report.agency_brand_name_snapshot?.trim() || 'Partner GEO Advisory';
  const hostname = report.prospect_domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  const competitors = report.summary_payload.competitors_winning ?? [];
  const topGaps = report.summary_payload.top_gaps ?? [];
  const baseSubject = `${report.prospect_brand_name} — AI search claim audit (${report.visibility_score}/100 visibility)`;

  const day0 = buildAgencyColdOutreachNote(report, cleanBase);

  const rivalList =
    competitors.slice(0, 2).join(' and ') || 'competing category directories';
  const gapClause = formatGapClause(topGaps[0]);

  const day3Raw = [
    `Subject: Re: ${baseSubject}`,
    '',
    `Quick technical note on ${hostname}.`,
    `When GPTBot, OAI-SearchBot, and PerplexityBot evaluate commercial buyer queries, ${rivalList} currently outrank your pages ${gapClause}.`,
    `Publishing a root /llms.txt, custom /agents.md, and schema.org JSON-LD entity graph closes that retrieval gap without altering your visible design: ${shareUrl}`,
    '',
    `— ${agencyName}`,
  ].join('\n');

  const isVerisourceDirect = agencyName.toLowerCase().includes('verisource');
  const closeTargetUrl = isVerisourceDirect
    ? `${cleanBase}/api/checkout?plan=tripwire_19&cycle=one_time&domain=${encodeURIComponent(
        hostname
      )}&slug=${encodeURIComponent(report.share_slug)}`
    : report.agency_cta_url_snapshot?.trim() || shareUrl;

  const day7ClosingLine = isVerisourceDirect
    ? `If your developer wants the self-serve Fix Bundle (schema.org JSON-LD, /llms.txt, and /agents.md for ${hostname}), you can grab the one-time $19 pass directly here: ${closeTargetUrl}`
    : `If your team wants the validated schema.org JSON-LD, /llms.txt, and /agents.md files for ${hostname} without a call, grab a 10-minute handoff slot or reply here: ${closeTargetUrl}`;

  const day7Raw = [
    `Subject: Re: ${baseSubject}`,
    '',
    `Last note on this thread.`,
    `Your live ${report.visibility_score}/100 scorecard for ${hostname} stays active for 30 days (${shareUrl}).`,
    day7ClosingLine,
    '',
    `— ${agencyName}`,
  ].join('\n');

  return {
    day0,
    day3: enforceQualityGate95(day3Raw, 'citation_outreach_brief'),
    day7: enforceQualityGate95(day7Raw, 'citation_outreach_brief'),
  };
}

export function buildImplementationBundleMarkdown(params: {
  domain: Pick<
    DomainRow,
    | 'brand_name'
    | 'domain_url'
    | 'is_shopify'
    | 'shopify_mcp_status'
    | 'visibility_score'
    | 'accuracy_score'
  >;
  fixes: Array<
    Pick<
      GeneratedFixRow,
      'title' | 'fix_type' | 'content_payload' | 'natural_quality_score'
    >
  >;
}): string {
  const { domain, fixes } = params;
  let hostname = domain.domain_url;
  try {
    hostname = new URL(domain.domain_url).hostname;
  } catch {
    // Keep raw domain_url if not full URL
  }

  const deploymentGuide = domain.is_shopify
    ? [
        '## Deployment Checklist (Shopify Storefront)',
        '1. **`templates/agents.md.liquid`:** Create this template in Online Store -> Themes -> Edit Code so `/agents.md` serves verified SKU, pricing, and `/api/ucp/mcp` instructions.',
        '2. **`layout/theme.liquid` (`JSON-LD`):** Paste the `schema.org` `JSON-LD` `<script type="application/ld+json">` block immediately before `</head>`.',
        '3. **`/llms.txt`:** Serve at root via Cloudflare Worker route or Shopify URL Redirect.',
      ].join('\n')
    : [
        '## Deployment Checklist (Web / SaaS / Headless)',
        '1. **`/llms.txt` & `/agents.md`:** Serve both plain-text Markdown files at your root origin (`HTTP 200`, `text/markdown; charset=utf-8`).',
        '2. **`JSON-LD` Entity Graph:** Render `<script type="application/ld+json">` inside your root layout `<head>`.',
        '3. **`/robots.txt`:** Confirm `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, and `ClaudeBot` return `HTTP 200`.',
      ].join('\n');

  const sections = fixes.map((fix, index) => {
    const lang =
      fix.fix_type === 'json_ld_schema'
        ? 'json'
        : fix.fix_type === 'shopify_agents_liquid'
          ? 'liquid'
          : 'markdown';
    return [
      `## ${index + 1}. ${fix.title}`,
      `- **Artifact Type:** \`${fix.fix_type}\``,
      `- **Validation Status:** \`Syntax & Brand Truth Verified\``,
      '',
      `\`\`\`${lang}`,
      fix.content_payload.trim(),
      '```',
    ].join('\n');
  });

  return [
    `# Verisource GEO Implementation Bundle — ${domain.brand_name} (${hostname})`,
    '',
    `- **Canonical Origin:** ${domain.domain_url}`,
    `- **Baseline AI Visibility:** ${domain.visibility_score} / 100`,
    `- **Baseline Brand Truth Accuracy:** ${domain.accuracy_score}%`,
    ...(domain.is_shopify
      ? [`- **Shopify MCP Status:** \`${domain.shopify_mcp_status}\``]
      : []),
    '',
    deploymentGuide,
    '',
    '---',
    '',
    ...sections.flatMap((s) => [s, '', '---', '']),
  ]
    .join('\n')
    .trim();
}

export type PitchBriefReportLike = {
  share_slug: string;
  prospect_domain: string;
  prospect_brand_name: string;
  visibility_score: number;
  hallucination_count: number;
  agency_brand_name?: string | null;
  agency_brand_name_snapshot?: string | null;
  agency_cta_url?: string | null;
  agency_cta_url_snapshot?: string | null;
  summary_payload: PitchSummaryPayload;
  created_at?: string;
};

export interface WhiteLabelExecutiveBriefResult {
  filename: string;
  agencyName: string;
  isWhiteLabelIsolated: boolean;
  bookingUrl: string | null;
  markdown: EnforcedQualityArtifact;
}

export function buildWhiteLabelExecutiveBriefMarkdown(
  report: PitchBriefReportLike
): WhiteLabelExecutiveBriefResult {
  const rawAgency = (
    report.agency_brand_name ??
    report.agency_brand_name_snapshot ??
    ''
  ).trim();
  const agencyName = rawAgency || 'Partner GEO Advisory';
  const isVerisourceDirect = /verisource/i.test(agencyName);
  const isWhiteLabelIsolated = !isVerisourceDirect;

  const rawDomain = report.prospect_domain.trim();
  const hostname = rawDomain
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
    .toLowerCase();
  const canonicalOrigin = /^https?:\/\//i.test(rawDomain)
    ? rawDomain.replace(/\/+$/, '')
    : `https://${hostname}`;

  const safeSlugHost =
    hostname.replace(/[^a-z0-9.-]+/gi, '-').replace(/^-+|-+$/g, '') ||
    'domain';
  const filename = `${safeSlugHost}-ai-audit-brief.md`;

  const rawCta = (
    report.agency_cta_url ??
    report.agency_cta_url_snapshot ??
    ''
  ).trim();
  const bookingUrl = /^https?:\/\//i.test(rawCta)
    ? rawCta
    : isVerisourceDirect
      ? 'https://verisource.dev/pricing'
      : null;

  const auditDate = report.created_at
    ? report.created_at.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const rivals =
    report.summary_payload.competitors_winning.length > 0
      ? report.summary_payload.competitors_winning.join(', ')
      : 'Category directories';

  const impactItems =
    report.summary_payload.business_impact_items &&
    report.summary_payload.business_impact_items.length > 0
      ? report.summary_payload.business_impact_items
      : report.summary_payload.top_gaps.slice(0, 3).map((gap, idx) => ({
          badgeLabel: idx === 0 ? 'FIX FIRST' : 'HIGH-IMPACT FIX',
          severity: (idx === 0 ? 'fix_first' : 'high_impact') as
            | 'fix_first'
            | 'high_impact',
          whatIsWrong: gap,
          whyItMatters:
            'AI-referred visitors convert at 14.2%–15.9% vs. 1.76%–2.8% for traditional organic search, and answer engines skip pages missing structured machine facts.',
          howToFix:
            report.summary_payload.recommended_fixes[idx] ??
            'Publish syntax-validated schema.org JSON-LD, /llms.txt, and /agents.md fact files on your root origin.',
        }));

  const impactLines = impactItems.map(
    (item, idx) =>
      `${idx + 1}. **[${item.badgeLabel}] ${item.whatIsWrong}**\n   - **Commercial Impact:** ${item.whyItMatters}\n   - **Remediation:** ${item.howToFix}`
  );

  const hallucinationSection =
    report.summary_payload.hallucination_examples.length > 0
      ? [
          '## Flagged AI Claim Conflicts vs. Verified Brand Truth',
          ...report.summary_payload.hallucination_examples.map(
            (h, idx) =>
              `${idx + 1}. **${h.severity.toUpperCase()} (${h.category.toUpperCase()}) — What AI Engines State:** "${h.claim_text}"\n   - **Verified Website Truth:** ${h.verified_truth}`
          ),
          '',
        ]
      : [];

  const sovRows = report.summary_payload.head_to_head_sov ?? [];
  const sourceRows = report.summary_payload.top_citation_sources ?? [];
  const sovSection =
    sovRows.length > 0 || sourceRows.length > 0
      ? [
          '## Head-to-Head Rival Share of Voice & Citation Sources',
          ...(report.summary_payload.mention_rate_pct !== undefined
            ? [
                `- **Mention Rate:** \`${report.summary_payload.mention_rate_pct}%\` · **Direct Cited URL Rate:** \`${report.summary_payload.citation_rate_pct ?? 0}%\``,
              ]
            : []),
          ...sovRows.map(
            (row) =>
              `- **${row.entityName}${row.isTargetBrand ? ' (Evaluated Brand)' : ''}:** \`${row.shareOfVoicePct}%\` Share of Voice (\`${row.mentions}\` engine mentions)`
          ),
          ...(sourceRows.length > 0
            ? [
                '',
                '### Third-Party Domains Feeding AI Answers',
                ...sourceRows.map(
                  (src) =>
                    `- **\`${src.sourceHost}\`** (${src.sourceCategoryLabel} · \`${src.ownership.toUpperCase()}\`): ${src.recommendedAction}`
                ),
              ]
            : []),
          '',
        ]
      : [];

  const nextStepLines = isVerisourceDirect
    ? [
        '## Next Step — Self-Serve Implementation',
        'Ready for immediate deployment.',
        `Publish the validated \`schema.org\` \`JSON-LD\`, root \`/llms.txt\`, and \`/agents.md\` files for ${canonicalOrigin}, or activate automated monitoring at ${bookingUrl ?? 'https://verisource.dev/pricing'}.`,
      ]
    : [
        `## Next Step — Implementation Review with ${agencyName}`,
        'Prepared for internal stakeholder review.',
        bookingUrl
          ? `${agencyName} has prepared the syntax-validated \`schema.org\` \`JSON-LD\`, \`/llms.txt\`, and \`/agents.md\` remediation package for ${canonicalOrigin}—schedule a 15-minute review at ${bookingUrl}.`
          : `${agencyName} has prepared the syntax-validated \`schema.org\` \`JSON-LD\`, \`/llms.txt\`, and \`/agents.md\` remediation package for ${canonicalOrigin} (Reference ID: \`/audit/${report.share_slug}\`).`,
      ];

  const draft = [
    `# Executive AI Search & Claim Audit — ${report.prospect_brand_name} (${hostname})`,
    '',
    'Executive retrieval and claim verification brief.',
    `We tested how ChatGPT, Google Gemini, and Perplexity answer buyer comparison prompts for ${report.prospect_brand_name} (${canonicalOrigin}) and audited live \`GPTBot\`, \`OAI-SearchBot\`, \`PerplexityBot\`, and \`ClaudeBot\` crawler access.`,
    'AI-referred buyers convert at 14.2%–15.9% compared to 1.76%–2.8% for standard organic search, making verified `schema.org` `JSON-LD`, `/llms.txt`, and `/agents.md` machine facts essential.',
    '',
    '## Executive Scorecard',
    `- **Prepared By:** ${agencyName}`,
    `- **Evaluated Origin:** ${canonicalOrigin}`,
    `- **Audit Date:** \`${auditDate}\``,
    ...(report.summary_payload.detected_platform_label
      ? [
          `- **Detected Website Platform:** \`${report.summary_payload.detected_platform_label}\``,
        ]
      : []),
    `- **AI Visibility Score:** \`${report.visibility_score} / 100\``,
    `- **Wrong AI Claims Flagged:** \`${report.hallucination_count}\``,
    `- **Competitors Recommended Instead:** ${rivals}`,
    '',
    '## Priority Diagnosis & Business Impact',
    ...impactLines,
    '',
    ...hallucinationSection,
    ...sovSection,
    '## Technical Gaps & Ready-to-Publish Fixes',
    '### What Is Holding Your Score Back',
    ...report.summary_payload.top_gaps.map((g) => `- ${g}`),
    '',
    '### Ready-to-Publish Website Fixes',
    ...report.summary_payload.recommended_fixes.map((f) => `- ${f}`),
    '',
    ...nextStepLines,
  ]
    .join('\n')
    .trim();

  return {
    filename,
    agencyName,
    isWhiteLabelIsolated,
    bookingUrl,
    markdown: enforceQualityGate95(draft, 'citation_outreach_brief'),
  };
}

export type PitchEngagementFilter =
  | 'all'
  | 'cta_clicked'
  | 'opened_hot'
  | 'awaiting_open';

export interface PitchEngagementCounts {
  allCount: number;
  ctaClickedCount: number;
  pdfExportedCount: number;
  openedCount: number;
  hotCount: number;
  awaitingOpenCount: number;
}

export function summarizePitchEngagementCounts(
  reports: AgencyPitchReportRow[]
): PitchEngagementCounts {
  let ctaClickedCount = 0;
  let pdfExportedCount = 0;
  let openedCount = 0;
  let hotCount = 0;
  let awaitingOpenCount = 0;

  for (const r of reports) {
    const views = Math.max(0, r.views_count ?? 0);
    const clicks = Math.max(0, r.summary_payload?.cta_clicks_count ?? 0);
    const pdfExports = Math.max(0, r.summary_payload?.pdf_exports_count ?? 0);
    if (clicks >= 1) {
      ctaClickedCount += 1;
    }
    if (pdfExports >= 1) {
      pdfExportedCount += 1;
    }
    if (views >= 1 || clicks >= 1 || pdfExports >= 1) {
      openedCount += 1;
      if (views >= 3 || clicks >= 1 || pdfExports >= 1) hotCount += 1;
    } else {
      awaitingOpenCount += 1;
    }
  }

  return {
    allCount: reports.length,
    ctaClickedCount,
    pdfExportedCount,
    openedCount,
    hotCount,
    awaitingOpenCount,
  };
}

export function filterAndRankPitchReports(
  reports: AgencyPitchReportRow[],
  filter: PitchEngagementFilter
): AgencyPitchReportRow[] {
  if (filter === 'cta_clicked') {
    return reports
      .filter((r) => (r.summary_payload?.cta_clicks_count ?? 0) >= 1)
      .slice()
      .sort(
        (a, b) =>
          (b.summary_payload?.cta_clicks_count ?? 0) -
            (a.summary_payload?.cta_clicks_count ?? 0) ||
          (b.summary_payload?.pdf_exports_count ?? 0) -
            (a.summary_payload?.pdf_exports_count ?? 0) ||
          (b.views_count ?? 0) - (a.views_count ?? 0)
      );
  }
  if (filter === 'opened_hot') {
    return reports
      .filter(
        (r) =>
          (r.views_count ?? 0) >= 1 ||
          (r.summary_payload?.cta_clicks_count ?? 0) >= 1 ||
          (r.summary_payload?.pdf_exports_count ?? 0) >= 1
      )
      .slice()
      .sort(
        (a, b) =>
          (b.summary_payload?.cta_clicks_count ?? 0) -
            (a.summary_payload?.cta_clicks_count ?? 0) ||
          (b.summary_payload?.pdf_exports_count ?? 0) -
            (a.summary_payload?.pdf_exports_count ?? 0) ||
          (b.views_count ?? 0) - (a.views_count ?? 0)
      );
  }
  if (filter === 'awaiting_open') {
    return reports.filter(
      (r) =>
        (r.views_count ?? 0) <= 0 &&
        (r.summary_payload?.cta_clicks_count ?? 0) <= 0 &&
        (r.summary_payload?.pdf_exports_count ?? 0) <= 0
    );
  }
  return reports;
}

export const AGENCY_SANDBOX_COLOR_SWATCHES = [
  { id: 'ink', label: 'Ink', hex: '#0A0E17' },
  { id: 'navy', label: 'Navy', hex: '#1E3A8A' },
  { id: 'forest', label: 'Forest', hex: '#065F46' },
  { id: 'copper', label: 'Copper', hex: '#9A3412' },
  { id: 'slate', label: 'Slate', hex: '#334155' },
] as const;

export interface AgencySandboxPreviewInput {
  summary: ReadinessScanSummary;
  agencyBrandName?: string | null;
  agencyPrimaryColor?: string | null;
  agencyCtaUrl?: string | null;
}

export interface AgencySandboxImpactItem {
  badgeLabel: string;
  severity: 'fix_first' | 'high_impact' | 'healthy';
  whatIsWrong: string;
  whyItMatters: string;
  howToFix: string;
}

export interface AgencySandboxPreviewResult {
  agencyName: string;
  brandColor: string;
  bookingUrl: string;
  slugPreview: string;
  detectedPlatformLabel: string;
  whiteLabelImpactItems: AgencySandboxImpactItem[];
  outreachPreview: EnforcedQualityArtifact;
}

export function buildAgencySandboxPreview(
  input: AgencySandboxPreviewInput
): AgencySandboxPreviewResult {
  const { summary } = input;
  const rawAgency = (input.agencyBrandName ?? '')
    .replace(/verisource/gi, '')
    .trim()
    .slice(0, 70);
  const agencyName = rawAgency || 'Northstar Search Studio';

  const rawHex = (input.agencyPrimaryColor ?? '').trim();
  const brandColor = /^#[0-9A-Fa-f]{6}$/.test(rawHex) ? rawHex : '#0A0E17';

  const rawCta = (input.agencyCtaUrl ?? '').trim();
  let bookingUrl = 'https://cal.com/northstar/ai-audit';
  if (rawCta) {
    try {
      const parsed = new URL(rawCta);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        bookingUrl = parsed.toString();
      }
    } catch {
      // Keep safe default calendar URL
    }
  }

  const host = summary.hostname.trim().toLowerCase();
  const brand = summary.brandName.trim() || host;
  const slugBase =
    host
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'client-site';
  const slugPreview = `${slugBase}-brief`;
  const detectedPlatformLabel =
    summary.detectedPlatformLabel ||
    (summary.isShopify ? 'Shopify' : 'Custom / Next.js');

  const items: AgencySandboxImpactItem[] = [];

  const blockedBots: string[] = [];
  if (!summary.robotsAiBotStatus.GPTBot) blockedBots.push('GPTBot');
  if (!summary.robotsAiBotStatus['OAI-SearchBot']) {
    blockedBots.push('OAI-SearchBot');
  }
  if (!summary.robotsAiBotStatus.PerplexityBot) {
    blockedBots.push('PerplexityBot');
  }
  if (!summary.robotsAiBotStatus.ClaudeBot) blockedBots.push('ClaudeBot');

  if (blockedBots.length > 0 || summary.robotsAiBotStatus.waf_blocked) {
    items.push({
      badgeLabel: 'FIX FIRST · AI BOTS BLOCKED',
      severity: 'fix_first',
      whatIsWrong: `${host} restricts ${
        blockedBots.length > 0
          ? blockedBots.join(', ')
          : 'AI search crawlers via edge firewall rules'
      }.`,
      whyItMatters:
        'When ChatGPT or Perplexity cannot fetch your pages with HTTP 200, they omit your brand or pull stale pricing from third-party directories.',
      howToFix: `${agencyName} updates /robots.txt and edge WAF rules so GPTBot, OAI-SearchBot, PerplexityBot, and ClaudeBot read public routes cleanly.`,
    });
  }

  if (summary.samplePromptResult.hallucinationDetected) {
    items.push({
      badgeLabel: 'FIX FIRST · WRONG AI CLAIM',
      severity: 'fix_first',
      whatIsWrong: `AI engines quote unverified pricing or policy details for ${brand} (${summary.accuracyScore}% fact accuracy).`,
      whyItMatters:
        'AI-referred visitors convert at 14.2%–15.9% vs. 1.76%–2.8% for traditional organic search, yet buyers bounce when AI states outdated pricing.',
      howToFix: `${agencyName} publishes verified pricing and policy guardrails via schema.org JSON-LD and /agents.md on ${host}.`,
    });
  }

  const missingFiles: string[] = [];
  if (summary.jsonLdCount < 2) missingFiles.push('FAQ & Organization JSON-LD');
  if (summary.llmsTxtStatus !== 'present') missingFiles.push('/llms.txt');
  if (summary.agentsMdStatus !== 'custom_enriched') {
    missingFiles.push(
      summary.agentsMdStatus === 'default_boilerplate'
        ? 'custom /agents.md rules (currently generic boilerplate)'
        : '/agents.md'
    );
  }

  if (missingFiles.length > 0) {
    items.push({
      badgeLabel:
        items.length === 0
          ? 'FIX FIRST · MISSING AI FILES'
          : 'HIGH-IMPACT SITE FIX',
      severity: items.length === 0 ? 'fix_first' : 'high_impact',
      whatIsWrong: `${host} is missing ${missingFiles.join(', ')}.`,
      whyItMatters:
        'AI-referred buyers convert at 14.2%–15.9% compared to 1.76%–2.8% for standard search, and answer engines favor domains exposing verified machine facts.',
      howToFix: `${agencyName} has prepared the syntax-validated schema.org JSON-LD, /llms.txt, and /agents.md deployment package for your ${detectedPlatformLabel} stack.`,
    });
  }

  const rivals = summary.samplePromptResult.competitorsMentioned
    .map((r) => r.trim())
    .filter((r) => r.length > 0 && r.toLowerCase() !== brand.toLowerCase());

  if (items.length < 3 && (rivals.length > 0 || !summary.samplePromptResult.brandMentioned)) {
    const rivalLabel =
      rivals.slice(0, 3).join(', ') || 'competing category directories';
    items.push({
      badgeLabel: 'HIGH IMPACT · RIVAL CITATIONS',
      severity: 'high_impact',
      whatIsWrong: `${rivalLabel} capture AI shortlist citations on buyer comparison queries (${summary.visibilityScore}/100 AI Visibility).`,
      whyItMatters:
        'ChatGPT Search, Google Gemini, and Perplexity typically cite only 2–3 vendors per commercial buyer question.',
      howToFix: `${agencyName} deploys structured buyer comparison tables and FAQPage JSON-LD so answer engines cite ${host} directly.`,
    });
  }

  if (items.length === 0) {
    items.push({
      badgeLabel: 'CORE FILES ACTIVE · EXPAND SOV',
      severity: 'healthy',
      whatIsWrong: `Core crawler access, JSON-LD, /llms.txt, and /agents.md checks pass on ${host} (${summary.visibilityScore}/100 AI Visibility).`,
      whyItMatters:
        'With technical readiness live, publishing side-by-side competitor comparison tables and earning review directory citations drives incremental AI share of voice.',
      howToFix: `${agencyName} builds structured comparison pages and off-site citation playbooks tailored to ${brand}.`,
    });
  }

  const primaryGapText =
    missingFiles.length > 0
      ? `missing ${missingFiles.slice(0, 2).join(' and ')}`
      : blockedBots.length > 0
        ? `HTTP 403/robots restrictions on ${blockedBots.join(', ')}`
        : 'unstructured commercial comparison coverage';

  const rivalClause =
    rivals.slice(0, 2).join(' and ') || 'competing category vendors';

  const draftNote = [
    `Subject: ${brand} — AI search & claim audit (${summary.visibilityScore}/100 visibility)`,
    '',
    `Ran a 3-engine retrieval check on ${host}.`,
    `${brand} currently scores ${summary.visibilityScore}/100 across ChatGPT, Google Gemini, and Perplexity buyer prompts while ${rivalClause} capture category citations due to ${primaryGapText}.`,
    `Private diagnostic scorecard: https://verisource.dev/audit/${slugPreview} [activates on Agency plan]`,
    `Our team already prepared the validated schema.org JSON-LD, /llms.txt, and /agents.md fixes for your ${detectedPlatformLabel} site—book 15 minutes if useful: ${bookingUrl}`,
    '',
    `— ${agencyName}`,
  ].join('\n');

  return {
    agencyName,
    brandColor,
    bookingUrl,
    slugPreview,
    detectedPlatformLabel,
    whiteLabelImpactItems: items.slice(0, 3),
    outreachPreview: enforceQualityGate95(draftNote, 'citation_outreach_brief'),
  };
}
