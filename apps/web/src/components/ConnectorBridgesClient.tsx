'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import {
  buildShopifyThemeExtensionBundle,
  buildWordPressConnectorPluginPhp,
} from '@verisource/core-geo';
import { CodeArtifactCard, StatusBadge } from '@verisource/ui';

type ConnectorTarget = 'wordpress' | 'shopify';

export function ConnectorBridgesClient(): React.ReactElement {
  const [selected, setSelected] = useState<ConnectorTarget>('wordpress');
  const wpBundle = buildWordPressConnectorPluginPhp();
  const shopifyBundle = buildShopifyThemeExtensionBundle();

  return (
    <div style={{ marginBottom: '36px' }}>
      <div
        className="vs-card"
        style={{
          padding: '18px 20px',
          marginBottom: '18px',
          background: 'var(--vs-surface-warm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <div>
            <div className="vs-eyebrow" style={{ marginBottom: '4px' }}>
              DROP-IN CMS CONNECTOR BRIDGES · ZERO SFTP REQUIRED
            </div>
            <strong style={{ fontSize: '16px' }}>
              Select your CMS connector architecture
            </strong>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {selected === 'wordpress' ? (
              <a
                href="/api/connectors/wordpress"
                className="vs-btn"
                style={{ padding: '6px 12px', fontSize: '12.5px' }}
              >
                ↓ Download verisource-geo-connector.php
              </a>
            ) : (
              <Link
                href="/tools/shopify-ai-readiness-checker"
                className="vs-btn vs-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12.5px' }}
              >
                Test Store /api/ucp/mcp Live →
              </Link>
            )}
          </div>
        </div>

        <div
          role="group"
          aria-label="CMS connector bridge selector"
          className="vs-pill-group"
          style={{ marginBottom: '12px' }}
        >
          <button
            type="button"
            className="vs-pill-btn"
            data-active={selected === 'wordpress' ? 'true' : 'false'}
            onClick={() => setSelected('wordpress')}
          >
            WordPress Plugin (verisource-geo-connector.php)
          </button>
          <button
            type="button"
            className="vs-pill-btn"
            data-active={selected === 'shopify' ? 'true' : 'false'}
            onClick={() => setSelected('shopify')}
          >
            Shopify OS 2.0 Theme App Embed (verisource-ai-truth.liquid)
          </button>
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: '6px',
            background: 'var(--vs-surface)',
            border: '1px solid var(--vs-border)',
            fontSize: '13px',
            color: 'var(--vs-ink-secondary)',
            lineHeight: 1.55,
          }}
        >
          {selected === 'wordpress' ? (
            <span>
              <StatusBadge tone="pass">WORDPRESS 6.0+ · PHP 7.4+</StatusBadge>{' '}
              Serves virtual <code className="vs-mono">/llms.txt</code> and{' '}
              <code className="vs-mono">/agents.md</code> routes over HTTP{' '}
              <code className="vs-mono">200</code> directly from WordPress
              options—no SFTP root access or <code className="vs-mono">.htaccess</code>{' '}
              edits required.
            </span>
          ) : (
            <span>
              <StatusBadge tone="pass">ONLINE STORE 2.0 · UCP READY</StatusBadge>{' '}
              Injects validated <code className="vs-mono">OnlineStore</code> +{' '}
              <code className="vs-mono">MerchantReturnPolicy</code>{' '}
              <code className="vs-mono">JSON-LD</code> and{' '}
              <code className="vs-mono">&lt;link rel=&quot;alternate&quot;&gt;</code>{' '}
              discovery tags across theme upgrades alongside Shopify{' '}
              <code className="vs-mono">/api/ucp/mcp</code>.
            </span>
          )}
        </div>
      </div>

      {selected === 'wordpress' ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          <CodeArtifactCard
            title="verisource-geo-connector.php (Single-File WordPress Plugin)"
            fileHint="wp-content/plugins/verisource-geo-connector/verisource-geo-connector.php"
            plainSummary="Upload as a .zip in WP Admin -> Plugins -> Add New -> Upload Plugin, or place inside wp-content/plugins/."
            code={wpBundle.phpSource}
            qualityScore={9.8}
          />
          <CodeArtifactCard
            title="WordPress Deployment Checklist"
            fileHint="README.md"
            plainSummary="3-step setup and HTTP 200 verification"
            code={wpBundle.readmeNotes.content}
            qualityScore={wpBundle.readmeNotes.score}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          <CodeArtifactCard
            title={shopifyBundle.liquidBlockFilename}
            fileHint="extensions/verisource-ai-truth/blocks/verisource-ai-truth.liquid"
            plainSummary="Online Store 2.0 App Embed Block — schema.org MerchantReturnPolicy + /pages/ai-facts discovery"
            code={shopifyBundle.liquidBlockSource}
            qualityScore={9.8}
          />
          <CodeArtifactCard
            title="shopify.extension.toml"
            fileHint="extensions/verisource-ai-truth/shopify.extension.toml"
            plainSummary="Shopify CLI Theme App Extension manifest (api_version = 2026-01)"
            code={shopifyBundle.extensionToml}
            qualityScore={9.8}
          />
          <CodeArtifactCard
            title="Shopify Theme App Embed Setup Guide"
            fileHint="SHOPIFY_CONNECTOR_SETUP.md"
            plainSummary="Pairs with templates/agents.md.liquid & /api/ucp/mcp"
            code={shopifyBundle.setupGuide.content}
            qualityScore={shopifyBundle.setupGuide.score}
          />
        </div>
      )}
    </div>
  );
}
