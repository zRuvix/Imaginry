"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ScrollTrigger, useReveals } from "./scene";

/** Cards in the "fresh off the GPU" grid. */
const CARDS = 8;
/** Long side of the layer plates, which fill half the screen. */
const STORY_PX = 1200;
/** Long side of the one card the gallery scene starts inside. */
const FOCUS_PX = 1440;
const EMPTY: CuratedLook[] = [];

type Fresh = { gallery: CuratedLook[]; story: CuratedLook[]; live: CuratedLook; loop: CuratedLook };

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

  // Scene positions depend on the display face's metrics.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
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
    </>
  );
}
