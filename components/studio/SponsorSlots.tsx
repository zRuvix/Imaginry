"use client";

import type { Sponsor } from "@/lib/sponsors";

function SponsorChip({ sponsor, index, compact }: { sponsor: Sponsor; index: number; compact?: boolean }) {
  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noopener sponsored"
      title={`Sponsored by ${sponsor.name}`}
      aria-label={compact ? `Sponsored by ${sponsor.name}` : undefined}
      className={`press anim-rise group flex h-10 shrink-0 items-center whitespace-nowrap rounded-full bg-white/[0.04] text-[13px] text-bone/75 hover:bg-white/[0.09] hover:text-bone ${
        compact ? "w-10 justify-center" : "min-w-0 max-w-[15rem] gap-2 pl-1.5 pr-3.5"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bone/90 font-display text-[12px] text-ink transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
        {sponsor.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sponsor.logo} alt="" className="size-full object-cover" />
        ) : (
          sponsor.name.charAt(0)
        )}
      </span>
      {!compact && <span className="truncate">{sponsor.name}</span>}
    </a>
  );
}

// Container widths at which every chip in a gap fits, by chip count. Full chips
// are ~10rem each, logo-only chips 2.5rem; 0.5rem gaps between them. Literal
// class names so Tailwind can see them.
const FULL_FITS = ["", "@min-[10rem]:flex", "@min-[20.5rem]:flex", "@min-[31rem]:flex", "@min-[41.5rem]:flex"];
const FULL_HIDES = ["", "@min-[10rem]:hidden", "@min-[20.5rem]:hidden", "@min-[31rem]:hidden", "@min-[41.5rem]:hidden"];
const COMPACT_FITS = ["", "@min-[2.5rem]:flex", "@min-[5.5rem]:flex", "@min-[8.5rem]:flex", "@min-[11.5rem]:flex"];

/**
 * Sponsors filling one of the top bar's gaps. Shows full name chips when the
 * whole set fits, logo-only chips when only those fit, and nothing when even
 * the logos would crowd the bar. Renders nothing when the gap has no sponsors.
 */
export default function SponsorSlots({ sponsors }: { sponsors: Sponsor[] }) {
  const n = Math.min(sponsors.length, FULL_FITS.length - 1);
  if (n === 0) return null;
  const shown = sponsors.slice(0, n);

  return (
    <div className="@container pointer-events-auto min-w-0 flex-1" aria-label="Sponsors">
      <div className={`hidden h-10 justify-center gap-2 ${FULL_FITS[n]}`}>
        {shown.map((sponsor, i) => (
          <SponsorChip key={sponsor.name} sponsor={sponsor} index={i} />
        ))}
      </div>
      <div className={`hidden h-10 justify-center gap-2 ${COMPACT_FITS[n]} ${FULL_HIDES[n]}`}>
        {shown.map((sponsor, i) => (
          <SponsorChip key={sponsor.name} sponsor={sponsor} index={i} compact />
        ))}
      </div>
    </div>
  );
}
