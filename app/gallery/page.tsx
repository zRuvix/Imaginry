import type { Metadata } from "next";
import Gallery from "@/components/gallery/Gallery";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Gallery",
  description:
    "36 ready-made generative backgrounds — warm, neon, retro, glass and more. Open any look in the Imaginry studio and remix it in seconds.",
  path: "/gallery",
  image: "/og/gallery.png",
  imageAlt: "Imaginry Gallery — 36 looks ready to remix",
});

export default function GalleryPage() {
  return <Gallery />;
}
