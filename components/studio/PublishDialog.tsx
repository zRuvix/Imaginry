"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, X } from "@/components/icons";
import { TITLE_MAX, type SharedDesign } from "@/lib/profile";
import { renderOffscreen } from "@/lib/studio/renderer";
import type { StudioState } from "@/lib/studio/schema";
import { encodeShare } from "@/lib/studio/storage";
import { useClickOutside } from "./controls";

/** The design as Explore will show it: no photo layer. */
function withoutImage(state: StudioState): StudioState {
  return {
    ...state,
    sections: { ...state.sections, image: { ...state.sections.image, enabled: false } },
    order: state.order.filter((k) => k !== "image"),
  };
}

/** Names the design and publishes it to Explore under your profile. */
export default function PublishDialog({
  state,
  time,
  username,
  onClose,
}: {
  state: StudioState;
  time: number;
  username: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, true, onClose);
  const [title, setTitle] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<SharedDesign | null>(null);
  const hadImage = state.order.includes("image");
  const design = withoutImage(state);

  useEffect(() => {
    let url: string | null = null;
    renderOffscreen(design, 480, 360, { time, detail: 900 / 360 })
      .then((canvas) => new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.9)))
      .then((blob) => {
        if (!blob) return;
        url = URL.createObjectURL(blob);
        setPreview(url);
      })
      .catch(() => {});
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
    // Rendered once when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, design: encodeShare(design) }),
      });
      const body = await res.json();
      if (!res.ok) return setError(body.error ?? "Couldn’t publish");
      setPublished(body.design);
    } catch {
      setError("Couldn’t reach the server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div ref={ref} role="dialog" aria-label="Publish to Explore" className="anim-pop glass-panel w-[400px] rounded-[26px] p-5 text-bone">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[20px]">{published ? "Published" : "Publish to Explore"}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="press text-bone/60 hover:text-bone">
            <X size={18} />
          </button>
        </div>

        <div className="aspect-[4/3] overflow-hidden rounded-[18px] bg-raised">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <div className="skeleton size-full" />
          )}
        </div>

        {published ? (
          <div className="mt-4 space-y-3">
            <p className="text-[13.5px] leading-relaxed text-bone/70">
              “{published.title}” is on your profile and in Explore.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/profile/${username}`}
                className="press flex h-10 items-center justify-center gap-1.5 rounded-full bg-raised text-[13px] text-bone/80 hover:text-bone"
              >
                Your profile <ArrowUpRight size={13} />
              </Link>
              <Link
                href="/explore"
                className="press flex h-10 items-center justify-center gap-1.5 rounded-full bg-bone text-[13px] font-medium text-ink hover:bg-white"
              >
                Explore <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={publish} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-bone/55">Title</span>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX}
                placeholder="Untitled"
                className="h-10 w-full rounded-[12px] bg-white/[0.05] px-3 text-[13.5px] outline-none transition-colors placeholder:text-bone/30 focus:bg-white/[0.09]"
              />
            </label>
            <p className="text-[12px] leading-relaxed text-bone/45">
              Only the effects and layer settings are shared.
              {hadImage ? " Your photo stays on your device and is left out." : " Photos are never uploaded."}
            </p>
            {error && <p className="text-[12.5px] text-ember">{error}</p>}
            <button
              type="submit"
              disabled={busy || design.order.length === 0}
              className="press h-10 w-full rounded-full bg-bone text-[13.5px] font-medium text-ink hover:bg-white disabled:opacity-50"
            >
              {busy ? "Publishing…" : "Publish"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
