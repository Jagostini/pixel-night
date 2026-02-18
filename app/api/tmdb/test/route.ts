import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { token } = await request.json()

  if (!token) {
    return NextResponse.json({ valid: false, error: "Token manquant" })
  }

  try {
    const res = await fetch("https://api.themoviedb.org/3/configuration", {
      headers: { Authorization: `Bearer ${token}` },
    })
    return NextResponse.json({ valid: res.ok })
  } catch {
    return NextResponse.json({ valid: false, error: "Erreur de connexion" })
  }
}
