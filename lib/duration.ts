/**
 * Parse a human-readable duration string into minutes.
 *
 * Supported formats:
 *   "60"        → 60 min
 *   "1h"        → 60 min
 *   "1h30"      → 90 min
 *   "1h 30"     → 90 min
 *   "30min"     → 30 min
 *   "2 jours"   → 2880 min
 *   "2j"        → 2880 min
 *   "1j12h"     → 1560 min
 *   "2j 3h 15min" → 2955 min
 *
 * Returns null if the string cannot be parsed.
 */
export function parseDurationToMinutes(input: string): number | null {
  const s = input.trim().toLowerCase()
  if (!s) return null

  // Pure integer → treat as minutes
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10)
    return n > 0 ? n : null
  }

  let total = 0
  let remaining = s

  // Days: 2j, 2jour, 2jours
  const dayMatch = remaining.match(/(\d+)\s*j(?:ours?)?/)
  if (dayMatch) {
    total += parseInt(dayMatch[1], 10) * 1440
    remaining = remaining.replace(dayMatch[0], "").trim()
  }

  // Hours, optionally followed by bare minutes ("1h30" or "1h 30")
  const hourMatch = remaining.match(/(\d+)\s*h(?:eures?)?(?:\s*(\d+))?/)
  if (hourMatch) {
    total += parseInt(hourMatch[1], 10) * 60
    if (hourMatch[2]) total += parseInt(hourMatch[2], 10)
    remaining = remaining.replace(hourMatch[0], "").trim()
  }

  // Explicit minutes (only when not already captured as bare digits after hours)
  if (!hourMatch?.[2]) {
    const minMatch = remaining.match(/(\d+)\s*min(?:utes?)?/)
    if (minMatch) total += parseInt(minMatch[1], 10)
  }

  return total > 0 ? total : null
}

/**
 * Format a number of minutes as a short human-readable string.
 *
 * Examples:
 *   45        → "45min"
 *   60        → "1h"
 *   90        → "1h30"
 *   1440      → "1 jour"
 *   2880      → "2 jours"
 *   1500      → "1 jour 1h"
 */
export function formatDurationFromMinutes(minutes: number): string {
  if (minutes <= 0) return "0min"

  const days = Math.floor(minutes / 1440)
  const rem = minutes % 1440
  const hours = Math.floor(rem / 60)
  const mins = rem % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days} jour${days > 1 ? "s" : ""}`)
  if (hours > 0) parts.push(mins > 0 ? `${hours}h${mins}` : `${hours}h`)
  else if (mins > 0) parts.push(`${mins}min`)

  return parts.join(" ")
}
