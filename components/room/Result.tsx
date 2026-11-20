"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { joinNames, plural } from "@/lib/ru";
import { backdropUrl, posterUrl } from "@/lib/tmdb-image";
import type { BoardFilm, Result as ResultT } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { Bulbs } from "../ui/Bulbs";
import { Button } from "../ui/Button";
import { Poster } from "../ui/Poster";
import { SplitFlap } from "../ui/SplitFlap";
import { Ticket } from "../ui/Ticket";
import { ActionBar, Page } from "./ActionBar";
import { useBusy, useRoomCtx, useTwoStep } from "./context";
import { Drum } from "./Drum";
import { metaLine } from "./FilmCard";

const INTRO_MS: Record<ResultT["via"], number> = { urn: 3000, vote: 2300, strike: 1500 };

export function Result() {
  const { state, freshResult } = useRoomCtx();
  const reduce = useReducedMotion();
  const result = state.result;
  const film = state.board.find((f) => f.key === result?.key);
  const [stage, setStage] = useState<"intro" | "reveal">(freshResult && !reduce ? "intro" : "reveal");

  // Depend on primitives only: every poll/realtime tick delivers a fresh
  // `result` object, which would otherwise restart (and starve) the timer.
  const via = result?.via;
  useEffect(() => {
    if (stage !== "intro" || !via) return;
    const t = setTimeout(() => setStage("reveal"), INTRO_MS[via]);
    return () => clearTimeout(t);
  }, [stage, via]);

  if (!result || !film) return null;
  if (stage === "intro") return <Intro result={result} film={film} board={state.board} onSkip={() => setStage("reveal")} />;
  return <Reveal result={result} film={film} />;
}

/* ------------------------------------------------------------------ */

function Intro({ result, film, board, onSkip }: { result: ResultT; film: BoardFilm; board: BoardFilm[]; onSkip: () => void }) {
  const [ticketOut, setTicketOut] = useState(false);
  useEffect(() => {
    if (result.via !== "urn") return;
    const t = setTimeout(() => setTicketOut(true), 1500);
    return () => clearTimeout(t);
  }, [result.via]);

  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="Пропустить анимацию"
      className="flex flex-1 cursor-default flex-col items-center justify-center px-5 py-16 text-center"
    >
      {result.via === "urn" && (
        <div className="relative flex flex-col items-center">
          <p className="label text-amber">{ticketOut ? "Вытянули!" : <span className="dots">Крутим барабан</span>}</p>
          <div className="relative mt-6 h-[300px] w-[280px]">
            <motion.div
              className="absolute inset-0 flex justify-center"
              animate={ticketOut ? { opacity: 0.25, scale: 0.9 } : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Drum tickets={board.reduce((s, f) => s + f.weight, 0)} speed="fast" size={260} />
            </motion.div>
            {ticketOut && (
              <motion.div
                className="absolute left-1/2 top-[34%] w-[320px] max-w-[88vw] md:w-[420px]"
                initial={{ x: "-50%", y: 10, scale: 0.2, rotate: -40, opacity: 0 }}
                animate={{ x: "-50%", y: -10, scale: 1, rotate: -4, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16 }}
              >
                <Ticket film={film} serial={board.findIndex((f) => f.key === film.key) + 1} />
              </motion.div>
            )}
          </div>
        </div>
      )}

      {result.via === "vote" && <VoteCount result={result} board={board} />}

      {result.via === "strike" && (
        <div className="flex flex-col items-center">
          <p className="label text-amber">Остался последний</p>
          <motion.div
            className="mt-6 w-[200px]"
            initial={{ scale: 0.6, opacity: 0, rotate: 6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 14 }}
          >
            <Poster film={film} size="w342" className="shadow-[0_30px_80px_-20px_rgb(229_56_44/0.6)]" />
          </motion.div>
        </div>
      )}
    </button>
  );
}

function VoteCount({ result, board }: { result: ResultT; board: BoardFilm[] }) {
  const tally = result.tally ?? {};
  const top = [...board].sort((a, b) => (tally[b.key] ?? 0) - (tally[a.key] ?? 0)).slice(0, 5);
  const max = Math.max(1, ...Object.values(tally));
  return (
    <div className="w-full max-w-md text-left">
      <p className="label text-center text-amber">
        <span className="dots">Считаем голоса</span>
      </p>
      <ul className="mt-8 space-y-3">
        {top.map((f, i) => (
          <li key={f.key} className="flex items-center gap-3">
            <Poster film={f} size="w92" rounded="rounded" className="w-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] text-muted">{f.title}</div>
              <motion.div
                className={`mt-1 h-2 rounded-full ${f.key === result.key ? "bg-amber" : "bg-ink-3"}`}
                initial={{ width: 0 }}
                animate={{ width: `${((tally[f.key] ?? 0) / max) * 100}%` }}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Reveal({ result, film }: { result: ResultT; film: BoardFilm }) {
  const { state, isHost, players } = useRoomCtx();
  const { busy, go } = useBusy();
  const { armed, confirm } = useTwoStep();
  const authorIds = result.authors[film.key] ?? [];
  const authors = authorIds.map((id) => players.get(id)).filter((p) => !!p);
  const bg = backdropUrl(film.backdrop) ?? posterUrl(film.poster, "w780");
  const trailer = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${film.enTitle ?? film.title} ${film.year ?? ""} trailer`)}`;
  const tmdb = film.tmdbId && film.mediaType ? `https://www.themoviedb.org/${film.mediaType}/${film.tmdbId}?language=ru` : undefined;
  const excluded = state.play?.kind === "urn" ? state.play.excluded : [];
  const urnLeft = state.board.filter((f) => f.key !== film.key && !excluded.includes(f.key)).length;

  return (
    <>
      <section className="relative isolate overflow-hidden">
        {bg && (
          // eslint-disable-next-line @next/next/no-img-element -- TMDB backdrop
          <img src={bg} alt="" className={`absolute inset-0 -z-20 h-full w-full object-cover ${film.backdrop ? "opacity-50" : "scale-110 opacity-40 blur-2xl"}`} />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--color-ink-0)_8%,rgb(11_10_9/0.7)_50%,rgb(11_10_9/0.35)),linear-gradient(90deg,rgb(11_10_9/0.85),transparent_70%)]" />

        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:px-8 md:pb-14">
          <Bulbs count={26} className="opacity-90" />
          <div className="mt-6 grid grid-cols-1 items-end gap-6 md:mt-8 md:grid-cols-[minmax(0,290px)_minmax(0,1fr)] md:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 18 }}
              className="w-[42%] max-w-[190px] md:w-full md:max-w-none"
            >
              <Poster film={film} size="w500" rounded="rounded-lg" className="shadow-[0_40px_90px_-30px_rgb(0_0_0/1),0_0_0_1px_rgb(255_255_255/0.06)]" />
            </motion.div>

            <div>
              <p className="label text-amber">Сегодня смотрим</p>
              <h1 className="display mt-3 text-[clamp(54px,13vw,124px)] [text-wrap:balance]">
                <SplitFlap text={film.title} settleMs={450} stagger={42} />
              </h1>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                {[film.enTitle ?? film.originalTitle, metaLine(film), film.rating ? `★ ${film.rating.toFixed(1)}` : null].filter(Boolean).join("  ·  ")}
              </p>
              {film.overview && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-cream/80"
                >
                  {film.overview}
                </motion.p>
              )}

              {authors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mt-6 flex flex-wrap items-center gap-3"
                >
                  <span className="label">{authors.length > 1 ? "Загадали" : "Чей билет"}</span>
                  {authors.map((p) => (
                    <span key={p.id} className="flex items-center gap-2 rounded-full bg-ink-0/60 py-1 pl-1 pr-3 text-[14px] backdrop-blur">
                      <Avatar player={p} size={24} />
                      {p.name}
                    </span>
                  ))}
                </motion.div>
              )}

              <div className="mt-7 flex flex-wrap gap-2">
                <a href={trailer} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-md bg-cream px-4 font-display text-[19px] font-bold uppercase text-ink-0 transition hover:bg-white">
                  <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden>
                    <path d="M0 0l12 7-12 7z" fill="currentColor" />
                  </svg>
                  Трейлер
                </a>
                {tmdb && (
                  <a href={tmdb} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-md border border-line-strong bg-ink-0/40 px-4 font-display text-[19px] font-bold uppercase backdrop-blur transition hover:border-cream/50">
                    Подробнее на TMDB
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Page className="!pt-4">
        <Details result={result} film={film} />
      </Page>

      <ActionBar note={isHost ? undefined : "Приятного просмотра. Ведущий может перетянуть или начать новый раунд."}>
        {isHost && result.via === "urn" && urnLeft > 0 && (
          <Button variant="ghost" size="sm" className="h-11 md:h-12 md:text-[21px]" busy={busy === "redraw"} onClick={() => go("redraw", { type: "redraw" })}>
            Перетянуть
          </Button>
        )}
        {isHost && (
          <Button variant="ghost" size="sm" className="h-11 md:h-12 md:text-[21px]" busy={busy === "board"} onClick={() => go("board", { type: "backToBoard" })}>
            Другой режим
          </Button>
        )}
        {isHost && (
          <Button size="sm" className="h-11 md:h-12 md:text-[21px]" busy={busy === "round"} onClick={() => confirm("round", () => go("round", { type: "newRound" }))}>
            {armed === "round" ? "Точно? Всё заново" : "Новый раунд"}
          </Button>
        )}
      </ActionBar>
    </>
  );
}

function Details({ result, film }: { result: ResultT; film: BoardFilm }) {
  const { state, players } = useRoomCtx();
  const byKey = new Map(state.board.map((f) => [f.key, f]));

  // Everyone's picks, revealed at last.
  const picks = state.players
    .map((p) => ({ player: p, films: state.board.filter((f) => (result.authors[f.key] ?? []).includes(p.id)) }))
    .filter((x) => x.films.length > 0);

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <div>
        {result.via === "vote" && result.tally && (
          <>
            <p className="label">Как голосовали</p>
            <ul className="mt-4 space-y-2.5">
              {[...state.board]
                .sort((a, b) => (result.tally![b.key] ?? 0) - (result.tally![a.key] ?? 0))
                .map((f) => {
                  const n = result.tally![f.key] ?? 0;
                  const max = Math.max(1, ...Object.values(result.tally!));
                  return (
                    <li key={f.key} className="flex items-center gap-3">
                      <span className="w-[42%] truncate text-[14px] text-cream/85">{f.title}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-2">
                        <span className={`block h-full rounded-full ${f.key === film.key ? "bg-amber" : "bg-muted/40"}`} style={{ width: `${(n / max) * 100}%` }} />
                      </span>
                      <span className="tabular w-6 text-right font-mono text-[12px] text-muted">{n}</span>
                    </li>
                  );
                })}
            </ul>
            {result.tied && result.tied.length > 1 && (
              <p className="mt-4 text-[14px] text-muted">
                Ничья: {joinNames(result.tied.map((k) => `«${byKey.get(k)?.title ?? "?"}»`))} — решила урна.
              </p>
            )}
          </>
        )}

        {result.via === "strike" && state.play?.kind === "strike" && (
          <>
            <p className="label">Как вычёркивали</p>
            <ol className="mt-4 space-y-2">
              {state.play.struck.map((s, i) => (
                <li key={s.key} className="flex items-baseline gap-3 text-[14px]">
                  <span className="w-6 font-mono text-[11px] text-dim">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 truncate text-cream/60 line-through decoration-signal/70">{byKey.get(s.key)?.title}</span>
                  <span className="text-muted">{players.get(s.by)?.name ?? "—"}</span>
                </li>
              ))}
            </ol>
          </>
        )}

        {result.via === "urn" && (
          <>
            <p className="label">Жребий</p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              {(() => {
                const excluded = state.play?.kind === "urn" ? state.play.excluded : [];
                const pool = state.board.filter((f) => !excluded.includes(f.key));
                const total = pool.reduce((s, f) => s + f.weight, 0);
                return `Шанс был ${film.weight} из ${total} ${plural(total, ["билета", "билетов", "билетов"])}.`;
              })()}
              {state.play?.kind === "urn" && state.play.excluded.length > 0 && (
                <> Перетягивали: {joinNames(state.play.excluded.map((k) => `«${byKey.get(k)?.title ?? "?"}»`))}.</>
              )}
            </p>
          </>
        )}
      </div>

      {picks.length > 0 && (
        <div>
          <p className="label">Кто что загадал</p>
          <ul className="mt-4 space-y-4">
            {picks.map(({ player, films }) => (
              <li key={player.id} className="flex items-start gap-3">
                <Avatar player={player} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px]">{player.name}</div>
                  <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-none">
                    {films.map((f) => (
                      <div key={f.key} className={`w-12 shrink-0 ${f.key === film.key ? "" : "opacity-55"}`} title={f.title}>
                        <Poster film={f} size="w92" rounded="rounded" className={f.key === film.key ? "ring-2 ring-amber" : ""} />
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
