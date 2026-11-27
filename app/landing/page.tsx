import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import SmoothScroll from "@/components/landing/SmoothScroll";
import RuinsHero from "@/components/landing-v2/RuinsHero";
import Showcase from "@/components/landing-v2/Showcase";
import Gallery from "@/components/landing-v2/Gallery";
import Agents from "@/components/landing-v2/Agents";
import Pricing from "@/components/landing-v2/Pricing";
import SunsetFooter from "@/components/landing-v2/SunsetFooter";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Landing",
  robots: { index: false, follow: false },
};

/** The root layout paints the page black for the studio; this page is light. */
const LIGHT_PAGE = "html,body{background:#e9eef4;color-scheme:light}";

export default function LandingPage() {
  return (
    <SmoothScroll>
      <main className={`${figtree.variable} min-h-full bg-[#e9eef4]`}>
        <style href="landing-v2-light" precedence="high">{LIGHT_PAGE}</style>
        <RuinsHero />
        <Showcase />
        <Gallery />
        <Agents />
        <Pricing />
        <SunsetFooter />
      </main>
    </SmoothScroll>
  );
}
