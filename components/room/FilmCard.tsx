"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { filmMeta, filmTitle } from "@/lib/i18n";
import type { Film } from "@/lib/types";
import { useI18n } from "../i18n/I18nProvider";
import { Poster } from "../ui/Poster";

export type CardState = "idle" | "selected" | "targeted" | "disabled" | "struck" | "pickable";

export function FilmCard({
  film,
  state = "idle",
  badge,
  caption,
  index = 0,
  onClick,
  onInfo,
  label,
}: {
  film: Film;
  state?: CardState;
  badge?: ReactNode;
  caption?: ReactNode;
  index?: number;
  /** The stage's own tap: vote, pick a target. */
  onClick?: () => void;
  /** Opens the film card. A tap on the poster does it when there's no `onClick`; otherwise an ⓘ in the corner. */
  onInfo?: () => void;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const { t, lang } = useI18n();
  const title = filmTitle(film, lang);
  const interactive = !!onClick && state !== "disabled" && state !== "struck";
  const tap = interactive ? onClick : onInfo;
  const Tag = tap ? "button" : "div";
  const separateInfo = interactive && !!onInfo;
  // The ⓘ sits outside the main button (no nested buttons), so it copies the poster's motion.
  const motionCls =
    state === "selected" || state === "targeted" ? "scale-[0.97]" : tap ? "group-hover:-translate-y-1" : "";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18, rotate: index % 2 ? 1.5 : -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: Math.min(index, 18) * 0.035, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <Tag
        type={tap ? "button" : undefined}
        onClick={tap}
        aria-pressed={interactive ? state === "selected" || state === "targeted" : undefined}
        aria-haspopup={tap && !interactive ? "dialog" : undefined}
        aria-label={tap && !interactive ? t.film.about(title) : label}
        className={`relative block w-full text-left ${tap ? "cursor-pointer" : ""}`}
      >
        <div
          className={`relative transition duration-200 ${motionCls} ${
            state === "selected"
              ? "rounded-md ring-2 ring-amber ring-offset-2 ring-offset-ink-0"
              : state === "targeted"
                ? "rounded-md ring-2 ring-signal ring-offset-2 ring-offset-ink-0"
                : state === "pickable"
                  ? "rounded-md group-hover:ring-2 group-hover:ring-signal/80 group-hover:ring-offset-2 group-hover:ring-offset-ink-0"
                  : ""
          } ${state === "struck" || state === "disabled" ? "opacity-35 grayscale" : ""}`}
        >
          <Poster film={film} size="w342" className="shadow-[0_14px_30px_-18px_rgb(0_0_0/0.9)]" />
          {state === "struck" && (
            <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 100 150" preserveAspectRatio="none">
              <line x1="8" y1="142" x2="92" y2="8" stroke="var(--color-signal)" strokeWidth="3.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          {state === "selected" && (
            <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-amber text-ink-0 shadow-lg">
              <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
                <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
          {state === "targeted" && (
            <span className="absolute inset-0 grid place-items-center rounded-md bg-signal/25">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-signal text-white shadow-lg">
                <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          )}
          {badge && <span className="absolute left-1.5 top-1.5">{badge}</span>}
          {onInfo && !separateInfo && <InfoDot className="absolute bottom-1.5 right-1.5 group-hover:bg-cream group-hover:text-ink-0" />}
        </div>
        <div className={`mt-2 ${state === "struck" ? "opacity-50" : ""}`}>
          <div className={`line-clamp-2 text-[13.5px] font-medium leading-tight ${state === "struck" ? "line-through decoration-signal/80" : ""}`}>
            {title}
          </div>
          <div className="mt-0.5 truncate text-[11.5px] text-dim">{caption ?? (filmMeta(film, t) || "\u00a0")}</div>
        </div>
      </Tag>

      {separateInfo && (
        <div className={`pointer-events-none absolute inset-x-0 top-0 aspect-[2/3] transition duration-200 ${motionCls}`}>
          <button
            type="button"
            onClick={onInfo}
            aria-haspopup="dialog"
            aria-label={t.film.about(title)}
            className="group/info pointer-events-auto absolute bottom-0 right-0 grid h-10 w-10 place-items-end p-1.5"
          >
            <InfoDot />
          </button>
        </div>
      )}
    </motion.div>
  );
}

/** The ⓘ: "there's more about this film". */
function InfoDot({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid h-7 w-7 place-items-center rounded-full bg-ink-0/80 text-cream ring-1 ring-white/20 backdrop-blur transition group-hover/info:bg-cream group-hover/info:text-ink-0 ${className}`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12">
        <circle cx="6" cy="2.1" r="1.35" fill="currentColor" />
        <path d="M6 5.2v5.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Badge({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "amber" | "red" }) {
  const tones = {
    dark: "bg-ink-0/85 text-cream",
    amber: "bg-amber text-ink-0",
    red: "bg-signal text-white",
  };
  return (
    <span className={`inline-flex h-6 items-center rounded px-1.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] backdrop-blur ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function FilmGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">{children}</div>;
}
