"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { currentStriker, remainingAfterStrikes } from "@/lib/game";
import { filmsWord } from "@/lib/ru";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { ActionBar, Page } from "./ActionBar";
import { useBusy, useRoomCtx } from "./context";
import { FilmCard, FilmGrid } from "./FilmCard";

export function PlayStrike() {
  const { state, myId, isHost, players } = useRoomCtx();
  const { busy, go } = useBusy();
  const [selected, setSelected] = useState<string | null>(null);
  if (state.play?.kind !== "strike") return null;
  const play = state.play;

  const strikerId = currentStriker(play);
  const striker = strikerId ? players.get(strikerId) : undefined;
  const myTurn = strikerId === myId;
  const left = remainingAfterStrikes(state.board, play);
  const struckBy = new Map(play.struck.map((s) => [s.key, s.by]));
  const target = selected && left.some((f) => f.key === selected) ? state.board.find((f) => f.key === selected) : undefined;

  const strike = async () => {
    if (!target) return;
    const ok = await go("strike", { type: "strike", key: target.key });
    if (ok) setSelected(null);
  };

  return (
    <>
      <Page>
        <p className="label text-amber">Режим · вычёркивание</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={play.turn + "-" + play.struck.length}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="mt-3 flex items-center gap-4"
          >
            {striker && <Avatar player={striker} size={56} ring={myTurn} />}
            <div>
              <h1 className="display text-[clamp(46px,12vw,88px)]">
                {myTurn ? (
                  <>
                    Твой <span className="text-signal">ход</span>
                  </>
                ) : (
                  <>Ход: {striker?.name ?? "—"}</>
                )}
              </h1>
            </div>
          </motion.div>
        </AnimatePresence>
        <p className="mt-3 max-w-[48ch] text-[15px] text-muted">
          {myTurn ? "Выбери фильм, который точно не хочешь смотреть." : "Смотрим, что уберут."} Осталось {left.length}{" "}
          {filmsWord(left.length)} — последний и будем смотреть.
        </p>

        <ol className="mt-6 flex flex-wrap items-center gap-2" aria-label="Очередь">
          {play.order.map((id, i) => {
            const p = players.get(id);
            if (!p) return null;
            const active = id === strikerId;
            return (
              <li
                key={id}
                className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] transition ${
                  active ? "bg-cream text-ink-0" : "bg-ink-2 text-muted"
                }`}
              >
                <Avatar player={p} size={22} />
                {p.name}
                {i < play.order.length - 1 && <span className="sr-only">, затем</span>}
              </li>
            );
          })}
        </ol>

        <div className="mt-8">
          <FilmGrid>
            {state.board.map((film, i) => {
              const by = struckBy.get(film.key);
              const who = by ? players.get(by)?.name ?? "кто-то" : undefined;
              return (
                <FilmCard
                  key={film.key}
                  film={film}
                  index={i}
                  state={by ? "struck" : selected === film.key ? "targeted" : myTurn ? "pickable" : "idle"}
                  caption={who ? `✕ ${who}` : undefined}
                  onClick={myTurn && !by ? () => setSelected(selected === film.key ? null : film.key) : undefined}
                />
              );
            })}
          </FilmGrid>
        </div>
      </Page>

      <ActionBar
        note={
          myTurn
            ? target
              ? undefined
              : "Нажми на постер, чтобы выбрать."
            : <span className="dots">Ждём ход: {striker?.name ?? "—"}</span>
        }
      >
        {isHost && !myTurn && (
          <Button variant="ghost" busy={busy === "skip"} onClick={() => go("skip", { type: "skipTurn" })}>
            Пропустить ход
          </Button>
        )}
        {myTurn && (
          <Button size="lg" disabled={!target} busy={busy === "strike"} onClick={strike} className="max-w-full">
            <span className="truncate">{target ? `Вычеркнуть «${target.title}»` : "Вычеркнуть"}</span>
          </Button>
        )}
      </ActionBar>
    </>
  );
}
