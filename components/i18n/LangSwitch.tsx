"use client";

import { LANG_NAMES, LOCALES } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

/**
 * `segmented` — RU · EN · PL buttons (home, join screen).
 * `compact` — the current code over a native <select>, so phones get their own picker.
 */
export function LangSwitch({ variant = "segmented", className = "" }: { variant?: "segmented" | "compact"; className?: string }) {
  const { lang, setLang, t } = useI18n();

  if (variant === "compact") {
    return (
      <label className={`relative flex h-8 items-center rounded-md border border-line-strong bg-ink-2 px-2 transition hover:border-cream/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-amber ${className}`}>
        <span aria-hidden translate="no" className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-cream">
          {lang}
        </span>
        <select
          aria-label={t.langLabel}
          value={lang}
          onChange={(e) => setLang(e.target.value as typeof lang)}
          className="absolute inset-0 cursor-pointer appearance-none bg-ink-2 text-cream opacity-0"
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {LANG_NAMES[l]}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div role="radiogroup" aria-label={t.langLabel} className={`flex items-center gap-0.5 ${className}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={l === lang}
          aria-label={LANG_NAMES[l]}
          translate="no"
          onClick={() => l !== lang && setLang(l)}
          className={`h-7 rounded px-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] transition ${
            l === lang ? "bg-cream text-ink-0" : "text-muted hover:text-cream"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
