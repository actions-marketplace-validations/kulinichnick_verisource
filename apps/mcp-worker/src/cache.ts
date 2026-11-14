import type { WorkerEnv } from './types.js';

interface MemoryCacheEntry {
  rawJson: string;
  expiresAtMs: number;
}

const isolateMemoryCache = new Map<string, MemoryCacheEntry>();
const isolateIpCounter = new Map<string, { count: number; dayKey: string }>();

export async function getCachedJson<T>(
  key: string,
  env: WorkerEnv
): Promise<T | null> {
  if (env.MCP_CACHE_KV) {
    const val = await env.MCP_CACHE_KV.get(key, 'text');
    if (val) {
      try {
        return JSON.parse(val) as T;
      } catch {
        return null;
      }
    }
  }

  const mem = isolateMemoryCache.get(key);
  if (!mem) return null;
  if (Date.now() > mem.expiresAtMs) {
    isolateMemoryCache.delete(key);
    return null;
  }

  try {
    return JSON.parse(mem.rawJson) as T;
  } catch {
    return null;
  }
}

export async function setCachedJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
  env: WorkerEnv
): Promise<void> {
  const serialized = JSON.stringify(value);
  isolateMemoryCache.set(key, {
    rawJson: serialized,
    expiresAtMs: Date.now() + ttlSeconds * 1000,
  });

  if (env.MCP_CACHE_KV) {
    await env.MCP_CACHE_KV.put(key, serialized, {
      expirationTtl: Math.max(60, ttlSeconds),
    });
  }
}

export async function checkFreeGraderIpRateLimit(
  clientIp: string,
  env: WorkerEnv,
  maxPerDay = 3
): Promise<{ allowed: boolean; remaining: number }> {
  const dayKey = new Date().toISOString().slice(0, 10);
  const kvKey = `ratelimit:free:${dayKey}:${clientIp}`;

  if (env.MCP_CACHE_KV) {
    const rawCount = await env.MCP_CACHE_KV.get(kvKey, 'text');
    const used = rawCount ? Number.parseInt(rawCount, 10) || 0 : 0;
    if (used >= maxPerDay) {
      return { allowed: false, remaining: 0 };
    }
    const nextUsed = used + 1;
    await env.MCP_CACHE_KV.put(kvKey, String(nextUsed), {
      expirationTtl: 86400,
    });
    return { allowed: true, remaining: maxPerDay - nextUsed };
  }

  const existing = isolateIpCounter.get(clientIp);
  const used = existing && existing.dayKey === dayKey ? existing.count : 0;
  if (used >= maxPerDay) {
    return { allowed: false, remaining: 0 };
  }
  const nextUsed = used + 1;
  isolateIpCounter.set(clientIp, { count: nextUsed, dayKey });
  return { allowed: true, remaining: maxPerDay - nextUsed };
}
