"use client";

import {
  Bookmark,
  Dices,
  Download,
  Ellipsis,
  Pause,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  RotateCcw,
  Scan,
  Share2,
  Square,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LANDSCAPE_ASPECTS, PORTRAIT_ASPECTS, type Aspect } from "./Stage";

const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 3];

const ghost =
  "flex h-[30px] items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-neutral-200 transition-colors hover:bg-neutral-800";
const outline =
  "flex h-[30px] items-center gap-1.5 rounded-lg border border-neutral-800 px-2.5 text-[13px] font-medium text-neutral-100 transition-colors hover:bg-neutral-800";

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex size-[30px] items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-800"
    >
      {children}
    </button>
  );
}

const MAIN_ASPECTS: { value: Aspect; label: string; icon: ReactNode }[] = [
  { value: "fill", label: "Fill", icon: <Scan size={14} /> },
  { value: "1:1", label: "Square 1:1", icon: <Square size={14} /> },
  { value: "4:5", label: "Portrait 4:5", icon: <RectangleVertical size={14} /> },
  { value: "16:9", label: "Landscape 16:9", icon: <RectangleHorizontal size={14} /> },
];
const MORE_ASPECTS: Aspect[] = [...LANDSCAPE_ASPECTS, ...PORTRAIT_ASPECTS].filter((a) => a !== "4:5" && a !== "16:9");

type Props = {
  playing: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeed: (v: number) => void;
  aspect: Aspect;
  onAspect: (a: Aspect) => void;
  onRandomize: () => void;
  onReset: () => void;
  onShare: () => void;
  onSave: () => void;
  onExport: () => void;
};

export default function Toolbar(p: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [moreOpen]);

  const moreActive = MORE_ASPECTS.includes(p.aspect);

  return (
    <div className="grid h-[58px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
      <div className="flex items-center gap-2">
        <IconButton label="Randomize" onClick={p.onRandomize}>
          <Dices size={14} />
        </IconButton>
        <IconButton label="Reset" onClick={p.onReset}>
          <RotateCcw size={14} />
        </IconButton>
        <button type="button" onClick={p.onTogglePlay} className={`${outline} ${p.playing ? "bg-neutral-800" : ""}`}>
          {p.playing ? <Pause size={13} /> : <Play size={13} />}
          Animate
        </button>
        <button
          type="button"
          title="Animation speed"
          onClick={() => p.onSpeed(SPEEDS[(SPEEDS.indexOf(p.speed) + 1) % SPEEDS.length])}
          className={`${ghost} font-outfit`}
        >
          {Number.isInteger(p.speed) ? p.speed.toFixed(1) : p.speed}×
        </button>
      </div>

      <div className="flex items-center gap-0.5 rounded-[10px] border border-neutral-800 p-[3px]">
        {MAIN_ASPECTS.map((a) => (
          <button
            key={a.value}
            type="button"
            title={a.label}
            aria-label={a.label}
            aria-pressed={p.aspect === a.value}
            onClick={() => p.onAspect(a.value)}
            className={`flex size-[26px] items-center justify-center rounded-[7px] transition-colors ${
              p.aspect === a.value ? "bg-white text-black" : "text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            {a.icon}
          </button>
        ))}
        <div ref={moreRef} className="relative">
          <button
            type="button"
            title="More ratios"
            aria-label="More ratios"
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex h-[26px] min-w-[26px] items-center justify-center rounded-[7px] px-1 font-outfit text-[11px] transition-colors ${
              moreActive ? "bg-white text-black" : "text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            {moreActive ? p.aspect : <Ellipsis size={14} />}
          </button>
          {moreOpen && (
            <div className="absolute left-1/2 top-9 z-30 grid w-36 -translate-x-1/2 grid-cols-2 rounded-lg border border-neutral-800 bg-neutral-950 p-1 shadow-xl">
              {MORE_ASPECTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    p.onAspect(a);
                    setMoreOpen(false);
                  }}
                  className={`block w-full rounded-md px-2.5 py-1.5 text-left font-outfit text-[13px] hover:bg-neutral-800 ${
                    p.aspect === a ? "text-white" : "text-neutral-400"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={p.onShare} className={outline}>
          <Share2 size={13} />
          Share
        </button>
        <button
          type="button"
          onClick={p.onSave}
          className="flex h-[30px] items-center gap-1.5 rounded-lg bg-white px-2.5 text-[13px] font-medium text-black transition-colors hover:bg-neutral-200"
        >
          <Bookmark size={13} />
          Save
        </button>
        <button type="button" onClick={p.onExport} className={outline}>
          <Download size={13} />
          Export
        </button>
      </div>
    </div>
  );
}
