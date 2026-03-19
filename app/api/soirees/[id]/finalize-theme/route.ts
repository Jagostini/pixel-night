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

  // Fetch the soiree to know whether proposals are enabled
  const { data: soiree } = await supabase
    .from("sp_soirees")
    .select("proposal_enabled, created_by")
    .eq("id", soireeId)
    .single()

  if (!soiree) {
    return NextResponse.json({ error: "Soiree non trouvee" }, { status: 404 })
  }
  if (soiree.created_by !== user.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 })
  }

  // Get all themes for this soiree, ordered by votes desc
  const { data: themes } = await supabase
    .from("sp_soiree_themes")
    .select("*, theme:sp_themes(*)")
    .eq("soiree_id", soireeId)
    .order("vote_count", { ascending: false })

  if (!themes || themes.length === 0) {
    return NextResponse.json({ error: "Aucun theme" }, { status: 400 })
  }

  // Find the max vote count, then randomly pick among tied winners
  const maxVotes = themes[0].vote_count
  const tied = themes.filter((t) => t.vote_count === maxVotes)
  const winner = tied[Math.floor(Math.random() * tied.length)]

  // If proposal_enabled, stay in theme_vote so the admin can open proposals next.
  // Otherwise advance directly to film_vote (classic flow).
  const nextPhase = soiree?.proposal_enabled ? "theme_vote" : "film_vote"

  const { error } = await supabase
    .from("sp_soirees")
    .update({
      winning_theme_id: winner.theme_id,
      phase: nextPhase,
    })
    .eq("id", soireeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    winning_theme_id: winner.theme_id,
    winning_theme_name: winner.theme?.name ?? "Unknown",
  })
}
