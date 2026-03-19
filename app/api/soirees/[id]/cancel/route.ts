/**
 * POST /api/soirees/[id]/cancel
 *
 * Annule une soirée en cours en passant sa phase à "cancelled".
 * Disponible tant que la soirée n'est pas terminée ou déjà annulée.
 *
 * @requires Auth: organisateur session
 * @returns { success: true } ou { error: string }
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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
    .select("phase, created_by")
    .eq("id", soireeId)
    .single()

  if (!soiree) {
    return NextResponse.json({ error: "Soiree non trouvee" }, { status: 404 })
  }
  if (soiree.created_by !== user.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 })
  }
  if (soiree.phase === "completed" || soiree.phase === "cancelled") {
    return NextResponse.json(
      { error: "Impossible d'annuler une soiree terminee ou deja annulee" },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from("sp_soirees")
    .update({ phase: "cancelled" })
    .eq("id", soireeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
