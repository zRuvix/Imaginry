import type { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import SkyFooter from "@/components/landing/SkyFooter";
import SmoothScroll from "@/components/landing/SmoothScroll";
import { LEGAL_UPDATED } from "@/lib/legal";
import { LegalSwitch, LegalToc } from "./LegalNav";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** The root layout paints the page black for the studio; site pages are light end to end. */
const LIGHT_PAGE = "html,body{background:#eef1f3;color-scheme:light}";

/** Content width inside the panels: real margin on both sides on wide screens. */
const WRAP = "mx-auto w-full max-w-[1180px] px-5 sm:px-10 lg:px-14";

/**
 * Legal pages in the site's light frame. A header panel with a soft sky wash,
 * the page switcher, a bold title, the summary and two facts; then one white
 * panel holding a sticky contents list beside the numbered sections; then the
 * footer. Everything sits in a centred column with room on both sides.
 */
export default function LegalLayout({
  title,
  summary,
  sections,
}: {
  title: string;
  summary: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <SmoothScroll>
      <main className="min-h-full bg-[#eef1f3] pt-2">
        <style href="landing-light" precedence="high">{LIGHT_PAGE}</style>

        <div className="px-2">
          <header className="relative isolate overflow-clip rounded-[24px] bg-[linear-gradient(180deg,#d6e5f3_0%,#eaf1f8_38%,#ffffff_78%)] sm:rounded-[28px]">
            <Navbar />
            <div className={`${WRAP} pb-[clamp(3rem,8svh,5.5rem)] pt-[clamp(3rem,10svh,6.5rem)]`}>
              {/* No entrance here: moving between legal pages should feel like switching a tab, not a new page */}
              <LegalSwitch />
              <h1 className="font-lexend mt-8 text-[clamp(2.75rem,6.5vw,6.25rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-[#121416]">
                {title}
              </h1>
              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
                <div className="font-outfit max-w-[62ch] text-[16.5px] leading-[1.7] text-[#3f454b] xl:text-[18px] [&_a]:text-[#141414] [&_a]:underline [&_a]:underline-offset-4">
                  {summary}
                </div>
                <dl className="font-outfit flex gap-2">
                  <div className="rounded-[14px] bg-white/80 px-4 py-3 ring-1 ring-black/[0.05] backdrop-blur">
                    <dt className="text-[12.5px] text-[#7b8188]">Last updated</dt>
                    <dd className="mt-0.5 text-[15px] font-semibold text-[#141414]">{LEGAL_UPDATED}</dd>
                  </div>
                  <div className="rounded-[14px] bg-white/80 px-4 py-3 ring-1 ring-black/[0.05] backdrop-blur">
                    <dt className="text-[12.5px] text-[#7b8188]">Sections</dt>
                    <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-[#141414]">{sections.length}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </header>
        </div>

        <div className="px-2 pt-2">
          <div className="rounded-[24px] bg-white py-[clamp(2.5rem,7svh,5rem)] sm:rounded-[28px]">
            <div className={`${WRAP} grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16 xl:gap-24`}>
              <aside className="hidden lg:block">
                <div className="sticky top-8">
                  <LegalToc sections={sections.map(({ id, title }) => ({ id, title }))} />
                </div>
              </aside>

              <article>
                {sections.map((s, i) => (
                  <section
                    key={s.id}
                    id={s.id}
                    className="scroll-mt-6 border-t border-black/[0.07] py-[clamp(2rem,5svh,3rem)] first:border-t-0 first:pt-0"
                  >
                    <p className="font-outfit text-[13px] font-semibold tabular-nums text-[#9aa0a6]">{String(i + 1).padStart(2, "0")}</p>
                    <h2 className="font-lexend mt-2 text-[clamp(1.5rem,2.3vw,2.1rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-[#121416]">
                      {s.title}
                    </h2>
                    <div className="font-outfit mt-4 max-w-[70ch] space-y-4 text-[16px] leading-[1.75] text-[#4f555b] xl:text-[17px] [&_a]:text-[#141414] [&_a]:underline [&_a]:decoration-black/25 [&_a]:underline-offset-4 [&_a:hover]:decoration-[#141414] [&_code]:rounded [&_code]:bg-[#f3f4f5] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:text-[#141414] [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-[#141414] [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-5 [&_ul]:marker:text-[#b4b8bc]">
                      {s.body}
                    </div>
                  </section>
                ))}
              </article>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <SkyFooter />
        </div>
      </main>
    </SmoothScroll>
  );
}
