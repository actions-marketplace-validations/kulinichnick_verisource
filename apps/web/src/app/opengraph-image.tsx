import { ImageResponse } from 'next/og';

export const alt =
  'Verisource — B2B Generative Engine Optimization, Site Verification & Streamable HTTP MCP Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0E1116',
          padding: '52px 60px',
          color: '#EEF1F6',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Masthead */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#E5A93C',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
              >
                <path
                  d="M10 3.2L16.8 10L10 16.8L3.2 10L10 3.2Z"
                  fill="none"
                  stroke="#161004"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: '23px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: '#EEF1F6',
              }}
            >
              verisource
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 14px',
              backgroundColor: '#171C26',
              border: '1px solid #364156',
              borderRadius: '7px',
              fontSize: '16px',
              color: '#E5A93C',
              fontWeight: 600,
            }}
          >
            https://mcp.verisource.dev/mcp
          </div>
        </div>

        {/* Hero Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '52px',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              maxWidth: '1040px',
            }}
          >
            <span>AI answers buyers about your brand.</span>
            <span style={{ color: '#E5A93C' }}>
              Verisource checks—and ships the fix.
            </span>
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#B4BCC9',
              lineHeight: 1.42,
              maxWidth: '960px',
            }}
          >
            Multi-engine Share-of-Voice, pricing hallucination alerts, multi-page
            site health checks, and 1-click JSON-LD + /agents.md remediation.
          </div>
        </div>

        {/* 3-Column Protocol Strip */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            backgroundColor: '#171C26',
            border: '1px solid #262E3D',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '22px 26px',
              borderRight: '1px solid #262E3D',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#E5A93C',
                letterSpacing: '0.05em',
              }}
            >
              01 · CRAWLER &amp; CLAIM WATCHDOG
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#EEF1F6' }}>
              GPTBot · PerplexityBot · Site Health
            </span>
            <span style={{ fontSize: '15px', color: '#848E9F' }}>
              Flags 403 blocks, broken links &amp; false prices
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '22px 26px',
              borderRight: '1px solid #262E3D',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#6EE7B7',
                letterSpacing: '0.05em',
              }}
            >
              02 · SCHEMA &amp; FACT VERIFIED
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#EEF1F6' }}>
              JSON-LD · /llms.txt · /agents.md
            </span>
            <span style={{ fontSize: '15px', color: '#848E9F' }}>
              1-click prompt, CLI verifier &amp; Liquid overrides
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '22px 26px',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#93C5FD',
                letterSpacing: '0.05em',
              }}
            >
              03 · MONETIZED /MCP &amp; CLI
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#EEF1F6' }}>
              Claude · Cursor · Antigravity
            </span>
            <span style={{ fontSize: '15px', color: '#848E9F' }}>
              Streamable HTTP /mcp &amp; 60s Agency Pitch Links
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
