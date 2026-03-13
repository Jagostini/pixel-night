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
      toast.error("Renseignez le nom et le code de la salle")
      return
    }
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

    const { error } = await supabase.from("sp_salles").insert({
      name: name.trim(),
      slug: slug.trim(),
      created_by: user.id,
    })

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    toast.success("Salle creee !")
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
            Creez votre Salle pour commencer a organiser vos soirees cine.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Creer ma Salle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="salle-name">Nom de la salle</Label>
              <Input
                id="salle-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Cine des Potes"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="salle-slug">Code / URL de partage</Label>
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
              {saving ? "Creation..." : "Creer ma salle"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
