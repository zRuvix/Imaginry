"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ChevronDown, Plus, X } from "@/components/icons";

export function useClickOutside(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [ref, open, close]);
}

// ---------------------------------------------------------------- buttons

/** Round icon button with a delayed tooltip. */
export function IconButton({
  label,
  onClick,
  active,
  disabled,
  children,
  tooltip = "bottom",
  className = "",
  ...rest
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  tooltip?: "bottom" | "top" | "none";
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`press group/tip relative flex size-9 shrink-0 items-center justify-center rounded-full disabled:pointer-events-none disabled:opacity-30 ${
        active ? "bg-bone text-ink" : "text-bone/75 hover:bg-white/[0.08] hover:text-bone"
      } ${className}`}
      {...rest}
    >
      {children}
      {tooltip !== "none" && (
        <span
          className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/85 px-2 py-1 text-[12px] font-medium text-bone opacity-0 transition-opacity delay-0 duration-150 group-hover/tip:opacity-100 group-hover/tip:delay-500 ${
            tooltip === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
          }`}
        >
          {label}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------- scrub slider

function decimals(step: number) {
  const s = String(step);
  return s.includes(".") ? s.split(".")[1].length : 0;
}

const SETTLE = "cubic-bezier(0.16,1,0.3,1)";

/**
 * A slider you grab anywhere: the whole bar is the track, the value sits
 * inside it, and the fill grows from zero (or the centre for ±ranges).
 * Double-click the number to type one; arrow keys nudge (Shift for ×10).
 */
export function Scrub({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const places = Math.max(decimals(step), step < 1 ? 2 : 0);
  const clampStep = (v: number) => {
    const snapped = Math.round((v - min) / step) * step + min;
    return Math.min(max, Math.max(min, +snapped.toFixed(places)));
  };

  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const centered = min < 0 && max > 0;
  const zero = (-min / (max - min)) * 100;
  const left = centered ? Math.min(zero, pct) : 0;
  const width = centered ? Math.abs(pct - zero) : pct;
  const motion = dragging ? "none" : `left 0.35s ${SETTLE}, width 0.35s ${SETTLE}`;

  const setFromPointer = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    onChange(clampStep(min + t * (max - min)));
  };

  const onKey = (e: KeyboardEvent) => {
    const k = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(clampStep(value + step * k));
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(clampStep(value - step * k));
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onKeyDown={onKey}
      onPointerDown={(e) => {
        if (editing) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        setFromPointer(e);
      }}
      onPointerMove={(e) => dragging && setFromPointer(e)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      className={`group relative h-10 cursor-ew-resize touch-none select-none overflow-hidden rounded-[12px] outline-none transition-colors duration-200 focus-visible:bg-white/[0.09] ${
        dragging ? "bg-white/[0.09]" : "bg-white/[0.05] hover:bg-white/[0.07]"
      }`}
    >
      <span className="absolute inset-y-0 bg-white/[0.09]" style={{ left: `${left}%`, width: `${width}%`, transition: motion }} />
      <span
        className={`absolute inset-y-2 w-[2px] -translate-x-1/2 rounded-full bg-bone ${
          dragging ? "opacity-100" : "opacity-40 group-hover:opacity-80"
        }`}
        style={{ left: `${pct}%`, transition: dragging ? "opacity .2s" : `left 0.35s ${SETTLE}, opacity .2s` }}
      />
      <span className="pointer-events-none relative flex h-full items-center justify-between px-3.5 text-[13px]">
        <span className="text-bone/60">{label}</span>
        {editing ? (
          <input
            autoFocus
            defaultValue={String(value)}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onChange(clampStep(v));
              setEditing(false);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditing(false);
            }}
            className="pointer-events-auto w-16 rounded-md bg-black/40 px-1.5 py-0.5 text-right font-outfit text-bone outline-none"
          />
        ) : (
          <span
            className="pointer-events-auto cursor-text font-outfit tabular-nums text-bone"
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={() => setEditing(true)}
            title="Double-click to type"
          >
            {format ? format(value) : value.toFixed(places)}
          </span>
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- segmented + select

/** Pill tabs with a highlight that slides to the active option. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
  render,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
  render?: (v: T) => ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const el = wrap.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`);
      // No match (e.g. a value from elsewhere): hide the pill.
      setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : { left: 0, width: 0 });
    };
    measure();
    // Labels change width once the web fonts arrive.
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [value, options]);

  return (
    <div
      ref={wrap}
      role="radiogroup"
      aria-label={label}
      className={`relative flex rounded-full bg-white/[0.05] p-1 ${size === "sm" ? "h-9" : "h-10"}`}
    >
      <span
        className="absolute inset-y-1 rounded-full bg-bone transition-[left,width] duration-500 ease-[cubic-bezier(0.34,1.3,0.64,1)]"
        style={{ left: pill.left, width: pill.width }}
      />
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={o === value}
          aria-label={typeof o === "string" ? o : undefined}
          data-value={o}
          onClick={() => onChange(o)}
          className={`relative z-10 flex flex-1 items-center justify-center rounded-full px-3 text-[13px] font-medium capitalize transition-colors duration-300 ${
            o === value ? "text-ink" : "text-bone/60 hover:text-bone"
          }`}
        >
          {render ? render(o) : o}
        </button>
      ))}
    </div>
  );
}

/** A quiet dropdown: the trigger shows the value, the menu springs open. */
export function Select({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="press flex h-10 w-full items-center justify-between rounded-[12px] bg-white/[0.05] px-3.5 text-[13px] hover:bg-white/[0.08] active:scale-[0.98]"
      >
        <span className="text-bone/60">{label}</span>
        <span className="flex items-center gap-1.5 capitalize text-bone">
          {value}
          <ChevronDown size={12} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="anim-menu glass-panel absolute right-0 top-[calc(100%+6px)] z-40 max-h-64 w-44 overflow-y-auto rounded-[14px] p-1.5"
        >
          {options.map((o) => (
            <li key={o}>
              <button
                type="button"
                role="option"
                aria-selected={o === value}
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-[13px] capitalize transition-colors ${
                  o === value ? "bg-white/[0.1] text-bone" : "text-bone/70 hover:bg-white/[0.06] hover:text-bone"
                }`}
              >
                {o}
                {o === value && <span className="size-1.5 rounded-full bg-ember" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- toggle

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="press flex h-10 w-full items-center justify-between rounded-[12px] bg-white/[0.05] px-3.5 text-[13px] hover:bg-white/[0.08] active:scale-[0.98]"
    >
      <span className="text-bone/60">{label}</span>
      <span className={`relative h-[22px] w-[38px] rounded-full transition-colors duration-300 ${checked ? "bg-ember" : "bg-white/15"}`}>
        <span
          className="absolute top-[3px] size-4 rounded-full bg-bone shadow transition-[left] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ left: checked ? 19 : 3 }}
        />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------- color

function Swatch({
  value,
  onChange,
  label,
  size = 28,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  size?: number;
}) {
  return (
    <label
      className="press relative block shrink-0 cursor-pointer rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.45)] hover:scale-110"
      style={{ background: value, width: size, height: size }}
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
    <div className="flex h-10 items-center justify-between rounded-[12px] bg-white/[0.05] pl-3.5 pr-1.5 text-[13px]">
      <span className="text-bone/60">{label}</span>
      <span className="flex items-center gap-2">
        <input
          aria-label={`${label} hex`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => (/^#[0-9a-f]{6}$/i.test(draft) ? onChange(draft.toLowerCase()) : setDraft(value))}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="w-[72px] bg-transparent text-right font-outfit uppercase text-bone outline-none"
        />
        <Swatch value={value} onChange={onChange} label={label} />
      </span>
    </div>
  );
}

export function ColorList({ value, max, onChange }: { value: string[]; max: number; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[12px] bg-white/[0.05] p-2.5">
      {value.map((c, i) => (
        <div key={i} className="group relative">
          <Swatch
            value={c}
            size={32}
            label={`Color ${i + 1}`}
            onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))}
          />
          {value.length > 2 && (
            <button
              type="button"
              aria-label={`Remove color ${i + 1}`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="press absolute -right-1.5 -top-1.5 hidden rounded-full bg-ink text-bone group-hover:flex"
            >
              <X size={13} />
            </button>
          )}
        </div>
      ))}
      {value.length < max && (
        <button
          type="button"
          aria-label="Add color"
          onClick={() => onChange([...value, value[value.length - 1]])}
          className="press flex size-8 items-center justify-center rounded-full bg-white/[0.08] text-bone/70 hover:bg-white/[0.14] hover:text-bone"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
}
