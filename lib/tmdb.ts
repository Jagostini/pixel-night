export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function tmdbPoster(path: string | null, size: "w342" | "w500" | "w780" | "original" = "w500"): string {
  if (!path) return "/placeholder-movie.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function tmdbBackdrop(path: string | null, size: "w780" | "w1280" | "original" = "w1280"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/**
 * Build TMDb API headers with the bearer token.
 */
export function tmdbHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.TMDB_API_READ_ACCESS_TOKEN}`,
    "Content-Type": "application/json;charset=utf-8",
  };
}
