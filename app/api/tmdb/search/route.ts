import { NextRequest, NextResponse } from "next/server"
import { TMDB_BASE_URL, tmdbHeaders } from "@/lib/tmdb"
import { getActiveTmdbToken } from "@/lib/tmdb-token"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 })
  }

  const token = await getActiveTmdbToken()
  if (!token) {
    return NextResponse.json(
      { error: "Token TMDb non configuré" },
      { status: 500 }
    )
  }

  try {
    const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&page=1&include_adult=false`
    const res = await fetch(url, { headers: tmdbHeaders(token) })
    const data = await res.json()

    return NextResponse.json({
      results: data.results ?? [],
      total_results: data.total_results ?? 0,
    })
  } catch {
    return NextResponse.json({ error: "TMDb request failed" }, { status: 502 })
  }
}
