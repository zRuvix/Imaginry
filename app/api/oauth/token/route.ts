import { exchange, OAuthError } from "@/lib/server/oauth";
import { oauthJson, preflight } from "../cors";

/** Token endpoint: a sign-in code (with its PKCE verifier) or a refresh token for a new access token. */
export async function POST(request: Request) {
  let form: URLSearchParams;
  try {
    const type = request.headers.get("content-type") ?? "";
    // The spec says form-encoded; a few clients send JSON.
    form = type.includes("application/json")
      ? new URLSearchParams(Object.entries((await request.json()) as Record<string, string>).map(([k, v]) => [k, String(v)]))
      : new URLSearchParams(await request.text());
  } catch {
    return oauthJson({ error: "invalid_request", error_description: "Couldn't read the request body." }, 400);
  }
  try {
    return oauthJson(await exchange(form));
  } catch (e) {
    if (e instanceof OAuthError) return oauthJson({ error: e.code, error_description: e.message }, e.status);
    throw e;
  }
}

export const OPTIONS = preflight;
