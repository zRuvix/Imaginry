"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Words } from "./scene";

const POINTS = [
  {
    title: "A design tool, not an AI",
    body: "Gradients, glass, grain and light are hand-written shader effects. No model, no prompts, no generated pictures of people.",
  },
  {
    title: "Your photos stay on your device",
    body: "A photo you drop in is opened by your browser and never uploaded. Share links carry layer settings only.",
  },
  {
    title: "Google sign-in is optional",
    body: "It only identifies your account: name, email and profile picture. Nothing else from Google is read or used.",
  },
];

function Node({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "accent" | "muted" }) {
  const look =
    tone === "accent"
      ? "bg-[var(--ember)] text-[var(--ink)]"
      : tone === "muted"
        ? "bg-transparent text-[var(--bone)]/70 border border-dashed border-white/25"
        : "bg-white/[0.08] text-[var(--bone)]";
  return <div className={`rounded-[16px] px-5 py-4 text-center text-[16px] font-medium lg:py-5 lg:text-[17px] ${look}`}>{children}</div>;
}

/** A line between two nodes with one pulse running down it. */
function Wire({ delay = 0 }: { delay?: number }) {
  return (
    <div aria-hidden className="relative mx-auto h-12 w-px bg-white/20 lg:h-[72px]">
      <span
        className="pulse absolute -left-[3px] top-0 size-[7px] rounded-full bg-[var(--ember)]"
        style={{ animationDelay: `${delay}ms`, "--run": "68px" } as CSSProperties}
      />
    </div>
  );
}

/** The privacy guarantees, beside a diagram of where a photo actually goes. */
export default function Privacy() {
  return (
    <section
      id="privacy"
      className="[--h:1] max-md:[--h:2]"
      style={{ background: "var(--surface)" } as CSSProperties}
      aria-labelledby="privacy-h"
    >
      <div className="wrap grid gap-10 lg:h-full lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-6 lg:pr-10">
          <h2 id="privacy-h" className="h2 text-[var(--bone)]">
            <Words text="Nothing you make is uploaded" />
          </h2>
          <ul className="mt-8 border-t border-white/10">
            {POINTS.map((p, i) => (
              <li key={p.title} data-rise style={{ "--d": `${i * 90}ms` } as CSSProperties} className="border-b border-white/10 py-5">
                <h3 className="font-display text-[19px] leading-[1.2] tracking-[-0.025em] text-[var(--bone)]">{p.title}</h3>
                <p className="mt-1.5 max-w-[52ch] text-[15px] leading-[1.55] text-[var(--bone)]/65">{p.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[14px] leading-[1.6] text-[var(--bone)]/60">
            Sexual, explicit or non-consensual imagery is not allowed. Read the{" "}
            <Link href="/terms#acceptable-use" className="ulink text-[var(--bone)]">
              terms of use
            </Link>{" "}
            and the{" "}
            <Link href="/privacy" className="ulink text-[var(--bone)]">
              privacy policy
            </Link>
            .
          </p>
        </div>

        {/* Where a photo goes: into the tab, through the GPU, out as a file. Never to a server. */}
        <div className="panel rounded-[24px] bg-[var(--raised)] p-6 max-lg:py-12 lg:col-span-6 lg:p-10">
          <div
            role="img"
            aria-label="A photo goes from your device into this browser tab, through your GPU, and out as a file. Only layer settings in a share link ever reach Imaginry’s servers."
            className="mx-auto grid h-full max-w-[520px] content-center"
          >
            <Node>Your photo</Node>
            <Wire />
            <Node tone="accent">This browser tab, on your GPU</Node>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Wire delay={1100} />
                <Node>PNG, video or embed</Node>
              </div>
              <div>
                <div aria-hidden className="mx-auto h-12 w-px border-l border-dashed border-white/30 lg:h-[72px]" />
                <Node tone="muted">Our servers: layer settings in share links, never images</Node>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
