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

function stripSubjectPrefix(content: string): {
  subject: string | null;
  body: string;
} {
  const lines = content.split(/\r?\n/);
  if (lines[0]?.toLowerCase().startsWith('subject:')) {
    return {
      subject: lines[0].slice('subject:'.length).trim(),
      body: lines.slice(1).join('\n').trim(),
    };
  }
  return { subject: null, body: content.trim() };
}

export function buildLocalServiceOutreachNote(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): EnforcedQualityArtifact {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const hostname = report.prospect_domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  const competitors = report.summary_payload.competitors_winning ?? [];
  const rivalList =
    competitors.slice(0, 2).join(' and ') ||
    'third-party directories (Yelp, Zocdoc, Avvo, and Angi)';

  const rawDraft = [
    `Subject: ${report.prospect_brand_name} — local AI search referral audit (${report.visibility_score}/100)`,
    '',
    `Ran a live AI search audit on ${hostname}.`,
    `${report.prospect_brand_name} scored ${report.visibility_score}/100 across ChatGPT, Google Gemini, and Perplexity while ${rivalList} capture high-intent local buyer citations: ${shareUrl}`,
    `Multi-location legal, dental, MedSpa, roofing, and HVAC groups use our $99/mo Pro console to publish vertical schema.org JSON-LD, /llms.txt, and /agents.md guardrails—where one AI-referred client covers years of software.`,
    `We already generated the validated files for ${hostname}; inspect your live scorecard or grab the one-time $19 Fix Pack here: ${shareUrl}`,
  ].join('\n');

  return enforceQualityGate95(rawDraft, 'citation_outreach_brief');
}

export function buildLocalServiceOutreachSequence(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): ColdOutreachSequence {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const hostname = report.prospect_domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  const competitors = report.summary_payload.competitors_winning ?? [];
  const rivalList =
    competitors.slice(0, 2).join(' and ') ||
    'third-party directories (Yelp, Zocdoc, Avvo, and Angi)';
  const baseSubject = `${report.prospect_brand_name} — local AI search referral audit (${report.visibility_score}/100)`;
  const tripwireUrl = `${cleanBase}/api/checkout?plan=tripwire_19&cycle=one_time&domain=${encodeURIComponent(
    hostname
  )}&slug=${encodeURIComponent(report.share_slug)}`;

  const day0 = buildLocalServiceOutreachNote(report, cleanBase);

  const day3Raw = [
    `Subject: Re: ${baseSubject}`,
    '',
    `Quick technical follow-up on ${hostname}.`,
    `When GPTBot, OAI-SearchBot, and PerplexityBot answer local commercial queries, ${rivalList} outrank service sites that lack vertical LocalBusiness schema.org JSON-LD and a root /llms.txt specification.`,
    `Deploying those two machine-readable files plus /agents.md routes high-ticket local consultations directly to ${hostname} without changing your visible theme: ${shareUrl}`,
  ].join('\n');

  const day7Raw = [
    `Subject: Re: ${baseSubject}`,
    '',
    `Last note on this thread.`,
    `Your live ${report.visibility_score}/100 diagnostic brief for ${hostname} stays active for 30 days (${shareUrl}).`,
    `Your web team can grab the one-time $19 Fix Bundle (vertical schema.org JSON-LD, /llms.txt, and /agents.md) directly here—with the $19 credited automatically toward $99/mo Pro tracking within 7 days: ${tripwireUrl}`,
  ].join('\n');

  return {
    day0,
    day3: enforceQualityGate95(day3Raw, 'citation_outreach_brief'),
    day7: enforceQualityGate95(day7Raw, 'citation_outreach_brief'),
  };
}

export function extractLocalServiceOutreachParts(
  report: AgencyPitchReportRow,
  baseUrl = 'https://verisource.dev'
): ExtractedColdOutreachItem {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const shareUrl = `${cleanBase}/audit/${report.share_slug}`;
  const seq = buildLocalServiceOutreachSequence(report, cleanBase);
  const p0 = stripSubjectPrefix(seq.day0.content);
  const p3 = stripSubjectPrefix(seq.day3.content);
  const p7 = stripSubjectPrefix(seq.day7.content);

  const subject =
    p0.subject ??
    `${report.prospect_brand_name} — local AI search referral audit (${report.visibility_score}/100)`;

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

export function buildLocalServiceBatchCsv(
  reports: AgencyPitchReportRow[],
  baseUrl = 'https://verisource.dev'
): string {
  const header = [
    'local_group_name',
    'group_domain',
    'visibility_score',
    'competitors_winning',
    'audit_share_url',
    'email_subject',
    'email_body',
    'quality_gate_score',
    'followup_day3_body',
    'followup_day7_body',
  ].join(',');

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const rows = reports.map((report) => {
    const item = extractLocalServiceOutreachParts(report, cleanBase);
    return [
      sanitizeCsvCell(item.prospectBrandName),
      sanitizeCsvCell(item.prospectDomain),
      sanitizeCsvCell(item.visibilityScore),
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

export function buildLocalServicePlaybookMarkdown(
  reports: AgencyPitchReportRow[],
  baseUrl = 'https://verisource.dev'
): EnforcedQualityArtifact {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const items = reports.map((r) =>
    extractLocalServiceOutreachParts(r, cleanBase)
  );

  const sections = items.map(
    (item, idx) =>
      [
        `## ${idx + 1}. ${item.prospectBrandName} (\`${item.prospectDomain}\`) — ${item.visibilityScore}/100`,
        `- **Live Diagnostic Brief:** ${item.shareUrl}`,
        `- **Subject:** ${item.subject}`,
        `- **Critic Scores:** \`${item.qualityScore.toFixed(1)} / ${item.followUpDay3Score.toFixed(1)} / ${item.followUpDay7Score.toFixed(1)}\``,
        '',
        '### Touch 1 — Day 0 (Local AI Referral Audit)',
        '```text',
        item.body,
        '```',
        '',
        '### Touch 2 — Day 3 (Same-Thread LocalBusiness Schema & Bot Gap)',
        '```text',
        item.followUpDay3Body,
        '```',
        '',
        '### Touch 3 — Day 7 (Same-Thread $19 Fix Pack / $99 Pro Handoff)',
        '```text',
        item.followUpDay7Body,
        '```',
      ].join('\n')
  );

  const rawMarkdown = [
    '# Verisource High-Ticket Local Service 3-Touch Outbound Playbook ($99/mo Pro Tier)',
    '',
    'Target segment: Multi-location Legal, Dental, MedSpa, Roofing, and HVAC groups (`$5,000–$25,000+` client LTV). Each group receives a live `/audit/[slug]` scorecard plus vertical `schema.org` `JSON-LD` (`LegalService`, `Dentist`, `MedicalBusiness`, `RoofingContractor`, `HVACBusiness`), `/llms.txt`, and `/agents.md` remediation paths.',
    '',
    ...sections,
  ].join('\n\n');

  return enforceQualityGate95(rawMarkdown, 'agents_md');
}
