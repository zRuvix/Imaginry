"use client";

import { useRef, type ReactNode } from "react";
import type { CuratedLook } from "@/lib/studio/looks";
import LiveLook from "./LiveLook";
import { clamp01, useSmoothProgress } from "./motion";

const LOOP_LOOK: CuratedLook = {
  name: "Loop",
  recipe: "",
  presets: ["g-violet", "b-duo", "gl-wavy", "gr-fine"],
  seed: 3.7,
  ratio: 1,
};

const SNIPPET = `import ImaginryLook from "./ImaginryLook";

export default function Hero() {
  return (
    <section className="relative h-screen">
      <ImaginryLook animate speed={0.8} />
      <h1>Hello, world</h1>
    </section>
  );
}`;

/** Ratios the stills frame morphs through, in order. */
const RATIOS: [string, number][] = [
  ["1:1", 1],
  ["4:5", 4 / 5],
  ["16:9", 16 / 9],
  ["9:16", 9 / 16],
  ["21:9", 21 / 9],
];

const FORMATS = ["PNG", "MP4", "WebM", "AV1", "React", "Framer", "HTML"];

const smooth = (t: number) => t * t * (3 - 2 * t);

function Panel({
  index,
  title,
  body,
  media,
  footer,
}: {
  index: string;
  title: string;
  body: string;
  media: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <article className="flex h-[74svh] w-[86vw] shrink-0 flex-col overflow-hidden rounded-[30px] bg-[var(--surface)] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] md:h-[66svh] md:w-[min(76vw,1060px)] md:flex-row">
      <div className="relative min-h-0 flex-1 overflow-hidden md:flex-[1.3]">{media}</div>
      <div className="flex flex-col justify-between gap-5 p-6 md:flex-1 md:p-10">
        <span className="font-condensed text-[15px] font-medium text-[var(--ember)]">{index}</span>
        <div>
          <h3 className="font-display text-[clamp(24px,2.7vw,40px)] leading-[1.02] tracking-[-0.02em] text-[var(--bone)]">
            {title}
          </h3>
          <p className="mt-4 max-w-[420px] text-[16px] leading-relaxed text-[var(--bone)]/75">{body}</p>
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </article>
  );
}

/**
 * A pinned horizontal rail: scrolling down glides the panels sideways. Each
 * panel swings in with a slight turn and animates its own showcase as it
 * crosses the screen.
 */
export default function ExportStack({ stills }: { stills: (string | null)[] }) {
  const outer = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const fx = useRef<((lp: number) => void)[]>([]);

  // --- 01 stills: the frame morphs through ratios and swaps designs
  const frameBox = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const frameImgs = useRef<(HTMLImageElement | null)[]>([]);
  const ratioChips = useRef<(HTMLSpanElement | null)[]>([]);
  fx.current[0] = (lp) => {
    const box = frameBox.current;
    const f = frame.current;
    if (!box || !f) return;
    const t = clamp01((lp - 0.2) / 0.65) * (RATIOS.length - 1);
    const i = Math.min(RATIOS.length - 2, Math.floor(t));
    const k = smooth(t - i);
    const ratio = RATIOS[i][1] + (RATIOS[i + 1][1] - RATIOS[i][1]) * k;
    const w = Math.min(box.clientWidth * 0.84, box.clientHeight * 0.82 * ratio);
    f.style.width = `${w}px`;
    f.style.height = `${w / ratio}px`;
    const active = Math.round(t);
    ratioChips.current.forEach((c, j) => c && (c.dataset.on = j === active ? "1" : "0"));
    frameImgs.current.forEach(
      (img, j) => img && (img.style.opacity = j === active % frameImgs.current.length ? "1" : "0"),
    );
  };

  // --- 03 code: types itself out
  const code = useRef<HTMLSpanElement>(null);
  fx.current[2] = (lp) => {
    if (!code.current) return;
    const n = Math.round(clamp01((lp - 0.18) / 0.42) * SNIPPET.length);
    if (code.current.textContent?.length !== n) code.current.textContent = SNIPPET.slice(0, n);
  };

  // --- 04 formats: words slide in from alternating sides. Driven by the rail's
  // own progress (0..1 over its final stretch), since this panel never
  // reaches the middle of the screen.
  const words = useRef<(HTMLSpanElement | null)[]>([]);
  const playFormats = (t: number) => {
    words.current.forEach((w, i) => {
      if (!w) return;
      const t2 = smooth(clamp01(t * 1.6 - i * 0.1));
      const dir = i % 2 ? 1 : -1;
      w.style.transform = `translate3d(${(1 - t2) * dir * 160}px, 0, 0)`;
      w.style.opacity = String(t2);
    });
  };

  const trackX = useRef(0);
  useSmoothProgress(
    outer,
    (rect, vh) => clamp01(-rect.top / Math.max(1, rect.height - vh)),
    (p) => {
      const t = track.current;
      if (!t) return;
      const vw = window.innerWidth;
      const distance = Math.max(0, t.scrollWidth - vw);
      // The sideways travel finishes early; the rest of the pin lets the last
      // panel play out in place before the section scrolls away.
      const travel = clamp01(p / 0.8);
      const settle = smooth(clamp01((p - 0.62) / 0.3));
      // Measure every panel before writing anything (reading after a write
      // forces a layout per panel), then shift by how far the track moves.
      const tx = -travel * distance;
      const shift = tx - trackX.current;
      const lefts = panels.current.map((panel) => {
        const r = panel?.getBoundingClientRect();
        return r ? { left: r.left + shift, width: r.width } : null;
      });
      trackX.current = tx;
      t.style.transform = `translate3d(${tx}px, 0, 0)`;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (counter.current) {
        counter.current.textContent = `0${Math.min(4, Math.floor(travel * 3.999) + 1)} / 04`;
      }
      playFormats(settle);
      const last = panels.current.length - 1;
      panels.current.forEach((panel, i) => {
        const r = lefts[i];
        if (!panel || !r) return;
        // 0 just entering on the right, 0.5 centred, 1 gone on the left.
        const lp = clamp01((vw - r.left) / (vw + r.width));
        fx.current[i]?.(lp);
        // Swing in with a slight turn, settle flat in the middle. The last
        // panel never reaches the middle, so it flattens as the rail ends.
        let swing = clamp01(1 - Math.abs(lp - 0.45) / 0.45);
        let turn = (lp - 0.45) * -22;
        if (i === last) {
          swing = Math.max(swing, settle);
          turn *= 1 - settle;
        }
        const card = panel.firstElementChild as HTMLElement | null;
        if (card) {
          card.style.transform = `perspective(1600px) rotateY(${turn}deg) scale(${0.88 + swing * 0.12})`;
          card.style.opacity = String(0.35 + swing * 0.65);
        }
        const media = panel.querySelector<HTMLElement>("[data-parallax]");
        if (media) media.style.transform = `translate3d(${(lp - 0.5) * -70}px, 0, 0) scale(1.15)`;
      });
    },
    0.075,
  );

  const register = (i: number) => (el: HTMLDivElement | null) => {
    panels.current[i] = el;
  };

  return (
    <section id="export" ref={outer} className="relative h-[440vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div className="mx-auto mb-8 flex w-full max-w-[1200px] items-end justify-between px-4 md:mb-10 md:px-6">
          <div>
            <p className="font-condensed text-[15px] font-medium text-[var(--ember)]">Export</p>
            <h2 className="mt-2 font-display text-[clamp(30px,4.4vw,60px)] leading-[1] tracking-[-0.025em] text-[var(--bone)]">
              Take it anywhere
            </h2>
          </div>
          <div className="flex items-center gap-3 font-condensed text-[15px] text-[var(--bone)]/60">
            <span ref={counter}>01 / 04</span>
            <span className="relative block h-px w-20 overflow-hidden bg-white/15 md:w-32">
              <span
                ref={bar}
                className="absolute inset-0 origin-left bg-[var(--bone)]"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
          </div>
        </div>

        <div
          ref={track}
          className="flex items-center gap-5 pl-4 pr-[12vw] will-change-transform md:gap-8 md:pl-[max(24px,calc((100vw-1200px)/2+24px))]"
        >
          <div ref={register(0)}>
            <Panel
              index="01 · Stills"
              title="Up to 4K, at any ratio"
              body="Square for social, tall for stories, ultra-wide for banners. Every PNG is rendered straight from the shader, never upscaled."
              footer={
                <div className="flex flex-wrap gap-1.5">
                  {RATIOS.map(([label], j) => (
                    <span
                      key={label}
                      ref={(el) => {
                        ratioChips.current[j] = el;
                      }}
                      data-on={j === 0 ? "1" : "0"}
                      className="rounded-full bg-white/[0.07] px-3 py-1 font-condensed text-[14px] text-[var(--bone)]/60 transition-colors duration-500 data-[on=1]:bg-[var(--bone)] data-[on=1]:text-[var(--ink)]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              }
              media={
                <div ref={frameBox} className="flex h-full w-full items-center justify-center bg-[var(--ink)]">
                  <div
                    ref={frame}
                    className="relative overflow-hidden rounded-[18px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/15"
                    style={{ width: 280, height: 280 }}
                  >
                    {stills.map((src, j) =>
                      src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={j}
                          ref={(el) => {
                            frameImgs.current[j] = el;
                          }}
                          src={src}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                          style={{ opacity: j === 0 ? 1 : 0 }}
                        />
                      ) : null,
                    )}
                  </div>
                </div>
              }
            />
          </div>

          <div ref={register(1)}>
            <Panel
              index="02 · Loops"
              title="Video that never jumps"
              body="MP4, WebM or AV1, rendered frame by frame so nothing drops. The last moments fade into the first, so it loops forever."
              media={
                <div className="relative h-full w-full overflow-hidden">
                  <div data-parallax className="absolute inset-0">
                    <LiveLook look={LOOP_LOOK} className="h-full w-full" />
                  </div>
                  <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-black/55 p-4 backdrop-blur-md">
                    <div className="mb-2.5 flex justify-between font-condensed text-[14px] text-[var(--bone)]/85">
                      <span>0s</span>
                      <span className="text-[var(--ember)]">fades into the start</span>
                      <span>6s</span>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-white/15">
                      <span className="absolute inset-y-0 right-0 w-[18%] bg-gradient-to-r from-transparent to-[var(--ember)]/80" />
                      <span className="loop-head absolute inset-y-0 left-0 w-1 rounded-full bg-[var(--bone)]" />
                    </div>
                  </div>
                </div>
              }
            />
          </div>

          <div ref={register(2)}>
            <Panel
              index="03 · Code"
              title="Paste it into your site"
              body="Framer, React or plain HTML. One self-contained file, about 20 kB, that renders the look live and keeps animating."
              media={
                <div className="flex h-full w-full flex-col bg-[var(--ink)] p-5 md:p-8">
                  <div className="mb-5 flex gap-1.5 font-condensed text-[14px]">
                    {["Framer", "React", "HTML"].map((t, i) => (
                      <span
                        key={t}
                        className={`rounded-full px-3 py-1 ${i === 1 ? "bg-[var(--bone)] text-[var(--ink)]" : "bg-white/[0.07] text-[var(--bone)]/60"}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <pre className="overflow-hidden whitespace-pre font-mono text-[12px] leading-[1.7] text-[var(--bone)] md:text-[14.5px]">
                    <span ref={code} />
                    <span className="caret ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-[var(--ember)]" />
                  </pre>
                </div>
              }
            />
          </div>

          <div ref={register(3)}>
            <article className="flex h-[74svh] w-[86vw] shrink-0 flex-col justify-center px-6 md:h-[66svh] md:w-[min(60vw,820px)] md:px-12">
              <p className="mb-5 font-condensed text-[16px] text-[var(--bone)]/70">Every format. No watermark.</p>
              {FORMATS.map((f, i) => (
                <span
                  key={f}
                  ref={(el) => {
                    words.current[i] = el;
                  }}
                  className={`block font-display text-[clamp(32px,5.4vw,78px)] leading-[1.02] tracking-[-0.03em] ${
                    i % 3 === 1 ? "text-[var(--ember)]" : "text-[var(--bone)]"
                  }`}
                  style={{ opacity: 0 }}
                >
                  {f}
                </span>
              ))}
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
