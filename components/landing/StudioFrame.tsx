"use client";

import { useEffect, useRef, useState } from "react";
import { LOGO_MARK } from "@/components/Logo";

const FRAME_W = 1360;
const FRAME_H = 820;
/** Show the studio anyway if it never reports in (old cached build, slow GPU). */
const READY_TIMEOUT = 12000;

/**
 * The real studio in an iframe, laid out at desktop size and scaled to fit.
 * It loads once the frame actually scrolls into view (so compiling shaders
 * never stutters the scenes above it), shows a loader until the studio says
 * its first frame is ready, and is told to stop drawing while off screen.
 */
export default function StudioFrame() {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const visible = useRef(false);
  const [scale, setScale] = useState(1);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);

  const tellFrame = () =>
    frame.current?.contentWindow?.postMessage({ imaginry: "visible", value: visible.current }, window.location.origin);

  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / FRAME_W)));
    ro.observe(el);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
        // The studio is a desktop tool; phones get a static preview instead.
        if (entry.isIntersecting && window.matchMedia("(min-width: 768px)").matches) setLoad(true);
        tellFrame();
      },
      { threshold: 0.02 },
    );
    io.observe(el);
    const onMessage = (e: MessageEvent) => {
      if (e.source === frame.current?.contentWindow && e.data?.imaginry === "ready") {
        setReady(true);
        tellFrame();
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    if (!load || ready) return;
    const t = setTimeout(() => setReady(true), READY_TIMEOUT);
    return () => clearTimeout(t);
  }, [load, ready]);

  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-[var(--surface)]" style={{ height: FRAME_H * scale }}>
      {load && (
        <iframe
          ref={frame}
          src="/studio"
          title="Imaginry studio"
          onLoad={tellFrame}
          className="absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-700"
          style={{ width: FRAME_W, height: FRAME_H, transform: `scale(${scale})`, opacity: ready ? 1 : 0 }}
        />
      )}
      <div
        aria-hidden={ready}
        role="status"
        className={`absolute inset-0 flex flex-col items-center justify-center gap-5 transition-opacity duration-700 ${
          ready ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        {/* Ghost of the studio's layout while it boots */}
        <div className="absolute inset-0 p-[2%] opacity-60">
          <div className="skeleton mx-auto h-[6%] w-[60%] rounded-full" />
          <div className="skeleton absolute bottom-[3%] left-[2%] top-[11%] w-[17%] rounded-[22px]" />
          <div className="skeleton absolute bottom-[3%] right-[2%] top-[11%] w-[17%] rounded-[22px]" />
          <div className="skeleton absolute bottom-[3%] left-1/2 h-[8%] w-[34%] -translate-x-1/2 rounded-full" />
        </div>
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative">
            <span className="studio-loader-ring absolute -inset-3 rounded-[22px]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_MARK} alt="" width={52} height={52} className="studio-loader-mark relative" />
          </div>
          <p className="font-condensed text-[15px] text-[var(--bone)]/75">
            {load ? "Loading live studio" : "Live studio"}
            <span className="loader-dots" />
          </p>
          <span className="relative h-[3px] w-40 overflow-hidden rounded-full bg-white/10">
            <span className="studio-loader-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-[var(--ember)]" />
          </span>
        </div>
      </div>
    </div>
  );
}
