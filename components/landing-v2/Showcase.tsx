"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";
import { Dices, Download, Layers, Play } from "@/components/icons";
import { AgentsFig, ExportFig, LayersFig, MotionFig } from "./Figs";

const EASE = [0.16, 1, 0.3, 1] as const;

const STATEMENT =
  "Every background starts as a blank sky. Stack light, glass, grain and motion on it, watch it change as you drag, and take it home as an image, a loop or live code.";

const FEATURES = [
  { Figure: LayersFig, Icon: Layers, title: "Layers", body: "Gradients, glass, grain and glitch, stacked and blended live." },
  { Figure: MotionFig, Icon: Play, title: "Motion", body: "Every effect can drift, pulse or flow, and loops without a seam." },
  { Figure: ExportFig, Icon: Download, title: "Export", body: "Stills, looping video, or embed code that renders on your site." },
  { Figure: AgentsFig, Icon: Dices, title: "Agents", body: "Point any MCP client at the studio and let your agent design." },
];

/** One word of the statement: dim until the reading line passes it, then full ink. */
function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  const y = useTransform(progress, range, [6, 0]);
  return (
    <motion.span style={{ opacity, y }} className="inline-block">
      {word}&nbsp;
    </motion.span>
  );
}

/** Statement that fills in word by word as it scrolls through the screen. */
function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = STATEMENT.split(" ");

  return (
    <p
      ref={ref}
      className="font-figtree max-w-[30ch] text-[clamp(1.9rem,3.9vw,3.75rem)] font-medium leading-[1.12] tracking-[-0.04em] text-[#0e1a2b]"
    >
      {reduce
        ? STATEMENT
        : words.map((w, i) => (
            <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
          ))}
    </p>
  );
}

/**
 * The studio, set on a stone under the sky. While the block is pinned the
 * screenshot tips up from lying flat on the rock to facing the reader, and
 * the landscape behind it eases back.
 */
function Stage() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });

  const tilt = useTransform(scrollYProgress, [0.15, 0.7], [reduce ? 0 : 38, 0]);
  const scale = useTransform(scrollYProgress, [0.15, 0.7], [reduce ? 1 : 0.78, 1]);
  const lift = useTransform(scrollYProgress, [0.15, 0.7], [reduce ? 0 : 140, 0]);
  const land = useTransform(scrollYProgress, [0, 0.8], [reduce ? 1 : 1.18, 1]);
  const panel = useTransform(scrollYProgress, [0, 0.45], [reduce ? 0 : 6, 0]);
  const panelClip = useTransform(panel, (v) => `inset(${v}% ${v}% 0% ${v}% round 28px)`);
  const shadow = useTransform(
    scrollYProgress,
    [0.15, 0.7],
    ["0 10px 20px -10px rgba(14,26,43,0.2)", "0 50px 120px -30px rgba(14,26,43,0.55)"],
  );

  return (
    <div ref={ref} className="relative h-[200svh]">
      <div className="sticky top-0 flex h-svh items-center px-2 py-2">
        <motion.div
          style={{ clipPath: panelClip }}
          className="relative isolate flex h-full w-full items-center justify-center overflow-hidden rounded-[28px] [perspective:1600px]"
        >
          <motion.div className="absolute inset-0 -z-10" style={{ scale: land }}>
            <Image
              src="/landing/rock.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[50%_78%]"
            />
          </motion.div>

          <motion.div
            style={{ rotateX: tilt, scale, y: lift, boxShadow: shadow }}
            className="w-[min(88vw,1180px,calc((100svh-8rem)*1.778))] origin-[50%_85%] overflow-hidden rounded-[14px] ring-1 ring-black/10 will-change-transform sm:rounded-[18px]"
          >
            <Image
              src="/landing/studio.webp"
              alt="The Imaginry studio: effect presets on the left, a blue and violet gradient canvas in the middle, gradient settings on the right"
              width={1919}
              height={1079}
              sizes="(min-width: 1340px) 1180px, 88vw"
              className="block h-auto w-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/** Second section: the statement, the studio on its stone, then the four things it does. */
export default function Showcase() {
  return (
    <section className="relative bg-[#e9eef4] text-[#0e1a2b]">
      <div className="mx-auto w-full max-w-[1440px] px-6 pb-[clamp(4rem,12svh,9rem)] pt-[clamp(6rem,18svh,12rem)] sm:px-10">
        <Statement />
      </div>

      <Stage />

      <div className="mx-auto w-full max-w-[1440px] px-2 py-[clamp(4rem,12svh,8rem)] sm:px-6">
        <div className="grid grid-cols-1 border-y border-[#0e1a2b]/10 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial="hidden"
              whileInView="shown"
              whileHover="hover"
              viewport={{ once: true, margin: "0px 0px -15% 0px" }}
              transition={{ staggerChildren: 0.07, delayChildren: i * 0.12 }}
              className={`group relative flex flex-col px-6 pb-9 pt-6 transition-colors duration-500 hover:bg-white/45 sm:px-8 ${
                i > 0 ? "border-t border-[#0e1a2b]/10 sm:border-t-0" : ""
              } ${i % 2 === 1 ? "sm:border-l sm:border-[#0e1a2b]/10" : ""} ${i === 2 ? "lg:border-l lg:border-[#0e1a2b]/10 max-lg:sm:border-t" : ""} ${
                i === 3 ? "max-lg:sm:border-t" : ""
              }`}
            >
              <div className="flex aspect-[5/4] items-center justify-center px-4 py-6">
                <f.Figure />
              </div>

              <motion.h3
                variants={{ hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.8, ease: EASE }}
                className="flex items-center gap-2.5 text-[17px] font-medium tracking-[-0.01em]"
              >
                <f.Icon size={18} className="text-[#1d4fbf] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-6 group-hover:scale-110" />
                {f.title}
              </motion.h3>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.8, ease: EASE }}
                className="mt-2.5 max-w-[34ch] text-[15px] font-light leading-[1.6] text-[#0e1a2b]/70"
              >
                {f.body}
              </motion.p>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-6 pb-[clamp(5rem,14svh,10rem)] sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <Link
            href="/studio"
            className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0e1a2b]"
          >
            Open the studio
            <span className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
              →
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
