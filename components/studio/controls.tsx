"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-9 items-center justify-between gap-3">
      <span className="truncate text-[13px] text-neutral-400">{label}</span>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors ${
        checked ? "bg-white" : "bg-neutral-700"
      }`}
    >
      <span
        className={`absolute top-[3px] size-3 rounded-full transition-all ${
          checked ? "left-[15px] bg-neutral-900" : "left-[3px] bg-neutral-300"
        }`}
      />
    </button>
  );
}

function decimals(step: number) {
  const s = String(step);
  return s.includes(".") ? s.split(".")[1].length : 0;
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const places = Math.max(decimals(step), step < 1 ? 2 : 0);
  const [draft, setDraft] = useState<string | null>(null);
  const fill = ((value - min) / (max - min)) * 100;

  const commit = (raw: string) => {
    const v = Number(raw);
    if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
    setDraft(null);
  };

  return (
    <>
      <input
        type="number"
        aria-label={label}
        value={draft ?? value.toFixed(places)}
        step={step}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="h-[30px] w-[68px] rounded-lg border border-neutral-800 bg-transparent px-2.5 font-outfit text-[13px] text-neutral-100 outline-none focus:border-neutral-500"
      />
      <input
        type="range"
        aria-label={label}
        className="slider w-[64px]"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </>
  );
}

export function Select({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-[30px] w-[144px] cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 px-2 text-[13px] capitalize text-neutral-100 outline-none focus:border-neutral-500"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Swatch({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label
      className="relative size-[30px] shrink-0 cursor-pointer overflow-hidden rounded-lg border border-neutral-700"
      style={{ background: value }}
      title={value}
    >
      <input
        type="color"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

export function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <>
      <input
        aria-label={`${label} hex`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => (/^#[0-9a-f]{6}$/i.test(draft) ? onChange(draft.toLowerCase()) : setDraft(value))}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="h-[30px] w-[102px] rounded-lg border border-neutral-800 bg-transparent px-2.5 font-outfit text-[13px] uppercase text-neutral-100 outline-none focus:border-neutral-500"
      />
      <Swatch value={value} onChange={onChange} label={label} />
    </>
  );
}

export function ColorList({
  value,
  max,
  onChange,
}: {
  value: string[];
  max: number;
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      {value.map((c, i) => (
        <div key={i} className="group relative">
          <Swatch
            value={c}
            label={`Color ${i + 1}`}
            onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))}
          />
          {value.length > 2 && (
            <button
              type="button"
              aria-label={`Remove color ${i + 1}`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute -right-1 -top-1 hidden size-4 items-center justify-center rounded-full bg-neutral-200 text-neutral-900 group-hover:flex"
            >
              <X size={10} strokeWidth={3} />
            </button>
          )}
        </div>
      ))}
      {value.length < max && (
        <button
          type="button"
          aria-label="Add color"
          onClick={() => onChange([...value, value[value.length - 1]])}
          className="flex size-[30px] items-center justify-center rounded-lg border border-dashed border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
}
