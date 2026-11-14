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
      const urlParams = new URLSearchParams(window.location.search);
      const nextParams = new URLSearchParams();
      const targetDomain = urlParams.get('domain');
      const targetTab = urlParams.get('tab');
      if (targetDomain) nextParams.set('domain', targetDomain);
      if (targetTab) nextParams.set('tab', targetTab);
      const nextSuffix = nextParams.toString()
        ? `?${nextParams.toString()}`
        : '';

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard${nextSuffix}`,
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
      <div className="vs-card" style={{ padding: '30px' }}>
        <div style={{ marginBottom: '16px' }}>
          <StatusBadge tone={hasLiveAuth ? 'pass' : 'warn'}>
            {hasLiveAuth ? 'PASSWORDLESS SIGN-IN' : 'LOCAL DEMO SESSION'}
          </StatusBadge>
        </div>

        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', letterSpacing: '-0.025em' }}>
          Sign in to Verisource
        </h1>
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '13.5px',
            color: 'var(--vs-ink-secondary)',
          }}
        >
          Open your Guided or Pro 3-Tab Console, website fixes, branded client
          reports, and <code className="vs-mono">/mcp</code> sync keys.
        </p>

        {sent ? (
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--vs-pass-bg)',
              border: '1px solid var(--vs-pass-border)',
              color: 'var(--vs-pass-fg)',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          >
            Check <strong>{email}</strong> for your one-click sign-in link.
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
              placeholder="you@company.com"
              className="vs-input"
              style={{ marginBottom: '12px', fontFamily: 'var(--vs-sans)' }}
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
                  ? 'Email Me a Sign-In Link'
                  : 'Continue to Console'}
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
            Explore Live Demo Workspace →
          </Link>
        </div>
      </div>
    </div>
  );
}
