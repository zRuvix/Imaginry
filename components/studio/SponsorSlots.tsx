"use client";

import type { Sponsor } from "@/lib/sponsors";

function SponsorChip({ sponsor, index }: { sponsor: Sponsor; index: number }) {
  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noopener sponsored"
      title={`Sponsored by ${sponsor.name}`}
      className="press anim-rise group flex h-10 min-w-0 max-w-full shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-white/[0.04] pl-1.5 pr-3.5 text-[13px] text-bone/75 hover:bg-white/[0.09] hover:text-bone"
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
      <span className="truncate">{sponsor.name}</span>
    </a>
  );
}

/**
 * Sponsors filling one of the top bar's gaps. Renders nothing when this gap
 * has no booked sponsors.
 */
export default function SponsorSlots({ sponsors, slots, offset }: { sponsors: Sponsor[]; slots: number; offset: number }) {
  const shown = sponsors.slice(offset, offset + slots);
  if (shown.length === 0) return null;

  return (
    // A chip shows only when it fits on one line; chips that don't fit wrap to a
    // second row that the fixed height clips, so the bar never crushes them.
    <div className="@container pointer-events-auto hidden min-w-0 flex-1 min-[1500px]:block" aria-label="Sponsors">
      <div className="hidden h-10 flex-wrap justify-center gap-x-2 gap-y-4 overflow-hidden @min-[9.5rem]:flex">
        {shown.map((sponsor, i) => (
          <SponsorChip key={sponsor.name} sponsor={sponsor} index={i} />
        ))}
      </div>
    </div>
  );
}
