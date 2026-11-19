/**
 * Anti-bot and disposable email guard for public unauthenticated email-sending endpoints
 * (/api/auth/magic-link and /api/partners/apply).
 */

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'niceground.shop',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'yopmail.com',
  'trashmail.com',
  'maildrop.cc',
  'getnada.com',
  'dispostable.com',
  'fakeinbox.com',
  'mohmal.com',
  'throwawaymail.com',
  'mailnesia.com',
]);

export interface SignupEmailGuardResult {
  blocked: boolean;
  reason?:
    | 'disposable_domain'
    | 'automated_hex_local'
    | 'dotted_gmail_alias_bot';
}

export function checkDisposableOrBotEmail(
  rawEmail: string
): SignupEmailGuardResult {
  const clean = rawEmail.trim().toLowerCase();
  const atIdx = clean.lastIndexOf('@');
  if (atIdx <= 0 || atIdx >= clean.length - 1) {
    return { blocked: false };
  }

  const local = clean.slice(0, atIdx);
  const host = clean.slice(atIdx + 1);

  for (const blockedDomain of DISPOSABLE_EMAIL_DOMAINS) {
    if (host === blockedDomain || host.endsWith(`.${blockedDomain}`)) {
      return { blocked: true, reason: 'disposable_domain' };
    }
  }

  // Automated hex-prefixed bot signups (e.g. eng7acc9cd35@...)
  if (/^eng[0-9a-f]{6,}$/i.test(local)) {
    return { blocked: true, reason: 'automated_hex_local' };
  }

  // Multi-dotted Gmail permutation bots (e.g. eli.z.ab.ethja.ne198.4@gmail.com)
  if (host === 'gmail.com' || host === 'googlemail.com') {
    const dotCount = (local.match(/\./g) ?? []).length;
    if (dotCount >= 3) {
      return { blocked: true, reason: 'dotted_gmail_alias_bot' };
    }
  }

  return { blocked: false };
}

/**
 * Detects automated form-stuffing payloads on /api/partners/apply
 * (e.g. consonant-soup slugs like "jyzpvgbqxgkcqjtllappz" or names like "Byispcpg Nsvkxngm").
 */
export function isGibberishBotPartnerSubmission(input: {
  name: string;
  slug: string;
}): boolean {
  const cleanName = input.name.trim();
  const cleanSlug = input.slug.trim().toLowerCase();

  // 6+ consecutive non-Y consonants never occur in legitimate names or brand slugs
  const sixHardConsonants = /[bcdfghjklmnpqrstvwxz]{6,}/i;
  if (sixHardConsonants.test(cleanName) || sixHardConsonants.test(cleanSlug)) {
    return true;
  }

  // Long unseparated random-letter slugs (>= 18 letters, no hyphens/underscores/digits, < 18% vowels)
  if (/^[a-z]{18,}$/.test(cleanSlug)) {
    const vowels = (cleanSlug.match(/[aeiouy]/g) ?? []).length;
    if (vowels / cleanSlug.length < 0.18) {
      return true;
    }
  }

  return false;
}
