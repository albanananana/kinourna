"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { api } from "@/lib/client/api";
import { errorOf } from "@/lib/client/errors";
import { loadName, loadSession, saveName, saveSession } from "@/lib/client/session";
import { CODE_LENGTH, cleanName, isValidCode, normalizeCode } from "@/lib/game";
import { Button } from "../ui/Button";
import { useI18n } from "../i18n/I18nProvider";
import { Field } from "../ui/Field";

const noopSubscribe = () => () => {};

export function HomeActions() {
  const router = useRouter();
  const { t } = useI18n();
  // The remembered name only exists in the browser; null = "not typed yet".
  const storedName = useSyncExternalStore(noopSubscribe, loadName, () => "");
  const [typed, setName] = useState<string | null>(null);
  const name = typed ?? storedName;
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needName = () => {
    const clean = cleanName(name);
    if (!clean) {
      setError(t.home.errName);
      document.getElementById("home-name")?.focus();
      return null;
    }
    saveName(clean);
    return clean;
  };

  const create = async () => {
    setError(null);
    const clean = needName();
    if (!clean) return;
    setBusy("create");
    try {
      const { state, session } = await api.create(clean);
      saveSession(state.code, session);
      router.push(`/r/${state.code}`);
    } catch (err) {
      setError(errorOf(t, err));
      setBusy(null);
    }
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalized = normalizeCode(code);
    if (!isValidCode(normalized)) {
      setError(t.home.errCode);
      return;
    }
    const clean = needName();
    if (!clean) return;
    setBusy("join");
    try {
      const { session } = await api.join(normalized, clean, loadSession(normalized));
      saveSession(normalized, session);
      router.push(`/r/${normalized}`);
    } catch (err) {
      setError(errorOf(t, err));
      setBusy(null);
    }
  };

  return (
    <div className="mt-9 w-full max-w-[420px]">
      <Field
        id="home-name"
        label={t.home.nameLabel}
        placeholder={t.home.namePlaceholder}
        name="name"
        autoComplete="nickname"
        maxLength={20}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
      />
      <Button size="lg" className="mt-3 w-full" onClick={create} busy={busy === "create"} disabled={busy === "join"}>
        {t.home.create}
      </Button>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="label">{t.home.orCode}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={join} className="flex gap-2">
        <label className="sr-only" htmlFor="home-code">
          {t.home.codeLabel}
        </label>
        <input
          id="home-code"
          value={code}
          onChange={(e) => setCode(normalizeCode(e.target.value))}
          placeholder="K7QM"
          name="code"
          translate="no"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={CODE_LENGTH}
          className="h-12 w-0 flex-1 rounded-md border border-line-strong bg-ink-1/80 px-4 text-center font-display text-[30px] font-extrabold uppercase tracking-[0.35em] text-cream placeholder:text-dim/60 focus:border-amber/70 focus:outline-none"
        />
        <Button variant="ghost" type="submit" busy={busy === "join"} disabled={busy === "create"} className="w-[120px]">
          {t.home.join}
        </Button>
      </form>

      <p role="alert" aria-live="polite" className="mt-3 min-h-5 text-[14px] text-signal-hi">
        {error}
      </p>
    </div>
  );
}
