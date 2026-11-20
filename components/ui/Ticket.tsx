"use client";

import { filmKind, filmSubtitle, filmTitle } from "@/lib/i18n";
import type { Film } from "@/lib/types";
import { useI18n } from "../i18n/I18nProvider";
import { Poster } from "./Poster";

const serialOf = (n: number) => String(n).padStart(3, "0");

/** A paper cinema ticket — the physical slip that goes into the urn. */
export function Ticket({
  film,
  serial,
  onRemove,
  removing,
}: {
  film: Film;
  serial: number;
  onRemove?: () => void;
  removing?: boolean;
}) {
  const { t, lang } = useI18n();
  const title = filmTitle(film, lang);
  return (
    <div className="ticket flex h-[104px] w-full items-stretch">
      <div className="flex w-[78px] shrink-0 items-center justify-center py-2.5 pl-3.5 pr-2">
        <Poster film={film} size="w154" rounded="rounded-[3px]" className="h-full w-auto shadow-[0_2px_6px_rgb(0_0_0/0.25)]" />
      </div>
      <div className="ticket-perf my-2" />
      <div className="flex min-w-0 flex-1 flex-col justify-between py-3 pl-3 pr-5">
        <div className="flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-paper-ink/60">
          <span>{t.ticket.serial(serialOf(serial))}</span>
          <span>{filmKind(film, t)}</span>
        </div>
        <div className="min-w-0">
          <div className="display truncate text-[28px] leading-[0.95] text-paper-ink">{title}</div>
          <div className="truncate font-mono text-[10px] text-paper-ink/60">
            {[filmSubtitle(film, lang), film.year].filter(Boolean).join(" · ") || " "}
          </div>
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={t.ticket.remove(title)}
          className="mr-4 self-center rounded-full p-1.5 text-paper-ink/50 transition hover:bg-paper-ink/10 hover:text-paper-ink disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function EmptyTicket({ serial }: { serial: number }) {
  const { t } = useI18n();
  return (
    <div className="ticket-empty flex h-14 w-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.16em] text-dim lg:h-[104px]">
      {t.ticket.empty(serialOf(serial))}
    </div>
  );
}
