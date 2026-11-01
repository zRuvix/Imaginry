import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number, "weekly" | "monthly"][] = [
    ["", 1, "weekly"],
    ["/studio", 0.9, "weekly"],
    ["/gallery", 0.8, "weekly"],
    ["/sponsor", 0.5, "monthly"],
  ];
  return pages.map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
