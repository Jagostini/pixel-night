import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params
  const { soireeFilmId, voterId } = await request.json()

  if (!soireeFilmId || !voterId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const supabase = await createClient()

  // Check if already voted
  const { data: existing } = await supabase
    .from("sp_film_votes")
    .select("id")
    .eq("soiree_id", soireeId)
    .eq("voter_id", voterId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "Vous avez deja vote" }, { status: 409 })
  }

  // Insert vote
  const { error: voteError } = await supabase.from("sp_film_votes").insert({
    soiree_id: soireeId,
    soiree_film_id: soireeFilmId,
    voter_id: voterId,
  })

  if (voteError) {
    return NextResponse.json({ error: voteError.message }, { status: 500 })
  }

  // Count actual votes and update
  const { count } = await supabase
    .from("sp_film_votes")
    .select("*", { count: "exact", head: true })
    .eq("soiree_film_id", soireeFilmId)

  await supabase
    .from("sp_soiree_films")
    .update({ vote_count: count ?? 1 })
    .eq("id", soireeFilmId)

  return NextResponse.json({ success: true })
}
