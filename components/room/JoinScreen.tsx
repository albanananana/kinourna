"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { errorOf } from "@/lib/client/errors";
import { loadName, saveName } from "@/lib/client/session";
import { cleanName } from "@/lib/game";
import type { RoomState, Session } from "@/lib/types";
import { useI18n } from "../i18n/I18nProvider";
import { LangSwitch } from "../i18n/LangSwitch";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { SplitFlap } from "../ui/SplitFlap";

export function JoinScreen({
  state,
  session,
  onJoined,
}: {
  state: RoomState;
  session: Session | null;
  onJoined: (session: Session, state: RoomState) => void;
}) {
  const { t } = useI18n();
  // Rendered only on the client (after the room loads), so reading storage here is safe.
  const [name, setName] = useState(loadName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const host = state.players.find((p) => p.id === state.hostId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanName(name);
    if (!clean) return setError(t.join.errName);
    setBusy(true);
    setError(null);
    try {
      saveName(clean);
      const res = await api.join(state.code, clean, session);
      onJoined(res.session, res.state);
    } catch (err) {
      setError(errorOf(t, err));
      setBusy(false);
    }
  };

  const late = state.phase !== "lobby" && state.phase !== "collect";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <div className="mb-12 flex items-center justify-between gap-4">
        <Link href="/" className="display text-[26px]" translate="no">
          {t.brand[0]}
          <span className="text-signal">{t.brand[1]}</span>
        </Link>
        <LangSwitch />
      </div>
      <p className="label text-amber">{t.join.kicker}</p>
      <SplitFlap translate="no" text={state.code} variant="tiles" tileClassName="h-[76px] w-[60px] text-[60px]" className="mt-4" />
      <p className="mt-6 text-[17px] leading-snug text-cream/80">
        {host ? t.join.hostGathers(host.name) : t.join.gathering}
        {late && t.join.late}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {state.players.map((p) => (
          <span key={p.id} className="flex items-center gap-2 rounded-full bg-ink-2 py-1 pl-1 pr-3 text-[14px]">
            <Avatar player={p} size={24} />
            {p.name}
          </span>
        ))}
      </div>

      <form onSubmit={submit} className="mt-10">
        <Field label={t.home.nameLabel} placeholder={t.join.namePlaceholder} name="name" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" />
        <Button size="lg" type="submit" className="mt-3 w-full" busy={busy}>
          {t.join.submit}
        </Button>
        <p role="alert" aria-live="polite" className="mt-3 min-h-5 text-[14px] text-signal-hi">
          {error}
        </p>
      </form>
    </main>
  );
}
