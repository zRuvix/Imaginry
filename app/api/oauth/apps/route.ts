import { type NextRequest } from "next/server";
import { connectedApps, disconnectApp } from "@/lib/server/oauth";
import { currentUser } from "@/lib/server/profiles";

/** GET -> { apps: [{ clientId, name, connectedAt, lastUsedAt }] } connected to the signed-in account. */
export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  return Response.json({ apps: await connectedApps(user.id) });
}

/** DELETE ?client=<id> -> { apps }: disconnects that app at once. */
export async function DELETE(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  const client = request.nextUrl.searchParams.get("client");
  if (!client) return Response.json({ error: "Which app?" }, { status: 400 });
  await disconnectApp(user.id, client);
  return Response.json({ apps: await connectedApps(user.id) });
}
