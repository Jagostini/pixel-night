/**
 * POST /api/soirees/[id]/fetch-films
 *
 * Fetches relevant films from TMDb for the soiree's winning theme and inserts
 * them into sp_soiree_films.
 *
 * Algorithm:
 *  1. Builds queries from individual keywords + a combined query
 *  2. Filters out films with vote_count < 50 and adult content
 *  3. Scores each film: score = vote_average × log(vote_count + 1)
 *  4. Deduplicates by tmdb_id (keeps best score per film)
 *  5. Sorts by score descending, limits to film_count × 2
 *  6. Fetches details (director, runtime, trailer) and upserts into DB
 *
 * @requires Auth: organisateur session
 * @returns { success: true, count: number } or { error: string }
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { TMDB_BASE_URL, tmdbHeaders } from "@/lib/tmdb"
import { getActiveTmdbToken } from "@/lib/tmdb-token"
import { tmdbFetch, tmdbLimiter } from "@/lib/tmdb-client"

interface TmdbSearchResult {
  id: number
  title: string
  poster_path: string | null
  overview: string
  release_date: string
  vote_average: number
  vote_count: number
  adult: boolean
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params
  const authSupabase = await createClient()

  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const supabase = createAdminClient()

  const token = getActiveTmdbToken()
  if (!token) {
    return NextResponse.json(
      { error: "Token TMDb non configuré" },
      { status: 500 }
    )
  }

  const { data: soiree } = await supabase
    .from("sp_soirees")
    .select("*")
    .eq("id", soireeId)
    .single()

  if (!soiree) {
    return NextResponse.json({ error: "Soiree non trouvee" }, { status: 404 })
  }
  if (soiree.created_by !== user.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 })
  }
  if (!soiree.winning_theme_id) {
    return NextResponse.json({ error: "Pas de theme gagnant" }, { status: 400 })
  }

  const { data: theme } = await supabase
    .from("sp_themes")
    .select("*")
    .eq("id", soiree.winning_theme_id)
    .single()

  const keywords: string[] = theme?.keywords?.length ? theme.keywords : [theme?.name ?? "film"]

  // Build list of queries: individual keywords + combined query
  const queries = [...keywords]
  if (keywords.length > 1) {
    queries.push(keywords.join(" "))
  }

  // Collect all results, dedup by tmdb_id keeping best score
  const scored = new Map<number, { movie: TmdbSearchResult; score: number }>()

  for (const query of queries) {
    try {
      const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&page=1&include_adult=false`
      const res = await tmdbFetch(url, tmdbHeaders(token))
      const data = await res.json()

      for (const movie of (data.results ?? []) as TmdbSearchResult[]) {
        if (movie.adult) continue
        if (movie.vote_count < 50) continue

        const score = movie.vote_average * Math.log(movie.vote_count + 1)
        const existing = scored.get(movie.id)
        if (!existing || score > existing.score) {
          scored.set(movie.id, { movie, score })
        }
      }
    } catch {
      // continue with other queries
    }
  }

  // Sort by score descending, keep exactly film_count films
  const filmCount = soiree.film_count ?? 10
  const selectedMovies = Array.from(scored.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, filmCount)
    .map((entry) => entry.movie)

  if (selectedMovies.length === 0) {
    return NextResponse.json({ error: "Aucun film trouve sur TMDb" }, { status: 404 })
  }

  // Fetch details for each film (director, runtime, trailer) — concurrency capped by tmdbLimiter
  const filmsToInsert = await Promise.all(
    selectedMovies.map((movie) =>
      tmdbLimiter(async () => {
        try {
          const detailUrl = `${TMDB_BASE_URL}/movie/${movie.id}?language=fr-FR&append_to_response=credits,videos`
          const detailRes = await tmdbFetch(detailUrl, tmdbHeaders(token))
          const detail = await detailRes.json()

          const director = detail.credits?.crew?.find(
            (c: { job: string }) => c.job === "Director"
          )?.name ?? null

          const trailer = detail.videos?.results?.find(
            (v: { type: string; site: string; key: string }) =>
              v.type === "Trailer" && v.site === "YouTube"
          )

          return {
            soiree_id: soireeId,
            tmdb_id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            overview: movie.overview,
            release_date: movie.release_date,
            director,
            duration: detail.runtime ?? null,
            trailer_url: trailer
              ? `https://www.youtube.com/watch?v=${trailer.key}`
              : null,
          }
        } catch {
          return {
            soiree_id: soireeId,
            tmdb_id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            overview: movie.overview,
            release_date: movie.release_date,
            director: null,
            duration: null,
            trailer_url: null,
          }
        }
      })
    )
  )

  const { error } = await supabase.from("sp_soiree_films").upsert(
    filmsToInsert,
    { onConflict: "soiree_id,tmdb_id" }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: filmsToInsert.length })
}
