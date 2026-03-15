"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { tmdbPoster } from "@/lib/tmdb"
import { toast } from "sonner"
import { Search, Plus, Check, Film } from "lucide-react"
import type { SpSoireeFilmProposal } from "@/lib/types"

interface TmdbSearchResult {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  overview: string
}

interface FilmProposalSearchProps {
  soireeId: string
  voterId: string
  /** Max proposals per voter */
  maxProposals?: number
}

const MAX_PROPOSALS = 3

/**
 * Search component allowing a guest to find and propose films via the TMDb API.
 * - Debounced search (500ms)
 * - Shows poster, title, year for each result
 * - Limits to MAX_PROPOSALS per voter (client-side + server-side)
 * - Displays all proposals already submitted by all guests
 */
export function FilmProposalSearch({
  soireeId,
  voterId,
  maxProposals = MAX_PROPOSALS,
}: FilmProposalSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TmdbSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [searchDone, setSearchDone] = useState(false)
  const [proposals, setProposals] = useState<SpSoireeFilmProposal[]>([])
  const [myProposalIds, setMyProposalIds] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadProposals = useCallback(async () => {
    const res = await fetch(`/api/soirees/${soireeId}/proposals`)
    if (res.ok) {
      const data: SpSoireeFilmProposal[] = await res.json()
      setProposals(data)
      setMyProposalIds(
        new Set(
          data.filter((p) => p.voter_id === voterId).map((p) => p.tmdb_id)
        )
      )
    }
  }, [soireeId, voterId])

  useEffect(() => {
    loadProposals()
  }, [loadProposals])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      setSearchDone(false)
      setSearchError(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setSearchError(false)
      setSearchDone(false)
      try {
        const res = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(query.trim())}`
        )
        if (res.ok) {
          const data = await res.json()
          setResults(data.results?.slice(0, 8) ?? [])
        } else {
          setResults([])
          setSearchError(true)
        }
      } catch {
        setResults([])
        setSearchError(true)
      } finally {
        setSearching(false)
        setSearchDone(true)
      }
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const myProposalCount = myProposalIds.size
  const canPropose = myProposalCount < maxProposals

  async function handlePropose(movie: TmdbSearchResult) {
    if (!canPropose || myProposalIds.has(movie.id)) return
    setSubmitting(movie.id)
    try {
      const res = await fetch(`/api/soirees/${soireeId}/propose-film`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_id: movie.id, voter_id: voterId }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? "Erreur lors de la proposition")
        return
      }
      toast.success(`"${movie.title}" propose !`)
      setMyProposalIds((prev) => new Set([...prev, movie.id]))
      loadProposals()
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search box */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Proposer un film</h3>
          <Badge variant={canPropose ? "secondary" : "outline"}>
            {myProposalCount} / {maxProposals} propositions
          </Badge>
        </div>

        {canPropose ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Rechercher un film..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Vous avez atteint la limite de {maxProposals} propositions.
          </p>
        )}

        {/* Search results */}
        {searching && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        )}

        {!searching && searchError && (
          <p className="text-sm text-destructive">
            Erreur lors de la recherche. Veuillez réessayer.
          </p>
        )}

        {!searching && !searchError && searchDone && results.length === 0 && query.trim().length >= 2 && (
          <p className="text-sm text-muted-foreground">
            Aucun résultat pour &quot;{query.trim()}&quot;.
          </p>
        )}

        {!searching && results.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border p-2">
            {results.map((movie) => {
              const alreadyProposed = myProposalIds.has(movie.id)
              const alreadyByOther = proposals.some(
                (p) => p.tmdb_id === movie.id && p.voter_id !== voterId
              )
              return (
                <div
                  key={movie.id}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50"
                >
                  <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tmdbPoster(movie.poster_path, "w342")}
                      alt={movie.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{movie.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {movie.release_date?.slice(0, 4) ?? "—"}
                      {alreadyByOther && " · Deja propose"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyProposed ? "secondary" : "default"}
                    disabled={
                      alreadyProposed ||
                      !canPropose ||
                      submitting === movie.id
                    }
                    onClick={() => handlePropose(movie)}
                  >
                    {alreadyProposed ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* All proposals */}
      {proposals.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Film className="h-4 w-4" />
            Films proposes ({proposals.length})
          </h3>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {proposals.map((p) => (
              <div key={p.id} className="flex flex-col gap-1">
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tmdbPoster(p.poster_path, "w342")}
                    alt={p.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs font-medium line-clamp-2">{p.title}</p>
                {p.voter_id === voterId && (
                  <Badge variant="outline" className="w-fit text-xs">
                    Votre proposition
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
