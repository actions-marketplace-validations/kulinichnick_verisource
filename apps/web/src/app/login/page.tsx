'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { StatusBadge } from '@verisource/ui';

export default function LoginPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasLiveAuth = Boolean(supabaseUrl && supabaseAnonKey);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!hasLiveAuth) {
      window.location.href = '/dashboard';
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (otpError) {
        setError(otpError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError('Unable to send sign-in link right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="vs-container"
      style={{ paddingTop: '64px', maxWidth: '460px' }}
    >
      <div className="vs-card" style={{ padding: '28px' }}>
        <div style={{ marginBottom: '16px' }}>
          <StatusBadge tone={hasLiveAuth ? 'pass' : 'warn'}>
            {hasLiveAuth ? 'SUPABASE AUTH LIVE' : 'LOCAL MOCK SESSION ACTIVE'}
          </StatusBadge>
        </div>

        <h1 style={{ margin: '0 0 8px 0', fontSize: '22px' }}>
          Sign in to Verisource
        </h1>
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '13.5px',
            color: 'var(--vs-ink-secondary)',
          }}
        >
          Access your 3-Tab GEO Console, Brand Truth Sheets, Agency Pitch URLs,
          and Paid <code className="vs-mono">/mcp</code> API keys.
        </p>

        {sent ? (
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--vs-pass-bg)',
              border: '1px solid var(--vs-pass-border)',
              color: 'var(--vs-pass-fg)',
              borderRadius: '5px',
              fontSize: '13px',
            }}
          >
            Check <strong>{email}</strong> for your magic sign-in link.
          </div>
        ) : (
          <form onSubmit={handleMagicLink}>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Work Email
            </label>
            <input
              type="email"
              required={hasLiveAuth}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@agency.com"
              className="vs-input"
              style={{ marginBottom: '12px' }}
            />
            {error ? (
              <div
                style={{
                  color: 'var(--vs-crit-fg)',
                  fontSize: '12.5px',
                  marginBottom: '10px',
                }}
              >
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="vs-btn"
              style={{ width: '100%' }}
            >
              {loading
                ? 'Sending Link...'
                : hasLiveAuth
                  ? 'Send Magic Sign-In Link'
                  : 'Continue with Email'}
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid var(--vs-border)',
          }}
        >
          <Link
            href="/dashboard"
            className="vs-btn vs-btn-secondary"
            style={{ width: '100%' }}
          >
            Open Patient Zero Demo Workspace →
          </Link>
        </div>
      </div>
    </div>
  );
}
