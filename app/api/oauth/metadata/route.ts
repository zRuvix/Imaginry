import { originOf } from "@/lib/server/oauth";
import { oauthJson, preflight } from "../cors";

/** RFC 8414 authorization server metadata, served at /.well-known/oauth-authorization-server (next.config rewrites). */
export function GET(request: Request) {
  const origin = originOf(request);
  return oauthJson({
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["mcp"],
    service_documentation: `${origin}/#agents`,
  });
}

export const OPTIONS = preflight;
