"use client";

import { useId, type ReactNode } from "react";
import { Sheet } from "./Sheet";

/** Modal confirmation: a title, a few lines, and the choices. See `Sheet` for open/close. */
export function Dialog({
  title,
  children,
  actions,
  onClose,
}: {
  title: ReactNode;
  children?: ReactNode;
  /** Put the safe choice first: the browser focuses it on open. */
  actions: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();

  return (
    <Sheet labelledBy={titleId} onClose={onClose} className="w-[min(460px,calc(100%-24px))] overflow-visible">
      <div className="px-5 pb-5 pt-6 sm:px-6">
        <h2 id={titleId} className="display text-[clamp(34px,9vw,42px)] [text-wrap:balance]">
          {title}
        </h2>
        {children && <div className="mt-3 text-[15px] leading-snug text-muted">{children}</div>}
        <div className="mt-6 flex flex-wrap gap-2 [&>*]:flex-1">{actions}</div>
      </div>
    </Sheet>
  );
}
