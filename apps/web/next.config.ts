import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@verisource/core-geo', '@verisource/ui'],
};

export default nextConfig;
