import Hero from "@/components/landing/Hero";
import LooksGallery from "@/components/landing/LooksGallery";
import PinnedFeatures from "@/components/landing/PinnedFeatures";
import SkyFooter from "@/components/landing/SkyFooter";
import SmoothScroll from "@/components/landing/SmoothScroll";

/** The root layout paints the page black for the studio; the landing is light end to end. */
const LIGHT_PAGE = "html,body{background:#eef1f3;color-scheme:light}";

export default function Home() {
  return (
    <SmoothScroll>
      <main className="min-h-full bg-[#eef1f3]">
        <style href="landing-light" precedence="high">{LIGHT_PAGE}</style>
        <PinnedFeatures hero={<Hero />} />
        <LooksGallery />
        <SkyFooter />
      </main>
    </SmoothScroll>
  );
}
