import type { MetadataRoute } from 'next';
import {
  COMPETITOR_ALTERNATIVES,
  FREE_SEO_TOOLS,
  PROTOCOL_GUIDES,
} from '../lib/gtm-content';
import { getPublishedDomainScorecards } from '../lib/published-reports';
import { getPublishedMatchups } from '../lib/published-matchups';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publishedReports = getPublishedDomainScorecards();
  const publishedMatchups = getPublishedMatchups();
  return [
    {
      url: 'https://verisource.dev',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://verisource.dev/features',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.92,
    },
    {
      url: 'https://verisource.dev/scanner',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.78,
    },
    {
      url: 'https://verisource.dev/vs',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...publishedMatchups.map((item) => ({
      url: `https://verisource.dev/vs/${item.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.86,
    })),
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
    {
      url: 'https://verisource.dev/benchmarks',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.88,
    },
    {
      url: 'https://verisource.dev/benchmarks/ai-search-readiness-2026',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://verisource.dev/connectors',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.86,
    },
    {
      url: 'https://verisource.dev/partners',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
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
      url: 'https://verisource.dev/reports',
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.89,
    },
    ...publishedReports.map((item) => ({
      url: `https://verisource.dev/report/${item.domain}`,
      lastModified: new Date(item.publishedAt || now.toISOString()),
      changeFrequency: 'weekly' as const,
      priority: 0.82,
    })),
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
