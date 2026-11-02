import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_URL, OPERATOR } from "@/lib/legal";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Privacy Policy",
  description:
    "How Imaginry handles your data: designs render on your device, photos never leave it, no accounts, no ad cookies, and only anonymous usage stats.",
  path: "/privacy",
  image: "/og/home.png",
  imageAlt: "Imaginry — backgrounds that move",
});

const SECTIONS: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <p>
        Imaginry (imaginry.tech) is a free browser studio for generative backgrounds, run by {OPERATOR}. In this policy
        &ldquo;we&rdquo; means {OPERATOR} and &ldquo;you&rdquo; means anyone using the site. We are the controller of the
        small amount of data described below.
      </p>
    ),
  },
  {
    id: "on-device",
    title: "What stays on your device",
    body: (
      <>
        <p>Most of Imaginry never touches our servers:</p>
        <ul>
          <li>
            <strong>Rendering and exports.</strong> Every effect runs on your GPU in the browser. PNGs, videos and embed
            code are generated locally and downloaded straight from your browser.
          </li>
          <li>
            <strong>Photos you add.</strong> An image you drop into the studio is opened locally and is never uploaded.
            It is also left out of share links, saved designs and embed code.
          </li>
          <li>
            <strong>Saved designs.</strong> Designs you save are kept in your browser&rsquo;s local storage. Clearing
            your site data deletes them, and we can&rsquo;t see or recover them.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <ul>
          <li>
            <strong>Short links.</strong> When you create a short share link, we store the design&rsquo;s settings
            (colors, effects, values) under a code derived from those settings. It contains no personal information and
            isn&rsquo;t tied to you. Links are kept so they keep working. Plain share links that carry the design in the
            URL after the <code>#</code> are never sent to us at all.
          </li>
          <li>
            <strong>Abuse protection.</strong> To stop the link service being flooded, we count requests per IP address.
            That counter expires after 60 seconds.
          </li>
          <li>
            <strong>Usage statistics.</strong> We use Umami, a privacy-focused analytics tool, to see
            which pages are visited. It records page views, referrer, browser, device type and approximate country. It
            does not use cookies, does not build a profile of you and isn&rsquo;t shared with ad networks.
          </li>
          <li>
            <strong>Server logs.</strong> Like any website, our hosting provider may briefly log technical request data
            such as IP address, user agent and time, for security and to keep the site running.
          </li>
          <li>
            <strong>Sponsors.</strong> If you book a sponsorship, we keep what you send us to run it: your brand name,
            logo, link and the conversation we had. See the <Link href="/sponsor/terms">sponsor terms</Link>.
          </li>
        </ul>
        <p>
          There are no accounts, so we never ask for your name, email or password to use the studio.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <>
        <p>
          Imaginry sets no advertising or tracking cookies, which is why you won&rsquo;t see a cookie banner. The studio
          uses your browser&rsquo;s local storage only to remember your saved designs, and that data stays on your
          device.
        </p>
        <p>Fonts are served from our own domain, so loading a page doesn&rsquo;t send requests to Google.</p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <>
        <p>We use the data above only to:</p>
        <ul>
          <li>make short links resolve to the right design;</li>
          <li>keep the service secure and protect it from abuse;</li>
          <li>understand which features and pages are useful, in aggregate;</li>
          <li>deliver sponsorships we&rsquo;ve agreed with you.</li>
        </ul>
        <p>
          Our legal bases are our legitimate interest in running a secure, useful site and, for sponsors, performing our
          agreement with you. We don&rsquo;t sell or rent data, and we don&rsquo;t use it for advertising profiles.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <p>
        Only the service providers that host the site and its database, acting on our behalf. Sponsors receive nothing
        from us: clicks on a sponsor go straight to their site, marked as sponsored, and from there their own privacy
        policy applies. We will disclose data if the law requires it.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Depending on where you live (for example under the GDPR or CCPA), you can ask to access, correct or delete
          personal data we hold about you, or object to how we use it. Because we don&rsquo;t keep accounts or
          identifiers, we usually hold nothing we can link back to you, but we&rsquo;ll always look.
        </p>
        <p>
          To make a request, <a href={CONTACT_URL} target="_blank" rel="noopener">message us on X</a>. You can also
          complain to your local data protection authority.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Imaginry isn&rsquo;t directed at children under 13 and we don&rsquo;t knowingly collect data from them.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        If we change how we handle data, we&rsquo;ll update this page and the date at the top. Significant changes will
        be noted on the site.
      </p>
    ),
  },
];

export default function Page() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary={
        <p>
          The short version: your designs render on your device, your photos never leave it, there are no accounts and no
          tracking cookies. We only see anonymous page stats and the settings of designs you choose to share.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
