"use client";

import Link from "next/link";
import { Keyboard, Pause, Play, Zen } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { IconButton } from "./controls";

const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 3];

type Props = {
  playing: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeed: (v: number) => void;
  /** Set when tap tempo drives the clock. */
  bpm: number | null;
  onZen: () => void;
  onShortcuts: () => void;
  onExport: () => void;
};

const pill = "glass-panel pointer-events-auto flex h-[52px] items-center gap-0.5 rounded-full px-2";

export default function LabBar(p: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-4 top-4 z-30 flex items-start justify-between gap-3">
      <div className={`${pill} pl-3 pr-2`}>
        <Link href="/lab" aria-label="Imaginry lab" className="press group mr-1 text-bone hover:text-white">
          <Logo size={28} textClass="text-[16px]" />
        </Link>
        <span className="mr-1 rounded-full bg-ember px-2.5 py-1 font-outfit text-[12px] font-semibold text-ink">Lab</span>
      </div>

      <div className={pill}>
        <button
          type="button"
          onClick={p.onTogglePlay}
          aria-pressed={p.playing}
          className={`press flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium ${
            p.playing ? "bg-bone text-ink" : "text-bone/80 hover:bg-white/[0.08] hover:text-bone"
          }`}
        >
          {p.playing ? <Pause size={13} /> : <Play size={13} />}
          {p.playing ? "Playing" : "Play"}
        </button>
        {p.bpm ? (
          <span title="Tap tempo sets the clock (React tab)" className="h-9 min-w-12 rounded-full px-2.5 font-outfit text-[13px] leading-9 tabular-nums text-ember">
            {p.bpm} bpm
          </span>
        ) : (
          <button
            type="button"
            title="Animation speed"
            onClick={() => p.onSpeed(SPEEDS[(SPEEDS.indexOf(p.speed) + 1) % SPEEDS.length])}
            className="press h-9 min-w-12 rounded-full px-2 font-outfit text-[13px] tabular-nums text-bone/70 hover:bg-white/[0.08] hover:text-bone"
          >
            {Number.isInteger(p.speed) ? p.speed.toFixed(1) : p.speed}×
          </button>
        )}
        <IconButton label="Zen mode (F)" onClick={p.onZen}>
          <Zen size={15} />
        </IconButton>
        <IconButton label="Shortcuts (?)" onClick={p.onShortcuts}>
          <Keyboard size={15} />
        </IconButton>
      </div>

      <div className={pill}>
        <button
          type="button"
          onClick={p.onExport}
          className="press flex h-9 items-center gap-2 rounded-full bg-bone px-4 text-[13.5px] font-medium text-ink hover:bg-white"
        >
          Export
        </button>
      </div>
    </div>
  );
}
