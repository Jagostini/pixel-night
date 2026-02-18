import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SoireeStatus } from "@/components/soiree-status"
import { Palette, Film, Plus, ArrowRight, LogOut } from "lucide-react"
import type { SpSoiree, SoireePhase } from "@/lib/types"

async function signOut() {
  "use server"
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Counts
  const { count: themeCount } = await supabase
    .from("sp_themes")
    .select("*", { count: "exact", head: true })

  const { data: activeSoirees } = await supabase
    .from("sp_soirees")
    .select("*")
    .in("phase", ["theme_vote", "film_vote"])
    .order("created_at", { ascending: false })

  const { data: recentSoirees } = await supabase
    .from("sp_soirees")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard organisateur</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="mr-1 h-4 w-4" />
            Deconnexion
          </Button>
        </form>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{themeCount ?? 0}</p>
              <p className="text-sm text-muted-foreground">Themes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeSoirees?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Soirees actives</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <Button asChild size="sm" className="w-full">
                <Link href="/admin/soirees/nouvelle">Nouvelle soiree</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gerer les themes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Ajoutez, modifiez ou desactivez les themes de la liste blanche.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/themes">
                Voir les themes
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gerer les soirees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Consultez l{"'"}historique et gerez vos soirees en cours.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/soirees">
                Voir les soirees
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent soirees */}
      {recentSoirees && recentSoirees.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Soirees recentes</h2>
          <div className="flex flex-col gap-2">
            {recentSoirees.map((s: SpSoiree) => (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <SoireeStatus phase={s.phase as SoireePhase} />
                    <span className="text-sm">
                      {s.event_date
                        ? new Date(s.event_date).toLocaleDateString("fr-FR")
                        : "Pas de date"}
                    </span>
                    {s.winning_film_title && (
                      <span className="text-sm text-muted-foreground">
                        - {s.winning_film_title}
                      </span>
                    )}
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
        </section>
      )}
    </div>
  )
}
