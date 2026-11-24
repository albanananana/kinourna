"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { currentStriker, remainingAfterStrikes } from "@/lib/game";
import { filmTitle } from "@/lib/i18n";
import { useI18n } from "../i18n/I18nProvider";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Accent, ActionBar, Page } from "./ActionBar";
import { useBusy, useRoomCtx } from "./context";
import { FilmCard, FilmGrid } from "./FilmCard";
import { FilmSheet } from "./FilmSheet";
import { BackButton } from "./GoBack";

export function PlayStrike() {
  const { state, myId, isHost, players } = useRoomCtx();
  const { busy, go } = useBusy();
  const [selected, setSelected] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { t, lang } = useI18n();
  if (state.play?.kind !== "strike") return null;
  const play = state.play;

  const strikerId = currentStriker(play);
  const striker = strikerId ? players.get(strikerId) : undefined;
  const myTurn = strikerId === myId;
  const left = remainingAfterStrikes(state.board, play);
  const struckBy = new Map(play.struck.map((s) => [s.key, s.by]));
  const target = selected && left.some((f) => f.key === selected) ? state.board.find((f) => f.key === selected) : undefined;
  const infoFilm = state.board.find((f) => f.key === info);

  const strike = async () => {
    if (!target) return;
    const ok = await go("strike", { type: "strike", key: target.key });
    if (ok) setSelected(null);
  };

  return (
    <>
      <Page>
        <p className="label text-amber">{t.strike.kicker}</p>
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
                {myTurn ? <Accent parts={t.strike.yourTurn} /> : t.strike.turnOf(striker?.name ?? "—")}
              </h1>
            </div>
          </motion.div>
        </AnimatePresence>
        <p className="mt-3 max-w-[48ch] text-[15px] text-muted">
          {myTurn ? t.strike.pickPrompt : t.strike.watchPrompt} {t.strike.left(left.length)}
        </p>

        <ol className="mt-6 flex flex-wrap items-center gap-2" aria-label={t.strike.queue}>
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
                {i < play.order.length - 1 && <span className="sr-only">{t.strike.then}</span>}
              </li>
            );
          })}
        </ol>

        <div className="mt-8">
          <FilmGrid>
            {state.board.map((film, i) => {
              const by = struckBy.get(film.key);
              const who = by ? players.get(by)?.name ?? t.strike.someone : undefined;
              return (
                <FilmCard
                  key={film.key}
                  film={film}
                  index={i}
                  state={by ? "struck" : selected === film.key ? "targeted" : myTurn ? "pickable" : "idle"}
                  caption={who ? `✕ ${who}` : undefined}
                  onClick={myTurn && !by ? () => setSelected(selected === film.key ? null : film.key) : undefined}
                  onInfo={() => setInfo(film.key)}
                />
              );
            })}
          </FilmGrid>
        </div>
        {infoFilm && (
          <FilmSheet
            film={infoFilm}
            onClose={() => setInfo(null)}
            action={
              myTurn && !struckBy.has(infoFilm.key)
                ? {
                    label: t.strike.strikeBtn,
                    busy: busy === "strike",
                    run: async () => {
                      const ok = await go("strike", { type: "strike", key: infoFilm.key });
                      if (ok) setSelected(null);
                      return ok;
                    },
                  }
                : undefined
            }
          />
        )}
      </Page>

      <ActionBar
        note={
          myTurn
            ? target
              ? undefined
              : t.strike.tapPoster
            : <span className="dots">{t.strike.waitTurn(striker?.name ?? "—")}</span>
        }
      >
        {isHost && <BackButton to="board" size={myTurn ? "lg" : "md"} />}
        {isHost && !myTurn && (
          <Button variant="ghost" busy={busy === "skip"} onClick={() => go("skip", { type: "skipTurn" })}>
            {t.strike.skip}
          </Button>
        )}
        {myTurn && (
          <Button size="lg" disabled={!target} busy={busy === "strike"} onClick={strike} className="max-w-full">
            <span className="truncate">{target ? t.strike.strikeIt(filmTitle(target, lang)) : t.strike.strikeBtn}</span>
          </Button>
        )}
      </ActionBar>
    </>
  );
}
