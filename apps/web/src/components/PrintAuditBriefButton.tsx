'use client';

import React, { useState } from 'react';

function firePdfExportBeacon(slug?: string): void {
  if (!slug || typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify({
      slug,
      event_type: 'pdf_export',
    });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/audit-view', blob);
    } else {
      void fetch('/api/audit-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Never block printing or brief export on telemetry errors
  }
}

export function PrintAuditBriefButton(props?: {
  slug?: string;
  exportFilename?: string;
  exportMarkdown?: string;
  showMarkdownDownload?: boolean;
}): React.ReactElement {
  const [downloaded, setDownloaded] = useState(false);

  function handlePrint(): void {
    firePdfExportBeacon(props?.slug);
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  function handleDownloadMarkdown(): void {
    if (!props?.exportMarkdown || typeof window === 'undefined') return;
    firePdfExportBeacon(props.slug);
    try {
      const blob = new Blob([props.exportMarkdown], {
        type: 'text/markdown;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = props.exportFilename || 'executive-ai-audit-brief.md';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2200);
    } catch {
      // Ignore restricted blob download contexts
    }
  }

  return (
    <>
      {props?.showMarkdownDownload && props?.exportMarkdown ? (
        <button
          type="button"
          onClick={handleDownloadMarkdown}
          className="vs-btn vs-btn-secondary vs-no-print"
          title="Download stakeholder-ready Executive Brief (.md) for Slack, Notion, or internal handoff"
        >
          {downloaded ? '✓ Brief Saved' : '↓ Brief (.md)'}
        </button>
      ) : null}
      <button
        type="button"
        onClick={handlePrint}
        className="vs-btn vs-btn-secondary vs-no-print"
      >
        Print / Save PDF
      </button>
    </>
  );
}
