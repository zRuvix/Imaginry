import type { Metadata } from "next";
import RenderPng from "./RenderPng";

/** Internal page the server-side PNG renderer opens in headless Chromium. Not for people. */
export const metadata: Metadata = {
  title: "Render",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RenderPng />;
}
