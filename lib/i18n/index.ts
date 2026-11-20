import type { Film } from "../types";
import type { Lang } from "./config";
import { en } from "./dict/en";
import { pl } from "./dict/pl";
import { ru, type Dict, type ErrorCode } from "./dict/ru";

export type { Dict, ErrorCode, Parts } from "./dict/ru";
export * from "./config";

const DICTS: Record<Lang, Dict> = { ru, en, pl };

export function getDict(lang: Lang): Dict {
  return DICTS[lang];
}

/** "Аня", "Аня и Боря", "Аня, Боря и Вика" — with the language's own "and". */
export function joinNames(t: Dict, names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} ${t.and} ${names[names.length - 1]}`;
}

export function errorText(t: Dict, code: string, params?: Record<string, string | number>): string {
  const template = (t.errors as Record<string, string>)[code] ?? t.errors.generic;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(params?.[k] ?? ""));
}

export function isErrorCode(code: string): code is ErrorCode {
  return code in ru.errors;
}

const ratingFormats = new Map<Lang, Intl.NumberFormat>();
/** 7.9 in English, 7,9 in Russian and Polish. */
export function formatRating(lang: Lang, value: number): string {
  let f = ratingFormats.get(lang);
  if (!f) {
    f = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    ratingFormats.set(lang, f);
  }
  return f.format(value);
}

/* ---- Film text in the viewer's language: own language → English → whatever it was added with. ---- */

export function filmTitle(film: Pick<Film, "title" | "t">, lang: Lang): string {
  return film.t?.[lang]?.title || film.t?.en?.title || film.title;
}

/** Poster with text in the viewer's language when TMDB has one. */
export function filmPoster(film: Pick<Film, "poster" | "t">, lang: Lang): string | undefined {
  return film.t?.[lang]?.poster || film.t?.en?.poster || film.poster;
}

export function filmOverview(film: Pick<Film, "overview" | "t">, lang: Lang): string | undefined {
  return film.t?.[lang]?.overview || film.t?.en?.overview || film.overview;
}

/** Secondary title line: the English title for ru/pl viewers, the original for English viewers. */
export function filmSubtitle(film: Film, lang: Lang): string | undefined {
  const main = filmTitle(film, lang);
  const candidates = lang === "en" ? [film.originalTitle] : [film.t?.en?.title, film.originalTitle];
  return candidates.find((c) => c && c.toLowerCase() !== main.toLowerCase());
}

export function filmKind(film: Film, t: Dict): string {
  if (film.animation) return t.ticket.kind.animation;
  if (film.mediaType === "tv") return t.ticket.kind.tv;
  if (film.mediaType === "movie") return t.ticket.kind.movie;
  return t.ticket.kind.manual;
}

/** "2019 · сериал" — kind only when it's not a plain film. */
export function filmMeta(film: Film, t: Dict): string {
  const kind = film.animation ? t.ticket.kind.animation : film.mediaType === "tv" ? t.ticket.kind.tv : undefined;
  return [film.year, kind].filter(Boolean).join(" · ");
}
