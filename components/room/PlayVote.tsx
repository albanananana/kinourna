"use client";

import { useState } from "react";
import { filmTitle, joinNames } from "@/lib/i18n";
import { useI18n } from "../i18n/I18nProvider";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Accent, ActionBar, Heading, Page } from "./ActionBar";
import { useBusy, useRoomCtx } from "./context";
import { Badge, FilmCard, FilmGrid } from "./FilmCard";
import { BackButton } from "./GoBack";

export function PlayVote() {
  const { state, me, myId, isHost } = useRoomCtx();
  const { busy, go } = useBusy();
  const { t, lang } = useI18n();
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
          kicker={t.vote.kicker}
          title={<Accent parts={t.vote.title} />}
          sub={t.vote.sub(allowOwn)}
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
                badge={mine ? <Badge>{t.room.mine}</Badge> : undefined}
                label={`${filmTitle(film, lang)}${current.has(film.key) ? t.vote.marked : ""}`}
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
                ? t.vote.late
                : pending.length
                  ? t.vote.waiting(joinNames(t, pending))
                  : t.vote.allVoted}
            </span>
          </span>
        }
      >
        {isHost && <BackButton to="board" size={canVote ? "lg" : "md"} />}
        {isHost && pending.length > 0 && (voted || !canVote) && (
          <Button variant="ghost" busy={busy === "close"} onClick={() => go("close", { type: "closeVote" })}>
            {t.vote.close}
          </Button>
        )}
        {canVote && (
          <Button size="lg" busy={busy === "vote"} disabled={voted && !dirty} onClick={submit}>
            {voted && !dirty ? t.vote.accepted : voted ? t.vote.change(current.size) : t.vote.submit(current.size)}
          </Button>
        )}
      </ActionBar>
    </>
  );
}

function sameSet(a: Set<string>, b: Set<string>) {
  return a.size === b.size && [...a].every((k) => b.has(k));
}
