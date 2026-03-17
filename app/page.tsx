"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Clapperboard } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const router = useRouter()
  const [slug, setSlug] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = slug.trim()
    if (code) router.push(`/s/${code}`)
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Clapperboard className="h-8 w-8 text-primary" />
      </div>

      <h1 className="mb-2 text-4xl font-bold tracking-tight">Pixel Night</h1>
      <p className="mb-8 max-w-sm text-pretty text-muted-foreground">
        Votez pour un theme, puis pour un film. Rejoignez le cinema de votre
        organisateur avec son code.
      </p>

      <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Code du cinema (ex: cine-des-potes)"
          className="flex-1"
          required
        />
        <Button type="submit">
          <Sparkles className="mr-1 h-4 w-4" />
          Rejoindre
        </Button>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        Organisateur ?{" "}
        <Link href="/admin" className="text-primary underline underline-offset-4">
          Connectez-vous
        </Link>
      </p>
    </div>
  )
}
