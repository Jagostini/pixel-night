import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { token } = await request.json()

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Token manquant" },
      { status: 400 }
    )
  }

  // Validate the token first
  try {
    const res = await fetch("https://api.themoviedb.org/3/configuration", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Token invalide" },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Impossible de valider le token" },
      { status: 500 }
    )
  }

  // Store the token in process.env for the current session
  // Note: For persistence across deploys, set TMDB_API_READ_ACCESS_TOKEN
  // in your Vercel project's environment variables (Settings > Vars).
  process.env.TMDB_API_READ_ACCESS_TOKEN = token

  return NextResponse.json({ success: true })
}
