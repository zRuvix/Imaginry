import type { Metadata } from "next";
import Studio from "@/components/studio/Studio";

export const metadata: Metadata = {
  title: "Studio — Imaginry",
};

export default function StudioPage() {
  return <Studio />;
}
