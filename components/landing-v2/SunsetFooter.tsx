"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { LEGAL_PAGES } from "@/lib/legal";
import "./figs.css";

const EASE = [0.16, 1, 0.3, 1] as const;

const COLUMNS = [
  {
    title: "Make",
    links: [
      { label: "Studio", href: "/studio" },
      { label: "Explore", href: "/explore" },
      { label: "Agents", href: "#agents" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  { title: "Legal", links: LEGAL_PAGES },
  {
    title: "Follow",
    links: [
      { label: "X / Twitter", href: "https://x.com/zRuvix1" },
      { label: "Sponsor", href: "/sponsor" },
    ],
  },
];

const fade = { hidden: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0 } };

/**
 * Closing call to action and footer, on a sunset painting so the page ends
 * the way it began. The painting opens out as it scrolls in, the sun keeps a
 * slow glow, and the footer sits on the darker garden at the bottom.
 */
export default function SunsetFooter() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const inset = useTransform(scrollYProgress, [0, 0.7], [reduce ? 0 : 5, 0]);
  const clip = useTransform(inset, (v) => `inset(${v}% ${v}% 0% ${v}% round 28px)`);
  // A gentle settle: zooming further would enlarge the painting past its own pixels and soften it.
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 1.06, 1]);
  const y = useTransform(scrollYProgress, [0, 1], ["-2.5%", "0%"]);
  const [loaded, setLoaded] = useState(false);

  return (
    <footer ref={ref} className="bg-[#e9eef4] px-2 pb-2 pt-2">
      <motion.div
        style={{ clipPath: clip }}
        className="relative isolate flex min-h-[max(100svh,760px)] flex-col overflow-hidden rounded-[28px] text-white"
      >
        <motion.div className="absolute inset-0 -z-10" style={{ scale, y: reduce ? 0 : y }}>
          <Image
            src="/landing-v2/footer.webp"
            alt="Oil painting of a sunset over a Roman valley: umbrella pines, an aqueduct, grazing sheep and two walkers on a path"
            fill
            sizes="100vw"
            // Served as the original file, not re-encoded at a lower quality.
            unoptimized
            onLoad={() => setLoaded(true)}
            className="object-cover object-[45%_60%]"
          />
          {/* A small, soft breath of light on the sun, only once the painting is there */}
          {loaded && (
            <span className="sf-sun pointer-events-none absolute left-[36%] top-[57%] size-[12vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,206,140,0.38),transparent_65%)] mix-blend-screen" />
          )}
        </motion.div>
        {/* Shade top and bottom so white type reads on the sky and on the garden */}
        <div className="pointer-events-none absolute inset-0 -z-[5] bg-[linear-gradient(to_bottom,rgba(40,24,60,0.35),transparent_38%,transparent_55%,rgba(16,12,10,0.72))]" />

        {/* Call to action, in the sky */}
        <motion.div
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, margin: "0px 0px -20% 0px" }}
          transition={{ staggerChildren: 0.08 }}
          className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 pt-[clamp(5rem,16svh,10rem)] text-center sm:px-10"
        >
          <h2 className="font-figtree text-[clamp(2.75rem,min(6.2vw,11svh),6.5rem)] font-medium leading-[0.98] tracking-[-0.05em] [text-shadow:0_2px_30px_rgba(40,20,50,0.25)]">
            {["Your next background", "is one click away."].map((line) => (
              <span key={line} className="block overflow-clip pb-[0.08em] [overflow-clip-margin:0.1em]">
                <motion.span className="block" variants={{ hidden: { y: "110%" }, shown: { y: 0 } }} transition={{ duration: 1.1, ease: EASE }}>
                  {line}
                </motion.span>
              </span>
            ))}
          </h2>

          <motion.div variants={fade} transition={{ duration: 0.9, ease: EASE }} className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <Link
              href="/studio"
              className="group inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 text-[15.5px] font-semibold text-[#0e1a2b] shadow-[0_10px_30px_-10px_rgba(40,20,50,0.5)] transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-px"
            >
              Start creating
              <span className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">→</span>
            </Link>
            <Link href="/explore" className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-white/90 transition-colors hover:text-white">
              See what people made
              <span className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">→</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Footer, on the garden */}
        <motion.div
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, margin: "0px 0px -5% 0px" }}
          transition={{ staggerChildren: 0.07 }}
          className="mx-auto mt-auto w-full max-w-[1440px] px-6 pb-7 pt-24 sm:px-10 sm:pb-9"
        >
          <div className="grid gap-10 border-b border-white/15 pb-10 lg:grid-cols-[1fr_auto]">
            <motion.div variants={fade} transition={{ duration: 0.9, ease: EASE }}>
              <Link href="/" className="font-figtree text-[30px] font-semibold tracking-[-0.045em]">
                imaginry
              </Link>
              <p className="mt-2 max-w-[32ch] text-[14.5px] font-light leading-[1.55] text-white/70">
                Abstract backgrounds, made live in your browser.
              </p>
            </motion.div>

            <nav aria-label="Footer" className="grid grid-cols-3 gap-6 sm:gap-14">
              {COLUMNS.map((col) => (
                <motion.div key={col.title} variants={fade} transition={{ duration: 0.9, ease: EASE }}>
                  <p className="text-[13px] text-white/50">{col.title}</p>
                  <ul className="mt-3 space-y-2">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          className="group relative text-[14.5px] text-white/85 transition-colors duration-300 hover:text-white"
                          {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                        >
                          {l.label}
                          <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </nav>
          </div>

          <motion.div variants={fade} transition={{ duration: 0.9, ease: EASE }} className="flex flex-wrap items-center justify-between gap-3 pt-6 text-[13px] text-white/55">
            <p>© {new Date().getFullYear()} Imaginry</p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-white"
            >
              Back to the top
              <span className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5">↑</span>
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
