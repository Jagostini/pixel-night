import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
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

  // Update soiree
  const { error } = await supabase
    .from("sp_soirees")
    .update({
      winning_theme_id: winner.theme_id,
      phase: "film_vote",
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
