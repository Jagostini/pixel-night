"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Clapperboard } from "lucide-react"

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function CreateSalleForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [saving, setSaving] = useState(false)

  function handleNameChange(value: string) {
    setName(value)
    setSlug(toSlug(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      toast.error("Renseignez le nom et le code de votre cinema")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Non connecte")
      setSaving(false)
      return
    }

    // Créer le cinéma (sp_salles)
    const { data: salle, error } = await supabase.from("sp_salles").insert({
      name: name.trim(),
      slug: slug.trim(),
      created_by: user.id,
    }).select().single()

    if (error || !salle) {
      toast.error(error?.message ?? "Erreur lors de la creation")
      setSaving(false)
      return
    }

    // Créer la première salle par défaut
    await supabase.from("sp_salle_rooms").insert({
      salle_id: salle.id,
      name: null,
      room_order: 1,
    })

    toast.success("Cinema cree !")
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Clapperboard className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bienvenue !</h1>
          <p className="text-sm text-muted-foreground">
            Configurez votre cinema pour commencer a organiser vos soirees.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Creer mon Cinema</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="salle-name">Nom de votre cinema</Label>
              <Input
                id="salle-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Cine des Potes"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="salle-slug">Code d&apos;accès participants</Label>
              <Input
                id="salle-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="cine-des-potes"
                pattern="[a-z0-9-]+"
                required
              />
              <p className="text-xs text-muted-foreground">
                Vos invites accederont via :{" "}
                <span className="font-mono">/s/{slug || "votre-code"}</span>
              </p>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Creation..." : "Creer mon cinema"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
