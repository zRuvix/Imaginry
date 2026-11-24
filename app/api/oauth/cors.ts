/** OAuth discovery, registration and token calls may come from browser-based MCP clients. */
export const OAUTH_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Protocol-Version",
};

export const preflight = () => new Response(null, { status: 204, headers: OAUTH_CORS });

export const oauthJson = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { ...OAUTH_CORS, "Cache-Control": "no-store" } });
