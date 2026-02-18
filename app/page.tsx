import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SoireeStatus } from "@/components/soiree-status"
import { Film, Vote, ArrowRight, Sparkles } from "lucide-react"
import type { SpSoiree, SoireePhase } from "@/lib/types"

export default async function Home() {
  const supabase = await createClient()

  // Get active soiree (theme_vote or film_vote)
  const { data: activeSoiree } = await supabase
    .from("sp_soirees")
    .select("*")
    .in("phase", ["theme_vote", "film_vote"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get recent completed soirees
  const { data: pastSoirees } = await supabase
    .from("sp_soirees")
    .select("*")
    .eq("phase", "completed")
    .order("created_at", { ascending: false })
    .limit(3)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
          Pixels Night
        </h1>
        <p className="max-w-lg text-pretty text-lg text-muted-foreground">
          Votez pour un theme, puis pour un film. Le grand gagnant sera projete
          lors de la prochaine soiree cine.
        </p>
      </section>

      {/* Active soiree */}
      {activeSoiree ? (
        <section className="mb-12">
          <ActiveSoireeCard soiree={activeSoiree} />
        </section>
      ) : (
        <section className="mb-12">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <Vote className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Aucune soiree en cours</p>
                <p className="text-sm text-muted-foreground">
                  Revenez bientot pour voter !
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Past soirees */}
      {pastSoirees && pastSoirees.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Soirees passees</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastSoirees.map((s: SpSoiree) => (
              <Card key={s.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {s.event_date
                        ? new Date(s.event_date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Date non definie"}
                    </CardTitle>
                    <SoireeStatus phase={s.phase as SoireePhase} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {s.winning_film_title && (
                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {s.winning_film_title}
                      </span>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" asChild className="self-start">
                    <Link href={`/soiree/${s.id}/resultats`}>
                      Voir les resultats
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

function ActiveSoireeCard({ soiree }: { soiree: SpSoiree }) {
  const isThemePhase = soiree.phase === "theme_vote"
  return (
    <Card className="border-primary/30 bg-card">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            {isThemePhase ? (
              <Vote className="h-6 w-6 text-primary" />
            ) : (
              <Film className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <SoireeStatus phase={soiree.phase as SoireePhase} />
              {soiree.event_date && (
                <span className="text-xs text-muted-foreground">
                  {new Date(soiree.event_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isThemePhase
                ? "Choisissez votre theme prefere !"
                : "Votez pour le film de la soiree !"}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/soiree/${soiree.id}`}>
            Voter maintenant
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
