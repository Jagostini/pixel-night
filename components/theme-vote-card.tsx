"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Palette, Check } from "lucide-react"

interface ThemeVoteCardProps {
  id: string
  name: string
  voteCount: number
  hasVoted: boolean
  selectedId: string | null
  onVote: (id: string) => void
  disabled?: boolean
}

export function ThemeVoteCard({
  id,
  name,
  voteCount,
  hasVoted,
  selectedId,
  onVote,
  disabled,
}: ThemeVoteCardProps) {
  const isSelected = selectedId === id

  return (
    <Card
      className={cn(
        "transition-all",
        isSelected && "ring-2 ring-primary",
        hasVoted && !isSelected && "opacity-60"
      )}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">
              {voteCount} {voteCount === 1 ? "vote" : "votes"}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={isSelected ? "default" : "outline"}
          disabled={disabled || (hasVoted && !isSelected)}
          onClick={() => onVote(id)}
        >
          {isSelected ? (
            <>
              <Check className="mr-1 h-4 w-4" />
              Vote
            </>
          ) : (
            "Voter"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
