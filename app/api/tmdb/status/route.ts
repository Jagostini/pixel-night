import { NextResponse } from "next/server"
import { getActiveTmdbToken } from "@/lib/tmdb-token"

export async function GET() {
  const token = await getActiveTmdbToken()
  if (!token) {
    return NextResponse.json({ configured: false })
  }

  try {
    const res = await fetch("https://api.themoviedb.org/3/configuration", {
      headers: { Authorization: `Bearer ${token}` },
    })
    return NextResponse.json({ configured: res.ok })
  } catch {
    return NextResponse.json({ configured: false })
  }
}
