"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { ArrowRight } from "@/components/icons";
import { authClient } from "@/lib/auth-client";
import { checkoutHref, FREE_FEATURES, PRO_FEATURES, PRO_PRICE, YEARLY_SAVING, yearTotal, type Cycle, type Feature } from "@/lib/pricing";
import { BTN_MOTION } from "./buttonMotion";
import { EASE_ENTER } from "./enterTiming";

const money = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));

/** Free beside Pro as two compact cards, with a monthly / yearly switch that rolls Pro's price. */
export default function PricingPlans() {
  const [cycle, setCycle] = useState<Cycle>("yearly");

  return (
    <div className="flex flex-col items-center">
      <h2 id="pricing-h" className="font-lexend text-center text-[clamp(2rem,min(4.2vw,8svh),3.75rem)] font-light leading-[1.02] tracking-[-0.045em] text-[#121416]">
        Two plans, one studio
      </h2>

      <div role="radiogroup" aria-label="Billing" className="mt-7 inline-flex gap-1 rounded-full bg-[#f3f4f5] p-1">
        {(["monthly", "yearly"] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={cycle === c}
            onClick={() => setCycle(c)}
            className={`font-outfit inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[14.5px] capitalize ${BTN_MOTION} ${
              cycle === c ? "bg-white text-[#141414] shadow-[0_1px_3px_rgba(20,30,40,0.12)]" : "text-[#6b7075] hover:text-[#141414]"
            }`}
          >
            {c}
            {c === "yearly" && (
              <span className="rounded-full bg-[#e3ecff] px-2 py-0.5 text-[11.5px] font-semibold normal-case text-[#2460e8]">
                Save {YEARLY_SAVING}%
              </span>
            )}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid w-full max-w-[880px] gap-3 md:grid-cols-2">
        <Card
          dark={false}
          name="Free"
          tag="To play"
          blurb="Every effect and Surprise me, with a few small exports each week."
          price={<span className="font-lexend text-[64px] font-light leading-none tracking-[-0.05em]">0</span>}
          note="Free account, no card"
          action={
            <Link href="/studio" className={`group/btn flex min-h-14 items-center justify-between rounded-[16px] bg-[#141414] pl-6 pr-2 text-white hover:bg-[#2a2a2a] ${BTN_MOTION}`}>
              <span className="font-outfit text-[15.5px] font-semibold">Open the studio</span>
              <Arrow dark={false} />
            </Link>
          }
          features={FREE_FEATURES}
        />
        <Card
          dark
          name="Pro"
          tag="For client work"
          blurb="No weekly cap, exports up to 4K and the embed code for your site."
          price={<RollingPrice value={money(PRO_PRICE[cycle])} />}
          note={cycle === "yearly" ? `Billed $${money(yearTotal("yearly"))} a year` : "Billed monthly"}
          action={
            <GetPro cycle={cycle} />
          }
          features={PRO_FEATURES}
        />
      </ul>
    </div>
  );
}

function Card({
  dark,
  name,
  tag,
  blurb,
  price,
  note,
  action,
  features,
}: {
  dark: boolean;
  name: string;
  tag: string;
  blurb: string;
  price: ReactNode;
  note: string;
  action: ReactNode;
  features: Feature[];
}) {
  return (
    <li
      className={`relative flex flex-col overflow-hidden rounded-[24px] p-7 sm:p-8 ${
        dark ? "bg-[#141414] text-white" : "bg-[#f6f7f8] text-[#121416]"
      }`}
    >
      <Rings dark={dark} />
      <div className="relative flex items-center gap-2.5">
        <h3 className="font-lexend text-[24px] font-normal tracking-[-0.03em]">{name}</h3>
        <span className={`font-outfit rounded-full px-2.5 py-1 text-[12px] ${dark ? "bg-white/10 text-white/80" : "bg-[#e3ecff] text-[#2460e8]"}`}>{tag}</span>
      </div>
      <p className={`font-outfit relative mt-2.5 max-w-[30ch] text-[14.5px] leading-relaxed ${dark ? "text-white/60" : "text-[#6b7075]"}`}>{blurb}</p>

      <p className="relative mt-7 flex items-start">
        <span className="font-lexend mr-1 mt-1.5 text-[24px] font-light">$</span>
        {price}
        <span className={`font-outfit mb-1.5 ml-2 self-end text-[14.5px] ${dark ? "text-white/70" : "text-[#3a3d40]"}`}>a month</span>
      </p>
      <p className={`font-outfit relative mt-3 text-[13px] ${dark ? "text-white/50" : "text-[#7b8188]"}`} aria-live="polite">
        {note}
      </p>

      <div className="relative mt-7">{action}</div>

      <ul className={`relative mt-7 space-y-3 border-t pt-7 ${dark ? "border-white/10" : "border-black/[0.07]"}`}>
        {features.map((f) => (
          <li
            key={f.text}
            className={`font-outfit flex items-center gap-3 text-[14.5px] ${
              f.off ? (dark ? "text-white/35" : "text-[#9a9fa4]") : dark ? "text-white/85" : "text-[#3a3d40]"
            }`}
          >
            <span
              aria-hidden
              className={`grid size-6 shrink-0 place-items-center rounded-full ${
                f.off ? (dark ? "bg-white/5" : "bg-black/[0.04]") : dark ? "bg-white/10 text-white" : "bg-[#e3ecff] text-[#2460e8]"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {f.off ? <path d="M4.5 8h7" /> : <path d="M3.5 8.5l3 3 6-6.5" />}
              </svg>
            </span>
            <span>
              {f.text}
              {f.off && <span className="sr-only"> (not included)</span>}
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}

/**
 * Opens Dodo checkout for the chosen cycle. Signed out, it goes through Google
 * sign-in first and comes back via the checkout route, which redirects to payment.
 */
function GetPro({ cycle }: { cycle: Cycle }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cycle }),
    }).catch(() => null);
    if (res?.status === 401) {
      const { error } = await authClient.signIn.social({ provider: "google", callbackURL: checkoutHref(cycle) });
      if (error) setBusy(false);
      return;
    }
    const data = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (data?.url) return window.location.assign(data.url);
    setError(data?.error ?? "Couldn't open checkout. Try again.");
    setBusy(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="blue-button group/btn flex min-h-14 w-full cursor-pointer items-center justify-between rounded-[16px] pl-6 pr-2 text-white disabled:cursor-wait disabled:opacity-80"
      >
        <span className="font-outfit text-[15.5px] font-semibold">{busy ? "Opening checkout…" : "Get Pro"}</span>
        <Arrow dark />
      </button>
      {error && (
        <p role="alert" className="font-outfit mt-2.5 text-[13px] text-[#ff9c8a]">
          {error}
        </p>
      )}
    </>
  );
}

/** The circle at the button's right end; its arrow nudges forward on hover. */
function Arrow({ dark }: { dark: boolean }) {
  return (
    <span aria-hidden className={`grid size-10 place-items-center rounded-full ${dark ? "bg-white text-[#2460e8]" : "bg-white text-[#141414]"}`}>
      <ArrowRight size={16} className="transition-transform duration-200 ease-out group-hover/btn:translate-x-0.5" />
    </span>
  );
}

/** Concentric rings tucked into the card's top-right corner. */
function Rings({ dark }: { dark: boolean }) {
  const stroke = dark ? "rgba(255,255,255,0.07)" : "rgba(36,96,232,0.09)";
  return (
    <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-14 -top-14 size-[200px]">
      {[96, 80, 64, 48, 32].map((r) => (
        <circle key={r} cx="100" cy="100" r={r} fill="none" stroke={stroke} strokeWidth="8" />
      ))}
      <circle cx="100" cy="100" r="16" fill={stroke} />
    </svg>
  );
}

/** Each character rolls up out of a mask when it changes; unchanged characters stay put. */
function RollingPrice({ value }: { value: string }) {
  const still = useReducedMotion();
  return (
    <span className="font-lexend inline-flex text-[64px] font-light leading-none tracking-[-0.05em] tabular-nums" aria-label={value}>
      {value.split("").map((ch, i) => (
        <span key={i} aria-hidden className="relative inline-block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`${ch}-${i}`}
              className="inline-block"
              initial={still ? false : { y: "130%" }}
              animate={{ y: "0%" }}
              exit={still ? undefined : { y: "-130%" }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: EASE_ENTER }}
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
