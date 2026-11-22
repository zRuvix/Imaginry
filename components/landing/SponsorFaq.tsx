"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { PLANS } from "@/lib/sponsors";
import { EASE_ENTER } from "./enterTiming";

/**
 * The sponsor FAQ as a bento: five answers in tiles of different sizes, each
 * with a small visual that shows the answer. A tile wipes in from the right
 * when it reaches the screen, then its question rises out of a mask and the
 * answer settles out of a soft blur. Small loops run inside two tiles.
 */
export default function SponsorFaq() {
  return (
    <div className="grid gap-2 sm:gap-3 lg:auto-rows-[minmax(230px,auto)] lg:grid-cols-12">
      <Tile i={0} className="lg:col-span-7 lg:row-span-2" tone="photo"
        label="Placement"
        q="Where exactly does my brand show?"
        a="In the studio's top bar on every plan: a chip with your logo and name that links to your site. Gallery feature adds a design in your palette, pinned first in the gallery. Spotlight adds a landing page card and keeps the bar to yourself."
        visual={<StudioBar />}
      />
      <Tile i={1} className="lg:col-span-5" tone="dark"
        label="Timing"
        q="When does it go live?"
        a="Pick a start date when you book. Send a square SVG or PNG logo, your name and link, and it goes live that day."
        visual={<Week />}
      />
      <Tile i={2} className="lg:col-span-5" tone="light"
        label="Changes"
        q="Can I change my link or logo mid-run?"
        a="Yes. Send the new one over and it's swapped in, no extra charge."
        visual={<SwapLink />}
      />
      <Tile i={3} className="lg:col-span-5" tone="sky"
        label="Tracking"
        q="Are the links tracked?"
        a="Links go straight to your site, marked as sponsored. Add your own UTM tags to measure them in your analytics."
        visual={<Utm />}
      />
      <Tile i={4} className="lg:col-span-7" tone="light"
        label="Billing"
        q="Weekly or monthly?"
        a="Weekly suits a launch. Monthly costs noticeably less per week if you want steady presence."
        visual={<PerWeek />}
      />
    </div>
  );
}

/** Whether the surrounding tile has been revealed, for visuals that animate with it. */
const Revealed = createContext(false);

const TONES = {
  photo: "bg-[#141414] text-white",
  dark: "bg-[#141414] text-white",
  light: "bg-[#f6f7f8] text-[#121416]",
  sky: "bg-[#dfeaf5] text-[#121416]",
} as const;

function Tile({
  i,
  className,
  tone,
  label,
  q,
  a,
  visual,
}: {
  i: number;
  className: string;
  tone: keyof typeof TONES;
  label: string;
  q: string;
  a: string;
  visual: ReactNode;
}) {
  // Watch an unclipped wrapper: browsers count a clip-path when deciding what's on
  // screen, so a tile that starts fully clipped would never be "seen" and never reveal.
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.2 });
  const still = useReducedMotion();
  const on = seen || !!still;
  const dark = tone === "photo" || tone === "dark";
  const delay = (i % 3) * 0.08;

  return (
    <div ref={ref} className={`flex ${className}`}>
    <Revealed.Provider value={on}>
    <motion.article
      initial={still ? false : { clipPath: "inset(0% 0% 0% 100% round 22px)" }}
      animate={on ? { clipPath: "inset(0% 0% 0% 0% round 22px)" } : undefined}
      transition={{ duration: 0.95, delay, ease: EASE_ENTER }}
      className={`relative flex min-h-[260px] w-full flex-col overflow-hidden rounded-[22px] p-6 sm:p-7 ${TONES[tone]}`}
    >
      {tone === "photo" ? (
        <motion.div
          className="absolute inset-0"
          initial={still ? false : { scale: 1.12 }}
          animate={on ? { scale: 1 } : undefined}
          transition={{ duration: 1.6, delay, ease: EASE_ENTER }}
        >
          {visual}
        </motion.div>
      ) : (
        <div className="relative order-2 mt-6 flex flex-1 items-end">{visual}</div>
      )}

      <div className={`relative order-1 ${tone === "photo" ? "mt-auto" : ""}`}>
        <p className={`font-outfit text-[12.5px] ${dark ? "text-white/55" : "text-[#7b8188]"}`}>{label}</p>
        <h3 className="mt-2 overflow-hidden pb-[0.08em]">
          <motion.span
            className="font-lexend block text-[clamp(1.5rem,2.2vw,2.1rem)] font-semibold leading-[1.08] tracking-[-0.035em]"
            initial={still ? false : { y: "105%" }}
            animate={on ? { y: "0%" } : undefined}
            transition={{ duration: 0.8, delay: delay + 0.25, ease: EASE_ENTER }}
          >
            {q}
          </motion.span>
        </h3>
        <motion.p
          className={`font-outfit mt-3 max-w-[52ch] text-[15px] leading-relaxed ${dark ? "text-white/75" : "text-[#4f555b]"}`}
          initial={still ? false : { opacity: 0, y: 28, filter: "blur(6px)" }}
          animate={on ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
          transition={{ duration: 0.9, delay: delay + 0.35, ease: EASE_ENTER }}
        >
          {a}
        </motion.p>
      </div>
    </motion.article>
    </Revealed.Provider>
    </div>
  );
}

/** Ticks through `n` states every `ms` while the tile is on screen, unless motion is reduced. */
function useCycle(n: number, ms: number) {
  const [k, setK] = useState(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setK((v) => (v + 1) % n), ms);
    return () => clearInterval(t);
  }, [n, ms, still]);
  return k;
}

/** The studio's top bar, zoomed on the sponsor slot, under a dark fade for the copy. */
function StudioBar() {
  return (
    <>
      <Image
        src="/landing/studio.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="object-cover object-[78%_0%] [transform:scale(1.9)] [transform-origin:78%_0%]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,#141414_30%,rgba(20,20,20,0.55)_60%,rgba(20,20,20,0.1))]" />
      <span className="font-outfit absolute right-6 top-6 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#141414] shadow-[0_0_0_4px_rgba(255,255,255,0.18)]">
        Your brand here
      </span>
    </>
  );
}

/** A week of days; the start day walks along it. */
function Week() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const k = useCycle(days.length, 1400);
  return (
    <div className="grid w-full grid-cols-7 gap-1.5">
      {days.map((d, i) => (
        <div key={d} className="relative flex h-16 flex-col items-center justify-center rounded-[12px] bg-white/[0.06]">
          {i === k && (
            <motion.span layoutId="start-day" transition={{ duration: 0.45, ease: EASE_ENTER }} className="absolute inset-0 rounded-[12px] bg-white" />
          )}
          <span className={`font-outfit relative text-[11px] ${i === k ? "text-[#141414]" : "text-white/50"}`}>{d}</span>
          <span className={`font-outfit relative mt-0.5 text-[12px] font-semibold ${i === k ? "text-[#141414]" : "text-white/80"}`}>{i === k ? "Live" : i + 1}</span>
        </div>
      ))}
    </div>
  );
}

/** The sponsor chip's link changing in place. */
function SwapLink() {
  const links = ["acme.com/launch", "acme.com/spring-sale", "acme.com/new"];
  const k = useCycle(links.length, 2200);
  return (
    <div className="flex w-full items-center gap-3 rounded-[14px] bg-white p-3 ring-1 ring-black/[0.05]">
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#141414] font-lexend text-[15px] font-semibold text-white">A</span>
      <div className="min-w-0 flex-1">
        <p className="font-outfit text-[13px] font-semibold text-[#141414]">Acme</p>
        <div className="relative h-5 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={k}
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.5, ease: EASE_ENTER }}
              className="font-mono truncate text-[12.5px] text-[#6b7075]"
            >
              {links[k]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      <span className="font-outfit rounded-md bg-[#eef2ea] px-2 py-1 text-[11.5px] font-medium text-[#4d6b2f]">Swapped</span>
    </div>
  );
}

/** A sponsored link with your own UTM tags on it. */
function Utm() {
  return (
    <div className="w-full rounded-[14px] bg-white p-3 ring-1 ring-black/[0.05]">
      <p className="font-mono break-all text-[12.5px] leading-relaxed text-[#6b7075]">
        acme.com<span className="rounded bg-[#ffe6dc] px-1 text-[#c2410c]">?utm_source=imaginry</span>
        <span className="rounded bg-[#e3ecff] px-1 text-[#3b5bdb]">&utm_medium=sponsor</span>
      </p>
      <div className="mt-2.5 flex gap-1.5">
        <span className="font-mono rounded-md bg-[#f3f4f5] px-2 py-1 text-[11.5px] text-[#141414]">rel=&quot;sponsored&quot;</span>
        <span className="font-mono rounded-md bg-[#f3f4f5] px-2 py-1 text-[11.5px] text-[#141414]">no redirect</span>
      </div>
    </div>
  );
}

/** Price per week, weekly against monthly, for each plan. Bars fill when seen. */
function PerWeek() {
  const seen = useContext(Revealed);
  const max = Math.max(...PLANS.map((p) => p.price.weekly));
  return (
    <div className="w-full space-y-3">
      {PLANS.map((p, i) => {
        const monthlyPerWeek = p.price.monthly / 4.33;
        return (
          <div key={p.id} className="grid grid-cols-[96px_1fr] items-center gap-3 sm:grid-cols-[120px_1fr]">
            <span className="font-outfit truncate text-[13px] font-medium text-[#141414]">{p.name}</span>
            <div className="space-y-1">
              {[
                { v: p.price.weekly, label: `$${p.price.weekly} weekly`, cls: "bg-[#c9ced3]" },
                { v: monthlyPerWeek, label: `$${monthlyPerWeek.toFixed(2)} a week, monthly`, cls: "bg-[#141414]" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <span
                    className={`block h-2.5 shrink-0 origin-left rounded-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${b.cls}`}
                    style={{ width: `${(b.v / max) * 70}%`, transform: `scaleX(${seen ? 1 : 0})`, transitionDelay: `${300 + i * 100}ms` }}
                  />
                  <span className="font-outfit shrink-0 text-[11.5px] text-[#6b7075]">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
