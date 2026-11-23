"use client";

import type { ReactNode } from "react";

/** A titled group in a Lab panel. */
export function Card({ title, aside, children, delay = 0 }: { title: string; aside?: ReactNode; children: ReactNode; delay?: number }) {
  return (
    <section className="anim-rise relative rounded-[18px] bg-white/[0.04] has-[[aria-expanded=true]]:z-20" style={{ animationDelay: `${delay}ms` }}>
      <header className="flex items-center justify-between px-4 pb-0.5 pt-3.5">
        <h3 className="text-[13.5px] font-semibold text-bone">{title}</h3>
        {aside}
      </header>
      <div className="space-y-2 p-3.5 pt-2.5">{children}</div>
    </section>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] leading-snug text-bone/50">{children}</p>;
}

/** Full-width action button; `primary` is the bone fill. */
export function Action({
  children,
  onClick,
  disabled,
  primary,
  active,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`press flex h-10 w-full items-center justify-center gap-2 rounded-[12px] px-3 text-[13px] font-medium disabled:pointer-events-none disabled:opacity-35 ${
        active ? "bg-ember text-ink" : primary ? "bg-bone text-ink hover:bg-white" : "bg-white/[0.06] text-bone/85 hover:bg-white/[0.11] hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

/** A thin live meter, 0..1. */
export function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2.5 text-[12px] text-bone/55">
      <span className="w-[86px] shrink-0 capitalize">{label}</span>
      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
        <span className="absolute inset-y-0 left-0 rounded-full bg-ember transition-[width] duration-100" style={{ width: `${Math.min(100, value * 100)}%` }} />
      </span>
      <span className="w-8 text-right font-outfit tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}
