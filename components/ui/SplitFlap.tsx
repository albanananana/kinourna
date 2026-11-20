"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const CYRILLIC = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ0123456789";
const LATIN = "ABCDEFGHKLMNPRSTUVWXYZĄĆĘŁŃÓŚŹŻ0123456789";
/** Rattle through letters of the same script as the title. */
const charsetFor = (text: string) => (/[\u0400-\u04FF]/.test(text) ? CYRILLIC : LATIN);
const FRAME_MS = 55;

function scramble(text: string) {
  const set = charsetFor(text);
  return [...text].map((ch) => (ch === " " ? " " : set[Math.floor(Math.random() * set.length)])).join("");
}

/**
 * Departure-board text: every letter rattles through random glyphs and lands
 * left-to-right. `tiles` draws each letter on its own flap.
 */
export function SplitFlap({
  text,
  variant = "plain",
  settleMs = 650,
  stagger = 60,
  tileClassName = "",
  className = "",
  translate,
}: {
  translate?: "no";
  text: string;
  variant?: "plain" | "tiles";
  settleMs?: number;
  stagger?: number;
  tileClassName?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [frame, setFrame] = useState<{ source: string; shown: string }>({ source: "", shown: "" });

  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    const set = charsetFor(text);
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const t = performance.now() - start;
      let done = true;
      const shown = [...text]
        .map((ch, i) => {
          if (ch === " " || t >= settleMs + i * stagger) return ch;
          done = false;
          return set[Math.floor(Math.random() * set.length)];
        })
        .join("");
      setFrame({ source: text, shown });
      if (!done) timer = setTimeout(tick, FRAME_MS);
    };
    timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, [text, reduce, settleMs, stagger]);

  const shown = reduce ? text : frame.source === text ? frame.shown : scramble(text);
  const chars = [...shown];
  const target = [...text];

  if (variant === "tiles") {
    return (
      <span role="text" aria-label={text} translate={translate} className={`inline-flex flex-wrap gap-1.5 ${className}`}>
        {chars.map((ch, i) => (
          <span key={i} aria-hidden className={`flap ${tileClassName}`} data-settled={ch === target[i] || undefined}>
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span role="text" aria-label={text} translate={translate} className={className}>
      {chars.map((ch, i) => (
        <span
          key={i}
          aria-hidden
          className={ch === target[i] ? "transition-colors duration-300" : "text-amber/70"}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}
