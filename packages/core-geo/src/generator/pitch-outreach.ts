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
