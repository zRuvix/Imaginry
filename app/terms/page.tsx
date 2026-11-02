import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_URL, OPERATOR } from "@/lib/legal";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Terms of Use",
  description:
    "The rules for using Imaginry: what you can do with your exports, what's not allowed, and the limits of a free browser studio.",
  path: "/terms",
  image: "/og/home.png",
  imageAlt: "Imaginry — backgrounds that move",
});

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement",
    body: (
      <p>
        These terms cover your use of imaginry.tech and everything on it (the &ldquo;service&rdquo;), run by {OPERATOR}.
        By using the service you agree to them. If you don&rsquo;t agree, please don&rsquo;t use it. Our{" "}
        <Link href="/privacy">privacy policy</Link> explains how we handle data.
      </p>
    ),
  },
  {
    id: "service",
    title: "The service",
    body: (
      <p>
        Imaginry is free and needs no account. You can optionally sign in with Google; signing in is never required to
        use the studio. It runs in your browser, so what you can do depends on your device and
        browser support for WebGL and video encoding. We may add, change or remove features, or pause the service, at any
        time.
      </p>
    ),
  },
  {
    id: "your-work",
    title: "Your work and exports",
    body: (
      <>
        <p>
          <strong>What you make is yours.</strong> Images, videos and embed code you export from Imaginry, including
          designs started from the gallery, can be used for personal and commercial projects. No attribution is required,
          though it&rsquo;s always appreciated.
        </p>
        <p>
          <strong>What you bring in.</strong> You&rsquo;re responsible for photos and other material you add to the
          studio. Only use content you have the right to use. It stays on your device and we never receive it.
        </p>
        <p>
          <strong>What you can&rsquo;t claim.</strong> You can&rsquo;t register the gallery looks or the effects themselves
          as your own trademark or sell them as a preset pack, template set or competing tool.
        </p>
      </>
    ),
  },
  {
    id: "share-links",
    title: "Share links",
    body: (
      <p>
        Short links you create store a design&rsquo;s settings so anyone with the link can open it. Treat them as public.
        We may delete links, or limit how many you can create, to protect the service.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>Please don&rsquo;t:</p>
        <ul>
          <li>use the service to break the law or infringe anyone&rsquo;s rights;</li>
          <li>flood, overload or attack the site, its API or its link service, or try to get around rate limits;</li>
          <li>scrape or mass-download the site or its gallery with automated tools;</li>
          <li>copy the site&rsquo;s code, shaders or design to run a copy of Imaginry;</li>
          <li>pretend to be Imaginry or suggest we endorse you.</li>
        </ul>
      </>
    ),
  },
  {
    id: "ours",
    title: "Our property",
    body: (
      <p>
        The Imaginry name, logo, website, source code, shaders and gallery presets belong to {OPERATOR}. These terms give
        you the right to use the service and your exports as described above, nothing more.
      </p>
    ),
  },
  {
    id: "sponsors",
    title: "Sponsors and links",
    body: (
      <p>
        Some brands pay to appear in the studio, gallery or homepage, and their links are marked as sponsored. We
        don&rsquo;t control and aren&rsquo;t responsible for sponsor or other third-party sites. Booking a placement is
        covered by our <Link href="/sponsor/terms">sponsor terms</Link>.
      </p>
    ),
  },
  {
    id: "disclaimer",
    title: "No warranty",
    body: (
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind. We
        don&rsquo;t promise it will be uninterrupted, error-free, or that exports will suit any particular purpose. Keep
        copies of anything important; saved designs live only in your browser.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the extent the law allows, {OPERATOR} isn&rsquo;t liable for indirect, incidental or consequential losses, or
        for lost data, profits or work, arising from your use of the service. For anything else, our total liability is
        limited to the amount you paid us in the 12 months before the claim, which for most people is nothing. Nothing in
        these terms limits rights you have as a consumer that can&rsquo;t be waived.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and contact",
    body: (
      <p>
        We may update these terms; the date at the top shows when. Continuing to use the service after a change means you
        accept it. Questions? <a href={CONTACT_URL} target="_blank" rel="noopener">Message us on X</a>.
      </p>
    ),
  },
];

export default function Page() {
  return (
    <LegalPage
      title="Terms of Use"
      summary={
        <p>
          Use Imaginry freely, keep what you make, and use it however you like, including commercially. Just don&rsquo;t
          abuse the service or pass the tool itself off as yours.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
