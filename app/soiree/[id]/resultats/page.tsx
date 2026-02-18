import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { tmdbPoster } from "@/lib/tmdb"
import { Trophy, Film, Palette, Crown } from "lucide-react"
import type { SpSoireeTheme, SpSoireeFilm, SpTheme } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type SoireeThemeWithJoin = SpSoireeTheme & { theme: SpTheme }

export default async function ResultatsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: soiree } = await supabase
    .from("sp_soirees")
    .select("*")
    .eq("id", id)
    .single()

  if (!soiree) notFound()

  const { data: themes } = await supabase
    .from("sp_soiree_themes")
    .select("*, theme:sp_themes(*)")
    .eq("soiree_id", id)
    .order("vote_count", { ascending: false })

  const { data: films } = await supabase
    .from("sp_soiree_films")
    .select("*")
    .eq("soiree_id", id)
    .order("vote_count", { ascending: false })

  const winningTheme = (themes as SoireeThemeWithJoin[] | null)?.find(
    (t) => t.theme_id === soiree.winning_theme_id
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Trophy className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">Resultats de la soiree</h1>
        {soiree.event_date && (
          <p className="text-muted-foreground">
            {new Date(soiree.event_date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Winning film */}
      {soiree.winning_film_title && (
        <Card className="mb-8 border-primary/30">
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
            {soiree.winning_film_poster && (
              <div className="h-56 w-40 shrink-0 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tmdbPoster(soiree.winning_film_poster)}
                  alt={soiree.winning_film_title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <Badge className="w-fit gap-1 self-center sm:self-start">
                <Crown className="h-3 w-3" />
                Film gagnant
              </Badge>
              <h2 className="text-2xl font-bold">{soiree.winning_film_title}</h2>
              {winningTheme && (
                <p className="text-sm text-muted-foreground">
                  Theme : {winningTheme.theme?.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme votes results */}
      {themes && themes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Palette className="h-5 w-5 text-primary" />
            Votes des themes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(themes as SoireeThemeWithJoin[]).map((st, i) => (
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
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                      {i + 1}
                    </span>
                    <span className="font-medium">{st.theme?.name}</span>
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

      {/* Film votes results */}
      {films && films.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Film className="h-5 w-5 text-primary" />
            Votes des films
          </h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(films as SpSoireeFilm[]).map((f, i) => (
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
                </div>
                <CardContent className="p-3">
                  <p className="line-clamp-1 text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.vote_count} {f.vote_count === 1 ? "vote" : "votes"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="text-center">
        <Button asChild variant="outline">
          <Link href="/">Retour a l{"'"}accueil</Link>
        </Button>
      </div>
    </div>
  )
}
