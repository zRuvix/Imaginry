"use client";

import { useRef, useState } from "react";
import { CATEGORY_ICONS, Eye, EyeOff, Plus, X } from "@/components/icons";
import { SCHEMA_BY_KEY, type SectionKey, type StudioState } from "@/lib/studio/schema";
import { useClickOutside } from "./controls";

/** What can go on top of a background: the fluid, then the studio's finishing passes. */
export const FINISHES: SectionKey[] = ["fluid", "grain", "bloom", "glass", "optics", "lightleak", "rgbshift", "filmdust", "halftone", "crt", "dither"] as SectionKey[];

type Props = {
  state: StudioState;
  selected: SectionKey | null;
  onSelect: (key: SectionKey) => void;
  onToggleVisible: (key: SectionKey) => void;
  onRemove: (key: SectionKey) => void;
  onAdd: (key: SectionKey) => void;
};

export default function LayerStrip(p: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, open, () => setOpen(false));
  // Bottom of the stack on the left, like reading a recipe.
  const layers = [...p.state.order].reverse();
  const background = layers[0];

  return (
    <div className="glass-panel pointer-events-auto flex h-[60px] max-w-full items-center gap-1.5 rounded-[22px] p-2">
      <div className="no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto">
        {layers.map((key, i) => {
          const s = SCHEMA_BY_KEY[key];
          const Icon = CATEGORY_ICONS[s.category];
          const on = p.state.sections[key].enabled;
          const active = p.selected === key;
          return (
            <div
              key={key}
              className={`anim-pop group flex h-11 shrink-0 items-center rounded-[14px] transition-colors ${
                active ? "bg-bone text-ink" : "bg-white/[0.05] text-bone/80 hover:bg-white/[0.09]"
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <button
                type="button"
                onClick={() => p.onSelect(key)}
                className={`press flex h-full items-center gap-2 pl-3 pr-2 text-[13px] font-medium ${on ? "" : "opacity-45"}`}
              >
                <Icon size={12} className={active ? "text-ink/70" : "text-ember"} />
                {s.label}
              </button>
              <button
                type="button"
                aria-label={on ? `Hide ${s.label}` : `Show ${s.label}`}
                onClick={() => p.onToggleVisible(key)}
                className="press flex size-7 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-70 hover:!opacity-100"
              >
                {on ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              {key !== background && (
                <button
                  type="button"
                  aria-label={`Remove ${s.label}`}
                  onClick={() => p.onRemove(key)}
                  className="press mr-1 flex size-7 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-70 hover:!opacity-100"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          aria-label="Add on top"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`press flex size-11 items-center justify-center rounded-[14px] ${
            open ? "bg-ember text-ink" : "bg-white/[0.05] text-bone/80 hover:bg-white/[0.1] hover:text-bone"
          }`}
        >
          <Plus size={16} />
        </button>
        {open && (
          <div className="anim-menu glass-panel absolute bottom-[calc(100%+12px)] right-0 z-40 w-[260px] rounded-[20px] p-2.5 [transform-origin:bottom_right]">
            <p className="px-1.5 pb-2 text-[12.5px] text-bone/50">Add on top</p>
            <div className="flex flex-wrap gap-1">
              {FINISHES.map((key) => {
                const added = p.state.order.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={added}
                    onClick={() => {
                      p.onAdd(key);
                      setOpen(false);
                    }}
                    className={`press rounded-full px-3 py-1.5 text-[12.5px] disabled:bg-transparent disabled:text-bone/25 ${
                      key === "fluid" ? "bg-ember/90 font-medium text-ink hover:bg-ember" : "bg-white/[0.06] text-bone/85 hover:bg-white/[0.12] hover:text-bone"
                    }`}
                  >
                    {SCHEMA_BY_KEY[key].label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
