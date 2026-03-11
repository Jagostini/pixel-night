export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/**
 * Build a TMDb poster URL from a poster path.
 * Returns a local placeholder SVG when the path is null.
 *
 * @param path - The poster_path value from TMDb (e.g. "/abc123.jpg")
 * @param size - Image size: "w342" | "w500" | "w780" | "original" (default: "w500")
 * @returns Full HTTPS image URL or "/placeholder-movie.svg"
 */
export function tmdbPoster(path: string | null, size: "w342" | "w500" | "w780" | "original" = "w500"): string {
  if (!path) return "/placeholder-movie.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/**
 * Build a TMDb backdrop URL from a backdrop path.
 * Returns an empty string when the path is null.
 *
 * @param path - The backdrop_path value from TMDb (e.g. "/backdrop123.jpg")
 * @param size - Image size: "w780" | "w1280" | "original" (default: "w1280")
 * @returns Full HTTPS image URL or ""
 */
export function tmdbBackdrop(path: string | null, size: "w780" | "w1280" | "original" = "w1280"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/**
 * Build TMDb API headers with the bearer token from env.
 * Must only be called server-side (TMDB_API_READ_ACCESS_TOKEN is a server env var).
 *
 * @returns HeadersInit object with Authorization and Content-Type
 */
export function tmdbHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.TMDB_API_READ_ACCESS_TOKEN}`,
    "Content-Type": "application/json;charset=utf-8",
  };
}
