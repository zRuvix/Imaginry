import type { Metadata } from "next";
import SponsorPage from "@/components/sponsor/SponsorPage";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Sponsor",
  description:
    "Put your brand in front of designers every day. Book a studio bar slot, a gallery feature or the homepage spotlight — weekly or monthly.",
  path: "/sponsor",
  image: "/og/sponsor.png",
  imageAlt: "Sponsor Imaginry — put your brand in the studio",
});

export default function Page() {
  return <SponsorPage />;
}
