import { NextRequest, NextResponse } from "next/server"
import { TMDB_BASE_URL, tmdbHeaders } from "@/lib/tmdb"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const token = process.env.TMDB_API_READ_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: "TMDB_API_READ_ACCESS_TOKEN not configured" },
      { status: 500 }
    )
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/${id}?language=fr-FR&append_to_response=credits,videos`
    const res = await fetch(url, { headers: tmdbHeaders() })

    if (!res.ok) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }

    const data = await res.json()

    const director = data.credits?.crew?.find(
      (c: { job: string; name: string }) => c.job === "Director"
    )?.name ?? null

    const trailer = data.videos?.results?.find(
      (v: { type: string; site: string; key: string }) =>
        v.type === "Trailer" && v.site === "YouTube"
    )

    return NextResponse.json({
      id: data.id,
      title: data.title,
      overview: data.overview,
      poster_path: data.poster_path,
      release_date: data.release_date,
      runtime: data.runtime,
      vote_average: data.vote_average,
      director,
      trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      trailer_key: trailer?.key ?? null,
    })
  } catch {
    return NextResponse.json({ error: "TMDb request failed" }, { status: 502 })
  }
}
