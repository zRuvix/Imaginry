"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { renderLookUrl, useLookImages } from "@/components/studio/useLookImages";
import { EFFECTS_BY_KEY } from "@/lib/studio/effects";
import { GALLERY, GALLERY_TAGS, stateForLook, type CuratedLook, type GalleryTag } from "@/lib/studio/looks";
import { PRESETS_BY_ID } from "@/lib/studio/presets";
import { encodeShare } from "@/lib/studio/storage";
import { BTN_MOTION } from "./buttonMotion";
import { EASE_ENTER } from "./enterTiming";

const SHOWN = 12;

/** A look's layers, top first, as the studio's Layers panel lists them. */
const layersOf = (look: CuratedLook) =>
  [...look.presets].reverse().map((id) => {
    const key = PRESETS_BY_ID[id]?.section;
    return { id, label: key ? EFFECTS_BY_KEY[key].label : id };
  });

const studioLink = (look: CuratedLook) => `/studio#${encodeShare(stateForLook(look))}`;

/**
 * Light panel that slides up over the pinned features stage: one look shown
 * big with its real layer stack and a Remix button that opens that exact
 * design, beside a picker of looks filtered by mood. Everything renders live
 * on the visitor's GPU, once the panel is close.
 */
export default function LooksGallery() {
  const section = useRef<HTMLElement>(null);
  const near = useNear(section);
  const [tag, setTag] = useState<GalleryTag | null>(null);
  const looks = useMemo(() => (tag ? GALLERY.filter((l) => l.tags?.includes(tag)) : GALLERY).slice(0, SHOWN), [tag]);
  const [picked, setPicked] = useState<CuratedLook>(GALLERY[0]);
  // A filter that hides the picked look moves the pick to its first look.
  const current = looks.includes(picked) ? picked : looks[0];

  return (
    <section ref={section} aria-labelledby="looks-heading" className="relative z-10 -mt-[100svh] px-2 pb-2">
      <div className="overflow-clip rounded-[24px] bg-white px-5 py-[clamp(2.5rem,8svh,5rem)] sm:rounded-[28px] sm:px-8 xl:px-10">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <h2
            id="looks-heading"
            className="font-lexend text-[clamp(2.2rem,min(4.6vw,8svh),5rem)] font-light leading-[1.02] tracking-[-0.045em] text-[#121416]"
          >
            Start from a look.
            <br />
            <span className="text-[#b4b8bc]">Make it yours.</span>
          </h2>
          <div role="radiogroup" aria-label="Mood" className="flex max-w-[780px] flex-wrap gap-1.5 lg:justify-end">
            {[null, ...GALLERY_TAGS].map((t) => {
              const on = t === tag;
              return (
                <button
                  key={t ?? "all"}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setTag(t)}
                  className={`font-outfit min-h-10 rounded-full px-3.5 text-[13.5px] ${BTN_MOTION} ${
                    on ? "bg-[#141414] text-white" : "bg-[#f3f4f5] text-[#3a3d40] hover:bg-[#e9ebed] hover:text-[#141414]"
                  }`}
                >
                  {t ?? `All ${GALLERY.length}`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-[clamp(1.75rem,5svh,3rem)] grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-4">
          <Featured look={current} near={near} />
          <Picker looks={looks} current={current} near={near} onPick={setPicked} />
        </div>
      </div>
    </section>
  );
}

/** The picked look, big, with its name, recipe, layers and a Remix button. */
function Featured({ look, near }: { look: CuratedLook; near: boolean }) {
  const url = useLookStill(near ? look : null);
  const still = useReducedMotion();
  return (
    <div className="relative h-[clamp(380px,62svh,660px)] overflow-hidden rounded-[22px] bg-[#e9ebed]">
      <AnimatePresence initial={false}>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <motion.img
            key={url}
            src={url}
            alt={`${look.name}: ${look.recipe}`}
            className="absolute inset-0 size-full object-cover"
            initial={still ? false : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE_ENTER }}
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-x-3 bottom-3 flex flex-col gap-3 rounded-[18px] bg-white/80 p-4 shadow-[0_10px_30px_-12px_rgba(20,30,40,0.35)] backdrop-blur-xl sm:inset-x-auto sm:left-4 sm:bottom-4 sm:w-[340px] sm:p-5">
        {/* Keyed, enter-only: a fast sweep over the picker can't leave the card blank. */}
        <motion.div
            key={look.name}
            initial={still ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_ENTER }}
          >
            <p className="font-lexend text-[22px] font-light leading-tight tracking-[-0.03em] text-[#121416]">{look.name}</p>
            <p className="font-outfit mt-0.5 text-[13px] text-[#6b7075]">{look.recipe}</p>
            <ol className="mt-3 space-y-1" aria-label="Layers, top first">
              {layersOf(look).map((l, i) => (
                <li key={l.id} className="flex items-center gap-2.5 rounded-[9px] bg-white/80 px-2.5 py-1.5 ring-1 ring-black/[0.04]">
                  <span className="font-mono w-4 text-[10.5px] text-[#a3a8ad]">{i + 1}</span>
                  <span className="font-outfit flex-1 truncate text-[13px] text-[#141414]">{l.label}</span>
                  <code className="font-mono text-[11px] text-[#7b8188]">{l.id}</code>
                </li>
              ))}
            </ol>
          </motion.div>
        <Link href={studioLink(look)} className="blue-button blue-button-large w-full">
          Remix this look
        </Link>
      </div>
    </div>
  );
}

/** The looks to pick from: hover (or tap) one to feature it. */
function Picker({ looks, current, near, onPick }: { looks: CuratedLook[]; current: CuratedLook; near: boolean; onPick: (l: CuratedLook) => void }) {
  const urls = useLookImages(near ? looks : [], 360);
  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4" aria-label="Looks">
        {looks.map((l, i) => {
          const on = l === current;
          return (
            <li key={l.name}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`${l.name}: ${l.recipe}`}
                onClick={() => onPick(l)}
                onMouseEnter={() => {
                  if (matchMedia("(hover: hover) and (pointer: fine)").matches) onPick(l);
                }}
                onFocus={() => onPick(l)}
                className={`group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-[14px] bg-[#f3f4f5] transition-[box-shadow,transform] duration-200 active:translate-y-px ${
                  on ? "ring-2 ring-[#2460e8] ring-offset-2" : "hover:ring-2 hover:ring-black/10 hover:ring-offset-2"
                }`}
              >
                {urls[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urls[i]!}
                    alt=""
                    className="absolute inset-0 size-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.06]"
                    style={{ animation: "look-in 0.9s cubic-bezier(0.16,1,0.3,1) both" }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex items-center justify-between gap-3 rounded-[16px] bg-[#f6f7f8] p-4">
        <p className="font-outfit max-w-[30ch] text-[13.5px] leading-relaxed text-[#6b7075]">
          Every look is a stack of live effects. Open one and pull it apart.
        </p>
        <Link
          href="/studio"
          className={`font-outfit inline-flex min-h-11 shrink-0 items-center rounded-[12px] bg-white px-4 text-[14px] font-semibold text-[#141414] ring-1 ring-black/[0.08] hover:bg-[#fbfbfc] ${BTN_MOTION}`}
        >
          All looks
        </Link>
      </div>
    </div>
  );
}

/** One look rendered big (960px long side), once; picks seen before come back instantly. */
function useLookStill(look: CuratedLook | null) {
  const cache = useRef(new Map<string, string>());
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!look) return;
    const hit = cache.current.get(look.name);
    if (hit) return setUrl(hit);
    let live = true;
    // Short wait so sweeping the pointer across the picker doesn't render every look on the way.
    const t = setTimeout(async () => {
      const made = await renderLookUrl(look, 960).catch(() => null);
      if (!made) return;
      cache.current.set(look.name, made);
      if (live) setUrl(made);
    }, 120);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [look]);
  useEffect(() => {
    const made = cache.current;
    return () => made.forEach((u) => URL.revokeObjectURL(u));
  }, []);
  return url;
}

/** True once the element is within a screen of the viewport, so WebGL renders don't compete with the hero. */
function useNear(ref: React.RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, near]);
  return near;
}
