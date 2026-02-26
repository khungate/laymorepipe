import { useState, useCallback, useRef } from "react";

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

const MAX_HISTORY = 50;

export function useUndoRedo<T>(initialState: T) {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Track whether the initial load has replaced the state
  const initialized = useRef(false);

  const set = useCallback((updater: T | ((prev: T) => T)) => {
    setState((s) => {
      const newPresent = typeof updater === "function"
        ? (updater as (prev: T) => T)(s.present)
        : updater;

      // Don't push to history if the value hasn't changed
      if (newPresent === s.present) return s;

      const newPast = [...s.past, s.present].slice(-MAX_HISTORY);
      return { past: newPast, present: newPresent, future: [] };
    });
  }, []);

  /** Replace state without creating a history entry (for initial load) */
  const replace = useCallback((value: T) => {
    setState({ past: [], present: value, future: [] });
    initialized.current = true;
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      const newPast = s.past.slice(0, -1);
      return { past: newPast, present: previous, future: [s.present, ...s.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      const newFuture = s.future.slice(1);
      return { past: [...s.past, s.present], present: next, future: newFuture };
    });
  }, []);

  return {
    state: state.present,
    set,
    replace,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
