"use client";

import Link from "next/link";
import { useRef, useState, type ComponentType, type ReactNode } from "react";
import { ArrowUpRight, CreditCard, LogOut, Plug, UserCard, X } from "@/components/icons";
import { ProfileForm } from "@/components/profile/ProfileEditor";
import { authClient } from "@/lib/auth-client";
import type { Profile } from "@/lib/profile";
import BillingPanel, { BILLING_AVAILABLE } from "./BillingPanel";
import McpAccess from "./McpAccess";
import { useClickOutside } from "./controls";

export type AccountSection = "account" | "billing" | "mcp";

const SECTIONS: { id: AccountSection; label: string; title: string; blurb: string; Icon: ComponentType<{ size?: number }> }[] = [
  { id: "account", label: "Account", title: "Account", blurb: "How you appear on Imaginry, and the identity you sign in with.", Icon: UserCard },
  { id: "billing", label: "Plan & billing", title: "Plan & billing", blurb: "What you have and what it costs.", Icon: CreditCard },
  { id: "mcp", label: "MCP", title: "MCP", blurb: "Let AI apps use the studio with your account.", Icon: Plug },
];

const RED = "bg-[#e5484d] text-white hover:bg-[#d63c41]";
const SOFT =
  "press flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-bone/85 transition-colors hover:bg-white/[0.14] hover:text-bone disabled:opacity-50";

/**
 * The studio's account settings: a sidebar of sections (Account, Plan &
 * billing, MCP) beside the open one, on frosted glass. Sections mount when
 * first opened and stay mounted, so unsaved profile edits survive a switch.
 */
export default function AccountPanel({
  email,
  profile,
  initial = "account",
  justUpgraded = false,
  onProfile,
  onClose,
}: {
  email: string;
  /** Null while the profile is still loading. */
  profile: Profile | null;
  initial?: AccountSection;
  justUpgraded?: boolean;
  onProfile: (p: Profile) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, true, onClose);
  const [section, setSection] = useState<AccountSection>(initial);
  const [opened, setOpened] = useState<Set<AccountSection>>(() => new Set([initial]));

  const open = (id: AccountSection) => {
    setSection(id);
    setOpened((s) => (s.has(id) ? s : new Set(s).add(id)));
  };

  const body: Record<AccountSection, ReactNode> = {
    account: <AccountSectionBody email={email} profile={profile} onProfile={onProfile} onClose={onClose} />,
    billing: <BillingPanel justUpgraded={justUpgraded} />,
    mcp: <McpAccess />,
  };

  return (
    <div className="frost-scrim fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={ref}
        role="dialog"
        aria-label="Account settings"
        className="anim-pop frost-panel flex h-[min(620px,calc(100dvh-32px))] w-[840px] max-w-full flex-col overflow-hidden rounded-[26px] text-bone sm:flex-row"
      >
        <nav aria-label="Settings" className="frost-side flex shrink-0 flex-row items-center gap-1 p-2.5 sm:w-[228px] sm:flex-col sm:items-stretch sm:p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="press order-last ml-auto grid size-9 shrink-0 place-items-center rounded-full text-bone/60 hover:bg-white/[0.08] hover:text-bone sm:order-none sm:mb-4 sm:ml-0"
          >
            <X size={18} />
          </button>
          {SECTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={section === id ? "page" : undefined}
              onClick={() => open(id)}
              className={`press flex h-10 items-center gap-3 rounded-[12px] px-3 text-[13.5px] transition-colors duration-200 ${
                section === id
                  ? "bg-white/[0.12] text-bone shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-bone/55 hover:bg-white/[0.05] hover:text-bone"
              }`}
            >
              <span className={section === id ? "text-bone" : "text-bone/45"}>
                <Icon size={16} />
              </span>
              <span className="whitespace-nowrap">{label}</span>
              {id === "billing" && !BILLING_AVAILABLE && (
                <span className="ml-auto hidden rounded-full bg-white/[0.08] px-2 py-0.5 text-[10.5px] text-bone/55 sm:inline">Soon</span>
              )}
            </button>
          ))}
        </nav>

        <div className="scroll-frost min-h-0 flex-1 overflow-y-auto">
          {SECTIONS.map(({ id, title, blurb }) =>
            opened.has(id) ? (
              <section key={id} hidden={section !== id} aria-labelledby={`acct-${id}`} className="px-6 py-7 sm:px-9 sm:py-9">
                <h2 id={`acct-${id}`} className="font-display text-[22px] leading-tight">
                  {title}
                </h2>
                <p className="mt-1.5 text-[13px] text-bone/50">{blurb}</p>
                <div className={`mt-7 ${section === id ? "anim-rise" : ""}`}>{body[id]}</div>
              </section>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}

/** Profile fields, the sign-in email, then sign out and delete as setting rows. */
function AccountSectionBody({
  email,
  profile,
  onProfile,
  onClose,
}: {
  email: string;
  profile: Profile | null;
  onProfile: (p: Profile) => void;
  onClose: () => void;
}) {
  return (
    <div>
      {profile ? (
        <ProfileForm profile={profile} links={false} variant="inline" onSaved={onProfile} onAvatarChange={onProfile}>
          <label className="block">
            <span className="mb-1.5 block text-[12px] text-bone/55">Email address</span>
            <input
              value={email}
              readOnly
              aria-readonly
              className="h-10 w-full cursor-default rounded-[12px] bg-white/[0.04] px-3 text-[13.5px] text-bone/50 outline-none"
            />
            <span className="mt-1.5 block text-[12px] text-bone/40">Your email comes from how you sign in: Google.</span>
          </label>
        </ProfileForm>
      ) : (
        <div className="space-y-4">
          <div className="skeleton h-[104px] rounded-[16px]" />
          <div className="skeleton h-10 rounded-[12px]" />
          <div className="skeleton h-10 rounded-[12px]" />
        </div>
      )}

      <div className="mt-8 divide-y divide-white/[0.07] border-t border-white/[0.07]">
        {profile && (
          <SettingRow title="Public page" hint={`imaginry.tech/profile/${profile.username}`}>
            <Link href={`/profile/${profile.username}`} className={SOFT}>
              View <ArrowUpRight size={12} />
            </Link>
          </SettingRow>
        )}
        <SettingRow title="Sign out" hint="End your session on this device.">
          <SignOut onDone={onClose} />
        </SettingRow>
        <DeleteRow onDone={onClose} />
      </div>
    </div>
  );
}

function SettingRow({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px]">{title}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-bone/45">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function SignOut({ onDone }: { onDone: () => void }) {
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
      className={SOFT}
    >
      <LogOut size={13} />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

function DeleteRow({ onDone }: { onDone: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    const { error } = await authClient.deleteUser();
    setBusy(false);
    if (error) {
      // Deleting needs a recent sign-in; older sessions have to sign in again first.
      setError(
        error.code === "SESSION_EXPIRED" ? "For safety, sign out and sign in again, then delete." : "Couldn’t delete your account. Try again.",
      );
      return;
    }
    onDone();
  };

  return (
    <div className="py-4">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px]">Delete account</p>
          <p className="mt-0.5 text-[12.5px] text-bone/45">Removes your account and saved designs for good.</p>
        </div>
        {!confirm && (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className={`${SOFT} hover:!bg-[#e5484d]/15 hover:!text-[#ff6b70]`}
          >
            Delete
          </button>
        )}
      </div>
      {confirm && (
        <div className="anim-pop mt-3 rounded-[14px] bg-[#e5484d]/10 p-3.5">
          <p className="text-[12.5px] leading-relaxed text-bone/75">
            This permanently deletes your account and everything we store about it. A Pro subscription isn’t cancelled by
            this; cancel it in Plan & billing first.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirm(false);
                setError(null);
              }}
              className={SOFT}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className={`press h-9 rounded-full px-4 text-[13px] font-medium transition-colors disabled:opacity-50 ${RED}`}
            >
              {busy ? "Deleting…" : "Delete forever"}
            </button>
          </div>
          {error && <p className="mt-2 text-[12px] text-[#ff6b70]">{error}</p>}
        </div>
      )}
    </div>
  );
}
