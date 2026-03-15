import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { encrypt } from "@/lib/encryption"

export async function POST(request: NextRequest) {
  // Auth check
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 })
  }

  const { token } = await request.json()
  if (!token) {
    return NextResponse.json({ success: false, error: "Token manquant" }, { status: 400 })
  }

  // Validate the token against TMDb
  try {
    const res = await fetch("https://api.themoviedb.org/3/configuration", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 400 })
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Impossible de valider le token" },
      { status: 500 }
    )
  }

  const encKey = process.env.ENCRYPTION_KEY
  if (!encKey) {
    return NextResponse.json(
      { success: false, error: "ENCRYPTION_KEY non configurée sur le serveur" },
      { status: 500 }
    )
  }

  const encrypted = await encrypt(token, encKey)

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("sp_salles")
    .update({ tmdb_token_encrypted: encrypted })
    .eq("created_by", user.id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
