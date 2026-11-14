'use client';

import React, { useEffect, useRef, useState } from 'react';

export function CopyAuditBriefButton(props: {
  slug: string;
}): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/audit/${props.slug}`
        : `https://verisource.dev/audit/${props.slug}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (typeof document !== 'undefined') {
        const temp = document.createElement('textarea');
        temp.value = shareUrl;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      setCopied(true);
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch {
      // Ignore clipboard permission errors in restricted contexts
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="vs-btn vs-btn-secondary vs-no-print"
    >
      {copied ? '✓ Link Copied' : 'Copy Brief Link'}
    </button>
  );
}
