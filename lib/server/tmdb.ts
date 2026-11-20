import "server-only";
import { cacheLife } from "next/cache";
import { normalizeTitle } from "../game";
import { LOCALES, TMDB_LANG, type Lang } from "../i18n/config";
import type { Film, Loc, MediaType } from "../types";
import { MOCK_FILMS } from "./mock-films";

const API = "https://api.themoviedb.org/3";
const ANIMATION_GENRE = 16;

/** Accepts either the short v3 "API Key" or the long v4 "Read Access Token". */
function credentials(): { header?: string; param?: string } | null {
  const key = process.env.TMDB_API_KEY?.trim();
  if (!key) return null;
  return key.startsWith("eyJ") ? { header: `Bearer ${key}` } : { param: key };
}

export function tmdbEnabled(): boolean {
  return credentials() !== null;
}

async function tmdb<T>(path: string, params: Record<string, string>): Promise<T> {
  const creds = credentials();
  if (!creds) throw new Error("TMDB is not configured");
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (creds.param) url.searchParams.set("api_key", creds.param);
  const res = await fetch(url, {
    headers: { accept: "application/json", ...(creds.header ? { authorization: creds.header } : {}) },
  });
  if (!res.ok) throw new Error(`TMDB ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

type TmdbItem = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
};

type TmdbImage = { file_path: string; iso_639_1: string | null; vote_average?: number; vote_count?: number };

type TmdbDetails = TmdbItem & {
  genres?: { id: number }[];
  images?: { posters?: TmdbImage[] };
  translations?: {
    translations: { iso_639_1: string; iso_3166_1: string; data?: { title?: string; name?: string; overview?: string } }[];
  };
};

type TmdbPage = { results: TmdbItem[] };

const titleOf = (item: { title?: string; name?: string }) => (item.title || item.name || "").trim();

function loc(item: TmdbItem | undefined): Loc | undefined {
  if (!item) return undefined;
  const title = titleOf(item) || undefined;
  const overview = item.overview?.trim() || undefined;
  const poster = item.poster_path || undefined;
  return title || overview || poster ? { title, overview, poster } : undefined;
}

/** The best-rated poster with text in `lang`, if TMDB has one. */
function bestPoster(posters: TmdbImage[] | undefined, lang: Lang): string | undefined {
  return posters
    ?.filter((p) => p.iso_639_1 === lang)
    .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0) || (b.vote_count ?? 0) - (a.vote_count ?? 0))[0]?.file_path;
}

function toFilm(item: TmdbItem, type: MediaType, locs: Partial<Record<Lang, TmdbItem>>): Film {
  const original = (type === "movie" ? item.original_title : item.original_name)?.trim();
  const date = type === "movie" ? item.release_date : item.first_air_date;
  const t: Film["t"] = {};
  for (const [lang, source] of Object.entries(locs) as [Lang, TmdbItem][]) {
    const l = loc(source);
    if (l) t[lang] = l;
  }
  return {
    key: `${type}:${item.id}`,
    tmdbId: item.id,
    mediaType: type,
    title: titleOf(item) || original || "?",
    t,
    originalTitle: original || undefined,
    year: date?.slice(0, 4) || undefined,
    poster: item.poster_path ?? undefined,
    backdrop: item.backdrop_path ?? undefined,
    overview: item.overview?.trim() || undefined,
    // A 10.0 from two votes is noise — only show ratings with some weight behind them.
    rating: item.vote_average && (item.vote_count ?? 0) >= 20 ? Math.round(item.vote_average * 10) / 10 : undefined,
    animation: item.genre_ids?.includes(ANIMATION_GENRE) || undefined,
  };
}

const isTitle = (item: TmdbItem): item is TmdbItem & { media_type: MediaType } =>
  item.media_type === "movie" || item.media_type === "tv";

/** Searches in the viewer's language, plus English for the secondary title. */
async function searchTmdb(query: string, lang: Lang): Promise<Film[]> {
  "use cache";
  cacheLife("hours");
  const params = { query, include_adult: "false", page: "1" };
  const [main, en] = await Promise.all([
    tmdb<TmdbPage>("/search/multi", { ...params, language: TMDB_LANG[lang] }),
    lang === "en"
      ? Promise.resolve(null)
      : tmdb<TmdbPage>("/search/multi", { ...params, language: TMDB_LANG.en }).catch(() => null),
  ]);
  const enByKey = new Map((en ?? main).results.filter(isTitle).map((i) => [`${i.media_type}:${i.id}`, i]));
  return main.results
    .filter(isTitle)
    .map((i) => toFilm(i, i.media_type, { [lang]: i, en: enByKey.get(`${i.media_type}:${i.id}`) }))
    .slice(0, 14);
}

/**
 * Full record for one title with names and overviews in every UI language,
 * so a shared room can show each player their own. Cached for a day.
 */
async function detailsTmdb(type: MediaType, id: number): Promise<Film> {
  "use cache";
  cacheLife("days");
  const d = await tmdb<TmdbDetails>(`/${type}/${id}`, {
    language: TMDB_LANG.en,
    append_to_response: "translations,images",
    include_image_language: [...LOCALES, "null"].join(","),
  });
  const film = toFilm({ ...d, genre_ids: d.genres?.map((g) => g.id) }, type, { en: d });
  const all = d.translations?.translations ?? [];
  for (const lang of LOCALES) {
    const poster = bestPoster(d.images?.posters, lang);
    if (lang === "en") {
      if (poster) film.t = { ...film.t, en: { ...film.t?.en, poster } };
      continue;
    }
    const country = TMDB_LANG[lang].split("-")[1];
    const candidates = all.filter((tr) => tr.iso_639_1 === lang);
    const best = candidates.find((tr) => tr.iso_3166_1 === country) ?? candidates[0];
    const text = best?.data ? loc({ id, title: best.data.title, name: best.data.name, overview: best.data.overview }) : undefined;
    const l: Loc = { ...text, ...(poster ? { poster } : {}) };
    if (l.title || l.overview || l.poster) film.t = { ...film.t, [lang]: l };
  }
  return film;
}

export async function localizedDetails(type: MediaType, id: number): Promise<Film | null> {
  if (!tmdbEnabled()) return null;
  try {
    return await detailsTmdb(type, id);
  } catch {
    return null;
  }
}

async function trendingTmdb(lang: Lang): Promise<Film[]> {
  "use cache";
  cacheLife("days");
  const page = await tmdb<TmdbPage>("/trending/all/week", { language: TMDB_LANG[lang] });
  return page.results.filter(isTitle).map((i) => toFilm(i, i.media_type, { [lang]: i }));
}

export async function searchTitles(raw: string, lang: Lang): Promise<{ results: Film[]; demo: boolean }> {
  const query = raw.trim().slice(0, 80);
  if (query.length < 2) return { results: [], demo: !tmdbEnabled() };
  if (!tmdbEnabled()) {
    const q = normalizeTitle(query);
    const results = MOCK_FILMS.filter((f) =>
      [f.title, ...Object.values(f.t ?? {}).map((l) => l?.title)].some((t) => t && normalizeTitle(t).includes(q)),
    );
    return { results, demo: true };
  }
  return { results: await searchTmdb(query, lang), demo: false };
}

export async function trendingTitles(lang: Lang): Promise<Film[]> {
  if (!tmdbEnabled()) return MOCK_FILMS;
  try {
    const list = await trendingTmdb(lang);
    return list.length >= 8 ? list : MOCK_FILMS;
  } catch {
    return MOCK_FILMS;
  }
}
