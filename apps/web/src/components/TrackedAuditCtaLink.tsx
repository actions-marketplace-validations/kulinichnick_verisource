'use client';

import React from 'react';

export function TrackedAuditCtaLink(props: {
  slug: string;
  href: string;
  brandColor: string;
  children: React.ReactNode;
}): React.ReactElement {
  const isExternal = props.href.startsWith('http');

  function handleClick() {
    try {
      const payload = JSON.stringify({
        slug: props.slug,
        event_type: 'cta_click',
      });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/audit-view', blob);
        return;
      }
      void fetch('/api/audit-view', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => {});
    } catch {
      // Never block outbound booking CTA navigation
    }
  }

  return (
    <a
      href={props.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      className="vs-btn"
      style={{
        background: props.brandColor,
        borderColor: props.brandColor,
      }}
    >
      {props.children}
    </a>
  );
}
