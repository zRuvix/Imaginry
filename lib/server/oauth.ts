import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { pool } from "./auth-options";

/**
 * A small OAuth 2.1 authorization server for the MCP server, the way MCP
 * clients (Claude, ChatGPT, Cursor, VS Code, mcp-remote…) expect it: dynamic
 * client registration, authorization code + PKCE (S256), short access tokens
 * and rotating refresh tokens. The person signs in with their Imaginry account
 * and clicks Allow on /oauth/authorize. Only hashes of codes and tokens are
 * stored. Tables: oauth_client, oauth_code, oauth_token (scripts/migrate.ts).
 */

export const ACCESS_PREFIX = "imo_";
const REFRESH_PREFIX = "imr_";
const ACCESS_TTL_S = 60 * 60;
const REFRESH_TTL_S = 60 * 60 * 24 * 60;
const CODE_TTL_S = 10 * 60;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const secret = (prefix: string) => prefix + randomBytes(32).toString("base64url");

export class OAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------- clients

export type Client = { id: string; name: string; redirectUris: string[] };

/** Allowed: https, http only on loopback (native apps), or an app's own scheme (cursor://, vscode://). */
function validRedirect(uri: string) {
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return false;
  }
  if (u.hash) return false;
  const scheme = u.protocol.slice(0, -1);
  if (["javascript", "data", "file", "blob", "vbscript", "about"].includes(scheme)) return false;
  if (scheme === "http") return ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  return true;
}

/** RFC 7591 dynamic registration for public clients (no client secret; PKCE protects the code). */
export async function registerClient(body: Record<string, unknown>): Promise<Client> {
  const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u): u is string => typeof u === "string") : [];
  if (!uris.length || uris.length > 10) throw new OAuthError("invalid_redirect_uri", "Give 1 to 10 redirect_uris.");
  const bad = uris.find((u) => !validRedirect(u) || u.length > 2000);
  if (bad) throw new OAuthError("invalid_redirect_uri", `Redirect URI not allowed: ${bad}`);
  const name = String(body.client_name ?? "").trim().slice(0, 80) || "An MCP app";
  const id = "imc_" + randomBytes(16).toString("base64url");
  await pool().query("insert into oauth_client (id, name, redirect_uris) values ($1, $2, $3)", [id, name, JSON.stringify(uris)]);
  return { id, name, redirectUris: uris };
}

export async function getClient(id: string): Promise<Client | null> {
  if (!id || id.length > 64) return null;
  const { rows } = await pool().query<{ id: string; name: string; redirect_uris: string[] }>(
    "select id, name, redirect_uris from oauth_client where id = $1",
    [id],
  );
  const r = rows[0];
  return r ? { id: r.id, name: r.name, redirectUris: r.redirect_uris } : null;
}

// ---------------------------------------------------------------- authorize

/** The request fields the consent form carries back, exactly as /oauth/authorize got them. */
export const CONSENT_FIELDS = ["client_id", "redirect_uri", "state", "response_type", "code_challenge", "code_challenge_method", "resource"] as const;

/** What /oauth/authorize was asked for, checked before the consent screen shows. */
export type AuthRequest = {
  client: Client;
  redirectUri: string;
  state: string | null;
  challenge: string;
  resource: string | null;
};

/**
 * Validates an authorization request. Problems with the client or redirect URI
 * can't be sent back to the app safely, so they throw; the rest become an
 * error redirect (`redirect`).
 */
export async function checkAuthRequest(p: Record<string, string | undefined>): Promise<AuthRequest | { redirect: string }> {
  const client = await getClient(p.client_id ?? "");
  if (!client) throw new OAuthError("invalid_client", "This app isn't registered with Imaginry. Try connecting it again.");
  const redirectUri = p.redirect_uri ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : "");
  if (!client.redirectUris.includes(redirectUri)) throw new OAuthError("invalid_request", "The app's redirect address doesn't match its registration.");

  const state = p.state ?? null;
  const fail = (error: string, description: string) => ({ redirect: errorRedirect(redirectUri, state, error, description) });
  if (p.response_type !== "code") return fail("unsupported_response_type", "Only response_type=code is supported.");
  if (!p.code_challenge || p.code_challenge_method !== "S256") return fail("invalid_request", "PKCE with S256 is required.");
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(p.code_challenge)) return fail("invalid_request", "Malformed code_challenge.");
  return { client, redirectUri, state, challenge: p.code_challenge, resource: p.resource ?? null };
}

export function errorRedirect(redirectUri: string, state: string | null, error: string, description?: string) {
  const u = new URL(redirectUri);
  u.searchParams.set("error", error);
  if (description) u.searchParams.set("error_description", description);
  if (state) u.searchParams.set("state", state);
  return u.toString();
}

/**
 * Signs the consent form so only Imaginry's own Allow screen, shown to this
 * user for this exact request, can be posted back (no cross-site auto-submit).
 */
export function consentSignature(userId: string, fields: Record<string, string>, issuedAt: number) {
  const data = [userId, issuedAt, ...Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`)].join("\n");
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "dev-secret").update(data).digest("base64url");
}

export function consentValid(userId: string, fields: Record<string, string>, issuedAt: number, sig: string) {
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > 15 * 60_000) return false;
  const want = Buffer.from(consentSignature(userId, fields, issuedAt));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** After Allow: a one-time code bound to the user, app, redirect and PKCE challenge. */
export async function issueCode(userId: string, req: Omit<AuthRequest, "client" | "state"> & { clientId: string }) {
  const code = secret("ima_");
  await pool().query(
    `insert into oauth_code (code_hash, client_id, user_id, redirect_uri, code_challenge, resource, expires_at)
     values ($1, $2, $3, $4, $5, $6, now() + $7 * interval '1 second')`,
    [sha(code), req.clientId, userId, req.redirectUri, req.challenge, req.resource, CODE_TTL_S],
  );
  return code;
}

// ---------------------------------------------------------------- tokens

export type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
};

async function issueTokens(userId: string, clientId: string): Promise<TokenResponse> {
  const access = secret(ACCESS_PREFIX);
  const refresh = secret(REFRESH_PREFIX);
  await pool().query(
    `insert into oauth_token (token_hash, kind, client_id, user_id, expires_at) values
       ($1, 'access', $3, $4, now() + $5 * interval '1 second'),
       ($2, 'refresh', $3, $4, now() + $6 * interval '1 second')`,
    [sha(access), sha(refresh), clientId, userId, ACCESS_TTL_S, REFRESH_TTL_S],
  );
  // Housekeeping: expired rows are useless.
  pool()
    .query("delete from oauth_token where expires_at < now() - interval '1 day'")
    .then(() => pool().query("delete from oauth_code where expires_at < now()"))
    .catch((e) => console.error("[oauth] cleanup", e));
  return { access_token: access, token_type: "Bearer", expires_in: ACCESS_TTL_S, refresh_token: refresh, scope: "mcp" };
}

const verifierMatches = (verifier: string, challenge: string) =>
  /^[A-Za-z0-9._~-]{43,128}$/.test(verifier) && createHash("sha256").update(verifier).digest("base64url") === challenge;

/** The token endpoint's two grants. */
export async function exchange(form: URLSearchParams): Promise<TokenResponse> {
  const grant = form.get("grant_type");
  const clientId = form.get("client_id") ?? "";

  if (grant === "authorization_code") {
    const code = form.get("code") ?? "";
    // Delete as we read: a code works once, even if two requests race.
    const { rows } = await pool().query<{ client_id: string; user_id: string; redirect_uri: string; code_challenge: string; expired: boolean }>(
      `delete from oauth_code where code_hash = $1
       returning client_id, user_id, redirect_uri, code_challenge, expires_at < now() as expired`,
      [sha(code)],
    );
    const row = rows[0];
    if (!row || row.expired) throw new OAuthError("invalid_grant", "This sign-in code is invalid or expired. Connect again.");
    if (row.client_id !== clientId) throw new OAuthError("invalid_grant", "The code was issued to another app.");
    const redirect = form.get("redirect_uri");
    if (redirect && redirect !== row.redirect_uri) throw new OAuthError("invalid_grant", "redirect_uri doesn't match.");
    if (!verifierMatches(form.get("code_verifier") ?? "", row.code_challenge)) throw new OAuthError("invalid_grant", "PKCE check failed.");
    return issueTokens(row.user_id, row.client_id);
  }

  if (grant === "refresh_token") {
    const token = form.get("refresh_token") ?? "";
    if (!token.startsWith(REFRESH_PREFIX)) throw new OAuthError("invalid_grant", "Not a refresh token.");
    // Rotation: the old refresh token is spent the moment it's used.
    const { rows } = await pool().query<{ client_id: string; user_id: string; expired: boolean }>(
      `delete from oauth_token where token_hash = $1 and kind = 'refresh'
       returning client_id, user_id, expires_at < now() as expired`,
      [sha(token)],
    );
    const row = rows[0];
    if (!row || row.expired) throw new OAuthError("invalid_grant", "This session has ended. Connect again.");
    if (clientId && row.client_id !== clientId) throw new OAuthError("invalid_grant", "The token belongs to another app.");
    return issueTokens(row.user_id, row.client_id);
  }

  throw new OAuthError("unsupported_grant_type", "Use authorization_code or refresh_token.");
}

/** The user behind a live OAuth access token, or null. */
export async function userForAccessToken(token: string): Promise<string | null> {
  if (!token.startsWith(ACCESS_PREFIX) || token.length > 128) return null;
  const { rows } = await pool().query<{ user_id: string; last_used_at: Date | null }>(
    "select user_id, last_used_at from oauth_token where token_hash = $1 and kind = 'access' and expires_at > now()",
    [sha(token)],
  );
  const row = rows[0];
  if (row && (!row.last_used_at || Date.now() - row.last_used_at.getTime() > 60_000)) {
    pool()
      .query("update oauth_token set last_used_at = now() where token_hash = $1", [sha(token)])
      .catch((e) => console.error("[oauth]", e));
  }
  return row?.user_id ?? null;
}

// ---------------------------------------------------------------- connected apps

export type ConnectedApp = { clientId: string; name: string; connectedAt: string; lastUsedAt: string | null };

/** Apps holding a live token for this user, for the account panel. */
export async function connectedApps(userId: string): Promise<ConnectedApp[]> {
  const { rows } = await pool().query<{ client_id: string; name: string; connected_at: Date; last_used_at: Date | null }>(
    `select t.client_id, c.name, min(t.created_at) as connected_at, max(t.last_used_at) as last_used_at
     from oauth_token t join oauth_client c on c.id = t.client_id
     where t.user_id = $1 and t.expires_at > now()
     group by t.client_id, c.name
     order by max(coalesce(t.last_used_at, t.created_at)) desc`,
    [userId],
  );
  return rows.map((r) => ({
    clientId: r.client_id,
    name: r.name,
    connectedAt: r.connected_at.toISOString(),
    lastUsedAt: r.last_used_at?.toISOString() ?? null,
  }));
}

/** Disconnects an app: its access and refresh tokens stop working at once. */
export async function disconnectApp(userId: string, clientId: string) {
  await pool().query("delete from oauth_token where user_id = $1 and client_id = $2", [userId, clientId]);
}

/** The public origin, from the request (so local dev advertises localhost). */
export const originOf = (request: Request) => new URL(request.url).origin;
