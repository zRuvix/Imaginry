"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { EASE_OUT, MaskLines, Marker } from "./kit";

const ABOUT = [
  {
    title: "A design tool, not an AI",
    body: "Every texture is drawn by hand-written shader effects (gradients, glass, grain, light) running on your GPU. There are no AI models, no image generation from prompts, and nothing that creates or edits pictures of people.",
  },
  {
    title: "Your photos stay with you",
    body: "A photo you drop into the studio is opened in your browser and never uploaded. We don’t host user images. Share links carry only effect and layer settings, never an image.",
  },
  {
    title: "Optional Google sign-in",
    body: "Signing in with Google only identifies your account (name, email, profile picture). We use no other Google APIs, and Google data is never used for AI or to make images.",
  },
];

/** Plain statement of what Imaginry is and isn't, for people and reviewers alike. */
export default function Principles() {
  return (
    <section id="about" className="relative mx-auto max-w-[1400px] px-4 pb-[16vh] md:px-8">
      <div className="grid gap-6 md:grid-cols-12">
        <Marker n="06" className="md:col-span-3 md:pt-4">
          About Imaginry
        </Marker>
        <div className="md:col-span-9">
          <h2 className="font-display text-[clamp(30px,3.8vw,62px)] leading-[1] tracking-[-0.03em] text-[var(--bone)]">
            <MaskLines lines={["A free browser studio for", "abstract backgrounds", "and textures"]} />
          </h2>
          <p className="mt-6 max-w-[560px] text-[16px] leading-relaxed text-[var(--bone)]/60">
            Layer effects, tweak them live, then export a PNG, a looping video or embed code for websites, slides and
            social posts.
          </p>
        </div>
      </div>

      <ol className="mt-[9vh]">
        {ABOUT.map((item, i) => (
          <motion.li
            key={item.title}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            className="group relative grid gap-3 py-8 md:grid-cols-12 md:gap-8 md:py-10"
          >
            {/* The rule draws itself in above each row */}
            <motion.span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px origin-left bg-white/15"
              variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.4, ease: EASE_OUT } } }}
            />
            <motion.span
              className="font-display text-[clamp(40px,4vw,64px)] leading-none tracking-[-0.04em] text-[var(--bone)]/20 transition-colors duration-700 group-hover:text-[var(--ember)] md:col-span-3"
              variants={{ hidden: { opacity: 0, x: -30 }, show: { opacity: 1, x: 0, transition: { duration: 1, delay: 0.1, ease: EASE_OUT } } }}
            >
              0{i + 1}
            </motion.span>
            <motion.h3
              className="font-display text-[clamp(22px,2.2vw,34px)] leading-[1.05] tracking-[-0.025em] text-[var(--bone)] md:col-span-4"
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.18, ease: EASE_OUT } } }}
            >
              {item.title}
            </motion.h3>
            <motion.p
              className="text-[15.5px] leading-relaxed text-[var(--bone)]/60 md:col-span-5"
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.26, ease: EASE_OUT } } }}
            >
              {item.body}
            </motion.p>
          </motion.li>
        ))}
      </ol>
      <p className="border-t border-white/10 pt-6 text-[14px] text-[var(--dim)] md:pl-[25%]">
        Sexual, explicit or non-consensual imagery is not allowed. See our{" "}
        <Link href="/terms#acceptable-use" className="underline underline-offset-4 hover:text-[var(--bone)]">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-[var(--bone)]">
          privacy policy
        </Link>
        .
      </p>
    </section>
  );
}
