import { type NextRequest } from "next/server";
import { invoicePdf } from "@/lib/server/billing";
import { currentUser } from "@/lib/server/profiles";

/** GET -> the invoice PDF for one of the signed-in user's own payments. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/billing/invoices/[id]">) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const pdf = await invoicePdf(user.id, id);
    if (!pdf) return Response.json({ error: "Not found" }, { status: 404 });
    return new Response(pdf.body, {
      headers: {
        "content-type": pdf.headers.get("content-type") ?? "application/pdf",
        "content-disposition": `inline; filename="imaginry-invoice-${id}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[billing] invoice pdf failed", e);
    return Response.json({ error: "Invoice is unavailable right now" }, { status: 502 });
  }
}
