"use client";

import { useRef, useState } from "react";
import { X } from "@/components/icons";
import { useClickOutside } from "@/components/studio/controls";
import {
  displayName,
  NAME_MAX,
  SOCIALS,
  USERNAME_MAX,
  usernameError,
  type Profile,
  type SocialKey,
} from "@/lib/profile";

const field =
  "h-10 w-full rounded-[12px] bg-white/[0.05] px-3 text-[13.5px] text-bone outline-none transition-colors placeholder:text-bone/30 focus:bg-white/[0.09]";

function Label({ children, error }: { children: React.ReactNode; error?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between text-[12px]">
      <span className="text-bone/55">{children}</span>
      {error && <span className="text-ember">{error}</span>}
    </span>
  );
}

/** Pop-up card for editing your public profile. The avatar comes from Google and can't be changed here. */
export default function ProfileEditor({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (p: Profile) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, true, onClose);
  const [username, setUsername] = useState(profile.username);
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [socials, setSocials] = useState<Record<string, string>>({ ...profile.socials });
  const [isPublic, setIsPublic] = useState(profile.isPublic);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const localUsernameError = username ? usernameError(username) : `At least 3 characters`;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localUsernameError) return setErrors({ username: localUsernameError });
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, firstName, lastName, socials, isPublic }),
      });
      const body = await res.json();
      if (body.errors) return setErrors(body.errors);
      if (!res.ok) return setErrors({ form: body.error ?? "Couldn’t save" });
      onSaved(body.profile);
    } catch {
      setErrors({ form: "Couldn’t reach the server" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div
        ref={ref}
        role="dialog"
        aria-label="Edit profile"
        className="anim-pop glass-panel flex max-h-[calc(100dvh-32px)] w-[460px] max-w-full flex-col rounded-[26px] text-bone"
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="font-display text-[20px]">Profile</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="press text-bone/60 hover:text-bone">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4">
            <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.04] p-3">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.image} alt="" referrerPolicy="no-referrer" className="size-12 rounded-full object-cover" />
              ) : (
                <span className="grid size-12 place-items-center rounded-full bg-ember/20 font-display text-ember">
                  {username.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[14px]">{displayName({ username, firstName, lastName })}</p>
                <p className="text-[12px] text-bone/45">Your picture comes from your Google account.</p>
              </div>
            </div>

            <label className="block">
              <Label error={errors.username}>Username</Label>
              <div className="flex h-10 items-center rounded-[12px] bg-white/[0.05] pl-3 transition-colors focus-within:bg-white/[0.09]">
                <span className="text-[13.5px] text-bone/35">imaginry.tech/profile/</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  maxLength={USERNAME_MAX}
                  minLength={3}
                  required
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!!errors.username}
                  className="h-full min-w-0 flex-1 bg-transparent pr-3 text-[13.5px] outline-none"
                />
              </div>
              {!errors.username && username !== profile.username && localUsernameError && (
                <span className="mt-1 block text-[12px] text-bone/45">{localUsernameError}</span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <Label error={errors.firstName}>First name (optional)</Label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={NAME_MAX} className={field} />
              </label>
              <label className="block">
                <Label error={errors.lastName}>Last name (optional)</Label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={NAME_MAX} className={field} />
              </label>
            </div>

            <div>
              <p className="mb-1.5 text-[12px] text-bone/55">Links (optional)</p>
              <div className="space-y-2">
                {SOCIALS.map((s) => (
                  <label key={s.key} className="block">
                    <div className="flex h-10 items-center gap-2 rounded-[12px] bg-white/[0.05] pl-3 transition-colors focus-within:bg-white/[0.09]">
                      <span className="w-[72px] shrink-0 text-[12.5px] text-bone/50">{s.label}</span>
                      <input
                        value={socials[s.key] ?? ""}
                        onChange={(e) => setSocials((v) => ({ ...v, [s.key as SocialKey]: e.target.value }))}
                        placeholder={s.placeholder}
                        autoComplete="off"
                        spellCheck={false}
                        aria-label={`${s.label} link`}
                        aria-invalid={!!errors[`socials.${s.key}`]}
                        className="h-full min-w-0 flex-1 bg-transparent pr-3 text-[13px] outline-none placeholder:text-bone/25"
                      />
                    </div>
                    {errors[`socials.${s.key}`] && (
                      <span className="mt-1 block text-[12px] text-ember">{errors[`socials.${s.key}`]}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic((v) => !v)}
              className="flex w-full items-center justify-between gap-3 rounded-[16px] bg-white/[0.04] p-3 text-left"
            >
              <span>
                <span className="block text-[13.5px]">{isPublic ? "Public profile" : "Private profile"}</span>
                <span className="block text-[12px] leading-relaxed text-bone/45">
                  {isPublic
                    ? "Anyone can see your profile, and your designs appear in Explore."
                    : "Only you can see your profile, and your designs are hidden from Explore."}
                </span>
              </span>
              <span
                className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-300 ${isPublic ? "bg-ember" : "bg-white/15"}`}
              >
                <span
                  className={`absolute top-1 size-4 rounded-full bg-bone transition-transform duration-300 ${isPublic ? "translate-x-5" : "translate-x-1"}`}
                />
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-3">
            <span className="min-w-0 truncate text-[12px] text-ember">{errors.form}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="press h-10 rounded-full px-4 text-[13px] text-bone/70 hover:bg-white/[0.06] hover:text-bone"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="press h-10 rounded-full bg-bone px-5 text-[13px] font-medium text-ink hover:bg-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
