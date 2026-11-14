// 10-Line Zero-Code AI Referral & Checkout Attribution Snippet Generator

export const SUPPORTED_AI_REFERRAL_ENGINES = [
  'chatgpt.com',
  'perplexity.ai',
  'gemini.google.com',
  'claude.ai',
] as const;

export function normalizeAiReferralSource(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (lower.includes('chatgpt') || lower.includes('openai')) return 'chatgpt.com';
  if (lower.includes('perplexity')) return 'perplexity.ai';
  if (lower.includes('gemini.google') || lower === 'gemini') return 'gemini.google.com';
  if (lower.includes('claude.ai') || lower === 'claude') return 'claude.ai';
  return null;
}

export function buildAiAttributionSnippet(params: {
  trackingPixelToken: string;
  ingestionUrl: string;
}): string {
  return `<script>
(function(t,u){
  var q=new URLSearchParams(location.search).get('utm_source')||'',r=document.referrer||'';
  var m=(q+' '+r).match(/chatgpt\\.com|perplexity\\.ai|gemini\\.google\\.com|claude\\.ai|chatgpt|perplexity|gemini|claude/i);
  if(m)sessionStorage.setItem('vs_ai_src',m[0].toLowerCase());
  var s=sessionStorage.getItem('vs_ai_src');if(!s)return;
  var post=function(e,v){fetch(u,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t,event_type:e,source_engine:s,landing_path:location.pathname,conversion_value_usd:v||null})}).catch(function(){});};
  if(!sessionStorage.getItem('vs_ai_vis')){sessionStorage.setItem('vs_ai_vis','1');post('ai_referral_visit',null);}
  window.verisourceConversion=function(usd){post('ai_referral_conversion',Number(usd)||0);};
})('${params.trackingPixelToken}','${params.ingestionUrl}');
</script>`;
}
