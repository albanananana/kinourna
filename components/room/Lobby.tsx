"use client";

import { MAX_PER_PLAYER } from "@/lib/game";
import { useI18n } from "../i18n/I18nProvider";
import { Avatar } from "../ui/Avatar";
import { Bulbs } from "../ui/Bulbs";
import { Button } from "../ui/Button";
import { SplitFlap } from "../ui/SplitFlap";
import { ActionBar, Page } from "./ActionBar";
import { useBusy, useRoomCtx, useTwoStep } from "./context";
import { shareRoom } from "./RoomHeader";

export function Lobby() {
  const { state, isHost, myId, notify } = useRoomCtx();
  const { busy, go } = useBusy();
  const { armed, confirm } = useTwoStep();
  const { t } = useI18n();
  const host = state.players.find((p) => p.id === state.hostId);
  const { perPlayer, allowOwn } = state.settings;

  return (
    <>
      <Page>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-16">
          {/* Marquee with the room code */}
          <div>
            <p className="label text-amber">{t.lobby.codeKicker}</p>
            <div className="mt-4 w-fit rounded-xl border border-line bg-ink-1/70 px-5 py-4 shadow-[0_30px_80px_-40px_rgb(229_56_44/0.5)]">
              <Bulbs count={14} />
              <SplitFlap
                translate="no"
                text={state.code}
                variant="tiles"
                className="my-4"
                tileClassName="h-[clamp(78px,22vw,112px)] w-[clamp(60px,17vw,86px)] text-[clamp(64px,18vw,96px)]"
              />
              <Bulbs count={14} />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="ghost" onClick={() => shareRoom(state.code, notify, t)}>
                {t.lobby.invite}
              </Button>
              <span className="text-[14px] text-muted">{t.lobby.orSay}</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <p className="label">{t.lobby.inRoom(state.players.length)}</p>
            </div>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {state.players.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <Avatar player={p} size={36} />
                  <span className="min-w-0 flex-1 truncate text-[16px]">
                    {p.name}
                    {p.id === myId && <span className="text-dim">{t.room.you}</span>}
                  </span>
                  {p.id === state.hostId && <span className="label text-amber">{t.room.hostLabel}</span>}
                  {isHost && p.id !== myId && (
                    <button
                      type="button"
                      className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition hover:bg-white/5 ${
                        armed === p.id ? "bg-signal/15 text-signal-hi" : "text-dim hover:text-signal-hi"
                      }`}
                      onClick={() => confirm(p.id, () => go(`kick-${p.id}`, { type: "kick", playerId: p.id }))}
                      aria-label={armed === p.id ? t.lobby.kickConfirm(p.name) : t.lobby.kickLabel(p.name)}
                    >
                      {armed === p.id ? t.lobby.sure : t.lobby.kick}
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <p className="label">{t.lobby.perPlayer}</p>
              {isHost ? (
                <div role="radiogroup" aria-label={t.lobby.perPlayerAria} className="mt-3 grid grid-cols-5 gap-2">
                  {Array.from({ length: MAX_PER_PLAYER }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={n === perPlayer}
                      onClick={() => n !== perPlayer && go("per", { type: "settings", settings: { perPlayer: n } })}
                      className={`h-14 rounded-md font-display text-[32px] font-extrabold transition ${
                        n === perPlayer ? "bg-cream text-ink-0" : "border border-line-strong text-muted hover:text-cream"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[16px]">
                  {t.lobby.perPlayerValue(perPlayer)}
                </p>
              )}

              <label className={`mt-6 flex items-start gap-3 ${isHost ? "cursor-pointer" : ""}`}>
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={allowOwn}
                  disabled={!isHost}
                  onChange={(e) => go("own", { type: "settings", settings: { allowOwn: e.target.checked } })}
                />
                <span
                  aria-hidden
                  className="mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full bg-ink-3 p-0.5 transition peer-checked:bg-amber peer-focus-visible:outline-2 peer-focus-visible:outline-amber [&>span]:transition peer-checked:[&>span]:translate-x-4"
                >
                  <span className="h-5 w-5 rounded-full bg-cream shadow" />
                </span>
                <span className="text-[14px] leading-snug text-muted">
                  <span className="text-cream">{t.lobby.allowOwn}</span>
                  <br />
                  {t.lobby.allowOwnHint}
                </span>
              </label>
            </div>
          </div>
        </div>
      </Page>

      <ActionBar
        note={
          isHost
            ? state.players.length < 2
              ? t.lobby.aloneNote
              : t.lobby.readyNote
            : (
                <span className="dots">{t.lobby.waitHost(host?.name ?? t.room.hostFallback)}</span>
              )
        }
      >
        {isHost && (
          <Button size="lg" busy={busy === "start"} onClick={() => go("start", { type: "startCollect" })}>
            {t.lobby.start}
          </Button>
        )}
      </ActionBar>
    </>
  );
}
