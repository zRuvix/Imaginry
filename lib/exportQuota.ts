"use client";

import { useEffect, useState } from "react";
import type { Plan } from "./pricing";

/** Mirrors lib/server/exports' ExportQuota. */
export type Quota = { plan: Plan; remaining: number | null; resetsAt: string | null };

const EVENT = "imaginry:quota";

/** Tells every useExportQuota on the page about a quota the server just returned. */
export function announceQuota(quota: Quota) {
  window.dispatchEvent(new CustomEvent<Quota>(EVENT, { detail: quota }));
}

/**
 * The signed-in user's plan and exports left today, fetched when `signedIn`
 * turns true and kept current by announceQuota after each export. null until
 * known, or when signed out.
 */
export function useExportQuota(signedIn: boolean | null | undefined) {
  const [quota, setQuota] = useState<Quota | null>(null);
  useEffect(() => {
    if (!signedIn) return setQuota(null);
    let live = true;
    fetch("/api/export", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { quota?: Quota } | null) => live && setQuota(d?.quota ?? null))
      .catch(() => {});
    const onQuota = (e: Event) => setQuota((e as CustomEvent<Quota>).detail);
    window.addEventListener(EVENT, onQuota);
    return () => {
      live = false;
      window.removeEventListener(EVENT, onQuota);
    };
  }, [signedIn]);
  return quota;
}
