"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Modal confirmation built on the native <dialog>: focus trapping, Esc and the
 * inert page behind it come from the browser. Mount it to open, unmount to
 * close; `onClose` fires on Esc, a tap on the backdrop, or `close()`.
 * Sits at the bottom on phones (thumb zone), centred from `sm` up.
 */
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
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="sheet mx-auto mb-[calc(12px+var(--safe-bottom))] mt-auto w-[min(460px,calc(100%-24px))] max-w-none overflow-visible rounded-xl border border-line-strong bg-ink-1 p-0 text-cream shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] backdrop:bg-ink-0/75 backdrop:backdrop-blur-sm sm:my-auto"
    >
      <div className="px-5 pb-5 pt-6 sm:px-6">
        <h2 id={titleId} className="display text-[clamp(34px,9vw,42px)] [text-wrap:balance]">
          {title}
        </h2>
        {children && <div className="mt-3 text-[15px] leading-snug text-muted">{children}</div>}
        <div className="mt-6 flex flex-wrap gap-2 [&>*]:flex-1">{actions}</div>
      </div>
    </dialog>
  );
}
