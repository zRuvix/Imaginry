"use client";

import { ChevronDown, Info, Lock, Redo2, Undo2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { SCHEMA, type SectionKey, type StudioState, type Value } from "@/lib/studio/schema";
import { ColorInput, ColorList, Row, Select, Slider, Toggle } from "./controls";

type Props = {
  state: StudioState;
  onChange: (section: SectionKey, key: string, value: Value) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  imageUrl: string | null;
  onPickImage: () => void;
  onRemoveImage: () => void;
  /** Opens and scrolls to a section; `n` changes on every request. */
  focus?: { key: SectionKey; n: number } | null;
};

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <Info size={13} className="text-neutral-500" />
      <span className="pointer-events-none absolute left-1/2 top-5 z-20 hidden w-56 -translate-x-1/2 rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-[12px] font-normal leading-snug text-neutral-300 shadow-xl group-hover:block">
        {text}
      </span>
    </span>
  );
}

const iconButton =
  "flex size-[30px] items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-800 disabled:opacity-35 disabled:hover:bg-transparent";

export default function PropsPanel(props: Props) {
  const { state, onChange } = props;
  const [open, setOpen] = useState<Set<SectionKey>>(() => new Set(["grain"]));

  const focus = props.focus;
  useEffect(() => {
    if (!focus) return;
    setOpen((prev) => new Set(prev).add(focus.key));
    requestAnimationFrame(() =>
      document.getElementById(`props-${focus.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, [focus]);

  const toggleOpen = (key: SectionKey) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <aside className="flex w-[256px] shrink-0 flex-col overflow-hidden rounded-xl border border-panel-border bg-panel">
      <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-panel-border px-4">
        <h2 className="text-[15px] font-semibold">Props</h2>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Undo"
            className={iconButton}
            disabled={!props.canUndo}
            onClick={props.onUndo}
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            aria-label="Redo"
            className={iconButton}
            disabled={!props.canRedo}
            onClick={props.onRedo}
          >
            <Redo2 size={14} />
          </button>
        </div>
      </header>

      <div className="scroll-thin flex-1 overflow-y-auto px-4 pb-6 pt-3">
        {SCHEMA.map((schema) => {
          const section = state.sections[schema.key];
          const isOpen = open.has(schema.key);
          return (
            <section
              key={schema.key}
              id={`props-${schema.key}`}
              className="scroll-mt-2 border-b border-panel-border last:border-b-0"
            >
              <button
                type="button"
                onClick={() => toggleOpen(schema.key)}
                aria-expanded={isOpen}
                className="flex h-[52px] w-full items-center justify-between text-left"
              >
                <span className="flex items-center gap-2 text-[15px] font-semibold">
                  {schema.label}
                  {schema.info && <InfoTip text={schema.info} />}
                  {section.enabled && <span className="size-1.5 rounded-full bg-white" aria-label="enabled" />}
                  {section.locked && <Lock size={12} className="text-neutral-400" aria-label="locked" />}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="pb-3">
                  {schema.key === "image" && (
                    <>
                      <p className="pb-3 text-[12.5px] leading-snug text-neutral-400">{schema.info}</p>
                      <button
                        type="button"
                        onClick={props.onPickImage}
                        aria-label={props.imageUrl ? "Replace image" : "Upload image"}
                        className="mb-1.5 flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-600"
                      >
                        {props.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={props.imageUrl} alt="" className="size-full object-contain p-2" />
                        ) : (
                          <span className="flex flex-col items-center gap-1.5 text-[12.5px] text-neutral-500">
                            <Upload size={16} />
                            Upload, paste or drop an image
                          </span>
                        )}
                      </button>
                    </>
                  )}
                  <Row label="Enable">
                    <Toggle
                      label={`Enable ${schema.label}`}
                      checked={section.enabled}
                      onChange={(v) => {
                        if (schema.key === "image" && v && !props.imageUrl) props.onPickImage();
                        else onChange(schema.key, "enabled", v);
                      }}
                    />
                  </Row>

                  <fieldset disabled={section.locked} className="disabled:opacity-40">
                    {schema.key === "image" && props.imageUrl && (
                      <div className="grid grid-cols-2 gap-2 py-1.5">
                        <button
                          type="button"
                          onClick={props.onPickImage}
                          className="h-[30px] rounded-lg border border-neutral-800 bg-neutral-900 text-[12.5px] font-medium text-neutral-100 hover:bg-neutral-800"
                        >
                          Replace image
                        </button>
                        <button
                          type="button"
                          onClick={props.onRemoveImage}
                          className="h-[30px] rounded-lg border border-neutral-800 bg-neutral-900 text-[12.5px] font-medium text-neutral-100 hover:bg-neutral-800"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {schema.controls.map((c) => {
                      const v = section[c.key];
                      const set = (value: Value) => onChange(schema.key, c.key, value);
                      switch (c.type) {
                        case "slider":
                          return (
                            <Row key={c.key} label={c.label}>
                              <Slider
                                label={c.label}
                                value={Number(v)}
                                min={c.min}
                                max={c.max}
                                step={c.step}
                                onChange={set}
                              />
                            </Row>
                          );
                        case "select":
                          return (
                            <Row key={c.key} label={c.label}>
                              <Select label={c.label} value={String(v)} options={c.options} onChange={set} />
                            </Row>
                          );
                        case "toggle":
                          return (
                            <Row key={c.key} label={c.label}>
                              <Toggle label={c.label} checked={Boolean(v)} onChange={set} />
                            </Row>
                          );
                        case "color":
                          return (
                            <Row key={c.key} label={c.label}>
                              <ColorInput label={c.label} value={String(v)} onChange={set} />
                            </Row>
                          );
                        case "colors":
                          return (
                            <div key={c.key} className="py-1">
                              <span className="text-[13px] text-neutral-400">{c.label}</span>
                              <ColorList value={v as string[]} max={c.max} onChange={set} />
                            </div>
                          );
                      }
                    })}
                  </fieldset>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
