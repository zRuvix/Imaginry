"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDesignImages } from "@/components/explore/DesignGrid";
import type { SharedDesign } from "@/lib/profile";
import { BTN_MOTION, CARD_MOTION, ZOOM_MOTION } from "./buttonMotion";

type Page = { designs: SharedDesign[]; next: string | null };

/** Newest designs people published from the studio, rendered live, in white frames. */
export default function ExploreFeed() {
  const [designs, setDesigns] = useState<SharedDesign[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (before: string | null): Promise<Page> => {
    const res = await fetch(`/api/designs${before ? `?before=${encodeURIComponent(before)}` : ""}`);
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
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
    } catch {
      // Keep what is shown; the button stays for another try.
    } finally {
      setLoadingMore(false);
    }
  };

  const urls = useDesignImages(designs);

  if (status === "error") {
    return <p className="font-outfit text-[15px] text-[#6b7075]">Couldn’t load designs. Refresh to try again.</p>;
  }

  if (status === "ready" && designs.length === 0) {
    return (
      <div className="rounded-[20px] bg-[#f6f7f8] px-6 py-16 text-center">
        <p className="font-lexend text-[26px] font-light tracking-[-0.03em] text-[#121416]">Nothing shared yet</p>
        <p className="font-outfit mx-auto mt-2 max-w-[40ch] text-[14.5px] text-[#6b7075]">
          Make something in the studio, sign in with Google and publish it to be the first here.
        </p>
        <Link
          href="/studio"
          className={`font-outfit mt-6 inline-flex rounded-[10px] bg-[#1b1b1b] px-5 py-3 text-[14px] text-white hover:bg-[#2b2b2b] ${BTN_MOTION}`}
        >
          Open studio
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className="grid gap-x-3 gap-y-8 sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-3 2xl:grid-cols-4">
        {status === "loading"
          ? Array.from({ length: 8 }, (_, i) => (
              <li key={i} aria-hidden>
                <div className="rounded-[18px] bg-white p-1.5 ring-1 ring-black/[0.05] sm:rounded-[22px] sm:p-2">
                  <div className="aspect-[4/3] animate-pulse rounded-[12px] bg-[#f3f4f5] sm:rounded-[15px]" />
                </div>
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-[#f3f4f5]" />
              </li>
            ))
          : designs.map((d) => (
              <li key={d.id}>
                <Link href={`/studio#${d.data}`} className="group block" aria-label={`Remix ${d.title} in the studio`}>
                  <div
                    className={`rounded-[18px] bg-white p-1.5 shadow-[0_1px_2px_rgba(20,30,40,0.06),0_24px_50px_-28px_rgba(20,40,60,0.4)] ring-1 ring-black/[0.05] sm:rounded-[22px] sm:p-2 ${CARD_MOTION}`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[#f3f4f5] sm:rounded-[15px]">
                      {urls[d.id] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={urls[d.id]}
                          alt=""
                          className={`absolute inset-0 size-full object-cover ${ZOOM_MOTION}`}
                          style={{ animation: "look-in 0.9s cubic-bezier(0.22,1,0.36,1) both" }}
                        />
                      )}
                    </div>
                  </div>
                </Link>
                <div className="font-outfit mt-3 flex items-baseline justify-between gap-3 px-1">
                  <span className="truncate text-[15px] text-[#141414]">{d.title}</span>
                  <Link
                    href={`/profile/${d.username}`}
                    className="shrink-0 text-[13px] text-[#9a9fa4] underline-offset-4 transition-colors hover:text-[#141414] hover:underline"
                  >
                    @{d.username}
                  </Link>
                </div>
              </li>
            ))}
      </ul>

      {next && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={more}
            disabled={loadingMore}
            className={`font-outfit rounded-[10px] bg-[#f3f4f5] px-5 py-3 text-[14px] text-[#141414] hover:bg-[#e9ebed] disabled:cursor-wait disabled:opacity-60 ${BTN_MOTION}`}
          >
            {loadingMore ? "Loading…" : "Show more designs"}
          </button>
        </div>
      )}
    </>
  );
}
