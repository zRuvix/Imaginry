"use client";

import { useEffect, useState } from "react";

type App = { clientId: string; name: string; connectedAt: string; lastUsedAt: string | null };
type KeyInfo = { hint: string; createdAt: string; lastUsedAt: string | null };

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const PILL = "press h-8 shrink-0 rounded-full px-3 text-[12.5px] transition-colors disabled:opacity-50";
const SOFT = `${PILL} bg-white/[0.07] text-bone/80 hover:bg-white/[0.12] hover:text-bone`;
const DANGER = `${PILL} text-bone/45 hover:bg-[#e5484d]/15 hover:text-[#ff6b70]`;

/**
 * The account panel's MCP section: apps the person allowed (each can be
 * disconnected) and an API key for apps that can't open the Allow screen.
 */
export default function McpAccess() {
  const [apps, setApps] = useState<App[] | null>(null);
  const [key, setKey] = useState<KeyInfo | null | undefined>(undefined);
  const [token, setToken] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([fetch("/api/oauth/apps"), fetch("/api/mcp-key")])
      .then(async ([a, k]) => {
        if (!a.ok || !k.ok) throw new Error();
        const [{ apps }, { key }] = await Promise.all([a.json(), k.json()]);
        if (live) {
          setApps(apps);
          setKey(key);
        }
      })
      .catch(() => live && setError("Couldn’t load your connected apps."));
    return () => {
      live = false;
    };
  }, []);

  const act = async (run: () => Promise<Response>, apply: (d: Record<string, unknown>) => void, failed: string) => {
    setBusy(true);
    setError(null);
    try {
      const r = await run();
      if (!r.ok) throw new Error();
      apply(await r.json());
    } catch {
      setError(failed);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const disconnect = (id: string) =>
    act(() => fetch(`/api/oauth/apps?client=${encodeURIComponent(id)}`, { method: "DELETE" }), (d) => setApps(d.apps as App[]), "Couldn’t disconnect it. Try again.");
  const makeKey = () =>
    act(
      () => fetch("/api/mcp-key", { method: "POST" }),
      (d) => {
        const k = d.key as KeyInfo & { token: string };
        setKey(k);
        setToken(k.token);
      },
      "Couldn’t make a key. Try again.",
    );
  const revokeKey = () =>
    act(
      () => fetch("/api/mcp-key", { method: "DELETE" }),
      () => {
        setKey(null);
        setToken(null);
      },
      "Couldn’t revoke the key. Try again.",
    );

  const copy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const loading = apps === null && !error;

  return (
    <div className="frost-well rounded-[16px] p-3">
      <p className="text-[13.5px]">Connect AI apps</p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-bone/45">
        Add imaginry.tech/mcp to Claude, ChatGPT, Cursor or any MCP app. It asks you to Allow, then shows up here.
      </p>

      {loading ? (
        <div className="skeleton mt-3 h-10 rounded-[12px]" />
      ) : (
        <>
          {apps && apps.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {apps.map((a) => (
                <li key={a.clientId} className="flex items-center gap-2 rounded-[12px] bg-white/[0.04] py-2 pl-3 pr-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">{a.name}</p>
                    <p className="text-[11.5px] text-bone/40">
                      Connected {day(a.connectedAt)}
                      {a.lastUsedAt ? `, last used ${day(a.lastUsedAt)}` : ""}
                    </p>
                  </div>
                  {confirm === a.clientId ? (
                    <button type="button" disabled={busy} onClick={() => disconnect(a.clientId)} className={`${PILL} bg-[#e5484d] text-white hover:bg-[#d63c41]`}>
                      Disconnect
                    </button>
                  ) : (
                    <button type="button" onClick={() => setConfirm(a.clientId)} className={DANGER}>
                      Disconnect
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 border-t border-white/[0.06] pt-3">
            <p className="text-[12.5px] text-bone/70">API key</p>
            <p className="text-[11.5px] leading-relaxed text-bone/40">For scripts and apps that can’t open the Allow screen. Send it as Authorization: Bearer.</p>

            {token ? (
              <>
                <div className="mt-2 flex items-center gap-1.5 rounded-[12px] bg-white/[0.06] py-1 pl-3 pr-1">
                  <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-bone">{token}</code>
                  <button type="button" onClick={copy} aria-label={copied ? "Copied" : "Copy your API key"} className={`${SOFT} flex items-center gap-1.5`}>
                    <svg aria-hidden width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      {copied ? <path d="M3 8.5l3 3 7-7" /> : <><rect x="5" y="5" width="9" height="9" rx="2" /><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" /></>}
                    </svg>
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-1.5 text-[11.5px] text-[#ffb27a]">Copy it now: it won’t be shown again.</p>
              </>
            ) : key ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <code className="mr-auto font-mono text-[12px] text-bone/70">
                  imk_…{key.hint} <span className="font-sans text-[11.5px] text-bone/40">· {key.lastUsedAt ? `used ${day(key.lastUsedAt)}` : "not used yet"}</span>
                </code>
                {confirm === "replace" || confirm === "revoke" ? (
                  <>
                    <button type="button" onClick={() => setConfirm(null)} className={SOFT}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={confirm === "replace" ? makeKey : revokeKey}
                      className={`${PILL} ${confirm === "revoke" ? "bg-[#e5484d] text-white hover:bg-[#d63c41]" : "bg-bone text-ink hover:bg-white"}`}
                    >
                      {confirm === "replace" ? "Replace key" : "Revoke key"}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setConfirm("replace")} className={SOFT}>
                      New key
                    </button>
                    <button type="button" onClick={() => setConfirm("revoke")} className={DANGER}>
                      Revoke
                    </button>
                  </>
                )}
              </div>
            ) : (
              <button type="button" disabled={busy || key === undefined} onClick={makeKey} className={`${SOFT} mt-2`}>
                {busy ? "Making…" : "Make an API key"}
              </button>
            )}
            {(confirm === "replace" || confirm === "revoke") && (
              <p className="mt-1.5 text-[11.5px] text-bone/45">Apps using the current key stop working.</p>
            )}
          </div>
        </>
      )}

      {error && <p className="mt-2 text-[12px] text-[#ff6b70]">{error}</p>}
    </div>
  );
}
