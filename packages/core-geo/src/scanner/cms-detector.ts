export type WebsitePlatformId =
  | 'shopify'
  | 'wordpress'
  | 'webflow'
  | 'wix'
  | 'squarespace'
  | 'framer'
  | 'nextjs_custom';

export type RecommendedRemediationEnv =
  | 'coding_agent'
  | 'chat_assistant'
  | 'shopify_liquid'
  | 'wordpress_cms'
  | 'webflow_cms'
  | 'wix_squarespace_framer';

export interface DetectedWebsitePlatform {
  platformId: WebsitePlatformId;
  displayName: string;
  supportsRootStaticFiles: boolean;
  recommendedAiEnv: RecommendedRemediationEnv;
  quickWhereToPasteSummary: string;
}

function readHeaderCaseInsensitive(
  headers:
    | Headers
    | Record<string, string | null | undefined>
    | null
    | undefined,
  key: string
): string {
  if (!headers) return '';
  if (typeof (headers as Headers).get === 'function') {
    return ((headers as Headers).get(key) ?? '').trim();
  }
  const rec = headers as Record<string, string | null | undefined>;
  const target = key.toLowerCase();
  for (const [k, v] of Object.entries(rec)) {
    if (k.toLowerCase() === target && typeof v === 'string') {
      return v.trim();
    }
  }
  return '';
}

export function getWebsitePlatformMeta(
  platformId: WebsitePlatformId
): DetectedWebsitePlatform {
  switch (platformId) {
    case 'shopify':
      return {
        platformId: 'shopify',
        displayName: 'Shopify',
        supportsRootStaticFiles: false,
        recommendedAiEnv: 'shopify_liquid',
        quickWhereToPasteSummary:
          'Online Store -> Themes -> layout/theme.liquid + /pages/ai-facts',
      };
    case 'wordpress':
      return {
        platformId: 'wordpress',
        displayName: 'WordPress',
        supportsRootStaticFiles: true,
        recommendedAiEnv: 'wordpress_cms',
        quickWhereToPasteSummary:
          'WPCode (Insert Headers & Footers) + /ai-facts page or root files',
      };
    case 'webflow':
      return {
        platformId: 'webflow',
        displayName: 'Webflow',
        supportsRootStaticFiles: false,
        recommendedAiEnv: 'webflow_cms',
        quickWhereToPasteSummary:
          'Site Settings -> Custom Code -> Head + /ai-facts page + 301 Redirects',
      };
    case 'wix':
      return {
        platformId: 'wix',
        displayName: 'Wix',
        supportsRootStaticFiles: false,
        recommendedAiEnv: 'wix_squarespace_framer',
        quickWhereToPasteSummary:
          'Settings -> Custom Code -> Head + /ai-facts page + URL Redirect Manager',
      };
    case 'squarespace':
      return {
        platformId: 'squarespace',
        displayName: 'Squarespace',
        supportsRootStaticFiles: false,
        recommendedAiEnv: 'wix_squarespace_framer',
        quickWhereToPasteSummary:
          'Website Tools -> Code Injection -> Header + /ai-facts page + URL Mappings',
      };
    case 'framer':
      return {
        platformId: 'framer',
        displayName: 'Framer',
        supportsRootStaticFiles: false,
        recommendedAiEnv: 'wix_squarespace_framer',
        quickWhereToPasteSummary:
          'Site Settings -> Custom Code -> End of <head> + /ai-facts page + Redirects',
      };
    case 'nextjs_custom':
    default:
      return {
        platformId: 'nextjs_custom',
        displayName: 'Custom Code / Next.js',
        supportsRootStaticFiles: true,
        recommendedAiEnv: 'coding_agent',
        quickWhereToPasteSummary:
          'Paste 1-Click AI Prompt into Cursor, Claude Code, or Antigravity',
      };
  }
}

export function detectWebsitePlatform(params: {
  html: string;
  headers?:
    | Headers
    | Record<string, string | null | undefined>
    | null;
  isShopifyOverride?: boolean;
}): DetectedWebsitePlatform {
  const html = params.html ?? '';
  const serverHeader = readHeaderCaseInsensitive(params.headers, 'server');
  const xPoweredBy = readHeaderCaseInsensitive(params.headers, 'x-powered-by');
  const xShopId = readHeaderCaseInsensitive(params.headers, 'x-shopid');
  const xShopifyStage = readHeaderCaseInsensitive(
    params.headers,
    'x-shopify-stage'
  );
  const xWixId = readHeaderCaseInsensitive(params.headers, 'x-wix-request-id');

  if (
    params.isShopifyOverride ||
    Boolean(xShopId || xShopifyStage) ||
    /Shopify\.shop|cdn\.shopify\.com|shopify-digital-wallet|myshopify\.com/i.test(
      html
    )
  ) {
    return getWebsitePlatformMeta('shopify');
  }

  if (
    Boolean(xWixId) ||
    /static\.wixstatic\.com|static\.parastorage\.com|<meta[^>]+name=["']generator["'][^>]+content=["'][^"']*Wix\.com/i.test(
      html
    )
  ) {
    return getWebsitePlatformMeta('wix');
  }

  if (
    /squarespace/i.test(serverHeader) ||
    /static1\.squarespace\.com|images\.squarespace-cdn\.com|<!--\s*This is Squarespace\.|Static\.SQUARESPACE_CONTEXT/i.test(
      html
    )
  ) {
    return getWebsitePlatformMeta('squarespace');
  }

  if (
    /\bdata-wf-site=["'][^"']+["']|\bdata-wf-page=["'][^"']+["']|assets\.website-files\.com|cdn\.prod\.website-files\.com|<meta[^>]+content=["']Webflow["'][^>]+name=["']generator["']|<meta[^>]+name=["']generator["'][^>]+content=["']Webflow["']/i.test(
      html
    )
  ) {
    return getWebsitePlatformMeta('webflow');
  }

  if (
    /framerusercontent\.com|data-framer-hydrate-v2|Built with Framer|<meta[^>]+name=["']generator["'][^>]+content=["'][^"']*Framer/i.test(
      html
    )
  ) {
    return getWebsitePlatformMeta('framer');
  }

  if (
    /wp-engine|wordpress/i.test(xPoweredBy) ||
    /\/wp-content\/|\/wp-includes\/|<meta[^>]+name=["']generator["'][^>]+content=["'][^"']*WordPress/i.test(
      html
    )
  ) {
    return getWebsitePlatformMeta('wordpress');
  }

  return getWebsitePlatformMeta('nextjs_custom');
}
