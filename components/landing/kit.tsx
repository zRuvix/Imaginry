"use client";

import { animate, motion, useInView, useSpring, useTransform, type MotionValue, type Variants } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

/** The settling ease shared by every motion on the landing page. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * useTransform over a 0..1 scroll progress, held flat outside `input`.
 * Motion hands scroll-linked opacity to a native scroll timeline, which
 * snaps back to the element's base style outside the keyframes unless they
 * span the whole 0..1, so the ends are filled in here.
 */
export function useScrollRange(p: MotionValue<number>, input: number[], output: number[]) {
  const i = [...input];
  const o = [...output];
  if (i[0] > 0) {
    i.unshift(0);
    o.unshift(o[0]);
  }
  if (i[i.length - 1] < 1) {
    i.push(1);
    o.push(o[o.length - 1]);
  }
  return useTransform(p, i, o);
}

/** "(02) Label": the small marker that opens each section. */
export function Marker({ n, children, className = "" }: { n: string; children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-baseline gap-2.5 font-condensed text-[15px] text-[var(--bone)]/55 ${className}`}>
      <span className="text-[var(--ember)]">({n})</span>
      <span>{children}</span>
    </p>
  );
}

const lineParent: Variants = {
  hidden: {},
  show: (delay: number = 0) => ({ transition: { staggerChildren: 0.09, delayChildren: delay } }),
};
const lineChild: Variants = {
  hidden: { y: "112%" },
  show: { y: "0%", transition: { duration: 1.15, ease: EASE_OUT } },
};

/**
 * Each line rises out of its own mask, one after another: on mount when
 * `onMount`, otherwise the first time it scrolls into view.
 */
export function MaskLines({
  lines,
  className,
  delay = 0,
  onMount,
}: {
  lines: ReactNode[];
  className?: string;
  delay?: number;
  onMount?: boolean;
}) {
  const trigger = onMount
    ? { animate: "show" }
    : { whileInView: "show", viewport: { once: true, margin: "0px 0px -12% 0px" } };
  return (
    <motion.span className={`block ${className ?? ""}`} initial="hidden" custom={delay} variants={lineParent} {...trigger}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <motion.span className="block" variants={lineChild}>
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** Leans toward the cursor while it hovers, and springs back when it leaves. */
export function Magnetic({ children, strength = 0.3 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 16, mass: 0.6 });
  const y = useSpring(0, { stiffness: 220, damping: 16, mass: 0.6 });
  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className="inline-block"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        // Measure from where it would sit untransformed, or it chases itself.
        x.set((e.clientX - (r.left - x.get()) - r.width / 2) * strength);
        y.set((e.clientY - (r.top - y.get()) - r.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Counts up to `to` the first time it's seen. */
export function CountUp({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  useEffect(() => {
    if (!seen || !ref.current) return;
    const el = ref.current;
    const c = animate(0, to, {
      duration: 1.6,
      ease: EASE_OUT,
      onUpdate: (v) => (el.textContent = `${prefix}${Math.round(v)}${suffix}`),
    });
    return () => c.stop();
  }, [seen, to, prefix, suffix]);
  return (
    <span ref={ref}>
      {prefix}0{suffix}
    </span>
  );
}
