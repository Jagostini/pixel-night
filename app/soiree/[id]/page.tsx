"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { getVoterId } from "@/lib/voter"
import { ThemeVoteCard } from "@/components/theme-vote-card"
import { FilmVoteCard } from "@/components/film-vote-card"
import { CountdownTimer } from "@/components/countdown-timer"
import { SoireeStatus } from "@/components/soiree-status"
import { FilmProposalSearch } from "@/components/film-proposal-search"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { tmdbPoster } from "@/lib/tmdb"
import { toast } from "sonner"
import type { SoireePhase, SpSoireeTheme, SpSoireeFilm, SpTheme } from "@/lib/types"
import { Trophy, Film, ArrowRight, ArrowLeft, Users, Calendar } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type SoireeThemeWithJoin = SpSoireeTheme & { theme: SpTheme }

const fetcher = async (url: string) => {
  const supabase = createClient()
  const parts = url.split("|")
  const table = parts[0]
  const soireeId = parts[1]

  if (table === "soiree") {
    const { data } = await supabase
      .from("sp_soirees")
      .select("*")
      .eq("id", soireeId)
      .single()
    return data
  }
  if (table === "themes") {
    const { data } = await supabase
      .from("sp_soiree_themes")
      .select("*, theme:sp_themes(*)")
      .eq("soiree_id", soireeId)
      .order("vote_count", { ascending: false })
    return data
  }
  if (table === "films") {
    const { data } = await supabase
      .from("sp_soiree_films")
      .select("*")
      .eq("soiree_id", soireeId)
      .order("vote_count", { ascending: false })
    return data
  }
  return null
}

export default function SoireePage() {
  const { id } = useParams<{ id: string }>()
  const [voterId, setVoterId] = useState<string>("")
  const [votedThemeId, setVotedThemeId] = useState<string | null>(null)
  const [votedFilmId, setVotedFilmId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [filmDetail, setFilmDetail] = useState<SpSoireeFilm | null>(null)

  const { data: soiree, mutate: mutateSoiree } = useSWR(`soiree|${id}`, fetcher, {
    refreshInterval: 5000,
  })
  const { data: themes, mutate: mutateThemes } = useSWR(`themes|${id}`, fetcher, {
    refreshInterval: 5000,
  })
  const { data: films, mutate: mutateFilms } = useSWR(`films|${id}`, fetcher, {
    refreshInterval: 5000,
  })

  useEffect(() => {
    setVoterId(getVoterId())
  }, [])

  // Check existing votes
  useEffect(() => {
    if (!voterId) return
    const supabase = createClient()

    supabase
      .from("sp_theme_votes")
      .select("soiree_theme_id")
      .eq("soiree_id", id)
      .eq("voter_id", voterId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setVotedThemeId(data.soiree_theme_id)
      })

    supabase
      .from("sp_film_votes")
      .select("soiree_film_id")
      .eq("soiree_id", id)
      .eq("voter_id", voterId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setVotedFilmId(data.soiree_film_id)
      })
  }, [id, voterId])

  const handleThemeVote = useCallback(
    async (soireeThemeId: string) => {
      if (submitting || votedThemeId) return
      setSubmitting(true)
      try {
        const res = await fetch(`/api/soirees/${id}/vote-theme`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ soireeThemeId, voterId }),
        })
        const json = await res.json()
        if (!res.ok) {
          toast.error(json.error || "Erreur lors du vote")
          return
        }
        setVotedThemeId(soireeThemeId)
        toast.success("Vote enregistre !")
        mutateThemes()
      } finally {
        setSubmitting(false)
      }
    },
    [id, voterId, submitting, votedThemeId, mutateThemes]
  )

  const handleFilmVote = useCallback(
    async (soireeFilmId: string) => {
      if (submitting || votedFilmId) return
      setSubmitting(true)
      try {
        const res = await fetch(`/api/soirees/${id}/vote-film`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ soireeFilmId, voterId }),
        })
        const json = await res.json()
        if (!res.ok) {
          toast.error(json.error || "Erreur lors du vote")
          return
        }
        setVotedFilmId(soireeFilmId)
        toast.success("Vote enregistre !")
        mutateFilms()
      } finally {
        setSubmitting(false)
      }
    },
    [id, voterId, submitting, votedFilmId, mutateFilms]
  )

  if (!soiree) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const phase = soiree.phase as SoireePhase

  if (phase === "completed") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Retour a l{"'"}accueil
            </Link>
          </Button>
        </div>
        <div className="flex flex-col items-center gap-6 py-12 text-center">
          <Trophy className="h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">Soiree terminee !</h1>
          {soiree.winning_film_title && (
            <div className="flex flex-col items-center gap-4">
              {soiree.winning_film_poster && (
                <div className="h-64 w-44 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tmdbPoster(soiree.winning_film_poster)}
                    alt={soiree.winning_film_title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <p className="text-lg font-medium">{soiree.winning_film_title}</p>
            </div>
          )}
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href={`/soiree/${id}/resultats`}>
                Voir tous les resultats
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                Autres soirees
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Count total votes from current data
  const totalThemeVotes = (themes as SoireeThemeWithJoin[] | null)?.reduce(
    (acc, t) => acc + t.vote_count,
    0
  ) ?? 0
  const totalFilmVotes = (films as SpSoireeFilm[] | null)?.reduce(
    (acc, f) => acc + f.vote_count,
    0
  ) ?? 0
  const currentVotes = phase === "theme_vote" ? totalThemeVotes : totalFilmVotes

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour a l{"'"}accueil
          </Link>
        </Button>
      </div>
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">
            {phase === "theme_vote"
              ? "Choisissez un theme"
              : phase === "film_proposal"
              ? "Proposez des films"
              : "Votez pour un film"}
          </h1>
          <SoireeStatus phase={phase} />
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {currentVotes} vote{currentVotes !== 1 ? "s" : ""}
          </span>
        </div>
        {soiree.event_date && (
          <p className="text-sm text-muted-foreground">
            Soiree prevue le{" "}
            {new Date(soiree.event_date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
        {soiree.projection_datetime && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Projection :{" "}
            {new Date(soiree.projection_datetime).toLocaleString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        {phase === "theme_vote" && soiree.theme_vote_ends_at && (
          <CountdownTimer endsAt={soiree.theme_vote_ends_at} onExpired={() => mutateSoiree()} />
        )}
        {phase === "film_vote" && soiree.film_vote_ends_at && (
          <CountdownTimer endsAt={soiree.film_vote_ends_at} onExpired={() => mutateSoiree()} />
        )}
        {phase === "film_proposal" && soiree.proposal_ends_at && (
          <CountdownTimer endsAt={soiree.proposal_ends_at} onExpired={() => mutateSoiree()} />
        )}
      </div>

      {/* Film proposal phase */}
      {phase === "film_proposal" && voterId && (
        <FilmProposalSearch soireeId={id} voterId={voterId} />
      )}

      {/* Theme vote phase */}
      {phase === "theme_vote" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {(themes as SoireeThemeWithJoin[] | null)?.map((st) => (
            <ThemeVoteCard
              key={st.id}
              id={st.id}
              name={st.theme?.name ?? "Theme"}
              voteCount={st.vote_count}
              hasVoted={!!votedThemeId}
              selectedId={votedThemeId}
              onVote={handleThemeVote}
              disabled={submitting}
            />
          ))}
        </div>
      )}

      {/* Film vote phase */}
      {phase === "film_vote" && (
        <>
          {soiree.winning_theme_id && (
            <div className="mb-4">
              <Badge variant="outline" className="text-sm">
                <Film className="mr-1 h-3 w-3" />
                {"Theme gagnant selectionne"}
              </Badge>
            </div>
          )}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(films as SpSoireeFilm[] | null)?.map((f) => (
              <FilmVoteCard
                key={f.id}
                id={f.id}
                title={f.title}
                posterPath={f.poster_path}
                releaseDate={f.release_date}
                director={f.director}
                voteCount={f.vote_count}
                hasVoted={!!votedFilmId}
                selectedId={votedFilmId}
                onVote={handleFilmVote}
                onDetail={() => setFilmDetail(f)}
                disabled={submitting}
              />
            ))}
          </div>
        </>
      )}

      {/* Film detail dialog */}
      <Dialog open={!!filmDetail} onOpenChange={(open) => !open && setFilmDetail(null)}>
        <DialogContent className="max-w-lg">
          {filmDetail && (
            <>
              <DialogHeader>
                <DialogTitle>{filmDetail.title}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 sm:flex-row">
                {filmDetail.poster_path && (
                  <div className="h-48 w-32 shrink-0 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tmdbPoster(filmDetail.poster_path)}
                      alt={filmDetail.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {filmDetail.director && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Realisateur :</span>{" "}
                      {filmDetail.director}
                    </p>
                  )}
                  {filmDetail.duration && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Duree :</span>{" "}
                      {filmDetail.duration} min
                    </p>
                  )}
                  {filmDetail.release_date && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Sortie :</span>{" "}
                      {filmDetail.release_date}
                    </p>
                  )}
                  {filmDetail.overview && (
                    <p className="text-sm text-muted-foreground line-clamp-5">
                      {filmDetail.overview}
                    </p>
                  )}
                  {filmDetail.trailer_url && (
                    <a
                      href={filmDetail.trailer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline underline-offset-4"
                    >
                      Voir la bande-annonce
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
