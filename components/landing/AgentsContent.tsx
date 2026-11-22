"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SITE_URL } from "@/lib/seo";
import Panel from "./Panel";
import { BTN_MOTION } from "./buttonMotion";

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

function CopyButton({ done, onClick, label, dark = false }: { done: boolean; onClick: () => void; label: string; dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={done ? "Copied" : label}
      className={`font-outfit inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[9px] px-3.5 text-[13px] ${BTN_MOTION} ${
        done ? "bg-[#7f9b5c] text-white" : dark ? "bg-white/10 text-white hover:bg-white/20" : "bg-[#f3f4f5] text-[#141414] hover:bg-[#e9ebed]"
      }`}
    >
      <svg aria-hidden width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {done ? <path d="M3 8.5l3 3 7-7" /> : <><rect x="5" y="5" width="9" height="9" rx="2" /><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" /></>}
      </svg>
      <span aria-live="polite">{done ? "Copied" : "Copy"}</span>
    </button>
  );
}

/** The endpoint chip in the page hero. */
export function EndpointChip() {
  const { copied, copy } = useCopy();
  return (
    <div className="flex items-center gap-2 rounded-[12px] bg-white/90 py-1.5 pl-4 pr-1.5 shadow-[0_1px_2px_rgba(20,30,40,0.06),0_8px_24px_-12px_rgba(20,30,40,0.18)] backdrop-blur-md">
      <code className="truncate font-mono text-[13px] text-[#141414] sm:text-[14px]">{ENDPOINT}</code>
      <CopyButton done={copied === "hero"} onClick={() => copy("hero", ENDPOINT)} label="Copy the server URL" />
    </div>
  );
}

type Client = { id: string; name: string; steps: ReactNode[]; code: string; file?: string };
const json = (value: unknown) => JSON.stringify(value, null, 2);

const CLIENTS: Client[] = [
  {
    id: "claude",
    name: "Claude",
    steps: [
      <>Open <b>Settings</b>, then <b>Connectors</b>.</>,
      <>Choose <b>Add custom connector</b> and name it Imaginry.</>,
      <>Paste the server URL and add it. No sign-in is needed.</>,
    ],
    code: ENDPOINT,
  },
  {
    id: "claude-code",
    name: "Claude Code",
    steps: [<>Run this once in your terminal.</>, <>Start a session and ask for a background.</>],
    code: `claude mcp add --transport http imaginry ${ENDPOINT}`,
  },
  {
    id: "cursor",
    name: "Cursor",
    steps: [<>Open <b>Cursor Settings</b>, then <b>MCP</b>, then <b>Add new MCP server</b>.</>, <>Or add this to the file yourself.</>],
    code: json({ mcpServers: { imaginry: { url: ENDPOINT } } }),
    file: "~/.cursor/mcp.json",
  },
  {
    id: "vscode",
    name: "VS Code",
    steps: [<>Add this file to your project, or run <b>MCP: Add Server</b>.</>, <>Use it from Copilot Chat in agent mode.</>],
    code: json({ servers: { imaginry: { type: "http", url: ENDPOINT } } }),
    file: ".vscode/mcp.json",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    steps: [
      <>Turn on <b>Developer mode</b> in Settings, under <b>Connectors</b>.</>,
      <>Create a connector, paste the server URL, and choose no authentication.</>,
    ],
    code: ENDPOINT,
  },
  {
    id: "other",
    name: "Other apps",
    steps: [<>For an app that only runs local servers, bridge to Imaginry with mcp-remote.</>, <>Needs Node.js 18 or newer.</>],
    code: json({ mcpServers: { imaginry: { command: "npx", args: ["-y", "mcp-remote", ENDPOINT] } } }),
  },
];

const TOOLS: { names: string[]; title: string; body: string }[] = [
  { names: ["create_design"], title: "Build a design", body: "Stacks presets and settings into layers and returns a link that opens in the studio." },
  { names: ["random_design"], title: "Surprise me", body: "A random background like the studio’s R key, kept to a palette or a kind of effect if you like." },
  { names: ["list_looks"], title: "Start from a look", body: "The gallery’s premade designs by mood, each ready to remix." },
  { names: ["list_effects", "get_effect"], title: "Know every effect", body: "All 51 effects with their settings, ranges and presets, so the agent picks real values." },
  { names: ["read_design"], title: "Edit a link", body: "Turns any studio or short link back into layers the agent can change." },
  { names: ["render_png", "get_embed_code"], title: "Export it", body: "A PNG up to 2048px the agent can see, or HTML and React that draw the design live." },
];

const PROMPTS = [
  "Make a calm blue mesh gradient with fine grain for my app’s login screen.",
  "Surprise me with three neon backgrounds and let me pick one.",
  "Take this studio link and make it warmer, with less glass.",
  "Give me React code for a slow, dark halftone background.",
  "Use my brand colors #0b1d3a and #3bc8c0 in something retro.",
  "Which gallery looks would suit a podcast cover?",
];

/** Setup, tools and prompts for the Agents page. */
export default function AgentsContent() {
  const { copied, copy } = useCopy();
  const [active, setActive] = useState(CLIENTS[0].id);
  const client = CLIENTS.find((c) => c.id === active)!;
  const label = client.file ?? (client.code.startsWith("claude") ? "Terminal" : "Server URL");

  return (
    <>
      <Panel id="setup" title="Add the server to your app" intro="One URL works everywhere. No account or key, and nothing you make is stored unless you ask for a short link.">
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
                  c.id === active ? "bg-[#141414] text-white" : "bg-[#f3f4f5] text-[#3a3d40] hover:bg-[#e9ebed] hover:text-[#141414]"
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
                <CopyButton dark done={copied === client.id} onClick={() => copy(client.id, client.code)} label={`Copy the ${client.name} setup`} />
              </div>
              <pre data-lenis-prevent className="overflow-x-auto px-4 pb-4 font-mono text-[13px] leading-relaxed text-white">
                <code>{client.code}</code>
              </pre>
            </div>
          </div>
        </div>
      </Panel>

      <Panel id="tools" title="Eight tools, one studio behind them" intro="Your agent works with the same 51 effects and presets the studio uses, so what it makes opens and edits like anything you built by hand.">
        <ul className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <li key={t.title} className="rounded-[20px] bg-[#f6f7f8] p-5 sm:p-6">
              <div className="flex flex-wrap gap-1.5">
                {t.names.map((n) => (
                  <code key={n} className="rounded-md bg-white px-2 py-1 font-mono text-[12px] text-[#141414] ring-1 ring-black/[0.06]">
                    {n}
                  </code>
                ))}
              </div>
              <h3 className="font-lexend mt-5 text-[22px] font-light tracking-[-0.03em] text-[#121416]">{t.title}</h3>
              <p className="font-outfit mt-2 text-[14.5px] leading-relaxed text-[#6b7075]">{t.body}</p>
            </li>
          ))}
        </ul>
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
