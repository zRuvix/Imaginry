"use client";

import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Compare } from "@/components/icons";
import AgentsHero, { PillButton } from "./AgentsHero";
import { ScrollTrigger, Words, useReveals } from "@/components/home/scene";
import HomeNav from "@/components/home/HomeNav";
import CurtainFooter from "@/components/landing/CurtainFooter";
import LaunchButton from "@/components/landing/LaunchButton";
import { SITE_URL } from "@/lib/seo";

const ENDPOINT = `${SITE_URL}/mcp`;
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

const NAV = [
  { href: "/gallery", label: "Gallery" },
  { href: "/explore", label: "Explore" },
  { href: "#setup", label: "Setup" },
  { href: "#tools", label: "Tools" },
  { href: "#prompts", label: "Prompts" },
  { href: "/agents", label: "Agents", current: true },
];

// ---------------------------------------------------------------- copy

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

function CopyButton({ done, onClick, label, className = "" }: { done: boolean; onClick: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={done ? "Copied" : label}
      className={`press inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors ${
        done ? "bg-[var(--ember)] text-[var(--ink)]" : "bg-white/[0.08] text-[var(--bone)] hover:bg-white/[0.14]"
      } ${className}`}
    >
      {done ? <Check size={14} /> : <Compare size={14} />}
      <span aria-live="polite">{done ? "Copied" : "Copy"}</span>
    </button>
  );
}

// ---------------------------------------------------------------- setup

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

function Setup({ copied, copy }: ReturnType<typeof useCopy>) {
  const [active, setActive] = useState(CLIENTS[0].id);
  const client = CLIENTS.find((c) => c.id === active)!;

  return (
    <section id="setup" style={{ "--h": 1, background: "var(--surface)" } as CSSProperties} aria-labelledby="setup-h">
      <div className="wrap grid gap-10 lg:h-full lg:grid-cols-12 lg:content-center lg:items-center lg:gap-6">
        <div className="lg:col-span-5 lg:pr-10">
          <h2 id="setup-h" className="h2 text-[var(--bone)]">
            <Words text="Add the server to your app" />
          </h2>
          <p data-rise className="mt-5 max-w-[42ch] text-[16px] leading-[1.6] text-[var(--bone)]/65">
            One URL works everywhere. It needs no account or key, and nothing you make is stored unless you ask for a short
            link.
          </p>
          <div data-rise style={d(120)} role="tablist" aria-label="Your app" className="mt-8 flex flex-wrap gap-2">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                id={`tab-${c.id}`}
                aria-selected={c.id === active}
                aria-controls="setup-panel"
                onClick={() => setActive(c.id)}
                className={`press h-11 rounded-full px-4 text-[14.5px] font-medium ${
                  c.id === active ? "bg-[var(--bone)] text-[var(--ink)]" : "bg-white/[0.06] text-[var(--bone)]/80 hover:bg-white/[0.12] hover:text-[var(--bone)]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div
          data-rise
          style={d(200)}
          id="setup-panel"
          role="tabpanel"
          aria-labelledby={`tab-${client.id}`}
          className="flex min-h-[340px] flex-col rounded-[24px] bg-[var(--raised)] p-6 lg:col-span-7 lg:p-8"
        >
          <ol key={client.id} className="anim-pop space-y-3">
            {client.steps.map((step, i) => (
              <li key={i} className="flex gap-3.5 text-[15.5px] leading-[1.5] text-[var(--bone)]/80 [&_b]:font-medium [&_b]:text-[var(--bone)]">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] font-condensed text-[13px] text-[var(--bone)]">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-6 overflow-hidden rounded-[18px] bg-[var(--ink)]">
            <div className="flex items-center justify-between gap-3 py-2 pl-5 pr-2">
              <span className="truncate font-mono text-[12.5px] text-[var(--bone)]/45">{client.file ?? (client.code.startsWith("claude") ? "Terminal" : "Server URL")}</span>
              <CopyButton done={copied === client.id} onClick={() => copy(client.id, client.code)} label={`Copy the ${client.name} setup`} />
            </div>
            <pre data-lenis-prevent className="overflow-x-auto px-5 pb-5 font-mono text-[13.5px] leading-[1.65] text-[var(--bone)]">
              <code>{client.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- tools

const TOOLS: { names: string[]; title: string; body: string }[] = [
  { names: ["create_design"], title: "Build a design", body: "Stacks presets and settings into layers and returns a link that opens in the studio." },
  { names: ["random_design"], title: "Surprise me", body: "A random background like the studio’s R key, kept to a palette or a kind of effect if you like." },
  { names: ["list_looks"], title: "Start from a look", body: "The gallery’s premade designs by mood, each ready to remix." },
  { names: ["list_effects", "get_effect"], title: "Know every effect", body: "All 51 effects with their settings, ranges and presets, so the agent picks real values." },
  { names: ["read_design"], title: "Edit a link", body: "Turns any studio or short link back into layers the agent can change." },
  { names: ["get_embed_code"], title: "Put it on a site", body: "HTML or React that draws the design live on a canvas, with no dependency on us." },
];

function Tools() {
  return (
    <section id="tools" style={{ "--h": 1 } as CSSProperties} aria-labelledby="tools-h">
      <div className="wrap flex flex-col lg:h-full">
        <h2 id="tools-h" className="h2 max-w-[20ch] text-[var(--bone)]">
          <Words text="Seven tools, one studio behind them" />
        </h2>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-auto lg:grid-cols-3">
          {TOOLS.map((t, i) => (
            <li key={t.title} data-rise style={d(i * 80)} className="flex flex-col rounded-[22px] bg-white/[0.04] p-6 transition-colors duration-500 hover:bg-white/[0.07]">
              <div className="flex flex-wrap gap-1.5">
                {t.names.map((n) => (
                  <code key={n} className="rounded-full bg-[var(--ember)]/[0.14] px-2.5 py-1 font-mono text-[12.5px] text-[var(--ember)]">
                    {n}
                  </code>
                ))}
              </div>
              <h3 className="mt-5 font-display text-[21px] leading-[1.15] tracking-[-0.025em] text-[var(--bone)]">{t.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-[var(--bone)]/60">{t.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- prompts

const PROMPTS = [
  "Make a calm blue mesh gradient with fine grain for my app’s login screen.",
  "Surprise me with three neon backgrounds and let me pick one.",
  "Take this studio link and make it warmer, with less glass.",
  "Give me React code for a slow, dark halftone background.",
  "Use my brand colors #0b1d3a and #3bc8c0 in something retro.",
  "Which gallery looks would suit a podcast cover?",
];

function Prompts({ copied, copy }: ReturnType<typeof useCopy>) {
  return (
    <section id="prompts" style={{ "--h": 1, background: "var(--surface)" } as CSSProperties} aria-labelledby="prompts-h">
      <div className="wrap grid gap-10 lg:h-full lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col lg:col-span-5 lg:pr-10">
          <h2 id="prompts-h" className="h2 text-[var(--bone)]">
            <Words text="Things to ask once it’s connected" />
          </h2>
          <p data-rise className="mt-5 max-w-[40ch] text-[16px] leading-[1.6] text-[var(--bone)]/65">
            Plain words are enough. The agent reads the effect list, picks settings and hands you a link to open.
          </p>
          <div data-rise style={d(120)} className="mt-8 flex flex-wrap items-center gap-3 lg:mt-auto">
            <LaunchButton className="btn h-[52px] pl-5 pr-6 text-[16px] bg-[var(--bone)] text-[var(--ink)] hover:bg-white" iconSize={17} />
            <PillButton href="#setup">Connect your app</PillButton>
          </div>
        </div>
        <ul className="border-t border-white/10 lg:col-span-7">
          {PROMPTS.map((p, i) => {
            const id = `prompt-${i}`;
            return (
              <li key={p} data-rise style={d(i * 70)} className="flex items-center gap-4 border-b border-white/10 py-3.5">
                <p className="flex-1 font-display text-[clamp(17px,1.4vw,20px)] leading-[1.3] tracking-[-0.02em] text-[var(--bone)]">“{p}”</p>
                <CopyButton done={copied === id} onClick={() => copy(id, p)} label="Copy this prompt" />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- page

/** Tells the reveal triggers about every smoothed scroll step, as the homepage does. */
function ScrollSync() {
  useLenis(() => ScrollTrigger.update());
  return null;
}

export default function AgentsPage() {
  const clip = useCopy();
  useReveals();

  // Trigger positions depend on the display face's metrics.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.08, anchors: true }}>
      <ScrollSync />
      <HomeNav links={NAV} />
      <CurtainFooter>
        <main className="home home-main overflow-x-clip">
          <AgentsHero endpoint={ENDPOINT} copied={clip.copied === "hero"} onCopy={() => clip.copy("hero", ENDPOINT)} />
          <Setup {...clip} />
          <Tools />
          <Prompts {...clip} />
        </main>
      </CurtainFooter>
    </ReactLenis>
  );
}
