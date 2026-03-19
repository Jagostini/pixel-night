/**
 * Retrieve the active TMDb API token from the environment.
 * Set TMDB_API_READ_ACCESS_TOKEN in your Vercel / .env.local.
 */
export function getActiveTmdbToken(): string | null {
  return process.env.TMDB_API_READ_ACCESS_TOKEN || null
}
