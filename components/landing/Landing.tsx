"use client";

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { MotionConfig } from "motion/react";
import { useEffect, useState, type CSSProperties } from "react";
import type { CuratedLook } from "@/lib/studio/looks";
import CurtainFooter from "./CurtainFooter";
import { freshLooks } from "./fresh";
import Drift from "./Drift";
import Exports from "./Exports";
import Finale from "./Finale";
import Hero from "./Hero";
import Manifesto from "./Manifesto";
import Nav from "./Nav";
import Principles from "./Principles";
import Recipe, { randomStory } from "./Recipe";
import StudioWindow from "./StudioWindow";
import { useLookImages } from "./useLookImages";

// Warm charcoal and bone, with one ember accent.
const THEME = {
  "--ink": "#0d0c0b",
  "--surface": "#171512",
  "--bone": "#ede7dc",
  "--dim": "#8f887d",
  "--ember": "#ff5a2c",
} as CSSProperties;

const STORY_PX = 1600;
/** Stills for the hero field, the drift rows, the swatches and the export demos. */
const STILLS = 14;
const EMPTY: CuratedLook[] = [];

type Fresh = { gallery: CuratedLook[]; story: CuratedLook[]; window: CuratedLook; loop: CuratedLook };

export default function Landing() {
  // One render queue for every still on the page, gallery first.
  // Every visit draws different designs from the whole gallery, with fresh
  // seeds. Picked after mount so the prerendered page stays stable; nothing
  // is rendered until they exist.
  const [fresh, setFresh] = useState<Fresh | null>(null);
  useEffect(() => {
    const picks = freshLooks(STILLS + 2);
    setFresh({
      gallery: picks.slice(0, STILLS),
      story: randomStory(),
      window: picks[STILLS],
      loop: picks[STILLS + 1],
    });
  }, []);
  const looks = fresh?.gallery ?? EMPTY;
  const gallery = useLookImages(fresh?.gallery ?? EMPTY);
  // The layer plate fills half the screen, so it gets a much larger render.
  const story = useLookImages(fresh?.story ?? EMPTY, STORY_PX);

  return (
    <ReactLenis root options={{ lerp: 0.085, wheelMultiplier: 0.9 }}>
      <MotionConfig reducedMotion="user">
        <div style={THEME} className="overflow-x-clip bg-[var(--ink)] text-[var(--bone)] selection:bg-[var(--ember)]/40">
          <Nav />
          <CurtainFooter>
            <Hero looks={looks} urls={gallery} windowLook={fresh?.window} />
            <Manifesto chips={[gallery[2], gallery[7], gallery[12]]} />
            <Recipe looks={fresh?.story} urls={story} />
            <Drift looks={looks} urls={gallery} />
            <StudioWindow previewUrl={gallery[10]} />
            <Exports stills={[gallery[1], gallery[0], gallery[5], gallery[8], gallery[11]]} loop={fresh?.loop} />
            <Principles />
            <Finale fill={gallery[4]} />
          </CurtainFooter>
        </div>
      </MotionConfig>
    </ReactLenis>
  );
}
