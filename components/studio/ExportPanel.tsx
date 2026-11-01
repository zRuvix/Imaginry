"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { framerComponent, framerLook, htmlEmbed, lookFor, reactEmbed } from "@/lib/studio/embed";
import { renderOffscreen } from "@/lib/studio/renderer";
import type { StudioState } from "@/lib/studio/schema";
import { encodeLoop, videoSupported, type VideoFormat } from "@/lib/studio/video";
import { ASPECTS, LANDSCAPE_ASPECTS, PORTRAIT_ASPECTS, type Aspect } from "./Stage";

type Size = { id: string; label: string; width: number; height: number };

function sized(ratio: number, long: number) {
  return ratio >= 1
    ? { width: long, height: Math.round(long / ratio) }
    : { width: Math.round(long * ratio), height: long };
}

function sizeOptions(ratio: number, preview: { width: number; height: number }, tiers: [string, number][]): Size[] {
  return [
    { id: "preview", label: "Preview", ...preview },
    ...tiers.map(([label, long]) => ({ id: label, label, ...sized(ratio, long) })),
  ];
}

const IMAGE_TIERS: [string, number][] = [
  ["Small", 1080],
  ["Medium", 1920],
  ["Large", 2560],
  ["4K", 3840],
];
const VIDEO_TIERS: [string, number][] = [
  ["720p", 1280],
  ["1080p", 1920],
  ["1440p", 2560],
  ["4K", 3840],
];

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---------------------------------------------------------------- primitives

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-panel-border bg-black">
      <h3 className="border-b border-panel-border px-3.5 py-3 text-[13px] font-semibold">{title}</h3>
      <div className="space-y-2.5 p-3.5">{children}</div>
    </section>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] leading-snug text-neutral-400">{children}</p>;
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-[30px] rounded-lg border font-outfit text-[12.5px] font-medium transition-colors ${
        active
          ? "border-neutral-200 bg-neutral-200 text-black"
          : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={String(value)}
        onChange={(e) => onChange(options.find((o) => String(o.value) === e.target.value)!.value)}
        className="h-[30px] w-full cursor-pointer appearance-none rounded-lg border border-neutral-800 bg-neutral-950 pl-2.5 pr-8 text-[12.5px] text-neutral-100 outline-none focus:border-neutral-500"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
    </div>
  );
}

function Action({
  onClick,
  primary,
  disabled,
  children,
}: {
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative h-[30px] w-full overflow-hidden rounded-lg text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? "bg-neutral-200 text-black hover:bg-white"
          : "border border-neutral-800 bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- panel

type Props = {
  state: StudioState;
  image: HTMLImageElement | null;
  aspect: Aspect;
  onAspect: (a: Aspect) => void;
  previewSize: { width: number; height: number };
  timeRef: RefObject<number>;
  speed: number;
  onClose: () => void;
  notify: (msg: string) => void;
};

export default function ExportPanel(p: Props) {
  const ratio = ASPECTS[p.aspect] ?? p.previewSize.width / Math.max(p.previewSize.height, 1);
  const preview = { width: Math.round(p.previewSize.width), height: Math.round(p.previewSize.height) };
  const imageSizes = sizeOptions(ratio, preview, IMAGE_TIERS);
  const videoSizes = sizeOptions(ratio, preview, VIDEO_TIERS);

  const [imageSizeId, setImageSizeId] = useState("Large");
  const [videoSizeId, setVideoSizeId] = useState("1080p");
  const [format, setFormat] = useState<VideoFormat>("mp4");
  const [fps, setFps] = useState(30);
  const [seconds, setSeconds] = useState(6);
  const [progress, setProgress] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [tab, setTab] = useState<"framer" | "react" | "html">("framer");
  const [embedPreview, setEmbedPreview] = useState<string | null>(null);

  const imageSize = imageSizes.find((s) => s.id === imageSizeId) ?? imageSizes[0];
  const videoSize = videoSizes.find((s) => s.id === videoSizeId) ?? videoSizes[0];
  const sizeLabel = (s: Size) => `${s.label} — ${s.width} × ${s.height}`;

  const downloadPng = async () => {
    try {
      const source = await renderOffscreen(p.state, imageSize.width, imageSize.height, {
        time: p.timeRef.current,
        image: p.image,
      });
      source.toBlob((blob) => {
        if (!blob) return p.notify("Export failed");
        download(blob, `imaginry-${imageSize.width}x${imageSize.height}.png`);
        p.notify(`Exported ${imageSize.width}×${imageSize.height} PNG`);
      }, "image/png");
    } catch (e) {
      p.notify(e instanceof Error ? e.message : "Export failed");
    }
  };

  const exportVideo = async () => {
    if (progress !== null) {
      abortRef.current?.abort();
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    try {
      const blob = await encodeLoop({
        state: p.state,
        image: p.image,
        width: videoSize.width,
        height: videoSize.height,
        fps,
        seconds,
        format,
        startTime: p.timeRef.current,
        speed: p.speed || 1,
        onProgress: setProgress,
        signal: controller.signal,
      });
      const ext = format === "mp4" ? "mp4" : "webm";
      download(blob, `imaginry-${format}-${seconds}s.${ext}`);
      p.notify(`Exported ${(blob.size / 1024 / 1024).toFixed(1)} MB ${format.toUpperCase()}`);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        p.notify(e instanceof Error ? e.message : "Video export failed");
      }
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  };
  useEffect(() => () => abortRef.current?.abort(), []);

  // Embed code reflects the current design; the preview is debounced.
  const look = useMemo(() => lookFor(p.state, p.timeRef.current), [p.state, p.timeRef]);
  const code = useMemo(() => {
    if (tab === "framer") return { primary: framerComponent(), look: framerLook(look) };
    if (tab === "react") return { primary: reactEmbed(look, true) };
    return { primary: htmlEmbed(look, true) };
  }, [tab, look]);
  const kb = (new Blob([code.primary + (code.look ?? "")]).size / 1024).toFixed(1);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const { width, height } = sized(ratio, 480);
        const canvas = await renderOffscreen(p.state, width, height, { time: p.timeRef.current });
        setEmbedPreview(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        setEmbedPreview(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [p.state, ratio, p.timeRef]);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      p.notify(`${what} copied`);
    } catch {
      p.notify("Clipboard access was blocked");
    }
  };

  const embedNote = {
    framer: "Two pastes: the component onto your canvas, then the look into its Look property.",
    react: "One self-contained client component. Size it with CSS; it fills its box.",
    html: "Paste anywhere. The canvas fills its parent element.",
  }[tab];

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-xl border border-panel-border bg-panel">
      <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-panel-border px-4">
        <h2 className="text-[15px] font-semibold">Export</h2>
        <button
          type="button"
          aria-label="Close export"
          onClick={p.onClose}
          className="flex size-[30px] items-center justify-center rounded-lg text-neutral-300 hover:bg-neutral-800"
        >
          <X size={15} />
        </button>
      </header>

      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-3">
        <Card title="Aspect ratio">
          <div className="grid grid-cols-2 gap-2">
            <Choice active={p.aspect === "fill"} onClick={() => p.onAspect("fill")}>
              Fill
            </Choice>
            <Choice active={p.aspect === "1:1"} onClick={() => p.onAspect("1:1")}>
              Square
            </Choice>
          </div>
          {(
            [
              ["Landscape", LANDSCAPE_ASPECTS],
              ["Portrait", PORTRAIT_ASPECTS],
            ] as const
          ).map(([label, list]) => (
            <div key={label} className="space-y-2">
              <span className="block pt-1 text-[12.5px] text-neutral-400">{label}</span>
              <div className="grid grid-cols-3 gap-2">
                {list.map((a) => (
                  <Choice key={a} active={p.aspect === a} onClick={() => p.onAspect(a)}>
                    {a}
                  </Choice>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card title="Image export">
          <Note>PNG rendered at the chosen size, straight from the shader. No watermark.</Note>
          <Dropdown
            label="Image size"
            value={imageSize.id}
            options={imageSizes.map((s) => ({ value: s.id, label: sizeLabel(s) }))}
            onChange={setImageSizeId}
          />
          <Action primary onClick={downloadPng}>
            Download PNG
          </Action>
        </Card>

        <Card title="Loop video export">
          <Note>
            Rendered frame by frame, so nothing drops. The ending cross-fades into the start for a seamless loop.
          </Note>
          <Dropdown
            label="Video size"
            value={videoSize.id}
            options={videoSizes.map((s) => ({ value: s.id, label: sizeLabel(s) }))}
            onChange={setVideoSizeId}
          />
          <div className="grid grid-cols-3 gap-2">
            {(["mp4", "webm", "av1"] as const).map((f) => (
              <Choice key={f} active={format === f} onClick={() => setFormat(f)}>
                {f.toUpperCase()}
              </Choice>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Dropdown
              label="Frame rate"
              value={fps}
              options={[24, 30, 60].map((v) => ({ value: v, label: `${v} fps` }))}
              onChange={setFps}
            />
            <Dropdown
              label="Loop length"
              value={seconds}
              options={[3, 6, 10, 15].map((v) => ({ value: v, label: `${v}s loop` }))}
              onChange={setSeconds}
            />
          </div>
          <Action onClick={exportVideo} disabled={!videoSupported()}>
            {progress !== null && (
              <span
                className="absolute inset-y-0 left-0 bg-white/15 transition-[width]"
                style={{ width: `${progress * 100}%` }}
              />
            )}
            <span className="relative">
              {!videoSupported()
                ? "Video export needs WebCodecs"
                : progress !== null
                  ? `Encoding ${Math.round(progress * 100)}% · click to cancel`
                  : `Export ${format.toUpperCase()} loop`}
            </span>
          </Action>
        </Card>

        <Card title="Embed as code">
          <div className="grid grid-cols-3 rounded-xl bg-neutral-900 p-1">
            {(["framer", "react", "html"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
                className={`h-9 rounded-lg text-[14px] font-semibold capitalize transition-colors ${
                  tab === t ? "bg-black text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {t === "html" ? "HTML" : t}
              </button>
            ))}
          </div>
          <Note>
            {embedNote} · {kb} kB
            {p.image && " Uploaded images aren't embedded."}
          </Note>
          <div
            className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950"
            style={{ aspectRatio: String(ratio) }}
          >
            {embedPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={embedPreview} alt="Embed preview" className="size-full object-cover" />
            )}
          </div>
          {tab === "framer" ? (
            <>
              <Action onClick={() => copy(code.primary, "Component")}>1. Copy component</Action>
              <Action primary onClick={() => copy(code.look!, "Look")}>
                2. Copy look
              </Action>
            </>
          ) : (
            <Action primary onClick={() => copy(code.primary, tab === "react" ? "Component" : "HTML")}>
              {tab === "react" ? "Copy component" : "Copy HTML"}
            </Action>
          )}
        </Card>
      </div>
    </aside>
  );
}
