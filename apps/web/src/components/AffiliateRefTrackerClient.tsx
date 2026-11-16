'use client';

import React, { useEffect } from 'react';
import {
  AFFILIATE_COOKIE_MAX_AGE_SECONDS,
  AFFILIATE_COOKIE_NAME,
  sanitizeAffiliateCode,
} from '@verisource/core-geo';

export function AffiliateRefTrackerClient(): React.ReactElement | null {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const rawRef = params.get('ref');
      if (!rawRef) return;
      const safeRef = sanitizeAffiliateCode(rawRef);
      if (!safeRef) return;
      const secureFlag =
        window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(
        safeRef
      )}; Path=/; Max-Age=${AFFILIATE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secureFlag}`;
    } catch {
      // Never block client hydration if cookies are disabled
    }
  }, []);

  return null;
}
