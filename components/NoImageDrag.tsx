"use client";

import { useEffect } from "react";

/** Stops images and canvases from being dragged out or saved by press-and-hold. */
export default function NoImageDrag() {
  useEffect(() => {
    const isMedia = (t: EventTarget | null) => t instanceof HTMLImageElement || t instanceof HTMLCanvasElement;
    const block = (e: Event) => {
      if (isMedia(e.target)) e.preventDefault();
    };
    document.addEventListener("dragstart", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("dragstart", block);
      document.removeEventListener("contextmenu", block);
    };
  }, []);
  return null;
}
