"use client";

import { useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "@/components/icons";
import { authClient } from "@/lib/auth-client";
import { useClickOutside } from "./controls";

function GoogleMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function Avatar({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" referrerPolicy="no-referrer" className="size-8 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ember/20 text-[13px] font-medium text-ember">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Collapsed account row under the Library; opens upward to sign in or out. */
export default function AccountBar() {
  const { data, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));
  const user = data?.user;

  const signIn = async () => {
    setBusy(true);
    // Redirects to Google; comes back to the studio once the callback finishes.
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/studio" });
    if (error) setBusy(false);
  };
  const signOut = async () => {
    setBusy(true);
    await authClient.signOut();
    setBusy(false);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative h-full">
      {open && (
        <div
          role="dialog"
          aria-label="Account"
          className="anim-pop glass-panel absolute inset-x-0 bottom-[calc(100%+8px)] rounded-[20px] p-3"
        >
          {user ? (
            <>
              <div className="flex items-center gap-2.5 px-1 pb-3">
                <Avatar src={user.image} name={user.name || user.email} />
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] text-bone">{user.name}</p>
                  <p className="truncate text-[12px] text-bone/50">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                disabled={busy}
                className="press flex h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-raised text-[13px] text-bone/80 hover:text-bone disabled:opacity-50"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <p className="px-1 pb-3 text-[12.5px] leading-relaxed text-bone/55">
                Sign in to keep your designs with your account. The studio stays free without it.
              </p>
              <button
                type="button"
                onClick={signIn}
                disabled={busy}
                className="press flex h-10 w-full items-center justify-center gap-2.5 rounded-[14px] bg-bone text-[13px] font-medium text-ink hover:bg-white disabled:opacity-60"
              >
                <GoogleMark />
                {busy ? "Opening Google…" : "Continue with Google"}
              </button>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="glass-panel press flex size-full items-center gap-2.5 rounded-[20px] px-2.5 text-left hover:bg-raised/60"
      >
        {isPending ? (
          <span className="skeleton size-8 shrink-0 rounded-full" />
        ) : user ? (
          <Avatar src={user.image} name={user.name || user.email} />
        ) : (
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-raised text-bone/60">
            <User size={16} />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[13px] text-bone/80">
          {isPending ? "" : user ? user.name || user.email : "Sign in"}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-bone/45 transition-transform duration-300 ${open ? "" : "rotate-180"}`}
        />
      </button>
    </div>
  );
}
