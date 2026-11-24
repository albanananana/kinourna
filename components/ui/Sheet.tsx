"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

/**
 * Modal panel built on the native <dialog>: focus trapping, Esc and the inert
 * page behind it come from the browser. Mount it to open, unmount to close;
 * `onClose` fires on Esc, a tap on the backdrop, or `close()` (which also
 * hands focus back to whatever opened it). Sits at the bottom on phones
 * (thumb zone), centred from `sm` up.
 */
export function Sheet({
  labelledBy,
  onClose,
  className = "",
  dialogRef,
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  /** Width, height and overflow for this sheet. */
  className?: string;
  dialogRef?: RefObject<HTMLDialogElement | null>;
  children: ReactNode;
}) {
  const own = useRef<HTMLDialogElement>(null);
  const ref = dialogRef ?? own;

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, [ref]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className={`sheet mx-auto mb-[calc(12px+var(--safe-bottom))] mt-auto max-w-none rounded-xl border border-line-strong bg-ink-1 p-0 text-cream shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] backdrop:bg-ink-0/75 backdrop:backdrop-blur-sm sm:my-auto ${className}`}
    >
      {children}
    </dialog>
  );
}
