import { CREATOR_URL } from "@/lib/seo";

/** Shown as "Last updated" on every legal page; bump it when the text changes. */
export const LEGAL_UPDATED = "2 November 2026";

/** Who runs the site and how to reach them about privacy or legal questions. */
export const OPERATOR = "Ruvix";
export const CONTACT_URL = CREATOR_URL;

export const LEGAL_PAGES = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Sponsor terms", href: "/sponsor/terms" },
];
