import { OAuthError, registerClient } from "@/lib/server/oauth";
import { allowRequest } from "@/lib/server/shortlinks";
import { oauthJson, preflight } from "../cors";

/** RFC 7591 dynamic client registration: MCP apps register themselves before sending the person to Allow. */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (!(await allowRequest(`oauth-register:${ip}`, 20))) {
    return oauthJson({ error: "slow_down", error_description: "Too many registrations, try again in a minute." }, 429);
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return oauthJson({ error: "invalid_client_metadata", error_description: "Expected JSON." }, 400);
  }
  try {
    const client = await registerClient(body ?? {});
    return oauthJson(
      {
        client_id: client.id,
        client_name: client.name,
        redirect_uris: client.redirectUris,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        client_id_issued_at: Math.floor(Date.now() / 1000),
      },
      201,
    );
  } catch (e) {
    if (e instanceof OAuthError) return oauthJson({ error: e.code, error_description: e.message }, e.status);
    throw e;
  }
}

export const OPTIONS = preflight;
