export const LOCALES = ["ru", "en", "pl"] as const;
export type Lang = (typeof LOCALES)[number];

/** Used when the browser asks for none of our languages. */
export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "lang";

export const LANG_NAMES: Record<Lang, string> = { ru: "Русский", en: "English", pl: "Polski" };

/** TMDB `language` parameter per UI language. */
export const TMDB_LANG: Record<Lang, string> = { ru: "ru-RU", en: "en-US", pl: "pl-PL" };

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Picks the best supported language from an Accept-Language header. */
export function matchAcceptLanguage(header: string | null | undefined): Lang {
  if (!header) return DEFAULT_LANG;
  const ranked = header
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { base: tag.split("-")[0], q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .sort((a, b) => b.q - a.q || a.i - b.i);
  return ranked.map((r) => r.base).find(isLang) ?? DEFAULT_LANG;
}
