"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { api } from "@/lib/client/api";
import { tmdbPageUrl, trailerEmbedUrl, trailerSearchUrl } from "@/lib/film-links";
import { filmMeta, filmOverview, filmPoster, filmSubtitle, filmTitle, formatRating, type Lang } from "@/lib/i18n";
import { backdropUrl, posterUrl } from "@/lib/tmdb-image";
import type { Film, FilmExtra } from "@/lib/types";
import { useI18n } from "../i18n/I18nProvider";
import { Button } from "../ui/Button";
import { Poster } from "../ui/Poster";
import { Sheet } from "../ui/Sheet";

/** Fetched once per title and language for the whole visit. */
const extras = new Map<string, FilmExtra | null>();

/** `undefined` while loading, `null` when there is nothing more to know. */
function useFilmExtra(film: Film, lang: Lang): FilmExtra | null | undefined {
  const id = film.tmdbId && film.mediaType ? `${film.mediaType}:${film.tmdbId}:${lang}` : null;
  const [, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!id || extras.has(id) || !film.mediaType || !film.tmdbId) return;
    const ctrl = new AbortController();
    api.film(film.mediaType, film.tmdbId, lang, ctrl.signal).then(
      (res) => {
        extras.set(id, res.extra);
        setLoaded(id);
      },
      () => {
        if (!ctrl.signal.aborted) setFailed(id);
      },
    );
    return () => ctrl.abort();
  }, [id, film.mediaType, film.tmdbId, lang]);

  if (!id) return null;
  if (extras.has(id)) return extras.get(id);
  return failed === id ? null : undefined;
}

/** The stage's own button in the sheet's footer; the sheet closes when `run` reports success. */
export type SheetAction = {
  label: ReactNode;
  variant?: "primary" | "ghost";
  busy?: boolean;
  run: () => boolean | Promise<boolean>;
};

const capitalize = (s: string, lang: Lang) => s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);

/**
 * Everything worth knowing before you vote: synopsis, genres, people and the
 * trailer, which plays right here so nobody has to leave the room.
 * `action` is the stage's own button (vote, strike), next to "Close".
 */
export function FilmSheet({
  film,
  onClose,
  action,
}: {
  film: Film;
  onClose: () => void;
  action?: SheetAction;
}) {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const extra = useFilmExtra(film, lang);
  const [playing, setPlaying] = useState(false);
  const close = () => ref.current?.close();

  const title = filmTitle(film, lang);
  const subtitle = filmSubtitle(film, lang);
  const catalogued = !!(film.tmdbId && film.mediaType);
  const loading = extra === undefined;
  // The room keeps overviews cut to 700 characters; TMDB's own copy is whole.
  const overview = extra?.overview || filmOverview(film, lang);
  const hero = backdropUrl(film.backdrop, "w780") ?? posterUrl(filmPoster(film, lang), "w342");
  const trailer = extra?.trailer;
  const tmdb = tmdbPageUrl(film, lang);
  const meta = [
    filmMeta(film, t),
    film.rating ? `★ ${formatRating(lang, film.rating)}` : null,
    extra?.runtime ? t.film.runtime(extra.runtime) : null,
    extra?.seasons ? t.film.seasons(extra.seasons) : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  const people = [
    extra?.makers.length ? { label: t.film.makers(film.mediaType === "tv", extra.makers.length), names: extra.makers } : null,
    extra?.cast.length ? { label: t.film.cast, names: extra.cast } : null,
  ].filter((p) => !!p);

  const play = () => {
    setPlaying((p) => !p);
    scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Sheet
      labelledBy={titleId}
      onClose={onClose}
      dialogRef={ref}
      className="w-[min(560px,calc(100%-24px))] max-h-[min(calc(100dvh-72px),880px)] overflow-hidden open:flex open:flex-col"
    >
      {/* Focused on open (tabIndex −1): the reader starts at the top, arrow keys scroll. */}
      <div ref={scroller} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none">
        {(hero || (playing && trailer)) && (
          <div className="relative aspect-video w-full overflow-hidden bg-ink-2">
            {playing && trailer ? (
              <iframe
                src={trailerEmbedUrl(trailer, lang)}
                title={t.film.trailerFrame(title)}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- TMDB already serves sized images */}
                <img
                  src={hero}
                  alt=""
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover ${film.backdrop ? "opacity-80" : "scale-110 opacity-50 blur-2xl"}`}
                />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--color-ink-1),transparent_70%)]" />
                {trailer && (
                  <button
                    type="button"
                    onClick={play}
                    aria-label={t.film.trailerFrame(title)}
                    className="group/play absolute inset-0 grid place-items-center"
                  >
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-ink-0/60 text-cream ring-1 ring-white/25 backdrop-blur-md transition group-hover/play:scale-105 group-hover/play:bg-signal group-hover/play:ring-signal">
                      <svg width="20" height="22" viewBox="0 0 12 14" aria-hidden className="translate-x-[2px]">
                        <path d="M0 0l12 7-12 7z" fill="currentColor" />
                      </svg>
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <div className="px-5 pb-6 pt-4 sm:px-6">
          <div className="flex items-end gap-4">
            <Poster film={film} size="w185" className="w-[72px] shrink-0 shadow-[0_14px_30px_-14px_rgb(0_0_0/0.9)] ring-1 ring-white/10" />
            <div className="min-w-0 pb-0.5">
              <h2 id={titleId} className="display text-[clamp(30px,8.5vw,42px)] [overflow-wrap:anywhere] [text-wrap:balance]">
                {title}
              </h2>
              {subtitle && <p className="mt-1 truncate text-[13.5px] text-muted">{subtitle}</p>}
            </div>
          </div>

          {meta && <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{meta}</p>}

          {loading ? (
            <div className="mt-4 flex gap-1.5" aria-hidden>
              {[64, 86, 52].map((w) => (
                <span key={w} className="h-7 animate-pulse rounded-full bg-ink-3" style={{ width: w }} />
              ))}
            </div>
          ) : (
            !!extra?.genres.length && (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {extra.genres.map((g) => (
                  <li key={g} className="rounded-full border border-line-strong px-2.5 py-1 text-[12.5px] leading-none text-cream/85">
                    {capitalize(g, lang)}
                  </li>
                ))}
              </ul>
            )
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {trailer ? (
              <button type="button" onClick={play} aria-pressed={playing} className={chip("solid")}>
                <TrailerIcon playing={playing} />
                {t.film.trailer}
              </button>
            ) : loading ? (
              <span className={`${chip("solid")} opacity-50`} aria-hidden>
                <TrailerIcon />
                <span className="dots">{t.film.trailer}</span>
              </span>
            ) : (
              <a href={trailerSearchUrl(film)} target="_blank" rel="noreferrer" className={chip("solid")}>
                <TrailerIcon />
                {t.film.trailer}
                <External />
              </a>
            )}
            {tmdb && (
              <a href={tmdb} target="_blank" rel="noreferrer" className={chip("ghost")}>
                TMDB
                <External />
              </a>
            )}
          </div>

          {overview ? (
            <Overview key={overview} text={overview} more={t.result.more} />
          ) : loading ? (
            <div className="mt-5 space-y-2" aria-hidden>
              {["100%", "92%", "60%"].map((w) => (
                <span key={w} className="block h-3.5 animate-pulse rounded bg-ink-3" style={{ width: w }} />
              ))}
            </div>
          ) : (
            <p className="mt-5 text-[14.5px] leading-snug text-muted">{catalogued ? t.film.noOverview : t.film.manual}</p>
          )}

          {people.length > 0 && (
            <dl className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2">
              {people.map((p) => (
                <div key={p.label} className="contents">
                  <dt className="label !text-[10px]">{p.label}</dt>
                  <dd className="text-[14px] leading-snug text-cream/85">{p.names.join(", ")}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-t border-line px-5 py-3 sm:px-6 [&>*]:flex-1">
        <Button variant="ghost" onClick={close}>
          {t.film.close}
        </Button>
        {action && (
          <Button
            variant={action.variant}
            busy={action.busy}
            onClick={async () => {
              if (await action.run()) close();
            }}
          >
            {action.label}
          </Button>
        )}
      </div>
    </Sheet>
  );
}

/** Long synopses fold to five lines so the trailer and the vote stay in reach. */
function Overview({ text, more }: { text: string; more: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 300;
  return (
    <div className="mt-5">
      <p className={`text-[15.5px] leading-relaxed text-cream/85 ${long && !open ? "line-clamp-5" : ""}`}>{text}</p>
      {long && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-amber transition hover:text-cream"
        >
          {more}
        </button>
      )}
    </div>
  );
}

const chip = (tone: "solid" | "ghost") =>
  `inline-flex h-10 items-center gap-2 rounded-md px-3.5 font-display text-[18px] font-bold uppercase leading-none transition ${
    tone === "solid" ? "bg-cream text-ink-0 hover:bg-white" : "border border-line-strong hover:border-cream/50"
  }`;

function TrailerIcon({ playing = false }: { playing?: boolean }) {
  return playing ? (
    <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden>
      <rect width="11" height="12" rx="1.5" fill="currentColor" />
    </svg>
  ) : (
    <svg width="11" height="13" viewBox="0 0 12 14" aria-hidden>
      <path d="M0 0l12 7-12 7z" fill="currentColor" />
    </svg>
  );
}

function External() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden className="opacity-60">
      <path d="M4.5 2H10v5.5M10 2 2.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
