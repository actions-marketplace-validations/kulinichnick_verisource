'use client';

import React, { useEffect, useState } from 'react';

export function AuditViewTracker(props: {
  slug: string;
  domain: string;
  initialViews: number;
}): React.ReactElement {
  const [views, setViews] = useState<number>(props.initialViews);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((document as Document & { prerendering?: boolean }).prerendering) return;

    const storageKey = `vs_viewed_${props.slug}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, '1');
    } catch {
      // Proceed even if sessionStorage is restricted
    }

    let cancelled = false;
    void fetch('/api/audit-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: props.slug }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { counted?: boolean; views_count?: number } | null) => {
        if (!cancelled && json?.counted && typeof json.views_count === 'number') {
          setViews(json.views_count);
        }
      })
      .catch(() => {
        // Ignore offline/network telemetry failures
      });

    return () => {
      cancelled = true;
    };
  }, [props.slug]);

  return (
    <div
      className="vs-mono"
      style={{
        fontSize: '12.5px',
        color: 'var(--vs-ink-muted)',
        marginTop: '5px',
      }}
    >
      Website: {props.domain} · Views: {views}
    </div>
  );
}
