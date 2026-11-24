"use client";

import type { ReactNode } from "react";
import {
  ArrowRight,
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
import { IMAGE_ZOOM } from "@/lib/studio/effects/color/image";
import { DIRECTIONAL, MOTIONS, motionOf, RANGED, type MotionType } from "@/lib/studio/motion";
import { PALETTES } from "@/lib/studio/presets";
import { BLEND_MODES, SCHEMA_BY_KEY, type SectionKey, type StudioState, type Value } from "@/lib/studio/schema";
import CurveEditor from "./CurveEditor";
import { ColorInput, ColorList, IconButton, Scrub, Segmented, Select, Toggle } from "./controls";

type Props = {
  state: StudioState;
  selected: SectionKey | null;
  /** Whether the studio clock is running (Animate). */
  playing: boolean;
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
  onZoomImage: (factor: number) => void;
  onResetImageView: () => void;
  onBrowse: () => void;
};

function Group({ title, children, delay = 0 }: { title: string; children: ReactNode; delay?: number }) {
  return (
    // The rise animation gives each group its own stacking context, so a group
    // with an open dropdown has to sit above the groups after it.
    <section className="anim-rise relative space-y-1.5 has-[[aria-expanded=true]]:z-20" style={{ animationDelay: `${delay}ms` }}>
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

const COMPASS = [0, 45, 90, 135, 180, -135, -90, -45];
const MOTION_HINTS: Record<MotionType, string> = {
  off: "",
  drift: "Slides the effect steadily one way.",
  sway: "Rocks the effect back and forth.",
  spin: "Turns the effect around the centre.",
  orbit: "Circles the effect around its spot.",
  random: "Every patch wanders its own way. Scatter sets how small the patches are.",
  rock: "Swings the effect back and forth like a pendulum.",
  breathe: "Slowly zooms the effect in and out.",
  bounce: "Hops the effect one way and lets it drop back.",
  float: "Bobs the effect gently, like it’s on water.",
  weave: "Traces a figure 8 around the spot.",
  shake: "Stop-motion jitter. Speed sets how many jolts a second.",
};

/** A 22px icon that acts out a motion (animated by .motion-glyph in globals.css). */
function MotionGlyph({ type }: { type: MotionType }) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden className="motion-glyph" fill="currentColor">
      {type === "off" && (
        <>
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
        </>
      )}
      {type === "drift" && (
        <g className="mg-drift">
          <circle cx="12" cy="12" r="2.6" />
          <circle cx="6.5" cy="12" r="1.8" opacity="0.5" />
          <circle cx="2.5" cy="12" r="1.1" opacity="0.25" />
        </g>
      )}
      {type === "sway" && (
        <>
          <path d="M4 16.5h16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.3" />
          <circle className="mg-sway" cx="12" cy="11" r="3" />
        </>
      )}
      {type === "spin" && (
        <g className="mg-spin">
          <rect x="7" y="7" width="10" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="7" r="2" />
        </g>
      )}
      {type === "orbit" && (
        <>
          <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
          <circle cx="12" cy="12" r="2.4" opacity="0.6" />
          <g className="mg-orbit">
            <circle cx="12" cy="4.5" r="2" />
          </g>
        </>
      )}
      {type === "rock" && (
        <g className="mg-rock">
          <path d="M12 4v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
          <circle cx="12" cy="16.5" r="3" />
        </g>
      )}
      {type === "breathe" && (
        <>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
          <circle className="mg-breathe" cx="12" cy="12" r="5" />
        </>
      )}
      {type === "bounce" && (
        <>
          <path d="M5 19.5h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.3" />
          <circle className="mg-bounce" cx="12" cy="16" r="2.8" />
        </>
      )}
      {type === "float" && (
        <>
          <path d="M3 16c2 -1.4 4 -1.4 6 0s4 1.4 6 0s4 -1.4 6 0" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.35" />
          <rect className="mg-float" x="8.5" y="8" width="7" height="5" rx="1.5" />
        </>
      )}
      {type === "weave" && (
        <>
          <path d="M12 12c-2.5 -3.5 -7 -3.5 -7 0s4.5 3.5 7 0s7 -3.5 7 0s-4.5 3.5 -7 0" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
          <circle className="mg-weave" cx="12" cy="12" r="2.2" />
        </>
      )}
      {type === "shake" && (
        <g className="mg-shake">
          <rect x="7.5" y="7.5" width="9" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 9v6M20 9v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
        </g>
      )}
      {type === "random" && (
        <g>
          <circle className="mg-rnd" cx="7" cy="7.5" r="1.9" />
          <circle className="mg-rnd" cx="16.5" cy="6.5" r="1.5" />
          <circle className="mg-rnd" cx="11.5" cy="12.5" r="2.2" />
          <circle className="mg-rnd" cx="6" cy="17" r="1.4" />
          <circle className="mg-rnd" cx="17" cy="16.5" r="1.9" />
        </g>
      )}
    </svg>
  );
}

/**
 * Moves the layer's effect over the picture below it (any effect), plus the
 * tempo of the effect's own built-in animation where it has one.
 */
function MotionGroup({
  section,
  hasClock,
  cells,
  playing,
  set,
}: {
  section: StudioState["sections"][SectionKey];
  hasClock: boolean;
  /** Drawn as cells, so Random moves each cell on its own. */
  cells: boolean;
  playing: boolean;
  set: (key: string) => (v: Value) => void;
}) {
  const m = motionOf(section);
  const directional = DIRECTIONAL.includes(m.type);
  const ranged = RANGED.includes(m.type);
  const moving = m.type !== "off" || (hasClock && m.tempo !== 0);
  const note = !section.animated
    ? "This layer is held still. Press play in its header to let it move."
    : moving && !playing
      ? "Press Animate in the top bar to see it move."
      : m.type === "random" && cells
        ? "Every piece wanders its own way."
        : MOTION_HINTS[m.type];

  return (
    <Group title="Motion" delay={80}>
      {/* Tiles that act out their motion: hover one to preview it. */}
      <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Motion">
        {MOTIONS.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={m.type === v}
            title={v === "off" ? "No motion" : MOTION_HINTS[v]}
            onClick={() => set("motion")(v)}
            className={`motion-tile press flex h-[58px] flex-col items-center justify-center gap-1 rounded-[14px] text-[12px] capitalize ${
              m.type === v
                ? "bg-bone font-medium text-ink"
                : "bg-white/[0.05] text-bone/65 hover:bg-white/[0.09] hover:text-bone"
            }`}
          >
            <MotionGlyph type={v} />
            {v}
          </button>
        ))}
      </div>
      {directional && (
        <>
          <div className="grid grid-cols-8 gap-1" role="radiogroup" aria-label="Direction">
            {COMPASS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={Math.round(m.angle) === a || (a === 180 && Math.round(m.angle) === -180)}
                aria-label={`Direction ${a}°`}
                title={`${a}°`}
                onClick={() => set("motionAngle")(a)}
                className={`press flex h-8 items-center justify-center rounded-[10px] ${
                  Math.round(m.angle) === a || (a === 180 && Math.round(m.angle) === -180)
                    ? "bg-bone text-ink"
                    : "bg-white/[0.05] text-bone/70 hover:bg-white/[0.1] hover:text-bone"
                }`}
              >
                {/* Screen y points down, so a positive angle (up) turns the arrow anticlockwise. */}
                <ArrowRight size={13} style={{ transform: `rotate(${-a}deg)` }} />
              </button>
            ))}
          </div>
          <Scrub
            label="Direction"
            value={m.angle}
            min={-180}
            max={180}
            step={1}
            format={(v) => `${Math.round(v)}°`}
            onChange={set("motionAngle")}
          />
        </>
      )}
      {m.type !== "off" && (
        <Scrub
          label="Speed"
          value={m.speed}
          min={-2}
          max={2}
          step={0.01}
          format={(v) => `${v.toFixed(2)}×`}
          onChange={set("motionSpeed")}
        />
      )}
      {ranged && (
        <Scrub
          label="Distance"
          value={m.distance}
          min={0}
          max={1}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={set("motionDistance")}
        />
      )}
      {m.type === "random" && !cells && (
        <Scrub
          label="Scatter"
          value={m.scatter}
          min={0}
          max={1}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={set("motionScatter")}
        />
      )}
      {hasClock && (
        <Scrub
          label="Tempo"
          value={m.tempo}
          min={0}
          max={3}
          step={0.01}
          format={(v) => `${v.toFixed(2)}×`}
          onChange={set("tempo")}
        />
      )}
      {note && <p className="px-1 pt-0.5 text-[12px] leading-snug text-bone/45">{note}</p>}
    </Group>
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
          className="blue-button anim-rise mt-5 h-10 rounded-full px-5 text-[13.5px] font-semibold"
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
                <button type="button" onClick={p.onPickImage} className="blue-button h-9 rounded-[12px] text-[13px]">
                  Replace
                </button>
                <button type="button" onClick={p.onRemoveImage} className="blue-button h-9 rounded-[12px] text-[13px]">
                  Remove
                </button>
              </div>
            )}
            {p.imageUrl && (
              <>
                <div className="flex items-center gap-1.5">
                  <button type="button" aria-label="Zoom out" title="Zoom out (−)" onClick={() => p.onZoomImage(1 / 1.2)} className="press h-10 w-9 shrink-0 rounded-[12px] bg-white/[0.05] text-[17px] text-bone/80 hover:bg-white/[0.09] hover:text-bone">
                    −
                  </button>
                  <div className="min-w-0 flex-1">
                    <Scrub
                      label="Zoom"
                      value={Number(section.scale) || 1}
                      min={IMAGE_ZOOM.min}
                      max={IMAGE_ZOOM.max}
                      step={0.01}
                      format={(v) => `${Math.round(v * 100)}%`}
                      onChange={set("scale")}
                    />
                  </div>
                  <button type="button" aria-label="Zoom in" title="Zoom in (+)" onClick={() => p.onZoomImage(1.2)} className="press h-10 w-9 shrink-0 rounded-[12px] bg-white/[0.05] text-[17px] text-bone/80 hover:bg-white/[0.09] hover:text-bone">
                    +
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 px-1">
                  <p className="text-[12px] leading-snug text-bone/45">Scroll on the canvas to zoom, drag to move.</p>
                  <button
                    type="button"
                    onClick={p.onResetImageView}
                    title="Fit (0)"
                    className="press shrink-0 rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-bone/75 hover:bg-white/[0.09] hover:text-bone"
                  >
                    Fit
                  </button>
                </div>
              </>
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

        <MotionGroup
          section={section}
          hasClock={schema.glsl.includes("uTime")}
          cells={Boolean(schema.cells)}
          playing={p.playing}
          set={set}
        />

        <Group title="Settings" delay={100}>
          {schema.controls.map((c) => {
            // The photo's zoom lives in its own bar above.
            if (selected === "image" && c.key === "scale" && p.imageUrl) return null;
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
              case "curves":
                return <CurveEditor key={c.key} value={String(v ?? "")} onChange={set(c.key)} />;
            }
          })}
        </Group>
      </fieldset>
    </div>
  );
}
