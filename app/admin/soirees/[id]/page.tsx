"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SoireeStatus } from "@/components/soiree-status"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  Check,
  Download,
  ExternalLink,
  Crown,
  Copy,
  BarChart3,
  Lightbulb,
  X,
  XCircle,
  Trash2,
  Plus,
  Telescope,
  Search,
} from "lucide-react"
import { parseDurationToMinutes, formatDurationFromMinutes } from "@/lib/duration"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type SoireeThemeWithJoin = SpSoireeTheme & { theme: SpTheme }

export default function SoireeControlPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [soiree, setSoiree] = useState<SpSoiree | null>(null)
  const [themes, setThemes] = useState<SoireeThemeWithJoin[]>([])
  const [films, setFilms] = useState<SpSoireeFilm[]>([])
  const [proposals, setProposals] = useState<Array<{ id: string; tmdb_id: number; title: string; poster_path: string | null; voter_id: string }>>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [proposalDurationInput, setProposalDurationInput] = useState("1h")
  const [filmCountInput, setFilmCountInput] = useState<number | "">(10)
  const [savingFilmCount, setSavingFilmCount] = useState(false)
  // Film curation
  const [addFilmOpen, setAddFilmOpen] = useState(false)
  const [filmSearch, setFilmSearch] = useState("")
  const [filmSearchResults, setFilmSearchResults] = useState<Array<{ id: number; title: string; poster_path: string | null; release_date: string }>>([])
  const [filmSearchLoading, setFilmSearchLoading] = useState(false)

  const loadData = useCallback(async () => {
    const supabase = createClient()
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
    if (soireeRes.data?.film_count) setFilmCountInput(soireeRes.data.film_count)

    if (soireeRes.data?.phase === "film_proposal") {
      const proposalsRes = await fetch(`/api/soirees/${id}/proposals`)
      if (proposalsRes.ok) {
        setProposals(await proposalsRes.json())
      }
    }

    setLoading(false)
  }, [id])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  async function handleSaveFilmCount() {
    const count = Number(filmCountInput)
    if (!count || count < 1) { toast.error("Nombre invalide"); return }
    setSavingFilmCount(true)
    try {
      const res = await fetch(`/api/soirees/${id}/update-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ film_count: count }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(`Nombre de films mis à jour : ${count}`)
      loadData()
    } finally { setSavingFilmCount(false) }
  }

  async function handleFinalizeTheme() {
    setActionLoading("finalize-theme")
    try {
      const res = await fetch(`/api/soirees/${id}/finalize-theme`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(`Theme gagnant : ${json.winning_theme_name}`)
      loadData()
    } finally { setActionLoading(null) }
  }

  async function handleFetchFilms() {
    setActionLoading("fetch-films")
    try {
      const res = await fetch(`/api/soirees/${id}/fetch-films`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(`${json.count} films recuperes depuis TMDb`)
      loadData()
    } finally { setActionLoading(null) }
  }

  async function handleFetchFilmsDiscover() {
    setActionLoading("fetch-films-discover")
    try {
      const res = await fetch(`/api/soirees/${id}/fetch-films-discover`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      const mode = json.used_discover ? "Decouverte par genres" : "Recherche par mots-cles"
      toast.success(`${json.count} films recuperes (${mode})`)
      loadData()
    } finally { setActionLoading(null) }
  }

  async function handleDeleteFilm(filmId: string) {
    try {
      const res = await fetch(`/api/soirees/${id}/films`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ film_id: filmId }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success("Film supprime")
      loadData()
    } catch { toast.error("Erreur") }
  }

  async function handleAddFilm(tmdbId: number, title: string) {
    try {
      const res = await fetch(`/api/soirees/${id}/films`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_id: tmdbId }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(`"${title}" ajoute`)
      setAddFilmOpen(false)
      setFilmSearch("")
      setFilmSearchResults([])
      loadData()
    } catch { toast.error("Erreur") }
  }

  async function handleSearchFilm(q: string) {
    setFilmSearch(q)
    if (q.trim().length < 2) { setFilmSearchResults([]); return }
    setFilmSearchLoading(true)
    try {
      const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(q.trim())}`)
      const json = await res.json()
      setFilmSearchResults((json.results ?? []).slice(0, 8))
    } catch { /* ignore */ } finally { setFilmSearchLoading(false) }
  }

  async function handleStartProposals() {
    const durationMinutes = parseDurationToMinutes(proposalDurationInput) ?? 60
    setActionLoading("start-proposals")
    try {
      const res = await fetch(`/api/soirees/${id}/start-proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_duration_minutes: durationMinutes }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(`Phase de propositions ouverte (${formatDurationFromMinutes(durationMinutes)}) !`)
      loadData()
    } finally { setActionLoading(null) }
  }

  async function handleCloseProposals() {
    setActionLoading("close-proposals")
    try {
      const res = await fetch(`/api/soirees/${id}/close-proposals`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      const msg = json.fallback
        ? `Aucune proposition — ${json.count} films recuperes depuis TMDb`
        : `${json.count} propositions copiees en vote`
      toast.success(msg)
      loadData()
    } finally { setActionLoading(null) }
  }

  async function handleFinalizeFilm() {
    setActionLoading("finalize-film")
    try {
      const res = await fetch(`/api/soirees/${id}/finalize-film`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(`Film gagnant : ${json.winning_film_title}`)
      loadData()
    } finally { setActionLoading(null) }
  }

  async function handleCancel() {
    setActionLoading("cancel")
    try {
      const res = await fetch(`/api/soirees/${id}/cancel`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success("Soiree annulee")
      loadData()
    } finally { setActionLoading(null) }
  }

  async function handleDelete() {
    setActionLoading("delete")
    try {
      const res = await fetch(`/api/soirees/${id}/delete`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success("Soiree supprimee")
      router.push("/admin/soirees")
    } finally { setActionLoading(null) }
  }

  if (loading || !soiree) {
    return (
      <div>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  const phase = soiree.phase as SoireePhase
  const totalThemeVotes = themes.reduce((sum, t) => sum + t.vote_count, 0)
  const totalFilmVotes = films.reduce((sum, f) => sum + f.vote_count, 0)
  const canCancel = phase !== "completed" && phase !== "cancelled"
  const canEditFilmCount = phase === "planned" || phase === "theme_vote" || phase === "film_proposal"
  const filmCountChanged = Number(filmCountInput) !== soiree.film_count

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
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
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/soiree/${id}`
              navigator.clipboard.writeText(url)
              toast.success("Lien copie !")
            }}
          >
            <Copy className="mr-1 h-4 w-4" />
            Copier le lien
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/soiree/${id}`} target="_blank">
              <ExternalLink className="mr-1 h-4 w-4" />
              Vue publique
            </Link>
          </Button>
          {phase === "completed" && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/soiree/${id}/resultats`} target="_blank">
                <BarChart3 className="mr-1 h-4 w-4" />
                Resultats
              </Link>
            </Button>
          )}

          {/* Annuler */}
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  disabled={!!actionLoading}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Annuler la soiree
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler cette soiree ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    La soiree sera marquee comme annulee. Les invites verront qu&apos;elle
                    est annulee. Cette action peut etre suivie d&apos;une suppression si besoin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Retour</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleCancel}
                  >
                    Oui, annuler la soiree
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Supprimer */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={!!actionLoading}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer definitivement cette soiree ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Toutes les donnees associees seront supprimees : themes, films, votes et
                  propositions. Cette action est <strong>irreversible</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                >
                  Oui, supprimer definitivement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Actions panel — only for active phases */}
      {phase !== "cancelled" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {canEditFilmCount && (
              <div className="flex items-center gap-2 w-full border-b border-border pb-3 mb-1">
                <Film className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground shrink-0">Films au vote :</span>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={filmCountInput}
                  onChange={(e) => setFilmCountInput(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                  className="w-20 h-8 text-sm"
                  disabled={savingFilmCount}
                />
                <Button
                  size="sm"
                  className="h-8"
                  onClick={handleSaveFilmCount}
                  disabled={savingFilmCount || !filmCountChanged || !filmCountInput}
                >
                  {savingFilmCount ? "..." : "Enregistrer"}
                </Button>
              </div>
            )}
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
            {phase === "theme_vote" && soiree.proposal_enabled && soiree.winning_theme_id && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Input
                    className="w-36 h-9 text-sm"
                    placeholder="ex: 2 jours, 1h30"
                    value={proposalDurationInput}
                    onChange={(e) => setProposalDurationInput(e.target.value)}
                    disabled={!!actionLoading}
                  />
                  <Button
                    variant="outline"
                    onClick={handleStartProposals}
                    disabled={!!actionLoading || !parseDurationToMinutes(proposalDurationInput)}
                  >
                    {actionLoading === "start-proposals" ? (
                      "Ouverture..."
                    ) : (
                      <>
                        <Lightbulb className="mr-1 h-4 w-4" />
                        Ouvrir les propositions
                      </>
                    )}
                  </Button>
                </div>
                {(() => {
                  const mins = parseDurationToMinutes(proposalDurationInput)
                  return mins ? (
                    <span className="text-xs text-muted-foreground ml-1">
                      Durée : {formatDurationFromMinutes(mins)}
                    </span>
                  ) : proposalDurationInput.trim() ? (
                    <span className="text-xs text-destructive ml-1">Format non reconnu</span>
                  ) : null
                })()}
              </div>
            )}
            {phase === "film_proposal" && (
              <Button onClick={handleCloseProposals} disabled={!!actionLoading}>
                {actionLoading === "close-proposals" ? (
                  "Cloture..."
                ) : (
                  <>
                    <X className="mr-1 h-4 w-4" />
                    Clore les propositions ({proposals.length})
                  </>
                )}
              </Button>
            )}
            {phase === "film_vote" && films.length === 0 && !soiree.proposal_enabled && (
              <>
                <Button onClick={handleFetchFilmsDiscover} disabled={!!actionLoading} variant="default">
                  {actionLoading === "fetch-films-discover" ? "Recuperation..." : (
                    <><Telescope className="mr-1 h-4 w-4" />Recuperer (Decouverte)</>
                  )}
                </Button>
                <Button onClick={handleFetchFilms} disabled={!!actionLoading} variant="outline">
                  {actionLoading === "fetch-films" ? "Recuperation..." : (
                    <><Download className="mr-1 h-4 w-4" />Recuperer (Mots-cles)</>
                  )}
                </Button>
              </>
            )}
            {phase === "film_vote" && films.length > 0 && totalFilmVotes === 0 && (
              <Button variant="outline" onClick={() => setAddFilmOpen(true)} disabled={!!actionLoading}>
                <Plus className="mr-1 h-4 w-4" />
                Ajouter un film
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
      )}

      {/* Theme votes */}
      {themes.length > 0 && (
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
      )}

      {/* Film proposals */}
      {phase === "film_proposal" && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Lightbulb className="h-5 w-5 text-primary" />
            Propositions des invites ({proposals.length})
          </h2>
          {proposals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune proposition pour l&apos;instant.</p>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {proposals.map((p) => (
                <Card key={p.id}>
                  <div className="aspect-[2/3] w-full overflow-hidden rounded-t-lg bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tmdbPoster(p.poster_path ?? null, "w342")}
                      alt={p.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <CardContent className="p-2">
                    <p className="line-clamp-1 text-xs font-medium">{p.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Film votes */}
      {films.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Film className="h-5 w-5 text-primary" />
            Films ({totalFilmVotes} votes)
            {phase === "film_vote" && totalFilmVotes === 0 && (
              <span className="text-xs font-normal text-muted-foreground ml-1">— modifiable avant le premier vote</span>
            )}
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
                  {/* Bouton supprimer — visible seulement avant le premier vote */}
                  {phase === "film_vote" && totalFilmVotes === 0 && (
                    <button
                      onClick={() => handleDeleteFilm(f.id)}
                      className="absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/80 text-white hover:bg-destructive transition-colors"
                      title="Supprimer ce film"
                    >
                      <X className="h-3 w-3" />
                    </button>
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

      {/* Dialog — Ajouter un film */}
      <Dialog open={addFilmOpen} onOpenChange={(o) => { setAddFilmOpen(o); if (!o) { setFilmSearch(""); setFilmSearchResults([]) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un film</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Rechercher un film..."
                value={filmSearch}
                onChange={(e) => handleSearchFilm(e.target.value)}
                autoFocus
              />
            </div>
            {filmSearchLoading && (
              <p className="text-center text-sm text-muted-foreground">Recherche...</p>
            )}
            {filmSearchResults.length > 0 && (
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {filmSearchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleAddFilm(m.id, m.title)}
                    className="flex items-center gap-3 rounded-lg border p-2 text-left hover:bg-secondary transition-colors"
                  >
                    {m.poster_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tmdbPoster(m.poster_path, "w342")}
                        alt={m.title}
                        className="h-14 w-10 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-14 w-10 shrink-0 rounded bg-secondary" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{m.title}</p>
                      {m.release_date && (
                        <p className="text-xs text-muted-foreground">
                          {m.release_date.slice(0, 4)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {filmSearch.trim().length >= 2 && !filmSearchLoading && filmSearchResults.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">Aucun resultat</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
