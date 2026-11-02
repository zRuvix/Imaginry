import "server-only";
import { redis } from "./redis";

/**
 * Two-level read-through cache for database reads:
 *   1. this process's memory (instant, a few seconds, so other instances' writes show up quickly)
 *   2. Redis (shared by every instance, invalidated on writes)
 * Postgres is only hit on a miss. Redis trouble never blocks a request: after
 * REDIS_WAIT_MS we fall through to the database.
 */

const PREFIX = "imaginry:cache:";
const MEMORY_TTL_MS = 5_000;
const MEMORY_MAX = 500;
const REDIS_WAIT_MS = 250;

type Entry = { value: unknown; expires: number };
const globalForCache = globalThis as unknown as { memoryCache?: Map<string, Entry> };
const memory = (globalForCache.memoryCache ??= new Map());

/** Concurrent misses for the same key share one database call. */
const inflight = new Map<string, Promise<unknown>>();

function remember(key: string, value: unknown, ttlSeconds: number) {
  if (memory.size >= MEMORY_MAX) memory.delete(memory.keys().next().value!);
  memory.set(key, { value, expires: Date.now() + Math.min(MEMORY_TTL_MS, ttlSeconds * 1000) });
}

/** Resolves to undefined instead of throwing or hanging when Redis is slow or down. */
async function withRedis<T>(fn: (client: Awaited<ReturnType<typeof redis>>) => Promise<T>): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      redis().then(fn),
      new Promise<undefined>((r) => {
        timer = setTimeout(() => r(undefined), REDIS_WAIT_MS);
      }),
    ]);
  } catch (e) {
    console.error("[cache]", e instanceof Error ? e.message : e);
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/** Returns the cached value for `key`, or runs `load` and caches its result for `ttlSeconds`. */
export async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const k = PREFIX + key;
  const hit = memory.get(k);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  const pending = inflight.get(k);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    const stored = await withRedis((c) => c.get(k));
    if (typeof stored === "string") {
      const value = JSON.parse(stored) as T;
      remember(k, value, ttlSeconds);
      return value;
    }
    const value = await load();
    remember(k, value, ttlSeconds);
    // Fire and forget: the response doesn't wait for the write.
    void withRedis((c) => c.set(k, JSON.stringify(value), { expiration: { type: "EX", value: ttlSeconds } }));
    return value;
  })();
  inflight.set(k, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(k);
  }
}

/** Drops keys after a write, so the next read goes back to the database. */
export async function invalidate(...keys: string[]) {
  const full = keys.map((k) => PREFIX + k);
  full.forEach((k) => memory.delete(k));
  await withRedis((c) => c.del(full));
}
