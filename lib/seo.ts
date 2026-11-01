import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://imaginry.tech";
export const SITE_NAME = "Imaginry";
export const CREATOR = "@zRuvix1";
export const CREATOR_URL = "https://x.com/zRuvix1";

export const DEFAULT_DESCRIPTION =
  "Free studio for generative backgrounds. Stack 51 live effects like gradients, fluted glass and grain, then export PNG, looping video or embed code.";

export const KEYWORDS = [
  "generative backgrounds",
  "gradient generator",
  "texture generator",
  "animated background maker",
  "grain gradient",
  "fluted glass effect",
  "halftone generator",
  "looping video background",
  "shader effects online",
  "Pryzm alternative",
  "free background generator",
  "design textures",
];

/**
 * Full metadata for one page. Next merges segment metadata shallowly, so each
 * page needs its own complete openGraph and twitter objects.
 */
export function pageMeta({
  title,
  description,
  path,
  image,
  imageAlt,
}: {
  title?: string;
  description: string;
  path: string;
  image: string;
  imageAlt: string;
}): Metadata {
  const images = [{ url: image, width: 1200, height: 630, alt: imageAlt, type: "image/png" }];
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — generative backgrounds, live in your browser`;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      site: CREATOR,
      creator: CREATOR,
      title: fullTitle,
      description,
      images,
    },
  };
}
