"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Plus, Trash } from "@/components/icons";
import type { StudioState } from "@/lib/studio/schema";
import { SIGNALS, sliderTargets, type AudioInput, type Route, type Signal, type Signals } from "@/lib/lab/drive";
import { IconButton, Scrub, Select, Toggle } from "./controls";
import { Action, Card, Meter, Note } from "./parts";

type Props = {
  state: StudioState;
  signals: RefObject<Signals>;
  routes: Route[];
  onRoutes: (routes: Route[]) => void;
  audio: AudioInput | null;
  onMic: () => void;
  onTrack: (file: File) => void;
  onStopAudio: () => void;
  bpm: number | null;
  onTap: () => void;
  onClearTempo: () => void;
  pagePreview: boolean;
  onPagePreview: (on: boolean) => void;
};

/** Re-reads the live signals ten times a second for the meters. */
function useSignalSnapshot(signals: RefObject<Signals>) {
  const [snap, setSnap] = useState<Signals>(() => ({ ...signals.current }));
  useEffect(() => {
    const t = setInterval(() => setSnap({ ...signals.current }), 100);
    return () => clearInterval(t);
  }, [signals]);
  return snap;
}

export default function DrivePanel(p: Props) {
  const snap = useSignalSnapshot(p.signals);
  const fileRef = useRef<HTMLInputElement>(null);
  const targets = sliderTargets(p.state);
  const update = (id: string, patch: Partial<Route>) => p.onRoutes(p.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRoute = () => {
    const t = targets[0];
    if (!t) return;
    p.onRoutes([
      ...p.routes,
      { id: Math.random().toString(36).slice(2, 9), signal: "pointer x", section: t.section, control: t.control, amount: 0.3, smoothing: 0.8 },
    ]);
  };

  return (
    <div className="scroll-thin h-full space-y-2.5 overflow-y-auto p-3">
      <Card title="Signals">
        {SIGNALS.map((s) => (
          <Meter key={s} label={s} value={snap[s]} />
        ))}
        <Note>Move, click and scroll over the canvas. Scroll needs the page preview.</Note>
        <Toggle label="Page preview" checked={p.pagePreview} onChange={p.onPagePreview} />
      </Card>

      <Card title="Sound" delay={40}>
        {p.audio ? (
          <>
            <p className="truncate text-[13px] text-bone">{p.audio.name}</p>
            <Action onClick={p.onStopAudio}>Stop</Action>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <Action onClick={p.onMic}>Use the mic</Action>
            <Action onClick={() => fileRef.current?.click()}>Load a track</Action>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) p.onTrack(f);
            e.target.value = "";
          }}
        />
        <div className="grid grid-cols-[1fr_auto] gap-1.5">
          <Action onClick={p.onTap} title="Tap along with the beat">
            {p.bpm ? `Tap tempo · ${p.bpm} bpm` : "Tap tempo"}
          </Action>
          {p.bpm && (
            <button type="button" onClick={p.onClearTempo} className="press h-10 rounded-[12px] bg-white/[0.06] px-3 text-[13px] text-bone/70 hover:text-bone">
              Free clock
            </button>
          )}
        </div>
      </Card>

      <Card
        title="Map"
        delay={80}
        aside={
          <IconButton label="Add a route" tooltip="none" onClick={addRoute} disabled={!targets.length}>
            <Plus size={15} />
          </IconButton>
        }
      >
        {p.routes.length === 0 && <Note>Pick a signal and the slider it moves. Add a route with +.</Note>}
        {p.routes.map((r) => {
          const t = targets.find((x) => x.section === r.section && x.control === r.control);
          return (
            <div key={r.id} className="anim-pop space-y-1.5 rounded-[14px] bg-white/[0.03] p-2">
              <div className="grid grid-cols-[1fr_auto] items-center gap-1">
                <Select label="Signal" value={r.signal} options={SIGNALS} onChange={(v) => update(r.id, { signal: v as Signal })} />
                <IconButton label="Remove route" tooltip="none" onClick={() => p.onRoutes(p.routes.filter((x) => x.id !== r.id))}>
                  <Trash size={14} />
                </IconButton>
              </div>
              <Select
                label="Drives"
                value={t?.label ?? "missing layer"}
                options={targets.map((x) => x.label)}
                onChange={(v) => {
                  const next = targets.find((x) => x.label === v);
                  if (next) update(r.id, { section: next.section, control: next.control });
                }}
              />
              <Scrub label="Amount" value={r.amount} min={-1} max={1} step={0.01} onChange={(v) => update(r.id, { amount: v })} />
              <Scrub label="Smoothing" value={r.smoothing} min={0} max={0.95} step={0.01} onChange={(v) => update(r.id, { smoothing: v })} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}
