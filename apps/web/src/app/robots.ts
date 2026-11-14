import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          '*',
          'GPTBot',
          'OAI-SearchBot',
          'PerplexityBot',
          'ClaudeBot',
          'Google-Extended',
        ],
        allow: '/',
        disallow: ['/api/dashboard/', '/api/webhooks/'],
      },
    ],
    sitemap: 'https://verisource.dev/sitemap.xml',
    host: 'https://verisource.dev',
  };
}
