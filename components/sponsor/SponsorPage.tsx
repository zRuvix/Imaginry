"use client";

import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, Plus } from "@/components/icons";
import { Reveal } from "@/components/landing/motion";
import { useLookImages } from "@/components/landing/useLookImages";
import { Segmented } from "@/components/studio/controls";
import { GALLERY } from "@/lib/studio/looks";
import { PLANS, SPONSOR_CONTACT, type Billing, type Plan } from "@/lib/sponsors";
import { Logo } from "@/components/Logo";
import { Credit } from "@/components/Credit";

const FAQ: [string, string][] = [
  [
    "Where exactly does my brand show?",
    "In the studio's top bar for every plan: a chip with your logo and name that links to your site. Gallery feature adds a design made in your palette, pinned first in the gallery. Spotlight adds a card on the landing page and keeps the top bar to yourself.",
  ],
  [
    "When does it go live?",
    "Pick a start date when you book. Send your logo (square SVG or PNG), name and link, and the placement goes live on that date.",
  ],
  [
    "Can I change my link or logo mid-run?",
    "Yes. Send the new one over and it's swapped in, no extra charge.",
  ],
  [
    "Are the links tracked?",
    "Links go straight to your site, marked as sponsored. Add your own UTM tags to the URL to measure them in your analytics.",
  ],
  [
    "Weekly or monthly?",
    "Weekly is good for a launch. Monthly costs noticeably less per week if you want steady presence.",
  ],
];

const bookHref = (plan: Plan, billing: Billing) =>
  `${SPONSOR_CONTACT}&body=${encodeURIComponent(`Hi! I'd like to book the ${plan.name} plan, billed ${billing}.`)}`;

/** Counts toward a new value instead of jumping. */
function AnimatedPrice({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 650);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(a + (value - a) * eased);
      setShown(v);
      from.current = v;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="tabular-nums">{shown}</span>;
}

function Button({ href, primary, children }: { href: string; primary?: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      className={`press inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14.5px] font-medium ${
        primary ? "bg-bone text-ink hover:bg-white" : "bg-white/[0.06] text-bone hover:bg-white/[0.12]"
      }`}
    >
      {children}
    </a>
  );
}

/** A miniature studio top bar with the sponsor slot glowing in it. */
function BarMock() {
  const pill = "glass-panel flex h-10 items-center gap-2 rounded-full px-3";
  return (
    <div className="relative overflow-hidden rounded-[26px] bg-surface p-4 shadow-[0_40px_100px_-40px_rgba(255,90,44,0.35)] md:p-6">
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-ember/20 blur-[80px]" />
      <div className="relative flex items-center gap-2.5">
        <div className={`${pill} font-display text-[12px] text-bone`}>imaginry</div>
        <div className="flex flex-1 justify-center">
          <span className="sponsor-glow flex h-10 items-center gap-2 rounded-full bg-ember/15 pl-1.5 pr-4 text-[13px] text-bone">
            <span className="flex size-7 items-center justify-center rounded-full bg-ember font-display text-[12px] text-ink">Y</span>
            Your brand
          </span>
        </div>
        <div className={pill}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="size-4 rounded-full bg-white/10" />
          ))}
        </div>
        <div className="hidden flex-1 justify-center sm:flex">
          <span className="flex h-10 items-center gap-2 rounded-full bg-white/[0.03] pl-1.5 pr-3.5 text-[12px] text-bone/35">
            <span className="flex size-7 items-center justify-center rounded-full bg-white/[0.05]">
              <Plus size={11} />
            </span>
            Open slot
          </span>
        </div>
        <div className={`${pill} hidden sm:flex`}>
          <span className="h-6 w-14 rounded-full bg-bone" />
        </div>
      </div>
      <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-[18px] bg-[radial-gradient(ellipse_at_30%_40%,#ff5a2c55,transparent_60%),radial-gradient(ellipse_at_70%_70%,#3a0ca366,transparent_60%)]" />
    </div>
  );
}

function Nav() {
  const [solid, setSolid] = useState(false);
  useLenis(({ scroll }) => setSolid(scroll > 20));
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[150%] backdrop-blur-xl transition-opacity duration-500 ${solid ? "opacity-100" : "opacity-0"}`}
        style={{ maskImage: "linear-gradient(to bottom, black 35%, transparent)" }}
      />
      <nav className="relative mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-7">
          <Link href="/" aria-label="Imaginry home" className="group text-bone">
            <Logo size={26} />
          </Link>
          <div className="hidden gap-6 text-[14px] text-bone/65 md:flex">
            <Link href="/gallery" className="hover:text-bone">
              Gallery
            </Link>
            <Link href="/studio" className="hover:text-bone">
              Studio
            </Link>
            <Link href="/sponsor" aria-current="page" className="flex items-center gap-1.5 text-bone">
              <span className="size-1.5 rounded-full bg-ember" />
              Sponsor
            </Link>
          </div>
        </div>
        <a
          href="#plans"
          className="press inline-flex h-9 items-center rounded-full bg-bone px-4 text-[14px] font-medium text-ink hover:bg-white"
        >
          See plans
        </a>
      </nav>
    </header>
  );
}

export default function SponsorPage() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [open, setOpen] = useState<number | null>(0);
  const looks = useLookImages(GALLERY.slice(0, 3), 520);

  return (
    <ReactLenis root options={{ lerp: 0.08 }}>
      <div className="min-h-screen bg-ink text-bone selection:bg-ember/40">
        <Nav />

        {/* Hero */}
        <section className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-24 pt-32 md:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-40">
          <div className="pointer-events-none absolute left-[10%] top-10 h-[50vh] w-[50vw] rounded-full bg-ember/[0.07] blur-[140px]" />
          <div className="relative">
            <Reveal>
              <p className="font-condensed text-[15px] font-medium text-ember">Sponsor imaginry</p>
              <h1 className="mt-4 font-display text-[clamp(36px,5vw,66px)] leading-[0.98] tracking-[-0.025em]">
                Put your brand where people make things
              </h1>
            </Reveal>
            <Reveal delay={150} y={24}>
              <p className="mt-6 max-w-[460px] text-[16.5px] leading-relaxed text-bone/60">
                Designers, developers and makers open the studio to build backgrounds for their work. A sponsor slot sits
                right in the toolbar they use, linking to you. Book it by the week or by the month.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                <Button href="#plans" primary>
                  See plans <ArrowRight size={15} />
                </Button>
                <Button href="/studio">See the studio</Button>
              </div>
            </Reveal>
          </div>
          <Reveal delay={250} y={50} scale={0.94}>
            <BarMock />
          </Reveal>
        </section>

        {/* Placements */}
        <section className="mx-auto max-w-[1200px] px-4 pb-28 md:px-6">
          <Reveal className="mb-10">
            <p className="font-condensed text-[15px] font-medium text-ember">Placements</p>
            <h2 className="mt-3 font-display text-[clamp(28px,3.6vw,48px)] leading-[1] tracking-[-0.02em]">
              Three places to be seen
            </h2>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Studio top bar", "A chip with your logo and name, in the bar everyone works under."],
              ["Gallery, pinned", "A look in your palette, first in the gallery and the studio's Gallery tab."],
              ["Landing orbit", "Your card riding the orbit on the homepage, the first thing visitors see."],
            ].map(([title, body], i) => (
              <Reveal key={title} delay={i * 120} className="group rounded-[24px] bg-white/[0.04] p-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-surface">
                  {looks[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={looks[i]!}
                      alt=""
                      className="size-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    />
                  ) : (
                    <div className="skeleton size-full" />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 font-condensed text-[13px] backdrop-blur">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="px-2 pt-4 font-condensed text-[19px] font-semibold">{title}</h3>
                <p className="px-2 pb-2 pt-1.5 text-[14.5px] leading-relaxed text-bone/55">{body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section id="plans" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 pb-28 md:px-6">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-condensed text-[15px] font-medium text-ember">Plans</p>
              <h2 className="mt-3 font-display text-[clamp(28px,3.6vw,48px)] leading-[1] tracking-[-0.02em]">
                Weekly or monthly
              </h2>
            </div>
            <div className="w-[240px]">
              <Segmented label="Billing" value={billing} options={["weekly", "monthly"] as const} onChange={setBilling} />
            </div>
          </Reveal>

          <div className="grid gap-4 lg:grid-cols-3">
            {PLANS.map((plan, i) => {
              const perWeekOnMonthly = plan.price.monthly / 4.33;
              const saving = Math.round((1 - perWeekOnMonthly / plan.price.weekly) * 100);
              return (
                <Reveal
                  key={plan.id}
                  delay={i * 120}
                  className={`relative flex flex-col rounded-[26px] p-6 md:p-7 ${
                    plan.featured
                      ? "bg-surface shadow-[0_0_0_1.5px_rgba(255,90,44,0.6),0_40px_90px_-40px_rgba(255,90,44,0.5)]"
                      : "bg-white/[0.04]"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-6 rounded-full bg-ember px-3 py-1 text-[12px] font-medium text-ink">
                      Recommended
                    </span>
                  )}
                  <h3 className="font-condensed text-[22px] font-semibold">{plan.name}</h3>
                  <p className="mt-2 min-h-[44px] text-[14.5px] leading-relaxed text-bone/55">{plan.blurb}</p>
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="font-display text-[46px] leading-none tracking-[-0.03em]">
                      $<AnimatedPrice value={plan.price[billing]} />
                    </span>
                    <span className="text-[14px] text-bone/50">/ {billing === "weekly" ? "week" : "month"}</span>
                  </div>
                  <p className="mt-2 h-5 text-[13px] text-ember transition-opacity duration-300" style={{ opacity: billing === "monthly" && saving > 0 ? 1 : 0 }}>
                    About {saving}% less per week than weekly
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-[14.5px] text-bone/80">
                        <Check size={15} className="mt-0.5 shrink-0 text-ember" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={bookHref(plan, billing)}
                    className={`press mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full text-[14.5px] font-medium ${
                      plan.featured ? "bg-ember text-ink hover:brightness-110" : "bg-bone text-ink hover:bg-white"
                    }`}
                  >
                    Book {plan.name} <ArrowRight size={14} />
                  </a>
                </Reveal>
              );
            })}
          </div>
          <p className="mt-6 text-center text-[13.5px] text-bone/45">
            Prices in USD. Want something custom, like a longer run or a co-branded preset pack?{" "}
            <a href={SPONSOR_CONTACT} className="text-bone/80 underline-offset-4 hover:underline">
              Get in touch
            </a>
            .
          </p>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-[820px] px-4 pb-28 md:px-6">
          <Reveal className="mb-8 text-center">
            <h2 className="font-display text-[clamp(26px,3vw,40px)] leading-[1] tracking-[-0.02em]">Questions</h2>
          </Reveal>
          <div className="space-y-2">
            {FAQ.map(([q, a], i) => {
              const isOpen = open === i;
              return (
                <Reveal key={q} delay={i * 70} y={20}>
                  <div className={`rounded-[20px] transition-colors duration-300 ${isOpen ? "bg-white/[0.06]" : "bg-white/[0.03] hover:bg-white/[0.05]"}`}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15.5px] font-medium"
                    >
                      {q}
                      <ChevronDown
                        size={14}
                        className={`shrink-0 text-bone/50 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div
                      className="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}
                    >
                      <p className="overflow-hidden px-5 text-[14.5px] leading-relaxed text-bone/60">
                        <span className="block pb-5">{a}</span>
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Closing */}
        <section className="px-4 pb-16 md:px-6">
          <Reveal className="relative mx-auto max-w-[980px] overflow-hidden rounded-[36px] bg-surface px-6 py-16 text-center md:py-20">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[70%] -translate-x-1/2 rounded-full bg-ember/25 blur-[90px]" />
            <h2 className="relative mx-auto max-w-[640px] font-display text-[clamp(28px,4vw,52px)] leading-[1] tracking-[-0.025em]">
              Grab a slot before someone else does
            </h2>
            <p className="relative mx-auto mt-4 max-w-[420px] text-[15.5px] text-bone/60">
              There are only four places in the top bar. Book one by the week or by the month.
            </p>
            <div className="relative mt-8 flex justify-center gap-2.5">
              <Button href="#plans" primary>
                Choose a plan <ArrowRight size={15} />
              </Button>
              <Button href={SPONSOR_CONTACT}>Email us</Button>
            </div>
          </Reveal>
        </section>
        <footer className="mx-auto flex max-w-[1200px] justify-between px-4 pb-8 font-condensed text-[13px] text-bone/40 md:px-6">
          <Credit />
          <span>Sponsorships</span>
        </footer>
      </div>
    </ReactLenis>
  );
}
