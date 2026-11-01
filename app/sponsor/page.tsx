import type { Metadata } from "next";
import SponsorPage from "@/components/sponsor/SponsorPage";

export const metadata: Metadata = {
  title: "Sponsor — Imaginry",
  description: "Put your brand in the Imaginry studio, gallery and homepage. Weekly and monthly plans.",
};

export default function Page() {
  return <SponsorPage />;
}
