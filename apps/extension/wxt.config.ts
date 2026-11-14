import { defineConfig } from 'wxt';

export default defineConfig({
  vite: () => ({
    esbuild: {
      jsx: 'automatic',
    },
  }),
  manifest: {
    name: 'Verisource — GEO & AI Citation Inspector',
    description:
      'Inspect AI visibility, hallucinations, and /agents.md readiness on any storefront or B2B site.',
    homepage_url: 'https://verisource.dev',
    permissions: ['sidePanel', 'activeTab'],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: 'Open Verisource GEO Side Panel',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        128: 'icon/128.png',
      },
    },
  },
});
