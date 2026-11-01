import type { Metadata } from "next";
import Gallery from "@/components/gallery/Gallery";

export const metadata: Metadata = {
  title: "Gallery — Imaginry",
  description: "Premade generative textures and backgrounds. Open any look in the studio and remix it.",
};

export default function GalleryPage() {
  return <Gallery />;
}
