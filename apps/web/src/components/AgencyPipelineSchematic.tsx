import React from 'react';

/**
 * Zero-Lag Inline Architectural SVG Agency Retainer Schematic (< 3.2 KB, 0 JS timers).
 * Reuses GPU-friendly CSS stroke-dashoffset keyframes (.vs-signal-path) from @verisource/ui
 * and honors @media (prefers-reduced-motion: reduce).
 */
export function AgencyPipelineSchematic(): React.ReactElement {
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
          FIG 02 · 60-SECOND WHITE-LABEL RETAINER ENGINE
        </span>
        <span
          className="vs-mono"
          style={{
            fontSize: '10.5px',
            color: 'var(--vs-pass-fg)',
            fontWeight: 600,
          }}
        >
          ● ZERO VERISOURCE CHROME
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
          aria-label="Animated architectural diagram showing 10 prospect domains passing through the Verisource 60-second white-label engine to trigger human open alerts and $1,500 to $3,000 monthly client retainers."
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
            1. PROSPECT BATCH
          </text>
          <text
            x="248"
            y="44"
            textAnchor="middle"
            fill="#686D78"
            fontSize="9.5"
            fontFamily="var(--vs-mono)"
            fontWeight="600"
            letterSpacing="0.06em"
          >
            2. WHITE-LABEL
          </text>
          <text
            x="336"
            y="44"
            fill="#686D78"
            fontSize="9.5"
            fontFamily="var(--vs-mono)"
            fontWeight="600"
            letterSpacing="0.06em"
          >
            3. AGENCY REVENUE
          </text>

          {/* Inbound Tracks */}
          <path
            d="M 142 86 C 178 86, 178 154, 206 154"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 142 154 L 206 154"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 142 222 C 178 222, 178 154, 206 154"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />

          {/* Inbound Animated Signal Pulses */}
          <path
            className="vs-signal-path"
            d="M 142 86 C 178 86, 178 154, 206 154"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-1"
            d="M 142 154 L 206 154"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-2"
            d="M 142 222 C 178 222, 178 154, 206 154"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.6"
          />

          {/* Outbound Tracks */}
          <path
            d="M 294 140 C 314 140, 314 102, 334 102"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 294 168 C 314 168, 314 206, 334 206"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />

          {/* Outbound Animated Pulses */}
          <path
            className="vs-signal-path vs-signal-path-delay-1"
            d="M 294 140 C 314 140, 314 102, 334 102"
            fill="none"
            stroke="#166534"
            strokeWidth="1.75"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-2"
            d="M 294 168 C 314 168, 314 206, 334 206"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.75"
          />

          {/* Left Prospect Segment Nodes */}
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
              Shopify Stores
            </text>
            <text
              x="28"
              y="97"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              /api/ucp/mcp · SKUs
            </text>
          </g>

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
              B2B SaaS Sites
            </text>
            <text
              x="28"
              y="165"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              Rival citation gaps
            </text>
          </g>

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
              Local Groups
            </text>
            <text
              x="28"
              y="233"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              Legal · Dental · HVAC
            </text>
          </g>

          {/* Center White-Label Minting Core */}
          <g>
            <rect
              x="206"
              y="108"
              width="88"
              height="92"
              rx="8"
              fill="#0A0E17"
            />
            <text
              x="250"
              y="136"
              textAnchor="middle"
              fill="#FAF9F6"
              fontSize="9.5"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
              letterSpacing="0.05em"
            >
              BATCH 10x
            </text>
            <text
              x="250"
              y="155"
              textAnchor="middle"
              fill="#FAF9F6"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Your Logo
            </text>
            <text
              x="250"
              y="171"
              textAnchor="middle"
              fill="#A3A9B6"
              fontSize="9"
              fontFamily="var(--vs-mono)"
            >
              /audit/[slug]
            </text>
            <text
              x="250"
              y="186"
              textAnchor="middle"
              fill="#A3A9B6"
              fontSize="9"
              fontFamily="var(--vs-mono)"
            >
              + CSV Export
            </text>
          </g>

          {/* Right Outcome Card 1: Verified Human Open Alert */}
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
              HOT LEAD · 1x OPEN
            </text>
            <text
              x="344"
              y="104"
              fill="#0A0E17"
              fontSize="10.5"
              fontWeight="600"
              fontFamily="var(--vs-sans)"
            >
              Instant Inbox Alert
            </text>
            <text
              x="344"
              y="120"
              fill="#3F4654"
              fontSize="9.2"
              fontFamily="var(--vs-mono)"
            >
              Slackbot unfurls ignored
            </text>
          </g>

          {/* Right Outcome Card 2: Retainer Economics */}
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
              RETAINER CLOSED
            </text>
            <text
              x="344"
              y="206"
              fill="#0A0E17"
              fontSize="12"
              fontWeight="700"
              fontFamily="var(--vs-mono)"
            >
              $1,500–$3,000/mo
            </text>
            <text
              x="344"
              y="223"
              fill="#3F4654"
              fontSize="9.2"
              fontFamily="var(--vs-mono)"
            >
              $16.60/site · 15 slots
            </text>
            <text
              x="344"
              y="236"
              fill="#166534"
              fontSize="9"
              fontWeight="600"
              fontFamily="var(--vs-mono)"
            >
              JSON-LD + /agents.md
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
        <span>1 closed client pays for Verisource 6x–12x over.</span>
        <span className="vs-mono" style={{ fontWeight: 600, color: 'var(--vs-ink)' }}>
          15 sites · 5,000 /mcp credits
        </span>
      </div>
    </div>
  );
}
