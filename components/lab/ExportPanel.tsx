"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { StudioState } from "@/lib/studio/schema";
import { applyRoutes, emptySignals, stepRoutes, type Route, type RouteMemory } from "@/lib/lab/drive";
import { demoPage, EMBED_SIGNALS, reactiveHtml, reactiveLook, reactiveReact } from "@/lib/lab/embed";
import { analyseBands, decodeAudio, downloadBlob, encodeTake, videoSupported, type LabFormat } from "@/lib/lab/render";
import { Segmented, Select } from "./controls";
import { Action, Card, Note } from "./parts";

type Props = {
  state: StudioState;
  routes: Route[];
  bpm: number | null;
  /** The track loaded in React, if any. */
  trackFile: File | null;
  timeRef: RefObject<number>;
  speed: number;
  /** Long edge of the preview canvas in device pixels, for grain size. */
  previewLong: number;
  canvas: RefObject<HTMLCanvasElement | null>;
  audioStream: MediaStream | null;
  notify: (msg: string) => void;
};

const SIZES = { "720p": 1280, "1080p": 1920, "1440p": 2560, "4K": 3840 } as const;
type SizeLabel = keyof typeof SIZES;
const FORMATS = ["mp4", "webm"] as const;
const EMBEDS = ["html", "react"] as const;
const MAX_TRACK_SECONDS = 300;
const LOOP_SECONDS = ["4", "6", "8", "12"] as const;

function Progress({ value, onCancel }: { value: number; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
        <span className="absolute inset-y-0 left-0 rounded-full bg-ember transition-[width] duration-200" style={{ width: `${value * 100}%` }} />
      </span>
      <span className="w-9 text-right font-outfit text-[12px] tabular-nums text-bone/60">{Math.round(value * 100)}%</span>
      <button type="button" onClick={onCancel} className="press text-[12px] text-bone/55 hover:text-bone">
        Cancel
      </button>
    </div>
  );
}

function recorderMime() {
  for (const m of ["video/mp4;codecs=avc1,mp4a", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

export default function ExportPanel(p: Props) {
  const [size, setSize] = useState<SizeLabel>("1080p");
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("mp4");
  const [fps, setFps] = useState<"30" | "60">("30");
  const [loopSeconds, setLoopSeconds] = useState<(typeof LOOP_SECONDS)[number]>("6");
  const [job, setJob] = useState<{ id: "loop" | "music"; progress: number } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const musicRef = useRef<HTMLInputElement>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const track = musicFile ?? p.trackFile;
  const [embedKind, setEmbedKind] = useState<(typeof EMBEDS)[number]>("html");
  const [recording, setRecording] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (recording === null) return;
    const t = setInterval(() => setElapsed((performance.now() - recording) / 1000), 200);
    return () => clearInterval(t);
  }, [recording]);
  useEffect(() => () => recorder.current?.stop(), []);

  const dims = () => {
    const long = SIZES[size];
    const c = p.canvas.current;
    const ratio = c ? c.width / c.height : 16 / 9;
    return ratio >= 1 ? { width: long, height: Math.round(long / ratio), long } : { width: Math.round(long * ratio), height: long, long };
  };
  const pixelFor = (long: number) => long / Math.max(1, p.previewLong);

  const run = async (id: "loop" | "music", work: (signal: AbortSignal, progress: (v: number) => void) => Promise<Blob>, name: string) => {
    const ctrl = new AbortController();
    abort.current = ctrl;
    setJob({ id, progress: 0 });
    try {
      const blob = await work(ctrl.signal, (v) => setJob({ id, progress: v }));
      downloadBlob(blob, name);
      p.notify("Video saved");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error(e);
        p.notify((e as Error).message || "Export failed");
      }
    } finally {
      setJob(null);
      abort.current = null;
    }
  };

  // ---- a seamless loop
  const exportLoop = () => {
    const { width, height, long } = dims();
    const start = p.timeRef.current;
    run(
      "loop",
      (signal, onProgress) =>
        encodeTake({
          stateAt: () => p.state,
          timeAt: (t) => start + t * p.speed,
          width,
          height,
          fps: Number(fps),
          seconds: Number(loopSeconds),
          format: format as LabFormat,
          pixel: pixelFor(long),
          loop: true,
          onProgress,
          signal,
        }),
      `imaginry-lab-loop-${loopSeconds}s.${format}`,
    );
  };

  // ---- a video rendered to a music track: the track's bands drive the routes, frame by frame
  const soundRoutes = p.routes.filter((r) => r.signal === "low" || r.signal === "mid" || r.signal === "high" || r.signal === "beat");
  const exportMusic = async () => {
    if (!track) return musicRef.current?.click();
    const { width, height, long } = dims();
    const rate = Number(fps);
    const start = p.timeRef.current;
    run(
      "music",
      async (signal, onProgress) => {
        const audio = await decodeAudio(track);
        const seconds = Math.min(MAX_TRACK_SECONDS, audio.duration);
        const frames = Math.round(seconds * rate);
        const bands = analyseBands(audio, rate, frames);
        const memory: RouteMemory = new Map();
        const sig = emptySignals();
        return encodeTake({
          stateAt: (t, i) => {
            sig.low = bands.low[i] ?? 0;
            sig.mid = bands.mid[i] ?? 0;
            sig.high = bands.high[i] ?? 0;
            sig.beat = p.bpm ? Math.pow(1 - ((t * p.bpm) / 60) % 1, 3) : 0;
            stepRoutes(soundRoutes, sig, memory, 1 / rate);
            return applyRoutes(p.state, soundRoutes, memory);
          },
          timeAt: (t) => start + t * p.speed,
          width,
          height,
          fps: rate,
          seconds,
          format: format as LabFormat,
          pixel: pixelFor(long),
          loop: false,
          audio,
          onProgress,
          signal,
        });
      },
      `imaginry-lab-${track.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").toLowerCase()}.${format}`,
    );
  };

  // ---- live recording of what's on the canvas, pointer play and sound included
  const startRecording = () => {
    const c = p.canvas.current;
    if (!c) return;
    const stream = c.captureStream(60);
    p.audioStream?.getAudioTracks().forEach((t) => stream.addTrack(t));
    const mime = recorderMime();
    const rec = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: 16_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const type = rec.mimeType || "video/webm";
      downloadBlob(new Blob(chunks, { type }), `imaginry-lab-take.${type.includes("mp4") ? "mp4" : "webm"}`);
    };
    rec.start(250);
    recorder.current = rec;
    setElapsed(0);
    setRecording(performance.now());
  };
  const stopRecording = () => {
    recorder.current?.stop();
    recorder.current = null;
    setRecording(null);
  };

  // ---- interactive embed
  const look = () => reactiveLook(p.state, p.routes, p.timeRef.current, p.bpm);
  const skipped = p.routes.filter((r) => !EMBED_SIGNALS.includes(r.signal)).length;
  const copyEmbed = async () => {
    const l = look();
    const code = embedKind === "html" ? reactiveHtml(l) : reactiveReact(l);
    try {
      await navigator.clipboard.writeText(code);
      p.notify(`${embedKind === "html" ? "HTML" : "React"} embed copied · ${Math.round(code.length / 1024)} KB`);
    } catch {
      downloadBlob(new Blob([code], { type: "text/plain" }), embedKind === "html" ? "imaginry-reactive.html" : "ImaginryReactive.jsx");
    }
  };
  const tryDemo = () => {
    const url = URL.createObjectURL(new Blob([demoPage(look())], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const busy = !!job;
  const canVideo = videoSupported();

  return (
    <div className="scroll-thin h-full space-y-2.5 overflow-y-auto p-3">
      <Card title="Interactive embed">
        <Note>The background for your site, reacting to the cursor, clicks and scroll just like here.</Note>
        <Segmented label="Embed type" size="sm" value={embedKind} options={EMBEDS} onChange={setEmbedKind} render={(v) => (v === "html" ? "HTML" : "React")} />
        <div className="grid grid-cols-2 gap-1.5">
          <Action onClick={tryDemo}>Try it on a page</Action>
          <Action onClick={copyEmbed} primary>
            Copy code
          </Action>
        </div>
        {skipped > 0 && <Note>Sound routes stay in the Lab: a website doesn&apos;t get your mic or track.</Note>}
      </Card>

      <Card title="Video" delay={40}>
        <Select label="Size" value={size} options={Object.keys(SIZES)} onChange={(v) => setSize(v as SizeLabel)} />
        <div className="grid grid-cols-2 gap-1.5">
          <Segmented label="Format" size="sm" value={format} options={FORMATS} onChange={setFormat} />
          <Segmented label="Frame rate" size="sm" value={fps} options={["30", "60"] as const} onChange={setFps} render={(v) => `${v} fps`} />
        </div>
        {!canVideo && <Note>This browser can&apos;t encode video. Try Chrome or Edge.</Note>}
      </Card>

      <Card title="Loop" delay={80}>
        <Note>A seamless video loop, faded into its start.</Note>
        <Segmented label="Loop length" size="sm" value={loopSeconds} options={LOOP_SECONDS} onChange={setLoopSeconds} render={(v) => `${v}s`} />
        {job?.id === "loop" ? (
          <Progress value={job.progress} onCancel={() => abort.current?.abort()} />
        ) : (
          <Action onClick={exportLoop} disabled={busy || !canVideo} primary>
            Export loop
          </Action>
        )}
      </Card>

      <Card title="Music video" delay={120}>
        <Note>
          Renders the whole track, frame by frame, with its low, mid and high driving your routes. The music is in the file.
          {soundRoutes.length === 0 && " Map low, mid or high to a slider in React first."}
        </Note>
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <span className="min-w-0 truncate text-bone/80">{track ? track.name : "No track yet"}</span>
          <button type="button" onClick={() => musicRef.current?.click()} className="press shrink-0 text-[12.5px] text-bone/55 hover:text-bone">
            {track ? "Change" : "Choose"}
          </button>
        </div>
        <input
          ref={musicRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setMusicFile(f);
            e.target.value = "";
          }}
        />
        {job?.id === "music" ? (
          <Progress value={job.progress} onCancel={() => abort.current?.abort()} />
        ) : (
          <Action onClick={exportMusic} disabled={busy || !canVideo || (!!track && soundRoutes.length === 0)} primary>
            {track ? "Render to the track" : "Choose a track"}
          </Action>
        )}
      </Card>

      <Card title="Live take" delay={160}>
        <Note>Records the canvas as you play it: your cursor, clicks and sound go in the file.</Note>
        {recording !== null ? (
          <Action onClick={stopRecording} active>
            <span className="size-2 animate-pulse rounded-full bg-ink" />
            Stop · {elapsed.toFixed(1)}s
          </Action>
        ) : (
          <Action onClick={startRecording}>Start recording</Action>
        )}
      </Card>
    </div>
  );
}
