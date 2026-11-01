"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_W = 1360;
const FRAME_H = 820;

/**
 * The real studio in an iframe, laid out at desktop size and scaled to fit.
 * It only loads once the frame is about to scroll into view.
 */
export default function StudioFrame() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / FRAME_W)));
    ro.observe(el);
    const io = new IntersectionObserver(
      ([entry]) => {
        // The studio is a desktop tool; phones get a static preview instead.
        if (entry.isIntersecting && window.matchMedia("(min-width: 768px)").matches) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ height: FRAME_H * scale }}>
      {load ? (
        <iframe
          src="/studio"
          title="Imaginry studio"
          className="absolute left-0 top-0 origin-top-left border-0"
          style={{ width: FRAME_W, height: FRAME_H, transform: `scale(${scale})` }}
        />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-[var(--surface)]" />
      )}
    </div>
  );
}
