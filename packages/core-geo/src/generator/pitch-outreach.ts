import {
  enforceQualityGate95,
  type EnforcedQualityArtifact,
} from '../critic/quality-gate.js';
import type {
  AgencyPitchReportRow,
  DomainRow,
  GeneratedFixRow,
} from '../db/types.js';

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
