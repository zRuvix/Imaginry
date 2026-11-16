"use client";

import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import "lenis/dist/lenis.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { freshLooks } from "@/components/landing/fresh";
import { useLookImages } from "@/components/landing/useLookImages";
import type { CuratedLook } from "@/lib/studio/looks";
import Closing from "./Closing";
import Exports from "./Exports";
import FreshScene from "./FreshScene";
import Hero from "./Hero";
import HomeNav from "./HomeNav";
import LayersScene, { randomStory } from "./LayersScene";
import LiveScene from "./LiveScene";
import Privacy from "./Privacy";
import { gsap, ScrollTrigger, useReveals } from "./scene";

/** Cards in the "fresh off the GPU" grid. */
const CARDS = 8;
/** Long side of the layer plates, which fill half the screen. */
const STORY_PX = 1200;
/** Long side of the one card the gallery scene starts inside. */
const FOCUS_PX = 1440;
const EMPTY: CuratedLook[] = [];

type Fresh = { gallery: CuratedLook[]; story: CuratedLook[]; live: CuratedLook; loop: CuratedLook };

/** Tells the scroll scenes about every smoothed scroll step, so scrubbed motion stays in step with the page. */
function ScrollSync() {
  useLenis(() => ScrollTrigger.update());
  return null;
}

/**
 * The homepage. Every picture on it is drawn by the visitor's GPU after the
 * page loads: different designs with fresh seeds on every visit, picked
 * after mount so the prerendered markup stays stable.
 */
export default function Home() {
  const [fresh, setFresh] = useState<Fresh | null>(null);
  useEffect(() => {
    const picks = freshLooks(CARDS + 2);
    setFresh({ gallery: picks.slice(0, CARDS), story: randomStory(), live: picks[CARDS], loop: picks[CARDS + 1] });
  }, []);

  const looks = fresh?.gallery ?? EMPTY;
  const focusLook = useMemo(() => (fresh ? [{ ...fresh.gallery[1], name: `Focus ${fresh.gallery[1].name}` }] : EMPTY), [fresh]);
  const story = useLookImages(fresh?.story ?? EMPTY, STORY_PX);
  const gallery = useLookImages(looks);
  const focus = useLookImages(focusLook, FOCUS_PX);

  useReveals();

  // Smooth scrolling runs on GSAP's clock, the same one the scroll scenes use.
  const lenis = useRef<LenisRef>(null);
  useEffect(() => {
    const tick = (time: number) => lenis.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  // Scene positions depend on the display face's metrics.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ReactLenis root ref={lenis} options={{ autoRaf: false, lerp: 0.1, anchors: true }}>
      <ScrollSync />
      <HomeNav />
      <main className="home home-main overflow-x-clip">
        <Hero look={fresh?.live} />
        <LiveScene look={fresh?.live} />
        <LayersScene looks={fresh?.story} urls={story} />
        <FreshScene looks={looks} urls={gallery} focusUrl={focus[0] ?? null} />
        <Exports stills={[gallery[0], gallery[2], gallery[3], gallery[5]]} loop={fresh?.loop} />
        <Privacy />
      </main>
      <Closing fill={gallery[4] ?? null} />
    </ReactLenis>
  );
}
