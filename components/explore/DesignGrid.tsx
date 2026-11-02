"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Share2, Trash } from "@/components/icons";
import LaunchButton from "@/components/landing/LaunchButton";
import type { SharedDesign } from "@/lib/profile";
import { renderOffscreen } from "@/lib/studio/renderer";
import { decodeShare } from "@/lib/studio/storage";

const W = 640;
const H = 480;

/**
 * Renders each design's thumbnail on the shared offscreen WebGL context,
 * one at a time, and returns object URLs keyed by design id.
 */
function useDesignImages(designs: SharedDesign[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = designs.map((d) => d.id).join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const list = useMemo(() => designs, [key]);

  useEffect(() => {
    let cancelled = false;
    const made: Record<string, string> = {};
    (async () => {
      for (const d of list) {
        if (cancelled) return;
        if (made[d.id]) continue;
        const state = decodeShare(`#${d.data}`);
        if (!state) continue;
        try {
          const canvas = await renderOffscreen(state, W, H, { time: 2, detail: 900 / H });
          const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.88));
          if (!blob || cancelled) return;
          made[d.id] = URL.createObjectURL(blob);
          setUrls((prev) => ({ ...prev, [d.id]: made[d.id] }));
        } catch (e) {
          console.error(e);
          return;
        }
        await new Promise((r) => setTimeout(r, 0));
      }
    })();
    return () => {
      cancelled = true;
      Object.values(made).forEach((u) => URL.revokeObjectURL(u));
      setUrls({});
    };
  }, [list]);

  return urls;
}

function Card({
  design,
  url,
  index,
  showAuthor,
  onCopy,
  onDelete,
}: {
  design: SharedDesign;
  url?: string;
  index: number;
  showAuthor: boolean;
  onCopy: (d: SharedDesign) => void;
  onDelete?: (d: SharedDesign) => void;
}) {
  return (
    <article className="anim-rise group" style={{ animationDelay: `${Math.min(index, 16) * 40}ms` }}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-surface shadow-[0_24px_50px_-28px_rgba(0,0,0,0.9)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={design.title}
            className="size-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="skeleton size-full" />
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-16 opacity-0 transition-opacity duration-500 group-focus-within:opacity-100 group-hover:opacity-100">
          <LaunchButton
            href={`/studio#${design.data}`}
            label="Remix in studio"
            className="h-10 bg-bone pl-3.5 pr-4 text-[13.5px] text-ink hover:bg-white"
            iconSize={13}
          />
          <div className="flex gap-1.5">
            {onDelete && (
              <button
                type="button"
                aria-label={`Delete ${design.title}`}
                onClick={() => onDelete(design)}
                className="press flex size-10 items-center justify-center rounded-full bg-black/45 text-bone backdrop-blur-md hover:bg-ember hover:text-ink"
              >
                <Trash size={14} />
              </button>
            )}
            <button
              type="button"
              aria-label={`Copy a link to ${design.title}`}
              onClick={() => onCopy(design)}
              className="press flex size-10 items-center justify-center rounded-full bg-black/45 text-bone backdrop-blur-md hover:bg-black/65"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2.5 px-1">
        {showAuthor && (
          <Link href={`/profile/${design.username}`} aria-label={`@${design.username}`} className="shrink-0">
            {design.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={design.image} alt="" referrerPolicy="no-referrer" className="size-7 rounded-full object-cover" />
            ) : (
              <span className="grid size-7 place-items-center rounded-full bg-ember/20 text-[12px] text-ember">
                {design.username.slice(0, 1).toUpperCase()}
              </span>
            )}
          </Link>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-condensed text-[16px] font-semibold text-bone">{design.title}</h3>
          {showAuthor && (
            <Link href={`/profile/${design.username}`} className="block truncate text-[13px] text-bone/50 hover:text-bone">
              @{design.username}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/** Grid of shared designs with remix, copy-link and (for the owner) delete actions. */
export default function DesignGrid({
  designs,
  showAuthor = true,
  onDelete,
}: {
  designs: SharedDesign[];
  showAuthor?: boolean;
  onDelete?: (d: SharedDesign) => void;
}) {
  const urls = useDesignImages(designs);
  const [toast, setToast] = useState<{ msg: string; n: number } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const copy = async (d: SharedDesign) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/studio#${d.data}`);
      setToast({ msg: `Link to “${d.title}” copied`, n: Date.now() });
    } catch {
      setToast({ msg: "Couldn't reach the clipboard", n: Date.now() });
    }
  };

  return (
    <>
      <div className="grid gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {designs.map((d, i) => (
          <Card
            key={d.id}
            design={d}
            url={urls[d.id]}
            index={i}
            showAuthor={showAuthor}
            onCopy={copy}
            onDelete={onDelete}
          />
        ))}
      </div>
      {toast && (
        <div
          key={toast.n}
          role="status"
          className="anim-pop glass-panel fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-[13px] text-bone"
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}
