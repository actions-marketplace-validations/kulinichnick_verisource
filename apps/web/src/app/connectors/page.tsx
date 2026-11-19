import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import { StatusBadge } from '@verisource/ui';
import { ConnectorBridgesClient } from '../../components/ConnectorBridgesClient';
import { GtmDomainScanHandoff } from '../../components/GtmDomainScanHandoff';

export const metadata: Metadata = {
  title:
    'WordPress Plugin & Shopify OS 2.0 Theme App Connector Bridges | Verisource',
  description:
    'Download the single-file WordPress GEO connector plugin (verisource-geo-connector.php) for virtual HTTP 200 /llms.txt and /agents.md routing, or deploy the Shopify Online Store 2.0 Theme App Embed block alongside /api/ucp/mcp.',
  alternates: {
    canonical: 'https://verisource.dev/connectors',
  },
};

const CONNECTORS_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: 'Verisource WordPress & Shopify OS 2.0 GEO Connector Bridges',
  url: 'https://verisource.dev/connectors',
  codeRepository: 'https://github.com/kulinichnick/verisource',
  programmingLanguage: ['PHP', 'Liquid'],
  description:
    'Drop-in WordPress plugin (verisource-geo-connector.php) and Shopify Online Store 2.0 Theme App Extension (blocks/verisource-ai-truth.liquid) for deploying /llms.txt, /agents.md, and schema.org JSON-LD.',
};

const CONNECTORS_FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the Verisource WordPress plugin serve /llms.txt and /agents.md without FTP access?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'verisource-geo-connector.php hooks WordPress init at priority 1, intercepts exact GET requests to /llms.txt and /agents.md, and returns HTTP 200 text/plain and text/markdown payloads stored in wp_options alongside wp_head JSON-LD and alternate discovery tags.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why use a Shopify Online Store 2.0 App Embed block instead of editing theme.liquid directly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Theme App Embed blocks (blocks/verisource-ai-truth.liquid) survive Dawn and premium theme version upgrades without manual code merges, injecting OnlineStore + MerchantReturnPolicy JSON-LD and /pages/ai-facts discovery links alongside /api/ucp/mcp.',
      },
    },
  ],
};

export default function ConnectorsPage(): React.ReactElement {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(CONNECTORS_JSON_LD),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(CONNECTORS_FAQ_JSON_LD),
        }}
      />

      <section
        className="vs-arch-backdrop"
        style={{
          borderBottom: '1px solid var(--vs-border)',
          padding: '44px 0 46px 0',
          marginBottom: '36px',
        }}
      >
        <div className="vs-container vs-hero-grid">
          <div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              <StatusBadge tone="pass">
                WORDPRESS PLUGIN + SHOPIFY OS 2.0 EMBED
              </StatusBadge>
              <StatusBadge>HTTP 200 /LLMS.TXT · /AGENTS.MD · JSON-LD</StatusBadge>
            </div>

            <h1
              style={{
                fontSize: 'clamp(30px, 3.8vw, 42px)',
                lineHeight: 1.09,
                letterSpacing: '-0.03em',
                fontWeight: 700,
                margin: '0 0 14px 0',
              }}
            >
              Drop-in WordPress &amp; Shopify OS 2.0 connector bridges.
            </h1>

            <p
              style={{
                fontSize: '15.5px',
                lineHeight: 1.6,
                color: 'var(--vs-ink-secondary)',
                margin: '0 0 20px 0',
                maxWidth: '580px',
              }}
            >
              Managed WordPress hosts often block SFTP root uploads, and Shopify
              theme updates can overwrite manual{' '}
              <code className="vs-mono">theme.liquid</code> edits. Use our
              single-file WordPress plugin, Online Store 2.0 Theme App Embed, or
              2-line <strong>Hosted Brand /mcp + Chrome WebMCP</strong> snippet
              to keep <code className="vs-mono">/llms.txt</code>,{' '}
              <code className="vs-mono">/agents.md</code>,{' '}
              <code className="vs-mono">JSON-LD</code>, and your site&rsquo;s
              live <code className="vs-mono">/mcp</code> agent endpoint active
              across upgrades.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a href="/api/connectors/wordpress" className="vs-btn">
                ↓ Download WordPress Plugin (.php)
              </a>
              <Link href="/templates" className="vs-btn vs-btn-secondary">
                Browse 7-CMS Templates →
              </Link>
            </div>
          </div>

          {/* Dual-Orientation Motion SVG Connector Bridge Diagram */}
          <div className="vs-bezel">
            <div className="vs-card" style={{ overflow: 'hidden' }}>
              <div className="vs-schematic-header">
                <span className="vs-eyebrow" style={{ fontSize: '10.5px' }}>
                  FIG 05 · UPGRADE-SAFE CMS PROTOCOL BRIDGES
                </span>
                <span
                  className="vs-mono"
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--vs-pass-fg)',
                    fontWeight: 600,
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
                  ZERO SFTP REQUIRED
                </span>
              </div>

              <div style={{ padding: '14px 12px', background: '#FFFFFF' }}>
                <svg
                  className="vs-schematic-desktop"
                  viewBox="0 0 500 220"
                  width="100%"
                  role="img"
                  aria-label="Motion diagram showing WordPress wp_options plugin and Shopify OS 2.0 App Embed serving HTTP 200 /llms.txt, /agents.md, and JSON-LD."
                >
                  <path d="M 164 68 C 190 68, 190 110, 214 110" fill="none" stroke="#DDD9CE" strokeWidth="1.5" />
                  <path d="M 164 152 C 190 152, 190 110, 214 110" fill="none" stroke="#DDD9CE" strokeWidth="1.5" />
                  <path className="vs-signal-path" d="M 164 68 C 190 68, 190 110, 214 110" fill="none" stroke="#0A0E17" strokeWidth="2" />
                  <path className="vs-signal-path vs-signal-path-delay-1" d="M 164 152 C 190 152, 190 110, 214 110" fill="none" stroke="#0A0E17" strokeWidth="2" />

                  <path d="M 330 110 L 358 110" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                  <path className="vs-signal-path-out" d="M 330 110 L 358 110" fill="none" stroke="#059669" strokeWidth="2.6" />

                  <g transform="translate(10, 42)">
                    <rect width="154" height="52" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <circle className="vs-live-dot" cx="14" cy="20" r="3.2" fill="#0A0E17" />
                    <text x="24" y="23" fill="#0A0E17" fontSize="10.2" fontFamily="var(--vs-sans)" fontWeight="700">
                      WordPress 6.0+
                    </text>
                    <text x="14" y="40" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      1-file .php · wp_options
                    </text>
                  </g>

                  <g transform="translate(10, 126)">
                    <rect width="154" height="52" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <circle className="vs-live-dot" cx="14" cy="20" r="3.2" fill="#0A0E17" />
                    <text x="24" y="23" fill="#0A0E17" fontSize="10.2" fontFamily="var(--vs-sans)" fontWeight="700">
                      Shopify OS 2.0
                    </text>
                    <text x="14" y="40" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      App Embed + UCP /mcp
                    </text>
                  </g>

                  <g transform="translate(214, 66)">
                    <rect className="vs-pulse-ring" x="-5" y="-5" width="126" height="98" rx="11" fill="none" stroke="#059669" />
                    <rect width="116" height="88" rx="8" fill="#0A0E17" />
                    <circle className="vs-live-dot" cx="58" cy="22" r="3.5" fill="#34D399" />
                    <text x="58" y="46" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontFamily="var(--vs-mono)" fontWeight="700">
                      BRIDGE ROUTER
                    </text>
                    <text x="58" y="64" textAnchor="middle" fill="#34D399" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Survives theme
                    </text>
                    <text x="58" y="77" textAnchor="middle" fill="#A3A8B4" fontSize="8.5" fontFamily="var(--vs-mono)">
                      &amp; host updates
                    </text>
                  </g>

                  <g transform="translate(358, 62)">
                    <rect width="132" height="96" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="11" y="22" fill="#065F46" fontSize="9" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ HTTP 200 LIVE
                    </text>
                    <text x="11" y="42" fill="#0A0E17" fontSize="9.2" fontFamily="var(--vs-mono)">
                      • /llms.txt (200)
                    </text>
                    <text x="11" y="59" fill="#0A0E17" fontSize="9.2" fontFamily="var(--vs-mono)">
                      • /agents.md (200)
                    </text>
                    <text x="11" y="76" fill="#065F46" fontSize="9" fontFamily="var(--vs-mono)" fontWeight="600">
                      • head JSON-LD
                    </text>
                  </g>
                </svg>

                <svg
                  className="vs-schematic-mobile"
                  viewBox="0 0 320 148"
                  width="100%"
                  role="img"
                  aria-label="Mobile diagram showing WordPress and Shopify connectors serving HTTP 200 protocol routes."
                >
                  <g transform="translate(6, 8)">
                    <rect width="308" height="44" rx="6" fill="#FAF9F6" stroke="#CFCBC0" />
                    <text x="154" y="20" textAnchor="middle" fill="#0A0E17" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="700">
                      1. WORDPRESS .PHP OR SHOPIFY OS 2.0 EMBED
                    </text>
                    <text x="154" y="35" textAnchor="middle" fill="#686D78" fontSize="8.8" fontFamily="var(--vs-mono)">
                      Zero SFTP or theme merge conflicts
                    </text>
                  </g>
                  <path d="M 160 52 L 160 72" fill="none" stroke="#A7F3D0" strokeWidth="2" />
                  <path className="vs-signal-path-out" d="M 160 52 L 160 72" fill="none" stroke="#059669" strokeWidth="2.4" />
                  <g transform="translate(6, 72)">
                    <rect width="308" height="68" rx="7" fill="#ECFDF5" stroke="#A7F3D0" />
                    <text x="16" y="24" fill="#065F46" fontSize="10" fontFamily="var(--vs-mono)" fontWeight="700">
                      ✓ HTTP 200 /LLMS.TXT · /AGENTS.MD · JSON-LD
                    </text>
                    <text x="16" y="45" fill="#0A0E17" fontSize="9" fontFamily="var(--vs-mono)">
                      Persists cleanly across Dawn &amp; WordPress updates
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="vs-container">
        <ConnectorBridgesClient />

        {/* Server-Rendered Connector Comparison Matrix */}
        <div className="vs-bezel" style={{ marginBottom: '36px' }}>
          <div className="vs-card" style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--vs-border)',
              background: 'var(--vs-surface-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <strong style={{ fontSize: '14px' }}>
              Connector Bridge Architecture Matrix
            </strong>
            <Link
              href="/templates"
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--vs-ink)',
                textDecoration: 'none',
              }}
            >
              Using Webflow, Wix, Squarespace, Framer, or Next.js? View 7-CMS
              Templates →
            </Link>
          </div>

          <div className="vs-table-wrap">
            <table className="vs-table">
            <thead>
              <tr>
                <th>Connector Bridge</th>
                <th>Target Runtime</th>
                <th>Protocol Endpoints Exposed</th>
                <th>Upgrade Persistence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>verisource-geo-connector.php</strong>
                </td>
                <td className="vs-mono">WordPress 6.0+ · PHP 7.4+</td>
                <td className="vs-mono">
                  /llms.txt (200) · /agents.md (200) · wp_head JSON-LD
                </td>
                <td>Stored in wp_options across theme switches</td>
              </tr>
              <tr>
                <td>
                  <strong>blocks/verisource-ai-truth.liquid</strong>
                </td>
                <td className="vs-mono">Shopify Online Store 2.0</td>
                <td className="vs-mono">
                  OnlineStore + MerchantReturnPolicy JSON-LD · /pages/ai-facts
                </td>
                <td>Theme App Embed survives Dawn &amp; theme updates</td>
              </tr>
            </tbody>
            </table>
          </div>
          </div>
        </div>

        <GtmDomainScanHandoff />
      </div>
    </div>
  );
}
