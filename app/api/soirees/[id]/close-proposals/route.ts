/**
 * POST /api/soirees/[id]/close-proposals
 *
 * Closes the film proposal phase and transitions to film_vote.
 * Copies all proposals into sp_soiree_films.
 * If no proposals exist, falls back to fetch-films (TMDb auto-fetch).
 *
 * @requires Auth: organisateur session
 * @returns { success: true, count: number, fallback?: true } or { error: string }
 *
 * Errors:
 *  - 401: not authenticated
 *  - 400: wrong phase or soiree not found
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { TMDB_BASE_URL, tmdbHeaders } from "@/lib/tmdb"
import { getActiveTmdbToken } from "@/lib/tmdb-token"
import { tmdbFetch, tmdbLimiter } from "@/lib/tmdb-client"

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

  const { data: soiree } = await supabase
    .from("sp_soirees")
    .select("*")
    .eq("id", soireeId)
    .single()

  if (!soiree) {
    return NextResponse.json({ error: "Soiree non trouvee" }, { status: 404 })
  }
  if (soiree.phase !== "film_proposal") {
    return NextResponse.json(
      { error: "La soiree n'est pas en phase film_proposal" },
      { status: 400 }
    )
  }

  // Fetch all proposals
  const { data: proposals } = await supabase
    .from("sp_soiree_film_proposals")
    .select("*")
    .eq("soiree_id", soireeId)

  let filmCount = 0
  let fallback = false

  if (proposals && proposals.length > 0) {
    // Copy proposals into sp_soiree_films
    const filmsToInsert = proposals.map((p) => ({
      soiree_id: soireeId,
      tmdb_id: p.tmdb_id,
      title: p.title,
      poster_path: p.poster_path,
      overview: p.overview,
      release_date: p.release_date,
      director: p.director,
      duration: p.duration,
      trailer_url: p.trailer_url,
    }))

    const { error: insertError } = await supabase
      .from("sp_soiree_films")
      .upsert(filmsToInsert, { onConflict: "soiree_id,tmdb_id" })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    filmCount = filmsToInsert.length
  } else {
    // Fallback: fetch from TMDb
    fallback = true
    if (soiree.winning_theme_id) {
      const { data: theme } = await supabase
        .from("sp_themes")
        .select("*")
        .eq("id", soiree.winning_theme_id)
        .single()

      const tmdbToken = getActiveTmdbToken()
      if (!tmdbToken) {
        return NextResponse.json({ error: "Token TMDb non configuré" }, { status: 500 })
      }

      const keywords: string[] = theme?.keywords?.length ? theme.keywords : [theme?.name ?? "film"]
      const queries = [...keywords]
      if (keywords.length > 1) queries.push(keywords.join(" "))

      const scored = new Map<number, { movie: { id: number; title: string; poster_path: string | null; overview: string; release_date: string; vote_average: number; vote_count: number }; score: number }>()

      for (const query of queries) {
        try {
          const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&page=1&include_adult=false`
          const res = await tmdbFetch(url, tmdbHeaders(tmdbToken))
          const data = await res.json()
          for (const movie of data.results ?? []) {
            if (movie.adult || movie.vote_count < 50) continue
            const score = movie.vote_average * Math.log(movie.vote_count + 1)
            const existing = scored.get(movie.id)
            if (!existing || score > existing.score) {
              scored.set(movie.id, { movie, score })
            }
          }
        } catch { /* skip */ }
      }

      const selectedMovies = Array.from(scored.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, soiree.film_count ?? 10)
        .map((e) => e.movie)

      const filmsToInsert = await Promise.all(
        selectedMovies.map((movie) =>
          tmdbLimiter(async () => {
            try {
              const detailUrl = `${TMDB_BASE_URL}/movie/${movie.id}?language=fr-FR&append_to_response=credits,videos`
              const detailRes = await tmdbFetch(detailUrl, tmdbHeaders(tmdbToken))
              const detail = await detailRes.json()
              const director = detail.credits?.crew?.find((c: { job: string }) => c.job === "Director")?.name ?? null
              const trailer = detail.videos?.results?.find((v: { type: string; site: string; key: string }) => v.type === "Trailer" && v.site === "YouTube")
              return {
                soiree_id: soireeId,
                tmdb_id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                overview: movie.overview,
                release_date: movie.release_date,
                director,
                duration: detail.runtime ?? null,
                trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
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

      if (filmsToInsert.length > 0) {
        await supabase.from("sp_soiree_films").upsert(filmsToInsert, { onConflict: "soiree_id,tmdb_id" })
        filmCount = filmsToInsert.length
      }
    }
  }

  // Transition to film_vote
  const { error } = await supabase
    .from("sp_soirees")
    .update({ phase: "film_vote", proposal_enabled: false })
    .eq("id", soireeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: filmCount, ...(fallback ? { fallback: true } : {}) })
}
