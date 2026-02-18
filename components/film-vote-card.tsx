"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { tmdbPoster } from "@/lib/tmdb"

interface FilmVoteCardProps {
  id: string
  title: string
  posterPath: string | null
  releaseDate: string | null
  director: string | null
  voteCount: number
  hasVoted: boolean
  selectedId: string | null
  onVote: (id: string) => void
  onDetail?: () => void
  disabled?: boolean
}

export function FilmVoteCard({
  id,
  title,
  posterPath,
  releaseDate,
  director,
  voteCount,
  hasVoted,
  selectedId,
  onVote,
  onDetail,
  disabled,
}: FilmVoteCardProps) {
  const isSelected = selectedId === id
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        isSelected && "ring-2 ring-primary",
        hasVoted && !isSelected && "opacity-60"
      )}
    >
      <button
        type="button"
        className="block w-full cursor-pointer text-left"
        onClick={onDetail}
        aria-label={`Voir les details de ${title}`}
      >
        <div className="aspect-[2/3] w-full overflow-hidden bg-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tmdbPoster(posterPath, "w342")}
            alt={title}
            className="h-full w-full object-cover transition-transform hover:scale-105"
            loading="lazy"
          />
        </div>
      </button>
      <CardContent className="flex flex-col gap-2 p-3">
        <div className="min-h-[2.5rem]">
          <p className="line-clamp-2 text-sm font-medium leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground">
            {year}{director ? ` - ${director}` : ""}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {voteCount} {voteCount === 1 ? "vote" : "votes"}
          </span>
          <Button
            size="sm"
            variant={isSelected ? "default" : "outline"}
            disabled={disabled || (hasVoted && !isSelected)}
            onClick={(e) => {
              e.stopPropagation()
              onVote(id)
            }}
            className="h-7 text-xs"
          >
            {isSelected ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Vote
              </>
            ) : (
              "Voter"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
