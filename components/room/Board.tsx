"use client";

import { useState, type ReactNode } from "react";
import type { Mode } from "@/lib/types";
import { useI18n } from "../i18n/I18nProvider";
import { Button } from "../ui/Button";
import { Accent, ActionBar, Heading, Page } from "./ActionBar";
import { useBusy, useRoomCtx } from "./context";
import { Badge, FilmCard, FilmGrid } from "./FilmCard";
import { FilmSheet } from "./FilmSheet";
import { BackButton } from "./GoBack";

export const MODES: { id: Mode; icon: ReactNode }[] = [
  {
    id: "urn",
    icon: (
      <svg viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="18" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="13" y="13" width="14" height="8" rx="1.5" fill="currentColor" transform="rotate(-18 20 17)" />
        <path d="M13 37 17 30h6l4 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "vote",
    icon: (
      <svg viewBox="0 0 40 40" aria-hidden>
        <rect x="6" y="8" width="28" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m13 21 5 5 10-11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "strike",
    icon: (
      <svg viewBox="0 0 40 40" aria-hidden>
        <path d="M8 12h24M8 20h24M8 28h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        <path d="M5 33 35 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function Board() {
  const { state, isHost, me } = useRoomCtx();
  const { busy, go } = useBusy();
  const [mode, setMode] = useState<Mode>("urn");
  const [info, setInfo] = useState<string | null>(null);
  const infoFilm = state.board.find((f) => f.key === info);
  const host = state.players.find((p) => p.id === state.hostId);
  const own = new Set(me?.own ?? []);
  const { t } = useI18n();
  const hostName = host?.name ?? t.room.hostFallback;

  return (
    <>
      <Page>
        <Heading
          kicker={t.board.kicker}
          title={<Accent parts={t.board.title(state.board.length)} />}
          sub={t.board.sub}
        />

        <FilmGrid>
          {state.board.map((film, i) => (
            <FilmCard
              key={film.key}
              film={film}
              index={i}
              onInfo={() => setInfo(film.key)}
              badge={
                film.weight > 1 ? (
                  <Badge tone="amber">{t.room.matched(film.weight)}</Badge>
                ) : own.has(film.key) ? (
                  <Badge>{t.room.mine}</Badge>
                ) : undefined
              }
            />
          ))}
        </FilmGrid>
        {infoFilm && <FilmSheet film={infoFilm} onClose={() => setInfo(null)} />}

        <div className="mt-12">
          <p className="label">{isHost ? t.board.howPick : t.board.hostChooses(hostName)}</p>
          <div role={isHost ? "radiogroup" : undefined} aria-label={t.board.modeAria} className="mt-4 grid gap-3 md:grid-cols-3">
            {MODES.map((m) => {
              const active = isHost && m.id === mode;
              const Tag = isHost ? "button" : "div";
              return (
                <Tag
                  key={m.id}
                  type={isHost ? "button" : undefined}
                  role={isHost ? "radio" : undefined}
                  aria-checked={isHost ? active : undefined}
                  onClick={isHost ? () => setMode(m.id) : undefined}
                  className={`group relative flex gap-4 overflow-hidden rounded-xl border p-5 text-left transition ${
                    active
                      ? "border-signal bg-[linear-gradient(140deg,rgb(229_56_44/0.16),transparent_60%)]"
                      : "border-line bg-ink-1/60 " + (isHost ? "hover:border-line-strong" : "")
                  }`}
                >
                  <span className={`mt-1 h-10 w-10 shrink-0 ${active ? "text-signal" : "text-muted"}`}>{m.icon}</span>
                  <span>
                    <span className="display block text-[34px]">{t.modes[m.id].name}</span>
                    <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-amber/90">{t.modes[m.id].pitch}</span>
                    <span className="mt-2 block text-[14px] leading-snug text-muted">{t.modes[m.id].how}</span>
                  </span>
                </Tag>
              );
            })}
          </div>
        </div>
      </Page>

      <ActionBar
        note={
          isHost ? (
            <div role="radiogroup" aria-label={t.board.modeAria} className="flex rounded-md border border-line-strong p-0.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={m.id === mode}
                  onClick={() => setMode(m.id)}
                  className={`h-10 flex-1 rounded-[5px] px-2 font-display text-[17px] font-bold uppercase transition ${
                    m.id === mode ? "bg-cream text-ink-0" : "text-muted hover:text-cream"
                  }`}
                >
                  {t.modes[m.id].name}
                </button>
              ))}
            </div>
          ) : (
            <span className="dots">{t.board.waitChoice(hostName)}</span>
          )
        }
      >
        {isHost && <BackButton to="collect" />}
        {isHost && (
          <Button size="lg" busy={busy === "mode"} onClick={() => go("mode", { type: "startMode", mode })}>
            {t.board.start(t.modes[mode].name)}
          </Button>
        )}
      </ActionBar>
    </>
  );
}
