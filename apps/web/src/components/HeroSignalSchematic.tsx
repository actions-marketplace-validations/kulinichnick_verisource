import React from 'react';

/**
 * Zero-Lag Inline Architectural SVG Signal Schematic (0 JS timers).
 * Renders a spacious landscape schematic on desktop/tablet (> 640px) and a
 * native 1:1 portrait vertical flow on mobile (<= 640px) via pure CSS so text
 * never clips or touches card borders on iOS Safari or Android Chrome.
 */
export function HeroSignalSchematic(): React.ReactElement {
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
            FIG 01 · HOW VERISOURCE PROTECTS &amp; GROWS YOUR BRAND
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
            LIVE VERIFICATION LOOP
          </span>
        </div>

        <div style={{ padding: '14px 12px 10px 12px', background: '#FFFFFF' }}>
          {/* Desktop & Tablet Landscape Schematic (> 640px) */}
          <svg
            className="vs-schematic-desktop"
            viewBox="0 0 560 308"
            width="100%"
            role="img"
            aria-label="Animated diagram showing buyer questions from ChatGPT, Google Gemini, and Perplexity flowing through the Verisource Truth Gate to catch false pricing claims and publish verified website code fixes."
          >
            <defs>
              <filter id="vsHeroCardShadow" x="-6%" y="-6%" width="112%" height="118%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0A0E17" floodOpacity="0.06" />
              </filter>
            </defs>
          {/* Architectural Registration Crosshairs */}
          <g stroke="#E5E2DA" strokeWidth="1">
            <line x1="16" y1="22" x2="28" y2="22" />
            <line x1="22" y1="16" x2="22" y2="28" />
            <line x1="532" y1="22" x2="544" y2="22" />
            <line x1="538" y1="16" x2="538" y2="28" />
            <line x1="16" y1="286" x2="28" y2="286" />
            <line x1="22" y1="280" x2="22" y2="292" />
            <line x1="532" y1="286" x2="544" y2="286" />
            <line x1="538" y1="280" x2="538" y2="292" />
          </g>

          {/* Column Captions */}
          <text
            x="18"
            y="44"
            fill="#686D78"
            fontSize="9.5"
            fontFamily="var(--vs-mono)"
            fontWeight="600"
            letterSpacing="0.06em"
          >
            1. BUYERS ASK AI
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
            2. TRUTH AUDIT
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
            3. VERIFIED OUTCOME
          </text>

          {/* Inbound Tracks: AI Engines -> Dedicated Truth Gate Pins */}
          <path
            d="M 166 86 C 194 86, 194 140, 222 140"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 166 156 L 222 156"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 166 226 C 194 226, 194 172, 222 172"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />

          {/* Inbound Animated Signal Pulses */}
          <path
            className="vs-signal-path"
            d="M 166 86 C 194 86, 194 140, 222 140"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-1"
            d="M 166 156 L 222 156"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-2"
            d="M 166 226 C 194 226, 194 172, 222 172"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Outbound Tracks: Truth Gate -> Flagged Claim & Verified Fix */}
          <path
            d="M 310 140 C 336 140, 336 97, 362 97"
            fill="none"
            stroke="#FECACA"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <path
            d="M 310 172 C 336 172, 336 214, 362 214"
            fill="none"
            stroke="#A7F3D0"
            strokeWidth="1.5"
          />
          <path
            className="vs-signal-path-out"
            d="M 310 172 C 336 172, 336 214, 362 214"
            fill="none"
            stroke="#065F46"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Left Engine Node 1: ChatGPT */}
          <g transform="translate(18, 65)" filter="url(#vsHeroCardShadow)">
            <rect
              width="148"
              height="42"
              rx="6"
              fill="#FFFFFF"
              stroke="#CFCBC0"
              strokeWidth="1"
            />
            <circle className="vs-live-dot" cx="15" cy="21" r="3.5" fill="#0A0E17" />
            <text
              x="26"
              y="18"
              fill="#0A0E17"
              fontSize="11"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              ChatGPT
            </text>
            <text
              x="26"
              y="32"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              “Best vendor?”
            </text>
          </g>

          {/* Left Engine Node 2: Google Gemini */}
          <g transform="translate(18, 135)" filter="url(#vsHeroCardShadow)">
            <rect
              width="148"
              height="42"
              rx="6"
              fill="#FFFFFF"
              stroke="#CFCBC0"
              strokeWidth="1"
            />
            <circle className="vs-live-dot" cx="15" cy="21" r="3.5" fill="#0A0E17" />
            <text
              x="26"
              y="18"
              fill="#0A0E17"
              fontSize="11"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              Google Gemini
            </text>
            <text
              x="26"
              y="32"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              “True pricing?”
            </text>
          </g>

          {/* Left Engine Node 3: Perplexity */}
          <g transform="translate(18, 205)" filter="url(#vsHeroCardShadow)">
            <rect
              width="148"
              height="42"
              rx="6"
              fill="#FFFFFF"
              stroke="#CFCBC0"
              strokeWidth="1"
            />
            <circle className="vs-live-dot" cx="15" cy="21" r="3.5" fill="#0A0E17" />
            <text
              x="26"
              y="18"
              fill="#0A0E17"
              fontSize="11"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              Perplexity
            </text>
            <text
              x="26"
              y="32"
              fill="#686D78"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              “Compare plans”
            </text>
          </g>

          {/* Center Monolith: Verisource Truth Gate */}
          <g transform="translate(222, 106)" filter="url(#vsHeroCardShadow)">
            <rect
              className="vs-pulse-ring"
              x="-5"
              y="-5"
              width="98"
              height="110"
              rx="11"
              fill="none"
              stroke="#059669"
              strokeWidth="1.2"
            />
            <rect width="88" height="100" rx="8" fill="#0A0E17" />
            <polygon
              points="44,20 56,32 44,44 32,32"
              fill="none"
              stroke="#FAF9F6"
              strokeWidth="1.5"
            />
            <circle className="vs-live-dot" cx="44" cy="32" r="3" fill="#34D399" />
            <text
              x="44"
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
              x="44"
              y="78"
              textAnchor="middle"
              fill="#A3A8B4"
              fontSize="8.5"
              fontFamily="var(--vs-mono)"
            >
              7-CMS AUTO-FIX
            </text>
          </g>

          {/* Right Output Card 1: Flagged AI Mistake */}
          <g transform="translate(362, 64)" filter="url(#vsHeroCardShadow)">
            <rect
              width="180"
              height="66"
              rx="6"
              fill="#FEF2F2"
              stroke="#FECACA"
              strokeWidth="1"
            />
            <text
              x="12"
              y="19"
              fill="#991B1B"
              fontSize="9"
              fontFamily="var(--vs-mono)"
              fontWeight="700"
              letterSpacing="0.04em"
            >
              ✕ FLAGGED AI CLAIM
            </text>
            <text
              x="12"
              y="37"
              fill="#0A0E17"
              fontSize="10.5"
              fontFamily="var(--vs-sans)"
              fontWeight="600"
              textDecoration="line-through"
            >
              “$19/mo unlimited”
            </text>
            <text
              x="12"
              y="53"
              fill="#991B1B"
              fontSize="9.2"
              fontFamily="var(--vs-mono)"
            >
              Caught before lead loss
            </text>
          </g>

          {/* Right Output Card 2: Published Website Fix */}
          <g transform="translate(362, 176)" filter="url(#vsHeroCardShadow)">
            <rect
              width="180"
              height="76"
              rx="6"
              fill="#ECFDF5"
              stroke="#A7F3D0"
              strokeWidth="1"
            />
            <text
              x="12"
              y="19"
              fill="#065F46"
              fontSize="9"
              fontFamily="var(--vs-mono)"
              fontWeight="700"
              letterSpacing="0.04em"
            >
              ✓ 4/4 VERIFIED LIVE
            </text>
            <text
              x="12"
              y="37"
              fill="#0A0E17"
              fontSize="11"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              Verified $49/mo+ Tiers
            </text>
            <text
              x="12"
              y="53"
              fill="#065F46"
              fontSize="9.5"
              fontFamily="var(--vs-mono)"
            >
              JSON-LD + /agents.md
            </text>
            <text
              x="12"
              y="67"
              fill="#3A3F4B"
              fontSize="9"
              fontFamily="var(--vs-mono)"
            >
              48 → 91 / 100 · #1 Cited
            </text>
          </g>
        </svg>

        {/* Mobile Portrait Vertical Schematic (<= 640px — Native 1:1 Legibility) */}
        <svg
          className="vs-schematic-mobile"
          viewBox="0 0 340 330"
          width="100%"
          role="img"
          aria-label="Vertical mobile diagram showing ChatGPT, Gemini, and Perplexity flowing into the Verisource Truth Gate and outputting caught pricing mistakes and verified website fixes."
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
            1. BUYERS ASK AI SEARCH
          </text>

          {/* Row 1: 3 Equal Engine Cards */}
          <g transform="translate(8, 26)">
            <rect width="102" height="48" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
            <text
              x="51"
              y="20"
              textAnchor="middle"
              fill="#0A0E17"
              fontSize="11"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              ChatGPT
            </text>
            <text
              x="51"
              y="36"
              textAnchor="middle"
              fill="#686D78"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              “Best vendor?”
            </text>
          </g>

          <g transform="translate(119, 26)">
            <rect width="102" height="48" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
            <text
              x="51"
              y="20"
              textAnchor="middle"
              fill="#0A0E17"
              fontSize="11"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              Gemini
            </text>
            <text
              x="51"
              y="36"
              textAnchor="middle"
              fill="#686D78"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              “True pricing?”
            </text>
          </g>

          <g transform="translate(230, 26)">
            <rect width="102" height="48" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
            <text
              x="51"
              y="20"
              textAnchor="middle"
              fill="#0A0E17"
              fontSize="11"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              Perplexity
            </text>
            <text
              x="51"
              y="36"
              textAnchor="middle"
              fill="#686D78"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              “Compare plans”
            </text>
          </g>

          {/* Vertical Inbound Tracks + Pulses */}
          <path
            d="M 59 74 C 59 100, 140 96, 140 120"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 170 74 L 170 120"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />
          <path
            d="M 281 74 C 281 100, 200 96, 200 120"
            fill="none"
            stroke="#DDD9CE"
            strokeWidth="1.25"
          />

          <path
            className="vs-signal-path"
            d="M 59 74 C 59 100, 140 96, 140 120"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-1"
            d="M 170 74 L 170 120"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            className="vs-signal-path vs-signal-path-delay-2"
            d="M 281 74 C 281 100, 200 96, 200 120"
            fill="none"
            stroke="#0A0E17"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Row 2: Center Verisource Truth Gate */}
          <g transform="translate(52, 120)">
            <rect
              className="vs-pulse-ring"
              x="-4"
              y="-4"
              width="244"
              height="66"
              rx="11"
              fill="none"
              stroke="#CFCBC0"
            />
            <rect width="236" height="58" rx="8" fill="#0A0E17" />
            <polygon
              points="30,17 41,29 30,41 19,29"
              fill="none"
              stroke="#FAF9F6"
              strokeWidth="1.5"
            />
            <circle cx="30" cy="29" r="2.5" fill="#A7F3D0" />
            <text
              x="52"
              y="26"
              fill="#FFFFFF"
              fontSize="9.8"
              fontFamily="var(--vs-mono)"
              fontWeight="700"
              letterSpacing="0.04em"
            >
              2. VERISOURCE TRUTH GATE
            </text>
            <text
              x="52"
              y="42"
              fill="#A3A8B4"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              Checks prices · 1-click AI fix
            </text>
          </g>

          {/* Vertical Outbound Tracks */}
          <path
            d="M 136 178 C 136 202, 86 200, 86 222"
            fill="none"
            stroke="#FECACA"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <path
            d="M 204 178 C 204 202, 254 200, 254 222"
            fill="none"
            stroke="#A7F3D0"
            strokeWidth="1.5"
          />
          <path
            className="vs-signal-path-out"
            d="M 204 178 C 204 202, 254 200, 254 222"
            fill="none"
            stroke="#065F46"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Row 3: Outcome Pair */}
          <g transform="translate(8, 222)">
            <rect width="156" height="96" rx="6" fill="#FEF2F2" stroke="#FECACA" />
            <text
              x="11"
              y="20"
              fill="#991B1B"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
              fontWeight="700"
            >
              ✕ FLAGGED CLAIM
            </text>
            <text
              x="11"
              y="40"
              fill="#0A0E17"
              fontSize="10.2"
              fontFamily="var(--vs-sans)"
              fontWeight="600"
              textDecoration="line-through"
            >
              “$19/mo unlimited”
            </text>
            <text
              x="11"
              y="60"
              fill="#991B1B"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              Wrong price caught
            </text>
            <text
              x="11"
              y="76"
              fill="#991B1B"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              before buyers bounce
            </text>
          </g>

          <g transform="translate(176, 222)">
            <rect width="156" height="96" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
            <text
              x="11"
              y="20"
              fill="#065F46"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
              fontWeight="700"
            >
              ✓ PUBLISHED FIX
            </text>
            <text
              x="11"
              y="40"
              fill="#0A0E17"
              fontSize="10.2"
              fontFamily="var(--vs-sans)"
              fontWeight="700"
            >
              True $49/mo+ Tiers
            </text>
            <text
              x="11"
              y="60"
              fill="#065F46"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              JSON-LD + /agents.md
            </text>
            <text
              x="11"
              y="76"
              fill="#3A3F4B"
              fontSize="8.8"
              fontFamily="var(--vs-mono)"
            >
              48 → 91 / 100 score
            </text>
          </g>
        </svg>
      </div>

        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--vs-border)',
            background: 'var(--vs-surface-warm)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px 10px',
            fontSize: '11.5px',
            color: 'var(--vs-ink-secondary)',
          }}
        >
          <span>
            <strong>Guided Mode</strong> (no coding) +{' '}
            <strong className="vs-mono">Pro /mcp Mode</strong> · 7 CMS platforms
          </span>
          <span
            className="vs-mono"
            style={{ fontSize: '11px', color: 'var(--vs-ink-muted)', whiteSpace: 'nowrap' }}
          >
            SVG · 0 ms lag
          </span>
        </div>
      </div>
    </div>
  );
}
