/**
 * POST /api/soirees/[id]/propose-film
 *
 * Allows an anonymous guest to propose a film during the film_proposal phase.
 *
 * @body { tmdb_id: number, voter_id: string }
 * @returns { success: true, proposal } or { error: string }
 *
 * Errors:
 *  - 400: invalid body, wrong phase, phase expired
 *  - 409: voter has already proposed 3 films, or film already proposed
 */
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { TMDB_BASE_URL, tmdbHeaders } from "@/lib/tmdb"
import { getActiveTmdbToken } from "@/lib/tmdb-token"

const MAX_PROPOSALS_PER_VOTER = 3

const bodySchema = z.object({
  tmdb_id: z.number().int().positive(),
  voter_id: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requete invalide", details: parsed.error.issues },
      { status: 400 }
    )
  }

  const { tmdb_id, voter_id } = parsed.data
  const supabase = createAdminClient()

  const { data: soiree } = await supabase
    .from("sp_soirees")
    .select("phase, proposal_ends_at")
    .eq("id", soireeId)
    .single()

  if (!soiree || soiree.phase !== "film_proposal") {
    return NextResponse.json(
      { error: "La soiree n'est pas en phase de proposition" },
      { status: 400 }
    )
  }

  if (soiree.proposal_ends_at && new Date(soiree.proposal_ends_at) < new Date()) {
    return NextResponse.json(
      { error: "La periode de proposition est terminee" },
      { status: 400 }
    )
  }

  // Check voter proposal count
  const { count } = await supabase
    .from("sp_soiree_film_proposals")
    .select("id", { count: "exact", head: true })
    .eq("soiree_id", soireeId)
    .eq("voter_id", voter_id)

  if ((count ?? 0) >= MAX_PROPOSALS_PER_VOTER) {
    return NextResponse.json(
      { error: `Vous avez atteint la limite de ${MAX_PROPOSALS_PER_VOTER} propositions` },
      { status: 409 }
    )
  }

  // Fetch film details from TMDb
  let filmData: {
    title: string
    poster_path: string | null
    overview: string
    release_date: string
    director: string | null
    duration: number | null
    trailer_url: string | null
  }

  const token = await getActiveTmdbToken()
  if (!token) {
    return NextResponse.json({ error: "Token TMDb non configuré" }, { status: 500 })
  }

  try {
    const detailUrl = `${TMDB_BASE_URL}/movie/${tmdb_id}?language=fr-FR&append_to_response=credits,videos`
    const res = await fetch(detailUrl, { headers: tmdbHeaders(token) })
    if (!res.ok) {
      return NextResponse.json({ error: "Film non trouve sur TMDb" }, { status: 400 })
    }
    const detail = await res.json()

    const director = detail.credits?.crew?.find(
      (c: { job: string }) => c.job === "Director"
    )?.name ?? null

    const trailer = detail.videos?.results?.find(
      (v: { type: string; site: string; key: string }) =>
        v.type === "Trailer" && v.site === "YouTube"
    )

    filmData = {
      title: detail.title,
      poster_path: detail.poster_path ?? null,
      overview: detail.overview ?? null,
      release_date: detail.release_date ?? null,
      director,
      duration: detail.runtime ?? null,
      trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    }
  } catch {
    return NextResponse.json({ error: "Erreur lors de la recuperation du film" }, { status: 500 })
  }

  // Insert proposal (unique constraint: soiree_id + tmdb_id)
  const { data: proposal, error } = await supabase
    .from("sp_soiree_film_proposals")
    .insert({
      soiree_id: soireeId,
      voter_id,
      tmdb_id,
      ...filmData,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ce film a deja ete propose" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, proposal })
}
