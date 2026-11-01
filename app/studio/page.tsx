import type { Metadata } from "next";
import Studio from "@/components/studio/Studio";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Studio",
  description:
    "Layer gradients, glass, grain, light leaks, glitch and 45+ more effects. Tweak every layer live, then export PNG, looping MP4/WebM/AV1 or an embed snippet. Free, no sign-up.",
  path: "/studio",
  image: "/og/studio.png",
  imageAlt: "Imaginry Studio — layer it, loop it, ship it",
});

export default function StudioPage() {
  return <Studio />;
}
