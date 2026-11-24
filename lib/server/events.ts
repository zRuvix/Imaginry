import "server-only";
import { createHash } from "node:crypto";
import { pool } from "./auth-options";
import type { EventKind, EventMeta } from "@/lib/events";

const META_KEYS = 8;
const META_STRING = 60;

/** Keeps only a few short primitive values, so the table can't be stuffed. */
export function cleanMeta(meta: unknown): EventMeta {
  const out: EventMeta = {};
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return out;
  for (const [k, v] of Object.entries(meta).slice(0, META_KEYS)) {
    const key = k.slice(0, 24);
    if (typeof v === "string") out[key] = v.slice(0, META_STRING);
    else if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    else if (typeof v === "boolean") out[key] = v;
  }
  return out;
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

/**
 * Anonymous visitor key: a hash of IP and browser with a salt that changes every
 * day, so it counts unique visitors per day but can't follow anyone across days
 * or be turned back into an IP. Nothing is stored on the visitor's device.
 */
export function visitorKey(request: Request) {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${process.env.BETTER_AUTH_SECRET ?? ""}|${day}|${clientIp(request)}|${request.headers.get("user-agent") ?? ""}`)
    .digest("base64url")
    .slice(0, 16);
}

/** Stores one event. Errors are logged, never thrown: tracking is best effort. */
export async function recordEvent(kind: EventKind, opts: { request: Request; userId?: string | null; meta?: unknown }) {
  try {
    await pool().query(`insert into event (kind, user_id, visitor, meta) values ($1, $2, $3, $4)`, [
      kind,
      opts.userId ?? null,
      visitorKey(opts.request),
      JSON.stringify(cleanMeta(opts.meta)),
    ]);
  } catch (e) {
    console.error("[events]", e instanceof Error ? e.message : e);
  }
}
