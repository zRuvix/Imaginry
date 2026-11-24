import { type NextRequest } from "next/server";
import { checkAuthRequest, CONSENT_FIELDS, consentValid, errorRedirect, issueCode, OAuthError } from "@/lib/server/oauth";
import { currentUser } from "@/lib/server/profiles";

const seeOther = (url: string) => new Response(null, { status: 303, headers: { Location: url, "Cache-Control": "no-store" } });
const page = (text: string, status: number) => new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

/** POST from the Allow / Deny screen. Allow issues a one-time code and sends the person back to the app. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const fields: Record<string, string> = {};
  for (const k of CONSENT_FIELDS) {
    const v = form.get(k);
    if (typeof v === "string" && v) fields[k] = v;
  }
  const back = `/oauth/authorize?${new URLSearchParams(fields)}`;

  const user = await currentUser(request);
  if (!user) return seeOther(back);

  let checked;
  try {
    checked = await checkAuthRequest(fields);
  } catch (e) {
    if (e instanceof OAuthError) return page(e.message, 400);
    throw e;
  }
  if ("redirect" in checked) return seeOther(checked.redirect);

  // Only Imaginry's own screen, for this user and this request, signs the form.
  if (!consentValid(user.id, fields, Number(form.get("issued_at")), String(form.get("sig") ?? ""))) {
    return seeOther(back);
  }

  if (form.get("decision") !== "allow") {
    return seeOther(errorRedirect(checked.redirectUri, checked.state, "access_denied", "You chose Deny."));
  }

  const code = await issueCode(user.id, {
    clientId: checked.client.id,
    redirectUri: checked.redirectUri,
    challenge: checked.challenge,
    resource: checked.resource,
  });
  const to = new URL(checked.redirectUri);
  to.searchParams.set("code", code);
  if (checked.state) to.searchParams.set("state", checked.state);
  to.searchParams.set("iss", new URL(request.url).origin);
  return seeOther(to.toString());
}
