import React from 'react';

/**
 * Zero-Lag Inline Architectural SVG Streamable HTTP MCP Schematic (< 3.3 KB, 0 JS timers).
 * Reuses GPU-friendly CSS stroke-dashoffset keyframes (.vs-signal-path) from @verisource/ui
 * and honors @media (prefers-reduced-motion: reduce).
 */
export function McpStreamSchematic(): React.ReactElement {
  return (
    <div
      className="vs-card"
      style={{
        overflow: 'hidden',
        background: 'var(--vs-surface)',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--vs-border)',
          background: 'var(--vs-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <span className="vs-eyebrow" style={{ fontSize: '10.5px' }}>
          FIG 03 · STATELESS STREAMABLE HTTP /MCP ENGINE
        </span>
        <span
          className="vs-mono"
          style={{
            fontSize: '10.5px',
            color: 'var(--vs-pass-fg)',
            fontWeight: 600,
          }}
        >
          ● ZERO /SSE OVERHEAD
        </span>
      </div>

      <div
        style={{
          padding: '14px 14px 10px 14px',
          background: 'var(--vs-surface)',
        }}
      >
        <svg
          viewBox="0 0 500 302"
          width="100%"
          role="img"
          aria-label="Animated architectural diagram showing Claude Desktop, Cursor, Windsurf, and Antigravity calling https://mcp.verisource.dev/mcp over stateless Streamable HTTP for free readiness checks and paid syntax-validated GEO fix bundles."
          style={{ display: 'block', height: 'auto' }}
        >
          {/* Architectural Corner Registration Crosshairs */}
          <g stroke="#E5E2DA" strokeWidth="1">
            <line x1="16" y1="22" x2="28" y2="22" />
            <line x1="22" y1="16" x2="22" y2="28" />
            <line x1="472" y1="22" x2="484" y2="22" />
            <line x1="478" y1="16" x2="478" y2="28" />
            <line x1="16" y1="280" x2="28" y2="280" />
            <line x1="22" y1="274" x2="22" y2="286" />
            <line x1="472" y1="280" x2="484" y2="280" />
            <line x1="478" y1="274" x2="478" y2="286" />
          </g>

          {/* Column Labels */}
          <text
            x="18"
            y="44"
            fill="#686D78"
            fontSize="9.5"
            fontFamily="var(--vs-mono)"
            fontWeight="600"
            letterSpacing="0.06em"
          >
            1. AI AGENT CLIENTS
          </text>
          <text
            x="250"
            y="44"
            textAnchor="middle"
            fill="#686D78"
            fontSize="9.5"
            fontFamily="var(--vs-mono)"
            fontWeight="600"
            letterSpacing="0.06em"
          >
            2. EDGE /MCP GATE
          </text>
          <text
            x="334"
            y="44"
            fill="#686D78"
            fontSize="9.5"
            fontFamily="var(--vs-mono)"
            fontWeight="600"
            letterSpacing="0.06em"
          >
            3. TOOL PAYLOADS
          </text>

          {/* Inbound Tracks */}
          <path
            d="M 142 86 C 178 86, 178 154, 204 154"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 142 154 L 204 154"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 142 222 C 178 222, 178 154, 204 154"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />

          {/* Inbound Animated Pulses */}
          <path
            className="vs-signal-path"
            d="M 142 86 C 178 86, 178 154, 204 154"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-1"
            d="M 142 154 L 204 154"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-2"
            d="M 142 222 C 178 222, 178 154, 204 154"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />

          {/* Outbound Tracks */}
          <path
            d="M 296 140 C 315 140, 315 102, 334 102"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 296 168 C 315 168, 315 206, 334 206"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />

          {/* Outbound Animated Pulses */}
          <path
            className="vs-signal-path vs-signal-path-delay-1"
            d="M 296 140 C 315 140, 315 102, 334 102"
            fill="none"
            stroke="#166534"
            strokeWidth="1.75"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-2"
            d="M 296 168 C 315 168, 315 206, 334 206"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.75"
          />

          {/* Left Client Node 1: Claude Desktop */}
          <g>
            <rect
              x="18"
              y="64"
              width="124"
              height="44"
              rx="6"
              fill="#FAF9F6"
              stroke="#E5E2DA"
            />
            <text
              x="28"
              y="82"
              fill="#0A0E17"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Claude Desktop
            </text>
            <text
              x="28"
              y="97"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              Chat &amp; Research
            </text>
          </g>

          {/* Left Client Node 2: Cursor & Windsurf */}
          <g>
            <rect
              x="18"
              y="132"
              width="124"
              height="44"
              rx="6"
              fill="#FAF9F6"
              stroke="#E5E2DA"
            />
            <text
              x="28"
              y="150"
              fill="#0A0E17"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Cursor / Windsurf
            </text>
            <text
              x="28"
              y="165"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              IDE Repo Fixes
            </text>
          </g>

          {/* Left Client Node 3: Antigravity */}
          <g>
            <rect
              x="18"
              y="200"
              width="124"
              height="44"
              rx="6"
              fill="#FAF9F6"
              stroke="#E5E2DA"
            />
            <text
              x="28"
              y="218"
              fill="#0A0E17"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Antigravity
            </text>
            <text
              x="28"
              y="233"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              Autonomous Agents
            </text>
          </g>

          {/* Center Streamable HTTP Gate */}
          <g>
            <rect
              x="204"
              y="106"
              width="92"
              height="96"
              rx="8"
              fill="#0A0E17"
            />
            <text
              x="250"
              y="133"
              textAnchor="middle"
              fill="#FAF9F6"
              fontSize="9.5"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
              letterSpacing="0.05em"
            >
              POST /MCP
            </text>
            <text
              x="250"
              y="152"
              textAnchor="middle"
              fill="#FAF9F6"
              fontSize="10.8"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              SHA-256 Auth
            </text>
            <text
              x="250"
              y="169"
              textAnchor="middle"
              fill="#A3A9B6"
              fontSize="9"
              fontFamily="var(--vs-mono)"
            >
              1 cr cached
            </text>
            <text
              x="250"
              y="184"
              textAnchor="middle"
              fill="#A3A9B6"
              fontSize="9"
              fontFamily="var(--vs-mono)"
            >
              10 cr live
            </text>
          </g>

          {/* Right Outcome Card 1: Free Preview */}
          <g>
            <rect
              x="334"
              y="68"
              width="148"
              height="68"
              rx="6"
              fill="#ECFDF5"
              stroke="#A7F3D0"
            />
            <text
              x="344"
              y="87"
              fill="#166534"
              fontSize="9.5"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
            >
              FREE PREVIEW · 0 CR
            </text>
            <text
              x="344"
              y="104"
              fill="#0A0E17"
              fontSize="10.5"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Readiness (0–100)
            </text>
            <text
              x="344"
              y="120"
              fill="#3F4654"
              fontSize="9.2"
              fontFamily="var(--vs-mono)"
            >
              GPTBot WAF + /agents.md
            </text>
          </g>

          {/* Right Outcome Card 2: Pro & Agency Bundle */}
          <g>
            <rect
              x="334"
              y="168"
              width="148"
              height="76"
              rx="6"
              fill="#FAF9F6"
              stroke="#0A0E17"
              strokeWidth="1.5"
            />
            <text
              x="344"
              y="187"
              fill="#0A0E17"
              fontSize="9.5"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
            >
              PRO + AGENCY TOOLS
            </text>
            <text
              x="344"
              y="206"
              fill="#0A0E17"
              fontSize="11.5"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
            >
              Validated Fix Pack
            </text>
            <text
              x="344"
              y="223"
              fill="#3F4654"
              fontSize="9.2"
              fontFamily="var(--vs-mono)"
            >
              Rival URLs + Truth Diff
            </text>
            <text
              x="344"
              y="236"
              fill="#166534"
              fontSize="9"
              fontWeight="600"
              fontFamily="var(--vs-mono)"
            >
              JSON-LD · /llms.txt · UCP
            </text>
          </g>
        </svg>
      </div>

      <div
        style={{
          padding: '9px 14px',
          borderTop: '1px solid var(--vs-border)',
          background: 'var(--vs-surface-warm)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '11.5px',
          color: 'var(--vs-ink-secondary)',
        }}
      >
        <span>Listed on Official MCP Registry: dev.verisource/mcp</span>
        <span className="vs-mono" style={{ fontWeight: 600, color: 'var(--vs-ink)' }}>
          mcp.verisource.dev/mcp
        </span>
      </div>
    </div>
  );
}
