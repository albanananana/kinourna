import { posterUrl, type PosterSize } from "@/lib/tmdb-image";
import type { Film } from "@/lib/types";

/** 2:3 poster; titles without artwork get a typographic stand-in. */
export function Poster({
  film,
  size = "w342",
  className = "",
  rounded = "rounded-md",
}: {
  film: Pick<Film, "title" | "poster" | "year">;
  size?: PosterSize;
  className?: string;
  rounded?: string;
}) {
  const src = posterUrl(film.poster, size);
  return (
    <div className={`relative aspect-[2/3] overflow-hidden bg-ink-2 ${rounded} ${className}`} style={{ containerType: "inline-size" }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- TMDB already serves sized images
        <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-between bg-[linear-gradient(160deg,#2a1d17,#120f0d_70%)] p-[9%]">
          <span className="font-mono text-[clamp(7px,7cqw,10px)] tracking-[0.2em] text-amber/80">{film.year ?? "★ ★ ★"}</span>
          <span className="display line-clamp-4 text-[clamp(8px,19cqw,34px)] text-cream/90 [hyphens:auto] [overflow-wrap:anywhere]">
            {film.title}
          </span>
        </div>
      )}
    </div>
  );
}
