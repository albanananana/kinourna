"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client/api";
import { manualKey } from "@/lib/game";
import { filmMeta, filmSubtitle, filmTitle, formatRating, joinNames } from "@/lib/i18n";
import type { Film } from "@/lib/types";
import { useI18n } from "../i18n/I18nProvider";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Poster } from "../ui/Poster";
import { EmptyTicket, Ticket } from "../ui/Ticket";
import { Accent, ActionBar, Heading, Page } from "./ActionBar";
import { useBusy, useRoomCtx } from "./context";

export function Collect() {
  const { state, me, isHost, myId } = useRoomCtx();
  const { busy, go } = useBusy();
  const { t } = useI18n();
  const { perPlayer } = state.settings;
  const mine = me?.films ?? [];
  const full = mine.length >= perPlayer;
  const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
  const waiting = state.players.filter((p) => (state.counts[p.id] ?? 0) < perPlayer);
  const host = state.players.find((p) => p.id === state.hostId);

  return (
    <>
      <Page>
        <Heading
          kicker={state.round > 1 ? t.collect.kickerRound(state.round) : t.collect.kicker}
          title={<Accent parts={t.collect.title(perPlayer)} />}
          sub={t.collect.sub}
        />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <Search mine={mine} full={full} onAdd={(film) => go(`add-${film.key}`, { type: "addFilm", film })} busy={busy} />
          </div>

          <aside>
            <div className="lg:sticky lg:top-28">
              <div className="flex items-baseline justify-between">
                <p className="label">{t.collect.yourTickets}</p>
                <p className="font-mono text-[11px] text-muted">
                  {mine.length}/{perPlayer}
                </p>
              </div>
              <div className="mt-3 space-y-2.5">
                <AnimatePresence initial={false}>
                  {mine.map((film, i) => (
                    <motion.div
                      key={film.key}
                      layout
                      initial={{ opacity: 0, x: 40, rotate: 3 }}
                      animate={{ opacity: 1, x: 0, rotate: 0 }}
                      exit={{ opacity: 0, x: -30, transition: { duration: 0.18 } }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    >
                      <Ticket
                        film={film}
                        serial={i + 1}
                        removing={busy === `rm-${film.key}`}
                        onRemove={() => go(`rm-${film.key}`, { type: "removeFilm", key: film.key })}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {Array.from({ length: Math.max(0, perPlayer - mine.length) }, (_, i) => (
                  <EmptyTicket key={`empty-${i}`} serial={mine.length + i + 1} />
                ))}
              </div>

              <p className="label mt-8">{t.collect.whoPicked}</p>
              <ul className="mt-3 space-y-2">
                {state.players.map((p) => {
                  const n = state.counts[p.id] ?? 0;
                  return (
                    <li key={p.id} className="flex items-center gap-3">
                      <Avatar player={p} size={26} />
                      <span className="min-w-0 flex-1 truncate text-[14px]">
                        {p.name}
                        {p.id === myId && <span className="text-dim">{t.room.youShort}</span>}
                      </span>
                      <span className="flex gap-1" aria-label={t.collect.progress(n, perPlayer)}>
                        {Array.from({ length: perPlayer }, (_, i) => (
                          <span key={i} className={`h-2.5 w-4 rounded-[2px] transition ${i < n ? "bg-paper" : "bg-ink-3"}`} />
                        ))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </Page>

      <ActionBar
        note={
          waiting.length === 0
            ? t.collect.allIn
            : isHost
              ? t.collect.stillPicking(joinNames(t, waiting.map((p) => p.name)))
              : full
                ? <span className="dots">{t.collect.waitOthers(host?.name ?? t.room.hostFallback)}</span>
                : t.collect.left(perPlayer - mine.length)
        }
      >
        {isHost && (
          <Button size="lg" disabled={total < 2} busy={busy === "reveal"} onClick={() => go("reveal", { type: "reveal" })}>
            {t.collect.open(total)}
          </Button>
        )}
      </ActionBar>
    </>
  );
}

function Search({
  mine,
  full,
  onAdd,
  busy,
}: {
  mine: Film[];
  full: boolean;
  onAdd: (film: Film) => Promise<boolean>;
  busy: string | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Film[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [demo, setDemo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = query.trim();
  const { t, lang } = useI18n();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await api.search(trimmed, lang, ctrl.signal);
        setResults(res.results);
        setDemo(res.demo);
        setStatus("done");
      } catch {
        if (!ctrl.signal.aborted) setStatus("error");
      }
    }, 280);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [trimmed, lang]);

  const add = async (film: Film) => {
    if (await onAdd(film)) setQuery("");
  };

  const has = new Set(mine.map((f) => f.key));
  const showResults = trimmed.length >= 2;
  const manual: Film = { key: manualKey(trimmed), title: trimmed };

  return (
    <div>
      <label htmlFor="film-search" className="label">
        {t.collect.searchLabel}
      </label>
      <div className="relative mt-3">
        <svg aria-hidden width="18" height="18" viewBox="0 0 20 20" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim">
          <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="m13 13 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          id="film-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={full ? t.collect.placeholderFull : t.collect.placeholder}
          name="q"
          disabled={full}
          autoComplete="off"
          enterKeyHint="search"
          className="h-14 w-full rounded-lg border border-line-strong bg-ink-1 pl-12 pr-4 text-[17px] text-cream placeholder:text-dim focus:border-amber/70 focus:outline-none disabled:opacity-60"
        />
        {status === "loading" && showResults && (
          <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-dim border-t-amber" aria-label={t.collect.searching} />
        )}
      </div>

      {demo && showResults && (
        <p className="mt-3 rounded-md border border-amber/25 bg-amber/5 px-3 py-2 text-[13px] text-amber/90">
          {t.collect.demo}
        </p>
      )}

      {showResults && (
        <ul className="mt-4 divide-y divide-line" aria-live="polite">
          {results.map((film) => {
            const added = has.has(film.key);
            const pending = busy === `add-${film.key}`;
            return (
              <li key={film.key}>
                <button
                  type="button"
                  disabled={added || full || pending}
                  onClick={() => add(film)}
                  className="group flex w-full items-center gap-3.5 py-2.5 text-left transition disabled:cursor-default"
                >
                  <Poster film={film} size="w92" rounded="rounded" className="w-12 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-medium leading-tight">{filmTitle(film, lang)}</span>
                    <span className="mt-1 block truncate text-[12.5px] text-dim">
                      {[filmSubtitle(film, lang), filmMeta(film, t)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {film.rating ? <span className="font-mono text-[11px] text-muted">★ {formatRating(lang, film.rating)}</span> : null}
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
                      added
                        ? "border-amber bg-amber text-ink-0"
                        : full
                          ? "border-line text-dim"
                          : "border-line-strong text-cream group-hover:border-signal group-hover:bg-signal"
                    }`}
                    aria-hidden
                  >
                    {pending ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : added ? (
                      <svg width="15" height="15" viewBox="0 0 16 16">
                        <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 16 16">
                        <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                  <span className="sr-only">{added ? t.collect.added : t.collect.add}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showResults && status === "done" && results.length === 0 && (
        <p className="mt-5 text-[14px] text-muted">{t.collect.nothing}</p>
      )}
      {status === "error" && showResults && <p className="mt-5 text-[14px] text-signal-hi">{t.collect.searchFailed}</p>}

      {showResults && status !== "loading" && !has.has(manual.key) && manual.key !== "manual:" && (
        <button
          type="button"
          disabled={full}
          onClick={() => add(manual)}
          className="mt-4 w-full rounded-md border border-dashed border-line-strong px-4 py-3 text-left text-[14px] text-muted transition hover:border-cream/40 hover:text-cream disabled:opacity-40"
        >
          {t.collect.manual[0]}
          <span className="text-cream">{trimmed}</span>
          {t.collect.manual[1]}
        </button>
      )}

      {!showResults && (
        <p className="mt-4 text-[13px] leading-relaxed text-dim">
          {t.collect.hint}
        </p>
      )}
    </div>
  );
}
