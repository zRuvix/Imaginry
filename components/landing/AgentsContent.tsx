"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SITE_URL } from "@/lib/seo";
import { EFFECT_COUNT } from "@/lib/studio/effects";
import AgentTools from "./AgentTools";
import Panel from "./Panel";
import { BTN_MOTION } from "./buttonMotion";

/** The MCP server. Apps sign in through the Allow screen (or send an account API key). */
export const ENDPOINT = `${SITE_URL}/mcp`;

/** Copies text and remembers which item was copied for 1.6s. */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  };
  return { copied, copy };
}

function CopyButton({ done, onClick, label }: { done: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={done ? "Copied" : label}
      className="blue-button font-outfit inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[9px] px-3.5 text-[13px] font-semibold"
    >
      <svg aria-hidden width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {done ? <path d="M3 8.5l3 3 7-7" /> : <><rect x="5" y="5" width="9" height="9" rx="2" /><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" /></>}
      </svg>
      <span aria-live="polite">{done ? "Copied" : "Copy"}</span>
    </button>
  );
}

/** The server URL with a copy button, beside the agents heading. */
function EndpointChip() {
  const { copied, copy } = useCopy();
  return (
    <div className="flex max-w-full items-center gap-2 rounded-[12px] bg-[#f3f4f5] py-1.5 pl-4 pr-1.5">
      <code className="truncate font-mono text-[13px] text-[#141414] sm:text-[14px]">{ENDPOINT}</code>
      <CopyButton done={copied === "hero"} onClick={() => copy("hero", ENDPOINT)} label="Copy the server URL" />
    </div>
  );
}

type Client = { id: string; name: string; steps: ReactNode[]; code: string; file?: string };
const json = (value: unknown) => JSON.stringify(value, null, 2);

// Every app below signs in the same way: the first call opens Imaginry, the
// person signs in and clicks Allow, and the app keeps the access it was given.
const CLIENTS: Client[] = [
  {
    id: "claude",
    name: "Claude",
    steps: [
      <>Open <b>Settings</b>, then <b>Connectors</b>, then <b>Add custom connector</b>.</>,
      <>Name it Imaginry and paste the server URL.</>,
      <>Imaginry opens: sign in and click <b>Allow</b>.</>,
    ],
    code: ENDPOINT,
  },
  {
    id: "claude-code",
    name: "Claude Code",
    steps: [<>Run this once in your terminal.</>, <>In a session, type <b>/mcp</b>, pick imaginry and sign in. Click <b>Allow</b>.</>],
    code: `claude mcp add --transport http imaginry ${ENDPOINT}`,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    steps: [
      <>Turn on <b>Developer mode</b> in Settings, under <b>Connectors</b>.</>,
      <>Create a connector, paste the server URL and choose <b>OAuth</b>.</>,
      <>Imaginry opens: sign in and click <b>Allow</b>.</>,
    ],
    code: ENDPOINT,
  },
  {
    id: "cursor",
    name: "Cursor",
    steps: [
      <>Open <b>Cursor Settings</b>, then <b>MCP</b>, then <b>Add new MCP server</b>, or add this to the file.</>,
      <>Click <b>Needs login</b> next to imaginry, then <b>Allow</b>.</>,
    ],
    code: json({ mcpServers: { imaginry: { url: ENDPOINT } } }),
    file: "~/.cursor/mcp.json",
  },
  {
    id: "vscode",
    name: "VS Code",
    steps: [<>Add this file to your project, or run <b>MCP: Add Server</b>.</>, <>VS Code asks you to sign in the first time: click <b>Allow</b>.</>],
    code: json({ servers: { imaginry: { type: "http", url: ENDPOINT } } }),
    file: ".vscode/mcp.json",
  },
  {
    id: "other",
    name: "Other apps",
    steps: [
      <>Apps that only run local servers: bridge with mcp-remote. It opens Imaginry for you to <b>Allow</b>. Needs Node.js 18 or newer.</>,
      <>Scripts that can’t open a browser: make an API key in the studio’s account panel and send it as <b>Authorization: Bearer</b>.</>,
    ],
    code: json({ mcpServers: { imaginry: { command: "npx", args: ["-y", "mcp-remote", ENDPOINT] } } }),
  },
];

const PROMPTS = [
  "Make a calm blue mesh gradient with fine grain for my app’s login screen.",
  "Surprise me with three neon backgrounds and let me pick one.",
  "Take this studio link and make it warmer, with less glass.",
  "Give me React code for a slow, dark halftone background.",
  "Use my brand colors #0b1d3a and #3bc8c0 in something retro.",
  "Which gallery looks would suit a podcast cover?",
];

/** The MCP server on the landing: setup, tools and prompts. */
export default function AgentsContent() {
  const { copied, copy } = useCopy();
  const [active, setActive] = useState(CLIENTS[0].id);
  const client = CLIENTS.find((c) => c.id === active)!;
  const code = client.code;
  const label = client.file ?? (code.startsWith("claude") ? "Terminal" : "Server URL");

  return (
    <>
      <Panel
        id="agents"
        title="Let your AI agent make the background"
        intro={`Connect Claude, ChatGPT, Cursor or any MCP app to one URL. The first time, Imaginry asks you to sign in and Allow. It builds designs from the same ${EFFECT_COUNT} effects as the studio and hands back a link or embed code.`}
        aside={<EndpointChip />}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-10">
          <div role="tablist" aria-label="Your app" className="flex flex-wrap content-start gap-2">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                id={`tab-${c.id}`}
                aria-selected={c.id === active}
                aria-controls="setup-panel"
                onClick={() => setActive(c.id)}
                className={`font-outfit min-h-11 rounded-[10px] px-4 text-[14px] ${BTN_MOTION} ${
                  c.id === active ? "blue-button" : "bg-[#f3f4f5] text-[#3a3d40] hover:bg-[#e9ebed] hover:text-[#141414]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div id="setup-panel" role="tabpanel" aria-labelledby={`tab-${client.id}`} className="min-w-0 rounded-[20px] bg-[#f6f7f8] p-5 sm:p-7">
            <ol className="space-y-3">
              {client.steps.map((step, i) => (
                <li key={i} className="font-outfit flex gap-3 text-[15px] leading-normal text-[#3a3d40] [&_b]:font-medium [&_b]:text-[#141414]">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-[13px] text-[#141414] ring-1 ring-black/[0.06]">{i + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 overflow-hidden rounded-[14px] bg-[#141414]">
              <div className="flex items-center justify-between gap-3 py-1.5 pl-4 pr-1.5">
                <span className="truncate font-mono text-[12.5px] text-white/50">{label}</span>
                <CopyButton done={copied === client.id} onClick={() => copy(client.id, code)} label={`Copy the ${client.name} setup`} />
              </div>
              <pre data-lenis-prevent className="overflow-x-auto px-4 pb-4 font-mono text-[13px] leading-relaxed text-white">
                <code>{code}</code>
              </pre>
            </div>
          </div>
        </div>
      </Panel>

      {/* AgentTools carries its own compact heading (tools-h). */}
      <Panel id="tools">
        <AgentTools />
      </Panel>

      <Panel id="prompts" title="Things to ask once it’s connected" intro="Plain words work. Copy one of these to try it.">
        <ul className="grid gap-2 lg:grid-cols-2 lg:gap-3">
          {PROMPTS.map((p, i) => (
            <li key={p} className="flex items-center justify-between gap-4 rounded-[16px] bg-[#f6f7f8] py-3 pl-5 pr-3">
              <span className="font-outfit text-[15px] leading-snug text-[#141414]">{p}</span>
              <CopyButton done={copied === `p${i}`} onClick={() => copy(`p${i}`, p)} label="Copy this prompt" />
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
