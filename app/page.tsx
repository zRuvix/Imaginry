import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Imaginry — generative textures and loops",
  description:
    "Stack gradients, glass, light and grain into one-off images and seamless looping backgrounds, rendered live in your browser.",
};

export default function Home() {
  return <Landing />;
}
