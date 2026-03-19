import { describe, it, expect } from "vitest"

/**
 * Unit tests for start-proposals route logic.
 * Tests the proposal deadline calculation with nullable duration.
 */

// Mirrors proposalEndsAt logic in start-proposals/route.ts
function computeProposalEndsAt(durationMinutes: number | null, now: number): string | null {
  if (!durationMinutes) return null
  return new Date(now + durationMinutes * 60 * 1000).toISOString()
}

describe("start-proposals: deadline computation", () => {
  const NOW = new Date("2026-01-01T12:00:00Z").getTime()

  it("returns null when duration is null (manual close)", () => {
    expect(computeProposalEndsAt(null, NOW)).toBeNull()
  })

  it("returns null when duration is 0 (treated as falsy)", () => {
    expect(computeProposalEndsAt(0, NOW)).toBeNull()
  })

  it("computes correct deadline for 60 minutes", () => {
    const result = computeProposalEndsAt(60, NOW)
    expect(result).toBe("2026-01-01T13:00:00.000Z")
  })

  it("computes correct deadline for 1440 minutes (1 day)", () => {
    const result = computeProposalEndsAt(1440, NOW)
    expect(result).toBe("2026-01-02T12:00:00.000Z")
  })

  it("deadline is always in the future relative to now", () => {
    const result = computeProposalEndsAt(30, NOW)
    expect(result).not.toBeNull()
    expect(new Date(result!).getTime()).toBeGreaterThan(NOW)
  })
})
