import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
  "cohere-ai",
  "MistralAI-User",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/s/"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: AI_BOTS, allow: ["/", "/llms.txt"], disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
