import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type { AgencyPitchReportRow } from '../db/types.js';
import {
  sanitizeCsvCell,
  type ColdOutreachSequence,
  type ExtractedColdOutreachItem,
} from './pitch-outreach.js';

function stripSubjectLine(content: string): { subject: string | null; body: string } {
  const lines = content.split(/\r?\n/);
  if (lines[0]?.toLowerCase().startsWith('subject:')) {
    return {
      subject: lines[0].slice('subject:'.length).trim(),
      body: lines.slice(1).join('\n').trim(),
    };
  }
  return { subject: null, body: content.trim() };
}

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

export function buildAgencyPartnerOutreachSequence(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): ColdOutreachSequence {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const agenciesUrl = `${cleanBase}/agencies`;
  const sandboxUrl = `${cleanBase}/dashboard?tab=tab3_offsite`;
  const hostname = report.prospect_domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  const baseSubject = `${report.prospect_brand_name} — white-label AI search audits for your client roster`;

  const day0 = buildAgencyPartnerOutreachNote(report, cleanBase);

  const day3Raw = [
    `Subject: Re: ${baseSubject}`,
    '',
    `Quick unit-economics note for ${report.prospect_brand_name}.`,
    `Agencies on our $249/mo white-label tier paste 10 prospect domains into Batch Mode, strip Verisource navigation automatically, and get real-time alerts (with Slackbot and LinkedInBot filtered out) the moment a buyer opens their /audit/[slug] scorecard.`,
    `Closing a single $1,500/mo GEO retainer covers all 15 client slots ($16.60/site/mo) plus 5,000 monthly /mcp credits: ${agenciesUrl}`,
  ].join('\n');

  const day7Raw = [
    `Subject: Re: ${baseSubject}`,
    '',
    `Last note on this thread.`,
    `Your live ${hostname} scorecard (${report.visibility_score}/100) remains open here: ${shareUrl}`,
    `You can also mint 3 white-label client /audit/[slug] links—complete with GPTBot WAF checks, schema.org JSON-LD, and /agents.md fixes—free inside Tab 3 Batch Mode: ${sandboxUrl}`,
  ].join('\n');

  return {
    day0,
    day3: enforceQualityGate95(day3Raw, 'citation_outreach_brief'),
    day7: enforceQualityGate95(day7Raw, 'citation_outreach_brief'),
  };
}

export function extractAgencyPartnerOutreachParts(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): ExtractedColdOutreachItem {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const seq = buildAgencyPartnerOutreachSequence(report, cleanBase);
  const p0 = stripSubjectLine(seq.day0.content);
  const p3 = stripSubjectLine(seq.day3.content);
  const p7 = stripSubjectLine(seq.day7.content);

  const subject =
    p0.subject ??
    `${report.prospect_brand_name} — white-label AI search audits for your client roster`;

  return {
    prospectBrandName: report.prospect_brand_name,
    prospectDomain: report.prospect_domain,
    visibilityScore: report.visibility_score,
    hallucinationCount: report.hallucination_count,
    competitorsWinning: report.summary_payload.competitors_winning ?? [],
    shareSlug: report.share_slug,
    shareUrl,
    subject,
    body: p0.body,
    followUpDay3Body: p3.body,
    followUpDay3Score: seq.day3.score,
    followUpDay7Body: p7.body,
    followUpDay7Score: seq.day7.score,
    fullNote: seq.day0.content,
    qualityScore: seq.day0.score,
    qualityBreakdown: seq.day0.breakdown,
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
    'followup_day3_body',
    'followup_day7_body',
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
      sanitizeCsvCell(item.followUpDay3Body),
      sanitizeCsvCell(item.followUpDay7Body),
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
        `- **Critic Scores:** \`${item.qualityScore.toFixed(1)} / ${item.followUpDay3Score.toFixed(1)} / ${item.followUpDay7Score.toFixed(1)}\``,
        '',
        '### Touch 1 — Day 0 (Agency Scorecard & Retainer Pitch)',
        '```text',
        item.body,
        '```',
        '',
        '### Touch 2 — Day 3 (Same-Thread Unit Economics & Open Alerts)',
        '```text',
        item.followUpDay3Body,
        '```',
        '',
        '### Touch 3 — Day 7 (Same-Thread Free Batch Sandbox Invite)',
        '```text',
        item.followUpDay7Body,
        '```',
      ].join('\n')
  );

  const rawMarkdown = [
    '# Verisource Agency White-Label 3-Touch Partner Playbook ($249/mo Tier)',
    '',
    'Target segment: SEO, web design, digital PR, and Shopify Plus agencies (`1.5%–2.5%/mo` historical churn). Each agency prospect receives a 3-step sequence (`Day 0` -> `Day 3` -> `Day 7`) with a live `/audit/[slug]` scorecard on their own domain plus unit economics (`$16.60/client/mo` across 15 slots vs. `$1,500–$3,000/mo` client GEO retainers).',
    '',
    ...sections,
  ].join('\n\n');

  return enforceQualityGate95(rawMarkdown, 'agents_md');
}
