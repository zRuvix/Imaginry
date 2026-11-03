"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CuratedLook } from "@/lib/studio/looks";
import { EASE_OUT, MaskLines, Marker } from "./kit";
import LiveLook from "./LiveLook";

const SNIPPET = `import ImaginryLook from "./ImaginryLook";

export default function Hero() {
  return (
    <section className="relative h-screen">
      <ImaginryLook animate speed={0.8} />
      <h1>Hello, world</h1>
    </section>
  );
}`;

const RATIOS: [string, number][] = [
  ["1:1", 1],
  ["4:5", 4 / 5],
  ["16:9", 16 / 9],
  ["9:16", 9 / 16],
  ["21:9", 21 / 9],
];

const FORMATS = ["PNG", "MP4", "WebM", "AV1", "React", "Framer", "HTML"];

/** Ticks `0, 1, 2…` every `ms` while the element is on screen. */
function useTicker(ref: React.RefObject<HTMLElement | null>, ms: number) {
  const inView = useInView(ref, { margin: "-10% 0px" });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [inView, ms]);
  return tick;
}

/** A bento card: a soft light follows the cursor across it. */
function Card({
  index,
  title,
  body,
  children,
  className = "",
  delay = 0,
}: {
  index: string;
  title: string;
  body: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.2, delay, ease: EASE_OUT }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={`group relative flex flex-col overflow-hidden rounded-[26px] bg-[var(--surface)] ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(420px circle at var(--mx) var(--my), rgba(237,231,220,0.07), transparent 60%)" }}
      />
      <div className="relative min-h-[300px] flex-1 overflow-hidden">{children}</div>
      <div className="relative p-6 md:p-7">
        <p className="font-condensed text-[15px] text-[var(--ember)]">{index}</p>
        <h3 className="mt-1.5 font-display text-[clamp(22px,2vw,30px)] leading-[1.05] tracking-[-0.025em] text-[var(--bone)]">
          {title}
        </h3>
        <p className="mt-2.5 max-w-[440px] text-[15px] leading-relaxed text-[var(--bone)]/60">{body}</p>
      </div>
    </motion.article>
  );
}

/** The frame springs through every export ratio, swapping designs as it goes. */
function Ratios({ stills }: { stills: (string | null)[] }) {
  const box = useRef<HTMLDivElement>(null);
  const tick = useTicker(box, 1700);
  const [area, setArea] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setArea({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const i = tick % RATIOS.length;
  const ratio = RATIOS[i][1];
  const w = Math.min(area.w * 0.8, area.h * 0.74 * ratio);
  const shown = stills.filter(Boolean) as string[];

  return (
    <div ref={box} className="absolute inset-0 flex items-center justify-center bg-[var(--ink)]">
      <motion.div
        className="relative overflow-hidden rounded-[16px] ring-1 ring-white/15"
        initial={false}
        animate={{ width: w || 200, height: (w || 200) / ratio }}
        transition={{ type: "spring", stiffness: 140, damping: 20 }}
      >
        <AnimatePresence initial={false}>
          {shown.length > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img
              key={tick % shown.length}
              src={shown[tick % shown.length]}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT }}
            />
          )}
        </AnimatePresence>
      </motion.div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1">
        {RATIOS.map(([label], j) => (
          <span key={label} className="relative rounded-full px-3 py-1 font-condensed text-[14px]">
            {j === i && (
              <motion.span
                layoutId="ratio-pill"
                className="absolute inset-0 rounded-full bg-[var(--bone)]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className={`relative transition-colors duration-300 ${j === i ? "text-[var(--ink)]" : "text-[var(--bone)]/50"}`}>
              {label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Types the embed snippet out the first time it's seen. */
function Typing() {
  const ref = useRef<HTMLPreElement>(null);
  const seen = useInView(ref, { once: true, margin: "-15% 0px" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const t = setInterval(() => setN((v) => (v >= SNIPPET.length ? (clearInterval(t), v) : v + 2)), 16);
    return () => clearInterval(t);
  }, [seen]);
  return (
    <div className="absolute inset-0 flex flex-col bg-[var(--ink)] p-5 md:p-7">
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
      <pre ref={ref} className="overflow-hidden whitespace-pre font-mono text-[11.5px] leading-[1.7] text-[var(--bone)] md:text-[13px]">
        {SNIPPET.slice(0, n)}
        <span className="caret ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-[var(--ember)]" />
      </pre>
    </div>
  );
}

/** "Export as ___", the blank rolling through every format. */
function Formats() {
  const ref = useRef<HTMLDivElement>(null);
  const tick = useTicker(ref, 1400);
  const i = tick % FORMATS.length;
  return (
    <div ref={ref} className="absolute inset-0 flex flex-col justify-center bg-[var(--ink)] px-6 md:px-10">
      <p className="font-condensed text-[16px] text-[var(--bone)]/55">Export as</p>
      <div className="relative mt-1 h-[1.05em] overflow-hidden font-display text-[clamp(52px,7.4vw,124px)] leading-[1.05] tracking-[-0.045em]">
        <AnimatePresence initial={false}>
          <motion.span
            key={i}
            className={`absolute left-0 top-0 ${i % 3 === 1 ? "text-[var(--ember)]" : "text-[var(--bone)]"}`}
            initial={{ y: "100%", rotateX: -60, opacity: 0 }}
            animate={{ y: "0%", rotateX: 0, opacity: 1 }}
            exit={{ y: "-100%", rotateX: 60, opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
          >
            {FORMATS[i]}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="mt-6 flex flex-wrap gap-1.5">
        {FORMATS.map((f, j) => (
          <span
            key={f}
            className={`rounded-full px-3 py-1 font-condensed text-[14px] transition-colors duration-500 ${
              j === i ? "bg-[var(--bone)] text-[var(--ink)]" : "bg-white/[0.06] text-[var(--bone)]/50"
            }`}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Export, as a bento of four live demos. */
export default function Exports({ stills, loop }: { stills: (string | null)[]; loop?: CuratedLook }) {
  return (
    <section id="export" className="relative mx-auto max-w-[1400px] px-4 pb-[18vh] md:px-8">
      <div className="mb-10 grid gap-6 md:mb-14 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <Marker n="05">Export</Marker>
          <h2 className="mt-4 font-display text-[clamp(34px,5vw,84px)] leading-[0.95] tracking-[-0.035em] text-[var(--bone)]">
            <MaskLines lines={["Take it", "anywhere"]} />
          </h2>
        </div>
        <p className="max-w-[360px] text-[15.5px] leading-relaxed text-[var(--bone)]/60 md:col-span-4 md:justify-self-end">
          Every format, no watermark, no account needed.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-12 md:gap-4">
        <Card
          index="01 · Stills"
          title="Up to 4K, at any ratio"
          body="Square for social, tall for stories, ultra-wide for banners. Rendered straight from the shader, never upscaled."
          className="md:col-span-7 md:h-[600px]"
        >
          <Ratios stills={stills} />
        </Card>
        <Card
          index="02 · Loops"
          title="Video that never jumps"
          body="MP4, WebM or AV1, rendered frame by frame. The end fades into the start, so it loops forever."
          className="md:col-span-5 md:h-[600px]"
          delay={0.12}
        >
          {loop && <LiveLook look={loop} className="absolute inset-0 h-full w-full" />}
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/55 p-4 backdrop-blur-md">
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
        </Card>
        <Card
          index="03 · Code"
          title="Paste it into your site"
          body="Framer, React or plain HTML. One self-contained file, about 20 kB, that keeps animating."
          className="md:col-span-5 md:h-[520px]"
        >
          <Typing />
        </Card>
        <Card
          index="04 · Formats"
          title="Seven ways out"
          body="Stills, three video codecs and three kinds of live embed, all from the same design."
          className="md:col-span-7 md:h-[520px]"
          delay={0.12}
        >
          <Formats />
        </Card>
      </div>
    </section>
  );
}
