import type { ReactNode } from "react";
import type { Parts } from "@/lib/i18n";

/** Renders a dictionary heading with its accent word in red. */
export function Accent({ parts }: { parts: Parts }) {
  const [before, accent, after] = parts;
  return (
    <>
      {before}
      <span className="text-signal">{accent}</span>
      {after}
    </>
  );
}

/** Sticky bottom bar — the thumb zone on phones. */
export function ActionBar({ children, note }: { children?: ReactNode; note?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-30 mt-auto border-t border-line bg-ink-0/85 px-4 pb-[calc(12px+var(--safe-bottom))] pt-3 backdrop-blur-xl md:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2">
        {note && <div className="min-w-0 flex-1 basis-[220px] text-[14px] leading-snug text-muted">{note}</div>}
        {children && <div className="flex flex-1 basis-[260px] flex-wrap justify-end gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{children}</div>}
      </div>
    </div>
  );
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-6xl px-4 pb-10 pt-7 md:px-8 md:pt-10 ${className}`}>{children}</section>;
}

export function Heading({ kicker, title, sub }: { kicker?: ReactNode; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-7">
      {kicker && <p className="label text-amber">{kicker}</p>}
      <h1 className="display mt-2 text-[clamp(52px,13vw,96px)] [text-wrap:balance]">{title}</h1>
      {sub && <p className="mt-3 max-w-[52ch] text-[15px] leading-snug text-muted">{sub}</p>}
    </div>
  );
}
