import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import { CREATOR_URL, DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  description: DEFAULT_DESCRIPTION,
  path: "/",
  image: "/og/home.png",
  imageAlt: "Imaginry — backgrounds that move",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  applicationCategory: "DesignApplication",
  operatingSystem: "Any (WebGL2 browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  image: `${SITE_URL}/og/home.png`,
  creator: { "@type": "Person", name: "zRuvix", url: CREATOR_URL },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
      />
      <Landing />
    </>
  );
}
