"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Rocket } from "@/components/icons";
import { prefersReducedMotion } from "./motion";

/** How long the rocket flies before the page changes. */
const LAUNCH_MS = 700;

/**
 * The primary "Open studio" button. The rocket idles on hover and launches
 * out of the button on click, then the studio opens.
 */
export default function LaunchButton({ href = "/studio" }: { href?: string }) {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);

  return (
    <Link
      href={href}
      data-launching={launching ? "1" : "0"}
      onClick={(e) => {
        // Let new-tab clicks and reduced motion go straight through.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || prefersReducedMotion()) return;
        e.preventDefault();
        if (launching) return;
        setLaunching(true);
        setTimeout(() => router.push(href), LAUNCH_MS);
      }}
      className="launch-btn group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full bg-[var(--bone)] pl-4 pr-5 text-[14.5px] font-medium text-[var(--ink)] transition-colors duration-500 hover:bg-white"
    >
      <span className="relative grid size-[18px] place-items-center">
        <span className="launch-trail absolute left-1/2 top-1/2 h-[2px] w-0 origin-right -translate-y-1/2 rounded-full bg-[var(--ember)]" />
        <Rocket size={16} className="launch-rocket relative" />
      </span>
      <span className="relative grid">
        <span className="launch-label col-start-1 row-start-1">Open studio</span>
        <span aria-hidden className="launch-label-next col-start-1 row-start-1">
          Launching…
        </span>
      </span>
    </Link>
  );
}
