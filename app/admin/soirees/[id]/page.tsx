"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SoireeStatus } from "@/components/soiree-status"
import { toast } from "sonner"
import { tmdbPoster } from "@/lib/tmdb"
import type {
  SpSoiree,
  SpSoireeTheme,
  SpSoireeFilm,
  SpTheme,
  SoireePhase,
} from "@/lib/types"
import {
  Trophy,
  Film,
  Palette,
  Play,
  Check,
  Download,
  ExternalLink,
  Crown,
} from "lucide-react"
import Link from "next/link"

type SoireeThemeWithJoin = SpSoireeTheme & { theme: SpTheme }

export default function SoireeControlPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [soiree, setSoiree] = useState<SpSoiree | null>(null)
  const [themes, setThemes] = useState<SoireeThemeWithJoin[]>([])
  const [films, setFilms] = useState<SpSoireeFilm[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [soireeRes, themesRes, filmsRes] = await Promise.all([
      supabase.from("sp_soirees").select("*").eq("id", id).single(),
      supabase
        .from("sp_soiree_themes")
        .select("*, theme:sp_themes(*)")
        .eq("soiree_id", id)
        .order("vote_count", { ascending: false }),
      supabase
        .from("sp_soiree_films")
        .select("*")
        .eq("soiree_id", id)
        .order("vote_count", { ascending: false }),
    ])

    setSoiree(soireeRes.data)
    setThemes((themesRes.data as SoireeThemeWithJoin[]) ?? [])
    setFilms((filmsRes.data as SpSoireeFilm[]) ?? [])
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  async function handleFinalizeTheme() {
    setActionLoading("finalize-theme")
    try {
      const res = await fetch(`/api/soirees/${id}/finalize-theme`, {
        method: "POST",
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error)
        return
      }
      toast.success(`Theme gagnant : ${json.winning_theme_name}`)
      loadData()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleFetchFilms() {
    setActionLoading("fetch-films")
    try {
      const res = await fetch(`/api/soirees/${id}/fetch-films`, {
        method: "POST",
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error)
        return
      }
      toast.success(`${json.count} films recuperes depuis TMDb`)
      loadData()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleFinalizeFilm() {
    setActionLoading("finalize-film")
    try {
      const res = await fetch(`/api/soirees/${id}/finalize-film`, {
        method: "POST",
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error)
        return
      }
      toast.success(`Film gagnant : ${json.winning_film_title}`)
      loadData()
    } finally {
      setActionLoading(null)
    }
  }

  if (loading || !soiree) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  const phase = soiree.phase as SoireePhase
  const totalThemeVotes = themes.reduce((sum, t) => sum + t.vote_count, 0)
  const totalFilmVotes = films.reduce((sum, f) => sum + f.vote_count, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Controle de la soiree</h1>
          <div className="mt-1 flex items-center gap-2">
            <SoireeStatus phase={phase} />
            {soiree.event_date && (
              <span className="text-sm text-muted-foreground">
                {new Date(soiree.event_date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/soiree/${id}`} target="_blank">
            <ExternalLink className="mr-1 h-4 w-4" />
            Vue publique
          </Link>
        </Button>
      </div>

      {/* Actions panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {phase === "theme_vote" && (
            <Button
              onClick={handleFinalizeTheme}
              disabled={!!actionLoading || totalThemeVotes === 0}
            >
              {actionLoading === "finalize-theme" ? (
                "Finalisation..."
              ) : (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Finaliser le vote themes ({totalThemeVotes} votes)
                </>
              )}
            </Button>
          )}
          {phase === "film_vote" && films.length === 0 && (
            <Button
              onClick={handleFetchFilms}
              disabled={!!actionLoading}
            >
              {actionLoading === "fetch-films" ? (
                "Recuperation..."
              ) : (
                <>
                  <Download className="mr-1 h-4 w-4" />
                  Recuperer les films depuis TMDb
                </>
              )}
            </Button>
          )}
          {phase === "film_vote" && films.length > 0 && (
            <Button
              onClick={handleFinalizeFilm}
              disabled={!!actionLoading || totalFilmVotes === 0}
            >
              {actionLoading === "finalize-film" ? (
                "Finalisation..."
              ) : (
                <>
                  <Trophy className="mr-1 h-4 w-4" />
                  Finaliser le vote films ({totalFilmVotes} votes)
                </>
              )}
            </Button>
          )}
          {phase === "completed" && (
            <Badge variant="secondary" className="gap-1 text-sm">
              <Trophy className="h-3 w-3" />
              Soiree terminee
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Theme votes */}
      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Palette className="h-5 w-5 text-primary" />
          Themes ({totalThemeVotes} votes)
        </h2>
        <div className="flex flex-col gap-2">
          {themes.map((st, i) => (
            <Card
              key={st.id}
              className={
                st.theme_id === soiree.winning_theme_id
                  ? "border-primary/30"
                  : ""
              }
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                    {i + 1}
                  </span>
                  <span className="font-medium">
                    {st.theme?.name ?? "Theme"}
                  </span>
                  {st.theme_id === soiree.winning_theme_id && (
                    <Crown className="h-4 w-4 text-primary" />
                  )}
                </div>
                <Badge variant="secondary">
                  {st.vote_count} {st.vote_count === 1 ? "vote" : "votes"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Film votes */}
      {films.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Film className="h-5 w-5 text-primary" />
            Films ({totalFilmVotes} votes)
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {films.map((f, i) => (
              <Card
                key={f.id}
                className={
                  f.tmdb_id === soiree.winning_film_tmdb_id
                    ? "border-primary/30"
                    : ""
                }
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-lg bg-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tmdbPoster(f.poster_path, "w342")}
                    alt={f.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-xs font-bold">
                    {i + 1}
                  </span>
                  {f.tmdb_id === soiree.winning_film_tmdb_id && (
                    <div className="absolute right-2 top-2">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <CardContent className="p-2">
                  <p className="line-clamp-1 text-xs font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.vote_count} {f.vote_count === 1 ? "vote" : "votes"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
