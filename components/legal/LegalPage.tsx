import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import CurtainFooter from "@/components/landing/CurtainFooter";
import { LEGAL_UPDATED } from "@/lib/legal";

export type LegalSection = { id: string; title: string; body: ReactNode };

/**
 * Shared shell for the legal pages: a quiet header, a short summary, a table
 * of contents and numbered sections set for reading, over the site footer.
 */
export default function LegalPage({
  title,
  summary,
  sections,
}: {
  title: string;
  summary: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <ReactLenis root options={{ lerp: 0.08 }}>
      <CurtainFooter className="min-h-screen text-bone">
        <header className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="Imaginry home" className="group text-bone">
            <Logo size={26} />
          </Link>
          <Link
            href="/studio"
            className="press inline-flex h-9 items-center rounded-full bg-bone px-4 text-[14px] font-medium text-ink hover:bg-white"
          >
            Open studio
          </Link>
        </header>

        <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-14 md:px-6 md:pt-24">
          <div className="max-w-[720px]">
            <p className="font-condensed text-[14px] text-dim">Last updated {LEGAL_UPDATED}</p>
            <h1 className="mt-3 font-display text-[clamp(36px,6vw,64px)] leading-[0.95] tracking-[-0.03em]">{title}</h1>
            <div className="mt-6 text-[17px] leading-relaxed text-bone/75">{summary}</div>
          </div>

          <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-[220px_1fr] md:gap-16">
            <nav aria-label="On this page" className="md:sticky md:top-8 md:self-start">
              <p className="font-condensed text-[14px] text-bone/50">On this page</p>
              <ol className="mt-4 space-y-2 text-[14.5px]">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="flex gap-2.5 text-bone/70 transition-colors hover:text-bone">
                      <span className="w-5 shrink-0 tabular-nums text-dim">{i + 1}</span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="max-w-[680px] space-y-14">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-8">
                  <h2 className="flex gap-3 text-[22px] font-medium tracking-tight">
                    <span className="tabular-nums text-ember">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-[16px] leading-[1.7] text-bone/75 [&_a]:text-bone [&_a]:underline [&_a]:decoration-bone/30 [&_a]:underline-offset-[3px] [&_a:hover]:decoration-ember [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-bone [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-dim">
                    {s.body}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </CurtainFooter>
    </ReactLenis>
  );
}

