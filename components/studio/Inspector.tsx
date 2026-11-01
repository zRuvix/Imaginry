"use client";

import type { ReactNode } from "react";
import {
  CATEGORY_ICONS,
  Dices,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Pause,
  Play,
  RotateCcw,
  Trash,
  Upload,
} from "@/components/icons";
import { PALETTES } from "@/lib/studio/presets";
import { BLEND_MODES, SCHEMA_BY_KEY, type SectionKey, type StudioState, type Value } from "@/lib/studio/schema";
import { ColorInput, ColorList, IconButton, Scrub, Segmented, Select, Toggle } from "./controls";

type Props = {
  state: StudioState;
  selected: SectionKey | null;
  imageUrl: string | null;
  onChange: (section: SectionKey, key: string, value: Value) => void;
  onShuffle: (key: SectionKey) => void;
  onReset: (key: SectionKey) => void;
  onToggleVisible: (key: SectionKey) => void;
  onToggleLock: (key: SectionKey) => void;
  onToggleAnimated: (key: SectionKey) => void;
  onDelete: (key: SectionKey) => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onBrowse: () => void;
};

function Group({ title, children, delay = 0 }: { title: string; children: ReactNode; delay?: number }) {
  return (
    <section className="anim-rise space-y-1.5" style={{ animationDelay: `${delay}ms` }}>
      <h3 className="px-1 pb-0.5 text-[12.5px] font-medium text-bone/45">{title}</h3>
      {children}
    </section>
  );
}

function Palettes({ onPick }: { onPick: (colors: string[]) => void }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {PALETTES.map((p) => (
        <button
          key={p.name}
          type="button"
          title={p.name}
          aria-label={`Use the ${p.name} palette`}
          onClick={() => onPick(p.colors)}
          className="press flex h-8 shrink-0 overflow-hidden rounded-full shadow-[0_4px_12px_-6px_rgba(0,0,0,0.8)] hover:-translate-y-0.5"
        >
          {p.colors.map((c) => (
            <span key={c} className="h-full w-4" style={{ background: c }} />
          ))}
        </button>
      ))}
    </div>
  );
}

export default function Inspector(p: Props) {
  const { state, selected } = p;

  if (!selected || !state.order.includes(selected)) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <p className="anim-rise text-[15px] text-bone">Nothing selected</p>
        <p className="anim-rise mt-2 text-[13px] leading-relaxed text-bone/50" style={{ animationDelay: "60ms" }}>
          Pick an effect from the library, or click a layer in the dock to tune it here.
        </p>
        <button
          type="button"
          onClick={p.onBrowse}
          className="press anim-rise mt-5 h-10 rounded-full bg-bone px-5 text-[13.5px] font-medium text-ink hover:bg-white"
          style={{ animationDelay: "120ms" }}
        >
          Browse effects
        </button>
      </div>
    );
  }

  const schema = SCHEMA_BY_KEY[selected];
  const section = state.sections[selected];
  const Icon = CATEGORY_ICONS[schema.category];
  const set = (key: string) => (v: Value) => p.onChange(selected, key, v);
  const locked = section.locked;

  return (
    // Re-keyed per layer so its controls cascade in on every switch.
    <div key={selected} className="flex h-full flex-col">
      <header className="anim-rise px-4 pb-3 pt-4">
        <div className="flex items-center gap-2 text-[12px] text-bone/45">
          <Icon size={12} className="text-ember" />
          {schema.category}
          {!section.enabled && <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-bone/60">Hidden</span>}
          {locked && <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-bone/60">Locked</span>}
        </div>
        <h2 className="mt-1.5 font-display text-[24px] leading-none tracking-[-0.02em] text-bone">{schema.label}</h2>
        <p className="mt-2 text-[13px] leading-snug text-bone/55">{schema.blurb}</p>
        <div className="-ml-1.5 mt-3 flex items-center">
          <IconButton label="Shuffle settings" onClick={() => p.onShuffle(selected)} disabled={locked}>
            <Dices size={15} />
          </IconButton>
          <IconButton label="Reset to defaults" onClick={() => p.onReset(selected)} disabled={locked}>
            <RotateCcw size={15} />
          </IconButton>
          <IconButton
            label={section.animated ? "Hold this layer still" : "Animate this layer"}
            onClick={() => p.onToggleAnimated(selected)}
          >
            {section.animated ? <Play size={15} /> : <Pause size={15} />}
          </IconButton>
          <IconButton label={section.enabled ? "Hide layer" : "Show layer"} onClick={() => p.onToggleVisible(selected)}>
            {section.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
          </IconButton>
          <IconButton label={locked ? "Unlock layer" : "Lock layer"} active={locked} onClick={() => p.onToggleLock(selected)}>
            {locked ? <Lock size={15} /> : <LockOpen size={15} />}
          </IconButton>
          <IconButton label="Delete layer" onClick={() => p.onDelete(selected)} disabled={locked} className="ml-auto hover:!text-ember">
            <Trash size={15} />
          </IconButton>
        </div>
      </header>

      <fieldset
        disabled={locked}
        className="scroll-thin min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 pb-5 transition-opacity duration-300 disabled:opacity-45"
      >
        {selected === "image" && (
          <Group title="Photo" delay={40}>
            <button
              type="button"
              onClick={p.onPickImage}
              className="press group relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-[14px] bg-white/[0.05] hover:bg-white/[0.08]"
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-[12.5px] text-bone/50">
                  <Upload size={18} />
                  Upload, paste or drop an image
                </span>
              )}
            </button>
            {p.imageUrl && (
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={p.onPickImage} className="press h-9 rounded-[12px] bg-white/[0.05] text-[13px] text-bone hover:bg-white/[0.09]">
                  Replace
                </button>
                <button type="button" onClick={p.onRemoveImage} className="press h-9 rounded-[12px] bg-white/[0.05] text-[13px] text-bone hover:bg-white/[0.09]">
                  Remove
                </button>
              </div>
            )}
          </Group>
        )}

        <Group title="Mix" delay={60}>
          <Scrub
            label="Opacity"
            value={Number(section.layerOpacity ?? 1)}
            min={0}
            max={1}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={set("layerOpacity")}
          />
          <Select label="Blend" value={String(section.layerBlend ?? "normal")} options={BLEND_MODES} onChange={set("layerBlend")} />
        </Group>

        <Group title="Settings" delay={100}>
          {schema.controls.map((c) => {
            const v = section[c.key];
            switch (c.type) {
              case "slider":
                return <Scrub key={c.key} label={c.label} value={Number(v)} min={c.min} max={c.max} step={c.step} onChange={set(c.key)} />;
              case "select":
                return c.options.length <= 4 ? (
                  <Segmented key={c.key} label={c.label} value={String(v)} options={c.options} onChange={set(c.key)} size="sm" />
                ) : (
                  <Select key={c.key} label={c.label} value={String(v)} options={c.options} onChange={set(c.key)} />
                );
              case "toggle":
                return <Toggle key={c.key} label={c.label} checked={Boolean(v)} onChange={set(c.key)} />;
              case "color":
                return <ColorInput key={c.key} label={c.label} value={String(v)} onChange={set(c.key)} />;
              case "colors":
                return (
                  <div key={c.key} className="space-y-1.5">
                    <ColorList value={v as string[]} max={c.max} onChange={set(c.key)} />
                    <Palettes onPick={set(c.key)} />
                  </div>
                );
            }
          })}
        </Group>
      </fieldset>
    </div>
  );
}
