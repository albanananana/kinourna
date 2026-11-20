"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Action, MeData, RoomState, Session } from "../types";
import { RequestError, api } from "./api";
import { loadSession, saveSession } from "./session";
import { getBrowserSupabase } from "./supabase";

export type RoomStatus = "loading" | "ready" | "missing";

/**
 * Single source of truth for a room on the client. Updates arrive from three
 * places — action responses, Supabase Realtime, and a slow safety poll — and
 * `rev` makes sure an older snapshot never overwrites a newer one.
 */
export function useRoom(code: string) {
  const [state, setState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<RoomStatus>("loading");
  const [session, setSessionState] = useState<Session | null>(null);
  const [me, setMe] = useState<MeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rev = useRef(0);
  const misses = useRef(0);

  const accept = useCallback((next: RoomState | undefined | null) => {
    if (!next || next.rev < rev.current) return;
    rev.current = next.rev;
    misses.current = 0;
    setState(next);
    setStatus("ready");
  }, []);

  // Once a room has loaded, a single failed poll (network blip, cold server)
  // must not throw everyone onto the "room not found" screen — only several
  // misses in a row mean the room is really gone.
  const refresh = useCallback(async () => {
    try {
      const { state: next } = await api.room(code);
      accept(next);
    } catch (err) {
      if (err instanceof RequestError && err.status === 404) {
        misses.current += 1;
        if (rev.current === 0 || misses.current >= 3) setStatus("missing");
      }
    }
  }, [code, accept]);

  // Initial load + session from localStorage.
  useEffect(() => {
    let cancelled = false;
    const stored = loadSession(code);
    api
      .room(code)
      .then(({ state: next }) => {
        if (cancelled) return;
        setSessionState(stored);
        accept(next);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof RequestError && err.status === 404) setStatus("missing");
        else setError((err as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [code, accept]);

  // Live updates: Realtime when configured, otherwise quick polling.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    const channel = supabase
      ?.channel(`room:${code}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => accept((payload.new as { state?: RoomState }).state),
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") void refresh();
      });

    const poll = setInterval(() => void refresh(), supabase ? 15000 : 1500);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      if (channel) void supabase?.removeChannel(channel);
    };
  }, [code, accept, refresh]);

  const joined = !!(session && state?.players.some((p) => p.id === session.playerId));

  // Private data (my picks, my ballot, which board films are mine).
  const phase = state?.phase;
  const round = state?.round;
  useEffect(() => {
    if (!joined || !session) return;
    let cancelled = false;
    api
      .me(code, session)
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code, joined, session, phase, round]);

  const setSession = useCallback(
    (next: Session, nextState: RoomState) => {
      saveSession(code, next);
      setSessionState(next);
      accept(nextState);
    },
    [code, accept],
  );

  const act = useCallback(
    async (action: Action) => {
      if (!session) throw new RequestError(401, "Сначала войди в комнату.");
      const res = await api.act(code, session, action);
      accept(res.state);
      if (res.me) setMe(res.me);
      return res;
    },
    [code, session, accept],
  );

  return { state, status, error, session, joined, me, act, setSession, refresh };
}

export type RoomApi = ReturnType<typeof useRoom>;
