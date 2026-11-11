"use client";

import { useState } from "react";
import { Pause, Play } from "@/components/icons";
import type { CuratedLook } from "@/lib/studio/looks";
import LiveLook from "@/components/landing/LiveLook";

/**
 * A live shader in a frame, with a pause button. Until the look is picked
 * (or if WebGL is refused) the still ground underneath shows instead, so the
 * frame is never empty. The caller positions the frame (`relative` or `absolute`).
 */
export default function LiveFrame({
  look,
  className = "",
  canvasClass = "",
  speed = 0.6,
  resolution = 0.6,
  controlClass = "bottom-4 right-4",
}: {
  look?: CuratedLook;
  className?: string;
  /** Extra classes for the layer a scene scales. */
  canvasClass?: string;
  speed?: number;
  resolution?: number;
  /** Where the pause button sits inside the frame. */
  controlClass?: string;
}) {
  const [running, setRunning] = useState(true);
  return (
    <div className={`frame still-ground overflow-hidden ${className}`}>
      <div className={`absolute inset-0 ${canvasClass}`}>
        {look && <LiveLook look={look} running={running} speed={speed} resolution={resolution} className="h-full w-full" />}
      </div>
      <button
        type="button"
        onClick={() => setRunning((v) => !v)}
        aria-pressed={!running}
        aria-label={running ? "Pause the live texture" : "Play the live texture"}
        className={`press absolute z-10 grid size-10 place-items-center rounded-full bg-black/55 text-[var(--bone)] backdrop-blur-md transition-colors hover:bg-black/75 ${controlClass}`}
      >
        {running ? <Pause size={14} /> : <Play size={14} />}
      </button>
    </div>
  );
}
