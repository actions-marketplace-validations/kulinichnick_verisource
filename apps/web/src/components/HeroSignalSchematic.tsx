import React from 'react';

/**
 * Zero-Lag Inline Architectural SVG Signal Schematic (< 3.5 KB, 0 JS timers).
 * Uses GPU-friendly CSS stroke-dashoffset & opacity keyframes defined in @verisource/ui
 * and honors @media (prefers-reduced-motion: reduce).
 */
export function HeroSignalSchematic(): React.ReactElement {
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
          FIG 01 · HOW VERISOURCE PROTECTS YOUR BRAND
        </span>
        <span
          className="vs-mono"
          style={{ fontSize: '10.5px', color: 'var(--vs-pass-fg)', fontWeight: 600 }}
        >
          ● LIVE VERIFICATION LOOP
        </span>
      </div>

      <div style={{ padding: '14px 14px 10px 14px', background: 'var(--vs-surface)' }}>
        <svg
          viewBox="0 0 500 308"
          width="100%"
          role="img"
          aria-label="Animated diagram showing buyer questions from ChatGPT, Google Gemini, and Perplexity flowing through the Verisource Truth Engine to catch false pricing claims and publish verified website code fixes."
          style={{ display: 'block', height: 'auto' }}
        >
          {/* Subtle Architectural Registration Marks */}
          <g stroke="#E5E2DA" strokeWidth="1">
            <line x1="16" y1="24" x2="28" y2="24" />
            <line x1="22" y1="18" x2="22" y2="30" />
            <line x1="472" y1="24" x2="484" y2="24" />
            <line x1="478" y1="18" x2="478" y2="30" />
            <line x1="16" y1="284" x2="28" y2="284" />
            <line x1="22" y1="278" x2="22" y2="290" />
            <line x1="472" y1="284" x2="484" y2="284" />
            <line x1="478" y1="278" x2="478" y2="290" />
          </g>

          {/* Column Captions */}
          <text
            x="18"
            y="46"
            fill="#686D78"
            fontSize="9.5"
            fontFamily="var(--vs-mono)"
            fontWeight="600"
            letterSpacing="0.06em"
          >
            1. BUYERS ASK AI
          </text>
          <text
            x="248"
            y="46"
            textAnchor="middle"
            fill="#686D78"
            fontSize="9.5"
            fontFamily="var(--vs-mono)"
            fontWeight="600"
            letterSpacing="0.06em"
          >
            2. TRUTH AUDIT
          </text>
          <text
            x="336"
            y="46"
            fill="#686D78"
            fontSize="9.5"
            fontFamily="var(--vs-mono)"
            fontWeight="600"
            letterSpacing="0.06em"
          >
            3. VERIFIED OUTCOME
          </text>

          {/* Base Hairline Tracks: AI Engines -> Verisource Core */}
          <path
            d="M 136 86 C 178 86, 178 156, 210 156"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 136 156 L 210 156"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 136 226 C 178 226, 178 156, 210 156"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />

          {/* Animated Signal Pulses Along Inbound Bezier Curves */}
          <path
            className="vs-signal-path"
            d="M 136 86 C 178 86, 178 156, 210 156"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-1"
            d="M 136 156 L 210 156"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-2"
            d="M 136 226 C 178 226, 178 156, 210 156"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Outbound Base Tracks: Verisource Core -> Caught Claim & Verified Fix */}
          <path
            d="M 286 140 C 312 140, 310 98, 336 98"
            fill="none"
            stroke="#FECACA"
            strokeWidth="1.35"
            strokeDasharray="3 3"
          />
          <path
            d="M 286 172 C 312 172, 310 216, 336 216"
            fill="none"
            stroke="#A7F3D0"
            strokeWidth="1.5"
          />
          <path
            className="vs-signal-path-out"
            d="M 286 172 C 312 172, 310 216, 336 216"
            fill="none"
            stroke="#065F46"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Left Engine Node 1: ChatGPT */}
          <g transform="translate(18, 66)">
            <rect
              width="118"
              height="40"
              rx="6"
              fill="#FAF9F6"
              stroke="#CFCBC0"
              strokeWidth="1"
            />
            <circle cx="16" cy="20" r="3.5" fill="#0A0E17" />
            <text
              x="27"
              y="18"
              fill="#0A0E17"
              fontSize="11"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              ChatGPT
            </text>
            <text
              x="27"
              y="31"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              “Best coffee gift?”
            </text>
          </g>

          {/* Left Engine Node 2: Google Gemini */}
          <g transform="translate(18, 136)">
            <rect
              width="118"
              height="40"
              rx="6"
              fill="#FAF9F6"
              stroke="#CFCBC0"
              strokeWidth="1"
            />
            <circle cx="16" cy="20" r="3.5" fill="#0A0E17" />
            <text
              x="27"
              y="18"
              fill="#0A0E17"
              fontSize="11"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              Google Gemini
            </text>
            <text
              x="27"
              y="31"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              “Free delivery?”
            </text>
          </g>

          {/* Left Engine Node 3: Perplexity */}
          <g transform="translate(18, 206)">
            <rect
              width="118"
              height="40"
              rx="6"
              fill="#FAF9F6"
              stroke="#CFCBC0"
              strokeWidth="1"
            />
            <circle cx="16" cy="20" r="3.5" fill="#0A0E17" />
            <text
              x="27"
              y="18"
              fill="#0A0E17"
              fontSize="11"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              Perplexity
            </text>
            <text
              x="27"
              y="31"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              “Compare pricing”
            </text>
          </g>

          {/* Center Monolith: Verisource Truth Engine */}
          <g transform="translate(210, 106)">
            <rect
              className="vs-pulse-ring"
              x="-5"
              y="-5"
              width="86"
              height="110"
              rx="11"
              fill="none"
              stroke="#CFCBC0"
              strokeWidth="1"
            />
            <rect width="76" height="100" rx="8" fill="#0A0E17" />
            {/* Crisp Architectural Diamond Emblem */}
            <polygon
              points="38,20 50,32 38,44 26,32"
              fill="none"
              stroke="#FAF9F6"
              strokeWidth="1.5"
            />
            <circle cx="38" cy="32" r="2.5" fill="#A7F3D0" />
            <text
              x="38"
              y="64"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
              fontWeight="700"
              letterSpacing="0.04em"
            >
              VERISOURCE
            </text>
            <text
              x="38"
              y="78"
              textAnchor="middle"
              fill="#A3A8B4"
              fontSize="8.5"
              fontFamily="var(--vs-mono)"
            >
              TRUTH GATE
            </text>
          </g>

          {/* Right Output Card 1: Flagged AI Mistake */}
          <g transform="translate(336, 66)">
            <rect
              width="148"
              height="64"
              rx="6"
              fill="#FEF2F2"
              stroke="#FECACA"
              strokeWidth="1"
            />
            <text
              x="11"
              y="18"
              fill="#991B1B"
              fontSize="9"
              fontFamily="var(--vs-mono)"
              fontWeight="700"
              letterSpacing="0.04em"
            >
              ✕ FLAGGED AI CLAIM
            </text>
            <text
              x="11"
              y="36"
              fill="#0A0E17"
              fontSize="11"
              fontFamily="var(--vs-sans)"
              fontWeight="600"
              textDecoration="line-through"
            >
              “Sells $15 K-Cup pods”
            </text>
            <text
              x="11"
              y="51"
              fill="#991B1B"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              Alerted before buyers bounce
            </text>
          </g>

          {/* Right Output Card 2: Published Website Fix */}
          <g transform="translate(336, 178)">
            <rect
              width="148"
              height="74"
              rx="6"
              fill="#ECFDF5"
              stroke="#A7F3D0"
              strokeWidth="1"
            />
            <text
              x="11"
              y="18"
              fill="#065F46"
              fontSize="9"
              fontFamily="var(--vs-mono)"
              fontWeight="700"
              letterSpacing="0.04em"
            >
              ✓ PUBLISHED SITE FIX
            </text>
            <text
              x="11"
              y="36"
              fill="#0A0E17"
              fontSize="11.5"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              Whole-bean $21.95+
            </text>
            <text
              x="11"
              y="52"
              fill="#065F46"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              JSON-LD + /agents.md
            </text>
            <text
              x="11"
              y="65"
              fill="#3A3F4B"
              fontSize="9"
              fontFamily="var(--vs-mono)"
            >
              41 → 92 / 100 readiness
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
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '11.5px',
          color: 'var(--vs-ink-secondary)',
        }}
      >
        <span>
          <strong>Plain-English Guided Mode</strong> +{' '}
          <strong className="vs-mono">Pro /mcp Mode</strong> built in
        </span>
        <span className="vs-mono" style={{ fontSize: '11px', color: 'var(--vs-ink-muted)' }}>
          SVG · 0 ms lag
        </span>
      </div>
    </div>
  );
}
