import "server-only";
import { cacheLife } from "next/cache";
import { normalizeTitle } from "../game";
import type { Film, MediaType } from "../types";
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

type TmdbPage = { results: TmdbItem[] };

function toFilm(item: TmdbItem, type: MediaType, en?: TmdbItem): Film {
  const title = (type === "movie" ? item.title : item.name) || item.original_title || item.original_name || "Без названия";
  const original = type === "movie" ? item.original_title : item.original_name;
  const enTitle = en ? (type === "movie" ? en.title : en.name) : undefined;
  const date = type === "movie" ? item.release_date : item.first_air_date;
  return {
    key: `${type}:${item.id}`,
    tmdbId: item.id,
    mediaType: type,
    title,
    enTitle: enTitle && enTitle !== title ? enTitle : undefined,
    originalTitle: original && original !== title && original !== enTitle ? original : undefined,
    year: date?.slice(0, 4) || undefined,
    poster: item.poster_path ?? undefined,
    backdrop: item.backdrop_path ?? undefined,
    overview: item.overview?.trim() || en?.overview?.trim() || undefined,
    // A 10.0 from two votes is noise — only show ratings with some weight behind them.
    rating: item.vote_average && (item.vote_count ?? 0) >= 20 ? Math.round(item.vote_average * 10) / 10 : undefined,
    animation: item.genre_ids?.includes(ANIMATION_GENRE) || undefined,
  };
}

const isTitle = (item: TmdbItem): item is TmdbItem & { media_type: MediaType } =>
  item.media_type === "movie" || item.media_type === "tv";

async function searchTmdb(query: string): Promise<Film[]> {
  "use cache";
  cacheLife("hours");
  const params = { query, include_adult: "false", page: "1" };
  const [ru, en] = await Promise.all([
    tmdb<TmdbPage>("/search/multi", { ...params, language: "ru-RU" }),
    tmdb<TmdbPage>("/search/multi", { ...params, language: "en-US" }).catch(() => ({ results: [] }) as TmdbPage),
  ]);
  const enByKey = new Map(en.results.filter(isTitle).map((i) => [`${i.media_type}:${i.id}`, i]));
  return ru.results
    .filter(isTitle)
    .map((i) => toFilm(i, i.media_type, enByKey.get(`${i.media_type}:${i.id}`)))
    .slice(0, 14);
}

async function trendingTmdb(): Promise<Film[]> {
  "use cache";
  cacheLife("days");
  const page = await tmdb<TmdbPage>("/trending/all/week", { language: "ru-RU" });
  return page.results.filter(isTitle).map((i) => toFilm(i, i.media_type));
}

export async function searchTitles(raw: string): Promise<{ results: Film[]; demo: boolean }> {
  const query = raw.trim().slice(0, 80);
  if (query.length < 2) return { results: [], demo: !tmdbEnabled() };
  if (!tmdbEnabled()) {
    const q = normalizeTitle(query);
    const results = MOCK_FILMS.filter((f) =>
      [f.title, f.enTitle].some((t) => t && normalizeTitle(t).includes(q)),
    );
    return { results, demo: true };
  }
  return { results: await searchTmdb(query), demo: false };
}

export async function trendingTitles(): Promise<Film[]> {
  if (!tmdbEnabled()) return MOCK_FILMS;
  try {
    const list = await trendingTmdb();
    return list.length >= 8 ? list : MOCK_FILMS;
  } catch {
    return MOCK_FILMS;
  }
}
