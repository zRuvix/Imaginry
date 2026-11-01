"use client";

import { X } from "lucide-react";
import type { SavedDesign } from "@/lib/studio/storage";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="flex w-[256px] shrink-0 flex-col overflow-hidden rounded-xl border border-panel-border bg-panel">
      <header className="flex h-[58px] shrink-0 items-center border-b border-panel-border px-4">
        <h2 className="text-[15px] font-semibold">{title}</h2>
      </header>
      <div className="scroll-thin flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}

export function SavedPanel({
  saved,
  onLoad,
  onDelete,
}: {
  saved: SavedDesign[];
  onLoad: (d: SavedDesign) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Panel title="Saved">
      {saved.length === 0 ? (
        <p className="text-[13px] leading-snug text-neutral-500">
          Nothing saved yet. Press Save in the toolbar to keep the current design here.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {saved.map((d) => (
            <div key={d.id} className="group relative">
              <button
                type="button"
                onClick={() => onLoad(d)}
                className="block aspect-square w-full overflow-hidden rounded-[10px] ring-1 ring-neutral-800 hover:ring-neutral-500"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.thumb} alt="Saved design" className="size-full object-cover" />
              </button>
              <button
                type="button"
                aria-label="Delete saved design"
                onClick={() => onDelete(d.id)}
                className="absolute right-1.5 top-1.5 hidden size-5 items-center justify-center rounded-full bg-black/70 text-neutral-200 group-hover:flex"
              >
                <X size={11} />
              </button>
              <span className="mt-1 block font-outfit text-[11px] text-neutral-500">
                {new Date(d.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
                {new Date(d.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
