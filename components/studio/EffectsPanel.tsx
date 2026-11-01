"use client";

import { useEffect, useState } from "react";
import { GROUPS, thumbState, type Preset } from "@/lib/studio/presets";
import { renderOffscreen } from "@/lib/studio/renderer";
import type { StudioState } from "@/lib/studio/schema";
import { InfoTip } from "./PropsPanel";

const THUMB_PX = 112;

/** Renders every preset once with the real shader and returns data URLs. */
function useThumbnails() {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    const out: Record<string, string> = {};
    const queue = GROUPS.flatMap((g) => g.presets.map((p) => [g, p] as const));
    // A few per frame so the studio canvas stays responsive while they fill in.
    const step = async () => {
      if (cancelled) return;
      try {
        for (const [group, preset] of queue.splice(0, 4)) {
          const canvas = await renderOffscreen(thumbState(group, preset), THUMB_PX, THUMB_PX, { time: 2.5, detail: 3 });
          out[preset.id] = canvas.toDataURL("image/png");
        }
      } catch (e) {
        console.error(e);
        return;
      }
      setThumbs({ ...out });
      if (queue.length) setTimeout(step, 16);
    };
    const start = setTimeout(step, 250);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, []);
  return thumbs;
}

export default function EffectsPanel({
  state,
  onToggle,
}: {
  state: StudioState;
  onToggle: (preset: Preset) => void;
}) {
  const thumbs = useThumbnails();

  return (
    <aside className="flex w-[256px] shrink-0 flex-col overflow-hidden rounded-xl border border-panel-border bg-panel">
      <header className="flex h-[58px] shrink-0 items-center border-b border-panel-border px-4">
        <h2 className="text-[15px] font-semibold">Effects</h2>
      </header>
      <div className="scroll-thin flex-1 overflow-y-auto px-4 pb-6">
        {GROUPS.map((group) => (
          <section key={group.label} className="border-b border-panel-border py-4 last:border-b-0">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
              {group.label}
              {group.info && <InfoTip text={group.info} />}
            </h3>
            <div className="grid grid-cols-4 gap-2.5">
              {group.presets.map((preset) => {
                const section = state.sections[preset.section];
                const selected = section.enabled && section.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${group.label} ${preset.id}`}
                    onClick={() => onToggle(preset)}
                    className={`aspect-square overflow-hidden rounded-[12px] p-[2px] transition-transform active:scale-95 ${
                      selected ? "ring-2 ring-white" : "ring-1 ring-transparent hover:ring-neutral-600"
                    }`}
                  >
                    {thumbs[preset.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbs[preset.id]}
                        alt=""
                        draggable={false}
                        className="size-full rounded-[10px] object-cover"
                      />
                    ) : (
                      <span className="block size-full animate-pulse rounded-[10px] bg-neutral-800" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
