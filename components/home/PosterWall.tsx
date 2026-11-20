import { posterUrl } from "@/lib/tmdb-image";
import type { Film } from "@/lib/types";

/** Slowly drifting, tilted rows of posters behind the hero. Pure CSS. */
export function PosterWall({ films }: { films: Film[] }) {
  const withPosters = films.filter((f) => f.poster);
  if (withPosters.length < 6) return null;
  const rows = [0, 1, 2, 3].map((r) => {
    const rotated = [...withPosters.slice(r * 3), ...withPosters.slice(0, r * 3)];
    return [...rotated, ...rotated];
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-[20%] -top-[10%] flex w-[160%] origin-center -rotate-[9deg] flex-col gap-3 opacity-[0.42] md:left-[18%] md:w-[120%]">
        {rows.map((row, r) => (
          <div key={r} className="wall-row" data-reverse={r % 2 === 1 || undefined} style={{ animationDuration: `${110 + r * 25}s` }}>
            {row.map((film, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- decorative TMDB thumbnails
              <img
                key={`${film.key}-${i}`}
                src={posterUrl(film.poster, "w185")}
                alt=""
                loading={i < 10 ? "eager" : "lazy"}
                className="aspect-[2/3] w-[118px] shrink-0 rounded-md object-cover md:w-[150px]"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--color-ink-0)_28%,rgb(11_10_9/0.86)_55%,rgb(11_10_9/0.55))] md:bg-[linear-gradient(90deg,var(--color-ink-0)_32%,rgb(11_10_9/0.82)_55%,rgb(11_10_9/0.35)),linear-gradient(0deg,var(--color-ink-0),transparent_35%)]" />
    </div>
  );
}
