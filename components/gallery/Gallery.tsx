"use client";

import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus, Search, Share2, X } from "@/components/icons";
import { useLookImages } from "@/components/landing/useLookImages";
import { GALLERY, GALLERY_TAGS, stateForLook, type CuratedLook, type GalleryTag } from "@/lib/studio/looks";
import { SPONSORS } from "@/lib/sponsors";
import { encodeShare } from "@/lib/studio/storage";
import { Logo } from "@/components/Logo";
import { Credit } from "@/components/Credit";

type Filter = "All" | GalleryTag;

const linkFor = (look: CuratedLook) => `/studio#${encodeShare(stateForLook(look))}`;

function Card({
  look,
  url,
  index,
  onCopy,
}: {
  look: CuratedLook;
  url: string | null;
  index: number;
  onCopy: (look: CuratedLook) => void;
}) {
  return (
    <article className="anim-rise group mb-4 break-inside-avoid" style={{ animationDelay: `${Math.min(index, 16) * 40}ms` }}>
      <div
        className="relative overflow-hidden rounded-[22px] bg-surface shadow-[0_24px_50px_-28px_rgba(0,0,0,0.9)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5"
        style={{ aspectRatio: String(look.ratio) }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={look.name}
            className="size-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="skeleton size-full" />
        )}
        {/* Actions fade up on hover */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-16 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <a
            href={linkFor(look)}
            className="press inline-flex h-10 translate-y-2 items-center gap-2 rounded-full bg-bone px-4 text-[13.5px] font-medium text-ink transition-transform duration-500 group-hover:translate-y-0 hover:bg-white"
          >
            Remix in studio <ArrowRight size={13} />
          </a>
          <button
            type="button"
            aria-label={`Copy a link to ${look.name}`}
            onClick={() => onCopy(look)}
            className="press flex size-10 translate-y-2 items-center justify-center rounded-full bg-black/45 text-bone backdrop-blur-md transition-transform delay-75 duration-500 group-hover:translate-y-0 hover:bg-black/65"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3 px-1">
        <div className="min-w-0">
          <h3 className="truncate font-condensed text-[16px] font-semibold text-bone">{look.name}</h3>
          <p className="truncate text-[13px] text-bone/50">{look.recipe}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          {look.tags?.map((t) => (
            <span key={t} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-bone/55">
              {t}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

/** Sponsors in the sidebar; an open slot invites brands when there are none. */
function SponsorBlock() {
  return (
    <div className="mb-3 rounded-[18px] bg-white/[0.04] p-3">
      <p className="px-1 pb-2 text-[12px] text-bone/45">Sponsored by</p>
      <div className="space-y-1.5">
        {SPONSORS.slice(0, 3).map((s) => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noopener sponsored"
            className="press group flex items-center gap-2.5 rounded-[12px] px-1.5 py-1.5 text-[13.5px] text-bone/80 hover:bg-white/[0.06] hover:text-bone"
          >
            <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bone/90 font-display text-[12px] text-ink transition-transform duration-500 group-hover:rotate-[-8deg]">
              {s.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logo} alt="" className="size-full object-cover" />
              ) : (
                s.name.charAt(0)
              )}
            </span>
            <span className="truncate">{s.name}</span>
          </a>
        ))}
        {SPONSORS.length < 3 && (
          <Link
            href="/sponsor"
            className="press group flex items-center gap-2.5 rounded-[12px] px-1.5 py-1.5 text-[13px] text-bone/45 hover:bg-white/[0.06] hover:text-bone"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-white/[0.06] transition-[transform,background-color] duration-500 group-hover:rotate-90 group-hover:bg-ember group-hover:text-ink">
              <Plus size={12} />
            </span>
            Your brand here
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Gallery() {
  const urls = useLookImages(GALLERY, 720);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; n: number } | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: GALLERY.length };
    for (const t of GALLERY_TAGS) c[t] = GALLERY.filter((l) => l.tags?.includes(t)).length;
    return c;
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GALLERY.map((look, i) => ({ look, url: urls[i] })).filter(
      ({ look }) =>
        (filter === "All" || look.tags?.includes(filter)) &&
        (!q || look.name.toLowerCase().includes(q) || look.recipe.toLowerCase().includes(q)),
    );
  }, [filter, query, urls]);

  const copy = async (look: CuratedLook) => {
    const url = `${window.location.origin}${linkFor(look)}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast({ msg: `Link to “${look.name}” copied`, n: Date.now() });
    } catch {
      setToast({ msg: "Couldn't reach the clipboard", n: Date.now() });
    }
  };
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const filters: Filter[] = ["All", ...GALLERY_TAGS];

  return (
    <ReactLenis root options={{ lerp: 0.08 }}>
      <div className="min-h-screen bg-ink text-bone selection:bg-ember/40">
        <div
          aria-hidden
          className="pointer-events-none fixed left-[30%] top-[-20%] h-[70vh] w-[60vw] rounded-full bg-ember/[0.07] blur-[140px]"
        />
        <div className="relative mx-auto flex max-w-[1600px] gap-6 px-4 md:px-6">
          {/* Sidebar */}
          <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col py-6 lg:flex">
            <div className="glass-panel flex h-full flex-col rounded-[26px] p-5">
              <Link href="/" aria-label="Imaginry home" className="press group self-start text-bone hover:text-white">
                <Logo size={28} textClass="text-[18px]" />
              </Link>
              <nav aria-label="Site" className="-ml-2.5 mt-3 flex gap-0.5 text-[13px]">
                {[
                  ["/gallery", "Gallery"],
                  ["/studio", "Studio"],
                  ["/sponsor", "Sponsor"],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={href === "/gallery" ? "page" : undefined}
                    className={`press rounded-full px-2.5 py-1 ${
                      href === "/gallery" ? "bg-white/[0.08] text-bone" : "text-bone/55 hover:text-bone"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <h1 className="mt-7 font-display text-[30px] leading-none tracking-[-0.02em]">Gallery</h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-bone/55">
                {GALLERY.length} premade looks. Open any of them in the studio and make it yours.
              </p>

              <label className="mt-5 flex h-10 items-center gap-2.5 rounded-[12px] bg-white/[0.05] px-3 transition-colors focus-within:bg-white/[0.09]">
                <Search size={14} className="text-bone/45" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search looks or effects"
                  aria-label="Search the gallery"
                  className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-bone/35"
                />
                {query && (
                  <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="press text-bone/50">
                    <X size={13} />
                  </button>
                )}
              </label>

              <nav aria-label="Moods" className="mt-5 space-y-0.5">
                {filters.map((f) => {
                  const on = filter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      aria-pressed={on}
                      className={`press flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-[14px] transition-colors ${
                        on ? "bg-white/[0.09] text-bone" : "text-bone/60 hover:bg-white/[0.04] hover:text-bone"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`size-1.5 rounded-full transition-all duration-500 ${on ? "scale-100 bg-ember" : "scale-0 bg-ember"}`}
                        />
                        {f}
                      </span>
                      <span className="font-outfit text-[12px] text-bone/40">{counts[f]}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto space-y-2 pt-6">
                <SponsorBlock />
                <Link
                  href="/studio"
                  className="press flex h-11 items-center justify-center gap-2 rounded-full bg-bone text-[14px] font-medium text-ink hover:bg-white"
                >
                  Open a blank studio <ArrowRight size={14} />
                </Link>
                <Credit className="block pt-2 text-center font-condensed text-[12.5px] text-bone/40" />
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1 py-6">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4 pt-2 lg:pt-6">
              <div>
                <Link href="/" aria-label="Imaginry home" className="group text-bone lg:hidden">
                  <Logo size={24} textClass="text-[16px]" />
                </Link>
                <h2 className="mt-4 font-display text-[clamp(28px,3.4vw,46px)] leading-[1] tracking-[-0.02em] lg:mt-0">
                  {filter === "All" ? "Every look" : `${filter} looks`}
                </h2>
                <p className="mt-2 text-[14px] text-bone/50">
                  {shown.length} {shown.length === 1 ? "design" : "designs"} · rendered live in your browser
                </p>
              </div>
              <Link href="/sponsor" className="press text-[13.5px] text-bone/60 hover:text-bone lg:hidden">
                Sponsor
              </Link>
              <Link
                href="/studio"
                className="press inline-flex h-10 items-center gap-2 rounded-full bg-bone px-4 text-[13.5px] font-medium text-ink hover:bg-white lg:hidden"
              >
                Open studio <ArrowRight size={13} />
              </Link>
            </header>

            {/* Mobile filters */}
            <div className="no-scrollbar -mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 lg:hidden">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`press h-9 shrink-0 rounded-full px-3.5 text-[13px] ${
                    filter === f ? "bg-bone text-ink" : "bg-white/[0.06] text-bone/70"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {shown.length === 0 ? (
              <p className="anim-rise py-24 text-center text-[15px] text-bone/50">No looks match that. Try another mood.</p>
            ) : (
              <div key={`${filter}-${query}`} className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
                {shown.map(({ look, url }, i) => (
                  <Card key={look.name} look={look} url={url} index={i} onCopy={copy} />
                ))}
              </div>
            )}
            <footer className="mt-12 pb-4 text-center font-condensed text-[13px] text-bone/40 lg:hidden">
              <Credit />
            </footer>
          </main>
        </div>

        {toast && (
          <div
            key={toast.n}
            role="status"
            className="anim-pop glass-panel fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-[13px]"
          >
            {toast.msg}
          </div>
        )}
      </div>
    </ReactLenis>
  );
}
