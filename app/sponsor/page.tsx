import type { Metadata } from "next";
import Image from "next/image";
import PageShell, { Panel } from "@/components/landing/PageShell";
import SponsorFaq from "@/components/landing/SponsorFaq";
import SponsorPlans from "@/components/landing/SponsorPlans";
import { PLANS } from "@/lib/sponsors";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Sponsor",
  description:
    "Put your brand in front of designers every day. Book a studio bar slot, a gallery feature or the homepage spotlight — weekly or monthly.",
  path: "/sponsor",
  image: "/og/sponsor.png",
  imageAlt: "Sponsor Imaginry — put your brand in the studio",
});

const fromPrice = Math.min(...PLANS.map((p) => p.price.weekly));

export default function SponsorPage() {
  return (
    <PageShell
      badge={
        <>
          Sponsor
          <span className="rounded-[4px] bg-[#141414] px-1.5 py-px text-[10.5px] text-white xl:text-[12.5px]">From ${fromPrice} a week</span>
        </>
      }
      lines={["Put your brand where", "designers work"]}
      lead="Your logo in the studio's top bar, a look built in your colours, or the whole site. Book by the week or the month."
      actions={
        <a
          href="#plans"
          className="blue-button blue-button-large"
        >
          See the plans
        </a>
      }
    >
      <Panel
        id="where"
        title="Right in the studio's top bar"
        intro="Every plan puts a chip with your logo and name in the bar people look at while they work. It links straight to your site."
      >
        <div className="mx-auto max-w-[1100px] rounded-[18px] bg-white p-1.5 shadow-[0_1px_2px_rgba(20,30,40,0.06),0_40px_80px_-30px_rgba(20,40,60,0.45)] ring-1 ring-black/[0.05] sm:rounded-[22px] sm:p-2">
          <Image
            src="/landing/studio.webp"
            alt="The imaginry studio, with the sponsor slot reading Your brand here at the top right of its bar"
            width={1919}
            height={1079}
            sizes="(min-width: 1180px) 1100px, 100vw"
            className="h-auto w-full rounded-[12px] sm:rounded-[15px]"
          />
        </div>
      </Panel>

      <Panel id="plans" title="Three ways in" intro="Prices are per placement. Book by message, send your logo and link, and pick a start date.">
        <SponsorPlans />
      </Panel>

      <Panel id="faq" title="Before you book">
        <SponsorFaq />
      </Panel>
    </PageShell>
  );
}
