import { normalizePublicDomain } from '../scanner/bot-waf-prober.js';

export type ReadinessBadgeTier = 'READY' | 'PARTIAL' | 'AT RISK' | 'UNSCANNED';

export interface ReadinessBadgeInput {
  hostname: string;
  score: number | null;
  customLabel?: string;
}

export interface ReadinessBadgeEmbedBundle {
  badgeUrl: string;
  reportUrl: string;
  markdownEmbed: string;
  htmlEmbed: string;
}

function escapeXml(raw: string): string {
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function classifyReadinessBadgeTier(
  score: number | null
): {
  tier: ReadinessBadgeTier;
  textHex: string;
  dotHex: string;
  pillBorderHex: string;
} {
  if (score === null || !Number.isFinite(score)) {
    return {
      tier: 'UNSCANNED',
      textHex: '#B4BCC9',
      dotHex: '#848E9F',
      pillBorderHex: '#262E3D',
    };
  }
  if (score >= 75) {
    return {
      tier: 'READY',
      textHex: '#6EE7B7',
      dotHex: '#10B981',
      pillBorderHex: '#065F46',
    };
  }
  if (score >= 50) {
    return {
      tier: 'PARTIAL',
      textHex: '#E5A93C',
      dotHex: '#E5A93C',
      pillBorderHex: '#5C4316',
    };
  }
  return {
    tier: 'AT RISK',
    textHex: '#FCA5A5',
    dotHex: '#EF4444',
    pillBorderHex: '#7F1D1D',
  };
}

export function renderReadinessBadgeSvg(input: ReadinessBadgeInput): string {
  const cleanHost = normalizePublicDomain(input.hostname).hostname;
  const clampedScore =
    input.score === null || !Number.isFinite(input.score)
      ? null
      : Math.max(0, Math.min(100, Math.round(input.score)));
  const { tier, textHex, dotHex, pillBorderHex } =
    classifyReadinessBadgeTier(clampedScore);

  const leftText = (input.customLabel?.trim() || 'AI SEARCH READINESS').toUpperCase();
  const rightText =
    clampedScore === null ? 'SCAN LIVE' : `${clampedScore}/100 · ${tier}`;

  // Deterministic pixel geometry at 11px monospace (approx 6.8px per glyph)
  const leftWidth = Math.max(158, Math.round(34 + leftText.length * 6.9 + 14));
  const rightWidth = Math.max(106, Math.round(24 + rightText.length * 6.9 + 14));
  const totalWidth = leftWidth + rightWidth;

  const ariaTitle =
    clampedScore === null
      ? `${cleanHost} — Scan AI Search Readiness on Verisource`
      : `${cleanHost} — AI Search Readiness ${clampedScore}/100 (${tier}) verified by Verisource`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" viewBox="0 0 ${totalWidth} 28" role="img" aria-label="${escapeXml(ariaTitle)}">
  <title>${escapeXml(ariaTitle)}</title>
  <rect width="${totalWidth}" height="28" rx="6" fill="#0E1116" />
  <rect x="0.5" y="0.5" width="${totalWidth - 1}" height="27" rx="5.5" fill="none" stroke="#262E3D" />
  <g transform="translate(8, 7)">
    <rect width="14" height="14" rx="3.5" fill="#E5A93C" />
    <g transform="translate(7 7) rotate(45)">
      <rect x="-2.7" y="-2.7" width="5.4" height="5.4" fill="none" stroke="#161004" stroke-width="1.35" stroke-linejoin="round" />
    </g>
  </g>
  <text x="29" y="18" fill="#EEF1F6" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" font-weight="700" letter-spacing="0.02em">${escapeXml(leftText)}</text>
  <rect x="${leftWidth}" y="3" width="${rightWidth - 3}" height="22" rx="4" fill="#171C26" stroke="${pillBorderHex}" stroke-width="1" />
  <circle cx="${leftWidth + 11}" cy="14" r="3" fill="${dotHex}" />
  <text x="${leftWidth + 20}" y="18" fill="${textHex}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" font-weight="700">${escapeXml(rightText)}</text>
</svg>`;
}

export function buildReadinessBadgeEmbedSnippets(params: {
  hostname: string;
  brandName?: string;
  baseUrl?: string;
  targetPath?: string;
}): ReadinessBadgeEmbedBundle {
  const cleanHost = normalizePublicDomain(params.hostname).hostname;
  const cleanBase = (params.baseUrl ?? 'https://verisource.dev').replace(
    /\/+$/,
    ''
  );
  const badgeUrl = `${cleanBase}/api/badge/${encodeURIComponent(cleanHost)}`;
  const reportUrl = params.targetPath
    ? `${cleanBase}${params.targetPath.startsWith('/') ? '' : '/'}${params.targetPath}`
    : `${cleanBase}/report/${encodeURIComponent(cleanHost)}`;
  const altText = params.brandName?.trim()
    ? `${params.brandName.trim()} AI Search Readiness — Verisource`
    : `${cleanHost} AI Search Readiness — Verisource`;

  const markdownEmbed = `[![${altText}](${badgeUrl})](${reportUrl})`;
  const htmlEmbed = `<a href="${escapeXml(reportUrl)}" target="_blank" rel="noopener"><img src="${escapeXml(badgeUrl)}" alt="${escapeXml(altText)}" height="28" /></a>`;

  return {
    badgeUrl,
    reportUrl,
    markdownEmbed,
    htmlEmbed,
  };
}
