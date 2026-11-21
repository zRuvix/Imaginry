"use client";

import Link from "next/link";
import { Plus } from "@/components/icons";
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

function OpenSlot({ index }: { index: number }) {
  return (
    <Link
      href="/sponsor"
      className="press anim-rise group flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-white/[0.025] pl-1.5 pr-3.5 text-[12.5px] text-bone/35 hover:bg-white/[0.07] hover:text-bone/80"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-white/[0.05] transition-[transform,background-color] duration-500 group-hover:rotate-90 group-hover:bg-ember group-hover:text-ink">
        <Plus size={12} />
      </span>
      Your brand here
    </Link>
  );
}

/**
 * Sponsors filling one of the top bar's gaps. Slots without a sponsor invite
 * brands to book them.
 */
export default function SponsorSlots({ sponsors, slots, offset }: { sponsors: Sponsor[]; slots: number; offset: number }) {
  return (
    // A slot shows only when it fits on one line; slots that don't fit wrap to a
    // second row that the fixed height clips, so the bar never crushes them.
    <div className="@container pointer-events-auto hidden min-w-0 flex-1 min-[1500px]:block" aria-label="Sponsors">
      <div className="hidden h-10 flex-wrap justify-center gap-x-2 gap-y-4 overflow-hidden @min-[9.5rem]:flex">
        {Array.from({ length: slots }, (_, i) => {
          const sponsor = sponsors[offset + i];
          return sponsor ? <SponsorChip key={sponsor.name} sponsor={sponsor} index={i} /> : <OpenSlot key={`open-${i}`} index={i} />;
        })}
      </div>
    </div>
  );
}
