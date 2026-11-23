import Link from "next/link";
import Navbar from "./Navbar";
import StudioPreview from "./StudioPreview";
import { HeroHill, HeroSky } from "./HeroSky";
import { EnterFade, EnterLines, EnterSettle } from "./Enter";
import { afterLines } from "./enterTiming";

/**
 * Rounded sky panel, exactly one screen tall: navbar, badge, three-line
 * headline, CTA, and the studio screenshot running down behind the grass,
 * cropped by the panel's bottom edge. Type and spacing follow the screen's
 * height as well as its width, so short and tall displays both fit.
 */
export default function Hero() {
  return (
    <section className="relative isolate flex h-[calc(100svh-16px)] min-h-[520px] flex-col overflow-clip rounded-[24px] sm:rounded-[28px]">
      <HeroSky />
      <Navbar />

      {/* --enter comes from the pinned stage: the hero copy fades out as it shrinks to a sky strip */}
      <div
        className="relative z-[5] flex min-h-0 flex-1 flex-col items-center px-4 pt-[clamp(1.75rem,6svh,3.75rem)] text-center"
        style={{ opacity: "clamp(0, 1 - var(--enter, 0) * 2.2, 1)", translate: "0 calc(var(--enter, 0) * -8%)" }}
      >
        {/* Entrance: the badge comes with the first line, the button as the last line is half way up */}
        <EnterFade>
          <span className="font-outfit inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11.5px] text-[#3a3d40] shadow-[0_1px_2px_rgba(20,30,40,0.08)] xl:px-2.5 xl:py-1.5 xl:text-[13.5px]">
            Free in your browser
            <span className="rounded-[4px] bg-[#141414] px-1.5 py-px text-[10.5px] text-white xl:text-[12.5px]">No sign-up</span>
          </span>
        </EnterFade>

        <EnterLines
          className="font-lexend mt-[clamp(1rem,2.6svh,1.75rem)] text-[clamp(2.1rem,min(6vw,8svh),5.75rem)] font-light leading-[1.02] tracking-[-0.045em] text-[#121416] [text-wrap:balance]"
          lines={["Abstract backgrounds,", "made live in your browser.", "Export in seconds"]}
        />

        <EnterFade delay={afterLines(3)} className="mt-[clamp(1.25rem,3.6svh,2.25rem)]">
          <Link
            href="/studio"
            className="blue-button blue-button-large"
          >
            Open studio
          </Link>
        </EnterFade>

        <EnterSettle className="mt-auto w-full origin-bottom pt-[clamp(1.75rem,5.5svh,3.5rem)] max-sm:pb-[9svh]">
          <StudioPreview />
        </EnterSettle>
      </div>

      <HeroHill />
    </section>
  );
}
