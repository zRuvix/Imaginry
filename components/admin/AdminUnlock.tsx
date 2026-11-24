"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "@/components/icons";

/** Key prompt in front of the admin dashboard. */
export default function AdminUnlock() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => null))?.error ?? "Couldn’t unlock");
        setBusy(false);
        return;
      }
      setKey("");
      router.refresh();
    } catch {
      setError("Couldn’t reach the server");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={unlock} className="anim-pop glass-panel w-[380px] max-w-full rounded-[26px] p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-white/[0.07] text-bone/80">
            <Lock size={16} />
          </span>
          <h1 className="font-display text-[20px]">Admin</h1>
        </div>
        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between text-[12px]">
            <span className="text-bone/55">Secret key</span>
            {error && <span className="text-ember">{error}</span>}
          </span>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!error}
            className="h-10 w-full rounded-[12px] bg-white/[0.05] px-3 text-[13.5px] text-bone outline-none transition-colors focus:bg-white/[0.09]"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !key}
          className="blue-button mt-3 h-10 w-full rounded-full text-[13px] font-semibold disabled:opacity-50"
        >
          {busy ? "Unlocking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
