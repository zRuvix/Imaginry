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
    price: { weekly: 5, monthly: 15 },
    features: ["Logo + name chip in the studio top bar", "Links straight to your site", "Rotates with up to 3 other brands"],
  },
  {
    id: "gallery",
    name: "Gallery feature",
    blurb: "A design built around your brand colors, pinned first in the gallery.",
    price: { weekly: 10, monthly: 30 },
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
    price: { weekly: 15, monthly: 49 },
    features: [
      "Everything in Gallery feature",
      "Your card in the landing page orbit",
      "Exclusive: no other brand in the top bar",
    ],
  },
];
