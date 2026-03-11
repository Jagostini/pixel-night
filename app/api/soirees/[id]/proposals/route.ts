/**
 * GET /api/soirees/[id]/proposals
 *
 * Returns all film proposals for a soiree (public read).
 *
 * @returns SpSoireeFilmProposal[] ordered by created_at asc
 */
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("sp_soiree_film_proposals")
    .select("*")
    .eq("soiree_id", soireeId)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
