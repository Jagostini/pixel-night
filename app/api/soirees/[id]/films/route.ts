/**
 * DELETE /api/soirees/[id]/films  — supprime un film de sp_soiree_films
 * POST   /api/soirees/[id]/films  — ajoute un film par tmdb_id
 *
 * Toutes deux refusent l'action si des votes ont déjà été émis.
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { TMDB_BASE_URL, tmdbHeaders } from "@/lib/tmdb"
import { getActiveTmdbToken } from "@/lib/tmdb-token"

async function checkNoVotes(supabase: ReturnType<typeof createAdminClient>, soireeId: string) {
  const { count } = await supabase
    .from("sp_film_votes")
    .select("*", { count: "exact", head: true })
    .eq("soiree_id", soireeId)
  return (count ?? 0) === 0
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  const { film_id } = await request.json()
  if (!film_id) return NextResponse.json({ error: "film_id requis" }, { status: 400 })

  const supabase = createAdminClient()

  const { data: soireeForDelete } = await supabase
    .from("sp_soirees")
    .select("created_by")
    .eq("id", soireeId)
    .single()

  if (!soireeForDelete) return NextResponse.json({ error: "Soiree non trouvee" }, { status: 404 })
  if (soireeForDelete.created_by !== user.id) return NextResponse.json({ error: "Non autorise" }, { status: 403 })

  if (!(await checkNoVotes(supabase, soireeId))) {
    return NextResponse.json({ error: "Des votes ont deja ete emis" }, { status: 409 })
  }

  const { error } = await supabase
    .from("sp_soiree_films")
    .delete()
    .eq("id", film_id)
    .eq("soiree_id", soireeId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: soireeId } = await params
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  const { tmdb_id } = await request.json()
  if (!tmdb_id) return NextResponse.json({ error: "tmdb_id requis" }, { status: 400 })

  const supabase = createAdminClient()

  const { data: soireeForPost } = await supabase
    .from("sp_soirees")
    .select("created_by")
    .eq("id", soireeId)
    .single()

  if (!soireeForPost) return NextResponse.json({ error: "Soiree non trouvee" }, { status: 404 })
  if (soireeForPost.created_by !== user.id) return NextResponse.json({ error: "Non autorise" }, { status: 403 })

  if (!(await checkNoVotes(supabase, soireeId))) {
    return NextResponse.json({ error: "Des votes ont deja ete emis" }, { status: 409 })
  }

  const token = getActiveTmdbToken()
  if (!token) return NextResponse.json({ error: "Token TMDb non configuré" }, { status: 500 })

  try {
    const detailUrl = `${TMDB_BASE_URL}/movie/${tmdb_id}?language=fr-FR&append_to_response=credits,videos`
    const detail = await fetch(detailUrl, { headers: tmdbHeaders(token) }).then((r) => r.json())

    if (!detail.id) return NextResponse.json({ error: "Film non trouve sur TMDb" }, { status: 404 })

    const director = detail.credits?.crew?.find(
      (c: { job: string }) => c.job === "Director"
    )?.name ?? null

    const trailer = detail.videos?.results?.find(
      (v: { type: string; site: string; key: string }) =>
        v.type === "Trailer" && v.site === "YouTube"
    )

    const { error } = await supabase.from("sp_soiree_films").upsert(
      {
        soiree_id: soireeId,
        tmdb_id: detail.id,
        title: detail.title,
        poster_path: detail.poster_path ?? null,
        overview: detail.overview ?? null,
        release_date: detail.release_date ?? null,
        director,
        duration: detail.runtime ?? null,
        trailer_url: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      },
      { onConflict: "soiree_id,tmdb_id" }
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, title: detail.title })
  } catch {
    return NextResponse.json({ error: "Erreur TMDb" }, { status: 500 })
  }
}
