"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LANG_COOKIE, getDict, type Dict, type Lang } from "@/lib/i18n";

type I18n = { lang: Lang; t: Dict; setLang: (lang: Lang) => void };

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ lang: initial, children }: { lang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState(initial);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback(
    (next: Lang) => {
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      setLangState(next);
      // Server-rendered bits (home hero, page title) pick the cookie up on refresh.
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ lang, t: getDict(lang), setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n outside I18nProvider");
  return ctx;
}
