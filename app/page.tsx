import type { Metadata } from "next";
import Home from "@/components/home/Home";
import { CREATOR_URL, DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    description: DEFAULT_DESCRIPTION,
    path: "/",
    image: "/og/home.png",
    imageAlt: "Imaginry — backgrounds that move",
  }),
  other: { "page-type": "software", "site-kind": "software" },
};

/**
 * Runs before first paint: turns the heading reveals on only when motion is
 * welcome, and turns them back off if the page's script never arrives, so
 * no heading can stay hidden.
 */
const REVEAL_BOOT = `(function(){var d=document.documentElement;if(!matchMedia("(prefers-reduced-motion: no-preference)").matches)return;d.classList.add("rv-on");setTimeout(function(){if(!window.__imaginryHome)d.classList.remove("rv-on")},4000)})()`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  applicationCategory: "DesignApplication",
  operatingSystem: "Any (modern browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  image: `${SITE_URL}/og/home.png`,
  creator: { "@type": "Person", name: "zRuvix", url: CREATOR_URL },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
      />
      <script dangerouslySetInnerHTML={{ __html: REVEAL_BOOT }} />
      <Home />
    </>
  );
}
