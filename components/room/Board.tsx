"use client";

import { useState, type ReactNode } from "react";
import { filmsWord } from "@/lib/ru";
import type { Mode } from "@/lib/types";
import { Button } from "../ui/Button";
import { ActionBar, Heading, Page } from "./ActionBar";
import { useBusy, useRoomCtx } from "./context";
import { Badge, FilmCard, FilmGrid } from "./FilmCard";

export const MODES: { id: Mode; name: string; pitch: string; how: string; icon: ReactNode }[] = [
  {
    id: "urn",
    name: "Урна",
    pitch: "Чистый жребий",
    how: "Тянем один билет. Если фильм загадали двое — у него два билета.",
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
    name: "Голосование",
    pitch: "Что устроит всех",
    how: "Каждый отмечает всё, что готов смотреть. Больше всего голосов — побеждает, ничью решает урна.",
    icon: (
      <svg viewBox="0 0 40 40" aria-hidden>
        <rect x="6" y="8" width="28" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m13 21 5 5 10-11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "strike",
    name: "Вычёркивание",
    pitch: "По кругу, до последнего",
    how: "По очереди каждый убирает один фильм, который точно не хочет. Последний оставшийся — смотрим.",
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
  const host = state.players.find((p) => p.id === state.hostId);
  const own = new Set(me?.own ?? []);
  const selected = MODES.find((m) => m.id === mode)!;

  return (
    <>
      <Page>
        <Heading
          kicker="Урна открыта"
          title={
            <>
              На столе {state.board.length} <span className="text-signal">{filmsWord(state.board.length)}</span>
            </>
          }
          sub="Кто что загадал — узнаете в самом конце."
        />

        <FilmGrid>
          {state.board.map((film, i) => (
            <FilmCard
              key={film.key}
              film={film}
              index={i}
              badge={
                film.weight > 1 ? (
                  <Badge tone="amber">×{film.weight} совпало</Badge>
                ) : own.has(film.key) ? (
                  <Badge>твой</Badge>
                ) : undefined
              }
            />
          ))}
        </FilmGrid>

        <div className="mt-12">
          <p className="label">{isHost ? "Как будем выбирать?" : `${host?.name ?? "Ведущий"} выбирает режим`}</p>
          <div role={isHost ? "radiogroup" : undefined} aria-label="Режим выбора" className="mt-4 grid gap-3 md:grid-cols-3">
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
                    <span className="display block text-[34px]">{m.name}</span>
                    <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-amber/90">{m.pitch}</span>
                    <span className="mt-2 block text-[14px] leading-snug text-muted">{m.how}</span>
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
            <div role="radiogroup" aria-label="Режим" className="flex rounded-md border border-line-strong p-0.5">
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
                  {m.name}
                </button>
              ))}
            </div>
          ) : (
            <span className="dots">Ждём, что выберет {host?.name ?? "ведущий"}</span>
          )
        }
      >
        {isHost && (
          <Button size="lg" busy={busy === "mode"} onClick={() => go("mode", { type: "startMode", mode })}>
            Начать · {selected.name}
          </Button>
        )}
      </ActionBar>
    </>
  );
}
