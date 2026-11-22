import type { Metadata } from "next";
import AgentsContent, { EndpointChip } from "@/components/landing/AgentsContent";
import PageShell from "@/components/landing/PageShell";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "MCP server for AI agents",
  description:
    "Connect Claude, Cursor, ChatGPT or any MCP client to Imaginry. Your agent builds generative backgrounds from 51 effects and hands back a studio link or embed code. Free, no API key.",
  path: "/agents",
  image: "/og/studio.png",
  imageAlt: "Imaginry studio — backgrounds your AI agent can make",
});

export default function AgentsPage() {
  return (
    <PageShell
      badge={
        <>
          MCP server
          <span className="rounded-[4px] bg-[#141414] px-1.5 py-px text-[10.5px] text-white xl:text-[12.5px]">No API key</span>
        </>
      }
      lines={["Let your AI agent", "make the background"]}
      lead="Connect Claude, Cursor, ChatGPT or any MCP client. It builds designs from the same 51 effects as the studio and hands back a link or embed code."
      actions={<EndpointChip />}
    >
      <AgentsContent />
    </PageShell>
  );
}
