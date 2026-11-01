/**
 * Sponsors shown in the studio's top bar, and the plans sold on /sponsor.
 * Add a sponsor by pushing an entry to SPONSORS; empty slots invite brands
 * to book one.
 */

export type Sponsor = {
  name: string;
  /** Where the chip links (opens in a new tab). */
  href: string;
  /** Square logo: a path in /public or a full URL. Falls back to the initial. */
  logo?: string;
};

/** How many slots the studio top bar has (split across its two gaps). */
export const STUDIO_SLOTS = 4;

export const SPONSORS: Sponsor[] = [
  // { name: "Acme", href: "https://acme.example", logo: "/sponsors/acme.svg" },
];

/** Where "Book a slot" sends people. Replace with your real address. */
export const SPONSOR_CONTACT = "mailto:sponsors@imaginry.tech?subject=Sponsoring%20Imaginry";

export type Billing = "weekly" | "monthly";

export type Plan = {
  id: string;
  name: string;
  blurb: string;
  price: Record<Billing, number>;
  features: string[];
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "bar",
    name: "Studio bar",
    blurb: "Your logo and name in the studio's top bar, in front of everyone making something.",
    price: { weekly: 49, monthly: 149 },
    features: ["Logo + name chip in the studio top bar", "Links straight to your site", "Rotates with up to 3 other brands"],
  },
  {
    id: "gallery",
    name: "Gallery feature",
    blurb: "A design built around your brand colors, pinned first in the gallery.",
    price: { weekly: 89, monthly: 279 },
    features: [
      "Everything in Studio bar",
      "A custom look in your palette, pinned in /gallery",
      "Also first in the studio's Gallery tab",
    ],
    featured: true,
  },
  {
    id: "spotlight",
    name: "Spotlight",
    blurb: "The whole site: studio, gallery and a card on the landing page.",
    price: { weekly: 149, monthly: 449 },
    features: [
      "Everything in Gallery feature",
      "Your card in the landing page orbit",
      "Exclusive: no other brand in the top bar",
    ],
  },
];
