import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { LogoMark } from "@/components/Logo";
import { HeroSky } from "@/components/landing/HeroSky";
import SignInToContinue from "@/components/oauth/SignInToContinue";
import { auth } from "@/lib/server/auth";
import { EFFECT_COUNT } from "@/lib/studio/effects";
import { checkAuthRequest, CONSENT_FIELDS, consentSignature, OAuthError } from "@/lib/server/oauth";
import { usernameOf } from "@/lib/server/profiles";

export const metadata: Metadata = {
  title: "Connect an app",
  robots: { index: false, follow: false },
};

type Search = Promise<Record<string, string | string[] | undefined>>;

/**
 * Where an MCP app sends the person to connect: sign in if needed, then
 * Allow or Deny. Allow posts to /api/oauth/authorize, which hands the app a
 * one-time code.
 */
export default function Page({ searchParams }: { searchParams: Search }) {
  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-[#eef1f3] p-4 [color-scheme:light]">
      <style href="landing-light" precedence="high">{"html,body{background:#eef1f3;color-scheme:light}"}</style>
      <HeroSky />
      <Suspense fallback={<Card>{null}</Card>}>
        <Consent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Consent({ searchParams }: { searchParams: Search }) {
  await connection();
  const raw = await searchParams;
  const fields: Record<string, string> = {};
  for (const k of CONSENT_FIELDS) {
    const v = raw[k];
    if (typeof v === "string" && v) fields[k] = v;
  }

  let checked;
  try {
    checked = await checkAuthRequest(fields);
  } catch (e) {
    if (!(e instanceof OAuthError)) throw e;
    return (
      <Card>
        <h1 className="font-lexend text-[26px] font-light tracking-[-0.03em] text-[#121416]">Can’t connect this app</h1>
        <p className="font-outfit mt-2 text-[15px] leading-relaxed text-[#6b7075]">{e.message}</p>
      </Card>
    );
  }
  if ("redirect" in checked) redirect(checked.redirect);

  const { client, redirectUri } = checked;
  const returnTo = `/oauth/authorize?${new URLSearchParams(fields)}`;
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  const backTo = new URL(redirectUri);
  const backLabel = backTo.protocol === "http:" || backTo.protocol === "https:" ? backTo.host : `${backTo.protocol}//`;

  if (!user) {
    return (
      <Card>
        <Title app={client.name} />
        <p className="font-outfit mt-2 text-[15px] leading-relaxed text-[#6b7075]">Sign in to your Imaginry account to continue.</p>
        <div className="mt-6">
          <SignInToContinue returnTo={returnTo} />
        </div>
      </Card>
    );
  }

  const username = await usernameOf(user.id);
  const issuedAt = Date.now();
  const sig = consentSignature(user.id, fields, issuedAt);

  return (
    <Card>
      <Title app={client.name} />
      <ul className="font-outfit mt-5 space-y-2.5 text-[14.5px] text-[#3a3d40]">
        {[`Build and edit designs from all ${EFFECT_COUNT} effects`, "Render PNGs and get embed code", "Make share links as you"].map((t) => (
          <li key={t} className="flex gap-2.5">
            <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2460e8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <path d="M3 8.5l3 3 7-7" />
            </svg>
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-3 rounded-[14px] bg-[#f6f7f8] p-3">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" referrerPolicy="no-referrer" className="size-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e3ecff] text-[14px] font-medium text-[#2460e8]">
            {(user.name || user.email).slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-outfit truncate text-[14px] font-medium text-[#141414]">{username ? `@${username}` : user.name || user.email}</p>
          <p className="font-outfit truncate text-[12.5px] text-[#7b8188]">{user.email}</p>
        </div>
      </div>

      <form method="post" action="/api/oauth/authorize" className="mt-6">
        {Object.entries(fields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <input type="hidden" name="issued_at" value={issuedAt} />
        <input type="hidden" name="sig" value={sig} />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="submit"
            name="decision"
            value="deny"
            className="font-outfit min-h-12 cursor-pointer rounded-[13px] bg-white text-[15px] font-semibold text-[#141414] ring-1 ring-black/[0.1] hover:bg-[#f6f7f8] active:translate-y-px"
          >
            Deny
          </button>
          <button type="submit" name="decision" value="allow" className="blue-button blue-button-large w-full">
            Allow
          </button>
        </div>
      </form>
      <p className="font-outfit mt-4 text-[12.5px] leading-relaxed text-[#7b8188]">
        You’ll go back to <span className="font-medium text-[#3a3d40]">{backLabel}</span>. Disconnect it any time from the account panel in the studio.
      </p>
    </Card>
  );
}

function Title({ app }: { app: string }) {
  return (
    <h1 className="font-lexend text-[clamp(1.5rem,4vw,1.85rem)] font-light leading-[1.15] tracking-[-0.03em] text-[#121416]">
      <span className="font-normal">{app}</span> wants to use your Imaginry account
    </h1>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 w-full max-w-[440px] rounded-[26px] bg-white p-6 shadow-[0_1px_2px_rgba(20,30,40,0.06),0_40px_80px_-30px_rgba(20,40,60,0.45)] sm:p-8">
      <div className="mb-6 flex items-center gap-2 text-[#141414]">
        <LogoMark size={24} />
        <span className="font-outfit text-[17px] font-medium tracking-tight">imaginry</span>
      </div>
      {children ?? <div className="h-40 animate-pulse rounded-[14px] bg-[#f3f4f5]" />}
    </div>
  );
}
