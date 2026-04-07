import { useState, useCallback } from 'react';
import type { Person } from '../types';

interface HistoryState {
  past: Person[];
  present: Person | null;
  future: Person[];
}

export const useHistory = (initialState: Person | null = null, maxHistorySize = 25) => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialState,
    future: []
  });

  const pushState = useCallback((newState: Person) => {
    setHistory((prev) => {
      if (!prev.present) {
        return {
          past: [],
          present: newState,
          future: []
        };
      }
      
      const newPast = [...prev.past, prev.present];
      if (newPast.length > maxHistorySize) {
        newPast.shift(); // remove oldest
      }

      return {
        past: newPast,
        present: newState,
        future: [] // Any new action clears the redo stack
      };
    });
  }, [maxHistorySize]);

  // Returns the newly updated state (if undone) so caller can sync it to DB immediately
  const undo = useCallback((): Person | null => {
    let undoneState: Person | null = null;
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      
      undoneState = previous;
      
      return {
        past: newPast,
        present: previous,
        future: prev.present ? [prev.present, ...prev.future] : prev.future
      };
    });
    return undoneState;
  }, []);

  // Returns the newly updated state (if redone) so caller can sync it to DB
  const redo = useCallback((): Person | null => {
    let redoneState: Person | null = null;
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      redoneState = next;
      
      return {
        past: prev.present ? [...prev.past, prev.present] : prev.past,
        present: next,
        future: newFuture
      };
    });
    return redoneState;
  }, []);

  const resetHistory = useCallback((newState: Person) => {
      setHistory({
          past: [],
          present: newState,
          future: []
      });
  }, []);

  return {
    state: history.present,
    pushState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    resetHistory
  };
};
