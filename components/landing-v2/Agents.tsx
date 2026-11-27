"use client";

import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { ENDPOINT } from "@/components/landing/AgentsContent";
import { useLookImages } from "@/components/studio/useLookImages";
import { EFFECT_COUNT, EFFECTS_BY_KEY } from "@/lib/studio/effects";
import { GALLERY, stateForLook, type CuratedLook } from "@/lib/studio/looks";
import { PRESETS_BY_ID } from "@/lib/studio/presets";
import { encodeShare } from "@/lib/studio/storage";
import { ChatGPTMark, ClaudeMark, GeminiMark, GrokMark } from "./AppMarks";
import "./figs.css";

const EASE = [0.16, 1, 0.3, 1] as const;
const look = (name: string) => GALLERY.find((l) => l.name === name) ?? GALLERY[0];

/* How each app's chat looks, in its light theme */
type Skin = {
  name: string;
  Mark: ComponentType<{ size?: number; className?: string }>;
  page: string; // window background
  bubble: string; // user message
  composer: string; // input box
  placeholder: string;
  send: string; // send button
  answerMark: boolean; // app shows its mark beside answers
};

const SKINS: Record<string, Skin> = {
  chatgpt: {
    name: "ChatGPT",
    Mark: ChatGPTMark,
    page: "bg-white",
    bubble: "bg-[#f4f4f4] rounded-[22px] px-4 py-2.5",
    composer: "rounded-[28px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_6px_20px_-10px_rgba(0,0,0,0.25)]",
    placeholder: "Ask anything",
    send: "bg-black text-white rounded-full",
    answerMark: false,
  },
  claude: {
    name: "Claude",
    Mark: ClaudeMark,
    page: "bg-[#faf9f5]",
    bubble: "bg-[#f0eee6] rounded-[14px] px-4 py-2.5",
    composer: "rounded-[18px] bg-white shadow-[0_0_0_1px_rgba(31,30,29,0.12),0_4px_16px_-8px_rgba(31,30,29,0.2)]",
    placeholder: "Reply to Claude…",
    send: "bg-[#c96442] text-white rounded-[10px]",
    answerMark: true,
  },
  gemini: {
    name: "Gemini",
    Mark: GeminiMark,
    page: "bg-white",
    bubble: "bg-[#e9eef6] rounded-[20px] rounded-tr-[6px] px-4 py-2.5",
    composer: "rounded-[28px] bg-[#f0f4f9]",
    placeholder: "Ask Gemini",
    send: "bg-transparent text-[#444746] rounded-full",
    answerMark: true,
  },
  grok: {
    name: "Grok",
    Mark: GrokMark,
    page: "bg-white",
    bubble: "bg-[#f3f3f3] rounded-[22px] rounded-br-[6px] px-4 py-2.5",
    composer: "rounded-[26px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)]",
    placeholder: "What do you want to know?",
    send: "bg-black text-white rounded-full",
    answerMark: false,
  },
};

/** One request per app, each answered with a real gallery look. */
const DEMOS = [
  {
    app: "chatgpt",
    prompt: "make a calm blue gradient with fine grain for my login screen",
    look: look("Cobalt Bloom"),
    about: "A soft blue backdrop with slow blobs and a light grain, calm enough to sit behind a form.",
    seconds: 6,
  },
  {
    app: "claude",
    prompt: "something warm that looks like oil paint, for a book cover",
    look: look("Gallery Oil"),
    about: "Warm ember tones pushed around with brush strokes, laid on cotton paper for texture.",
    seconds: 8,
  },
  {
    app: "gemini",
    prompt: "generate a random design",
    look: look("Opal Drift"),
    about: "A randomly picked look: lilac base, an opal sheen and fine grain.",
    seconds: 5,
  },
  {
    app: "grok",
    prompt: "a loud retro background for my podcast art",
    look: look("Corrupted"),
    about: "A full spectrum gradient, broken up with heavy glitch and run through an old CRT.",
    seconds: 7,
  },
] as const;

const layersOf = (l: CuratedLook) =>
  [...l.presets].reverse().map((id) => {
    const key = PRESETS_BY_ID[id]?.section;
    return key ? EFFECTS_BY_KEY[key].label : id;
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* Stages of one exchange; layers each add one stage after CARD */
const SENT = 1;
const WORKING = 2;
const TITLE = 3;
const ABOUT = 4;
const CARD = 5;

/** Plays one exchange: type into the composer, send, work, then stream the answer in. */
function useExchange(index: number, live: boolean, reduce: boolean, onDone: () => void) {
  const demo = DEMOS[index];
  const layers = layersOf(demo.look);
  const last = CARD + layers.length + 1;
  const [chars, setChars] = useState(0);
  const [stage, setStage] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (reduce) {
      setChars(0);
      setStage(last);
      return;
    }
    if (!live) return;
    let off = false;
    (async () => {
      setStage(0);
      setChars(0);
      await sleep(600);
      for (let c = 1; c <= demo.prompt.length && !off; c++) {
        setChars(c);
        await sleep(22 + Math.random() * 34);
      }
      await sleep(350);
      const beats = [SENT, WORKING, TITLE, ABOUT, CARD, ...layers.map((_, k) => CARD + 1 + k), last];
      const waits = [700, 1500, 380, 420, 520, ...layers.map(() => 260), 0];
      for (let b = 0; b < beats.length && !off; b++) {
        setStage(beats[b]);
        await sleep(waits[b]);
      }
      await sleep(4600);
      if (!off) done.current();
    })();
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, live, reduce]);

  return { demo, layers, chars, stage, last };
}

/** Four averaged colours across the rendered look, left to right. */
function usePalette(url: string | null | undefined) {
  const [colors, setColors] = useState<string[] | null>(null);
  useEffect(() => {
    setColors(null);
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 4;
      c.height = 1;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 4, 1);
      const d = ctx.getImageData(0, 0, 4, 1).data;
      setColors([0, 1, 2, 3].map((k) => `rgb(${d[k * 4]} ${d[k * 4 + 1]} ${d[k * 4 + 2]})`));
    };
    img.src = url;
  }, [url]);
  return colors;
}

const rise = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE },
};

/** The app's chat window, light theme, playing one exchange at a time. */
function ChatWindow({ index, live, url, onDone }: { index: number; live: boolean; url: string | null; onDone: () => void }) {
  const reduce = !!useReducedMotion();
  const { demo, layers, chars, stage, last } = useExchange(index, live, reduce, onDone);
  const skin = SKINS[demo.app];
  const palette = usePalette(url);
  const scroller = useRef<HTMLDivElement>(null);
  const typing = stage < SENT;

  // Keep the newest part of the answer in view, like a chat does.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [stage, reduce]);

  return (
    <motion.div
      key={demo.app}
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.985 }}
      transition={{ duration: 0.55, ease: EASE }}
      className={`absolute inset-0 flex flex-col font-sans text-[#0d0d0d] ${skin.page}`}
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}
    >
      {/* App header */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <p className="flex items-center gap-2 text-[15px] font-medium">
          <skin.Mark size={18} />
          {skin.name}
          <svg viewBox="0 0 16 16" className="size-3.5 text-black/40" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>
        <span className="size-7 rounded-full bg-[#e3e6ea]" aria-hidden />
      </div>

      {/* Conversation */}
      <div ref={scroller} className="min-h-0 flex-1 overflow-hidden px-5 sm:px-7">
        <div className="flex flex-col gap-4 pb-4 pt-2">
          {stage >= SENT && (
            <motion.div {...rise} className={`ml-auto max-w-[85%] text-[15px] leading-[1.5] ${skin.bubble}`}>
              <span className="font-medium text-[#1d4fbf]">@Imaginry</span> {demo.prompt}
            </motion.div>
          )}

          {stage >= WORKING && (
            <div className="flex gap-3">
              {skin.answerMark && (
                <span className="mt-0.5 shrink-0">
                  <skin.Mark size={20} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                {stage === WORKING ? (
                  <motion.p {...rise} className="am-shimmer text-[14px]">
                    Using Imaginry…
                  </motion.p>
                ) : (
                  <motion.p {...rise} className="flex items-center gap-1 text-[14px] text-black/45">
                    Worked for {demo.seconds}s
                    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.p>
                )}

                {stage >= TITLE && (
                  <motion.p {...rise} className="mt-2.5 text-[17px] font-semibold tracking-[-0.01em]">
                    {demo.look.name}
                  </motion.p>
                )}
                {stage >= ABOUT && (
                  <motion.p {...rise} className="mt-1.5 text-[14.5px] leading-[1.55] text-black/75">
                    {demo.about}
                  </motion.p>
                )}

                {stage >= CARD && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="mt-3.5 rounded-[16px] bg-white p-3 ring-1 ring-black/10"
                  >
                    <div className="relative h-[clamp(84px,12svh,112px)] overflow-hidden rounded-[10px] bg-[#eef0f3]">
                      {url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <motion.img
                          src={url}
                          alt={`${demo.look.name}: ${demo.look.recipe}`}
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.9, ease: EASE }}
                          className="absolute inset-0 size-full object-cover"
                        />
                      )}
                    </div>
                    <div className="mt-1.5 grid h-5 grid-cols-4 overflow-hidden rounded-[6px]">
                      {(palette ?? ["#eef0f3", "#e6e9ed", "#eef0f3", "#e6e9ed"]).map((c, k) => (
                        <motion.span
                          key={k}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.5, ease: EASE, delay: 0.2 + k * 0.06 }}
                          className="origin-bottom"
                          style={{ background: c }}
                        />
                      ))}
                    </div>

                    <p className="mt-3 text-[13.5px] font-semibold">Design layers</p>
                    <ul className="mt-1.5 space-y-1">
                      {layers.slice(0, Math.max(0, stage - CARD)).map((l) => (
                        <motion.li key={l} {...rise} className="flex items-center gap-2 text-[13.5px] text-black/75">
                          <span className="size-1 rounded-full bg-black/60" />
                          {l}
                        </motion.li>
                      ))}
                    </ul>

                    {stage >= last && (
                      <motion.div {...rise} className="mt-3 grid gap-1.5">
                        <Link
                          href={`/studio#${encodeShare(stateForLook(demo.look))}`}
                          className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#ececec] text-[13px] font-medium transition-colors hover:bg-[#e2e2e2]"
                        >
                          Open design in Imaginry ↗
                        </Link>
                        <span className="flex h-9 items-center justify-center rounded-full text-[13px] font-medium ring-1 ring-black/12">
                          Generate another design
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer: the request types here first */}
      <div className="px-4 pb-4 sm:px-6">
        <div className={`flex min-h-[52px] items-center gap-3 py-2 pl-5 pr-2 ${skin.composer}`}>
          <p className={`min-w-0 flex-1 truncate text-[15px] ${typing && chars ? "text-[#0d0d0d]" : "text-black/40"}`}>
            {typing && chars ? (
              <>
                <span className="font-medium text-[#1d4fbf]">@Imaginry</span> {demo.prompt.slice(0, chars)}
                <span className="ml-px inline-block h-[1.05em] w-px translate-y-[3px] animate-pulse bg-black" />
              </>
            ) : (
              skin.placeholder
            )}
          </p>
          <span className={`grid size-9 shrink-0 place-items-center ${skin.send}`} aria-hidden>
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
            </svg>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function CopyEndpoint() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <div className="flex max-w-full items-center gap-2 rounded-[14px] bg-[#f2f4f7] py-1.5 pl-4 pr-1.5">
      <code className="truncate font-mono text-[13px] text-[#0e1a2b] sm:text-[14px]">{ENDPOINT}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(ENDPOINT);
            setDone(true);
          } catch {}
        }}
        className="blue-button min-h-9 shrink-0 rounded-[10px] px-3.5 text-[13px] font-semibold"
      >
        <span aria-live="polite">{done ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

/**
 * Fourth section: the MCP server, on a white panel. The pitch and server URL
 * sit on the left; on the right the same request is played out in the chat
 * apps people already use, each answering with a real look.
 */
export default function Agents() {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const live = useInView(stage, { margin: "-10% 0px" });
  const near = useInView(stage, { margin: "100% 0px", once: true });
  const [index, setIndex] = useState(0);
  const urls = useLookImages(near ? DEMOS.map((d) => d.look) : [], 480);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.94, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [reduce ? 28 : 48, 28]);

  return (
    <section ref={ref} id="agents" aria-labelledby="agents-heading" className="bg-[#e9eef4] px-2 pb-2">
      <motion.div style={{ scale, borderRadius: radius }} className="relative overflow-hidden bg-white text-[#0e1a2b]">
        <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-12 px-6 py-[clamp(4.5rem,14svh,9rem)] sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, margin: "0px 0px -20% 0px" }}
            transition={{ staggerChildren: 0.09 }}
          >
            <h2
              id="agents-heading"
              className="font-figtree text-[clamp(2.4rem,min(4.6vw,8.5svh),4.75rem)] font-medium leading-[1] tracking-[-0.05em]"
            >
              {["Let your agent", "paint it for you."].map((line, li) => (
                <span key={line} className={`block overflow-clip pb-[0.08em] [overflow-clip-margin:0.1em] ${li ? "text-[#0e1a2b]/30" : ""}`}>
                  <motion.span className="block" variants={{ hidden: { y: "110%" }, shown: { y: 0 } }} transition={{ duration: 1, ease: EASE }}>
                    {line}
                  </motion.span>
                </span>
              ))}
            </h2>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.9, ease: EASE }}
              className="mt-7 max-w-[44ch] text-[clamp(1rem,1.2vw,1.1rem)] font-light leading-[1.6] text-[#0e1a2b]/70"
            >
              Add one URL to the chat app you already use. Ask in plain words, and it builds the background from the same {EFFECT_COUNT} effects as the studio, then hands back a link or embed code.
            </motion.p>

            <motion.div variants={{ hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }} transition={{ duration: 0.9, ease: EASE }} className="mt-8 max-w-[460px]">
              <CopyEndpoint />
            </motion.div>

            {/* App switcher: follows the demo, and picks it when clicked */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.9, ease: EASE }}
              role="tablist"
              aria-label="Chat app"
              className="mt-8 flex flex-wrap gap-2"
            >
              {DEMOS.map((d, i) => {
                const s = SKINS[d.app];
                const on = i === index;
                return (
                  <button
                    key={d.app}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setIndex(i)}
                    className={`relative flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[14px] transition-colors duration-300 ${
                      on ? "text-[#0e1a2b]" : "text-[#0e1a2b]/55 hover:text-[#0e1a2b]"
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId="agent-app"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-[#f2f4f7] ring-1 ring-black/[0.06]"
                      />
                    )}
                    <span className={`relative transition-[filter,opacity] duration-300 ${on ? "" : "opacity-60 grayscale"}`}>
                      <s.Mark size={18} />
                    </span>
                    <span className="relative">{s.name}</span>
                  </button>
                );
              })}
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }} transition={{ duration: 0.9, ease: EASE }} className="mt-9">
              <Link href="/#agents" className="group inline-flex items-center gap-1.5 text-[15px] font-medium">
                Setup for your app
                <span className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">→</span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            ref={stage}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
            className="relative h-[clamp(560px,76svh,660px)] overflow-hidden rounded-[22px] bg-white shadow-[0_0_0_1px_rgba(14,26,43,0.08),0_30px_80px_-30px_rgba(14,26,43,0.35)]"
          >
            <AnimatePresence initial={false}>
              <ChatWindow
                key={index}
                index={index}
                live={live}
                url={urls[index] ?? null}
                onDone={() => setIndex((n) => (n + 1) % DEMOS.length)}
              />
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
