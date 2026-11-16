'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export function SiteHeaderClient(): React.ReactElement {
  const pathname = usePathname() ?? '/';
  const isConsoleRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isAuthRoute = pathname === '/login' || pathname.startsWith('/login/');

  return (
    <header
      className="vs-site-chrome"
      style={{
        background: '#FAF9F6',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--vs-border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div className="vs-container vs-header-inner">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: 'var(--vs-ink)',
              fontWeight: 700,
              fontSize: '15.5px',
              letterSpacing: '-0.025em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                background: 'var(--vs-ink)',
                borderRadius: '4px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  transform: 'rotate(45deg)',
                  border: '1.5px solid #FAF9F6',
                }}
              />
            </span>
            VERISOURCE
          </Link>

          {isConsoleRoute ? (
            <span
              className="vs-badge vs-badge-pass"
              title="Subscriber Admin Console"
            >
              ADMIN CONSOLE
            </span>
          ) : (
            <Link
              href="/mcp-guide"
              className="vs-badge"
              style={{ textDecoration: 'none' }}
              title="View 30-second Claude, Cursor, Windsurf & Antigravity setup guide"
            >
              mcp.verisource.dev/mcp
            </Link>
          )}
        </div>

        {isConsoleRoute ? (
          <nav className="vs-nav-links" aria-label="Console navigation">
            <Link href="/" className="vs-nav-link">
              ← Platform Overview
            </Link>
            <Link href="/mcp-guide" className="vs-nav-link">
              MCP Docs
            </Link>
            <Link href="/pricing" className="vs-nav-link">
              Plans &amp; Quotas
            </Link>
          </nav>
        ) : isAuthRoute ? (
          <nav className="vs-nav-links" aria-label="Sign-in navigation">
            <Link href="/" className="vs-nav-link">
              ← Back to Platform
            </Link>
            <Link href="/pricing" className="vs-nav-link">
              Pricing
            </Link>
            <Link href="/#grader" className="vs-btn">
              Free Site Audit →
            </Link>
          </nav>
        ) : (
          <nav className="vs-nav-links" aria-label="Primary navigation">
            <Link href="/#how-it-works" className="vs-nav-link">
              How It Works
            </Link>
            <Link href="/#platform" className="vs-nav-link">
              Inside Console
            </Link>
            <Link href="/agencies" className="vs-nav-link">
              Agencies
            </Link>
            <Link href="/mcp-guide" className="vs-nav-link">
              Developers (/mcp)
            </Link>
            <Link href="/pricing" className="vs-nav-link">
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className="vs-nav-link"
              style={{ fontWeight: 600, color: 'var(--vs-ink)' }}
            >
              Sign In
            </Link>
            <Link href="/#grader" className="vs-btn">
              Audit Your Site →
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
