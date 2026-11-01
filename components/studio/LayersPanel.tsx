"use client";

import { Eye, EyeOff, GripVertical, Image as ImageIcon, Lock, LockOpen, Pause, Play, Plus, Trash } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { GROUPS } from "@/lib/studio/presets";
import { renderOffscreen } from "@/lib/studio/renderer";
import {
  emptyState,
  orderFromEnabled,
  SCHEMA,
  SCHEMA_BY_KEY,
  type SectionKey,
  type StudioState,
} from "@/lib/studio/schema";

const THUMB_PX = 72;

/** The layer alone (over its group's usual backdrop), with its current settings. */
function layerThumbState(state: StudioState, key: SectionKey): StudioState {
  const thumb = emptyState(state.seed);
  const group = GROUPS.find((g) => g.section === key);
  for (const [k, values] of Object.entries(group?.thumbBase ?? {})) {
    const s = k as SectionKey;
    thumb.sections[s] = { ...thumb.sections[s], ...values, enabled: true };
  }
  thumb.sections[key] = { ...state.sections[key], enabled: true };
  thumb.order = orderFromEnabled(thumb.sections);
  return thumb;
}

/** Live thumbnails for each layer, re-rendered shortly after edits settle. */
function useLayerThumbs(state: StudioState, time: number) {
  const [thumbs, setThumbs] = useState<Partial<Record<SectionKey, string>>>({});
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const next: Partial<Record<SectionKey, string>> = {};
      for (const key of state.order) {
        if (key === "image") continue;
        try {
          const canvas = await renderOffscreen(layerThumbState(state, key), THUMB_PX, THUMB_PX, { time, detail: 3 });
          next[key] = canvas.toDataURL("image/jpeg", 0.8);
        } catch {
          return;
        }
      }
      if (!cancelled) setThumbs(next);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [state, time]);
  return thumbs;
}

function IconToggle({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex size-6 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

type Props = {
  state: StudioState;
  time: number;
  selected: SectionKey | null;
  imageUrl: string | null;
  onSelect: (key: SectionKey) => void;
  onReorder: (order: SectionKey[]) => void;
  onToggleVisible: (key: SectionKey) => void;
  onToggleLock: (key: SectionKey) => void;
  onToggleAnimated: (key: SectionKey) => void;
  onDelete: (key: SectionKey) => void;
  onAdd: (key: SectionKey) => void;
};

export default function LayersPanel(p: Props) {
  const { state } = p;
  const thumbs = useLayerThumbs(state, p.time);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<SectionKey | null>(null);
  const [drop, setDrop] = useState<{ index: number } | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  const available = SCHEMA.filter((s) => !state.order.includes(s.key));

  const onDragOver = (e: DragEvent, index: number) => {
    if (!dragging) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDrop({ index: e.clientY < rect.top + rect.height / 2 ? index : index + 1 });
  };

  const onDrop = () => {
    if (dragging && drop) {
      const from = state.order.indexOf(dragging);
      const next = state.order.filter((k) => k !== dragging);
      next.splice(drop.index > from ? drop.index - 1 : drop.index, 0, dragging);
      if (next.join() !== state.order.join()) p.onReorder(next);
    }
    setDragging(null);
    setDrop(null);
  };

  return (
    <aside className="flex w-[256px] shrink-0 flex-col overflow-hidden rounded-xl border border-panel-border bg-panel">
      <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-panel-border px-4">
        <h2 className="text-[15px] font-semibold">Layers</h2>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Add layer"
            title="Add layer"
            disabled={available.length === 0}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-[30px] items-center justify-center rounded-lg border border-neutral-800 text-neutral-200 hover:bg-neutral-800 disabled:opacity-35"
          >
            <Plus size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-30 w-44 rounded-lg border border-neutral-800 bg-neutral-950 p-1 shadow-xl">
              {available.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    p.onAdd(s.key);
                    setMenuOpen(false);
                  }}
                  className="block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] text-neutral-300 hover:bg-neutral-800 hover:text-white"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div
        className="scroll-thin flex-1 overflow-y-auto p-3"
        onDragOver={(e) => dragging && e.preventDefault()}
        onDrop={onDrop}
      >
        {state.order.length === 0 && (
          <p className="px-1 py-2 text-[13px] leading-snug text-neutral-500">
            No layers yet. Pick an effect, or press + to add one.
          </p>
        )}
        {state.order.map((key, index) => {
          const section = state.sections[key];
          const label = SCHEMA_BY_KEY[key].label;
          const thumb = key === "image" ? p.imageUrl : thumbs[key];
          return (
            <div key={key} className="relative">
              {drop?.index === index && <div className="absolute -top-[3px] left-2 right-2 h-0.5 rounded bg-white" />}
              <div
                role="button"
                tabIndex={0}
                aria-pressed={p.selected === key}
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
                onDragOver={(e) => onDragOver(e, index)}
                onClick={() => p.onSelect(key)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && p.onSelect(key)}
                className={`mb-1 flex h-14 cursor-pointer items-center gap-2 rounded-[10px] border px-1.5 transition-colors ${
                  p.selected === key
                    ? "border-neutral-600 bg-neutral-800/70"
                    : "border-transparent hover:bg-neutral-900"
                } ${dragging === key ? "opacity-40" : ""}`}
              >
                <GripVertical
                  size={15}
                  className={`shrink-0 ${section.locked ? "text-neutral-700" : "cursor-grab text-neutral-500"}`}
                />
                <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-neutral-800 ring-1 ring-neutral-700">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" draggable={false} className="size-full object-cover" />
                  ) : key === "image" ? (
                    <ImageIcon size={14} className="m-auto mt-[11px] text-neutral-500" />
                  ) : null}
                  <button
                    type="button"
                    title={
                      section.animated ? "Animating — click to hold this layer still" : "Held still — click to animate"
                    }
                    aria-label={section.animated ? `Hold ${label} still` : `Animate ${label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      p.onToggleAnimated(key);
                    }}
                    className="absolute left-0.5 top-0.5 flex size-4 items-center justify-center rounded-[4px] bg-black/80 text-white"
                  >
                    {section.animated ? <Play size={9} fill="currentColor" /> : <Pause size={9} fill="currentColor" />}
                  </button>
                </div>
                <span
                  className={`min-w-0 flex-1 truncate text-[14px] ${section.enabled ? "text-white" : "text-neutral-500"}`}
                >
                  {label}
                </span>
                <div className="flex shrink-0 items-center">
                  <IconToggle
                    label={section.enabled ? `Hide ${label}` : `Show ${label}`}
                    onClick={() => p.onToggleVisible(key)}
                  >
                    {section.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  </IconToggle>
                  <IconToggle
                    label={section.locked ? `Unlock ${label}` : `Lock ${label}`}
                    onClick={() => p.onToggleLock(key)}
                  >
                    {section.locked ? <Lock size={14} className="text-white" /> : <LockOpen size={14} />}
                  </IconToggle>
                  <IconToggle label={`Delete ${label}`} disabled={section.locked} onClick={() => p.onDelete(key)}>
                    <Trash size={14} />
                  </IconToggle>
                </div>
              </div>
            </div>
          );
        })}
        {drop?.index === state.order.length && <div className="mx-2 h-0.5 rounded bg-white" />}
      </div>
    </aside>
  );
}
