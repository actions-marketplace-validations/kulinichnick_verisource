import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { AgencyPitchReportRow } from '../db/types.js';
import {
  sanitizeCsvCell,
  type ExtractedColdOutreachItem,
} from './pitch-outreach.js';

export function buildAgencyPartnerOutreachNote(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): EnforcedQualityArtifact {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const agenciesUrl = `${cleanBase}/agencies`;
  const hostname = report.prospect_domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');

  const rawDraft = [
    `Subject: ${report.prospect_brand_name} — white-label AI search audits for your client roster`,
    '',
    `Ran a live AI audit on ${hostname}.`,
    `Your agency domain scored ${report.visibility_score}/100 across ChatGPT, Google Gemini, and Perplexity, and we minted your interactive scorecard here: ${shareUrl}`,
    `SEO, web design, and Shopify agencies use our $249/mo white-label console (15 client domains, $16.60/site) to mint branded /audit/[slug] scorecards with their own logo and close $1,500–$3,000/mo retainers.`,
    `Every client slot ships ready-to-paste schema.org JSON-LD, /llms.txt, and /agents.md fixes plus 5,000 /mcp agent credits: ${agenciesUrl}`,
  ].join('\n');

  return enforceQualityGate95(rawDraft, 'citation_outreach_brief');
}

export function extractAgencyPartnerOutreachParts(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): ExtractedColdOutreachItem {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const enforced = buildAgencyPartnerOutreachNote(report, cleanBase);
  const lines = enforced.content.split(/\r?\n/);

  let subject = `${report.prospect_brand_name} — white-label AI search audits for your client roster`;
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

export function buildAgencyPartnerBatchCsv(
  reports: AgencyPitchReportRow[],
  baseUrl = 'https://verisource.dev'
): string {
  const header = [
    'agency_prospect_name',
    'agency_domain',
    'own_visibility_score',
    'sample_audit_share_url',
    'partner_overview_url',
    'email_subject',
    'email_body',
    'quality_gate_score',
  ].join(',');

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const partnerUrl = `${cleanBase}/agencies`;

  const rows = reports.map((report) => {
    const item = extractAgencyPartnerOutreachParts(report, cleanBase);
    return [
      sanitizeCsvCell(item.prospectBrandName),
      sanitizeCsvCell(item.prospectDomain),
      sanitizeCsvCell(item.visibilityScore),
      sanitizeCsvCell(item.shareUrl),
      sanitizeCsvCell(partnerUrl),
      sanitizeCsvCell(item.subject),
      sanitizeCsvCell(item.body),
      sanitizeCsvCell(item.qualityScore.toFixed(1)),
    ].join(',');
  });

  return [header, ...rows].join('\n');
}

export function buildAgencyPartnerPlaybookMarkdown(
  reports: AgencyPitchReportRow[],
  baseUrl = 'https://verisource.dev'
): EnforcedQualityArtifact {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const items = reports.map((r) =>
    extractAgencyPartnerOutreachParts(r, cleanBase)
  );

  const sections = items.map(
    (item, idx) =>
      [
        `## ${idx + 1}. ${item.prospectBrandName} (\`${item.prospectDomain}\`) — ${item.visibilityScore}/100`,
        `- **Live Agency Demo Audit:** ${item.shareUrl}`,
        `- **White-Label Partner Page:** ${cleanBase}/agencies`,
        `- **Subject:** ${item.subject}`,
        '',
        '```text',
        item.body,
        '```',
      ].join('\n')
  );

  const rawMarkdown = [
    '# Verisource Agency White-Label Partner Playbook ($249/mo Tier)',
    '',
    'Target segment: SEO, web design, digital PR, and Shopify Plus agencies (`1.5%–2.5%/mo` historical churn). Each agency prospect receives a live `/audit/[slug]` scorecard on their own domain plus unit economics (`$16.60/client/mo` across 15 slots vs. `$1,500–$3,000/mo` client GEO retainers).',
    '',
    ...sections,
  ].join('\n\n');

  return enforceQualityGate95(rawMarkdown, 'agents_md');
}
