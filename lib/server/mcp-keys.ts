import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { pool } from "./auth-options";

/**
 * Account API keys for the MCP server: one per user, sent by MCP clients as
 * `Authorization: Bearer imk_…`. Only a SHA-256 of the key is stored, so a key
 * is shown once when it's made; after that the account sees its last four
 * characters. Table: mcp_key (scripts/migrate.ts).
 */

const PREFIX = "imk_";

export type KeyInfo = { hint: string; createdAt: string; lastUsedAt: string | null };

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** The signed-in user's key, without the secret, or null. */
export async function keyInfo(userId: string): Promise<KeyInfo | null> {
  const { rows } = await pool().query<{ hint: string; created_at: Date; last_used_at: Date | null }>(
    "select hint, created_at, last_used_at from mcp_key where user_id = $1",
    [userId],
  );
  const r = rows[0];
  return r ? { hint: r.hint, createdAt: r.created_at.toISOString(), lastUsedAt: r.last_used_at?.toISOString() ?? null } : null;
}

/** Makes a new key for the user, replacing any old one. Returns the secret, the only time it's readable. */
export async function issueKey(userId: string): Promise<{ token: string } & KeyInfo> {
  const token = PREFIX + randomBytes(32).toString("base64url");
  const hint = token.slice(-4);
  const { rows } = await pool().query<{ created_at: Date }>(
    `insert into mcp_key (user_id, key_hash, hint) values ($1, $2, $3)
     on conflict (user_id) do update set key_hash = excluded.key_hash, hint = excluded.hint, created_at = now(), last_used_at = null
     returning created_at`,
    [userId, hash(token), hint],
  );
  forgetCached();
  return { token, hint, createdAt: rows[0].created_at.toISOString(), lastUsedAt: null };
}

export async function revokeKey(userId: string) {
  await pool().query("delete from mcp_key where user_id = $1", [userId]);
  forgetCached();
}

// Recently checked keys, so a busy agent doesn't hit the database on every call.
// Other server instances drop a revoked key within CACHE_MS.
const CACHE_MS = 60_000;
const cache = new Map<string, { userId: string | null; until: number }>();
const forgetCached = () => cache.clear();

/** The user a bearer token belongs to, or null if it isn't a live key. */
export async function userForKey(token: string): Promise<string | null> {
  if (!token.startsWith(PREFIX) || token.length > 128) return null;
  const h = hash(token);
  const hit = cache.get(h);
  if (hit && hit.until > Date.now()) return hit.userId;

  const { rows } = await pool().query<{ user_id: string; last_used_at: Date | null }>(
    "select user_id, last_used_at from mcp_key where key_hash = $1",
    [h],
  );
  const row = rows[0];
  const userId = row?.user_id ?? null;
  // "Last used" moves at most once a minute per key, and never holds up the call.
  if (row && (!row.last_used_at || Date.now() - row.last_used_at.getTime() > 60_000)) {
    pool()
      .query("update mcp_key set last_used_at = now() where key_hash = $1", [h])
      .catch((e) => console.error("[mcp-key]", e));
  }
  if (cache.size > 5000) cache.clear();
  cache.set(h, { userId, until: Date.now() + CACHE_MS });
  return userId;
}

/** The token from an `Authorization: Bearer …` header, if there is one. */
export function bearer(request: Request): string | null {
  const m = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)\s*$/i);
  return m ? m[1] : null;
}
