"use client";

import Link from "next/link";
import { Roboto } from "next/font/google";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, ChevronDown, LogOut, User, X } from "@/components/icons";
import ProfileEditor from "@/components/profile/ProfileEditor";
import { authClient } from "@/lib/auth-client";
import { useMyProfile } from "@/lib/useMyProfile";
import { useClickOutside } from "./controls";

// Google's sign-in branding asks for Roboto Medium on the button.
const roboto = Roboto({ weight: "500", subsets: ["latin"] });

function GoogleMark({ size = 20 }: { size?: number }) {
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

const RED = "bg-[#e5484d] text-white hover:bg-[#d63c41]";

/** Small red sign-out pill, pinned in the account panel's footer. */
function SignOutButton({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        setBusy(false);
        onDone();
      }}
      disabled={busy}
      className={`press flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors disabled:opacity-50 ${RED}`}
    >
      <LogOut size={14} />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

/** Bottom of the account panel: who is signed in, their public page, delete. */
function AccountActions({ email, username, onDone }: { email: string; username?: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = async () => {
    setBusy(true);
    setError(null);
    const { error } = await authClient.deleteUser();
    setBusy(false);
    if (error) {
      // Deleting needs a recent sign-in; older sessions have to sign in again first.
      setError(
        error.code === "SESSION_EXPIRED"
          ? "For safety, sign out and sign in again, then delete."
          : "Couldn’t delete your account. Try again.",
      );
      return;
    }
    onDone();
  };

  return (
    <div className="rounded-[16px] bg-white/[0.04] p-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px]">Signed in with Google</p>
          <p className="truncate text-[12px] text-bone/45">{email}</p>
        </div>
        {username && (
          <Link
            href={`/profile/${username}`}
            className="press flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-bone/80 hover:bg-white/[0.12] hover:text-bone"
          >
            View profile <ArrowUpRight size={12} />
          </Link>
        )}
      </div>

      {confirmDelete ? (
        <div className="anim-pop mt-3 rounded-[12px] bg-[#e5484d]/10 p-3">
          <p className="text-[12.5px] leading-relaxed text-bone/75">
            This permanently deletes your account and everything we store about it.
          </p>
          <div className="mt-2.5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                setError(null);
              }}
              className="press h-8 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-bone/80 hover:bg-white/[0.12]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteAccount}
              disabled={busy}
              className={`press h-8 rounded-full px-3 text-[12.5px] font-medium transition-colors disabled:opacity-50 ${RED}`}
            >
              {busy ? "Deleting…" : "Delete forever"}
            </button>
          </div>
          {error && <p className="mt-2 text-[12px] text-[#ff6b70]">{error}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="mt-2 text-[12px] text-bone/40 transition-colors hover:text-[#ff6b70]"
        >
          Delete account
        </button>
      )}
    </div>
  );
}

/** Shown for the moment between sign-in and the profile arriving. */
function PanelLoading({ email, onClose }: { email: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, true, onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div
        ref={ref}
        role="dialog"
        aria-label="Account"
        className="anim-pop glass-panel w-[460px] max-w-full rounded-[26px] p-5 text-bone"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[20px]">Account</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="press text-bone/60 hover:text-bone">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-[104px] rounded-[16px]" />
          <div className="skeleton h-10 rounded-[12px]" />
          <AccountActions email={email} onDone={onClose} />
        </div>
        <div className="mt-4">
          <SignOutButton onDone={onClose} />
        </div>
      </div>
    </div>
  );
}

/** Account row under the Library: opens the account panel, or a sign-in card when signed out. */
export default function AccountBar() {
  const { session, profile, setProfile } = useMyProfile();
  const { data, isPending } = session;
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(false);
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

  return (
    <div ref={ref} className="relative h-full">
      {panel &&
        user &&
        createPortal(
          profile ? (
            <ProfileEditor
              title="Account"
              links={false}
              profile={profile}
              onClose={() => setPanel(false)}
              onSaved={(p) => {
                setProfile(p);
                setPanel(false);
              }}
              onAvatarChange={setProfile}
              footerStart={<SignOutButton onDone={() => setPanel(false)} />}
            >
              <AccountActions email={user.email} username={profile.username} onDone={() => setPanel(false)} />
            </ProfileEditor>
          ) : (
            <PanelLoading email={user.email} onClose={() => setPanel(false)} />
          ),
          document.body,
        )}
      {open && !user && (
        <div
          role="dialog"
          aria-label="Sign in"
          className="anim-pop glass-panel absolute inset-x-0 bottom-[calc(100%+8px)] rounded-[20px] p-3"
        >
          <p className="px-1 pb-3 text-[12.5px] leading-relaxed text-bone/55">
            Sign in to keep your designs with your account. The studio stays free without it.
          </p>
          <button
            type="button"
            onClick={signIn}
            disabled={busy}
            className={`${roboto.className} press flex h-10 w-full items-center justify-center gap-2.5 rounded-full border border-[#8E918F] bg-[#131314] px-3 text-[14px] leading-5 text-[#E3E3E3] hover:bg-[#1f1f20] disabled:opacity-60`}
          >
            <GoogleMark />
            {busy ? "Opening Google…" : "Continue with Google"}
          </button>
          <p className="px-1 pt-2.5 text-[11.5px] leading-relaxed text-bone/40">
            By continuing you agree to our{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-bone/70">
              terms
            </a>{" "}
            and{" "}
            <a href="/privacy#google" className="underline underline-offset-2 hover:text-bone/70">
              privacy policy
            </a>
            .
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => (user ? setPanel(true) : setOpen((v) => !v))}
        aria-expanded={user ? panel : open}
        aria-haspopup="dialog"
        className="glass-panel press flex size-full items-center gap-2.5 rounded-[20px] px-2.5 text-left hover:bg-raised/60"
      >
        {isPending ? (
          <span className="skeleton size-8 shrink-0 rounded-full" />
        ) : user ? (
          <Avatar src={profile ? profile.image : user.image} name={user.name || user.email} />
        ) : (
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-raised text-bone/60">
            <User size={16} />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[13px] text-bone/80">
          {isPending ? "" : user ? (profile ? `@${profile.username}` : user.name || user.email) : "Sign in"}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-bone/45 transition-transform duration-300 ${open || panel ? "" : "rotate-180"}`}
        />
      </button>
    </div>
  );
}
