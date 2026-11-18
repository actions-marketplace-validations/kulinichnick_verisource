import fs from 'node:fs';
import path from 'node:path';

export type AgentSkillTarget =
  | 'claude'
  | 'cursor'
  | 'codex'
  | 'antigravity'
  | 'all';

const COMPACT_SKILL_BODY = `---
name: verisource-verify
description: Verify live AI search schema (JSON-LD, /agents.md, /llms.txt), broken links, browser flows, and backend error logs before marking web work complete.
---

Before declaring UI, routing, pricing, or SEO/GEO changes complete:
1. Run \`npx @verisource/cli verify <url>\` (or \`npx @verisource/cli run\` for saved \`.verisource/workflows/*.json\`).
2. If any handle fails (\`[h#]\`, \`[b#]\`, \`[l#]\`, \`[n#]\`, \`[g#]\`), inspect with \`npx @verisource/cli show <handle>\`, fix the root cause, and re-verify until \`PASS (exit 0)\`.
`;

export function installAgentSkills(params: {
  target: AgentSkillTarget;
  cwd?: string;
}): string[] {
  const root = path.resolve(params.cwd ?? process.cwd());
  const targets: Array<Exclude<AgentSkillTarget, 'all'>> =
    params.target === 'all'
      ? ['claude', 'cursor', 'codex', 'antigravity']
      : [params.target];

  const written: string[] = [];

  for (const t of targets) {
    if (t === 'claude') {
      const p = path.join(
        root,
        '.claude',
        'skills',
        'verisource-verify',
        'SKILL.md'
      );
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, COMPACT_SKILL_BODY, 'utf8');
      written.push(path.relative(root, p).replace(/\\/g, '/'));
    } else if (t === 'cursor') {
      const p = path.join(root, '.cursor', 'rules', 'verisource-verify.mdc');
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, COMPACT_SKILL_BODY, 'utf8');
      written.push(path.relative(root, p).replace(/\\/g, '/'));
    } else if (t === 'codex') {
      const p = path.join(
        root,
        '.codex',
        'skills',
        'verisource-verify',
        'SKILL.md'
      );
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, COMPACT_SKILL_BODY, 'utf8');
      written.push(path.relative(root, p).replace(/\\/g, '/'));
    } else if (t === 'antigravity') {
      const p = path.join(
        root,
        '.agents',
        'skills',
        'verisource-verify',
        'SKILL.md'
      );
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, COMPACT_SKILL_BODY, 'utf8');
      written.push(path.relative(root, p).replace(/\\/g, '/'));
    }
  }

  return written;
}
