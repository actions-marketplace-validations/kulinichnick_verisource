// Shopify Admin -> Settings -> Customer events -> Add custom pixel ("Verisource AI Attribution")
// Store: Mosaic Coffee Roasters (https://mosaicroasters.com)
const VS_TOKEN = 'bbbbbbbb-1111-4000-8000-000000000002';
const VS_CHECKOUT_KEY = 'e98bf04cd52cb7f0a867c102';
const VS_ENDPOINT = 'https://verisource.dev/api/pixel';
const AI_PATTERN = /chatgpt\.com|perplexity\.ai|gemini\.google\.com|claude\.ai|chatgpt|perplexity|gemini|claude/i;

analytics.subscribe('page_viewed', async (event) => {
  const loc = event.context?.document?.location;
  const ref = event.context?.document?.referrer || '';
  const utm = loc?.search ? (new URLSearchParams(loc.search).get('utm_source') || '') : '';
  const match = (utm + ' ' + ref).match(AI_PATTERN);
  if (match) {
    await browser.localStorage.setItem('vs_ai_src', match[0].toLowerCase());
  }
});

analytics.subscribe('checkout_completed', async (event) => {
  const src = await browser.localStorage.getItem('vs_ai_src');
  if (!src) return;
  const amount = Number(event.data?.checkout?.totalPrice?.amount || 0);
  const path = event.context?.document?.location?.pathname || '/checkouts/thank-you';
  fetch(VS_ENDPOINT, {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: VS_TOKEN,
      checkout_key: VS_CHECKOUT_KEY,
      event_type: 'ai_referral_conversion',
      source_engine: src,
      landing_path: path,
      conversion_value_usd: amount > 0 ? amount : null,
    }),
  }).catch(() => {});
});
