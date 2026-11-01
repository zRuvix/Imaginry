"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GROUPS, PALETTES, type Preset } from "@/lib/studio/presets";
import { renderOffscreen } from "@/lib/studio/renderer";
import {
  addLayer,
  initialState,
  SCHEMA_BY_KEY,
  type SectionKey,
  type SectionState,
  type StudioState,
  type Value,
} from "@/lib/studio/schema";
import { decodeShare, encodeShare, loadSaved, storeSaved, type SavedDesign } from "@/lib/studio/storage";
import { useHistory } from "@/lib/studio/useHistory";
import CommandBar from "./CommandBar";
import ExportPanel from "./ExportPanel";
import Inspector from "./Inspector";
import LayerDock from "./LayerDock";
import Library from "./Library";
import Shortcuts from "./Shortcuts";
import Stage, { ASPECTS, type Aspect } from "./Stage";

/** Renders a still on the shared offscreen context (returns its own canvas). */
function renderStill(state: StudioState, width: number, height: number, image: HTMLImageElement | null, time: number) {
  return renderOffscreen(state, width, height, { time, image });
}

function withPreset(state: StudioState, preset: Preset): StudioState {
  const section = state.sections[preset.section];
  return {
    ...state,
    sections: {
      ...state.sections,
      [preset.section]: { ...section, ...structuredClone(preset.values), enabled: true, preset: preset.id },
    },
    order: addLayer(state.order, preset.section),
  };
}

/** Takes a layer out of the stack entirely (unlike hiding it). */
function withoutLayer(state: StudioState, key: SectionKey): StudioState {
  return {
    ...state,
    sections: { ...state.sections, [key]: { ...state.sections[key], enabled: false, preset: null } },
    order: state.order.filter((k) => k !== key),
  };
}

/** Section fields that stay editable while a layer is locked. */
const LAYER_FLAGS = new Set(["enabled", "locked", "animated", "frozenTime"]);

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

function randomHex() {
  const h = Math.random() * 360;
  const s = 0.55 + Math.random() * 0.35;
  const l = 0.35 + Math.random() * 0.35;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Floating panels leave this much room around the stage. */
const INSETS = { top: 84, left: 320, right: 344, bottom: 108 };
const ZEN_INSETS = { top: 16, left: 16, right: 16, bottom: 16 };

export default function Studio() {
  const history = useHistory<StudioState>(initialState);
  const { state, set } = history;

  const [aspect, setAspect] = useState<Aspect>("fill");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [saved, setSaved] = useState<SavedDesign[]>([]);
  const [toast, setToast] = useState<{ msg: string; n: number } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 1, height: 1 });
  const [selected, setSelected] = useState<SectionKey | null>("glass");
  const [zen, setZen] = useState(false);
  const [compare, setCompare] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const timeRef = useRef(0);
  const sizeRef = useRef({ width: 1, height: 1 });
  const fileRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const notify = useCallback((msg: string) => setToast((t) => ({ msg, n: (t?.n ?? 0) + 1 })), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // Restore a shared design from the URL and the saved list from storage.
  useEffect(() => {
    const shared = decodeShare(window.location.hash);
    if (shared) {
      set(shared);
      setSelected(shared.order[0] ?? null);
    }
    setSaved(loadSaved());
  }, [set]);

  // Keep the selection on a layer that still exists.
  useEffect(() => {
    if (selected && !state.order.includes(selected)) setSelected(state.order[0] ?? null);
  }, [state.order, selected]);

  const isLocked = useCallback(
    (section: SectionKey) => {
      if (!stateRef.current.sections[section].locked) return false;
      notify(`${SCHEMA_BY_KEY[section].label} is locked`);
      return true;
    },
    [notify],
  );

  const updateSection = useCallback(
    (section: SectionKey, key: string, value: Value) => {
      if (!LAYER_FLAGS.has(key) && isLocked(section)) return;
      set(
        (s) => ({
          ...s,
          sections: { ...s.sections, [section]: { ...s.sections[section], [key]: value } },
          order: key === "enabled" && value ? addLayer(s.order, section) : s.order,
        }),
        `${section}.${key}`,
      );
    },
    [set, isLocked],
  );

  const togglePreset = useCallback(
    (preset: Preset) => {
      if (isLocked(preset.section)) return;
      const section = stateRef.current.sections[preset.section];
      const removing = section.enabled && section.preset === preset.id;
      set((s) => (removing ? withoutLayer(s, preset.section) : withPreset(s, preset)));
      if (!removing) setSelected(preset.section);
    },
    [set, isLocked],
  );

  // ---- image
  const loadImageFile = useCallback(
    (file: File) => {
      const img = new Image();
      img.onload = () => {
        setImage((prev) => {
          if (prev) URL.revokeObjectURL(prev.src);
          return img;
        });
        // A solid gradient on top would hide the photo; let it blend over it instead.
        const g = stateRef.current.sections.gradient;
        const blended = g.enabled && g.layerBlend === "normal" && !g.locked;
        set((s) => {
          const sections = { ...s.sections, image: { ...s.sections.image, enabled: true } };
          if (blended) sections.gradient = { ...s.sections.gradient, layerBlend: "overlay", layerOpacity: 0.85 };
          return { ...s, sections, order: addLayer(s.order, "image") };
        });
        setSelected("image");
        notify(blended ? "Gradient now overlays your photo" : "Photo added");
      };
      img.onerror = () => notify("Couldn't read that image");
      img.src = URL.createObjectURL(file);
    },
    [notify, set],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement).closest?.("input, textarea")) return;
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (!file) return;
      e.preventDefault();
      if (stateRef.current.sections.image.locked) return notify("Image is locked");
      loadImageFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [loadImageFile, notify]);

  const removeImage = () => {
    setImage(null);
    set((s) => withoutLayer(s, "image"));
  };

  // ---- layers
  const flipFlag = (key: SectionKey, flag: "enabled" | "locked") =>
    set((s) => ({
      ...s,
      sections: { ...s.sections, [key]: { ...s.sections[key], [flag]: !s.sections[key][flag] } },
    }));

  const toggleAnimated = (key: SectionKey) =>
    set((s) => {
      const section = s.sections[key];
      return {
        ...s,
        // Freeze at the current frame so holding a layer doesn't make it jump.
        sections: { ...s.sections, [key]: { ...section, animated: !section.animated, frozenTime: timeRef.current } },
      };
    });

  const deleteLayer = (key: SectionKey) => {
    if (isLocked(key)) return;
    if (key === "image") return removeImage();
    set((s) => withoutLayer(s, key));
  };

  const addLayerFromMenu = (key: SectionKey) => {
    if (key === "image" && !image) return fileRef.current?.click();
    // Start from the effect's first preset so it looks good immediately.
    const first = GROUPS.find((g) => g.section === key)?.presets[0];
    if (first) set((s) => withPreset(s, first));
    else updateSection(key, "enabled", true);
    setSelected(key);
  };

  const shuffleLayer = (key: SectionKey) => {
    if (isLocked(key)) return;
    const schema = SCHEMA_BY_KEY[key];
    set((s) => {
      const next: SectionState = { ...s.sections[key], preset: null };
      for (const c of schema.controls) {
        if (c.type === "slider") {
          const d = Number(schema.defaults[c.key] ?? (c.min + c.max) / 2);
          const r = c.min + Math.random() * (c.max - c.min);
          // Lean toward the default so results stay usable.
          const v = d + (r - d) * 0.7;
          next[c.key] = Math.min(c.max, Math.max(c.min, Math.round(v / c.step) * c.step));
        } else if (c.type === "select") next[c.key] = pick(c.options);
        else if (c.type === "toggle") next[c.key] = Math.random() < 0.5;
        else if (c.type === "color") next[c.key] = randomHex();
        else if (c.type === "colors") next[c.key] = [...pick(PALETTES).colors];
      }
      return { ...s, seed: Math.round(Math.random() * 1000) / 10, sections: { ...s.sections, [key]: next } };
    });
  };

  const resetLayer = (key: SectionKey) => {
    if (isLocked(key)) return;
    const schema = SCHEMA_BY_KEY[key];
    set((s) => ({
      ...s,
      sections: {
        ...s.sections,
        [key]: {
          ...s.sections[key],
          ...structuredClone(schema.defaults),
          preset: null,
          layerOpacity: 1,
          layerBlend: "normal",
        },
      },
    }));
    notify(`${schema.label} reset`);
  };

  // ---- whole design
  const randomize = () => {
    let next = initialState();
    next.seed = Math.round(Math.random() * 1000) / 10;
    for (const key of Object.keys(next.sections) as SectionKey[]) {
      next.sections[key] = { ...next.sections[key], enabled: false, preset: null };
    }
    next.order = [];
    next = withPreset(next, pick(GROUPS[0].presets));
    const others = GROUPS.slice(1).filter((g) => g.section !== "grain" && g.section !== "gradient");
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) next = withPreset(next, pick(pick(others).presets));
    next = withPreset(next, GROUPS.find((g) => g.section === "grain")!.presets[0]);
    set(next);
    setSelected(next.order[1] ?? next.order[0]);
  };

  const handleSave = async () => {
    try {
      const ratio = ASPECTS[aspect] ?? sizeRef.current.width / sizeRef.current.height;
      const width = Math.round(ratio >= 1 ? 240 : 240 * ratio);
      const height = Math.round(ratio >= 1 ? 240 / ratio : 240);
      const canvas = await renderStill(state, width, height, image, timeRef.current);
      const thumb = canvas.toDataURL("image/jpeg", 0.85);
      const next = [{ id: crypto.randomUUID(), createdAt: Date.now(), thumb, state }, ...saved];
      if (!storeSaved(next)) return notify("Storage is full — delete a saved design first");
      setSaved(next);
      notify("Saved to your library");
    } catch {
      notify("Save failed");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#s=${encodeShare(state)}`;
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      notify(image ? "Link copied (uploaded photos aren't included)" : "Link copied");
    } catch {
      notify("Link added to the address bar");
    }
  };

  const deleteSaved = (id: string) => {
    const next = saved.filter((d) => d.id !== id);
    storeSaved(next);
    setSaved(next);
  };

  // ---- keyboard
  const actions = useRef({ randomize, deleteLayer, flipFlag });
  actions.current = { randomize, deleteLayer, flipFlag };
  const { undo, redo } = history;
  useEffect(() => {
    const typing = (t: EventTarget | null) => !!(t as HTMLElement)?.closest?.("input, select, textarea, [contenteditable]");
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const sel = selectedRef.current;
      const order = [...stateRef.current.order].reverse();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        redo();
      } else if (mod) {
        return;
      } else if (e.key === " " && (e.target as HTMLElement).tagName !== "BUTTON") {
        e.preventDefault();
        setPlaying((v) => !v);
      } else if (key === "r") actions.current.randomize();
      else if (key === "f") setZen((v) => !v);
      else if (key === "e") setExportOpen((v) => !v);
      else if (key === "c" && !e.repeat) setCompare(true);
      else if (e.key === "?") setShortcutsOpen((v) => !v);
      else if (e.key === "Escape") {
        setShortcutsOpen(false);
        setZen(false);
        setExportOpen(false);
      } else if ((e.key === "Delete" || e.key === "Backspace") && sel) actions.current.deleteLayer(sel);
      else if (key === "h" && sel) actions.current.flipFlag(sel, "enabled");
      else if ((e.key === "[" || e.key === "]") && order.length) {
        const i = sel ? order.indexOf(sel) : -1;
        const next = e.key === "]" ? Math.min(order.length - 1, i + 1) : Math.max(0, i - 1);
        setSelected(order[next]);
      }
    };
    const onUp = (e: KeyboardEvent) => e.key.toLowerCase() === "c" && setCompare(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, [undo, redo]);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // Compare shows only the source layers, i.e. the design before any effects.
  const shown: StudioState = compare
    ? { ...state, order: state.order.filter((k) => k === "gradient" || k === "image") }
    : state;
  const insets = zen ? ZEN_INSETS : INSETS;
  const panelMotion = "transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]";

  return (
    <div className="relative h-dvh min-w-[1100px] overflow-hidden bg-ink text-bone">
      {/* Soft ember glow behind the stage */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/[0.06] blur-[120px]"
      />

      <Stage
        state={shown}
        image={image}
        aspect={aspect}
        playing={playing}
        speed={speed}
        timeRef={timeRef}
        sizeRef={sizeRef}
        onDropImage={loadImageFile}
        onResize={setPreviewSize}
        style={insets}
      >
        {compare && (
          <span className="anim-pop pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-ink/75 px-3.5 py-1.5 text-[12.5px] text-bone backdrop-blur">
            Original · release to return
          </span>
        )}
      </Stage>

      <div className={`${panelMotion} ${zen ? "pointer-events-none -translate-y-24 opacity-0" : ""}`}>
        <CommandBar
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={history.undo}
          onRedo={history.redo}
          onRandomize={randomize}
          playing={playing}
          onTogglePlay={() => setPlaying((v) => !v)}
          speed={speed}
          onSpeed={setSpeed}
          aspect={aspect}
          onAspect={setAspect}
          onCompare={setCompare}
          onZen={() => setZen(true)}
          onShortcuts={() => setShortcutsOpen(true)}
          onShare={handleShare}
          onSave={handleSave}
          exportOpen={exportOpen}
          onExport={() => setExportOpen((v) => !v)}
        />
      </div>

      <aside
        aria-label="Library"
        className={`glass-panel absolute bottom-4 left-4 top-[84px] z-20 w-[288px] overflow-hidden rounded-[24px] ${panelMotion} ${
          zen ? "pointer-events-none -translate-x-[110%] opacity-0" : ""
        }`}
      >
        <Library
          state={state}
          onToggle={togglePreset}
          saved={saved}
          onLoadSaved={(d) => {
            set(d.state);
            setSelected(d.state.order[0] ?? null);
            notify("Loaded saved design");
          }}
          onDeleteSaved={deleteSaved}
        />
      </aside>

      <aside
        aria-label={exportOpen ? "Export" : "Inspector"}
        className={`glass-panel absolute bottom-4 right-4 top-[84px] z-20 w-[312px] overflow-hidden rounded-[24px] ${panelMotion} ${
          zen ? "pointer-events-none translate-x-[110%] opacity-0" : ""
        }`}
      >
        {exportOpen ? (
          <div key="export" className="anim-rise h-full">
            <ExportPanel
              state={state}
              image={image}
              aspect={aspect}
              onAspect={setAspect}
              previewSize={previewSize}
              timeRef={timeRef}
              speed={speed}
              onClose={() => setExportOpen(false)}
              notify={notify}
            />
          </div>
        ) : (
          <Inspector
            state={state}
            selected={selected}
            imageUrl={image?.src ?? null}
            onChange={updateSection}
            onShuffle={shuffleLayer}
            onReset={resetLayer}
            onToggleVisible={(k) => flipFlag(k, "enabled")}
            onToggleLock={(k) => flipFlag(k, "locked")}
            onToggleAnimated={toggleAnimated}
            onDelete={deleteLayer}
            onPickImage={() => fileRef.current?.click()}
            onRemoveImage={removeImage}
            onBrowse={() => document.querySelector<HTMLInputElement>('input[aria-label="Search effects"]')?.focus()}
          />
        )}
      </aside>

      <div
        className={`absolute bottom-4 left-[320px] right-[344px] z-20 flex justify-center ${panelMotion} ${
          zen ? "pointer-events-none translate-y-32 opacity-0" : ""
        }`}
      >
        <LayerDock
          state={state}
          time={timeRef.current}
          selected={selected}
          imageUrl={image?.src ?? null}
          onSelect={(k) => {
            setSelected(k);
            setExportOpen(false);
          }}
          onReorder={(order) => set((s) => ({ ...s, order }))}
          onToggleVisible={(k) => flipFlag(k, "enabled")}
          onAdd={addLayerFromMenu}
        />
      </div>

      {zen && (
        <button
          type="button"
          onClick={() => setZen(false)}
          className="anim-pop glass-panel press absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-[12.5px] text-bone/80 hover:text-bone"
        >
          Zen mode · press F or click to exit
        </button>
      )}

      {shortcutsOpen && <Shortcuts onClose={() => setShortcutsOpen(false)} />}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadImageFile(file);
          e.target.value = "";
        }}
      />

      {toast && (
        <div
          key={toast.n}
          role="status"
          className="anim-pop glass-panel pointer-events-none absolute bottom-[112px] left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-[13px] text-bone"
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
