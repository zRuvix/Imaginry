import { useCallback, useRef, useState } from "react";

const MERGE_WINDOW_MS = 400;

/**
 * Undo/redo state. Consecutive updates sharing a `group` within a short window
 * (e.g. dragging a slider) collapse into a single history entry.
 */
export function useHistory<T>(initial: () => T) {
  const [history, setHistory] = useState(() => ({
    past: [] as T[],
    present: initial(),
    future: [] as T[],
  }));
  const last = useRef({ group: "", at: 0 });

  const set = useCallback((update: T | ((prev: T) => T), group = "") => {
    const now = performance.now();
    const merge = group !== "" && group === last.current.group && now - last.current.at < MERGE_WINDOW_MS;
    last.current = { group, at: now };
    setHistory((h) => {
      const next = typeof update === "function" ? (update as (prev: T) => T)(h.present) : update;
      if (next === h.present) return h;
      return {
        past: merge ? h.past : [...h.past.slice(-99), h.present],
        present: next,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    last.current = { group: "", at: 0 };
    setHistory((h) =>
      h.past.length === 0
        ? h
        : { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] },
    );
  }, []);

  const redo = useCallback(() => {
    last.current = { group: "", at: 0 };
    setHistory((h) =>
      h.future.length === 0
        ? h
        : { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) },
    );
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
