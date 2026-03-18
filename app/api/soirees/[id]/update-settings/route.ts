/**
 * PATCH /api/soirees/[id]/update-settings
 *
 * Updates editable settings on a soirée before the film vote phase.
 * Currently supports: film_count
 *
 * Allowed phases: planned, theme_vote, film_proposal
 *
 * @requires Auth: organisateur session
 * @returns { success: true } or { error: string }
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const EDITABLE_PHASES = ["planned", "theme_vote", "film_proposal"]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params
  const authSupabase = await createClient()

  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const body = await request.json()
  const filmCount = body.film_count

  if (typeof filmCount !== "number" || !Number.isInteger(filmCount) || filmCount < 1 || filmCount > 50) {
    return NextResponse.json(
      { error: "film_count doit être un entier entre 1 et 50" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: soiree } = await supabase
    .from("sp_soirees")
    .select("phase")
    .eq("id", soireeId)
    .single()

  if (!soiree) {
    return NextResponse.json({ error: "Soiree non trouvee" }, { status: 404 })
  }

  if (!EDITABLE_PHASES.includes(soiree.phase)) {
    return NextResponse.json(
      { error: "Le nombre de films ne peut plus être modifié à ce stade" },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from("sp_soirees")
    .update({ film_count: filmCount })
    .eq("id", soireeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
