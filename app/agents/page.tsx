import type { Metadata } from "next";
import AgentsPage from "@/components/agents/AgentsPage";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "MCP server for AI agents",
  description:
    "Connect Claude, Cursor, ChatGPT or any MCP client to Imaginry. Your agent builds generative backgrounds from 51 effects and hands back a studio link or embed code. Free, no API key.",
  path: "/agents",
  image: "/og/studio.png",
  imageAlt: "Imaginry studio — backgrounds your AI agent can make",
});

export default function Page() {
  return <AgentsPage />;
}
