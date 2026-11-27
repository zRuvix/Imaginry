"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { startCheckout } from "@/lib/billing-client";
import { FREE_FEATURES, PRO_FEATURES, PRO_PRICE, YEARLY_SAVING, yearTotal, type Cycle, type Feature } from "@/lib/pricing";

const EASE = [0.16, 1, 0.3, 1] as const;
const money = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));

/** Each character rolls out of its own mask when it changes. */
function Rolling({ value }: { value: string }) {
  const reduce = useReducedMotion();
  return (
    <span className="inline-flex tabular-nums" aria-label={value}>
      {value.split("").map((ch, i) => (
        <span key={i} aria-hidden className="relative inline-block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`${ch}-${i}`}
              className="inline-block"
              initial={reduce ? false : { y: "120%", filter: "blur(3px)" }}
              animate={{ y: "0%", filter: "blur(0px)" }}
              exit={reduce ? undefined : { y: "-120%", filter: "blur(3px)" }}
              transition={{ duration: 0.55, delay: i * 0.04, ease: EASE }}
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

function Features({ list }: { list: Feature[] }) {
  return (
    <motion.ul
      variants={{ shown: { transition: { staggerChildren: 0.06, delayChildren: 0.35 } } }}
      className="mt-7 space-y-3 border-t border-[#0e1a2b]/[0.08] pt-7"
    >
      {list.map((f) => (
        <motion.li
          key={f.text}
          variants={{ hidden: { opacity: 0, x: -8 }, shown: { opacity: 1, x: 0 } }}
          transition={{ duration: 0.6, ease: EASE }}
          className={`flex items-center gap-3 text-[15px] ${f.off ? "text-[#0e1a2b]/35" : "text-[#0e1a2b]/80"}`}
        >
          <svg aria-hidden viewBox="0 0 16 16" className={`size-4 shrink-0 ${f.off ? "text-[#0e1a2b]/25" : "text-[#1d4fbf]"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {f.off ? <path d="M4.5 8h7" /> : <path d="M3.5 8.5l3 3 6-6.5" />}
          </svg>
          {f.text}
          {f.off && <span className="sr-only"> (not included)</span>}
        </motion.li>
      ))}
    </motion.ul>
  );
}

function Plan({
  name,
  blurb,
  price,
  note,
  action,
  features,
  art,
  delay,
}: {
  name: string;
  blurb: string;
  price: ReactNode;
  note: string;
  action: ReactNode;
  features: Feature[];
  art?: boolean;
  delay: number;
}) {
  return (
    <motion.li
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      variants={{ hidden: { opacity: 0, y: 40 }, shown: { opacity: 1, y: 0 } }}
      transition={{ duration: 1, ease: EASE, delay }}
      whileHover={{ y: -6 }}
      className="relative flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_0_0_1px_rgba(14,26,43,0.06),0_24px_60px_-34px_rgba(14,26,43,0.35)] transition-shadow duration-500 hover:shadow-[0_0_0_1px_rgba(14,26,43,0.08),0_40px_80px_-36px_rgba(14,26,43,0.45)]"
    >
      {/* Pro carries a strip of the hero painting across its top */}
      {art && (
        <div className="relative h-24 overflow-hidden">
          <motion.div
            variants={{ hidden: { scale: 1.25 }, shown: { scale: 1 } }}
            transition={{ duration: 1.6, ease: EASE, delay }}
            className="absolute inset-0"
          >
            <Image src="/landing-v2/hero.webp" alt="" fill sizes="600px" className="object-cover object-[60%_78%]" />
          </motion.div>
        </div>
      )}
      <div className="flex flex-1 flex-col p-7 sm:p-9">
        <h3 className="font-figtree text-[26px] font-medium tracking-[-0.04em]">{name}</h3>
        <p className="mt-2 max-w-[34ch] text-[15px] font-light leading-[1.55] text-[#0e1a2b]/65">{blurb}</p>

        <p className="font-figtree mt-8 flex items-start text-[#0e1a2b]">
          <span className="mr-1 mt-2 text-[26px] font-medium">$</span>
          <span className="text-[72px] font-medium leading-none tracking-[-0.05em]">{price}</span>
          <span className="mb-2 ml-2 self-end text-[15px] font-normal text-[#0e1a2b]/55">a month</span>
        </p>
        <p className="mt-3 text-[13.5px] text-[#0e1a2b]/50" aria-live="polite">
          {note}
        </p>

        <div className="mt-8">{action}</div>
        <Features list={features} />
      </div>
    </motion.li>
  );
}

function GetPro({ cycle }: { cycle: Cycle }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const failed = await startCheckout(cycle, "/landing#pricing");
          if (failed) {
            setError(failed);
            setBusy(false);
          }
        }}
        className="blue-button group flex h-13 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold disabled:cursor-wait disabled:opacity-80"
      >
        {busy ? "Opening checkout…" : "Get Pro"}
        {!busy && <span className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">→</span>}
      </button>
      {error && (
        <p role="alert" className="mt-2.5 text-[13px] text-[#c2410c]">
          {error}
        </p>
      )}
    </>
  );
}

/** Fifth section: Free beside Pro, with a monthly / yearly switch that rolls Pro's price. */
export default function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("yearly");

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="bg-[#e9eef4] text-[#0e1a2b]">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-[clamp(5rem,16svh,10rem)] sm:px-10">
        <div className="flex flex-col items-center text-center">
          <motion.h2
            id="pricing-heading"
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ staggerChildren: 0.08 }}
            className="font-figtree text-[clamp(2.4rem,min(4.6vw,8.5svh),4.75rem)] font-medium leading-[1] tracking-[-0.05em]"
          >
            {["Start free.", "Go Pro when it pays."].map((line, li) => (
              <span key={line} className={`block overflow-clip pb-[0.08em] [overflow-clip-margin:0.1em] ${li ? "text-[#0e1a2b]/30" : ""}`}>
                <motion.span className="block" variants={{ hidden: { y: "110%" }, shown: { y: 0 } }} transition={{ duration: 1, ease: EASE }}>
                  {line}
                </motion.span>
              </span>
            ))}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
            role="radiogroup"
            aria-label="Billing"
            className="mt-9 inline-flex gap-1 rounded-full bg-white p-1 shadow-[0_0_0_1px_rgba(14,26,43,0.06)]"
          >
            {(["monthly", "yearly"] as const).map((c) => {
              const on = cycle === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setCycle(c)}
                  className={`relative inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-[14.5px] capitalize transition-colors duration-300 ${
                    on ? "text-white" : "text-[#0e1a2b]/60 hover:text-[#0e1a2b]"
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="billing-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-[#0e1a2b]"
                    />
                  )}
                  <span className="relative">{c}</span>
                  {c === "yearly" && (
                    <span className={`relative rounded-full px-2 py-0.5 text-[11.5px] font-semibold normal-case transition-colors duration-300 ${on ? "bg-white/15 text-white" : "bg-[#e3ecff] text-[#1d4fbf]"}`}>
                      Save {YEARLY_SAVING}%
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        </div>

        <ul className="mx-auto mt-[clamp(2.5rem,7svh,4.5rem)] grid max-w-[960px] items-start gap-4 md:grid-cols-2 md:gap-5">
          <Plan
            name="Free"
            blurb="Every effect and Surprise me, with a few small exports each day."
            price="0"
            note="Free account, no card"
            delay={0}
            action={
              <Link
                href="/studio"
                className="group flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0e1a2b]/[0.06] text-[15px] font-semibold text-[#0e1a2b] transition-colors duration-300 hover:bg-[#0e1a2b]/[0.1]"
              >
                Open the studio
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">→</span>
              </Link>
            }
            features={FREE_FEATURES}
          />
          <Plan
            art
            name="Pro"
            blurb="No daily cap, exports up to 4K and the embed code for your site."
            price={<Rolling value={money(PRO_PRICE[cycle])} />}
            note={cycle === "yearly" ? `Billed $${money(yearTotal("yearly"))} a year` : "Billed monthly"}
            delay={0.12}
            action={<GetPro cycle={cycle} />}
            features={PRO_FEATURES}
          />
        </ul>
      </div>
    </section>
  );
}
