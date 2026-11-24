import type { Metadata } from "next";
import Studio from "@/components/studio/Studio";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Studio",
  description:
    "Layer gradients, glass, grain, light leaks, glitch and 45+ more effects. Tweak every layer live, then export PNG, looping MP4/WebM/AV1 or an embed snippet with a free account.",
  path: "/studio",
  image: "/og/studio.png",
  imageAlt: "Imaginry effect studio with a folded coral glass ring",
});

export default function StudioPage() {
  return <Studio />;
}
