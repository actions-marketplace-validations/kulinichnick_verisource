import type { FixType, QualityRubricBreakdown } from '../db/types.js';

export interface QualityAuditResult {
  passed: boolean;
  score: number;
  breakdown: QualityRubricBreakdown;
  violations: string[];
}

export interface EnforcedQualityArtifact {
  content: string;
  score: number;
  breakdown: QualityRubricBreakdown;
  violations: string[];
}

interface BannedPattern {
  label: string;
  regex: RegExp;
  replacement: string;
}

const BANNED_LEXICON_PATTERNS: BannedPattern[] = [
  { label: 'delve', regex: /\bdelv(e|es|ed|ing)\b/gi, replacement: 'examine' },
  { label: 'testament', regex: /\btestaments?\b/gi, replacement: 'proof' },
  { label: 'tapestry', regex: /\btapestr(y|ies)\b/gi, replacement: 'structure' },
  { label: 'elevate', regex: /\belevat(e|es|ed|ing)\b/gi, replacement: 'improve' },
  {
    label: 'game-changer',
    regex: /\bgame[- ]chang(er|ers|ing)\b/gi,
    replacement: 'high-leverage shift',
  },
  { label: 'unleash', regex: /\bunleash(es|ed|ing)?\b/gi, replacement: 'activate' },
  { label: 'unlock', regex: /\bunlock(s|ed|ing)?\b/gi, replacement: 'enable' },
  { label: 'seamless', regex: /\bseamless(ly)?\b/gi, replacement: 'direct' },
  { label: 'comprehensive', regex: /\bcomprehensive(ly)?\b/gi, replacement: 'complete' },
  { label: 'moreover', regex: /\bmoreover,?\s*/gi, replacement: '' },
  { label: 'furthermore', regex: /\bfurthermore,?\s*/gi, replacement: '' },
  { label: 'beacon', regex: /\bbeacons?\b/gi, replacement: 'signal' },
  { label: 'symphony', regex: /\bsymphon(y|ies)\b/gi, replacement: 'coordination' },
  {
    label: 'turbocharge',
    regex: /\bturbocharg(e|es|ed|ing)\b/gi,
    replacement: 'accelerate',
  },
  {
    label: "in today's fast-paced digital landscape",
    regex: /in today['’]s fast[- ]paced digital landscape,?\s*/gi,
    replacement: '',
  },
  {
    label: "it's not just X—it's Y",
    regex: /\bit['’]?s not just ([^—\-,.;]+)\s*(?:—|--|-|,)\s*it['’]?s\b/gi,
    replacement: 'It combines $1 with',
  },
];

const VAGUE_MARKETING_PATTERNS: BannedPattern[] = [
  {
    label: 'powerful insights',
    regex: /\bpowerful insights\b/gi,
    replacement: 'verified citation telemetry',
  },
  {
    label: 'actionable intelligence',
    regex: /\bactionable intelligence\b/gi,
    replacement: 'ready-to-publish schema fixes',
  },
  {
    label: 'next-generation visibility',
    regex: /\bnext[- ]generation visibility\b/gi,
    replacement: 'AI search citation share',
  },
  {
    label: 'optimize your presence',
    regex: /\boptimize your presence\b/gi,
    replacement: 'publish verified /agents.md and JSON-LD entity schemas',
  },
];

const EMPTY_INTENSIFIERS_REGEX = /\b(truly|incredibly|effortlessly|revolutionary)\s+/gi;
const THROAT_CLEARING_REGEX = /^(?:in an era where[^,]+,\s*|when it comes to[^,]+,\s*)/gim;
const PLACEHOLDER_REGEX =
  /\b(?:TODO|FIXME|Lorem ipsum|YOUR_DOMAIN_HERE|INSERT_HERE)\b|\[Insert [^\]]+\]/i;

const CONCRETE_EVIDENCE_TOKENS = [
  /https?:\/\//i,
  /schema\.org/i,
  /json-ld/i,
  /agents\.md/i,
  /llms\.txt/i,
  /\/api\/(?:ucp\/)?mcp/i,
  /\b(?:GPTBot|OAI-SearchBot|PerplexityBot|ClaudeBot|Google-Extended)\b/,
  /\$\d+(?:\.\d{2})?/,
  /\b\d+(?:\.\d+)?%/,
  /\b(?:USD|SKU|HTTP\s*[245]\d{2}|GeoCircle|LocalBusiness|FAQPage|Product)\b/i,
];

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function gradeArtifactQuality(
  content: string,
  fixType?: FixType
): QualityAuditResult {
  const violations: string[] = [];

  // Pillar 1: Zero AI-Lexicon Filter (2.0 pts; -1.0 per match)
  let lexiconScore = 2.0;
  for (const item of BANNED_LEXICON_PATTERNS) {
    const matches = content.match(item.regex);
    if (matches && matches.length > 0) {
      lexiconScore -= 1.0 * matches.length;
      violations.push(`Banned lexicon match: "${item.label}" (${matches.length}x)`);
    }
  }
  if (THROAT_CLEARING_REGEX.test(content)) {
    lexiconScore -= 1.0;
    violations.push('Banned throat-clearing opener ("In an era where..." / "When it comes to...")');
  }
  lexiconScore = clamp(roundOneDecimal(lexiconScore), 0, 2.0);

  // Pillar 2: Human Cadence & Burstiness (2.0 pts)
  let cadenceScore = 2.0;
  const intensifierMatches = content.match(EMPTY_INTENSIFIERS_REGEX);
  if (intensifierMatches && intensifierMatches.length > 0) {
    cadenceScore -= 0.5;
    violations.push(`Stacked empty intensifiers detected (${intensifierMatches.join(', ').trim()})`);
  }

  if (fixType !== 'json_ld_schema') {
    const proseSentences = content
      .replace(/```[\s\S]*?```/g, '')
      .split(/[.!?]+\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('#') && !s.startsWith('http'));

    if (proseSentences.length >= 3) {
      let monotoneRun = 0;
      for (const sentence of proseSentences) {
        const words = sentence.split(/\s+/).length;
        if (words >= 14 && words <= 18) {
          monotoneRun += 1;
          if (monotoneRun >= 3) {
            cadenceScore -= 0.5;
            violations.push('Three consecutive mid-length (14-18 word) monotone sentences');
            break;
          }
        } else {
          monotoneRun = 0;
        }
      }
    }
  }
  cadenceScore = clamp(roundOneDecimal(cadenceScore), 0, 2.0);

  // Pillar 3: Specificity & Evidence Density (2.0 pts)
  let specificityScore = 2.0;
  for (const vague of VAGUE_MARKETING_PATTERNS) {
    if (vague.regex.test(content)) {
      specificityScore -= 0.5;
      violations.push(`Vague unbacked phrase: "${vague.label}"`);
    }
  }
  let concreteHits = 0;
  for (const tokenRegex of CONCRETE_EVIDENCE_TOKENS) {
    if (tokenRegex.test(content)) concreteHits += 1;
  }
  if (concreteHits < 2) {
    specificityScore -= 0.6;
    violations.push('Insufficient concrete protocol/commercial artifacts (< 2 evidence tokens)');
  }
  specificityScore = clamp(roundOneDecimal(specificityScore), 0, 2.0);

  // Pillar 4: Structural & Editorial Craft (2.0 pts)
  let craftScore = 2.0;
  if (content.trim().length < 40) {
    craftScore -= 0.8;
    violations.push('Artifact content too sparse (< 40 chars)');
  }
  if (fixType === 'json_ld_schema') {
    if (!content.includes('\n  ')) {
      craftScore -= 0.4;
      violations.push('JSON-LD schema lacks clean 2-space indentation');
    }
  } else if (
    (fixType === 'agents_md' ||
      fixType === 'llms_txt' ||
      fixType === 'shopify_agents_liquid') &&
    !content.includes('# ')
  ) {
    craftScore -= 0.5;
    violations.push('Markdown protocol file lacks a top-level H1 heading');
  }
  craftScore = clamp(roundOneDecimal(craftScore), 0, 2.0);

  // Pillar 5: Technical & Functional Integrity (2.0 pts)
  let integrityScore = 2.0;
  if (PLACEHOLDER_REGEX.test(content)) {
    integrityScore = 0.0;
    violations.push('Contains forbidden placeholder token (TODO / FIXME / Lorem ipsum / [Insert X])');
  }

  if (fixType === 'json_ld_schema') {
    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;
      const ctx = parsed['@context'];
      const hasGraph = Array.isArray(parsed['@graph']);
      const hasType = Boolean(parsed['@type']) || hasGraph;
      if (
        (typeof ctx !== 'string' || !ctx.includes('schema.org')) ||
        !hasType
      ) {
        integrityScore = 0.0;
        violations.push('JSON-LD missing @context "https://schema.org" or @type / @graph');
      }
    } catch {
      integrityScore = 0.0;
      violations.push('Invalid JSON syntax in JSON-LD payload');
    }
  }

  if (fixType === 'shopify_agents_liquid') {
    const openBraces = (content.match(/\{\{/g) ?? []).length;
    const closeBraces = (content.match(/\}\}/g) ?? []).length;
    if (openBraces !== closeBraces || openBraces === 0) {
      integrityScore = 0.0;
      violations.push('Shopify Liquid payload has unbalanced or missing {{ ... }} objects');
    }
  }

  const total = roundOneDecimal(
    lexiconScore + cadenceScore + specificityScore + craftScore + integrityScore
  );

  return {
    passed: total >= 9.5 && integrityScore === 2.0 && lexiconScore === 2.0,
    score: total,
    breakdown: {
      lexicon_filter: lexiconScore,
      human_cadence: cadenceScore,
      specificity_density: specificityScore,
      visual_or_structural_craft: craftScore,
      technical_integrity: integrityScore,
      total,
      revisions_run: 0,
    },
    violations,
  };
}

function deterministicSanitizePass(content: string, fixType?: FixType): string {
  let cleaned = content;

  cleaned = cleaned.replace(THROAT_CLEARING_REGEX, '');
  cleaned = cleaned.replace(EMPTY_INTENSIFIERS_REGEX, '');

  for (const item of BANNED_LEXICON_PATTERNS) {
    cleaned = cleaned.replace(item.regex, item.replacement);
  }
  for (const vague of VAGUE_MARKETING_PATTERNS) {
    cleaned = cleaned.replace(vague.regex, vague.replacement);
  }

  // Capitalize sentences left lowercase after stripping leading "Moreover, " / "Furthermore, "
  cleaned = cleaned.replace(/(^|[.!?]\s+)([a-z])/gm, (_m, prefix: string, ch: string) => {
    return `${prefix}${ch.toUpperCase()}`;
  });

  if (fixType === 'json_ld_schema') {
    try {
      const parsed = JSON.parse(cleaned);
      cleaned = JSON.stringify(parsed, null, 2);
    } catch {
      // Leave untouched if unparseable so integrity scorer flags it
    }
  }

  return cleaned.trim();
}

export function enforceQualityGate95(
  draftContent: string,
  fixType?: FixType
): EnforcedQualityArtifact {
  let current = draftContent.trim();
  let audit = gradeArtifactQuality(current, fixType);
  let revisions = 0;

  while (!audit.passed && revisions < 2) {
    revisions += 1;
    current = deterministicSanitizePass(current, fixType);
    audit = gradeArtifactQuality(current, fixType);
  }

  audit.breakdown.revisions_run = revisions;

  if (audit.score < 9.5) {
    throw new Error(
      `Quality Gate 9.5/10 failed (scored ${audit.score}/10): ${audit.violations.join('; ')}`
    );
  }

  return {
    content: current,
    score: audit.score,
    breakdown: audit.breakdown,
    violations: audit.violations,
  };
}
