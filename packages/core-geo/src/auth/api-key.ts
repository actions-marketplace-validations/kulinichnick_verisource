// Web-Standard Crypto API Key Generator & SHA-256 Hasher (Edge Worker + Node 20+ compatible)

export interface GeneratedMcpApiKey {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function generateMcpApiKey(): Promise<GeneratedMcpApiKey> {
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const tokenBody = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const rawKey = `vs_live_${tokenBody}`;
  const keyPrefix = rawKey.slice(0, 14);
  const keyHash = await sha256Hex(rawKey);

  return { rawKey, keyPrefix, keyHash };
}
