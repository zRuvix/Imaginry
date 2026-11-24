import type { ReactNode } from "react";
export { default as Panel } from "./Panel";
import Navbar from "./Navbar";
import SkyFooter from "./SkyFooter";
import SmoothScroll from "./SmoothScroll";
import { HeroSky } from "./HeroSky";
import { EnterFade, EnterLines } from "./Enter";
import { afterLines } from "./enterTiming";

/** The root layout paints the page black for the studio; site pages are light end to end. */
const LIGHT_PAGE = "html,body{background:#eef1f3;color-scheme:light}";

/**
 * Frame for every site page after the landing: a shorter sky panel with the
 * navbar and the page's headline, the page's own panels, then the sky footer.
 * Same 8px gutter, rounded panels and light ground as the landing.
 */
export default function PageShell({
  badge,
  lines,
  lead,
  actions,
  children,
}: {
  badge: ReactNode;
  /** The h1, one entry per line. */
  lines: string[];
  lead: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const after = afterLines(lines.length);
  return (
    <SmoothScroll>
      <main className="site-frame min-h-full bg-[#eef1f3] pt-2">
        <style href="landing-light" precedence="high">{LIGHT_PAGE}</style>

        <div className="px-2">
          <section className="relative isolate flex min-h-[clamp(440px,64svh,680px)] flex-col overflow-clip rounded-[24px] sm:rounded-[28px]">
            <HeroSky />
            <Navbar />
            <div className="relative z-[5] flex flex-1 flex-col items-center justify-center px-4 pb-[clamp(3rem,10svh,6rem)] pt-10 text-center">
              <EnterFade>
                <span className="font-outfit inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11.5px] text-[#3a3d40] shadow-[0_1px_2px_rgba(20,30,40,0.08)] xl:px-2.5 xl:py-1.5 xl:text-[13.5px]">
                  {badge}
                </span>
              </EnterFade>
              <EnterLines
                className="font-lexend mt-[clamp(1rem,2.6svh,1.75rem)] text-[clamp(2.1rem,min(5.4vw,8svh),5.25rem)] font-light leading-[1.02] tracking-[-0.045em] text-[#121416] [text-wrap:balance]"
                lines={lines}
              />
              <EnterFade delay={after} className="mt-5 max-w-[46ch]">
                <p className="font-outfit text-[15px] leading-relaxed text-[#3a3d40] xl:text-[17px]">{lead}</p>
              </EnterFade>
              {actions && (
                <EnterFade delay={after + 0.06} className="mt-7 flex flex-wrap justify-center gap-2">
                  {actions}
                </EnterFade>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-2 px-2 pt-2">{children}</div>

        <div className="pt-2">
          <SkyFooter />
        </div>
      </main>
    </SmoothScroll>
  );
}
