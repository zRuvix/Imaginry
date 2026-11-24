import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

/** Sky over a grassy hill rising to the right; 1536×1024. */
const PHOTO = "/landing/hero.webp";

/**
 * Alpha mask of the photo's grass, cut pixel by pixel from the photo itself,
 * blade tips included, so no pale sky ever lies over the screenshot.
 */
const GRASS_MASK = 'url("/landing/hero-grass-mask.png")';

/**
 * A box shaped like the photo that covers the hero, pinned bottom-centre:
 * full width on wide screens, full hero height on tall ones. Both layers use
 * it so the grass cut-out lines up with the photo underneath.
 */
function PhotoBox({ children, style, className = "" }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute left-1/2 aspect-[3/2] w-[max(100%,calc((100svh-16px)*1.5))] -translate-x-1/2 ${className}`}
      // On wide, short screens the photo is taller than the hero; spend up to
      // 9rem of that spare sky sinking the hill so the grass doesn't eat the screenshot.
      style={{ bottom: "calc(-1 * clamp(0px, (min(100vw, var(--frame)) - 16px) / 1.5 - (100svh - 16px), 9rem))", ...style }}
    >
      {children}
    </div>
  );
}

/** The full photo behind everything. */
export function HeroSky() {
  return (
    <PhotoBox>
      <Image src={PHOTO} alt="" fill priority sizes="max(100vw, 150svh)" className="object-cover" />
    </PhotoBox>
  );
}

/** The same photo masked to its grass, laid over the product card. */
export function HeroHill() {
  return (
    <PhotoBox
      className="z-10"
      style={{ maskImage: GRASS_MASK, maskSize: "100% 100%", WebkitMaskImage: GRASS_MASK, WebkitMaskSize: "100% 100%" }}
    >
      <Image src={PHOTO} alt="" fill sizes="max(100vw, 150svh)" className="object-cover" />
    </PhotoBox>
  );
}
