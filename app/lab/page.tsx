import type { Metadata } from "next";
import Lab from "@/components/lab/Lab";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Lab",
  description:
    "Lab-only styles like liquid chrome, silk, caustics and holographic foil. Keyframe them on a timeline, make them react to the cursor, scroll and music, and export an interactive embed or a video cut to your track.",
  path: "/lab",
  image: "/og/studio.png",
  imageAlt: "Imaginry Lab: liquid chrome with a keyframe timeline",
});

export default function LabPage() {
  return <Lab />;
}
