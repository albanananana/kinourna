"use client";

import { useMemo } from "react";

/**
 * A lottery drum on a stand. `speed` controls how fast the cage turns — idle
 * drift while waiting, a hard spin during the draw.
 */
export function Drum({ tickets, speed = "idle", size = 260 }: { tickets: number; speed?: "idle" | "fast"; size?: number }) {
  const slips = useMemo(() => {
    const n = Math.min(Math.max(tickets, 3), 18);
    // Deterministic scatter so the drum looks the same on every phone.
    return Array.from({ length: n }, (_, i) => {
      const a = (i * 137.508 * Math.PI) / 180;
      const r = 22 + ((i * 53) % 46);
      return { x: 100 + Math.cos(a) * r, y: 100 + Math.sin(a) * r, rot: (i * 67) % 180 };
    });
  }, [tickets]);

  const duration = speed === "fast" ? "0.55s" : "16s";

  return (
    <svg width={size} height={size * 1.12} viewBox="0 0 200 224" aria-hidden className="overflow-visible">
      <defs>
        <radialGradient id="drum-glass" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#3a2f25" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0b0a09" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      {/* stand */}
      <path d="M62 214 88 150h24l26 64" fill="none" stroke="#5a4a36" strokeWidth="5" strokeLinejoin="round" />
      <rect x="44" y="210" width="112" height="8" rx="3" fill="#3a3027" />
      <g style={{ transformOrigin: "100px 100px", animation: `spin ${duration} linear infinite` }}>
        <circle cx="100" cy="100" r="86" fill="url(#drum-glass)" stroke="#c99a45" strokeOpacity="0.55" strokeWidth="2" />
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            x1="100"
            y1="100"
            x2={100 + Math.cos((i * Math.PI) / 6) * 86}
            y2={100 + Math.sin((i * Math.PI) / 6) * 86}
            stroke="#c99a45"
            strokeOpacity="0.16"
            strokeWidth="1"
          />
        ))}
        <circle cx="100" cy="100" r="62" fill="none" stroke="#c99a45" strokeOpacity="0.14" strokeWidth="1" />
        {slips.map((s, i) => (
          <rect
            key={i}
            x={s.x - 9}
            y={s.y - 5}
            width="18"
            height="10"
            rx="1.5"
            fill={i % 5 === 0 ? "#e5382c" : "#eee2c8"}
            opacity={i % 5 === 0 ? 0.9 : 0.85}
            transform={`rotate(${s.rot} ${s.x} ${s.y})`}
          />
        ))}
        <circle cx="100" cy="100" r="7" fill="#c99a45" />
      </g>
      {/* crank */}
      <path d="M186 100h10v22" fill="none" stroke="#c99a45" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.8" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
