"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoom } from "@/lib/client/useRoom";
import type { Action, MeData, RoomState, Session } from "@/lib/types";
import { Board } from "./Board";
import { Collect } from "./Collect";
import { RoomContext, type RoomCtx } from "./context";
import { JoinScreen } from "./JoinScreen";
import { Lobby } from "./Lobby";
import { PlayStrike } from "./PlayStrike";
import { PlayUrn } from "./PlayUrn";
import { PlayVote } from "./PlayVote";
import { Result } from "./Result";
import { RoomHeader } from "./RoomHeader";

export function RoomApp({ code }: { code: string }) {
  const room = useRoom(code);

  if (room.status === "missing") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <p className="label text-signal">Сеанс не найден</p>
        <h1 className="display mt-3 text-[64px]">Зала {code} нет</h1>
        <p className="mt-4 text-muted">Проверь код. Комнаты, в которых долго ничего не происходит, закрываются сами.</p>
        <Link href="/" className="mt-8 inline-flex h-12 w-fit items-center rounded-md bg-signal px-5 font-display text-[21px] font-bold uppercase">
          Создать новую
        </Link>
      </main>
    );
  }

  if (!room.state) return <RoomLoading />;

  if (!room.joined || !room.session) {
    return <JoinScreen state={room.state} session={room.session} onJoined={room.setSession} />;
  }

  return <RoomInner state={room.state} me={room.me} session={room.session} act={room.act} />;
}

export function RoomLoading() {
  return (
    <main className="flex flex-1 items-center justify-center py-32" aria-busy>
      <span className="label dots">Открываем зал</span>
    </main>
  );
}

function RoomInner({
  state,
  me,
  session,
  act,
}: {
  state: RoomState;
  me: MeData | null;
  session: Session;
  act: (action: Action) => Promise<unknown>;
}) {
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  // A result that already existed when the page loaded is shown without the
  // big reveal; one that arrives while we're watching gets the full show.
  const [initialResultAt] = useState(state.result?.at);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((text: string) => {
    setToast({ id: Date.now(), text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const run = useCallback(
    async (action: Action) => {
      try {
        await act(action);
        return true;
      } catch (err) {
        notify((err as Error).message);
        return false;
      }
    },
    [act, notify],
  );

  const ctx = useMemo<RoomCtx>(
    () => ({
      state,
      me,
      myId: session.playerId,
      isHost: state.hostId === session.playerId,
      players: new Map(state.players.map((p) => [p.id, p])),
      run,
      notify,
      freshResult: !!state.result && state.result.at !== initialResultAt,
    }),
    [state, me, session.playerId, run, notify, initialResultAt],
  );

  const screenKey =
    state.phase === "result" ? `result-${state.result?.at}` : `${state.phase}-${state.play?.kind ?? ""}-${state.round}`;

  // Each stage starts at the top — the host often presses "next" from the bottom bar.
  const firstScreen = useRef(true);
  useEffect(() => {
    if (firstScreen.current) {
      firstScreen.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screenKey]);

  return (
    <RoomContext.Provider value={ctx}>
      <RoomHeader />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screenKey}
          className="flex flex-1 flex-col"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <Screen state={state} />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+var(--safe-bottom))] z-50 flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              role="status"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="pointer-events-auto max-w-sm rounded-lg border border-line-strong bg-ink-2/95 px-4 py-3 text-[14px] text-cream shadow-2xl backdrop-blur"
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoomContext.Provider>
  );
}

function Screen({ state }: { state: RoomState }) {
  switch (state.phase) {
    case "lobby":
      return <Lobby />;
    case "collect":
      return <Collect />;
    case "board":
      return <Board />;
    case "play":
      if (state.play?.kind === "urn") return <PlayUrn />;
      if (state.play?.kind === "vote") return <PlayVote />;
      if (state.play?.kind === "strike") return <PlayStrike />;
      return <Board />;
    case "result":
      return <Result />;
  }
}
