"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface CountdownTimerProps {
  endsAt: string
  onExpired?: () => void
}

export function CountdownTimer({ endsAt, onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("")
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    function update() {
      const now = Date.now()
      const end = new Date(endsAt).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft("Termine")
        setExpired(true)
        onExpired?.()
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeLeft(`${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`)
      } else {
        setTimeLeft(`${minutes}m ${String(seconds).padStart(2, "0")}s`)
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [endsAt, onExpired])

  if (expired) return null

  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
      <Clock className="h-4 w-4 text-primary" />
      <span>Temps restant : <strong className="font-mono">{timeLeft}</strong></span>
    </div>
  )
}
