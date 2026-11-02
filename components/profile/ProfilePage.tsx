"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Lock, Pencil } from "@/components/icons";
import DesignGrid from "@/components/explore/DesignGrid";
import SiteHeader from "@/components/explore/SiteHeader";
import LaunchButton from "@/components/landing/LaunchButton";
import { displayName, SOCIALS, type Profile, type SharedDesign } from "@/lib/profile";
import { useMyProfile } from "@/lib/useMyProfile";
import ProfileEditor from "./ProfileEditor";

type Page =
  | { private: true; username: string }
  | { private: false; isOwner: boolean; profile: Profile; designs: SharedDesign[] };

/** /profile/<username>: someone's details, links and published designs. */
export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, setProfile } = useMyProfile();
  const [page, setPage] = useState<Page | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(`/api/profiles/${encodeURIComponent(username)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) return setStatus("missing");
        if (!res.ok) return setStatus("error");
        setPage(await res.json());
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
    // Refetch when the viewer signs in or out, since owners see their private profile.
  }, [username, user?.id]);

  const deleteDesign = async (d: SharedDesign) => {
    if (!confirm(`Delete “${d.title}”? This can’t be undone.`)) return;
    const res = await fetch(`/api/designs/${d.id}`, { method: "DELETE" });
    if (res.ok && page && !page.private) {
      setPage({ ...page, designs: page.designs.filter((x) => x.id !== d.id) });
    }
  };

  const blocked = status === "missing" || status === "error" || (status === "ready" && page?.private);

  return (
    <div className="min-h-screen bg-ink text-bone selection:bg-ember/40">
      <div
        aria-hidden
        className="pointer-events-none fixed left-[30%] top-[-20%] h-[70vh] w-[60vw] rounded-full bg-ember/[0.07] blur-[140px]"
      />
      <SiteHeader />
      <main className="relative mx-auto max-w-[1400px] px-4 pb-24 md:px-6">
        {status === "loading" && (
          <div className="mt-6 flex items-center gap-5">
            <div className="skeleton size-24 rounded-full" />
            <div className="space-y-3">
              <div className="skeleton h-8 w-56 rounded-full" />
              <div className="skeleton h-4 w-32 rounded-full" />
            </div>
          </div>
        )}

        {blocked && (
          <div className="mx-auto mt-16 max-w-[440px] rounded-[26px] bg-white/[0.04] px-6 py-14 text-center">
            {page?.private && status === "ready" ? (
              <>
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-white/[0.06] text-bone/60">
                  <Lock size={18} />
                </span>
                <p className="mt-4 font-display text-[22px]">@{page.username} is private</p>
                <p className="mt-2 text-[14px] text-bone/55">This profile and its designs are only visible to its owner.</p>
              </>
            ) : (
              <>
                <p className="font-display text-[22px]">
                  {status === "missing" ? "No such profile" : "Couldn’t load this profile"}
                </p>
                <p className="mt-2 text-[14px] text-bone/55">
                  {status === "missing" ? `Nobody is called @${username} yet.` : "Refresh to try again."}
                </p>
              </>
            )}
          </div>
        )}

        {status === "ready" && page && !page.private && (
          <>
            <section className="mb-10 mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-5">
                {page.profile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={page.profile.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="size-20 rounded-full object-cover md:size-24"
                  />
                ) : (
                  <span className="grid size-20 place-items-center rounded-full bg-ember/20 font-display text-[32px] text-ember md:size-24">
                    {page.profile.username.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <h1 className="truncate font-display text-[clamp(28px,3.4vw,44px)] leading-none tracking-[-0.02em]">
                    {displayName(page.profile)}
                  </h1>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-bone/55">
                    @{page.profile.username}
                    {!page.profile.isPublic && (
                      <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[12px]">
                        <Lock size={11} /> Private
                      </span>
                    )}
                    <span className="text-bone/30">·</span>
                    {page.designs.length} {page.designs.length === 1 ? "design" : "designs"}
                  </p>
                  {Object.keys(page.profile.socials).length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {SOCIALS.filter((s) => page.profile.socials[s.key]).map((s) => (
                        <li key={s.key}>
                          <a
                            href={page.profile.socials[s.key]}
                            target="_blank"
                            rel="noopener nofollow ugc"
                            className="press inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-bone/75 hover:bg-white/[0.12] hover:text-bone"
                          >
                            {s.label} <ArrowUpRight size={11} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {page.isOwner && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="press flex h-10 items-center gap-2 self-start rounded-full bg-white/[0.06] px-4 text-[13.5px] text-bone/85 hover:bg-white/[0.12] hover:text-bone md:self-auto"
                >
                  <Pencil size={13} /> Edit profile
                </button>
              )}
            </section>

            {page.designs.length > 0 ? (
              <DesignGrid designs={page.designs} showAuthor={false} onDelete={page.isOwner ? deleteDesign : undefined} />
            ) : (
              <div className="rounded-[26px] bg-white/[0.04] px-6 py-14 text-center">
                <p className="font-display text-[20px]">No designs yet</p>
                <p className="mx-auto mt-2 max-w-[360px] text-[14px] text-bone/55">
                  {page.isOwner
                    ? "Make something in the studio and press the globe button to publish it here."
                    : "Nothing published so far."}
                </p>
                {page.isOwner && (
                  <div className="mt-6 flex justify-center">
                    <LaunchButton className="h-11 bg-bone px-5 text-[14px] text-ink hover:bg-white" iconSize={14} />
                  </div>
                )}
              </div>
            )}

            {editing && (
              <ProfileEditor
                profile={page.profile}
                onClose={() => setEditing(false)}
                onSaved={(p) => {
                  setProfile(p);
                  setEditing(false);
                  setPage({ ...page, profile: p });
                  // A new username means a new address.
                  if (p.username !== page.profile.username) {
                    window.history.replaceState(null, "", `/profile/${p.username}`);
                  }
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
