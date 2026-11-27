"use client";

import { useEffect, useState } from "react";

type App = { clientId: string; name: string; connectedAt: string; lastUsedAt: string | null };
type KeyInfo = { hint: string; createdAt: string; lastUsedAt: string | null };

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const PILL = "press h-8 shrink-0 rounded-full px-3 text-[12.5px] transition-colors disabled:opacity-50";
const SOFT = `${PILL} bg-white/[0.07] text-bone/80 hover:bg-white/[0.12] hover:text-bone`;
const DANGER = `${PILL} text-bone/45 hover:bg-[#e5484d]/15 hover:text-[#ff6b70]`;

/** OpenAI's mark, shown for ChatGPT / OpenAI clients. */
const OPENAI_PATH =
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";

/** A connected app's logo: the brand mark when we know it, else its first letter. */
function AppLogo({ name }: { name: string }) {
  const known = /chatgpt|openai|\bgpt\b/i.test(name);
  return (
    <span
      aria-hidden
      className={`grid size-8 shrink-0 place-items-center rounded-[10px] ${known ? "bg-white text-black" : "bg-white/[0.08] text-bone/70"}`}
    >
      {known ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d={OPENAI_PATH} />
        </svg>
      ) : (
        <span className="text-[13px] font-medium uppercase">{name.trim().charAt(0) || "?"}</span>
      )}
    </span>
  );
}

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
          <p className="mt-3 text-[12.5px] text-bone/70">Connected apps</p>
          {apps && apps.length === 0 && <p className="mt-1 text-[11.5px] text-bone/40">No apps connected yet.</p>}
          {apps && apps.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {apps.map((a) => (
                <li key={a.clientId} className="flex items-center gap-2.5 rounded-[12px] bg-white/[0.04] py-2 pl-2 pr-1.5">
                  <AppLogo name={a.name} />
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
