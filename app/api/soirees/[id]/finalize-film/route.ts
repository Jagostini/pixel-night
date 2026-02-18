import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params
  const authSupabase = await createClient()

  // Auth check
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get soiree to know exclusion count
  const { data: soiree } = await supabase
    .from("sp_soirees")
    .select("*")
    .eq("id", soireeId)
    .single()

  if (!soiree) {
    return NextResponse.json({ error: "Soiree non trouvee" }, { status: 404 })
  }

  // Get all films for this soiree
  const { data: films } = await supabase
    .from("sp_soiree_films")
    .select("*")
    .eq("soiree_id", soireeId)
    .order("vote_count", { ascending: false })

  if (!films || films.length === 0) {
    return NextResponse.json({ error: "Aucun film" }, { status: 400 })
  }

  // Find winner (random among tied)
  const maxVotes = films[0].vote_count
  const tied = films.filter((f) => f.vote_count === maxVotes)
  const winner = tied[Math.floor(Math.random() * tied.length)]

  // Update soiree with winner
  const { error } = await supabase
    .from("sp_soirees")
    .update({
      winning_film_tmdb_id: winner.tmdb_id,
      winning_film_title: winner.title,
      winning_film_poster: winner.poster_path,
      phase: "completed",
    })
    .eq("id", soireeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mark winning theme as excluded for N soirees
  if (soiree.winning_theme_id) {
    const exclusionDate = new Date()
    exclusionDate.setDate(exclusionDate.getDate() + soiree.exclusion_soirees * 30)
    await supabase
      .from("sp_themes")
      .update({ excluded_until: exclusionDate.toISOString() })
      .eq("id", soiree.winning_theme_id)
  }

  return NextResponse.json({
    success: true,
    winning_film_title: winner.title,
    winning_film_tmdb_id: winner.tmdb_id,
  })
}
