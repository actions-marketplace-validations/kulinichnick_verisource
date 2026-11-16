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
        <div className="vs-container">
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
              fontSize: 'clamp(30px, 3.8vw, 43px)',
              lineHeight: 1.09,
              letterSpacing: '-0.03em',
              fontWeight: 700,
              margin: '0 0 14px 0',
              maxWidth: '860px',
            }}
          >
            Drop-in WordPress &amp; Shopify OS 2.0 connector bridges.
          </h1>

          <p
            style={{
              fontSize: '15.5px',
              lineHeight: 1.6,
              color: 'var(--vs-ink-secondary)',
              margin: 0,
              maxWidth: '760px',
            }}
          >
            Managed WordPress hosts often block SFTP root uploads, and Shopify
            theme updates can overwrite manual{' '}
            <code className="vs-mono">theme.liquid</code> edits. Use our
            single-file WordPress plugin or Online Store 2.0 Theme App Embed to
            keep <code className="vs-mono">/llms.txt</code>,{' '}
            <code className="vs-mono">/agents.md</code>, and{' '}
            <code className="vs-mono">schema.org</code>{' '}
            <code className="vs-mono">JSON-LD</code> live across upgrades.
          </p>
        </div>
      </section>

      <div className="vs-container">
        <ConnectorBridgesClient />

        {/* Server-Rendered Connector Comparison Matrix */}
        <div className="vs-card" style={{ marginBottom: '36px', overflow: 'hidden' }}>
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

        <GtmDomainScanHandoff />
      </div>
    </div>
  );
}
