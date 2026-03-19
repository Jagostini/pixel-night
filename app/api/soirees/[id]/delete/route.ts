/**
 * DELETE /api/soirees/[id]/delete
 *
 * Supprime définitivement une soirée et toutes ses données associées
 * (thèmes, films, votes, propositions — via CASCADE).
 *
 * @requires Auth: organisateur session
 * @returns { success: true } ou { error: string }
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE(
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

  const { data: soiree } = await supabase
    .from("sp_soirees")
    .select("created_by")
    .eq("id", soireeId)
    .single()

  if (!soiree) {
    return NextResponse.json({ error: "Soiree non trouvee" }, { status: 404 })
  }
  if (soiree.created_by !== user.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 })
  }

  const { error } = await supabase
    .from("sp_soirees")
    .delete()
    .eq("id", soireeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
