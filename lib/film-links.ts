import { TMDB_LANG, type Lang } from "./i18n/config";
import type { Film } from "./types";

/** YouTube search for the trailer — works for any title, even hand-typed ones. */
export function trailerSearchUrl(film: Film): string {
  const name = film.t?.en?.title ?? film.originalTitle ?? film.title;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} ${film.year ?? ""} trailer`)}`;
}

/** The title's TMDB page in the viewer's language; none for hand-typed titles. */
export function tmdbPageUrl(film: Film, lang: Lang): string | undefined {
  return film.tmdbId && film.mediaType ? `https://www.themoviedb.org/${film.mediaType}/${film.tmdbId}?language=${TMDB_LANG[lang]}` : undefined;
}

/** Privacy-enhanced YouTube player that starts on open and stays inline on iPhones. */
export function trailerEmbedUrl(videoId: string, lang: Lang): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&rel=0&hl=${lang}`;
}
