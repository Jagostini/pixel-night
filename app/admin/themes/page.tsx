"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Trash2, Palette } from "lucide-react"
import type { SpTheme } from "@/lib/types"

export default function ThemesPage() {
  const [themes, setThemes] = useState<SpTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [newKeywords, setNewKeywords] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadThemes = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("sp_themes")
      .select("*")
      .order("created_at", { ascending: false })
    setThemes(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadThemes()
  }, [loadThemes])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Non connecte")
      setSaving(false)
      return
    }

    const keywords = newKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)

    const { error } = await supabase.from("sp_themes").insert({
      name: newName,
      keywords,
      created_by: user.id,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Theme cree !")
      setNewName("")
      setNewKeywords("")
      setDialogOpen(false)
      loadThemes()
    }
    setSaving(false)
  }

  async function handleToggleActive(theme: SpTheme) {
    const supabase = createClient()
    const { error } = await supabase
      .from("sp_themes")
      .update({ is_active: !theme.is_active })
      .eq("id", theme.id)

    if (error) {
      toast.error(error.message)
    } else {
      loadThemes()
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("sp_themes").delete().eq("id", id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Theme supprime")
      loadThemes()
    }
  }

  const isExcluded = (theme: SpTheme) =>
    theme.excluded_until && new Date(theme.excluded_until) > new Date()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des themes</h1>
          <p className="text-sm text-muted-foreground">
            {themes.length} theme{themes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" />
              Nouveau theme
            </Button>
          </DialogTrigger>
          <DialogContent>
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="theme-keywords">
                  Mots-cles TMDb (separes par des virgules)
                </Label>
                <Input
                  id="theme-keywords"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="sci-fi, space, future"
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Creation..." : "Creer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
                Commencez par creer des themes pour vos soirees.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {themes.map((theme) => (
            <Card key={theme.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Palette className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{theme.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {theme.keywords?.map((kw) => (
                        <Badge key={kw} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
