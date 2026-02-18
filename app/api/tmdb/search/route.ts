import { NextRequest, NextResponse } from "next/server"
import { TMDB_BASE_URL, tmdbHeaders } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 })
  }

  const token = process.env.TMDB_API_READ_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: "TMDB_API_READ_ACCESS_TOKEN not configured" },
      { status: 500 }
    )
  }

  try {
    // Search movies directly by text query
    const url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&page=1&include_adult=false`
    const res = await fetch(url, { headers: tmdbHeaders() })
    const data = await res.json()

    return NextResponse.json({
      results: data.results ?? [],
      total_results: data.total_results ?? 0,
    })
  } catch {
    return NextResponse.json({ error: "TMDb request failed" }, { status: 502 })
  }
}
