"use client";

import { useMemo, useState } from "react";
import { CATEGORY_ICONS, Check, Search, X } from "@/components/icons";
import { GROUPS, type Preset } from "@/lib/studio/presets";
import { CATEGORIES, SCHEMA_BY_KEY, type Category, type StudioState } from "@/lib/studio/schema";
import type { SavedDesign } from "@/lib/studio/storage";
import { Segmented } from "./controls";
import { usePresetThumbs } from "./thumbs";

type Tab = "Effects" | "Saved";
type Shelf = "All" | Category;

function PresetCard({
  preset,
  thumb,
  selected,
  index,
  onClick,
}: {
  preset: Preset;
  thumb?: string;
  selected: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${SCHEMA_BY_KEY[preset.section].label}: ${preset.name}`}
      className="anim-rise group text-left"
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
    >
      <span
        className={`relative block aspect-square overflow-hidden rounded-[16px] bg-raised transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-active:scale-95 ${
          selected ? "shadow-[0_0_0_2px_var(--ember),0_12px_30px_-10px_rgba(255,90,44,0.6)]" : "shadow-[0_10px_24px_-14px_rgba(0,0,0,0.9)]"
        }`}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            draggable={false}
            className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
          />
        ) : (
          <span className="skeleton block size-full" />
        )}
        {selected && (
          <span className="anim-pop absolute right-1.5 top-1.5 rounded-full bg-ink/70 text-ember backdrop-blur">
            <Check size={16} />
          </span>
        )}
      </span>
      <span
        className={`mt-1.5 block truncate px-0.5 text-[12.5px] transition-colors ${selected ? "text-bone" : "text-bone/55 group-hover:text-bone/85"}`}
      >
        {preset.name}
      </span>
    </button>
  );
}

export default function Library({
  state,
  onToggle,
  saved,
  onLoadSaved,
  onDeleteSaved,
}: {
  state: StudioState;
  onToggle: (preset: Preset) => void;
  saved: SavedDesign[];
  onLoadSaved: (d: SavedDesign) => void;
  onDeleteSaved: (id: string) => void;
}) {
  const thumbs = usePresetThumbs();
  const [tab, setTab] = useState<Tab>("Effects");
  const [shelf, setShelf] = useState<Shelf>("All");
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GROUPS.map((g) => {
      const schema = SCHEMA_BY_KEY[g.section];
      if (shelf !== "All" && schema.category !== shelf) return null;
      const groupHit = !q || g.label.toLowerCase().includes(q) || schema.category.toLowerCase().includes(q);
      const presets = groupHit ? g.presets : g.presets.filter((p) => p.name.toLowerCase().includes(q));
      return presets.length ? { ...g, presets } : null;
    }).filter((g) => g !== null);
  }, [shelf, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 p-3 pb-2">
        <Segmented label="Library" value={tab} options={["Effects", "Saved"] as const} onChange={setTab} />
        {tab === "Effects" && (
          <>
            <label className="flex h-10 items-center gap-2.5 rounded-[12px] bg-white/[0.05] px-3 transition-colors focus-within:bg-white/[0.08]">
              <Search size={14} className="text-bone/45" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 26 effects"
                aria-label="Search effects"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-bone outline-none placeholder:text-bone/35"
              />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="press text-bone/50 hover:text-bone">
                  <X size={13} />
                </button>
              )}
            </label>
            <div className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3">
              {(["All", ...CATEGORIES] as Shelf[]).map((c) => {
                const Icon = c === "All" ? null : CATEGORY_ICONS[c];
                const on = shelf === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setShelf(c)}
                    aria-pressed={on}
                    className={`press flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium ${
                      on ? "bg-bone text-ink" : "bg-white/[0.05] text-bone/65 hover:bg-white/[0.09] hover:text-bone"
                    }`}
                  >
                    {Icon && <Icon size={12} />}
                    {c}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {tab === "Effects" ? (
        <div key={`${shelf}-${query}`} className="scroll-thin flex-1 overflow-y-auto px-3 pb-4">
          {groups.length === 0 && (
            <p className="anim-rise px-1 py-6 text-center text-[13px] text-bone/45">Nothing matches “{query}”.</p>
          )}
          {groups.map((g, gi) => {
            const schema = SCHEMA_BY_KEY[g.section];
            const Icon = CATEGORY_ICONS[schema.category];
            return (
              <section key={g.section} className="pt-3">
                <h3 className="sticky top-0 z-10 -mx-3 mb-2 flex items-center gap-2 bg-surface/0 px-4 py-1.5 text-[13px] font-semibold text-bone backdrop-blur-md">
                  <Icon size={12} className="text-ember" />
                  {g.label}
                  {state.sections[g.section].enabled && <span className="anim-pop size-1.5 rounded-full bg-ember" />}
                </h3>
                <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
                  {g.presets.map((preset, i) => {
                    const section = state.sections[preset.section];
                    return (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        thumb={thumbs[preset.id]}
                        selected={section.enabled && section.preset === preset.id}
                        index={gi * 3 + i}
                        onClick={() => onToggle(preset)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="scroll-thin flex-1 overflow-y-auto px-3 pb-4 pt-2">
          {saved.length === 0 ? (
            <div className="anim-rise px-2 py-10 text-center">
              <p className="text-[14px] text-bone">Nothing saved yet</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-bone/50">
                Press Save in the top bar and your design lands here, ready to reopen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {saved.map((d, i) => (
                <div key={d.id} className="anim-rise group relative" style={{ animationDelay: `${i * 30}ms` }}>
                  <button
                    type="button"
                    onClick={() => onLoadSaved(d)}
                    className="block aspect-square w-full overflow-hidden rounded-[16px] bg-raised transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.thumb} alt="Saved design" className="size-full object-cover" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete saved design"
                    onClick={() => onDeleteSaved(d.id)}
                    className="press absolute right-1.5 top-1.5 hidden rounded-full bg-ink/70 text-bone backdrop-blur group-hover:flex"
                  >
                    <X size={15} />
                  </button>
                  <span className="mt-1.5 block font-outfit text-[11.5px] text-bone/45">
                    {new Date(d.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                    {new Date(d.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
