"use client";

import { Blend, Bookmark, FolderOpen, Layers, PanelLeft } from "lucide-react";
import type { ReactNode } from "react";

export type PanelId = "effects" | "layers" | "saved";

const ITEMS: { id: PanelId; label: string; icon: ReactNode }[] = [
  { id: "effects", label: "Effects", icon: <Blend size={16} /> },
  { id: "layers", label: "Layers", icon: <Layers size={16} /> },
  { id: "saved", label: "Saved", icon: <Bookmark size={16} /> },
];

function RailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex size-[34px] items-center justify-center rounded-full transition-colors ${
        active ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function Rail({
  panel,
  onPanel,
  onOpenImage,
}: {
  panel: PanelId | null;
  onPanel: (p: PanelId | null) => void;
  onOpenImage: () => void;
}) {
  return (
    <nav className="flex w-[58px] shrink-0 flex-col items-center py-4">
      <span className="mb-10 font-display text-[9px] tracking-tight text-neutral-300">imaginry</span>
      <div className="flex flex-col items-center gap-3">
        {ITEMS.map((item) => (
          <RailButton
            key={item.id}
            label={item.label}
            active={panel === item.id}
            onClick={() => onPanel(panel === item.id ? null : item.id)}
          >
            {item.icon}
          </RailButton>
        ))}
        <RailButton label="Open image" onClick={onOpenImage}>
          <FolderOpen size={16} />
        </RailButton>
      </div>
      <div className="mt-auto flex flex-col items-center gap-3">
        <RailButton label={panel ? "Hide panel" : "Show panel"} onClick={() => onPanel(panel ? null : "effects")}>
          <PanelLeft size={16} />
        </RailButton>
        <span
          aria-hidden
          className="mt-1 size-7 rounded-full"
          style={{ background: "conic-gradient(from 200deg, #ff2d95, #ffb347, #ffe066, #ff5a1f, #ff2d95)" }}
        />
      </div>
    </nav>
  );
}
