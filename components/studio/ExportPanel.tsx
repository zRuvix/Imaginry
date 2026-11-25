"use client";

import { ChevronDown, Lock, X } from "@/components/icons";
import { track } from "@/lib/events";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { framerComponent, framerLook, htmlEmbed, lookFor, reactEmbed } from "@/lib/studio/embed";
import { encodeShare } from "@/lib/studio/storage";
import { renderOffscreen } from "@/lib/studio/renderer";
import type { StudioState } from "@/lib/studio/schema";
import type { StudioImage } from "@/lib/studio/gif";
import { encodeLoop, videoSupported, type VideoFormat } from "@/lib/studio/video";
import { ASPECTS, LANDSCAPE_ASPECTS, PORTRAIT_ASPECTS, stagePixelRatio, type Aspect } from "./Stage";
import GoogleSignIn from "./GoogleSignIn";
import { BILLING_RETURN } from "./BillingPanel";
import { PLAN_LIMITS, sizeAllowed, type ExportKind, type Plan } from "@/lib/pricing";
import { useClickOutside } from "./controls";
import { announceQuota, useExportQuota, type Quota } from "@/lib/exportQuota";

type Size = { id: string; label: string; width: number; height: number; /** Above the plan's limit. */ locked: boolean };

/**
 * Claims one export on the server, which checks the plan's size limit and
 * daily allowance. Resolves with an error message when it's refused.
 */
async function claimExport(body: {
  kind: "export_png" | "export_video";
  width: number;
  height: number;
  meta: Record<string, string | number>;
}): Promise<{ quota?: Quota; error?: string }> {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  const data = (await res?.json().catch(() => null)) as { quota?: Quota; error?: string } | null;
  if (!res?.ok) return { quota: data?.quota, error: data?.error ?? "Couldn't start the export. Try again." };
  return { quota: data?.quota };
}

function resetLabel(iso: string | null) {
  if (!iso) return "tomorrow";
  const hours = Math.ceil((new Date(iso).getTime() - Date.now()) / 36e5);
  return hours <= 1 ? "in under an hour" : `in ${hours} hours`;
}

function sized(ratio: number, long: number) {
  return ratio >= 1
    ? { width: long, height: Math.round(long / ratio) }
    : { width: Math.round(long * ratio), height: long };
}

/**
 * The sizes on offer for `plan`. Tiers above the plan's limit are locked (the
 * server refuses them too); Preview shrinks to fit the limit rather than lock,
 * so every plan keeps it.
 */
function sizeOptions(
  plan: Plan,
  kind: ExportKind,
  ratio: number,
  preview: { width: number; height: number },
  tiers: [string, number][],
): Size[] {
  const cap = PLAN_LIMITS[plan].longSide[kind];
  const fit = Math.min(1, cap / Math.max(preview.width, preview.height, 1));
  const previewFit = { width: Math.floor(preview.width * fit), height: Math.floor(preview.height * fit) };
  return [
    { id: "preview", label: "Preview", ...previewFit, locked: false },
    ...tiers.map(([label, long]) => {
      const s = sized(ratio, long);
      return { id: label, label, ...s, locked: !sizeAllowed(plan, kind, s.width, s.height) };
    }),
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
    // Lifted while one of its dropdowns is open, so the menu sits over the next card.
    <section className="anim-rise relative rounded-[18px] bg-white/[0.04] has-[[aria-expanded=true]]:z-30">
      <h3 className="px-4 pb-0.5 pt-3.5 text-[13.5px] font-semibold text-bone">{title}</h3>
      <div className="space-y-2.5 p-3.5 pt-2.5">{children}</div>
    </section>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] leading-snug text-bone/50">{children}</p>;
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`press h-9 rounded-full font-outfit text-[12.5px] font-medium ${
        active
          ? "bg-bone text-ink"
          : "bg-white/[0.05] text-bone/70 hover:bg-white/[0.1] hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

type Option<T> = {
  value: T;
  label: string;
  /** Quiet second column, e.g. the pixel size. */
  hint?: string;
  /** On a higher plan: shown with a Pro tag, and picking it calls onLocked instead. */
  locked?: boolean;
};

/** The studio's dropdown: the trigger shows the value, the menu springs open. Arrow keys move, Enter picks. */
function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  onLocked,
  label,
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  onLocked?: (o: Option<T>) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));
  const current = options.find((o) => o.value === value) ?? options[0];

  const choose = (o: Option<T>) => {
    setOpen(false);
    if (o.locked) onLocked?.(o);
    else onChange(o.value);
  };
  const show = () => {
    setActive(Math.max(0, options.indexOf(current)));
    setOpen(true);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return show();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + options.length) % options.length);
    } else if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      choose(options[active]);
    }
  };

  return (
    <div ref={ref} className="relative" onKeyDown={onKey}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current.label}`}
        onClick={() => (open ? setOpen(false) : show())}
        className="press flex h-10 w-full items-center justify-between gap-2 rounded-[12px] bg-white/[0.05] px-3.5 text-[13px] hover:bg-white/[0.08] active:scale-[0.98]"
      >
        <span className="truncate text-bone">{current.label}</span>
        <span className="flex shrink-0 items-center gap-2 text-bone/50">
          {current.hint && <span className="tabular-nums">{current.hint}</span>}
          <ChevronDown size={12} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="anim-menu glass-panel absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-72 overflow-y-auto rounded-[14px] p-1.5"
          style={{ background: "rgba(23, 21, 18, 0.97)" }}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li key={String(o.value)}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  aria-disabled={o.locked || undefined}
                  onClick={() => choose(o)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[13px] transition-colors ${
                    selected
                      ? "bg-white/[0.1] text-bone"
                      : i === active
                        ? "bg-white/[0.06] text-bone"
                        : "text-bone/70"
                  } ${o.locked ? "text-bone/40" : ""}`}
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="tabular-nums text-[12px] text-bone/40">{o.hint}</span>}
                  {o.locked ? (
                    <span className="flex items-center gap-1 rounded-full bg-[#2460e8]/25 px-2 py-0.5 text-[11px] font-semibold text-[#9db8ff]">
                      <Lock size={10} />
                      Pro
                    </span>
                  ) : (
                    <span className={`size-1.5 rounded-full ${selected ? "bg-ember" : "bg-transparent"}`} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Action({
  onClick,
  disabled,
  locked,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  /** Signed out (true) or not known yet (null): the button can't be pressed. Sign-in is the card at the top. */
  locked?: boolean | null;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || locked === true || locked === null}
      className="blue-button relative h-10 w-full overflow-hidden rounded-full text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- panel

type Props = {
  state: StudioState;
  image: StudioImage | null;
  aspect: Aspect;
  onAspect: (a: Aspect) => void;
  previewSize: { width: number; height: number };
  timeRef: RefObject<number>;
  speed: number;
  /** Exports need an account. null while the session is still loading. */
  signedIn: boolean | null;
  onClose: () => void;
  notify: (msg: string) => void;
};

export default function ExportPanel(p: Props) {
  const ratio = ASPECTS[p.aspect] ?? p.previewSize.width / Math.max(p.previewSize.height, 1);
  const preview = { width: Math.round(p.previewSize.width), height: Math.round(p.previewSize.height) };
  // Plan and exports left today. null until known (or signed out).
  const quota = useExportQuota(p.signedIn);
  // Until the plan is known, offer only what Free allows.
  const plan: Plan = quota?.plan ?? "free";
  const outOfExports = quota !== null && quota.remaining !== null && quota.remaining <= 0;

  const imageSizes = sizeOptions(plan, "image", ratio, preview, IMAGE_TIERS);
  const videoSizes = sizeOptions(plan, "video", ratio, preview, VIDEO_TIERS);

  const [imageSizeId, setImageSizeId] = useState("Large");
  const [videoSizeId, setVideoSizeId] = useState("1080p");
  const [format, setFormat] = useState<VideoFormat>("mp4");
  const [fps, setFps] = useState(30);
  const [seconds, setSeconds] = useState(6);
  const [progress, setProgress] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [tab, setTab] = useState<"framer" | "react" | "html">("framer");
  const [embedPreview, setEmbedPreview] = useState<string | null>(null);

  // A locked size picked (or defaulted) falls back to the largest one the plan allows.
  const pick = (sizes: Size[], id: string) => {
    const want = sizes.find((s) => s.id === id);
    return want && !want.locked ? want : ([...sizes].reverse().find((s) => !s.locked) ?? sizes[0]);
  };
  const imageSize = pick(imageSizes, imageSizeId);
  const videoSize = pick(videoSizes, videoSizeId);
  const sizeChoices = (sizes: Size[]): Option<string>[] =>
    sizes.map((s) => ({ value: s.id, label: s.label, hint: `${s.width} × ${s.height}`, locked: s.locked }));
  const onLockedSize = (o: Option<string>) => p.notify(`${o.label} exports are on Pro`);
  // How many export pixels one pixel of the studio canvas covers, so grain,
  // threshold noise and other pixel-sized details come out as they looked.
  const pixelFor = (s: Size) =>
    Math.min(s.width, s.height) / Math.max(1, Math.min(preview.width, preview.height) * stagePixelRatio());

  const downloadPng = async () => {
    try {
      const source = await renderOffscreen(p.state, imageSize.width, imageSize.height, {
        time: p.timeRef.current,
        image: p.image,
        pixel: pixelFor(imageSize),
      });
      const blob = await new Promise<Blob | null>((resolve) => source.toBlob(resolve, "image/png"));
      if (!blob) return p.notify("Export failed");
      const claim = await claimExport({
        kind: "export_png",
        width: imageSize.width,
        height: imageSize.height,
        meta: { width: imageSize.width, height: imageSize.height },
      });
      if (claim.quota) announceQuota(claim.quota);
      if (claim.error) return p.notify(claim.error);
      download(blob, `imaginry-${imageSize.width}x${imageSize.height}.png`);
      p.notify(`Exported ${imageSize.width}×${imageSize.height} PNG`);
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
        pixel: pixelFor(videoSize),
        onProgress: setProgress,
        signal: controller.signal,
      });
      const claim = await claimExport({
        kind: "export_video",
        width: videoSize.width,
        height: videoSize.height,
        meta: { format, seconds, fps, width: videoSize.width, height: videoSize.height },
      });
      if (claim.quota) announceQuota(claim.quota);
      if (claim.error) return p.notify(claim.error);
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
      track("copy_embed", { tab, what });
    } catch {
      p.notify("Clipboard access was blocked");
    }
  };

  // Signing up from the card at the top comes back to the same design (it rides
  // in the hash) with this panel open again.
  const signUpUrl = `/studio?export=1#${encodeShare(p.state)}`;
  // Signed out, or still loading (null): the export buttons are disabled.
  const locked = p.signedIn === null ? null : !p.signedIn;
  // Signed out, every export button reads just "Export" and can't be pressed.
  const gated = (label: string) => (p.signedIn === false ? "Export" : label);
  // Free with today's exports spent: file exports wait until one frees up.
  const spent = (label: string) => (outOfExports ? "Today's free exports are used" : gated(label));
  const upgradeUrl = `${BILLING_RETURN}#${encodeShare(p.state)}`;
  // Embed is Pro only, so its buttons also wait for the plan to load.
  const embedLocked = locked === false && quota === null ? null : locked;

  const embedNote = {
    framer: "Two pastes: the component onto your canvas, then the look into its Look property.",
    react: "One self-contained client component. Size it with CSS; it fills its box.",
    html: "Paste anywhere. The canvas fills its parent element.",
  }[tab];

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[58px] shrink-0 items-center justify-between px-4">
        <h2 className="text-[15px] font-semibold">Export</h2>
        <button
          type="button"
          aria-label="Close export"
          onClick={p.onClose}
          className="press flex size-9 items-center justify-center rounded-full text-bone/70 hover:bg-white/[0.08] hover:text-bone"
        >
          <X size={15} />
        </button>
      </header>

      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-3">
        {p.signedIn === false && (
          <section className="anim-rise rounded-[18px] bg-[#2460e8]/[0.14] p-3.5 ring-1 ring-[#5680f2]/30">
            <h3 className="pb-3 text-[13.5px] font-semibold text-bone">Sign up to export</h3>
            <GoogleSignIn callbackURL={signUpUrl} />
          </section>
        )}
        {quota && quota.remaining !== null && (
          <section className="anim-rise flex items-center justify-between gap-3 rounded-[18px] bg-white/[0.04] px-4 py-3">
            <p className="text-[12.5px] leading-snug text-bone/60">
              {outOfExports
                ? `Free exports used. Next one ${resetLabel(quota.resetsAt)}.`
                : `${quota.remaining} free ${quota.remaining === 1 ? "export" : "exports"} left today`}
            </p>
            <a
              href={upgradeUrl}
              className="press shrink-0 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12px] font-semibold text-bone hover:bg-white/[0.14]"
            >
              Go Pro
            </a>
          </section>
        )}
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
              <span className="block pt-1 text-[12.5px] text-bone/50">{label}</span>
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
            options={sizeChoices(imageSizes)}
            onChange={setImageSizeId}
            onLocked={onLockedSize}
          />
          <Action onClick={downloadPng} disabled={outOfExports} locked={locked}>
            {spent("Download PNG")}
          </Action>
        </Card>

        <Card title="Loop video export">
          <Note>
            Rendered frame by frame, so nothing drops. The ending cross-fades into the start for a seamless loop.
          </Note>
          <Dropdown
            label="Video size"
            value={videoSize.id}
            options={sizeChoices(videoSizes)}
            onChange={setVideoSizeId}
            onLocked={onLockedSize}
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
          <Action
            onClick={exportVideo}
            disabled={!videoSupported() || (outOfExports && progress === null)}
            locked={locked}
          >
            {progress !== null && (
              <span
                className="absolute inset-y-0 left-0 bg-white/15 transition-[width]"
                style={{ width: `${progress * 100}%` }}
              />
            )}
            <span className="relative">
              {!videoSupported()
                ? "Video export needs WebCodecs"
                : locked || outOfExports
                  ? spent(`Export ${format.toUpperCase()} loop`)
                : progress !== null
                  ? `Encoding ${Math.round(progress * 100)}% · click to cancel`
                  : `Export ${format.toUpperCase()} loop`}
            </span>
          </Action>
        </Card>

        <Card title="Embed as code">
          <div className="grid grid-cols-3 rounded-full bg-white/[0.05] p-1">
            {(["framer", "react", "html"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
                className={`h-9 rounded-full text-[14px] font-semibold capitalize transition-colors ${
                  tab === t ? "bg-bone text-ink" : "text-bone/55 hover:text-bone"
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
            className="overflow-hidden rounded-[14px] bg-black/40"
            style={{ aspectRatio: String(ratio) }}
          >
            {embedPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={embedPreview} alt="Embed preview" className="size-full object-cover" />
            )}
          </div>
          {quota && !PLAN_LIMITS[quota.plan].embed ? (
            <a
              href={upgradeUrl}
              className="blue-button flex h-10 w-full items-center justify-center rounded-full text-[13px] font-semibold"
            >
              Embed code is on Pro
            </a>
          ) : tab === "framer" ? (
            <>
              <Action onClick={() => copy(code.primary, "Component")} locked={embedLocked}>
                {gated("1. Copy component")}
              </Action>
              {embedLocked === false && <Action onClick={() => copy(code.look!, "Look")}>2. Copy look</Action>}
            </>
          ) : (
            <Action onClick={() => copy(code.primary, tab === "react" ? "Component" : "HTML")} locked={embedLocked}>
              {gated(tab === "react" ? "Copy component" : "Copy HTML")}
            </Action>
          )}
        </Card>
      </div>
    </div>
  );
}
