import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { TMDB_BASE_URL, tmdbHeaders } from "@/lib/tmdb"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const token = process.env.TMDB_API_READ_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: "TMDB_API_READ_ACCESS_TOKEN non configure" },
      { status: 500 }
    )
  }

  // Get soiree and winning theme keywords
  const { data: soiree } = await supabase
    .from("sp_soirees")
    .select("*, winning_theme:sp_themes!sp_soirees_winning_theme_id_fkey(*)")
    .eq("id", soireeId)
    .single()

  if (!soiree || !soiree.winning_theme_id) {
    return NextResponse.json({ error: "Pas de theme gagnant" }, { status: 400 })
  }

  const theme = soiree.winning_theme as { keywords: string[]; name: string } | null
  const keywords = theme?.keywords ?? [theme?.name ?? ""]

  // Search TMDb by each keyword and aggregate results
  const allMovies: Map<number, { id: number; title: string; poster_path: string | null; overview: string; release_date: string }> = new Map()

  for (const keyword of keywords) {
    try {
      const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(keyword)}&language=fr-FR&page=1&include_adult=false`
      const res = await fetch(url, { headers: tmdbHeaders() })
      const data = await res.json()

      for (const movie of data.results ?? []) {
        if (!allMovies.has(movie.id)) {
          allMovies.set(movie.id, {
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            overview: movie.overview,
            release_date: movie.release_date,
          })
        }
      }
    } catch {
      // continue with other keywords
    }
  }

  // Take the first N films
  const filmCount = soiree.film_count ?? 10
  const selectedMovies = Array.from(allMovies.values()).slice(0, filmCount)

  // Fetch details for each film (director, runtime, trailer)
  const filmsToInsert = await Promise.all(
    selectedMovies.map(async (movie) => {
      try {
        const detailUrl = `${TMDB_BASE_URL}/movie/${movie.id}?language=fr-FR&append_to_response=credits,videos`
        const detailRes = await fetch(detailUrl, { headers: tmdbHeaders() })
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

  if (filmsToInsert.length === 0) {
    return NextResponse.json({ error: "Aucun film trouve sur TMDb" }, { status: 404 })
  }

  // Insert films (upsert to avoid duplicates)
  const { error } = await supabase.from("sp_soiree_films").upsert(
    filmsToInsert,
    { onConflict: "soiree_id,tmdb_id" }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: filmsToInsert.length })
}
