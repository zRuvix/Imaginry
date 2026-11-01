"use client";

import { useRef, useState, type DragEvent } from "react";
import { ArrowRight, CATEGORY_ICONS, Eye, EyeOff, Image as ImageIcon, Lock, Plus } from "@/components/icons";
import { CATEGORIES, SCHEMA, SCHEMA_BY_KEY, type SectionKey, type StudioState } from "@/lib/studio/schema";
import { useClickOutside } from "./controls";
import { isPresetDrag, PRESET_MIME } from "./dnd";
import { useLayerThumbs } from "./thumbs";

type Props = {
  state: StudioState;
  time: number;
  selected: SectionKey | null;
  imageUrl: string | null;
  onSelect: (key: SectionKey) => void;
  onReorder: (order: SectionKey[]) => void;
  onToggleVisible: (key: SectionKey) => void;
  onAdd: (key: SectionKey) => void;
  /** A preset dropped from the library, at a position in the dock (0 = bottom). */
  onDropPreset: (presetId: string, index: number) => void;
  /** True while a preset is being dragged anywhere on the page. */
  presetDragging: boolean;
};

/** "Add layer" popover, grouped by shelf. */
function AddMenu({ state, onAdd, onClose }: { state: StudioState; onAdd: (k: SectionKey) => void; onClose: () => void }) {
  return (
    <div className="anim-menu glass-panel absolute bottom-[calc(100%+12px)] right-0 z-40 w-[min(420px,calc(100vw-24px))] rounded-[20px] p-3 [transform-origin:bottom_right]">
      <p className="px-1 pb-2 text-[12.5px] text-bone/50">Add a layer</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const items = SCHEMA.filter((s) => s.category === cat);
          return (
            <div key={cat}>
              <p className="flex items-center gap-1.5 px-1 pb-1 text-[12px] font-medium text-bone/70">
                <Icon size={11} className="text-ember" />
                {cat}
              </p>
              <div className="flex flex-wrap gap-1">
                {items.map((s) => {
                  const added = state.order.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      disabled={added}
                      onClick={() => {
                        onAdd(s.key);
                        onClose();
                      }}
                      className="press rounded-full bg-white/[0.06] px-2.5 py-1 text-[12.5px] text-bone/85 hover:bg-white/[0.12] hover:text-bone disabled:bg-transparent disabled:text-bone/25"
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The layer stack as a horizontal dock, bottom layer on the left. Drag chips
 * to reorder; click one to open it in the inspector.
 */
export default function LayerDock(p: Props) {
  const { state } = p;
  const thumbs = useLayerThumbs(state, p.time);
  const [dragging, setDragging] = useState<SectionKey | null>(null);
  const [drop, setDrop] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  useClickOutside(addRef, adding, () => setAdding(false));

  // Left to right = bottom to top.
  const lane = [...state.order].reverse();

  const onDragOver = (e: DragEvent, index: number) => {
    if (!dragging && !isPresetDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setDrop(e.clientX < r.left + r.width / 2 ? index : index + 1);
  };

  const onDrop = (e: DragEvent) => {
    if (isPresetDrag(e)) {
      e.preventDefault();
      p.onDropPreset(e.dataTransfer.getData(PRESET_MIME), drop ?? lane.length);
    } else if (dragging != null && drop != null) {
      const from = lane.indexOf(dragging);
      const next = lane.filter((k) => k !== dragging);
      next.splice(drop > from ? drop - 1 : drop, 0, dragging);
      const order = next.reverse();
      if (order.join() !== state.order.join()) p.onReorder(order);
    }
    setDragging(null);
    setDrop(null);
  };

  return (
    <div
      className={`glass-panel relative flex h-[76px] max-w-full items-center gap-1.5 rounded-[24px] p-2 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        p.presetDragging ? "-translate-y-1 scale-[1.02] !shadow-[0_0_0_2px_rgba(255,90,44,0.55),0_30px_70px_-20px_rgba(255,90,44,0.45)]" : ""
      }`}
      onDragOver={(e) => {
        if (!dragging && !isPresetDrag(e)) return;
        e.preventDefault();
        // Over the dock but not a chip: add on top.
        if (isPresetDrag(e)) setDrop((d) => d ?? lane.length);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrop(null);
      }}
      onDrop={onDrop}
    >
      {p.presetDragging && (
        <span className="anim-pop pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ember px-3.5 py-1.5 text-[12.5px] font-medium text-ink shadow-lg">
          Drop to add it as a layer
        </span>
      )}
      <div className="no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto">
        {lane.length === 0 && <p className="px-4 text-[13px] text-bone/45">No layers yet. Add one to start.</p>}
        {lane.map((key, i) => {
          const section = state.sections[key];
          const schema = SCHEMA_BY_KEY[key];
          const thumb = key === "image" ? p.imageUrl : thumbs[key];
          const isSel = p.selected === key;
          return (
            <div key={key} className="relative flex items-center">
              {drop === i && <span className="anim-pop absolute -left-[5px] top-2 bottom-2 w-[3px] rounded-full bg-ember" />}
              {i > 0 && <ArrowRight size={10} className="mx-0.5 shrink-0 text-bone/20" />}
              <div
                role="button"
                tabIndex={0}
                aria-pressed={isSel}
                aria-label={`${schema.label} layer`}
                draggable={!section.locked}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", key);
                  setDragging(key);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setDrop(null);
                }}
                onDragOver={(e) => onDragOver(e, i)}
                onClick={() => p.onSelect(key)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && p.onSelect(key)}
                className={`anim-pop group relative flex h-[60px] w-[150px] shrink-0 cursor-pointer items-center gap-2.5 rounded-[18px] p-1.5 pr-3 transition-[background-color,transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-95 ${
                  isSel ? "bg-white/[0.1]" : "hover:bg-white/[0.05]"
                } ${dragging === key ? "opacity-30" : section.enabled ? "" : "opacity-45"}`}
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-[13px] bg-raised shadow-[0_6px_14px_-8px_rgba(0,0,0,0.9)]">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" draggable={false} className="size-full object-cover" />
                  ) : key === "image" ? (
                    <span className="flex size-full items-center justify-center text-bone/40">
                      <ImageIcon size={16} />
                    </span>
                  ) : (
                    <span className="skeleton block size-full" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 truncate text-[13px] font-medium text-bone">
                    {schema.label}
                    {section.locked && <Lock size={10} className="shrink-0 text-bone/50" />}
                  </span>
                  <span className="block truncate text-[11.5px] capitalize text-bone/45">
                    {Number(section.layerOpacity ?? 1) < 1
                      ? `${Math.round(Number(section.layerOpacity) * 100)}% · ${section.layerBlend}`
                      : String(section.layerBlend) !== "normal"
                        ? String(section.layerBlend)
                        : schema.category}
                  </span>
                </span>
                {isSel && <span className="anim-pop absolute bottom-1 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-ember" />}
                <button
                  type="button"
                  aria-label={section.enabled ? `Hide ${schema.label}` : `Show ${schema.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    p.onToggleVisible(key);
                  }}
                  className="press absolute -right-1 -top-1 hidden size-6 items-center justify-center rounded-full bg-ink text-bone/80 shadow-lg hover:text-bone group-hover:flex"
                >
                  {section.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>
            </div>
          );
        })}
        {drop === lane.length && <span className="anim-pop h-11 w-[3px] shrink-0 rounded-full bg-ember" />}
      </div>

      <div ref={addRef} className="relative shrink-0">
        <button
          type="button"
          aria-label="Add layer"
          aria-expanded={adding}
          onClick={() => setAdding((v) => !v)}
          className={`press flex size-[60px] items-center justify-center rounded-[18px] transition-colors ${
            adding ? "bg-bone text-ink" : "bg-white/[0.06] text-bone/80 hover:bg-white/[0.12] hover:text-bone"
          }`}
        >
          <Plus size={20} className={`transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${adding ? "rotate-45" : ""}`} />
        </button>
        {adding && <AddMenu state={state} onAdd={p.onAdd} onClose={() => setAdding(false)} />}
      </div>
    </div>
  );
}
