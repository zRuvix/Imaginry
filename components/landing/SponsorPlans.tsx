"use client";

import { useState } from "react";
import { PLANS, type Billing } from "@/lib/sponsors";
import { CREATOR_URL } from "@/lib/seo";
import { BTN_MOTION } from "./buttonMotion";

/** The three placements with a weekly / monthly switch. Booking happens by message. */
export default function SponsorPlans() {
  const [billing, setBilling] = useState<Billing>("weekly");

  return (
    <>
      <div role="radiogroup" aria-label="Billing" className="mb-6 inline-flex gap-1 rounded-[12px] bg-[#f3f4f5] p-1">
        {(["weekly", "monthly"] as const).map((b) => (
          <button
            key={b}
            type="button"
            role="radio"
            aria-checked={billing === b}
            onClick={() => setBilling(b)}
            className={`font-outfit min-h-10 rounded-[9px] px-4 text-[14px] capitalize ${BTN_MOTION} ${
              billing === b ? "blue-button" : "text-[#6b7075] hover:text-[#141414]"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <ul className="grid gap-2 sm:gap-3 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const perWeekOnMonthly = plan.price.monthly / 4.33;
          const saving = Math.round((1 - perWeekOnMonthly / plan.price.weekly) * 100);
          const dark = plan.featured;
          return (
            <li
              key={plan.id}
              className={`flex flex-col rounded-[22px] p-6 sm:p-7 ${dark ? "bg-[#141414] text-white" : "bg-[#f6f7f8] text-[#121416]"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-lexend text-[24px] font-light tracking-[-0.03em]">{plan.name}</h3>
                {plan.featured && <span className="font-outfit rounded-md bg-white/15 px-2 py-1 text-[11.5px]">Most booked</span>}
              </div>
              <p className={`font-outfit mt-2 text-[14.5px] leading-relaxed ${dark ? "text-white/65" : "text-[#6b7075]"}`}>{plan.blurb}</p>

              <p className="mt-7 flex items-baseline gap-1.5">
                <span className="font-lexend text-[52px] font-light leading-none tracking-[-0.05em] tabular-nums">${plan.price[billing]}</span>
                <span className={`font-outfit text-[14px] ${dark ? "text-white/60" : "text-[#6b7075]"}`}>/ {billing === "weekly" ? "week" : "month"}</span>
              </p>
              <p className={`font-outfit mt-2 min-h-5 text-[13px] ${dark ? "text-white/55" : "text-[#9a9fa4]"}`}>
                {billing === "monthly" && saving > 0 ? `About ${saving}% less per week than weekly` : " "}
              </p>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className={`font-outfit flex gap-2.5 text-[14.5px] leading-snug ${dark ? "text-white/85" : "text-[#3a3d40]"}`}>
                    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                      <path d="M3 8.5l3 3 7-7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={CREATOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="blue-button blue-button-large mt-8"
              >
                Book {plan.name}
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
