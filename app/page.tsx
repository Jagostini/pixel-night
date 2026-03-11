import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SoireeStatus } from "@/components/soiree-status"
import { Badge } from "@/components/ui/badge"
import {
  Film,
  Vote,
  ArrowRight,
  Sparkles,
  Users,
  Trophy,
  Calendar,
} from "lucide-react"
import type { SpSoiree, SoireePhase } from "@/lib/types"

interface SoireeWithCounts extends SpSoiree {
  theme_vote_total: number
  film_vote_total: number
}

export default async function Home() {
  let activeSoirees: SoireeWithCounts[] = []
  let pastSoirees: SoireeWithCounts[] = []

  try {
    const supabase = await createClient()

    // Get ALL active soirees (theme_vote or film_vote)
    const { data: activeData } = await supabase
      .from("sp_soirees")
      .select("*")
      .in("phase", ["theme_vote", "film_vote"])
      .order("created_at", { ascending: false })

    // Get recent completed soirees
    const { data: pastData } = await supabase
      .from("sp_soirees")
      .select("*")
      .eq("phase", "completed")
      .order("created_at", { ascending: false })
      .limit(6)

    // Fetch vote counts for all soirees
    const allSoirees = [...(activeData ?? []), ...(pastData ?? [])]
    const ids = allSoirees.map((s) => s.id)

    const themeVoteCounts: Record<string, number> = {}
    const filmVoteCounts: Record<string, number> = {}

    if (ids.length > 0) {
      const { data: tvotes } = await supabase
        .from("sp_theme_votes")
        .select("soiree_id")
        .in("soiree_id", ids)

      const { data: fvotes } = await supabase
        .from("sp_film_votes")
        .select("soiree_id")
        .in("soiree_id", ids)

      for (const v of tvotes ?? []) {
        themeVoteCounts[v.soiree_id] = (themeVoteCounts[v.soiree_id] ?? 0) + 1
      }
      for (const v of fvotes ?? []) {
        filmVoteCounts[v.soiree_id] = (filmVoteCounts[v.soiree_id] ?? 0) + 1
      }
    }

    const withCounts = (s: SpSoiree): SoireeWithCounts => ({
      ...s,
      theme_vote_total: themeVoteCounts[s.id] ?? 0,
      film_vote_total: filmVoteCounts[s.id] ?? 0,
    })

    activeSoirees = (activeData ?? []).map(withCounts)
    pastSoirees = (pastData ?? []).map(withCounts)
  } catch {
    // Supabase not configured yet
  }

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

      {/* Active soirees */}
      {activeSoirees.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Vote className="h-5 w-5 text-primary" />
            Votes en cours
            <Badge variant="outline" className="ml-1">
              {activeSoirees.length}
            </Badge>
          </h2>
          <div className="grid gap-4">
            {activeSoirees.map((s) => (
              <SoireeActiveCard key={s.id} soiree={s} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-12">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <Vote className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Aucun vote en cours</p>
                <p className="text-sm text-muted-foreground">
                  Revenez bientot pour voter !
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Past soirees */}
      {pastSoirees.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Trophy className="h-5 w-5 text-primary" />
            Soirees passees
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastSoirees.map((s) => (
              <SoireePastCard key={s.id} soiree={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SoireeActiveCard({ soiree }: { soiree: SoireeWithCounts }) {
  const isThemePhase = soiree.phase === "theme_vote"
  const totalVotes = isThemePhase
    ? soiree.theme_vote_total
    : soiree.film_vote_total

  return (
    <Card className="border-primary/30">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            {isThemePhase ? (
              <Vote className="h-6 w-6 text-primary" />
            ) : (
              <Film className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <SoireeStatus phase={soiree.phase as SoireePhase} />
              {soiree.event_date && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"} enregistre
                {totalVotes === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href={`/soiree/${soiree.id}`}>
            Voter maintenant
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function SoireePastCard({ soiree }: { soiree: SoireeWithCounts }) {
  const totalVotes = soiree.theme_vote_total + soiree.film_vote_total
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {soiree.event_date
              ? new Date(soiree.event_date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Date non definie"}
          </CardTitle>
          <SoireeStatus phase={soiree.phase as SoireePhase} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {soiree.winning_film_title && (
          <div className="flex items-start gap-3">
            {soiree.winning_film_poster && (
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://image.tmdb.org/t/p/w154${soiree.winning_film_poster}`}
                  alt={soiree.winning_film_title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-primary" />
                <span className="text-xs text-primary">Film gagnant</span>
              </div>
              <span className="text-sm font-medium leading-tight">
                {soiree.winning_film_title}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{totalVotes} votes au total</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mt-auto self-start"
        >
          <Link href={`/soiree/${soiree.id}/resultats`}>
            Voir les resultats
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
