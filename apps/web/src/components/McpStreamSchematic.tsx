import React from 'react';

/**
 * Zero-Lag Inline Architectural SVG Streamable HTTP MCP Schematic (0 JS timers).
 * Renders a spacious landscape schematic on desktop/tablet (> 640px) and a
 * native 1:1 portrait vertical flow on mobile (<= 640px) via pure CSS.
 */
export function McpStreamSchematic(): React.ReactElement {
  return (
    <div className="vs-bezel">
      <div
        className="vs-card"
        style={{
          overflow: 'hidden',
          background: 'var(--vs-surface)',
        }}
      >
        <div className="vs-schematic-header">
          <span className="vs-eyebrow" style={{ fontSize: '10.5px' }}>
            FIG 03 · STATELESS STREAMABLE HTTP /MCP ENGINE
          </span>
          <span
            className="vs-mono"
            style={{
              fontSize: '10.5px',
              color: 'var(--vs-pass-fg)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: '#059669',
                display: 'inline-block',
              }}
            />
            ZERO /SSE OVERHEAD
          </span>
        </div>

        <div
          style={{
            padding: '14px 12px 10px 12px',
            background: 'var(--vs-surface)',
          }}
        >
          {/* Desktop & Tablet Landscape Schematic (> 640px) */}
          <svg
            className="vs-schematic-desktop"
            viewBox="0 0 560 302"
            width="100%"
            role="img"
            aria-label="Animated architectural diagram showing Claude Desktop, Cursor, Windsurf, and Antigravity calling https://mcp.verisource.dev/mcp over stateless Streamable HTTP for free readiness checks and paid syntax-validated GEO fix bundles."
          >
            <defs>
              <filter id="vsMcpCardShadow" x="-6%" y="-6%" width="112%" height="118%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0A0E17" floodOpacity="0.06" />
              </filter>
            </defs>
          <g stroke="#E5E2DA" strokeWidth="1">
            <line x1="16" y1="22" x2="28" y2="22" />
            <line x1="22" y1="16" x2="22" y2="28" />
            <line x1="532" y1="22" x2="544" y2="22" />
            <line x1="538" y1="16" x2="538" y2="28" />
            <line x1="16" y1="280" x2="28" y2="280" />
            <line x1="22" y1="274" x2="22" y2="286" />
            <line x1="532" y1="280" x2="544" y2="280" />
            <line x1="538" y1="274" x2="538" y2="286" />
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
            x="266"
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
            x="362"
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
            d="M 166 86 C 194 86, 194 140, 218 140"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 166 154 L 218 154"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 166 222 C 194 222, 194 168, 218 168"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />

          <path
            className="vs-signal-path"
            d="M 166 86 C 194 86, 194 140, 218 140"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-1"
            d="M 166 154 L 218 154"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-2"
            d="M 166 222 C 194 222, 194 168, 218 168"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />

          {/* Outbound Tracks */}
          <path
            d="M 314 140 C 338 140, 338 102, 362 102"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 314 168 C 338 168, 338 206, 362 206"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />

          <path
            className="vs-signal-path vs-signal-path-delay-1"
            d="M 314 140 C 338 140, 338 102, 362 102"
            fill="none"
            stroke="#166534"
            strokeWidth="1.75"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-2"
            d="M 314 168 C 338 168, 338 206, 362 206"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.75"
          />

          {/* Left Client Node 1: Claude Desktop */}
          <g>
            <rect
              x="18"
              y="64"
              width="148"
              height="44"
              rx="6"
              fill="#FAF9F6"
              stroke="#E5E2DA"
            />
            <text
              x="30"
              y="82"
              fill="#0A0E17"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Claude Desktop
            </text>
            <text
              x="30"
              y="97"
              fill="#686D78"
              fontSize="9.3"
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
              width="148"
              height="44"
              rx="6"
              fill="#FAF9F6"
              stroke="#E5E2DA"
            />
            <text
              x="30"
              y="150"
              fill="#0A0E17"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Cursor / Windsurf
            </text>
            <text
              x="30"
              y="165"
              fill="#686D78"
              fontSize="9.3"
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
              width="148"
              height="44"
              rx="6"
              fill="#FAF9F6"
              stroke="#E5E2DA"
            />
            <text
              x="30"
              y="218"
              fill="#0A0E17"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Antigravity
            </text>
            <text
              x="30"
              y="233"
              fill="#686D78"
              fontSize="9.3"
              fontFamily="var(--vs-mono)"
            >
              Autonomous Agents
            </text>
          </g>

          {/* Center Streamable HTTP Gate */}
          <g filter="url(#vsMcpCardShadow)">
            <rect
              className="vs-pulse-ring"
              x="213"
              y="101"
              width="106"
              height="106"
              rx="11"
              fill="none"
              stroke="#059669"
              strokeWidth="1.3"
            />
            <rect
              x="218"
              y="106"
              width="96"
              height="96"
              rx="8"
              fill="#0A0E17"
            />
            <circle className="vs-live-dot" cx="266" cy="120" r="3" fill="#34D399" />
            <text
              x="266"
              y="138"
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
              x="266"
              y="156"
              textAnchor="middle"
              fill="#FAF9F6"
              fontSize="10.8"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              SHA-256 Auth
            </text>
            <text
              x="266"
              y="172"
              textAnchor="middle"
              fill="#34D399"
              fontSize="9"
              fontFamily="var(--vs-mono)"
            >
              1 cr cached
            </text>
            <text
              x="266"
              y="186"
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
              x="362"
              y="68"
              width="180"
              height="68"
              rx="6"
              fill="#ECFDF5"
              stroke="#A7F3D0"
            />
            <text
              x="374"
              y="87"
              fill="#166534"
              fontSize="9.5"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
            >
              FREE PREVIEW · 0 CR
            </text>
            <text
              x="374"
              y="104"
              fill="#0A0E17"
              fontSize="10.5"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Readiness (0–100)
            </text>
            <text
              x="374"
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
              x="362"
              y="168"
              width="180"
              height="76"
              rx="6"
              fill="#FAF9F6"
              stroke="#0A0E17"
              strokeWidth="1.5"
            />
            <text
              x="374"
              y="187"
              fill="#0A0E17"
              fontSize="9.5"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
            >
              PRO + AGENCY TOOLS
            </text>
            <text
              x="374"
              y="206"
              fill="#0A0E17"
              fontSize="11.5"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
            >
              Validated Fix Pack
            </text>
            <text
              x="374"
              y="223"
              fill="#3F4654"
              fontSize="9.2"
              fontFamily="var(--vs-mono)"
            >
              Rival URLs + Truth Diff
            </text>
            <text
              x="374"
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

        {/* Mobile Portrait Vertical Schematic (<= 640px) */}
        <svg
          className="vs-schematic-mobile"
          viewBox="0 0 340 326"
          width="100%"
          role="img"
          aria-label="Vertical mobile diagram showing Claude, Cursor, and Antigravity calling POST /mcp over Streamable HTTP for free readiness checks and metered GEO fix packs."
        >
          <text
            x="170"
            y="16"
            textAnchor="middle"
            fill="#686D78"
            fontSize="9.5"
            fontFamily="var(--vs-mono)"
            fontWeight="600"
            letterSpacing="0.06em"
          >
            1. AI AGENT CLIENTS
          </text>

          <g transform="translate(8, 26)">
            <rect width="102" height="46" rx="6" fill="#FAF9F6" stroke="#E5E2DA" />
            <text
              x="51"
              y="19"
              textAnchor="middle"
              fill="#0A0E17"
              fontSize="10.8"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Claude
            </text>
            <text
              x="51"
              y="35"
              textAnchor="middle"
              fill="#686D78"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              Desktop / Web
            </text>
          </g>

          <g transform="translate(119, 26)">
            <rect width="102" height="46" rx="6" fill="#FAF9F6" stroke="#E5E2DA" />
            <text
              x="51"
              y="19"
              textAnchor="middle"
              fill="#0A0E17"
              fontSize="10.8"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Cursor
            </text>
            <text
              x="51"
              y="35"
              textAnchor="middle"
              fill="#686D78"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              &amp; Windsurf
            </text>
          </g>

          <g transform="translate(230, 26)">
            <rect width="102" height="46" rx="6" fill="#FAF9F6" stroke="#E5E2DA" />
            <text
              x="51"
              y="19"
              textAnchor="middle"
              fill="#0A0E17"
              fontSize="10.8"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Antigravity
            </text>
            <text
              x="51"
              y="35"
              textAnchor="middle"
              fill="#686D78"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              Agent IDE
            </text>
          </g>

          <path
            d="M 59 72 C 59 98, 140 94, 140 118"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 170 72 L 170 118"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 281 72 C 281 98, 200 94, 200 118"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />

          <path
            className="vs-signal-path"
            d="M 59 72 C 59 98, 140 94, 140 118"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-1"
            d="M 170 72 L 170 118"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-2"
            d="M 281 72 C 281 98, 200 94, 200 118"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />

          <g transform="translate(52, 118)">
            <rect width="236" height="58" rx="8" fill="#0A0E17" />
            <text
              x="118"
              y="25"
              textAnchor="middle"
              fill="#FAF9F6"
              fontSize="9.8"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
              letterSpacing="0.04em"
            >
              2. POST /MCP · SHA-256 AUTH
            </text>
            <text
              x="118"
              y="42"
              textAnchor="middle"
              fill="#A3A9B6"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              0 cr free · 1 cr cached · 10 cr live
            </text>
          </g>

          <path
            d="M 136 176 C 136 200, 86 198, 86 220"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 204 176 C 204 200, 254 198, 254 220"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-1"
            d="M 136 176 C 136 200, 86 198, 86 220"
            fill="none"
            stroke="#166534"
            strokeWidth="1.75"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-2"
            d="M 204 176 C 204 200, 254 198, 254 220"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.75"
          />

          <g transform="translate(8, 220)">
            <rect width="156" height="94" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
            <text
              x="11"
              y="20"
              fill="#166534"
              fontSize="8.8"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
            >
              FREE PREVIEW · 0 CR
            </text>
            <text
              x="11"
              y="40"
              fill="#0A0E17"
              fontSize="10.2"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Readiness (0–100)
            </text>
            <text
              x="11"
              y="60"
              fill="#3F4654"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              GPTBot + WAF check
            </text>
            <text
              x="11"
              y="76"
              fill="#3F4654"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              No API key needed
            </text>
          </g>

          <g transform="translate(176, 220)">
            <rect
              width="156"
              height="94"
              rx="6"
              fill="#FAF9F6"
              stroke="#0A0E17"
              strokeWidth="1.5"
            />
            <text
              x="11"
              y="20"
              fill="#0A0E17"
              fontSize="8.8"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
            >
              PRO + AGENCY
            </text>
            <text
              x="11"
              y="40"
              fill="#0A0E17"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
            >
              Validated Fix Pack
            </text>
            <text
              x="11"
              y="60"
              fill="#3F4654"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              Rival URLs + Truth
            </text>
            <text
              x="11"
              y="76"
              fill="#166534"
              fontSize="8.8"
              fontWeight="600"
              fontFamily="var(--vs-mono)"
            >
              JSON-LD · /llms.txt
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
          gap: '6px 10px',
          fontSize: '11.5px',
          color: 'var(--vs-ink-secondary)',
        }}
      >
        <span>Listed on Official MCP Registry: dev.verisource/mcp</span>
          <span
            className="vs-mono"
            style={{ fontWeight: 600, color: 'var(--vs-ink)', whiteSpace: 'nowrap' }}
          >
            mcp.verisource.dev/mcp
          </span>
        </div>
      </div>
    </div>
  );
}
