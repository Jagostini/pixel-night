"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Settings, Key, CheckCircle2, XCircle, ExternalLink } from "lucide-react"

export default function ParametresPage() {
  const [tmdbToken, setTmdbToken] = useState("")
  const [tmdbStatus, setTmdbStatus] = useState<"unknown" | "valid" | "invalid">("unknown")
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load current status on mount
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
