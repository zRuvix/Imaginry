"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GROUPS } from "@/lib/studio/presets";
import { addLayer, SCHEMA_BY_KEY, type SectionKey, type StudioState, type Value } from "@/lib/studio/schema";
import {
  applyRoutes,
  emptySignals,
  openMic,
  openTrack,
  readBands,
  speedForTempo,
  stepRoutes,
  tempoFromTaps,
  type AudioInput,
  type Route,
  type RouteMemory,
  type Signals,
} from "@/lib/lab/drive";
import { FluidSim } from "@/lib/lab/fluid";
import { LAB_LOOKS, routesForLook, stateForLabLook, type LabLook } from "@/lib/lab/looks";
import { fluidParams } from "@/lib/lab/styles/fluid";
import DrivePanel from "./DrivePanel";
import ExportPanel from "./ExportPanel";
import Inspector from "./Inspector";
import LabBar from "./LabBar";
import LayerStrip from "./LayerStrip";
import LooksPanel from "./LooksPanel";
import Shortcuts from "./Shortcuts";
import Stage, { stagePixelRatio } from "./Stage";
import { Segmented } from "./controls";

const TABS = ["tune", "react", "export"] as const;
type Tab = (typeof TABS)[number];
const LAYER_FLAGS = new Set(["enabled", "locked", "animated", "frozenTime"]);

function useIsDesktop() {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1100px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

/** Placeholder page over the canvas, to feel a scroll moving over the background. */
function PagePreview({ onScroll }: { onScroll: (p: number) => void }) {
  return (
    <div
      className="no-scrollbar absolute inset-2 overflow-y-auto rounded-[22px]"
      onScroll={(e) => {
        const el = e.currentTarget;
        onScroll(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
      }}
    >
      <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-10 pb-[60vh] pt-[22vh] text-bone">
        <p className="font-display text-[44px] leading-[1.05] drop-shadow-[0_2px_20px_rgba(0,0,0,0.45)]">A page moving over the background</p>
        <p className="max-w-[460px] text-[15px] leading-relaxed text-bone/80">Scroll here. Anything mapped to scroll follows the page.</p>
        <div className="mt-[30vh] grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-panel h-40 rounded-[18px]" />
          ))}
        </div>
        <div className="glass-panel mt-[20vh] h-64 rounded-[24px]" />
      </div>
    </div>
  );
}

export default function Lab() {
  const desktop = useIsDesktop();
  const [design, setDesign] = useState<StudioState | null>(null);
  const [lookId, setLookId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SectionKey | null>(null);
  const [tab, setTab] = useState<Tab>("tune");

  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [bpm, setBpm] = useState<number | null>(null);
  const taps = useRef<number[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [audio, setAudio] = useState<AudioInput | null>(null);
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [pagePreview, setPagePreview] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 1, height: 1 });

  const [zen, setZen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; n: number } | null>(null);

  const timeRef = useRef(0);
  const sizeRef = useRef({ width: 1, height: 1 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signals = useRef<Signals>(emptySignals());
  const memory = useRef<RouteMemory>(new Map());
  const pointerRef = useRef({ x: 0.5, y: 0.5, inside: false, at: 0 });
  const fluidRef = useRef<FluidSim | null>(null);

  const notify = useCallback((msg: string) => setToast((t) => ({ msg, n: (t?.n ?? 0) + 1 })), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // ---- backgrounds: each brings its design and its cursor wiring
  const applyLook = useCallback((look: LabLook) => {
    const next = stateForLabLook(look);
    setDesign(next);
    setRoutes(routesForLook(look));
    memory.current = new Map();
    setSelected(next.order[next.order.length - 1] ?? null);
    setLookId(look.id);
  }, []);
  useEffect(() => applyLook(LAB_LOOKS[0]), [applyLook]);
  useEffect(() => () => fluidRef.current?.dispose(), []);

  useEffect(() => {
    if (design && (!selected || !design.order.includes(selected))) setSelected(design.order[design.order.length - 1] ?? null);
  }, [design, selected]);

  // ---- editing
  const editDesign = (fn: (s: StudioState) => StudioState) => setDesign((s) => (s ? fn(s) : s));
  const onChange = (section: SectionKey, key: string, value: Value) => {
    if (!design) return;
    if (!LAYER_FLAGS.has(key) && design.sections[section].locked) return notify(`${SCHEMA_BY_KEY[section].label} is locked`);
    editDesign((s) => ({
      ...s,
      sections: { ...s.sections, [section]: { ...s.sections[section], [key]: value } },
      order: key === "enabled" && value ? addLayer(s.order, section) : s.order,
    }));
  };
  const flip = (key: SectionKey, flag: "enabled" | "locked") =>
    editDesign((s) => ({ ...s, sections: { ...s.sections, [key]: { ...s.sections[key], [flag]: !s.sections[key][flag] } } }));
  const toggleAnimated = (key: SectionKey) =>
    editDesign((s) => ({
      ...s,
      sections: { ...s.sections, [key]: { ...s.sections[key], animated: !s.sections[key].animated, frozenTime: timeRef.current } },
    }));
  const resetLayer = (key: SectionKey) =>
    editDesign((s) => ({
      ...s,
      sections: {
        ...s.sections,
        [key]: { ...s.sections[key], ...structuredClone(SCHEMA_BY_KEY[key].defaults), preset: null, layerOpacity: 1, layerBlend: "normal" },
      },
    }));
  const removeLayer = (key: SectionKey) => {
    if (design && design.order.length <= 1) return notify("Pick another background on the left instead");
    editDesign((s) => ({ ...s, order: s.order.filter((k) => k !== key), sections: { ...s.sections, [key]: { ...s.sections[key], enabled: false } } }));
    setRoutes((r) => r.filter((x) => x.section !== key));
  };
  const addOnTop = (key: SectionKey) => {
    const first = GROUPS.find((g) => g.section === key)?.presets[0];
    editDesign((s) => ({
      ...s,
      sections: {
        ...s.sections,
        [key]: {
          ...s.sections[key],
          ...structuredClone(SCHEMA_BY_KEY[key].defaults),
          ...(first ? structuredClone(first.values) : {}),
          enabled: true,
          preset: first?.id ?? null,
        },
      },
      order: addLayer(s.order, key),
    }));
    setSelected(key);
    if (key === "fluid") notify("Fluid added · move the cursor over the canvas");
  };

  // ---- react: sound and tempo
  const startAudio = async (open: () => Promise<AudioInput>, file: File | null) => {
    try {
      // The effect below stops whatever was playing before.
      setAudio(await open());
      if (file) setTrackFile(file);
    } catch {
      notify("Couldn't open that sound");
    }
  };
  useEffect(() => () => audio?.stop(), [audio]);
  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 2000), now].slice(-8);
    const next = tempoFromTaps(taps.current);
    if (next) setBpm(Math.min(240, Math.max(40, next)));
  };

  // ---- per frame: read inputs, step the fluid, apply routes
  const live = useRef({ routes, audio, bpm });
  live.current = { routes, audio, bpm };
  const bands = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const fluidOn = useRef(false);
  const frame = useCallback((state: StudioState, dt: number) => {
    const { routes, audio, bpm } = live.current;
    const sig = signals.current;
    sig.click *= Math.exp(-dt * 4);
    sig["pointer speed"] *= Math.exp(-dt * 3);
    sig.hover += ((pointerRef.current.inside ? 1 : 0) - sig.hover) * (1 - Math.exp(-dt * 6));
    if (audio) {
      if (!bands.current || bands.current.length !== audio.analyser.frequencyBinCount) {
        bands.current = new Uint8Array(audio.analyser.frequencyBinCount);
      }
      Object.assign(sig, readBands(audio, bands.current));
    } else sig.low = sig.mid = sig.high = 0;
    sig.beat = bpm ? Math.pow(1 - ((performance.now() / 1000) * (bpm / 60)) % 1, 3) : 0;
    stepRoutes(routes, sig, memory.current, dt);

    // The fluid runs only while its layer is showing.
    fluidOn.current = state.order.includes("fluid") && state.sections.fluid.enabled;
    if (fluidOn.current) {
      fluidRef.current ??= new FluidSim();
      const { width, height } = sizeRef.current;
      fluidRef.current.resize(width / Math.max(1, height));
      fluidRef.current.step(Math.min(dt, 1 / 30), fluidParams(state.sections.fluid));
    }
    return applyRoutes(state, routes, memory.current);
  }, []);
  const liveImage = useCallback(() => (fluidOn.current && fluidRef.current?.ok ? fluidRef.current.canvas : null), []);

  const designRef = useRef(design);
  designRef.current = design;
  const onPointer = useCallback((pt: { x: number; y: number; inside: boolean; down?: boolean }) => {
    const sig = signals.current;
    const prev = pointerRef.current;
    const now = performance.now();
    const colors = (designRef.current?.sections.fluid.colors as string[]) ?? [];
    if (pt.inside && prev.inside) {
      const v = Math.hypot(pt.x - prev.x, pt.y - prev.y) / (Math.max(1, now - prev.at) / 1000);
      sig["pointer speed"] = Math.min(1, Math.max(sig["pointer speed"], v / 3));
      if (fluidOn.current) fluidRef.current?.move(pt.x, pt.y, pt.x - prev.x, pt.y - prev.y, colors);
    }
    if (pt.inside) {
      sig["pointer x"] = pt.x;
      sig["pointer y"] = pt.y;
    }
    if (pt.down) {
      sig.click = 1;
      if (fluidOn.current) fluidRef.current?.burst(pt.x, pt.y, colors);
    }
    pointerRef.current = { x: pt.x, y: pt.y, inside: pt.inside, at: now };
  }, []);
  const onCanvas = useCallback((c: HTMLCanvasElement | null) => {
    canvasRef.current = c;
  }, []);

  // ---- keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, select, textarea, [contenteditable]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      // Space is always play/pause here, even on a focused button (Enter still presses buttons).
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((v) => !v);
      } else if (k === "p") setPagePreview((v) => !v);
      else if (k === "f") setZen((v) => !v);
      else if (e.key === "?") setShortcutsOpen((v) => !v);
      else if (e.key === "Escape") {
        setShortcutsOpen(false);
        setZen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (desktop === null || !design) return <div className="h-dvh bg-ink" suppressHydrationWarning />;

  if (!desktop) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-ink px-6 text-center text-bone">
        <span className="rounded-full bg-ember px-2.5 py-1 font-outfit text-[12px] font-semibold text-ink">Lab</span>
        <h1 className="font-display text-[26px] leading-tight">The Lab needs a wider screen</h1>
        <p className="max-w-[320px] text-[14px] leading-relaxed text-bone/60">Its backgrounds follow a cursor. Open it on a laptop or desktop.</p>
        <Link href="/studio" className="press mt-2 rounded-full bg-bone px-5 py-2.5 text-[14px] font-medium text-ink">
          Open the studio
        </Link>
      </div>
    );
  }

  const panelMotion = "transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const insets = zen ? { top: 16, left: 16, right: 16, bottom: 16 } : { top: 84, left: 320, right: 344, bottom: 92 };
  const clockSpeed = bpm ? speedForTempo(bpm) : speed;

  return (
    <div className="relative h-dvh min-w-[1100px] overflow-hidden bg-ink text-bone">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/[0.05] blur-[120px]"
      />

      <Stage
        state={design}
        image={null}
        aspect="fill"
        playing={playing}
        speed={clockSpeed}
        timeRef={timeRef}
        sizeRef={sizeRef}
        onDropImage={() => notify("The Lab draws its own backgrounds")}
        onResize={setPreviewSize}
        style={insets}
        frame={frame}
        always
        onPointerInfo={onPointer}
        liveImage={liveImage}
        onCanvas={onCanvas}
      >
        {pagePreview && <PagePreview onScroll={(v) => (signals.current.scroll = v)} />}
      </Stage>

      <div className={`${panelMotion} ${zen ? "pointer-events-none -translate-y-24 opacity-0" : ""}`}>
        <LabBar
          playing={playing}
          onTogglePlay={() => setPlaying((v) => !v)}
          speed={speed}
          onSpeed={setSpeed}
          bpm={bpm}
          onZen={() => setZen(true)}
          onShortcuts={() => setShortcutsOpen(true)}
          onExport={() => setTab("export")}
        />
      </div>

      <aside
        aria-label="Backgrounds"
        className={`glass-panel absolute bottom-4 left-4 top-[84px] z-20 w-[288px] overflow-hidden rounded-[24px] ${panelMotion} ${
          zen ? "pointer-events-none -translate-x-[110%] opacity-0" : ""
        }`}
      >
        <LooksPanel
          current={lookId}
          onPick={(look) => {
            applyLook(look);
            setTab("tune");
          }}
        />
      </aside>

      <div
        className={`absolute bottom-4 left-[320px] right-[344px] z-20 flex justify-center ${panelMotion} ${
          zen ? "pointer-events-none translate-y-32 opacity-0" : ""
        }`}
      >
        <LayerStrip
          state={design}
          selected={selected}
          onSelect={(k) => {
            setSelected(k);
            setTab("tune");
          }}
          onToggleVisible={(k) => flip(k, "enabled")}
          onRemove={removeLayer}
          onAdd={addOnTop}
        />
      </div>

      <aside
        aria-label="Lab tools"
        className={`glass-panel absolute bottom-4 right-4 top-[84px] z-20 flex w-[312px] flex-col overflow-hidden rounded-[24px] ${panelMotion} ${
          zen ? "pointer-events-none translate-x-[110%] opacity-0" : ""
        }`}
      >
        <div className="shrink-0 p-3 pb-0">
          <Segmented label="Lab tools" size="sm" value={tab} options={TABS} onChange={setTab} />
        </div>
        <div key={tab} className="anim-rise min-h-0 flex-1">
          {tab === "tune" && (
            <Inspector
              state={design}
              selected={selected}
              imageUrl={null}
              onChange={onChange}
              onShuffle={() => notify("Pick another background on the left for a new start")}
              onReset={resetLayer}
              onToggleVisible={(k) => flip(k, "enabled")}
              onToggleLock={(k) => flip(k, "locked")}
              onToggleAnimated={toggleAnimated}
              onDelete={removeLayer}
              onPickImage={() => {}}
              onRemoveImage={() => {}}
              onZoomImage={() => {}}
              onResetImageView={() => {}}
              onBrowse={() => notify("Pick a background on the left")}
            />
          )}
          {tab === "react" && (
            <DrivePanel
              state={design}
              signals={signals}
              routes={routes}
              onRoutes={setRoutes}
              audio={audio}
              onMic={() => startAudio(openMic, null)}
              onTrack={(f) => startAudio(() => openTrack(f), f)}
              onStopAudio={() => setAudio(null)}
              bpm={bpm}
              onTap={tap}
              onClearTempo={() => {
                setBpm(null);
                taps.current = [];
              }}
              pagePreview={pagePreview}
              onPagePreview={setPagePreview}
            />
          )}
          {tab === "export" && (
            <ExportPanel
              state={design}
              routes={routes}
              bpm={bpm}
              trackFile={trackFile}
              timeRef={timeRef}
              speed={clockSpeed}
              previewLong={Math.max(previewSize.width, previewSize.height) * stagePixelRatio()}
              canvas={canvasRef}
              audioStream={audio?.stream ?? null}
              notify={notify}
            />
          )}
        </div>
      </aside>

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

      {toast && (
        <div
          key={toast.n}
          role="status"
          className="anim-pop glass-panel pointer-events-none absolute bottom-[100px] left-1/2 z-50 max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-full px-4 py-2 text-center text-[13px] text-bone"
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
