import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Sign In — Verisource Workspace Console',
  description:
    'Sign in to your Verisource GEO & Streamable HTTP /mcp workspace via 1-click magic link or password.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
