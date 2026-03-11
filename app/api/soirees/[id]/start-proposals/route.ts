/**
 * POST /api/soirees/[id]/start-proposals
 *
 * Opens the film proposal phase for a soiree.
 *
 * @requires Auth: organisateur session
 * @body { proposal_duration_minutes?: number } — defaults to 60 minutes
 * @returns { success: true, soiree } or { error: string }
 *
 * Errors:
 *  - 401: not authenticated
 *  - 400: soiree not found, wrong phase, or no winning theme
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const bodySchema = z.object({
  proposal_duration_minutes: z.number().int().positive().optional().default(60),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params
  const authSupabase = await createClient()

  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(body)
  const durationMinutes = parsed.success ? parsed.data.proposal_duration_minutes : 60

  const supabase = createAdminClient()

  const { data: soiree } = await supabase
    .from("sp_soirees")
    .select("*")
    .eq("id", soireeId)
    .single()

  if (!soiree) {
    return NextResponse.json({ error: "Soiree non trouvee" }, { status: 404 })
  }
  if (soiree.phase !== "theme_vote") {
    return NextResponse.json(
      { error: "La soiree doit etre en phase theme_vote" },
      { status: 400 }
    )
  }
  if (!soiree.winning_theme_id) {
    return NextResponse.json(
      { error: "Aucun theme gagnant defini" },
      { status: 400 }
    )
  }

  const proposalEndsAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()

  const { data: updated, error } = await supabase
    .from("sp_soirees")
    .update({
      phase: "film_proposal",
      proposal_ends_at: proposalEndsAt,
    })
    .eq("id", soireeId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, soiree: updated })
}
