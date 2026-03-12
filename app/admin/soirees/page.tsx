import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SoireeStatus } from "@/components/soiree-status"
import { Plus, ArrowRight, Calendar } from "lucide-react"
import type { SpSoiree, SoireePhase } from "@/lib/types"

export default async function SoireesListPage() {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect("/auth/login")
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: salle } = await supabase
    .from("sp_salles")
    .select("id")
    .eq("created_by", user.id)
    .maybeSingle()

  const { data: soirees } = salle
    ? await supabase
        .from("sp_soirees")
        .select("*")
        .eq("salle_id", salle.id)
        .order("created_at", { ascending: false })
    : await supabase
        .from("sp_soirees")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Soirees</h1>
        <Button asChild>
          <Link href="/admin/soirees/nouvelle">
            <Plus className="mr-1 h-4 w-4" />
            Nouvelle soiree
          </Link>
        </Button>
      </div>

      {!soirees || soirees.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Aucune soiree</p>
              <p className="text-sm text-muted-foreground">
                Creez votre premiere soiree pour commencer.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {soirees.map((s: SpSoiree) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <SoireeStatus phase={s.phase as SoireePhase} />
                  <div>
                    <p className="text-sm font-medium">
                      {s.event_date
                        ? new Date(s.event_date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Date non definie"}
                    </p>
                    {s.winning_film_title && (
                      <p className="text-xs text-muted-foreground">
                        {s.winning_film_title}
                      </p>
                    )}
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/soirees/${s.id}`}>
                    Gerer
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
