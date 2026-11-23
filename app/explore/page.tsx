import type { Metadata } from "next";
import Link from "next/link";
import ExploreFeed from "@/components/landing/ExploreFeed";
import PageShell, { Panel } from "@/components/landing/PageShell";
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
          className="blue-button blue-button-large"
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
