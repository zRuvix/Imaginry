"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  Bookmark,
  Compare,
  Dices,
  Download,
  Ellipsis,
  Keyboard,
  Pause,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  Redo2,
  Scan,
  Share2,
  Square,
  Undo2,
  Zen,
} from "@/components/icons";
import { SPONSORS, STUDIO_SLOTS } from "@/lib/sponsors";
import { IconButton, Segmented, useClickOutside } from "./controls";
import SponsorSlots from "./SponsorSlots";
import { LANDSCAPE_ASPECTS, PORTRAIT_ASPECTS, type Aspect } from "./Stage";
import { Logo } from "@/components/Logo";

const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 3];
const MAIN = ["fill", "1:1", "4:5", "16:9"] as const;
const MAIN_ICONS = {
  fill: <Scan size={14} />,
  "1:1": <Square size={14} />,
  "4:5": <RectangleVertical size={14} />,
  "16:9": <RectangleHorizontal size={14} />,
};

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRandomize: () => void;
  playing: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeed: (v: number) => void;
  aspect: Aspect;
  onAspect: (a: Aspect) => void;
  onCompare: (on: boolean) => void;
  onZen: () => void;
  onShortcuts: () => void;
  onShare: () => void;
  onSave: () => void;
  exportOpen: boolean;
  onExport: () => void;
};

const pill = "glass-panel pointer-events-auto flex h-[52px] items-center gap-0.5 rounded-full px-2";

export default function CommandBar(p: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useClickOutside(moreRef, moreOpen, () => setMoreOpen(false));
  const isMain = (MAIN as readonly string[]).includes(p.aspect);

  return (
    <div className="pointer-events-none absolute inset-x-4 top-4 z-30 flex items-start justify-between gap-3">
      <div className={`${pill} pl-3 pr-2`}>
        <Link href="/" aria-label="Imaginry home" className="press group mr-2 text-bone hover:text-white">
          <Logo size={28} textClass="text-[16px]" />
        </Link>
        <nav aria-label="Site" className="mr-1 hidden items-center xl:flex">
          {[
            ["/gallery", "Gallery"],
            ["/sponsor", "Sponsor"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="press rounded-full px-2.5 py-1.5 text-[13px] text-bone/60 hover:bg-white/[0.08] hover:text-bone"
            >
              {label}
            </Link>
          ))}
        </nav>
        <IconButton label="Undo (Ctrl+Z)" onClick={p.onUndo} disabled={!p.canUndo}>
          <Undo2 size={15} />
        </IconButton>
        <IconButton label="Redo (Ctrl+Shift+Z)" onClick={p.onRedo} disabled={!p.canRedo}>
          <Redo2 size={15} />
        </IconButton>
      </div>

      <SponsorSlots sponsors={SPONSORS} slots={Math.floor(STUDIO_SLOTS / 2)} offset={0} />

      <div className={pill}>
        <IconButton label="Surprise me (R)" onClick={p.onRandomize}>
          <Dices size={16} />
        </IconButton>
        <button
          type="button"
          onClick={p.onTogglePlay}
          aria-pressed={p.playing}
          className={`press flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium ${
            p.playing ? "bg-bone text-ink" : "text-bone/80 hover:bg-white/[0.08] hover:text-bone"
          }`}
        >
          {p.playing ? <Pause size={13} /> : <Play size={13} />}
          {p.playing ? "Playing" : "Animate"}
        </button>
        <button
          type="button"
          title="Animation speed"
          onClick={() => p.onSpeed(SPEEDS[(SPEEDS.indexOf(p.speed) + 1) % SPEEDS.length])}
          className="press h-9 min-w-12 rounded-full px-2 font-outfit text-[13px] tabular-nums text-bone/70 hover:bg-white/[0.08] hover:text-bone"
        >
          {Number.isInteger(p.speed) ? p.speed.toFixed(1) : p.speed}×
        </button>

        <div className="mx-1.5 w-[220px]">
          <Segmented
            label="Aspect ratio"
            size="sm"
            value={isMain ? (p.aspect as (typeof MAIN)[number]) : ("" as (typeof MAIN)[number])}
            options={MAIN}
            onChange={p.onAspect}
            render={(v) => <span title={v === "fill" ? "Fill the window" : v}>{MAIN_ICONS[v]}</span>}
          />
        </div>
        <div ref={moreRef} className="relative">
          <IconButton label="More ratios" active={!isMain} onClick={() => setMoreOpen((v) => !v)}>
            {isMain ? <Ellipsis size={15} /> : <span className="font-outfit text-[11px]">{p.aspect}</span>}
          </IconButton>
          {moreOpen && (
            <div className="anim-menu glass-panel absolute left-1/2 top-[calc(100%+10px)] z-40 w-[220px] -translate-x-1/2 rounded-[18px] p-2">
              {(
                [
                  ["Landscape", LANDSCAPE_ASPECTS],
                  ["Portrait", PORTRAIT_ASPECTS],
                ] as const
              ).map(([label, list]) => (
                <div key={label} className="p-1">
                  <p className="pb-1.5 text-[12px] text-bone/45">{label}</p>
                  <div className="grid grid-cols-3 gap-1">
                    {list.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          p.onAspect(a);
                          setMoreOpen(false);
                        }}
                        className={`press h-8 rounded-[10px] font-outfit text-[12.5px] ${
                          p.aspect === a ? "bg-bone text-ink" : "bg-white/[0.05] text-bone/75 hover:bg-white/[0.1]"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <IconButton
          label="Hold to compare with the original (C)"
          onPointerDown={() => p.onCompare(true)}
          onPointerUp={() => p.onCompare(false)}
          onPointerLeave={() => p.onCompare(false)}
        >
          <Compare size={15} />
        </IconButton>
        <IconButton label="Zen mode (F)" onClick={p.onZen}>
          <Zen size={15} />
        </IconButton>
        <IconButton label="Shortcuts (?)" onClick={p.onShortcuts}>
          <Keyboard size={15} />
        </IconButton>
      </div>

      <SponsorSlots sponsors={SPONSORS} slots={Math.ceil(STUDIO_SLOTS / 2)} offset={Math.floor(STUDIO_SLOTS / 2)} />

      <div className={pill}>
        <IconButton label="Copy share link" onClick={p.onShare}>
          <Share2 size={15} />
        </IconButton>
        <IconButton label="Save to library" onClick={p.onSave}>
          <Bookmark size={15} />
        </IconButton>
        <button
          type="button"
          onClick={p.onExport}
          aria-pressed={p.exportOpen}
          className={`press ml-1 flex h-9 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium ${
            p.exportOpen ? "bg-ember text-ink" : "bg-bone text-ink hover:bg-white"
          }`}
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </div>
  );
}
