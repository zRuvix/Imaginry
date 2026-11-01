// Temporary: saves PNGs rendered by /dev-og. Deleted once the images are made.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  const name = new URL(request.url).searchParams.get("name") ?? "";
  if (!/^[a-z-]+$/.test(name)) return new Response("bad name", { status: 400 });
  const target = name === "apple-icon" ? path.join("app", "apple-icon.png") : path.join("public", "og", `${name}.png`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await request.arrayBuffer()));
  return Response.json({ saved: target });
}
