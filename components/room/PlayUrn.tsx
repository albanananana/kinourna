"use client";

import { plural } from "@/lib/ru";
import { Button } from "../ui/Button";
import { Poster } from "../ui/Poster";
import { ActionBar, Page } from "./ActionBar";
import { useBusy, useRoomCtx } from "./context";
import { Drum } from "./Drum";

export function PlayUrn() {
  const { state, isHost } = useRoomCtx();
  const { busy, go } = useBusy();
  const excluded = state.play?.kind === "urn" ? state.play.excluded : [];
  const pool = state.board.filter((f) => !excluded.includes(f.key));
  const tickets = pool.reduce((sum, f) => sum + f.weight, 0);
  const drawing = busy === "draw";

  return (
    <>
      <Page className="flex flex-col items-center text-center">
        <p className="label text-amber">Режим · урна</p>
        <h1 className="display mt-2 text-[clamp(52px,13vw,96px)]">Кто тянет?</h1>
        <p className="mt-3 max-w-[40ch] text-[15px] text-muted">
          Тянуть может любой. В барабане {tickets} {plural(tickets, ["билет", "билета", "билетов"])}
          {pool.some((f) => f.weight > 1) && " — совпавшие фильмы лежат в нескольких экземплярах"}.
        </p>

        <div className="relative mt-8">
          <div className="absolute inset-x-0 top-[38%] -z-10 mx-auto h-48 w-48 rounded-full bg-signal/25 blur-[70px]" />
          <Drum tickets={tickets} speed={drawing ? "fast" : "idle"} size={250} />
        </div>

        <Button size="lg" className="mt-8 min-w-[260px]" busy={drawing} onClick={() => go("draw", { type: "draw" })}>
          Тянуть билет
        </Button>

        <div className="mt-12 flex max-w-full gap-2 overflow-x-auto px-1 pb-2 scrollbar-none">
          {pool.map((film) => (
            <Poster key={film.key} film={film} size="w92" rounded="rounded" className="w-11 shrink-0 opacity-50" />
          ))}
        </div>
      </Page>

      {isHost && (
        <ActionBar note="Передумали? Можно выбрать другой способ.">
          <Button variant="ghost" busy={busy === "back"} onClick={() => go("back", { type: "backToBoard" })}>
            Другой режим
          </Button>
        </ActionBar>
      )}
    </>
  );
}
