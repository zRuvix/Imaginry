"use client";

import { useLenis } from "lenis/react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import LaunchButton from "./LaunchButton";
import { Magnetic, useScrollRange } from "./kit";

/**
 * The closing line slides together from both edges as it scrolls up, its
 * second half cut out of a fresh texture that drifts behind the letters.
 */
export default function Finale({ fill }: { fill: string | null }) {
  const lenis = useLenis();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const x1 = useTransform(p, [0, 0.8], ["-18vw", "0vw"]);
  const x2 = useTransform(p, [0, 0.8], ["18vw", "0vw"]);
  const bgPos = useTransform(p, [0, 1], ["0% 20%", "100% 80%"]);
  const ctaOpacity = useScrollRange(p, [0.55, 0.85], [0, 1]);
  const ctaY = useScrollRange(p, [0.55, 0.9], [40, 0]);

  return (
    <section ref={ref} className="relative overflow-x-clip px-4 pb-[14vh] pt-[10vh] md:px-8">
      <h2 className="mx-auto max-w-[1400px] font-display leading-[0.9] tracking-[-0.045em]">
        <motion.span className="block text-[clamp(32px,7vw,150px)] text-[var(--bone)]" style={{ x: x1 }}>
          Your next
        </motion.span>
        <motion.span className="block text-right text-[clamp(32px,7vw,150px)] text-[var(--bone)]" style={{ x: x2 }}>
          background
        </motion.span>
        <motion.span
          className={`block pb-[0.06em] text-[clamp(32px,7vw,150px)] ${fill ? "bg-clip-text text-transparent" : "text-[var(--ember)]"}`}
          style={{
            x: x1,
            backgroundImage: fill ? `url(${fill})` : undefined,
            backgroundSize: "160% auto",
            backgroundPosition: bgPos,
          }}
        >
          is one drag away
        </motion.span>
      </h2>

      <motion.div
        className="mx-auto mt-12 flex max-w-[1400px] flex-col gap-6 md:mt-16 md:flex-row md:items-center md:justify-between"
        style={{ opacity: ctaOpacity, y: ctaY }}
      >
        <p className="max-w-[380px] text-[16px] leading-relaxed text-[var(--bone)]/60">
          Open a blank canvas, or remix any design from the gallery. Free, in your browser, nothing to install.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Magnetic>
            <LaunchButton
              variant="orb"
              className="h-16 gap-7 pl-7 text-[16px] bg-[var(--bone)] text-[var(--ink)]"
              iconSize={19}
            />
          </Magnetic>
          <a
            href="#top"
            onClick={(e) => {
              if (!lenis) return;
              e.preventDefault();
              lenis.scrollTo(0, { duration: 2.4 });
            }}
            className="inline-flex h-14 items-center rounded-full px-6 text-[15px] text-[var(--bone)]/70 ring-1 ring-white/15 transition-colors duration-500 hover:bg-white/[0.06] hover:text-[var(--bone)]"
          >
            Back to the top
          </a>
        </div>
      </motion.div>
    </section>
  );
}
