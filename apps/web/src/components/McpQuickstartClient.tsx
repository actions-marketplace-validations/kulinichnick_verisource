'use client';

import React, { useState } from 'react';
import type { ReadinessScanSummary } from '@verisource/core-geo';
import { CodeArtifactCard, StatusBadge } from '@verisource/ui';

type ClientAppId =
  | 'claude_chatgpt_oauth'
  | 'claude'
  | 'cursor'
  | 'antigravity'
  | 'windsurf'
  | 'curl_rpc';

type AuthTierMode = 'free_no_key' | 'paid_bearer_key';

interface McpPreviewApiPayload {
  endpoint: string;
  transport: string;
  latencyMs: number;
  summary: ReadinessScanSummary & {
    cached_24h: boolean;
    credits_charged: number;
  };
  rpcRequest: Record<string, unknown>;
  rpcResponse: Record<string, unknown>;
}

const CLIENT_GUIDES: Record<
  ClientAppId,
  {
    label: string;
    fileHint: string;
    plainWhereToPaste: string;
    firstPromptExample: string;
  }
> = {
  claude_chatgpt_oauth: {
    label: 'Claude Web & ChatGPT (1-Click OAuth)',
    fileHint: 'Settings → Connectors → Add Custom Connector (Zero API Keys)',
    plainWhereToPaste:
      'In Claude (claude.ai → Settings → Connectors → Add Custom Connector) or ChatGPT Connectors, paste the single HTTPS URL below and click Approve via OAuth 2.1 + PKCE S256—no JSON file or API key needed.',
    firstPromptExample:
      'Audit our domain in Verisource, flag any wrong pricing claims, and generate our JSON-LD, /agents.md, and Hosted Brand /mcp snippet.',
  },
  claude: {
    label: 'Claude Desktop',
    fileHint: 'claude_desktop_config.json',
    plainWhereToPaste:
      'Open Claude Desktop → Settings → Developer → Edit Config, paste the block below, save, and restart Claude once (or connect via 1-Click OAuth at https://mcp.verisource.dev/oauth/mcp).',
    firstPromptExample:
      'Scan yourcompany.com with Verisource and tell me if GPTBot or /agents.md has any issues.',
  },
  cursor: {
    label: 'Cursor IDE',
    fileHint: '.cursor/mcp.json',
    plainWhereToPaste:
      'Create or open .cursor/mcp.json in your project root (or Cursor Settings → MCP → Add new global MCP server) and paste the JSON block below.',
    firstPromptExample:
      'Run Verisource generate_geo_fix_bundle on our domain and write the JSON-LD and /llms.txt files into /public.',
  },
  antigravity: {
    label: 'Antigravity',
    fileHint: 'mcp_config.json',
    plainWhereToPaste:
      'Add the verisource server entry to your Antigravity MCP configuration so agents can audit citations and commit syntax-validated fixes directly.',
    firstPromptExample:
      'Call Verisource check_brand_hallucinations on our production domain and list any wrong pricing claims.',
  },
  windsurf: {
    label: 'Windsurf',
    fileHint: '~/.codeium/windsurf/mcp_config.json',
    plainWhereToPaste:
      'Open Windsurf → Cascade → Configure MCP (`mcp_config.json`), paste the server block below, and click Refresh.',
    firstPromptExample:
      'Use Verisource get_citation_gaps_and_fanouts to find which rival URLs ChatGPT cites ahead of our site.',
  },
  curl_rpc: {
    label: 'cURL / HTTP',
    fileHint: 'POST https://mcp.verisource.dev/mcp (JSON-RPC 2.0)',
    plainWhereToPaste:
      'Run this single stateless HTTP POST from any terminal, CI workflow, or backend service—no persistent WebSocket or /sse session required.',
    firstPromptExample:
      'Direct JSON-RPC 2.0 call to scan_domain_ai_readiness or generate_geo_fix_bundle.',
  },
};

function buildConfigCode(client: ClientAppId, authMode: AuthTierMode): string {
  if (client === 'claude_chatgpt_oauth') {
    return `Remote Connector URL (Paste in Claude or ChatGPT Settings → Connectors):
https://mcp.verisource.dev/oauth/mcp

OAuth 2.1 Metadata (Auto-Discovered):
- Protected Resource (RFC 9728): https://mcp.verisource.dev/.well-known/oauth-protected-resource/oauth/mcp
- Authorization Server (RFC 8414): https://mcp.verisource.dev/.well-known/oauth-authorization-server
- Dynamic Client Registration (RFC 7591): https://mcp.verisource.dev/oauth/register
- PKCE Method: S256 · Issuer (RFC 9207): https://mcp.verisource.dev`;
  }

  if (client === 'curl_rpc') {
    if (authMode === 'free_no_key') {
      return `curl -X POST https://mcp.verisource.dev/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "scan_domain_ai_readiness",
      "arguments": { "domain": "yourcompany.com" }
    }
  }'`;
    }

    return `curl -X POST https://mcp.verisource.dev/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "Authorization: Bearer vs_live_YOUR_48_CHAR_HEX_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "generate_geo_fix_bundle",
      "arguments": { "domain": "yourcompany.com" }
    }
  }'`;
  }

  if (authMode === 'free_no_key') {
    return JSON.stringify(
      {
        mcpServers: {
          verisource: {
            url: 'https://mcp.verisource.dev/mcp',
          },
        },
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      mcpServers: {
        verisource: {
          url: 'https://mcp.verisource.dev/mcp',
          headers: {
            Authorization: 'Bearer vs_live_YOUR_48_CHAR_HEX_KEY',
          },
        },
      },
    },
    null,
    2
  );
}

export function McpQuickstartClient(): React.ReactElement {
  const [selectedClient, setSelectedClient] = useState<ClientAppId>(
    'claude_chatgpt_oauth'
  );
  const [authMode, setAuthMode] = useState<AuthTierMode>('free_no_key');

  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewResult, setPreviewResult] =
    useState<McpPreviewApiPayload | null>(null);
  const [showRawWire, setShowRawWire] = useState(false);

  const activeGuide = CLIENT_GUIDES[selectedClient];
  const configSnippet = buildConfigCode(selectedClient, authMode);

  const runLiveMcpScan = async (targetDomain?: string) => {
    const cleanTarget = (targetDomain ?? domainInput).trim();
    if (!cleanTarget) return;
    if (targetDomain) {
      setDomainInput(cleanTarget);
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/mcp-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleanTarget }),
      });
      const json = (await res.json()) as McpPreviewApiPayload & {
        message?: string;
      };
      if (!res.ok) {
        setErrorMsg(json.message ?? 'Unable to scan domain right now.');
        return;
      }
      setPreviewResult(json);
    } catch {
      setErrorMsg('Network error reaching /api/mcp-preview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '36px' }}>
      {/* Part 1: 1-Click Client Configurator */}
      <div className="vs-bezel">
        <div
          className="vs-card"
          style={{
            padding: '22px',
            background: 'var(--vs-surface)',
          }}
        >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              STEP 01 · CHOOSE YOUR AI ASSISTANT OR CODE EDITOR
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              Copy your 30-second connection snippet
            </div>
          </div>

          <div
            className="vs-mode-switch"
            role="group"
            aria-label="MCP authentication mode"
          >
            <button
              type="button"
              className="vs-mode-btn"
              data-active={authMode === 'free_no_key' ? 'true' : 'false'}
              onClick={() => setAuthMode('free_no_key')}
            >
              Free Preview (No Key)
            </button>
            <button
              type="button"
              className="vs-mode-btn"
              data-active={authMode === 'paid_bearer_key' ? 'true' : 'false'}
              onClick={() => setAuthMode('paid_bearer_key')}
            >
              Pro / Agency Key (vs_live_)
            </button>
          </div>
        </div>

        <div
          className="vs-pill-group"
          style={{ marginBottom: '16px' }}
          role="tablist"
          aria-label="MCP client selector"
        >
          {(Object.keys(CLIENT_GUIDES) as ClientAppId[]).map((clientId) => {
            const isSelected = selectedClient === clientId;
            return (
              <button
                key={clientId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-active={isSelected ? 'true' : 'false'}
                onClick={() => setSelectedClient(clientId)}
                className="vs-pill-btn"
              >
                {CLIENT_GUIDES[clientId].label}
              </button>
            );
          })}
        </div>

        <div
          className="vs-guided-banner"
          style={{ marginBottom: '16px' }}
        >
          <div
            className="vs-eyebrow"
            style={{ marginBottom: '4px', color: 'var(--vs-ink-secondary)' }}
          >
            EASY 30-SECOND SETUP · {activeGuide.label.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: '13.5px',
              color: 'var(--vs-ink)',
              marginBottom: '6px',
            }}
          >
            {activeGuide.plainWhereToPaste}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--vs-ink-secondary)' }}>
            <strong>First thing to ask once saved:</strong>{' '}
            <code className="vs-mono">&ldquo;{activeGuide.firstPromptExample}&rdquo;</code>
          </div>
        </div>

        <CodeArtifactCard
          title={`${activeGuide.label} — ${
            authMode === 'free_no_key'
              ? 'Zero-Key Free Preview Config'
              : 'Metered Pro / Agency Bearer Config'
          }`}
          fileHint={activeGuide.fileHint}
          plainSummary={
            authMode === 'free_no_key'
              ? 'Runs scan_domain_ai_readiness immediately with 0 credits and no account required (3 custom domains/day/IP).'
              : 'Replace vs_live_YOUR_48_CHAR_HEX_KEY with a SHA-256 Bearer key minted inside Step 03 of your Verisource Console.'
          }
          code={configSnippet}
        />
        </div>
      </div>

      {/* Part 2: Live Free scan_domain_ai_readiness JSON-RPC Playground */}
      <div className="vs-bezel-obsidian">
        <div
          id="live-test"
          className="vs-card"
          style={{
            padding: '22px',
            background: 'var(--vs-surface)',
          }}
        >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '14px',
          }}
        >
          <div>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              STEP 02 · TEST LIVE IN YOUR BROWSER (0 CREDITS)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>
              Run <code className="vs-mono">scan_domain_ai_readiness</code> right now
            </div>
          </div>
          <StatusBadge tone="pass">LIVE STREAMABLE HTTP · 0 CREDITS</StatusBadge>
        </div>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--vs-ink-secondary)',
            margin: '0 0 16px 0',
            maxWidth: '700px',
          }}
        >
          See the exact visibility score, AI bot firewall check, and JSON-RPC 2.0
          payload your AI assistant receives when scanning a domain—before you
          even open a config file.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runLiveMcpScan();
          }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="Enter your website domain (e.g. yourcompany.com)"
            aria-label="Domain to test with scan_domain_ai_readiness"
            className="vs-input"
            style={{ flex: '1 1 260px', maxWidth: '420px' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="vs-btn"
          >
            {loading ? 'Running /mcp Tool...' : 'Run Free /mcp Scan →'}
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px',
          }}
        >
          <span
            className="vs-eyebrow"
            style={{ fontSize: '10.5px', marginRight: '4px' }}
          >
            OR TEST A LIVE BENCHMARK DOMAIN:
          </span>
          {(['stripe.com', 'linear.app', 'cal.com', 'shopify.com'] as const).map(
            (sampleHost) => (
              <button
                key={sampleHost}
                type="button"
                disabled={loading}
                className="vs-pill-btn vs-pill-btn-sm"
                onClick={() => void runLiveMcpScan(sampleHost)}
              >
                {sampleHost}
              </button>
            )
          )}
        </div>

        {errorMsg ? (
          <div
            className="vs-card"
            style={{
              padding: '12px 14px',
              borderColor: 'var(--vs-crit-border)',
              background: 'var(--vs-crit-bg)',
              color: 'var(--vs-crit-fg)',
              fontSize: '13px',
            }}
          >
            {errorMsg}
          </div>
        ) : null}

        {previewResult ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div
              className="vs-card"
              style={{
                padding: '16px 18px',
                background: 'var(--vs-surface-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>
                    {previewResult.summary.brandName}{' '}
                    <span
                      className="vs-mono"
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 500,
                        color: 'var(--vs-ink-muted)',
                      }}
                    >
                      ({previewResult.summary.hostname})
                    </span>
                  </div>
                  <div
                    className="vs-mono"
                    style={{ fontSize: '11.5px', color: 'var(--vs-ink-muted)' }}
                  >
                    Vertical: {previewResult.summary.industryVertical} ·{' '}
                    {previewResult.latencyMs}ms · Credits charged:{' '}
                    {previewResult.summary.credits_charged}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <StatusBadge
                    tone={
                      previewResult.summary.visibilityScore >= 75
                        ? 'pass'
                        : previewResult.summary.visibilityScore >= 50
                          ? 'warn'
                          : 'critical'
                    }
                  >
                    SCORE {previewResult.summary.visibilityScore} / 100
                  </StatusBadge>
                  <StatusBadge
                    tone={
                      previewResult.summary.robotsAiBotStatus.waf_blocked
                        ? 'critical'
                        : 'pass'
                    }
                  >
                    {previewResult.summary.robotsAiBotStatus.waf_blocked
                      ? 'WAF BLOCKING AI BOTS'
                      : 'AI CRAWLERS ALLOWED'}
                  </StatusBadge>
                  <StatusBadge
                    tone={
                      previewResult.summary.agentsMdStatus === 'custom_enriched'
                        ? 'pass'
                        : 'warn'
                    }
                  >
                    /AGENTS.MD: {previewResult.summary.agentsMdStatus.toUpperCase()}
                  </StatusBadge>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '13px', color: 'var(--vs-ink-secondary)' }}>
                  Sample prompt tested:{' '}
                  <strong style={{ color: 'var(--vs-ink)' }}>
                    &ldquo;{previewResult.summary.samplePromptResult.promptText}&rdquo;
                  </strong>{' '}
                  —{' '}
                  {previewResult.summary.samplePromptResult.brandMentioned
                    ? 'Brand cited in sample answer.'
                    : 'Brand omitted from sample answer.'}
                </div>

                <button
                  type="button"
                  onClick={() => setShowRawWire((prev) => !prev)}
                  className="vs-btn vs-btn-secondary"
                  style={{ padding: '6px 11px', fontSize: '12px' }}
                >
                  {showRawWire
                    ? 'Hide Raw JSON-RPC 2.0'
                    : 'Inspect Raw JSON-RPC 2.0'}
                </button>
              </div>
            </div>

            {showRawWire ? (
              <div className="vs-grid-2">
                <CodeArtifactCard
                  title="JSON-RPC 2.0 Request"
                  fileHint="POST https://mcp.verisource.dev/mcp"
                  code={JSON.stringify(previewResult.rpcRequest, null, 2)}
                />
                <CodeArtifactCard
                  title="JSON-RPC 2.0 Response"
                  fileHint="200 OK · application/json"
                  code={JSON.stringify(previewResult.rpcResponse, null, 2)}
                />
              </div>
            ) : null}
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
