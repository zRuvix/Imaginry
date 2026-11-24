/** Usage events the studio reports (shared by the client and /api/track). */
export const EVENT_KINDS = {
  visit: "Studio visit",
  export_png: "PNG export",
  export_video: "Video export",
  copy_embed: "Embed copied",
  share: "Link shared",
  publish: "Published",
} as const;

export type EventKind = keyof typeof EVENT_KINDS;

export const EXPORT_KINDS: EventKind[] = ["export_png", "export_video", "copy_embed"];

export const isEventKind = (k: unknown): k is EventKind => typeof k === "string" && k in EVENT_KINDS;

/** Small details stored with an event: a few short strings and numbers. */
export type EventMeta = Record<string, string | number | boolean>;

/**
 * Report a usage event. Fire-and-forget: never throws, never delays the UI,
 * and still arrives when the page is closing.
 */
export function track(kind: EventKind, meta?: EventMeta) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ kind, meta });
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(
      () => {},
    );
  } catch {
    // Tracking must never break the studio.
  }
}
