'use client';

import React, { useState } from 'react';
import { CopyCommandPill } from '@verisource/ui';

type CmdMode = 'cli' | 'mcp';

const COMMANDS: Record<
  CmdMode,
  { pillLabel: string; cmd: string; displayCmd?: string }
> = {
  cli: {
    pillLabel: 'CLI · Scan & Verify',
    cmd: 'npx --yes https://verisource.dev/downloads/verisource-cli.tgz scan your-site.com',
    displayCmd:
      'npx --yes https://verisource.dev/downloads/verisource-cli.tgz scan your-site.com',
  },
  mcp: {
    pillLabel: 'MCP · Claude / Cursor / Antigravity',
    cmd: 'claude mcp add --transport http verisource https://mcp.verisource.dev/mcp',
  },
};

export function HeroCommandSwitcher(): React.ReactElement {
  const [mode, setMode] = useState<CmdMode>('cli');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <div
        className="vs-pill-group"
        role="group"
        aria-label="Quickstart command mode"
      >
        {(Object.keys(COMMANDS) as CmdMode[]).map((key) => (
          <button
            key={key}
            type="button"
            className="vs-pill-btn vs-pill-btn-sm"
            data-active={mode === key ? 'true' : 'false'}
            onClick={() => setMode(key)}
          >
            {COMMANDS[key].pillLabel}
          </button>
        ))}
      </div>
      <CopyCommandPill
        command={COMMANDS[mode].cmd}
        displayCommand={COMMANDS[mode].displayCmd}
      />
    </div>
  );
}
