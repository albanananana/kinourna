export type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780";

export function posterUrl(path: string | undefined, size: PosterSize = "w342"): string | undefined {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}

export function backdropUrl(path: string | undefined, size: "w780" | "w1280" = "w1280"): string | undefined {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}
