import { Badge } from "@/components/ui/badge"
import type { SoireePhase } from "@/lib/types"
import { Vote, Film, Trophy, Calendar } from "lucide-react"

const phaseConfig: Record<SoireePhase, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  theme_vote: { label: "Vote themes", icon: Vote, variant: "default" },
  film_vote: { label: "Vote films", icon: Film, variant: "default" },
  completed: { label: "Terminee", icon: Trophy, variant: "secondary" },
  planned: { label: "Planifiee", icon: Calendar, variant: "outline" },
}

interface SoireeStatusProps {
  phase: SoireePhase
}

export function SoireeStatus({ phase }: SoireeStatusProps) {
  const config = phaseConfig[phase]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
