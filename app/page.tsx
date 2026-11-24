import AgentsContent from "@/components/landing/AgentsContent";
import Hero from "@/components/landing/Hero";
import LooksGallery from "@/components/landing/LooksGallery";
import Panel from "@/components/landing/Panel";
import PinnedFeatures from "@/components/landing/PinnedFeatures";
import PricingPlans from "@/components/landing/PricingPlans";
import SkyFooter from "@/components/landing/SkyFooter";
import SmoothScroll from "@/components/landing/SmoothScroll";
import StartAtTop from "@/components/landing/StartAtTop";

/** The root layout paints the page black for the studio; the landing is light end to end. */
const LIGHT_PAGE = "html,body{background:#eef1f3;color-scheme:light}";

export default function Home() {
  return (
    <SmoothScroll>
      <StartAtTop />
      <main className="site-frame min-h-full bg-[#eef1f3]">
        <style href="landing-light" precedence="high">{LIGHT_PAGE}</style>
        <PinnedFeatures hero={<Hero />} />
        <LooksGallery />
        <div className="flex flex-col gap-2 px-2 pb-2">
          <AgentsContent />
          <Panel id="pricing">
            <PricingPlans />
          </Panel>
        </div>
        <SkyFooter />
      </main>
    </SmoothScroll>
  );
}
