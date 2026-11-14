import { ImageResponse } from 'next/og';

export const alt =
  'Verisource — B2B Generative Engine Optimization & Streamable HTTP MCP Platform';
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
          backgroundColor: '#FAF9F6',
          padding: '52px 60px',
          color: '#0A0E17',
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
                width: '28px',
                height: '28px',
                backgroundColor: '#0A0E17',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              V
            </div>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              VERISOURCE
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CFCBC0',
              borderRadius: '6px',
              fontSize: '16px',
              color: '#3A3F4B',
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
              fontSize: '54px',
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              maxWidth: '1020px',
            }}
          >
            Audit AI Citations, Stop Pricing Hallucinations &amp; Ship Verified
            Schema Fixes.
          </div>
          <div
            style={{
              fontSize: '23px',
              color: '#475569',
              lineHeight: 1.4,
              maxWidth: '960px',
            }}
          >
            Read-write GEO engine for ChatGPT, Gemini, and Perplexity — with
            Shopify /api/ucp/mcp detection and stateless Streamable HTTP tools.
          </div>
        </div>

        {/* 3-Column Protocol Strip */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '22px 26px',
              borderRight: '1px solid #E2E8F0',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.05em',
              }}
            >
              01 · CRAWLER &amp; CLAIM WATCHDOG
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700 }}>
              GPTBot · OAI-SearchBot · PerplexityBot
            </span>
            <span style={{ fontSize: '15px', color: '#475569' }}>
              Flags 403 WAF blocks &amp; false SKU/pricing claims
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '22px 26px',
              borderRight: '1px solid #E2E8F0',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#065F46',
                letterSpacing: '0.05em',
              }}
            >
              02 · &gt;= 9.5/10 QUALITY CRITIC
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700 }}>
              JSON-LD · /llms.txt · /agents.md
            </span>
            <span style={{ fontSize: '15px', color: '#475569' }}>
              Syntax-verified schema &amp; Liquid overrides
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
                color: '#64748B',
                letterSpacing: '0.05em',
              }}
            >
              03 · MONETIZED /MCP ENGINE
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700 }}>
              Claude · Cursor · Antigravity
            </span>
            <span style={{ fontSize: '15px', color: '#475569' }}>
              SHA-256 vs_live_ Bearer &amp; 60s Pitch Links
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
