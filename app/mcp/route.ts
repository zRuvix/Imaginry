import { type NextRequest } from "next/server";
import { SITE_URL } from "@/lib/seo";
import { bearer, userForKey } from "@/lib/server/mcp-keys";
import { ACCESS_PREFIX, userForAccessToken } from "@/lib/server/oauth";
import { ToolContent, ToolError, TOOLS, TOOLS_BY_NAME, type ToolContext } from "@/lib/server/mcp-tools";

// render_png runs headless Chromium on the CPU, which takes a few seconds.
export const maxDuration = 60;

/**
 * MCP server for AI agents, over Streamable HTTP in stateless mode:
 * every POST carries a JSON-RPC message (or batch) and gets a JSON reply.
 * There are no sessions and no server-to-client stream, so GET returns 405
 * to MCP clients asking for one.
 *
 * Every POST needs `Authorization: Bearer …`: an OAuth access token the app got
 * when the person clicked Allow (lib/server/oauth, /oauth/authorize), or an
 * account API key from the studio's account panel (lib/server/mcp-keys).
 * Without one the reply is a 401, so nothing runs for anonymous callers.
 */

const SUPPORTED_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const LATEST = SUPPORTED_VERSIONS[0];

const SERVER_INFO = {
  name: "imaginry",
  title: "Imaginry",
  version: "1.0.0",
  websiteUrl: SITE_URL,
};

const INSTRUCTIONS = `Imaginry is a free browser studio for generative backgrounds: stacks of live GPU effects (gradients, fluted glass, grain, halftone, glitch and more).
Typical flow: list_effects or list_looks to find building blocks, get_effect for an effect's settings, then create_design with layers listed top first (usually a gradient at the bottom and grain on top).
create_design returns a studio link the user opens to tweak and export PNG, looping MP4/WebM video or embed code; get_embed_code returns code that renders the design live in a website.`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Protocol-Version, WWW-Authenticate",
};

type Id = string | number | null;
type Message = { jsonrpc?: unknown; id?: Id; method?: unknown; params?: unknown };

const result = (id: Id, value: unknown) => ({ jsonrpc: "2.0", id, result: value });
const failure = (id: Id, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { ...CORS, "Mcp-Protocol-Version": LATEST } });

async function callTool(params: Record<string, unknown>, ctx: ToolContext) {
  const tool = TOOLS_BY_NAME[String(params.name)];
  if (!tool) return null;
  const args = params.arguments && typeof params.arguments === "object" ? (params.arguments as Record<string, unknown>) : {};
  try {
    const value = await tool.run(args, ctx);
    if (value instanceof ToolContent) {
      return { content: value.content, ...(value.structured ? { structuredContent: value.structured } : {}) };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
      ...(value && typeof value === "object" && !Array.isArray(value) ? { structuredContent: value } : {}),
    };
  } catch (e) {
    // Bad arguments go back to the model as a tool error it can correct.
    if (!(e instanceof ToolError)) console.error("[mcp]", tool.name, e);
    const message = e instanceof ToolError ? e.message : "Something went wrong running this tool";
    return { content: [{ type: "text", text: message }], isError: true };
  }
}

/** Handles one JSON-RPC message; notifications return undefined. */
async function handle(msg: Message, ctx: ToolContext) {
  const isRequest = msg.id !== undefined && msg.id !== null;
  if (msg?.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return failure(isRequest ? msg.id! : null, -32600, "Invalid request");
  }
  if (!isRequest) return undefined;
  const id = msg.id!;
  const params = (msg.params && typeof msg.params === "object" ? msg.params : {}) as Record<string, unknown>;

  switch (msg.method) {
    case "initialize": {
      const asked = String(params.protocolVersion ?? "");
      return result(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : LATEST,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, {
        tools: TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({
          name,
          title,
          description,
          inputSchema,
          annotations,
        })),
      });
    case "tools/call": {
      const reply = await callTool(params, ctx);
      return reply ? result(id, reply) : failure(id, -32602, `Unknown tool: ${params.name}`);
    }
    default:
      return failure(id, -32601, `Method not found: ${msg.method}`);
  }
}

/**
 * 401 for a missing or dead token. The resource_metadata pointer is how MCP
 * apps find the sign-in: they register, open the Allow screen, and retry.
 */
function unauthorized(request: NextRequest, hasToken: boolean) {
  const origin = request.nextUrl.origin;
  const message = hasToken
    ? "This sign-in or API key isn't valid anymore. Reconnect the app, or make a new key in the studio's account panel."
    : "Imaginry needs you to sign in. Connect from an MCP app to get the Allow screen, or send an account API key as Authorization: Bearer <key>.";
  const params = [`realm="imaginry"`, `resource_metadata="${origin}/.well-known/oauth-protected-resource"`];
  if (hasToken) params.push(`error="invalid_token"`);
  return Response.json(failure(null, -32001, message), {
    status: 401,
    headers: { ...CORS, "WWW-Authenticate": `Bearer ${params.join(", ")}` },
  });
}

/** The account behind a bearer token: an OAuth access token from the Allow screen, or an account API key. */
async function userFor(token: string) {
  if (token.startsWith(ACCESS_PREFIX)) return userForAccessToken(token);
  return userForKey(token);
}

export async function POST(request: NextRequest) {
  const token = bearer(request);
  let userId: string | null = null;
  try {
    userId = token ? await userFor(token) : null;
  } catch (e) {
    // Fail closed: no key check, no tools.
    console.error("[mcp] key check", e);
    return Response.json(failure(null, -32603, "Couldn't check the API key right now. Try again in a moment."), {
      status: 503,
      headers: { ...CORS, "Retry-After": "30" },
    });
  }
  if (!userId) return unauthorized(request, !!token);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(failure(null, -32700, "Parse error"), 400);
  }
  const ctx: ToolContext = {
    // Rate limits count per account.
    caller: `user:${userId}`,
    origin: request.nextUrl.origin,
  };

  if (Array.isArray(body)) {
    if (body.length === 0) return json(failure(null, -32600, "Empty batch"), 400);
    const replies = (await Promise.all(body.slice(0, 32).map((m) => handle(m as Message, ctx)))).filter(Boolean);
    return replies.length ? json(replies) : new Response(null, { status: 202, headers: CORS });
  }
  const reply = await handle(body as Message, ctx);
  return reply ? json(reply) : new Response(null, { status: 202, headers: CORS });
}

export async function GET(request: NextRequest) {
  // MCP clients open GET for a server-to-client stream, which this server doesn't offer.
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/event-stream")) {
    return new Response(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } });
  }
  // A person who opened the URL in a browser gets the setup page.
  if (accept.includes("text/html")) return Response.redirect(new URL("/studio", request.url), 307);
  return json({
    name: SERVER_INFO.title,
    description: "MCP server for AI agents. Connect an MCP client to this URL (Streamable HTTP) with an account API key.",
    auth: `Authorization: Bearer <key>. Make a key at ${SITE_URL}/#agents`,
    endpoint: `${SITE_URL}/mcp`,
    tools: TOOLS.map((t) => t.name),
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
