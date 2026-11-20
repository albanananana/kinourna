"use client";

import type { BackTarget } from "@/lib/types";
import { useI18n } from "../i18n/I18nProvider";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { useBusy, useRoomCtx } from "./context";

/** Host's "step back" button for the action bar: an arrow on phones, arrow + word from `sm`. */
export function BackButton({ to, size = "lg" }: { to: BackTarget; size?: "md" | "lg" }) {
  const { askBack } = useRoomCtx();
  const { t } = useI18n();
  const label = t.room.backTo(t.room.rail[to]);
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => askBack(to)}
      aria-label={label}
      title={label}
      className="aspect-square flex-none! px-0! sm:aspect-auto sm:px-5!"
    >
      <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden className="shrink-0">
        <path d="M16 10H4m5-5-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="hidden sm:inline">{t.room.back}</span>
    </Button>
  );
}

/** Confirms a step back — it moves everyone's screen, and may throw away votes or the result. */
export function BackDialog({ to, onClose }: { to: BackTarget; onClose: () => void }) {
  const { state } = useRoomCtx();
  const { busy, go } = useBusy();
  const { t } = useI18n();
  const lose =
    state.phase === "result"
      ? t.goBack.lose.result
      : state.phase === "play" && state.play?.kind === "vote"
        ? t.goBack.lose.vote
        : state.phase === "play" && state.play?.kind === "strike"
          ? t.goBack.lose.strike
          : null;

  const confirm = async () => {
    await go("back", { type: "back", to });
    // Close either way: an error toast would be hidden behind the open dialog.
    onClose();
  };

  return (
    <Dialog
      title={t.goBack.title(t.room.rail[to])}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.goBack.cancel}
          </Button>
          <Button busy={busy === "back"} onClick={confirm}>
            {t.goBack.confirm}
          </Button>
        </>
      }
    >
      <p>{t.goBack.text[to]}</p>
      {lose && <p className="mt-2 text-amber/90">{lose}</p>}
    </Dialog>
  );
}
