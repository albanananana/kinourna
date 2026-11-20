"use client";

import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { Phase } from "@/lib/types";
import { useI18n } from "../i18n/I18nProvider";
import { LangSwitch } from "../i18n/LangSwitch";
import { Avatar } from "../ui/Avatar";
import { useRoomCtx } from "./context";

const RAIL: Phase[] = ["lobby", "collect", "board", "play", "result"];

export async function shareRoom(code: string, notify: (m: string) => void, t: Dict) {
  const url = `${window.location.origin}/r/${code}`;
  const data = { title: t.brand.join(""), text: t.room.shareText(code), url };
  try {
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      await navigator.share(data);
      return;
    }
    await navigator.clipboard.writeText(url);
    notify(t.room.linkCopied);
  } catch (err) {
    if ((err as Error).name !== "AbortError") notify(t.room.codeIs(code));
  }
}

export function RoomHeader() {
  const { state, notify, myId } = useRoomCtx();
  const { t } = useI18n();
  const current = RAIL.indexOf(state.phase);
  // Three faces fit next to the language and code chips on a phone.
  const visible = state.players.slice(0, 3);
  const extra = state.players.length - visible.length;
  const [brandA, brandB] = t.brand;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink-0/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-3 md:px-8">
        <Link href="/" className="display text-[24px] leading-none" aria-label={t.room.toHome} translate="no">
          {brandA}
          <span className="text-signal">{brandB}</span>
        </Link>
        {state.round > 1 && <span className="label hidden sm:inline">{t.room.round(state.round)}</span>}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="flex -space-x-2" aria-label={t.room.inRoom(state.players.map((p) => p.name).join(", "))}>
            {visible.map((p) => (
              <Avatar key={p.id} player={p} size={28} ring={p.id === myId} />
            ))}
            {extra > 0 && (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-3 font-mono text-[10px] text-muted">+{extra}</span>
            )}
          </div>
          <LangSwitch variant="compact" />
          <button
            type="button"
            onClick={() => shareRoom(state.code, notify, t)}
            className="flex h-8 items-center gap-2 rounded-md border border-line-strong bg-ink-2 pl-2.5 pr-2 transition hover:border-cream/40"
            aria-label={t.room.shareLabel(state.code)}
          >
            <span translate="no" className="font-display text-[19px] font-extrabold tracking-[0.18em]">
              {state.code}
            </span>
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden className="text-muted">
              <path d="M8 2v8M4.5 5.5 8 2l3.5 3.5M3 9.5V13h10V9.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <nav aria-label={t.room.stages} className="mx-auto flex max-w-6xl gap-0 overflow-x-auto px-4 pb-2 md:px-8 scrollbar-none">
        {RAIL.map((phase, i) => (
          <span
            key={phase}
            aria-current={i === current ? "step" : undefined}
            className={`flex shrink-0 items-center font-mono text-[9.5px] uppercase tracking-[0.14em] ${
              i === current ? "text-amber" : i < current ? "text-muted" : "text-dim"
            }`}
          >
            {i > 0 && <span className={`mx-2 h-px w-4 ${i <= current ? "bg-muted/50" : "bg-line-strong"}`} />}
            {t.room.rail[phase]}
          </span>
        ))}
      </nav>
    </header>
  );
}
