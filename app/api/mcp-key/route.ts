import { type NextRequest } from "next/server";
import { issueKey, keyInfo, revokeKey } from "@/lib/server/mcp-keys";
import { currentUser } from "@/lib/server/profiles";

/** GET -> { key: { hint, createdAt, lastUsedAt } | null } for the signed-in account. */
export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  return Response.json({ key: await keyInfo(user.id) });
}

/** POST -> { key: { token, hint, createdAt, lastUsedAt } }: a new key, replacing the old one. The token is shown only here. */
export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  return Response.json({ key: await issueKey(user.id) }, { headers: { "Cache-Control": "no-store" } });
}

/** DELETE -> { key: null }: revokes the account's key; clients using it stop working. */
export async function DELETE(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  await revokeKey(user.id);
  return Response.json({ key: null });
}
