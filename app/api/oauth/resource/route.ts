import { originOf } from "@/lib/server/oauth";
import { oauthJson, preflight } from "../cors";

/** RFC 9728 protected resource metadata for /mcp, served at /.well-known/oauth-protected-resource (next.config rewrites). */
export function GET(request: Request) {
  const origin = originOf(request);
  return oauthJson({
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ["header"],
    scopes_supported: ["mcp"],
    resource_name: "Imaginry",
    resource_documentation: `${origin}/#agents`,
  });
}

export const OPTIONS = preflight;
