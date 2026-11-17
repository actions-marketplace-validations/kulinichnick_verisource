'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import {
  getAllCmsStarterTemplates,
  type WebsitePlatformId,
} from '@verisource/core-geo';
import { CodeArtifactCard, StatusBadge } from '@verisource/ui';

export function CmsTemplatesExplorerClient(): React.ReactElement {
  const templates = getAllCmsStarterTemplates();
  const [selectedPlatform, setSelectedPlatform] =
    useState<WebsitePlatformId>('shopify');

  const active =
    templates.find((t) => t.platformId === selectedPlatform) ?? templates[0]!;

  return (
    <div style={{ marginBottom: '36px' }}>
      <div className="vs-bezel" style={{ marginBottom: '18px' }}>
        <div
          className="vs-card"
          style={{
            padding: '18px 20px',
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
              INTERACTIVE 7-PLATFORM STARTER PACK
            </div>
            <strong style={{ fontSize: '16px' }}>
              Select your website platform to copy verified starter templates
            </strong>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <StatusBadge tone="pass">{active.deploymentBadge}</StatusBadge>
            <Link
              href={`/tools/${active.validatorToolSlug}`}
              className="vs-btn vs-btn-secondary"
              style={{ padding: '5px 11px', fontSize: '12px' }}
            >
              Test Live Site Validator →
            </Link>
          </div>
        </div>

        <div
          role="group"
          aria-label="Website platform template selector"
          className="vs-pill-group"
          style={{ marginBottom: '12px' }}
        >
          {templates.map((item) => {
            const isSelected = item.platformId === active.platformId;
            return (
              <button
                key={item.platformId}
                type="button"
                className="vs-pill-btn"
                data-active={isSelected ? 'true' : 'false'}
                onClick={() => setSelectedPlatform(item.platformId)}
              >
                {item.shortPillLabel}
              </button>
            );
          })}
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
          <strong style={{ color: 'var(--vs-ink)' }}>
            Where to publish on {active.platformLabel}:
          </strong>{' '}
          {active.whereToPublish}
        </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <CodeArtifactCard
          title={active.primaryArtifactTitle}
          fileHint={active.primaryArtifactFileHint}
          code={active.primaryArtifact.content}
          qualityScore={active.primaryArtifact.score}
          qualityBreakdown={active.primaryArtifact.breakdown}
        />

        <CodeArtifactCard
          title={active.llmsArtifactTitle}
          fileHint={active.llmsArtifactFileHint}
          code={active.llmsArtifact.content}
          qualityScore={active.llmsArtifact.score}
          qualityBreakdown={active.llmsArtifact.breakdown}
        />

        <CodeArtifactCard
          title={active.headSnippetTitle}
          fileHint={active.headSnippetFileHint}
          code={active.headSnippetCode}
          statusBadge={{ label: 'HEAD DISCOVERY + JSON-LD', tone: 'pass' }}
        />
      </div>
    </div>
  );
}
