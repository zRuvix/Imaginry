"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, User } from "@/components/icons";
import GoogleSignIn from "./GoogleSignIn";
import AccountPanel from "./AccountPanel";
import { useMyProfile } from "@/lib/useMyProfile";
import { useClickOutside } from "./controls";

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

/** Account row under the Library: opens the account panel, or a sign-in card when signed out. */
export default function AccountBar() {
  const { session, profile, setProfile } = useMyProfile();
  const { data, isPending } = session;
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(false);
  // Back from Dodo checkout: paid (?upgraded=1) or Back pressed (?account=billing)
  // both open the panel on Plan & billing.
  const [upgraded, setUpgraded] = useState(false);
  const [initial, setInitial] = useState<"account" | "billing">("account");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));
  const user = data?.user;

  useEffect(() => {
    if (!user) return;
    const url = new URL(window.location.href);
    const paid = url.searchParams.get("upgraded") === "1";
    if (!paid && url.searchParams.get("account") !== "billing") return;
    url.searchParams.delete("upgraded");
    url.searchParams.delete("account");
    window.history.replaceState(null, "", url);
    setUpgraded(paid);
    setInitial("billing");
    setPanel(true);
  }, [user]);

  return (
    <div ref={ref} className="relative h-full">
      {panel &&
        user &&
        createPortal(
          <AccountPanel
            email={user.email}
            profile={profile}
            initial={initial}
            justUpgraded={upgraded}
            onProfile={setProfile}
            onClose={() => {
              setPanel(false);
              setUpgraded(false);
              setInitial("account");
            }}
          />,
          document.body,
        )}
      {open && !user && (
        <div
          role="dialog"
          aria-label="Sign in"
          className="anim-pop glass-panel absolute inset-x-0 bottom-[calc(100%+8px)] rounded-[20px] p-3"
        >
          <p className="px-1 pb-3 text-[12.5px] leading-relaxed text-bone/55">
            Sign in with a free account to export and to keep your designs with you.
          </p>
          <GoogleSignIn />
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
