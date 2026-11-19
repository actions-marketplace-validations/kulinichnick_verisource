'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

const RESOURCE_MENU_ITEMS: ReadonlyArray<{
  href: string;
  label: string;
  sublabel: string;
}> = [
  {
    href: '/tutorial',
    label: 'Interactive 90s Tour',
    sublabel: 'Step-by-step live Console sandbox',
  },
  {
    href: '/scanner',
    label: 'VerisourceScan Spec',
    sublabel: 'Read-only bot & /robots.txt rules',
  },
  {
    href: '/reports',
    label: 'Live Domain Scorecards',
    sublabel: '390+ audited SaaS & Shopify sites',
  },
  {
    href: '/vs',
    label: 'Head-to-Head Domain X-Ray',
    sublabel: 'Compare any 2 domains over HTTP',
  },
  {
    href: '/benchmarks/ai-search-readiness-2026',
    label: '2026 AI Readiness Study',
    sublabel: '40-domain live HTTPS dataset',
  },
  {
    href: '/tools',
    label: 'Free Protocol Validators',
    sublabel: '/llms.txt, GPTBot WAF & Shopify UCP',
  },
  {
    href: '/templates',
    label: '7-CMS Starter Templates',
    sublabel: 'Copy-paste /agents.md & JSON-LD',
  },
  {
    href: '/connectors',
    label: 'WordPress & Shopify Bridges',
    sublabel: 'Plugin & OS 2.0 App Embed',
  },
  {
    href: '/compare',
    label: 'Platform Comparisons',
    sublabel: 'vs. Profound, Otterly, Peec & AthenaHQ',
  },
  {
    href: '/guides',
    label: 'Engineering Setup Guides',
    sublabel: 'Shopify UCP & /ai-facts specs',
  },
  {
    href: '/partners',
    label: '25% Partner Program',
    sublabel: 'Recurring Stripe referral payouts',
  },
];

export function SiteHeaderClient(): React.ReactElement {
  const pathname = usePathname() ?? '/';
  const isConsoleRoute =
    pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isAuthRoute = pathname === '/login' || pathname.startsWith('/login/');

  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    if (dropdownRef.current) {
      dropdownRef.current.open = false;
    }
  }, [pathname]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      if (
        dropdownRef.current?.open &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        dropdownRef.current.open = false;
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header
      className="vs-site-chrome"
      style={{
        background: 'rgba(14, 17, 22, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--vs-border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        maxWidth: '100%',
      }}
    >
      <div className="vs-container vs-header-inner">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: 0,
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: 'var(--vs-ink)',
              fontWeight: 700,
              fontSize: '16px',
              letterSpacing: '-0.03em',
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
                width: '21px',
                height: '21px',
                background: 'var(--vs-accent)',
                borderRadius: '5px',
                flexShrink: 0,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.35)',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  transform: 'rotate(45deg)',
                  border: '1.8px solid #161004',
                }}
              />
            </span>
            verisource
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
              className="vs-badge vs-header-mcp-pill"
              style={{ textDecoration: 'none' }}
              title="1-Click Claude/ChatGPT OAuth, IDE /mcp & Hosted Brand /mcp + Chrome WebMCP"
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
          <>
            <nav
              className="vs-nav-links vs-desktop-nav"
              aria-label="Primary navigation"
            >
              <Link href="/features" className="vs-nav-link">
                All Tools
              </Link>
              <Link href="/#scan" className="vs-nav-link">
                Scan Your Site
              </Link>

              <details ref={dropdownRef} className="vs-nav-dropdown">
                <summary className="vs-nav-link">Resources ▾</summary>
                <div className="vs-nav-dropdown-panel">
                  {RESOURCE_MENU_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="vs-nav-dropdown-item"
                      onClick={() => {
                        if (dropdownRef.current) {
                          dropdownRef.current.open = false;
                        }
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--vs-ink-muted)',
                        }}
                      >
                        {item.sublabel}
                      </div>
                    </Link>
                  ))}
                </div>
              </details>

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

            <div className="vs-mobile-header-actions">
              <Link
                href="/#grader"
                className="vs-btn"
                style={{ padding: '7px 11px', fontSize: '12px' }}
              >
                Audit Site →
              </Link>
              <button
                type="button"
                className="vs-pill-btn vs-pill-btn-sm"
                data-active={mobileOpen ? 'true' : 'false'}
                aria-expanded={mobileOpen}
                aria-label="Toggle site navigation menu"
                onClick={() => setMobileOpen((prev) => !prev)}
              >
                {mobileOpen ? '✕ Close' : 'Menu'}
              </button>
            </div>
          </>
        )}
      </div>

      {!isConsoleRoute && !isAuthRoute && (
        <div
          className="vs-mobile-nav-drawer"
          data-open={mobileOpen ? 'true' : 'false'}
        >
          <div className="vs-container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {[
                { href: '/features', label: 'Explore All Tools' },
                { href: '/tutorial', label: 'Interactive Tour' },
                { href: '/pricing', label: 'Pricing & Plans' },
                { href: '/agencies', label: 'Agencies ($249/mo)' },
                { href: '/mcp-guide', label: 'Developers (/mcp)' },
                {
                  href: '/benchmarks/ai-search-readiness-2026',
                  label: '2026 Readiness Study',
                },
                { href: '/tools', label: 'Free Validators' },
                { href: '/templates', label: '7-CMS Templates' },
                { href: '/connectors', label: 'WP & Shopify Bridges' },
                { href: '/compare', label: 'Platform Comparisons' },
                { href: '/partners', label: '25% Partner Hub' },
              ].map((navItem) => (
                <Link
                  key={navItem.href}
                  href={navItem.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    padding: '9px 11px',
                    borderRadius: '6px',
                    border: '1px solid var(--vs-border)',
                    background: 'var(--vs-surface-warm)',
                    color: 'var(--vs-ink)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {navItem.label}
                </Link>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                href="/dashboard"
                className="vs-btn vs-btn-secondary"
                style={{ flex: 1, padding: '9px 12px', fontSize: '12.5px' }}
                onClick={() => setMobileOpen(false)}
              >
                Subscriber Sign In
              </Link>
              <Link
                href="/#grader"
                className="vs-btn"
                style={{ flex: 1, padding: '9px 12px', fontSize: '12.5px' }}
                onClick={() => setMobileOpen(false)}
              >
                Audit Your Site →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
