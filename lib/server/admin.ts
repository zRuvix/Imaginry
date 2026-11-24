import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The admin dashboard is unlocked with ADMIN_SECRET from the environment.
 * A correct key sets a signed, httpOnly cookie for a few hours; changing the
 * secret signs everyone out. Without a long enough secret the panel stays off.
 */
export const ADMIN_COOKIE = "imaginry_admin";
export const ADMIN_TTL_SECONDS = 12 * 60 * 60;
const MIN_SECRET = 16;

function secret() {
  const s = process.env.ADMIN_SECRET ?? "";
  return s.length >= MIN_SECRET ? s : null;
}

export const adminEnabled = () => secret() !== null;

const digest = (v: string) => createHash("sha256").update(v).digest();

/** Constant-time check of a typed key against ADMIN_SECRET. */
export function keyMatches(key: unknown) {
  const s = secret();
  if (!s || typeof key !== "string" || !key) return false;
  return timingSafeEqual(digest(key), digest(s));
}

const sign = (expires: number, s: string) =>
  createHmac("sha256", s).update(`imaginry-admin:${expires}`).digest("base64url");

/** Cookie value: expiry time and its signature. */
export function adminToken() {
  const s = secret();
  if (!s) throw new Error("ADMIN_SECRET is not set");
  const expires = Date.now() + ADMIN_TTL_SECONDS * 1000;
  return `${expires}.${sign(expires, s)}`;
}

function tokenValid(token: string | undefined) {
  const s = secret();
  if (!s || !token) return false;
  const [exp, sig] = token.split(".");
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires < Date.now() || !sig) return false;
  const want = Buffer.from(sign(expires, s));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** True when this request carries a valid admin cookie. */
export async function isAdmin() {
  return tokenValid((await cookies()).get(ADMIN_COOKIE)?.value);
}
