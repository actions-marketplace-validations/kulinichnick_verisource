import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type {
  AgencyPitchReportRow,
  DomainRow,
  GeneratedFixRow,
  QualityRubricBreakdown,
} from '../db/types.js';
import { normalizePublicDomain } from '../scanner/bot-waf-prober.js';

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

export function extractColdOutreachParts(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): ExtractedColdOutreachItem {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const enforced = buildAgencyColdOutreachNote(report, cleanBase);
  const lines = enforced.content.split(/\r?\n/);
  let subject = `${report.prospect_brand_name} — AI search claim audit (${report.visibility_score}/100 visibility)`;
  let bodyStartIdx = 0;

  if (lines[0]?.toLowerCase().startsWith('subject:')) {
    subject = lines[0].slice('subject:'.length).trim();
    bodyStartIdx = 1;
  }
  const body = lines.slice(bodyStartIdx).join('\n').trim();

  return {
    prospectBrandName: report.prospect_brand_name,
    prospectDomain: report.prospect_domain,
    visibilityScore: report.visibility_score,
    hallucinationCount: report.hallucination_count,
    competitorsWinning: report.summary_payload.competitors_winning ?? [],
    shareSlug: report.share_slug,
    shareUrl,
    subject,
    body,
    fullNote: enforced.content,
    qualityScore: enforced.score,
    qualityBreakdown: enforced.breakdown,
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
      `- **Critic Quality Score:** \`${item.qualityScore.toFixed(1)} / 10.0\``,
      '',
      '```text',
      item.fullNote,
      '```',
    ].join('\n');
  });

  const draft = [
    `# Agency White-Label Outreach Playbook (${items.length} ${items.length === 1 ? 'Prospect' : 'Prospects'})`,
    '',
    'Ready-to-send founder briefs verified across ChatGPT, Google Gemini, and Perplexity.',
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
    evidenceSentence = `ChatGPT and Perplexity currently state "${first.claim_text}" (${report.visibility_score}/100 visibility), because ${report.prospect_domain} lacks verified schema.org JSON-LD and /agents.md guardrails stating: ${first.verified_truth}`;
  } else {
    const rivalList =
      competitors.slice(0, 2).join(' and ') || 'competing category directories';
    const primaryGap =
      topGaps[0] ??
      'missing /llms.txt and custom /agents.md machine-readable specifications';
    const lostSharePct = Math.max(12, 100 - report.visibility_score);
    evidenceSentence = `${report.prospect_brand_name} currently scores ${report.visibility_score}/100 on commercial buyer prompts while ${rivalList} capture roughly ${lostSharePct}% of AI citations due to ${primaryGap}.`;
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
      `- **Quality Gate Score:** \`${Number(fix.natural_quality_score).toFixed(1)} / 10.0\``,
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
