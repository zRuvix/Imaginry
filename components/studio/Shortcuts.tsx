"use client";

import { useRef } from "react";
import { X } from "@/components/icons";
import { useClickOutside } from "./controls";
import { Credit } from "@/components/Credit";

const KEYS: [string, string][] = [
  ["Space", "Play or pause animation"],
  ["R", "Surprise me: a random design"],
  ["C (hold)", "Compare with the original"],
  ["F", "Zen mode"],
  ["E", "Open export"],
  ["[  ]", "Previous / next layer"],
  ["H", "Hide or show the selected layer"],
  ["Delete", "Remove the selected layer"],
  ["Ctrl Z", "Undo"],
  ["Ctrl Shift Z", "Redo"],
  ["Ctrl V", "Paste a photo"],
  ["?", "This sheet"],
];

export default function Shortcuts({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, true, onClose);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div ref={ref} role="dialog" aria-label="Keyboard shortcuts" className="anim-pop glass-panel w-[420px] rounded-[26px] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[20px] text-bone">Shortcuts</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="press text-bone/60 hover:text-bone">
            <X size={18} />
          </button>
        </div>
        <ul className="space-y-1">
          {KEYS.map(([k, d], i) => (
            <li
              key={k}
              className="anim-rise flex items-center justify-between rounded-[12px] px-2 py-1.5 text-[13.5px] hover:bg-white/[0.04]"
              style={{ animationDelay: `${i * 25}ms` }}
            >
              <span className="text-bone/70">{d}</span>
              <span className="flex gap-1">
                {k.split(/\s+/).map((part, j) => (
                  <kbd key={j} className="rounded-[8px] bg-white/[0.08] px-2 py-0.5 font-outfit text-[12px] text-bone">
                    {part}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <Credit className="mt-4 block text-center font-condensed text-[12.5px] text-bone/40" />
      </div>
    </div>
  );
}
