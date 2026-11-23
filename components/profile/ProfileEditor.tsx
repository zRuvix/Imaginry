"use client";

import { useRef, useState } from "react";
import { Dices, X } from "@/components/icons";
import { avatarDataUri, newAvatarSeed } from "@/lib/avatar";
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

const CANDIDATES = 5;
const deal = () => Array.from({ length: CANDIDATES }, newAvatarSeed);

/**
 * The profile picture: a generated avatar (shuffle for new ones and pick one)
 * or the Google photo. A pick saves right away, separately from the form.
 */
function AvatarPicker({
  profile,
  name,
  onChange,
}: {
  profile: Profile;
  name: string;
  onChange: (p: Profile) => void;
}) {
  const [seed, setSeed] = useState(profile.avatarSeed);
  const [candidates, setCandidates] = useState(deal);
  const [turns, setTurns] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const choose = async (next: string | null) => {
    if (next === seed) return;
    const before = seed;
    setSeed(next);
    setError(null);
    // Only the newest pick may update the screen when clicks overlap.
    const call = ++latest.current;
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: next }),
      });
      const body = await res.json();
      if (call !== latest.current) return;
      if (!res.ok) throw new Error(body.error);
      onChange(body.profile);
    } catch {
      if (call !== latest.current) return;
      setSeed(before);
      setError("Couldn’t save your picture");
    }
  };

  const shown = seed ? avatarDataUri(seed) : profile.googleImage;
  const chip = (on: boolean) =>
    `press relative size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-[#1c1a17] transition-[box-shadow,transform] duration-300 hover:scale-110 ${
      on ? "ring-bone" : "ring-transparent"
    }`;

  return (
    <div className="rounded-[16px] bg-white/[0.04] p-3">
      <div className="flex items-center gap-3">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={shown} src={shown} alt="" referrerPolicy="no-referrer" className="anim-pop size-14 rounded-full object-cover" />
        ) : (
          <span className="grid size-14 place-items-center rounded-full bg-ember/20 font-display text-[20px] text-ember">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px]">{name}</p>
          <p className={`text-[12px] ${error ? "text-ember" : "text-bone/45"}`}>
            {error ?? (seed ? "A one-of-a-kind picture, drawn from a seed." : "Your Google photo.")}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2" role="radiogroup" aria-label="Profile picture">
        {profile.googleImage && (
          <button
            type="button"
            role="radio"
            aria-checked={seed === null}
            aria-label="Use my Google photo"
            title="Your Google photo"
            onClick={() => choose(null)}
            className={chip(seed === null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.googleImage} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
          </button>
        )}
        {candidates.map((c, i) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={seed === c}
            aria-label={`Generated picture ${i + 1}`}
            onClick={() => choose(c)}
            className={`${chip(seed === c)} anim-pop`}
            style={{ animationDelay: `${i * 45}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarDataUri(c)} alt="" className="size-full" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setCandidates(deal());
            setTurns((t) => t + 1);
          }}
          aria-label="Shuffle new pictures"
          title="Shuffle"
          className="press ml-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-bone/75 hover:bg-white/[0.12] hover:text-bone"
        >
          <span className="transition-transform duration-500" style={{ transform: `rotate(${turns * 180}deg)` }}>
            <Dices size={15} />
          </span>
        </button>
      </div>
    </div>
  );
}

/** Pop-up card for editing your public profile. */
export default function ProfileEditor({
  profile,
  onClose,
  onSaved,
  onAvatarChange,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (p: Profile) => void;
  /** A new picture was saved (the form stays open). */
  onAvatarChange?: (p: Profile) => void;
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
            <AvatarPicker
              profile={profile}
              name={displayName({ username, firstName, lastName })}
              onChange={(p) => onAvatarChange?.(p)}
            />

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
                className="blue-button h-10 rounded-full px-4 text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="blue-button h-10 rounded-full px-5 text-[13px] font-semibold disabled:opacity-60"
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
