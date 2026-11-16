'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { StatusBadge } from '@verisource/ui';

type AuthMethod = 'magic_link' | 'password';

function buildNextDashboardHref(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const urlParams = new URLSearchParams(window.location.search);
  const nextParams = new URLSearchParams();
  for (const key of [
    'domain',
    'tab',
    'env',
    'upgraded',
    'trial',
    'credit_applied',
  ]) {
    const val = urlParams.get(key);
    if (val) nextParams.set(key, val);
  }
  const suffix = nextParams.toString() ? `?${nextParams.toString()}` : '';
  return `/dashboard${suffix}`;
}

export default function LoginPage(): React.ReactElement {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('magic_link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasLiveAuth = Boolean(supabaseUrl && supabaseAnonKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const nextHref = buildNextDashboardHref();

    if (!hasLiveAuth) {
      document.cookie = 'vs_mock_session=owner; Path=/; SameSite=Lax';
      window.location.href = nextHref;
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

      if (authMethod === 'password') {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
        if (signInError || !signInData.session) {
          setError(
            signInError?.message ??
              'Invalid email or password. Use Magic Link if you have not set a password yet.'
          );
        } else {
          document.cookie = `vs_access_token=${encodeURIComponent(
            signInData.session.access_token
          )}; Path=/; Max-Age=604800; SameSite=Lax`;
          window.location.href = nextHref;
        }
        return;
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}${nextHref}`,
        },
      });
      if (otpError) {
        setError(otpError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError('Unable to authenticate right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="vs-container"
      style={{ paddingTop: '56px', paddingBottom: '56px', maxWidth: '480px' }}
    >
      <div className="vs-card" style={{ padding: '32px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <StatusBadge tone="pass">SUBSCRIBER ADMIN CONSOLE</StatusBadge>
          {!hasLiveAuth ? (
            <StatusBadge tone="warn">LOCAL DEV AUTH</StatusBadge>
          ) : null}
        </div>

        <h1
          style={{
            margin: '0 0 8px 0',
            fontSize: '25px',
            letterSpacing: '-0.025em',
          }}
        >
          Sign in to your Console
        </h1>
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '13.5px',
            lineHeight: 1.55,
            color: 'var(--vs-ink-secondary)',
          }}
        >
          Access your private 3-Step Admin Console, multi-engine citation
          tracking, 1-Click AI Fix Prompts, white-label client briefs, and{' '}
          <code className="vs-mono">/mcp</code> Bearer keys.
        </p>

        {hasLiveAuth ? (
          <div
            role="group"
            aria-label="Sign-in method"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              padding: '3px',
              borderRadius: '6px',
              border: '1px solid var(--vs-border)',
              background: 'var(--vs-surface-subtle)',
              marginBottom: '18px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMethod('magic_link');
                setError(null);
              }}
              style={{
                border: 'none',
                cursor: 'pointer',
                padding: '7px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                background:
                  authMethod === 'magic_link' ? 'var(--vs-ink)' : 'transparent',
                color:
                  authMethod === 'magic_link'
                    ? '#FFFFFF'
                    : 'var(--vs-ink-secondary)',
              }}
            >
              1-Click Email Link
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setSent(false);
                setError(null);
              }}
              style={{
                border: 'none',
                cursor: 'pointer',
                padding: '7px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                background:
                  authMethod === 'password' ? 'var(--vs-ink)' : 'transparent',
                color:
                  authMethod === 'password'
                    ? '#FFFFFF'
                    : 'var(--vs-ink-secondary)',
              }}
            >
              Email &amp; Password
            </button>
          </div>
        ) : null}

        {sent ? (
          <div
            style={{
              padding: '14px 16px',
              background: 'var(--vs-pass-bg)',
              border: '1px solid var(--vs-pass-border)',
              color: 'var(--vs-pass-fg)',
              borderRadius: '6px',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            Sent a one-click sign-in link to <strong>{email}</strong>. Click the
            link in your inbox to enter your Console workspace.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Subscriber or Agency Email
            </label>
            <input
              type="email"
              required={hasLiveAuth}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourcompany.com"
              className="vs-input"
              style={{ marginBottom: '12px', fontFamily: 'var(--vs-sans)' }}
            />

            {hasLiveAuth && authMethod === 'password' ? (
              <>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="vs-input"
                  style={{ marginBottom: '12px', fontFamily: 'var(--vs-sans)' }}
                />
              </>
            ) : null}

            {error ? (
              <div
                style={{
                  color: 'var(--vs-crit-fg)',
                  fontSize: '12.5px',
                  marginBottom: '12px',
                  padding: '8px 10px',
                  background: 'var(--vs-crit-bg)',
                  border: '1px solid var(--vs-crit-border)',
                  borderRadius: '5px',
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
                ? 'Authenticating...'
                : !hasLiveAuth
                  ? 'Enter Local Developer Console →'
                  : authMethod === 'password'
                    ? 'Sign In to Console →'
                    : 'Email Me a Sign-In Link →'}
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--vs-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <Link
            href="/pricing"
            className="vs-btn vs-btn-secondary"
            style={{ width: '100%', textAlign: 'center' }}
          >
            Need a Console Plan? Start 7-Day Free Trial ($0 Today) →
          </Link>
          <Link
            href="/#grader"
            style={{
              textAlign: 'center',
              fontSize: '12.5px',
              color: 'var(--vs-ink-secondary)',
              textDecoration: 'underline',
              marginTop: '4px',
            }}
          >
            Or run a free limited audit on your website first
          </Link>
        </div>
      </div>
    </div>
  );
}
