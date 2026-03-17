import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SoireeStatus } from "@/components/soiree-status"
import { Badge } from "@/components/ui/badge"
import {
  Film,
  Vote,
  ArrowRight,
  Clapperboard,
  Users,
  Trophy,
  Calendar,
  Clock,
  DoorOpen,
} from "lucide-react"
import { tmdbPoster } from "@/lib/tmdb"
import type { SpSoiree, SpSalleRoom, SoireePhase } from "@/lib/types"

interface SoireeWithCounts extends SpSoiree {
  theme_vote_total: number
  film_vote_total: number
}

export default async function SallePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: salle } = await supabase
    .from("sp_salles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (!salle) notFound()

  // Charger les salles (rooms) du cinéma
  const { data: roomsData } = await supabase
    .from("sp_salle_rooms")
    .select("*")
    .eq("salle_id", salle.id)
    .order("room_order", { ascending: true })

  const rooms = (roomsData ?? []) as SpSalleRoom[]
  const hasMultipleRooms = rooms.length > 1

  const { data: upcomingData } = await supabase
    .from("sp_soirees")
    .select("*")
    .eq("phase", "planned")
    .eq("salle_id", salle.id)
    .order("event_date", { ascending: true })

  const { data: activeData } = await supabase
    .from("sp_soirees")
    .select("*")
    .in("phase", ["theme_vote", "film_proposal", "film_vote"])
    .eq("salle_id", salle.id)
    .order("created_at", { ascending: false })

  const { data: pastData } = await supabase
    .from("sp_soirees")
    .select("*")
    .eq("phase", "completed")
    .eq("salle_id", salle.id)
    .order("created_at", { ascending: false })
    .limit(6)

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

  const upcomingSoirees = upcomingData ?? []
  const activeSoirees = (activeData ?? []).map(withCounts)
  const pastSoirees = (pastData ?? []).map(withCounts)

  // Helpers pour trouver le nom d'une salle à partir de son ID
  const roomMap = new Map(rooms.map((r, idx) => [r.id, r.name ?? `Salle ${idx + 1}`]))

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <section className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Clapperboard className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {salle.name}
        </h1>
        {hasMultipleRooms && (
          <div className="flex flex-wrap justify-center gap-2">
            {rooms.map((r, idx) => (
              <Badge key={r.id} variant="secondary" className="gap-1">
                <DoorOpen className="h-3 w-3" />
                {r.name ?? `Salle ${idx + 1}`}
                {r.capacity && <span className="text-muted-foreground">· {r.capacity} pl.</span>}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming soirees */}
      {upcomingSoirees.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Clock className="h-5 w-5 text-primary" />
            Prochainement
            <Badge variant="outline" className="ml-1">
              {upcomingSoirees.length}
            </Badge>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingSoirees.map((s) => (
              <SoireeUpcomingCard
                key={s.id}
                soiree={s}
                roomName={hasMultipleRooms && s.room_id ? roomMap.get(s.room_id) : undefined}
              />
            ))}
          </div>
        </section>
      )}

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
              <SoireeActiveCard
                key={s.id}
                soiree={s}
                roomName={hasMultipleRooms && s.room_id ? roomMap.get(s.room_id) : undefined}
              />
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
              <SoireePastCard
                key={s.id}
                soiree={s}
                roomName={hasMultipleRooms && s.room_id ? roomMap.get(s.room_id) : undefined}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SoireeActiveCard({
  soiree,
  roomName,
}: {
  soiree: SoireeWithCounts
  roomName?: string
}) {
  const isThemePhase = soiree.phase === "theme_vote"
  const totalVotes = isThemePhase ? soiree.theme_vote_total : soiree.film_vote_total

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
              {roomName && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <DoorOpen className="h-3 w-3" />
                  {roomName}
                </Badge>
              )}
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

function SoireePastCard({
  soiree,
  roomName,
}: {
  soiree: SoireeWithCounts
  roomName?: string
}) {
  const totalVotes = soiree.theme_vote_total + soiree.film_vote_total
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">
            {soiree.event_date
              ? new Date(soiree.event_date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Date non definie"}
          </CardTitle>
          <div className="flex items-center gap-1">
            {roomName && (
              <Badge variant="outline" className="gap-1 text-xs">
                <DoorOpen className="h-3 w-3" />
                {roomName}
              </Badge>
            )}
            <SoireeStatus phase={soiree.phase as SoireePhase} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {soiree.winning_film_title && (
          <div className="flex items-start gap-3">
            {soiree.winning_film_poster && (
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tmdbPoster(soiree.winning_film_poster, "w342")}
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

        <Button variant="ghost" size="sm" asChild className="mt-auto self-start">
          <Link href={`/soiree/${soiree.id}/resultats`}>
            Voir les resultats
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function SoireeUpcomingCard({
  soiree,
  roomName,
}: {
  soiree: SpSoiree
  roomName?: string
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <Badge variant="secondary" className="text-xs">
            Bientot
          </Badge>
          {roomName && (
            <Badge variant="outline" className="gap-1 text-xs">
              <DoorOpen className="h-3 w-3" />
              {roomName}
            </Badge>
          )}
        </div>
        {soiree.event_date ? (
          <p className="flex items-center gap-1 text-sm font-medium">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {new Date(soiree.event_date).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Date a confirmer</p>
        )}
        <p className="text-xs text-muted-foreground">
          Les votes ouvriront prochainement
        </p>
      </CardContent>
    </Card>
  )
}
