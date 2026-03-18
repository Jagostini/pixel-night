/**
 * POST /api/soirees/[id]/fetch-films-discover
 *
 * Moteur de découverte intelligent via l'API TMDb Discover.
 * Si le thème gagnant a des genre_ids configurés, utilise /discover/movie avec
 * ces genres et sélectionne aléatoirement parmi plusieurs pages pour varier les résultats.
 * Sinon, repli automatique sur la recherche par mots-clés (même algo que fetch-films).
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { TMDB_BASE_URL, tmdbHeaders } from "@/lib/tmdb"
import { getActiveTmdbToken } from "@/lib/tmdb-token"

interface TmdbResult {
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
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  const supabase = createAdminClient()

  const token = getActiveTmdbToken()
  if (!token) return NextResponse.json({ error: "Token TMDb non configuré" }, { status: 500 })

  const { data: soiree } = await supabase
    .from("sp_soirees")
    .select("*")
    .eq("id", soireeId)
    .single()

  if (!soiree?.winning_theme_id) {
    return NextResponse.json({ error: "Pas de theme gagnant" }, { status: 400 })
  }

  const { data: theme } = await supabase
    .from("sp_themes")
    .select("*")
    .eq("id", soiree.winning_theme_id)
    .single()

  const genreIds: number[] = theme?.genre_ids?.length ? theme.genre_ids : []
  const filmCount = soiree.film_count ?? 10
  const targetCount = filmCount

  const scored = new Map<number, { movie: TmdbResult; score: number }>()
  let usedDiscover = false

  if (genreIds.length > 0) {
    // Découverte par genres : 5 pages aléatoires parmi les 10 premières
    usedDiscover = true
    const pages = Array.from({ length: 10 }, (_, i) => i + 1).sort(() => Math.random() - 0.5).slice(0, 5)

    for (const page of pages) {
      try {
        const url =
          `${TMDB_BASE_URL}/discover/movie` +
          `?with_genres=${genreIds.join(",")}` +
          `&vote_count.gte=100&vote_average.gte=6` +
          `&sort_by=popularity.desc` +
          `&language=fr-FR&page=${page}&include_adult=false`
        const data = await fetch(url, { headers: tmdbHeaders(token) }).then((r) => r.json())

        for (const movie of (data.results ?? []) as TmdbResult[]) {
          if (movie.adult || movie.vote_count < 100) continue
          const score = movie.vote_average * Math.log(movie.vote_count + 1)
          const existing = scored.get(movie.id)
          if (!existing || score > existing.score) scored.set(movie.id, { movie, score })
        }
      } catch {
        // continue
      }
    }
  } else {
    // Repli sur la recherche par mots-clés
    const keywords: string[] = theme?.keywords?.length ? theme.keywords : [theme?.name ?? "film"]
    const queries = [...keywords]
    if (keywords.length > 1) queries.push(keywords.join(" "))

    for (const query of queries) {
      try {
        const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&page=1&include_adult=false`
        const data = await fetch(url, { headers: tmdbHeaders(token) }).then((r) => r.json())

        for (const movie of (data.results ?? []) as TmdbResult[]) {
          if (movie.adult || movie.vote_count < 50) continue
          const score = movie.vote_average * Math.log(movie.vote_count + 1)
          const existing = scored.get(movie.id)
          if (!existing || score > existing.score) scored.set(movie.id, { movie, score })
        }
      } catch {
        // continue
      }
    }
  }

  const selectedMovies = Array.from(scored.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, targetCount)
    .map((e) => e.movie)

  if (selectedMovies.length === 0) {
    return NextResponse.json({ error: "Aucun film trouve sur TMDb" }, { status: 404 })
  }

  // Enrichissement : réalisateur, durée, bande-annonce
  const filmsToInsert = await Promise.all(
    selectedMovies.map(async (movie) => {
      try {
        const detail = await fetch(
          `${TMDB_BASE_URL}/movie/${movie.id}?language=fr-FR&append_to_response=credits,videos`,
          { headers: tmdbHeaders(token) }
        ).then((r) => r.json())

        const director = detail.credits?.crew?.find(
          (c: { job: string }) => c.job === "Director"
        )?.name ?? null

        const trailer = detail.videos?.results?.find(
          (v: { type: string; site: string; key: string }) =>
            v.type === "Trailer" && v.site === "YouTube"
        )

        return {
          soiree_id: soireeId, tmdb_id: movie.id, title: movie.title,
          poster_path: movie.poster_path, overview: movie.overview,
          release_date: movie.release_date, director,
          duration: detail.runtime ?? null,
          trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
        }
      } catch {
        return {
          soiree_id: soireeId, tmdb_id: movie.id, title: movie.title,
          poster_path: movie.poster_path, overview: movie.overview,
          release_date: movie.release_date, director: null, duration: null, trailer_url: null,
        }
      }
    })
  )

  const { error } = await supabase
    .from("sp_soiree_films")
    .upsert(filmsToInsert, { onConflict: "soiree_id,tmdb_id" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    count: filmsToInsert.length,
    used_discover: usedDiscover,
  })
}
