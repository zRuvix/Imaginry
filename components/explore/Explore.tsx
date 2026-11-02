"use client";

import { useCallback, useEffect, useState } from "react";
import LaunchButton from "@/components/landing/LaunchButton";
import type { SharedDesign } from "@/lib/profile";
import DesignGrid from "./DesignGrid";
import SiteHeader from "./SiteHeader";

/** Newest designs people have published from the studio. */
export default function Explore() {
  const [designs, setDesigns] = useState<SharedDesign[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (before: string | null) => {
    const res = await fetch(`/api/designs${before ? `?before=${encodeURIComponent(before)}` : ""}`);
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as { designs: SharedDesign[]; next: string | null };
  }, []);

  useEffect(() => {
    load(null)
      .then((page) => {
        setDesigns(page.designs);
        setNext(page.next);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [load]);

  const more = async () => {
    if (!next) return;
    setLoadingMore(true);
    try {
      const page = await load(next);
      setDesigns((d) => [...d, ...page.designs.filter((x) => !d.some((y) => y.id === x.id))]);
      setNext(page.next);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-bone selection:bg-ember/40">
      <div
        aria-hidden
        className="pointer-events-none fixed left-[30%] top-[-20%] h-[70vh] w-[60vw] rounded-full bg-ember/[0.07] blur-[140px]"
      />
      <SiteHeader />
      <main className="relative mx-auto max-w-[1400px] px-4 pb-24 md:px-6">
        <div className="mb-8 mt-4 max-w-[640px]">
          <h1 className="font-display text-[clamp(32px,4vw,52px)] leading-none tracking-[-0.02em]">Explore</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-bone/60">
            Designs people made in the studio and chose to share. Open any of them and remix it into your own. Shared
            designs carry only effect settings, never photos.
          </p>
        </div>

        {status === "loading" && (
          <div className="grid gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton aspect-[4/3] rounded-[22px]" />
            ))}
          </div>
        )}
        {status === "error" && <p className="text-[14px] text-bone/60">Couldn’t load designs. Refresh to try again.</p>}
        {status === "ready" && designs.length === 0 && (
          <div className="rounded-[26px] bg-white/[0.04] px-6 py-16 text-center">
            <p className="font-display text-[22px]">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-[380px] text-[14px] text-bone/55">
              Make something in the studio, sign in with Google, and publish it to be the first.
            </p>
            <div className="mt-6 flex justify-center">
              <LaunchButton className="h-11 bg-bone px-5 text-[14px] text-ink hover:bg-white" iconSize={14} />
            </div>
          </div>
        )}
        {designs.length > 0 && <DesignGrid designs={designs} />}
        {next && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={more}
              disabled={loadingMore}
              className="press h-11 rounded-full bg-white/[0.06] px-6 text-[14px] text-bone hover:bg-white/[0.12] disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
