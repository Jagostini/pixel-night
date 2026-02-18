import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params
  const { soireeThemeId, voterId } = await request.json()

  if (!soireeThemeId || !voterId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const supabase = await createClient()

  // Check if already voted
  const { data: existing } = await supabase
    .from("sp_theme_votes")
    .select("id")
    .eq("soiree_id", soireeId)
    .eq("voter_id", voterId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "Vous avez deja vote" }, { status: 409 })
  }

  // Insert vote
  const { error: voteError } = await supabase.from("sp_theme_votes").insert({
    soiree_id: soireeId,
    soiree_theme_id: soireeThemeId,
    voter_id: voterId,
  })

  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 })
  }

  // Increment vote count
  await supabase.rpc("increment_theme_vote_count" as never, {
    theme_row_id: soireeThemeId,
  } as never).then(() => {
    // fallback: update directly
  })

  // Fallback: read current count and update
  const { data: currentTheme } = await supabase
    .from("sp_soiree_themes")
    .select("vote_count")
    .eq("id", soireeThemeId)
    .single()

  if (currentTheme) {
    // Count actual votes
    const { count } = await supabase
      .from("sp_theme_votes")
      .select("*", { count: "exact", head: true })
      .eq("soiree_theme_id", soireeThemeId)

    await supabase
      .from("sp_soiree_themes")
      .update({ vote_count: count ?? currentTheme.vote_count + 1 })
      .eq("id", soireeThemeId)
  }

  return NextResponse.json({ success: true })
}
