"use client";

import { useState } from "react";
import { joinNames } from "@/lib/ru";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { ActionBar, Heading, Page } from "./ActionBar";
import { useBusy, useRoomCtx } from "./context";
import { Badge, FilmCard, FilmGrid } from "./FilmCard";

export function PlayVote() {
  const { state, me, myId, isHost } = useRoomCtx();
  const { busy, go } = useBusy();
  const play = state.play?.kind === "vote" ? state.play : null;
  const own = new Set(me?.own ?? []);
  const allowOwn = state.settings.allowOwn;
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const current = picked ?? new Set(me?.vote ?? []);
  const voted = !!play?.voted.includes(myId);
  const canVote = !!play?.voters.includes(myId);
  const dirty = picked !== null && (!voted || !sameSet(picked, new Set(me?.vote ?? [])));
  const pending = (play?.voters ?? []).filter((id) => !play?.voted.includes(id)).map((id) => state.players.find((p) => p.id === id)?.name ?? "?");

  const toggle = (key: string) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setPicked(next);
  };

  const submit = async () => {
    const ok = await go("vote", { type: "vote", keys: [...current] });
    if (ok) setPicked(null);
  };

  return (
    <>
      <Page>
        <Heading
          kicker="Режим · голосование"
          title={
            <>
              Что <span className="text-signal">готов</span> смотреть?
            </>
          }
          sub={`Отмечай сколько угодно — хоть всё. ${allowOwn ? "За свои тоже можно." : "Свои билеты отметить нельзя."} Голоса тайные.`}
        />
        <FilmGrid>
          {state.board.map((film, i) => {
            const mine = own.has(film.key);
            const blocked = mine && !allowOwn;
            return (
              <FilmCard
                key={film.key}
                film={film}
                index={i}
                state={blocked ? "disabled" : current.has(film.key) ? "selected" : "idle"}
                onClick={canVote && !blocked ? () => toggle(film.key) : undefined}
                badge={mine ? <Badge>твой</Badge> : undefined}
                label={`${film.title}${current.has(film.key) ? " — отмечен" : ""}`}
              />
            );
          })}
        </FilmGrid>
      </Page>

      <ActionBar
        note={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex -space-x-1.5">
              {(play?.voters ?? []).map((id) => {
                const p = state.players.find((x) => x.id === id);
                return p ? <Avatar key={id} player={p} size={24} dim={!play?.voted.includes(id)} /> : null;
              })}
            </span>
            <span>
              {!canVote
                ? "Голосование началось до твоего прихода — смотрим, чем кончится."
                : pending.length
                  ? `Ждём: ${joinNames(pending)}`
                  : "Все проголосовали"}
            </span>
          </span>
        }
      >
        {isHost && pending.length > 0 && (voted || !canVote) && (
          <Button variant="ghost" busy={busy === "close"} onClick={() => go("close", { type: "closeVote" })}>
            Подвести итог
          </Button>
        )}
        {canVote && (
          <Button size="lg" busy={busy === "vote"} disabled={voted && !dirty} onClick={submit}>
            {voted && !dirty ? "Голос принят" : voted ? `Изменить · ${current.size}` : `Голосую · ${current.size}`}
          </Button>
        )}
      </ActionBar>
    </>
  );
}

function sameSet(a: Set<string>, b: Set<string>) {
  return a.size === b.size && [...a].every((k) => b.has(k));
}
