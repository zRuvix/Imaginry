import type { ReactNode } from "react";

/** A white content panel in the site frame, with an optional heading row. */
export default function Panel({
  id,
  title,
  intro,
  aside,
  children,
}: {
  id?: string;
  title?: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-h` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-2 rounded-[24px] bg-white px-5 py-[clamp(2.5rem,8svh,5.5rem)] sm:rounded-[28px] sm:px-8 xl:px-10">
      {title && (
        <div className="mb-[clamp(2rem,6svh,3.5rem)] grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <h2 id={headingId} className="font-lexend text-[clamp(2rem,min(4.2vw,8svh),4.5rem)] font-light leading-[1.02] tracking-[-0.045em] text-[#121416]">
              {title}
            </h2>
            {intro && <p className="font-outfit mt-4 max-w-[48ch] text-[14.5px] leading-relaxed text-[#6b7075] xl:text-[16px]">{intro}</p>}
          </div>
          {aside && <div className="lg:justify-self-end">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
