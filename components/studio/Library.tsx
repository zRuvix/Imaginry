"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CATEGORY_ICONS, Check, Search, Upload, X } from "@/components/icons";
import { useLookImages } from "@/components/landing/useLookImages";
import { GALLERY, type CuratedLook } from "@/lib/studio/looks";
import { GROUPS, type Preset } from "@/lib/studio/presets";
import { CATEGORIES, SCHEMA, SCHEMA_BY_KEY, type Category, type StudioState } from "@/lib/studio/schema";
import type { SavedDesign } from "@/lib/studio/storage";
import { Segmented } from "./controls";
import { PRESET_MIME } from "./dnd";
import { usePresetThumbs } from "./thumbs";

type Tab = "Effects" | "Gallery" | "Saved";
type Shelf = "All" | Category;

function PresetCard({
  preset,
  thumb,
  selected,
  index,
  onClick,
  onDragChange,
}: {
  preset: Preset;
  thumb?: string;
  selected: boolean;
  index: number;
  onClick: () => void;
  onDragChange: (dragging: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData(PRESET_MIME, preset.id);
        // Drag the thumbnail itself rather than the whole card.
        const img = e.currentTarget.querySelector("img");
        if (img) e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
        onDragChange(true);
      }}
      onDragEnd={() => onDragChange(false)}
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

/** First item in the effects list: bring your own photo in as the base. */
function ImageTile({
  imageUrl,
  onPick,
  onDrop,
}: {
  imageUrl: string | null;
  onPick: () => void;
  onDrop: (file: File) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <button
      type="button"
      onClick={onPick}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith("image/")) onDrop(file);
      }}
      aria-label={imageUrl ? "Replace your image" : "Upload an image"}
      className={`anim-rise group mt-2 flex w-full items-center gap-3 rounded-[18px] p-2 pr-3 text-left transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-[0.97] ${
        over ? "bg-ember/20" : "bg-white/[0.05] hover:bg-white/[0.08]"
      }`}
    >
      <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-raised text-bone/70 shadow-[0_8px_18px_-10px_rgba(0,0,0,0.9)]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <Upload size={20} className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:text-ember" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-bone">Your image</span>
        <span className="block truncate text-[12px] text-bone/50">
          {over ? "Drop to use it as the base" : imageUrl ? "Click to replace" : "Upload, paste or drop a photo"}
        </span>
      </span>
    </button>
  );
}

/** Premade designs; only rendered while this tab is open. */
function GalleryTab({ onLoad }: { onLoad: (look: CuratedLook) => void }) {
  const urls = useLookImages(GALLERY, 260);
  return (
    <div className="scroll-thin flex-1 overflow-y-auto px-3 pb-4 pt-1">
      <Link
        href="/gallery"
        className="press mb-3 flex items-center justify-between rounded-[14px] bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-bone/75 hover:bg-white/[0.09] hover:text-bone"
      >
        Browse the full gallery
        <ArrowUpRight size={13} />
      </Link>
      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
        {GALLERY.map((look, i) => (
          <button
            key={look.name}
            type="button"
            onClick={() => onLoad(look)}
            className="anim-rise group text-left"
            style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
          >
            <span className="block aspect-square overflow-hidden rounded-[16px] bg-raised shadow-[0_10px_24px_-14px_rgba(0,0,0,0.9)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-active:scale-95">
              {urls[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[i]!}
                  alt=""
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <span className="skeleton block size-full" />
              )}
            </span>
            <span className="mt-1.5 block truncate px-0.5 text-[12.5px] text-bone/80">{look.name}</span>
            <span className="block truncate px-0.5 text-[11.5px] text-bone/40">{look.recipe}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Library({
  state,
  onToggle,
  saved,
  onLoadSaved,
  onDeleteSaved,
  onLoadLook,
  imageUrl,
  onPickImage,
  onDropImage,
  onDragPreset,
}: {
  state: StudioState;
  onToggle: (preset: Preset) => void;
  saved: SavedDesign[];
  onLoadSaved: (d: SavedDesign) => void;
  onDeleteSaved: (id: string) => void;
  onLoadLook: (look: CuratedLook) => void;
  imageUrl: string | null;
  onPickImage: () => void;
  onDropImage: (file: File) => void;
  onDragPreset: (dragging: boolean) => void;
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
        <Segmented label="Library" value={tab} options={["Effects", "Gallery", "Saved"] as const} onChange={setTab} />
        {tab === "Effects" && (
          <>
            <label className="flex h-10 items-center gap-2.5 rounded-[12px] bg-white/[0.05] px-3 transition-colors focus-within:bg-white/[0.08]">
              <Search size={14} className="text-bone/45" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${SCHEMA.length} effects`}
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

      {tab === "Gallery" ? (
        <GalleryTab onLoad={onLoadLook} />
      ) : tab === "Effects" ? (
        <div key={`${shelf}-${query}`} className="scroll-thin flex-1 overflow-y-auto px-3 pb-4">
          {(shelf === "All" || shelf === "Color") && (!query || /image|photo|upload|picture/i.test(query)) && (
            <ImageTile imageUrl={imageUrl} onPick={onPickImage} onDrop={onDropImage} />
          )}
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
                        onDragChange={onDragPreset}
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
