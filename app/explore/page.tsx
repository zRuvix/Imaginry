import type { Metadata } from "next";
import Link from "next/link";
import ExploreFeed from "@/components/landing/ExploreFeed";
import PageShell, { Panel } from "@/components/landing/PageShell";
import { BTN_MOTION } from "@/components/landing/buttonMotion";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Explore",
  description:
    "Backgrounds and textures people made in the Imaginry studio and shared. Open any design and remix it into your own.",
  path: "/explore",
  image: "/og/gallery.png",
  imageAlt: "Imaginry Explore — designs shared by the community",
});

export default function ExplorePage() {
  return (
    <PageShell
      badge={
        <>
          Explore
          <span className="rounded-[4px] bg-[#141414] px-1.5 py-px text-[10.5px] text-white xl:text-[12.5px]">Community</span>
        </>
      }
      lines={["Backgrounds people made,", "ready to remix"]}
      lead="Every design here was built in the studio and shared by the person who made it. Open one and make it yours. Shared designs carry effect settings only, never photos."
      actions={
        <Link
          href="/studio"
          className={`font-outfit inline-flex rounded-[10px] bg-[#1b1b1b] px-5 py-3 text-[14px] text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5)] hover:bg-[#2b2b2b] xl:rounded-[12px] xl:px-7 xl:py-4 xl:text-[16px] ${BTN_MOTION}`}
        >
          Make your own
        </Link>
      }
    >
      <Panel id="designs" title="Newest designs" intro="Fresh from the studio. Tap a design to open it, layers and all.">
        <ExploreFeed />
      </Panel>
    </PageShell>
  );
}
