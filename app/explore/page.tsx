import type { Metadata } from "next";
import Explore from "@/components/explore/Explore";
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
  return <Explore />;
}
