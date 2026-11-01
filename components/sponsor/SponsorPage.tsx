"use client";

import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Plus } from "@/components/icons";
import { Reveal } from "@/components/landing/motion";
import { useLookImages } from "@/components/landing/useLookImages";
import { Segmented } from "@/components/studio/controls";
import { GALLERY } from "@/lib/studio/looks";
import { PLANS, type Billing } from "@/lib/sponsors";
import { CREATOR_URL } from "@/lib/seo";
import { Logo, LogoMark } from "@/components/Logo";
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

/** Rendered once for the hero and the placement cards. */
const SHOWCASE = GALLERY.slice(0, 11);

/** A pointer that glides to the sponsor chip, clicks it, and drifts away. */
function Pointer() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="sponsor-pointer pointer-events-none absolute left-[46%] top-[40%] z-40 size-6 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
    >
      <path d="M5 3l14 7.2-6.1 1.6-2.5 5.9L5 3z" fill="#ede7dc" stroke="#0d0c0b" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/** The sponsor chip as it appears in the studio. */
function SponsorChip({ small }: { small?: boolean }) {
  return (
    <span
      className={`sponsor-glow relative flex shrink-0 items-center rounded-full bg-ember/15 text-bone ${
        small ? "h-6 gap-1 pl-0.5 pr-2 text-[9px]" : "h-10 gap-2 pl-1.5 pr-4 text-[13px]"
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-full bg-ember font-display text-ink ${
          small ? "size-5 text-[8px]" : "size-7 text-[12px]"
        }`}
      >
        Y
      </span>
      Your brand
    </span>
  );
}

/** A miniature studio: top bar with the sponsor slot, a design, panels and the layer dock. */
function StudioMock({ image }: { image: string | null }) {
  const pill = "glass-panel flex h-10 items-center gap-2 rounded-full px-3";
  const minPrice = Math.min(...PLANS.map((p) => p.price.weekly));
  return (
    <div className="relative">
      <div className="relative rounded-[26px] bg-surface p-3 shadow-[0_40px_100px_-40px_rgba(255,90,44,0.35)] md:p-4">
        <div className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-ember/20 blur-[80px]" />

        {/* Top bar */}
        <div className="relative z-30 flex items-center gap-2">
          <div className={`${pill} pl-1.5`}>
            <LogoMark size={26} />
            <span className="hidden font-display text-[12px] text-bone sm:inline">imaginry</span>
          </div>
          <div className="relative">
            <SponsorChip />
            <span className="sponsor-card absolute left-0 top-[calc(100%+10px)] w-[210px] rounded-[16px] bg-ink/90 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
              <span className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-[10px] bg-ember font-display text-[13px] text-ink">
                  Y
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-bone">Your brand</span>
                  <span className="flex items-center gap-1 text-[11.5px] text-bone/55">
                    yourbrand.com <ArrowUpRight size={11} />
                  </span>
                </span>
              </span>
              <span className="mt-2 block font-condensed text-[11px] text-bone/35">Sponsored</span>
            </span>
          </div>
          <span className="hidden h-10 items-center gap-2 rounded-full bg-white/[0.03] pl-1.5 pr-3.5 text-[12px] text-bone/35 xl:flex">
            <span className="flex size-7 items-center justify-center rounded-full bg-white/[0.05]">
              <Plus size={11} />
            </span>
            Open slot
          </span>
          <div className="flex-1" />
          <div className={`${pill} hidden sm:flex`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="size-4 rounded-full bg-white/10" />
            ))}
          </div>
          <div className={pill}>
            <span className="h-6 w-12 rounded-full bg-bone" />
          </div>
        </div>

        {/* Stage */}
        <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-[18px] bg-raised">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="anim-pop absolute inset-0 size-full object-cover" />
          ) : (
            <div className="skeleton absolute inset-0" />
          )}
          {/* Library and inspector, as frosted ghosts */}
          <div className="absolute bottom-3 left-3 top-3 hidden w-[19%] flex-col gap-1.5 rounded-[14px] bg-black/30 p-2 backdrop-blur-md sm:flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="h-[16%] rounded-[8px] bg-white/10" style={{ opacity: 1 - i * 0.14 }} />
            ))}
          </div>
          <div className="absolute bottom-3 right-3 top-3 hidden w-[19%] flex-col gap-2.5 rounded-[14px] bg-black/30 p-2.5 backdrop-blur-md sm:flex">
            {[70, 45, 85, 55, 30].map((w, i) => (
              <span key={i} className="flex flex-col gap-1">
                <span className="h-1 w-[40%] rounded-full bg-white/20" />
                <span className="h-1.5 rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-bone/60" style={{ width: `${w}%` }} />
                </span>
              </span>
            ))}
          </div>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-black/35 p-1 backdrop-blur-md">
            {["Gradient", "Waves", "Iridescent", "Grain"].map((l, i) => (
              <span
                key={l}
                className={`rounded-full px-2.5 py-1 font-condensed text-[10.5px] ${i === 2 ? "bg-bone text-ink" : "text-bone/70"}`}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
        <Pointer />
      </div>

      {/* Facts under the window */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["4", "slots in the bar"],
          [`$${minPrice}`, "a week to start"],
          ["1 click", "to your site"],
        ].map(([big, small]) => (
          <div key={small} className="rounded-[18px] bg-white/[0.04] px-4 py-3">
            <p className="font-display text-[clamp(16px,1.8vw,22px)] leading-none text-bone">{big}</p>
            <p className="mt-1.5 font-condensed text-[13px] text-bone/50">{small}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const Img = ({ src, className }: { src: string | null; className?: string }) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`anim-pop object-cover ${className ?? ""}`} />
  ) : (
    <span className={`skeleton block ${className ?? ""}`} />
  );

/** 01: the studio bar over a design, with the sponsor chip lit. */
function BarScene({ images }: { images: (string | null)[] }) {
  return (
    <>
      <Img
        src={images[0]}
        className="absolute inset-0 size-full transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />
      <div className="absolute inset-x-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 p-1.5 backdrop-blur-md transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-1">
        <LogoMark size={22} />
        <SponsorChip small />
        <span className="flex-1" />
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-3 rounded-full bg-white/15" />
        ))}
        <span className="h-4 w-8 rounded-full bg-bone/80" />
      </div>
    </>
  );
}

/** 02: the gallery grid with a look in your palette pinned first. */
function GalleryScene({ images }: { images: (string | null)[] }) {
  return (
    <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1.5 bg-raised p-1.5">
      <div className="relative col-span-2 row-span-2 overflow-hidden rounded-[12px] ring-2 ring-inset ring-ember">
        <Img
          src={images[1]}
          className="absolute inset-0 size-full transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-ember px-2 py-0.5 font-condensed text-[11px] font-semibold text-ink">
          Pinned
        </span>
        <span className="absolute inset-x-2 bottom-2 rounded-[10px] bg-black/50 px-2.5 py-1.5 backdrop-blur-md">
          <span className="block text-[11.5px] font-medium text-bone">Your brand look</span>
          <span className="block font-condensed text-[10px] text-bone/55">Made in your palette</span>
        </span>
      </div>
      {[2, 3].map((n) => (
        <div key={n} className="relative overflow-hidden rounded-[10px] opacity-60">
          <Img src={images[n]} className="absolute inset-0 size-full" />
        </div>
      ))}
    </div>
  );
}

/** 03: the homepage orbit, with your card riding at the front. */
function OrbitScene({ images }: { images: (string | null)[] }) {
  const ring = [
    { x: -36, s: 0.55, o: 0.4, img: images[4] },
    { x: 36, s: 0.55, o: 0.4, img: images[5] },
    { x: -21, s: 0.76, o: 0.75, img: images[6] },
    { x: 21, s: 0.76, o: 0.75, img: images[7] },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,#2a1c14,#120f0d_70%)]">
      <span className="absolute inset-x-0 top-[11%] text-center font-display text-[12px] text-bone/70">
        Textures that didn’t exist
      </span>
      {ring.map((c, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-[58%] aspect-[4/5] w-[28%] overflow-hidden rounded-[10px]"
          style={{
            transform: `translate(calc(-50% + ${c.x * 3.2}%), -50%) scale(${c.s})`,
            opacity: c.o,
            filter: c.s < 0.6 ? "blur(1.5px)" : undefined,
          }}
        >
          <Img src={c.img} className="absolute inset-0 size-full" />
        </div>
      ))}
      <div className="absolute left-1/2 top-[58%] aspect-[4/5] w-[30%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[12px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] ring-2 ring-inset ring-ember transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-[56%]">
        <Img src={images[8]} className="absolute inset-0 size-full" />
        <span className="absolute inset-x-1.5 bottom-1.5 rounded-[8px] bg-black/55 px-1.5 py-1 text-center font-condensed text-[10px] text-bone backdrop-blur">
          Your brand
        </span>
      </div>
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
  const looks = useLookImages(SHOWCASE, 520);

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
            <StudioMock image={looks[9]} />
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
            {(
              [
                ["Studio top bar", "A chip with your logo and name, in the bar everyone works under.", BarScene],
                ["Gallery, pinned", "A look in your palette, first in the gallery and the studio's Gallery tab.", GalleryScene],
                ["Landing orbit", "Your card riding the orbit on the homepage, the first thing visitors see.", OrbitScene],
              ] as const
            ).map(([title, body, Scene], i) => (
              <Reveal key={title} delay={i * 120} className="group rounded-[24px] bg-white/[0.04] p-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-surface">
                  <Scene images={looks} />
                  <span className="absolute bottom-3 right-3 z-20 rounded-full bg-black/55 px-2.5 py-1 font-condensed text-[13px] backdrop-blur">
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
                    href={CREATOR_URL}
                    target="_blank"
                    rel="noopener"
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
            <a
              href={CREATOR_URL}
              target="_blank"
              rel="noopener"
              className="text-bone/80 underline-offset-4 hover:underline"
            >
              Get in touch
            </a>
            .
          </p>
          <p className="mt-2 text-center text-[13.5px] text-ember/80">
            Founding rates while Imaginry is new — they go up as the audience grows.
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
              <Button href={CREATOR_URL}>Message us on X</Button>
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
