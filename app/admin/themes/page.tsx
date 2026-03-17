"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Trash2, Palette, BookOpen, Telescope } from "lucide-react"
import type { SpTheme } from "@/lib/types"
import { THEME_CATALOG, TMDB_GENRES, TMDB_GENRE_LIST, type CatalogTheme } from "@/lib/theme-catalog"

export default function ThemesPage() {
  const [salleId, setSalleId] = useState<string | null | undefined>(undefined)
  const [userId, setUserId] = useState<string | null>(null)
  const [themes, setThemes] = useState<SpTheme[]>([])
  const [loading, setLoading] = useState(true)

  // Formulaire nouveau thème
  const [newName, setNewName] = useState("")
  const [newKeywords, setNewKeywords] = useState("")
  const [newGenreIds, setNewGenreIds] = useState<number[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Catalogue
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [importingCatalog, setImportingCatalog] = useState<string | null>(null)

  // Fetch salle once on mount
  useEffect(() => {
    async function fetchSalle() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from("sp_salles")
        .select("id")
        .eq("created_by", user.id)
        .maybeSingle()
      setSalleId(data?.id ?? null)
    }
    fetchSalle()
  }, [])

  const loadThemes = useCallback(async () => {
    if (salleId === undefined) return
    try {
      const supabase = createClient()
      let query = supabase
        .from("sp_themes")
        .select("*")
        .order("created_at", { ascending: false })

      if (salleId) {
        query = query.eq("salle_id", salleId)
      } else if (userId) {
        query = query.eq("created_by", userId)
      }

      const { data } = await query
      setThemes((data ?? []) as SpTheme[])
    } catch {
      toast.error("Impossible de charger les themes")
    } finally {
      setLoading(false)
    }
  }, [salleId, userId])

  useEffect(() => { loadThemes() }, [loadThemes])

  function toggleGenre(id: number) {
    setNewGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { toast.error("Non connecte"); setSaving(false); return }

    const keywords = newKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)

    const { error } = await supabase.from("sp_themes").insert({
      name: newName,
      keywords,
      genre_ids: newGenreIds,
      created_by: user.id,
      salle_id: salleId ?? null,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Theme cree !")
      setNewName("")
      setNewKeywords("")
      setNewGenreIds([])
      setDialogOpen(false)
      loadThemes()
    }
    setSaving(false)
  }

  async function handleImportCatalog(entry: CatalogTheme) {
    setImportingCatalog(entry.name)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error("Non connecte"); setImportingCatalog(null); return }

    const { error } = await supabase.from("sp_themes").insert({
      name: entry.name,
      keywords: entry.keywords,
      genre_ids: entry.genre_ids,
      created_by: user.id,
      salle_id: salleId ?? null,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`"${entry.name}" importe !`)
      loadThemes()
    }
    setImportingCatalog(null)
  }

  async function handleToggleActive(theme: SpTheme) {
    const supabase = createClient()
    const { error } = await supabase
      .from("sp_themes")
      .update({ is_active: !theme.is_active })
      .eq("id", theme.id)

    if (error) { toast.error(error.message) } else { loadThemes() }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("sp_themes").delete().eq("id", id)
    if (error) { toast.error(error.message) }
    else { toast.success("Theme supprime"); loadThemes() }
  }

  const isExcluded = (theme: SpTheme) =>
    theme.excluded_until && new Date(theme.excluded_until) > new Date()

  // Thèmes du catalogue pas encore importés
  const existingNames = new Set(themes.map((t) => t.name.toLowerCase()))
  const notYetImported = THEME_CATALOG.filter(
    (c) => !existingNames.has(c.name.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des themes</h1>
          <p className="text-sm text-muted-foreground">
            {themes.length} theme{themes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Catalogue */}
          <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BookOpen className="mr-1 h-4 w-4" />
                Catalogue
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Catalogue de themes
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mb-4">
                Importez des themes pré-configurés avec leurs genres TMDb. Les thèmes déjà présents sont masqués.
              </p>
              {notYetImported.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  Tous les themes du catalogue ont deja ete importes.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {notYetImported.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-sm font-medium">{entry.name}</p>
                        {entry.genre_ids.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {entry.genre_ids.map((id) => (
                              <Badge key={id} variant="secondary" className="text-xs gap-0.5">
                                <Telescope className="h-2.5 w-2.5" />
                                {TMDB_GENRES[id] ?? id}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        disabled={importingCatalog === entry.name}
                        onClick={() => handleImportCatalog(entry)}
                      >
                        {importingCatalog === entry.name ? "..." : (
                          <><Plus className="mr-1 h-3 w-3" />Importer</>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Nouveau thème */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Nouveau theme
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter un theme</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="theme-name">Nom du theme</Label>
                  <Input
                    id="theme-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Science-fiction"
                    required
                  />
                </div>

                {/* Genres TMDb pour la découverte */}
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1">
                    <Telescope className="h-3.5 w-3.5" />
                    Genres TMDb (moteur Decouverte)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez les genres correspondants pour la recherche automatique par découverte.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 rounded-lg border p-3 max-h-40 overflow-y-auto">
                    {TMDB_GENRE_LIST.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={newGenreIds.includes(g.id)}
                          onChange={() => toggleGenre(g.id)}
                          className="rounded"
                        />
                        {g.label}
                      </label>
                    ))}
                  </div>
                  {newGenreIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {newGenreIds.map((id) => (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {TMDB_GENRES[id]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="theme-keywords">
                    Mots-clés TMDb (optionnel, séparés par des virgules)
                  </Label>
                  <Input
                    id="theme-keywords"
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    placeholder="sci-fi, space, future"
                  />
                  <p className="text-xs text-muted-foreground">
                    Utilisés par le moteur de recherche classique (mots-clés).
                  </p>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Creation..." : "Creer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="h-16 animate-pulse p-4" />
            </Card>
          ))}
        </div>
      ) : themes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Palette className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Aucun theme</p>
              <p className="text-sm text-muted-foreground">
                Commencez par creer des themes ou importez depuis le catalogue.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {themes.map((theme) => (
            <Card key={theme.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Palette className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{theme.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {theme.genre_ids?.length > 0 && theme.genre_ids.map((id) => (
                        <Badge key={id} variant="secondary" className="text-xs gap-0.5">
                          <Telescope className="h-2.5 w-2.5" />
                          {TMDB_GENRES[id] ?? id}
                        </Badge>
                      ))}
                      {theme.keywords?.map((kw) => (
                        <Badge key={kw} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isExcluded(theme) && (
                    <Badge variant="destructive" className="text-xs">
                      Exclu
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(theme)}
                  >
                    {theme.is_active ? "Desactiver" : "Activer"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(theme.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Supprimer</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
