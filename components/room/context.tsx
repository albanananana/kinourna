"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Action, MeData, Player, RoomState } from "@/lib/types";

export type RoomCtx = {
  state: RoomState;
  me: MeData | null;
  myId: string;
  isHost: boolean;
  players: Map<string, Player>;
  /** Runs an action; resolves to false (and shows a toast) on failure. */
  run: (action: Action) => Promise<boolean>;
  notify: (message: string) => void;
  /** True when this client watched the result arrive (play the reveal). */
  freshResult: boolean;
};

export const RoomContext = createContext<RoomCtx | null>(null);

export function useRoomCtx(): RoomCtx {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoomCtx outside RoomContext");
  return ctx;
}

/** Tracks which button is mid-request so only that one shows a spinner. */
export function useBusy() {
  const { run } = useRoomCtx();
  const [busy, setBusy] = useState<string | null>(null);
  const go = useCallback(
    async (key: string, action: Action) => {
      setBusy(key);
      const ok = await run(action);
      setBusy(null);
      return ok;
    },
    [run],
  );
  return { busy, go };
}

/**
 * Two-tap confirmation for destructive actions: the first tap arms the
 * button ("Точно?"), the second within a few seconds runs it.
 */
export function useTwoStep(ms = 3000) {
  const [armed, setArmed] = useState<string | null>(null);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(null), ms);
    return () => clearTimeout(t);
  }, [armed, ms]);
  const confirm = useCallback(
    (key: string, fn: () => void) => {
      if (armed === key) {
        setArmed(null);
        fn();
      } else {
        setArmed(key);
      }
    },
    [armed],
  );
  return { armed, confirm };
}
