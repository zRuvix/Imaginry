/**
 * Drive: live inputs (pointer, scroll, audio, tempo) and the map that routes
 * them onto any slider in the stack.
 */
import { SCHEMA_BY_KEY, type SectionKey, type StudioState } from "@/lib/studio/schema";

export const SIGNALS = ["pointer x", "pointer y", "pointer speed", "hover", "click", "scroll", "low", "mid", "high", "beat"] as const;
export type Signal = (typeof SIGNALS)[number];
export type Signals = Record<Signal, number>;

/** Pointer starts centred, so cursor-driven looks rest in the middle. */
export const emptySignals = (): Signals => ({ ...(Object.fromEntries(SIGNALS.map((s) => [s, 0])) as Signals), "pointer x": 0.5, "pointer y": 0.5 });

export type Route = {
  id: string;
  signal: Signal;
  section: SectionKey;
  control: string;
  /** -1..1 of the slider's full range. */
  amount: number;
  /** 0 (raw) .. 0.95 (very slow). */
  smoothing: number;
};

/** Every slider in the stack, for the route picker. */
export function sliderTargets(state: StudioState) {
  return state.order.flatMap((section) =>
    SCHEMA_BY_KEY[section].controls
      .filter((c) => c.type === "slider")
      .map((c) => ({ section, control: c.key, label: `${SCHEMA_BY_KEY[section].label} · ${c.label}` })),
  );
}

/** Smoothed value per route, carried between frames. */
export type RouteMemory = Map<string, number>;

/** Copies `state` with every route's offset applied. Routes on missing layers are skipped. */
export function applyRoutes(state: StudioState, routes: Route[], memory: RouteMemory): StudioState {
  if (!routes.length) return state;
  let sections: StudioState["sections"] | null = null;
  for (const r of routes) {
    if (!state.order.includes(r.section)) continue;
    const c = SCHEMA_BY_KEY[r.section].controls.find((x) => x.key === r.control);
    if (!c || c.type !== "slider") continue;
    const signal = memory.get(r.id) ?? 0;
    sections ??= { ...state.sections };
    const s = { ...sections[r.section] };
    const v = Number(s[c.key]) + r.amount * signal * (c.max - c.min);
    s[c.key] = Math.min(c.max, Math.max(c.min, v));
    sections[r.section] = s;
  }
  return sections ? { ...state, sections } : state;
}

/** Eases each route toward its signal; call once per frame. */
export function stepRoutes(routes: Route[], signals: Signals, memory: RouteMemory, dt: number) {
  for (const r of routes) {
    const prev = memory.get(r.id) ?? 0;
    // Smoothing as a time constant so it feels the same at any frame rate.
    const k = r.smoothing <= 0 ? 1 : 1 - Math.pow(r.smoothing, dt * 60);
    memory.set(r.id, prev + (signals[r.signal] - prev) * k);
  }
}

// ---------------------------------------------------------------- audio

export type AudioInput = {
  kind: "mic" | "track";
  name: string;
  context: AudioContext;
  analyser: AnalyserNode;
  /** For recordings: the same sound as a stream. */
  stream: MediaStream;
  element?: HTMLAudioElement;
  stop: () => void;
};

function wire(context: AudioContext, source: AudioNode, toSpeakers: boolean) {
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.7;
  source.connect(analyser);
  const tap = context.createMediaStreamDestination();
  source.connect(tap);
  if (toSpeakers) source.connect(context.destination);
  return { analyser, stream: tap.stream };
}

export async function openMic(): Promise<AudioInput> {
  const media = await navigator.mediaDevices.getUserMedia({ audio: true });
  const context = new AudioContext();
  const { analyser, stream } = wire(context, context.createMediaStreamSource(media), false);
  return {
    kind: "mic",
    name: "Microphone",
    context,
    analyser,
    stream,
    stop: () => {
      media.getTracks().forEach((t) => t.stop());
      context.close();
    },
  };
}

export async function openTrack(file: File): Promise<AudioInput> {
  const element = new Audio(URL.createObjectURL(file));
  element.loop = true;
  const context = new AudioContext();
  const { analyser, stream } = wire(context, context.createMediaElementSource(element), true);
  await element.play();
  return {
    kind: "track",
    name: file.name,
    context,
    analyser,
    stream,
    element,
    stop: () => {
      element.pause();
      URL.revokeObjectURL(element.src);
      context.close();
    },
  };
}

const BANDS: Record<"low" | "mid" | "high", [number, number]> = {
  low: [20, 250],
  mid: [250, 2000],
  high: [2000, 8000],
};

/** Low, mid and high energy, 0..1. */
export function readBands(input: AudioInput, buffer: Uint8Array<ArrayBuffer>) {
  input.analyser.getByteFrequencyData(buffer);
  const hz = input.context.sampleRate / 2 / buffer.length;
  const out = { low: 0, mid: 0, high: 0 };
  for (const band of Object.keys(BANDS) as (keyof typeof BANDS)[]) {
    const [lo, hi] = BANDS[band];
    const a = Math.max(0, Math.floor(lo / hz));
    const b = Math.min(buffer.length - 1, Math.ceil(hi / hz));
    let sum = 0;
    for (let i = a; i <= b; i++) sum += buffer[i];
    out[band] = sum / Math.max(1, b - a + 1) / 255;
  }
  return out;
}

// ---------------------------------------------------------------- tempo

/** BPM from tap times (ms). Taps more than 2 s apart start over. */
export function tempoFromTaps(taps: number[]) {
  if (taps.length < 2) return null;
  const gaps = taps.slice(1).map((t, i) => t - taps[i]);
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return Math.round(60000 / avg);
}

/** The studio clock runs at 1× for 120 BPM; a tempo scales it to the beat. */
export const speedForTempo = (bpm: number) => bpm / 120;
