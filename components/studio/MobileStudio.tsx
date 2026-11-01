"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Blend, Dices, Download, Pause, Play, Redo2, Share2, Undo2 } from "@/components/icons";
import { CATEGORY_ICONS } from "@/components/icons";
import { Logo } from "@/components/Logo";

export type MobileSheet = "effects" | "edit" | "export";

const NAV_H = 64;
const SHEET_H = "58svh";

/** A bottom sheet that springs up, and closes when dragged down by its handle. */
function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-hidden={!open}
      className="glass-panel fixed inset-x-0 z-30 flex flex-col overflow-hidden rounded-t-[28px]"
      style={{
        bottom: NAV_H,
        height: SHEET_H,
        transform: open ? `translateY(${drag}px)` : "translateY(calc(100% + 80px))",
        transition: start.current === null ? "transform 0.55s cubic-bezier(0.32, 0.72, 0, 1)" : "none",
      }}
    >
      <div
        className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        onPointerDown={(e) => {
          start.current = e.clientY;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (start.current !== null) setDrag(Math.max(0, e.clientY - start.current));
        }}
        onPointerUp={() => {
          if (drag > 90) onClose();
          start.current = null;
          setDrag(0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDrag(0);
        }}
      >
        <span className="h-1 w-10 rounded-full bg-white/25" />
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

function BarButton({
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
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="press flex size-10 shrink-0 items-center justify-center rounded-full text-bone/80 active:bg-white/10 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

type Props = {
  stage: (style: CSSProperties) => ReactNode;
  library: ReactNode;
  inspector: ReactNode;
  exportPanel: ReactNode;
  dock: ReactNode;
  sheet: MobileSheet | null;
  onSheet: (s: MobileSheet | null) => void;
  playing: boolean;
  onTogglePlay: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRandomize: () => void;
  onShare: () => void;
  extras: ReactNode;
};

/**
 * The studio on phones: a compact top bar, the canvas, the layer strip, and
 * a tab bar whose tabs open bottom sheets. Shares every panel with desktop.
 */
export default function MobileStudio(p: Props) {
  const tabs: { id: MobileSheet; label: string; icon: ReactNode }[] = [
    { id: "effects", label: "Effects", icon: <Blend size={18} /> },
    { id: "edit", label: "Edit", icon: <CATEGORY_ICONS.Color size={18} /> },
    { id: "export", label: "Export", icon: <Download size={18} /> },
  ];
  const stageStyle: CSSProperties = {
    top: 68,
    left: 10,
    right: 10,
    bottom: p.sheet ? `calc(${SHEET_H} + ${NAV_H + 8}px)` : NAV_H + 84,
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-ink text-bone">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[50vh] w-[90vw] -translate-x-1/2 rounded-full bg-ember/[0.07] blur-[90px]"
      />

      {p.stage(stageStyle)}

      {/* Top bar */}
      <header className="glass-panel fixed inset-x-2.5 top-2.5 z-30 flex h-[52px] items-center gap-0.5 rounded-full pl-2.5 pr-1.5">
        <Link href="/" aria-label="Imaginry home" className="group mr-auto text-bone">
          <Logo size={28} textClass="text-[15px]" />
        </Link>
        <BarButton label="Undo" onClick={p.onUndo} disabled={!p.canUndo}>
          <Undo2 size={16} />
        </BarButton>
        <BarButton label="Redo" onClick={p.onRedo} disabled={!p.canRedo}>
          <Redo2 size={16} />
        </BarButton>
        <BarButton label="Surprise me" onClick={p.onRandomize}>
          <Dices size={17} />
        </BarButton>
        <BarButton label={p.playing ? "Pause" : "Animate"} onClick={p.onTogglePlay}>
          {p.playing ? <Pause size={16} /> : <Play size={16} />}
        </BarButton>
        <button
          type="button"
          aria-label="Copy share link"
          onClick={p.onShare}
          className="press ml-1 flex size-10 items-center justify-center rounded-full bg-bone text-ink"
        >
          <Share2 size={16} />
        </button>
      </header>

      {/* Layer strip, tucked away while a sheet is up */}
      <div
        className="fixed inset-x-2.5 z-20 flex justify-center transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          bottom: NAV_H + 6,
          transform: p.sheet ? "translateY(40px)" : "none",
          opacity: p.sheet ? 0 : 1,
          pointerEvents: p.sheet ? "none" : "auto",
        }}
      >
        {p.dock}
      </div>

      <Sheet open={p.sheet === "effects"} onClose={() => p.onSheet(null)}>
        {p.library}
      </Sheet>
      <Sheet open={p.sheet === "edit"} onClose={() => p.onSheet(null)}>
        {p.inspector}
      </Sheet>
      <Sheet open={p.sheet === "export"} onClose={() => p.onSheet(null)}>
        {p.exportPanel}
      </Sheet>

      {/* Tab bar */}
      <nav
        className="glass-panel fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 rounded-t-[22px] px-3 pb-[env(safe-area-inset-bottom)]"
        style={{ height: NAV_H }}
        aria-label="Studio panels"
      >
        {tabs.map((t) => {
          const on = p.sheet === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => p.onSheet(on ? null : t.id)}
              className={`press relative my-2 flex flex-col items-center justify-center gap-0.5 rounded-[16px] text-[11.5px] font-medium transition-colors ${
                on ? "bg-white/[0.09] text-bone" : "text-bone/55"
              }`}
            >
              <span
                className={`transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${on ? "-translate-y-0.5 scale-110 text-ember" : ""}`}
              >
                {t.icon}
              </span>
              {t.label}
            </button>
          );
        })}
      </nav>

      {p.extras}
    </div>
  );
}
