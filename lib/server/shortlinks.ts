import "server-only";
import { redis } from "./redis";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const key = (code: string) => `imaginry:share:${code}`;

/** Longest design string we'll store (the compact format is usually < 300). */
export const MAX_DESIGN_LENGTH = 4000;
export const CODE_PATTERN = /^[0-9A-Za-z]{5,16}$/;

/** A base62 code derived from the design, so one design always gets one link. */
async function codeFor(design: string, length: number) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(design)));
  // One character per hash byte; 62^7 is about 3.5 trillion codes.
  return Array.from(digest.slice(0, length), (byte) => ALPHABET[byte % 62]).join("");
}

/** Stores the design (once) and returns its short code. */
export async function createShortLink(design: string): Promise<string> {
  const client = await redis();
  // Lengthen the code on the (astronomically rare) clash with another design.
  for (let length = 7; length <= 12; length++) {
    const code = await codeFor(design, length);
    const stored = await client.set(key(code), design, { condition: "NX" });
    if (stored === "OK") return code;
    if ((await client.get(key(code))) === design) return code;
  }
  throw new Error("Could not allocate a short code");
}

export async function resolveShortLink(code: string): Promise<string | null> {
  if (!CODE_PATTERN.test(code)) return null;
  const client = await redis();
  return client.get(key(code));
}

/** Simple fixed-window limit: at most `limit` calls per minute per caller. */
export async function allowRequest(caller: string, limit = 30): Promise<boolean> {
  const client = await redis();
  const k = `imaginry:rl:share:${caller}`;
  const count = await client.incr(k);
  if (count === 1) await client.expire(k, 60);
  return count <= limit;
}
