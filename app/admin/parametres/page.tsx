"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Settings,
  Key,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clapperboard,
  Copy,
} from "lucide-react"

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export default function ParametresPage() {
  const [tmdbToken, setTmdbToken] = useState("")
  const [tmdbStatus, setTmdbStatus] = useState<"unknown" | "valid" | "invalid">("unknown")
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Salle state
  const [salleId, setSalleId] = useState<string | null>(null)
  const [salleName, setSalleName] = useState("")
  const [salleSlug, setSalleSlug] = useState("")
  const [salleOriginalName, setSalleOriginalName] = useState("")
  const [salleOriginalSlug, setSalleOriginalSlug] = useState("")
  const [savingSalle, setSavingSalle] = useState(false)
  const [salleUrl, setSalleUrl] = useState("")

  // Load salle on mount
  useEffect(() => {
    async function fetchSalle() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("sp_salles")
        .select("*")
        .eq("created_by", user.id)
        .maybeSingle()
      if (data) {
        setSalleId(data.id)
        setSalleName(data.name)
        setSalleSlug(data.slug)
        setSalleOriginalName(data.name)
        setSalleOriginalSlug(data.slug)
        setSalleUrl(`${window.location.origin}/s/${data.slug}`)
      }
    }
    fetchSalle()
  }, [])

  // Load current TMDb status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/tmdb/status")
        const json = await res.json()
        setTmdbStatus(json.configured ? "valid" : "invalid")
      } catch {
        setTmdbStatus("unknown")
      }
    }
    checkStatus()
  }, [])

  function handleSalleNameChange(value: string) {
    setSalleName(value)
    setSalleSlug(toSlug(value))
  }

  async function handleSaveSalle() {
    if (!salleName.trim() || !salleSlug.trim()) {
      toast.error("Renseignez le nom et le code")
      return
    }
    setSavingSalle(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Non connecte")
      setSavingSalle(false)
      return
    }

    const { error } = await supabase
      .from("sp_salles")
      .update({ name: salleName.trim(), slug: salleSlug.trim() })
      .eq("created_by", user.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Salle mise a jour !")
      setSalleOriginalName(salleName.trim())
      setSalleOriginalSlug(salleSlug.trim())
      setSalleUrl(`${window.location.origin}/s/${salleSlug.trim()}`)
      if (salleId) {
        // update local salleId display is unchanged
      }
    }
    setSavingSalle(false)
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(salleUrl)
      toast.success("Lien copie !")
    } catch {
      toast.error("Impossible de copier")
    }
  }

  async function handleTestToken() {
    if (!tmdbToken.trim()) {
      toast.error("Entrez un token TMDb")
      return
    }
    setTesting(true)
    try {
      const res = await fetch("/api/tmdb/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tmdbToken }),
      })
      const json = await res.json()
      if (json.valid) {
        toast.success("Token TMDb valide !")
        setTmdbStatus("valid")
      } else {
        toast.error("Token TMDb invalide")
        setTmdbStatus("invalid")
      }
    } catch {
      toast.error("Erreur lors du test")
    } finally {
      setTesting(false)
    }
  }

  async function handleSaveToken() {
    if (!tmdbToken.trim()) {
      toast.error("Entrez un token TMDb")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/tmdb/save-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tmdbToken }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Token TMDb sauvegarde !")
        setTmdbStatus("valid")
        setTmdbToken("")
      } else {
        toast.error(json.error || "Erreur lors de la sauvegarde")
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const salleChanged =
    salleName !== salleOriginalName || salleSlug !== salleOriginalSlug

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Settings className="h-6 w-6 text-primary" />
          Parametres
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurez les services externes et les options de l{"'"}application.
        </p>
      </div>

      {/* Ma Salle */}
      {salleId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clapperboard className="h-4 w-4" />
              Ma Salle
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="salle-name">Nom de la salle</Label>
              <Input
                id="salle-name"
                value={salleName}
                onChange={(e) => handleSalleNameChange(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="salle-slug">Code / slug</Label>
              <Input
                id="salle-slug"
                value={salleSlug}
                onChange={(e) => setSalleSlug(e.target.value)}
                pattern="[a-z0-9-]+"
              />
            </div>
            {salleUrl && (
              <div className="flex flex-col gap-2">
                <Label>URL de partage</Label>
                <div className="flex items-center gap-2">
                  <Input value={salleUrl} readOnly className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copier le lien</span>
                  </Button>
                </div>
              </div>
            )}
            <div>
              <Button
                size="sm"
                onClick={handleSaveSalle}
                disabled={savingSalle || !salleChanged}
              >
                {savingSalle ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TMDb API Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" />
              API TMDb (The Movie Database)
            </CardTitle>
            {tmdbStatus === "valid" && (
              <Badge className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                Configure
              </Badge>
            )}
            {tmdbStatus === "invalid" && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Non configure
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Le token API TMDb est necessaire pour rechercher et recuperer les
            films. Obtenez-en un gratuitement sur{" "}
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline underline-offset-4"
            >
              themoviedb.org
              <ExternalLink className="h-3 w-3" />
            </a>
            .
          </p>
          <p className="text-xs text-muted-foreground">
            Copiez le {"\""}API Read Access Token{"\""} (le long token Bearer, pas la courte API Key).
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tmdb-token">API Read Access Token</Label>
            <Input
              id="tmdb-token"
              type="password"
              value={tmdbToken}
              onChange={(e) => setTmdbToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiJ9..."
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestToken}
              disabled={testing || !tmdbToken.trim()}
            >
              {testing ? "Test en cours..." : "Tester le token"}
            </Button>
            <Button
              size="sm"
              onClick={handleSaveToken}
              disabled={saving || !tmdbToken.trim()}
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          D{"'"}autres parametres seront ajoutes dans les prochaines versions
          (notifications, personnalisation, etc.).
        </CardContent>
      </Card>
    </div>
  )
}
