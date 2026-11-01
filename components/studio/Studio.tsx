"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GROUPS, type Preset } from "@/lib/studio/presets";
import { renderOffscreen } from "@/lib/studio/renderer";
import {
  addLayer,
  initialState,
  SCHEMA_BY_KEY,
  type SectionKey,
  type StudioState,
  type Value,
} from "@/lib/studio/schema";
import { decodeShare, encodeShare, loadSaved, storeSaved, type SavedDesign } from "@/lib/studio/storage";
import { useHistory } from "@/lib/studio/useHistory";
import EffectsPanel from "./EffectsPanel";
import ExportPanel from "./ExportPanel";
import LayersPanel from "./LayersPanel";
import PropsPanel from "./PropsPanel";
import Rail, { type PanelId } from "./Rail";
import { SavedPanel } from "./SidePanels";
import Stage, { ASPECTS, type Aspect } from "./Stage";
import Toolbar from "./Toolbar";

/** Renders a still on the shared offscreen context and copies it out. */
async function renderStill(
  state: StudioState,
  width: number,
  height: number,
  image: HTMLImageElement | null,
  time: number,
) {
  const source = await renderOffscreen(state, width, height, { time, image });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(source, 0, 0);
  return canvas;
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

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export default function Studio() {
  const history = useHistory<StudioState>(initialState);
  const { state, set } = history;

  const [panel, setPanel] = useState<PanelId | null>("effects");
  const [aspect, setAspect] = useState<Aspect>("fill");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [saved, setSaved] = useState<SavedDesign[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 1, height: 1 });

  const timeRef = useRef(0);
  const sizeRef = useRef({ width: 1, height: 1 });
  const fileRef = useRef<HTMLInputElement>(null);

  const notify = useCallback((msg: string) => setToast(msg), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Restore a shared design from the URL and the saved list from storage.
  useEffect(() => {
    const shared = decodeShare(window.location.hash);
    if (shared) set(shared);
    setSaved(loadSaved());
  }, [set]);

  const stateRef = useRef(state);
  stateRef.current = state;
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
      set((s) => {
        const section = s.sections[preset.section];
        if (section.enabled && section.preset === preset.id) return withoutLayer(s, preset.section);
        return withPreset(s, preset);
      });
    },
    [set, isLocked],
  );

  const loadImageFile = useCallback(
    (file: File) => {
      const img = new Image();
      img.onload = () => {
        const prev = image;
        setImage(img);
        if (prev) URL.revokeObjectURL(prev.src);
        // A solid gradient on top would hide the photo; let it blend over it instead.
        const g = stateRef.current.sections.gradient;
        const blended = g.enabled && g.blend === "normal" && !g.locked;
        set((s) => {
          const sections = { ...s.sections, image: { ...s.sections.image, enabled: true } };
          if (blended) sections.gradient = { ...s.sections.gradient, blend: "overlay", opacity: 0.85 };
          return { ...s, sections, order: addLayer(s.order, "image") };
        });
        if (blended) notify("Gradient now overlays your image — change it under Gradient › Blend mode");
      };
      img.onerror = () => notify("Couldn't read that image");
      img.src = URL.createObjectURL(file);
    },
    [notify, set, image],
  );

  // Paste an image from the clipboard anywhere outside text fields.
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
  const [selectedLayer, setSelectedLayer] = useState<SectionKey | null>(null);
  const [focus, setFocus] = useState<{ key: SectionKey; n: number } | null>(null);
  const selectLayer = (key: SectionKey) => {
    setSelectedLayer(key);
    setExportOpen(false);
    setFocus((f) => ({ key, n: (f?.n ?? 0) + 1 }));
  };
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
        sections: {
          ...s.sections,
          // Freeze at the current frame so holding a layer doesn't make it jump.
          [key]: { ...section, animated: !section.animated, frozenTime: timeRef.current },
        },
      };
    });
  const deleteLayer = (key: SectionKey) => {
    if (isLocked(key)) return;
    if (key === "image") return removeImage();
    set((s) => withoutLayer(s, key));
    if (selectedLayer === key) setSelectedLayer(null);
  };
  const addLayerFromMenu = (key: SectionKey) => {
    if (key === "image" && !image) return fileRef.current?.click();
    updateSection(key, "enabled", true);
    selectLayer(key);
  };

  const randomize = () => {
    const next = initialState();
    next.seed = Math.round(Math.random() * 1000) / 10;
    for (const key of Object.keys(next.sections) as SectionKey[]) {
      next.sections[key] = { ...next.sections[key], enabled: false, preset: null };
    }
    next.order = [];
    let result = withPreset(next, pick(GROUPS[0].presets));
    const others = GROUPS.slice(1).filter((g) => g.section !== "grain");
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) result = withPreset(result, pick(pick(others).presets));
    result = withPreset(result, GROUPS.find((g) => g.section === "grain")!.presets[0]);
    set(result);
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
      notify("Saved");
    } catch {
      notify("Save failed");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#s=${encodeShare(state)}`;
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      notify(image ? "Link copied (uploaded images aren't included)" : "Link copied");
    } catch {
      notify("Link added to the address bar");
    }
  };

  const deleteSaved = (id: string) => {
    const next = saved.filter((d) => d.id !== id);
    storeSaved(next);
    setSaved(next);
  };

  // Keyboard shortcuts
  const { undo, redo } = history;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, select, textarea")) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === " " && !mod && target.tagName !== "BUTTON") {
        e.preventDefault();
        setPlaying((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return (
    <div className="flex h-dvh min-w-[1100px] gap-2.5 overflow-hidden bg-background p-2 pl-0 text-foreground">
      <Rail panel={panel} onPanel={setPanel} onOpenImage={() => fileRef.current?.click()} />

      {panel === "effects" && <EffectsPanel state={state} onToggle={togglePreset} />}
      {panel === "layers" && (
        <LayersPanel
          state={state}
          time={timeRef.current}
          selected={selectedLayer}
          imageUrl={image?.src ?? null}
          onSelect={selectLayer}
          onReorder={(order) => set((s) => ({ ...s, order }))}
          onToggleVisible={(key) => flipFlag(key, "enabled")}
          onToggleLock={(key) => flipFlag(key, "locked")}
          onToggleAnimated={toggleAnimated}
          onDelete={deleteLayer}
          onAdd={addLayerFromMenu}
        />
      )}
      {panel === "saved" && (
        <SavedPanel
          saved={saved}
          onLoad={(d) => {
            set(d.state);
            notify("Loaded saved design");
          }}
          onDelete={deleteSaved}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-panel-border bg-panel">
        <Toolbar
          playing={playing}
          onTogglePlay={() => setPlaying((v) => !v)}
          speed={speed}
          onSpeed={setSpeed}
          aspect={aspect}
          onAspect={setAspect}
          onRandomize={randomize}
          onReset={() => set(initialState())}
          onShare={handleShare}
          onSave={handleSave}
          onExport={() => setExportOpen((v) => !v)}
        />
        <Stage
          state={state}
          image={image}
          aspect={aspect}
          playing={playing}
          speed={speed}
          timeRef={timeRef}
          sizeRef={sizeRef}
          onDropImage={loadImageFile}
          onResize={setPreviewSize}
        />
      </main>

      {exportOpen ? (
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
      ) : (
        <PropsPanel
          state={state}
          onChange={updateSection}
          onUndo={history.undo}
          onRedo={history.redo}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          imageUrl={image?.src ?? null}
          onPickImage={() => fileRef.current?.click()}
          onRemoveImage={removeImage}
          focus={focus}
        />
      )}

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
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-[13px] text-neutral-100 shadow-2xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
