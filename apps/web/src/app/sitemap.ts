import type { MetadataRoute } from 'next';
import {
  COMPETITOR_ALTERNATIVES,
  FREE_SEO_TOOLS,
  PROTOCOL_GUIDES,
} from '../lib/gtm-content';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: 'https://verisource.dev',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://verisource.dev/pricing',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://verisource.dev/tutorial',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://verisource.dev/agencies',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://verisource.dev/mcp-guide',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://verisource.dev/sample-audit',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://verisource.dev/compare',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.88,
    },
    ...COMPETITOR_ALTERNATIVES.map((item) => ({
      url: `https://verisource.dev/compare/${item.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    {
      url: 'https://verisource.dev/guides',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: 'https://verisource.dev/templates',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.88,
    },
    ...PROTOCOL_GUIDES.map((item) => ({
      url: `https://verisource.dev/guides/${item.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    {
      url: 'https://verisource.dev/tools',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.88,
    },
    ...FREE_SEO_TOOLS.map((item) => ({
      url: `https://verisource.dev/tools/${item.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    {
      url: 'https://verisource.dev/llms.txt',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://verisource.dev/agents.md',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://verisource.dev/login',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://verisource.dev/privacy',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://verisource.dev/terms',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
