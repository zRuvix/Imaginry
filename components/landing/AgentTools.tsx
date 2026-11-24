"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { useLookImages } from "@/components/studio/useLookImages";
import { EFFECT_COUNT, EFFECTS_BY_KEY } from "@/lib/studio/effects";
import { GALLERY, type CuratedLook } from "@/lib/studio/looks";
import { PRESETS_BY_ID } from "@/lib/studio/presets";
import { SITE_URL } from "@/lib/seo";
import { EASE_ENTER } from "./enterTiming";

const HOST = SITE_URL.replace(/^https?:\/\/(www\.)?/, "");
const look = (name: string) => GALLERY.find((l) => l.name === name)!;
const tagged = (tag: string) => GALLERY.filter((l) => l.tags?.includes(tag as never)).slice(0, 3);

const BUILT = look("Ember Reeds");
const RANDOM = tagged("Neon");
const WARM = tagged("Warm");
const READ = look("Cobalt Bloom");
const EXPORTED = look("Gold Dust");
const RENDERED: CuratedLook[] = [...new Map([BUILT, ...RANDOM, ...WARM, READ, EXPORTED].map((l) => [l.name, l])).values()];

type Tool = {
  names: string[];
  title: string;
  body: string;
  ask: string;
  call: string;
  result: (img: (l: CuratedLook) => string | null) => ReactNode;
};

const GLASS = EFFECTS_BY_KEY.glass;

const TOOLS: Tool[] = [
  {
    names: ["create_design"],
    title: "Build a design",
    body: "Stacks presets and settings into layers and returns a link that opens in the studio.",
    ask: "Something warm, through fluted glass, with fine grain.",
    call: `create_design({ layers: [${[...BUILT.presets].reverse().map((p) => `{ use: "${p}" }`).join(", ")}] })`,
    result: (img) => (
      <div className="space-y-2.5">
        <Still src={img(BUILT)} className="aspect-[3/1]" />
        <LinkRow text={`${HOST}/studio#…`} label="Opens in the studio" />
      </div>
    ),
  },
  {
    names: ["random_design"],
    title: "Surprise me",
    body: "A random background like the studio’s R key, kept to a palette or a kind of effect if you like.",
    ask: "Surprise me with three neon ones.",
    call: `random_design({ colors: ["#0a0014", "#ff00aa", "#00ffd5"] }) ×3`,
    result: (img) => (
      <div className="grid grid-cols-3 gap-2">
        {RANDOM.map((l, i) => (
          <div key={l.name} className="space-y-1.5">
            <Still src={img(l)} className={`aspect-square ${i === 1 ? "ring-2 ring-[#2460e8] ring-offset-2" : ""}`} />
            <p className="font-outfit truncate text-[11.5px] text-[#6b7075]">{i === 1 ? "Picked" : `Option ${i + 1}`}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    names: ["list_looks"],
    title: "Start from a look",
    body: "The gallery’s premade designs by mood, each ready to remix.",
    ask: "Which looks would suit a warm podcast cover?",
    call: `list_looks({ tag: "Warm" })`,
    result: (img) => (
      <ul className="space-y-1.5">
        {WARM.map((l) => (
          <li key={l.name} className="flex items-center gap-3 rounded-[12px] bg-[#f6f7f8] p-1.5 pr-3">
            <Still src={img(l)} className="size-11 shrink-0 rounded-[8px]" />
            <div className="min-w-0">
              <p className="font-outfit truncate text-[13.5px] font-medium text-[#141414]">{l.name}</p>
              <p className="font-outfit truncate text-[12px] text-[#7b8188]">{l.recipe}</p>
            </div>
          </li>
        ))}
      </ul>
    ),
  },
  {
    names: ["list_effects", "get_effect"],
    title: "Know every effect",
    body: `All ${EFFECT_COUNT} effects with their settings, ranges and presets, so the agent picks real values.`,
    ask: "What can the glass effect do?",
    call: `get_effect({ effect: "glass" })`,
    result: () => (
      <div className="rounded-[12px] bg-[#f6f7f8] p-3">
        <p className="font-outfit text-[13.5px] font-medium text-[#141414]">{GLASS.label}</p>
        <p className="font-outfit text-[12px] text-[#7b8188]">{GLASS.blurb}</p>
        <ul className="mt-3 space-y-2">
          {GLASS.controls
            .filter((c) => c.type === "slider")
            .slice(0, 4)
            .map((c, i) => (
              <li key={c.key} className="grid grid-cols-[84px_1fr_auto] items-center gap-2.5">
                <span className="font-outfit text-[12px] text-[#3a3d40]">{c.label}</span>
                <span className="relative h-1.5 rounded-full bg-white ring-1 ring-black/[0.06]">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-[#2460e8]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${[38, 64, 45, 22][i]}%` }}
                    transition={{ duration: 0.7, delay: 0.45 + i * 0.06, ease: EASE_ENTER }}
                  />
                </span>
                <span className="font-mono text-[11px] text-[#7b8188]">{c.type === "slider" ? `${c.min} – ${c.max}` : ""}</span>
              </li>
            ))}
        </ul>
      </div>
    ),
  },
  {
    names: ["read_design"],
    title: "Edit a link",
    body: "Turns any studio or short link back into layers the agent can change.",
    ask: "Take this link and make it warmer.",
    call: `read_design({ design: "${HOST}/s/…" })`,
    result: (img) => (
      <div className="flex gap-3">
        <Still src={img(READ)} className="aspect-square w-[34%] shrink-0" />
        <ol className="min-w-0 flex-1 space-y-1.5">
          {READ.presets
            .slice()
            .reverse()
            .map((id) => (
              <li key={id} className="flex items-center justify-between gap-2 rounded-[10px] bg-[#f6f7f8] px-3 py-2">
                <span className="font-outfit truncate text-[13px] text-[#141414]">{PRESETS_BY_ID[id] ? EFFECTS_BY_KEY[PRESETS_BY_ID[id].section].label : id}</span>
                <code className="font-mono shrink-0 text-[11px] text-[#7b8188]">{id}</code>
              </li>
            ))}
        </ol>
      </div>
    ),
  },
  {
    names: ["render_png", "get_embed_code"],
    title: "Export it",
    body: "A PNG up to 2048px the agent can see, or HTML and React that draw the design live.",
    ask: "Send me a PNG, and React code for the site.",
    call: `render_png({ width: 2048, height: 1152 }), get_embed_code({ format: "react" })`,
    result: (img) => (
      <div className="grid grid-cols-[1fr_1.2fr] gap-2">
        <div className="relative">
          <Still src={img(EXPORTED)} className="aspect-[16/9] h-full" />
          <span className="font-outfit absolute bottom-1.5 left-1.5 rounded-[6px] bg-white/90 px-1.5 py-0.5 text-[10.5px] text-[#141414]">2048 × 1152</span>
        </div>
        <pre className="font-mono overflow-hidden rounded-[10px] bg-[#141414] p-2.5 text-[10.5px] leading-[1.6] text-white/75">
          {'"use client";\nimport { useEffect, useRef }\n  from "react";\n\nexport default function…'}
        </pre>
      </div>
    ),
  },
];

/** The agent's tools as a compact grid; the picked one's request, call and result play in the window. */
export default function AgentTools() {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  // Render the looks on the visitor's GPU only once the section is close.
  const near = useInView(root, { once: true, margin: "600px 0px" });
  const urls = useLookImages(near ? RENDERED : []);
  const img = (l: CuratedLook) => urls[RENDERED.indexOf(l)] ?? null;
  const tool = TOOLS[active];

  return (
    <div ref={root} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-4">
      <div className="flex flex-col">
        <h2 id="tools-h" className="font-lexend text-[clamp(1.75rem,min(3vw,6svh),2.75rem)] font-light leading-[1.05] tracking-[-0.04em] text-[#121416]">
          Eight tools, one studio behind them
        </h2>
        <p className="font-outfit mt-3 max-w-[46ch] text-[14.5px] leading-relaxed text-[#6b7075]">
          The same {EFFECT_COUNT} effects and presets as the studio, so what your agent makes opens and edits like your own work.
        </p>

        <div role="tablist" aria-label="Tools" className="mt-6 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {TOOLS.map((t, i) => {
            const on = i === active;
            return (
              <button
                key={t.title}
                type="button"
                role="tab"
                id={`tool-${i}`}
                aria-selected={on}
                aria-controls="tool-window"
                onClick={() => setActive(i)}
                onMouseEnter={() => {
                  // A fine pointer previews on hover; touch selects on tap.
                  if (matchMedia("(hover: hover) and (pointer: fine)").matches) setActive(i);
                }}
                className={`flex min-h-[76px] cursor-pointer flex-col justify-between gap-2 rounded-[14px] p-3 text-left transition-colors duration-200 active:translate-y-px ${
                  on ? "bg-[#141414] text-white" : "bg-[#f6f7f8] text-[#121416] hover:bg-[#eef0f2]"
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-outfit text-[14.5px] font-medium leading-tight">{t.title}</span>
                  <span className={`font-mono text-[11px] ${on ? "text-white/45" : "text-[#a3a8ad]"}`}>{String(i + 1).padStart(2, "0")}</span>
                </span>
                <code className={`font-mono truncate text-[11px] ${on ? "text-[#8fb0ff]" : "text-[#7b8188]"}`}>{t.names.join(" · ")}</code>
              </button>
            );
          })}
        </div>

        <p className="font-outfit mt-4 min-h-[3em] max-w-[52ch] text-[14px] leading-relaxed text-[#4f555b]" aria-live="polite">
          {tool.body}
        </p>
      </div>

      <Window id="tool-window" labelledBy={`tool-${active}`}>
        <AnimatePresence mode="wait" initial={false}>
          <Exchange key={active} tool={tool} img={img} />
        </AnimatePresence>
      </Window>
    </div>
  );
}

/** The landing's sky behind a floating white agent window. */
function Window({ id, labelledBy, children }: { id: string; labelledBy: string; children: ReactNode }) {
  return (
    <div className="relative isolate flex items-center justify-center overflow-hidden rounded-[22px] p-3 sm:p-6">
      <Image src="/landing/hero.webp" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="-z-10 object-cover object-top" />
      <div id={id} role="tabpanel" aria-labelledby={labelledBy} className="w-full max-w-[500px] overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(20,30,40,0.06),0_30px_60px_-24px_rgba(20,40,70,0.45)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#e3e5e8]" />
            <span className="size-2.5 rounded-full bg-[#e3e5e8]" />
            <span className="size-2.5 rounded-full bg-[#e3e5e8]" />
          </span>
          <span className="font-outfit flex items-center gap-1.5 text-[12px] text-[#6b7075]">
            <span className="size-1.5 rounded-full bg-[#3fb950]" aria-hidden />
            imaginry connected
          </span>
        </div>
        <div className="h-[316px] p-3.5">{children}</div>
      </div>
    </div>
  );
}

/** One request: the ask, then the tool call, then what came back, each a beat after the last. */
function Exchange({ tool, img }: { tool: Tool; img: (l: CuratedLook) => string | null }) {
  const still = useReducedMotion();
  const beat = (i: number) => ({
    initial: still ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: i * 0.18, ease: EASE_ENTER },
  });
  return (
    <motion.div className="flex h-full flex-col gap-2.5" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
      <motion.p {...beat(0)} className="font-outfit ml-auto max-w-[85%] rounded-[14px] rounded-br-[4px] bg-[#2460e8] px-3.5 py-2 text-[13.5px] leading-snug text-white">
        {tool.ask}
      </motion.p>
      <motion.div {...beat(1)} className="flex items-start gap-2 rounded-[10px] border border-dashed border-black/[0.12] px-3 py-2">
        <span className="font-outfit mt-px shrink-0 rounded-[5px] bg-[#e3ecff] px-1.5 py-px text-[10.5px] font-semibold text-[#2460e8]">tool</span>
        <code className="font-mono line-clamp-2 min-w-0 text-[11.5px] leading-relaxed text-[#3a3d40]">{tool.call}</code>
      </motion.div>
      <motion.div {...beat(2)} className="min-h-0">
        {tool.result(img)}
      </motion.div>
    </motion.div>
  );
}

function Still({ src, className = "" }: { src: string | null; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[12px] bg-[#e9ebed] ${className}`}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      )}
    </div>
  );
}

function LinkRow({ text, label }: { text: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] bg-[#f6f7f8] px-3 py-2">
      <code className="font-mono truncate text-[12px] text-[#141414]">{text}</code>
      <span className="font-outfit shrink-0 text-[11.5px] text-[#2460e8]">{label}</span>
    </div>
  );
}
