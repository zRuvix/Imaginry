import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_URL, OPERATOR } from "@/lib/legal";
import { pageMeta } from "@/lib/seo";
import { STUDIO_SLOTS } from "@/lib/sponsors";

export const metadata: Metadata = pageMeta({
  title: "Sponsor Terms",
  description:
    "Terms for sponsoring Imaginry: how bookings, payment, placements, brand approval, cancellations and refunds work.",
  path: "/sponsor/terms",
  image: "/og/sponsor.png",
  imageAlt: "Sponsor Imaginry — put your brand in the studio",
});

const SECTIONS: LegalSection[] = [
  {
    id: "scope",
    title: "Scope",
    body: (
      <p>
        These terms apply when a brand (&ldquo;you&rdquo;) books a paid placement on Imaginry from {OPERATOR}. They sit
        alongside our general <Link href="/terms">terms of use</Link>. Plans and prices are listed on the{" "}
        <Link href="/sponsor">sponsor page</Link>.
      </p>
    ),
  },
  {
    id: "booking",
    title: "Booking and payment",
    body: (
      <>
        <p>
          You book by <a href={CONTACT_URL} target="_blank" rel="noopener">messaging us on X</a> with your plan, billing
          period and preferred start date. A booking is confirmed once we&rsquo;ve accepted it and received payment in
          full, in advance.
        </p>
        <p>
          Prices are in US dollars and exclude any taxes or payment fees that apply to you. The price you&rsquo;re quoted
          when we confirm is locked for that booking, even if list prices change later.
        </p>
      </>
    ),
  },
  {
    id: "materials",
    title: "Your materials",
    body: (
      <>
        <p>
          Send your brand name, a square logo (SVG or PNG) and the link to use before your start date. You can swap them
          during your run at no charge.
        </p>
        <p>
          You confirm you own or have permission to use everything you send, and you let us display it on Imaginry, and in
          screenshots of the site, for the length of your booking. For Gallery feature and Spotlight, the custom look we
          make in your palette may stay in the gallery afterwards, without your branding.
        </p>
      </>
    ),
  },
  {
    id: "placement",
    title: "How placements run",
    body: (
      <ul>
        <li>
          Studio bar chips rotate with up to {STUDIO_SLOTS - 1} other brands. Spotlight keeps the top bar to you alone.
        </li>
        <li>Links go straight to your URL and are marked as sponsored. Add your own UTM tags to measure clicks.</li>
        <li>
          We don&rsquo;t guarantee a number of views, clicks or conversions. Traffic depends on how many people use the
          site that week.
        </li>
        <li>
          The site may change design over time; we&rsquo;ll keep your placement at an equivalent position for your whole
          run.
        </li>
      </ul>
    ),
  },
  {
    id: "approval",
    title: "Brand approval",
    body: (
      <>
        <p>
          We only take sponsors we&rsquo;re happy to show designers. We may decline or remove a sponsor that is, or links
          to, anything illegal, adult, hateful, deceptive, malware, gambling, or unlicensed financial or crypto offers, or
          that would harm Imaginry&rsquo;s reputation.
        </p>
        <p>
          If we remove a placement for one of these reasons after it&rsquo;s gone live because the brand or link changed,
          no refund is due. If we decline before it starts, you get a full refund.
        </p>
      </>
    ),
  },
  {
    id: "cancellation",
    title: "Cancellations and refunds",
    body: (
      <ul>
        <li>Cancel before your start date for a full refund.</li>
        <li>Once a run has started, it isn&rsquo;t refundable, but you can change materials anytime.</li>
        <li>
          If the site is down or your placement is missing for more than 24 hours in total during your run, we&rsquo;ll
          extend the run by that time or refund that portion, whichever you prefer.
        </li>
        <li>If we have to end your run early for any other reason, we refund the unused days.</li>
      </ul>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <p>
        Our total liability for a booking is limited to the amount you paid for it. You&rsquo;re responsible for your own
        brand, site and claims, and you agree to cover us for any claim arising from the materials or link you supplied.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        We may update these terms for future bookings. A booking that&rsquo;s already confirmed runs on the terms in place
        when it was confirmed.
      </p>
    ),
  },
];

export default function Page() {
  return (
    <LegalPage
      title="Sponsor Terms"
      summary={
        <p>
          Pay upfront, send your logo and link, and your placement goes live on the date you pick. Cancel before it starts
          for a full refund. We keep the right to say no to brands that don&rsquo;t fit.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
